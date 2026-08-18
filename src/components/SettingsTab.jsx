import { useState } from "react";
import { useAppData } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import ChangeCurrencyModal from "./ChangeCurrencyModal";
import "./SettingsTab.css";

const STUDIO_SETTINGS_URL = "https://studio.lancherix.com/settings";

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

/* ---------------- LEAF 1: Account (personal info + language) ----------------
   Read-only: editing happens externally in Lancherix Studio. The
   "Modify" button just opens that page in a new tab.
   NOTE: `profile` isn't on AppContext yet, so it's mocked locally here —
   swap MOCK_PROFILE for real data once a profile endpoint exists.
   Language display assumes I18nContext exposes `locale`; adjust the
   destructured name below if yours differs. */

const MOCK_PROFILE = {
  fullName: "Alex Morgan",
  username: "alexmorgan",
  email: "alex.morgan@example.com",
};

const LANGUAGE_LABELS = {
  fr: "Français",
  en: "English",
  es: "Español",
  pt: "Português",
};

export function AccountColumn() {
  const { t, locale } = useTranslation();
  const [profile] = useState(MOCK_PROFILE);

  const initials = profile.fullName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const languageLabel = LANGUAGE_LABELS[locale] ?? locale ?? LANGUAGE_LABELS.fr;

  return (
    <div className="leaf-fill settings-panel">
      <div className="dw-col-header">
        <h3 className="dw-heading">{t("settings.account")}</h3>
        <button
          className="dw-add-btn dw-add-btn-neutral"
          onClick={() => window.open(STUDIO_SETTINGS_URL, "_blank", "noopener,noreferrer")}
        >
          {t("common.modify")}
        </button>
      </div>

      <div className="settings-profile-head">
        <span className="settings-avatar">{initials}</span>
        <div className="settings-profile-head-text">
          <span className="settings-profile-name">{profile.fullName}</span>
          <span className="settings-profile-username">@{profile.username}</span>
        </div>
      </div>

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
        <div className="settings-readonly-row">
          <span className="settings-readonly-label">{t("settings.language")}</span>
          <span className="settings-readonly-value">{languageLabel}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- LEAF 2: Currency ----------------
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