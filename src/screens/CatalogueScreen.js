import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  AppHeader,
  Button,
  CategoryTabs,
  EmptyState,
  IconTile,
  Screen,
  SearchBar,
  SectionHeader,
  StatusPill,
} from "../components";
import { useI18n } from "../i18n";
import api from "../services/api";
import { productStatus } from "../utils/produits";
import { COLORS, FONTS, RADII, SPACING, formatXAF } from "../theme/theme";

const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function CatalogueScreen({ navigation }) {
  const { t } = useI18n();
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [categorie, setCategorie] = useState("all");

  const load = async () => {
    setError(null);
    try {
      const { data } = await api.get("/products");
      setProduits(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.error || t("catalogue.error"));
    }
  };

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
  }, []);

  const categories = useMemo(
    () => [...new Set(produits.map((p) => p.categorie).filter(Boolean))],
    [produits],
  );

  const filtered = useMemo(() => {
    const q = normalize(query);
    return produits.filter((p) => {
      if (categorie !== "all" && p.categorie !== categorie) return false;
      if (!q) return true;
      return normalize(`${p.nom} ${p.epaisseur} ${p.categorie}`).includes(q);
    });
  }, [produits, categorie, query]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen
      scroll
      contentStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <AppHeader
        showBell
        onBell={() => navigation.navigate("Notifications")}
      />
      <SectionHeader
        icon="grid"
        tone="blue"
        title={t("catalogue.title")}
        subtitle={t("catalogue.count", { n: filtered.length })}
      />

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t("catalogue.searchPlaceholder")}
      />

      {categories.length > 0 && (
        <CategoryTabs
          value={categorie}
          onChange={setCategorie}
          tabs={[
            { key: "all", label: t("catalogue.all") },
            ...categories.map((c) => ({ key: c, label: c })),
          ]}
        />
      )}

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
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title={t("catalogue.empty")}
          message={t("catalogue.emptyFilter")}
        />
      ) : (
        <View style={styles.grid}>
          {filtered.map((item) => {
            const { badge, rupture, hasStock } = productStatus(item);
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.thumb}>
                  <IconTile icon="albums-outline" tone="beige" size={54} />
                  {badge ? (
                    <View style={styles.badgeWrap}>
                      <StatusPill status={badge} small />
                    </View>
                  ) : null}
                </View>
                <Text style={styles.name} numberOfLines={2}>
                  {item.nom}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {[item.epaisseur, item.categorie]
                    .filter(Boolean)
                    .join(" • ")}
                </Text>
                <Text style={styles.priceLabel}>{t("catalogue.price")}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{formatXAF(item.prix_ttc)}</Text>
                  {hasStock ? (
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: rupture
                            ? COLORS.red
                            : COLORS.green,
                        },
                      ]}
                    />
                  ) : null}
                </View>
                <Button
                  label={t("catalogue.quote")}
                  small
                  onPress={() =>
                    navigation.navigate("Devis", { produit_id: item.id })
                  }
                  style={styles.cta}
                />
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  loader: { marginTop: 40 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#5C4632",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  thumb: {
    backgroundColor: "#F3EDE2",
    borderRadius: RADII.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  badgeWrap: { position: "absolute", top: 8, left: 8 },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 1 },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginLeft: 8,
  },
  name: { color: COLORS.ink, fontFamily: FONTS.bold, fontSize: 14, lineHeight: 19 },
  sub: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 11,
    marginTop: 2,
  },
  priceLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 10,
    marginTop: 8,
  },
  price: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    fontSize: 15,
    marginTop: 1,
  },
  cta: { marginTop: 10 },
});
