import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { translations, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "../i18n/translations";

const STORAGE_KEY = "lancherix-lang";

/**
 * Looks at navigator.languages (in priority order) and returns the first
 * one we have a translation file for. Falls back to DEFAULT_LANGUAGE.
 */
function detectSystemLanguage() {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE;

  const candidates = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language].filter(Boolean);

  for (const candidate of candidates) {
    const code = candidate.slice(0, 2).toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(code)) return code;
  }

  return DEFAULT_LANGUAGE;
}

function getInitialLanguage() {
  try {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
  } catch {
    // localStorage may be unavailable (e.g. private browsing) — ignore and fall through
  }
  return detectSystemLanguage();
}

function getNested(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLanguage);

  // Keep in sync if the user changes their OS/browser language while the app is open
  useEffect(() => {
    const handleLanguageChange = () => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored && SUPPORTED_LANGUAGES.includes(stored)) return; // explicit user choice wins
      } catch {
        // ignore
      }
      setLangState(detectSystemLanguage());
    };
    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, []);

  const setLang = useCallback((code) => {
    if (!SUPPORTED_LANGUAGES.includes(code)) return;
    setLangState(code);
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key, vars) => {
      const dict = translations[lang] || translations[DEFAULT_LANGUAGE];
      let value = getNested(dict, key);
      if (value === undefined) value = getNested(translations[DEFAULT_LANGUAGE], key);
      if (value === undefined) return key; // last resort: show the key so missing strings are obvious

      if (vars) {
        Object.entries(vars).forEach(([varKey, varValue]) => {
          value = value.replaceAll(`{{${varKey}}}`, varValue);
        });
      }
      return value;
    },
    [lang]
  );

  // Category names are user-editable data, not fixed UI strings — only the
  // built-in seed categories (Food, Transport, ...) have translations.
  // Anything else (a category the user typed themselves) is shown as-is.
  const tCategory = useCallback(
    (name) => {
      const dict = translations[lang] || translations[DEFAULT_LANGUAGE];
      return dict.categories?.[name] ?? name;
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, t, tCategory, supportedLanguages: SUPPORTED_LANGUAGES }),
    [lang, setLang, t, tCategory]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used inside <I18nProvider>");
  return ctx;
}