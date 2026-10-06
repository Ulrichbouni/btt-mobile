import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Alert } from "react-native";

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
import { ETAPES, progressionPourcent } from "../constants/etapes";
import { COLORS, FONTS, SPACING, RADII } from "../theme/theme";

export default function AdminChantiersScreen({ navigation, user }) {
  const { t } = useI18n();
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

  // Seuls l'admin et le technicien assigné peuvent faire avancer le chantier.
  const canManage = (chantier) => {
    if (user?.role === "admin") return true;
    return user?.role === "technicien" && chantier.technicien_id === user?.id;
  };

  const avancer = (chantier) => {
    const idx = ETAPES.indexOf(chantier.etape);
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
            await api.put(`/chantiers/${chantier.id}/avancer`);
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
    <Screen contentStyle={styles.content}>
      <AppHeader title={t("admin.chantiers")} showBell onBell={() => {}} />

      <SectionHeader
        icon="construct-outline"
        tone="brown"
        title={t("admin.chantiers")}
      />

      {loading ? (
        <EmptyState
          icon="sync-outline"
          title={t("common.loading")}
          message={t("admin.loadingChantiers")}
        />
      ) : chantiers.length === 0 ? (
        <EmptyState
          icon="construct-outline"
          title={t("admin.empty")}
          message={t("admin.noChantiers")}
        />
      ) : (
        <View style={styles.grid}>
          {chantiers.map((c) => {
            const progress = progressionPourcent(c.etape);
            const nbPhotosAvant = Array.isArray(c.photos_avant)
              ? c.photos_avant.length
              : 0;
            const nbPhotosApres = Array.isArray(c.photos_apres)
              ? c.photos_apres.length
              : 0;
            const editable = canManage(c);

            return (
              <Card key={c.id} style={styles.card} padding={16}>
                <View style={styles.header}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>
                      Chantier #{c.id} — Devis #{c.devis_id}
                    </Text>
                    <StatusPill status={c.statut || "en_stock"} small />
                  </View>
                  <Text style={styles.meta}>{c.client_nom || t("admin.unknown")}</Text>
                </View>
                <Text style={styles.meta}>
                  {t("admin.ville")} : {c.ville || t("common.unknown")}
                </Text>
                <Text style={styles.meta}>
                  {t("admin.technicien")} : {c.technicien_nom || t("common.unknown")}
                </Text>
                <Text style={styles.meta}>
                  {t("admin.etape")} : {c.etape || t("common.unknown")}
                </Text>
                <View style={[styles.progressBg, styles.progressBgSmall]}>
                  <View
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                </View>
                <Text style={styles.photosInfo}>
                  {t("admin.photos")} : {nbPhotosAvant} {t("admin.avant")} ·{" "}
                  {nbPhotosApres} {t("admin.apres")}
                </Text>
                <View style={styles.actions}>
                  {editable ? (
                    <Button
                      icon="arrow-forward-outline"
                      label={t("admin.avancer")}
                      variant="green"
                      onPress={() => avancer(c)}
                      style={styles.primary}
                    />
                  ) : (
                    <View style={styles.readonlyNote}>
                      <Text style={styles.readonlyText}>
                        {t("admin.conseil")}
                      </Text>
                    </View>
                  )}
                  <Button
                    icon="images-outline"
                    label={t("admin.detail")}
                    variant="soft"
                    onPress={() =>
                      navigation.navigate("ChantierDetail", { chantierId: c.id })
                    }
                    style={styles.photosBtn}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  card: {
    borderRadius: RADII.lg,
    padding: 16,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  nameRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  name: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 15,
    flex: 1,
  },
  meta: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 2,
    flex: 1,
    marginRight: SPACING.sm,
  },
  progressBg: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginTop: SPACING.sm,
  },
  progressBgSmall: {
    marginTop: 0,
    height: 6,
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },
  photosInfo: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: SPACING.sm,
    flexWrap: "wrap",
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
    flex: 1,
    justifyContent: "flex-end",
  },
  primary: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  photosBtn: {
    flex: 1,
  },
  readonlyNote: {
    backgroundColor: COLORS.border,
    borderRadius: RADII.md,
    padding: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  readonlyText: {
    color: COLORS.muted,
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
  },
});
