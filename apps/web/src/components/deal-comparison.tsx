"use client";

import type { AnalysisResults } from "@dealscope/core";
import { Badge } from "./ui/badge";

interface DealData {
  id: string;
  address: string;
  askingPrice: number;
  units: number;
  results: AnalysisResults;
}

interface MetricRow {
  label: string;
  extract: (d: DealData) => number | string;
  format: (v: number | string) => string;
  higherIsBetter?: boolean;
  numeric?: boolean;
}

const ROWS: MetricRow[] = [
  { label: "Address", extract: (d) => d.address, format: (v) => String(v), numeric: false },
  { label: "Price", extract: (d) => d.askingPrice, format: (v) => `$${Math.round(Number(v)).toLocaleString()}`, numeric: true },
  { label: "Units", extract: (d) => d.units, format: (v) => String(v), numeric: true },
  { label: "$/Unit", extract: (d) => d.results.pricePerUnit, format: (v) => `$${Math.round(Number(v)).toLocaleString()}`, higherIsBetter: false, numeric: true },
  { label: "Cap Rate", extract: (d) => d.results.capRate.mid, format: (v) => `${Number(v).toFixed(2)}%`, higherIsBetter: true, numeric: true },
  { label: "Cash-on-Cash", extract: (d) => d.results.cashOnCash.mid, format: (v) => `${Number(v).toFixed(2)}%`, higherIsBetter: true, numeric: true },
  { label: "DSCR", extract: (d) => d.results.dscr.mid, format: (v) => Number(v).toFixed(2), higherIsBetter: true, numeric: true },
  { label: "Monthly CF", extract: (d) => d.results.monthlyCashFlow.mid, format: (v) => `$${Math.round(Number(v)).toLocaleString()}`, higherIsBetter: true, numeric: true },
  { label: "NOI", extract: (d) => d.results.noi.mid, format: (v) => `$${Math.round(Number(v)).toLocaleString()}`, higherIsBetter: true, numeric: true },
  { label: "Break-Even Occ.", extract: (d) => d.results.breakEvenOccupancy, format: (v) => `${Number(v).toFixed(1)}%`, higherIsBetter: false, numeric: true },
  { label: "IRR", extract: (d) => d.results.irr ?? 0, format: (v) => `${Number(v).toFixed(1)}%`, higherIsBetter: true, numeric: true },
];

interface Props {
  deals: DealData[];
}

export function DealComparison({ deals }: Props) {
  if (deals.length < 2) {
    return <p className="text-center text-muted-foreground py-10">Select at least 2 deals to compare</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          {ROWS.map((row) => {
            const values = deals.map((d) => row.extract(d));
            let bestIdx = -1;
            if (row.numeric && row.higherIsBetter !== undefined) {
              const numValues = values.map(Number);
              bestIdx = row.higherIsBetter
                ? numValues.indexOf(Math.max(...numValues))
                : numValues.indexOf(Math.min(...numValues));
            }

            return (
              <tr key={row.label} className="border-b">
                <td className="py-2 px-3 bg-gray-50 font-semibold text-xs text-muted-foreground w-28">{row.label}</td>
                {deals.map((deal, i) => {
                  const isWinner = i === bestIdx;
                  return (
                    <td key={deal.id} className="py-2 px-3 text-center border-l">
                      <span className={isWinner ? "text-success font-bold" : "font-medium"}>
                        {row.format(values[i])}
                      </span>
                      {isWinner && (
                        <Badge variant="success" className="ml-1 text-[8px] px-1 py-0">Best</Badge>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
