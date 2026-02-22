import { View, Text, StyleSheet, Pressable } from "react-native";
import { Link } from "expo-router";

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>DealScope</Text>
      <Text style={styles.subtitle}>Your deals will appear here</Text>

      <Link href="/analysis/new" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>+ New Analysis</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#003366",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
