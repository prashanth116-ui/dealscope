"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "@/lib/wizard-context";
import { StepIndicator } from "@/components/step-indicator";
import { CurrencyInput } from "@/components/currency-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, Upload } from "lucide-react";
import type { PropertyType, PropertyLookupResult } from "@dealscope/core";

const PROPERTY_TYPES: { label: string; value: PropertyType }[] = [
  { label: "Multifamily", value: "multifamily" },
  { label: "Retail", value: "retail" },
  { label: "Office", value: "office" },
  { label: "Industrial", value: "industrial" },
  { label: "Mixed Use", value: "mixed" },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.dealscope.app";

export default function NewAnalysisPage() {
  const { state, dispatch } = useWizard();
  const router = useRouter();
  const p = state.property;

  const [fetchedData, setFetchedData] = useState<PropertyLookupResult | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const setField = (field: string, value: string | number) => {
    dispatch({ type: "SET_PROPERTY", property: { [field]: value } });
  };

  const setAddress = (field: string, value: string) => {
    dispatch({
      type: "SET_PROPERTY",
      property: {
        address: { ...{ street: "", city: "", state: "", zip: "" }, ...p.address, [field]: value },
      },
    });
  };

  const canContinue = p.address?.street && p.units && p.units > 0 && p.askingPrice && p.askingPrice > 0;
  const canFetch = p.address?.zip && p.address.zip.length === 5;

  const handleFetchData = async () => {
    if (!canFetch) return;
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_BASE}/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip: p.address!.zip }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data: PropertyLookupResult = await res.json();
      setFetchedData(data);
      if (data.mortgageRate.rate > 0) {
        dispatch({
          type: "SET_FINANCING",
          financing: { ...state.financing, interestRate: data.mortgageRate.rate },
        });
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setFetching(false);
    }
  };

  const handleContinue = () => {
    if (!canContinue) return;
    dispatch({
      type: "SET_FINANCING",
      financing: {
        ...state.financing,
        purchasePrice: p.askingPrice!,
        closingCosts: p.askingPrice! * 0.03,
      },
    });
    dispatch({ type: "SET_STEP", step: 2 });
    router.push("/analysis/rent-roll");
  };

  return (
    <div>
      <StepIndicator current={1} />

      {/* Upload banner */}
      <button
        className="w-full bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex items-center justify-center gap-2 text-sm text-primary hover:bg-primary/10 transition"
        onClick={() => router.push("/analysis/upload")}
      >
        <Upload className="h-4 w-4" />
        Have an OM? Upload for auto-fill
      </button>

      {/* Property Type */}
      <Label>Property Type</Label>
      <div className="flex flex-wrap gap-2 mt-1 mb-4">
        {PROPERTY_TYPES.map((pt) => (
          <Button
            key={pt.value}
            variant={p.type === pt.value ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setField("type", pt.value)}
          >
            {pt.label}
          </Button>
        ))}
      </div>

      {/* Address */}
      <Label>Street Address</Label>
      <Input
        placeholder="123 Main St"
        value={p.address?.street ?? ""}
        onChange={(e) => setAddress("street", e.target.value)}
        className="mb-3 mt-1"
      />

      <div className="grid grid-cols-6 gap-2 mb-3">
        <div className="col-span-3">
          <Label>City</Label>
          <Input
            placeholder="Dayton"
            value={p.address?.city ?? ""}
            onChange={(e) => setAddress("city", e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="col-span-1">
          <Label>State</Label>
          <Input
            placeholder="OH"
            maxLength={2}
            className="mt-1 uppercase"
            value={p.address?.state ?? ""}
            onChange={(e) => setAddress("state", e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <Label>ZIP</Label>
          <Input
            placeholder="45406"
            maxLength={5}
            inputMode="numeric"
            className="mt-1"
            value={p.address?.zip ?? ""}
            onChange={(e) => setAddress("zip", e.target.value)}
          />
        </div>
      </div>

      {/* Fetch Data */}
      <Button
        variant="outline"
        className="w-full mb-3 border-green-600 text-green-700 hover:bg-green-50"
        disabled={!canFetch || fetching}
        onClick={handleFetchData}
      >
        {fetching ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Fetching data for ZIP {p.address?.zip}...
          </>
        ) : (
          "Fetch Property Data"
        )}
      </Button>

      {fetchError && <p className="text-sm text-destructive mb-3">{fetchError}</p>}

      {fetchedData && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-4 text-sm">
          <div className="font-semibold text-green-800 mb-1">Fetched Data</div>
          <div className="text-green-700">
            Mortgage Rate: {fetchedData.mortgageRate.rate.toFixed(2)}% ({fetchedData.mortgageRate.date})
          </div>
        </div>
      )}

      {/* Property Details */}
      <Label>Number of Units</Label>
      <Input
        type="number"
        placeholder="10"
        className="mt-1 mb-3"
        value={p.units ?? ""}
        onChange={(e) => setField("units", parseInt(e.target.value) || 0)}
      />

      <Label>Asking Price</Label>
      <CurrencyInput
        placeholder="$450,000"
        value={p.askingPrice ? String(p.askingPrice) : ""}
        onChangeValue={(v) => setField("askingPrice", parseFloat(v) || 0)}
        className="mt-1 mb-3"
      />

      <Label>Building Sqft</Label>
      <Input
        type="number"
        placeholder="5,986"
        className="mt-1 mb-3"
        value={p.buildingSqft ?? ""}
        onChange={(e) => setField("buildingSqft", parseInt(e.target.value) || 0)}
      />

      <Label>Year Built</Label>
      <Input
        type="number"
        placeholder="1965"
        maxLength={4}
        className="mt-1 mb-6"
        value={p.yearBuilt ?? ""}
        onChange={(e) => setField("yearBuilt", parseInt(e.target.value) || 0)}
      />

      <Button className="w-full" disabled={!canContinue} onClick={handleContinue}>
        Continue
      </Button>
    </div>
  );
}
