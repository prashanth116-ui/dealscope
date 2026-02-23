"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWizard } from "@/lib/wizard-context";
import { useApi } from "@/lib/use-api";
import { useAuth } from "@/lib/auth-context";
import { StepIndicator } from "@/components/step-indicator";
import { MetricCard } from "@/components/metric-card";
import { RangeCards } from "@/components/range-cards";
import { ProjectionTable } from "@/components/projection-table";
import { Button } from "@/components/ui/button";
import { Loader2, Save, BarChart3, FileDown, ArrowLeft, Home } from "lucide-react";
import { analyzeProperty } from "@dealscope/core";
import { exportPdf } from "@/lib/export-pdf";
import { fmtCurrency, fmtPct } from "@/lib/utils";
import type { AnalysisInput, Property } from "@dealscope/core";

export default function ResultsPage() {
  const { state, dispatch } = useWizard();
  const router = useRouter();
  const params = useSearchParams();
  const loadId = params.get("loadId");
  const api = useApi();
  const { isAuthenticated } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load saved analysis if navigated with loadId
  useEffect(() => {
    if (loadId && !state.analysisId) {
      (async () => {
        try {
          const saved = await api.getAnalysis(loadId);
          dispatch({ type: "LOAD_ANALYSIS", id: saved.id, input: saved.input, results: saved.results });
        } catch (err) {
          setLoadError(err instanceof Error ? err.message : "Failed to load analysis");
        }
      })();
    }
  }, [loadId]);

  // Run analysis on mount (for new analyses from wizard)
  useEffect(() => {
    if (loadId) return;
    const property = state.property as Property;
    if (!property.address || !property.units) return;

    const input: AnalysisInput = {
      property,
      rentRoll: state.rentRoll,
      expenses: state.expenses,
      financing: state.financing,
      valueAdd: state.valueAdd,
      holdPeriod: state.holdPeriod,
      exitCapRate: state.exitCapRate,
    };

    const results = analyzeProperty(input);
    dispatch({ type: "SET_RESULTS", results });
  }, []);

  const r = state.results;

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-destructive mb-4">{loadError}</p>
        <Button variant="outline" onClick={() => router.replace("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  if (!r) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">{loadId ? "Loading analysis..." : "Crunching numbers..."}</p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!isAuthenticated) {
      setSaveMessage("Sign in to save analyses");
      return;
    }
    setSaving(true);
    try {
      const input: AnalysisInput = {
        property: state.property as Property,
        rentRoll: state.rentRoll,
        expenses: state.expenses,
        financing: state.financing,
        valueAdd: state.valueAdd,
        holdPeriod: state.holdPeriod,
        exitCapRate: state.exitCapRate,
      };
      if (state.analysisId) {
        await api.updateAnalysis(state.analysisId, input);
        setSaveMessage("Analysis updated");
      } else {
        const { id } = await api.createAnalysis(input);
        dispatch({ type: "SET_ANALYSIS_ID", analysisId: id });
        setSaveMessage("Analysis saved");
      }
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <StepIndicator current={6} />

      {/* Key Metrics */}
      <h2 className="text-lg font-bold text-primary mb-3">Key Metrics</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 mb-4">
        <MetricCard label="Cap Rate" value={fmtPct(r.capRate.mid)} subtitle="mid estimate" />
        <MetricCard label="Cash-on-Cash" value={fmtPct(r.cashOnCash.mid)} subtitle="mid estimate" />
        <MetricCard label="Monthly Cash Flow" value={fmtCurrency(r.monthlyCashFlow.mid)} subtitle="mid estimate" color={r.monthlyCashFlow.mid >= 0 ? "#003366" : "#c00"} />
        <MetricCard label="DSCR" value={r.dscr.mid.toFixed(2)} subtitle={r.dscr.mid >= 1.25 ? "Healthy" : r.dscr.mid >= 1 ? "Tight" : "Negative"} color={r.dscr.mid >= 1.25 ? "#008800" : r.dscr.mid >= 1 ? "#cc8800" : "#c00"} />
      </div>

      {/* Purchase Metrics */}
      <h2 className="text-lg font-bold text-primary mb-3">Purchase Metrics</h2>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Price/Unit", value: fmtCurrency(r.pricePerUnit) },
          { label: "Price/Sqft", value: fmtCurrency(r.pricePerSqft) },
          { label: "GRM", value: `${r.grossRentMultiplier.toFixed(1)}x` },
          { label: "1% Rule", value: fmtPct(r.onePercentRule) },
          { label: "Break-Even Occ.", value: fmtPct(r.breakEvenOccupancy) },
        ].map((m) => (
          <div key={m.label} className="bg-gray-50 rounded-lg p-3">
            <div className="text-[10px] text-muted-foreground mb-1">{m.label}</div>
            <div className="text-sm font-bold text-primary">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Income & Expenses */}
      <h2 className="text-lg font-bold text-primary mb-3">Income & Expenses</h2>
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Gross Potential Rent</span><span>{fmtCurrency(r.income.grossPotentialRent)}</span></div>
        <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Vacancy ({(r.income.vacancyRate * 100).toFixed(0)}%)</span><span className="text-destructive">-{fmtCurrency(r.income.vacancyLoss)}</span></div>
        <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Other Income</span><span>+{fmtCurrency(r.income.otherIncomeTotal)}</span></div>
        <div className="flex justify-between text-sm font-bold text-primary border-t pt-2 mt-2"><span>Effective Gross Income</span><span>{fmtCurrency(r.income.effectiveGrossIncome)}</span></div>
        {r.expenses.breakdown.map((item, i) => (
          <div key={i} className="flex justify-between text-sm mt-1"><span className="text-muted-foreground">{item.category}</span><span className="text-destructive">-{fmtCurrency(item.amount)}</span></div>
        ))}
      </div>

      {/* NOI Range */}
      <h2 className="text-lg font-bold text-primary mb-3">Net Operating Income</h2>
      <div className="mb-4"><RangeCards label="NOI" range={r.noi} /></div>

      {/* Cap Rate Range */}
      <h2 className="text-lg font-bold text-primary mb-3">Cap Rate Range</h2>
      <div className="mb-4"><RangeCards label="Cap Rate" range={r.capRate} format="percent" /></div>

      {/* Cash Flow Range */}
      <h2 className="text-lg font-bold text-primary mb-3">Annual Cash Flow</h2>
      <div className="mb-4"><RangeCards label="Cash Flow" range={r.annualCashFlow} /></div>

      {/* Stabilized */}
      {r.stabilized && (
        <>
          <h2 className="text-lg font-bold text-primary mb-3">Stabilized (Value-Add)</h2>
          <div className="grid grid-cols-3 gap-2 mb-2 items-center">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-[10px] text-muted-foreground">Current NOI</div>
              <div className="text-sm font-bold text-primary">{fmtCurrency(r.noi.mid)}</div>
            </div>
            <div className="text-center text-primary text-xl">→</div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-[10px] text-muted-foreground">Stabilized NOI</div>
              <div className="text-sm font-bold text-success">{fmtCurrency(r.stabilized.noi.mid)}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4 items-center">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-[10px] text-muted-foreground">Current Cap</div>
              <div className="text-sm font-bold text-primary">{fmtPct(r.capRate.mid)}</div>
            </div>
            <div className="text-center text-primary text-xl">→</div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-[10px] text-muted-foreground">Stabilized Cap</div>
              <div className="text-sm font-bold text-success">{fmtPct(r.stabilized.capRate.mid)}</div>
            </div>
          </div>
        </>
      )}

      {/* Projections */}
      <h2 className="text-lg font-bold text-primary mb-3">{state.holdPeriod}-Year Projections</h2>
      <div className="mb-4"><ProjectionTable projections={r.projections} /></div>

      {/* Investment Returns */}
      {(r.irr != null || r.equityMultiple != null) && (
        <>
          <h2 className="text-lg font-bold text-primary mb-3">Investment Returns</h2>
          <div className="flex gap-3 mb-4">
            {r.irr != null && <MetricCard label="IRR" value={fmtPct(r.irr)} subtitle={`${state.holdPeriod}-year hold`} color={r.irr > 15 ? "#008800" : r.irr > 8 ? "#003366" : "#cc8800"} />}
            {r.equityMultiple != null && <MetricCard label="Equity Multiple" value={`${r.equityMultiple.toFixed(2)}x`} subtitle={`${state.holdPeriod}-year hold`} />}
          </div>
        </>
      )}

      {/* Financing Summary */}
      <h2 className="text-lg font-bold text-primary mb-3">Financing Summary</h2>
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Down Payment</span><span>{fmtCurrency(r.financing.downPayment)}</span></div>
        <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Loan Amount</span><span>{fmtCurrency(r.financing.loanAmount)}</span></div>
        <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Monthly Payment</span><span>{fmtCurrency(r.financing.monthlyPayment)}/mo</span></div>
        <div className="flex justify-between text-sm font-bold text-primary"><span>Total Cash Required</span><span>{fmtCurrency(r.financing.totalCashRequired)}</span></div>
      </div>

      {/* Action Buttons */}
      {saveMessage && <p className="text-sm text-center text-primary mb-2">{saveMessage}</p>}
      <div className="flex gap-2 mb-4">
        <Button variant="outline" className="flex-1" disabled={saving} onClick={handleSave}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" />{state.analysisId ? "Update" : "Save"}</>}
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => router.push("/analysis/scenarios")}>
          <BarChart3 className="h-4 w-4 mr-1" />Scenario
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => exportPdf({ property: state.property as Property, financing: state.financing, holdPeriod: state.holdPeriod, results: r })}>
          <FileDown className="h-4 w-4 mr-1" />PDF
        </Button>
      </div>

      <div className="flex gap-3 mb-10">
        <Button variant="outline" className="flex-1" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />Assumptions
        </Button>
        <Button className="flex-1" onClick={() => router.replace("/dashboard")}>
          <Home className="h-4 w-4 mr-1" />Dashboard
        </Button>
      </div>
    </div>
  );
}
