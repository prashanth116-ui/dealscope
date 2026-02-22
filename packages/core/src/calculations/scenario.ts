/**
 * Scenario engine — apply what-if overrides and generate sensitivity matrices.
 */

import type { AnalysisInput } from "../types/property";
import type { AnalysisResults } from "../types/results";
import type { ScenarioOverrides, SensitivityMatrix, SensitivityCell } from "../types/scenario";
import { analyzeProperty } from "./analyzer";

/**
 * Deep-clone an AnalysisInput and apply scenario overrides, then re-run analysis.
 */
export function applyScenario(
  baseInput: AnalysisInput,
  overrides: ScenarioOverrides
): AnalysisResults {
  const input = structuredClone(baseInput);

  if (overrides.askingPrice !== undefined) {
    input.property.askingPrice = overrides.askingPrice;
    input.financing.purchasePrice = overrides.askingPrice;
  }

  if (overrides.interestRate !== undefined) {
    input.financing.interestRate = overrides.interestRate;
  }

  if (overrides.downPaymentPercent !== undefined) {
    input.financing.downPaymentPercent = overrides.downPaymentPercent;
  }

  if (overrides.vacancyRate !== undefined) {
    // Adjust unit statuses to match target vacancy
    const totalUnits = input.rentRoll.units.length;
    const targetVacant = Math.round(totalUnits * (overrides.vacancyRate / 100));
    // Reset all to occupied, then mark the right number as vacant
    for (const unit of input.rentRoll.units) {
      unit.status = "occupied";
    }
    for (let i = 0; i < targetVacant && i < totalUnits; i++) {
      input.rentRoll.units[totalUnits - 1 - i].status = "vacant";
    }
  }

  if (overrides.occupancyRate !== undefined) {
    // Convert occupancy to vacancy and apply same logic
    const vacancyPct = 100 - overrides.occupancyRate;
    const totalUnits = input.rentRoll.units.length;
    const targetVacant = Math.round(totalUnits * (vacancyPct / 100));
    for (const unit of input.rentRoll.units) {
      unit.status = "occupied";
    }
    for (let i = 0; i < targetVacant && i < totalUnits; i++) {
      input.rentRoll.units[totalUnits - 1 - i].status = "vacant";
    }
  }

  if (overrides.rentGrowthRate !== undefined) {
    if (input.valueAdd) {
      input.valueAdd.rentGrowthRate = overrides.rentGrowthRate;
    } else {
      input.valueAdd = {
        rentGrowthRate: overrides.rentGrowthRate,
        expenseGrowthRate: 2.5,
        appreciationRate: 2,
        renovationBudget: 0,
        renovationTimeline: 0,
        targetOccupancy: 0.95,
      };
    }
  }

  if (overrides.expenseGrowthRate !== undefined) {
    if (input.valueAdd) {
      input.valueAdd.expenseGrowthRate = overrides.expenseGrowthRate;
    } else {
      input.valueAdd = {
        rentGrowthRate: 2,
        expenseGrowthRate: overrides.expenseGrowthRate,
        appreciationRate: 2,
        renovationBudget: 0,
        renovationTimeline: 0,
        targetOccupancy: 0.95,
      };
    }
  }

  if (overrides.exitCapRate !== undefined) {
    input.exitCapRate = overrides.exitCapRate;
  }

  if (overrides.holdPeriod !== undefined) {
    input.holdPeriod = overrides.holdPeriod;
  }

  if (overrides.managementFee !== undefined && input.expenses.detailed) {
    input.expenses.detailed.management.percentage = overrides.managementFee;
    // Recalculate management amount (will be computed from EGI in analyzer)
    input.expenses.detailed.management.amount = 0; // Let it recompute
  }

  if (overrides.renovationBudget !== undefined) {
    if (input.valueAdd) {
      input.valueAdd.renovationBudget = overrides.renovationBudget;
    }
  }

  return analyzeProperty(input);
}

/**
 * Extract a single metric value from AnalysisResults.
 * Uses mid value for Range types.
 */
function extractMetric(
  results: AnalysisResults,
  metric: "capRate" | "cashOnCash" | "irr" | "dscr" | "monthlyCashFlow"
): number {
  switch (metric) {
    case "capRate":
      return results.capRate.mid;
    case "cashOnCash":
      return results.cashOnCash.mid;
    case "dscr":
      return results.dscr.mid;
    case "monthlyCashFlow":
      return results.monthlyCashFlow.mid;
    case "irr":
      return results.irr ?? 0;
  }
}

/**
 * Generate a 2-variable sensitivity matrix.
 * Varies rowVar across rowValues and colVar across colValues,
 * computing the chosen metric for each combination.
 */
export function runSensitivity(
  baseInput: AnalysisInput,
  rowVar: keyof ScenarioOverrides,
  rowValues: number[],
  colVar: keyof ScenarioOverrides,
  colValues: number[],
  metric: "capRate" | "cashOnCash" | "irr" | "dscr" | "monthlyCashFlow"
): SensitivityMatrix {
  const cells: SensitivityCell[] = [];

  for (let r = 0; r < rowValues.length; r++) {
    for (let c = 0; c < colValues.length; c++) {
      const overrides: ScenarioOverrides = {
        [rowVar]: rowValues[r],
        [colVar]: colValues[c],
      };
      const results = applyScenario(baseInput, overrides);
      cells.push({
        row: r,
        col: c,
        value: extractMetric(results, metric),
      });
    }
  }

  return {
    rowVariable: rowVar,
    rowValues,
    colVariable: colVar,
    colValues,
    metric,
    cells,
  };
}
