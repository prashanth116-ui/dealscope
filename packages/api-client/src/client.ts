import type { AnalysisInput, AnalysisResults } from "@dealscope/core";

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

  async getAnalysis(id: string): Promise<AnalysisResults> {
    return this.request(`/analyses/${id}`);
  }

  async listAnalyses(): Promise<{ id: string; address: string; createdAt: string }[]> {
    return this.request("/analyses");
  }

  async deleteAnalysis(id: string): Promise<void> {
    await this.request(`/analyses/${id}`, { method: "DELETE" });
  }

  // --- Data Lookup ---

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
