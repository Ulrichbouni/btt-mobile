// Base de connaissances locale de l'Assistant IA — 100% hors ligne.
// Aucun appel réseau, aucune clé API : les réponses sont pré-écrites et
// la correspondance se fait par mots-clés (normalisation sans accents).

export const FAQ_ITEMS = [
  {
    id: "quantite",
    keywords: ["quantite", "quantité", "nombre", "panneaux", "calculer", "surface", "combien", "quantity", "calculate", "panels"],
    question: {
      fr: "Comment calculer la quantité de panneaux ?",
      en: "How do I calculate the number of panels?",
    },
    answer: {
      fr: "Multipliez la longueur par la largeur de chaque surface, ajoutez 10 % de marge pour les découpes, puis divisez par la surface d'un panneau (2,88 m² en 2400 × 1200 mm). Le calculateur de l'application fait ce calcul pour vous.",
      en: "Multiply the length by the width of each surface, add a 10% cutting margin, then divide by one panel area (2.88 m² for 2400 × 1200 mm). The in-app calculator does this for you.",
    },
  },
  {
    id: "epaisseur",
    keywords: ["epaisseur", "épaisseur", "facade", "façade", "exterieur", "extérieur", "10mm", "12mm", "thickness", "facade"],
    question: {
      fr: "Quelle épaisseur pour une façade extérieure ?",
      en: "Which thickness for an exterior facade?",
    },
    answer: {
      fr: "Pour une façade extérieure, privilégiez le 10 mm (zones humides) ou le 12 mm (façades exposées : meilleur maintien et isolation). Le 8 mm reste réservé aux cloisons intérieures.",
      en: "For an exterior facade, prefer 10 mm (humid areas) or 12 mm (exposed facades: better support and insulation). 8 mm is for interior partitions only.",
    },
  },
  {
    id: "ossature",
    keywords: ["fixation", "ossature", "rail", "montant", "vis", "pose", "frame", "screws", "install"],
    question: {
      fr: "Comment fixer les panneaux (ossature, vis) ?",
      en: "How do I fix the panels (frame, screws)?",
    },
    answer: {
      fr: "Utilisez une ossature métal 48 mm (rails et montants) avec un entraxe de 60 cm, et des vis autoperceuses 3,5 × 25 tous les 30 cm. Les accessoires sont disponibles dans le catalogue.",
      en: "Use a 48 mm metal frame (rails and studs) at 60 cm spacing, with 3.5 × 25 self-drilling screws every 30 cm. Accessories are available in the catalogue.",
    },
  },
  {
    id: "resistance",
    keywords: ["eau", "humidite", "humidité", "feu", "resistance", "résistance", "intemperies", "intempéries", "water", "fire"],
    question: {
      fr: "Les panneaux résistent-ils à l'eau et au feu ?",
      en: "Are the panels water and fire resistant?",
    },
    answer: {
      fr: "Oui : les panneaux Luxerboard résistent à l'eau, à l'humidité et au feu (classification A2-s1, d0), sans déformation en milieu humide. Idéaux pour salles de bain et façades.",
      en: "Yes: Luxerboard panels resist water, humidity and fire (class A2-s1, d0) with no deformation in damp environments. Ideal for bathrooms and facades.",
    },
  },
  {
    id: "entretien",
    keywords: ["entretien", "nettoyage", "peinture", "finition", "maintenance", "cleaning", "paint"],
    question: {
      fr: "Quel entretien pour le fibrociment ?",
      en: "What maintenance does fibre cement need?",
    },
    answer: {
      fr: "Un simple nettoyage à l'eau savonneuse suffit. Aucun traitement annuel n'est nécessaire : la peinture de finition est optionnelle, le fibrociment brut est conçu pour durer.",
      en: "A simple wash with soapy water is enough. No yearly treatment is needed: the finishing coat is optional, raw fibre cement is built to last.",
    },
  },
  {
    id: "livraison",
    keywords: ["delai", "délai", "livraison", "commande", "stock", "douala", "yaounde", "delivery", "order"],
    question: {
      fr: "Quels sont les délais de livraison ?",
      en: "What are the delivery times?",
    },
    answer: {
      fr: "Les commandes validées sont livrées en 48 à 72 h à Douala et Yaoundé, et sous 5 jours ouvrés pour les autres villes. L'état du stock est visible dans le catalogue.",
      en: "Validated orders are delivered within 48–72 h in Douala and Yaoundé, and within 5 business days elsewhere. Stock status is visible in the catalogue.",
    },
  },
];
