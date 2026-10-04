import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

const shortcuts = [
  { label: "Utilisateurs", route: "AdminUsers", icon: "👥", color: "#0ea5e9" },
  { label: "Produits", route: "AdminProducts", icon: "📦", color: "#f59e0b" },
  { label: "Missions", route: "AdminMissions", icon: "📋", color: "#0f766e" },
  { label: "Devis", route: "AdminDevis", icon: "📄", color: "#8b5cf6" },
  { label: "Chantiers", route: "AdminChantiers", icon: "🏗️", color: "#dc2626" },
  { label: "OTP (2FA)", route: "OTPSetup", icon: "🔐", color: "#6b7280" },
];

export default function AdminDashboardScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Espace Admin</Text>
        <Text style={styles.subtitle}>Gestion complète de la plateforme</Text>
      </View>

      <View style={styles.grid}>
        {shortcuts.map((s) => (
          <TouchableOpacity
            key={s.route}
            style={[
              styles.card,
              { borderTopColor: s.color, borderTopWidth: 4 },
            ]}
            onPress={() => navigation.navigate(s.route)}
          >
            <Text style={styles.icon}>{s.icon}</Text>
            <Text style={styles.cardLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: "#faf7f2" },
  header: {
    backgroundColor: "#fff7ed",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: "800", color: "#78350f" },
  subtitle: { fontSize: 13, color: "#92400e", marginTop: 4 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: { fontSize: 32, marginBottom: 8 },
  cardLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
  },
});
