import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, FONTS, SHADOW } from "../theme/theme";
import { initialsFromName } from "./Avatar";

// Barre de marque des maquettes : logo carré brun + titre,
// cloche (avec compteur de non-lus), avatar initiales, slot droit libre.
export default function AppHeader({
  title,
  subtitle,
  name,
  showBell = true,
  unreadCount = 0,
  loading = false,
  onBell,
  right,
}) {
  return (
    <View style={styles.row}>
      <View style={styles.logo}>
        <Ionicons name="home" size={24} color="#FFFFFF" />
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right}

      {loading ? <View style={styles.gap} /> : null}

      {showBell ? (
        <TouchableOpacity
          style={styles.bell}
          onPress={onBell}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons
            name="notifications-outline"
            size={21}
            color={COLORS.ink}
          />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      ) : null}

      {name ? (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsFromName(name)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: { flex: 1, marginLeft: 12, marginRight: 10 },
  title: {
    color: COLORS.ink,
    fontFamily: FONTS.extraBold,
    fontSize: 19,
  },
  subtitle: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 11,
    marginTop: 1,
  },
  gap: { width: 46, height: 46, marginRight: 10 },
  bell: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    ...SHADOW.card,
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: FONTS.semiBold,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.primaryDark,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
});
