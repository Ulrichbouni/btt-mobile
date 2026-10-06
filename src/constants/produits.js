// Valeurs produit partagées entre les écrans (espace admin + calculatrice).
// Toute nouvelle liste canonique (catégories métier, statuts…) doit vivre ici
// plutôt qu'en dur dans un écran, pour que les écrans restent cohérents.
//
// "" => laisser le backend suggérer l'épaisseur selon le type de bâtiment
// (utilisé par la calculatrice ; l'admin n'offre que les valeurs explicites,
// d'où le .filter(Boolean) côté formulaire produits).
export const EPAISSEURS = ["", "8mm", "10mm", "12mm", "14mm"];
