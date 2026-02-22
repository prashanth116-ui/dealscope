import type { AnalysisInput, AnalysisResults, PropertyLookupResult } from "@dealscope/core";

export type DealStatus = "Analyzing" | "Offered" | "Under Contract" | "Closed" | "Passed";

export interface AnalysisSummary {
  id: string;
  address: string;
  units: number;
  askingPrice: number;
  capRate: number;
  cashOnCash: number;
  monthlyCashFlow: number;
  status: DealStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface SavedAnalysis {
  id: string;
  input: AnalysisInput;
  results: AnalysisResults;
  status: DealStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ClientConfig {
  baseUrl: string;
  getToken: () => Promise<string | null>;
}

export class DealScopeClient {
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.config.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${this.config.baseUrl}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API ${res.status}: ${body}`);
    }

    return res.json();
  }

  // --- Analyses ---

  async createAnalysis(input: AnalysisInput): Promise<{ id: string }> {
    return this.request("/analyses", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async getAnalysis(id: string): Promise<SavedAnalysis> {
    return this.request(`/analyses/${id}`);
  }

  async listAnalyses(status?: DealStatus): Promise<AnalysisSummary[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request(`/analyses${query}`);
  }

  async updateAnalysis(id: string, input: AnalysisInput): Promise<void> {
    await this.request(`/analyses/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  async updateStatus(id: string, status: DealStatus): Promise<void> {
    await this.request(`/analyses/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async deleteAnalysis(id: string): Promise<void> {
    await this.request(`/analyses/${id}`, { method: "DELETE" });
  }

  // --- Data Lookup ---

  async lookupByZip(zip: string, lat?: number, lng?: number): Promise<PropertyLookupResult> {
    return this.request("/lookup", {
      method: "POST",
      body: JSON.stringify({ zip, lat, lng }),
    });
  }

  async getMortgageRate(): Promise<{ rate: number; date: string }> {
    return this.request("/data/mortgage-rate");
  }

  async getFairMarketRent(zip: string): Promise<Record<string, number>> {
    return this.request(`/data/fair-market-rent?zip=${zip}`);
  }

  async getDemographics(zip: string): Promise<Record<string, number>> {
    return this.request(`/data/demographics?zip=${zip}`);
  }

  async getFloodZone(lat: number, lng: number): Promise<{ zone: string; sfha: boolean }> {
    return this.request(`/data/flood-zone?lat=${lat}&lng=${lng}`);
  }

  async getUnemployment(zip: string): Promise<{ rate: number; period: string }> {
    return this.request(`/data/unemployment?zip=${zip}`);
  }

  // --- Legacy ---

  async lookupProperty(address: string): Promise<Partial<AnalysisInput>> {
    return this.request(`/lookup?address=${encodeURIComponent(address)}`);
  }

  async lookupTaxes(address: string): Promise<{ annualTax: number; assessedValue: number }> {
    return this.request(`/lookup/taxes?address=${encodeURIComponent(address)}`);
  }

  async lookupRentComps(
    address: string,
    units: number
  ): Promise<{ avgRent: number; range: [number, number] }> {
    return this.request(
      `/lookup/rents?address=${encodeURIComponent(address)}&units=${units}`
    );
  }
}
