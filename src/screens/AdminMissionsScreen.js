import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, Alert } from "react-native";

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
import { COLORS, FONTS, SPACING } from "../theme/theme";

const STATUTS = ["assignee", "en_cours", "terminee"];

const todayISO = () => new Date().toISOString().slice(0, 10);

// Si l'admin saisit "2026-10-15", on envoie la date à midi UTC
// (compromis qui reste le même jour calendaire pour UTC-12 → UTC+12).
const toDateISO = (yyyyMmDd) => `${yyyyMmDd}T12:00:00.000Z`;

export default function AdminMissionsScreen() {
  const { t } = useI18n();
  const [missions, setMissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("tous");

  const [form, setForm] = useState({
    devis_id: "",
    technicien_id: "",
    date_visite: todayISO(),
    statut: "assignee",
  });
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [m, u] = await Promise.all([
        api.get("/missions"),
        api.get("/admin/utilisateurs"),
      ]);
      setMissions(m.data);
      setUsers(u.data.filter((x) => x.role === "technicien"));
    } catch (e) {
      Alert.alert("Erreur", e.response?.data?.error || "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredMissions = useMemo(() => {
    if (filter === "tous") return missions;
    return missions.filter((m) => m.statut === filter);
  }, [missions, filter]);

  const resetForm = () => {
    setForm({
      devis_id: "",
      technicien_id: "",
      date_visite: todayISO(),
      statut: "assignee",
    });
    setEditingId(null);
  };

  const submit = async () => {
    if (!form.technicien_id) {
      Alert.alert("Erreur", "Sélectionnez un technicien");
      return;
    }
    if (!editingId && !form.devis_id) {
      Alert.alert("Erreur", "Renseignez l'ID du devis");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date_visite)) {
      Alert.alert("Erreur", "Date au format AAAA-MM-JJ");
      return;
    }

    const isoDate = toDateISO(form.date_visite);

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/missions/${editingId}`, {
          technicien_id: form.technicien_id,
          date_visite: isoDate,
          statut: form.statut,
        });
        Alert.alert("Succès", "Mission mise à jour");
      } else {
        await api.post("/missions", {
          devis_id: Number(form.devis_id),
          technicien_id: form.technicien_id,
          date_visite: isoDate,
        });
        Alert.alert("Succès", "Mission créée");
      }
      resetForm();
      await load();
    } catch (e) {
      const details = e.response?.data?.details;
      const msg =
        details?.map((d) => `${d.champ}: ${d.message}`).join("\n") ||
        e.response?.data?.error ||
        "Opération impossible";
      Alert.alert("Erreur", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (mission) => {
    setEditingId(mission.id);
    setForm({
      devis_id: String(mission.devis_id || ""),
      technicien_id: mission.technicien_id || "",
      date_visite: mission.date_visite
        ? mission.date_visite.slice(0, 10)
        : todayISO(),
      statut: mission.statut || "assignee",
    });
  };

  const remove = (id) => {
    Alert.alert("Confirmation", "Supprimer cette mission ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/missions/${id}`);
            await load();
          } catch (e) {
            Alert.alert(
              "Erreur",
              e.response?.data?.error || "Suppression impossible",
            );
          }
        },
      },
    ]);
  };

  const validerMesures = (missionId) => {
    Alert.alert(
      "Valider les mesures",
      "Cette action marque la mission comme terminée et valide les mesures terrain. Confirmer ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Valider",
          onPress: async () => {
            try {
              await api.put(`/missions/${missionId}/valider`);
              Alert.alert("Succès", "Mesures validées");
              await load();
            } catch (e) {
              Alert.alert(
                "Erreur",
                e.response?.data?.error || "Validation impossible",
              );
            }
          },
        },
      ],
    );
  };

  const statutLabel = (s) =>
    s === "tous" ? t("common.all") : t(`statuses.${s}`);

  return (
    <Screen scroll contentStyle={styles.content}>
      <AppHeader title={t("admin.missions")} showBell onBell={() => {}} />

      <SectionHeader
        icon="briefcase-outline"
        tone="green"
        title={t("admin.missions")}
        subtitle={t("admin.missionCount", { n: missions.length })}
      />

      {/* --- Formulaire création / édition --- */}
      <Card style={styles.formCard} padding={16}>
        <SectionHeader
          icon="add-circle-outline"
          tone="blue"
          title={editingId ? `Mission #${editingId}` : t("admin.newMission")}
        />

        {!editingId && (
          <Field
            label={t("admin.devisId")}
            placeholder={t("admin.devisIdPlaceholder")}
            icon="document-text-outline"
            keyboardType="numeric"
            value={form.devis_id}
            onChangeText={(v) => setForm((f) => ({ ...f, devis_id: v }))}
          />
        )}

        <Text style={styles.label}>{t("admin.technicien")}</Text>
        {users.length === 0 ? (
          <Text style={styles.helper}>{t("admin.noTechniciens")}</Text>
        ) : (
          <View style={styles.chipRow}>
            {users.map((u) => (
              <FilterPill
                key={u.id}
                label={u.nom}
                active={form.technicien_id === u.id}
                onPress={() => setForm((f) => ({ ...f, technicien_id: u.id }))}
              />
            ))}
          </View>
        )}

        <Field
          label={t("admin.dateVisite")}
          placeholder={t("admin.dateVisitePlaceholder")}
          icon="calendar-outline"
          value={form.date_visite}
          onChangeText={(v) => setForm((f) => ({ ...f, date_visite: v }))}
        />

        {editingId && (
          <>
            <Text style={styles.label}>{t("admin.statut")}</Text>
            <View style={styles.chipRow}>
              {STATUTS.map((s) => (
                <FilterPill
                  key={s}
                  label={t(`statuses.${s}`)}
                  active={form.statut === s}
                  onPress={() => setForm((f) => ({ ...f, statut: s }))}
                />
              ))}
            </View>
          </>
        )}

        <View style={styles.buttonRow}>
          <Button
            label={editingId ? t("admin.save") : t("admin.assign")}
            icon={editingId ? "checkmark-outline" : "add-outline"}
            variant="green"
            onPress={submit}
            loading={submitting}
            disabled={submitting}
            style={styles.flexBtn}
          />
          {editingId && (
            <Button
              label={t("admin.cancel")}
              icon="close-outline"
              variant="outline"
              onPress={resetForm}
              style={styles.flexBtn}
            />
          )}
        </View>
      </Card>

      {/* --- Filtres --- */}
      <View style={styles.filterRow}>
        {["tous", ...STATUTS].map((s) => (
          <FilterPill
            key={s}
            label={statutLabel(s)}
            active={filter === s}
            onPress={() => setFilter(s)}
          />
        ))}
      </View>

      {/* --- Liste --- */}
      {loading ? (
        <EmptyState
          icon="sync-outline"
          title={t("common.loading")}
          message={t("admin.loadingMissions")}
        />
      ) : filteredMissions.length === 0 ? (
        <EmptyState
          icon="briefcase-outline"
          title={t("admin.empty")}
          message={filter === "tous" ? t("admin.noMissions") : t("admin.emptyFilter")}
        />
      ) : (
        filteredMissions.map((m) => (
          <Card key={m.id} style={styles.card} padding={16}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Mission #{m.id}</Text>
              <StatusPill status={m.statut} />
            </View>
            <Text style={styles.meta}>
              {t("admin.client")} : {m.client_nom || t("admin.unknown")}
            </Text>
            <Text style={styles.meta}>
              {t("admin.technicien")} : {m.technicien_nom || t("admin.unknown")}
            </Text>
            {m.date_visite && (
              <Text style={styles.meta}>
                {t("admin.dateVisite")} :{" "}
                {new Date(m.date_visite).toLocaleDateString()}
              </Text>
            )}

            <View style={styles.actionRow}>
              <Button
                label={t("admin.edit")}
                icon="pencil-outline"
                variant="soft"
                small
                onPress={() => startEdit(m)}
              />
              {m.statut !== "terminee" && (
                <Button
                  label={t("admin.validate")}
                  icon="checkmark-circle-outline"
                  variant="green"
                  small
                  onPress={() => validerMesures(m.id)}
                />
              )}
              <Button
                label={t("admin.delete")}
                icon="trash-outline"
                variant="danger"
                small
                onPress={() => remove(m.id)}
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
  formCard: { marginBottom: SPACING.md },
  label: {
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    marginBottom: 8,
    marginTop: 2,
  },
  helper: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  flexBtn: { flex: 1 },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
    marginTop: 2,
  },
  card: { marginBottom: 12 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardTitle: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 16,
    flexShrink: 1,
  },
  meta: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginBottom: 2,
  },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
});
