/**
 * Income calculations.
 *
 * GPR → Vacancy Loss → ERI → Other Income → EGI
 */

import type { RentRoll, Unit } from "../types/property";
import type { IncomeResult } from "../types/results";

/**
 * Calculate occupancy rate from unit statuses.
 */
export function calculateOccupancyRate(units: Unit[]): number {
  if (units.length === 0) return 0;
  const occupied = units.filter((u) => u.status === "occupied").length;
  return occupied / units.length;
}

/**
 * Calculate gross potential rent (all units at current rent, annualized).
 */
export function calculateGPR(units: Unit[]): number {
  return units.reduce((sum, u) => sum + u.currentRent * 12, 0);
}

/**
 * Calculate total other income (annualized).
 */
export function calculateOtherIncome(rentRoll: RentRoll): number {
  const oi = rentRoll.otherIncome;
  const passThrough =
    oi.utilityPassThrough.perUnit *
    oi.utilityPassThrough.unitsParticipating *
    12;
  return (
    passThrough +
    oi.laundry * 12 +
    oi.parking * 12 +
    oi.storage * 12 +
    oi.petFees * 12 +
    oi.other * 12
  );
}

/**
 * Full income calculation pipeline.
 */
export function calculateIncome(rentRoll: RentRoll): IncomeResult {
  const units = rentRoll.units;
  const occupancyRate = calculateOccupancyRate(units);
  const grossPotentialRent = calculateGPR(units);
  const vacancyRate = 1 - occupancyRate;
  const vacancyLoss = grossPotentialRent * vacancyRate;
  const effectiveRentalIncome = grossPotentialRent - vacancyLoss;
  const otherIncomeTotal = calculateOtherIncome(rentRoll);
  const effectiveGrossIncome = effectiveRentalIncome + otherIncomeTotal;

  return {
    grossPotentialRent,
    vacancyRate,
    vacancyLoss,
    effectiveRentalIncome,
    otherIncomeTotal,
    effectiveGrossIncome,
  };
}
