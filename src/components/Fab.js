import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, FONTS, RADII, SHADOW } from "../theme/theme";

// Bouton flottant brun « + Nouveau… » (bas droit).
export default function Fab({ label, onPress, icon = "add", style }) {
  return (
    <TouchableOpacity
      style={[styles.fab, style]}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={20} color="#FFFFFF" />
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADII.xl,
    paddingHorizontal: 20,
    paddingVertical: 15,
    ...SHADOW.fab,
  },
  label: {
    color: "#FFFFFF",
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    marginLeft: 9,
  },
});
