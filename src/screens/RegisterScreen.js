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

export default function RegisterScreen({ navigation, onRegistered }) {
  const [step, setStep] = useState("otp"); // 'otp' | 'verify' | 'register'
  const [form, setForm] = useState({
    telephone: "",
    code: "",
    nom: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const update = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const requestOTP = async () => {
    if (!form.telephone) {
      Alert.alert("Erreur", "Veuillez entrer votre numero");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/request-otp", { telephone: form.telephone });
      setStep("verify");
      Alert.alert("Info", "Code envoye. Saisissez-le et completez vos infos.");
    } catch (err) {
      Alert.alert("Erreur", err.response?.data?.error || "OTP impossible");
    }
    setLoading(false);
  };

  const skipPhone = () => {
    setStep("register");
  };

  const registerOnly = async () => {
    if (!form.nom || !form.email || !form.password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
        mot_de_passe: form.password,
      });
      Alert.alert("Succes", "Compte cree ! Vous pouvez vous connecter.");
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        "Erreur",
        err.response?.data?.error || "Inscription impossible",
      );
    }
    setLoading(false);
  };

  const verifyAndRegister = async () => {
    if (!form.nom || !form.email || !form.password || !form.code) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    try {
      const { data: check } = await api.post("/auth/verify-otp", {
        telephone: form.telephone,
        code: form.code,
      });
      await api.post("/auth/register", {
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
        mot_de_passe: form.password,
        phone_verification_token: check?.phone_verification_token,
      });
      Alert.alert("Succes", "Compte cree ! Vous pouvez vous connecter.");
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        "Erreur",
        err.response?.data?.error || "Inscription impossible",
      );
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Creer un compte</Text>

      {step !== "register" ? (
        <TextInput
          style={styles.input}
          placeholder="Telephone (+237...)"
          value={form.telephone}
          keyboardType="phone-pad"
          onChangeText={update("telephone")}
        />
      ) : null}

      {step === "otp" ? (
        <TouchableOpacity
          style={styles.button}
          onPress={requestOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Recevoir le code</Text>
          )}
        </TouchableOpacity>
      ) : null}

      {step === "otp" ? (
        <TouchableOpacity onPress={skipPhone}>
          <Text style={styles.link}>Continuer sans verifier le telephone</Text>
        </TouchableOpacity>
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
          <TouchableOpacity
            style={styles.buttonGreen}
            onPress={verifyAndRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verifier et creer le compte</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={skipPhone}>
            <Text style={styles.link}>
              Continuer sans verifier le telephone
            </Text>
          </TouchableOpacity>
        </>
      ) : null}

      {step === "register" ? (
        <TouchableOpacity
          style={styles.buttonGreen}
          onPress={registerOnly}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Creer le compte</Text>
          )}
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Retour a la connexion</Text>
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
    backgroundColor: "#b45309",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonGreen: {
    backgroundColor: "#15803d",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#92400e", textAlign: "center", marginTop: 16 },
});
