import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, FONTS } from "../theme/theme";
import { useI18n } from "../i18n";

// Badge de langue FR/EN (bascule au clic), présent dans les en-têtes de section.
export default function LangBadge({ style }) {
  const { lang, setLang } = useI18n();
  const next = lang === "fr" ? "en" : "fr";

  return (
    <TouchableOpacity
      style={[styles.pill, style]}
      onPress={() => setLang(next)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={
        lang === "fr" ? "Switch to English" : "Passer en français"
      }
    >
      <Ionicons name="globe-outline" size={13} color={COLORS.primaryDark} />
      <Text style={styles.text}>{lang.toUpperCase()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.tileBeige,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    color: COLORS.primaryDark,
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    marginLeft: 5,
  },
});
