/**
 * Tests for the scenario engine — applyScenario and runSensitivity.
 */

import { describe, it, expect } from "vitest";
import { applyScenario, runSensitivity, analyzeProperty } from "../calculations";
import type { AnalysisInput } from "../types/property";

function testDeal(): AnalysisInput {
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
      address: { street: "123 Test St", city: "Dayton", state: "OH", zip: "45406" },
      type: "multifamily",
      units: 10,
      buildingSqft: 5986,
      yearBuilt: 1965,
      askingPrice: 450_000,
      photos: [],
    },
    rentRoll: {
      units,
      otherIncome: {
        utilityPassThrough: { perUnit: 50, unitsParticipating: 9 },
        laundry: 0, parking: 0, storage: 0, petFees: 0, other: 0,
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
      rentGrowthRate: 2,
      expenseGrowthRate: 2.5,
      appreciationRate: 2,
      renovationBudget: 0,
      renovationTimeline: 0,
      targetOccupancy: 0.95,
    },
    holdPeriod: 5,
    exitCapRate: 8,
  };
}

describe("applyScenario", () => {
  const input = testDeal();
  const baseResults = analyzeProperty(input);

  it("returns base results when no overrides", () => {
    const results = applyScenario(input, {});
    expect(results.capRate.mid).toBeCloseTo(baseResults.capRate.mid, 2);
    expect(results.cashOnCash.mid).toBeCloseTo(baseResults.cashOnCash.mid, 2);
  });

  it("lower price increases cap rate", () => {
    const results = applyScenario(input, { askingPrice: 400_000 });
    expect(results.capRate.mid).toBeGreaterThan(baseResults.capRate.mid);
  });

  it("higher price decreases cap rate", () => {
    const results = applyScenario(input, { askingPrice: 500_000 });
    expect(results.capRate.mid).toBeLessThan(baseResults.capRate.mid);
  });

  it("lower interest rate improves cash-on-cash", () => {
    const results = applyScenario(input, { interestRate: 5.0 });
    expect(results.cashOnCash.mid).toBeGreaterThan(baseResults.cashOnCash.mid);
  });

  it("higher interest rate worsens cash-on-cash", () => {
    const results = applyScenario(input, { interestRate: 9.0 });
    expect(results.cashOnCash.mid).toBeLessThan(baseResults.cashOnCash.mid);
  });

  it("multiple overrides combine correctly", () => {
    const results = applyScenario(input, {
      askingPrice: 400_000,
      interestRate: 5.0,
    });
    // Both changes improve returns, so results should be better than either alone
    const priceOnlyResults = applyScenario(input, { askingPrice: 400_000 });
    expect(results.cashOnCash.mid).toBeGreaterThan(priceOnlyResults.cashOnCash.mid);
  });

  it("vacancy override changes income", () => {
    const results = applyScenario(input, { vacancyRate: 20 });
    // 20% vacancy = more vacancy loss = lower income
    expect(results.income.effectiveGrossIncome).toBeLessThan(
      baseResults.income.effectiveGrossIncome
    );
  });

  it("does not mutate original input", () => {
    const originalPrice = input.property.askingPrice;
    applyScenario(input, { askingPrice: 350_000 });
    expect(input.property.askingPrice).toBe(originalPrice);
  });
});

describe("runSensitivity", () => {
  const input = testDeal();

  it("generates correct matrix dimensions", () => {
    const matrix = runSensitivity(
      input,
      "askingPrice",
      [400_000, 425_000, 450_000],
      "interestRate",
      [6.0, 7.0, 8.0],
      "cashOnCash"
    );

    expect(matrix.cells).toHaveLength(9); // 3x3
    expect(matrix.rowValues).toHaveLength(3);
    expect(matrix.colValues).toHaveLength(3);
    expect(matrix.metric).toBe("cashOnCash");
  });

  it("values change across rows and columns", () => {
    const matrix = runSensitivity(
      input,
      "askingPrice",
      [400_000, 500_000],
      "interestRate",
      [5.0, 9.0],
      "cashOnCash"
    );

    // Low price + low rate should yield best CoC (cell [0,0])
    const bestCell = matrix.cells.find((c) => c.row === 0 && c.col === 0)!;
    // High price + high rate should yield worst CoC (cell [1,1])
    const worstCell = matrix.cells.find((c) => c.row === 1 && c.col === 1)!;

    expect(bestCell.value).toBeGreaterThan(worstCell.value);
  });

  it("cap rate metric works", () => {
    const matrix = runSensitivity(
      input,
      "askingPrice",
      [400_000, 450_000, 500_000],
      "vacancyRate",
      [5, 10],
      "capRate"
    );

    expect(matrix.cells).toHaveLength(6); // 3x2
    expect(matrix.metric).toBe("capRate");
    // All values should be positive for this deal
    matrix.cells.forEach((cell) => {
      expect(cell.value).toBeGreaterThan(0);
    });
  });
});
