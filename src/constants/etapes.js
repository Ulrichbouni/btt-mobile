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

// Icônes affichées dans la pastille de l'étape en cours.
export const ETAPES_ICONS = [
  "document-text-outline",
  "search-outline",
  "checkmark-circle-outline",
  "cube-outline",
  "construct-outline",
  "ribbon-outline",
];

// Construit les étapes de la frise (composant Timeline) à partir de l'étape
// courante du chantier. `names`/`descs` peuvent être traduits (fr/en).
export const buildTimelineSteps = ({ etape, names, descs }) => {
  const labels = Array.isArray(names) && names.length ? names : ETAPES;
  const descriptions = Array.isArray(descs) ? descs : [];
  const current = ETAPES.indexOf(etape);

  return labels.map((label, index) => ({
    title: label,
    description: descriptions[index],
    icon: ETAPES_ICONS[index],
    state:
      current < 0
        ? "upcoming"
        : index < current
          ? "done"
          : index === current
            ? "current"
            : "upcoming",
  }));
};
