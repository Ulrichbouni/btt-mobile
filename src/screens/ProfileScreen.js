import React, { useState, useEffect } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  Avatar,
  Button,
  Card,
  Field,
  LangBadge,
  Screen,
  SectionHeader,
  StatusPill,
} from "../components";
import { useI18n } from "../i18n";
import api from "../services/api";
import {
  clearSession,
  updateSessionUser,
  updateSessionToken,
} from "../services/auth";
import { COLORS, FONTS, SPACING } from "../theme/theme";

export default function ProfileScreen({
  user,
  onLogout,
  onUserUpdated,
  navigation,
}) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    mot_de_passe: "",
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(user?.role || "");

  // Recharge le profil en base (rôle inclus) et répercute la session :
  // une promotion client -> technicien devient visible sans reconnexion.
  useEffect(() => {
    let cancelled = false;

    api
      .get("/auth/me")
      .then(async (res) => {
        if (cancelled) return;
        const fresh = res.data || {};
        setForm({
          nom: fresh.nom || "",
          email: fresh.email || "",
          telephone: fresh.telephone || "",
          mot_de_passe: "",
        });
        if (fresh.role) setRole(fresh.role);

        const merged = { ...(user || {}), ...fresh };
        await updateSessionUser(merged);
        if (onUserUpdated) onUserUpdated(merged);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const body = {};
      if (form.nom) body.nom = form.nom;
      if (form.email) body.email = form.email;
      if (form.telephone) body.telephone = form.telephone;
      if (form.mot_de_passe) body.mot_de_passe = form.mot_de_passe;

      const res = await api.put("/auth/me", body);
      const updated = res.data?.user || res.data;
      // Après un changement de mot de passe, l'ancien JWT est révoqué :
      // le backend renvoie un nouveau token pour l'appareil courant.
      const newToken = res.data?.token;
      if (typeof newToken === "string" && newToken.length > 0) {
        await updateSessionToken(newToken);
      }
      if (updated) {
        const merged = { ...(user || {}), ...updated };
        if (merged.role) setRole(merged.role);
        await updateSessionUser(merged);
        if (onUserUpdated) onUserUpdated(merged);
      }
      Alert.alert(t("common.success"), t("profile.updated"));
      setEditing(false);
    } catch (err) {
      Alert.alert(
        t("common.error"),
        err.response?.data?.error || t("profile.updateError"),
      );
    }
    setLoading(false);
  };

  const logout = async () => {
    await clearSession();
    onLogout();
  };

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader
        showBell
        onBell={() => navigation?.navigate("Notifications")}
        name={user?.nom}
      />
      <SectionHeader
        icon="person"
        tone="beige"
        title={t("profile.title")}
        subtitle={t("profile.subtitle")}
      />

      <Card style={styles.identity}>
        <Avatar name={form.nom || user?.nom} size={64} />
        <View style={styles.identityText}>
          <Text style={styles.identityName} numberOfLines={1}>
            {form.nom || user?.nom || "—"}
          </Text>
          <Text style={styles.identityEmail} numberOfLines={1}>
            {form.email || user?.email || "—"}
          </Text>
        </View>
        <StatusPill
          tone="neutral"
          label={t(`roles.${role || "client"}`)}
          small
        />
      </Card>

      <Card>
        <Field
          label={t("profile.name")}
          icon="person-outline"
          value={form.nom}
          onChangeText={(v) => setForm({ ...form, nom: v })}
          editable={editing}
          autoCapitalize="words"
        />
        <Field
          label={t("profile.email")}
          icon="mail-outline"
          value={form.email}
          onChangeText={(v) => setForm({ ...form, email: v })}
          editable={editing}
          keyboardType="email-address"
        />
        <Field
          label={t("profile.phone")}
          icon="call-outline"
          value={form.telephone}
          onChangeText={(v) => setForm({ ...form, telephone: v })}
          editable={editing}
          keyboardType="phone-pad"
          style={editing ? undefined : styles.lastField}
        />
        {editing && (
          <Field
            label={t("profile.newPassword")}
            icon="lock-closed-outline"
            value={form.mot_de_passe}
            onChangeText={(v) => setForm({ ...form, mot_de_passe: v })}
            password
            style={styles.lastField}
          />
        )}
      </Card>

      {!editing ? (
        <Button
          label={t("profile.edit")}
          icon="create-outline"
          variant="soft"
          onPress={() => setEditing(true)}
          style={styles.action}
        />
      ) : (
        <View style={styles.row}>
          <Button
            label={loading ? t("profile.saving") : t("profile.save")}
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={styles.rowItem}
          />
          <Button
            label={t("common.cancel")}
            variant="outline"
            onPress={() => setEditing(false)}
            disabled={loading}
            style={styles.rowItem}
          />
        </View>
      )}

      <Card style={styles.rowCard} onPress={() => navigation?.navigate("OTPSetup")}>
        <View style={styles.rowLeft}>
          <Ionicons name="shield-checkmark-outline" size={19} color={COLORS.primary} />
          <View style={styles.rowTextBox}>
            <Text style={styles.rowLabel}>{t("profile.security")}</Text>
            <Text style={styles.rowHint}>{t("profile.securityHint")}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
      </Card>

      <Card style={styles.rowCard}>
        <View style={styles.rowLeft}>
          <Ionicons name="globe-outline" size={19} color={COLORS.primary} />
          <View style={styles.rowTextBox}>
            <Text style={styles.rowLabel}>{t("profile.language")}</Text>
            <Text style={styles.rowHint}>Français / English</Text>
          </View>
        </View>
        <LangBadge />
      </Card>

      <Button
        label={t("profile.logout")}
        icon="log-out-outline"
        variant="danger"
        onPress={logout}
        style={styles.logout}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  identity: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  identityText: { flex: 1, marginLeft: 14, marginRight: 10 },
  identityName: { color: COLORS.ink, fontFamily: FONTS.bold, fontSize: 18 },
  identityEmail: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginTop: 2,
  },
  lastField: { marginBottom: 0 },
  action: { marginTop: 14 },
  row: { flexDirection: "row", marginTop: 14 },
  rowItem: { flex: 1, marginHorizontal: 4 },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingVertical: 16,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  rowTextBox: { marginLeft: 12, flex: 1 },
  rowLabel: { color: COLORS.ink, fontFamily: FONTS.semiBold, fontSize: 15 },
  rowHint: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 1,
  },
  logout: { marginTop: 20 },
});
