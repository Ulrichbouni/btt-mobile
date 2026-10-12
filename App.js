import React, { useCallback, useEffect, useState } from "react";
import { AppState, StyleSheet, View } from "react-native";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "@expo-google-fonts/poppins";

import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";

import {
  getSession,
  clearSession,
  updateSessionUser,
  normalizeSessionUser,
} from "./src/services/auth";
import api, { setOnUnauthorized } from "./src/services/api";

import { COLORS, FONTS } from "./src/theme/theme";
import { I18nProvider, useI18n } from "./src/i18n";

import WelcomeScreen from "./src/screens/WelcomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import PaiementScreen from "./src/screens/PaiementScreen";
import MissionsScreen from "./src/screens/MissionsScreen";
import CatalogueScreen from "./src/screens/CatalogueScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import CalculatorScreen from "./src/screens/CalculatorScreen";
import DevisScreen from "./src/screens/DevisScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import MesChantiersScreen from "./src/screens/MesChantiersScreen";
import SaisieMesuresScreen from "./src/screens/SaisieMesuresScreen";
import AssistantIAScreen from "./src/screens/AssistantIAScreen";
import AnnuaireScreen from "./src/screens/AnnuaireScreen";
import AdminDashboardScreen from "./src/screens/AdminDashboardScreen";
import AdminUsersScreen from "./src/screens/AdminUsersScreen";
import AdminProductsScreen from "./src/screens/AdminProductsScreen";
import AdminMissionsScreen from "./src/screens/AdminMissionsScreen";
import AdminDevisScreen from "./src/screens/AdminDevisScreen";
import AdminChantiersScreen from "./src/screens/AdminChantiersScreen";
import ChantierDetailScreen from "./src/screens/ChantierDetailScreen";
import OTPSetupScreen from "./src/screens/OTPSetupScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.bg,
    primary: COLORS.primary,
    card: "#FFFFFF",
    text: COLORS.ink,
    border: COLORS.border,
    notification: COLORS.green,
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: { fontFamily: FONTS.regular, fontWeight: "400" },
    medium: { fontFamily: FONTS.medium, fontWeight: "500" },
    bold: { fontFamily: FONTS.bold, fontWeight: "700" },
    heavy: { fontFamily: FONTS.extraBold, fontWeight: "800" },
  },
};

const stackHeader = {
  headerStyle: { backgroundColor: COLORS.bg },
  headerShadowVisible: false,
  headerTintColor: COLORS.ink,
  headerTitleStyle: { fontFamily: FONTS.bold, fontSize: 17 },
};

const tabIcon =
  (nameFocused, nameOutline) =>
  ({ focused }) => (
    <View style={[styles.tabPill, focused && styles.tabPillActive]}>
      <Ionicons
        name={focused ? nameFocused : nameOutline}
        size={21}
        color={focused ? COLORS.primary : COLORS.muted}
      />
    </View>
  );

