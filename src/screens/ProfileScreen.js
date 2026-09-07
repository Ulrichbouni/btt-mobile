import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import api from '../services/api';
import { clearSession } from '../services/auth';

export default function ProfileScreen({ user, onLogout }) {
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', mot_de_passe: '' });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(res => {
      setForm({
        nom: res.data.nom || '',
        email: res.data.email || '',
        telephone: res.data.telephone || '',
        mot_de_passe: ''
      });
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const body = {};
      if (form.nom) body.nom = form.nom;
      if (form.email) body.email = form.email;
      if (form.telephone) body.telephone = form.telephone;
      if (form.mot_de_passe) body.mot_de_passe = form.mot_de_passe;

      const res = await api.put('/auth/me', body);
      Alert.alert('Succès', 'Profil mis à jour !');
      setEditing(false);
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.error || 'Erreur lors de la mise à jour');
    }
    setLoading(false);
  };

  const logout = async () => {
    await clearSession();
    onLogout();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mon Profil</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nom</Text>
        <TextInput
          style={[styles.input, !editing && styles.readonly]}
          value={form.nom}
          onChangeText={(v) => setForm({ ...form, nom: v })}
          editable={editing}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, !editing && styles.readonly]}
          value={form.email}
          onChangeText={(v) => setForm({ ...form, email: v })}
          editable={editing}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Téléphone</Text>
        <TextInput
          style={[styles.input, !editing && styles.readonly]}
          value={form.telephone}
          onChangeText={(v) => setForm({ ...form, telephone: v })}
          editable={editing}
          keyboardType="phone-pad"
          placeholder="+237655505798"
        />

        {editing && (
          <>
            <Text style={styles.label}>Nouveau mot de passe (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={form.mot_de_passe}
              onChangeText={(v) => setForm({ ...form, mot_de_passe: v })}
              secureTextEntry
              placeholder="Laisser vide pour ne pas changer"
            />
          </>
        )}

        <Text style={styles.role}>Rôle: {user?.role}</Text>
      </View>

      {!editing ? (
        <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
          <Text style={styles.editBtnText}>Modifier le profil</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.row}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            <Text style={styles.saveBtnText}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: '#faf7f2' },
  title: { fontSize: 24, fontWeight: '800', color: '#92400e', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 16 },
  label: { fontSize: 12, color: '#6b7280', marginTop: 8, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff' },
  readonly: { backgroundColor: '#f9fafb', color: '#374151' },
  role: { fontSize: 14, color: '#92400e', marginTop: 12, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  editBtn: { backgroundColor: '#b45309', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  editBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: '#16a34a', padding: 16, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { flex: 1, backgroundColor: '#6b7280', padding: 16, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logout: { backgroundColor: '#dc2626', padding: 16, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
