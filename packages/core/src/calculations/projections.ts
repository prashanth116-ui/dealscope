/**
 * Multi-year projection engine.
 *
 * Projects income, expenses, cash flow, equity, and returns year-by-year.
 */

import type { ValueAddAssumptions } from "../types/property";
import type { YearProjection, FinancingResult, Range } from "../types/results";
import { calculateLoanBalance } from "./financing";

export interface ProjectionInputs {
  egi: number;
  expensesMid: number;
  financing: FinancingResult;
  purchasePrice: number;
  interestRate: number;
  amortization: number;
  holdPeriod: number;
  assumptions: {
    rentGrowthRate: number;
    expenseGrowthRate: number;
    appreciationRate: number;
  };
}

/**
 * Generate year-by-year projections.
 */
export function calculateProjections(inputs: ProjectionInputs): YearProjection[] {
  const {
    egi: baseEgi,
    expensesMid: baseExpenses,
    financing,
    purchasePrice,
    interestRate,
    amortization,
    holdPeriod,
    assumptions,
  } = inputs;

  const projections: YearProjection[] = [];
  let cumulativeCashFlow = 0;

  for (let year = 1; year <= holdPeriod; year++) {
    const growthFactor = (rate: number) => Math.pow(1 + rate / 100, year);

    // baseEgi already has vacancy applied, so grow it directly (no double-count)
    const grossIncome = baseEgi * growthFactor(assumptions.rentGrowthRate);
    const vacancy = 0;
    const effectiveGrossIncome = grossIncome;
    const expenses = baseExpenses * growthFactor(assumptions.expenseGrowthRate);
    const noi = effectiveGrossIncome - expenses;
    const debtService = financing.annualDebtService;
    const cashFlow = noi - debtService;
    cumulativeCashFlow += cashFlow;

    const monthsElapsed = year * 12;
    const loanBalance = calculateLoanBalance(
      financing.loanAmount,
      interestRate,
      amortization,
      monthsElapsed
    );

    const propertyValue = purchasePrice * growthFactor(assumptions.appreciationRate);
    const equity = propertyValue - loanBalance;
    const cashOnCash =
      financing.totalCashRequired > 0
        ? (cashFlow / financing.totalCashRequired) * 100
        : 0;

    projections.push({
      year,
      grossIncome,
      vacancy,
      effectiveGrossIncome,
      expenses,
      noi,
      debtService,
      cashFlow,
      cumulativeCashFlow,
      loanBalance,
      propertyValue,
      equity,
      cashOnCash,
    });
  }

  return projections;
}

/**
 * Build cash flow array for IRR calculation.
 *
 * Year 0: negative (total cash invested)
 * Years 1..n-1: annual cash flow
 * Year n: annual cash flow + exit proceeds
 */
export function buildIRRCashFlows(
  totalCashInvested: number,
  projections: YearProjection[],
  exitCapRate: number,
  sellingCosts: number // typically 5-6% of exit price
): number[] {
  if (projections.length === 0) return [];

  const lastYear = projections[projections.length - 1];
  const exitPrice = exitCapRate > 0 ? (lastYear.noi / (exitCapRate / 100)) : lastYear.propertyValue;
  const exitProceeds = exitPrice - lastYear.loanBalance - exitPrice * (sellingCosts / 100);

  const cashFlows = [-totalCashInvested];
  for (let i = 0; i < projections.length; i++) {
    if (i === projections.length - 1) {
      cashFlows.push(projections[i].cashFlow + exitProceeds);
    } else {
      cashFlows.push(projections[i].cashFlow);
    }
  }

  return cashFlows;
}
