import React, { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  FilterPill,
  SearchBar,
  SectionHeader,
  StatusPill,
} from "../components";
import { useI18n } from "../i18n";
import { ANNUAIRE_CITIES, POSEURS } from "../data/poseurs";
import { COLORS, FONTS, SPACING } from "../theme/theme";

const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// Annuaire Poseurs (maquette) : recherche + filtres ville + fiches poseurs
// avec bouton WhatsApp. Données locales de démonstration (src/data/poseurs.js).
export default function AnnuaireScreen({ navigation }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");

  const filtered = useMemo(() => {
    const q = normalize(query);
    return POSEURS.filter((p) => {
      if (city !== "all" && p.ville !== city) return false;
      if (!q) return true;
      return normalize(
        `${p.nom} ${p.ville} ${p.bio} ${p.competences.join(" ")}`,
      ).includes(q);
    });
  }, [query, city]);

  const openWhatsApp = async (poseur) => {
    const url = `https://wa.me/${poseur.telephone}?text=${encodeURIComponent(
      t("annuaire.whatsappMessage"),
    )}`;
    try {
      await Linking.openURL(url);
    } catch {
      // Repli gracieux : on affiche le numéro plutôt que d'échouer en silence.
      Alert.alert(t("common.appName"), `WhatsApp — ${poseur.telephone}`);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.pad}>
        <AppHeader
          showBell
          onBell={() => navigation?.navigate("Notifications")}
        />
        <SectionHeader
          icon="people"
          tone="green"
          title={t("annuaire.title")}
          subtitle={t("annuaire.subtitle")}
          langBadge
        />
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t("annuaire.searchPlaceholder")}
          style={styles.search}
        />
        <View style={styles.filters}>
          <FilterPill
            label={t("annuaire.all")}
            active={city === "all"}
            onPress={() => setCity("all")}
          />
          {ANNUAIRE_CITIES.map((c) => (
            <FilterPill
              key={c}
              label={c}
              active={city === c}
              onPress={() => setCity(city === c ? "all" : c)}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={t("annuaire.title")}
            message={t("annuaire.empty")}
          />
        ) : (
          filtered.map((poseur) => (
            <Card key={poseur.id} style={styles.card}>
              <View style={styles.headRow}>
                <Avatar name={poseur.nom} size={56} />
                <View style={styles.headText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {poseur.nom}
                  </Text>
                  <Text style={styles.meta}>
                    {poseur.ville} •{" "}
                    {poseur.annees > 1
                      ? t("annuaire.yearsExp", { n: poseur.annees })
                      : t("annuaire.anneeExp", { n: poseur.annees })}
                  </Text>
                </View>
                <StatusPill
                  status={poseur.disponible ? "disponible" : "indisponible"}
                  small
                />
              </View>

              <Text style={styles.bio}>{poseur.bio}</Text>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons name="star" size={15} color={COLORS.yellow} />
                  <Text style={styles.statStrong}>
                    {poseur.note.toFixed(1)}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="hammer" size={15} color={COLORS.primary} />
                  <Text style={styles.statMuted}>
                    {t("annuaire.projects", { n: poseur.projets })}
                  </Text>
                </View>
              </View>

              <View style={styles.chips}>
                {poseur.competences.map((c) => (
                  <Chip key={c} label={c} />
                ))}
              </View>

              <Button
                label={t("annuaire.contact")}
                icon="logo-whatsapp"
                variant="green"
                onPress={() => openWhatsApp(poseur)}
                style={styles.cta}
              />
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  pad: { paddingHorizontal: SPACING.lg },
  flex: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  search: { marginBottom: 12 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 6 },
  card: { marginBottom: 14 },
  headRow: { flexDirection: "row", alignItems: "center" },
  headText: { flex: 1, marginLeft: 12, marginRight: 8 },
  name: { color: COLORS.ink, fontFamily: FONTS.bold, fontSize: 16 },
  meta: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginTop: 2,
  },
  bio: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  statsRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  stat: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  statStrong: {
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    marginLeft: 5,
  },
  statMuted: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 14,
    marginLeft: 5,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  cta: { marginTop: 14 },
});
