// Lecture défensive des produits du catalogue : on n'affiche un statut que
// s'il est réellement fourni par le backend (jamais de badge inventé).
// Le catalogue mobile n'utilise aujourd'hui que nom / epaisseur / categorie /
// prix_ttc ; si le backend expose un jour stock/badge, l'UI suivra sans
// modification.

const BADGES_CONNUS = [
  "bestseller",
  "nouveau",
  "rupture",
  "en_stock",
  "promo",
];

const firstDefined = (...values) =>
  values.find((v) => v !== undefined && v !== null);

// Retourne { badge, rupture, hasStock } :
// - badge : clé de statut reconnue à afficher en pilule, ou null
// - rupture : rupture de stock explicite
// - hasStock : une information de stock existe (sinon on n'affiche rien)
export const productStatus = (produit) => {
  if (!produit || typeof produit !== "object") {
    return { badge: null, rupture: false, hasStock: false };
  }

  const stock = firstDefined(
    produit.stock,
    produit.quantite,
    produit.qte,
  );
  const dispo = firstDefined(
    produit.en_stock,
    produit.disponible,
    produit.dispo,
  );

  const rupture =
    produit.rupture === true ||
    dispo === false ||
    (stock !== undefined && Number(stock) === 0);

  const brut = firstDefined(produit.badge, produit.etiquette, produit.statut);
  let badge =
    typeof brut === "string" && BADGES_CONNUS.includes(brut.toLowerCase())
      ? brut.toLowerCase()
      : null;

  if (!badge && rupture) badge = "rupture";
  if (badge === "rupture") {
    return { badge, rupture: true, hasStock: true };
  }
  if (badge && badge !== "en_stock") {
    return { badge, rupture: false, hasStock: true };
  }
  if (badge === "en_stock" || dispo === true || stock !== undefined) {
    return {
      badge: rupture ? "rupture" : "en_stock",
      rupture,
      hasStock: true,
    };
  }

  return { badge: null, rupture: false, hasStock: false };
};

export default { productStatus };
