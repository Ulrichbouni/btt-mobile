import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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
  FilterPill,
  IconTile,
  Screen,
  SectionTitle,
} from "../components";
import { useI18n } from "../i18n";
import api from "../services/api";
import { COLORS, FONTS, RADII, SPACING, formatXAF } from "../theme/theme";

// Raccourcis par rôle : les clients ne voient jamais "Missions" (backend 403),
// ni l'accès admin. Chaque tuile est colorée comme les maquettes.
const SHORTCUTS_BY_ROLE = {
  client: [
    { key: "calculator", route: "Calculator", icon: "calculator-outline", tone: "beige" },
    { key: "catalogue", route: "Catalogue", icon: "grid-outline", tone: "blue" },
    { key: "devis", route: "Devis", icon: "document-text-outline", tone: "green" },
    { key: "chantier", route: "MesChantiers", icon: "construct-outline", tone: "yellow" },
    { key: "assistant", route: "AssistantIA", icon: "chatbubbles-outline", tone: "purple" },
    { key: "annuaire", route: "Annuaire", icon: "people-outline", tone: "green" },
  ],
  technicien: [
    { key: "missions", route: "Missions", icon: "briefcase-outline", tone: "green" },
    { key: "chantier", route: "MesChantiers", icon: "construct-outline", tone: "yellow" },
    { key: "catalogue", route: "Catalogue", icon: "grid-outline", tone: "blue" },
    { key: "devis", route: "Devis", icon: "document-text-outline", tone: "beige" },
    { key: "assistant", route: "AssistantIA", icon: "chatbubbles-outline", tone: "purple" },
    { key: "annuaire", route: "Annuaire", icon: "people-outline", tone: "green" },
  ],
  admin: [
    { key: "admin", route: "Admin", icon: "shield-checkmark-outline", tone: "brown" },
    { key: "missions", route: "Missions", icon: "briefcase-outline", tone: "green" },
    { key: "chantier", route: "MesChantiers", icon: "construct-outline", tone: "yellow" },
    { key: "catalogue", route: "Catalogue", icon: "grid-outline", tone: "blue" },
    { key: "devis", route: "Devis", icon: "document-text-outline", tone: "beige" },
    { key: "assistant", route: "AssistantIA", icon: "chatbubbles-outline", tone: "purple" },
  ],
};

