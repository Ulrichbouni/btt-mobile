import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";

import { AuthShell, Button, Field } from "../components";
import { useI18n } from "../i18n";
import api from "../services/api";
import { COLORS, FONTS } from "../theme/theme";

export default function RegisterScreen({ navigation }) {
  const { t } = useI18n();
  const [step, setStep] = useState("form"); // 'form' | 'verify'
  const [form, setForm] = useState({
    nom: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const codeRef = useRef(null);

  const update = (key) => (value) =>
    setForm((current) => ({ ...current, [key]: value }));

  // À l'arrivée sur l'étape de vérification, le focus va au code reçu.
  useEffect(() => {
    if (step !== "verify") return undefined;
    const timer = setTimeout(() => codeRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, [step]);

  const requestEmailVerification = async () => {
    const email = form.email.trim().toLowerCase();

    if (!form.nom.trim() || !email || !form.password || !form.confirmPassword) {
      Alert.alert(t("common.error"), t("auth.fillAllFields"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert(t("common.error"), t("auth.invalidEmail"));
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert(t("common.error"), t("auth.passwordsMismatch"));
      return;
    }
    if (form.password.length < 6) {
      Alert.alert(t("common.error"), t("auth.passwordTooShort"));
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/request-otp-email", { email });
      setForm((current) => ({ ...current, email }));
      setStep("verify");
      Alert.alert(t("auth.codeSentTitle"), t("auth.codeSentMessage"));
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error.response?.data?.error || t("auth.sendCodeFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyAndRegister = async () => {
    const email = form.email.trim().toLowerCase();
    const code = verificationCode.trim();

    if (!/^\d{6}$/.test(code)) {
      Alert.alert(t("common.error"), t("auth.invalidCode"));
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp-email", {
        email,
        code,
      });

      await api.post("/auth/register", {
        nom: form.nom.trim(),
        email,
        mot_de_passe: form.password,
        email_verification_token: data.email_verification_token,
      });

      Alert.alert(t("common.success"), t("auth.accountCreated"));
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error.response?.data?.error || t("auth.verifyFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      navigation={navigation}
      activeTab="register"
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSubtitle")}
    >
      {step === "form" ? (
        <>
          <Field
            label={t("auth.fullName")}
            icon="person-outline"
            value={form.nom}
            onChangeText={update("nom")}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            editable={!loading}
          />
          <Field
            label={t("auth.email")}
            icon="mail-outline"
            value={form.email}
            keyboardType="email-address"
            onChangeText={update("email")}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            inputRef={emailRef}
            editable={!loading}
          />
          <Field
            label={t("auth.password")}
            icon="lock-closed-outline"
            value={form.password}
            onChangeText={update("password")}
            password
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            inputRef={passwordRef}
            editable={!loading}
          />
          <Field
            label={t("auth.confirmPassword")}
            icon="lock-closed-outline"
            value={form.confirmPassword}
            onChangeText={update("confirmPassword")}
            password
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={requestEmailVerification}
            inputRef={confirmRef}
            editable={!loading}
          />
          <Button
            label={t("auth.receiveCode")}
            onPress={requestEmailVerification}
            loading={loading}
            disabled={loading}
          />
        </>
      ) : (
        <>
          <Text style={styles.codeHint}>
            {t("auth.codeSentTo", { email: form.email })}
          </Text>
          <Field
            label={t("auth.codeLabel")}
            icon="keypad-outline"
            value={verificationCode}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setVerificationCode}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            returnKeyType="go"
            onSubmitEditing={verifyAndRegister}
            inputRef={codeRef}
            editable={!loading}
          />
          <Button
            label={t("auth.verifyCode")}
            onPress={verifyAndRegister}
            loading={loading}
            disabled={loading}
            variant="green"
          />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => setStep("form")}
            disabled={loading}
          >
            <Text style={styles.link}>{t("auth.changeEmail")}</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <Text style={styles.link}>{t("auth.backToLogin")}</Text>
      </TouchableOpacity>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  codeHint: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  linkRow: { alignItems: "center", marginTop: 18 },
  link: { color: COLORS.primary, fontFamily: FONTS.semiBold, fontSize: 14 },
});
