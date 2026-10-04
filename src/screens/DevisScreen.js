import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  Field,
  FilterPill,
  Screen,
  SectionHeader,
  SegmentedTabs,
  StatusPill,
} from "../components";
import { useI18n } from "../i18n";
import api from "../services/api";
import { isValidDate, toNumber } from "../utils/numbers";
import { telechargerDevisPDF } from "../services/pdf";
import { COLORS, FONTS, RADII, SPACING, formatXAF } from "../theme/theme";

export default function DevisScreen({ navigation, route }) {
  const { t } = useI18n();
  const [tab, setTab] = useState("new");
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
      setListError(e.response?.data?.error || t("devis.listError"));
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
    setTab("new");
  }, [route?.params]);

  const addPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("common.error"), t("devis.photos"));
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
      Alert.alert(t("common.error"), t("devis.invalidSurface"));
      return;
    }
    if (ville.length < 2) {
      Alert.alert(t("common.error"), t("devis.invalidCity"));
      return;
    }
    if (adresse.length < 5) {
      Alert.alert(t("common.error"), t("devis.invalidAddress"));
      return;
    }
    if (date && !isValidDate(date)) {
      Alert.alert(t("common.error"), t("devis.invalidDate"));
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
        t("devis.sentTitle"),
        t("devis.sentMessage", { id: data.id }),
      );
      setForm({ surface: "", ville: "", adresse: "", date_souhaitee: "" });
      setPhotos([]);
      await loadMesDevis();
      setTab("mine");
    } catch (e) {
      const details = e.response?.data?.details;
      const msg =
        details?.map((d) => `${d.champ}: ${d.message}`).join("\n") ||
        e.response?.data?.error ||
        t("devis.sendFailed");
      Alert.alert(t("common.error"), msg);
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
      Alert.alert(t("common.error"), e.message || t("devis.pdfError"));
    } finally {
      setPdfLoading(null);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader
        showBell
        onBell={() => navigation?.navigate("Notifications")}
      />
      <SectionHeader
        icon="document-text"
        tone="green"
        title={t("devis.title")}
        subtitle={t("devis.subtitle")}
      />

      <SegmentedTabs
        style={styles.tabs}
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "new", label: t("devis.newTab") },
          { key: "mine", label: t("devis.mineTab") },
        ]}
      />

      {tab === "new" ? (
        <Card>
          {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}

          <Field
            label={t("devis.surface")}
            icon="resize-outline"
            value={form.surface}
            onChangeText={(v) => setForm({ ...form, surface: v })}
            keyboardType="decimal-pad"
            placeholder="96"
          />
          <Field
            label={t("devis.city")}
            icon="business-outline"
            value={form.ville}
            onChangeText={(v) => setForm({ ...form, ville: v })}
            placeholder="Douala"
          />
          <Field
            label={t("devis.address")}
            icon="location-outline"
            value={form.adresse}
            onChangeText={(v) => setForm({ ...form, adresse: v })}
            placeholder="Quartier, rue, repère"
          />
          <Field
            label={t("devis.date")}
            icon="calendar-outline"
            value={form.date_souhaitee}
            onChangeText={(v) => setForm({ ...form, date_souhaitee: v })}
            placeholder="2026-10-15"
          />

          <Text style={styles.label}>{t("devis.product")}</Text>
          {produits.length === 0 ? (
            <Text style={styles.hint}>{t("calculator.noProduct")}</Text>
          ) : (
            <View style={styles.pills}>
              {produits.map((p) => (
                <FilterPill
                  key={p.id}
                  label={`${p.nom}${p.epaisseur ? ` (${p.epaisseur})` : ""}`}
                  active={produitId === p.id}
                  onPress={() => setProduitId(p.id)}
                  style={styles.pill}
                />
              ))}
            </View>
          )}

          <Text style={styles.label}>{t("devis.photos")}</Text>
          {photos.length > 0 ? (
            <View style={styles.photoGrid}>
              {photos.map((asset, i) => (
                <TouchableOpacity
                  key={`${asset.uri}-${i}`}
                  onPress={() => removePhoto(i)}
                  activeOpacity={0.85}
                  style={styles.photoWrap}
                  accessibilityRole="button"
                  accessibilityLabel={t("common.cancel")}
                >
                  <Image source={{ uri: asset.uri }} style={styles.photo} />
                  <View style={styles.photoRemove}>
                    <Ionicons name="close" size={12} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          <Button
            label={uploading ? t("devis.uploading") : t("devis.addPhotos")}
            icon="camera-outline"
            variant="soft"
            small
            onPress={addPhotos}
            disabled={uploading}
            style={styles.photoBtn}
          />

          <Button
            label={t("devis.submit")}
            icon="send-outline"
            onPress={submit}
            loading={loading}
            disabled={loading}
            style={styles.submit}
          />
        </Card>
      ) : (
        <>
          {listError ? <Text style={styles.error}>⚠️ {listError}</Text> : null}

          {!listError && devisList.length === 0 ? (
            <EmptyState
              icon="document-outline"
              title={t("devis.mineTab")}
              message={t("devis.empty")}
            />
          ) : (
            devisList.map((d) => (
              <Card key={d.id} style={styles.devisCard}>
                <View style={styles.devisHeader}>
                  <Text style={styles.devisTitle} numberOfLines={1}>
                    {t("devis.cardTitle", { id: d.id, ville: d.ville || "—" })}
                  </Text>
                  <StatusPill status={d.statut} small />
                </View>
                <Text style={styles.meta}>
                  {d.surface
                    ? `${d.surface} m²`
                    : t("devis.surfaceUnknown")}
                </Text>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t("devis.total")}</Text>
                  <Text style={styles.totalValue}>
                    {d.total_final !== null && d.total_final !== undefined
                      ? formatXAF(d.total_final)
                      : t("devis.pendingValidation")}
                  </Text>
                </View>

                <View style={styles.actions}>
                  {canPay(d) ? (
                    <Button
                      label={t("devis.pay")}
                      icon="card-outline"
                      small
                      onPress={() => payer(d)}
                      style={styles.actionItem}
                    />
                  ) : null}
                  <Button
                    label={
                      pdfLoading === d.id ? t("devis.pdfLoading") : t("devis.pdf")
                    }
                    icon="download-outline"
                    variant="soft"
                    small
                    onPress={() => telechargerPDF(d.id)}
                    loading={pdfLoading === d.id}
                    disabled={pdfLoading === d.id}
                    style={styles.actionItem}
                  />
                </View>
              </Card>
            ))
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  tabs: { marginBottom: 18 },
  error: {
    color: COLORS.red,
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginBottom: 12,
  },
  label: {
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    marginBottom: 10,
    marginTop: 4,
  },
  hint: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginBottom: 10,
  },
  pills: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
  pill: { marginRight: 8, marginBottom: 8 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  photoWrap: { marginRight: 10, marginBottom: 10 },
  photo: { width: 78, height: 78, borderRadius: RADII.sm },
  photoRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
  },
  photoBtn: { alignSelf: "flex-start", marginBottom: 18 },
  submit: { marginTop: 2 },
  devisCard: { marginBottom: 12 },
  devisHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  devisTitle: {
    flex: 1,
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 15,
    marginRight: 10,
  },
  meta: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginTop: 6,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  totalLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
  },
  totalValue: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  actions: { flexDirection: "row", marginTop: 14 },
  actionItem: { flex: 1, marginRight: 8 },
});
