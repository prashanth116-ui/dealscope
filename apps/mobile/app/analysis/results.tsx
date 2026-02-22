import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StepIndicator, MetricCard } from "@dealscope/ui";
import { useWizard } from "../../components/WizardContext";
import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../components/AuthContext";
import { analyzeProperty } from "@dealscope/core";
import type { AnalysisInput, Property, Range } from "@dealscope/core";
import { ProjectionTable } from "../../components/ProjectionTable";
import { exportPdf } from "../../components/ExportPdf";

const STEP_LABELS = [
  "Property Basics",
  "Rent Roll",
  "Expenses",
  "Financing",
  "Assumptions",
  "Results",
];

function fmtCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

function RangeCards({
  label,
  range,
  format = "currency",
}: {
  label: string;
  range: Range;
  format?: "currency" | "percent";
}) {
  const fmt = format === "percent" ? fmtPct : fmtCurrency;
  return (
    <View style={styles.rangeRow}>
      <View style={styles.rangeCard}>
        <Text style={styles.rangeLabel}>Low</Text>
        <Text style={[styles.rangeValue, { color: "#c00" }]}>{fmt(range.low)}</Text>
      </View>
      <View style={[styles.rangeCard, styles.rangeCardMid]}>
        <Text style={styles.rangeLabel}>{label}</Text>
        <Text style={[styles.rangeValue, { color: "#003366" }]}>{fmt(range.mid)}</Text>
      </View>
      <View style={styles.rangeCard}>
        <Text style={styles.rangeLabel}>High</Text>
        <Text style={[styles.rangeValue, { color: "#008800" }]}>{fmt(range.high)}</Text>
      </View>
    </View>
  );
}

