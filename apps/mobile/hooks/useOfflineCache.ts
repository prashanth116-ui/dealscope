import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "dealscope_cache_";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function useOfflineCache<T>(key: string) {
  const cacheKey = `${CACHE_PREFIX}${key}`;

  const getCached = useCallback(async (): Promise<T | null> => {
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.timestamp > CACHE_TTL) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }, [cacheKey]);

  const setCache = useCallback(
    async (data: T): Promise<void> => {
      try {
        const entry: CacheEntry<T> = { data, timestamp: Date.now() };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      } catch {
        // Silent fail — cache is best-effort
      }
    },
    [cacheKey]
  );

  const clearCache = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(cacheKey);
    } catch {
      // Silent fail
    }
  }, [cacheKey]);

  return { getCached, setCache, clearCache };
}

/**
 * Hook that fetches data with offline cache fallback.
 * On mount: try network → cache result. If network fails → return cached data.
 */
export function useCachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const { getCached, setCache } = useOfflineCache<T>(key);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsOffline(false);
    try {
      const result = await fetcher();
      setData(result);
      await setCache(result);
    } catch (err) {
      // Network failed — try cache
      const cached = await getCached();
      if (cached) {
        setData(cached);
        setIsOffline(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    } finally {
      setLoading(false);
    }
  }, [fetcher, getCached, setCache]);

  useEffect(() => {
    refresh();
  }, deps);

  return { data, loading, error, isOffline, refresh };
}

/**
 * Clear all DealScope cache entries.
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch {
    // Silent fail
  }
}
