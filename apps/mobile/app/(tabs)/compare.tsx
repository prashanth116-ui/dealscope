import { View, Text, StyleSheet } from "react-native";

export default function CompareScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compare Deals</Text>
      <Text style={styles.subtitle}>Select 2-4 deals to compare side by side</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5" },
  title: { fontSize: 22, fontWeight: "bold", color: "#003366", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666" },
});
