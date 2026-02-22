/**
 * Cross-reference extracted values against public data sources.
 */

import type { ExtractedField, CrossReferenceResult } from "@dealscope/core";
import { EXPENSE_RATIO_BENCHMARKS } from "@dealscope/core";

/**
 * Cross-reference extracted fields with public data.
 * Returns enriched fields with publicValue and discrepancy annotations.
 *
 * In production, this calls external APIs:
 * - FreeSources.getMortgageRate() for interest rates
 * - FreeSources.getFairMarketRent() for HUD FMR comparison
 * - ScraperRegistry.lookupTax() for county tax records
 */
export async function crossReferenceFields(
  fields: ExtractedField[],
  zip?: string
): Promise<{ fields: ExtractedField[]; crossReferences: CrossReferenceResult[] }> {
  const crossReferences: CrossReferenceResult[] = [];
  const enrichedFields = [...fields];

  for (let i = 0; i < enrichedFields.length; i++) {
    const field = enrichedFields[i];

    // Interest rate comparison
    if (field.fieldPath.includes("interestRate") || field.fieldPath.includes("assumedRate")) {
      const currentRate = await getCurrentMortgageRate();
      if (currentRate && typeof field.value === "number") {
        const diff = Math.abs(field.value - currentRate);
        if (diff > 0.25) {
          enrichedFields[i] = {
            ...field,
            publicValue: currentRate,
            discrepancy: `Document assumes ${field.value}% but current 30yr avg is ${currentRate}% (${diff > 0 ? "+" : ""}${(field.value - currentRate).toFixed(2)}%)`,
          };
          crossReferences.push({
            fieldPath: field.fieldPath,
            label: field.label,
            extractedValue: field.value,
            publicValue: currentRate,
            source: "FRED 30yr Mortgage Rate",
            severity: diff > 1 ? "warning" : "info",
            recommendation:
              diff > 1
                ? "Significant rate difference - rerun with current rate"
                : "Minor rate difference - monitor",
          });
        }
      }
    }

    // Property tax comparison
    if (field.fieldPath.includes("propertyTax") && zip) {
      const publicTax = await lookupPropertyTax(zip);
      if (publicTax && typeof field.value === "number") {
        const pctDiff = ((field.value - publicTax) / publicTax) * 100;
        if (Math.abs(pctDiff) > 5) {
          enrichedFields[i] = {
            ...field,
            publicValue: publicTax,
            discrepancy: `Document states $${field.value.toLocaleString()} but county records show $${publicTax.toLocaleString()} (${pctDiff > 0 ? "+" : ""}${pctDiff.toFixed(0)}%)`,
          };
          crossReferences.push({
            fieldPath: field.fieldPath,
            label: field.label,
            extractedValue: field.value,
            publicValue: publicTax,
            source: "County Tax Records",
            severity: Math.abs(pctDiff) > 15 ? "error" : "warning",
            recommendation: "Verify with county assessor records",
          });
        }
      }
    }

    // Expense ratio sanity check
    if (field.fieldPath.includes("expenseRatio") && typeof field.value === "number") {
      const ratio = field.value;
      if (ratio < EXPENSE_RATIO_BENCHMARKS.tenantPaysAll.min) {
        enrichedFields[i] = {
          ...field,
          discrepancy: `Expense ratio ${ratio}% is below typical minimum (${EXPENSE_RATIO_BENCHMARKS.tenantPaysAll.min}%) - may be understated`,
        };
        crossReferences.push({
          fieldPath: field.fieldPath,
          label: field.label,
          extractedValue: ratio,
          publicValue: EXPENSE_RATIO_BENCHMARKS.tenantPaysAll.typical,
          source: "Industry Benchmarks",
          severity: "warning",
          recommendation: "Expense ratio appears low - verify all expenses are included",
        });
      }
    }

    // Rent comparison vs HUD FMR
    if (
      (field.fieldPath.includes("avgRent") || field.fieldPath.includes("currentRent")) &&
      zip &&
      typeof field.value === "number"
    ) {
      const fmr = await getFairMarketRent(zip);
      if (fmr) {
        const pctDiff = ((field.value - fmr) / fmr) * 100;
        if (Math.abs(pctDiff) > 10) {
          enrichedFields[i] = {
            ...field,
            publicValue: fmr,
            discrepancy: `Stated $${field.value}/mo vs HUD FMR $${fmr}/mo for ZIP ${zip} (${pctDiff > 0 ? "+" : ""}${pctDiff.toFixed(0)}%)`,
          };
          crossReferences.push({
            fieldPath: field.fieldPath,
            label: field.label,
            extractedValue: field.value,
            publicValue: fmr,
            source: "HUD Fair Market Rent",
            severity: Math.abs(pctDiff) > 25 ? "warning" : "info",
            recommendation: "Compare against local market comps",
          });
        }
      }
    }
  }

  return { fields: enrichedFields, crossReferences };
}

// ─── Data Source Stubs ─────────────────────────────────────
// These will be replaced with actual API calls

async function getCurrentMortgageRate(): Promise<number | null> {
  // TODO: integrate FreeSources.getMortgageRate() from scrapers service
  // For now return a reasonable current rate
  return 7.1;
}

async function lookupPropertyTax(zip: string): Promise<number | null> {
  // TODO: integrate ScraperRegistry.lookupTax() from scrapers service
  return null;
}

async function getFairMarketRent(zip: string): Promise<number | null> {
  // TODO: integrate FreeSources.getFairMarketRent() from scrapers service
  return null;
}
