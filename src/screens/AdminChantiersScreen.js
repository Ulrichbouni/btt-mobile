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

const ETAPES = [
  "Devis reçu",
  "Visite technique",
  "Commande validée",
  "Livraison",
  "Pose en cours",
  "Chantier terminé",
];

export default function AdminChantiersScreen({ navigation }) {
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/chantiers/admin/tous");
      setChantiers(data);
    } catch (e) {
      Alert.alert("Erreur", e.response?.data?.error || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", load);
    return unsubscribe;
  }, [navigation]);

  const avancer = (id, etapeActuelle) => {
    const idx = ETAPES.indexOf(etapeActuelle);
    if (idx >= ETAPES.length - 1) {
      Alert.alert("Info", "Chantier déjà à la dernière étape.");
      return;
    }
    const prochaine = ETAPES[idx + 1];
    Alert.alert("Avancer le chantier", `Passer à l'étape « ${prochaine} » ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Avancer",
        onPress: async () => {
          try {
            await api.put(`/chantiers/${id}/avancer`);
            Alert.alert("Succès", `Étape : ${prochaine}`);
            await load();
          } catch (e) {
            Alert.alert(
              "Erreur",
              e.response?.data?.error || "Impossible d'avancer",
            );
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Chantiers</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#b45309" />
      ) : chantiers.length === 0 ? (
        <Text style={styles.empty}>Aucun chantier pour le moment.</Text>
      ) : (
        chantiers.map((c) => {
          const idx = ETAPES.indexOf(c.etape);
          const progress = idx >= 0 ? ((idx + 1) / ETAPES.length) * 100 : 0;
          const nbPhotosAvant = Array.isArray(c.photos_avant)
            ? c.photos_avant.length
            : 0;
          const nbPhotosApres = Array.isArray(c.photos_apres)
            ? c.photos_apres.length
            : 0;

          return (
            <View key={c.id} style={styles.card}>
              <Text style={styles.name}>
                Chantier #{c.id} — Devis #{c.devis_id}
              </Text>
              <Text style={styles.meta}>Client : {c.client_nom || "—"}</Text>
              <Text style={styles.meta}>Ville : {c.ville || "—"}</Text>
              <Text style={styles.meta}>
                Technicien : {c.technicien_nom || "—"}
              </Text>
              <Text style={styles.meta}>
                Étape : <Text style={styles.etape}>{c.etape || "—"}</Text>
              </Text>

              <View style={styles.progressBg}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>

              <Text style={styles.photosInfo}>
                Photos avant : {nbPhotosAvant} · après : {nbPhotosApres}
              </Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.primary}
                  onPress={() => avancer(c.id, c.etape)}
                >
                  <Text style={styles.white}>Avancer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.photosBtn}
                  onPress={() =>
                    navigation.navigate("ChantierDetail", { chantierId: c.id })
                  }
                >
                  <Text style={styles.white}>Détail / Photos</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
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
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  name: { fontSize: 16, fontWeight: "700", marginBottom: 5 },
  meta: { color: "#6b7280", marginBottom: 2 },
  etape: { fontWeight: "700", color: "#b45309" },
  progressBg: {
    height: 6,
    backgroundColor: "#f3e8d4",
    borderRadius: 3,
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: { height: 6, backgroundColor: "#0f766e" },
  photosInfo: { fontSize: 12, color: "#6b7280", marginTop: 8, marginBottom: 8 },
  actionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  primary: {
    backgroundColor: "#0f766e",
    padding: 10,
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  photosBtn: {
    backgroundColor: "#0ea5e9",
    padding: 10,
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  white: { color: "#fff", fontWeight: "700" },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 20 },
});
