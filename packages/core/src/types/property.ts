/**
 * Core property and analysis types for DealScope.
 */

// ─── Address ────────────────────────────────────────────────

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  county?: string;
  lat?: number;
  lng?: number;
}

// ─── Property ───────────────────────────────────────────────

export type PropertyType =
  | "multifamily"
  | "retail"
  | "office"
  | "industrial"
  | "mixed";

export interface Property {
  address: Address;
  type: PropertyType;
  units: number;
  buildingSqft: number;
  lotSqft?: number;
  yearBuilt: number;
  askingPrice: number;
  mlsNumber?: string;
  photos: string[];
  heating?: string;
  cooling?: string;
  roofAge?: number;
  renovatedUnits?: number;
  parkingSpaces?: number;
}

// ─── Unit / Rent Roll ───────────────────────────────────────

export type UnitStatus = "occupied" | "vacant" | "down";
export type TenantType = "market" | "section8" | "corporate";

export interface Unit {
  unitNumber: string;
  beds: number;
  baths: number;
  sqft: number;
  currentRent: number;
  marketRent: number;
  leaseExpiration?: string;
  status: UnitStatus;
  tenantType?: TenantType;
}

export interface OtherIncome {
  utilityPassThrough: {
    perUnit: number;
    unitsParticipating: number;
  };
  laundry: number;
  parking: number;
  storage: number;
  petFees: number;
  other: number;
}

export interface RentRoll {
  units: Unit[];
  otherIncome: OtherIncome;
}

// ─── Expenses ───────────────────────────────────────────────

export type ExpenseSource = "auto" | "manual";

export interface ExpenseLine {
  amount: number;
  source: ExpenseSource;
}

export interface UtilityExpenses {
  gas: ExpenseLine;
  water: ExpenseLine;
  sewer: ExpenseLine;
  trash: ExpenseLine;
  electric: ExpenseLine;
}

export interface DetailedExpenses {
  propertyTax: ExpenseLine;
  insurance: ExpenseLine;
  utilities: UtilityExpenses;
  management: {
    percentage: number;
    amount: number;
  };
  maintenance: {
    amount: number;
    perUnit: number;
  };
  capex: {
    amount: number;
    perUnit: number;
  };
  landscaping: ExpenseLine;
  legal: ExpenseLine;
  advertising: ExpenseLine;
  other: { description: string; amount: number }[];
}

export interface Expenses {
  mode: "quick" | "detailed";
  quickPercentage?: number;
  detailed?: DetailedExpenses;
}

// ─── Financing ──────────────────────────────────────────────

export type FinancingType =
  | "conventional"
  | "seller"
  | "cash"
  | "fha"
  | "assumable"
  | "brrrr";

export interface SellerCarryback {
  amount: number;
  rate: number;
  term: number;
  balloon: number;
}

export interface Financing {
  type: FinancingType;
  purchasePrice: number;
  downPaymentPercent: number;
  interestRate: number;
  loanTerm: number;
  amortization: number;
  closingCosts: number;
  points: number;
  sellerCarryback?: SellerCarryback;
}

// ─── Value-Add Assumptions ──────────────────────────────────

export interface ValueAddAssumptions {
  targetRentPerUnit?: number;
  rentGrowthRate: number;
  expenseGrowthRate: number;
  appreciationRate: number;
  renovationBudget: number;
  renovationTimeline: number; // months
  targetOccupancy: number;
  targetPassThrough?: number;
}

// ─── Analysis (top-level input) ─────────────────────────────

export interface AnalysisInput {
  property: Property;
  rentRoll: RentRoll;
  expenses: Expenses;
  financing: Financing;
  valueAdd?: ValueAddAssumptions;
  holdPeriod: number; // years (default 5)
  exitCapRate?: number;
}
