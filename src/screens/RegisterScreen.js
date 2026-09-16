import React, { useMemo, useState } from "react";
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
import { saveSession } from "../services/auth";

export default function LoginScreen({ navigation, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const formIsValid = useMemo(() => {
    return (
      email.trim().length > 0 &&
      password.trim().length >= 6 &&
      (!otp || otp.length >= 6)
    );
  }, [email, otp, password]);

  const validateForm = () => {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = "L’email est requis.";
    }

    if (!password.trim()) {
      nextErrors.password = "Le mot de passe est requis.";
    } else if (password.trim().length < 6) {
      nextErrors.password = "Le mot de passe doit contenir au moins 6 caractères.";
    }

    if (otp && otp.trim().length < 6) {
      nextErrors.otp = "Le code OTP est invalide.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validateForm()) {
      const firstError = Object.values(errors)[0] || "Veuillez vérifier les informations saisies.";
      Alert.alert("Erreur", firstError);
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", {
        email: email.trim(),
        mot_de_passe: password,
        otp_token: otp || undefined,
      });

      await saveSession(data.token, data.user);
      onLogin(data.user);
    } catch (error) {
      const message = error.response?.data?.error || "Connexion impossible.";
      const translated =
        message === "OTP_REQUIRED"
          ? "Un code OTP est requis pour poursuivre."
          : message;

      Alert.alert("Erreur", translated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>BTT-LUX</Text>
        <Text style={styles.subtitle}>Panneaux fibrociment Luxerboard</Text>

        <TextInput
          style={[styles.input, errors.email ? styles.inputError : null]}
          placeholder="Email"
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={(value) => {
            setEmail(value);
            if (errors.email) {
              setErrors((current) => ({ ...current, email: null }));
            }
          }}
        />

        <TextInput
          style={[styles.input, errors.password ? styles.inputError : null]}
          placeholder="Mot de passe"
          value={password}
          secureTextEntry
          onChangeText={(value) => {
            setPassword(value);
            if (errors.password) {
              setErrors((current) => ({ ...current, password: null }));
            }
          }}
        />

        <TextInput
          style={[styles.input, errors.otp ? styles.inputError : null]}
          placeholder="Code OTP (si activé)"
          value={otp}
          keyboardType="number-pad"
          onChangeText={(value) => {
            setOtp(value);
            if (errors.otp) {
              setErrors((current) => ({ ...current, otp: null }));
            }
          }}
        />

        <TouchableOpacity
          style={[styles.button, !formIsValid && styles.buttonDisabled]}
          onPress={submit}
          disabled={loading || !formIsValid}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>Pas de compte ? S’inscrire</Text>
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
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 12,
  },
  inputError: {
    borderColor: "#dc2626",
  },
  button: {
    backgroundColor: "#b45309",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#92400e", textAlign: "center", marginTop: 16, fontWeight: "600" },
});
