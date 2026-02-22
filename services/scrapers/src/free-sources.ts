/**
 * Free federal / public data source clients.
 * Each method returns structured data from a public API.
 * All APIs are free and work for the entire US.
 */

import type {
  MortgageRateResult,
  FairMarketRentResult,
  DemographicsResult,
  FloodZoneResult,
  UnemploymentResult,
} from "@dealscope/core";

export class FreeSources {
  /**
   * FRED API — fetch current 30-year fixed mortgage rate.
   * https://fred.stlouisfed.org/docs/api/
   */
  static async getMortgageRate(apiKey: string): Promise<MortgageRateResult> {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&sort_order=desc&limit=1&api_key=${apiKey}&file_type=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FRED API error: ${res.status}`);
    const data = (await res.json()) as { observations: { value: string; date: string }[] };
    const obs = data.observations[0];
    return {
      rate: parseFloat(obs.value),
      date: obs.date,
      source: "FRED",
    };
  }

  /**
   * HUD Fair Market Rents — get FMR by ZIP code.
   * https://www.huduser.gov/portal/dataset/fmr-api.html
   * No API key needed.
   */
  static async getFairMarketRent(
    zip: string,
    year: number = new Date().getFullYear()
  ): Promise<FairMarketRentResult> {
    const url = `https://www.huduser.gov/hudapi/public/fmr/data/${zip}?year=${year}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HUD API error: ${res.status}`);
    const data = (await res.json()) as { data?: { basicdata?: Record<string, number> } };
    const bd = data.data?.basicdata ?? {};
    return {
      efficiency: bd.Efficiency ?? bd.efficiency ?? 0,
      oneBed: bd.One_Bedroom ?? bd.one_bedroom ?? 0,
      twoBed: bd.Two_Bedroom ?? bd.two_bedroom ?? 0,
      threeBed: bd.Three_Bedroom ?? bd.three_bedroom ?? 0,
      fourBed: bd.Four_Bedroom ?? bd.four_bedroom ?? 0,
      year,
      source: "HUD",
    };
  }

  /**
   * Census ACS 5-year — multiple demographic variables for a ZIP code.
   * Variables: B19013_001E (median income), B01003_001E (population),
   * B01002_001E (median age), B25077_001E (median home value),
   * B25064_001E (median gross rent), B25002_002E (occupied), B25002_003E (vacant)
   */
  static async getDemographics(
    zip: string,
    apiKey: string
  ): Promise<DemographicsResult> {
    const variables = [
      "B19013_001E", // median income
      "B01003_001E", // population
      "B01002_001E", // median age
      "B25077_001E", // median home value
      "B25064_001E", // median gross rent
      "B25002_002E", // occupied housing units
      "B25002_003E", // vacant housing units
    ].join(",");

    const url = `https://api.census.gov/data/2023/acs/acs5?get=${variables}&for=zip%20code%20tabulation%20area:${zip}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Census API error: ${res.status}`);
    const data = (await res.json()) as string[][];

    // data[0] is headers, data[1] is values
    const row = data?.[1];
    if (!row) throw new Error(`No Census data for ZIP ${zip}`);

    const medianIncome = parseInt(row[0], 10) || 0;
    const population = parseInt(row[1], 10) || 0;
    const medianAge = parseFloat(row[2]) || 0;
    const medianHomeValue = parseInt(row[3], 10) || 0;
    const medianGrossRent = parseInt(row[4], 10) || 0;
    const occupied = parseInt(row[5], 10) || 0;
    const vacant = parseInt(row[6], 10) || 0;
    const total = occupied + vacant;
    const vacancyRate = total > 0 ? (vacant / total) * 100 : 0;

    return {
      medianIncome,
      population,
      medianAge,
      medianHomeValue,
      medianGrossRent,
      vacancyRate: Math.round(vacancyRate * 10) / 10,
      source: "Census ACS",
    };
  }

  /**
   * FEMA National Flood Hazard Layer — query flood zone for a lat/lng.
   * Uses the FEMA NFHL ArcGIS REST API. No API key needed.
   */
  static async getFloodZone(
    lat: number,
    lng: number
  ): Promise<FloodZoneResult> {
    const geometry = JSON.stringify({ x: lng, y: lat });
    const url = new URL(
      "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query"
    );
    url.searchParams.set("geometry", geometry);
    url.searchParams.set("geometryType", "esriGeometryPoint");
    url.searchParams.set("inSR", "4326");
    url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
    url.searchParams.set("outFields", "FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE");
    url.searchParams.set("returnGeometry", "false");
    url.searchParams.set("f", "json");

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`FEMA API error: ${res.status}`);
    const data = (await res.json()) as {
      features?: { attributes: Record<string, string> }[];
    };

    const feature = data.features?.[0]?.attributes;
    if (!feature) {
      return { zone: "X", sfha: false, subtype: "AREA OF MINIMAL FLOOD HAZARD", source: "FEMA" };
    }

    return {
      zone: feature.FLD_ZONE ?? "X",
      sfha: feature.SFHA_TF === "T",
      subtype: feature.ZONE_SUBTY ?? "",
      baseFloodElevation: feature.STATIC_BFE ? parseFloat(feature.STATIC_BFE) : undefined,
      source: "FEMA",
    };
  }

  /**
   * BLS — county unemployment rate.
   * areaCode should be the county FIPS code (5 digits: state + county).
   */
  static async getUnemploymentRate(
    areaCode: string,
    apiKey: string
  ): Promise<UnemploymentResult> {
    // Pad to 5 digits
    const padded = areaCode.padStart(5, "0");
    const seriesId = `LAUCN${padded}0000000003`;

    const url = "https://api.bls.gov/publicAPI/v2/timeseries/data/";
    const currentYear = new Date().getFullYear();
    const body = {
      seriesid: [seriesId],
      startyear: String(currentYear - 1),
      endyear: String(currentYear),
      registrationkey: apiKey,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`BLS API error: ${res.status}`);

    const data = (await res.json()) as {
      Results?: { series?: { data?: { value: string; periodName: string; year: string }[] }[] };
    };
    const series = data?.Results?.series?.[0]?.data;
    if (!series?.[0]) throw new Error(`No BLS data for area ${areaCode}`);

    const latest = series[0];
    return {
      rate: parseFloat(latest.value),
      period: `${latest.periodName} ${latest.year}`,
      source: "BLS",
    };
  }
}
