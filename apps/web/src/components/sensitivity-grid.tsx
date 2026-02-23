"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import type { AnalysisInput, ScenarioOverrides, SensitivityMatrix } from "@dealscope/core";
import { runSensitivity } from "@dealscope/core";

type Metric = "capRate" | "cashOnCash" | "irr" | "dscr" | "monthlyCashFlow";

interface VariableOption {
  key: keyof ScenarioOverrides;
  label: string;
  getValues: (base: number) => number[];
  getBase: (input: AnalysisInput) => number;
  format: (v: number) => string;
}

const VARIABLES: VariableOption[] = [
  { key: "askingPrice", label: "Price", getValues: (base) => [-2, -1, 0, 1, 2].map((m) => base + m * Math.round(base * 0.05)), getBase: (input) => input.property.askingPrice, format: (v) => `$${(v / 1000).toFixed(0)}K` },
  { key: "interestRate", label: "Rate", getValues: (base) => [-1, -0.5, 0, 0.5, 1].map((m) => base + m), getBase: (input) => input.financing.interestRate, format: (v) => `${v.toFixed(2)}%` },
  { key: "vacancyRate", label: "Vacancy", getValues: () => [0, 5, 10, 15, 20], getBase: (input) => Math.round(input.rentRoll.units.filter((u) => u.status !== "occupied").length / input.rentRoll.units.length * 100), format: (v) => `${v}%` },
  { key: "rentGrowthRate", label: "Rent Growth", getValues: () => [0, 1, 2, 3, 5], getBase: (input) => input.valueAdd?.rentGrowthRate ?? 2, format: (v) => `${v}%` },
  { key: "exitCapRate", label: "Exit Cap", getValues: (base) => [-1.5, -0.75, 0, 0.75, 1.5].map((m) => base + m), getBase: (input) => input.exitCapRate ?? 8, format: (v) => `${v.toFixed(1)}%` },
];

const METRICS: { key: Metric; label: string; format: (v: number) => string }[] = [
  { key: "capRate", label: "Cap Rate", format: (v) => `${v.toFixed(2)}%` },
  { key: "cashOnCash", label: "Cash-on-Cash", format: (v) => `${v.toFixed(2)}%` },
  { key: "monthlyCashFlow", label: "Monthly CF", format: (v) => `$${Math.round(v).toLocaleString()}` },
  { key: "dscr", label: "DSCR", format: (v) => v.toFixed(2) },
  { key: "irr", label: "IRR", format: (v) => `${v.toFixed(1)}%` },
];

function getHeatColor(value: number, min: number, max: number): string {
  if (max === min) return "#fff9c4";
  const ratio = (value - min) / (max - min);
  if (ratio < 0.33) return "#ffcdd2";
  if (ratio < 0.66) return "#fff9c4";
  return "#c8e6c9";
}

interface Props { baseInput: AnalysisInput; }

export function SensitivityGrid({ baseInput }: Props) {
  const [rowVarIdx, setRowVarIdx] = useState(0);
  const [colVarIdx, setColVarIdx] = useState(1);
  const [metricIdx, setMetricIdx] = useState(1);

  const rowVar = VARIABLES[rowVarIdx];
  const colVar = VARIABLES[colVarIdx];
  const metric = METRICS[metricIdx];

  const rowValues = rowVar.getValues(rowVar.getBase(baseInput));
  const colValues = colVar.getValues(colVar.getBase(baseInput));

  const matrix: SensitivityMatrix = runSensitivity(baseInput, rowVar.key, rowValues, colVar.key, colValues, metric.key);
  const allValues = matrix.cells.map((c) => c.value);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);

  return (
    <div className="my-4">
      <h3 className="text-lg font-bold text-primary mb-3">Sensitivity Matrix</h3>

      {/* Pickers */}
      <div className="space-y-2 mb-4">
        {[
          { label: "Rows", idx: rowVarIdx, setIdx: setRowVarIdx, otherIdx: colVarIdx },
          { label: "Cols", idx: colVarIdx, setIdx: setColVarIdx, otherIdx: rowVarIdx },
        ].map(({ label, idx, setIdx, otherIdx }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground w-10">{label}:</span>
            {VARIABLES.map((v, i) => (
              <Button key={v.key} variant={i === idx ? "default" : "outline"} size="sm" className="text-[10px] h-6 px-2 rounded-full" onClick={() => { if (i !== otherIdx) setIdx(i); }}>
                {v.label}
              </Button>
            ))}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground w-10">Metric:</span>
          {METRICS.map((m, i) => (
            <Button key={m.key} variant={i === metricIdx ? "default" : "outline"} size="sm" className="text-[10px] h-6 px-2 rounded-full" onClick={() => setMetricIdx(i)}>
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <th className="p-2 bg-primary text-primary-foreground text-[9px] rounded-tl-md w-20">
                {rowVar.label} ↓ / {colVar.label} →
              </th>
              {colValues.map((cv, ci) => (
                <th key={ci} className="p-2 bg-primary/10 text-primary font-bold text-center">{colVar.format(cv)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowValues.map((rv, ri) => (
              <tr key={ri}>
                <td className="p-2 bg-primary/10 text-primary font-bold text-center">{rowVar.format(rv)}</td>
                {colValues.map((_, ci) => {
                  const cell = matrix.cells.find((c) => c.row === ri && c.col === ci);
                  const value = cell?.value ?? 0;
                  return (
                    <td key={ci} className="p-2 text-center font-semibold border" style={{ backgroundColor: getHeatColor(value, minVal, maxVal) }}>
                      {metric.format(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
