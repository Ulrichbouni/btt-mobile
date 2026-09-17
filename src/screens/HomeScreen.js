import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const shortcuts = [
  { label: 'Catalogue', route: 'Catalogue', emoji: '📦' },
  { label: 'Calculateur', route: 'Calculator', emoji: '🧮' },
  { label: 'Devis', route: 'Devis', emoji: '📄' },
  { label: 'Paiement', route: 'Paiement', emoji: '💳' },
  { label: 'Missions', route: 'Missions', emoji: '📋' },
  { label: 'Notifications', route: 'Notifications', emoji: '🔔' },
];

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>BTT-LUX</Text>
        <Text style={styles.subtitle}>Begueni Timber Trading · Luxerboard</Text>
      </View>

      <View style={styles.grid}>
        {shortcuts.map((s) => (
          <TouchableOpacity
            key={s.route}
            style={styles.card}
            onPress={() => navigation.navigate(s.route)}
          >
            <Text style={styles.emoji}>{s.emoji}</Text>
            <Text style={styles.cardLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: '#faf7f2' },
  hero: {
    backgroundColor: '#fff7ed', borderRadius: 16, padding: 20, marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#78350f' },
  subtitle: { fontSize: 14, color: '#92400e', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '31%', backgroundColor: '#fff', borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 4, elevation: 2,
  },
  emoji: { fontSize: 28, marginBottom: 6 },
  cardLabel: { fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },
});