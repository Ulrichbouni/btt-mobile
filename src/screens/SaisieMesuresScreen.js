import React, { useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import {
  AppHeader,
  Button,
  Card,
  Field,
  Screen,
  SectionHeader,
  StatusPill,
} from "../components";
import { useI18n } from "../i18n";
import api from "../services/api";
import { toNumber } from "../utils/numbers";
import { COLORS, FONTS, RADII, SPACING } from "../theme/theme";

export default function SaisieMesuresScreen({ route, navigation }) {
  const { t } = useI18n();
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
      Alert.alert(t("common.error"), t("mesures.permission"));
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
      Alert.alert(
        t("common.error"),
        e.response?.data?.error || t("mesures.uploadError"),
      );
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!missionId) {
      Alert.alert(t("common.error"), t("mesures.missionUnknown"));
      return;
    }
    if (!longueur || longueur <= 0) {
      Alert.alert(t("common.error"), t("mesures.invalidLength"));
      return;
    }
    if (!hauteur || hauteur <= 0) {
      Alert.alert(t("common.error"), t("mesures.invalidHeight"));
      return;
    }
    if (!surfaceReelle || surfaceReelle <= 0) {
      Alert.alert(t("common.error"), t("mesures.invalidSurface"));
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
        t("mesures.sentTitle"),
        t("mesures.sentMessage", { id: missionId }),
        [{ text: "OK", onPress: () => navigation?.goBack?.() }],
      );
    } catch (e) {
      const details = e.response?.data?.details;
      const msg =
        details?.map((d) => `${d.champ}: ${d.message}`).join("\n") ||
        e.response?.data?.error ||
        t("mesures.sendFailed");
      Alert.alert(t("common.error"), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader
        showBell
        onBell={() => navigation?.navigate("Notifications")}
      />
      <SectionHeader
        icon="resize"
        tone="green"
        title={t("mesures.title")}
        subtitle={
          mission
            ? t("mesures.missionMeta", {
                id: missionId,
                devis: mission.devis_id,
                ville: mission.ville || "—",
              })
            : t("mesures.missionOnly", { id: missionId })
        }
        langBadge
      />

      <Card>
        <Field
          label={t("mesures.wallsLength")}
          icon="resize-outline"
          value={form.longueur_murs}
          onChangeText={(v) => setForm({ ...form, longueur_murs: v })}
          keyboardType="decimal-pad"
          placeholder="24.5"
        />
        <Field
          label={t("mesures.ceiling")}
          icon="swap-vertical-outline"
          value={form.hauteur_sous_plafond}
          onChangeText={(v) => setForm({ ...form, hauteur_sous_plafond: v })}
          keyboardType="decimal-pad"
          placeholder="3"
        />
        <Field
          label={t("mesures.openings")}
          icon="browsers-outline"
          value={form.surface_ouverte}
          onChangeText={(v) => setForm({ ...form, surface_ouverte: v })}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        <Field
          label={t("mesures.perimeter")}
          icon="analytics-outline"
          value={form.perimetre}
          onChangeText={(v) => setForm({ ...form, perimetre: v })}
          keyboardType="decimal-pad"
          placeholder="40"
          style={styles.lastField}
        />
      </Card>

      <View style={styles.preview}>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>
            {t("mesures.surfaceReal")} (m²)
          </Text>
          <Text style={styles.previewValue}>
            {surfaceReelle ? `${surfaceReelle.toFixed(2)} m²` : "0.00 m²"}
          </Text>
        </View>
        <Text style={styles.previewSub}>
          {t("mesures.panels")} : {nbPanneaux ?? "—"} · {t("mesures.panelsBase")}
        </Text>
      </View>

      <Text style={styles.label}>{t("mesures.photos")}</Text>
      {photoUrls.length > 0 ? (
        <View style={styles.photoGrid}>
          {photoUrls.map((url, i) => (
            <Image key={url || i} source={{ uri: url }} style={styles.photo} />
          ))}
        </View>
      ) : null}
      <Button
        label={
          uploading ? t("devis.uploading") : t("mesures.addPhotos")
        }
        icon="camera-outline"
        variant="soft"
        small
        onPress={addPhotos}
        disabled={uploading}
        loading={uploading}
        style={styles.photoBtn}
      />

      <Button
        label={t("mesures.submit")}
        icon="save-outline"
        variant="green"
        onPress={submit}
        loading={loading}
        disabled={loading}
        style={styles.submitBtn}
      />

      <StatusPill
        tone="neutral"
        label={t("mesures.subtitle")}
        small
        style={styles.tag}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  lastField: { marginBottom: 0 },
  preview: {
    backgroundColor: COLORS.greenSoft,
    borderRadius: RADII.lg,
    padding: 16,
    marginTop: 14,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewLabel: {
    color: COLORS.greenDark,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  previewValue: {
    color: COLORS.greenDark,
    fontFamily: FONTS.bold,
    fontSize: 20,
  },
  previewSub: {
    color: COLORS.greenDark,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 6,
  },
  label: {
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    marginTop: 20,
    marginBottom: 10,
  },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  photo: {
    width: 84,
    height: 84,
    borderRadius: RADII.sm,
    backgroundColor: "#EEE7DB",
    marginRight: 8,
    marginBottom: 8,
  },
  photoBtn: { alignSelf: "flex-start" },
  submitBtn: { marginTop: 18 },
  tag: { marginTop: 16, alignSelf: "center" },
});
