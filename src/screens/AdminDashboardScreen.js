import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AppHeader, IconTile, Screen, SectionTitle } from "../components";
import { useI18n } from "../i18n";
import { COLORS, FONTS, SPACING } from "../theme/theme";

// Raccourcis admin : toutes les fonctions du back-office, dans l'ordre du
// plan (utilisateurs, produits, missions, devis, chantiers, 2FA).
const SHORTCUTS = [
  { key: "users", labelKey: "admin.navUsers", route: "AdminUsers", icon: "people-outline", tone: "blue" },
  { key: "products", labelKey: "admin.navProducts", route: "AdminProducts", icon: "grid-outline", tone: "green" },
  { key: "missions", labelKey: "admin.navMissions", route: "AdminMissions", icon: "checkmark-circle-outline", tone: "yellow" },
  { key: "devis", labelKey: "admin.navDevis", route: "AdminDevis", icon: "document-text-outline", tone: "purple" },
  { key: "chantiers", labelKey: "admin.navChantiers", route: "AdminChantiers", icon: "construct-outline", tone: "brown" },
  { key: "otp", labelKey: "admin.navOtp", route: "OTPSetup", icon: "lock-closed-outline", tone: "beige" },
];

export default function AdminDashboardScreen({ navigation }) {
  const { t } = useI18n();
  return (
    <Screen scroll contentStyle={styles.content}>
      <AppHeader title={t("admin.dashboard")} showBell onBell={() => {}} />

      <SectionTitle title={t("admin.dashboard")} style={styles.sectionTop} />

      <View style={styles.grid}>
        {SHORTCUTS.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={styles.gridItem}
            activeOpacity={0.85}
            onPress={() => navigation.navigate(s.route)}
            accessibilityRole="button"
          >
            <IconTile icon={s.icon} tone={s.tone} size={52} />
            <Text style={styles.gridLabel} numberOfLines={1}>
              {t(s.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  sectionTop: { marginTop: 20 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#5C4632",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  gridLabel: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 15,
    marginTop: 12,
  },
});
