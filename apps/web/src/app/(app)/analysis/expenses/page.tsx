"use client";

import { useRouter } from "next/navigation";
import { useWizard } from "@/lib/wizard-context";
import { StepIndicator } from "@/components/step-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  calculateIncome,
  calculateExpenses as calcExpenses,
  estimateExpenses,
  EXPENSE_RATIO_BENCHMARKS,
} from "@dealscope/core";
import type { DetailedExpenses, ExpenseLine } from "@dealscope/core";

function makeExpenseLine(amount: number, source: "auto" | "manual" = "auto"): ExpenseLine {
  return { amount, source };
}

function makeDefaultDetailed(units: number, yearBuilt: number, egi: number): DetailedExpenses {
  const est = estimateExpenses({ units, yearBuilt, propertyTax: 0, egi, landlordPaysHeat: false, climate: "moderate", managementPercent: 8 });
  return {
    propertyTax: makeExpenseLine(est.propertyTax),
    insurance: makeExpenseLine(est.insurance),
    utilities: {
      gas: makeExpenseLine(est.gas),
      water: makeExpenseLine(est.water),
      sewer: makeExpenseLine(est.sewer),
      trash: makeExpenseLine(est.trash),
      electric: makeExpenseLine(est.commonElectric),
    },
    management: { percentage: 8, amount: est.management },
    maintenance: { amount: est.maintenance, perUnit: est.maintenance / units },
    capex: { amount: est.capex, perUnit: est.capex / units },
    landscaping: makeExpenseLine(est.landscaping),
    legal: makeExpenseLine(est.legal),
    advertising: makeExpenseLine(est.advertising),
    other: [],
  };
}

