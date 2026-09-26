import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import api from '../services/api';

export default function CatalogueScreen() {
  const [produits, setProduits] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    try {
      const { data } = await api.get('/products');
      setProduits(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Erreur de chargement du catalogue');
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📦 Catalogue</Text>
      {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}
      <FlatList
        data={produits}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />
        }
        ListEmptyComponent={!error ? <Text style={styles.empty}>Aucun produit</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.nom}</Text>
            <Text style={styles.info}>{item.epaisseur} · {item.categorie}</Text>
            <Text style={styles.price}>{item.prix_ttc?.toLocaleString()} FCFA</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#faf7f2' },
  title: { fontSize: 24, fontWeight: '800', color: '#92400e', marginBottom: 16 },
  error: { color: '#b91c1c', backgroundColor: '#fee2e2', padding: 10, borderRadius: 8, marginBottom: 12 },
  empty: { color: '#6b7280', textAlign: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  info: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  price: { fontSize: 15, fontWeight: '600', color: '#92400e', marginTop: 6 },
});