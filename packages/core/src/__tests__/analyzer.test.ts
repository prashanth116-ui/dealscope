/**
 * Integration test: full property analysis matching the
 * 2620 N Gettysburg Ave deal we analyzed manually.
 */

import { describe, it, expect } from "vitest";
import { analyzeProperty } from "../calculations/analyzer";
import type { AnalysisInput } from "../types/property";

/** Build the Gettysburg Ave deal as an AnalysisInput. */
function gettysburgDeal(): AnalysisInput {
  const units = Array.from({ length: 10 }, (_, i) => ({
    unitNumber: `${i + 1}`,
    beds: 1,
    baths: 1,
    sqft: 440,
    currentRent: 615,
    marketRent: 725,
    status: (i < 9 ? "occupied" : "vacant") as "occupied" | "vacant",
  }));

  return {
    property: {
      address: {
        street: "2620 N Gettysburg Avenue",
        city: "Dayton",
        state: "OH",
        zip: "45406",
        county: "Montgomery",
      },
      type: "multifamily",
      units: 10,
      buildingSqft: 5986,
      lotSqft: 5227,
      yearBuilt: 1965,
      askingPrice: 450_000,
      photos: [],
      heating: "Boiler - Natural Gas",
      cooling: "Wall Unit(s)",
      roofAge: 3.5,
      renovatedUnits: 6,
    },
    rentRoll: {
      units,
      otherIncome: {
        utilityPassThrough: { perUnit: 50, unitsParticipating: 9 },
        laundry: 0,
        parking: 0,
        storage: 0,
        petFees: 0,
        other: 0,
      },
    },
    expenses: {
      mode: "detailed",
      detailed: {
        propertyTax: { amount: 7100, source: "auto" },
        insurance: { amount: 4000, source: "manual" },
        utilities: {
          gas: { amount: 10000, source: "manual" },
          water: { amount: 4000, source: "manual" },
          sewer: { amount: 0, source: "manual" },
          trash: { amount: 2500, source: "manual" },
          electric: { amount: 1200, source: "manual" },
        },
        management: { percentage: 8, amount: 5880 },
        maintenance: { amount: 5000, perUnit: 500 },
        capex: { amount: 4000, perUnit: 400 },
        landscaping: { amount: 0, source: "manual" },
        legal: { amount: 0, source: "manual" },
        advertising: { amount: 0, source: "manual" },
        other: [],
      },
    },
    financing: {
      type: "conventional",
      purchasePrice: 450_000,
      downPaymentPercent: 25,
      interestRate: 7.0,
      loanTerm: 30,
      amortization: 30,
      closingCosts: 5000,
      points: 0,
    },
    valueAdd: {
      targetRentPerUnit: 675,
      rentGrowthRate: 2,
      expenseGrowthRate: 2.5,
      appreciationRate: 2,
      renovationBudget: 0,
      renovationTimeline: 0,
      targetOccupancy: 0.95,
      targetPassThrough: 120,
    },
    holdPeriod: 5,
    exitCapRate: 8,
  };
}

