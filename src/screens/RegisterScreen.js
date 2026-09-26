import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import api from "../services/api";

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({
    nom: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const requestEmailVerification = async () => {
    const email = form.email.trim().toLowerCase();

    if (!form.nom.trim() || !email || !form.password || !form.confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Erreur", "Veuillez saisir une adresse email valide");
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    if (form.password.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit faire au moins 6 caractères");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/request-otp-email", { email });
      setForm((current) => ({ ...current, email }));
      setStep("verify");
      Alert.alert("Vérification", "Un code a été envoyé à votre adresse email.");
    } catch (error) {
      Alert.alert(
        "Erreur",
        error.response?.data?.error || "Impossible d'envoyer le code"
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyAndRegister = async () => {
    const email = form.email.trim().toLowerCase();
    const code = verificationCode.trim();

    if (!/^\d{6}$/.test(code)) {
      Alert.alert("Erreur", "Le code doit contenir 6 chiffres");
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

      Alert.alert("Succès", "Compte créé. Vous pouvez vous connecter.");
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        "Erreur",
        error.response?.data?.error || "Vérification impossible"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>

      {step === "form" ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            value={form.nom}
            onChangeText={update("nom")}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={form.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={update("email")}
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={form.password}
            secureTextEntry
            onChangeText={update("password")}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            value={form.confirmPassword}
            secureTextEntry
            onChangeText={update("confirmPassword")}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={requestEmailVerification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Recevoir le code email</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>
            Saisissez le code reçu à {"\n"}{form.email}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Code email à 6 chiffres"
            value={verificationCode}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setVerificationCode}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={verifyAndRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Vérifier et créer le compte</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep("form")} disabled={loading}>
            <Text style={styles.link}>Modifier mon email</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
        <Text style={styles.link}>Retour à la connexion</Text>
      </TouchableOpacity>
    </ScrollView>
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
  subtitle: {
    fontSize: 14,
    color: "#78350f",
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#15803d",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#92400e", textAlign: "center", marginTop: 16 },
});