function ExpenseField({ label, value, source, onChangeValue }: { label: string; value: number; source: "auto" | "manual"; onChangeValue: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between mb-2 py-1">
      <div className="flex items-center gap-2 flex-1">
        <span className="text-sm">{label}</span>
        <Badge variant={source === "auto" ? "default" : "warning"} className="text-[9px] h-4 px-1.5">
          {source === "auto" ? "Auto" : "Manual"}
        </Badge>
      </div>
      <Input
        type="number"
        className="w-24 h-8 text-sm text-right"
        value={value ? String(Math.round(value)) : ""}
        onChange={(e) => onChangeValue(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}

export default function ExpensesPage() {
  const { state, dispatch } = useWizard();
  const router = useRouter();
  const expenses = state.expenses;
  const units = state.property.units ?? 1;
  const yearBuilt = state.property.yearBuilt ?? 1990;

  const income = calculateIncome(state.rentRoll);
  const egi = income.effectiveGrossIncome;

  const detailed = expenses.detailed ?? makeDefaultDetailed(units, yearBuilt, egi);

  const setMode = (mode: "quick" | "detailed") => {
    if (mode === "detailed" && !expenses.detailed) {
      dispatch({ type: "SET_EXPENSES", expenses: { mode: "detailed", detailed: makeDefaultDetailed(units, yearBuilt, egi) } });
    } else {
      dispatch({ type: "SET_EXPENSES", expenses: { ...expenses, mode } });
    }
  };

  const setQuickPct = (pct: number) => {
    dispatch({ type: "SET_EXPENSES", expenses: { ...expenses, quickPercentage: pct } });
  };

  const updateDetailedField = (path: string, value: number) => {
    const d = { ...detailed } as any;
    const parts = path.split(".");
    if (parts.length === 1) {
      if (d[parts[0]] && typeof d[parts[0]] === "object" && "amount" in d[parts[0]]) {
        d[parts[0]] = { ...d[parts[0]], amount: value, source: "manual" as const };
      }
    } else if (parts.length === 2) {
      d[parts[0]] = { ...d[parts[0]], [parts[1]]: { ...d[parts[0]][parts[1]], amount: value, source: "manual" as const } };
    }
    dispatch({ type: "SET_EXPENSES", expenses: { ...expenses, mode: "detailed", detailed: d } });
  };

  const updateManagement = (pct: number) => {
    const d = { ...detailed, management: { percentage: pct, amount: egi * (pct / 100) } };
    dispatch({ type: "SET_EXPENSES", expenses: { ...expenses, mode: "detailed", detailed: d } });
  };

  const expResult = calcExpenses(expenses, egi, units);
  const noi = egi - expResult.totalExpenses.mid;

  const handleContinue = () => {
    dispatch({ type: "SET_STEP", step: 4 });
    router.push("/analysis/financing");
  };

  return (
    <div>
      <StepIndicator current={3} />

      {/* Mode toggle */}
      <div className="flex mb-4">
        {(["quick", "detailed"] as const).map((mode) => (
          <button
            key={mode}
            className={`flex-1 py-3 text-sm font-semibold border ${
              expenses.mode === mode
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-gray-50 text-muted-foreground border-gray-200"
            } ${mode === "quick" ? "rounded-l-md" : "rounded-r-md"}`}
            onClick={() => setMode(mode)}
          >
            {mode === "quick" ? "Quick (% of EGI)" : "Detailed"}
          </button>
        ))}
      </div>

      {expenses.mode === "quick" ? (
        <div>
          <p className="text-center font-semibold text-primary mb-3">
            Expense Ratio: {expenses.quickPercentage ?? 50}% of EGI
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {[35, 42, 50, 58, 65, 75].map((pct) => (
              <Button
                key={pct}
                variant={expenses.quickPercentage === pct ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setQuickPct(pct)}
              >
                {pct}%
              </Button>
            ))}
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm">Custom %</span>
            <Input
              type="number"
              className="w-20 h-8 text-sm text-right"
              value={String(expenses.quickPercentage ?? 50)}
              onChange={(e) => setQuickPct(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
            />
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-xs">
            <div className="font-semibold mb-1">Benchmarks</div>
            <p>Tenant pays all: {EXPENSE_RATIO_BENCHMARKS.tenantPaysAll.min}-{EXPENSE_RATIO_BENCHMARKS.tenantPaysAll.max}% (typical {EXPENSE_RATIO_BENCHMARKS.tenantPaysAll.typical}%)</p>
            <p>Landlord pays heat: {EXPENSE_RATIO_BENCHMARKS.landlordPaysHeat.min}-{EXPENSE_RATIO_BENCHMARKS.landlordPaysHeat.max}% (typical {EXPENSE_RATIO_BENCHMARKS.landlordPaysHeat.typical}%)</p>
            <p>Landlord pays all: {EXPENSE_RATIO_BENCHMARKS.landlordPaysAll.min}-{EXPENSE_RATIO_BENCHMARKS.landlordPaysAll.max}% (typical {EXPENSE_RATIO_BENCHMARKS.landlordPaysAll.typical}%)</p>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs text-muted-foreground italic mb-4">
            Auto-estimated from {units} units, built {yearBuilt}. Edit any field to override.
          </p>
          <ExpenseField label="Property Tax" value={detailed.propertyTax.amount} source={detailed.propertyTax.source} onChangeValue={(v) => updateDetailedField("propertyTax", v)} />
          <ExpenseField label="Insurance" value={detailed.insurance.amount} source={detailed.insurance.source} onChangeValue={(v) => updateDetailedField("insurance", v)} />
          <ExpenseField label="Gas / Heat" value={detailed.utilities.gas.amount} source={detailed.utilities.gas.source} onChangeValue={(v) => updateDetailedField("utilities.gas", v)} />
          <ExpenseField label="Water" value={detailed.utilities.water.amount} source={detailed.utilities.water.source} onChangeValue={(v) => updateDetailedField("utilities.water", v)} />
          <ExpenseField label="Sewer" value={detailed.utilities.sewer.amount} source={detailed.utilities.sewer.source} onChangeValue={(v) => updateDetailedField("utilities.sewer", v)} />
          <ExpenseField label="Trash" value={detailed.utilities.trash.amount} source={detailed.utilities.trash.source} onChangeValue={(v) => updateDetailedField("utilities.trash", v)} />
          <ExpenseField label="Common Electric" value={detailed.utilities.electric.amount} source={detailed.utilities.electric.source} onChangeValue={(v) => updateDetailedField("utilities.electric", v)} />
          <div className="flex items-center justify-between mb-2 py-1">
            <span className="text-sm">Management (%)</span>
            <Input type="number" className="w-24 h-8 text-sm text-right" value={String(detailed.management.percentage)} onChange={(e) => updateManagement(parseFloat(e.target.value) || 0)} />
          </div>
          <ExpenseField label="Repairs & Maintenance" value={detailed.maintenance.amount} source="auto" onChangeValue={(v) => {
            const d = { ...detailed, maintenance: { amount: v, perUnit: units > 0 ? v / units : 0 } };
            dispatch({ type: "SET_EXPENSES", expenses: { ...expenses, mode: "detailed", detailed: d } });
          }} />
          <ExpenseField label="CapEx Reserves" value={detailed.capex.amount} source="auto" onChangeValue={(v) => {
            const d = { ...detailed, capex: { amount: v, perUnit: units > 0 ? v / units : 0 } };
            dispatch({ type: "SET_EXPENSES", expenses: { ...expenses, mode: "detailed", detailed: d } });
          }} />
          <ExpenseField label="Landscaping" value={detailed.landscaping.amount} source={detailed.landscaping.source} onChangeValue={(v) => updateDetailedField("landscaping", v)} />
          <ExpenseField label="Legal / Accounting" value={detailed.legal.amount} source={detailed.legal.source} onChangeValue={(v) => updateDetailedField("legal", v)} />
          <ExpenseField label="Advertising" value={detailed.advertising.amount} source={detailed.advertising.source} onChangeValue={(v) => updateDetailedField("advertising", v)} />
        </div>
      )}

      {/* Running NOI */}
      <div className="bg-gray-100 rounded-lg p-4 mt-5">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Effective Gross Income</span>
          <span>${egi.toLocaleString()}/yr</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Total Expenses ({expResult.expenseRatio.mid.toFixed(1)}%)</span>
          <span className="text-destructive">-${Math.round(expResult.totalExpenses.mid).toLocaleString()}/yr</span>
        </div>
        <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2" style={{ color: noi < 0 ? "#c00" : "#003366" }}>
          <span>Net Operating Income</span>
          <span>${Math.round(noi).toLocaleString()}/yr</span>
        </div>
      </div>

      <div className="flex gap-3 mt-6 mb-10">
        <Button variant="outline" className="flex-1" onClick={() => router.back()}>Back</Button>
        <Button className="flex-[2]" onClick={handleContinue}>Continue</Button>
      </div>
    </div>
  );
}
