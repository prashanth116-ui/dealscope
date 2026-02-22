import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { YearProjection } from "@dealscope/core";

interface ProjectionTableProps {
  projections: YearProjection[];
}

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

export function ProjectionTable({ projections }: ProjectionTableProps) {
  if (projections.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View>
        {/* Header */}
        <View style={styles.headerRow}>
          {COLUMNS.map((col) => (
            <Text key={col.key} style={styles.headerCell}>
              {col.label}
            </Text>
          ))}
        </View>

        {/* Data rows */}
        {projections.map((p) => (
          <View
            key={p.year}
            style={[styles.dataRow, p.year % 2 === 0 && styles.dataRowAlt]}
          >
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
                <Text
                  key={col.key}
                  style={[
                    styles.dataCell,
                    col.key === "cashFlow" &&
                      (val as number) < 0 &&
                      styles.negative,
                  ]}
                >
                  {display}
                </Text>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", backgroundColor: "#003366", paddingVertical: 10 },
  headerCell: {
    width: 80,
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  dataRow: { flexDirection: "row", paddingVertical: 8 },
  dataRowAlt: { backgroundColor: "#f8f9fa" },
  dataCell: {
    width: 80,
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  negative: { color: "#c00" },
});
