import React, { useState } from "react";
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
import { toNumber } from "../utils/numbers";

export default function SaisieMesuresScreen({ route, navigation }) {
  const missionId = route?.params?.missionId;
  const mission = route?.params?.mission;

  const [form, setForm] = useState({
    longueur_murs: "",
    hauteur_sous_plafond: "",
    surface_ouverte: "",
    perimetre: "",
  });
  const [photoUrls, setPhotoUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const longueur = toNumber(form.longueur_murs);
  const hauteur = toNumber(form.hauteur_sous_plafond);
  const ouverture = toNumber(form.surface_ouverte) || 0;
  const perimetre = toNumber(form.perimetre);

  // Même formule que le backend : surface_reelle = L * H - ouvertures
  const surfaceReelle =
    longueur && hauteur ? longueur * hauteur - ouverture : null;
  const nbPanneaux =
    surfaceReelle && surfaceReelle > 0 ? Math.ceil(surfaceReelle / 1.2) : null;

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

    setUploading(true);
    try {
      const urls = [];
      for (const asset of result.assets) {
        const formData = new FormData();
        const name = asset.fileName || `mesure_${Date.now()}.jpg`;
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
      setPhotoUrls((prev) => [...prev, ...urls]);
    } catch (e) {
      Alert.alert("Erreur", e.response?.data?.error || "Upload impossible");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!missionId) {
      Alert.alert("Erreur", "Mission inconnue");
      return;
    }
    if (!longueur || longueur <= 0) {
      Alert.alert("Erreur", "Longueur des murs invalide");
      return;
    }
    if (!hauteur || hauteur <= 0) {
      Alert.alert("Erreur", "Hauteur sous plafond invalide");
      return;
    }
    if (!surfaceReelle || surfaceReelle <= 0) {
      Alert.alert(
        "Erreur",
        "La surface réelle calculée est nulle ou négative. Vérifiez les ouvertures.",
      );
      return;
    }

    const payload = {
      longueur_murs: longueur,
      hauteur_sous_plafond: hauteur,
    };
    if (toNumber(form.surface_ouverte) !== null) {
      payload.surface_ouverte = ouverture;
    }
    if (perimetre !== null && perimetre > 0) {
      payload.perimetre = perimetre;
    }
    if (photoUrls.length) {
      payload.photo_urls = photoUrls;
    }

    setLoading(true);
    try {
      await api.post(`/missions/${missionId}/mesures`, payload);
      Alert.alert(
        "Succès",
        `Mesures envoyées. Mission #${missionId} passée en "en_cours".`,
        [{ text: "OK", onPress: () => navigation?.goBack?.() }],
      );
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📏 Saisie des mesures</Text>
      {mission ? (
        <Text style={styles.meta}>
          Mission #{missionId} · Devis #{mission.devis_id} ·{" "}
          {mission.ville || "—"}
        </Text>
      ) : (
        <Text style={styles.meta}>Mission #{missionId}</Text>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Longueur totale des murs (m)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={form.longueur_murs}
          onChangeText={(v) => setForm({ ...form, longueur_murs: v })}
          placeholder="Ex: 24.5"
        />

        <Text style={styles.label}>Hauteur sous plafond (m)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={form.hauteur_sous_plafond}
          onChangeText={(v) => setForm({ ...form, hauteur_sous_plafond: v })}
          placeholder="Ex: 3"
        />

        <Text style={styles.label}>Surface des ouvertures (m²) — optionnel</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={form.surface_ouverte}
          onChangeText={(v) => setForm({ ...form, surface_ouverte: v })}
          placeholder="Fenêtres et portes"
        />

        <Text style={styles.label}>Périmètre (m) — optionnel</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={form.perimetre}
          onChangeText={(v) => setForm({ ...form, perimetre: v })}
          placeholder="Ex: 40"
        />
      </View>

      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Aperçu du calcul</Text>
        <Text style={styles.previewLine}>
          Surface réelle :{" "}
          {surfaceReelle ? `${surfaceReelle.toFixed(2)} m²` : "—"}
        </Text>
        <Text style={styles.previewLine}>
          Panneaux estimés : {nbPanneaux ?? "—"} (base 1,2 m²/panneau)
        </Text>
      </View>

      <Text style={styles.label}>Photos du métré (optionnel)</Text>
      <View style={styles.photoGrid}>
        {photoUrls.map((url, i) => (
          <Image key={i} source={{ uri: url }} style={styles.photo} />
        ))}
      </View>
      <TouchableOpacity
        style={[styles.photoBtn, uploading && styles.disabled]}
        onPress={addPhotos}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.white}>+ Ajouter des photos</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primary, loading && styles.disabled]}
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.white}>Envoyer les mesures</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: "#faf7f2" },
  title: { fontSize: 24, fontWeight: "800", color: "#92400e", marginBottom: 4 },
  meta: { fontSize: 13, color: "#6b7280", marginBottom: 12 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14 },
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
  previewCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e3a8a",
    marginBottom: 6,
  },
  previewLine: { fontSize: 14, color: "#374151", marginBottom: 2 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photo: { width: 84, height: 84, borderRadius: 8, backgroundColor: "#eee" },
  photoBtn: {
    backgroundColor: "#0ea5e9",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  primary: {
    backgroundColor: "#0f766e",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  disabled: { opacity: 0.6 },
  white: { color: "#fff", fontWeight: "700" },
});
