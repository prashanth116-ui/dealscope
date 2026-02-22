/**
 * Smart defaults and benchmarks for expense estimation.
 */

/** Expense defaults per unit per year, by building age bucket. */
export const EXPENSE_DEFAULTS = {
  insurance: { pre1970: 550, pre2000: 475, modern: 400 },
  maintenance: { pre1970: 850, pre2000: 650, modern: 500 },
  capex: { pre1970: 500, pre2000: 400, modern: 300 },
  landscaping: { perUnit: 100 },
  legalAccounting: { flat: 1500 },
  advertising: { flat: 750 },
} as const;

/** Utility defaults per unit per year, by climate/region. */
export const UTILITY_DEFAULTS = {
  gas: { cold: 1200, moderate: 700, warm: 300 },
  water: { perUnit: 400 },
  sewer: { perUnit: 350 },
  trash: { perUnit: 250 },
  commonElectric: { perUnit: 150 },
} as const;

/** Management fee defaults. */
export const MANAGEMENT_DEFAULTS = {
  selfManaged: 0,
  standard: 8,
  fullService: 10,
  luxury: 12,
} as const;

/** Financing defaults. */
export const FINANCING_DEFAULTS = {
  conventional: {
    downPaymentPercent: 25,
    loanTerm: 30,
    amortization: 30,
    closingCosts: 3, // % of purchase price
    points: 0,
  },
  seller: {
    downPaymentPercent: 10,
    loanTerm: 5,
    amortization: 25,
    closingCosts: 1,
    points: 0,
  },
} as const;

/** Projection defaults. */
export const PROJECTION_DEFAULTS = {
  rentGrowthRate: 2.0,
  expenseGrowthRate: 2.5,
  appreciationRate: 2.0,
  holdPeriod: 5,
  exitCapRate: 8.0,
  sellingCosts: 5.0,
  vacancyRate: 5.0,
} as const;

/** Quick expense ratio benchmarks by property age and utility arrangement. */
export const EXPENSE_RATIO_BENCHMARKS = {
  tenantPaysAll: { min: 35, typical: 42, max: 50 },
  landlordPaysHeat: { min: 50, typical: 58, max: 68 },
  landlordPaysAll: { min: 55, typical: 65, max: 75 },
} as const;

/**
 * Get age bucket from year built.
 */
export function getAgeBucket(yearBuilt: number): "pre1970" | "pre2000" | "modern" {
  if (yearBuilt < 1970) return "pre1970";
  if (yearBuilt < 2000) return "pre2000";
  return "modern";
}

/**
 * Auto-estimate expenses for a property.
 */
export function estimateExpenses(params: {
  units: number;
  yearBuilt: number;
  propertyTax: number;
  egi: number;
  landlordPaysHeat: boolean;
  climate: "cold" | "moderate" | "warm";
  managementPercent: number;
}) {
  const age = getAgeBucket(params.yearBuilt);
  const u = params.units;

  const gas = params.landlordPaysHeat
    ? UTILITY_DEFAULTS.gas[params.climate] * u
    : 0;

  return {
    propertyTax: params.propertyTax,
    insurance: EXPENSE_DEFAULTS.insurance[age] * u,
    gas,
    water: UTILITY_DEFAULTS.water.perUnit * u,
    sewer: UTILITY_DEFAULTS.sewer.perUnit * u,
    trash: UTILITY_DEFAULTS.trash.perUnit * u,
    commonElectric: UTILITY_DEFAULTS.commonElectric.perUnit * u,
    management: params.egi * (params.managementPercent / 100),
    maintenance: EXPENSE_DEFAULTS.maintenance[age] * u,
    capex: EXPENSE_DEFAULTS.capex[age] * u,
    landscaping: EXPENSE_DEFAULTS.landscaping.perUnit * u,
    legal: EXPENSE_DEFAULTS.legalAccounting.flat,
    advertising: EXPENSE_DEFAULTS.advertising.flat,
  };
}
