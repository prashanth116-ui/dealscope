import { useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
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
  {
    key: "askingPrice",
    label: "Asking Price",
    min: 0,
    max: 1,
    step: 10000,
    format: (v) => `$${Math.round(v).toLocaleString()}`,
  },
  {
    key: "interestRate",
    label: "Interest Rate",
    min: 3,
    max: 12,
    step: 0.25,
    format: (v) => `${v.toFixed(2)}%`,
  },
  {
    key: "vacancyRate",
    label: "Vacancy Rate",
    min: 0,
    max: 20,
    step: 1,
    format: (v) => `${v.toFixed(0)}%`,
  },
  {
    key: "rentGrowthRate",
    label: "Rent Growth",
    min: 0,
    max: 5,
    step: 0.5,
    format: (v) => `${v.toFixed(1)}%`,
  },
];

interface Props {
  basePrice: number;
  baseRate: number;
  baseVacancy: number;
  baseRentGrowth: number;
  onOverridesChange: (overrides: ScenarioOverrides) => void;
  previewResults: AnalysisResults | null;
}

export function ScenarioSliders({
  basePrice,
  baseRate,
  baseVacancy,
  baseRentGrowth,
  onOverridesChange,
  previewResults,
}: Props) {
  const baseValues: Record<string, number> = {
    askingPrice: basePrice,
    interestRate: baseRate,
    vacancyRate: baseVacancy,
    rentGrowthRate: baseRentGrowth,
  };

  const [values, setValues] = useState<Record<string, number>>(baseValues);

  const sliderConfigs = SLIDERS.map((s) => {
    if (s.key === "askingPrice") {
      return {
        ...s,
        min: Math.round(basePrice * 0.8),
        max: Math.round(basePrice * 1.2),
      };
    }
    return s;
  });

  const handleChange = useCallback(
    (key: string, value: number) => {
      const next = { ...values, [key]: value };
      setValues(next);
      const overrides: ScenarioOverrides = {};
      for (const [k, v] of Object.entries(next)) {
        if (v !== baseValues[k]) {
          (overrides as Record<string, number>)[k] = v;
        }
      }
      onOverridesChange(overrides);
    },
    [values, baseValues, onOverridesChange]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick What-If</Text>

      {sliderConfigs.map((cfg) => (
        <View key={cfg.key} style={styles.sliderRow}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>{cfg.label}</Text>
            <Text style={styles.sliderValue}>{cfg.format(values[cfg.key] ?? 0)}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={cfg.min}
            maximumValue={cfg.max}
            step={cfg.step}
            value={values[cfg.key] ?? 0}
            onValueChange={(v) => handleChange(cfg.key, v)}
            minimumTrackTintColor="#003366"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#003366"
          />
          <View style={styles.sliderRange}>
            <Text style={styles.rangeText}>{cfg.format(cfg.min)}</Text>
            <Text style={styles.rangeText}>{cfg.format(cfg.max)}</Text>
          </View>
        </View>
      ))}

      {previewResults && (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Live Preview</Text>
          <View style={styles.previewRow}>
            <PreviewMetric label="Cap Rate" value={`${previewResults.capRate.mid.toFixed(2)}%`} />
            <PreviewMetric label="CoC" value={`${previewResults.cashOnCash.mid.toFixed(2)}%`} />
            <PreviewMetric
              label="Monthly CF"
              value={`$${Math.round(previewResults.monthlyCashFlow.mid).toLocaleString()}`}
              color={previewResults.monthlyCashFlow.mid >= 0 ? "#008800" : "#c00"}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function PreviewMetric({
  label,
  value,
  color = "#003366",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.previewMetric}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={[styles.previewValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", color: "#003366", marginBottom: 16 },
  sliderRow: { marginBottom: 16 },
  sliderHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  sliderLabel: { fontSize: 13, color: "#555", fontWeight: "600" },
  sliderValue: { fontSize: 13, color: "#003366", fontWeight: "700" },
  slider: { width: "100%", height: 40 },
  sliderRange: { flexDirection: "row", justifyContent: "space-between" },
  rangeText: { fontSize: 11, color: "#999" },
  preview: {
    backgroundColor: "#f0f5ff",
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  previewTitle: { fontSize: 13, fontWeight: "600", color: "#003366", marginBottom: 10 },
  previewRow: { flexDirection: "row", justifyContent: "space-between" },
  previewMetric: { alignItems: "center", flex: 1 },
  previewLabel: { fontSize: 11, color: "#666", marginBottom: 4 },
  previewValue: { fontSize: 16, fontWeight: "700" },
});
