import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { AnalysisResults } from "@dealscope/core";

interface ScenarioData {
  name: string;
  results: AnalysisResults;
}

interface Props {
  base: { name: string; results: AnalysisResults };
  scenarios: ScenarioData[];
}

interface MetricRow {
  label: string;
  extract: (r: AnalysisResults) => number;
  format: (v: number) => string;
  higherIsBetter: boolean;
}

const METRIC_ROWS: MetricRow[] = [
  {
    label: "Cap Rate",
    extract: (r) => r.capRate.mid,
    format: (v) => `${v.toFixed(2)}%`,
    higherIsBetter: true,
  },
  {
    label: "Cash-on-Cash",
    extract: (r) => r.cashOnCash.mid,
    format: (v) => `${v.toFixed(2)}%`,
    higherIsBetter: true,
  },
  {
    label: "Monthly CF",
    extract: (r) => r.monthlyCashFlow.mid,
    format: (v) => `$${Math.round(v).toLocaleString()}`,
    higherIsBetter: true,
  },
  {
    label: "DSCR",
    extract: (r) => r.dscr.mid,
    format: (v) => v.toFixed(2),
    higherIsBetter: true,
  },
  {
    label: "NOI",
    extract: (r) => r.noi.mid,
    format: (v) => `$${Math.round(v).toLocaleString()}`,
    higherIsBetter: true,
  },
  {
    label: "Annual CF",
    extract: (r) => r.annualCashFlow.mid,
    format: (v) => `$${Math.round(v).toLocaleString()}`,
    higherIsBetter: true,
  },
  {
    label: "IRR",
    extract: (r) => r.irr ?? 0,
    format: (v) => `${v.toFixed(1)}%`,
    higherIsBetter: true,
  },
];

export function ScenarioComparison({ base, scenarios }: Props) {
  const allScenarios = [base, ...scenarios];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Side-by-Side Comparison</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.labelCell} />
            {allScenarios.map((s, i) => (
              <View key={i} style={[styles.headerCell, i === 0 && styles.baseCell]}>
                <Text style={[styles.headerText, i === 0 && styles.baseText]} numberOfLines={1}>
                  {s.name}
                </Text>
              </View>
            ))}
          </View>

          {/* Metric Rows */}
          {METRIC_ROWS.map((metric) => {
            const values = allScenarios.map((s) => metric.extract(s.results));
            const bestIdx = metric.higherIsBetter
              ? values.indexOf(Math.max(...values))
              : values.indexOf(Math.min(...values));

            return (
              <View key={metric.label} style={styles.dataRow}>
                <View style={styles.labelCell}>
                  <Text style={styles.labelText}>{metric.label}</Text>
                </View>
                {allScenarios.map((s, i) => {
                  const val = metric.extract(s.results);
                  const baseVal = metric.extract(base.results);
                  const diff = val - baseVal;
                  const isBetter = metric.higherIsBetter ? diff > 0 : diff < 0;
                  const isWorse = metric.higherIsBetter ? diff < 0 : diff > 0;
                  const isWinner = i === bestIdx;

                  return (
                    <View key={i} style={[styles.dataCell, i === 0 && styles.baseCell]}>
                      <Text
                        style={[
                          styles.dataValue,
                          i > 0 && isBetter && styles.betterValue,
                          i > 0 && isWorse && styles.worseValue,
                        ]}
                      >
                        {metric.format(val)}
                      </Text>
                      {isWinner && allScenarios.length > 1 && (
                        <Text style={styles.winnerBadge}>Best</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 16 },
  title: { fontSize: 18, fontWeight: "700", color: "#003366", marginBottom: 12 },
  headerRow: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#003366", paddingBottom: 8 },
  headerCell: {
    width: 110,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  baseCell: { backgroundColor: "#f0f5ff" },
  headerText: { fontSize: 12, fontWeight: "700", color: "#003366" },
  baseText: { color: "#003366" },
  dataRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },
  labelCell: { width: 100, justifyContent: "center", paddingRight: 8 },
  labelText: { fontSize: 12, color: "#555", fontWeight: "600" },
  dataCell: {
    width: 110,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  dataValue: { fontSize: 13, fontWeight: "600", color: "#333" },
  betterValue: { color: "#008800" },
  worseValue: { color: "#c00" },
  winnerBadge: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "#008800",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
    overflow: "hidden",
  },
});