export default function ResultsScreen() {
  const { state, dispatch } = useWizard();
  const router = useRouter();
  const params = useLocalSearchParams<{ loadId?: string }>();
  const api = useApi();
  const { isAuthenticated } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load saved analysis if navigated with loadId
  useEffect(() => {
    if (params.loadId && !state.analysisId) {
      (async () => {
        try {
          const saved = await api.getAnalysis(params.loadId!);
          dispatch({
            type: "LOAD_ANALYSIS",
            id: saved.id,
            input: saved.input,
            results: saved.results,
          });
        } catch (err) {
          setLoadError(err instanceof Error ? err.message : "Failed to load analysis");
        }
      })();
    }
  }, [params.loadId]);

  // Run analysis on mount (for new analyses from wizard)
  useEffect(() => {
    if (params.loadId) return; // Skip if loading from API
    const property = state.property as Property;
    if (!property.address || !property.units) return;

    const input: AnalysisInput = {
      property,
      rentRoll: state.rentRoll,
      expenses: state.expenses,
      financing: state.financing,
      valueAdd: state.valueAdd,
      holdPeriod: state.holdPeriod,
      exitCapRate: state.exitCapRate,
    };

    const results = analyzeProperty(input);
    dispatch({ type: "SET_RESULTS", results });
  }, []);

  const r = state.results;

  if (loadError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{loadError}</Text>
        <Pressable style={styles.backButton} onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </Pressable>
      </View>
    );
  }

  if (!r) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003366" />
        <Text style={styles.loadingText}>
          {params.loadId ? "Loading analysis..." : "Crunching numbers..."}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StepIndicator current={6} total={6} labels={STEP_LABELS} />

      {/* Top Metric Cards */}
      <Text style={styles.sectionTitle}>Key Metrics</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricsRow}>
        <MetricCard label="Cap Rate" value={fmtPct(r.capRate.mid)} subtitle="mid estimate" />
        <View style={{ width: 10 }} />
        <MetricCard
          label="Cash-on-Cash"
          value={fmtPct(r.cashOnCash.mid)}
          subtitle="mid estimate"
        />
        <View style={{ width: 10 }} />
        <MetricCard
          label="Monthly Cash Flow"
          value={fmtCurrency(r.monthlyCashFlow.mid)}
          subtitle="mid estimate"
          color={r.monthlyCashFlow.mid >= 0 ? "#003366" : "#c00"}
        />
        <View style={{ width: 10 }} />
        <MetricCard
          label="DSCR"
          value={r.dscr.mid.toFixed(2)}
          subtitle={r.dscr.mid >= 1.25 ? "Healthy" : r.dscr.mid >= 1 ? "Tight" : "Negative"}
          color={r.dscr.mid >= 1.25 ? "#008800" : r.dscr.mid >= 1 ? "#cc8800" : "#c00"}
        />
      </ScrollView>

      {/* Purchase Metrics */}
      <Text style={styles.sectionTitle}>Purchase Metrics</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Price/Unit</Text>
          <Text style={styles.metricValue}>{fmtCurrency(r.pricePerUnit)}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Price/Sqft</Text>
          <Text style={styles.metricValue}>{fmtCurrency(r.pricePerSqft)}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>GRM</Text>
          <Text style={styles.metricValue}>{r.grossRentMultiplier.toFixed(1)}x</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>1% Rule</Text>
          <Text style={styles.metricValue}>{fmtPct(r.onePercentRule)}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Break-Even Occ.</Text>
          <Text style={styles.metricValue}>{fmtPct(r.breakEvenOccupancy)}</Text>
        </View>
      </View>

      {/* Income / Expense Breakdown */}
      <Text style={styles.sectionTitle}>Income & Expenses</Text>
      <View style={styles.breakdownCard}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Gross Potential Rent</Text>
          <Text style={styles.breakdownValue}>
            {fmtCurrency(r.income.grossPotentialRent)}
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>
            Vacancy ({(r.income.vacancyRate * 100).toFixed(0)}%)
          </Text>
          <Text style={[styles.breakdownValue, { color: "#c00" }]}>
            -{fmtCurrency(r.income.vacancyLoss)}
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Other Income</Text>
          <Text style={styles.breakdownValue}>
            +{fmtCurrency(r.income.otherIncomeTotal)}
          </Text>
        </View>
        <View style={[styles.breakdownRow, styles.breakdownSubtotal]}>
          <Text style={styles.breakdownBold}>Effective Gross Income</Text>
          <Text style={styles.breakdownBold}>
            {fmtCurrency(r.income.effectiveGrossIncome)}
          </Text>
        </View>

        {r.expenses.breakdown.map((item, i) => (
          <View key={i} style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{item.category}</Text>
            <Text style={[styles.breakdownValue, { color: "#c00" }]}>
              -{fmtCurrency(item.amount)}
            </Text>
          </View>
        ))}
      </View>

      {/* NOI Range */}
      <Text style={styles.sectionTitle}>Net Operating Income</Text>
      <RangeCards label="NOI" range={r.noi} />

      {/* Cap Rate Range */}
      <Text style={styles.sectionTitle}>Cap Rate Range</Text>
      <RangeCards label="Cap Rate" range={r.capRate} format="percent" />

      {/* Cash Flow Range */}
      <Text style={styles.sectionTitle}>Annual Cash Flow</Text>
      <RangeCards label="Cash Flow" range={r.annualCashFlow} />

      {/* Stabilized (if value-add) */}
      {r.stabilized && (
        <>
          <Text style={styles.sectionTitle}>Stabilized (Value-Add)</Text>
          <View style={styles.compareRow}>
            <View style={styles.compareCard}>
              <Text style={styles.compareLabel}>Current NOI</Text>
              <Text style={styles.compareValue}>{fmtCurrency(r.noi.mid)}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={[styles.compareCard, styles.compareCardHighlight]}>
              <Text style={styles.compareLabel}>Stabilized NOI</Text>
              <Text style={[styles.compareValue, { color: "#008800" }]}>
                {fmtCurrency(r.stabilized.noi.mid)}
              </Text>
            </View>
          </View>
          <View style={styles.compareRow}>
            <View style={styles.compareCard}>
              <Text style={styles.compareLabel}>Current Cap</Text>
              <Text style={styles.compareValue}>{fmtPct(r.capRate.mid)}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={[styles.compareCard, styles.compareCardHighlight]}>
              <Text style={styles.compareLabel}>Stabilized Cap</Text>
              <Text style={[styles.compareValue, { color: "#008800" }]}>
                {fmtPct(r.stabilized.capRate.mid)}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* 5-Year Projections */}
      <Text style={styles.sectionTitle}>
        {state.holdPeriod}-Year Projections
      </Text>
      <ProjectionTable projections={r.projections} />

      {/* IRR & Equity Multiple */}
      {(r.irr != null || r.equityMultiple != null) && (
        <>
          <Text style={styles.sectionTitle}>Investment Returns</Text>
          <View style={styles.returnsRow}>
            {r.irr != null && (
              <MetricCard
                label="IRR"
                value={fmtPct(r.irr)}
                subtitle={`${state.holdPeriod}-year hold`}
                color={r.irr > 15 ? "#008800" : r.irr > 8 ? "#003366" : "#cc8800"}
              />
            )}
            {r.equityMultiple != null && (
              <MetricCard
                label="Equity Multiple"
                value={`${r.equityMultiple.toFixed(2)}x`}
                subtitle={`${state.holdPeriod}-year hold`}
              />
            )}
          </View>
        </>
      )}

      {/* Financing Summary */}
      <Text style={styles.sectionTitle}>Financing Summary</Text>
      <View style={styles.breakdownCard}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Down Payment</Text>
          <Text style={styles.breakdownValue}>{fmtCurrency(r.financing.downPayment)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Loan Amount</Text>
          <Text style={styles.breakdownValue}>{fmtCurrency(r.financing.loanAmount)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Monthly Payment</Text>
          <Text style={styles.breakdownValue}>{fmtCurrency(r.financing.monthlyPayment)}/mo</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Total Cash Required</Text>
          <Text style={styles.breakdownBold}>{fmtCurrency(r.financing.totalCashRequired)}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <Pressable
          style={[styles.actionButton, saving && styles.actionButtonDisabled]}
          onPress={async () => {
            if (!isAuthenticated) {
              Alert.alert("Sign In Required", "Please sign in to save analyses.", [
                { text: "OK" },
              ]);
              return;
            }
            setSaving(true);
            try {
              const input: AnalysisInput = {
                property: state.property as Property,
                rentRoll: state.rentRoll,
                expenses: state.expenses,
                financing: state.financing,
                valueAdd: state.valueAdd,
                holdPeriod: state.holdPeriod,
                exitCapRate: state.exitCapRate,
              };
              if (state.analysisId) {
                await api.updateAnalysis(state.analysisId, input);
                Alert.alert("Updated", "Analysis updated successfully.");
              } else {
                const { id } = await api.createAnalysis(input);
                dispatch({ type: "SET_ANALYSIS_ID", analysisId: id });
                Alert.alert("Saved", "Analysis saved successfully.", [
                  { text: "Dashboard", onPress: () => router.replace("/(tabs)") },
                  { text: "Stay Here" },
                ]);
              }
            } catch (err) {
              const message = err instanceof Error ? err.message : "Save failed";
              Alert.alert("Error", message);
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#003366" />
          ) : (
            <Text style={styles.actionButtonText}>
              {state.analysisId ? "Update" : "Save Analysis"}
            </Text>
          )}
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push("/analysis/scenarios")}
        >
          <Text style={styles.actionButtonText}>Run Scenario</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() =>
            exportPdf({
              property: state.property as Property,
              financing: state.financing,
              holdPeriod: state.holdPeriod,
              results: r,
            })
          }
        >
          <Text style={styles.actionButtonText}>Export PDF</Text>
        </Pressable>
      </View>

      <View style={styles.navRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back to Assumptions</Text>
        </Pressable>
        <Pressable
          style={styles.homeButton}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.homeButtonText}>Dashboard</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 16, color: "#666", marginTop: 12 },
  errorText: { fontSize: 14, color: "#c00", textAlign: "center", marginBottom: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#003366",
    marginTop: 24,
    marginBottom: 12,
  },
  metricsRow: { flexDirection: "row", marginBottom: 8 },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    minWidth: 100,
    flex: 1,
  },
  metricLabel: { fontSize: 11, color: "#666", marginBottom: 4 },
  metricValue: { fontSize: 16, fontWeight: "700", color: "#003366" },
  breakdownCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 16,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  breakdownSubtotal: {
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 8,
    marginTop: 4,
  },
  breakdownLabel: { fontSize: 13, color: "#555" },
  breakdownValue: { fontSize: 13, color: "#333", fontWeight: "500" },
  breakdownBold: { fontSize: 14, color: "#003366", fontWeight: "700" },
  rangeRow: { flexDirection: "row", gap: 8 },
  rangeCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  rangeCardMid: {
    backgroundColor: "#e8f0fe",
    borderWidth: 1,
    borderColor: "#003366",
  },
  rangeLabel: { fontSize: 11, color: "#666", marginBottom: 4 },
  rangeValue: { fontSize: 16, fontWeight: "700" },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  compareCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  compareCardHighlight: { backgroundColor: "#e8ffe8" },
  compareLabel: { fontSize: 11, color: "#666", marginBottom: 4 },
  compareValue: { fontSize: 16, fontWeight: "700", color: "#003366" },
  arrow: { fontSize: 20, color: "#003366" },
  returnsRow: { flexDirection: "row", gap: 10 },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#003366",
    alignItems: "center",
  },
  actionButtonDisabled: { opacity: 0.5 },
  actionButtonText: { color: "#003366", fontSize: 13, fontWeight: "600" },
  navRow: { flexDirection: "row", gap: 12, marginTop: 16, marginBottom: 40 },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#003366",
  },
  backButtonText: { color: "#003366", fontSize: 14, fontWeight: "600" },
  homeButton: {
    flex: 1,
    backgroundColor: "#003366",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  homeButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
