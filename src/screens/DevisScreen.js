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
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import api from "../services/api";
import { isValidDate, toNumber } from "../utils/numbers";
import { telechargerDevisPDF } from "../services/pdf";

const STATUT_COLORS = {
  envoye: "#2563eb",
  en_cours: "#b45309",
  valide: "#16a34a",
  refuse: "#dc2626",
  paye: "#0f766e",
};

export default function DevisScreen({ navigation, route }) {
  const [produits, setProduits] = useState([]);
  const [produitId, setProduitId] = useState(null);
  const [form, setForm] = useState({
    surface: "",
    ville: "",
    adresse: "",
    date_souhaitee: "",
  });
  const [photos, setPhotos] = useState([]);
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(null);
  const [error, setError] = useState(null);
  const [listError, setListError] = useState(null);

  const loadMesDevis = async () => {
    setListError(null);
    try {
      const { data } = await api.get("/devis/mes-devis");
      setDevisList(Array.isArray(data) ? data : []);
    } catch (e) {
      setListError(e.response?.data?.error || "Liste des devis indisponible");
    }
  };

  useEffect(() => {
    loadMesDevis();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get("/products");
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setProduits(list);
        if (list.length) setProduitId((prev) => prev ?? list[0].id);
      } catch {
        if (active) setProduits([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Préremplissage depuis le calculateur (surface / produit)
  useEffect(() => {
    const params = route?.params || {};
    if (!params.surface && !params.produit_id) return;
    setForm((prev) => ({
      ...prev,
      surface: params.surface ? String(params.surface) : prev.surface,
    }));
    if (params.produit_id) setProduitId(Number(params.produit_id));
  }, [route?.params]);

  const addPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission refusée",
        "Autorisez l'accès à la galerie pour joindre des photos.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;
    setPhotos((prev) => [...prev, ...result.assets].slice(0, 5));
  };

  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadPhotos = async () => {
    const urls = [];
    if (!photos.length) return urls;
    setUploading(true);
    try {
      for (const asset of photos) {
        const formData = new FormData();
        const name = asset.fileName || `devis_${Date.now()}.jpg`;
        formData.append("file", {
          uri: asset.uri,
          name,
          type: asset.mimeType || "image/jpeg",
        });
        const { data } = await api.post("/uploads/photo", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        urls.push(data.url);
      }
    } finally {
      setUploading(false);
    }
    return urls;
  };

  const submit = async () => {
    setError(null);
    const surface = toNumber(form.surface);
    const ville = form.ville.trim();
    const adresse = form.adresse.trim();
    const date = form.date_souhaitee.trim();

    if (!surface || surface <= 0) {
      Alert.alert("Erreur", "Surface invalide (nombre positif requis)");
      return;
    }
    if (ville.length < 2) {
      Alert.alert("Erreur", "Ville requise (2 caractères minimum)");
      return;
    }
    if (adresse.length < 5) {
      Alert.alert("Erreur", "Adresse requise (5 caractères minimum)");
      return;
    }
    if (date && !isValidDate(date)) {
      Alert.alert("Erreur", "Date souhaitée au format AAAA-MM-JJ");
      return;
    }

    setLoading(true);
    try {
      const photoUrls = await uploadPhotos();

      const payload = { surface, ville, adresse };
      if (date) payload.date_souhaitee = `${date}T09:00:00.000Z`;
      if (photoUrls.length) payload.photos = photoUrls;
      if (produitId) payload.produit_id = Number(produitId);

      const { data } = await api.post("/devis", payload);
      Alert.alert(
        "Devis envoyé",
        `Votre demande #${data.id} a été transmise. Notre équipe vous répondra sous 48h.`,
      );
      setForm({ surface: "", ville: "", adresse: "", date_souhaitee: "" });
      setPhotos([]);
      await loadMesDevis();
    } catch (e) {
      const details = e.response?.data?.details;
      const msg =
        details?.map((d) => `${d.champ}: ${d.message}`).join("\n") ||
        e.response?.data?.error ||
        "Envoi impossible";
      Alert.alert("Erreur", msg);
    } finally {
      setLoading(false);
    }
  };

  const canPay = (d) =>
    d.total_final !== null &&
    d.total_final !== undefined &&
    d.statut !== "paye";

  const payer = (d) => {
    navigation?.navigate("Tabs", {
      screen: "Paiement",
      params: { devisId: d.id },
    });
  };

  // GET /api/devis/:id/pdf exige l'en-tête Authorization :
  // téléchargement avec le token puis partage du fichier.
  const telechargerPDF = async (id) => {
    setPdfLoading(id);
    try {
      await telechargerDevisPDF(id);
    } catch (e) {
      Alert.alert("Erreur", e.message || "Impossible d'ouvrir le PDF");
    } finally {
      setPdfLoading(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📄 Demande de devis</Text>

      {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.label}>Surface (m²)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={form.surface}
          onChangeText={(v) => setForm({ ...form, surface: v })}
          placeholder="Ex: 96"
        />

        <Text style={styles.label}>Ville</Text>
        <TextInput
          style={styles.input}
          value={form.ville}
          onChangeText={(v) => setForm({ ...form, ville: v })}
          placeholder="Douala"
        />

        <Text style={styles.label}>Adresse du chantier</Text>
        <TextInput
          style={styles.input}
          value={form.adresse}
          onChangeText={(v) => setForm({ ...form, adresse: v })}
          placeholder="Quartier, rue, repère"
        />

        <Text style={styles.label}>Date souhaitée (optionnel, AAAA-MM-JJ)</Text>
        <TextInput
          style={styles.input}
          value={form.date_souhaitee}
          onChangeText={(v) => setForm({ ...form, date_souhaitee: v })}
          placeholder="2026-10-15"
        />

        <Text style={styles.label}>Produit souhaité</Text>
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
        </View>

        <Text style={styles.label}>Photos du chantier (optionnel, max 5)</Text>
        <View style={styles.photoGrid}>
          {photos.map((asset, i) => (
            <TouchableOpacity
              key={`${asset.uri}-${i}`}
              onPress={() => removePhoto(i)}
            >
              <Image source={{ uri: asset.uri }} style={styles.photo} />
              <Text style={styles.removePhoto}>✕</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.photoBtn, uploading && styles.disabled]}
          onPress={addPhotos}
          disabled={uploading}
        >
          <Text style={styles.white}>
            {uploading ? "Envoi des photos..." : "+ Ajouter des photos"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primary, loading && styles.disabled]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.white}>Envoyer la demande</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Mes devis</Text>
      {listError ? <Text style={styles.error}>⚠️ {listError}</Text> : null}
      {!listError && devisList.length === 0 && (
        <Text style={styles.empty}>Aucune demande de devis</Text>
      )}

      {devisList.map((d) => (
        <View key={d.id} style={styles.card}>
          <Text style={styles.devisTitle}>
            Devis #{d.id} — {d.ville || "—"}
          </Text>
          <Text style={styles.meta}>
            {d.surface ? `${d.surface} m²` : "Surface —"}
          </Text>
          <Text style={styles.meta}>
            Total :{" "}
            {d.total_final !== null && d.total_final !== undefined
              ? `${Number(d.total_final).toLocaleString()} FCFA`
              : "en attente de validation"}
          </Text>
          <Text
            style={[
              styles.statut,
              { color: STATUT_COLORS[d.statut] || "#6b7280" },
            ]}
          >
            Statut : {d.statut}
          </Text>

          <View style={styles.actions}>
            {canPay(d) && (
              <TouchableOpacity style={styles.payBtn} onPress={() => payer(d)}>
                <Text style={styles.white}>Payer</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.pdfBtn, pdfLoading === d.id && styles.disabled]}
              onPress={() => telechargerPDF(d.id)}
              disabled={pdfLoading === d.id}
            >
              <Text style={styles.white}>
                {pdfLoading === d.id ? "PDF..." : "PDF"}
              </Text>
            </TouchableOpacity>
          </View>
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
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
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photo: { width: 84, height: 84, borderRadius: 8, backgroundColor: "#eee" },
  removePhoto: {
    position: "absolute",
    top: 2,
    right: 6,
    color: "#dc2626",
    fontWeight: "800",
  },
  photoBtn: {
    backgroundColor: "#0ea5e9",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  primary: {
    backgroundColor: "#b45309",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 14,
  },
  disabled: { opacity: 0.6 },
  white: { color: "#fff", fontWeight: "700" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 8,
    marginBottom: 8,
  },
  empty: { color: "#6b7280", textAlign: "center", padding: 12 },
  devisTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  meta: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  statut: { fontSize: 13, fontWeight: "700", marginTop: 6 },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  payBtn: {
    flex: 1,
    backgroundColor: "#16a34a",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  pdfBtn: {
    flex: 1,
    backgroundColor: "#b45309",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});
