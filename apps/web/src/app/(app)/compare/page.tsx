"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { DealComparison } from "@/components/deal-comparison";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import type { AnalysisSummary } from "@dealscope/api-client";
import type { AnalysisResults } from "@dealscope/core";

interface LoadedDeal {
  id: string;
  address: string;
  askingPrice: number;
  units: number;
  results: AnalysisResults;
}

export default function ComparePage() {
  const { isAuthenticated } = useAuth();
  const api = useApi();

  const [summaries, setSummaries] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadedDeals, setLoadedDeals] = useState<Map<string, LoadedDeal>>(new Map());
  const [loadingDeals, setLoadingDeals] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await api.listAnalyses();
        setSummaries(data);
      } catch {}
      setLoading(false);
    })();
  }, [isAuthenticated, api]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const handleCompare = async () => {
    setLoadingDeals(true);
    try {
      const newLoaded = new Map(loadedDeals);
      const toLoad = [...selected].filter((id) => !newLoaded.has(id));
      await Promise.all(
        toLoad.map(async (id) => {
          const full = await api.getAnalysis(id);
          const summary = summaries.find((s) => s.id === id);
          newLoaded.set(id, {
            id: full.id,
            address: summary?.address ?? "Unknown",
            askingPrice: summary?.askingPrice ?? 0,
            units: summary?.units ?? 0,
            results: full.results,
          });
        })
      );
      setLoadedDeals(newLoaded);
    } catch {}
    setLoadingDeals(false);
  };

  const comparisonDeals = [...selected]
    .map((id) => loadedDeals.get(id))
    .filter((d): d is LoadedDeal => d != null);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-xl font-bold text-primary mb-2">Compare Deals</h1>
        <p className="text-muted-foreground">Sign in to compare your saved analyses</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-primary mb-1">Compare Deals</h1>
      <p className="text-sm text-muted-foreground mb-6">Select 2-4 deals to compare side by side</p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : summaries.length === 0 ? (
        <div className="rounded-xl bg-white border p-12 text-center mt-10">
          <h2 className="text-lg font-bold text-primary mb-2">No Saved Deals</h2>
          <p className="text-sm text-muted-foreground">Save analyses from the results screen to compare them here.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {summaries.map((deal) => {
              const isSelected = selected.has(deal.id);
              return (
                <div
                  key={deal.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                    isSelected ? "border-primary bg-primary/5" : "border-transparent bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => toggleSelect(deal.id)}
                >
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(deal.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{deal.address}</div>
                    <div className="text-xs text-muted-foreground">
                      ${Math.round(deal.askingPrice).toLocaleString()} | {deal.units} units | Cap: {deal.capRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selected.size >= 2 && (
            <Button className="w-full mb-4" disabled={loadingDeals} onClick={handleCompare}>
              {loadingDeals ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Compare {selected.size} Deals
            </Button>
          )}

          {selected.size === 1 && (
            <p className="text-xs text-center text-muted-foreground mb-4">Select at least 1 more deal</p>
          )}

          {comparisonDeals.length >= 2 && (
            <div className="bg-white rounded-xl border p-4">
              <DealComparison deals={comparisonDeals} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
