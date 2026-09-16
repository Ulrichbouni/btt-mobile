import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";

import api from "../services/api";

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/utilisateurs");
      setUsers(data);
    } catch (error) {
      Alert.alert("Erreur", error.response?.data?.error || "Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateRole = async (userId, role) => {
    try {
      await api.put(`/admin/utilisateurs/${userId}/role`, { role });
      Alert.alert("Succès", `Rôle mis à jour : ${role}`);
      loadUsers();
    } catch (error) {
      Alert.alert("Erreur", error.response?.data?.error || "Impossible de modifier le rôle");
    }
  };

  const deleteUser = async (userId) => {
    Alert.alert("Confirmation", "Supprimer cet utilisateur ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/admin/utilisateurs/${userId}`);
            Alert.alert("Succès", "Utilisateur supprimé");
            loadUsers();
          } catch (error) {
            Alert.alert("Erreur", error.response?.data?.error || "Suppression impossible");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Utilisateurs</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#b45309" />
      ) : (
        users.map((user) => (
          <View key={user.id} style={styles.card}>
            <Text style={styles.name}>{user.nom}</Text>
            <Text style={styles.meta}>{user.email}</Text>
            <Text style={styles.meta}>Téléphone: {user.telephone || "—"}</Text>
            <Text style={styles.role}>Rôle: {user.role}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.button} onPress={() => updateRole(user.id, "technicien")}>
                <Text style={styles.buttonText}>Technicien</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonSecondary} onPress={() => updateRole(user.id, "client")}>
                <Text style={styles.buttonText}>Client</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteUser(user.id)}>
                <Text style={styles.buttonText}>Suppr.</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#faf7f2",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#92400e",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f3e8d4",
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  meta: {
    color: "#6b7280",
    marginBottom: 2,
  },
  role: {
    fontWeight: "600",
    color: "#92400e",
    marginTop: 6,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  button: {
    backgroundColor: "#b45309",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonSecondary: {
    backgroundColor: "#0f766e",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
