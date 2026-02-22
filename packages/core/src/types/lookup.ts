/**
 * Data lookup types — auto-fetched from free US public APIs.
 */

export interface MortgageRateResult {
  rate: number;
  date: string;
  source: "FRED";
}

export interface FairMarketRentResult {
  efficiency: number;
  oneBed: number;
  twoBed: number;
  threeBed: number;
  fourBed: number;
  year: number;
  source: "HUD";
}

export interface DemographicsResult {
  medianIncome: number;
  population: number;
  medianAge: number;
  medianHomeValue: number;
  medianGrossRent: number;
  vacancyRate: number;
  source: "Census ACS";
}

export interface FloodZoneResult {
  zone: string;
  sfha: boolean;
  subtype: string;
  baseFloodElevation?: number;
  source: "FEMA";
}

export interface UnemploymentResult {
  rate: number;
  period: string;
  source: "BLS";
}

export interface PropertyLookupResult {
  mortgageRate: MortgageRateResult;
  fairMarketRent: FairMarketRentResult;
  demographics: DemographicsResult;
  floodZone: FloodZoneResult;
  unemployment: UnemploymentResult;
}

export interface FipsEntry {
  stateFips: string;
  countyFips: string;
  countyName: string;
  stateAbbr: string;
}
