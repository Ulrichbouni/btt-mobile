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
import { COLORS, FONTS, SPACING, RADII } from "../theme/theme";

const ROLES = ["client", "technicien", "admin"];

export default function AdminUsersScreen({ currentUser }) {
  const { t } = useI18n();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("tous");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    nom: "",
    email: "",
    telephone: "",
  });
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/utilisateurs");
      setUsers(data);
    } catch (error) {
      Alert.alert(
        "Erreur",
        error.response?.data?.error || "Impossible de charger les utilisateurs",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (filter === "tous") return users;
    return users.filter((u) => u.role === filter);
  }, [users, filter]);

  const updateRole = async (userId, role) => {
    try {
      await api.put(`/admin/utilisateurs/${userId}/role`, { role });
      Alert.alert("Succès", `Rôle mis à jour : ${role}`);
      loadUsers();
    } catch (error) {
      Alert.alert(
        "Erreur",
        error.response?.data?.error || "Impossible de modifier le rôle",
      );
    }
  };

  const deleteUser = (userId) => {
    if (currentUser?.id === userId) {
      Alert.alert(
        "Impossible",
        "Vous ne pouvez pas supprimer votre propre compte.",
      );
      return;
    }
    Alert.alert("Confirmation", "Supprimer cet utilisateur ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/admin/utilisateurs/${userId}`);
            Alert.alert("Succès", "Utilisateur supprimé");
            loadUsers();
          } catch (error) {
            Alert.alert(
              "Erreur",
              error.response?.data?.error || "Suppression impossible",
            );
          }
        },
      },
    ]);
  };

  const startEdit = (user) => {
    setEditingUser(user.id);
    setEditForm({
      nom: user.nom || "",
      email: user.email || "",
      telephone: user.telephone || "",
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({ nom: "", email: "", telephone: "" });
  };

  const saveEdit = async () => {
    if (!editForm.nom.trim() || !editForm.email.trim()) {
      Alert.alert("Erreur", "Nom et email sont requis.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/admin/utilisateurs/${editingUser}`, {
        nom: editForm.nom.trim(),
        email: editForm.email.trim(),
        telephone: editForm.telephone.trim() || undefined,
      });
      Alert.alert("Succès", "Utilisateur mis à jour");
      cancelEdit();
      loadUsers();
    } catch (error) {
      Alert.alert(
        "Erreur",
        error.response?.data?.error || "Mise à jour impossible",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader title={t("admin.users")} showBell onBell={() => {}} />

      <SectionHeader
        icon="people-outline"
        tone="blue"
        title={t("admin.users")}
        subtitle={t("admin.userCount", { n: users.length })}
      />

      <View style={styles.filterRow}>
        <FilterPill
          label={t("common.all")}
          active={filter === "tous"}
          onPress={() => setFilter("tous")}
        />
        {ROLES.map((r) => (
          <FilterPill
            key={r}
            label={t(`roles.${r}`)}
            active={filter === r}
            onPress={() => setFilter(r)}
          />
        ))}
      </View>

      {editingUser !== null ? (
        <Card style={styles.editCard} padding={16}>
          <SectionHeader icon="pencil-outline" tone="green" title={t("admin.editUser")} />

          <Field
            label={t("admin.nom")}
            placeholder={t("admin.nomPlaceholder")}
            value={editForm.nom}
            onChangeText={(v) => setEditForm((f) => ({ ...f, nom: v }))}
            autoCapitalize="words"
          />
          <Field
            label={t("admin.email")}
            placeholder={t("admin.emailPlaceholder")}
            value={editForm.email}
            onChangeText={(v) => setEditForm((f) => ({ ...f, email: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label={t("admin.telephone")}
            placeholder={t("admin.telephonePlaceholder")}
            value={editForm.telephone}
            onChangeText={(v) => setEditForm((f) => ({ ...f, telephone: v }))}
            keyboardType="phone-pad"
          />

          <View style={styles.buttonRow}>
            <Button
              label={t("admin.save")}
              icon="checkmark-outline"
              variant="green"
              onPress={saveEdit}
              loading={saving}
              disabled={saving}
              style={styles.saveBtn}
            />
            <Button
              label={t("admin.cancel")}
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
          message={t("admin.loadingUsers")}
        />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title={t("admin.empty")}
          message={
            filter === "tous"
              ? t("admin.empty")
              : t("admin.emptyFilter", { filter: t(`roles.${filter}`) })
          }
        />
      ) : (
        filteredUsers.map((user) => (
          <Card key={user.id} style={styles.card} padding={16}>
            <View style={styles.headerRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.nom ? user.nom.charAt(0).toUpperCase() : "?"}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{user.nom || t("admin.unknown")}</Text>
                <Text style={styles.meta}>{user.email}</Text>
                <Text style={styles.meta}>
                  Téléphone : {user.telephone || t("common.unknown")}
                </Text>
              </View>
            </View>
            <View style={styles.footerRow}>
              <StatusPill status={user.role === "admin" ? "admin" : user.role} small />
              <View style={styles.actions}>
                {ROLES.filter((r) => r !== user.role).map((r) => (
                  <Button
                    key={r}
                    icon="swap-outline"
                    label={r}
                    variant="soft"
                    onPress={() => updateRole(user.id, r)}
                  />
                ))}
                <Button
                  icon="pencil-outline"
                  label={t("admin.edit")}
                  variant="soft"
                  onPress={() => startEdit(user)}
                />
                <Button
                  icon="trash-outline"
                  label={t("admin.delete")}
                  variant="danger"
                  onPress={() => deleteUser(user.id)}
                />
              </View>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  info: { flex: 1, marginLeft: SPACING.sm },
  name: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  meta: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
    flex: 1,
    justifyContent: "flex-end",
  },
});
