import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { TILE_TONES } from "../theme/theme";

// Tuile carrée arrondie colorée avec icône (actions rapides, sections).
export default function IconTile({ icon, tone = "beige", size = 56, iconSize, style }) {
  const tile = TILE_TONES[tone] || TILE_TONES.beige;

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: tile.bg,
          width: size,
          height: size,
          borderRadius: Math.min(18, Math.round(size * 0.32)),
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize || Math.round(size * 0.42)} color={tile.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: "center", justifyContent: "center" },
});
