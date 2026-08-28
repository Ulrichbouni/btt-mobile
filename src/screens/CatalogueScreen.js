import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import api from '../services/api';

export default function CatalogueScreen() {
  const [produits, setProduits] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/products');
      setProduits(data);
    } catch (e) {}
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📦 Catalogue</Text>
      <FlatList
        data={produits}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />
        }
        ListEmptyComponent={<Text style={styles.empty}>Aucun produit</Text>}
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
  empty: { color: '#6b7280', textAlign: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  info: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  price: { fontSize: 15, fontWeight: '600', color: '#92400e', marginTop: 6 },
});