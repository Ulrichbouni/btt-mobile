import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, FONTS } from "../theme/theme";

// Compteur « − 1 + » borné (nombre de faces/pièces du calculateur).
export default function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  style,
}) {
  const dec = () => onChange(Math.max(min, Number(value) - 1));
  const inc = () => onChange(Math.min(max, Number(value) + 1));

  return (
    <View style={[styles.box, style]}>
      <TouchableOpacity
        style={styles.btn}
        onPress={dec}
        disabled={Number(value) <= min}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Diminuer"
      >
        <Ionicons
          name="remove"
          size={20}
          color={Number(value) <= min ? COLORS.mutedLight : COLORS.primary}
        />
      </TouchableOpacity>
      <Text style={styles.value}>{value}</Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={inc}
        disabled={Number(value) >= max}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Augmenter"
      >
        <Ionicons
          name="add"
          size={20}
          color={Number(value) >= max ? COLORS.mutedLight : COLORS.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
  },
  btn: {
    width: 46,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    minWidth: 44,
    textAlign: "center",
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    fontSize: 18,
  },
});
