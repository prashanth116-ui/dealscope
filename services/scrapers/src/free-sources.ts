/**
 * Free federal / public data source clients.
 * Each method returns structured data from a public API.
 */
export class FreeSources {
  /**
   * FRED API — fetch current mortgage rates, economic indicators.
   * https://fred.stlouisfed.org/docs/api/
   */
  static async getMortgageRate(apiKey: string): Promise<number> {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&sort_order=desc&limit=1&api_key=${apiKey}&file_type=json`;
    const res = await fetch(url);
    const data = await res.json();
    return parseFloat(data.observations[0].value);
  }

  /**
   * HUD Fair Market Rents — get FMR by ZIP.
   * https://www.huduser.gov/portal/dataset/fmr-api.html
   */
  static async getFairMarketRent(
    zip: string,
    year: number = new Date().getFullYear()
  ): Promise<Record<string, number>> {
    const url = `https://www.huduser.gov/hudapi/public/fmr/data/${zip}?year=${year}`;
    const res = await fetch(url);
    const data = await res.json();
    // Returns { efficiency, one_bedroom, two_bedroom, three_bedroom, four_bedroom }
    return data.data?.basicdata ?? {};
  }

  /**
   * Census ACS — median household income by ZIP.
   */
  static async getMedianIncome(
    zip: string,
    apiKey: string
  ): Promise<number | null> {
    const url = `https://api.census.gov/data/2022/acs/acs5?get=B19013_001E&for=zip%20code%20tabulation%20area:${zip}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    const value = data?.[1]?.[0];
    return value ? parseInt(value, 10) : null;
  }

  /**
   * BLS — area unemployment rate.
   */
  static async getUnemploymentRate(
    areaCode: string,
    apiKey: string
  ): Promise<number | null> {
    const url = "https://api.bls.gov/publicAPI/v2/timeseries/data/";
    const body = {
      seriesid: [`LAUCN${areaCode}0000000003`],
      startyear: String(new Date().getFullYear() - 1),
      endyear: String(new Date().getFullYear()),
      registrationkey: apiKey,
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const series = data?.Results?.series?.[0]?.data;
    return series?.[0] ? parseFloat(series[0].value) : null;
  }
}
