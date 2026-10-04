import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";

import api from "../services/api";

const ROLES = ["client", "technicien", "admin"];

export default function AdminUsersScreen({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("tous");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    nom: "",
    email: "",
    telephone: "",
  });
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/utilisateurs");
      setUsers(data);
    } catch (error) {
      Alert.alert(
        "Erreur",
        error.response?.data?.error || "Impossible de charger les utilisateurs",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (filter === "tous") return users;
    return users.filter((u) => u.role === filter);
  }, [users, filter]);

  const updateRole = async (userId, role) => {
    try {
      await api.put(`/admin/utilisateurs/${userId}/role`, { role });
      Alert.alert("Succès", `Rôle mis à jour : ${role}`);
      loadUsers();
    } catch (error) {
      Alert.alert(
        "Erreur",
        error.response?.data?.error || "Impossible de modifier le rôle",
      );
    }
  };

  const deleteUser = (userId) => {
    if (currentUser?.id === userId) {
      Alert.alert(
        "Impossible",
        "Vous ne pouvez pas supprimer votre propre compte.",
      );
      return;
    }
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
            Alert.alert(
              "Erreur",
              error.response?.data?.error || "Suppression impossible",
            );
          }
        },
      },
    ]);
  };

  const startEdit = (user) => {
    setEditingUser(user.id);
    setEditForm({
      nom: user.nom || "",
      email: user.email || "",
      telephone: user.telephone || "",
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({ nom: "", email: "", telephone: "" });
  };

  const saveEdit = async () => {
    if (!editForm.nom.trim() || !editForm.email.trim()) {
      Alert.alert("Erreur", "Nom et email sont requis.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/admin/utilisateurs/${editingUser}`, {
        nom: editForm.nom.trim(),
        email: editForm.email.trim(),
        telephone: editForm.telephone.trim() || undefined,
      });
      Alert.alert("Succès", "Utilisateur mis à jour");
      cancelEdit();
      loadUsers();
    } catch (error) {
      Alert.alert(
        "Erreur",
        error.response?.data?.error || "Mise à jour impossible",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Utilisateurs</Text>

      <View style={styles.filters}>
        {["tous", ...ROLES].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.filterBtn, filter === r && styles.filterBtnActive]}
            onPress={() => setFilter(r)}
          >
            <Text
              style={[
                styles.filterText,
                filter === r && styles.filterTextActive,
              ]}
            >
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {editingUser && (
        <View style={styles.editCard}>
          <Text style={styles.editTitle}>
            Modifier l'utilisateur #{editingUser}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Nom"
            value={editForm.nom}
            onChangeText={(v) => setEditForm((f) => ({ ...f, nom: v }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={editForm.email}
            onChangeText={(v) => setEditForm((f) => ({ ...f, email: v }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Téléphone"
            keyboardType="phone-pad"
            value={editForm.telephone}
            onChangeText={(v) => setEditForm((f) => ({ ...f, telephone: v }))}
          />
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={saveEdit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
            <Text style={styles.buttonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#b45309" />
      ) : filteredUsers.length === 0 ? (
        <Text style={styles.empty}>Aucun utilisateur pour ce filtre.</Text>
      ) : (
        filteredUsers.map((user) => (
          <View key={user.id} style={styles.card}>
            <Text style={styles.name}>{user.nom}</Text>
            <Text style={styles.meta}>{user.email}</Text>
            <Text style={styles.meta}>Téléphone : {user.telephone || "—"}</Text>
            <Text style={styles.role}>Rôle : {user.role}</Text>

            <View style={styles.actionRow}>
              {ROLES.filter((r) => r !== user.role).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={styles.button}
                  onPress={() => updateRole(user.id, r)}
                >
                  <Text style={styles.buttonText}>{r}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => startEdit(user)}
              >
                <Text style={styles.buttonText}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteUser(user.id)}
              >
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
  container: { flexGrow: 1, padding: 16, backgroundColor: "#faf7f2" },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#92400e",
    marginBottom: 16,
  },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  filterBtnActive: { backgroundColor: "#b45309", borderColor: "#b45309" },
  filterText: { color: "#374151", fontWeight: "600", fontSize: 12 },
  filterTextActive: { color: "#fff" },
  editCard: {
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#b45309",
  },
  editTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400e",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  saveBtn: {
    backgroundColor: "#0f766e",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#6b7280",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f3e8d4",
  },
  name: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  meta: { color: "#6b7280", marginBottom: 2 },
  role: { fontWeight: "600", color: "#92400e", marginTop: 6, marginBottom: 10 },
  actionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  button: {
    backgroundColor: "#b45309",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editButton: {
    backgroundColor: "#0ea5e9",
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
  buttonText: { color: "#fff", fontWeight: "600" },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 20 },
});
