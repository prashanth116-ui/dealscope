/**
 * Scenario modeling types.
 */

export interface ScenarioOverrides {
  askingPrice?: number;
  occupancyRate?: number;
  rentGrowthRate?: number;
  expenseGrowthRate?: number;
  interestRate?: number;
  downPaymentPercent?: number;
  exitCapRate?: number;
  holdPeriod?: number;
  vacancyRate?: number;
  managementFee?: number;
  renovationBudget?: number;
}

export interface Scenario {
  id: string;
  name: string;
  baseAnalysisId: string;
  overrides: ScenarioOverrides;
}

export interface SensitivityCell {
  row: number;
  col: number;
  value: number;
}

export interface SensitivityMatrix {
  rowVariable: string;
  rowValues: number[];
  colVariable: string;
  colValues: number[];
  metric: string;
  cells: SensitivityCell[];
}
