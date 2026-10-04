import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  Field,
  FilterPill,
  Screen,
  SectionHeader,
} from "../components";
import { useI18n } from "../i18n";
import api from "../services/api";
import { toNumber } from "../utils/numbers";
import { COLORS, FONTS, SPACING, formatXAF } from "../theme/theme";

const TYPES = [
  { value: "residentiel", key: "residential" },
  { value: "commercial", key: "commercial" },
  { value: "industriel", key: "industrial" },
];

// "" => laisser le backend suggérer l'épaisseur selon le type de bâtiment
const EPAISSEURS = ["", "8mm", "10mm", "12mm", "14mm"];

export default function CalculatorScreen({ navigation, route }) {
  const { t } = useI18n();
  const [produits, setProduits] = useState([]);
  const [produitId, setProduitId] = useState(null);
  const [typeBatiment, setTypeBatiment] = useState("residentiel");
  const [form, setForm] = useState({
    longueur: "",
    largeur: "",
    etage: "",
    epaisseur: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get("/products");
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setProduits(list);
        if (list.length) {
          setProduitId((prev) => prev ?? list[0].id);
        }
      } catch (e) {
        if (active) {
          setError(e.response?.data?.error || t("calculator.catalogueUnavailable"));
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Préremplissage possible depuis un autre écran (ex: résultat de mesures).
  // On teste `!= null` et non la véracité : `longueur === 0` est une valeur
  // explicite et doit être acceptée.
  useEffect(() => {
    const params = route?.params || {};
    const hasLongueur = params.longueur !== undefined && params.longueur !== null;
    const hasLargeur = params.largeur !== undefined && params.largeur !== null;
    const hasProduit = params.produit_id !== undefined && params.produit_id !== null;

    if (!hasLongueur && !hasLargeur && !hasProduit) return;

    setForm((prev) => ({
      ...prev,
      longueur: hasLongueur ? String(params.longueur) : prev.longueur,
      largeur: hasLargeur ? String(params.largeur) : prev.largeur,
    }));
    if (hasProduit) setProduitId(Number(params.produit_id));
  }, [route?.params]);

  const estimer = async () => {
    setError(null);
    const longueur = toNumber(form.longueur);
    const largeur = toNumber(form.largeur);
    const etage = toNumber(form.etage);

    if (!longueur || longueur <= 0 || !largeur || largeur <= 0) {
      Alert.alert(t("common.error"), t("calculator.positiveDims"));
      return;
    }
    if (!produitId) {
      Alert.alert(t("common.error"), t("calculator.selectProduct"));
      return;
    }
    if (etage !== null && (etage < 0 || !Number.isInteger(etage))) {
      Alert.alert(t("common.error"), t("calculator.floorInteger"));
      return;
    }

    const payload = {
      longueur,
      largeur,
      type_batiment: typeBatiment,
      produit_id: Number(produitId),
    };
    if (etage !== null) payload.etage = etage;
    if (form.epaisseur) payload.epaisseur = form.epaisseur;

    setLoading(true);
    try {
      const { data } = await api.post("/calculator/estimer", payload);
      setResult(data);
    } catch (e) {
      const details = e.response?.data?.details;
      const msg =
        details?.map((d) => `${d.champ}: ${d.message}`).join("\n") ||
        e.response?.data?.error ||
        t("calculator.estimateFailed");
      Alert.alert(t("common.error"), msg);
    } finally {
      setLoading(false);
    }
  };

  const preparerDevis = () => {
    if (!result) return;
    navigation?.navigate("Devis", {
      surface: result.surface,
      produit_id: produitId,
    });
  };

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader
        showBell
        onBell={() => navigation?.navigate("Notifications")}
      />
      <SectionHeader
        icon="calculator"
        tone="beige"
        title={t("calculator.title")}
        subtitle={t("calculator.subtitle")}
      />

      {error ? (
        <EmptyState
          icon="cloud-offline-outline"
          title={t("common.error")}
          message={error}
        />
      ) : null}

      <Card style={styles.card}>
        <Text style={styles.label}>{t("calculator.product")}</Text>
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

        <View style={styles.dimsRow}>
          <Field
            label={t("calculator.length")}
            value={form.longueur}
            onChangeText={(v) => setForm({ ...form, longueur: v })}
            keyboardType="decimal-pad"
            placeholder="12"
            style={styles.dim}
          />
          <Field
            label={t("calculator.width")}
            value={form.largeur}
            onChangeText={(v) => setForm({ ...form, largeur: v })}
            keyboardType="decimal-pad"
            placeholder="8"
            style={styles.dim}
          />
        </View>

        <Text style={styles.label}>{t("calculator.buildingType")}</Text>
        <View style={styles.pills}>
          {TYPES.map((type) => (
            <FilterPill
              key={type.value}
              label={t(`calculator.${type.key}`)}
              active={typeBatiment === type.value}
              onPress={() => setTypeBatiment(type.value)}
              style={styles.pill}
            />
          ))}
        </View>

        <Field
          label={t("calculator.floor")}
          value={form.etage}
          onChangeText={(v) => setForm({ ...form, etage: v })}
          keyboardType="number-pad"
          placeholder="0"
          style={styles.fieldGap}
        />

        <Text style={styles.label}>{t("calculator.thickness")}</Text>
        <View style={[styles.pills, styles.pillsLast]}>
          {EPAISSEURS.map((e) => (
            <FilterPill
              key={e || "auto"}
              label={e || t("calculator.auto")}
              active={form.epaisseur === e}
              onPress={() => setForm({ ...form, epaisseur: e })}
              style={styles.pill}
            />
          ))}
        </View>

        <Button
          label={t("calculator.estimate")}
          icon="calculator-outline"
          onPress={estimer}
          loading={loading}
          disabled={loading}
        />
      </Card>

      {result && (
        <Card style={styles.resultCard}>
          <Text style={styles.resultTitle}>{t("calculator.results")}</Text>
          <Row
            label={t("calculator.surface")}
            value={`${result.surface} m²`}
          />
          <Row
            label={t("calculator.thicknessLine", {
              selected: result.epaisseur_selected,
              suggested: result.epaisseur_suggested,
            })}
          />
          <Row
            label={t("calculator.panels", { n: result.nb_panneaux })}
          />
          <Row label={t("calculator.framing", { n: result.ossature_ml })} />
          <Row label={t("calculator.screws", { n: result.nb_vis })} />
          <Row label={t("calculator.weight", { n: result.poids_total })} />
          <Row
            label={t("calculator.container", { n: result.equivalent_conteneur })}
          />
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>{t("calculator.cost")}</Text>
            <Text style={styles.cost}>{formatXAF(result.cout_total)}</Text>
          </View>
          {result.mention ? (
            <Text style={styles.mention}>* {result.mention}</Text>
          ) : null}

          <Button
            label={t("calculator.prepareQuote")}
            icon="document-text-outline"
            variant="green"
            onPress={preparerDevis}
            style={styles.quoteBtn}
          />
        </Card>
      )}
    </Screen>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      {value ? <Text style={styles.resultValue}>{value}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  card: { marginTop: 4 },
  label: {
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    marginBottom: 10,
  },
  hint: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginBottom: 10,
  },
  pills: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
  pillsLast: { marginBottom: 16 },
  pill: { marginRight: 8, marginBottom: 8 },
  dimsRow: { flexDirection: "row", marginTop: 8 },
  dim: { flex: 1, marginRight: 8, marginBottom: 12 },
  fieldGap: { marginTop: 8 },
  resultCard: { marginTop: 14 },
  resultTitle: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 17,
    marginBottom: 10,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  resultLabel: {
    flex: 1,
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginRight: 10,
  },
  resultValue: {
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    textAlign: "right",
  },
  costRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.greenSoft,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
  },
  costLabel: {
    color: COLORS.greenDark,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  cost: { color: COLORS.greenDark, fontFamily: FONTS.bold, fontSize: 17 },
  mention: {
    color: COLORS.mutedLight,
    fontFamily: FONTS.regular,
    fontSize: 11,
    marginTop: 8,
  },
  quoteBtn: { marginTop: 16 },
});
