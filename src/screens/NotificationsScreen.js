import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  Screen,
  SectionHeader,
  StatusPill,
} from "../components";
import { useI18n } from "../i18n";
import api from "../services/api";
import { COLORS, FONTS, SPACING } from "../theme/theme";

export default function NotificationsScreen() {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    try {
      const { data } = await api.get("/notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.error || t("notifications.error"));
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      await load();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/lu`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lu: true } : n)),
      );
    } catch (e) {
      setError(e.response?.data?.error || t("notifications.updateError"));
    }
  };

  const unread = notifications.filter((n) => !n.lu).length;

  return (
    <Screen
      contentStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <AppHeader showBell={false} />
      <SectionHeader
        icon="notifications"
        tone="beige"
        title={t("notifications.title")}
        subtitle={
          unread > 0
            ? t("notifications.subtitle", { n: unread })
            : t("notifications.allRead")
        }
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={styles.loader}
        />
      ) : error ? (
        <>
          <EmptyState
            icon="cloud-offline-outline"
            title={t("common.error")}
            message={error}
          />
          <Button
            label={t("common.retry")}
            variant="outline"
            icon="refresh"
            onPress={load}
          />
        </>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title={t("notifications.title")}
          message={t("notifications.empty")}
        />
      ) : (
        notifications.map((n) => (
          <Card key={n.id} style={[styles.card, !n.lu && styles.cardUnread]}>
            <View style={styles.cardHeader}>
              <Ionicons
                name={n.lu ? "mail-open-outline" : "mail-unread-outline"}
                size={18}
                color={n.lu ? COLORS.muted : COLORS.primary}
              />
              <Text style={styles.cardTitle} numberOfLines={2}>
                {n.titre}
              </Text>
              {!n.lu ? (
                <StatusPill tone="info" label={t("notifications.new")} small />
              ) : null}
            </View>
            {n.corps ? <Text style={styles.cardBody}>{n.corps}</Text> : null}
            <Text style={styles.cardDate}>
              {n.date_envoi ? new Date(n.date_envoi).toLocaleString() : ""}
            </Text>
            {!n.lu ? (
              <Button
                label={t("notifications.markRead")}
                small
                variant="soft"
                icon="checkmark"
                onPress={() => markAsRead(n.id)}
                style={styles.readBtn}
              />
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  loader: { marginTop: 40 },
  card: { marginBottom: 12 },
  cardUnread: { borderWidth: 1, borderColor: COLORS.primarySoft },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  cardTitle: {
    flex: 1,
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    marginLeft: 10,
    marginRight: 8,
    lineHeight: 21,
  },
  cardBody: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  cardDate: {
    color: COLORS.mutedLight,
    fontFamily: FONTS.regular,
    fontSize: 11,
    marginTop: 8,
  },
  readBtn: { marginTop: 12 },
});
