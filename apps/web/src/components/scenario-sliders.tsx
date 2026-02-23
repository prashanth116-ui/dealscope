"use client";

import { useState, useCallback } from "react";
import { Slider } from "./ui/slider";
import type { ScenarioOverrides, AnalysisResults } from "@dealscope/core";

interface SliderConfig {
  key: keyof ScenarioOverrides;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}

const SLIDERS: SliderConfig[] = [
  { key: "askingPrice", label: "Asking Price", min: 0, max: 1, step: 10000, format: (v) => `$${Math.round(v).toLocaleString()}` },
  { key: "interestRate", label: "Interest Rate", min: 3, max: 12, step: 0.25, format: (v) => `${v.toFixed(2)}%` },
  { key: "vacancyRate", label: "Vacancy Rate", min: 0, max: 20, step: 1, format: (v) => `${v.toFixed(0)}%` },
  { key: "rentGrowthRate", label: "Rent Growth", min: 0, max: 5, step: 0.5, format: (v) => `${v.toFixed(1)}%` },
];

interface Props {
  basePrice: number;
  baseRate: number;
  baseVacancy: number;
  baseRentGrowth: number;
  onOverridesChange: (overrides: ScenarioOverrides) => void;
  previewResults: AnalysisResults | null;
}

export function ScenarioSliders({ basePrice, baseRate, baseVacancy, baseRentGrowth, onOverridesChange, previewResults }: Props) {
  const baseValues: Record<string, number> = { askingPrice: basePrice, interestRate: baseRate, vacancyRate: baseVacancy, rentGrowthRate: baseRentGrowth };
  const [values, setValues] = useState<Record<string, number>>(baseValues);

  const sliderConfigs = SLIDERS.map((s) => {
    if (s.key === "askingPrice") return { ...s, min: Math.round(basePrice * 0.8), max: Math.round(basePrice * 1.2) };
    return s;
  });

  const handleChange = useCallback(
    (key: string, value: number) => {
      const next = { ...values, [key]: value };
      setValues(next);
      const overrides: ScenarioOverrides = {};
      for (const [k, v] of Object.entries(next)) {
        if (v !== baseValues[k]) (overrides as Record<string, number>)[k] = v;
      }
      onOverridesChange(overrides);
    },
    [values, baseValues, onOverridesChange]
  );

  return (
    <div className="mb-4">
      <h3 className="text-lg font-bold text-primary mb-4">Quick What-If</h3>
      {sliderConfigs.map((cfg) => (
        <div key={cfg.key} className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground font-semibold">{cfg.label}</span>
            <span className="text-primary font-bold">{cfg.format(values[cfg.key] ?? 0)}</span>
          </div>
          <Slider min={cfg.min} max={cfg.max} step={cfg.step} value={values[cfg.key] ?? 0} onValueChange={(v) => handleChange(cfg.key, v)} />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>{cfg.format(cfg.min)}</span>
            <span>{cfg.format(cfg.max)}</span>
          </div>
        </div>
      ))}

      {previewResults && (
        <div className="bg-primary/5 rounded-lg p-4">
          <div className="text-xs font-semibold text-primary mb-2">Live Preview</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground">Cap Rate</div>
              <div className="text-sm font-bold text-primary">{previewResults.capRate.mid.toFixed(2)}%</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground">CoC</div>
              <div className="text-sm font-bold text-primary">{previewResults.cashOnCash.mid.toFixed(2)}%</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground">Monthly CF</div>
              <div className={`text-sm font-bold ${previewResults.monthlyCashFlow.mid >= 0 ? "text-success" : "text-destructive"}`}>
                ${Math.round(previewResults.monthlyCashFlow.mid).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
