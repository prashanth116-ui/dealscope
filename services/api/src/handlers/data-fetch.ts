/**
 * Individual data source endpoints for manual refresh.
 * GET /data/mortgage-rate
 * GET /data/fair-market-rent?zip=XXXXX
 * GET /data/demographics?zip=XXXXX
 * GET /data/flood-zone?lat=X&lng=Y
 * GET /data/unemployment?zip=XXXXX
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { FreeSources } from "@dealscope/scrapers";
import { lookupFips } from "@dealscope/scrapers";

const FRED_KEY = process.env.FRED_API_KEY ?? "";
const CENSUS_KEY = process.env.CENSUS_API_KEY ?? "";
const BLS_KEY = process.env.BLS_API_KEY ?? "";

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
    const path = event.path;
    const params = event.queryStringParameters ?? {};

    if (path.endsWith("/mortgage-rate")) {
      const result = await FreeSources.getMortgageRate(FRED_KEY);
      return jsonResponse(200, result);
    }

    if (path.endsWith("/fair-market-rent")) {
      const zip = params.zip;
      if (!zip) return jsonResponse(400, { error: "zip required" });
      const result = await FreeSources.getFairMarketRent(zip);
      return jsonResponse(200, result);
    }

    if (path.endsWith("/demographics")) {
      const zip = params.zip;
      if (!zip) return jsonResponse(400, { error: "zip required" });
      const result = await FreeSources.getDemographics(zip, CENSUS_KEY);
      return jsonResponse(200, result);
    }

    if (path.endsWith("/flood-zone")) {
      const lat = parseFloat(params.lat ?? "");
      const lng = parseFloat(params.lng ?? "");
      if (isNaN(lat) || isNaN(lng)) {
        return jsonResponse(400, { error: "lat and lng required" });
      }
      const result = await FreeSources.getFloodZone(lat, lng);
      return jsonResponse(200, result);
    }

    if (path.endsWith("/unemployment")) {
      const zip = params.zip;
      if (!zip) return jsonResponse(400, { error: "zip required" });
      const fips = lookupFips(zip);
      if (!fips) return jsonResponse(404, { error: `No FIPS mapping for ZIP ${zip}` });
      const result = await FreeSources.getUnemploymentRate(fips.countyFips, BLS_KEY);
      return jsonResponse(200, result);
    }

    return jsonResponse(404, { error: "Unknown data endpoint" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
}
