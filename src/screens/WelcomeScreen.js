import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useI18n } from "../i18n";
import { COLORS, FONTS, SPACING } from "../theme/theme";

// Écran d'accueil hors session (maquette 1) : fond brun « dégradé » simulé
// par calques superposés (aucune dépendance gradient), badge BTT-LUX,
// pastille verte −15 %, titre « Construire Mieux, Construire Durable »,
// pilule blanche « Commencer » vers la connexion.
export default function WelcomeScreen({ navigation }) {
  const { t } = useI18n();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Dégradé simulé : calques bruns semi-transparents superposés */}
      <View style={[styles.layer, styles.layerBase]} />
      <View style={[styles.layer, styles.layerMid]} />
      <View style={[styles.layer, styles.layerDeep]} />
      <View style={[styles.layer, styles.layerTopGlow]} />

      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandText}>{t("common.appName")}</Text>
            </View>
            <View style={styles.offer}>
              <Text style={styles.offerPct}>{t("welcome.discount")}</Text>
              <Text style={styles.offerLabel}>{t("welcome.offer")}</Text>
            </View>
          </View>

          <Text style={styles.productLine}>{t("welcome.productLine")}</Text>

          <View style={styles.spacer} />

          <Text style={styles.title}>
            {t("welcome.title1")}{"\n"}
            {t("welcome.title2")}{"\n"}
            {t("welcome.title3")}{" "}
            <Text style={styles.titleAccent}>{t("welcome.title4")}</Text>
          </Text>

          <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>

          <TouchableOpacity
            style={styles.cta}
            activeOpacity={0.9}
            onPress={() => navigation.navigate("Login")}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>{t("welcome.cta")}</Text>
            <View style={styles.ctaCircle}>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#6E4526" },
  layer: { ...StyleSheet.absoluteFillObject },
  layerBase: { backgroundColor: "#7B4E2C" },
  layerMid: { backgroundColor: "rgba(78, 48, 32, 0.55)" },
  layerDeep: {
    backgroundColor: "rgba(50, 31, 17, 0.55)",
    top: "45%",
  },
  layerTopGlow: {
    backgroundColor: "rgba(242, 237, 228, 0.10)",
    bottom: "62%",
  },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  brandBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  brandText: {
    color: "#FFFFFF",
    fontFamily: FONTS.bold,
    fontSize: 18,
    letterSpacing: 1,
  },
  offer: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  offerPct: { color: "#FFFFFF", fontFamily: FONTS.bold, fontSize: 20 },
  offerLabel: { color: "#E6F2E8", fontFamily: FONTS.regular, fontSize: 12 },
  productLine: {
    color: "rgba(255, 255, 255, 0.62)",
    fontFamily: FONTS.medium,
    fontSize: 14,
    marginTop: 12,
  },
  spacer: { flex: 1, minHeight: 40 },
  title: {
    color: "#FFFFFF",
    fontFamily: FONTS.extraBold,
    fontSize: 34,
    lineHeight: 44,
  },
  titleAccent: { color: COLORS.greenBright },
  subtitle: {
    color: "rgba(237, 227, 216, 0.82)",
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 14,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    minHeight: 64,
    marginTop: 28,
  },
  ctaText: {
    color: COLORS.primaryDark,
    fontFamily: FONTS.bold,
    fontSize: 18,
  },
  ctaCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
});
