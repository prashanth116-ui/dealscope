/**
 * Analysis CRUD endpoints.
 * POST   /analyses           — Create analysis
 * GET    /analyses            — List user's analyses
 * GET    /analyses/{id}       — Get full analysis
 * PUT    /analyses/{id}       — Update analysis
 * DELETE /analyses/{id}       — Soft delete
 * PUT    /analyses/{id}/status — Update deal status
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { analyzeProperty } from "@dealscope/core";
import type { AnalysisInput } from "@dealscope/core";
import { requireAuth, AuthError } from "../lib/auth";
import { putItem, getItem, queryByPK, updateStatus, deleteItem } from "../lib/dynamo";
import { randomUUID } from "crypto";

function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = requireAuth(event);
    const method = event.httpMethod;
    const id = event.pathParameters?.id;
    const path = event.path;

    // PUT /analyses/{id}/status
    if (method === "PUT" && id && path.endsWith("/status")) {
      const body = JSON.parse(event.body || "{}");
      const status = body.status;
      if (!status) return jsonResponse(400, { error: "Missing status" });

      const validStatuses = ["Analyzing", "Offered", "Under Contract", "Closed", "Passed"];
      if (!validStatuses.includes(status)) {
        return jsonResponse(400, { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }

      await updateStatus(`USER#${userId}`, `ANALYSIS#${id}`, status);
      return jsonResponse(200, { id, status });
    }

    // POST /analyses — Create
    if (method === "POST" && !id) {
      const input: AnalysisInput = JSON.parse(event.body || "{}");
      const results = analyzeProperty(input);
      const analysisId = randomUUID();
      const now = new Date().toISOString();

      const address = [
        input.property.address.street,
        input.property.address.city,
        input.property.address.state,
        input.property.address.zip,
      ]
        .filter(Boolean)
        .join(", ");

      await putItem({
        PK: `USER#${userId}`,
        SK: `ANALYSIS#${analysisId}`,
        id: analysisId,
        userId,
        address,
        units: input.property.units,
        askingPrice: input.property.askingPrice,
        capRate: results.capRate.mid,
        cashOnCash: results.cashOnCash.mid,
        monthlyCashFlow: results.monthlyCashFlow.mid,
        status: "Analyzing",
        input,
        results,
        createdAt: now,
        updatedAt: now,
      });

      return jsonResponse(201, { id: analysisId });
    }

    // GET /analyses — List
    if (method === "GET" && !id) {
      const items = await queryByPK(`USER#${userId}`, "ANALYSIS#");

      const summaries = items
        .filter((item) => item.status !== "deleted")
        .map((item) => ({
          id: item.id,
          address: item.address,
          units: item.units,
          askingPrice: item.askingPrice,
          capRate: item.capRate,
          cashOnCash: item.cashOnCash,
          monthlyCashFlow: item.monthlyCashFlow,
          status: item.status,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));

      return jsonResponse(200, summaries);
    }

    // GET /analyses/{id} — Get full
    if (method === "GET" && id) {
      const item = await getItem(`USER#${userId}`, `ANALYSIS#${id}`);
      if (!item || item.status === "deleted") {
        return jsonResponse(404, { error: "Analysis not found" });
      }

      return jsonResponse(200, {
        id: item.id,
        input: item.input,
        results: item.results,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    }

    // PUT /analyses/{id} — Update
    if (method === "PUT" && id) {
      const input: AnalysisInput = JSON.parse(event.body || "{}");
      const results = analyzeProperty(input);
      const now = new Date().toISOString();

      // Fetch existing to preserve metadata
      const existing = await getItem(`USER#${userId}`, `ANALYSIS#${id}`);
      if (!existing || existing.status === "deleted") {
        return jsonResponse(404, { error: "Analysis not found" });
      }

      const address = [
        input.property.address.street,
        input.property.address.city,
        input.property.address.state,
        input.property.address.zip,
      ]
        .filter(Boolean)
        .join(", ");

      await putItem({
        ...existing,
        address,
        units: input.property.units,
        askingPrice: input.property.askingPrice,
        capRate: results.capRate.mid,
        cashOnCash: results.cashOnCash.mid,
        monthlyCashFlow: results.monthlyCashFlow.mid,
        input,
        results,
        updatedAt: now,
      });

      return jsonResponse(200, { id });
    }

    // DELETE /analyses/{id} — Soft delete
    if (method === "DELETE" && id) {
      await updateStatus(`USER#${userId}`, `ANALYSIS#${id}`, "deleted");
      return jsonResponse(200, { id, deleted: true });
    }

    return jsonResponse(405, { error: "Method not allowed" });
  } catch (err) {
    if (err instanceof AuthError) {
      return jsonResponse(401, { error: err.message });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
}
