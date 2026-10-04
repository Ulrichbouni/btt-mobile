import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  Field,
  Screen,
  SectionHeader,
  StatusPill,
} from "../components";
import { useI18n } from "../i18n";
import api from "../services/api";
import { COLORS, FONTS, RADII, SPACING, formatXAF } from "../theme/theme";

const METHODS = [
  { key: "mtn", icon: "phone-portrait-outline", tone: "#F7D469", info: "mtnInfo" },
  { key: "orange", icon: "ellipse", tone: "#F79A3C", info: "orangeInfo" },
  { key: "card", icon: "card-outline", tone: COLORS.muted, info: null },
];

export default function PaiementScreen({ route, navigation }) {
  const { t } = useI18n();
  const [montant, setMontant] = useState("");
  const [phone, setPhone] = useState("");
  const [methode, setMethode] = useState("mtn");
  const [devisId, setDevisId] = useState(
    route?.params?.devisId ? String(route.params.devisId) : "",
  );
  const [devis, setDevis] = useState(null);
  const [devisError, setDevisError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historique, setHistorique] = useState([]);
  const [historiqueError, setHistoriqueError] = useState(null);

  const fetchHistorique = async () => {
    setHistoriqueError(null);
    try {
      const { data } = await api.get("/paiements/historique");
      setHistorique(Array.isArray(data) ? data : []);
    } catch (e) {
      setHistoriqueError(e.response?.data?.error || t("paiement.historyError"));
    }
  };

  useEffect(() => {
    fetchHistorique();
  }, []);

  useEffect(() => {
    if (!devisId) {
      setDevis(null);
      setDevisError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/devis/${devisId}`);
        if (cancelled) return;
        setDevis(data);
        setDevisError(null);
        if (data.total_final !== null && data.total_final !== undefined) {
          setMontant(String(data.total_final));
        } else {
          setMontant("");
        }
      } catch (e) {
        if (cancelled) return;
        setDevis(null);
        setDevisError(e.response?.data?.error || t("paiement.devisNotFound"));
        setMontant("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [devisId]);

  const montantLocked = !!devisId && !!devis;
  const devisNonValide =
    !!devisId &&
    devis &&
    (devis.total_final === null || devis.total_final === undefined);

  const choisirMethode = (key) => {
    if (key === "card") {
      Alert.alert(t("paiement.method"), t("paiement.cardUnavailable"));
      return;
    }
    setMethode(key);
  };

  const payer = async () => {
    if (!montant || montant <= 0)
      return Alert.alert(t("common.error"), t("paiement.invalidAmount"));
    if (!phone || phone.length < 8)
      return Alert.alert(t("common.error"), t("paiement.invalidPhone"));
    if (devisNonValide)
      return Alert.alert(t("common.error"), t("paiement.devisNotValidated"));
    setLoading(true);
    try {
      const { data } = await api.post("/paiements/initier", {
        montant: parseFloat(montant),
        methode: "mobile_money",
        telephone: phone,
        devis_id: devisId ? parseInt(devisId) : null,
      });
      Alert.alert(
        t("paiement.initiated"),
        t("paiement.initiatedMessage", { ref: data.reference }),
      );
      fetchHistorique();
    } catch (err) {
      Alert.alert(
        t("common.error"),
        err.response?.data?.error || t("paiement.payFailed"),
      );
    }
    setLoading(false);
  };

  const methodInfo = METHODS.find((m) => m.key === methode);

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader
        showBell
        onBell={() => navigation?.navigate("Notifications")}
      />
      <SectionHeader
        icon="card"
        tone="beige"
        title={t("paiement.title")}
        subtitle={t("paiement.subtitle")}
      />

      <Card>
        <Field
          label={t("paiement.devisId")}
          icon="document-text-outline"
          value={devisId}
          onChangeText={setDevisId}
          keyboardType="numeric"
        />
        {devisError ? <Text style={styles.error}>⚠️ {devisError}</Text> : null}
        {devisNonValide ? (
          <Text style={styles.warning}>⏳ {t("paiement.devisNotValidated")}</Text>
        ) : null}

        <Field
          label={t("paiement.amount")}
          icon="cash-outline"
          value={montant}
          onChangeText={montantLocked ? undefined : setMontant}
          editable={!montantLocked}
          keyboardType="numeric"
        />
        {montantLocked ? (
          <Text style={styles.hint}>
            {t("paiement.amountLocked", { id: devisId })}
          </Text>
        ) : null}

        <Field
          label={t("paiement.phone")}
          icon="call-outline"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.lastField}
        />
      </Card>

      <Text style={styles.sectionLabel}>{t("paiement.method")}</Text>
      <View style={styles.methods}>
        {METHODS.map((m) => {
          const active = m.key === methode;
          return (
            <TouchableOpacity
              key={m.key}
              style={[styles.method, active && styles.methodActive]}
              onPress={() => choisirMethode(m.key)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={m.icon}
                size={22}
                color={active ? COLORS.primaryDark : COLORS.muted}
              />
              <Text
                style={[styles.methodLabel, active && styles.methodLabelActive]}
                numberOfLines={1}
              >
                {t(`paiement.${m.key}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {methodInfo?.info ? (
        <View style={styles.info}>
          <Ionicons name="information-circle-outline" size={18} color="#9A5A24" />
          <Text style={styles.infoText}>{t(`paiement.${methodInfo.info}`)}</Text>
        </View>
      ) : null}

      <Button
        label={t("paiement.cta")}
        icon="lock-closed-outline"
        onPress={payer}
        loading={loading}
        disabled={loading}
        style={styles.cta}
      />

      <Text style={styles.sectionLabel}>{t("paiement.history")}</Text>
      {historiqueError ? (
        <Text style={styles.error}>⚠️ {historiqueError}</Text>
      ) : null}
      {!historiqueError && historique.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title={t("paiement.history")}
          message={t("paiement.emptyHistory")}
        />
      ) : (
        historique.map((p) => (
          <Card key={p.id} style={styles.historyCard} padding={14}>
            <View style={styles.historyRow}>
              <View style={styles.historyText}>
                <Text style={styles.historyAmount}>
                  {formatXAF(p.montant)}
                </Text>
                <Text style={styles.historyRef}>
                  {t("paiement.ref", { ref: p.reference })}
                </Text>
              </View>
              <StatusPill status={p.statut} small />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  lastField: { marginBottom: 0 },
  error: {
    color: COLORS.red,
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginBottom: 12,
  },
  warning: {
    color: "#9A5A24",
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginBottom: 12,
  },
  hint: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 14,
  },
  sectionLabel: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 17,
    marginTop: 20,
    marginBottom: 12,
  },
  methods: { flexDirection: "row" },
  method: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 16,
    marginRight: 8,
  },
  methodActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  methodLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    marginTop: 8,
  },
  methodLabelActive: { color: COLORS.primaryDark },
  info: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.yellowSoft,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: "#F0DFAE",
    padding: 14,
    marginTop: 14,
  },
  infoText: {
    flex: 1,
    color: "#8A5A24",
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 20,
    marginLeft: 10,
  },
  cta: { marginTop: 20 },
  historyCard: { marginBottom: 10 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyText: { flex: 1, marginRight: 10 },
  historyAmount: { color: COLORS.ink, fontFamily: FONTS.bold, fontSize: 16 },
  historyRef: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 2,
  },
});
