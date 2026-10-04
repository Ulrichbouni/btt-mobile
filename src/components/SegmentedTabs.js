import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS, FONTS } from "../theme/theme";

// Contrôle segmenté des maquettes : piste beige + pilule brune active.
export default function SegmentedTabs({ tabs, value, onChange, style }) {
  return (
    <View style={[styles.track, style]}>
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.85}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[styles.label, active && styles.labelActive]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: "#EFE7DA",
    borderRadius: 20,
    padding: 5,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 16,
    minHeight: 46,
  },
  tabActive: { backgroundColor: COLORS.primary },
  label: {
    color: COLORS.muted,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  labelActive: { color: "#FFFFFF" },
});
