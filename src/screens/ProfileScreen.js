import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { clearSession } from '../services/auth';

export default function ProfileScreen({ user, onLogout }) {
  const logout = async () => {
    await clearSession();
    onLogout();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.nom}</Text>
        <Text style={styles.info}>{user?.email}</Text>
        <Text style={styles.role}>Rôle: {user?.role}</Text>
      </View>
      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#faf7f2' },
  title: { fontSize: 24, fontWeight: '800', color: '#92400e', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 24 },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  info: { fontSize: 14, color: '#374151', marginTop: 6 },
  role: { fontSize: 14, color: '#92400e', marginTop: 6, fontWeight: '600' },
  logout: {
    backgroundColor: '#dc2626', padding: 16, borderRadius: 8, alignItems: 'center',
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});