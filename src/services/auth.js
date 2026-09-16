import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "token";
const USER_KEY = "user";
const SESSION_VERSION_KEY = "session_version";

export const saveSession = async (token, user) => {
  if (!token) {
    throw new Error("A token is required to save the session.");
  }

  const normalizedUser = user && typeof user === "object" ? user : { email: user };

  await AsyncStorage.multiSet([
    [TOKEN_KEY, String(token)],
    [USER_KEY, JSON.stringify(normalizedUser)],
    [SESSION_VERSION_KEY, "1"],
  ]);
};

export const getSession = async () => {
  try {
    const [tokenEntry, userEntry, versionEntry] = await AsyncStorage.multiGet([
      TOKEN_KEY,
      USER_KEY,
      SESSION_VERSION_KEY,
    ]);

    const token = tokenEntry?.[1] ?? null;
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

export const clearSession = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, SESSION_VERSION_KEY]);
};
