import { View, Text, StyleSheet, Pressable } from "react-native";
import type { DealStatus } from "@dealscope/api-client";

interface Props {
  id: string;
  address: string;
  units: number;
  askingPrice: number;
  capRate: number;
  cashOnCash: number;
  monthlyCashFlow: number;
  status: DealStatus;
  createdAt: string;
  onPress: () => void;
}

const STATUS_COLORS: Record<DealStatus, { bg: string; text: string }> = {
  Analyzing: { bg: "#e8f0fe", text: "#003366" },
  Offered: { bg: "#fff3e0", text: "#e65100" },
  "Under Contract": { bg: "#e8f5e9", text: "#2e7d32" },
  Closed: { bg: "#e8f5e9", text: "#1b5e20" },
  Passed: { bg: "#f5f5f5", text: "#666" },
};

export function AnalysisCard({
  address,
  units,
  askingPrice,
  capRate,
  cashOnCash,
  monthlyCashFlow,
  status,
  createdAt,
  onPress,
}: Props) {
  const statusColor = STATUS_COLORS[status] ?? STATUS_COLORS.Analyzing;
  const dateStr = new Date(createdAt).toLocaleDateString();

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.address} numberOfLines={1}>
          {address}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>{status}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.detailText}>
          {units} units | ${Math.round(askingPrice).toLocaleString()}
        </Text>
        <Text style={styles.dateText}>{dateStr}</Text>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Cap Rate</Text>
          <Text style={styles.metricValue}>{capRate.toFixed(1)}%</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>CoC</Text>
          <Text style={styles.metricValue}>{cashOnCash.toFixed(1)}%</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Monthly CF</Text>
          <Text
            style={[
              styles.metricValue,
              { color: monthlyCashFlow >= 0 ? "#008800" : "#c00" },
            ]}
          >
            ${Math.round(monthlyCashFlow).toLocaleString()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  address: { flex: 1, fontSize: 15, fontWeight: "700", color: "#003366", marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: "700" },
  details: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  detailText: { fontSize: 13, color: "#555" },
  dateText: { fontSize: 12, color: "#999" },
  metrics: { flexDirection: "row", justifyContent: "space-between" },
  metric: { alignItems: "center", flex: 1 },
  metricLabel: { fontSize: 11, color: "#666", marginBottom: 2 },
  metricValue: { fontSize: 15, fontWeight: "700", color: "#003366" },
});
