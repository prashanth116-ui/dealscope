import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../components/AuthContext";
import { useApi } from "../../hooks/useApi";
import { AnalysisCard } from "../../components/AnalysisCard";
import { SwipeableRow } from "../../components/SwipeableRow";
import { SkeletonList } from "../../components/SkeletonCard";
import { useCachedFetch } from "../../hooks/useOfflineCache";
import type { AnalysisSummary, DealStatus } from "@dealscope/api-client";

const STATUS_FILTERS: (DealStatus | "All")[] = [
  "All",
  "Analyzing",
  "Offered",
  "Under Contract",
  "Passed",
];

type SortKey = "date" | "capRate" | "cashOnCash";

export default function DashboardScreen() {
  const { isAuthenticated, user, signOut } = useAuth();
  const api = useApi();
  const router = useRouter();

  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DealStatus | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("date");

  const fetcher = useCallback(
    () => (isAuthenticated ? api.listAnalyses() : Promise.resolve([])),
    [isAuthenticated, api]
  );

  const {
    data: cachedAnalyses,
    loading,
    isOffline,
    refresh,
  } = useCachedFetch("analyses", fetcher, [isAuthenticated]);

  useEffect(() => {
    if (cachedAnalyses) setAnalyses(cachedAnalyses);
  }, [cachedAnalyses]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refresh().finally(() => setRefreshing(false));
  }, [refresh]);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert("Delete Analysis", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Optimistic: remove from UI immediately
            const prev = analyses;
            setAnalyses((list) => list.filter((a) => a.id !== id));
            try {
              await api.deleteAnalysis(id);
            } catch {
              // Rollback on failure
              setAnalyses(prev);
              Alert.alert("Error", "Failed to delete");
            }
          },
        },
      ]);
    },
    [api, analyses]
  );

  // Filter + sort
  const filtered =
    statusFilter === "All"
      ? analyses
      : analyses.filter((a) => a.status === statusFilter);

  const sorted = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case "capRate":
        return b.capRate - a.capRate;
      case "cashOnCash":
        return b.cashOnCash - a.cashOnCash;
      case "date":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Not authenticated — show auth prompt
  if (!isAuthenticated) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.logo}>DealScope</Text>
        <Text style={styles.subtitle}>Real Estate Analysis</Text>
        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </Pressable>
        </Link>
        <Link href="/(auth)/signup" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </Pressable>
        </Link>

        {/* Allow unauthenticated analysis */}
        <Link href="/analysis/new" asChild>
          <Pressable style={styles.linkButton}>
            <Text style={styles.linkText}>Try without signing in</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Welcome</Text>
            <Text style={styles.dealCount}>Loading...</Text>
          </View>
        </View>
        <SkeletonList count={4} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>Offline — showing cached data</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>
            Welcome{user?.name ? `, ${user.name}` : ""}
          </Text>
          <Text style={styles.dealCount}>
            {analyses.length} deal{analyses.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <Pressable onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      {/* Status Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
      >
        {STATUS_FILTERS.map((status) => (
          <Pressable
            key={status}
            style={[styles.chip, statusFilter === status && styles.chipActive]}
            onPress={() => setStatusFilter(status)}
          >
            <Text
              style={[styles.chipText, statusFilter === status && styles.chipTextActive]}
            >
              {status}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Sort Toggle */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {(["date", "capRate", "cashOnCash"] as SortKey[]).map((key) => (
          <Pressable
            key={key}
            style={[styles.sortChip, sortKey === key && styles.sortChipActive]}
            onPress={() => setSortKey(key)}
          >
            <Text style={[styles.sortChipText, sortKey === key && styles.sortChipTextActive]}>
              {key === "date" ? "Date" : key === "capRate" ? "Cap Rate" : "CoC"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Deal Cards */}
      {sorted.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Analyses Yet</Text>
          <Text style={styles.emptyText}>
            Start your first deal analysis to see it here.
          </Text>
          <Link href="/analysis/new" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>+ New Analysis</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        sorted.map((analysis) => (
          <SwipeableRow key={analysis.id} onDelete={() => handleDelete(analysis.id)}>
            <AnalysisCard
              {...analysis}
              onPress={() => {
                router.push(`/analysis/results?loadId=${analysis.id}`);
              }}
            />
          </SwipeableRow>
        ))
      )}

      {/* New Analysis FAB */}
      {sorted.length > 0 && (
        <Link href="/analysis/new" asChild>
          <Pressable style={styles.fab}>
            <Text style={styles.fabText}>+ New Analysis</Text>
          </Pressable>
        </Link>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    padding: 24,
  },
  logo: { fontSize: 36, fontWeight: "800", color: "#003366", marginBottom: 4 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 40 },
  primaryButton: {
    backgroundColor: "#003366",
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#003366",
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  secondaryButtonText: { color: "#003366", fontSize: 16, fontWeight: "600" },
  linkButton: { marginTop: 16 },
  linkText: { color: "#666", fontSize: 14, textDecorationLine: "underline" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  greeting: { fontSize: 20, fontWeight: "700", color: "#003366" },
  dealCount: { fontSize: 13, color: "#666", marginTop: 2 },
  signOutText: { fontSize: 13, color: "#c00" },
  filterRow: { marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#003366", borderColor: "#003366" },
  chipText: { fontSize: 12, color: "#666" },
  chipTextActive: { color: "#fff" },
  sortRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  sortLabel: { fontSize: 12, color: "#666", marginRight: 8 },
  sortChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginRight: 6 },
  sortChipActive: { backgroundColor: "#e8f0fe" },
  sortChipText: { fontSize: 11, color: "#999" },
  sortChipTextActive: { color: "#003366", fontWeight: "600" },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    marginTop: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#003366", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24, lineHeight: 20 },
  fab: {
    backgroundColor: "#003366",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  fabText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  offlineBanner: {
    backgroundColor: "#fff3e0",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  offlineBannerText: { fontSize: 12, color: "#e65100", fontWeight: "600" },
});
