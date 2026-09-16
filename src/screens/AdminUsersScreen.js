import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import api from "../services/api";

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { setUsers((await api.get("/admin/utilisateurs")).data); }
    catch (error) { Alert.alert("Erreur", error.response?.data?.error || "Chargement impossible"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const updateRole = async (id, role) => {
    try { await api.put(`/admin/utilisateurs/${id}/role`, { role }); await load(); }
    catch (error) { Alert.alert("Erreur", error.response?.data?.error || "Modification impossible"); }
  };
  const remove = (id) => Alert.alert("Confirmation", "Supprimer cet utilisateur ?", [
    { text: "Annuler", style: "cancel" },
    { text: "Supprimer", style: "destructive", onPress: async () => {
      try { await api.delete(`/admin/utilisateurs/${id}`); await load(); }
      catch (error) { Alert.alert("Erreur", error.response?.data?.error || "Suppression impossible"); }
    } },
  ]);
  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.title}>Utilisateurs</Text>
    {loading ? <ActivityIndicator color="#b45309" /> : users.map((user) => <View key={user.id} style={styles.card}>
      <Text style={styles.name}>{user.nom}</Text><Text>{user.email}</Text><Text style={styles.meta}>Rôle : {user.role}</Text>
      <View style={styles.row}><TouchableOpacity style={styles.primary} onPress={() => updateRole(user.id, "technicien")}><Text style={styles.white}>Technicien</Text></TouchableOpacity><TouchableOpacity style={styles.secondary} onPress={() => updateRole(user.id, "client")}><Text style={styles.white}>Client</Text></TouchableOpacity><TouchableOpacity style={styles.danger} onPress={() => remove(user.id)}><Text style={styles.white}>Suppr.</Text></TouchableOpacity></View>
    </View>)}
  </ScrollView>;
}
const styles = StyleSheet.create({ container:{flexGrow:1,padding:16,backgroundColor:"#faf7f2"}, title:{fontSize:26,fontWeight:"800",color:"#92400e",marginBottom:16}, card:{backgroundColor:"#fff",borderRadius:12,padding:14,marginBottom:12}, name:{fontSize:17,fontWeight:"700"}, meta:{color:"#92400e",fontWeight:"600",marginVertical:6}, row:{flexDirection:"row",gap:8,flexWrap:"wrap"}, primary:{backgroundColor:"#b45309",padding:9,borderRadius:8}, secondary:{backgroundColor:"#0f766e",padding:9,borderRadius:8}, danger:{backgroundColor:"#dc2626",padding:9,borderRadius:8}, white:{color:"#fff",fontWeight:"700"} });
