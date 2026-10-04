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

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState("email"); // 'email' | 'email_verify' | 'register'
  const [form, setForm] = useState({
    email: "",
    code: "",
    nom: "",
    telephone: "",
    password: "",
  });
  const [emailToken, setEmailToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // --- Etape 1 : demander un code OTP par email (gratuit, sans SMS) ---
  const requestEmailOTP = async () => {
    const email = form.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      Alert.alert("Erreur", "Veuillez saisir une adresse email valide");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/request-otp-email", { email });
      setForm((f) => ({ ...f, email }));
      setStep("email_verify");
      Alert.alert(
        "Code envoye",
        `Un code a 6 chiffres vient d'etre envoye a ${email}.`,
      );
    } catch (err) {
      Alert.alert(
        "Erreur",
        err.response?.data?.error || "Envoi du code impossible",
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Etape 2 : verifier le code et obtenir le token ---
  const verifyEmailOTP = async () => {
    const code = form.code.trim();
    if (!/^\d{6}$/.test(code)) {
      Alert.alert("Erreur", "Le code doit contenir 6 chiffres");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp-email", {
        email: form.email,
        code,
      });
      setEmailToken(data.email_verification_token);
      setStep("register");
    } catch (err) {
      Alert.alert(
        "Erreur",
        err.response?.data?.error || "Code invalide ou expire",
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Etape 3 : creer le compte ---
  const register = async () => {
    const nom = form.nom.trim();
    const email = form.email.trim().toLowerCase();
    const telephone = form.telephone.trim();
    const password = form.password;

    if (!nom || !email || !password) {
      Alert.alert("Erreur", "Nom, email et mot de passe sont requis");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit faire au moins 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const payload = { nom, email, mot_de_passe: password };
      if (telephone) payload.telephone = telephone;
      if (emailToken) payload.email_verification_token = emailToken;

      await api.post("/auth/register", payload);
      Alert.alert("Succes", "Compte cree ! Vous pouvez vous connecter.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        "Erreur",
        err.response?.data?.error || "Inscription impossible",
      );
    } finally {
      setLoading(false);
    }
  };

  const skipEmailVerification = () => {
    setEmailToken(null);
    setStep("register");
  };

  const backToEmail = () => {
    setForm((f) => ({ ...f, code: "" }));
    setStep("email");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>

      {/* Indicateur d'étapes */}
      <View style={styles.stepRow}>
        {["email", "email_verify", "register"].map((s, i) => (
          <View
            key={s}
            style={[
              styles.stepDot,
              (step === s ||
                ["email", "email_verify", "register"].indexOf(step) > i) &&
                styles.stepDotActive,
            ]}
          />
        ))}
      </View>

      {/* --- ÉTAPE 1 : EMAIL --- */}
      {step === "email" && (
        <>
          <Text style={styles.hint}>
            Nous vous enverrons un code à 6 chiffres pour vérifier votre
            adresse email. Gratuit, sans SMS.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={form.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={update("email")}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={requestEmailOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Recevoir le code</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={skipEmailVerification}>
            <Text style={styles.link}>Continuer sans vérifier l'email</Text>
          </TouchableOpacity>
        </>
      )}

      {/* --- ÉTAPE 2 : VÉRIFICATION --- */}
      {step === "email_verify" && (
        <>
          <Text style={styles.hint}>
            Code envoyé à <Text style={styles.bold}>{form.email}</Text>.
            Vérifiez vos spams si vous ne le voyez pas.
          </Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            placeholder="● ● ● ● ● ●"
            value={form.code}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={update("code")}
          />
          <TouchableOpacity
            style={styles.buttonGreen}
            onPress={verifyEmailOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Valider le code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={requestEmailOTP} disabled={loading}>
            <Text style={styles.link}>Renvoyer le code</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={backToEmail}>
            <Text style={styles.linkMuted}>Changer d'email</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={skipEmailVerification}>
            <Text style={styles.linkMuted}>Vérifier plus tard</Text>
          </TouchableOpacity>
        </>
      )}

      {/* --- ÉTAPE 3 : CRÉATION DU COMPTE --- */}
      {step === "register" && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            value={form.nom}
            onChangeText={update("nom")}
          />
          <TextInput
            style={[styles.input, styles.inputReadonly]}
            placeholder="Email"
            value={form.email}
            editable={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Téléphone (optionnel, +237...)"
            value={form.telephone}
            keyboardType="phone-pad"
            onChangeText={update("telephone")}
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe (6 caractères min.)"
            value={form.password}
            secureTextEntry
            onChangeText={update("password")}
          />

          {emailToken ? (
            <Text style={styles.verifiedBadge}>Email vérifié</Text>
          ) : (
            <Text style={styles.unverifiedBadge}>
              Email non vérifié — vous pourrez le confirmer plus tard
            </Text>
          )}

          <TouchableOpacity
            style={styles.buttonGreen}
            onPress={register}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Créer le compte</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => navigation.goBack()}>
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
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  stepDot: {
    width: 30,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e5e5",
  },
  stepDotActive: { backgroundColor: "#b45309" },
  hint: {
    color: "#6b7280",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
  bold: { fontWeight: "700", color: "#92400e" },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  inputReadonly: { backgroundColor: "#f3f4f6", color: "#6b7280" },
  codeInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: "center",
    fontWeight: "700",
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
  linkMuted: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 12,
    fontSize: 13,
  },
  verifiedBadge: {
    color: "#15803d",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  unverifiedBadge: {
    color: "#92400e",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
});
