import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { AnalysisResults } from "@dealscope/core";

interface DealData {
  id: string;
  address: string;
  askingPrice: number;
  units: number;
  results: AnalysisResults;
}

interface Props {
  deals: DealData[];
}

interface MetricRow {
  label: string;
  extract: (d: DealData) => number | string;
  format: (v: number | string) => string;
  higherIsBetter?: boolean;
  numeric?: boolean;
}

const ROWS: MetricRow[] = [
  {
    label: "Address",
    extract: (d) => d.address,
    format: (v) => String(v),
    numeric: false,
  },
  {
    label: "Price",
    extract: (d) => d.askingPrice,
    format: (v) => `$${Math.round(Number(v)).toLocaleString()}`,
    numeric: true,
  },
  {
    label: "Units",
    extract: (d) => d.units,
    format: (v) => String(v),
    numeric: true,
  },
  {
    label: "$/Unit",
    extract: (d) => d.results.pricePerUnit,
    format: (v) => `$${Math.round(Number(v)).toLocaleString()}`,
    higherIsBetter: false,
    numeric: true,
  },
  {
    label: "Cap Rate",
    extract: (d) => d.results.capRate.mid,
    format: (v) => `${Number(v).toFixed(2)}%`,
    higherIsBetter: true,
    numeric: true,
  },
  {
    label: "Cash-on-Cash",
    extract: (d) => d.results.cashOnCash.mid,
    format: (v) => `${Number(v).toFixed(2)}%`,
    higherIsBetter: true,
    numeric: true,
  },
  {
    label: "DSCR",
    extract: (d) => d.results.dscr.mid,
    format: (v) => Number(v).toFixed(2),
    higherIsBetter: true,
    numeric: true,
  },
  {
    label: "Monthly CF",
    extract: (d) => d.results.monthlyCashFlow.mid,
    format: (v) => `$${Math.round(Number(v)).toLocaleString()}`,
    higherIsBetter: true,
    numeric: true,
  },
  {
    label: "NOI",
    extract: (d) => d.results.noi.mid,
    format: (v) => `$${Math.round(Number(v)).toLocaleString()}`,
    higherIsBetter: true,
    numeric: true,
  },
  {
    label: "Break-Even Occ.",
    extract: (d) => d.results.breakEvenOccupancy,
    format: (v) => `${Number(v).toFixed(1)}%`,
    higherIsBetter: false,
    numeric: true,
  },
  {
    label: "IRR",
    extract: (d) => d.results.irr ?? 0,
    format: (v) => `${Number(v).toFixed(1)}%`,
    higherIsBetter: true,
    numeric: true,
  },
];

export function DealComparison({ deals }: Props) {
  if (deals.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Select at least 2 deals to compare</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
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
            <View key={row.label} style={styles.row}>
              <View style={styles.labelCell}>
                <Text style={styles.labelText}>{row.label}</Text>
              </View>
              {deals.map((deal, i) => {
                const isWinner = i === bestIdx;
                return (
                  <View key={deal.id} style={styles.valueCell}>
                    <Text
                      style={[styles.valueText, isWinner && styles.winnerText]}
                      numberOfLines={2}
                    >
                      {row.format(values[i])}
                    </Text>
                    {isWinner && (
                      <View style={styles.winnerBadge}>
                        <Text style={styles.winnerBadgeText}>Best</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#666" },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    minHeight: 44,
  },
  labelCell: {
    width: 110,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#f8f9fa",
  },
  labelText: { fontSize: 12, fontWeight: "600", color: "#555" },
  valueCell: {
    width: 120,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
  },
  valueText: { fontSize: 13, fontWeight: "500", color: "#333", textAlign: "center" },
  winnerText: { color: "#008800", fontWeight: "700" },
  winnerBadge: {
    backgroundColor: "#008800",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  winnerBadgeText: { fontSize: 9, fontWeight: "700", color: "#fff" },
});
