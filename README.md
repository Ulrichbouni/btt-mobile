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
btt-mobile/
├── App.js                  # Navigation principale (Stack + Tabs par rôle)
├── app.json                # Configuration Expo & URL de l'API
├── src/
│   ├── services/
│   │   ├── api.js          # Client Axios avec token
│   │   ├── auth.js         # Gestion de session (AsyncStorage + mise à jour du rôle)
│   │   └── pdf.js          # Devis PDF : téléchargement authentifié + partage
│   └── screens/
│       ├── LoginScreen.js
│       ├── RegisterScreen.js
│       ├── HomeScreen.js           # Raccourcis filtrés par rôle
│       ├── CatalogueScreen.js
│       ├── CalculatorScreen.js     # POST /calculator/estimer
│       ├── DevisScreen.js          # POST /devis, mes devis, PDF, paiement
│       ├── NotificationsScreen.js  # GET /notifications + PATCH /:id/lu
│       ├── MesChantiersScreen.js   # Suivi chantiers (client/technicien/admin)
│       ├── ChantierDetailScreen.js # Photos + avancement (admin/technicien assigné)
│       ├── MissionsScreen.js       # Missions technicien (+ saisie mesures)
│       ├── SaisieMesuresScreen.js  # POST /missions/:id/mesures
│       ├── PaiementScreen.js
│       ├── ProfileScreen.js
│       └── SimpleScreen.js         # Écran générique (non branché)
```

> ⚠️ Le code applicatif maintenu est ce dossier `btt-mobile/`. Le dossier
> `mobile/` à la racine ne contient qu'un ancien build (APK) et ne doit pas
> être utilisé comme source.