import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "token";
const SECURE_TOKEN_KEY = "btt_lux_auth_token";
const USER_KEY = "user";
const SESSION_VERSION_KEY = "session_version";

export const normalizeSessionUser = (user) => {
  if (!user || typeof user !== "object") return null;

  const normalized = { ...user };
  const userId = normalized.id ?? normalized.userId ?? normalized.user_id ?? null;

  if (!normalized.role) {
    normalized.role = "client";
  }

  if (userId !== null) {
    normalized.id = userId;
  }

  return normalized;
};

const readLegacyToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const readToken = async () => {
  try {
    const secure = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
    if (secure) return secure;
  } catch {
    // SecureStore unavailable → fallback to AsyncStorage.
  }

  const legacy = await readLegacyToken();
  if (legacy) {
    try {
      await SecureStore.setItemAsync(SECURE_TOKEN_KEY, legacy);
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch {
      // keep token in memory only if migration fails
    }
    return legacy;
  }

  return null;
};

const writeToken = async (token) => {
  try {
    await SecureStore.setItemAsync(SECURE_TOKEN_KEY, String(token));
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    await AsyncStorage.setItem(TOKEN_KEY, String(token));
  }
};

const deleteToken = async () => {
  try {
    await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
  } catch {
    // ignore
  }

  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
};

export const saveSession = async (token, user) => {
  if (!token) {
    throw new Error("A token is required to save the session.");
  }

  const normalizedUser = normalizeSessionUser(user);
  if (!normalizedUser) {
    throw new Error("A valid user is required to save the session.");
  }

  await writeToken(token);
  await AsyncStorage.multiSet([
    [USER_KEY, JSON.stringify(normalizedUser)],
    [SESSION_VERSION_KEY, "1"],
  ]);
};

export const getSession = async () => {
  try {
    const token = await readToken();
    const [userEntry, versionEntry] = await AsyncStorage.multiGet([
      USER_KEY,
      SESSION_VERSION_KEY,
    ]);

    const userValue = userEntry?.[1] ?? null;
    const version = versionEntry?.[1] ?? null;

    if (!token || !userValue) {
      return { token: null, user: null, isAuthenticated: false };
    }

    const parsedUser = JSON.parse(userValue);
    const user = normalizeSessionUser(parsedUser);

    return {
      token,
      user,
      isAuthenticated: Boolean(token && user && version),
    };
  } catch {
    return { token: null, user: null, isAuthenticated: false };
  }
};

export const isSessionValid = async () => {
  const { token, user } = await getSession();
  return Boolean(token && user);
};

export const updateSessionUser = async (user) => {
  const normalizedUser = normalizeSessionUser(user);
  if (!normalizedUser) {
    throw new Error("A user object is required to update the session.");
  }

  const token = await readToken();
  if (!token) {
    return null;
  }

  await AsyncStorage.multiSet([
    [USER_KEY, JSON.stringify(normalizedUser)],
    [SESSION_VERSION_KEY, "1"],
  ]);

  return { token, user: normalizedUser, isAuthenticated: true };
};

export const updateSessionToken = async (token) => {
  if (!token) return null;
  await writeToken(token);
  return token;
};

export const clearSession = async () => {
  await deleteToken();
  await AsyncStorage.multiRemove([USER_KEY, SESSION_VERSION_KEY]);
};

