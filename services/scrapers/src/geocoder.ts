/**
 * Geocoding utility — convert address to lat/lng/county FIPS.
 * Uses Google Geocoding API for lat/lng resolution.
 * For FIPS, falls back to embedded lookup if available.
 */

import { lookupFips } from "./fips-lookup";

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  zip?: string;
  county?: string;
  state?: string;
}

/**
 * Geocode an address using Google Geocoding API.
 */
export async function geocodeAddress(
  address: string,
  apiKey: string
): Promise<GeocodeResult | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Geocoding error: ${res.status}`);
  const data = (await res.json()) as {
    results?: {
      geometry: { location: { lat: number; lng: number } };
      formatted_address: string;
      address_components: { long_name: string; short_name: string; types: string[] }[];
    }[];
  };

  const result = data.results?.[0];
  if (!result) return null;

  const location = result.geometry.location;
  const components = result.address_components;

  let zip: string | undefined;
  let county: string | undefined;
  let state: string | undefined;

  for (const c of components) {
    if (c.types.includes("postal_code")) zip = c.long_name;
    if (c.types.includes("administrative_area_level_2")) county = c.long_name;
    if (c.types.includes("administrative_area_level_1")) state = c.short_name;
  }

  return {
    lat: location.lat,
    lng: location.lng,
    formattedAddress: result.formatted_address,
    zip,
    county,
    state,
  };
}

/**
 * Get county FIPS code from a ZIP, using embedded lookup.
 * Falls back to null if not found.
 */
export function getCountyFromZip(zip: string) {
  return lookupFips(zip);
}
