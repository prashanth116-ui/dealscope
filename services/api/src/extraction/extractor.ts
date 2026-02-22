/**
 * Document extraction via Claude API with vision.
 *
 * Flow: S3 PDF → pages as images → Claude vision API → structured JSON → parsed fields
 */

import type { DocumentType, ExtractionResult } from "@dealscope/core";
import { EXTRACTION_PROMPTS } from "./prompts";
import { parseExtractionResponse } from "./parser";
import { crossReferenceFields } from "./validator";

interface ExtractionOptions {
  documentId: string;
  documentType: DocumentType;
  /** Base64-encoded page images from PDF */
  pageImages: string[];
  /** ZIP code for cross-reference lookups */
  zip?: string;
}

/**
 * Extract structured data from document images using Claude API.
 */
export async function extractFromDocument(
  options: ExtractionOptions
): Promise<ExtractionResult> {
  const { documentId, documentType, pageImages, zip } = options;

  const prompt = EXTRACTION_PROMPTS[documentType];

  // Build Claude API request with vision
  const imageContent = pageImages.map((img) => ({
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: "image/png" as const,
      data: img,
    },
  }));

  const requestBody = {
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: [
          ...imageContent,
          { type: "text", text: prompt },
        ],
      },
    ],
  };

  // Call Claude API
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      documentId,
      fields: [],
      assembled: {},
      warnings: ["ANTHROPIC_API_KEY not configured"],
    };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    return {
      documentId,
      fields: [],
      assembled: {},
      warnings: [`Claude API error: ${response.status} - ${errText}`],
    };
  }

  const result: any = await response.json();
  const textBlock = result.content?.find((c: any) => c.type === "text");
  const rawJson = textBlock?.text ?? "";

  // Parse extraction response
  const extraction = parseExtractionResponse(documentId, rawJson);

  // Cross-reference with public data
  const { fields: enrichedFields, crossReferences } = await crossReferenceFields(
    extraction.fields,
    zip
  );

  return {
    ...extraction,
    fields: enrichedFields,
    warnings: [
      ...extraction.warnings,
      ...crossReferences
        .filter((cr) => cr.severity === "warning" || cr.severity === "error")
        .map((cr) => `${cr.label}: ${cr.recommendation}`),
    ],
  };
}
