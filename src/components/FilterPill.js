import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { COLORS, FONTS } from "../theme/theme";

// Pilule de filtre : brun pleine si active, blanche bordée sinon.
export default function FilterPill({ label, active = false, onPress, style }) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.active, style]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  active: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  text: { color: COLORS.ink, fontFamily: FONTS.semiBold, fontSize: 14 },
  textActive: { color: "#FFFFFF" },
});
