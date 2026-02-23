"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { AnalysisCard } from "@/components/analysis-card";
import { DeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, RefreshCw } from "lucide-react";
import type { AnalysisSummary, DealStatus } from "@dealscope/api-client";

const STATUS_FILTERS: (DealStatus | "All")[] = [
  "All",
  "Analyzing",
  "Offered",
  "Under Contract",
  "Passed",
];

type SortKey = "date" | "capRate" | "cashOnCash";

export default function DashboardPage() {
  const { user } = useAuth();
  const api = useApi();
  const router = useRouter();

  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DealStatus | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAnalyses = useCallback(async () => {
    try {
      const data = await api.listAnalyses();
      setAnalyses(data);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const prev = analyses;
    setAnalyses((list) => list.filter((a) => a.id !== deleteId));
    try {
      await api.deleteAnalysis(deleteId);
    } catch {
      setAnalyses(prev);
    }
    setDeleteId(null);
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchAnalyses();
  };

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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary">
            Welcome{user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {analyses.length} deal{analyses.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => router.push("/analysis/new")}>
            <PlusCircle className="h-4 w-4 mr-1" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            className="rounded-full text-xs"
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Sort Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        {(["date", "capRate", "cashOnCash"] as SortKey[]).map((key) => (
          <button
            key={key}
            className={`text-xs px-2 py-1 rounded ${
              sortKey === key
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setSortKey(key)}
          >
            {key === "date" ? "Date" : key === "capRate" ? "Cap Rate" : "CoC"}
          </button>
        ))}
      </div>

      {/* Deal Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl bg-white border p-12 text-center mt-10">
          <h2 className="text-lg font-bold text-primary mb-2">No Analyses Yet</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Start your first deal analysis to see it here.
          </p>
          <Button onClick={() => router.push("/analysis/new")}>
            <PlusCircle className="h-4 w-4 mr-1" />
            New Analysis
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((analysis) => (
            <AnalysisCard
              key={analysis.id}
              {...analysis}
              onPress={() => router.push(`/analysis/results?loadId=${analysis.id}`)}
              onDelete={() => setDeleteId(analysis.id)}
            />
          ))}
        </div>
      )}

      <DeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
