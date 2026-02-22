import { View, Text, StyleSheet } from "react-native";
import type { PropertyLookupResult } from "@dealscope/core";

interface Props {
  data: PropertyLookupResult;
}

function SourceBadge({ source }: { source: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{source}</Text>
    </View>
  );
}

function DataRow({
  label,
  value,
  source,
}: {
  label: string;
  value: string;
  source: string;
}) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <View style={styles.dataRight}>
        <Text style={styles.dataValue}>{value}</Text>
        <SourceBadge source={source} />
      </View>
    </View>
  );
}

export function FetchedDataCard({ data }: Props) {
  const { mortgageRate, fairMarketRent, demographics, floodZone, unemployment } = data;

  return (
    <View style={styles.container}>
      {/* Mortgage Rate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Rates</Text>
        <DataRow
          label="30-Year Fixed"
          value={mortgageRate.rate ? `${mortgageRate.rate.toFixed(2)}%` : "N/A"}
          source="FRED"
        />
        {mortgageRate.date && (
          <Text style={styles.dateText}>As of {mortgageRate.date}</Text>
        )}
      </View>

      {/* Fair Market Rents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fair Market Rents</Text>
        <DataRow label="Efficiency" value={`$${fairMarketRent.efficiency.toLocaleString()}`} source="HUD" />
        <DataRow label="1 Bedroom" value={`$${fairMarketRent.oneBed.toLocaleString()}`} source="HUD" />
        <DataRow label="2 Bedroom" value={`$${fairMarketRent.twoBed.toLocaleString()}`} source="HUD" />
        <DataRow label="3 Bedroom" value={`$${fairMarketRent.threeBed.toLocaleString()}`} source="HUD" />
        <DataRow label="4 Bedroom" value={`$${fairMarketRent.fourBed.toLocaleString()}`} source="HUD" />
      </View>

      {/* Demographics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Area Demographics</Text>
        <DataRow
          label="Median Income"
          value={demographics.medianIncome ? `$${demographics.medianIncome.toLocaleString()}` : "N/A"}
          source="Census"
        />
        <DataRow
          label="Population"
          value={demographics.population ? demographics.population.toLocaleString() : "N/A"}
          source="Census"
        />
        <DataRow
          label="Median Age"
          value={demographics.medianAge ? demographics.medianAge.toFixed(1) : "N/A"}
          source="Census"
        />
        <DataRow
          label="Median Home Value"
          value={demographics.medianHomeValue ? `$${demographics.medianHomeValue.toLocaleString()}` : "N/A"}
          source="Census"
        />
        <DataRow
          label="Median Gross Rent"
          value={demographics.medianGrossRent ? `$${demographics.medianGrossRent.toLocaleString()}` : "N/A"}
          source="Census"
        />
        <DataRow
          label="Vacancy Rate"
          value={demographics.vacancyRate ? `${demographics.vacancyRate.toFixed(1)}%` : "N/A"}
          source="Census"
        />
      </View>

      {/* Flood Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Flood Zone</Text>
        <DataRow label="Zone" value={floodZone.zone} source="FEMA" />
        <DataRow
          label="SFHA Status"
          value={floodZone.sfha ? "In Flood Zone" : "Not in Flood Zone"}
          source="FEMA"
        />
        {floodZone.sfha && (
          <View style={styles.riskBadge}>
            <Text style={styles.riskBadgeText}>Flood Risk</Text>
          </View>
        )}
      </View>

      {/* Unemployment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Employment</Text>
        <DataRow
          label="Unemployment Rate"
          value={unemployment.rate ? `${unemployment.rate.toFixed(1)}%` : "N/A"}
          source="BLS"
        />
        {unemployment.period && (
          <Text style={styles.dateText}>{unemployment.period}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  section: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#003366",
    marginBottom: 10,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  dataLabel: { fontSize: 13, color: "#555" },
  dataRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  dataValue: { fontSize: 13, fontWeight: "600", color: "#333" },
  badge: {
    backgroundColor: "#e8f0fe",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { fontSize: 9, fontWeight: "700", color: "#003366" },
  dateText: { fontSize: 11, color: "#999", marginTop: 4 },
  riskBadge: {
    backgroundColor: "#ffebee",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  riskBadgeText: { fontSize: 11, fontWeight: "700", color: "#c00" },
});
