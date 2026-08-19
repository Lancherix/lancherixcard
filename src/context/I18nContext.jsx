import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { translations, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "../i18n/translations";
import { AppContext } from "./AppContext";

const STORAGE_KEY = "lancherix-lang";

/**
 * Looks at navigator.languages (in priority order) and returns the first
 * one we have a translation file for. Falls back to DEFAULT_LANGUAGE.
 * This is now only a fallback for when we have no account-level language
 * to go on (brand new profile, field missing, profile not loaded yet).
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

function getStoredLanguage() {
  try {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
  } catch {
    // localStorage may be unavailable (e.g. private browsing) — ignore and fall through
  }
  return null;
}

// First-paint guess, before the profile has had a chance to load:
// explicit past choice > system language. Once the profile arrives,
// the provider below may override this with the account's language.
function getInitialLanguage() {
  return getStoredLanguage() ?? detectSystemLanguage();
}

function getNested(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLanguage);
  const [hasExplicitChoice, setHasExplicitChoice] = useState(() => Boolean(getStoredLanguage()));

  // AppContext may not be mounted (or I18nProvider may render outside its
  // tree in some setups) — guard rather than throw, and just skip
  // profile-based detection in that case.
  const appCtx = useContext(AppContext);

  // ASSUMPTION: the /me response (state.profile) has a `language` field
  // holding a SUPPORTED_LANGUAGES code (e.g. "ru"). Adjust this line if
  // your backend stores it under a different key.
  const profileLanguage = appCtx?.state?.profile?.language;

  // Once the user's profile loads, prefer whatever language is on their
  // account over the browser/system guess used for first paint — but never
  // stomp an explicit choice the user already made via setLang.
  useEffect(() => {
    if (hasExplicitChoice) return;
    if (profileLanguage && SUPPORTED_LANGUAGES.includes(profileLanguage)) {
      setLangState(profileLanguage);
    }
  }, [profileLanguage, hasExplicitChoice]);

  // Keep in sync if the user changes their OS/browser language while the
  // app is open — only relevant when we have neither an explicit choice
  // nor an account language to go on.
  useEffect(() => {
    const handleLanguageChange = () => {
      if (hasExplicitChoice) return;
      if (profileLanguage && SUPPORTED_LANGUAGES.includes(profileLanguage)) return;
      setLangState(detectSystemLanguage());
    };
    window.addEventListener("languagechange", handleLanguageChange);
    return () => window.removeEventListener("languagechange", handleLanguageChange);
  }, [hasExplicitChoice, profileLanguage]);

  const setLang = useCallback((code) => {
    if (!SUPPORTED_LANGUAGES.includes(code)) return;
    setLangState(code);
    setHasExplicitChoice(true);
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