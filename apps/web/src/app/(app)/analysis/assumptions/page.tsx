"use client";

import { useRouter } from "next/navigation";
import { useWizard } from "@/lib/wizard-context";
import { StepIndicator } from "@/components/step-indicator";
import { CurrencyInput } from "@/components/currency-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateIncome, PROJECTION_DEFAULTS } from "@dealscope/core";

export default function AssumptionsPage() {
  const { state, dispatch } = useWizard();
  const router = useRouter();
  const va = state.valueAdd;

  const income = calculateIncome(state.rentRoll);
  const numUnits = state.property.units ?? 1;
  const currentAvgRent = numUnits > 0 ? income.grossPotentialRent / 12 / numUnits : 0;

  const setVA = (field: string, value: number) => {
    dispatch({ type: "SET_VALUE_ADD", valueAdd: { ...va, [field]: value } });
  };

  const handleContinue = () => {
    dispatch({ type: "SET_STEP", step: 6 });
    router.push("/analysis/results");
  };

  return (
    <div>
      <StepIndicator current={5} />

      <h3 className="text-lg font-bold text-primary mb-3">Value-Add Assumptions</h3>

      <Label>Target Rent / Unit (current avg: ${Math.round(currentAvgRent)}/mo)</Label>
      <CurrencyInput
        placeholder="Leave blank if no value-add"
        value={va.targetRentPerUnit ? String(va.targetRentPerUnit) : ""}
        onChangeValue={(v) => setVA("targetRentPerUnit", parseFloat(v) || 0)}
        className="mt-1 mb-1"
      />
      {va.targetRentPerUnit != null && va.targetRentPerUnit > 0 && currentAvgRent > 0 && (
        <p className="text-xs text-success mb-3">
          +${Math.round(va.targetRentPerUnit - currentAvgRent)}/unit ({(((va.targetRentPerUnit - currentAvgRent) / currentAvgRent) * 100).toFixed(0)}% increase)
        </p>
      )}

      <Label>Renovation Budget</Label>
      <CurrencyInput
        placeholder="$0"
        value={va.renovationBudget ? String(va.renovationBudget) : ""}
        onChangeValue={(v) => setVA("renovationBudget", parseFloat(v) || 0)}
        className="mt-1 mb-1"
      />
      {va.renovationBudget > 0 && numUnits > 0 && (
        <p className="text-xs text-muted-foreground mb-3">${Math.round(va.renovationBudget / numUnits).toLocaleString()}/unit</p>
      )}

      <Label>Renovation Timeline (months)</Label>
      <Input type="number" placeholder="0" className="mt-1 mb-3" value={va.renovationTimeline || ""} onChange={(e) => setVA("renovationTimeline", parseInt(e.target.value) || 0)} />

      <Label>Target Occupancy (%)</Label>
      <Input type="number" className="mt-1 mb-3" value={String(Math.round(va.targetOccupancy * 100))} onChange={(e) => setVA("targetOccupancy", Math.min(100, parseInt(e.target.value) || 0) / 100)} />

      <h3 className="text-lg font-bold text-primary mt-6 mb-3">Growth Rates</h3>
      {[
        { label: "Rent Growth (%/yr)", field: "rentGrowthRate", value: va.rentGrowthRate },
        { label: "Expense Growth (%/yr)", field: "expenseGrowthRate", value: va.expenseGrowthRate },
        { label: "Appreciation (%/yr)", field: "appreciationRate", value: va.appreciationRate },
      ].map((item) => (
        <div key={item.field} className="flex items-center justify-between mb-2">
          <span className="text-sm">{item.label}</span>
          <Input type="number" step="0.5" className="w-20 h-8 text-sm text-right" value={String(item.value)} onChange={(e) => setVA(item.field, parseFloat(e.target.value) || 0)} />
        </div>
      ))}

      <h3 className="text-lg font-bold text-primary mt-6 mb-3">Exit Strategy</h3>

      <Label>Hold Period (years)</Label>
      <div className="flex gap-2 mt-1 mb-2">
        {[3, 5, 7, 10, 15].map((yr) => (
          <Button key={yr} variant={state.holdPeriod === yr ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => dispatch({ type: "SET_HOLD_PERIOD", holdPeriod: yr })}>
            {yr}
          </Button>
        ))}
      </div>
      <Input type="number" placeholder="Custom" className="mb-3" value={String(state.holdPeriod)} onChange={(e) => dispatch({ type: "SET_HOLD_PERIOD", holdPeriod: Math.min(30, Math.max(1, parseInt(e.target.value) || 5)) })} />

      <Label>Exit Cap Rate (%)</Label>
      <Input type="number" step="0.5" className="mt-1 mb-3" value={String(state.exitCapRate)} onChange={(e) => dispatch({ type: "SET_EXIT_CAP_RATE", exitCapRate: parseFloat(e.target.value) || 0 })} />

      {/* Defaults reminder */}
      <div className="bg-gray-50 rounded-lg p-3 mt-4 text-xs text-muted-foreground">
        <div className="font-semibold mb-1">Current Defaults</div>
        <p>Rent Growth: {PROJECTION_DEFAULTS.rentGrowthRate}% | Expense Growth: {PROJECTION_DEFAULTS.expenseGrowthRate}%</p>
        <p>Appreciation: {PROJECTION_DEFAULTS.appreciationRate}% | Hold: {PROJECTION_DEFAULTS.holdPeriod}yr | Exit Cap: {PROJECTION_DEFAULTS.exitCapRate}%</p>
      </div>

      <div className="flex gap-3 mt-6 mb-10">
        <Button variant="outline" className="flex-1" onClick={() => router.back()}>Back</Button>
        <Button className="flex-[2]" onClick={handleContinue}>Run Analysis</Button>
      </div>
    </div>
  );
}
