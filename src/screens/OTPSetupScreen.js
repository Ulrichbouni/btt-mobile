import React, { useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";

import {
  AppHeader,
  Button,
  Card,
  Field,
  Screen,
  SectionHeader,
  StatusPill,
} from "../components";
import { useI18n } from "../i18n";
import api from "../services/api";
import { COLORS, FONTS, SPACING } from "../theme/theme";

// Double authentification TOTP : QR code à scanner, puis vérification d'un
// code à 6 chiffres. Les endpoints backend restent /otp/enable,
// /otp/verify et /otp/disable.
export default function OTPSetupScreen({ navigation }) {
  const { t } = useI18n();
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [qr, setQr] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const enable = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/otp/enable");
      setSecret(data.secret);
      setQr(data.qrCode);
    } catch (e) {
      Alert.alert(
        t("common.error"),
        e.response?.data?.error || t("otp.enableError"),
      );
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    try {
      await api.post("/otp/verify", { token: code });
      setEnabled(true);
      Alert.alert(t("common.success"), t("otp.enabled"));
    } catch (e) {
      Alert.alert(
        t("common.error"),
        e.response?.data?.error || t("otp.verifyError"),
      );
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    setLoading(true);
    try {
      await api.post("/otp/disable");
      setEnabled(false);
      setQr("");
      setSecret("");
    } catch (e) {
      Alert.alert(
        t("common.error"),
        e.response?.data?.error || t("otp.disableError"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader
        showBell
        onBell={() => navigation?.navigate("Notifications")}
      />
      <SectionHeader
        icon="shield-checkmark"
        tone="brown"
        title={t("otp.title")}
        subtitle={t("otp.subtitle")}
      />

      <Card>
        <Text style={styles.hint}>{t("otp.hint")}</Text>

        {enabled ? (
          <StatusPill status="en_cours" label={t("otp.enabled")} small={false} />
        ) : null}

        {!qr ? (
          <Button
            label={t("otp.generate")}
            icon="qr-code-outline"
            onPress={enable}
            loading={loading}
            disabled={loading}
            style={styles.block}
          />
        ) : (
          <>
            <View style={styles.qrWrap}>
              <Image source={{ uri: qr }} style={styles.qr} />
            </View>
            <Text style={styles.secret}>
              {t("otp.keepSecret", { secret })}
            </Text>
            <Field
              label={t("otp.codeLabel")}
              icon="keypad-outline"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />
            <Button
              label={t("otp.verify")}
              icon="checkmark"
              variant="green"
              onPress={verify}
              loading={loading}
              disabled={loading}
            />
          </>
        )}

        {enabled ? (
          <Button
            label={t("otp.disable")}
            variant="danger"
            icon="close-circle-outline"
            onPress={disable}
            loading={loading}
            disabled={loading}
            style={styles.block}
          />
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  hint: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  block: { marginTop: 16 },
  qrWrap: { alignItems: "center", marginBottom: 14 },
  qr: { width: 220, height: 220, borderRadius: 16 },
  secret: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
  },
});
