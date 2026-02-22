/**
 * Financing calculations.
 *
 * Supports conventional, seller finance, and cash purchases.
 */

import type { Financing } from "../types/property";
import type { FinancingResult } from "../types/results";

/**
 * Calculate monthly payment (P&I) using standard amortization formula.
 *
 * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
 *
 * Where:
 *   P = principal (loan amount)
 *   r = monthly interest rate
 *   n = total number of payments
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  amortizationYears: number
): number {
  if (principal <= 0) return 0;
  if (annualRate <= 0) return principal / (amortizationYears * 12);

  const r = annualRate / 100 / 12;
  const n = amortizationYears * 12;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

/**
 * Calculate remaining loan balance at a given month.
 */
export function calculateLoanBalance(
  principal: number,
  annualRate: number,
  amortizationYears: number,
  monthsElapsed: number
): number {
  if (principal <= 0) return 0;
  if (annualRate <= 0) {
    const monthlyPayment = principal / (amortizationYears * 12);
    return Math.max(0, principal - monthlyPayment * monthsElapsed);
  }

  const r = annualRate / 100 / 12;
  const n = amortizationYears * 12;
  const factor = Math.pow(1 + r, n);
  const factorElapsed = Math.pow(1 + r, monthsElapsed);

  return principal * ((factor - factorElapsed) / (factor - 1));
}

/**
 * Full financing calculation.
 */
export function calculateFinancing(financing: Financing): FinancingResult {
  const { purchasePrice, downPaymentPercent, interestRate, amortization, closingCosts, points } =
    financing;

  const downPayment = purchasePrice * (downPaymentPercent / 100);
  const loanAmount = purchasePrice - downPayment;
  const pointsCost = loanAmount * (points / 100);

  if (financing.type === "cash") {
    return {
      downPayment: purchasePrice,
      loanAmount: 0,
      monthlyPayment: 0,
      annualDebtService: 0,
      totalCashRequired: purchasePrice + closingCosts,
    };
  }

  const monthlyPayment = calculateMonthlyPayment(
    loanAmount,
    interestRate,
    amortization
  );
  const annualDebtService = monthlyPayment * 12;
  const totalCashRequired = downPayment + closingCosts + pointsCost;

  const result: FinancingResult = {
    downPayment,
    loanAmount,
    monthlyPayment,
    annualDebtService,
    totalCashRequired,
  };

  // Seller finance balloon calculation
  if (financing.type === "seller" && financing.sellerCarryback) {
    const sc = financing.sellerCarryback;
    const balloonMonths = sc.balloon * 12;
    result.balloonBalance = calculateLoanBalance(
      sc.amount,
      sc.rate,
      sc.term,
      balloonMonths
    );
  }

  return result;
}
