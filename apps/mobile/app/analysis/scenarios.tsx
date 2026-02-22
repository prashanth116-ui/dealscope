import { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useWizard } from "../../components/WizardContext";
import { ScenarioSliders } from "../../components/ScenarioSliders";
import { ScenarioComparison } from "../../components/ScenarioComparison";
import { SensitivityGrid } from "../../components/SensitivityGrid";
import { applyScenario } from "@dealscope/core";
import type { AnalysisInput, AnalysisResults, ScenarioOverrides, Property } from "@dealscope/core";

interface SavedScenario {
  id: string;
  name: string;
  overrides: ScenarioOverrides;
  results: AnalysisResults;
}

export default function ScenariosScreen() {
  const { state } = useWizard();
  const router = useRouter();

  const baseInput = useMemo<AnalysisInput>(
    () => ({
      property: state.property as Property,
      rentRoll: state.rentRoll,
      expenses: state.expenses,
      financing: state.financing,
      valueAdd: state.valueAdd,
      holdPeriod: state.holdPeriod,
      exitCapRate: state.exitCapRate,
    }),
    [state]
  );

  const baseResults = state.results!;

  // Slider preview
  const [currentOverrides, setCurrentOverrides] = useState<ScenarioOverrides>({});
  const previewResults = useMemo(() => {
    if (Object.keys(currentOverrides).length === 0) return baseResults;
    return applyScenario(baseInput, currentOverrides);
  }, [baseInput, currentOverrides, baseResults]);

  // Saved scenarios
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [showNameInput, setShowNameInput] = useState(false);
  const [scenarioName, setScenarioName] = useState("");

  const handleSaveScenario = useCallback(() => {
    if (!scenarioName.trim()) return;
    const results = applyScenario(baseInput, currentOverrides);
    const newScenario: SavedScenario = {
      id: Date.now().toString(),
      name: scenarioName.trim(),
      overrides: { ...currentOverrides },
      results,
    };
    setScenarios((prev) => [...prev, newScenario]);
    setScenarioName("");
    setShowNameInput(false);
  }, [scenarioName, currentOverrides, baseInput]);

  const handleDeleteScenario = useCallback((id: string) => {
    Alert.alert("Delete Scenario", "Remove this scenario?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setScenarios((prev) => prev.filter((s) => s.id !== id)),
      },
    ]);
  }, []);

  // Compute vacancy from units
  const vacantUnits = state.rentRoll.units.filter((u) => u.status !== "occupied").length;
  const totalUnits = state.rentRoll.units.length;
  const baseVacancy = totalUnits > 0 ? Math.round((vacantUnits / totalUnits) * 100) : 5;

  return (
    <ScrollView style={styles.container}>
      {/* Back nav */}
      <Pressable onPress={() => router.back()} style={styles.backLink}>
        <Text style={styles.backLinkText}>{"< Back to Results"}</Text>
      </Pressable>

      {/* Sliders */}
      <ScenarioSliders
        basePrice={state.property.askingPrice ?? 0}
        baseRate={state.financing.interestRate}
        baseVacancy={baseVacancy}
        baseRentGrowth={state.valueAdd.rentGrowthRate}
        onOverridesChange={setCurrentOverrides}
        previewResults={previewResults}
      />

      {/* Save Scenario */}
      <View style={styles.saveSection}>
        {!showNameInput ? (
          <View style={styles.saveBtnRow}>
            <Pressable
              style={[styles.saveBtn, scenarios.length >= 4 && styles.saveBtnDisabled]}
              onPress={() => {
                if (scenarios.length < 4) setShowNameInput(true);
              }}
              disabled={scenarios.length >= 4}
            >
              <Text style={styles.saveBtnText}>+ Add Scenario</Text>
            </Pressable>
            {scenarios.length >= 4 && (
              <Text style={styles.limitText}>Max 4 scenarios</Text>
            )}
          </View>
        ) : (
          <View style={styles.nameInputRow}>
            <TextInput
              style={styles.nameInput}
              placeholder="Scenario name (e.g., Best Case)"
              value={scenarioName}
              onChangeText={setScenarioName}
              autoFocus
            />
            <Pressable style={styles.confirmBtn} onPress={handleSaveScenario}>
              <Text style={styles.confirmBtnText}>Save</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => setShowNameInput(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {/* Saved Scenario Cards */}
        {scenarios.map((s) => (
          <View key={s.id} style={styles.scenarioCard}>
            <View style={styles.scenarioHeader}>
              <Text style={styles.scenarioName}>{s.name}</Text>
              <Pressable onPress={() => handleDeleteScenario(s.id)}>
                <Text style={styles.deleteText}>Remove</Text>
              </Pressable>
            </View>
            <View style={styles.scenarioMetrics}>
              <Text style={styles.scenarioMetric}>
                Cap: {s.results.capRate.mid.toFixed(2)}%
              </Text>
              <Text style={styles.scenarioMetric}>
                CoC: {s.results.cashOnCash.mid.toFixed(2)}%
              </Text>
              <Text style={styles.scenarioMetric}>
                CF: ${Math.round(s.results.monthlyCashFlow.mid).toLocaleString()}/mo
              </Text>
            </View>
            {Object.entries(s.overrides).length > 0 && (
              <Text style={styles.overridesSummary}>
                Changes: {Object.entries(s.overrides).map(([k, v]) => `${k}: ${v}`).join(", ")}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Comparison Table */}
      {scenarios.length > 0 && (
        <ScenarioComparison
          base={{ name: "Base Case", results: baseResults }}
          scenarios={scenarios.map((s) => ({ name: s.name, results: s.results }))}
        />
      )}

      {/* Sensitivity Matrix */}
      <SensitivityGrid baseInput={baseInput} />

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  backLink: { marginBottom: 16 },
  backLinkText: { fontSize: 14, color: "#003366", fontWeight: "600" },
  saveSection: { marginVertical: 16 },
  saveBtnRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  saveBtn: {
    backgroundColor: "#003366",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnDisabled: { backgroundColor: "#99aabb" },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  limitText: { fontSize: 12, color: "#999" },
  nameInputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  confirmBtn: {
    backgroundColor: "#003366",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  cancelBtnText: { color: "#666", fontSize: 14 },
  scenarioCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#003366",
  },
  scenarioHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  scenarioName: { fontSize: 14, fontWeight: "700", color: "#003366" },
  deleteText: { fontSize: 12, color: "#c00" },
  scenarioMetrics: { flexDirection: "row", gap: 12 },
  scenarioMetric: { fontSize: 12, color: "#555" },
  overridesSummary: { fontSize: 11, color: "#999", marginTop: 6 },
});
