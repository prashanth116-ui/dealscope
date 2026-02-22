import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import type { DocumentType, DocumentStatus } from "@dealscope/core";

interface DocumentUploaderProps {
  documentType: DocumentType;
  status: DocumentStatus | null;
  fileName: string | null;
  onPickFile: () => void;
  onUpload: () => void;
}

const TYPE_LABELS: Record<DocumentType, string> = {
  offering_memorandum: "Offering Memorandum (OM)",
  rent_roll: "Rent Roll",
  trailing_12: "Trailing 12 (T12)",
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  uploading: "Uploading...",
  processing: "Extracting data...",
  complete: "Extraction complete",
  error: "Error - try again",
};

export function DocumentUploader({
  documentType,
  status,
  fileName,
  onPickFile,
  onUpload,
}: DocumentUploaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.typeLabel}>{TYPE_LABELS[documentType]}</Text>

      {!fileName ? (
        <Pressable style={styles.pickArea} onPress={onPickFile}>
          <Text style={styles.pickIcon}>+</Text>
          <Text style={styles.pickText}>Tap to select PDF</Text>
          <Text style={styles.pickHint}>Supports PDF up to 50 pages</Text>
        </Pressable>
      ) : (
        <View style={styles.fileCard}>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          {status && (
            <View style={styles.statusRow}>
              {(status === "uploading" || status === "processing") && (
                <ActivityIndicator size="small" color="#003366" />
              )}
              <Text
                style={[
                  styles.statusText,
                  status === "complete" && styles.statusComplete,
                  status === "error" && styles.statusError,
                ]}
              >
                {STATUS_LABELS[status]}
              </Text>
            </View>
          )}
          {!status && (
            <Pressable style={styles.uploadButton} onPress={onUpload}>
              <Text style={styles.uploadButtonText}>Upload & Extract</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  typeLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  pickArea: {
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
  },
  pickIcon: { fontSize: 32, color: "#003366", marginBottom: 4 },
  pickText: { fontSize: 14, color: "#003366", fontWeight: "600" },
  pickHint: { fontSize: 11, color: "#999", marginTop: 4 },
  fileCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  fileName: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusText: { fontSize: 13, color: "#666" },
  statusComplete: { color: "#008800", fontWeight: "600" },
  statusError: { color: "#c00", fontWeight: "600" },
  uploadButton: {
    backgroundColor: "#003366",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  uploadButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
