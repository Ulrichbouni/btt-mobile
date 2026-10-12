import axios from "axios";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { readToken, updateSessionToken } from "./auth";

// Repli de développement : proxy local qui ajoute les en-têtes CORS absents
// du backend Render (les navigateurs les exigent).
const LOCAL_PROXY_URL = "http://localhost:3002/api";
// Dernier recours pour les builds natifs (aucune contrainte CORS).
const DEFAULT_REMOTE_URL = "https://btt-backend-sgas.onrender.com/api";

// Variable d'environnement Expo (préfixe EXPO_PUBLIC_), inlinée au build.
const readEnvApiUrl = () => {
  try {
    const value = process.env.EXPO_PUBLIC_API_URL;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
};

// `expo.extra.apiUrl` de app.json (même source que celle documentée au README).
const readConfigApiUrl = () => {
  try {
    const extra =
      Constants.expoConfig?.extra ??
      Constants.manifest?.extra ??
      Constants.manifest2?.extra?.expoClient?.extra ??
      null;
    const value = extra?.apiUrl;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
};

// Priorité :
//   1. EXPO_PUBLIC_API_URL — override explicite (builds, CI, tests).
//   2. Sur le web, en développement uniquement : le proxy local, car un backend
//      distant sans CORS est injoignable depuis un navigateur (Render n'expose
//      aucun en-tête Access-Control-Allow-Origin). En production web, pointer sur
//      localhost rendrait l'app injoignable : on retombe sur l'URL distante.
//   3. Sur natif : expo.extra.apiUrl de app.json, puis l'URL Render.
const resolveApiBaseUrl = () => {
  const fromEnv = readEnvApiUrl();
  if (fromEnv) return fromEnv;

  if (Platform.OS === "web" && __DEV__) return LOCAL_PROXY_URL;

  return readConfigApiUrl() || DEFAULT_REMOTE_URL || LOCAL_PROXY_URL;
};

const baseURL = resolveApiBaseUrl();

const api = axios.create({
  baseURL,
  // Un backend Render (offre gratuite) s'endort et met parfois 30–60 s à sortir
  // de veille au premier appel. 20 s coupait systématiquement cette première
  // requête ; 30 s couvre l'immense majorité des cold-starts.
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  try {
    // SecureStore d'abord (Keychain/Keystore), repli sur l'ancien AsyncStorage.
    const token = (await readToken()) || (await AsyncStorage.getItem("token"));
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    // silently ignore storage access issues; auth will be handled by the app state
  }

  return config;
});

let onUnauthorized = null;

export const setOnUnauthorized = (callback) => {
  onUnauthorized = callback;
};

// Nouvelle tentative des requêtes idempotentes (GET/HEAD) en cas d'erreur
// réseau ou de délai dépassé (cold-start Render). On ne réessaie JAMAIS les
// mutations (POST/PUT/DELETE) : un paiement ne doit pas pouvoir être rejoué.
const RETRYABLE_METHODS = new Set(["get", "head"]);
const MAX_RETRIES = 2;

const shouldRetry = (error) => {
  const config = error?.config;
  if (!config) return false;
  // Une réponse HTTP (même 500) signifie que le serveur a répondu : on laisse
  // l'appelant décider, on ne masque pas une erreur métier par un réessai.
  if (error.response) return false;
  const method = String(config.method || "get").toLowerCase();
  if (!RETRYABLE_METHODS.has(method)) return false;
  // !error.response couvre à la fois le délai dépassé (ECONNABORTED) et les
  // erreurs réseau (ERR_NETWORK, appareil hors ligne momentanément).
  return true;
};

api.interceptors.response.use(
  (response) => {
    // Un changement de mot de passe révoque les anciens JWT : le backend
    // renvoie un nouveau token que l'on propage immédiatement en session.
    const newToken = response?.data?.token;
    if (typeof newToken === "string" && newToken.length > 0) {
      updateSessionToken(newToken).catch(() => {});
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && typeof onUnauthorized === "function") {
      onUnauthorized();
    }

    // Réessai ciblé des GET/HEAD sur erreur réseau ou délai dépassé, avec un
    // léger repli exponentiel (1 s, 2 s). `api(config)` repasse par
    // l'intercepteur de requête et rattache donc le token courant.
    const config = error?.config;
    if (shouldRetry(error) && config) {
      config.__retryCount = config.__retryCount || 0;
      if (config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1;
        const backoff = 1000 * 2 ** (config.__retryCount - 1);
        return new Promise((resolve) =>
          setTimeout(() => resolve(api(config)), backoff),
        );
      }
    }

    return Promise.reject(error);
  },
);

export const setApiBaseUrl = (url) => {
  if (!url) return;
  api.defaults.baseURL = String(url).replace(/\/+$/, "");
};

export default api;
