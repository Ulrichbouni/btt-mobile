import React from "react";
import { StyleSheet, View } from "react-native";

import { COLORS } from "../theme/theme";

// Barre de progression fine (verte par défaut ; blanche sur carte brune).
export default function ProgressBar({
  progress = 0,
  color = COLORS.green,
  trackColor = "#EFE7DA",
  height = 8,
  style,
}) {
  const clamped = Math.max(0, Math.min(100, Number(progress) || 0));

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: trackColor, height, borderRadius: height / 2 },
        style,
      ]}
    >
      <View
        style={{
          width: `${clamped}%`,
          backgroundColor: color,
          height,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: "hidden", width: "100%" },
});
