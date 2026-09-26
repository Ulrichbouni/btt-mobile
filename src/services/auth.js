import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// Sécurité : le token JWT est stocké via expo-secure-store (Keychain iOS /
// Keystore Android, chiffré par l'OS), pas AsyncStorage qui est en clair et
// plus facilement extractible (sauvegarde du téléphone, accès root/ADB...).
// Le profil utilisateur (nom/email, non sensible pour l'authentification)
// reste en AsyncStorage, SecureStore ayant une limite de taille par valeur.
export const saveSession = async (token, user) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getSession = async () => {
  try {
    const [token, userRaw] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      AsyncStorage.getItem(USER_KEY),
    ]);
    return {
      token: token || null,
      user: userRaw ? JSON.parse(userRaw) : null,
    };
  } catch (e) {
    return { token: null, user: null };
  }
};

export const clearSession = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
};