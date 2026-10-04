import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";

import { AuthShell, Button, Field } from "../components";
import { useI18n } from "../i18n";
import api from "../services/api";
import { saveSession } from "../services/auth";
import { COLORS, FONTS } from "../theme/theme";

export default function LoginScreen({ navigation, onLogin }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequired, setOtpRequired] = useState(false); // champ OTP visible uniquement si demandé
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      Alert.alert(t("common.error"), t("auth.fillAllFields"));
      return;
    }
    if (otpRequired && !otp) {
      Alert.alert(t("common.error"), t("auth.otpRequired"));
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        mot_de_passe: password,
        otp_token: otp || undefined,
      });
      await saveSession(data.token, data.user);
      onLogin(data.user);
    } catch (err) {
      const code = err.response?.data?.error;
      if (code === "OTP_REQUIRED") {
        setOtpRequired(true);
        Alert.alert(t("auth.twoFactorTitle"), t("auth.twoFactorMessage"));
      } else {
        Alert.alert(t("common.error"), code || t("auth.loginFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      navigation={navigation}
      activeTab="login"
      title={t("auth.welcomeBack")}
      subtitle={t("auth.loginSubtitle")}
    >
      <Field
        label={t("auth.email")}
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field
        label={t("auth.password")}
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        password
      />

      {otpRequired && (
        <Field
          label={t("auth.otpLabel")}
          icon="keypad-outline"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
      )}

      <TouchableOpacity
        style={styles.forgot}
        onPress={() =>
          Alert.alert(t("auth.forgotPassword"), t("auth.forgotPasswordMessage"))
        }
        hitSlop={8}
      >
        <Text style={styles.forgotText}>{t("auth.forgotPassword")}</Text>
      </TouchableOpacity>

      <Button
        label={otpRequired ? t("auth.otpCta") : t("auth.loginCta")}
        onPress={submit}
        loading={loading}
        disabled={loading}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: "flex-end", marginBottom: 22, marginTop: -4 },
  forgotText: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
});
