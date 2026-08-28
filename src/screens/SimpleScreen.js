import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SimpleScreen({ route }) {
  const title = route?.params?.title || 'Module';
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>Module en cours de développement</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf7f2', padding: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#92400e' },
  sub: { fontSize: 14, color: '#6b7280', marginTop: 8, textAlign: 'center' },
});