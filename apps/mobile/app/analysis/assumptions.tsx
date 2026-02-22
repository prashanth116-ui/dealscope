import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { StepIndicator, CurrencyInput } from "@dealscope/ui";
import { useWizard } from "../../components/WizardContext";
import { calculateIncome, PROJECTION_DEFAULTS } from "@dealscope/core";

const STEP_LABELS = [
  "Property Basics",
  "Rent Roll",
  "Expenses",
  "Financing",
  "Assumptions",
  "Results",
];

export default function AssumptionsScreen() {
  const { state, dispatch } = useWizard();
  const router = useRouter();
  const va = state.valueAdd;

  const income = calculateIncome(state.rentRoll);
  const numUnits = state.property.units ?? 1;
  const currentAvgRent =
    numUnits > 0 ? income.grossPotentialRent / 12 / numUnits : 0;

  const setVA = (field: string, value: number) => {
    dispatch({
      type: "SET_VALUE_ADD",
      valueAdd: { ...va, [field]: value },
    });
  };

  const handleContinue = () => {
    dispatch({ type: "SET_STEP", step: 6 });
    router.push("/analysis/results");
  };

  return (
    <ScrollView style={styles.container}>
      <StepIndicator current={5} total={6} labels={STEP_LABELS} />

      {/* Value-Add Section */}
      <Text style={styles.sectionTitle}>Value-Add Assumptions</Text>

      <Text style={styles.label}>
        Target Rent / Unit (current avg: ${Math.round(currentAvgRent)}/mo)
      </Text>
      <CurrencyInput
        placeholder="Leave blank if no value-add"
        value={va.targetRentPerUnit ? String(va.targetRentPerUnit) : ""}
        onChangeValue={(v) => setVA("targetRentPerUnit", parseFloat(v) || 0)}
      />
      {va.targetRentPerUnit != null && va.targetRentPerUnit > 0 && currentAvgRent > 0 && (
        <Text style={styles.hint}>
          +${Math.round(va.targetRentPerUnit - currentAvgRent)}/unit (
          {(((va.targetRentPerUnit - currentAvgRent) / currentAvgRent) * 100).toFixed(0)}% increase)
        </Text>
      )}

      <Text style={styles.label}>Renovation Budget</Text>
      <CurrencyInput
        placeholder="$0"
        value={va.renovationBudget ? String(va.renovationBudget) : ""}
        onChangeValue={(v) => setVA("renovationBudget", parseFloat(v) || 0)}
      />
      {va.renovationBudget > 0 && numUnits > 0 && (
        <Text style={styles.hint}>
          ${Math.round(va.renovationBudget / numUnits).toLocaleString()}/unit
        </Text>
      )}

      <Text style={styles.label}>Renovation Timeline (months)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="0"
        value={va.renovationTimeline ? String(va.renovationTimeline) : ""}
        onChangeText={(v) => setVA("renovationTimeline", parseInt(v) || 0)}
      />

      <Text style={styles.label}>Target Occupancy (%)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={String(Math.round(va.targetOccupancy * 100))}
        onChangeText={(v) =>
          setVA("targetOccupancy", Math.min(100, parseInt(v) || 0) / 100)
        }
      />

      {/* Growth Rates */}
      <Text style={styles.sectionTitle}>Growth Rates</Text>

      <View style={styles.rateRow}>
        <Text style={styles.rateLabel}>Rent Growth (%/yr)</Text>
        <TextInput
          style={styles.rateInput}
          keyboardType="numeric"
          value={String(va.rentGrowthRate)}
          onChangeText={(v) => setVA("rentGrowthRate", parseFloat(v) || 0)}
        />
      </View>

      <View style={styles.rateRow}>
        <Text style={styles.rateLabel}>Expense Growth (%/yr)</Text>
        <TextInput
          style={styles.rateInput}
          keyboardType="numeric"
          value={String(va.expenseGrowthRate)}
          onChangeText={(v) => setVA("expenseGrowthRate", parseFloat(v) || 0)}
        />
      </View>

      <View style={styles.rateRow}>
        <Text style={styles.rateLabel}>Appreciation (%/yr)</Text>
        <TextInput
          style={styles.rateInput}
          keyboardType="numeric"
          value={String(va.appreciationRate)}
          onChangeText={(v) => setVA("appreciationRate", parseFloat(v) || 0)}
        />
      </View>

      {/* Hold Period & Exit */}
      <Text style={styles.sectionTitle}>Exit Strategy</Text>

      <Text style={styles.label}>Hold Period (years)</Text>
      <View style={styles.holdRow}>
        {[3, 5, 7, 10, 15].map((yr) => (
          <Pressable
            key={yr}
            style={[styles.holdChip, state.holdPeriod === yr && styles.holdChipActive]}
            onPress={() => dispatch({ type: "SET_HOLD_PERIOD", holdPeriod: yr })}
          >
            <Text
              style={[
                styles.holdChipText,
                state.holdPeriod === yr && styles.holdChipTextActive,
              ]}
            >
              {yr}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={[styles.input, { marginTop: 8 }]}
        keyboardType="numeric"
        placeholder="Custom"
        value={String(state.holdPeriod)}
        onChangeText={(v) =>
          dispatch({
            type: "SET_HOLD_PERIOD",
            holdPeriod: Math.min(30, Math.max(1, parseInt(v) || 5)),
          })
        }
      />

      <Text style={styles.label}>Exit Cap Rate (%)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={String(state.exitCapRate)}
        onChangeText={(v) =>
          dispatch({
            type: "SET_EXIT_CAP_RATE",
            exitCapRate: parseFloat(v) || 0,
          })
        }
      />

      {/* Defaults reminder */}
      <View style={styles.defaultsCard}>
        <Text style={styles.defaultsTitle}>Current Defaults</Text>
        <Text style={styles.defaultsLine}>
          Rent Growth: {PROJECTION_DEFAULTS.rentGrowthRate}% | Expense Growth:{" "}
          {PROJECTION_DEFAULTS.expenseGrowthRate}%
        </Text>
        <Text style={styles.defaultsLine}>
          Appreciation: {PROJECTION_DEFAULTS.appreciationRate}% | Hold:{" "}
          {PROJECTION_DEFAULTS.holdPeriod}yr | Exit Cap:{" "}
          {PROJECTION_DEFAULTS.exitCapRate}%
        </Text>
      </View>

      <View style={styles.navRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Run Analysis</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#003366",
    marginTop: 24,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 6,
  },
  hint: { fontSize: 12, color: "#008800", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  rateLabel: { fontSize: 14, color: "#333", flex: 1 },
  rateInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: "#fafafa",
    width: 80,
    textAlign: "right",
  },
  holdRow: { flexDirection: "row", gap: 8 },
  holdChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  holdChipActive: { backgroundColor: "#003366", borderColor: "#003366" },
  holdChipText: { fontSize: 14, color: "#666" },
  holdChipTextActive: { color: "#fff" },
  defaultsCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
  },
  defaultsTitle: { fontSize: 12, fontWeight: "700", color: "#888", marginBottom: 4 },
  defaultsLine: { fontSize: 11, color: "#999" },
  navRow: { flexDirection: "row", gap: 12, marginTop: 24, marginBottom: 40 },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#003366",
  },
  backButtonText: { color: "#003366", fontSize: 16, fontWeight: "600" },
  button: {
    flex: 2,
    backgroundColor: "#003366",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
