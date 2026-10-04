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

const STATUT_COLORS = {
  assignee: "#b45309",
  en_cours: "#2563eb",
  terminee: "#16a34a",
};

export default function MissionsScreen({ navigation, user }) {
  const isAdmin = user?.role === "admin";

  const [missions, setMissions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [chantierId, setChantierId] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // L'admin n'a pas de missions "personnelles" : il liste toutes les
      // missions, là où le technicien ne voit que les siennes (403 sinon).
      const endpoint = isAdmin
        ? "/missions"
        : "/missions/technicien/mes-missions";
      const { data } = await api.get(endpoint);
      setMissions(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(
        e.response?.data?.error ||
          e.message ||
          "Erreur de chargement des missions",
      );
    }
  }, [isAdmin]);

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

  // Le lien devis -> chantier n'est exposé par aucune route : on croise la
  // liste des chantiers accessibles avec le devis de la mission.
  const findChantierId = useCallback(
    async (devisId) => {
      if (!devisId) return null;
      try {
        const endpoint = isAdmin
          ? "/chantiers/admin/tous"
          : "/chantiers/technicien/mes-chantiers";
        const { data } = await api.get(endpoint);
        const match = (Array.isArray(data) ? data : []).find(
          (c) => c.devis_id === devisId,
        );
        return match ? match.id : null;
      } catch {
        return null;
      }
    },
    [isAdmin],
  );

  const toggleDetail = async (mission) => {
    if (openId === mission.id) {
      setOpenId(null);
      setDetail(null);
      setChantierId(null);
      return;
    }

    setOpenId(mission.id);
    setDetail(null);
    setChantierId(null);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/missions/${mission.id}`);
      setDetail(data);
      const cid = await findChantierId(
        data?.mission?.devis_id ?? mission.devis_id,
      );
      setChantierId(cid);
    } catch (e) {
      setError(e.response?.data?.error || "Détail de la mission indisponible");
      setOpenId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const saisirMesures = (mission) => {
    navigation?.navigate("SaisieMesures", {
      missionId: mission.id,
      mission: detail?.mission || mission,
    });
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
        📋 {isAdmin ? "Missions" : "Mes Missions"}
      </Text>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}
        {!error && missions.length === 0 && (
          <Text style={styles.empty}>
            {isAdmin ? "Aucune mission créée" : "Aucune mission assignée"}
          </Text>
        )}

        {missions.map((m) => {
          const isOpen = openId === m.id;
          const mesures = Array.isArray(detail?.mesures) ? detail.mesures : [];

          return (
            <View key={m.id} style={styles.card}>
              <Text style={styles.missionTitle}>Mission #{m.id}</Text>
              <Text style={styles.info}>Devis #{m.devis_id}</Text>
              <Text style={styles.info}>Adresse: {m.adresse || "—"}</Text>
              <Text style={styles.info}>Ville: {m.ville || "—"}</Text>
              <Text style={styles.info}>Client: {m.client_nom || "—"}</Text>
              {isAdmin && (
                <Text style={styles.info}>
                  Technicien: {m.technicien_nom || "—"}
                </Text>
              )}
              <Text style={styles.info}>
                Visite:{" "}
                {m.date_visite ? String(m.date_visite).slice(0, 10) : "—"}
              </Text>
              <Text
                style={[
                  styles.statut,
                  { color: STATUT_COLORS[m.statut] || "#92400e" },
                ]}
              >
                Statut: {m.statut}
              </Text>

              <TouchableOpacity
                style={styles.detailBtn}
                onPress={() => toggleDetail(m)}
              >
                <Text style={styles.white}>
                  {isOpen ? "Masquer le détail" : "Voir le détail"}
                </Text>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.detailBox}>
                  {detailLoading ? (
                    <ActivityIndicator color="#b45309" />
                  ) : (
                    <>
                      <Text style={styles.detailTitle}>
                        Mesures ({mesures.length})
                      </Text>
                      {mesures.length === 0 ? (
                        <Text style={styles.info}>Aucune mesure saisie</Text>
                      ) : (
                        mesures.map((mes) => (
                          <View key={mes.id} style={styles.mesureItem}>
                            <Text style={styles.info}>
                              Murs : {mes.longueur_murs} m · Hauteur :{" "}
                              {mes.hauteur_sous_plafond} m
                            </Text>
                            <Text style={styles.info}>
                              Surface réelle : {mes.surface_reelle} m² ·
                              Panneaux : {mes.nb_panneaux_reel}
                            </Text>
                            <Text style={styles.info}>
                              {mes.valide_par_admin
                                ? "✔ Validée par l'admin"
                                : "⏳ En attente de validation"}
                            </Text>
                          </View>
                        ))
                      )}

                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => saisirMesures(m)}
                        >
                          <Text style={styles.white}>Saisir les mesures</Text>
                        </TouchableOpacity>

                        {chantierId ? (
                          <TouchableOpacity
                            style={styles.chantierBtn}
                            onPress={() =>
                              navigation.navigate("ChantierDetail", {
                                chantierId,
                              })
                            }
                          >
                            <Text style={styles.white}>
                              Voir le chantier / Photos
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.info}>
                            Aucun chantier lié pour l'instant
                          </Text>
                        )}
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#faf7f2" },
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
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  missionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  info: { fontSize: 14, color: "#374151", marginTop: 4 },
  statut: { fontSize: 13, color: "#92400e", marginTop: 6, fontWeight: "600" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#faf7f2",
  },
  detailBtn: {
    backgroundColor: "#0ea5e9",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  detailBox: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 10,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#78350f",
    marginBottom: 6,
  },
  mesureItem: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  actionRow: { gap: 8, marginTop: 8 },
  actionBtn: {
    backgroundColor: "#0f766e",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  chantierBtn: {
    backgroundColor: "#b45309",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  white: { color: "#fff", fontWeight: "700" },
});
