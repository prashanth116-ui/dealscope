/**
 * Parse and normalize raw Claude extraction output into typed ExtractionResult.
 */

import type { ExtractedField, ExtractionResult } from "@dealscope/core";
import type { DocumentType, AnalysisInput } from "@dealscope/core";

interface RawExtractionResponse {
  fields: Array<{
    fieldPath: string;
    label: string;
    value: unknown;
    confidence: number;
    sourceLocation?: string;
  }>;
  assembled: Record<string, unknown>;
  warnings: string[];
}

/**
 * Parse the raw JSON string from Claude into a typed ExtractionResult.
 */
export function parseExtractionResponse(
  documentId: string,
  rawJson: string
): ExtractionResult {
  let parsed: RawExtractionResponse;

  try {
    // Claude sometimes wraps in markdown code blocks
    const cleaned = rawJson
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return {
      documentId,
      fields: [],
      assembled: {},
      warnings: ["Failed to parse extraction response as JSON"],
    };
  }

  // Normalize fields
  const fields: ExtractedField[] = (parsed.fields ?? [])
    .filter((f) => f.value != null)
    .map((f) => ({
      fieldPath: String(f.fieldPath),
      label: String(f.label),
      value: typeof f.value === "number" ? f.value : String(f.value),
      confidence: clampConfidence(f.confidence),
      sourceLocation: f.sourceLocation ? String(f.sourceLocation) : undefined,
    }));

  // Build assembled partial input
  const assembled = buildAssembledInput(parsed.assembled);

  return {
    documentId,
    fields,
    assembled,
    warnings: parsed.warnings ?? [],
  };
}

function clampConfidence(c: unknown): number {
  const n = Number(c);
  if (isNaN(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

/**
 * Map raw assembled object to Partial<AnalysisInput>.
 */
function buildAssembledInput(
  raw: Record<string, unknown>
): Partial<AnalysisInput> {
  const result: Partial<AnalysisInput> = {};

  if (raw.property && typeof raw.property === "object") {
    const p = raw.property as Record<string, unknown>;
    result.property = {
      address: {
        street: String(p.address && (p.address as any).street || ""),
        city: String(p.address && (p.address as any).city || ""),
        state: String(p.address && (p.address as any).state || ""),
        zip: String(p.address && (p.address as any).zip || ""),
      },
      type: (p.type as any) ?? "multifamily",
      units: Number(p.units) || 0,
      buildingSqft: Number(p.buildingSqft) || 0,
      yearBuilt: Number(p.yearBuilt) || 0,
      askingPrice: Number(p.askingPrice) || 0,
      photos: [],
    };
  }

  return result;
}
