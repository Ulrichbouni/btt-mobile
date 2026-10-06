import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Alert } from "react-native";

import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  Field,
  Screen,
  SectionHeader,
  SegmentedTabs,
  StatusPill,
} from "../components";
import { useI18n } from "../i18n";
import api from "../services/api";
import { COLORS, FONTS, SPACING, RADII } from "../theme/theme";

export default function AdminProductsScreen() {
  const { t } = useI18n();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState("new");

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products");
      setProducts(data);
    } catch (error) {
      Alert.alert(
        "Erreur",
        error.response?.data?.error || "Impossible de charger les produits",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const cancelEdit = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async () => {
    if (
      !form.nom.trim() ||
      !form.epaisseur.trim() ||
      !form.categorie.trim() ||
      !form.prix_ttc
    ) {
      Alert.alert("Erreur", "Nom, épaisseur, catégorie et prix sont requis.");
      return;
    }

    // epaisseur reste un STRING (schéma backend : z.string())
    const payload = {
      nom: form.nom.trim(),
      nom_en: form.nom_en?.trim() || undefined,
      epaisseur: String(form.epaisseur).trim(),
      categorie: form.categorie.trim(),
      application: form.application?.trim() || undefined,
      application_en: form.application_en?.trim() || undefined,
      prix_ttc: Number(form.prix_ttc),
      poids_unite: form.poids_unite ? Number(form.poids_unite) : undefined,
      qte_conteneur: form.qte_conteneur
        ? Number(form.qte_conteneur)
        : undefined,
      statut_stock: form.statut_stock || "En stock",
    };

    if (Number.isNaN(payload.prix_ttc)) {
      Alert.alert("Erreur", "Prix TTC invalide.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        Alert.alert("Succès", "Produit modifié");
      } else {
        await api.post("/products", payload);
        Alert.alert("Succès", "Produit créé");
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadProducts();
    } catch (error) {
      const details = error.response?.data?.details;
      const msg =
        details?.map((d) => `${d.champ}: ${d.message}`).join("\n") ||
        error.response?.data?.error ||
        "Opération impossible";
      Alert.alert("Erreur", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setForm({
      nom: product.nom || "",
      nom_en: product.nom_en || "",
      epaisseur: String(product.epaisseur || ""),
      categorie: product.categorie || "",
      application: product.application || "",
      application_en: product.application_en || "",
      prix_ttc: String(product.prix_ttc || ""),
      poids_unite: String(product.poids_unite || ""),
      qte_conteneur: String(product.qte_conteneur || ""),
      statut_stock: product.statut_stock || "En stock",
    });
  };

  const deleteProduct = async (id) => {
    Alert.alert("Confirmation", "Supprimer ce produit ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            const { data } = await api.delete(`/products/${id}`);
            Alert.alert("Succès", data.message || "Produit supprimé");
            await loadProducts();
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

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader title={t("admin.products")} showBell onBell={() => {}} />

      <SectionHeader
        icon="grid-outline"
        tone="green"
        title={t("admin.products")}
        subtitle={t("admin.productCount", { n: products.length })}
      />

      <SegmentedTabs
        tabs={[{
          key: "new",
          label: t("admin.newProduct"),
        }, {
          key: "list",
          label: t("admin.productList"),
        }]}
        value={tab}
        onChange={setTab}
      />

      {tab === "new" ? (
        <Card style={styles.formCard} padding={16}>
          <SectionHeader icon="pencil-outline" tone="green" title={t("admin.newProduct")} />

          <Field
            label={t("admin.prod.nom")}
            placeholder={t("admin.prod.nomPlaceholder")}
            value={form.nom}
            onChangeText={(v) => updateField("nom", v)}
          />
          <Field
            label={t("admin.prod.nomEn")}
            placeholder={t("admin.prod.nomEnPlaceholder")}
            value={form.nom_en}
            onChangeText={(v) => updateField("nom_en", v)}
          />
          <Field
            label={t("admin.prod.epaisseur")}
            placeholder={t("admin.prod.epaisseurPlaceholder")}
            value={form.epaisseur}
            onChangeText={(v) => updateField("epaisseur", v)}
          />
          <Field
            label={t("admin.prod.categorie")}
            placeholder={t("admin.prod.categoriePlaceholder")}
            value={form.categorie}
            onChangeText={(v) => updateField("categorie", v)}
          />
          <Field
            label={t("admin.prod.application")}
            placeholder={t("admin.prod.applicationPlaceholder")}
            value={form.application}
            onChangeText={(v) => updateField("application", v)}
          />
          <Field
            label={t("admin.prod.applicationEn")}
            placeholder={t("admin.prod.applicationEnPlaceholder")}
            value={form.application_en}
            onChangeText={(v) => updateField("application_en", v)}
          />
          <Field
            label={t("admin.prod.prixTtc")}
            placeholder={t("admin.prod.prixTtcPlaceholder")}
            value={form.prix_ttc}
            onChangeText={(v) => updateField("prix_ttc", v)}
            keyboardType="numeric"
          />
          <Field
            label={t("admin.prod.poidsUnite")}
            placeholder={t("admin.prod.poidsUnitePlaceholder")}
            value={form.poids_unite}
            onChangeText={(v) => updateField("poids_unite", v)}
            keyboardType="numeric"
          />
          <Field
            label={t("admin.prod.qteConteneur")}
            placeholder={t("admin.prod.qteConteneurPlaceholder")}
            value={form.qte_conteneur}
            onChangeText={(v) => updateField("qte_conteneur", v)}
            keyboardType="numeric"
          />
          <Field
            label={t("admin.prod.statutStock")}
            placeholder={t("admin.prod.statutStockPlaceholder")}
            value={form.statut_stock}
            onChangeText={(v) => updateField("statut_stock", v)}
          />

          <View style={styles.buttonRow}>
            <Button
              label={t("admin.save")}
              icon="checkmark-outline"
              variant="green"
              onPress={submit}
              loading={submitting}
              disabled={submitting}
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
      ) : (
        products.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title={t("admin.empty")}
            message={t("admin.noProducts")}
          />
        ) : (
          products.map((product) => (
            <Card key={product.id} style={styles.productCard} padding={16}>
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{product.nom}</Text>
                <StatusPill
                  status={product.statut_stock || "en_stock"}
                  small
                />
              </View>
              <Text style={styles.productMeta}>
                {t("admin.prod.categorie")} : {product.categorie}
              </Text>
              <Text style={styles.productMeta}>
                {t("admin.prod.epaisseur")} : {product.epaisseur}
              </Text>
              <Text style={styles.productMeta}>
                {t("admin.prod.prix")} : {product.prix_ttc != null
                  ? Number(product.prix_ttc).toLocaleString()
                  : "—"} FCFA
              </Text>

              <View style={styles.actionRow}>
                <Button
                  icon="pencil-outline"
                  label={t("admin.edit")}
                  variant="soft"
                  onPress={() => editProduct(product)}
                />
                <Button
                  icon="trash-outline"
                  label={t("admin.delete")}
                  variant="danger"
                  onPress={() => deleteProduct(product.id)}
                />
              </View>
            </Card>
          ))
        )
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  formCard: { backgroundColor: COLORS.primarySoft, borderRadius: RADII.lg },
  buttonRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  saveBtn: { flex: 1, marginRight: SPACING.md },
  cancelBtn: { flex: 1 },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  productName: {
    color: COLORS.ink,
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  productMeta: {
    color: COLORS.muted,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
    flex: 1,
    justifyContent: "flex-end",
  },
});
