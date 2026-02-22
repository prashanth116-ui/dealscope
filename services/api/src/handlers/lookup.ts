import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const address = event.queryStringParameters?.address;
  if (!address) {
    return { statusCode: 400, body: "Missing address parameter" };
  }

  // TODO: call scraper services, aggregate data
  return {
    statusCode: 501,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Property lookup not yet implemented",
      address,
    }),
  };
}
