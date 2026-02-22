import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { StepIndicator } from "@dealscope/ui";
import { useWizard } from "./_context";
import { DocumentUploader } from "../../components/DocumentUploader";
import { ExtractionReview } from "../../components/ExtractionReview";
import type {
  DocumentType,
  DocumentStatus,
  ExtractedField,
  ExtractionResult,
} from "@dealscope/core";

const STEP_LABELS = [
  "Property Basics",
  "Rent Roll",
  "Expenses",
  "Financing",
  "Assumptions",
  "Results",
];

const DOC_TYPES: DocumentType[] = [
  "offering_memorandum",
  "rent_roll",
  "trailing_12",
];

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  offering_memorandum: "Offering Memorandum",
  rent_roll: "Rent Roll",
  trailing_12: "Trailing 12 (T12)",
};

interface DocState {
  fileName: string | null;
  status: DocumentStatus | null;
  fields: ExtractedField[];
}

export default function UploadScreen() {
  const { state, dispatch } = useWizard();
  const router = useRouter();

  const [selectedType, setSelectedType] = useState<DocumentType>("offering_memorandum");
  const [docs, setDocs] = useState<Record<DocumentType, DocState>>({
    offering_memorandum: { fileName: null, status: null, fields: [] },
    rent_roll: { fileName: null, status: null, fields: [] },
    trailing_12: { fileName: null, status: null, fields: [] },
  });
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  const currentDoc = docs[selectedType];

  const handlePickFile = useCallback(async () => {
    // In production: use expo-document-picker
    // For now: simulate file selection
    try {
      // Simulated file pick - in production replace with:
      // const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      const simulatedFileName = `sample_${selectedType}.pdf`;
      setDocs((prev) => ({
        ...prev,
        [selectedType]: { ...prev[selectedType], fileName: simulatedFileName },
      }));
    } catch {
      Alert.alert("Error", "Could not select file");
    }
  }, [selectedType]);

  const handleUpload = useCallback(async () => {
    if (!currentDoc.fileName) return;

    // Phase 1: Upload
    setDocs((prev) => ({
      ...prev,
      [selectedType]: { ...prev[selectedType], status: "uploading" },
    }));

    // Simulate upload delay
    await new Promise((r) => setTimeout(r, 1000));

    // Phase 2: Processing
    setDocs((prev) => ({
      ...prev,
      [selectedType]: { ...prev[selectedType], status: "processing" },
    }));

    // In production: POST to /extract endpoint and poll for results
    // For now: simulate extraction with mock data
    await new Promise((r) => setTimeout(r, 2000));

    const mockFields: ExtractedField[] = getMockFields(selectedType);

    setDocs((prev) => ({
      ...prev,
      [selectedType]: {
        ...prev[selectedType],
        status: "complete",
        fields: mockFields,
      },
    }));
  }, [selectedType, currentDoc.fileName]);

  const toggleField = (fieldPath: string) => {
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(fieldPath)) next.delete(fieldPath);
      else next.add(fieldPath);
      return next;
    });
  };

  const acceptAll = () => {
    const all = new Set<string>();
    for (const doc of Object.values(docs)) {
      for (const f of doc.fields) {
        all.add(f.fieldPath);
      }
    }
    setAccepted(all);
  };

  const applyToWizard = () => {
    // Apply accepted fields to wizard state
    for (const doc of Object.values(docs)) {
      for (const field of doc.fields) {
        if (!accepted.has(field.fieldPath)) continue;

        const parts = field.fieldPath.split(".");
        if (parts[0] === "property") {
          dispatch({
            type: "SET_PROPERTY",
            property: { [parts[1]]: field.value },
          });
        }
        // Additional field mappings would go here for rentRoll, expenses, etc.
      }
    }

    Alert.alert(
      "Fields Applied",
      `${accepted.size} fields applied to wizard. Review and adjust as needed.`,
      [{ text: "Continue", onPress: () => router.push("/analysis/new") }]
    );
  };

  const allFields = Object.values(docs).flatMap((d) => d.fields);
  const hasExtractions = allFields.length > 0;

  return (
    <ScrollView style={styles.container}>
      <StepIndicator current={1} total={6} labels={STEP_LABELS} />

      <Text style={styles.title}>Upload Documents</Text>
      <Text style={styles.subtitle}>
        Upload an OM, rent roll, or T12 to auto-fill the analysis wizard.
      </Text>

      {/* Document type selector */}
      <View style={styles.typeRow}>
        {DOC_TYPES.map((dt) => (
          <Pressable
            key={dt}
            style={[styles.typeTab, selectedType === dt && styles.typeTabActive]}
            onPress={() => setSelectedType(dt)}
          >
            <Text
              style={[
                styles.typeText,
                selectedType === dt && styles.typeTextActive,
              ]}
            >
              {DOC_TYPE_LABELS[dt]}
            </Text>
            {docs[dt].status === "complete" && (
              <Text style={styles.typeBadge}>Done</Text>
            )}
          </Pressable>
        ))}
      </View>

      {/* Uploader for selected type */}
      <DocumentUploader
        documentType={selectedType}
        status={currentDoc.status}
        fileName={currentDoc.fileName}
        onPickFile={handlePickFile}
        onUpload={handleUpload}
      />

      {/* Extraction review */}
      {currentDoc.fields.length > 0 && (
        <ExtractionReview
          fields={currentDoc.fields}
          accepted={accepted}
          onToggleField={toggleField}
          onAcceptAll={acceptAll}
        />
      )}

      {/* Apply button */}
      {hasExtractions && accepted.size > 0 && (
        <Pressable style={styles.applyButton} onPress={applyToWizard}>
          <Text style={styles.applyButtonText}>
            Apply {accepted.size} Fields to Wizard
          </Text>
        </Pressable>
      )}

      <Pressable
        style={styles.skipButton}
        onPress={() => router.push("/analysis/new")}
      >
        <Text style={styles.skipButtonText}>Skip - Enter Manually</Text>
      </Pressable>
    </ScrollView>
  );
}

