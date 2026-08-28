import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import { getSession } from './src/services/auth';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import PaiementScreen from './src/screens/PaiementScreen';
import MissionsScreen from './src/screens/MissionsScreen';
import CatalogueScreen from './src/screens/CatalogueScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SimpleScreen from './src/screens/SimpleScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const BROWSER_SCREENS = {
  Calculator: { title: '🧮 Calculateur' },
  Devis: { title: '📄 Demande de devis' },
  Notifications: { title: '🔔 Notifications' },
};

function HomeTabs({ user, onLogout }) {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#b45309' }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Accueil', tabBarIcon: () => null }} />
      <Tab.Screen name="Catalogue" component={CatalogueScreen} options={{ tabBarLabel: 'Catalogue' }} />
      <Tab.Screen name="Paiement" component={PaiementScreen} options={{ tabBarLabel: 'Paiement' }} />
      <Tab.Screen name="Missions" component={MissionsScreen} options={{ tabBarLabel: 'Missions' }} />
      <Tab.Screen name="Profil">
        {() => <ProfileScreen user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  React.useEffect(() => {
    (async () => {
      const session = await getSession();
      setUser(session.user);
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Tabs">
              {() => <HomeTabs user={user} onLogout={() => setUser(null)} />}
            </Stack.Screen>
            {Object.entries(BROWSER_SCREENS).map(([name, params]) => (
              <Stack.Screen key={name} name={name}>
                {({ route }) => (
                  <SimpleScreen
                    title={route?.params?.title || params.title}
                  />
                )}
              </Stack.Screen>
            ))}
          </>
        ) : (
          <>
            <Stack.Screen name="Login">
              {({ navigation }) => <LoginScreen navigation={navigation} onLogin={setUser} />}
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