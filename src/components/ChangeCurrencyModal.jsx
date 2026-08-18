import { useState } from "react";
import { createPortal } from "react-dom";
import { useAppData } from "../context/AppContext";
import { CURRENCIES, formatMoney } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import "./DashboardWidgets.css";

const CURRENCY_ORDER = ["USD", "COP", "EUR", "GBP", "CAD"];

export default function ChangeCurrencyModal({ onClose }) {
  const { currency, changeCurrency, budget } = useAppData();
  const { t } = useTranslation();
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

  return createPortal(
    <div className="new-project-overlay">
      <div
        className="new-project-window"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="new-project-header">
          <h4>{t("changeCurrency.title")}</h4>
        </div>

        <div className="new-project-content">
          <div className="form-row">
            <span />
            <p className="dw-goal-contribute-hint">
              {hintBefore}
              <strong>{currentCfg.flag} {currentCfg.code}</strong>
              {hintAfter}
            </p>
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>{t("changeCurrency.newCurrency")}</label>

            <select
              value={targetCode}
              onChange={(e) => setTargetCode(e.target.value)}
            >
              {CURRENCY_ORDER.map((code) => (
                <option key={code} value={code} disabled={code === currentCode}>
                  {CURRENCIES[code].flag} {CURRENCIES[code].code} — {CURRENCIES[code].name}
                  {code === currentCode ? ` ${t("changeCurrency.current")}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>
              {t("changeCurrency.rate")}
              <br />
              {t("changeCurrency.rateFormula", { from: currentCfg.code, to: targetCfg.code })}
            </label>

            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="e.g. 0.00028 or 3900"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              autoFocus
            />
          </div>

          {isValid && (
            <div className="form-row">
              <span />
              <div className="dw-goal-current-readout">
                <span className="dw-goal-current-label">{t("changeCurrency.budgetBecomes")}</span>
                <span className="dw-goal-current-value">
                  {formatMoney(previewAmount, targetCfg)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="new-project-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>
            {t("common.cancel")}
          </button>

          <button
            type="button"
            className="primary-btn"
            disabled={!isValid}
            onClick={handleSubmit}
          >
            {t("changeCurrency.convertAndSwitch")}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}