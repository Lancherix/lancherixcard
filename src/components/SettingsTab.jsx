import { useState } from "react";
import { useAppData } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import ChangeCurrencyModal from "./ChangeCurrencyModal";
import "./SettingsTab.css";

/* Reuses the same modal shell pattern as DashboardWidgets.js so the
   currency picker looks/behaves like every other modal in the app. */
function ModalShell({ title, onClose, children }) {
  return (
    <div className="cal-modal-backdrop" onClick={onClose}>
      <div className="cal-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="cal-modal-header">
          <span className="cal-modal-title">{title}</span>
          <button className="cal-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="cal-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- LEAF 1: Personal information ----------------
   NOTE: there's no `profile` field on AppContext yet, so this column
   holds its own local mock state. Swap the useState default + the
   handleSave body for real context/API calls once a profile endpoint
   exists (e.g. `updateProfile` from useAppData()). */

const MOCK_PROFILE = {
  fullName: "Alex Morgan",
  username: "alexmorgan",
  email: "alex.morgan@example.com",
};

export function PersonalInfoColumn() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [draft, setDraft] = useState(MOCK_PROFILE);
  const [editing, setEditing] = useState(false);

  const isValid = draft.fullName.trim() !== "" && draft.username.trim() !== "" && draft.email.trim() !== "";

  const startEditing = () => {
    setDraft(profile);
    setEditing(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isValid) return;
    // TODO: replace with a real persistence call once available
    setProfile(draft);
    setEditing(false);
  };

  const initials = profile.fullName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="leaf-fill settings-panel">
      <div className="dw-col-header">
        <h3 className="dw-heading">{t("settings.personalInfo")}</h3>
        {!editing && (
          <button className="dw-add-btn dw-add-btn-neutral" onClick={startEditing}>
            {t("common.edit")}
          </button>
        )}
      </div>

      <div className="settings-profile-head">
        <span className="settings-avatar">{initials}</span>
        <div className="settings-profile-head-text">
          <span className="settings-profile-name">{profile.fullName}</span>
          <span className="settings-profile-username">@{profile.username}</span>
        </div>
      </div>

      {editing ? (
        <form className="dw-form settings-form" onSubmit={handleSave}>
          <label className="dw-field">
            <span className="dw-label">{t("settings.fullName")}</span>
            <input
              type="text"
              className="dw-input"
              value={draft.fullName}
              onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
              autoFocus
            />
          </label>
          <label className="dw-field">
            <span className="dw-label">{t("settings.username")}</span>
            <input
              type="text"
              className="dw-input"
              value={draft.username}
              onChange={(e) => setDraft({ ...draft, username: e.target.value })}
            />
          </label>
          <label className="dw-field">
            <span className="dw-label">{t("settings.email")}</span>
            <input
              type="email"
              className="dw-input"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
          </label>
          <div className="dw-form-actions">
            <button type="button" className="dw-btn dw-btn-secondary" onClick={() => setEditing(false)}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="dw-btn dw-btn-primary" disabled={!isValid}>
              {t("common.saveChanges")}
            </button>
          </div>
        </form>
      ) : (
        <div className="settings-readonly-list">
          <div className="settings-readonly-row">
            <span className="settings-readonly-label">{t("settings.fullName")}</span>
            <span className="settings-readonly-value">{profile.fullName}</span>
          </div>
          <div className="settings-readonly-row">
            <span className="settings-readonly-label">{t("settings.username")}</span>
            <span className="settings-readonly-value">@{profile.username}</span>
          </div>
          <div className="settings-readonly-row">
            <span className="settings-readonly-label">{t("settings.email")}</span>
            <span className="settings-readonly-value">{profile.email}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- LEAF 2: Language ----------------
   NOTE: assumes I18nContext exposes `locale` + `setLocale`. If your
   provider names these differently, adjust the two destructured
   names below — everything else stays the same. */

const LANGUAGE_CHOICES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
];

export function LanguageColumn() {
  const { t, locale, setLocale } = useTranslation();
  const [fallbackLocale, setFallbackLocale] = useState(locale ?? "fr");
  const activeLocale = locale ?? fallbackLocale;

  const handleSelect = (code) => {
    if (typeof setLocale === "function") setLocale(code);
    else setFallbackLocale(code);
  };

  return (
    <div className="leaf-fill settings-panel">
      <div className="dw-col-header">
        <h3 className="dw-heading">{t("settings.language")}</h3>
      </div>

      <div className="settings-option-list">
        {LANGUAGE_CHOICES.map((lang) => (
          <button
            key={lang.code}
            className={"settings-option-row" + (activeLocale === lang.code ? " settings-option-row-active" : "")}
            onClick={() => handleSelect(lang.code)}
          >
            <span className="settings-option-label">{lang.label}</span>
            {activeLocale === lang.code && <span className="settings-option-check">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- LEAF 3: Currency ----------------
   Reuses the existing ChangeCurrencyModal component (already wired
   to context elsewhere in the app) so behavior stays consistent. */

export function CurrencyColumn() {
  const { currency, currencySymbol } = useAppData();
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="leaf-fill settings-panel">
      <div className="dw-col-header">
        <h3 className="dw-heading">{t("settings.currency")}</h3>
      </div>

      <div className="settings-currency-current">
        <span className="settings-currency-symbol">{currencySymbol}</span>
        <div className="settings-currency-current-text">
          <span className="settings-readonly-label">{t("settings.currentCurrency")}</span>
          <span className="settings-currency-code">{currency?.code ?? currency}</span>
        </div>
      </div>

      <button className="dw-btn dw-btn-primary settings-currency-btn" onClick={() => setModalOpen(true)}>
        {t("settings.changeCurrency")}
      </button>

      {modalOpen && (
        <ModalShell title={t("settings.changeCurrency")} onClose={() => setModalOpen(false)}>
          <ChangeCurrencyModal onClose={() => setModalOpen(false)} />
        </ModalShell>
      )}
    </div>
  );
}