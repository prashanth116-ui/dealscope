import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { StepIndicator } from "@dealscope/ui";
import { useWizard } from "./_context";
import {
  calculateIncome,
  calculateExpenses as calcExpenses,
  estimateExpenses,
  EXPENSE_RATIO_BENCHMARKS,
} from "@dealscope/core";
import type { Expenses, DetailedExpenses, ExpenseLine } from "@dealscope/core";

const STEP_LABELS = [
  "Property Basics",
  "Rent Roll",
  "Expenses",
  "Financing",
  "Assumptions",
  "Results",
];

function makeExpenseLine(amount: number, source: "auto" | "manual" = "auto"): ExpenseLine {
  return { amount, source };
}

function makeDefaultDetailed(
  units: number,
  yearBuilt: number,
  egi: number
): DetailedExpenses {
  const est = estimateExpenses({
    units,
    yearBuilt,
    propertyTax: 0,
    egi,
    landlordPaysHeat: false,
    climate: "moderate",
    managementPercent: 8,
  });

  return {
    propertyTax: makeExpenseLine(est.propertyTax),
    insurance: makeExpenseLine(est.insurance),
    utilities: {
      gas: makeExpenseLine(est.gas),
      water: makeExpenseLine(est.water),
      sewer: makeExpenseLine(est.sewer),
      trash: makeExpenseLine(est.trash),
      electric: makeExpenseLine(est.commonElectric),
    },
    management: { percentage: 8, amount: est.management },
    maintenance: { amount: est.maintenance, perUnit: est.maintenance / units },
    capex: { amount: est.capex, perUnit: est.capex / units },
    landscaping: makeExpenseLine(est.landscaping),
    legal: makeExpenseLine(est.legal),
    advertising: makeExpenseLine(est.advertising),
    other: [],
  };
}

interface ExpenseFieldProps {
  label: string;
  value: number;
  source: "auto" | "manual";
  onChangeValue: (val: number) => void;
  onChangeSource: (source: "manual") => void;
}

function ExpenseField({ label, value, source, onChangeValue, onChangeSource }: ExpenseFieldProps) {
  return (
    <View style={styles.expenseRow}>
      <View style={styles.expenseLabelCol}>
        <Text style={styles.expenseLabel}>{label}</Text>
        <View style={[styles.sourceBadge, source === "auto" ? styles.badgeAuto : styles.badgeManual]}>
          <Text style={styles.badgeText}>{source === "auto" ? "Auto" : "Manual"}</Text>
        </View>
      </View>
      <TextInput
        style={styles.expenseInput}
        keyboardType="numeric"
        value={value ? String(Math.round(value)) : ""}
        onChangeText={(v) => {
          onChangeValue(parseFloat(v) || 0);
          if (source === "auto") onChangeSource("manual");
        }}
      />
    </View>
  );
}

