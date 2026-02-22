export interface TaxRecord {
  parcelId: string;
  annualTax: number;
  assessedValue: number;
  marketValue?: number;
  taxYear: number;
}

export interface PropertyRecord {
  address: string;
  parcelId?: string;
  yearBuilt?: number;
  sqft?: number;
  lotSize?: number;
  units?: number;
  zoning?: string;
  lastSaleDate?: string;
  lastSalePrice?: number;
}

/**
 * Each county implements this interface.
 * The registry routes lookups to the correct adapter by state + county FIPS.
 */
export interface CountyAdapter {
  /** e.g. "montgomery-oh" */
  id: string;
  /** Human-readable name */
  name: string;
  /** State FIPS code */
  stateFips: string;
  /** County FIPS code */
  countyFips: string;

  lookupByAddress(address: string): Promise<PropertyRecord | null>;
  lookupTax(parcelId: string): Promise<TaxRecord | null>;
}
