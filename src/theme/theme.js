// Design system BTT-LUX — palette crème / brun / vert des maquettes.
// Toute l'interface consomme ces tokens : jamais de couleur en dur dans les écrans.

export const COLORS = {
  bg: "#F2EDE4", // fond crème général
  surface: "#FFFFFF", // cartes blanches
  field: "#F1EAE0", // champs de formulaire beiges
  border: "#E7DECD",
  borderStrong: "#D9CCB8",

  primary: "#8B5E3C", // brun principal (boutons, logo)
  primaryDark: "#6E4526",
  primarySoft: "#EFE3D3", // pilule active des onglets, avatar

  ink: "#3E2A1F", // titres brun très foncé
  text: "#574436",
  muted: "#8A7A6D",
  mutedLight: "#BCAF9F",
  onPrimary: "#FFFFFF",

  green: "#4E7A57",
  greenDark: "#33593D",
  greenSoft: "#DCEAD9",
  greenBright: "#8FC79B", // accent « Durable » sur fond brun

  orange: "#C97B3F",
  orangeSoft: "#F8E7D4",

  blue: "#3B6FB5",
  blueSoft: "#DCE8F7",

  red: "#C0392B",
  redSoft: "#F7DCD8",

  yellow: "#D9A521",
  yellowSoft: "#FBF3D9",

  // Tuiles d'icônes des cartes d'actions rapides
  tileBeige: "#E9DCC8",
  tileGreen: "#D8EBDC",
  tileBlue: "#D3E2F4",
  tileYellow: "#F5E4A8",
  tilePurple: "#E2D9F5",
  tileBrown: "#E4D4C1",

  whatsapp: "#25B34B",
};

export const RADII = { sm: 10, md: 16, lg: 24, xl: 28, pill: 999 };

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

// Graisses Poppins chargées dans App.js.
// Si le chargement échoue, React Native retombe nativement sur la police système.
export const FONTS = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semiBold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
  extraBold: "Poppins_800ExtraBold",
};

export const SHADOW = {
  card: {
    shadowColor: "#5C4632",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  fab: {
    shadowColor: "#3E2A1F",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};

// Tuiles d'icônes colorées (actions rapides, en-têtes de section).
export const TILE_TONES = {
  beige: { bg: COLORS.tileBeige, fg: COLORS.primaryDark },
  green: { bg: COLORS.tileGreen, fg: COLORS.greenDark },
  blue: { bg: COLORS.tileBlue, fg: "#2B5687" },
  yellow: { bg: COLORS.tileYellow, fg: "#8A6A14" },
  purple: { bg: COLORS.tilePurple, fg: "#5B3E9B" },
  brown: { bg: COLORS.primary, fg: "#FFFFFF" },
};

// Pilules de statut : fond doux + texte foncé assorti (ou « solid » = plein).
export const STATUS_TONES = {
  success: { bg: COLORS.greenSoft, fg: COLORS.greenDark },
  warning: { bg: COLORS.orangeSoft, fg: "#9A5A24" },
  info: { bg: COLORS.blueSoft, fg: "#2B5687" },
  danger: { bg: COLORS.redSoft, fg: COLORS.red },
  neutral: { bg: COLORS.tileBeige, fg: COLORS.primaryDark },
  solid: { bg: COLORS.green, fg: "#FFFFFF" },
};

// Séparateur de milliers déterministe (Hermes-safe) : 15000 -> "15 000 XAF"
export const formatXAF = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const int = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${int} XAF`;
};
