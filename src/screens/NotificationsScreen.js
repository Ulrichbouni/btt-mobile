import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";

import api from "../services/api";

export default function NotificationsScreen() {
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
      setError(
        e.response?.data?.error ||
          e.message ||
          "Erreur de chargement des notifications",
      );
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
      setError(e.response?.data?.error || "Mise à jour impossible");
    }
  };

  const unread = notifications.filter((n) => !n.lu).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b45309" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔔 Notifications</Text>
        {unread > 0 && (
          <Text style={styles.badge}>{unread} non lue(s)</Text>
        )}
      </View>

      {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!error && notifications.length === 0 && (
          <Text style={styles.empty}>Aucune notification</Text>
        )}

        {notifications.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[styles.card, !n.lu && styles.cardUnread]}
            onPress={() => {
              if (!n.lu) markAsRead(n.id);
            }}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{n.titre}</Text>
              {!n.lu && <Text style={styles.unreadTag}>Nouveau</Text>}
            </View>
            <Text style={styles.cardBody}>{n.corps}</Text>
            <Text style={styles.cardDate}>
              {n.date_envoi ? new Date(n.date_envoi).toLocaleString() : ""}
            </Text>
            {!n.lu && (
              <TouchableOpacity
                style={styles.readBtn}
                onPress={() => markAsRead(n.id)}
              >
                <Text style={styles.readBtnText}>Marquer comme lu</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#faf7f2" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#faf7f2",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#92400e" },
  badge: {
    backgroundColor: "#dc2626",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "700",
  },
  error: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  empty: { color: "#6b7280", textAlign: "center", padding: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cardUnread: { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827", flex: 1 },
  unreadTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1d4ed8",
    marginLeft: 8,
  },
  cardBody: { fontSize: 14, color: "#374151", marginTop: 4 },
  cardDate: { fontSize: 11, color: "#9ca3af", marginTop: 6 },
  readBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#b45309",
  },
  readBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
