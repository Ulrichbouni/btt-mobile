import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";

import api from "../services/api";
import { ETAPES, progressionPourcent } from "../constants/etapes";

// Chaque rôle dispose de sa route : le client voit ses propres chantiers,
// le technicien ceux issus de ses missions, l'admin voit tout.
const endpointForRole = (role) => {
  if (role === "admin") return "/chantiers/admin/tous";
  if (role === "technicien") return "/chantiers/technicien/mes-chantiers";
  return "/chantiers/mes-chantiers";
};

export default function MesChantiersScreen({ navigation, user }) {
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const role = user?.role || "client";

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get(endpointForRole(role));
      setChantiers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Chargement impossible");
    }
  }, [role]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      await load();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [load]);

  // Recharge quand l'onglet reprend le focus (nouvelle étape, photos...).
  useEffect(() => {
    if (!navigation?.addListener) return undefined;
    const unsubscribe = navigation.addListener("focus", load);
    return unsubscribe;
  }, [navigation, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b45309" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        🏗️ {role === "client" ? "Mes Chantiers" : "Chantiers"}
      </Text>

      {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!error && chantiers.length === 0 && (
          <Text style={styles.empty}>
            {role === "client"
              ? "Aucun chantier pour le moment. Un chantier est créé dès que votre devis est validé."
              : "Aucun chantier assigné pour le moment."}
          </Text>
        )}

        {chantiers.map((c) => {
          const progress = progressionPourcent(c.etape);
          const nbAvant = Array.isArray(c.photos_avant)
            ? c.photos_avant.length
            : 0;
          const nbApres = Array.isArray(c.photos_apres)
            ? c.photos_apres.length
            : 0;

          return (
            <View key={c.id} style={styles.card}>
              <Text style={styles.name}>
                Chantier #{c.id} — Devis #{c.devis_id}
              </Text>
              {role !== "client" && c.client_nom ? (
                <Text style={styles.meta}>Client : {c.client_nom}</Text>
              ) : null}
              <Text style={styles.meta}>Ville : {c.ville || "—"}</Text>
              <Text style={styles.meta}>Adresse : {c.adresse || "—"}</Text>
              <Text style={styles.meta}>
                Surface : {c.surface ? `${c.surface} m²` : "—"}
              </Text>
              <Text style={styles.etape}>Étape : {c.etape || "—"}</Text>

              <View style={styles.progressBg}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>

              <Text style={styles.photosInfo}>
                Photos avant : {nbAvant} · après : {nbApres}
              </Text>

              <TouchableOpacity
                style={styles.primary}
                onPress={() =>
                  navigation.navigate("ChantierDetail", { chantierId: c.id })
                }
              >
                <Text style={styles.white}>Détail / Photos</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#faf7f2" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#faf7f2",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#92400e",
    marginBottom: 16,
  },
  error: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  empty: { color: "#6b7280", textAlign: "center", padding: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  name: { fontSize: 16, fontWeight: "700", marginBottom: 5, color: "#111827" },
  meta: { color: "#6b7280", marginBottom: 2 },
  etape: { fontWeight: "700", color: "#b45309", marginTop: 6 },
  progressBg: {
    height: 6,
    backgroundColor: "#f3e8d4",
    borderRadius: 3,
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: { height: 6, backgroundColor: "#0f766e" },
  photosInfo: { fontSize: 12, color: "#6b7280", marginTop: 8, marginBottom: 8 },
  primary: {
    backgroundColor: "#0ea5e9",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  white: { color: "#fff", fontWeight: "700" },
});
