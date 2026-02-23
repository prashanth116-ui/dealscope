"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "@/lib/wizard-context";
import { ScenarioSliders } from "@/components/scenario-sliders";
import { ScenarioComparison } from "@/components/scenario-comparison";
import { SensitivityGrid } from "@/components/sensitivity-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteDialog } from "@/components/delete-dialog";
import { applyScenario } from "@dealscope/core";
import type { AnalysisInput, AnalysisResults, ScenarioOverrides, Property } from "@dealscope/core";
import { ArrowLeft } from "lucide-react";

interface SavedScenario {
  id: string;
  name: string;
  overrides: ScenarioOverrides;
  results: AnalysisResults;
}

export default function ScenariosPage() {
  const { state } = useWizard();
  const router = useRouter();

  const baseInput = useMemo<AnalysisInput>(() => ({
    property: state.property as Property,
    rentRoll: state.rentRoll,
    expenses: state.expenses,
    financing: state.financing,
    valueAdd: state.valueAdd,
    holdPeriod: state.holdPeriod,
    exitCapRate: state.exitCapRate,
  }), [state]);

  const baseResults = state.results!;

  const [currentOverrides, setCurrentOverrides] = useState<ScenarioOverrides>({});
  const previewResults = useMemo(() => {
    if (Object.keys(currentOverrides).length === 0) return baseResults;
    return applyScenario(baseInput, currentOverrides);
  }, [baseInput, currentOverrides, baseResults]);

  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [showNameInput, setShowNameInput] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSaveScenario = useCallback(() => {
    if (!scenarioName.trim()) return;
    const results = applyScenario(baseInput, currentOverrides);
    setScenarios((prev) => [...prev, { id: Date.now().toString(), name: scenarioName.trim(), overrides: { ...currentOverrides }, results }]);
    setScenarioName("");
    setShowNameInput(false);
  }, [scenarioName, currentOverrides, baseInput]);

  const vacantUnits = state.rentRoll.units.filter((u) => u.status !== "occupied").length;
  const totalUnits = state.rentRoll.units.length;
  const baseVacancy = totalUnits > 0 ? Math.round((vacantUnits / totalUnits) * 100) : 5;

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-1" />Back to Results
      </Button>

      <ScenarioSliders
        basePrice={state.property.askingPrice ?? 0}
        baseRate={state.financing.interestRate}
        baseVacancy={baseVacancy}
        baseRentGrowth={state.valueAdd.rentGrowthRate}
        onOverridesChange={setCurrentOverrides}
        previewResults={previewResults}
      />

      {/* Save Scenario */}
      <div className="my-4">
        {!showNameInput ? (
          <div className="flex items-center gap-3">
            <Button disabled={scenarios.length >= 4} onClick={() => { if (scenarios.length < 4) setShowNameInput(true); }}>
              + Add Scenario
            </Button>
            {scenarios.length >= 4 && <span className="text-xs text-muted-foreground">Max 4 scenarios</span>}
          </div>
        ) : (
          <div className="flex gap-2">
            <Input placeholder="Scenario name (e.g., Best Case)" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} autoFocus className="flex-1" />
            <Button onClick={handleSaveScenario}>Save</Button>
            <Button variant="ghost" onClick={() => setShowNameInput(false)}>Cancel</Button>
          </div>
        )}

        {scenarios.map((s) => (
          <div key={s.id} className="bg-gray-50 rounded-lg p-3 mt-2 border-l-4 border-l-primary">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-bold text-primary">{s.name}</span>
              <button className="text-xs text-destructive" onClick={() => setDeleteId(s.id)}>Remove</button>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>Cap: {s.results.capRate.mid.toFixed(2)}%</span>
              <span>CoC: {s.results.cashOnCash.mid.toFixed(2)}%</span>
              <span>CF: ${Math.round(s.results.monthlyCashFlow.mid).toLocaleString()}/mo</span>
            </div>
          </div>
        ))}
      </div>

      {scenarios.length > 0 && (
        <ScenarioComparison base={{ name: "Base Case", results: baseResults }} scenarios={scenarios.map((s) => ({ name: s.name, results: s.results }))} />
      )}

      <SensitivityGrid baseInput={baseInput} />

      <DeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => { setScenarios((prev) => prev.filter((s) => s.id !== deleteId)); setDeleteId(null); }}
        title="Delete Scenario"
        description="Remove this scenario?"
      />
    </div>
  );
}
