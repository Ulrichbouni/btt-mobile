import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useI18n } from "../i18n";
import api from "../services/api";
import { saveSession } from "../services/auth";
import { COLORS, FONTS, RADII } from "../theme/theme";

// Bouton de connexion rapide pour le développement. Il ouvre une session admin
// réelle via le même endpoint que le formulaire, afin d'atteindre les écrans
// admin sans saisie ni session préexistante.
function DevQuickLoginButton({ onLogin, onError }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  // Identifiants de développement, surchargeables par variables d'environnement.
  // Aucun littéral de repli n'est embarqué : sans configuration, le bouton reste
  // inerte plutôt que de compiler un mot de passe dans les sources. Ces lectures
  // ne sont compilées que dans les builds de développement (garde `__DEV__`).
  const devEmail = process.env.EXPO_PUBLIC_DEV_ADMIN_EMAIL || "";
  const devPassword = process.env.EXPO_PUBLIC_DEV_ADMIN_PASSWORD || "";
  // Sans variables d'environnement configurées, le raccourci est inerte : on
  // évite d'envoyer des identifiants vides au backend pour un échec certain.
  const configured = Boolean(devEmail && devPassword);

  const quickLogin = async () => {
    if (!configured) return;
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        email: devEmail,
        mot_de_passe: devPassword,
      });
      await saveSession(data.token, data.user);
      onLogin?.(data.user);
    } catch (err) {
      onError?.(err.response?.data?.error || t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.pill, !configured && styles.pillDisabled]}
      onPress={quickLogin}
      disabled={loading || !configured}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t("auth.devQuickLogin")}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.primaryDark} size="small" />
      ) : (
        <>
          <Ionicons
            name="construct-outline"
            size={16}
            color={COLORS.primaryDark}
          />
          <Text style={styles.label}>{t("auth.devQuickLogin")}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

/**
 * Raccourci de connexion réservé au développement.
 *
 * En production, `__DEV__` vaut `false` : le bouton, son code et les
 * identifiants ci-dessus sont retirés du bundle par le minifieur, le raccourci
 * n'existe donc pas dans une application publiée.
 */
export default function DevQuickLogin({ onLogin, onError }) {
  if (!__DEV__) return null;
  return <DevQuickLoginButton onLogin={onLogin} onError={onError} />;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    minHeight: 44,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.muted,
  },
  pillDisabled: {
    opacity: 0.45,
  },
  label: {
    color: COLORS.primaryDark,
    fontFamily: FONTS.semiBold,
    fontSize: 13,
  },
});
