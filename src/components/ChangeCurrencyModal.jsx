import { useState } from "react";
import { createPortal } from "react-dom";
import { useAppData } from "../context/AppContext";
import { CURRENCIES, formatMoney } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import "./DashboardWidgets.css";
import "./mobile/ModalSystemMobile.css";
import useIsMobile from "../hooks/useIsMobile";

const CURRENCY_ORDER = ["COP", "CAD", "EUR", "GBP", "USD"];

/* ============================================================
   MOBILE-AWARE MODAL HELPERS
   Same ModalShell/FormRow + button class pickers as
   DashboardWidgets.jsx / MoneyTab.jsx / BudgetTab.jsx /
   AddTransactionModal.jsx, duplicated locally per that file's
   own convention. This modal already portalled itself to
   #modal-root before, so it now also owns its own mobile-vs-desktop
   chrome instead of relying on a caller-provided shell.
   ============================================================ */

function ModalShell({ isMobile, title, onClose, footer, children }) {
  const windowClass = isMobile ? "mm-window" : "new-project-window";
  const contentClass = isMobile ? "mm-content" : "new-project-content";

  return createPortal(
    <div className={isMobile ? "mm-overlay" : "new-project-overlay"} onClick={isMobile ? onClose : undefined}>
      <div className={windowClass} onClick={(e) => e.stopPropagation()}>
        {isMobile && <div className="mm-handle"><span /></div>}
        <div className={isMobile ? "mm-header" : "new-project-header"}>
          <h4>{title}</h4>
          {isMobile && (
            <button type="button" className="mm-close-btn" onClick={onClose} aria-label="Close">✕</button>
          )}
        </div>
        <div className={contentClass}>{children}</div>
        <div className={isMobile ? "mm-footer" : "new-project-footer"}>{footer}</div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}

function FormRow({ isMobile, label, children }) {
  if (isMobile) {
    return (
      <div className="mm-field">
        {label && <span className="mm-label">{label}</span>}
        {children}
      </div>
    );
  }
  return (
    <div className={label ? "form-row form-row-a form-row-name" : "form-row"}>
      {label ? <label>{label}</label> : <span />}
      {children}
    </div>
  );
}

const primaryBtnClass = (isMobile) => (isMobile ? "mm-btn mm-btn-primary" : "primary-btn");
const secondaryBtnClass = (isMobile) => (isMobile ? "mm-btn mm-btn-secondary" : "secondary-btn");

export default function ChangeCurrencyModal({ onClose }) {
  const { currency, changeCurrency, budget } = useAppData();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const currentCode = currency?.code ?? "USD";

  const [targetCode, setTargetCode] = useState(
    CURRENCY_ORDER.find((c) => c !== currentCode) ?? "USD"
  );
  const [rate, setRate] = useState("");

  const parsedRate = parseFloat(rate);
  const isValid = rate.trim() !== "" && !isNaN(parsedRate) && parsedRate > 0;

  const currentCfg = CURRENCIES[currentCode];
  const targetCfg = CURRENCIES[targetCode];
  const previewAmount = isValid ? budget * parsedRate : null;

  // hint sentence has a bolded currency chunk in the middle, so we split
  // the translated template on the literal "{{currency}}" marker rather
  // than interpolating a plain string, keeping the <strong> in JSX.
  const [hintBefore, hintAfter] = t("changeCurrency.hint").split("{{currency}}");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    changeCurrency(targetCode, parsedRate);
    onClose();
  };

  return (
    <ModalShell
      isMobile={isMobile}
      title={t("changeCurrency.title")}
      onClose={onClose}
      footer={
        isMobile ? (
          <>
            <button type="button" className={primaryBtnClass(isMobile)} disabled={!isValid} onClick={handleSubmit}>
              {t("changeCurrency.convertAndSwitch")}
            </button>
            <button type="button" className={secondaryBtnClass(isMobile)} onClick={onClose}>
              {t("common.cancel")}
            </button>
          </>
        ) : (
          <>
            <button type="button" className={secondaryBtnClass(isMobile)} onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button type="button" className={primaryBtnClass(isMobile)} disabled={!isValid} onClick={handleSubmit}>
              {t("changeCurrency.convertAndSwitch")}
            </button>
          </>
        )
      }
    >
      <FormRow isMobile={isMobile}>
        <p className="dw-goal-contribute-hint">
          {hintBefore}
          <strong>{currentCfg.flag} {currentCfg.code}</strong>
          {hintAfter}
        </p>
      </FormRow>

      <FormRow isMobile={isMobile} label={t("changeCurrency.newCurrency")}>
        <select
          value={targetCode}
          onChange={(e) => setTargetCode(e.target.value)}
        >
          {CURRENCY_ORDER.map((code) => (
            <option key={code} value={code} disabled={code === currentCode}>
              {CURRENCIES[code].flag} {CURRENCIES[code].code} — {t(`currencyNames.${code}`)}
              {code === currentCode ? ` ${t("changeCurrency.current")}` : ""}
            </option>
          ))}
        </select>
      </FormRow>

      <FormRow
        isMobile={isMobile}
        label={
          <>
            {t("changeCurrency.rate")}
            <br />
            {t("changeCurrency.rateFormula", { from: currentCfg.code, to: targetCfg.code })}
          </>
        }
      >
        <input
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          placeholder={t("changeCurrency.ratePlaceholder")}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          autoFocus
        />
      </FormRow>

      {isValid && (
        <FormRow isMobile={isMobile}>
          <div className="dw-goal-current-readout">
            <span className="dw-goal-current-label">{t("changeCurrency.budgetBecomes")}</span>
            <span className="dw-goal-current-value">
              {formatMoney(previewAmount, targetCfg)}
            </span>
          </div>
        </FormRow>
      )}
    </ModalShell>
  );
}