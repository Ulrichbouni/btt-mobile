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

// Thème de navigation aux couleurs du design system (fond crème, Poppins).
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

// En-têtes natifs des écrans de pile (thématisés ; restyle complet écran par
// écran dans les passes suivantes).
const stackHeader = {
  headerStyle: { backgroundColor: COLORS.bg },
  headerShadowVisible: false,
  headerTintColor: COLORS.ink,
  headerTitleStyle: { fontFamily: FONTS.bold, fontSize: 17 },
};

// Icône d'onglet : pilule beige derrière l'icône quand l'onglet est actif.
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

// Onglets par rôle :
// - client : Accueil, Catalogue, Mes Chantiers, Paiement, Profil
// - technicien / admin : Accueil, Catalogue, Chantiers, Missions, Paiement, Profil
// L'onglet "Missions" n'est jamais exposé aux clients (le backend répond 403).
// Paiement reste disponible pour tous (chacun peut avoir ses propres devis).
function HomeTabs({ user, onLogout, onUserUpdated }) {
  const { t } = useI18n();
  const role = user?.role || "client";
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
        {({ navigation }) => <HomeScreen navigation={navigation} user={user} />}
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
          <MesChantiersScreen navigation={navigation} user={user} />
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
            <MissionsScreen navigation={navigation} user={user} />
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
            user={user}
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
    await clearSession();
    setUser(null);
  }, []);

  // Relit le rôle courant en base (le backend ignore le role du JWT).
  // Indispensable pour qu'une promotion client -> technicien soit visible
  // sans reconnexion : la navigation est reconstruite dès que le rôle change.
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      if (!data?.role) return;
      setUser((prev) => {
        if (!prev) return prev;
        if (
          prev.role === data.role &&
          prev.nom === data.nom &&
          prev.email === data.email &&
          prev.telephone === data.telephone
        ) {
          return prev;
        }
        return { ...prev, ...data };
      });
    } catch {
      // Un 401 est déjà traité globalement par l'intercepteur (déconnexion).
    }
  }, []);

  useEffect(() => {
    setOnUnauthorized(handleLogout);

    let mounted = true;

    const bootstrap = async () => {
      try {
        const { user: sessionUser, token } = await getSession();
        if (mounted) setUser(sessionUser || null);
        if (token) refreshUser();
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

  // Toute évolution de l'utilisateur (promotion, profil) est persistée.
  useEffect(() => {
    if (!user) return;
    updateSessionUser(user);
  }, [user]);

  // Au retour au premier plan : resynchronise le rôle avec le backend.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshUser();
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

            <Stack.Screen
              name="Calculator"
              component={CalculatorScreen}
              options={{ headerShown: true, title: "🧮 Calculateur", ...stackHeader }}
            />
            <Stack.Screen
              name="Devis"
              component={DevisScreen}
              options={{ headerShown: true, title: "📄 Demande de devis", ...stackHeader }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ headerShown: true, title: "🔔 Notifications", ...stackHeader }}
            />
            <Stack.Screen
              name="ChantierDetail"
              options={{ headerShown: true, title: "Chantier", ...stackHeader }}
            >
              {({ route }) => (
                <ChantierDetailScreen route={route} user={user} />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="SaisieMesures"
              options={{ headerShown: true, title: "📏 Saisie des mesures", ...stackHeader }}
            >
              {({ route }) => <SaisieMesuresScreen route={route} user={user} />}
            </Stack.Screen>

            <Stack.Screen name="AssistantIA" component={AssistantIAScreen} />
            <Stack.Screen name="Annuaire" component={AnnuaireScreen} />

            {user.role === "admin" && (
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
            {/* Hors session : accueil « Construire Durable » puis connexion. */}
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
  // Poppins chargée avant tout rendu ; en cas d'échec (offline, store), on
  // continue : React Native retombe nativement sur la police système.
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