function HomeTabs({ user, onLogout, onUserUpdated }) {
  const { t } = useI18n();
  const safeUser = normalizeSessionUser(user) || { role: "client" };
  const role = safeUser.role || "client";
  const isClient = role === "client";

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#EDE4D6",
          height: 66,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontFamily: FONTS.semiBold },
        tabBarIconStyle: { marginBottom: 0 },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel: t("tabs.home"),
          tabBarIcon: tabIcon("home", "home-outline"),
        }}
      >
        {({ navigation }) => <HomeScreen navigation={navigation} user={safeUser} />}
      </Tab.Screen>
      <Tab.Screen
        name="Catalogue"
        component={CatalogueScreen}
        options={{
          tabBarLabel: t("tabs.catalogue"),
          tabBarIcon: tabIcon("grid", "grid-outline"),
        }}
      />
      <Tab.Screen
        name="MesChantiers"
        options={{
          tabBarLabel: isClient ? t("tabs.mesChantiers") : t("tabs.chantiers"),
          tabBarIcon: tabIcon("business", "business-outline"),
        }}
      >
        {({ navigation }) => (
          <MesChantiersScreen navigation={navigation} user={safeUser} />
        )}
      </Tab.Screen>
      {!isClient && (
        <Tab.Screen
          name="Missions"
          options={{
            tabBarLabel: t("tabs.missions"),
            tabBarIcon: tabIcon("briefcase", "briefcase-outline"),
          }}
        >
          {({ navigation }) => (
            <MissionsScreen navigation={navigation} user={safeUser} />
          )}
        </Tab.Screen>
      )}
      <Tab.Screen
        name="Paiement"
        component={PaiementScreen}
        options={{
          tabBarLabel: t("tabs.paiement"),
          tabBarIcon: tabIcon("card", "card-outline"),
        }}
      />
      <Tab.Screen
        name="Profil"
        options={{
          tabBarLabel: t("tabs.profil"),
          tabBarIcon: tabIcon("person", "person-outline"),
        }}
      >
        {({ navigation }) => (
          <ProfileScreen
            user={safeUser}
            onLogout={onLogout}
            onUserUpdated={onUserUpdated}
            navigation={navigation}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AppInner() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      await clearSession();
    } finally {
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      const nextUser = normalizeSessionUser(data?.user || data);
      if (!nextUser) return;

      setUser((prev) => {
        const current = normalizeSessionUser(prev);
        if (!current) return nextUser;
        const sameUser =
          current.role === nextUser.role &&
          current.nom === nextUser.nom &&
          current.email === nextUser.email &&
          current.telephone === nextUser.telephone &&
          current.id === nextUser.id;
        return sameUser ? current : { ...current, ...nextUser };
      });
    } catch {
      // 401 is already handled globally.
    }
  }, []);

  useEffect(() => {
    setOnUnauthorized(handleLogout);

    let mounted = true;

    const bootstrap = async () => {
      try {
        const { user: sessionUser, token } = await getSession();
        const validSessionUser = normalizeSessionUser(sessionUser);

        if (mounted) {
          if (!validSessionUser) {
            await clearSession();
            setUser(null);
          } else {
            setUser(validSessionUser);
          }
        }

        if (token && validSessionUser) {
          await refreshUser();
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setReady(true);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [handleLogout, refreshUser]);

  useEffect(() => {
    if (!user) return;
    updateSessionUser(user).catch(() => {
      setUser(null);
    });
  }, [user]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshUser();
      }
    });
    return () => subscription.remove();
  }, [refreshUser]);

  if (!ready) return null;

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Tabs">
              {() => (
                <HomeTabs
                  user={user}
                  onLogout={handleLogout}
                  onUserUpdated={setUser}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Calculator" component={CalculatorScreen} />
            <Stack.Screen name="Devis" component={DevisScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="ChantierDetail">
              {({ route, navigation }) => (
                <ChantierDetailScreen
                  route={route}
                  navigation={navigation}
                  user={user}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="SaisieMesures">
              {({ route, navigation }) => (
                <SaisieMesuresScreen
                  route={route}
                  navigation={navigation}
                  user={user}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="AssistantIA" component={AssistantIAScreen} />
            <Stack.Screen name="Annuaire" component={AnnuaireScreen} />

            {normalizeSessionUser(user)?.role === "admin" && (
              <>
                <Stack.Screen name="Admin" component={AdminDashboardScreen} />
                <Stack.Screen name="AdminUsers">
                  {() => <AdminUsersScreen currentUser={user} />}
                </Stack.Screen>
                <Stack.Screen name="AdminDevis" component={AdminDevisScreen} />
                <Stack.Screen
                  name="AdminChantiers"
                  options={{ headerShown: true, title: "Chantiers", ...stackHeader }}
                >
                  {({ navigation }) => (
                    <AdminChantiersScreen navigation={navigation} user={user} />
                  )}
                </Stack.Screen>
                <Stack.Screen
                  name="AdminProducts"
                  component={AdminProductsScreen}
                />
                <Stack.Screen
                  name="AdminMissions"
                  component={AdminMissionsScreen}
                />
              </>
            )}

            <Stack.Screen name="OTPSetup" component={OTPSetupScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login">
              {({ navigation }) => (
                <LoginScreen navigation={navigation} onLogin={setUser} />
              )}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {({ navigation }) => <RegisterScreen navigation={navigation} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, fontsError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  if (!fontsLoaded && !fontsError) return null;

  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  );
}

const styles = StyleSheet.create({
  tabPill: {
    minWidth: 52,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabPillActive: { backgroundColor: COLORS.primarySoft },
});

