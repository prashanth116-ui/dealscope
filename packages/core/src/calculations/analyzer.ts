/**
 * Main analyzer — orchestrates all calculations into a complete AnalysisResults.
 */

import type { AnalysisInput } from "../types/property";
import type { AnalysisResults, Range } from "../types/results";
import { calculateIncome } from "./income";
import { calculateExpenses } from "./expenses";
import { calculateFinancing } from "./financing";
import {
  calculateCapRate,
  calculateCashOnCash,
  calculateDSCR,
  calculateBreakEvenOccupancy,
  calculateGRM,
  calculateOnePercentRule,
  calculateIRR,
  calculateEquityMultiple,
} from "./returns";
import { calculateProjections, buildIRRCashFlows } from "./projections";

/**
 * Run a complete deal analysis.
 */
export function analyzeProperty(input: AnalysisInput): AnalysisResults {
  const { property, rentRoll, expenses, financing, valueAdd, holdPeriod } = input;
  const exitCapRate = input.exitCapRate ?? 0;

  // ─── Purchase Metrics ─────────────────────────────────────
  const pricePerUnit =
    property.units > 0 ? property.askingPrice / property.units : 0;
  const pricePerSqft =
    property.buildingSqft > 0
      ? property.askingPrice / property.buildingSqft
      : 0;

  // ─── Income ───────────────────────────────────────────────
  const incomeResult = calculateIncome(rentRoll);
  const grossRentMultiplier = calculateGRM(
    property.askingPrice,
    incomeResult.grossPotentialRent
  );

  // ─── Expenses ─────────────────────────────────────────────
  const expenseResult = calculateExpenses(
    expenses,
    incomeResult.effectiveGrossIncome,
    property.units
  );

  // ─── NOI ──────────────────────────────────────────────────
  const noi: Range = {
    low: incomeResult.effectiveGrossIncome - expenseResult.totalExpenses.high,
    mid: incomeResult.effectiveGrossIncome - expenseResult.totalExpenses.mid,
    high: incomeResult.effectiveGrossIncome - expenseResult.totalExpenses.low,
  };

  // ─── Cap Rate ─────────────────────────────────────────────
  const capRate = calculateCapRate(noi, property.askingPrice);

  // ─── Financing ────────────────────────────────────────────
  const financingResult = calculateFinancing(financing);

  // ─── Cash Flow ────────────────────────────────────────────
  const annualCashFlow: Range = {
    low: noi.low - financingResult.annualDebtService,
    mid: noi.mid - financingResult.annualDebtService,
    high: noi.high - financingResult.annualDebtService,
  };
  const monthlyCashFlow: Range = {
    low: annualCashFlow.low / 12,
    mid: annualCashFlow.mid / 12,
    high: annualCashFlow.high / 12,
  };

  // ─── Returns ──────────────────────────────────────────────
  const cashOnCash = calculateCashOnCash(
    annualCashFlow,
    financingResult.totalCashRequired
  );
  const dscr = calculateDSCR(noi, financingResult.annualDebtService);
  const breakEvenOccupancy = calculateBreakEvenOccupancy(
    expenseResult.totalExpenses.mid,
    financingResult.annualDebtService,
    incomeResult.grossPotentialRent
  );
  const monthlyRent = incomeResult.grossPotentialRent / 12;
  const onePercentRule = calculateOnePercentRule(
    monthlyRent,
    property.askingPrice
  );

  // ─── Projections ──────────────────────────────────────────
  const assumptions = {
    rentGrowthRate: valueAdd?.rentGrowthRate ?? 2,
    expenseGrowthRate: valueAdd?.expenseGrowthRate ?? 2.5,
    appreciationRate: valueAdd?.appreciationRate ?? 2,
  };

  const projections = calculateProjections({
    egi: incomeResult.effectiveGrossIncome,
    expensesMid: expenseResult.totalExpenses.mid,
    financing: financingResult,
    purchasePrice: property.askingPrice,
    interestRate: financing.interestRate,
    amortization: financing.amortization,
    holdPeriod: holdPeriod || 5,
    assumptions,
  });

  // ─── IRR & Equity Multiple ────────────────────────────────
  const irrCashFlows = buildIRRCashFlows(
    financingResult.totalCashRequired,
    projections,
    exitCapRate,
    5 // 5% selling costs
  );
  const irr = calculateIRR(irrCashFlows) ?? undefined;

  const lastProjection = projections[projections.length - 1];
  const totalDistributions = lastProjection
    ? lastProjection.cumulativeCashFlow +
      (lastProjection.propertyValue - lastProjection.loanBalance)
    : 0;
  const equityMultiple =
    financingResult.totalCashRequired > 0
      ? calculateEquityMultiple(
          totalDistributions,
          financingResult.totalCashRequired
        )
      : undefined;

  // ─── Stabilized (if value-add) ────────────────────────────
  let stabilized: AnalysisResults["stabilized"];
  if (valueAdd?.targetRentPerUnit) {
    const targetOcc = valueAdd.targetOccupancy ?? 0.95;
    const stabilizedGPR = property.units * valueAdd.targetRentPerUnit * 12;
    const stabilizedOtherIncome = valueAdd.targetPassThrough
      ? property.units * valueAdd.targetPassThrough * 12 * targetOcc
      : incomeResult.otherIncomeTotal;
    const stabilizedEGI =
      stabilizedGPR * targetOcc + stabilizedOtherIncome;

    // Recalculate expenses at stabilized EGI (management scales with income)
    const stabilizedExpenses = calculateExpenses(
      expenses,
      stabilizedEGI,
      property.units
    );

    const stabilizedNoi: Range = {
      low: stabilizedEGI - stabilizedExpenses.totalExpenses.high,
      mid: stabilizedEGI - stabilizedExpenses.totalExpenses.mid,
      high: stabilizedEGI - stabilizedExpenses.totalExpenses.low,
    };

    const stabilizedCapRate = calculateCapRate(stabilizedNoi, property.askingPrice);

    const stabilizedCashFlow: Range = {
      low: stabilizedNoi.low - financingResult.annualDebtService,
      mid: stabilizedNoi.mid - financingResult.annualDebtService,
      high: stabilizedNoi.high - financingResult.annualDebtService,
    };
    const stabilizedCoC = calculateCashOnCash(
      stabilizedCashFlow,
      financingResult.totalCashRequired
    );

    stabilized = {
      effectiveGrossIncome: stabilizedEGI,
      noi: stabilizedNoi,
      capRate: stabilizedCapRate,
      cashOnCash: stabilizedCoC,
    };
  }

  return {
    pricePerUnit,
    pricePerSqft,
    grossRentMultiplier,
    income: incomeResult,
    expenses: expenseResult,
    noi,
    capRate,
    financing: financingResult,
    annualCashFlow,
    monthlyCashFlow,
    cashOnCash,
    dscr,
    breakEvenOccupancy,
    onePercentRule,
    stabilized,
    projections,
    irr,
    equityMultiple,
  };
}
