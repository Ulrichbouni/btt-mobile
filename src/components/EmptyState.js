import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, FONTS } from "../theme/theme";

// État vide : pastille beige + titre + message.
export default function EmptyState({
  icon = "folder-open-outline",
  title,
  message,
  style,
}) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.circle}>
        <Ionicons name={icon} size={26} color={COLORS.primary} />
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 32 },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.tileBeige,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 16,
    marginTop: 14,
    textAlign: "center",
  },
  message: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
    maxWidth: 280,
  },
});
