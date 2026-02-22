import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../components/AuthContext";
import { useApi } from "../../hooks/useApi";
import { DealComparison } from "../../components/DealComparison";
import { SkeletonList } from "../../components/SkeletonCard";
import { useCachedFetch } from "../../hooks/useOfflineCache";
import type { AnalysisSummary } from "@dealscope/api-client";
import type { AnalysisResults } from "@dealscope/core";

interface LoadedDeal {
  id: string;
  address: string;
  askingPrice: number;
  units: number;
  results: AnalysisResults;
}

export default function CompareScreen() {
  const { isAuthenticated } = useAuth();
  const api = useApi();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadedDeals, setLoadedDeals] = useState<Map<string, LoadedDeal>>(new Map());
  const [loadingDeals, setLoadingDeals] = useState(false);

  const fetcher = useCallback(
    () => (isAuthenticated ? api.listAnalyses() : Promise.resolve([])),
    [isAuthenticated, api]
  );

  const { data: summaries, loading, isOffline } = useCachedFetch(
    "compare_summaries",
    fetcher,
    [isAuthenticated]
  );

  const summaryList = summaries ?? [];

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleCompare = useCallback(async () => {
    setLoadingDeals(true);
    try {
      const newLoaded = new Map(loadedDeals);
      const toLoad = [...selected].filter((id) => !newLoaded.has(id));

      await Promise.all(
        toLoad.map(async (id) => {
          const full = await api.getAnalysis(id);
          newLoaded.set(id, {
            id: full.id,
            address:
              summaryList.find((s) => s.id === id)?.address ?? "Unknown",
            askingPrice:
              summaryList.find((s) => s.id === id)?.askingPrice ?? 0,
            units: summaryList.find((s) => s.id === id)?.units ?? 0,
            results: full.results,
          });
        })
      );

      setLoadedDeals(newLoaded);
    } catch {
      // silent fail
    } finally {
      setLoadingDeals(false);
    }
  }, [selected, loadedDeals, summaryList, api]);

  const comparisonDeals = [...selected]
    .map((id) => loadedDeals.get(id))
    .filter((d): d is LoadedDeal => d != null);

  const showComparison = comparisonDeals.length >= 2;

  if (!isAuthenticated) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.title}>Compare Deals</Text>
        <Text style={styles.subtitle}>Sign in to compare your saved analyses</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Compare Deals</Text>
        <Text style={styles.subtitle}>Loading your deals...</Text>
        <SkeletonList count={3} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Compare Deals</Text>
      <Text style={styles.subtitle}>Select 2-4 deals to compare side by side</Text>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>Offline — showing cached data</Text>
        </View>
      )}

      {summaryList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Saved Deals</Text>
          <Text style={styles.emptyText}>
            Save analyses from the results screen to compare them here.
          </Text>
        </View>
      ) : (
        <>
          {/* Deal Selection */}
          <View style={styles.dealList}>
            {summaryList.map((deal) => {
              const isSelected = selected.has(deal.id);
              return (
                <Pressable
                  key={deal.id}
                  style={[styles.dealCard, isSelected && styles.dealCardSelected]}
                  onPress={() => toggleSelect(deal.id)}
                >
                  <View style={styles.checkbox}>
                    {isSelected && <View style={styles.checkboxInner} />}
                  </View>
                  <View style={styles.dealInfo}>
                    <Text style={styles.dealAddress} numberOfLines={1}>
                      {deal.address}
                    </Text>
                    <Text style={styles.dealMeta}>
                      ${Math.round(deal.askingPrice).toLocaleString()} | {deal.units} units |{" "}
                      Cap: {deal.capRate.toFixed(1)}%
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Compare Button */}
          {selected.size >= 2 && (
            <Pressable
              style={[styles.compareBtn, loadingDeals && styles.compareBtnDisabled]}
              onPress={handleCompare}
              disabled={loadingDeals}
            >
              {loadingDeals ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.compareBtnText}>
                  Compare {selected.size} Deals
                </Text>
              )}
            </Pressable>
          )}

          {selected.size === 1 && (
            <Text style={styles.selectHint}>Select at least 1 more deal</Text>
          )}

          {/* Comparison Table */}
          {showComparison && (
            <View style={styles.comparisonSection}>
              <DealComparison deals={comparisonDeals} />
            </View>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 20 },
  centeredContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#003366", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    marginTop: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#003366", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20 },
  dealList: { gap: 8, marginBottom: 16 },
  dealCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  dealCardSelected: { borderColor: "#003366", backgroundColor: "#f0f5ff" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#003366",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#003366",
  },
  dealInfo: { flex: 1 },
  dealAddress: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 4 },
  dealMeta: { fontSize: 12, color: "#666" },
  compareBtn: {
    backgroundColor: "#003366",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  compareBtnDisabled: { opacity: 0.6 },
  compareBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  selectHint: { fontSize: 12, color: "#999", textAlign: "center", marginVertical: 8 },
  comparisonSection: { marginTop: 8, backgroundColor: "#fff", borderRadius: 12, padding: 12 },
  offlineBanner: {
    backgroundColor: "#fff3e0",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  offlineBannerText: { fontSize: 12, color: "#e65100", fontWeight: "600" },
});
