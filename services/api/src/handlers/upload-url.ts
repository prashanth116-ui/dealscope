/**
 * Lambda handler: Generate S3 presigned PUT URL for document upload.
 *
 * POST /upload-url
 * Body: { fileName: string, documentType: DocumentType, contentType: string }
 * Returns: { uploadUrl: string, documentId: string, key: string }
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type { DocumentType } from "@dealscope/core";

// In production: import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.DOCUMENTS_BUCKET ?? "dealscope-documents";
const URL_EXPIRY = 300; // 5 minutes

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
    const { fileName, documentType, contentType } = body;

    if (!fileName || typeof fileName !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "fileName is required" }),
      };
    }

    if (!VALID_DOC_TYPES.includes(documentType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `documentType must be one of: ${VALID_DOC_TYPES.join(", ")}`,
        }),
      };
    }

    if (contentType !== "application/pdf") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Only PDF files are supported" }),
      };
    }

    const documentId = generateDocumentId();
    const key = `uploads/${documentId}/${sanitizeFileName(fileName)}`;

    // In production: generate presigned URL
    // const s3 = new S3Client({});
    // const command = new PutObjectCommand({
    //   Bucket: BUCKET,
    //   Key: key,
    //   ContentType: contentType,
    //   Metadata: { documentType, originalFileName: fileName },
    // });
    // const uploadUrl = await getSignedUrl(s3, command, { expiresIn: URL_EXPIRY });

    // Placeholder until S3 is configured
    const uploadUrl = `https://${BUCKET}.s3.amazonaws.com/${key}?presigned=placeholder`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadUrl,
        documentId,
        key,
        expiresIn: URL_EXPIRY,
      }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      statusCode: 500,
      body: JSON.stringify({ error: message }),
    };
  }
}

function generateDocumentId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `doc_${timestamp}_${random}`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 100);
}
