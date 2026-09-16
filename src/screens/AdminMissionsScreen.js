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

const defaultForm = {
  nom: "",
  nom_en: "",
  epaisseur: "",
  categorie: "",
  application: "",
  application_en: "",
  prix_ttc: "",
  poids_unite: "",
  qte_conteneur: "",
  statut_stock: "disponible",
};

export default function AdminProductsScreen() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products");
      setProducts(data);
    } catch (error) {
      Alert.alert("Erreur", error.response?.data?.error || "Impossible de charger les produits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    const payload = {
      ...form,
      epaisseur: Number(form.epaisseur) || null,
      prix_ttc: Number(form.prix_ttc) || null,
      poids_unite: Number(form.poids_unite) || null,
      qte_conteneur: Number(form.qte_conteneur) || null,
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        Alert.alert("Succès", "Produit modifié");
      } else {
        await api.post("/products", payload);
        Alert.alert("Succès", "Produit créé");
      }

      setForm(defaultForm);
      setEditingId(null);
      loadProducts();
    } catch (error) {
      Alert.alert("Erreur", error.response?.data?.error || "Opération impossible");
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
      statut_stock: product.statut_stock || "disponible",
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
            await api.delete(`/products/${id}`);
            Alert.alert("Succès", "Produit supprimé");
            loadProducts();
          } catch (error) {
            Alert.alert("Erreur", error.response?.data?.error || "Suppression impossible");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Gestion produits</Text>

      <View style={styles.formCard}>
        <TextInput style={styles.input} placeholder="Nom" value={form.nom} onChangeText={(v) => updateField("nom", v)} />
        <TextInput style={styles.input} placeholder="Nom EN" value={form.nom_en} onChangeText={(v) => updateField("nom_en", v)} />
        <TextInput style={styles.input} placeholder="Épaisseur" keyboardType="numeric" value={form.epaisseur} onChangeText={(v) => updateField("epaisseur", v)} />
        <TextInput style={styles.input} placeholder="Catégorie" value={form.categorie} onChangeText={(v) => updateField("categorie", v)} />
        <TextInput style={styles.input} placeholder="Application" value={form.application} onChangeText={(v) => updateField("application", v)} />
        <TextInput style={styles.input} placeholder="Application EN" value={form.application_en} onChangeText={(v) => updateField("application_en", v)} />
        <TextInput style={styles.input} placeholder="Prix TTC" keyboardType="numeric" value={form.prix_ttc} onChangeText={(v) => updateField("prix_ttc", v)} />
        <TextInput style={styles.input} placeholder="Poids unité" keyboardType="numeric" value={form.poids_unite} onChangeText={(v) => updateField("poids_unite", v)} />
        <TextInput style={styles.input} placeholder="Quantité conteneur" keyboardType="numeric" value={form.qte_conteneur} onChangeText={(v) => updateField("qte_conteneur", v)} />
        <TextInput style={styles.input} placeholder="Statut stock" value={form.statut_stock} onChangeText={(v) => updateField("statut_stock", v)} />

        <TouchableOpacity style={styles.submitButton} onPress={submit}>
          <Text style={styles.buttonText}>{editingId ? "Modifier produit" : "Créer produit"}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#b45309" />
      ) : (
        products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Text style={styles.productName}>{product.nom}</Text>
            <Text style={styles.productMeta}>Catégorie: {product.categorie}</Text>
            <Text style={styles.productMeta}>Prix: {Number(product.prix_ttc)?.toLocaleString() || "—"} FCFA</Text>
            <Text style={styles.productMeta}>Stock: {product.statut_stock}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => editProduct(product)}>
                <Text style={styles.buttonText}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteProduct(product.id)}>
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
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#faf7f2",
  },
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
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f3e8d4",
  },
  productName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  productMeta: {
    color: "#6b7280",
    marginBottom: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
});
