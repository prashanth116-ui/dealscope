import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StepIndicator } from "@dealscope/ui";
import { CurrencyInput } from "@dealscope/ui";
import { useWizard } from "../../components/WizardContext";
import { FetchedDataCard } from "../../components/FetchedDataCard";
import type { PropertyType, PropertyLookupResult } from "@dealscope/core";

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

// TODO: Replace with real API URL from environment/config
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://api.dealscope.app";

export default function NewAnalysisScreen() {
  const { state, dispatch } = useWizard();
  const router = useRouter();
  const p = state.property;

  const [fetchedData, setFetchedData] = useState<PropertyLookupResult | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

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

  const canFetch = p.address?.zip && p.address.zip.length === 5;

  const handleFetchData = async () => {
    if (!canFetch) return;
    setFetching(true);
    setFetchError(null);

    try {
      const res = await fetch(`${API_BASE}/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip: p.address!.zip }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data: PropertyLookupResult = await res.json();
      setFetchedData(data);

      // Auto-fill mortgage rate into financing
      if (data.mortgageRate.rate > 0) {
        dispatch({
          type: "SET_FINANCING",
          financing: {
            ...state.financing,
            interestRate: data.mortgageRate.rate,
          },
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch data";
      setFetchError(message);
    } finally {
      setFetching(false);
    }
  };

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

      {/* Fetch Data Button */}
      <Pressable
        style={[styles.fetchButton, !canFetch && styles.fetchButtonDisabled]}
        onPress={handleFetchData}
        disabled={!canFetch || fetching}
      >
        {fetching ? (
          <View style={styles.fetchingRow}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.fetchButtonText}>
              Fetching data for ZIP {p.address?.zip}...
            </Text>
          </View>
        ) : (
          <Text style={styles.fetchButtonText}>Fetch Property Data</Text>
        )}
      </Pressable>

      {fetchError && (
        <Text style={styles.errorText}>{fetchError}</Text>
      )}

      {fetchedData && <FetchedDataCard data={fetchedData} />}

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
  fetchButton: {
    backgroundColor: "#1a6b3c",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  fetchButtonDisabled: { backgroundColor: "#99bbaa" },
  fetchButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  fetchingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  errorText: { color: "#c00", fontSize: 13, marginTop: 8 },
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
