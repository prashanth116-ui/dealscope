/**
 * Return metric calculations.
 *
 * Cap Rate, Cash-on-Cash, DSCR, GRM, IRR, etc.
 */

import type { Range } from "../types/results";

/**
 * Cap Rate = NOI / Purchase Price
 */
export function calculateCapRate(noi: Range, price: number): Range {
  if (price <= 0) return { low: 0, mid: 0, high: 0 };
  return {
    low: (noi.low / price) * 100,
    mid: (noi.mid / price) * 100,
    high: (noi.high / price) * 100,
  };
}

/**
 * Cash-on-Cash = Annual Cash Flow / Total Cash Invested
 */
export function calculateCashOnCash(
  cashFlow: Range,
  totalCashInvested: number
): Range {
  if (totalCashInvested <= 0) return { low: 0, mid: 0, high: 0 };
  return {
    low: (cashFlow.low / totalCashInvested) * 100,
    mid: (cashFlow.mid / totalCashInvested) * 100,
    high: (cashFlow.high / totalCashInvested) * 100,
  };
}

/**
 * DSCR = NOI / Annual Debt Service
 */
export function calculateDSCR(noi: Range, annualDebtService: number): Range {
  if (annualDebtService <= 0) return { low: Infinity, mid: Infinity, high: Infinity };
  return {
    low: noi.low / annualDebtService,
    mid: noi.mid / annualDebtService,
    high: noi.high / annualDebtService,
  };
}

/**
 * Break-even Occupancy = (Expenses + Debt Service) / GPR
 */
export function calculateBreakEvenOccupancy(
  expenses: number,
  debtService: number,
  gpr: number
): number {
  if (gpr <= 0) return 0;
  return ((expenses + debtService) / gpr) * 100;
}

/**
 * Gross Rent Multiplier = Price / Annual Gross Rent
 */
export function calculateGRM(price: number, annualGrossRent: number): number {
  if (annualGrossRent <= 0) return 0;
  return price / annualGrossRent;
}

/**
 * 1% Rule = Monthly Rent / Price * 100
 */
export function calculateOnePercentRule(
  monthlyRent: number,
  price: number
): number {
  if (price <= 0) return 0;
  return (monthlyRent / price) * 100;
}

/**
 * Internal Rate of Return using Newton-Raphson method.
 *
 * cashFlows[0] = initial investment (negative)
 * cashFlows[1..n] = annual cash flows (positive or negative)
 * cashFlows[n] includes exit proceeds
 */
export function calculateIRR(
  cashFlows: number[],
  maxIterations = 1000,
  tolerance = 0.0001
): number | null {
  if (cashFlows.length < 2) return null;

  // Initial guess
  let rate = 0.1;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const denominator = Math.pow(1 + rate, t);
      npv += cashFlows[t] / denominator;
      if (t > 0) {
        dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
      }
    }

    if (Math.abs(dnpv) < 1e-10) return null; // avoid division by zero

    const newRate = rate - npv / dnpv;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate * 100; // return as percentage
    }

    rate = newRate;
  }

  return null; // did not converge
}

/**
 * Equity Multiple = Total Distributions / Total Invested
 */
export function calculateEquityMultiple(
  totalDistributions: number,
  totalInvested: number
): number {
  if (totalInvested <= 0) return 0;
  return totalDistributions / totalInvested;
}
