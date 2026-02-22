/**
 * Auth helpers — extract userId from Cognito authorizer claims.
 */

import type { APIGatewayProxyEvent } from "aws-lambda";

export function getUserId(event: APIGatewayProxyEvent): string | null {
  // API Gateway Cognito authorizer passes claims in requestContext
  const claims = event.requestContext?.authorizer?.claims;
  if (claims?.sub) return claims.sub as string;

  // Fallback: check Authorization header for testing
  const authHeader = event.headers?.Authorization ?? event.headers?.authorization;
  if (authHeader?.startsWith("Bearer test-")) {
    return authHeader.replace("Bearer test-", "");
  }

  return null;
}

export function requireAuth(event: APIGatewayProxyEvent): string {
  const userId = getUserId(event);
  if (!userId) {
    throw new AuthError("Unauthorized");
  }
  return userId;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
