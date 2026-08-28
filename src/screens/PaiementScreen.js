import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import api from '../services/api';

export default function PaiementScreen() {
  const [montant, setMontant] = useState('');
  const [phone, setPhone] = useState('');
  const [devisId, setDevisId] = useState('');
  const [loading, setLoading] = useState(false);
  const [historique, setHistorique] = useState([]);

  const fetchHistorique = async () => {
    try {
      const { data } = await api.get('/paiements/historique');
      setHistorique(data);
    } catch (e) {}
  };

  useEffect(() => { fetchHistorique(); }, []);

  const payer = async () => {
    if (!montant || montant <= 0) return Alert.alert('Erreur', 'Montant invalide');
    if (!phone || phone.length < 8) return Alert.alert('Erreur', 'Numéro invalide');
    setLoading(true);
    try {
      const { data } = await api.post('/paiements/initier', {
        montant: parseFloat(montant),
        methode: 'mobile_money',
        telephone: phone,
        devis_id: devisId ? parseInt(devisId) : null,
      });
      Alert.alert(
        'Paiement initié',
        `Référence: ${data.reference}\n\nUne demande Mobile Money a été envoyée à votre numéro.\nIndiquez votre code pour confirmer.`
      );
      fetchHistorique();
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.error || "Impossible d'initier le paiement");
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>💳 Paiement</Text>
      <TextInput style={styles.input} placeholder="Montant (FCFA)" keyboardType="numeric"
        value={montant} onChangeText={setMontant} />
      <TextInput style={styles.input} placeholder="Téléphone Mobile Money"
        keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <TextInput style={styles.input} placeholder="Devis ID (optionnel)" keyboardType="numeric"
        value={devisId} onChangeText={setDevisId} />
      <TouchableOpacity style={styles.button} onPress={payer} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Payer via Campay</Text>}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Historique</Text>
      {historique.length === 0 && <Text style={styles.empty}>Aucun paiement</Text>}
      {historique.map((p) => (
        <View key={p.id} style={styles.item}>
          <Text style={styles.itemAmount}>{p.montant?.toLocaleString()} FCFA</Text>
          <Text style={styles.itemSub}>Réf: {p.reference}</Text>
          <Text style={styles.itemStatut}>{p.statut}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: '#faf7f2' },
  title: { fontSize: 24, fontWeight: '800', color: '#92400e', marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: '#e5e5e5', backgroundColor: '#fff',
    borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12,
  },
  button: {
    backgroundColor: '#16a34a', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 24,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 8 },
  empty: { color: '#6b7280', textAlign: 'center', padding: 12 },
  item: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8 },
  itemAmount: { fontSize: 16, fontWeight: '600', color: '#111827' },
  itemSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  itemStatut: { fontSize: 12, color: '#92400e', marginTop: 2 },
});