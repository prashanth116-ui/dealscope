import { View, Text, StyleSheet } from "react-native";

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
}

export function MetricCard({
  label,
  value,
  subtitle,
  color = "#003366",
}: MetricCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    minWidth: 140,
  },
  label: { fontSize: 12, color: "#666", marginBottom: 4 },
  value: { fontSize: 22, fontWeight: "bold" },
  subtitle: { fontSize: 11, color: "#999", marginTop: 2 },
});