describe("analyzeProperty", () => {
  const input = gettysburgDeal();
  const result = analyzeProperty(input);

  it("calculates correct purchase metrics", () => {
    expect(result.pricePerUnit).toBeCloseTo(45000, 0);
    expect(result.pricePerSqft).toBeCloseTo(75.17, 0);
  });

  it("calculates correct income", () => {
    // GPR: 10 units * $615 * 12 = $73,800
    expect(result.income.grossPotentialRent).toBe(73800);
    // 9/10 occupied = 10% vacancy
    expect(result.income.vacancyRate).toBeCloseTo(0.1, 2);
    // Vacancy loss: $73,800 * 0.10 = $7,380
    expect(result.income.vacancyLoss).toBeCloseTo(7380, 0);
    // ERI: $73,800 - $7,380 = $66,420
    expect(result.income.effectiveRentalIncome).toBeCloseTo(66420, 0);
    // Other income: 9 units * $50 * 12 = $5,400
    expect(result.income.otherIncomeTotal).toBeCloseTo(5400, 0);
    // EGI: $66,420 + $5,400 = $71,820
    expect(result.income.effectiveGrossIncome).toBeCloseTo(71820, 0);
  });

  it("calculates correct expenses", () => {
    // Mid expenses: 7100 + 4000 + 10000 + 4000 + 0 + 2500 + 1200 + 5880 + 5000 + 4000 = $43,680
    expect(result.expenses.totalExpenses.mid).toBeCloseTo(43680, 0);
    // Low: 43680 * 0.85 = ~$37,128
    expect(result.expenses.totalExpenses.low).toBeCloseTo(37128, 0);
    // High: 43680 * 1.15 = ~$50,232
    expect(result.expenses.totalExpenses.high).toBeCloseTo(50232, 0);
  });

  it("calculates correct NOI", () => {
    // Mid NOI: $71,820 - $43,680 = $28,140
    expect(result.noi.mid).toBeCloseTo(28140, 0);
  });

  it("calculates correct cap rate", () => {
    // Mid cap rate: $28,140 / $450,000 = 6.25%
    expect(result.capRate.mid).toBeCloseTo(6.25, 1);
  });

  it("calculates correct financing", () => {
    // Down payment: $450,000 * 25% = $112,500
    expect(result.financing.downPayment).toBe(112500);
    // Loan: $337,500
    expect(result.financing.loanAmount).toBe(337500);
    // Monthly payment at 7%/30yr: ~$2,245
    expect(result.financing.monthlyPayment).toBeCloseTo(2245, -1);
    // Annual debt service: ~$26,944
    expect(result.financing.annualDebtService).toBeCloseTo(26944, -1);
  });

  it("calculates correct cash-on-cash", () => {
    // Total cash: $112,500 + $5,000 = $117,500
    expect(result.financing.totalCashRequired).toBe(117500);
    // Mid cash flow: $28,140 - $26,944 = $1,196
    // CoC: $1,196 / $117,500 = 1.02%
    expect(result.cashOnCash.mid).toBeCloseTo(1.02, 0);
  });

  it("calculates GRM and 1% rule", () => {
    // GRM: $450,000 / $73,800 = 6.10
    expect(result.grossRentMultiplier).toBeCloseTo(6.10, 1);
    // 1% rule: ($73,800/12) / $450,000 * 100 = 1.37%
    expect(result.onePercentRule).toBeCloseTo(1.37, 1);
  });

  it("produces 5-year projections", () => {
    expect(result.projections).toHaveLength(5);
    expect(result.projections[0].year).toBe(1);
    expect(result.projections[4].year).toBe(5);
    // Each year should have increasing income
    for (let i = 1; i < result.projections.length; i++) {
      expect(result.projections[i].grossIncome).toBeGreaterThan(
        result.projections[i - 1].grossIncome
      );
    }
  });

  it("calculates stabilized metrics", () => {
    expect(result.stabilized).toBeDefined();
    // Stabilized EGI should be higher than current
    expect(result.stabilized!.effectiveGrossIncome).toBeGreaterThan(
      result.income.effectiveGrossIncome
    );
    // Stabilized cap rate should be higher than current
    expect(result.stabilized!.capRate.mid).toBeGreaterThan(result.capRate.mid);
  });

  it("calculates IRR", () => {
    expect(result.irr).toBeDefined();
    // IRR is negative at $450K asking price — consistent with near-breakeven deal
    // Manual analysis recommended offering $400-415K for positive returns
    expect(result.irr!).toBeCloseTo(-17.3, 0);
  });

  it("calculates equity multiple", () => {
    expect(result.equityMultiple).toBeDefined();
    expect(result.equityMultiple!).toBeGreaterThan(1);
  });
});
