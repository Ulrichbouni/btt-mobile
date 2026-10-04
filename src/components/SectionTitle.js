import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS, FONTS } from "../theme/theme";

// Titre de section + lien d'action (« Voir tout »).
export default function SectionTitle({ title, actionLabel, onAction, style }) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 4,
  },
  title: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 20,
    flexShrink: 1,
  },
  action: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    marginLeft: 10,
  },
});
