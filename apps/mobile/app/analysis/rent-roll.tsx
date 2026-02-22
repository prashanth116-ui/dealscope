import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { StepIndicator } from "@dealscope/ui";
import { useWizard } from "./_context";
import { UnitRow } from "../../components/UnitRow";
import { calculateIncome } from "@dealscope/core";
import type { Unit } from "@dealscope/core";

const STEP_LABELS = [
  "Property Basics",
  "Rent Roll",
  "Expenses",
  "Financing",
  "Assumptions",
  "Results",
];

function makeEmptyUnit(index: number): Unit {
  return {
    unitNumber: String(index + 1),
    beds: 1,
    baths: 1,
    sqft: 0,
    currentRent: 0,
    marketRent: 0,
    status: "occupied",
  };
}

export default function RentRollScreen() {
  const { state, dispatch } = useWizard();
  const router = useRouter();
  const numUnits = state.property.units ?? 0;
  const rentRoll = state.rentRoll;

  // Initialize units if count doesn't match
  const units =
    rentRoll.units.length === numUnits
      ? rentRoll.units
      : Array.from({ length: numUnits }, (_, i) =>
          rentRoll.units[i] ?? makeEmptyUnit(i)
        );

  const updateUnit = (index: number, updated: Unit) => {
    const newUnits = [...units];
    newUnits[index] = updated;
    dispatch({
      type: "SET_RENT_ROLL",
      rentRoll: { ...rentRoll, units: newUnits },
    });
  };

  const fillAllUnits = () => {
    if (units.length === 0) return;
    const first = units[0];
    const filled = units.map((u, i) => ({
      ...first,
      unitNumber: String(i + 1),
    }));
    dispatch({
      type: "SET_RENT_ROLL",
      rentRoll: { ...rentRoll, units: filled },
    });
  };

  const setOtherIncome = (field: string, value: number) => {
    dispatch({
      type: "SET_RENT_ROLL",
      rentRoll: {
        ...rentRoll,
        units,
        otherIncome: { ...rentRoll.otherIncome, [field]: value },
      },
    });
  };

  const setPassThrough = (field: string, value: number) => {
    dispatch({
      type: "SET_RENT_ROLL",
      rentRoll: {
        ...rentRoll,
        units,
        otherIncome: {
          ...rentRoll.otherIncome,
          utilityPassThrough: {
            ...rentRoll.otherIncome.utilityPassThrough,
            [field]: value,
          },
        },
      },
    });
  };

  // Compute running totals
  const tempRoll = { ...rentRoll, units };
  const income = calculateIncome(tempRoll);

  const hasAnyRent = units.some((u) => u.currentRent > 0);

  const handleContinue = () => {
    if (!hasAnyRent) {
      Alert.alert("Missing Data", "At least one unit must have rent greater than 0.");
      return;
    }
    // Save final state
    dispatch({ type: "SET_RENT_ROLL", rentRoll: { ...rentRoll, units } });
    dispatch({ type: "SET_STEP", step: 3 });
    router.push("/analysis/expenses");
  };

  const oi = rentRoll.otherIncome;

  return (
    <ScrollView style={styles.container}>
      <StepIndicator current={2} total={6} labels={STEP_LABELS} />

      {numUnits > 1 && (
        <Pressable style={styles.fillButton} onPress={fillAllUnits}>
          <Text style={styles.fillButtonText}>Fill all units from Unit 1</Text>
        </Pressable>
      )}

      {units.map((unit, i) => (
        <UnitRow key={i} unit={unit} onChange={(u) => updateUnit(i, u)} />
      ))}

      <Text style={styles.sectionTitle}>Other Income (monthly)</Text>

      <View style={styles.incomeRow}>
        <Text style={styles.incomeLabel}>Utility Pass-Through ($/unit)</Text>
        <TextInput
          style={styles.smallInput}
          keyboardType="numeric"
          value={oi.utilityPassThrough.perUnit ? String(oi.utilityPassThrough.perUnit) : ""}
          onChangeText={(v) => setPassThrough("perUnit", parseFloat(v) || 0)}
        />
      </View>
      <View style={styles.incomeRow}>
        <Text style={styles.incomeLabel}>Units Participating</Text>
        <TextInput
          style={styles.smallInput}
          keyboardType="numeric"
          value={
            oi.utilityPassThrough.unitsParticipating
              ? String(oi.utilityPassThrough.unitsParticipating)
              : ""
          }
          onChangeText={(v) => setPassThrough("unitsParticipating", parseInt(v) || 0)}
        />
      </View>
      <View style={styles.incomeRow}>
        <Text style={styles.incomeLabel}>Laundry</Text>
        <TextInput
          style={styles.smallInput}
          keyboardType="numeric"
          value={oi.laundry ? String(oi.laundry) : ""}
          onChangeText={(v) => setOtherIncome("laundry", parseFloat(v) || 0)}
        />
      </View>
      <View style={styles.incomeRow}>
        <Text style={styles.incomeLabel}>Parking</Text>
        <TextInput
          style={styles.smallInput}
          keyboardType="numeric"
          value={oi.parking ? String(oi.parking) : ""}
          onChangeText={(v) => setOtherIncome("parking", parseFloat(v) || 0)}
        />
      </View>
      <View style={styles.incomeRow}>
        <Text style={styles.incomeLabel}>Storage</Text>
        <TextInput
          style={styles.smallInput}
          keyboardType="numeric"
          value={oi.storage ? String(oi.storage) : ""}
          onChangeText={(v) => setOtherIncome("storage", parseFloat(v) || 0)}
        />
      </View>
      <View style={styles.incomeRow}>
        <Text style={styles.incomeLabel}>Pet Fees</Text>
        <TextInput
          style={styles.smallInput}
          keyboardType="numeric"
          value={oi.petFees ? String(oi.petFees) : ""}
          onChangeText={(v) => setOtherIncome("petFees", parseFloat(v) || 0)}
        />
      </View>

      {/* Running totals */}
      <View style={styles.totalsCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Gross Potential Rent</Text>
          <Text style={styles.totalValue}>
            ${income.grossPotentialRent.toLocaleString()}/yr
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Vacancy Loss ({(income.vacancyRate * 100).toFixed(0)}%)</Text>
          <Text style={[styles.totalValue, { color: "#c00" }]}>
            -${income.vacancyLoss.toLocaleString()}/yr
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Other Income</Text>
          <Text style={styles.totalValue}>
            +${income.otherIncomeTotal.toLocaleString()}/yr
          </Text>
        </View>
        <View style={[styles.totalRow, styles.totalRowFinal]}>
          <Text style={styles.totalLabelBold}>Effective Gross Income</Text>
          <Text style={styles.totalValueBold}>
            ${income.effectiveGrossIncome.toLocaleString()}/yr
          </Text>
        </View>
      </View>

      <View style={styles.navRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Pressable
          style={[styles.button, !hasAnyRent && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!hasAnyRent}
        >
          <Text style={styles.buttonText}>Continue</Text>
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
    marginBottom: 12,
  },
  fillButton: {
    backgroundColor: "#e8f0fe",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  fillButtonText: { color: "#003366", fontSize: 13, fontWeight: "600" },
  incomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  incomeLabel: { fontSize: 14, color: "#333", flex: 1 },
  smallInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: "#fafafa",
    width: 100,
    textAlign: "right",
  },
  totalsCard: {
    backgroundColor: "#f0f4f8",
    borderRadius: 10,
    padding: 16,
    marginTop: 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalRowFinal: {
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: { fontSize: 13, color: "#555" },
  totalValue: { fontSize: 13, color: "#333", fontWeight: "500" },
  totalLabelBold: { fontSize: 14, color: "#003366", fontWeight: "700" },
  totalValueBold: { fontSize: 14, color: "#003366", fontWeight: "700" },
  navRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
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
  buttonDisabled: { backgroundColor: "#99aabb" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
