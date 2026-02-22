import type { CountyAdapter, PropertyRecord, TaxRecord } from "../types";

/**
 * Montgomery County, Ohio (FIPS 39-113)
 * Source: Montgomery County Auditor — mcauditor.org
 *
 * TODO: Implement actual HTTP scraping / API calls.
 * This is a scaffold showing the adapter contract.
 */
export const MontgomeryOH: CountyAdapter = {
  id: "montgomery-oh",
  name: "Montgomery County, OH",
  stateFips: "39",
  countyFips: "113",

  async lookupByAddress(address: string): Promise<PropertyRecord | null> {
    // TODO: query mcauditor.org search
    console.log(`[montgomery-oh] lookupByAddress: ${address}`);
    return null;
  },

  async lookupTax(parcelId: string): Promise<TaxRecord | null> {
    // TODO: query mcauditor.org parcel detail
    console.log(`[montgomery-oh] lookupTax: ${parcelId}`);
    return null;
  },
};
