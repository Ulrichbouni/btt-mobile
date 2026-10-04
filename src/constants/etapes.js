// Étapes du cycle de vie d'un chantier — partagées entre les 3 écrans
// qui les affichent (Admin, Détail, MesChantiers).
export const ETAPES = [
  "Devis reçu",
  "Visite technique",
  "Commande validée",
  "Livraison",
  "Pose en cours",
  "Chantier terminé",
];

export const progressionPourcent = (etapeActuelle) => {
  const idx = ETAPES.indexOf(etapeActuelle);
  return idx >= 0 ? ((idx + 1) / ETAPES.length) * 100 : 0;
};

export const prochaineEtape = (etapeActuelle) => {
  const idx = ETAPES.indexOf(etapeActuelle);
  if (idx < 0 || idx >= ETAPES.length - 1) return null;
  return ETAPES[idx + 1];
};
