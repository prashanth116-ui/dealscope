/**
 * Pure TypeScript validators for each wizard step.
 * No external dependencies — returns { valid, errors }.
 */

import type {
  Property,
  RentRoll,
  Expenses,
  Financing,
  ValueAddAssumptions,
} from "../types/property";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ─── Step 1: Property ────────────────────────────────────────

export function validateProperty(p: Partial<Property>): ValidationResult {
  const errors: string[] = [];

  if (!p.address?.street) errors.push("Street address is required");
  if (!p.address?.city) errors.push("City is required");
  if (!p.address?.state) errors.push("State is required");
  if (!p.address?.zip || p.address.zip.length < 5) errors.push("Valid ZIP code is required");
  if (!p.units || p.units < 1) errors.push("At least 1 unit is required");
  if (!p.askingPrice || p.askingPrice <= 0) errors.push("Asking price must be greater than 0");
  if (p.yearBuilt && (p.yearBuilt < 1800 || p.yearBuilt > new Date().getFullYear() + 2)) {
    errors.push("Year built must be between 1800 and current year");
  }

  return { valid: errors.length === 0, errors };
}

// ─── Step 2: Rent Roll ──────────────────────────────────────

export function validateRentRoll(rentRoll: RentRoll, expectedUnits: number): ValidationResult {
  const errors: string[] = [];

  if (rentRoll.units.length === 0) {
    errors.push("At least one unit is required");
  }

  if (rentRoll.units.length !== expectedUnits && expectedUnits > 0) {
    errors.push(`Expected ${expectedUnits} units but got ${rentRoll.units.length}`);
  }

  for (const unit of rentRoll.units) {
    if (unit.currentRent < 0) {
      errors.push(`Unit ${unit.unitNumber}: rent cannot be negative`);
    }
    if (unit.beds < 0 || unit.baths < 0) {
      errors.push(`Unit ${unit.unitNumber}: beds/baths cannot be negative`);
    }
  }

  const hasAnyRent = rentRoll.units.some((u) => u.currentRent > 0);
  if (!hasAnyRent && rentRoll.units.length > 0) {
    errors.push("At least one unit must have rent greater than 0");
  }

  return { valid: errors.length === 0, errors };
}

// ─── Step 3: Expenses ────────────────────────────────────────

export function validateExpenses(expenses: Expenses): ValidationResult {
  const errors: string[] = [];

  if (expenses.mode === "quick") {
    if (
      expenses.quickPercentage == null ||
      expenses.quickPercentage < 0 ||
      expenses.quickPercentage > 100
    ) {
      errors.push("Expense percentage must be between 0 and 100");
    }
  } else if (expenses.mode === "detailed") {
    if (!expenses.detailed) {
      errors.push("Detailed expenses must be provided in detailed mode");
    } else {
      if (expenses.detailed.propertyTax.amount < 0) {
        errors.push("Property tax cannot be negative");
      }
      if (expenses.detailed.insurance.amount < 0) {
        errors.push("Insurance cannot be negative");
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Step 4: Financing ──────────────────────────────────────

export function validateFinancing(financing: Financing): ValidationResult {
  const errors: string[] = [];

  if (financing.purchasePrice <= 0) {
    errors.push("Purchase price must be greater than 0");
  }

  if (financing.type !== "cash") {
    if (financing.downPaymentPercent < 0 || financing.downPaymentPercent > 100) {
      errors.push("Down payment must be between 0% and 100%");
    }
    if (financing.interestRate < 0 || financing.interestRate > 30) {
      errors.push("Interest rate must be between 0% and 30%");
    }
    if (financing.loanTerm < 1 || financing.loanTerm > 40) {
      errors.push("Loan term must be between 1 and 40 years");
    }
    if (financing.amortization < 1 || financing.amortization > 40) {
      errors.push("Amortization must be between 1 and 40 years");
    }
  }

  if (financing.type === "seller" && financing.sellerCarryback) {
    const sc = financing.sellerCarryback;
    if (sc.amount <= 0) errors.push("Carryback amount must be greater than 0");
    if (sc.rate < 0) errors.push("Carryback rate cannot be negative");
    if (sc.term < 1) errors.push("Carryback term must be at least 1 year");
  }

  return { valid: errors.length === 0, errors };
}

// ─── Step 5: Assumptions ────────────────────────────────────

export function validateAssumptions(
  valueAdd: ValueAddAssumptions,
  holdPeriod: number,
  exitCapRate: number
): ValidationResult {
  const errors: string[] = [];

  if (holdPeriod < 1 || holdPeriod > 30) {
    errors.push("Hold period must be between 1 and 30 years");
  }
  if (exitCapRate < 0 || exitCapRate > 20) {
    errors.push("Exit cap rate must be between 0% and 20%");
  }
  if (valueAdd.rentGrowthRate < -10 || valueAdd.rentGrowthRate > 20) {
    errors.push("Rent growth rate must be between -10% and 20%");
  }
  if (valueAdd.expenseGrowthRate < -10 || valueAdd.expenseGrowthRate > 20) {
    errors.push("Expense growth rate must be between -10% and 20%");
  }
  if (valueAdd.renovationBudget < 0) {
    errors.push("Renovation budget cannot be negative");
  }

  return { valid: errors.length === 0, errors };
}
