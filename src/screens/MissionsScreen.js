import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import api from '../services/api';

export default function MissionsScreen() {
  const [missions, setMissions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/missions/technicien/mes-missions');
      setMissions(data);
    } catch (e) {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Mes Missions</Text>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {missions.length === 0 && <Text style={styles.empty}>Aucune mission</Text>}
        {missions.map((m) => (
          <View key={m.id} style={styles.card}>
            <Text style={styles.missionTitle}>Mission #{m.id}</Text>
            <Text style={styles.sub}>Adresse: {m.adresse}</Text>
            <Text style={styles.sub}>Ville: {m.ville}</Text>
            <Text style={styles.sub}>Client: {m.client_nom}</Text>
            <Text style={styles.statut}>Statut: {m.statut}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#faf7f2' },
  title: { fontSize: 24, fontWeight: '800', color: '#92400e', marginBottom: 16 },
  empty: { color: '#6b7280', textAlign: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10 },
  missionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  info: { fontSize: 14, color: '#374151', marginTop: 4 },
  statut: { fontSize: 13, color: '#92400e', marginTop: 6, fontWeight: '600' },
});