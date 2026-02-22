/**
 * Expense calculations.
 *
 * Supports quick mode (% of EGI) and detailed mode (line-by-line).
 * Produces low / mid / high ranges.
 */

import type { Expenses, DetailedExpenses } from "../types/property";
import type { ExpenseResult, Range } from "../types/results";

const RANGE_FACTOR = 0.15; // +/- 15% for low/high estimates

/**
 * Sum all detailed expense line items.
 */
function sumDetailedExpenses(d: DetailedExpenses): number {
  const utilities =
    d.utilities.gas.amount +
    d.utilities.water.amount +
    d.utilities.sewer.amount +
    d.utilities.trash.amount +
    d.utilities.electric.amount;

  const otherTotal = d.other.reduce((sum, o) => sum + o.amount, 0);

  return (
    d.propertyTax.amount +
    d.insurance.amount +
    utilities +
    d.management.amount +
    d.maintenance.amount +
    d.capex.amount +
    d.landscaping.amount +
    d.legal.amount +
    d.advertising.amount +
    otherTotal
  );
}

/**
 * Build expense breakdown for reporting.
 */
function buildBreakdown(
  d: DetailedExpenses,
  units: number,
  egi: number
): ExpenseResult["breakdown"] {
  const lines: { category: string; amount: number }[] = [
    { category: "Property Tax", amount: d.propertyTax.amount },
    { category: "Insurance", amount: d.insurance.amount },
    { category: "Gas / Heat", amount: d.utilities.gas.amount },
    { category: "Water", amount: d.utilities.water.amount },
    { category: "Sewer", amount: d.utilities.sewer.amount },
    { category: "Trash", amount: d.utilities.trash.amount },
    { category: "Common Electric", amount: d.utilities.electric.amount },
    { category: "Management", amount: d.management.amount },
    { category: "Repairs & Maintenance", amount: d.maintenance.amount },
    { category: "CapEx Reserves", amount: d.capex.amount },
    { category: "Landscaping", amount: d.landscaping.amount },
    { category: "Legal / Accounting", amount: d.legal.amount },
    { category: "Advertising", amount: d.advertising.amount },
    ...d.other.map((o) => ({ category: o.description || "Other", amount: o.amount })),
  ];

  return lines
    .filter((l) => l.amount > 0)
    .map((l) => ({
      category: l.category,
      amount: l.amount,
      perUnit: units > 0 ? l.amount / units : 0,
      percentOfEgi: egi > 0 ? (l.amount / egi) * 100 : 0,
    }));
}

/**
 * Create a low/mid/high range from a midpoint.
 */
function toRange(mid: number): Range {
  return {
    low: mid * (1 - RANGE_FACTOR),
    mid,
    high: mid * (1 + RANGE_FACTOR),
  };
}

/**
 * Full expense calculation.
 */
export function calculateExpenses(
  expenses: Expenses,
  egi: number,
  units: number
): ExpenseResult {
  let midTotal: number;
  let breakdown: ExpenseResult["breakdown"];

  if (expenses.mode === "quick" && expenses.quickPercentage != null) {
    midTotal = egi * (expenses.quickPercentage / 100);
    breakdown = [
      {
        category: "Total (estimated)",
        amount: midTotal,
        perUnit: units > 0 ? midTotal / units : 0,
        percentOfEgi: expenses.quickPercentage,
      },
    ];
  } else if (expenses.mode === "detailed" && expenses.detailed) {
    midTotal = sumDetailedExpenses(expenses.detailed);
    breakdown = buildBreakdown(expenses.detailed, units, egi);
  } else {
    // Fallback: 50% rule
    midTotal = egi * 0.5;
    breakdown = [
      {
        category: "Total (50% rule default)",
        amount: midTotal,
        perUnit: units > 0 ? midTotal / units : 0,
        percentOfEgi: 50,
      },
    ];
  }

  const totalExpenses = toRange(midTotal);
  const expenseRatio: Range = {
    low: egi > 0 ? (totalExpenses.low / egi) * 100 : 0,
    mid: egi > 0 ? (totalExpenses.mid / egi) * 100 : 0,
    high: egi > 0 ? (totalExpenses.high / egi) * 100 : 0,
  };

  return { totalExpenses, expenseRatio, breakdown };
}
