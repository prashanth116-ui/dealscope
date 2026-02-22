import type { CountyAdapter, PropertyRecord, TaxRecord } from "./types";

/**
 * Central registry for county-level data adapters.
 * Adapters are registered by county key (e.g. "39-113" for Montgomery County, OH).
 */
export class ScraperRegistry {
  private adapters = new Map<string, CountyAdapter>();

  register(adapter: CountyAdapter): void {
    const key = `${adapter.stateFips}-${adapter.countyFips}`;
    this.adapters.set(key, adapter);
  }

  getAdapter(stateFips: string, countyFips: string): CountyAdapter | undefined {
    return this.adapters.get(`${stateFips}-${countyFips}`);
  }

  listAdapters(): CountyAdapter[] {
    return Array.from(this.adapters.values());
  }

  async lookupProperty(
    stateFips: string,
    countyFips: string,
    address: string
  ): Promise<PropertyRecord | null> {
    const adapter = this.getAdapter(stateFips, countyFips);
    if (!adapter) return null;
    return adapter.lookupByAddress(address);
  }

  async lookupTax(
    stateFips: string,
    countyFips: string,
    parcelId: string
  ): Promise<TaxRecord | null> {
    const adapter = this.getAdapter(stateFips, countyFips);
    if (!adapter) return null;
    return adapter.lookupTax(parcelId);
  }
}
