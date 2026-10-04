import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS, FONTS } from "../theme/theme";

// Onglets de catégories « à soulignement » des maquettes (Catalogue) :
// libellé brun gras + trait brun sous l'onglet actif, défilement horizontal.
// tabs : [{ key, label }]
export default function CategoryTabs({ tabs = [], value, onChange, style }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.wrap, style]}
      contentContainerStyle={styles.content}
    >
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <TouchableOpacity
            key={String(tab.key)}
            style={styles.tab}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[styles.label, active && styles.labelActive]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
            <View style={[styles.underline, active && styles.underlineActive]} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 0, marginBottom: 16 },
  content: { paddingRight: 8 },
  tab: { alignItems: "center", marginRight: 22 },
  label: {
    color: COLORS.muted,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    paddingBottom: 8,
  },
  labelActive: { color: COLORS.primary },
  underline: {
    height: 3,
    width: "100%",
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  underlineActive: { backgroundColor: COLORS.primary },
});