export default function ExpensesScreen() {
  const { state, dispatch } = useWizard();
  const router = useRouter();
  const expenses = state.expenses;
  const units = state.property.units ?? 1;
  const yearBuilt = state.property.yearBuilt ?? 1990;

  const income = calculateIncome(state.rentRoll);
  const egi = income.effectiveGrossIncome;

  // Initialize detailed if switching modes
  const detailed =
    expenses.detailed ??
    makeDefaultDetailed(units, yearBuilt, egi);

  const setMode = (mode: "quick" | "detailed") => {
    if (mode === "detailed" && !expenses.detailed) {
      dispatch({
        type: "SET_EXPENSES",
        expenses: { mode: "detailed", detailed: makeDefaultDetailed(units, yearBuilt, egi) },
      });
    } else {
      dispatch({
        type: "SET_EXPENSES",
        expenses: { ...expenses, mode },
      });
    }
  };

  const setQuickPct = (pct: number) => {
    dispatch({
      type: "SET_EXPENSES",
      expenses: { ...expenses, quickPercentage: pct },
    });
  };

  const updateDetailedField = (path: string, value: number) => {
    const d = { ...detailed } as any;
    const parts = path.split(".");
    if (parts.length === 1) {
      if (d[parts[0]] && typeof d[parts[0]] === "object" && "amount" in d[parts[0]]) {
        d[parts[0]] = { ...d[parts[0]], amount: value, source: "manual" as const };
      }
    } else if (parts.length === 2) {
      d[parts[0]] = { ...d[parts[0]], [parts[1]]: { ...d[parts[0]][parts[1]], amount: value, source: "manual" as const } };
    }
    dispatch({
      type: "SET_EXPENSES",
      expenses: { ...expenses, mode: "detailed", detailed: d },
    });
  };

  const updateManagement = (pct: number) => {
    const mgmtAmount = egi * (pct / 100);
    const d = { ...detailed, management: { percentage: pct, amount: mgmtAmount } };
    dispatch({
      type: "SET_EXPENSES",
      expenses: { ...expenses, mode: "detailed", detailed: d },
    });
  };

  // Compute running NOI
  const expResult = calcExpenses(expenses, egi, units);
  const noi = egi - expResult.totalExpenses.mid;

  const handleContinue = () => {
    dispatch({ type: "SET_STEP", step: 4 });
    router.push("/analysis/financing");
  };

  return (
    <ScrollView style={styles.container}>
      <StepIndicator current={3} total={6} labels={STEP_LABELS} />

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        <Pressable
          style={[styles.modeTab, expenses.mode === "quick" && styles.modeTabActive]}
          onPress={() => setMode("quick")}
        >
          <Text style={[styles.modeText, expenses.mode === "quick" && styles.modeTextActive]}>
            Quick (% of EGI)
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeTab, expenses.mode === "detailed" && styles.modeTabActive]}
          onPress={() => setMode("detailed")}
        >
          <Text style={[styles.modeText, expenses.mode === "detailed" && styles.modeTextActive]}>
            Detailed
          </Text>
        </Pressable>
      </View>

      {expenses.mode === "quick" ? (
        <View>
          <Text style={styles.sliderLabel}>
            Expense Ratio: {expenses.quickPercentage ?? 50}% of EGI
          </Text>

          {/* Quick percentage buttons */}
          <View style={styles.pctRow}>
            {[35, 42, 50, 58, 65, 75].map((pct) => (
              <Pressable
                key={pct}
                style={[
                  styles.pctButton,
                  expenses.quickPercentage === pct && styles.pctButtonActive,
                ]}
                onPress={() => setQuickPct(pct)}
              >
                <Text
                  style={[
                    styles.pctText,
                    expenses.quickPercentage === pct && styles.pctTextActive,
                  ]}
                >
                  {pct}%
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Custom percentage input */}
          <View style={styles.customPctRow}>
            <Text style={styles.expenseLabel}>Custom %</Text>
            <TextInput
              style={styles.smallInput}
              keyboardType="numeric"
              value={String(expenses.quickPercentage ?? 50)}
              onChangeText={(v) => setQuickPct(Math.min(100, Math.max(0, parseInt(v) || 0)))}
            />
          </View>

          {/* Benchmarks */}
          <View style={styles.benchmarkCard}>
            <Text style={styles.benchmarkTitle}>Benchmarks</Text>
            <Text style={styles.benchmarkLine}>
              Tenant pays all: {EXPENSE_RATIO_BENCHMARKS.tenantPaysAll.min}-
              {EXPENSE_RATIO_BENCHMARKS.tenantPaysAll.max}% (typical{" "}
              {EXPENSE_RATIO_BENCHMARKS.tenantPaysAll.typical}%)
            </Text>
            <Text style={styles.benchmarkLine}>
              Landlord pays heat: {EXPENSE_RATIO_BENCHMARKS.landlordPaysHeat.min}-
              {EXPENSE_RATIO_BENCHMARKS.landlordPaysHeat.max}% (typical{" "}
              {EXPENSE_RATIO_BENCHMARKS.landlordPaysHeat.typical}%)
            </Text>
            <Text style={styles.benchmarkLine}>
              Landlord pays all: {EXPENSE_RATIO_BENCHMARKS.landlordPaysAll.min}-
              {EXPENSE_RATIO_BENCHMARKS.landlordPaysAll.max}% (typical{" "}
              {EXPENSE_RATIO_BENCHMARKS.landlordPaysAll.typical}%)
            </Text>
          </View>
        </View>
      ) : (
        <View>
          <Text style={styles.detailedHint}>
            Auto-estimated from {units} units, built {yearBuilt}. Edit any field to override.
          </Text>

          <ExpenseField
            label="Property Tax"
            value={detailed.propertyTax.amount}
            source={detailed.propertyTax.source}
            onChangeValue={(v) => updateDetailedField("propertyTax", v)}
            onChangeSource={() => {}}
          />
          <ExpenseField
            label="Insurance"
            value={detailed.insurance.amount}
            source={detailed.insurance.source}
            onChangeValue={(v) => updateDetailedField("insurance", v)}
            onChangeSource={() => {}}
          />
          <ExpenseField
            label="Gas / Heat"
            value={detailed.utilities.gas.amount}
            source={detailed.utilities.gas.source}
            onChangeValue={(v) => updateDetailedField("utilities.gas", v)}
            onChangeSource={() => {}}
          />
          <ExpenseField
            label="Water"
            value={detailed.utilities.water.amount}
            source={detailed.utilities.water.source}
            onChangeValue={(v) => updateDetailedField("utilities.water", v)}
            onChangeSource={() => {}}
          />
          <ExpenseField
            label="Sewer"
            value={detailed.utilities.sewer.amount}
            source={detailed.utilities.sewer.source}
            onChangeValue={(v) => updateDetailedField("utilities.sewer", v)}
            onChangeSource={() => {}}
          />
          <ExpenseField
            label="Trash"
            value={detailed.utilities.trash.amount}
            source={detailed.utilities.trash.source}
            onChangeValue={(v) => updateDetailedField("utilities.trash", v)}
            onChangeSource={() => {}}
          />
          <ExpenseField
            label="Common Electric"
            value={detailed.utilities.electric.amount}
            source={detailed.utilities.electric.source}
            onChangeValue={(v) => updateDetailedField("utilities.electric", v)}
            onChangeSource={() => {}}
          />

          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Management (%)</Text>
            <TextInput
              style={styles.expenseInput}
              keyboardType="numeric"
              value={String(detailed.management.percentage)}
              onChangeText={(v) => updateManagement(parseFloat(v) || 0)}
            />
          </View>

          <ExpenseField
            label="Repairs & Maintenance"
            value={detailed.maintenance.amount}
            source="auto"
            onChangeValue={(v) => {
              const d = {
                ...detailed,
                maintenance: { amount: v, perUnit: units > 0 ? v / units : 0 },
              };
              dispatch({ type: "SET_EXPENSES", expenses: { ...expenses, mode: "detailed", detailed: d } });
            }}
            onChangeSource={() => {}}
          />
          <ExpenseField
            label="CapEx Reserves"
            value={detailed.capex.amount}
            source="auto"
            onChangeValue={(v) => {
              const d = {
                ...detailed,
                capex: { amount: v, perUnit: units > 0 ? v / units : 0 },
              };
              dispatch({ type: "SET_EXPENSES", expenses: { ...expenses, mode: "detailed", detailed: d } });
            }}
            onChangeSource={() => {}}
          />
          <ExpenseField
            label="Landscaping"
            value={detailed.landscaping.amount}
            source={detailed.landscaping.source}
            onChangeValue={(v) => updateDetailedField("landscaping", v)}
            onChangeSource={() => {}}
          />
          <ExpenseField
            label="Legal / Accounting"
            value={detailed.legal.amount}
            source={detailed.legal.source}
            onChangeValue={(v) => updateDetailedField("legal", v)}
            onChangeSource={() => {}}
          />
          <ExpenseField
            label="Advertising"
            value={detailed.advertising.amount}
            source={detailed.advertising.source}
            onChangeValue={(v) => updateDetailedField("advertising", v)}
            onChangeSource={() => {}}
          />
        </View>
      )}

      {/* Running NOI */}
      <View style={styles.totalsCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Effective Gross Income</Text>
          <Text style={styles.totalValue}>${egi.toLocaleString()}/yr</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            Total Expenses ({expResult.expenseRatio.mid.toFixed(1)}%)
          </Text>
          <Text style={[styles.totalValue, { color: "#c00" }]}>
            -${Math.round(expResult.totalExpenses.mid).toLocaleString()}/yr
          </Text>
        </View>
        <View style={[styles.totalRow, styles.totalRowFinal]}>
          <Text style={styles.totalLabelBold}>Net Operating Income</Text>
          <Text
            style={[styles.totalValueBold, noi < 0 && { color: "#c00" }]}
          >
            ${Math.round(noi).toLocaleString()}/yr
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
  modeRow: { flexDirection: "row", gap: 0, marginBottom: 16 },
  modeTab: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  modeTabActive: { backgroundColor: "#003366", borderColor: "#003366" },
  modeText: { fontSize: 14, color: "#666", fontWeight: "600" },
  modeTextActive: { color: "#fff" },
  sliderLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#003366",
    marginBottom: 12,
    textAlign: "center",
  },
  pctRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  pctButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  pctButtonActive: { backgroundColor: "#003366", borderColor: "#003366" },
  pctText: { fontSize: 14, color: "#666" },
  pctTextActive: { color: "#fff" },
  customPctRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  smallInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: "#fafafa",
    width: 80,
    textAlign: "right",
  },
  benchmarkCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  benchmarkTitle: { fontSize: 13, fontWeight: "700", color: "#333", marginBottom: 6 },
  benchmarkLine: { fontSize: 12, color: "#666", marginBottom: 2 },
  detailedHint: {
    fontSize: 12,
    color: "#888",
    marginBottom: 16,
    fontStyle: "italic",
  },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 4,
  },
  expenseLabelCol: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  expenseLabel: { fontSize: 14, color: "#333" },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeAuto: { backgroundColor: "#e8f0fe" },
  badgeManual: { backgroundColor: "#fff3cd" },
  badgeText: { fontSize: 10, fontWeight: "600", color: "#333" },
  expenseInput: {
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
