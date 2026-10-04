import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import fr from "./locales/fr";
import en from "./locales/en";

const LANG_KEY = "btt_lux_lang";
const DICTS = { fr, en };
const DEFAULT_LANG = "fr";

const lookup = (dict, key) =>
  String(key)
    .split(".")
    .reduce(
      (acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined),
      dict,
    );

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANG);

  // Restaure la langue persistée (défaut : français).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANG_KEY);
        if (active && stored && DICTS[stored]) setLangState(stored);
      } catch {
        // stockage indisponible : on reste sur le défaut
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setLang = useCallback(async (next) => {
    const value = DICTS[next] ? next : DEFAULT_LANG;
    setLangState(value);
    try {
      await AsyncStorage.setItem(LANG_KEY, value);
    } catch {
      // la langue reste active en mémoire même sans stockage
    }
  }, []);

  // t("assistant.faqTitle") ou t("annuaire.yearsExp", { n: 8 })
  const t = useCallback(
    (key, vars) => {
      let str = lookup(DICTS[lang], key);
      if (str === undefined) str = lookup(DICTS[DEFAULT_LANG], key);
      if (str === undefined) return key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          str = String(str).split(`{${name}}`).join(String(value));
        }
      }
      return str;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n doit être utilisé sous <I18nProvider>");
  }
  return ctx;
}
