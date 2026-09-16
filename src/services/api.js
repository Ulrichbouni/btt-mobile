import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const resolveApiBaseUrl = () => {
  const extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};
  const configuredUrl = extra.apiUrl || extra.API_URL || process.env.EXPO_PUBLIC_API_URL;

  if (configuredUrl) {
    return String(configuredUrl).replace(/\/+$/, "");
  }

  return "https://btt-backend-sgas.onrender.com/api";
};

const baseURL = resolveApiBaseUrl();

const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("token");
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof onUnauthorized === "function") {
      onUnauthorized();
    }

    return Promise.reject(error);
  },
);

export const setApiBaseUrl = (url) => {
  if (!url) return;
  api.defaults.baseURL = String(url).replace(/\/+$/, "");
};

export default api;
