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
import { toNumber } from "../utils/numbers";

const TYPES = [
  { value: "residentiel", label: "Résidentiel" },
  { value: "commercial", label: "Commercial" },
  { value: "industriel", label: "Industriel" },
];

// "" => laisser le backend suggérer l'épaisseur selon le type de bâtiment
const EPAISSEURS = ["", "8mm", "10mm", "12mm", "14mm"];

export default function CalculatorScreen({ navigation, route }) {
  const [produits, setProduits] = useState([]);
  const [produitId, setProduitId] = useState(null);
  const [typeBatiment, setTypeBatiment] = useState("residentiel");
  const [form, setForm] = useState({
    longueur: "",
    largeur: "",
    etage: "",
    epaisseur: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get("/products");
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setProduits(list);
        if (list.length) {
          setProduitId((prev) => prev ?? list[0].id);
        }
      } catch (e) {
        if (active) {
          setError(e.response?.data?.error || "Catalogue indisponible");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Préremplissage possible depuis un autre écran (ex: résultat de mesures).
  // On teste `!= null` et non la véracité : `longueur === 0` est une valeur
  // explicite et doit être acceptée.
  useEffect(() => {
    const params = route?.params || {};
    const hasLongueur = params.longueur !== undefined && params.longueur !== null;
    const hasLargeur = params.largeur !== undefined && params.largeur !== null;
    const hasProduit = params.produit_id !== undefined && params.produit_id !== null;

    if (!hasLongueur && !hasLargeur && !hasProduit) return;

    setForm((prev) => ({
      ...prev,
      longueur: hasLongueur ? String(params.longueur) : prev.longueur,
      largeur: hasLargeur ? String(params.largeur) : prev.largeur,
    }));
    if (hasProduit) setProduitId(Number(params.produit_id));
  }, [route?.params]);

  const estimer = async () => {
    setError(null);
    const longueur = toNumber(form.longueur);
    const largeur = toNumber(form.largeur);
    const etage = toNumber(form.etage);

    if (!longueur || longueur <= 0 || !largeur || largeur <= 0) {
      Alert.alert(
        "Erreur",
        "Longueur et largeur doivent être des nombres strictement positifs",
      );
      return;
    }
    if (!produitId) {
      Alert.alert("Erreur", "Sélectionnez un produit");
      return;
    }
    if (etage !== null && (etage < 0 || !Number.isInteger(etage))) {
      Alert.alert("Erreur", "L'étage doit être un entier positif ou zéro");
      return;
    }

    const payload = {
      longueur,
      largeur,
      type_batiment: typeBatiment,
      produit_id: Number(produitId),
    };
    if (etage !== null) payload.etage = etage;
    if (form.epaisseur) payload.epaisseur = form.epaisseur;

    setLoading(true);
    try {
      const { data } = await api.post("/calculator/estimer", payload);
      setResult(data);
    } catch (e) {
      const details = e.response?.data?.details;
      const msg =
        details?.map((d) => `${d.champ}: ${d.message}`).join("\n") ||
        e.response?.data?.error ||
        "Estimation impossible";
      Alert.alert("Erreur", msg);
    } finally {
      setLoading(false);
    }
  };

  const preparerDevis = () => {
    if (!result) return;
    navigation?.navigate("Devis", {
      surface: result.surface,
      produit_id: produitId,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🧮 Calculateur de besoins</Text>

      {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.label}>Produit</Text>
        <View style={styles.chipRow}>
          {produits.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.chip, produitId === p.id && styles.chipActive]}
              onPress={() => setProduitId(p.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  produitId === p.id && styles.chipTextActive,
                ]}
              >
                {p.nom} ({p.epaisseur})
              </Text>
            </TouchableOpacity>
          ))}
          {produits.length === 0 && (
            <Text style={styles.hint}>Aucun produit au catalogue</Text>
          )}
        </View>

        <Text style={styles.label}>Longueur (m)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={form.longueur}
          onChangeText={(v) => setForm({ ...form, longueur: v })}
          placeholder="Ex: 12"
        />

        <Text style={styles.label}>Largeur (m)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={form.largeur}
          onChangeText={(v) => setForm({ ...form, largeur: v })}
          placeholder="Ex: 8"
        />

        <Text style={styles.label}>Type de bâtiment</Text>
        <View style={styles.chipRow}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[
                styles.chip,
                typeBatiment === t.value && styles.chipActive,
              ]}
              onPress={() => setTypeBatiment(t.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  typeBatiment === t.value && styles.chipTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Étage (optionnel)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={form.etage}
          onChangeText={(v) => setForm({ ...form, etage: v })}
          placeholder="0"
        />

        <Text style={styles.label}>Épaisseur (optionnel)</Text>
        <View style={styles.chipRow}>
          {EPAISSEURS.map((e) => (
            <TouchableOpacity
              key={e || "auto"}
              style={[styles.chip, form.epaisseur === e && styles.chipActive]}
              onPress={() => setForm({ ...form, epaisseur: e })}
            >
              <Text
                style={[
                  styles.chipText,
                  form.epaisseur === e && styles.chipTextActive,
                ]}
              >
                {e || "Auto"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primary, loading && styles.disabled]}
          onPress={estimer}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.white}>Estimer mes besoins</Text>
          )}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Résultat</Text>
          <Text style={styles.resultLine}>Surface : {result.surface} m²</Text>
          <Text style={styles.resultLine}>
            Épaisseur : {result.epaisseur_selected} (suggérée :{" "}
            {result.epaisseur_suggested})
          </Text>
          <Text style={styles.resultLine}>
            Panneaux : {result.nb_panneaux} (marge 10%)
          </Text>
          <Text style={styles.resultLine}>Ossature : {result.ossature_ml} ml</Text>
          <Text style={styles.resultLine}>Vis : {result.nb_vis}</Text>
          <Text style={styles.resultLine}>
            Poids total : {result.poids_total} kg
          </Text>
          <Text style={styles.resultLine}>
            Équivalent conteneur : {result.equivalent_conteneur}
          </Text>
          <Text style={styles.cost}>
            Coût estimé : {result.cout_total?.toLocaleString()} FCFA
          </Text>
          <Text style={styles.mention}>* {result.mention}</Text>

          <TouchableOpacity style={styles.secondary} onPress={preparerDevis}>
            <Text style={styles.white}>Préparer une demande de devis</Text>
          </TouchableOpacity>
        </View>
      )}
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  hint: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chipActive: { backgroundColor: "#b45309", borderColor: "#b45309" },
  chipText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  primary: {
    backgroundColor: "#b45309",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  secondary: {
    backgroundColor: "#0f766e",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  disabled: { opacity: 0.6 },
  white: { color: "#fff", fontWeight: "700" },
  resultCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e3a8a",
    marginBottom: 6,
  },
  resultLine: { fontSize: 14, color: "#374151", marginBottom: 2 },
  cost: {
    fontSize: 18,
    fontWeight: "800",
    color: "#92400e",
    marginTop: 8,
  },
  mention: { fontSize: 11, color: "#6b7280", marginTop: 6 },
});
