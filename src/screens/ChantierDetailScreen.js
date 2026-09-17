import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import api from "../services/api";

const ETAPES = [
  "Devis reçu",
  "Visite technique",
  "Commande validée",
  "Livraison",
  "Pose en cours",
  "Chantier terminé",
];

export default function ChantierDetailScreen({ route }) {
  const { chantierId } = route.params;
  const [chantier, setChantier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState(null); // 'avant' | 'apres'

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/chantiers/${chantierId}`);
      setChantier(data);
    } catch (e) {
      Alert.alert("Erreur", e.response?.data?.error || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [chantierId]);

  const pickAndUpload = async (type) => {
    // 1. Demander la permission
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission refusée",
        "Autorisez l'accès à la galerie pour ajouter des photos.",
      );
      return;
    }

    // 2. Sélectionner plusieurs images
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.length) return;

    setUploadingType(type);
    try {
      // 3. Uploader chaque image vers /uploads/photo
      const uploadedUrls = [];
      for (const asset of result.assets) {
        const formData = new FormData();
        const name = asset.fileName || `photo_${Date.now()}.jpg`;
        const type_ = asset.mimeType || "image/jpeg";
        formData.append("file", { uri: asset.uri, name, type: type_ });

        const { data } = await api.post("/uploads/photo", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedUrls.push(data.url);
      }

      // 4. Attacher les URLs au chantier
      await api.post(`/chantiers/${chantierId}/photos`, {
        type,
        urls: uploadedUrls,
      });

      Alert.alert("Succès", `${uploadedUrls.length} photo(s) ajoutée(s)`);
      await load();
    } catch (e) {
      const msg = e.response?.data?.error || e.message || "Upload impossible";
      Alert.alert("Erreur", msg);
    } finally {
      setUploadingType(null);
    }
  };

  const avancer = () => {
    const idx = ETAPES.indexOf(chantier?.etape);
    if (idx >= ETAPES.length - 1) {
      Alert.alert("Info", "Chantier déjà à la dernière étape.");
      return;
    }
    const prochaine = ETAPES[idx + 1];
    Alert.alert("Avancer", `Passer à « ${prochaine} » ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Avancer",
        onPress: async () => {
          try {
            await api.put(`/chantiers/${chantierId}/avancer`);
            await load();
          } catch (e) {
            Alert.alert("Erreur", e.response?.data?.error || "Impossible");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b45309" />
      </View>
    );
  }

  if (!chantier) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Chantier introuvable.</Text>
      </View>
    );
  }

  const photosAvant = Array.isArray(chantier.photos_avant)
    ? chantier.photos_avant
    : [];
  const photosApres = Array.isArray(chantier.photos_apres)
    ? chantier.photos_apres
    : [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Chantier #{chantier.id}</Text>
      <Text style={styles.meta}>Devis #{chantier.devis_id}</Text>
      <Text style={styles.meta}>Ville : {chantier.ville || "—"}</Text>
      <Text style={styles.meta}>Adresse : {chantier.adresse || "—"}</Text>
      <Text style={styles.meta}>
        Surface : {chantier.surface ? `${chantier.surface} m²` : "—"}
      </Text>
      <Text style={styles.etape}>Étape : {chantier.etape || "—"}</Text>

      <TouchableOpacity style={styles.primary} onPress={avancer}>
        <Text style={styles.white}>Avancer d'une étape</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>
        Photos avant ({photosAvant.length})
      </Text>
      <View style={styles.photoGrid}>
        {photosAvant.map((url, i) => (
          <Image key={i} source={{ uri: url }} style={styles.photo} />
        ))}
      </View>
      <TouchableOpacity
        style={[styles.uploadBtn, uploadingType === "avant" && styles.disabled]}
        onPress={() => pickAndUpload("avant")}
        disabled={uploadingType === "avant"}
      >
        {uploadingType === "avant" ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.white}>+ Ajouter photos avant</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>
        Photos après ({photosApres.length})
      </Text>
      <View style={styles.photoGrid}>
        {photosApres.map((url, i) => (
          <Image key={i} source={{ uri: url }} style={styles.photo} />
        ))}
      </View>
      <TouchableOpacity
        style={[styles.uploadBtn, uploadingType === "apres" && styles.disabled]}
        onPress={() => pickAndUpload("apres")}
        disabled={uploadingType === "apres"}
      >
        {uploadingType === "apres" ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.white}>+ Ajouter photos après</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Historique</Text>
      {(Array.isArray(chantier.historique) ? chantier.historique : []).map(
        (h, i) => (
          <View key={i} style={styles.histItem}>
            <Text style={styles.histAction}>{h.action}</Text>
            <Text style={styles.histDate}>
              {h.date ? new Date(h.date).toLocaleString() : ""}
            </Text>
          </View>
        ),
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: "#faf7f2" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#92400e", marginBottom: 8 },
  meta: { color: "#6b7280", marginBottom: 2 },
  etape: {
    fontWeight: "700",
    color: "#b45309",
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#78350f",
    marginTop: 16,
    marginBottom: 8,
  },
  primary: {
    backgroundColor: "#0f766e",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  uploadBtn: {
    backgroundColor: "#0ea5e9",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  disabled: { opacity: 0.6 },
  white: { color: "#fff", fontWeight: "700" },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photo: { width: 100, height: 100, borderRadius: 8, backgroundColor: "#eee" },
  histItem: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  histAction: { fontSize: 13, fontWeight: "600", color: "#374151" },
  histDate: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  empty: { color: "#6b7280" },
});