/**
 * Mock extraction fields for development.
 * In production, these come from the extraction API.
 */
function getMockFields(docType: DocumentType): ExtractedField[] {
  if (docType === "offering_memorandum") {
    return [
      {
        fieldPath: "property.units",
        label: "Number of Units",
        value: 10,
        confidence: 0.95,
        sourceLocation: "Page 1, Executive Summary",
      },
      {
        fieldPath: "property.askingPrice",
        label: "Asking Price",
        value: 450000,
        confidence: 0.92,
        sourceLocation: "Page 1, Pricing",
      },
      {
        fieldPath: "property.yearBuilt",
        label: "Year Built",
        value: 1965,
        confidence: 0.88,
        sourceLocation: "Page 3, Property Details",
      },
      {
        fieldPath: "property.buildingSqft",
        label: "Building Sqft",
        value: 5986,
        confidence: 0.91,
        sourceLocation: "Page 3, Property Details",
      },
      {
        fieldPath: "expenses.propertyTax",
        label: "Property Tax",
        value: 4500,
        confidence: 0.85,
        sourceLocation: "Page 5, Financials",
        publicValue: 4200,
        discrepancy: "OM states $4,500 but county records show $4,200 (7% higher in OM)",
      },
      {
        fieldPath: "financing.interestRate",
        label: "Interest Rate (stated)",
        value: 6.5,
        confidence: 0.78,
        sourceLocation: "Page 6, Financing",
        publicValue: 7.1,
        discrepancy: "OM assumes 6.5% but current 30yr avg is 7.1%",
      },
    ];
  }

  if (docType === "rent_roll") {
    return [
      {
        fieldPath: "rentRoll.avgRent",
        label: "Average Rent",
        value: 650,
        confidence: 0.93,
        sourceLocation: "Rent Roll Summary",
        publicValue: 625,
        discrepancy: "Stated avg $650 vs HUD FMR $625 for this ZIP",
      },
      {
        fieldPath: "rentRoll.occupancy",
        label: "Occupancy Rate",
        value: "90%",
        confidence: 0.96,
        sourceLocation: "Rent Roll Summary",
      },
    ];
  }

  // trailing_12
  return [
    {
      fieldPath: "income.egi",
      label: "Effective Gross Income (T12)",
      value: 84000,
      confidence: 0.89,
      sourceLocation: "T12 Income Statement",
    },
    {
      fieldPath: "expenses.total",
      label: "Total Expenses (T12)",
      value: 42000,
      confidence: 0.87,
      sourceLocation: "T12 Expense Summary",
    },
    {
      fieldPath: "expenses.noi",
      label: "Net Operating Income (T12)",
      value: 42000,
      confidence: 0.91,
      sourceLocation: "T12 Bottom Line",
    },
  ];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#003366",
    marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
  typeRow: { marginBottom: 20 },
  typeTab: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
    marginBottom: 6,
    borderRadius: 8,
  },
  typeTabActive: { borderColor: "#003366", backgroundColor: "#f0f4ff" },
  typeText: { fontSize: 14, color: "#666" },
  typeTextActive: { color: "#003366", fontWeight: "600" },
  typeBadge: {
    fontSize: 11,
    color: "#008800",
    fontWeight: "600",
    backgroundColor: "#e8ffe8",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  applyButton: {
    backgroundColor: "#003366",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  applyButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  skipButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  skipButtonText: { color: "#666", fontSize: 14 },
});
