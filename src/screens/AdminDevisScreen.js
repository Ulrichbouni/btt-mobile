import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View, Alert } from "react-native";

import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  Field,
  FilterPill,
  Screen,
  SectionHeader,
  StatusPill,
} from "../components";
import { useI18n } from "../i18n";
import api from "../services/api";
import { telechargerDevisPDF } from "../services/pdf";
import { COLORS, FONTS, SPACING, RADII } from "../theme/theme";

const STATUTS = ["envoye", "accepte", "paye", "annule"];

const STATUT_LABELS = {
  tous: "admin.statutTous",
  envoye: "admin.statutEnvoye",
  accepte: "admin.statutAccepte",
  paye: "admin.statutPaye",
  annule: "admin.statutAnnule",
};

export default function AdminDevisScreen() {
  const { t } = useI18n();
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("tous");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    remise_pourcentage: "",
    frais_transport: "",
    frais_divers: "",
  });
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/devis/admin/tous");
      setDevis(data);
    } catch (e) {
      Alert.alert("Erreur", e.response?.data?.error || t("admin.chargementImpossible"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "tous") return devis;
    return devis.filter((d) => d.statut === filter);
  }, [devis, filter]);

  const startEdit = (d) => {
    setEditingId(d.id);
    setEditForm({
      remise_pourcentage: String(d.remise_pourcentage || 0),
      frais_transport: String(d.frais_transport || 0),
      frais_divers: String(d.frais_divers || 0),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      remise_pourcentage: "",
      frais_transport: "",
      frais_divers: "",
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/devis/${editingId}`, {
        remise_pourcentage: Number(editForm.remise_pourcentage) || 0,
        frais_transport: Number(editForm.frais_transport) || 0,
        frais_divers: Number(editForm.frais_divers) || 0,
      });
      Alert.alert(t("common.success"), t("admin.misAJour"));
      cancelEdit();
      await load();
    } catch (e) {
      Alert.alert("Erreur", e.response?.data?.error || t("admin.majImpossible"));
    } finally {
      setSaving(false);
    }
  };

  const valider = (id) => {
    Alert.alert(
      t("admin.validerTitre"),
      t("admin.validerMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("admin.validate"),
          onPress: async () => {
            try {
              await api.post(`/devis/${id}/valider`);
              Alert.alert(t("common.success"), t("admin.valideChantier"));
              await load();
            } catch (e) {
              Alert.alert("Erreur", e.response?.data?.error || t("admin.validationImpossible"));
            }
          },
        },
      ],
    );
  };

  const supprimer = (id) => {
    Alert.alert(t("admin.confirmation"), t("admin.supprimerQuestion"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("admin.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/devis/${id}`);
            Alert.alert(t("common.success"), t("admin.supprime"));
            await load();
          } catch (e) {
            Alert.alert("Erreur", e.response?.data?.error || t("admin.suppressionImpossible"));
          }
        },
      },
    ]);
  };

  // Téléchargement du PDF avec le token, puis partage.
  const voirPDF = async (id) => {
    setPdfLoading(id);
    try {
      await telechargerDevisPDF(id);
    } catch (e) {
      Alert.alert(t("common.error"), e.message || t("admin.pdfImpossible"));
    } finally {
      setPdfLoading(null);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader title={t("admin.devis")} showBell onBell={() => {}} />

      <SectionHeader
        icon="document-text-outline"
        tone="blue"
        title={t("admin.devis")}
      />

      <View style={styles.filterRow}>
        {["tous", ...STATUTS].map((s) => (
          <FilterPill
            key={s}
            label={t(STATUT_LABELS[s])}
            active={filter === s}
            onPress={() => setFilter(s)}
          />
        ))}
      </View>

      {editingId !== null ? (
        <Card style={styles.editCard} padding={16}>
          <SectionHeader icon="pencil-outline" tone="green" title={t("admin.ajuster")} />

          <Field
            label={t("admin.remise")}
            value={editForm.remise_pourcentage}
            onChangeText={(v) => setEditForm((f) => ({ ...f, remise_pourcentage: v }))}
            keyboardType="numeric"
          />
          <Field
            label={t("admin.fraisTransport")}
            value={editForm.frais_transport}
            onChangeText={(v) => setEditForm((f) => ({ ...f, frais_transport: v }))}
            keyboardType="numeric"
          />
          <Field
            label={t("admin.fraisDivers")}
            value={editForm.frais_divers}
            onChangeText={(v) => setEditForm((f) => ({ ...f, frais_divers: v }))}
            keyboardType="numeric"
          />

          <View style={styles.buttonRow}>
            <Button
              label={t("common.save")}
              icon="checkmark-outline"
              variant="green"
              onPress={saveEdit}
              loading={saving}
              disabled={saving}
              style={styles.saveBtn}
            />
            <Button
              label={t("common.cancel")}
              icon="close-outline"
              variant="outline"
              onPress={cancelEdit}
              style={styles.cancelBtn}
            />
          </View>
        </Card>
      ) : null}

      {loading ? (
        <EmptyState
          icon="sync-outline"
          title={t("common.loading")}
          message={t("admin.loadingDevis")}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title={t("admin.empty")}
          message={t("admin.noDevis")}
        />
      ) : (
        filtered.map((d) => (
          <Card key={d.id} style={styles.card} padding={16}>
            <View style={styles.header}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>Devis #{d.id}</Text>
                <StatusPill status={d.statut || "en_stock"} small />
              </View>
              <Text style={styles.meta}>{d.client_nom || t("common.unknown")}</Text>
            </View>

            <Text style={styles.meta}>{t("admin.ville")} : {d.ville || t("common.unknown")}</Text>
            <Text style={styles.meta}>{t("admin.surface")} : {d.surface ? `${d.surface} m²` : "—"}</Text>
            <Text style={styles.meta}>{t("admin.total")} : {d.total_final != null ? Number(d.total_final).toLocaleString() : t("admin.aDefinir")} FCFA</Text>

            <View style={styles.actions}>
              <Button
                icon="pencil-outline"
                label={t("admin.edit")}
                                variant="soft"
                onPress={() => startEdit(d)}
              />
              {d.statut === "envoye" && d.total_final != null && (
                <Button
                  icon="checkmark-circle-outline"
                  label={t("admin.validate")}
                                    variant="green"
                  onPress={() => valider(d.id)}
                />
              )}
              <Button
                icon="document-text-outline"
                label={t("admin.pdf")}
                                variant="primary"
                onPress={() => voirPDF(d.id)}
                disabled={pdfLoading === d.id}
              />
              <Button
                icon="trash-outline"
                label={t("admin.delete")}
                                variant="danger"
                onPress={() => supprimer(d.id)}
              />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  editCard: { backgroundColor: COLORS.primarySoft, borderRadius: RADII.lg },
  buttonRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  saveBtn: { flex: 1, marginRight: SPACING.md },
  cancelBtn: { flex: 1 },
  card: {
    borderRadius: RADII.lg,
    padding: 16,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  nameRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  name: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 15,
    flex: 1,
  },
  meta: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
    flex: 1,
    justifyContent: "flex-end",
  },
});
