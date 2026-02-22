/**
 * Lambda handler: Extract data from uploaded document.
 *
 * POST /extract
 * Body: { documentId: string, documentType: DocumentType, s3Key: string, zip?: string }
 * Returns: ExtractionResult
 *
 * Flow:
 * 1. Fetch PDF from S3
 * 2. Convert pages to images
 * 3. Send to Claude API with vision for extraction
 * 4. Parse response into typed fields
 * 5. Cross-reference against public data
 * 6. Return enriched extraction result
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type { DocumentType } from "@dealscope/core";
import { extractFromDocument } from "../extraction/extractor";

// In production: import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const VALID_DOC_TYPES: DocumentType[] = [
  "offering_memorandum",
  "rent_roll",
  "trailing_12",
];

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { documentId, documentType, s3Key, zip } = body;

    if (!documentId || !s3Key) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "documentId and s3Key are required" }),
      };
    }

    if (!VALID_DOC_TYPES.includes(documentType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid documentType" }),
      };
    }

    // In production:
    // 1. Fetch PDF from S3
    // const s3 = new S3Client({});
    // const { Body } = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: s3Key }));
    // const pdfBuffer = await Body.transformToByteArray();
    //
    // 2. Convert PDF pages to images (use pdf-to-img or similar)
    // const pageImages = await pdfToImages(pdfBuffer);
    //
    // For now, return a placeholder indicating the pipeline is set up

    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          fields: [],
          assembled: {},
          warnings: [
            "Extraction pipeline configured but ANTHROPIC_API_KEY not set.",
            "Set ANTHROPIC_API_KEY and configure S3 to enable extraction.",
          ],
        }),
      };
    }

    // With API key configured, run extraction
    const pageImages: string[] = []; // TODO: PDF → image conversion
    const result = await extractFromDocument({
      documentId,
      documentType,
      pageImages,
      zip,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      statusCode: 500,
      body: JSON.stringify({ error: message }),
    };
  }
}
