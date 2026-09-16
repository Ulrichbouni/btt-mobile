import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";

import api from "../services/api";

export default function OTPSetupScreen() {
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const enableOtp = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/otp/enable");
      setSecret(data.secret);
      setQrCode(data.qrCode);
      setEnabled(false);
      Alert.alert("OTP prêt", "Scannez le QR code avec Google Authenticator");
    } catch (error) {
      Alert.alert("Erreur", error.response?.data?.error || "Impossible d’activer l’OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!code.trim()) {
      Alert.alert("Erreur", "Entrez le code OTP");
      return;
    }

    setLoading(true);
    try {
      await api.post("/otp/verify", { token: code });
      setEnabled(true);
      Alert.alert("Succès", "OTP activé avec succès");
    } catch (error) {
      Alert.alert("Erreur", error.response?.data?.error || "Code invalide");
    } finally {
      setLoading(false);
    }
  };

  const disableOtp = async () => {
    setLoading(true);
    try {
      await api.post("/otp/disable");
      setEnabled(false);
      setSecret("");
      setQrCode("");
      Alert.alert("Succès", "OTP désactivé");
    } catch (error) {
      Alert.alert("Erreur", error.response?.data?.error || "Désactivation impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sécurité OTP</Text>
      <Text style={styles.subtitle}>Solution gratuite et fiable : TOTP avec Google Authenticator</Text>

      {!qrCode ? (
        <TouchableOpacity style={styles.primaryButton} onPress={enableOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Créer le QR OTP</Text>}
        </TouchableOpacity>
      ) : (
        <>
          <Image source={{ uri: qrCode }} style={styles.qrCode} />
          <Text style={styles.secret}>Secret: {secret}</Text>
          <TextInput style={styles.input} placeholder="Code à 6 chiffres" keyboardType="number-pad" value={code} onChangeText={setCode} />

          <TouchableOpacity style={styles.primaryButton} onPress={verifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Valider l’OTP</Text>}
          </TouchableOpacity>
        </>
      )}

      {enabled && (
        <TouchableOpacity style={styles.deleteButton} onPress={disableOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Désactiver l’OTP</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#faf7f2",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#92400e",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#7c2d12",
    marginBottom: 18,
  },
  primaryButton: {
    backgroundColor: "#b45309",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  qrCode: {
    width: 220,
    height: 220,
    alignSelf: "center",
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  secret: {
    color: "#6b7280",
    marginBottom: 12,
    fontSize: 12,
  },
});
