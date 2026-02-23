"use client";

import type { YearProjection } from "@dealscope/core";

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

const COLUMNS: { key: keyof YearProjection; label: string }[] = [
  { key: "year", label: "Year" },
  { key: "effectiveGrossIncome", label: "EGI" },
  { key: "expenses", label: "Expenses" },
  { key: "noi", label: "NOI" },
  { key: "debtService", label: "Debt Svc" },
  { key: "cashFlow", label: "Cash Flow" },
  { key: "cashOnCash", label: "CoC %" },
  { key: "propertyValue", label: "Value" },
  { key: "equity", label: "Equity" },
];

interface ProjectionTableProps {
  projections: YearProjection[];
}

export function ProjectionTable({ projections }: ProjectionTableProps) {
  if (projections.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            {COLUMNS.map((col) => (
              <th key={col.key} className="px-3 py-2 text-center font-semibold whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projections.map((p) => (
            <tr key={p.year} className="even:bg-gray-50 border-t">
              {COLUMNS.map((col) => {
                const val = p[col.key];
                let display: string;
                if (col.key === "year") {
                  display = String(val);
                } else if (col.key === "cashOnCash") {
                  display = `${(val as number).toFixed(1)}%`;
                } else {
                  display = fmt(val as number);
                }

                return (
                  <td
                    key={col.key}
                    className={`px-3 py-2 text-center whitespace-nowrap ${
                      col.key === "cashFlow" && (val as number) < 0 ? "text-destructive" : ""
                    }`}
                  >
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
