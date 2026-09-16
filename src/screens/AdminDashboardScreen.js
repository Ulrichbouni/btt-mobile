import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

const shortcuts = [
  { label: "Utilisateurs", route: "AdminUsers", icon: "👥" },
  { label: "Produits", route: "AdminProducts", icon: "📦" },
  { label: "Missions", route: "AdminMissions", icon: "📋" },
  { label: "OTP", route: "OTPSetup", icon: "🔐" },
];

export default function AdminDashboardScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Administration</Text>
      <Text style={styles.subtitle}>Gestion du backend BTT-LUX</Text>

      <View style={styles.grid}>
        {shortcuts.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.card}
            onPress={() => navigation.navigate(item.route)}
            activeOpacity={0.9}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#faf7f2",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#78350f",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#7c2d12",
    marginBottom: 22,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#f3e8d4",
  },
  icon: {
    fontSize: 30,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
});
