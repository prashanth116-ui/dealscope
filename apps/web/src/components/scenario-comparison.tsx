"use client";

import type { AnalysisResults } from "@dealscope/core";
import { Badge } from "./ui/badge";

interface ScenarioData { name: string; results: AnalysisResults; }
interface Props { base: ScenarioData; scenarios: ScenarioData[]; }

interface MetricRow {
  label: string;
  extract: (r: AnalysisResults) => number;
  format: (v: number) => string;
  higherIsBetter: boolean;
}

const METRIC_ROWS: MetricRow[] = [
  { label: "Cap Rate", extract: (r) => r.capRate.mid, format: (v) => `${v.toFixed(2)}%`, higherIsBetter: true },
  { label: "Cash-on-Cash", extract: (r) => r.cashOnCash.mid, format: (v) => `${v.toFixed(2)}%`, higherIsBetter: true },
  { label: "Monthly CF", extract: (r) => r.monthlyCashFlow.mid, format: (v) => `$${Math.round(v).toLocaleString()}`, higherIsBetter: true },
  { label: "DSCR", extract: (r) => r.dscr.mid, format: (v) => v.toFixed(2), higherIsBetter: true },
  { label: "NOI", extract: (r) => r.noi.mid, format: (v) => `$${Math.round(v).toLocaleString()}`, higherIsBetter: true },
  { label: "Annual CF", extract: (r) => r.annualCashFlow.mid, format: (v) => `$${Math.round(v).toLocaleString()}`, higherIsBetter: true },
  { label: "IRR", extract: (r) => r.irr ?? 0, format: (v) => `${v.toFixed(1)}%`, higherIsBetter: true },
];

export function ScenarioComparison({ base, scenarios }: Props) {
  const all = [base, ...scenarios];

  return (
    <div className="my-4">
      <h3 className="text-lg font-bold text-primary mb-3">Side-by-Side Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-primary">
              <th className="py-2 px-2 text-left w-24"></th>
              {all.map((s, i) => (
                <th key={i} className={`py-2 px-3 text-center font-bold text-primary ${i === 0 ? "bg-primary/5" : ""}`}>{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_ROWS.map((metric) => {
              const values = all.map((s) => metric.extract(s.results));
              const bestIdx = metric.higherIsBetter ? values.indexOf(Math.max(...values)) : values.indexOf(Math.min(...values));
              return (
                <tr key={metric.label} className="border-b">
                  <td className="py-2 px-2 font-semibold text-muted-foreground">{metric.label}</td>
                  {all.map((s, i) => {
                    const val = metric.extract(s.results);
                    const baseVal = metric.extract(base.results);
                    const diff = val - baseVal;
                    const isBetter = metric.higherIsBetter ? diff > 0 : diff < 0;
                    const isWorse = metric.higherIsBetter ? diff < 0 : diff > 0;
                    return (
                      <td key={i} className={`py-2 px-3 text-center ${i === 0 ? "bg-primary/5" : ""}`}>
                        <span className={`font-semibold ${i > 0 && isBetter ? "text-success" : i > 0 && isWorse ? "text-destructive" : ""}`}>
                          {metric.format(val)}
                        </span>
                        {i === bestIdx && all.length > 1 && <Badge variant="success" className="ml-1 text-[7px] px-1 py-0">Best</Badge>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
