import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
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
  {
    key: "askingPrice",
    label: "Price",
    getValues: (base) => {
      const step = Math.round(base * 0.05);
      return [-2, -1, 0, 1, 2].map((m) => base + m * step);
    },
    getBase: (input) => input.property.askingPrice,
    format: (v) => `$${(v / 1000).toFixed(0)}K`,
  },
  {
    key: "interestRate",
    label: "Rate",
    getValues: (base) => [-1, -0.5, 0, 0.5, 1].map((m) => base + m),
    getBase: (input) => input.financing.interestRate,
    format: (v) => `${v.toFixed(2)}%`,
  },
  {
    key: "vacancyRate",
    label: "Vacancy",
    getValues: () => [0, 5, 10, 15, 20],
    getBase: (input) => Math.round(input.rentRoll.units.filter((u) => u.status !== "occupied").length / input.rentRoll.units.length * 100),
    format: (v) => `${v}%`,
  },
  {
    key: "rentGrowthRate",
    label: "Rent Growth",
    getValues: () => [0, 1, 2, 3, 5],
    getBase: (input) => input.valueAdd?.rentGrowthRate ?? 2,
    format: (v) => `${v}%`,
  },
  {
    key: "exitCapRate",
    label: "Exit Cap",
    getValues: (base) => [-1.5, -0.75, 0, 0.75, 1.5].map((m) => base + m),
    getBase: (input) => input.exitCapRate ?? 8,
    format: (v) => `${v.toFixed(1)}%`,
  },
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
  if (ratio < 0.33) return "#ffcdd2"; // red
  if (ratio < 0.66) return "#fff9c4"; // yellow
  return "#c8e6c9"; // green
}

interface Props {
  baseInput: AnalysisInput;
}

export function SensitivityGrid({ baseInput }: Props) {
  const [rowVarIdx, setRowVarIdx] = useState(0);
  const [colVarIdx, setColVarIdx] = useState(1);
  const [metricIdx, setMetricIdx] = useState(1); // CoC by default

  const rowVar = VARIABLES[rowVarIdx];
  const colVar = VARIABLES[colVarIdx];
  const metric = METRICS[metricIdx];

  const rowBase = rowVar.getBase(baseInput);
  const colBase = colVar.getBase(baseInput);
  const rowValues = rowVar.getValues(rowBase);
  const colValues = colVar.getValues(colBase);

  const matrix: SensitivityMatrix = runSensitivity(
    baseInput,
    rowVar.key,
    rowValues,
    colVar.key,
    colValues,
    metric.key
  );

  const allValues = matrix.cells.map((c) => c.value);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sensitivity Matrix</Text>

      {/* Pickers */}
      <View style={styles.pickerRow}>
        <View style={styles.pickerGroup}>
          <Text style={styles.pickerLabel}>Rows:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {VARIABLES.map((v, i) => (
              <Pressable
                key={v.key}
                style={[styles.chip, i === rowVarIdx && styles.chipActive]}
                onPress={() => {
                  if (i !== colVarIdx) setRowVarIdx(i);
                }}
              >
                <Text style={[styles.chipText, i === rowVarIdx && styles.chipTextActive]}>
                  {v.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.pickerGroup}>
          <Text style={styles.pickerLabel}>Cols:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {VARIABLES.map((v, i) => (
              <Pressable
                key={v.key}
                style={[styles.chip, i === colVarIdx && styles.chipActive]}
                onPress={() => {
                  if (i !== rowVarIdx) setColVarIdx(i);
                }}
              >
                <Text style={[styles.chipText, i === colVarIdx && styles.chipTextActive]}>
                  {v.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.pickerGroup}>
          <Text style={styles.pickerLabel}>Metric:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {METRICS.map((m, i) => (
              <Pressable
                key={m.key}
                style={[styles.chip, i === metricIdx && styles.chipActive]}
                onPress={() => setMetricIdx(i)}
              >
                <Text style={[styles.chipText, i === metricIdx && styles.chipTextActive]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Column Headers */}
          <View style={styles.gridRow}>
            <View style={styles.cornerCell}>
              <Text style={styles.cornerText}>
                {rowVar.label} {"\u2193"} / {colVar.label} {"\u2192"}
              </Text>
            </View>
            {colValues.map((cv, ci) => (
              <View key={ci} style={styles.colHeader}>
                <Text style={styles.colHeaderText}>{colVar.format(cv)}</Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          {rowValues.map((rv, ri) => (
            <View key={ri} style={styles.gridRow}>
              <View style={styles.rowHeader}>
                <Text style={styles.rowHeaderText}>{rowVar.format(rv)}</Text>
              </View>
              {colValues.map((_, ci) => {
                const cell = matrix.cells.find((c) => c.row === ri && c.col === ci);
                const value = cell?.value ?? 0;
                const bgColor = getHeatColor(value, minVal, maxVal);

                return (
                  <View key={ci} style={[styles.dataCell, { backgroundColor: bgColor }]}>
                    <Text style={styles.dataCellText}>{metric.format(value)}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 16 },
  title: { fontSize: 18, fontWeight: "700", color: "#003366", marginBottom: 12 },
  pickerRow: { marginBottom: 16 },
  pickerGroup: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  pickerLabel: { fontSize: 12, fontWeight: "600", color: "#555", width: 50 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 6,
    backgroundColor: "#fafafa",
  },
  chipActive: { backgroundColor: "#003366", borderColor: "#003366" },
  chipText: { fontSize: 11, color: "#666" },
  chipTextActive: { color: "#fff" },
  gridRow: { flexDirection: "row" },
  cornerCell: {
    width: 80,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#003366",
    borderTopLeftRadius: 6,
  },
  cornerText: { fontSize: 9, color: "#fff", textAlign: "center", fontWeight: "600" },
  colHeader: {
    width: 75,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8f0fe",
    borderLeftWidth: 1,
    borderLeftColor: "#fff",
  },
  colHeaderText: { fontSize: 10, fontWeight: "700", color: "#003366" },
  rowHeader: {
    width: 80,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8f0fe",
    borderTopWidth: 1,
    borderTopColor: "#fff",
  },
  rowHeaderText: { fontSize: 10, fontWeight: "700", color: "#003366" },
  dataCell: {
    width: 75,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  dataCellText: { fontSize: 11, fontWeight: "600", color: "#333" },
});
