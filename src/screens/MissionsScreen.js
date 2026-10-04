import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  Screen,
  SectionHeader,
  StatusPill,
} from "../components";
import { useI18n } from "../i18n";
import api from "../services/api";
import { COLORS, FONTS, RADII, SPACING } from "../theme/theme";

export default function MissionsScreen({ navigation, user }) {
  const { t } = useI18n();
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
      setError(e.response?.data?.error || e.message || t("missions.loadError"));
    }
  }, [isAdmin, t]);

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
      setError(e.response?.data?.error || t("missions.detailError"));
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

  return (
    <Screen
      contentStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <AppHeader
        showBell
        onBell={() => navigation.navigate("Notifications")}
        name={user?.nom}
      />
      <SectionHeader
        icon="briefcase"
        tone="green"
        title={t("missions.title")}
        subtitle={t("missions.subtitle")}
        langBadge
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.green}
          style={styles.loader}
        />
      ) : error && missions.length === 0 ? (
        <>
          <EmptyState
            icon="cloud-offline-outline"
            title={t("common.error")}
            message={error}
          />
          <Button
            label={t("common.retry")}
            variant="outline"
            icon="refresh"
            onPress={load}
          />
        </>
      ) : missions.length === 0 ? (
        <EmptyState
          icon="briefcase-outline"
          title={t("missions.title")}
          message={isAdmin ? t("missions.emptyAdmin") : t("missions.emptyTech")}
        />
      ) : (
        missions.map((m) => {
          const isOpen = openId === m.id;
          const mesures = Array.isArray(detail?.mesures) ? detail.mesures : [];

          return (
            <Card key={m.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.missionTitle}>
                  {t("missions.missionLabel", { id: m.id })}
                </Text>
                <StatusPill status={m.statut} small />
              </View>

              <InfoRow
                icon="document-text-outline"
                label={t("missions.devisLabel", { id: m.devis_id })}
              />
              <InfoRow
                icon="location-outline"
                label={`${t("missions.city")} : ${m.ville || "—"}`}
              />
              <InfoRow
                icon="navigate-outline"
                label={`${t("missions.address")} : ${m.adresse || "—"}`}
              />
              <InfoRow
                icon="person-outline"
                label={`${t("missions.client")} : ${m.client_nom || "—"}`}
              />
              {isAdmin ? (
                <InfoRow
                  icon="construct-outline"
                  label={`${t("missions.technician")} : ${
                    m.technicien_nom || "—"
                  }`}
                />
              ) : null}
              <InfoRow
                icon="calendar-outline"
                label={`${t("missions.visit")} : ${
                  m.date_visite ? String(m.date_visite).slice(0, 10) : "—"
                }`}
              />

              <Button
                label={isOpen ? t("missions.hideDetail") : t("missions.showDetail")}
                icon={isOpen ? "chevron-up" : "chevron-down"}
                variant="soft"
                small
                onPress={() => toggleDetail(m)}
                style={styles.detailBtn}
              />

              {isOpen ? (
                <View style={styles.detailBox}>
                  {detailLoading ? (
                    <ActivityIndicator color={COLORS.green} />
                  ) : (
                    <>
                      <Text style={styles.detailTitle}>
                        {t("missions.measuresTitle", { n: mesures.length })}
                      </Text>
                      {mesures.length === 0 ? (
                        <Text style={styles.hint}>
                          {t("missions.noMeasures")}
                        </Text>
                      ) : (
                        mesures.map((mes) => (
                          <View key={mes.id} style={styles.mesureItem}>
                            <Text style={styles.mesureText}>
                              {t("missions.measureLine1", {
                                l: mes.longueur_murs,
                                h: mes.hauteur_sous_plafond,
                              })}
                            </Text>
                            <Text style={styles.mesureText}>
                              {t("missions.measureLine2", {
                                s: mes.surface_reelle,
                                p: mes.nb_panneaux_reel,
                              })}
                            </Text>
                            <Text
                              style={[
                                styles.mesureState,
                                mes.valide_par_admin
                                  ? styles.mesureValidated
                                  : styles.mesurePending,
                              ]}
                            >
                              {mes.valide_par_admin
                                ? t("missions.validated")
                                : t("missions.pending")}
                            </Text>
                          </View>
                        ))
                      )}

                      <Button
                        label={t("missions.enterMeasures")}
                        icon="create-outline"
                        variant="green"
                        small
                        onPress={() => saisirMesures(m)}
                        style={styles.action}
                      />

                      {chantierId ? (
                        <Button
                          label={t("missions.viewSite")}
                          icon="images-outline"
                          variant="soft"
                          small
                          onPress={() =>
                            navigation.navigate("ChantierDetail", {
                              chantierId,
                            })
                          }
                          style={styles.action}
                        />
                      ) : (
                        <Text style={styles.hint}>{t("missions.noSite")}</Text>
                      )}
                    </>
                  )}
                </View>
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

function InfoRow({ icon, label }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={14} color={COLORS.muted} />
      <Text style={styles.infoText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  loader: { marginTop: 40 },
  card: { marginBottom: 12 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  missionTitle: { color: COLORS.ink, fontFamily: FONTS.bold, fontSize: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  infoText: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginLeft: 8,
    flexShrink: 1,
  },
  detailBtn: { marginTop: 14 },
  detailBox: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
  },
  detailTitle: {
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    marginBottom: 8,
  },
  hint: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginTop: 6,
  },
  mesureItem: {
    backgroundColor: "#F5F1E8",
    borderRadius: RADII.sm,
    padding: 12,
    marginBottom: 8,
  },
  mesureText: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginBottom: 3,
  },
  mesureState: { fontFamily: FONTS.semiBold, fontSize: 12, marginTop: 4 },
  mesureValidated: { color: COLORS.greenDark },
  mesurePending: { color: "#9A5A24" },
  action: { marginTop: 8 },
});
