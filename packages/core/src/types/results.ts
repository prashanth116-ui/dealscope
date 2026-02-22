/**
 * Calculated analysis results.
 */

// ─── Range (low / mid / high) ───────────────────────────────

export interface Range {
  low: number;
  mid: number;
  high: number;
}

// ─── Income Results ─────────────────────────────────────────

export interface IncomeResult {
  grossPotentialRent: number;
  vacancyRate: number;
  vacancyLoss: number;
  effectiveRentalIncome: number;
  otherIncomeTotal: number;
  effectiveGrossIncome: number;
}

// ─── Expense Results ────────────────────────────────────────

export interface ExpenseResult {
  totalExpenses: Range;
  expenseRatio: Range;
  breakdown: {
    category: string;
    amount: number;
    perUnit: number;
    percentOfEgi: number;
  }[];
}

// ─── Financing Results ──────────────────────────────────────

export interface FinancingResult {
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  annualDebtService: number;
  totalCashRequired: number;
  balloonBalance?: number;
  effectiveRate?: number;
}

// ─── Year-by-Year Projection ────────────────────────────────

export interface YearProjection {
  year: number;
  grossIncome: number;
  vacancy: number;
  effectiveGrossIncome: number;
  expenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  cumulativeCashFlow: number;
  loanBalance: number;
  propertyValue: number;
  equity: number;
  cashOnCash: number;
}

// ─── Full Analysis Results ──────────────────────────────────

export interface AnalysisResults {
  // Purchase metrics
  pricePerUnit: number;
  pricePerSqft: number;
  grossRentMultiplier: number;

  // Income
  income: IncomeResult;

  // Expenses
  expenses: ExpenseResult;

  // NOI
  noi: Range;
  capRate: Range;

  // Financing
  financing: FinancingResult;

  // Cash flow
  annualCashFlow: Range;
  monthlyCashFlow: Range;

  // Returns
  cashOnCash: Range;
  dscr: Range;
  breakEvenOccupancy: number;
  onePercentRule: number;

  // Stabilized (if value-add provided)
  stabilized?: {
    effectiveGrossIncome: number;
    noi: Range;
    capRate: Range;
    cashOnCash: Range;
  };

  // Projections
  projections: YearProjection[];
  irr?: number;
  equityMultiple?: number;
}
