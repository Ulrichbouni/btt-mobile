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
} from "react-native";
import api from "../services/api";
import { saveSession } from "../services/auth";

export default function LoginScreen({ navigation, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequired, setOtpRequired] = useState(false); // champ OTP visible uniquement si demandé
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }
    if (otpRequired && !otp) {
      Alert.alert("Erreur", "Code OTP requis");
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
        Alert.alert(
          "Vérification 2FA",
          "Saisissez le code à 6 chiffres de votre application d'authentification.",
        );
      } else {
        Alert.alert("Erreur", code || "Connexion impossible");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>BTT-LUX</Text>
      <Text style={styles.subtitle}>Panneaux fibrociment Luxerboard</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />
      {otpRequired && (
        <TextInput
          style={[styles.input, styles.otpInput]}
          placeholder="Code 2FA (6 chiffres)"
          value={otp}
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={setOtp}
          autoFocus
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {otpRequired ? "Valider le code" : "Se connecter"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>Pas de compte ? S'inscrire</Text>
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
  logo: {
    fontSize: 40,
    fontWeight: "800",
    color: "#92400e",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#78350f",
    textAlign: "center",
    marginBottom: 32,
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
  otpInput: {
    letterSpacing: 6,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 20,
  },
  button: {
    backgroundColor: "#b45309",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#92400e", textAlign: "center", marginTop: 16 },
});
