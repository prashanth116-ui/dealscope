import { View, Text, StyleSheet, TextInput, ScrollView, Pressable } from "react-native";
import { useState } from "react";

/**
 * Step 1 of the analysis wizard: Property basics.
 * Full wizard flow will be built out with steps 2-6.
 */
export default function NewAnalysisScreen() {
  const [address, setAddress] = useState("");
  const [units, setUnits] = useState("");
  const [price, setPrice] = useState("");
  const [sqft, setSqft] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.stepLabel}>Step 1 of 6</Text>
      <Text style={styles.title}>Property Basics</Text>

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        placeholder="123 Main St, Dayton, OH 45406"
        value={address}
        onChangeText={setAddress}
      />

      <Text style={styles.label}>Number of Units</Text>
      <TextInput
        style={styles.input}
        placeholder="10"
        keyboardType="numeric"
        value={units}
        onChangeText={setUnits}
      />

      <Text style={styles.label}>Asking Price ($)</Text>
      <TextInput
        style={styles.input}
        placeholder="450000"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      <Text style={styles.label}>Building Sqft</Text>
      <TextInput
        style={styles.input}
        placeholder="5986"
        keyboardType="numeric"
        value={sqft}
        onChangeText={setSqft}
      />

      <Text style={styles.label}>Year Built</Text>
      <TextInput
        style={styles.input}
        placeholder="1965"
        keyboardType="numeric"
        value={yearBuilt}
        onChangeText={setYearBuilt}
      />

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Fetch Data & Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  stepLabel: { fontSize: 12, color: "#999", marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "bold", color: "#003366", marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  button: {
    backgroundColor: "#003366",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 32,
    marginBottom: 40,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
