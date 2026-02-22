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
import { useWizard } from "./_context";
import {
  calculateMonthlyPayment,
  FINANCING_DEFAULTS,
} from "@dealscope/core";
import type { FinancingType } from "@dealscope/core";

const STEP_LABELS = [
  "Property Basics",
  "Rent Roll",
  "Expenses",
  "Financing",
  "Assumptions",
  "Results",
];

const FINANCING_TYPES: { label: string; value: FinancingType }[] = [
  { label: "Conventional", value: "conventional" },
  { label: "Seller Finance", value: "seller" },
  { label: "Cash", value: "cash" },
];

export default function FinancingScreen() {
  const { state, dispatch } = useWizard();
  const router = useRouter();
  const f = state.financing;

  const setField = (field: string, value: number | string) => {
    dispatch({
      type: "SET_FINANCING",
      financing: { ...f, [field]: value },
    });
  };

  const setType = (type: FinancingType) => {
    const defaults =
      type === "seller"
        ? FINANCING_DEFAULTS.seller
        : FINANCING_DEFAULTS.conventional;

    dispatch({
      type: "SET_FINANCING",
      financing: {
        ...f,
        type,
        downPaymentPercent: defaults.downPaymentPercent,
        loanTerm: defaults.loanTerm,
        amortization: defaults.amortization,
        closingCosts: f.purchasePrice * (defaults.closingCosts / 100),
        points: defaults.points,
        sellerCarryback:
          type === "seller"
            ? f.sellerCarryback ?? {
                amount: f.purchasePrice * 0.7,
                rate: 6,
                term: 5,
                balloon: 5,
              }
            : undefined,
      },
    });
  };

  const setCarryback = (field: string, value: number) => {
    dispatch({
      type: "SET_FINANCING",
      financing: {
        ...f,
        sellerCarryback: {
          ...{ amount: 0, rate: 6, term: 5, balloon: 5 },
          ...f.sellerCarryback,
          [field]: value,
        },
      },
    });
  };

  // Compute preview
  const downPayment = f.purchasePrice * (f.downPaymentPercent / 100);
  const loanAmount = f.purchasePrice - downPayment;
  const monthlyPayment =
    f.type === "cash"
      ? 0
      : calculateMonthlyPayment(loanAmount, f.interestRate, f.amortization);

  const handleContinue = () => {
    dispatch({ type: "SET_STEP", step: 5 });
    router.push("/analysis/assumptions");
  };

  return (
    <ScrollView style={styles.container}>
      <StepIndicator current={4} total={6} labels={STEP_LABELS} />

      {/* Financing type tabs */}
      <View style={styles.typeRow}>
        {FINANCING_TYPES.map((ft) => (
          <Pressable
            key={ft.value}
            style={[styles.typeTab, f.type === ft.value && styles.typeTabActive]}
            onPress={() => setType(ft.value)}
          >
            <Text
              style={[styles.typeText, f.type === ft.value && styles.typeTextActive]}
            >
              {ft.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Purchase price (read-only from Step 1) */}
      <Text style={styles.label}>Purchase Price</Text>
      <CurrencyInput
        value={f.purchasePrice ? String(f.purchasePrice) : ""}
        onChangeValue={(v) => setField("purchasePrice", parseFloat(v) || 0)}
      />

      {f.type !== "cash" && (
        <>
          <Text style={styles.label}>Down Payment (%)</Text>
          <View style={styles.pctInputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              keyboardType="numeric"
              value={String(f.downPaymentPercent)}
              onChangeText={(v) =>
                setField("downPaymentPercent", Math.min(100, parseFloat(v) || 0))
              }
            />
            <Text style={styles.pctResult}>
              = ${downPayment.toLocaleString()}
            </Text>
          </View>

          <Text style={styles.label}>Interest Rate (%)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(f.interestRate)}
            onChangeText={(v) => setField("interestRate", parseFloat(v) || 0)}
          />

          <Text style={styles.label}>Loan Term (years)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(f.loanTerm)}
            onChangeText={(v) => setField("loanTerm", parseInt(v) || 0)}
          />

          <Text style={styles.label}>Amortization (years)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(f.amortization)}
            onChangeText={(v) => setField("amortization", parseInt(v) || 0)}
          />

          <Text style={styles.label}>Points (%)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(f.points)}
            onChangeText={(v) => setField("points", parseFloat(v) || 0)}
          />
        </>
      )}

      <Text style={styles.label}>Closing Costs ($)</Text>
      <CurrencyInput
        value={f.closingCosts ? String(f.closingCosts) : ""}
        onChangeValue={(v) => setField("closingCosts", parseFloat(v) || 0)}
      />

      {/* Seller carryback */}
      {f.type === "seller" && (
        <>
          <Text style={styles.sectionTitle}>Seller Carryback</Text>

          <Text style={styles.label}>Carryback Amount</Text>
          <CurrencyInput
            value={
              f.sellerCarryback?.amount ? String(f.sellerCarryback.amount) : ""
            }
            onChangeValue={(v) => setCarryback("amount", parseFloat(v) || 0)}
          />

          <Text style={styles.label}>Carryback Rate (%)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={
              f.sellerCarryback?.rate != null
                ? String(f.sellerCarryback.rate)
                : ""
            }
            onChangeText={(v) => setCarryback("rate", parseFloat(v) || 0)}
          />

          <Text style={styles.label}>Carryback Term (years)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={
              f.sellerCarryback?.term != null
                ? String(f.sellerCarryback.term)
                : ""
            }
            onChangeText={(v) => setCarryback("term", parseInt(v) || 0)}
          />

          <Text style={styles.label}>Balloon (years)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={
              f.sellerCarryback?.balloon != null
                ? String(f.sellerCarryback.balloon)
                : ""
            }
            onChangeText={(v) => setCarryback("balloon", parseInt(v) || 0)}
          />
        </>
      )}

      {/* Payment preview */}
      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Payment Preview</Text>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Loan Amount</Text>
          <Text style={styles.previewValue}>
            ${loanAmount.toLocaleString()}
          </Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Monthly P&I</Text>
          <Text style={styles.previewValueBold}>
            ${Math.round(monthlyPayment).toLocaleString()}/mo
          </Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Annual Debt Service</Text>
          <Text style={styles.previewValue}>
            ${Math.round(monthlyPayment * 12).toLocaleString()}/yr
          </Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Total Cash Required</Text>
          <Text style={styles.previewValue}>
            $
            {Math.round(
              downPayment + f.closingCosts + loanAmount * (f.points / 100)
            ).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.navRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
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
  typeRow: { flexDirection: "row", gap: 0, marginBottom: 8 },
  typeTab: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  typeTabActive: { backgroundColor: "#003366", borderColor: "#003366" },
  typeText: { fontSize: 13, color: "#666", fontWeight: "600" },
  typeTextActive: { color: "#fff" },
  pctInputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  pctResult: { fontSize: 14, color: "#666" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#003366",
    marginTop: 24,
    marginBottom: 4,
  },
  previewCard: {
    backgroundColor: "#f0f4f8",
    borderRadius: 10,
    padding: 16,
    marginTop: 24,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#003366",
    marginBottom: 10,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  previewLabel: { fontSize: 13, color: "#555" },
  previewValue: { fontSize: 13, color: "#333", fontWeight: "500" },
  previewValueBold: { fontSize: 15, color: "#003366", fontWeight: "700" },
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
