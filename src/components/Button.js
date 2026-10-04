import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, FONTS, RADII } from "../theme/theme";

const VARIANTS = {
  primary: { bg: COLORS.primary, fg: "#FFFFFF" },
  green: { bg: COLORS.green, fg: "#FFFFFF" },
  outline: { bg: "transparent", fg: COLORS.primary, border: COLORS.primary },
  soft: { bg: COLORS.primarySoft, fg: COLORS.primaryDark },
  danger: { bg: COLORS.red, fg: "#FFFFFF" },
  white: { bg: COLORS.surface, fg: COLORS.primaryDark },
};

// Bouton pilule ; désactivé = fond beige neutre (comme les maquettes).
export default function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
  small = false,
  style,
  labelStyle,
  numberOfLines = 1,
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = disabled || loading;
  const bg = isDisabled && variant !== "outline" ? "#E6DCCB" : v.bg;
  const fg = isDisabled && variant !== "outline" ? COLORS.muted : v.fg;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={[
        styles.base,
        small && styles.small,
        { backgroundColor: bg },
        v.border
          ? {
              borderWidth: 1.5,
              borderColor: isDisabled ? COLORS.border : v.border,
            }
          : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={small ? 15 : 18}
              color={fg}
              style={styles.icon}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              small && styles.labelSmall,
              { color: fg },
              labelStyle,
            ]}
            numberOfLines={numberOfLines}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: RADII.pill,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  small: { minHeight: 40, paddingHorizontal: 16 },
  icon: { marginRight: 8 },
  label: { fontFamily: FONTS.semiBold, fontSize: 15 },
  labelSmall: { fontSize: 13 },
});
