import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { COLORS, FONTS, RADII, SHADOW, SPACING } from "../theme/theme";

// Carte blanche arrondie (24) avec ombre douce ; pressable si onPress.
export default function Card({
  children,
  onPress,
  disabled = false,
  padding = SPACING.lg,
  style,
}) {
  const base = [styles.card, { padding }, style];

  if (onPress) {
    return (
      <TouchableOpacity
        style={base}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={base}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    ...SHADOW.card,
  },
});
