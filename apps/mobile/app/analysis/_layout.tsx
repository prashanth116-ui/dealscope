import { Stack } from "expo-router";
import { WizardProvider } from "../../components/WizardContext";

export default function AnalysisLayout() {
  return (
    <WizardProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#003366" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen name="new" options={{ title: "Property Basics" }} />
        <Stack.Screen name="rent-roll" options={{ title: "Rent Roll" }} />
        <Stack.Screen name="expenses" options={{ title: "Expenses" }} />
        <Stack.Screen name="financing" options={{ title: "Financing" }} />
        <Stack.Screen name="assumptions" options={{ title: "Assumptions" }} />
        <Stack.Screen name="results" options={{ title: "Results" }} />
        <Stack.Screen name="upload" options={{ title: "Upload Document" }} />
      </Stack>
    </WizardProvider>
  );
}
