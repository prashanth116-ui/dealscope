import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import type { ExtractedField } from "@dealscope/core";

interface ExtractionReviewProps {
  fields: ExtractedField[];
  accepted: Set<string>;
  onToggleField: (fieldPath: string) => void;
  onAcceptAll: () => void;
}

function confidenceColor(confidence: number): string {
  if (confidence >= 0.9) return "#008800";
  if (confidence >= 0.7) return "#cc8800";
  return "#c00";
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return "High";
  if (confidence >= 0.7) return "Medium";
  return "Low";
}

export function ExtractionReview({
  fields,
  accepted,
  onToggleField,
  onAcceptAll,
}: ExtractionReviewProps) {
  if (fields.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No fields extracted</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Extracted Fields ({fields.length})
        </Text>
        <Pressable style={styles.acceptAllButton} onPress={onAcceptAll}>
          <Text style={styles.acceptAllText}>Accept All</Text>
        </Pressable>
      </View>

      {fields.map((field) => {
        const isAccepted = accepted.has(field.fieldPath);
        const hasDiscrepancy = !!field.discrepancy;

        return (
          <Pressable
            key={field.fieldPath}
            style={[
              styles.fieldCard,
              isAccepted && styles.fieldCardAccepted,
            ]}
            onPress={() => onToggleField(field.fieldPath)}
          >
            <View style={styles.fieldHeader}>
              <View style={styles.fieldLabelRow}>
                <View
                  style={[
                    styles.checkbox,
                    isAccepted && styles.checkboxActive,
                  ]}
                >
                  {isAccepted && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.fieldLabel}>{field.label}</Text>
              </View>
              <View
                style={[
                  styles.confidenceBadge,
                  { backgroundColor: confidenceColor(field.confidence) + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.confidenceText,
                    { color: confidenceColor(field.confidence) },
                  ]}
                >
                  {confidenceLabel(field.confidence)} ({Math.round(field.confidence * 100)}%)
                </Text>
              </View>
            </View>

            <Text style={styles.fieldValue}>
              {typeof field.value === "number"
                ? field.value.toLocaleString()
                : field.value}
            </Text>

            {field.sourceLocation && (
              <Text style={styles.source}>{field.sourceLocation}</Text>
            )}

            {hasDiscrepancy && (
              <View style={styles.discrepancyCard}>
                <Text style={styles.discrepancyTitle}>Cross-Reference</Text>
                <View style={styles.compareRow}>
                  <View style={styles.compareCol}>
                    <Text style={styles.compareLabel}>Extracted</Text>
                    <Text style={styles.compareValue}>
                      {typeof field.value === "number"
                        ? field.value.toLocaleString()
                        : field.value}
                    </Text>
                  </View>
                  <Text style={styles.vs}>vs</Text>
                  <View style={styles.compareCol}>
                    <Text style={styles.compareLabel}>Public Data</Text>
                    <Text style={styles.compareValue}>
                      {field.publicValue != null
                        ? typeof field.publicValue === "number"
                          ? field.publicValue.toLocaleString()
                          : field.publicValue
                        : "N/A"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.discrepancyText}>{field.discrepancy}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  empty: { padding: 20, alignItems: "center" },
  emptyText: { color: "#999", fontSize: 14 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#003366" },
  acceptAllButton: {
    backgroundColor: "#e8f0fe",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptAllText: { color: "#003366", fontSize: 13, fontWeight: "600" },
  fieldCard: {
    backgroundColor: "#fafafa",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  fieldCardAccepted: { borderColor: "#003366", backgroundColor: "#f0f4ff" },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: { backgroundColor: "#003366", borderColor: "#003366" },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: "#333" },
  confidenceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  confidenceText: { fontSize: 11, fontWeight: "600" },
  fieldValue: { fontSize: 16, fontWeight: "700", color: "#003366", marginBottom: 4 },
  source: { fontSize: 11, color: "#999" },
  discrepancyCard: {
    backgroundColor: "#fff8e1",
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  discrepancyTitle: { fontSize: 12, fontWeight: "700", color: "#cc8800", marginBottom: 6 },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  compareCol: { flex: 1, alignItems: "center" },
  compareLabel: { fontSize: 10, color: "#888", marginBottom: 2 },
  compareValue: { fontSize: 14, fontWeight: "600", color: "#333" },
  vs: { fontSize: 12, color: "#999" },
  discrepancyText: { fontSize: 12, color: "#996600" },
});
