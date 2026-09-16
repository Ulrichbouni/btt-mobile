import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import api from "../services/api";

const normalizePhone = (value = "") => value.replace(/\s+/g, "").replace(/[^\d+]/g, "");

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState("otp");
  const [form, setForm] = useState({
    telephone: "",
    code: "",
    nom: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const update = (key) => (value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const requestOTP = async () => {
    const phone = normalizePhone(form.telephone);

    if (!phone) {
      Alert.alert("Erreur", "Veuillez saisir votre numéro de téléphone.");
      return;
    }

    if (phone.length < 8) {
      Alert.alert("Erreur", "Le numéro de téléphone est invalide.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/request-otp", { telephone: phone });
      setStep("verify");
      Alert.alert("Info", "Code envoyé. Saisissez-le puis complétez vos informations.");
    } catch (error) {
      Alert.alert("Erreur", error.response?.data?.error || "OTP impossible." );
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => setStep("register");

  const validateBaseInfo = () => {
    if (!form.nom.trim()) {
      Alert.alert("Erreur", "Le nom est requis.");
      return false;
    }

    if (!form.email.trim()) {
      Alert.alert("Erreur", "L’email est requis.");
      return false;
    }

    if (form.password.trim().length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères.");
      return false;
    }

    return true;
  };

  const registerOnly = async () => {
    if (!validateBaseInfo()) return;

    setLoading(true);
    try {
      await api.post("/auth/register", {
        nom: form.nom.trim(),
        email: form.email.trim(),
        telephone: normalizePhone(form.telephone),
        mot_de_passe: form.password,
      });

      Alert.alert("Succès", "Compte créé avec succès. Vous pouvez maintenant vous connecter.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erreur", error.response?.data?.error || "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndRegister = async () => {
    if (!validateBaseInfo()) return;
    if (!form.code.trim()) {
      Alert.alert("Erreur", "Veuillez saisir le code OTP.");
      return;
    }

    setLoading(true);
    try {
      const { data: check } = await api.post("/auth/verify-otp", {
        telephone: normalizePhone(form.telephone),
        code: form.code,
      });

      await api.post("/auth/register", {
        nom: form.nom.trim(),
        email: form.email.trim(),
        telephone: normalizePhone(form.telephone),
        mot_de_passe: form.password,
        phone_verification_token: check?.phone_verification_token,
      });

      Alert.alert("Succès", "Compte créé avec succès. Vous pouvez maintenant vous connecter.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erreur", error.response?.data?.error || "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Créer un compte</Text>

        {step !== "register" ? (
          <TextInput
            style={styles.input}
            placeholder="Téléphone (+237...)"
            value={form.telephone}
            keyboardType="phone-pad"
            onChangeText={(value) => update("telephone")(value)}
          />
        ) : null}

        {step === "otp" ? (
          <>
            <TouchableOpacity style={styles.button} onPress={requestOTP} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Recevoir le code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={goToRegister}>
              <Text style={styles.link}>Continuer sans vérifier le téléphone</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {step !== "otp" ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Nom complet"
              value={form.nom}
              onChangeText={update("nom")}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={form.email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={update("email")}
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              value={form.password}
              secureTextEntry
              onChangeText={update("password")}
            />
          </>
        ) : null}

        {step === "verify" ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Code OTP"
              value={form.code}
              keyboardType="number-pad"
              onChangeText={update("code")}
            />

            <TouchableOpacity style={styles.buttonGreen} onPress={verifyAndRegister} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Vérifier et créer le compte</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={goToRegister}>
              <Text style={styles.link}>Continuer sans vérifier le téléphone</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {step === "register" ? (
          <TouchableOpacity style={styles.buttonGreen} onPress={registerOnly} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Créer le compte</Text>
            )}
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Retour à la connexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#faf7f2",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#92400e",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#b45309",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonGreen: {
    backgroundColor: "#15803d",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#92400e", textAlign: "center", marginTop: 16, fontWeight: "600" },
});
