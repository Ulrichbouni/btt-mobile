import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, FONTS } from "../theme/theme";

// Puce courte beige (compétences, méta) ; variante verte.
export default function Chip({ label, icon, tone = "beige", style }) {
  const bg = tone === "green" ? COLORS.greenSoft : COLORS.tileBeige;
  const fg = tone === "green" ? COLORS.greenDark : COLORS.primaryDark;

  return (
    <View style={[styles.chip, { backgroundColor: bg }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={fg} style={styles.icon} /> : null}
      <Text style={[styles.text, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  icon: { marginRight: 5 },
  text: { fontFamily: FONTS.medium, fontSize: 12 },
});
