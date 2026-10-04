// Conversion tolérante pour les champs numériques saisis en français :
// accepte la virgule comme séparateur décimal.
// Utilisé par CalculatorScreen, DevisScreen, SaisieMesuresScreen.
export const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const isValidDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(value).trim());
