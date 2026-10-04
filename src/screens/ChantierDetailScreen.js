import React, { useEffect, useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  Screen,
  SectionHeader,
  StatusPill,
  Timeline,
} from "../components";
import { useI18n } from "../i18n";
import api from "../services/api";
import { ETAPES, buildTimelineSteps, prochaineEtape } from "../constants/etapes";
import { COLORS, FONTS, RADII, SPACING } from "../theme/theme";

export default function ChantierDetailScreen({ route, user, navigation }) {
  const { t } = useI18n();
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
      Alert.alert(
        t("common.error"),
        e.response?.data?.error || t("chantierDetail.loadError"),
      );
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
      Alert.alert(t("common.error"), t("chantierDetail.permission"));
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

      Alert.alert(
        t("common.success"),
        t("chantierDetail.photosAdded", { n: uploadedUrls.length }),
      );
      await load();
    } catch (e) {
      Alert.alert(
        t("common.error"),
        e.response?.data?.error || e.message || t("chantierDetail.uploadError"),
      );
    } finally {
      setUploadingType(null);
    }
  };

  const avancer = () => {
    const prochaine = prochaineEtape(chantier?.etape);
    if (!prochaine) {
      Alert.alert(t("common.success"), t("chantierDetail.lastStep"));
      return;
    }
    Alert.alert(
      t("chantierDetail.advanceTitle"),
      t("chantierDetail.advanceConfirm", { etape: prochaine }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("chantierDetail.advanceCta"),
          onPress: async () => {
            try {
              await api.put(`/chantiers/${chantierId}/avancer`);
              await load();
            } catch (e) {
              Alert.alert(
                t("common.error"),
                e.response?.data?.error || t("chantierDetail.advanceError"),
              );
            }
          },
        },
      ],
    );
  };

  if (loading) return <Screen scroll={false} />;

  if (!chantier) {
    return (
      <Screen>
        <AppHeader showBell={false} />
        <EmptyState
          icon="construct-outline"
          title={t("chantierDetail.notFound")}
          message=""
        />
      </Screen>
    );
  }

  const photosAvant = Array.isArray(chantier.photos_avant)
    ? chantier.photos_avant
    : [];
  const photosApres = Array.isArray(chantier.photos_apres)
    ? chantier.photos_apres
    : [];

  // Mêmes règles que le backend : seul l'admin ou le technicien assigné
  // peut avancer le chantier et ajouter des photos.
  const canManage =
    user?.role === "admin" ||
    (user?.role === "technicien" && chantier.technicien_id === user?.id);

  const steps = buildTimelineSteps({
    etape: chantier.etape,
    names: t("chantiers.stepNames"),
    descs: t("chantiers.stepDescs"),
  });
  const etapeIndex = ETAPES.indexOf(chantier.etape);

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader
        showBell
        onBell={() => navigation?.navigate("Notifications")}
        name={user?.nom}
      />
      <SectionHeader
        icon="construct"
        tone="yellow"
        title={t("chantierDetail.title", { id: chantier.id })}
        subtitle={t("missions.devisLabel", { id: chantier.devis_id })}
      />

      <Card>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={15} color={COLORS.muted} />
          <Text style={styles.infoText}>
            {chantier.ville || "—"} · {chantier.adresse || "—"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="resize-outline" size={15} color={COLORS.muted} />
          <Text style={styles.infoText}>
            {chantier.surface ? `${chantier.surface} m²` : "—"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="git-branch-outline" size={15} color={COLORS.muted} />
          <Text style={styles.infoText}>
            {t("chantiers.stepOf", {
              n: etapeIndex >= 0 ? etapeIndex + 1 : 0,
              total: ETAPES.length,
            })}
          </Text>
          <StatusPill
            status={chantier.etape ? undefined : "en_cours"}
            label={chantier.etape || "—"}
            tone="neutral"
            small
            style={styles.etapePill}
          />
        </View>

        {canManage ? (
          <Button
            label={t("chantierDetail.advance")}
            icon="arrow-forward"
            onPress={avancer}
            style={styles.advanceBtn}
          />
        ) : (
          <Text style={styles.readonly}>{t("chantierDetail.readonly")}</Text>
        )}
      </Card>

      <PhotoSection
        title={t("chantierDetail.photosAvant", { n: photosAvant.length })}
        photos={photosAvant}
        emptyLabel={t("chantierDetail.noPhotos")}
        actionLabel={t("chantierDetail.addAvant")}
        uploading={uploadingType === "avant"}
        onAdd={() => pickAndUpload("avant")}
        canManage={canManage}
      />

      <PhotoSection
        title={t("chantierDetail.photosApres", { n: photosApres.length })}
        photos={photosApres}
        emptyLabel={t("chantierDetail.noPhotos")}
        actionLabel={t("chantierDetail.addApres")}
        uploading={uploadingType === "apres"}
        onAdd={() => pickAndUpload("apres")}
        canManage={canManage}
      />

      <Text style={styles.sectionTitle}>{t("chantiers.steps")}</Text>
      <Timeline steps={steps} />

      <Text style={styles.sectionTitle}>{t("chantierDetail.history")}</Text>
      {(Array.isArray(chantier.historique) ? chantier.historique : []).map(
        (h, i) => (
          <Card key={`${h.action}-${i}`} style={styles.historyCard} padding={14}>
            <Text style={styles.historyAction}>{h.action}</Text>
            <Text style={styles.historyDate}>
              {h.date ? new Date(h.date).toLocaleString() : ""}
            </Text>
          </Card>
        ),
      )}
    </Screen>
  );
}

function PhotoSection({
  title,
  photos,
  emptyLabel,
  actionLabel,
  uploading,
  onAdd,
  canManage,
}) {
  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      {photos.length === 0 ? (
        <Text style={styles.emptyPhotos}>{emptyLabel}</Text>
      ) : (
        <View style={styles.photoGrid}>
          {photos.map((url, i) => (
            <Image
              key={url || i}
              source={{ uri: url }}
              style={styles.photo}
            />
          ))}
        </View>
      )}
      {canManage ? (
        <Button
          label={uploading ? "" : actionLabel}
          icon="camera-outline"
          variant="soft"
          small
          onPress={onAdd}
          loading={uploading}
          disabled={uploading}
          style={styles.uploadBtn}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  infoText: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginLeft: 8,
    flexShrink: 1,
  },
  etapePill: { marginLeft: 8 },
  advanceBtn: { marginTop: 10 },
  readonly: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 18,
    backgroundColor: "#F5F1E8",
    borderRadius: RADII.sm,
    padding: 12,
    marginTop: 8,
  },
  sectionTitle: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 17,
    marginTop: 22,
    marginBottom: 12,
  },
  emptyPhotos: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginBottom: 10,
  },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  photo: {
    width: 96,
    height: 96,
    borderRadius: RADII.sm,
    backgroundColor: "#EEE7DB",
    marginRight: 8,
    marginBottom: 8,
  },
  uploadBtn: { alignSelf: "flex-start" },
  historyCard: { marginBottom: 8 },
  historyAction: { color: COLORS.ink, fontFamily: FONTS.medium, fontSize: 13 },
  historyDate: {
    color: COLORS.mutedLight,
    fontFamily: FONTS.regular,
    fontSize: 11,
    marginTop: 3,
  },
});
