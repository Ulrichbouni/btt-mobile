import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import api from "../services/api";

export default function PaiementScreen({ route }) {
  const [montant, setMontant] = useState("");
  const [phone, setPhone] = useState("");
  const [devisId, setDevisId] = useState(
    route?.params?.devisId ? String(route.params.devisId) : "",
  );
  const [devis, setDevis] = useState(null);
  const [devisError, setDevisError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historique, setHistorique] = useState([]);
  const [historiqueError, setHistoriqueError] = useState(null);

  const fetchHistorique = async () => {
    setHistoriqueError(null);
    try {
      const { data } = await api.get("/paiements/historique");
      setHistorique(data);
    } catch (e) {
      setHistoriqueError(
        e.response?.data?.error || e.message || "Erreur de chargement",
      );
    }
  };

  useEffect(() => {
    fetchHistorique();
  }, []);

  useEffect(() => {
    if (!devisId) {
      setDevis(null);
      setDevisError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/devis/${devisId}`);
        if (cancelled) return;
        setDevis(data);
        setDevisError(null);
        if (data.total_final !== null && data.total_final !== undefined) {
          setMontant(String(data.total_final));
        } else {
          setMontant("");
        }
      } catch (e) {
        if (cancelled) return;
        setDevis(null);
        setDevisError(e.response?.data?.error || "Devis introuvable");
        setMontant("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [devisId]);

  const montantLocked = !!devisId && !!devis;
  const devisNonValide =
    !!devisId &&
    devis &&
    (devis.total_final === null || devis.total_final === undefined);

  const payer = async () => {
    if (!montant || montant <= 0)
      return Alert.alert("Erreur", "Montant invalide");
    if (!phone || phone.length < 8)
      return Alert.alert("Erreur", "Numéro invalide");
    if (devisNonValide)
      return Alert.alert(
        "Erreur",
        "Ce devis n'a pas encore été validé par l'équipe, paiement impossible pour l'instant",
      );
    setLoading(true);
    try {
      const { data } = await api.post("/paiements/initier", {
        montant: parseFloat(montant),
        methode: "mobile_money",
        telephone: phone,
        devis_id: devisId ? parseInt(devisId) : null,
      });
      Alert.alert(
        "Paiement initié",
        `Référence: ${data.reference}\n\nUne demande Mobile Money a été envoyée à votre numéro.\nIndiquez votre code pour confirmer.`,
      );
      fetchHistorique();
    } catch (err) {
      Alert.alert(
        "Erreur",
        err.response?.data?.error || "Impossible d'initier le paiement",
      );
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>💳 Paiement</Text>

      <TextInput
        style={styles.input}
        placeholder="Devis ID (optionnel)"
        keyboardType="numeric"
        value={devisId}
        onChangeText={setDevisId}
      />
      {devisError ? <Text style={styles.error}>⚠️ {devisError}</Text> : null}
      {devisNonValide ? (
        <Text style={styles.warning}>
          ⏳ Ce devis n'a pas encore de prix validé par l'équipe.
        </Text>
      ) : null}

      <TextInput
        style={[styles.input, montantLocked && styles.inputLocked]}
        placeholder="Montant (FCFA)"
        keyboardType="numeric"
        value={montant}
        onChangeText={montantLocked ? undefined : setMontant}
        editable={!montantLocked}
      />
      {montantLocked && (
        <Text style={styles.hint}>
          Montant fixé par le devis #{devisId}, non modifiable.
        </Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Téléphone Mobile Money"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={payer}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Payer via Campay</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Historique</Text>
      {historiqueError ? (
        <Text style={styles.error}>⚠️ {historiqueError}</Text>
      ) : null}
      {!historiqueError && historique.length === 0 && (
        <Text style={styles.empty}>Aucun paiement</Text>
      )}
      {historique.map((p) => (
        <View key={p.id} style={styles.item}>
          <Text style={styles.itemAmount}>
            {p.montant?.toLocaleString()} FCFA
          </Text>
          <Text style={styles.itemSub}>Réf: {p.reference}</Text>
          <Text style={styles.itemStatut}>{p.statut}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: "#faf7f2" },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#92400e",
    marginBottom: 16,
  },
  error: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  warning: {
    color: "#92400e",
    backgroundColor: "#fef3c7",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  hint: { color: "#6b7280", fontSize: 12, marginTop: -8, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  inputLocked: { backgroundColor: "#f3f4f6", color: "#6b7280" },
  button: {
    backgroundColor: "#16a34a",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  empty: { color: "#6b7280", textAlign: "center", padding: 12 },
  item: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemAmount: { fontSize: 16, fontWeight: "600", color: "#111827" },
  itemSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  itemStatut: { fontSize: 12, color: "#92400e", marginTop: 2 },
});
