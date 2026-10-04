import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "token";
const SECURE_TOKEN_KEY = "btt_lux_auth_token";
const USER_KEY = "user";
const SESSION_VERSION_KEY = "session_version";

// --- Jeton : SecureStore (Keychain/Keystore) avec repli AsyncStorage ---
// L'ancien jeton stocké dans AsyncStorage est migré au premier accès.

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
    // SecureStore indisponible (ex. simulateur web) → repli AsyncStorage.
  }
  const legacy = await readLegacyToken();
  if (legacy) {
    // Migration : on copie dans le stockage sécurisé puis on supprime l'ancien.
    try {
      await SecureStore.setItemAsync(SECURE_TOKEN_KEY, legacy);
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch {
      // Si la copie échoue, on conserve le jeton en mémoire seulement.
    }
    return legacy;
  }
  return null;
};

const writeToken = async (token) => {
  try {
    await SecureStore.setItemAsync(SECURE_TOKEN_KEY, String(token));
    // Supprime l'ancienne copie non sécurisée si elle existe.
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // Repli : stockage legacy si SecureStore échoue.
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

  const normalizedUser = user && typeof user === "object" ? user : { email: user };

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

    const user = JSON.parse(userValue);

    return {
      token,
      user,
      isAuthenticated: Boolean(token && user && version),
    };
  } catch (error) {
    return { token: null, user: null, isAuthenticated: false };
  }
};

export const isSessionValid = async () => {
  const { token, user } = await getSession();
  return Boolean(token && user);
};

// Met à jour l'utilisateur en session sans toucher au token.
// Utilisé après GET/PUT /auth/me pour refléter une promotion de rôle
// (client -> technicien) sans exiger une reconnexion.
export const updateSessionUser = async (user) => {
  if (!user || typeof user !== "object") {
    throw new Error("A user object is required to update the session.");
  }

  const token = await readToken();
  if (!token) {
    return null;
  }

  await AsyncStorage.multiSet([
    [USER_KEY, JSON.stringify(user)],
    [SESSION_VERSION_KEY, "1"],
  ]);

  return { token, user, isAuthenticated: true };
};

// Remplace le jeton courant (ex. : nouvelle version après changement de
// mot de passe, l'ancien étant révoqué côté backend).
export const updateSessionToken = async (token) => {
  if (!token) return null;
  await writeToken(token);
  return token;
};

export const clearSession = async () => {
  await deleteToken();
  await AsyncStorage.multiRemove([USER_KEY, SESSION_VERSION_KEY]);
};
