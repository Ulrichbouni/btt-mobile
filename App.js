import React, { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";

import {
  getSession,
  clearSession,
  updateSessionUser,
} from "./src/services/auth";
import api, { setOnUnauthorized } from "./src/services/api";

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

// Onglets par rôle :
// - client : Accueil, Catalogue, Mes Chantiers, Paiement, Profil
// - technicien / admin : Accueil, Catalogue, Chantiers, Missions, Paiement, Profil
// L'onglet "Missions" n'est jamais exposé aux clients (le backend répond 403).
// Paiement reste disponible pour tous (chacun peut avoir ses propres devis).
function HomeTabs({ user, onLogout, onUserUpdated }) {
  const role = user?.role || "client";
  const isClient = role === "client";

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#b45309",
        tabBarStyle: { height: 62, paddingBottom: 8 },
      }}
    >
      <Tab.Screen name="Home" options={{ tabBarLabel: "Accueil" }}>
        {({ navigation }) => <HomeScreen navigation={navigation} user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Catalogue"
        component={CatalogueScreen}
        options={{ tabBarLabel: "Catalogue" }}
      />
      <Tab.Screen
        name="MesChantiers"
        options={{ tabBarLabel: isClient ? "Mes Chantiers" : "Chantiers" }}
      >
        {({ navigation }) => (
          <MesChantiersScreen navigation={navigation} user={user} />
        )}
      </Tab.Screen>
      {!isClient && (
        <Tab.Screen name="Missions" options={{ tabBarLabel: "Missions" }}>
          {({ navigation }) => (
            <MissionsScreen navigation={navigation} user={user} />
          )}
        </Tab.Screen>
      )}
      <Tab.Screen
        name="Paiement"
        component={PaiementScreen}
        options={{ tabBarLabel: "Paiement" }}
      />
      <Tab.Screen name="Profil">
        {() => (
          <ProfileScreen
            user={user}
            onLogout={onLogout}
            onUserUpdated={onUserUpdated}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
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
    <NavigationContainer>
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
              options={{ headerShown: true, title: "🧮 Calculateur" }}
            />
            <Stack.Screen
              name="Devis"
              component={DevisScreen}
              options={{ headerShown: true, title: "📄 Demande de devis" }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ headerShown: true, title: "🔔 Notifications" }}
            />
            <Stack.Screen
              name="ChantierDetail"
              options={{ headerShown: true, title: "Chantier" }}
            >
              {({ route }) => (
                <ChantierDetailScreen route={route} user={user} />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="SaisieMesures"
              options={{ headerShown: true, title: "📏 Saisie des mesures" }}
            >
              {({ route }) => <SaisieMesuresScreen route={route} user={user} />}
            </Stack.Screen>

            {user.role === "admin" && (
              <>
                <Stack.Screen name="Admin" component={AdminDashboardScreen} />
                <Stack.Screen name="AdminUsers">
                  {() => <AdminUsersScreen currentUser={user} />}
                </Stack.Screen>
                <Stack.Screen name="AdminDevis" component={AdminDevisScreen} />
                <Stack.Screen
                  name="AdminChantiers"
                  options={{ headerShown: true, title: "Chantiers" }}
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
