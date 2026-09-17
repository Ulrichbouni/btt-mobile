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
  Linking,
} from "react-native";

import api from "../services/api";

const STATUTS = ["envoye", "accepte", "paye", "annule"];

export default function AdminDevisScreen() {
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("tous");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    remise_pourcentage: "",
    frais_transport: "",
    frais_divers: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/devis/admin/tous");
      setDevis(data);
    } catch (e) {
      Alert.alert("Erreur", e.response?.data?.error || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "tous") return devis;
    return devis.filter((d) => d.statut === filter);
  }, [devis, filter]);

  const startEdit = (d) => {
    setEditingId(d.id);
    setEditForm({
      remise_pourcentage: String(d.remise_pourcentage || 0),
      frais_transport: String(d.frais_transport || 0),
      frais_divers: String(d.frais_divers || 0),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      remise_pourcentage: "",
      frais_transport: "",
      frais_divers: "",
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/devis/${editingId}`, {
        remise_pourcentage: Number(editForm.remise_pourcentage) || 0,
        frais_transport: Number(editForm.frais_transport) || 0,
        frais_divers: Number(editForm.frais_divers) || 0,
      });
      Alert.alert("Succès", "Devis mis à jour");
      cancelEdit();
      await load();
    } catch (e) {
      Alert.alert(
        "Erreur",
        e.response?.data?.error || "Mise à jour impossible",
      );
    } finally {
      setSaving(false);
    }
  };

  const valider = (id) => {
    Alert.alert(
      "Valider le devis",
      "Le devis devient payable et un chantier sera créé. Confirmer ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Valider",
          onPress: async () => {
            try {
              await api.post(`/devis/${id}/valider`);
              Alert.alert("Succès", "Devis validé, chantier créé");
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

  const supprimer = (id) => {
    Alert.alert("Confirmation", "Supprimer ce devis ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/devis/${id}`);
            Alert.alert("Succès", "Devis supprimé");
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

  const voirPDF = async (id) => {
    const url = `${api.defaults.baseURL}/devis/${id}/pdf`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert("Erreur", "Impossible d'ouvrir le PDF");
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'ouvrir le PDF");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Devis</Text>

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

      {editingId && (
        <View style={styles.editCard}>
          <Text style={styles.editTitle}>Ajuster le devis #{editingId}</Text>
          <TextInput
            style={styles.input}
            placeholder="Remise (%)"
            keyboardType="numeric"
            value={editForm.remise_pourcentage}
            onChangeText={(v) =>
              setEditForm((f) => ({ ...f, remise_pourcentage: v }))
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Frais transport"
            keyboardType="numeric"
            value={editForm.frais_transport}
            onChangeText={(v) =>
              setEditForm((f) => ({ ...f, frais_transport: v }))
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Frais divers"
            keyboardType="numeric"
            value={editForm.frais_divers}
            onChangeText={(v) =>
              setEditForm((f) => ({ ...f, frais_divers: v }))
            }
          />
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.disabled]}
            onPress={saveEdit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.white}>Enregistrer</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
            <Text style={styles.white}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#b45309" />
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>Aucun devis pour ce filtre.</Text>
      ) : (
        filtered.map((d) => (
          <View key={d.id} style={styles.card}>
            <Text style={styles.name}>Devis #{d.id}</Text>
            <Text style={styles.meta}>Client : {d.client_nom || "—"}</Text>
            <Text style={styles.meta}>Ville : {d.ville || "—"}</Text>
            <Text style={styles.meta}>
              Surface : {d.surface ? `${d.surface} m²` : "—"}
            </Text>
            <Text style={styles.meta}>
              Total :{" "}
              {d.total_final != null
                ? Number(d.total_final).toLocaleString()
                : "à définir"}{" "}
              FCFA
            </Text>
            <Text style={styles.statut}>Statut : {d.statut || "—"}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => startEdit(d)}
              >
                <Text style={styles.white}>Ajuster</Text>
              </TouchableOpacity>

              {d.statut === "envoye" && d.total_final != null && (
                <TouchableOpacity
                  style={styles.validBtn}
                  onPress={() => valider(d.id)}
                >
                  <Text style={styles.white}>Valider</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.pdfBtn}
                onPress={() => voirPDF(d.id)}
              >
                <Text style={styles.white}>PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.danger}
                onPress={() => supprimer(d.id)}
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
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#6b7280",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  disabled: { opacity: 0.6 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  name: { fontSize: 17, fontWeight: "700", marginBottom: 5 },
  meta: { color: "#6b7280", marginBottom: 2 },
  statut: {
    fontWeight: "600",
    color: "#92400e",
    marginTop: 6,
    marginBottom: 10,
  },
  actionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  editBtn: {
    backgroundColor: "#0ea5e9",
    padding: 10,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  validBtn: {
    backgroundColor: "#0f766e",
    padding: 10,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  pdfBtn: {
    backgroundColor: "#8b5cf6",
    padding: 10,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  danger: {
    backgroundColor: "#dc2626",
    padding: 10,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  white: { color: "#fff", fontWeight: "700" },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 20 },
});
