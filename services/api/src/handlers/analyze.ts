import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { analyzeProperty } from "@dealscope/core";
import type { AnalysisInput } from "@dealscope/core";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    if (event.httpMethod === "POST") {
      const input: AnalysisInput = JSON.parse(event.body || "{}");
      const results = analyzeProperty(input);

      // TODO: persist to DynamoDB

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(results),
      };
    }

    if (event.httpMethod === "GET") {
      const id = event.pathParameters?.id;
      if (!id) {
        return { statusCode: 400, body: "Missing analysis ID" };
      }

      // TODO: fetch from DynamoDB
      return {
        statusCode: 501,
        body: JSON.stringify({ message: "Not yet implemented" }),
      };
    }

    return { statusCode: 405, body: "Method not allowed" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      statusCode: 500,
      body: JSON.stringify({ error: message }),
    };
  }
}
