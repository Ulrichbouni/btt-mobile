import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { COLORS, FONTS } from "../theme/theme";

// Initiales « Jean-Paul Mbarga » -> « JM » (première + dernière).
export const initialsFromName = (name) => {
  if (!name || typeof name !== "string") return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] || "" : "";
  return (first + last).toUpperCase();
};

// Avatar rond beige à initiales (pas de photo nécessaire).
export default function Avatar({ name, size = 46, style }) {
  const initials = initialsFromName(name);
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: Math.round(size * 0.34) }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: COLORS.primaryDark, fontFamily: FONTS.semiBold },
});
