import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import type { Unit, UnitStatus } from "@dealscope/core";

interface UnitRowProps {
  unit: Unit;
  onChange: (updated: Unit) => void;
}

const STATUS_OPTIONS: { label: string; value: UnitStatus }[] = [
  { label: "Occupied", value: "occupied" },
  { label: "Vacant", value: "vacant" },
  { label: "Down", value: "down" },
];

export function UnitRow({ unit, onChange }: UnitRowProps) {
  const set = (field: keyof Unit, value: string | number) => {
    onChange({ ...unit, [field]: value });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.unitLabel}>Unit {unit.unitNumber}</Text>
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((s) => (
            <Pressable
              key={s.value}
              style={[styles.statusChip, unit.status === s.value && styles.statusActive]}
              onPress={() => set("status", s.value)}
            >
              <Text
                style={[
                  styles.statusText,
                  unit.status === s.value && styles.statusTextActive,
                ]}
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Beds</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={unit.beds ? String(unit.beds) : ""}
            onChangeText={(v) => set("beds", parseInt(v) || 0)}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Baths</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={unit.baths ? String(unit.baths) : ""}
            onChangeText={(v) => set("baths", parseFloat(v) || 0)}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Sqft</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={unit.sqft ? String(unit.sqft) : ""}
            onChangeText={(v) => set("sqft", parseInt(v) || 0)}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Current Rent</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="$0"
            value={unit.currentRent ? String(unit.currentRent) : ""}
            onChangeText={(v) => set("currentRent", parseFloat(v) || 0)}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Market Rent</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="$0"
            value={unit.marketRent ? String(unit.marketRent) : ""}
            onChangeText={(v) => set("marketRent", parseFloat(v) || 0)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fafafa",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  unitLabel: { fontSize: 15, fontWeight: "700", color: "#003366" },
  statusRow: { flexDirection: "row", gap: 6 },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  statusActive: { backgroundColor: "#003366", borderColor: "#003366" },
  statusText: { fontSize: 11, color: "#666" },
  statusTextActive: { color: "#fff" },
  row: { flexDirection: "row", gap: 10, marginTop: 6 },
  field: { flex: 1 },
  fieldLabel: { fontSize: 11, color: "#888", marginBottom: 3 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: "#fff",
  },
});
