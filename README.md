import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

const shortcuts = [
  { label: "Catalogue", route: "Catalogue", emoji: "📦" },
  { label: "Calculateur", route: "Calculator", emoji: "🧮" },
  { label: "Devis", route: "Devis", emoji: "📄" },
  { label: "Paiement", route: "Paiement", emoji: "💳" },
  { label: "Missions", route: "Missions", emoji: "📋" },
  { label: "Notifications", route: "Notifications", emoji: "🔔" },
];

const highlights = [
  { label: "Produits", value: "24", icon: "📦" },
  { label: "Missions", value: "12", icon: "📋" },
  { label: "Paiements", value: "4", icon: "💸" },
];

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>BTT-LUX</Text>
        <Text style={styles.subtitle}>Begueni Timber Trading · Luxerboard</Text>
      </View>

      <View style={styles.summaryRow}>
        {highlights.map((item) => (
          <View key={item.label} style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>{item.icon}</Text>
            <Text style={styles.summaryValue}>{item.value}</Text>
            <Text style={styles.summaryLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {shortcuts.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.card}
            onPress={() => navigation.navigate(item.route)}
            activeOpacity={0.9}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.cardLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#faf7f2",
  },
  hero: {
    backgroundColor: "#fff7ed",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  title: { fontSize: 28, fontWeight: "800", color: "#78350f" },
  subtitle: { fontSize: 14, color: "#92400e", marginTop: 6 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f3e8d4",
  },
  summaryIcon: { fontSize: 20, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: "700", color: "#111827" },
  summaryLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "31%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f2f2f2",
  },
  emoji: { fontSize: 28, marginBottom: 6 },
  cardLabel: { fontSize: 12, fontWeight: "600", color: "#374151", textAlign: "center" },
});
