#!/usr/bin/env npx tsx
/**
 * Build script: downloads HUD ZIP-to-county crosswalk and generates fips-data.json.
 *
 * Usage:
 *   npx tsx scripts/build-fips.ts
 *
 * The HUD crosswalk file maps ZIP codes to county FIPS codes.
 * Source: https://www.huduser.gov/portal/datasets/usps_crosswalk.html
 *
 * Since the HUD API requires a token, this script generates synthetic
 * coverage from Census ZCTA-to-county relationship files which are public.
 * For production, replace with the actual HUD crosswalk download.
 *
 * This generates data/fips-data.json with ~42K entries.
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";

// State FIPS codes with abbreviations
const STATES: Record<string, { fips: string; abbr: string }> = {
  Alabama: { fips: "01", abbr: "AL" },
  Alaska: { fips: "02", abbr: "AK" },
  Arizona: { fips: "04", abbr: "AZ" },
  Arkansas: { fips: "05", abbr: "AR" },
  California: { fips: "06", abbr: "CA" },
  Colorado: { fips: "08", abbr: "CO" },
  Connecticut: { fips: "09", abbr: "CT" },
  Delaware: { fips: "10", abbr: "DE" },
  Florida: { fips: "12", abbr: "FL" },
  Georgia: { fips: "13", abbr: "GA" },
  Hawaii: { fips: "15", abbr: "HI" },
  Idaho: { fips: "16", abbr: "ID" },
  Illinois: { fips: "17", abbr: "IL" },
  Indiana: { fips: "18", abbr: "IN" },
  Iowa: { fips: "19", abbr: "IA" },
  Kansas: { fips: "20", abbr: "KS" },
  Kentucky: { fips: "21", abbr: "KY" },
  Louisiana: { fips: "22", abbr: "LA" },
  Maine: { fips: "23", abbr: "ME" },
  Maryland: { fips: "24", abbr: "MD" },
  Massachusetts: { fips: "25", abbr: "MA" },
  Michigan: { fips: "26", abbr: "MI" },
  Minnesota: { fips: "27", abbr: "MN" },
  Mississippi: { fips: "28", abbr: "MS" },
  Missouri: { fips: "29", abbr: "MO" },
  Montana: { fips: "30", abbr: "MT" },
  Nebraska: { fips: "31", abbr: "NE" },
  Nevada: { fips: "32", abbr: "NV" },
  "New Hampshire": { fips: "33", abbr: "NH" },
  "New Jersey": { fips: "34", abbr: "NJ" },
  "New Mexico": { fips: "35", abbr: "NM" },
  "New York": { fips: "36", abbr: "NY" },
  "North Carolina": { fips: "37", abbr: "NC" },
  "North Dakota": { fips: "38", abbr: "ND" },
  Ohio: { fips: "39", abbr: "OH" },
  Oklahoma: { fips: "40", abbr: "OK" },
  Oregon: { fips: "41", abbr: "OR" },
  Pennsylvania: { fips: "42", abbr: "PA" },
  "Rhode Island": { fips: "44", abbr: "RI" },
  "South Carolina": { fips: "45", abbr: "SC" },
  "South Dakota": { fips: "46", abbr: "SD" },
  Tennessee: { fips: "47", abbr: "TN" },
  Texas: { fips: "48", abbr: "TX" },
  Utah: { fips: "49", abbr: "UT" },
  Vermont: { fips: "50", abbr: "VT" },
  Virginia: { fips: "51", abbr: "VA" },
  Washington: { fips: "53", abbr: "WA" },
  "West Virginia": { fips: "54", abbr: "WV" },
  Wisconsin: { fips: "55", abbr: "WI" },
  Wyoming: { fips: "56", abbr: "WY" },
  "District of Columbia": { fips: "11", abbr: "DC" },
};

interface FipsEntry {
  stateFips: string;
  countyFips: string;
  countyName: string;
  stateAbbr: string;
}

async function fetchCensusZctaCounty(): Promise<Record<string, FipsEntry>> {
  // Census ZCTA-to-County Relationship File
  // This is a public file with no authentication needed
  const url =
    "https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt";

  console.log("Fetching Census ZCTA-to-County relationship file...");
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Census download failed: ${res.status}`);
  }

  const text = await res.text();
  const lines = text.trim().split("\n");

  // Header: GEOID_ZCTA5_20|GEOID_COUNTY_20|NAMELSAD_COUNTY_20|...
  const header = lines[0].split("|");
  const zctaIdx = header.indexOf("GEOID_ZCTA5_20");
  const countyIdx = header.indexOf("GEOID_COUNTY_20");
  const nameIdx = header.indexOf("NAMELSAD_COUNTY_20");

  if (zctaIdx === -1 || countyIdx === -1) {
    throw new Error("Unexpected Census file format");
  }

  const result: Record<string, FipsEntry> = {};

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("|");
    const zcta = cols[zctaIdx];
    const countyFips = cols[countyIdx]; // 5-digit: stateFips + countyFips
    const countyNameRaw = cols[nameIdx] ?? "";

    if (!zcta || !countyFips || zcta.length !== 5) continue;

    // Only keep the first (primary) county for each ZIP
    if (result[zcta]) continue;

    const stateFips = countyFips.substring(0, 2);
    const countyName = countyNameRaw.replace(/ County$| Parish$| Borough$| Census Area$/, "");

    // Find state abbreviation
    let stateAbbr = "";
    for (const [, info] of Object.entries(STATES)) {
      if (info.fips === stateFips) {
        stateAbbr = info.abbr;
        break;
      }
    }

    if (!stateAbbr) continue;

    result[zcta] = {
      stateFips,
      countyFips,
      countyName,
      stateAbbr,
    };
  }

  return result;
}

async function main() {
  try {
    const data = await fetchCensusZctaCounty();
    const count = Object.keys(data).length;

    const outPath = join(dirname(import.meta.url.replace("file:///", "").replace(/\//g, "\\")), "..", "data", "fips-data.json");
    const outDir = dirname(outPath);

    mkdirSync(outDir, { recursive: true });
    writeFileSync(outPath, JSON.stringify(data));

    console.log(`Generated ${count} ZIP-to-county mappings → ${outPath}`);
    console.log(`File size: ${(JSON.stringify(data).length / 1024).toFixed(0)} KB`);
  } catch (err) {
    console.error("Failed to build FIPS data:", err);
    process.exit(1);
  }
}

main();
