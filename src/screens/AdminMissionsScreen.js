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

const STATUTS = ["assignee", "en_cours", "terminee"];

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function AdminMissionsScreen() {
  const [missions, setMissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("tous");

  const [form, setForm] = useState({
    devis_id: "",
    technicien_id: "",
    date_visite: todayISO(),
    statut: "assignee",
  });
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [m, u] = await Promise.all([
        api.get("/missions"),
        api.get("/admin/utilisateurs"),
      ]);
      setMissions(m.data);
      setUsers(u.data.filter((x) => x.role === "technicien"));
    } catch (e) {
      Alert.alert("Erreur", e.response?.data?.error || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredMissions = useMemo(() => {
    if (filter === "tous") return missions;
    return missions.filter((m) => m.statut === filter);
  }, [missions, filter]);

  const resetForm = () => {
    setForm({
      devis_id: "",
      technicien_id: "",
      date_visite: todayISO(),
      statut: "assignee",
    });
    setEditingId(null);
  };

  const submit = async () => {
    if (!form.technicien_id) {
      Alert.alert("Erreur", "Sélectionnez un technicien");
      return;
    }
    if (!editingId && !form.devis_id) {
      Alert.alert("Erreur", "Renseignez l'ID du devis");
      return;
    }

    // Convertir YYYY-MM-DD -> ISO datetime
    const isoDate = `${form.date_visite}T09:00:00.000Z`;

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/missions/${editingId}`, {
          technicien_id: form.technicien_id,
          date_visite: isoDate,
          statut: form.statut,
        });
        Alert.alert("Succès", "Mission mise à jour");
      } else {
        await api.post("/missions", {
          devis_id: Number(form.devis_id),
          technicien_id: form.technicien_id,
          date_visite: isoDate,
        });
        Alert.alert("Succès", "Mission créée");
      }
      resetForm();
      await load();
    } catch (e) {
      const details = e.response?.data?.details;
      const msg =
        details?.map((d) => `${d.champ}: ${d.message}`).join("\n") ||
        e.response?.data?.error ||
        "Opération impossible";
      Alert.alert("Erreur", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (mission) => {
    setEditingId(mission.id);
    setForm({
      devis_id: String(mission.devis_id || ""),
      technicien_id: mission.technicien_id || "",
      date_visite: mission.date_visite
        ? mission.date_visite.slice(0, 10)
        : todayISO(),
      statut: mission.statut || "assignee",
    });
  };

  const remove = (id) => {
    Alert.alert("Confirmation", "Supprimer cette mission ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/missions/${id}`);
            await load();
          } catch (e) {
            Alert.alert(
              "Erreur",
              e.response?.data?.error || "Suppression impossible",
            );
          }
        },
      },
    ]);
  };

  const validerMesures = (missionId) => {
    Alert.alert(
      "Valider les mesures",
      "Cette action marque la mission comme terminée et valide les mesures terrain. Confirmer ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Valider",
          onPress: async () => {
            try {
              await api.put(`/missions/${missionId}/valider`);
              Alert.alert("Succès", "Mesures validées");
              await load();
            } catch (e) {
              Alert.alert(
                "Erreur",
                e.response?.data?.error || "Validation impossible",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Missions</Text>

      {/* --- Formulaire création / édition --- */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {editingId ? `Modifier la mission #${editingId}` : "Nouvelle mission"}
        </Text>

        {!editingId && (
          <TextInput
            style={styles.input}
            placeholder="ID du devis *"
            keyboardType="numeric"
            value={form.devis_id}
            onChangeText={(v) => setForm({ ...form, devis_id: v })}
          />
        )}

        <Text style={styles.label}>Technicien :</Text>
        {users.length === 0 ? (
          <Text style={styles.helper}>Aucun technicien disponible.</Text>
        ) : (
          <View style={styles.chipRow}>
            {users.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={[
                  styles.chip,
                  form.technicien_id === u.id && styles.chipActive,
                ]}
                onPress={() => setForm({ ...form, technicien_id: u.id })}
              >
                <Text
                  style={[
                    styles.chipText,
                    form.technicien_id === u.id && styles.chipTextActive,
                  ]}
                >
                  {u.nom}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Date de visite :</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={form.date_visite}
          onChangeText={(v) => setForm({ ...form, date_visite: v })}
        />

        {editingId && (
          <>
            <Text style={styles.label}>Statut :</Text>
            <View style={styles.chipRow}>
              {STATUTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, form.statut === s && styles.chipActive]}
                  onPress={() => setForm({ ...form, statut: s })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      form.statut === s && styles.chipTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.primary, submitting && styles.disabled]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.white}>
              {editingId ? "Enregistrer" : "Attribuer"}
            </Text>
          )}
        </TouchableOpacity>

        {editingId && (
          <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
            <Text style={styles.white}>Annuler</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* --- Filtres --- */}
      <View style={styles.filters}>
        {["tous", ...STATUTS].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterBtn, filter === s && styles.filterBtnActive]}
            onPress={() => setFilter(s)}
          >
            <Text
              style={[
                styles.filterText,
                filter === s && styles.filterTextActive,
              ]}
            >
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* --- Liste --- */}
      {loading ? (
        <ActivityIndicator size="large" color="#b45309" />
      ) : filteredMissions.length === 0 ? (
        <Text style={styles.empty}>Aucune mission pour ce filtre.</Text>
      ) : (
        filteredMissions.map((m) => (
          <View style={styles.card} key={m.id}>
            <Text style={styles.name}>Mission #{m.id}</Text>
            <Text style={styles.meta}>Client : {m.client_nom || "—"}</Text>
            <Text style={styles.meta}>
              Technicien : {m.technicien_nom || "—"}
            </Text>
            <Text style={styles.meta}>Statut : {m.statut || "—"}</Text>
            {m.date_visite && (
              <Text style={styles.meta}>
                Date : {new Date(m.date_visite).toLocaleDateString()}
              </Text>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => startEdit(m)}
              >
                <Text style={styles.white}>Modifier</Text>
              </TouchableOpacity>

              {m.statut !== "terminee" && (
                <TouchableOpacity
                  style={styles.validateBtn}
                  onPress={() => validerMesures(m.id)}
                >
                  <Text style={styles.white}>Valider</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.danger}
                onPress={() => remove(m.id)}
              >
                <Text style={styles.white}>Suppr.</Text>
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
  form: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400e",
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginTop: 8,
    marginBottom: 4,
  },
  helper: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 11,
    marginBottom: 9,
    backgroundColor: "#fff",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chipActive: { backgroundColor: "#b45309", borderColor: "#b45309" },
  chipText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  primary: {
    backgroundColor: "#b45309",
    padding: 11,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#6b7280",
    padding: 11,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  disabled: { opacity: 0.6 },
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
  filterText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  filterTextActive: { color: "#fff" },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  name: { fontSize: 17, fontWeight: "700", marginBottom: 5 },
  meta: { color: "#6b7280", marginBottom: 2 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  editBtn: {
    backgroundColor: "#0ea5e9",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    paddingHorizontal: 14,
  },
  validateBtn: {
    backgroundColor: "#0f766e",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    paddingHorizontal: 14,
  },
  danger: {
    backgroundColor: "#dc2626",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    paddingHorizontal: 14,
  },
  white: { color: "#fff", fontWeight: "700" },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 20 },
});
