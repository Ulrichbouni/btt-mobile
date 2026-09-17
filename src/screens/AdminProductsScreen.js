import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";

import api from "../services/api";

const emptyForm = {
  nom: "",
  nom_en: "",
  epaisseur: "",
  categorie: "",
  application: "",
  application_en: "",
  prix_ttc: "",
  poids_unite: "",
  qte_conteneur: "",
  statut_stock: "En stock",
};

export default function AdminProductsScreen() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

    // ⚠️ epaisseur reste un STRING (schéma backend : z.string())
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

    // Sécurité : empêcher NaN d'aller au backend
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Gestion produits</Text>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>
          {editingId ? `Modifier le produit #${editingId}` : "Nouveau produit"}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nom *"
          value={form.nom}
          onChangeText={(v) => updateField("nom", v)}
        />
        <TextInput
          style={styles.input}
          placeholder="Nom (anglais)"
          value={form.nom_en}
          onChangeText={(v) => updateField("nom_en", v)}
        />
        <TextInput
          style={styles.input}
          placeholder="Épaisseur (ex: 8mm) *"
          value={form.epaisseur}
          onChangeText={(v) => updateField("epaisseur", v)}
        />
        <TextInput
          style={styles.input}
          placeholder="Catégorie *"
          value={form.categorie}
          onChangeText={(v) => updateField("categorie", v)}
        />
        <TextInput
          style={styles.input}
          placeholder="Application"
          value={form.application}
          onChangeText={(v) => updateField("application", v)}
        />
        <TextInput
          style={styles.input}
          placeholder="Application (anglais)"
          value={form.application_en}
          onChangeText={(v) => updateField("application_en", v)}
        />
        <TextInput
          style={styles.input}
          placeholder="Prix TTC (FCFA) *"
          keyboardType="numeric"
          value={form.prix_ttc}
          onChangeText={(v) => updateField("prix_ttc", v)}
        />
        <TextInput
          style={styles.input}
          placeholder="Poids unité (kg)"
          keyboardType="numeric"
          value={form.poids_unite}
          onChangeText={(v) => updateField("poids_unite", v)}
        />
        <TextInput
          style={styles.input}
          placeholder="Quantité conteneur"
          keyboardType="numeric"
          value={form.qte_conteneur}
          onChangeText={(v) => updateField("qte_conteneur", v)}
        />
        <TextInput
          style={styles.input}
          placeholder="Statut stock"
          value={form.statut_stock}
          onChangeText={(v) => updateField("statut_stock", v)}
        />

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.buttonDisabled]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {editingId ? "Modifier le produit" : "Créer le produit"}
            </Text>
          )}
        </TouchableOpacity>

        {editingId && (
          <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
            <Text style={styles.buttonText}>Annuler l'édition</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#b45309" />
      ) : products.length === 0 ? (
        <Text style={styles.empty}>Aucun produit pour le moment.</Text>
      ) : (
        products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Text style={styles.productName}>{product.nom}</Text>
            <Text style={styles.productMeta}>
              Catégorie : {product.categorie}
            </Text>
            <Text style={styles.productMeta}>
              Prix :{" "}
              {product.prix_ttc != null
                ? Number(product.prix_ttc).toLocaleString()
                : "—"}{" "}
              FCFA
            </Text>
            <Text style={styles.productMeta}>
              Stock : {product.statut_stock || "—"}
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => editProduct(product)}
              >
                <Text style={styles.buttonText}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteProduct(product.id)}
              >
                <Text style={styles.buttonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: "#faf7f2" },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#92400e",
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f3e8d4",
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#92400e",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  submitButton: {
    backgroundColor: "#b45309",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6b7280",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  secondaryButton: {
    backgroundColor: "#0f766e",
    borderRadius: 8,
    padding: 10,
    flex: 1,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    padding: 10,
    flex: 1,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f3e8d4",
  },
  productName: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  productMeta: { color: "#6b7280", marginBottom: 2 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 20 },
});
