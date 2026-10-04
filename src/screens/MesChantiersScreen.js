import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  Fab,
  ProgressBar,
  Screen,
  SectionHeader,
  Timeline,
} from "../components";
import { useI18n } from "../i18n";
import api from "../services/api";
import { ETAPES, progressionPourcent } from "../constants/etapes";
import { COLORS, FONTS, RADII, SPACING } from "../theme/theme";

// Chaque rôle dispose de sa route : le client voit ses propres chantiers,
// le technicien ceux issus de ses missions, l'admin voit tout.
const endpointForRole = (role) => {
  if (role === "admin") return "/chantiers/admin/tous";
  if (role === "technicien") return "/chantiers/technicien/mes-chantiers";
  return "/chantiers/mes-chantiers";
};

// Icône affichée dans la pastille de l'étape en cours.
const STEP_ICONS = [
  "document-text-outline",
  "search-outline",
  "checkmark-circle-outline",
  "cube-outline",
  "construct-outline",
  "ribbon-outline",
];

export default function MesChantiersScreen({ navigation, user }) {
  const { t } = useI18n();
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const role = user?.role || "client";

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get(endpointForRole(role));
      setChantiers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || t("chantiers.loadError"));
    }
  }, [role, t]);

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

  const selected =
    chantiers.find((c) => c.id === selectedId) || chantiers[0] || null;

  const stepNames = t("chantiers.stepNames");
  const stepDescs = t("chantiers.stepDescs");
  const noms = Array.isArray(stepNames) ? stepNames : ETAPES;
  const descs = Array.isArray(stepDescs) ? stepDescs : [];
  const etapeIndex = selected ? ETAPES.indexOf(selected.etape) : -1;

  const steps = noms.map((name, i) => ({
    title: name,
    description: descs[i],
    icon: STEP_ICONS[i],
    state:
      etapeIndex < 0
        ? "upcoming"
        : i < etapeIndex
          ? "done"
          : i === etapeIndex
            ? "current"
            : "upcoming",
  }));

  return (
    <View style={styles.root}>
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
          icon="construct"
          tone="yellow"
          title={t("chantiers.title")}
          subtitle={t("chantiers.count", { n: chantiers.length })}
        />

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.loader}
          />
        ) : error ? (
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
        ) : chantiers.length === 0 ? (
          <EmptyState
            icon="construct-outline"
            title={t("chantiers.title")}
            message={
              role === "client"
                ? t("chantiers.emptyClient")
                : t("chantiers.emptyTech")
            }
          />
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.selector}
            >
              {chantiers.map((c) => {
                const isActive = selected?.id === c.id;
                const progress = progressionPourcent(c.etape);
                return (
                  <TouchableOpacity
                    key={c.id}
                    activeOpacity={0.9}
                    onPress={() => setSelectedId(c.id)}
                    style={[styles.selectorCard, isActive && styles.selectorActive]}
                  >
                    <Text
                      style={[
                        styles.selectorTitle,
                        isActive && styles.selectorTitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      {c.client_nom ||
                        t("chantiers.chantierLabel", { id: c.id })}
                    </Text>
                    <Text
                      style={[
                        styles.selectorSub,
                        isActive && styles.selectorSubActive,
                      ]}
                      numberOfLines={1}
                    >
                      {c.ville || "—"}
                      {c.devis_id ? ` • devis #${c.devis_id}` : ""}
                    </Text>
                    <ProgressBar
                      progress={progress}
                      color={isActive ? "#FFFFFF" : COLORS.green}
                      trackColor={
                        isActive ? "rgba(255, 255, 255, 0.32)" : "#EFE7DA"
                      }
                      height={6}
                      style={styles.selectorBar}
                    />
                    <Text
                      style={[
                        styles.selectorProgress,
                        isActive && styles.selectorProgressActive,
                      ]}
                    >
                      {t("chantiers.progress", {
                        n: Math.round(progress),
                      })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selected ? (
              <Card style={styles.stats} padding={16}>
                <Stat
                  icon="resize-outline"
                  value={
                    selected.surface ? `${selected.surface} m²` : "—"
                  }
                  label={t("chantiers.surface")}
                />
                <View style={styles.statDivider} />
                <Stat
                  icon="location-outline"
                  value={selected.ville || "—"}
                  label={t("chantiers.city")}
                />
                <View style={styles.statDivider} />
                <Stat
                  icon="navigate-outline"
                  value={selected.adresse || "—"}
                  label={t("chantiers.address")}
                />
              </Card>
            ) : null}

            <View style={styles.stepsHeader}>
              <Text style={styles.stepsTitle}>{t("chantiers.steps")}</Text>
              <Text style={styles.stepsCount}>
                {t("chantiers.stepOf", {
                  n: etapeIndex >= 0 ? etapeIndex + 1 : 0,
                  total: ETAPES.length,
                })}
              </Text>
            </View>

            <Timeline steps={steps} />

            {selected ? (
              <Button
                label={t("chantiers.detail")}
                icon="images-outline"
                variant="soft"
                onPress={() =>
                  navigation.navigate("ChantierDetail", {
                    chantierId: selected.id,
                  })
                }
                style={styles.detailBtn}
              />
            ) : null}
          </>
        )}
      </Screen>

      <Fab
        label={t("chantiers.newQuote")}
        icon="add"
        onPress={() => navigation.navigate("Devis")}
      />
    </View>
  );
}

function Stat({ icon, value, label }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={17} color={COLORS.primary} />
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingBottom: 96 },
  loader: { marginTop: 40 },
  selector: { marginBottom: 14 },
  selectorCard: {
    width: 220,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    padding: 14,
    marginRight: 12,
    shadowColor: "#5C4632",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  selectorActive: { backgroundColor: COLORS.primary },
  selectorTitle: { color: COLORS.ink, fontFamily: FONTS.bold, fontSize: 15 },
  selectorTitleActive: { color: "#FFFFFF" },
  selectorSub: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 3,
  },
  selectorSubActive: { color: "rgba(255, 255, 255, 0.78)" },
  selectorBar: { marginTop: 12 },
  selectorProgress: {
    color: COLORS.green,
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    marginTop: 8,
  },
  selectorProgressActive: { color: "#FFFFFF" },
  stats: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  stat: { flex: 1, alignItems: "center" },
  statValue: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 14,
    marginTop: 6,
  },
  statLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: { width: 1, height: 44, backgroundColor: COLORS.border },
  stepsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stepsTitle: { color: COLORS.ink, fontFamily: FONTS.bold, fontSize: 20 },
  stepsCount: { color: COLORS.primary, fontFamily: FONTS.semiBold, fontSize: 14 },
  detailBtn: { marginTop: 8 },
});
