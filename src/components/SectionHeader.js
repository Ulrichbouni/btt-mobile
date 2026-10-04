import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, FONTS, TILE_TONES } from "../theme/theme";
import LangBadge from "./LangBadge";

// En-tête de section des maquettes : tuile colorée + titre + sous-titre,
// avec badge de langue optionnel (Espace Technicien, Admin, Assistant IA…).
export default function SectionHeader({
  icon,
  tone = "beige",
  title,
  subtitle,
  langBadge = false,
  right,
}) {
  const tile = TILE_TONES[tone] || TILE_TONES.beige;

  return (
    <View style={styles.row}>
      <View style={[styles.tile, { backgroundColor: tile.bg }]}>
        <Ionicons name={icon} size={22} color={tile.fg} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {langBadge ? <LangBadge /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  tile: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1, marginLeft: 12, marginRight: 10 },
  title: { color: COLORS.ink, fontFamily: FONTS.bold, fontSize: 20 },
  subtitle: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 1,
  },
});
