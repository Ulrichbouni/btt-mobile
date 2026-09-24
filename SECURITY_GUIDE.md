# 🔐 Guide de Sécurité Mobile - BTT-LUX

## Checklist de Sécurité React Native / Expo

### 🛡️ 1. Stockage Sécurisé des Données

**❌ À ÉVITER : AsyncStorage pour données sensibles**

```js
// NE JAMAIS stocker des tokens/passwords en clair
AsyncStorage.setItem('token', jwtToken); // ❌ DANGEREUX
```

**✅ UTILISER : Expo SecureStore**

```bash
npx expo install expo-secure-store
```

```js
import * as SecureStore from 'expo-secure-store';

// Stocker de manière sécurisée (keychain iOS / keystore Android)
await SecureStore.setItemAsync('userToken', jwtToken);

// Récupérer
const token = await SecureStore.getItemAsync('userToken');

// Supprimer
await SecureStore.deleteItemAsync('userToken');
```

**Migration recommandée dans `src/services/authService.js` :**

```js
import * as SecureStore from 'expo-secure-store';

export const AuthService = {
  async saveToken(token) {
    try {
      await SecureStore.setItemAsync('jwt_token', token);
    } catch (error) {
      console.error('Erreur sauvegarde token:', error);
    }
  },

  async getToken() {
    try {
      return await SecureStore.getItemAsync('jwt_token');
    } catch (error) {
      console.error('Erreur lecture token:', error);
      return null;
    }
  },

  async removeToken() {
    try {
      await SecureStore.deleteItemAsync('jwt_token');
    } catch (error) {
      console.error('Erreur suppression token:', error);
    }
  },
};
```

---

### 🔒 2. Sécurisation des Requêtes API

**Intercepteurs Axios avec refresh token :**

```js
// src/services/api.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: 'https://votre-api.com/api',
  timeout: 30000,
});

// Injection automatique du token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion des erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré : déconnecter
      await SecureStore.deleteItemAsync('jwt_token');
      // Navigation vers login
      // navigation.navigate('Login');
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### 🔐 3. Certificate Pinning (Production)

**Protection contre les attaques man-in-the-middle :**

```bash
npx expo install expo-constants
```

**Configuration dans `app.json` :**

```json
{
  "expo": {
    "android": {
      "config": {
        "networkSecurityConfig": "./network_security_config.xml"
      }
    },
    "ios": {
      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSPinnedDomains": {
            "votre-api.com": {
              "NSIncludesSubdomains": true,
              "NSPinnedLeafIdentities": [
                {
                  "SPKI-SHA256-BASE64": "HASH_DU_CERTIFICAT_ICI"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

**Android : `network_security_config.xml` :**

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">votre-api.com</domain>
    <pin-set expiration="2027-01-01">
      <pin digest="SHA-256">HASH_BASE64_DU_CERTIFICAT</pin>
    </pin-set>
  </domain-config>
</network-security-config>
```

---

### 🚫 4. Protection contre le Reverse Engineering

**Obfuscation du code (Hermes) :**

```json
// app.json
{
  "expo": {
    "jsEngine": "hermes",
    "android": {
      "enableProguardInReleaseBuilds": true,
      "enableShrinkResourcesInReleaseBuilds": true
    }
  }
}
```

**Ne JAMAIS inclure de secrets dans le code :**

```js
// ❌ DANGEREUX
const API_KEY = 'sk-prod-abc123xyz';

// ✅ Utiliser les variables d'environnement
import Constants from 'expo-constants';
const API_KEY = Constants.expoConfig.extra.apiKey;
```

**Configuration `app.json` :**

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://votre-api.com/api",
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

---

### 📱 5. Permissions Minimales

**Demander uniquement les permissions nécessaires :**

```js
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

// Demander la permission UNIQUEMENT quand nécessaire
const requestCameraPermission = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission caméra requise pour cette fonctionnalité');
  }
};

// Appeler au moment de l'action
<Button onPress={requestCameraPermission} title="Prendre une photo" />
```

**Android : `app.json` - Supprimer permissions inutilisées :**

```json
{
  "expo": {
    "android": {
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "BTT-LUX a besoin d'accéder à la caméra pour prendre des photos de chantier.",
        "NSPhotoLibraryUsageDescription": "BTT-LUX a besoin d'accéder aux photos pour les rapports de mission."
      }
    }
  }
}
```

---

### 🔍 6. Validation des Entrées

**Sanitiser toutes les données utilisateur :**

```js
// src/utils/validation.js
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Supprimer balises HTML
    .slice(0, 1000); // Limite de longueur
}

// Utilisation
const handleSubmit = () => {
  const cleanEmail = sanitizeInput(email);
  const cleanPassword = sanitizeInput(password);
  // ...
};
```

---

### 🚀 7. Updates Over-The-Air Sécurisés (EAS Update)

**Configuration EAS :**

```bash
npm install -g eas-cli
eas login
eas update:configure
```

**`eas.json` :**

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "production": {
      "channel": "production",
      "distribution": "store"
    },
    "preview": {
      "channel": "preview",
      "distribution": "internal"
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Push updates sécurisé :**

```bash
# Tester en preview
eas update --branch preview --message "Fix bug login"

# Déployer en production (après tests)
eas update --branch production --message "Security patch v1.0.1"
```

---

### 🔐 8. Biométrie (Touch ID / Face ID)

```bash
npx expo install expo-local-authentication
```

```js
import * as LocalAuthentication from 'expo-local-authentication';

async function authenticateUser() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
  if (!hasHardware || !isEnrolled) {
    // Fallback sur mot de passe
    return false;
  }
  
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authentifiez-vous pour accéder à BTT-LUX',
    fallbackLabel: 'Utiliser le mot de passe',
  });
  
  return result.success;
}