export default function HomeScreen({ navigation, user }) {
  const { t } = useI18n();
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [categorie, setCategorie] = useState("all");

  const shortcuts =
    SHORTCUTS_BY_ROLE[user?.role] || SHORTCUTS_BY_ROLE.client;

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get("/products");
      setProduits(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.error || t("catalogue.error"));
    }
  }, [t]);

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

  // Recharge au retour sur l'onglet (prix/stock mis à jour côté backend).
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

  const categories = useMemo(
    () =>
      [...new Set(produits.map((p) => p.categorie).filter(Boolean))].slice(0, 4),
    [produits],
  );

  const visibles = useMemo(() => {
    const liste =
      categorie === "all"
        ? produits
        : produits.filter((p) => p.categorie === categorie);
    return liste.slice(0, 4);
  }, [produits, categorie]);

  return (
    <Screen
      scroll
      contentStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <AppHeader
        title={t("home.brandTitle")}
        showBell
        onBell={() => navigation.navigate("Notifications")}
        name={user?.nom}
      />

      <Card style={styles.promo} padding={18}>
        <View style={styles.promoRow}>
          <View style={styles.promoLeft}>
            <Text style={styles.promoTitle}>{t("home.promoTitle")}</Text>
            <Text style={styles.promoTagline}>{t("home.promoTagline")}</Text>
            <TouchableOpacity
              style={styles.promoBtn}
              activeOpacity={0.9}
              onPress={() => navigation.navigate("Catalogue")}
              accessibilityRole="button"
            >
              <Text style={styles.promoBtnText}>{t("home.promoCta")}</Text>
              <Ionicons
                name="arrow-forward"
                size={15}
                color={COLORS.primaryDark}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.priceChip}>
            <Text style={styles.priceValue}>{t("home.promoPrice")}</Text>
            <Text style={styles.priceUnit}>{t("home.promoUnit")}</Text>
            <Text style={styles.priceOld}>{t("home.promoOld")}</Text>
          </View>
        </View>
      </Card>

      <SectionTitle title={t("home.quickActions")} style={styles.sectionTop} />

      <View style={styles.grid}>
        {shortcuts.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={styles.gridItem}
            activeOpacity={0.85}
            onPress={() => navigation.navigate(s.route)}
            accessibilityRole="button"
          >
            <IconTile icon={s.icon} tone={s.tone} size={52} />
            <Text style={styles.gridLabel} numberOfLines={1}>
              {t(`home.shortcuts.${s.key}.label`)}
            </Text>
            <Text style={styles.gridSub} numberOfLines={1}>
              {t(`home.shortcuts.${s.key}.sub`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionTitle
        title={t("home.catalogueTitle")}
        actionLabel={t("common.seeAll")}
        onAction={() => navigation.navigate("Catalogue")}
        style={styles.sectionTop}
      />

      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillsRow}
        >
          <FilterPill
            label={t("catalogue.all")}
            active={categorie === "all"}
            onPress={() => setCategorie("all")}
            style={styles.pill}
          />
          {categories.map((c) => (
            <FilterPill
              key={c}
              label={c}
              active={categorie === c}
              onPress={() => setCategorie(c)}
              style={styles.pill}
            />
          ))}
        </ScrollView>
      )}

      {error ? (
        <EmptyState
          icon="cloud-offline-outline"
          title={t("common.error")}
          message={error}
        />
      ) : visibles.length === 0 && !loading ? (
        <EmptyState
          icon="cube-outline"
          title={t("catalogue.empty")}
          message={t("catalogue.emptyFilter")}
        />
      ) : (
        visibles.map((item) => (
          <Card key={item.id} style={styles.product} padding={14}>
            <View style={styles.productRow}>
              <IconTile icon="albums-outline" tone="beige" size={52} />
              <View style={styles.productText}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.nom}
                </Text>
                <Text style={styles.productSub} numberOfLines={1}>
                  {[item.epaisseur, item.categorie].filter(Boolean).join(" • ")}
                </Text>
                <Text style={styles.productPrice}>
                  {formatXAF(item.prix_ttc)}
                </Text>
              </View>
            </View>
            <Button
              label={t("catalogue.quote")}
              icon="document-text-outline"
              small
              variant="soft"
              onPress={() =>
                navigation.navigate("Devis", { produit_id: item.id })
              }
              style={styles.quoteBtn}
            />
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  promo: { backgroundColor: COLORS.primary, borderRadius: RADII.lg, marginTop: 6 },
  promoRow: { flexDirection: "row" },
  promoLeft: { flex: 1, marginRight: 12 },
  promoTitle: {
    color: "#FFFFFF",
    fontFamily: FONTS.bold,
    fontSize: 19,
    lineHeight: 27,
  },
  promoTagline: {
    color: "rgba(255, 255, 255, 0.78)",
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  promoBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 14,
  },
  promoBtnText: {
    color: COLORS.primaryDark,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    marginRight: 8,
  },
  priceChip: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "flex-end",
    alignSelf: "flex-start",
    minWidth: 108,
  },
  priceValue: { color: "#FFFFFF", fontFamily: FONTS.bold, fontSize: 19 },
  priceUnit: {
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: FONTS.regular,
    fontSize: 11,
    marginTop: 2,
  },
  priceOld: {
    color: "rgba(255, 255, 255, 0.6)",
    fontFamily: FONTS.regular,
    fontSize: 11,
    marginTop: 4,
    textDecorationLine: "line-through",
  },
  sectionTop: { marginTop: 20 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#5C4632",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  gridLabel: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 15,
    marginTop: 12,
  },
  gridSub: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 2,
  },
  pillsRow: { marginBottom: 14 },
  pill: { marginRight: 8 },
  product: { marginBottom: 12 },
  productRow: { flexDirection: "row" },
  productText: { flex: 1, marginLeft: 12 },
  productName: { color: COLORS.ink, fontFamily: FONTS.bold, fontSize: 15 },
  productSub: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 2,
  },
  productPrice: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    fontSize: 16,
    marginTop: 6,
  },
  quoteBtn: { marginTop: 12, alignSelf: "stretch" },
});
