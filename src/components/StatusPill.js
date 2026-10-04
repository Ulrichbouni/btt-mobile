import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { COLORS, FONTS, STATUS_TONES } from "../theme/theme";
import { useI18n } from "../i18n";

const TONE_BY_STATUS = {
  en_stock: "success",
  dispo: "success",
  disponible: "success",
  valide: "success",
  approuve: "success",
  paye: "success",
  termine: "success",
  rupture: "danger",
  refuse: "danger",
  envoye: "warning",
  en_attente: "warning",
  en_cours: "info",
  nouveau: "info",
  bestseller: "solid",
};

const prettify = (status) =>
  String(status)
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

// Pilule de statut bilingue : En stock / En attente / Approuvé / En cours / Rupture…
export default function StatusPill({ status, label, tone, small = false, style }) {
  const { t } = useI18n();
  const key = String(status || "").toLowerCase();
  const resolvedTone = tone || TONE_BY_STATUS[key] || "neutral";
  const colors = STATUS_TONES[resolvedTone] || STATUS_TONES.neutral;

  const translated = t(`statuses.${key}`);
  const text = label || (translated === `statuses.${key}` ? prettify(status) : translated);

  return (
    <View
      style={[
        styles.pill,
        small && styles.small,
        { backgroundColor: colors.bg },
        style,
      ]}
    >
      <Text style={[styles.text, { color: colors.fg }, small && styles.smallText]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  small: { paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontFamily: FONTS.semiBold, fontSize: 13 },
  smallText: { fontSize: 11 },
});
