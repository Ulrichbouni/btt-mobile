import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, FONTS, RADII } from "../theme/theme";

// Barre de recherche blanche arrondie (Catalogue, Annuaire).
export default function SearchBar({
  value,
  onChangeText,
  placeholder,
  style,
}) {
  return (
    <View style={[styles.box, style]}>
      <Ionicons name="search" size={19} color={COLORS.muted} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.mutedLight}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
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
    borderRadius: RADII.md,
    paddingHorizontal: 14,
    minHeight: 52,
    marginBottom: 14,
  },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    color: COLORS.ink,
    fontFamily: FONTS.regular,
    fontSize: 15,
    paddingVertical: 13,
  },
});
