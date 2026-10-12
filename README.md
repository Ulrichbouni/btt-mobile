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

L'URL de base est résolue dans cet ordre de priorité :

1. **Variable d'environnement `EXPO_PUBLIC_API_URL`** (recommandé, voir `.env.example`).
   Pratique pour les builds et la CI : `EXPO_PUBLIC_API_URL=https://... npm start`.
2. **Sur le web** : le proxy local `http://localhost:3002/api`. Un backend
   distant sans en-têtes CORS est injoignable depuis un navigateur (c'est le
   cas du backend Render), le proxy les ajoute donc localement.
3. **Sur natif (Android/iOS)** : `app.json` → `expo.extra.apiUrl`.

```json
"extra": {
  "apiUrl": "https://votre-backend-render.onrender.com"
}
```

En développement local (appareil physique) :
```json
"extra": {
  "apiUrl": "http://192.168.1.X:5000"   // IP locale de votre machine
}
```

## Lancer l'application (natif / Expo Go)

```bash
npm start            # échoue clairement si Metro (8081) est occupé
npm start -- --kill  # libère d'abord le port occupé
```

Puis scannez le QR code avec **Expo Go** (Android) ou la caméra (iOS).

`npm start` enveloppe `expo start` et corrige les deux pièges décrits dans la
section *Serveur web de développement* ci-dessous (prompt de port bloquant et
appel réseau vers `api.expo.dev`). Le port de Metro se règle avec
`RCT_METRO_PORT` (ou `EXPO_METRO_PORT`).

## Raccourci de connexion en développement

Le mode développement (`__DEV__`) expose un bouton « Connexion admin (dev) »
sur l'écran de connexion, qui ouvre une session administrateur réelle sans
saisie manuelle. Les identifiants utilisés sont tirés des variables
`EXPO_PUBLIC_DEV_ADMIN_EMAIL` et `EXPO_PUBLIC_DEV_ADMIN_PASSWORD`
(voir `.env.example`) ; à défaut, des valeurs de repli figées dans le code sont
utilisées.

**Ce raccourci n'existe pas dans une application publiée.** Le garde
`__DEV__` rend son rendu conditionnel ; lorsque `__DEV__` vaut `false` en
production, le composant, son code et les identifiants littéraux qui l'accompagnent
sont éliminés du bundle par le minifieur. Cette propriété est vérifiée, et non
supposée.

### Vérification de bundle (`npm run verify:prod-bundle`)

Ce script exporte la plateforme choisie en mode production (par défaut Android),
puis parcourt chaque fichier du bundle pour y rechercher les identifiants du
raccourci de développement. Les valeurs recherchées sont extraites automatiquement
depuis `src/components/DevQuickLogin.js` (et depuis `.env` lorsqu'il existe),
non recopiées en dur : si les valeurs de repli venaient à changer, le test les
suivrait et ne pourrait pas devenir silencieusement inopérant.

Deux garanties d'intégrité complètent le scan :

1. **Témoin positif obligatoire.** La chaîne `btt-backend-sgas.onrender.com`
   doit être présente dans le bundle. Sans elle, un export vide, tronqué ou un
   scan bugué serait compté comme un succès.
2. **Test d'auto-vérification (`--self-test`).** Le même script réexporte la
   même plateforme avec le drapeau `--dev`, où les identifiants sont réellement
   présents. S'il ne les détecte pas dans ce bundle, il n'y les aurait pas non
   plus en production, et le test de production serait vert à tort. Le mode
   `--self-test` répond donc à la question « ce contrôle prouve-t-il quelque
   chose ? ».

Le nom du composant (`DevQuickLogin`) n'est pas recherché, volontairement. Dans
un bundle Hermes, les chaînes sont stockées dans une table compactée sans
séparateur ; l'identifiant `DevQuickLogin` s'y confond avec la clé i18n légitime
`auth.devQuickLogin`, qui elle doit être livrée. Une recherche sur ce nom
produirait un faux positif systématique.

```bash
npm run verify:prod-bundle                   # export android production + vérification
npm run verify:prod-bundle -- --platform web
npm run verify:prod-bundle -- --self-test    # prouve que le détecteur est vivant
npm run verify:prod-bundle -- --scan <chemin> # vérifie un bundle existant
```

### Vérification de l'APK release (`npm run verify:release`)

C'est le contrôle le plus fort, car il porte sur l'artefact réellement distribué
et installé, pas sur un export de développement. Il ouvre l'APK release situé à
`android/app/build/outputs/apk/release/app-release.apk` et vérifie que le bundle
Android livré ne contient aucun identifiant du raccourci — même en bytecode.

Pour exécuter ce contrôle, l'APK doit avoir été produit par le pipeline de build
(le fichier `release-final.exit.txt` doit contenir `0`). Le script exige de
plus :

- la présence du bundle `assets/index.android.bundle` dans l'APK (un APK debug
  ou un artefact non standard est rejeté) ;
- l'URL de l'API Render `https://btt-backend-sgas.onrender.com/api` dans
  `assets/app.config` ;
- la signature de l'APK (via `apksigner`) ;
- le numéro de version attendu (`versionCode='4' versionName='1.2'`) ;
- l'alignement 16 Ko des bibliothèques natives (`lib/arm64-v8a/*.so`).

Le résultat est écrit dans `release-verification.json`.

```bash
npm run verify:release
```

> Avant publication, l'ordre habituel est : `build:android` → `verify:release`.
> `verify:prod-bundle` couvre l'export statique ; `verify:release` couvre l'APK
> final. Les deux sont complémentaires, pas redondants.

## Serveur web de développement

`npm run web` démarre le serveur web (`expo start --web`) de façon fiable :

- **hors-ligne** (`EXPO_OFFLINE=1`) : sans accès à `api.expo.dev`, la validation
  des dépendances échoue et fait planter le CLI quelques secondes après le
  démarrage ;
- **contrôle des ports** : Expo résout les ports *avant* de lier le serveur. Si
  le port web (19006) est occupé, un prompt interactif bloque le démarrage sans
  rien afficher. Le script échoue alors immédiatement avec un message clair
  (PID fautif) au lieu de rester bloqué.

```bash
npm run web            # échoue clairement si 19006 ou 8081 sont occupés
npm run web -- --kill  # libère d'abord les ports occupés
```

Détail utile sous Windows : un `listen` sur `0.0.0.0:19006` réussit même si
`127.0.0.1:19006` est déjà pris. Les vérifications de port doivent donc se
faire par connexion TCP, pas par bind.

Le port web (**19006**) n'est pas configurable : le drapeau `--port` ne déplace
que Metro, et Expo ne lit aucune variable d'environnement pour le port web. Le
contrôle de port vérifie donc toujours 19006 — sinon il validerait un port libre
pendant qu'Expo se bat pour 19006 et meurt sur `Port 19006 not available`.

## Build de production

### Android (APK / AAB)
```bash
npx expo run:android          # build natif avec Android Studio
# ou via EAS (recommandé)
npx eas build -p android --profile production
```

Après le build, `npm run verify:release` valide l'APK avant publication.

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
```

> ⚠️ Le code applicatif maintenu est ce dossier `btt-mobile/`. Le dossier
> `mobile/` à la racine ne contient qu'un ancien build (APK) et ne doit pas
> être utilisé comme source.