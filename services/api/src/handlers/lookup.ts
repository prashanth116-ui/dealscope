/**
 * POST /lookup — Aggregated property data lookup.
 * Fetches in parallel from FRED, HUD, Census, FEMA, BLS with DynamoDB caching.
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type { PropertyLookupResult } from "@dealscope/core";
import { FreeSources } from "@dealscope/scrapers";
import { lookupFips } from "@dealscope/scrapers";
import { getCached, setCache } from "../lib/cache";

// API keys from environment
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
    if (event.httpMethod !== "POST") {
      return jsonResponse(405, { error: "Method not allowed" });
    }

    const body = JSON.parse(event.body || "{}");
    const zip = body.zip ?? body.address?.zip;
    const lat = body.lat as number | undefined;
    const lng = body.lng as number | undefined;

    if (!zip) {
      return jsonResponse(400, { error: "ZIP code required" });
    }

    // Look up county FIPS for BLS
    const fips = lookupFips(zip);
    const countyFips = fips?.countyFips;

    // Fetch all sources in parallel with cache
    const [mortgageRate, fairMarketRent, demographics, floodZone, unemployment] =
      await Promise.allSettled([
        // FRED mortgage rate (TTL: 1 day)
        fetchWithCache("mortgage-rate", "current", () =>
          FreeSources.getMortgageRate(FRED_KEY), 1
        ),
        // HUD FMR (TTL: 365 days)
        fetchWithCache("fmr", zip, () =>
          FreeSources.getFairMarketRent(zip), 365
        ),
        // Census demographics (TTL: 180 days)
        fetchWithCache("demographics", zip, () =>
          FreeSources.getDemographics(zip, CENSUS_KEY), 180
        ),
        // FEMA flood zone (TTL: 90 days)
        lat && lng
          ? fetchWithCache("flood", `${lat},${lng}`, () =>
              FreeSources.getFloodZone(lat, lng), 90
            )
          : Promise.resolve({
              zone: "Unknown",
              sfha: false,
              subtype: "No coordinates provided",
              source: "FEMA" as const,
            }),
        // BLS unemployment (TTL: 30 days)
        countyFips
          ? fetchWithCache("unemployment", countyFips, () =>
              FreeSources.getUnemploymentRate(countyFips, BLS_KEY), 30
            )
          : Promise.resolve({
              rate: 0,
              period: "Unknown",
              source: "BLS" as const,
            }),
      ]);

    const result: PropertyLookupResult = {
      mortgageRate: getSettled(mortgageRate, { rate: 0, date: "", source: "FRED" }),
      fairMarketRent: getSettled(fairMarketRent, {
        efficiency: 0, oneBed: 0, twoBed: 0, threeBed: 0, fourBed: 0,
        year: new Date().getFullYear(), source: "HUD",
      }),
      demographics: getSettled(demographics, {
        medianIncome: 0, population: 0, medianAge: 0,
        medianHomeValue: 0, medianGrossRent: 0, vacancyRate: 0,
        source: "Census ACS",
      }),
      floodZone: getSettled(floodZone, {
        zone: "Unknown", sfha: false, subtype: "", source: "FEMA",
      }),
      unemployment: getSettled(unemployment, {
        rate: 0, period: "", source: "BLS",
      }),
    };

    return jsonResponse(200, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
}

async function fetchWithCache<T>(
  type: string,
  key: string,
  fetcher: () => Promise<T>,
  ttlDays: number
): Promise<T> {
  const cached = await getCached<T>(type, key);
  if (cached) return cached;

  const data = await fetcher();
  // Fire-and-forget cache write
  setCache(type, key, data, ttlDays).catch(() => {});
  return data;
}

function getSettled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}
