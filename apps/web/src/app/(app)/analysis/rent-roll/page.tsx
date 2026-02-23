"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "@/lib/wizard-context";
import { StepIndicator } from "@/components/step-indicator";
import { UnitRow } from "@/components/unit-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateIncome } from "@dealscope/core";
import type { Unit } from "@dealscope/core";

function makeEmptyUnit(index: number): Unit {
  return { unitNumber: String(index + 1), beds: 1, baths: 1, sqft: 0, currentRent: 0, marketRent: 0, status: "occupied" };
}

export default function RentRollPage() {
  const { state, dispatch } = useWizard();
  const router = useRouter();
  const numUnits = state.property.units ?? 0;
  const rentRoll = state.rentRoll;

  const units =
    rentRoll.units.length === numUnits
      ? rentRoll.units
      : Array.from({ length: numUnits }, (_, i) => rentRoll.units[i] ?? makeEmptyUnit(i));

  useEffect(() => {
    if (rentRoll.units.length !== numUnits && numUnits > 0) {
      dispatch({ type: "SET_RENT_ROLL", rentRoll: { ...rentRoll, units } });
    }
  }, [numUnits]);

  const updateUnit = (index: number, updated: Unit) => {
    const newUnits = [...units];
    newUnits[index] = updated;
    dispatch({ type: "SET_RENT_ROLL", rentRoll: { ...rentRoll, units: newUnits } });
  };

  const fillAllUnits = () => {
    if (units.length === 0) return;
    const first = units[0];
    const filled = units.map((_, i) => ({ ...first, unitNumber: String(i + 1) }));
    dispatch({ type: "SET_RENT_ROLL", rentRoll: { ...rentRoll, units: filled } });
  };

  const setOtherIncome = (field: string, value: number) => {
    dispatch({
      type: "SET_RENT_ROLL",
      rentRoll: { ...rentRoll, units, otherIncome: { ...rentRoll.otherIncome, [field]: value } },
    });
  };

  const setPassThrough = (field: string, value: number) => {
    dispatch({
      type: "SET_RENT_ROLL",
      rentRoll: {
        ...rentRoll,
        units,
        otherIncome: {
          ...rentRoll.otherIncome,
          utilityPassThrough: { ...rentRoll.otherIncome.utilityPassThrough, [field]: value },
        },
      },
    });
  };

  const tempRoll = { ...rentRoll, units };
  const income = calculateIncome(tempRoll);
  const hasAnyRent = units.some((u) => u.currentRent > 0);

  const handleContinue = () => {
    if (!hasAnyRent) return;
    dispatch({ type: "SET_RENT_ROLL", rentRoll: { ...rentRoll, units } });
    dispatch({ type: "SET_STEP", step: 3 });
    router.push("/analysis/expenses");
  };

  const oi = rentRoll.otherIncome;

  return (
    <div>
      <StepIndicator current={2} />

      {numUnits > 1 && (
        <Button variant="secondary" size="sm" className="w-full mb-4" onClick={fillAllUnits}>
          Fill all units from Unit 1
        </Button>
      )}

      {units.map((unit, i) => (
        <UnitRow key={i} unit={unit} onChange={(u) => updateUnit(i, u)} />
      ))}

      <h3 className="text-lg font-bold text-primary mt-6 mb-3">Other Income (monthly)</h3>

      {[
        { label: "Utility Pass-Through ($/unit)", value: oi.utilityPassThrough.perUnit, onChange: (v: number) => setPassThrough("perUnit", v) },
        { label: "Units Participating", value: oi.utilityPassThrough.unitsParticipating, onChange: (v: number) => setPassThrough("unitsParticipating", v) },
        { label: "Laundry", value: oi.laundry, onChange: (v: number) => setOtherIncome("laundry", v) },
        { label: "Parking", value: oi.parking, onChange: (v: number) => setOtherIncome("parking", v) },
        { label: "Storage", value: oi.storage, onChange: (v: number) => setOtherIncome("storage", v) },
        { label: "Pet Fees", value: oi.petFees, onChange: (v: number) => setOtherIncome("petFees", v) },
      ].map((item) => (
        <div key={item.label} className="flex items-center justify-between mb-2">
          <span className="text-sm text-foreground/80">{item.label}</span>
          <Input
            type="number"
            className="w-24 h-8 text-sm text-right"
            value={item.value || ""}
            onChange={(e) => item.onChange(parseFloat(e.target.value) || 0)}
          />
        </div>
      ))}

      {/* Running totals */}
      <div className="bg-gray-100 rounded-lg p-4 mt-5">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Gross Potential Rent</span>
          <span>${income.grossPotentialRent.toLocaleString()}/yr</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Vacancy Loss ({(income.vacancyRate * 100).toFixed(0)}%)</span>
          <span className="text-destructive">-${income.vacancyLoss.toLocaleString()}/yr</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Other Income</span>
          <span>+${income.otherIncomeTotal.toLocaleString()}/yr</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-primary border-t pt-2 mt-2">
          <span>Effective Gross Income</span>
          <span>${income.effectiveGrossIncome.toLocaleString()}/yr</span>
        </div>
      </div>

      <div className="flex gap-3 mt-6 mb-10">
        <Button variant="outline" className="flex-1" onClick={() => router.back()}>
          Back
        </Button>
        <Button className="flex-[2]" disabled={!hasAnyRent} onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
