import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Linking, Platform } from "react-native";

import api from "./api";
import { readToken } from "./auth";

// La route GET /api/devis/:id/pdf exige l'en-tête Authorization :
// un simple Linking.openURL est donc refusé (401). On télécharge le PDF
// avec le token, puis on le partage (ou on l'ouvre) localement.
const ERREURS_HTTP = {
  401: "Session expirée, reconnectez-vous",
  403: "Accès refusé à ce devis",
  404: "Devis introuvable",
};

const dossierCache = FileSystem.cacheDirectory || FileSystem.documentDirectory;

const supprimerSilencieusement = async (uri) => {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // le fichier temporaire sera purgé par le système
  }
};

export const telechargerDevisPDF = async (devisId, { partager = true } = {}) => {
  if (!dossierCache) {
    throw new Error("Stockage local indisponible sur cet appareil");
  }

  // Token via readToken() (SecureStore + repli AsyncStorage) : saveSession
  // migre vers SecureStore et supprime la cle legacy, donc
  // AsyncStorage.getItem("token") renverrait null.
  const token = await readToken();
  const url = `${api.defaults.baseURL}/devis/${devisId}/pdf`;
  const fileUri = `${dossierCache}devis-${devisId}-${Date.now()}.pdf`;

  const reponse = await FileSystem.downloadAsync(url, fileUri, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (reponse.status !== 200) {
    await supprimerSilencieusement(reponse.uri);
    throw new Error(
      ERREURS_HTTP[reponse.status] ||
        `Téléchargement impossible (HTTP ${reponse.status})`,
    );
  }

  if (!partager) {
    return { uri: reponse.uri, partage: false };
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(reponse.uri, {
      mimeType: "application/pdf",
      dialogTitle: `Devis #${devisId}`,
      UTI: "com.adobe.pdf",
    });
    return { uri: reponse.uri, partage: true };
  }

  // Repli (Android) : ouverture directe dans une application PDF
  if (Platform.OS === "android") {
    const contentUri = await FileSystem.getContentUriAsync(reponse.uri);
    if (await Linking.canOpenURL(contentUri)) {
      await Linking.openURL(contentUri);
      return { uri: reponse.uri, partage: false };
    }
  }

  throw new Error(
    "Aucune application PDF disponible pour ouvrir le devis",
  );
};

export default { telechargerDevisPDF };
