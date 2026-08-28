import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const saveSession = async (token, user) => {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
};

export const getSession = async () => {
  try {
    const [token, user] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
    return {
      token: token?.[1],
      user: user?.[1] ? JSON.parse(user[1]) : null,
    };
  } catch (e) {
    return { token: null, user: null };
  }
};

export const clearSession = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};