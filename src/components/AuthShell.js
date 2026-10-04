import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS, FONTS, RADII, SPACING } from "../theme/theme";
import { useI18n } from "../i18n";
import SegmentedTabs from "./SegmentedTabs";

// Coquille commune Connexion / Inscription : badge BTT-LUX, identité de
// l'entreprise, onglets segmentés et bloc titre — garantit une interface
// strictement identique entre les deux écrans d'authentification.
export default function AuthShell({
  navigation,
  activeTab,
  title,
  subtitle,
  children,
}) {
  const { t } = useI18n();

  const goTab = (key) => {
    if (key === activeTab) return;
    navigation.navigate(key === "login" ? "Login" : "Register");
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t("common.appName")}</Text>
          </View>
          <View style={styles.brandText}>
            <Text style={styles.company} numberOfLines={1}>
              {t("common.company")}
            </Text>
            <Text style={styles.tagline} numberOfLines={1}>
              {t("common.tagline")}
            </Text>
          </View>
        </View>

        <SegmentedTabs
          style={styles.tabs}
          value={activeTab}
          onChange={goTab}
          tabs={[
            { key: "login", label: t("auth.loginTab") },
            { key: "register", label: t("auth.registerTab") },
          ]}
        />

        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        <View style={styles.body}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  badgeText: {
    color: "#FFFFFF",
    fontFamily: FONTS.bold,
    fontSize: 17,
    letterSpacing: 1,
  },
  brandText: { flex: 1, marginLeft: 12 },
  company: { color: COLORS.ink, fontFamily: FONTS.bold, fontSize: 15 },
  tagline: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 1,
  },
  tabs: { marginBottom: 26 },
  title: { color: COLORS.ink, fontFamily: FONTS.extraBold, fontSize: 27 },
  subtitle: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 14,
    marginTop: 4,
  },
  body: { marginTop: 22 },
});
