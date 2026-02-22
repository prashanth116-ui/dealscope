import { View, Text, StyleSheet } from "react-native";

interface StepIndicatorProps {
  current: number;
  total: number;
  labels?: string[];
}

export function StepIndicator({ current, total, labels }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.stepText}>
        Step {current} of {total}
      </Text>
      {labels && labels[current - 1] && (
        <Text style={styles.labelText}>{labels[current - 1]}</Text>
      )}
      <View style={styles.dots}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[styles.dot, i + 1 <= current && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  stepText: { fontSize: 12, color: "#999", marginBottom: 2 },
  labelText: { fontSize: 20, fontWeight: "bold", color: "#003366", marginBottom: 8 },
  dots: { flexDirection: "row", gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },
  dotActive: { backgroundColor: "#003366" },
});
