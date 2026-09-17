# BTT-LUX Mobile (React Native / Expo)

Application mobile officielle BTT-LUX (Begueni Timber Trading · Luxerboard).

## Fonctionnalités

- 🔐 **Authentification** : inscription avec OTP WhatsApp, connexion, 2FA
- 📦 **Catalogue** : liste des produits Luxerboard et prix
- 💳 **Paiement** : Mobile Money via Campay (Orange Money / MTN)
- 📋 **Missions** : missions technicien et suivi
- 🔔 **Notifications** et modules complémentaires

## Prérequis

- Node.js >= 18
- Expo CLI : `npm install -g expo-cli`
- L'application [Expo Go](https://expo.dev/client) sur votre téléphone (Android/iOS)

## Installation

```bash
cd mobile
npm install
```

## Configuration de l'URL de l'API

Editez `app.json` → `expo.extra.apiUrl` :

```json
"extra": {
  "apiUrl": "https://votre-backend-render.onrender.com"
}
```

En développement local :
```json
"extra": {
  "apiUrl": "http://192.168.1.X:5000"   // IP locale de votre machine
}
```

## Lancer l'application

```bash
npx expo start
```

Puis scannez le QR code avec **Expo Go** (Android) ou la caméra (iOS).

## Build de production

### Android (APK / AAB)
```bash
npx expo run:android          # build natif avec Android Studio
# ou via EAS (recommandé)
npx eas build -p android --profile production
```

### iOS
```bash
npx eas build -p ios --profile production
```

## Structure

```
mobile/
├── App.js                  # Navigation principale (Stack + Tabs)
├── app.json                # Configuration Expo & URL de l'API
├── src/
│   ├── services/
│   │   ├── api.js          # Client Axios avec token
│   │   └── auth.js         # Gestion de session (AsyncStorage)
│   └── screens/
│       ├── LoginScreen.js
│       ├── RegisterScreen.js
│       ├── HomeScreen.js
│       ├── CatalogueScreen.js
│       ├── PaiementScreen.js
│       ├── MissionsScreen.js
│       ├── ProfileScreen.js
│       └── SimpleScreen.js
```