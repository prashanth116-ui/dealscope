/**
 * Document upload and AI extraction types.
 */

import type { AnalysisInput } from "./property";

// ─── Document Upload ─────────────────────────────────────────

export type DocumentType = "offering_memorandum" | "rent_roll" | "trailing_12";

export type DocumentStatus = "uploading" | "processing" | "complete" | "error";

export interface DocumentUpload {
  id: string;
  fileName: string;
  documentType: DocumentType;
  status: DocumentStatus;
  uploadedAt: string;
  pageCount?: number;
  errorMessage?: string;
}

// ─── Extraction ──────────────────────────────────────────────

export interface ExtractedField {
  /** Dot-notated path into AnalysisInput (e.g. "property.units") */
  fieldPath: string;
  /** Human-readable label */
  label: string;
  /** Extracted value */
  value: string | number;
  /** Confidence score 0-1 */
  confidence: number;
  /** Page + location in document */
  sourceLocation?: string;
  /** Value from public data source for cross-reference */
  publicValue?: string | number;
  /** Description of discrepancy if publicValue differs */
  discrepancy?: string;
}

export interface ExtractionResult {
  documentId: string;
  fields: ExtractedField[];
  /** Pre-assembled partial input from extracted fields */
  assembled: Partial<AnalysisInput>;
  warnings: string[];
}

// ─── Validation / Cross-Reference ───────────────────────────

export type ValidationSeverity = "info" | "warning" | "error";

export interface CrossReferenceResult {
  fieldPath: string;
  label: string;
  extractedValue: string | number;
  publicValue: string | number;
  source: string;
  severity: ValidationSeverity;
  recommendation: string;
}