// Utilisation
const Login = () => {
  const handleBiometricLogin = async () => {
    const authenticated = await authenticateUser();
    if (authenticated) {
      const token = await SecureStore.getItemAsync('jwt_token');
      // Connexion automatique
    }
  };
  
  return (
    <Button 
      title="Connexion rapide" 
      onPress={handleBiometricLogin} 
    />
  );
};
```

---

### 📊 9. Logging Sécurisé

**Ne JAMAIS logger de données sensibles :**

```js
// ❌ DANGEREUX
console.log('Login:', email, password); // ❌
console.log('Token:', jwtToken); // ❌

// ✅ Logs sûrs
console.log('Login attempt for user'); // ✅
console.log('Token length:', jwtToken?.length); // ✅
```

**En production, désactiver tous les logs :**

```js
// App.js
if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}
```

---

### 🚨 10. Détection de Jailbreak/Root

```bash
npx expo install expo-device
```

```js
import * as Device from 'expo-device';

async function checkDeviceSecurity() {
  const isRooted = await Device.isRootedExperimentalAsync();
  
  if (isRooted) {
    alert('Appareil rooté/jailbreaké détecté. L\'application ne peut pas fonctionner pour des raisons de sécurité.');
    // Bloquer l'accès ou logger l'événement
    return false;
  }
  
  return true;
}
```

---

### ✅ Checklist de Déploiement

- [ ] Tous les tokens/secrets stockés dans SecureStore
- [ ] AsyncStorage utilisé uniquement pour données non sensibles
- [ ] Obfuscation activée (Hermes + ProGuard)
- [ ] Certificate pinning configuré (production)
- [ ] Permissions minimales dans `app.json`
- [ ] Validation des entrées utilisateur
- [ ] Logs de production désactivés
- [ ] Détection jailbreak/root activée
- [ ] EAS Update configuré
- [ ] Tests sur devices physiques (pas seulement simulateur)

---

### 📚 Ressources

- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [Expo Security Guide](https://docs.expo.dev/guides/security/)
- [React Native Security Best Practices](https://reactnative.dev/docs/security)

---

**Dernière mise à jour :** 2026-09-24
