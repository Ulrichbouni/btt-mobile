import React, { useEffect, useState } from "react";
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

const defaultForm = {
  devis_id: "",
  technicien_id: "",
  date_visite: "",
};

export default function AdminMissionsScreen() {
  const [missions, setMissions] = useState([]);
  const [techniciens, setTechniciens] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [missionsResponse, usersResponse] = await Promise.all([
        api.get("/admin/missions"),
        api.get("/admin/utilisateurs"),
      ]);

      setMissions(missionsResponse.data);
      setTechniciens(usersResponse.data.filter((u) => u.role === "technicien" || u.role === "admin"));
    } catch (error) {
      Alert.alert("Erreur", error.response?.data?.error || "Impossible de charger les missions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const assignMission = async () => {
    if (!form.devis_id || !form.technicien_id || !form.date_visite) {
      Alert.alert("Erreur", "Remplissez le devis, le technicien et la date.");
      return;
    }

    try {
      await api.post("/missions", {
        devis_id: Number(form.devis_id),
        technicien_id: Number(form.technicien_id),
        date_visite: form.date_visite,
      });
      Alert.alert("Succès", "Mission attribuée");
      setForm(defaultForm);
      loadAll();
    } catch (error) {
      Alert.alert("Erreur", error.response?.data?.error || "Impossible d’attribuer la mission");
    }
  };

  const deleteMission = async (missionId) => {
    Alert.alert("Confirmation", "Supprimer cette mission ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/missions/${missionId}`);
            Alert.alert("Succès", "Mission supprimée");
            loadAll();
          } catch (error) {
            Alert.alert("Erreur", error.response?.data?.error || "Suppression impossible");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Missions</Text>

      <View style={styles.formCard}>
        <TextInput style={styles.input} placeholder="ID devis" keyboardType="numeric" value={form.devis_id} onChangeText={(v) => setForm({ ...form, devis_id: v })} />
        <TextInput style={styles.input} placeholder="ID technicien" keyboardType="numeric" value={form.technicien_id} onChangeText={(v) => setForm({ ...form, technicien_id: v })} />
        <TextInput style={styles.input} placeholder="Date visite (YYYY-MM-DD)" value={form.date_visite} onChangeText={(v) => setForm({ ...form, date_visite: v })} />
        <TouchableOpacity style={styles.submitButton} onPress={assignMission}>
          <Text style={styles.buttonText}>Attribuer mission</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#b45309" />
      ) : (
        missions.map((mission) => (
          <View key={mission.id} style={styles.card}>
            <Text style={styles.missionTitle}>Mission #{mission.id}</Text>
            <Text style={styles.meta}>Client: {mission.client_nom || "—"}</Text>
            <Text style={styles.meta}>Technicien: {mission.technicien_nom || "—"}</Text>
            <Text style={styles.meta}>Date: {mission.date_visite || "—"}</Text>
            <Text style={styles.meta}>Statut: {mission.statut || "—"}</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={() => deleteMission(mission.id)}>
              <Text style={styles.buttonText}>Supprimer</Text>
            </TouchableOpacity>
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
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f3e8d4",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  submitButton: {
    backgroundColor: "#b45309",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginTop: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f3e8d4",
  },
  missionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  meta: {
    color: "#6b7280",
    marginBottom: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
