import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import api from '../services/api';

export default function RegisterScreen({ navigation, onRegistered }) {
  const [step, setStep] = useState('otp');
  const [form, setForm] = useState({ telephone: '', code: '', nom: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const update = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const requestOTP = async () => {
    if (!form.telephone) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { telephone: form.telephone });
      setStep('verify');
      Alert.alert('Info', 'Code envoyé. Saisissez-le et complétez vos infos.');
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.error || 'OTP impossible');
    }
    setLoading(false);
  };

  const verifyAndRegister = async () => {
    if (!form.nom || !form.email || !form.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { telephone: form.telephone, code: form.code });
      const { data } = await api.post('/auth/register', {
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
        mot_de_passe: form.password,
      });
      Alert.alert('Succès', 'Compte créé ! Vous pouvez vous connecter.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.error || "Inscription impossible");
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>

      <TextInput style={styles.input} placeholder="Téléphone" value={form.telephone}
        keyboardType="phone-pad" onChangeText={update('telephone')} />

      {step === 'verify' ? (
        <TextInput style={styles.input} placeholder="Code OTP" value={form.code}
          keyboardType="number-pad" onChangeText={update('code')} />
      ) : null}

      {step === 'verify' ? (
        <>
          <TextInput style={styles.input} placeholder="Nom complet" value={form.nom} onChangeText={update('nom')} />
          <TextInput style={styles.input} placeholder="Email" value={form.email}
            keyboardType="email-address" autoCapitalize="none" onChangeText={update('email')} />
          <TextInput style={styles.input} placeholder="Mot de passe" value={form.password}
            secureTextEntry onChangeText={update('password')} />
        </>
      ) : null}

      {step === 'otp' ? (
        <TouchableOpacity style={styles.button} onPress={requestOTP} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Recevoir le code</Text>}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={verifyAndRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Créer le compte</Text>}
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Retour à la connexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#faf7f2' },
  title: { fontSize: 26, fontWeight: '800', color: '#92400e', textAlign: 'center', marginBottom: 24 },
  input: {
    borderWidth: 1, borderColor: '#e5e5e5', backgroundColor: '#fff',
    borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12,
  },
  button: {
    backgroundColor: '#b45309', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#92400e', textAlign: 'center', marginTop: 16 },
});