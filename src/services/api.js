import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import Constants from "expo-constants";

const DEFAULT_API_URL = 'https://btt-backend-sgas.onrender.com/api';

/**
 * Normalise l'URL de l'API.
 *
 * Le backend Express monte ses routes sous /api (voir btt-backend/server.js :
 * app.use('/api/auth', authRoutes), ...) et son handler 404 renvoie
 * { error: 'Route non trouvée' }.
 *
 * Si l'URL embarquee dans le build (app.json -> expo.extra.apiUrl) oublie le
 * suffixe /api, TOUS les appels renvoient ce 404. On garantit donc le suffixe
 * ici, quelle que soit la source de l'URL.
 */
function normalizeApiUrl(raw) {
  let url = String(raw || DEFAULT_API_URL).trim().replace(/\/+$/, '');
  if (!/\/api$/i.test(url)) url += '/api';
  return url;
}

export const API_URL = normalizeApiUrl(
  process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl
);

// timeout genereux : le plan gratuit Render met le service en veille et le
// premier appel apres reveil peut prendre plusieurs dizaines de secondes.
const api = axios.create({ baseURL: API_URL, timeout: 60000 });

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {}
  return config;
});

// Callback enregistré par App.js pour déconnecter l'utilisateur
// automatiquement quand le token n'est plus valide (401).
let onUnauthorized = null;
export const setOnUnauthorized = (callback) => {
  onUnauthorized = callback;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const data = error.response?.data;
    if (data && data.error === 'Route non trouvée') {
      // Diagnostic explicite au lieu du 404 brut du backend.
      data.error = `Service API injoignable (${API_URL}).`;
    } else if (!error.response) {
      error.message = 'Serveur injoignable. Verifiez votre connexion internet.';
    }
    return Promise.reject(error);
  }
);

export default api;
