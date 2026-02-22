import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { StepIndicator } from "@dealscope/ui";
import { CurrencyInput } from "@dealscope/ui";
import { useWizard } from "./_context";
import type { PropertyType } from "@dealscope/core";

const STEP_LABELS = [
  "Property Basics",
  "Rent Roll",
  "Expenses",
  "Financing",
  "Assumptions",
  "Results",
];

const PROPERTY_TYPES: { label: string; value: PropertyType }[] = [
  { label: "Multifamily", value: "multifamily" },
  { label: "Retail", value: "retail" },
  { label: "Office", value: "office" },
  { label: "Industrial", value: "industrial" },
  { label: "Mixed Use", value: "mixed" },
];

export default function NewAnalysisScreen() {
  const { state, dispatch } = useWizard();
  const router = useRouter();
  const p = state.property;

  const setField = (field: string, value: string | number) => {
    dispatch({ type: "SET_PROPERTY", property: { [field]: value } });
  };

  const setAddress = (field: string, value: string) => {
    dispatch({
      type: "SET_PROPERTY",
      property: {
        address: { ...{ street: "", city: "", state: "", zip: "" }, ...p.address, [field]: value },
      },
    });
  };

  const canContinue =
    p.address?.street &&
    p.units &&
    p.units > 0 &&
    p.askingPrice &&
    p.askingPrice > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    // Sync purchase price to financing
    dispatch({
      type: "SET_FINANCING",
      financing: {
        ...state.financing,
        purchasePrice: p.askingPrice!,
        closingCosts: p.askingPrice! * 0.03,
      },
    });
    dispatch({ type: "SET_STEP", step: 2 });
    router.push("/analysis/rent-roll");
  };

  return (
    <ScrollView style={styles.container}>
      <StepIndicator current={1} total={6} labels={STEP_LABELS} />

      <Pressable
        style={styles.uploadBanner}
        onPress={() => router.push("/analysis/upload")}
      >
        <Text style={styles.uploadText}>Have an OM? Upload for auto-fill</Text>
      </Pressable>

      <Text style={styles.label}>Property Type</Text>
      <View style={styles.typeRow}>
        {PROPERTY_TYPES.map((pt) => (
          <Pressable
            key={pt.value}
            style={[styles.typeChip, p.type === pt.value && styles.typeChipActive]}
            onPress={() => setField("type", pt.value)}
          >
            <Text
              style={[
                styles.typeChipText,
                p.type === pt.value && styles.typeChipTextActive,
              ]}
            >
              {pt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Street Address</Text>
      <TextInput
        style={styles.input}
        placeholder="123 Main St"
        value={p.address?.street ?? ""}
        onChangeText={(v) => setAddress("street", v)}
      />

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="Dayton"
            value={p.address?.city ?? ""}
            onChangeText={(v) => setAddress("city", v)}
          />
        </View>
        <View style={styles.stateField}>
          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            placeholder="OH"
            maxLength={2}
            autoCapitalize="characters"
            value={p.address?.state ?? ""}
            onChangeText={(v) => setAddress("state", v)}
          />
        </View>
        <View style={styles.zipField}>
          <Text style={styles.label}>ZIP</Text>
          <TextInput
            style={styles.input}
            placeholder="45406"
            keyboardType="numeric"
            maxLength={5}
            value={p.address?.zip ?? ""}
            onChangeText={(v) => setAddress("zip", v)}
          />
        </View>
      </View>

      <Text style={styles.label}>Number of Units</Text>
      <TextInput
        style={styles.input}
        placeholder="10"
        keyboardType="numeric"
        value={p.units ? String(p.units) : ""}
        onChangeText={(v) => setField("units", parseInt(v) || 0)}
      />

      <Text style={styles.label}>Asking Price</Text>
      <CurrencyInput
        placeholder="$450,000"
        value={p.askingPrice ? String(p.askingPrice) : ""}
        onChangeValue={(v) => setField("askingPrice", parseFloat(v) || 0)}
      />

      <Text style={styles.label}>Building Sqft</Text>
      <TextInput
        style={styles.input}
        placeholder="5,986"
        keyboardType="numeric"
        value={p.buildingSqft ? String(p.buildingSqft) : ""}
        onChangeText={(v) => setField("buildingSqft", parseInt(v) || 0)}
      />

      <Text style={styles.label}>Year Built</Text>
      <TextInput
        style={styles.input}
        placeholder="1965"
        keyboardType="numeric"
        maxLength={4}
        value={p.yearBuilt ? String(p.yearBuilt) : ""}
        onChangeText={(v) => setField("yearBuilt", parseInt(v) || 0)}
      />

      <Pressable
        style={[styles.button, !canContinue && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!canContinue}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  row: { flexDirection: "row", gap: 10 },
  flex1: { flex: 1 },
  stateField: { width: 70 },
  zipField: { width: 90 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  typeChipActive: {
    backgroundColor: "#003366",
    borderColor: "#003366",
  },
  typeChipText: { fontSize: 13, color: "#666" },
  typeChipTextActive: { color: "#fff" },
  uploadBanner: {
    backgroundColor: "#e8f0fe",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  uploadText: { color: "#003366", fontSize: 14, fontWeight: "500" },
  button: {
    backgroundColor: "#003366",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 32,
    marginBottom: 40,
  },
  buttonDisabled: { backgroundColor: "#99aabb" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
