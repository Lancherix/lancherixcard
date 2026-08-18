import { useState } from "react";
import { createPortal } from "react-dom";
import { useAppData } from "../context/AppContext";
import { CURRENCIES, formatMoney } from "../context/AppContext";
import "./DashboardWidgets.css";

const CURRENCY_ORDER = ["USD", "COP", "EUR", "GBP", "CAD"];

export default function ChangeCurrencyModal({ onClose }) {
  const { currency, changeCurrency, budget } = useAppData();
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
          <h4>Change Currency</h4>
        </div>

        <div className="new-project-content">
          <div className="form-row">
            <span />
            <p className="dw-goal-contribute-hint">
              You're currently using <strong>{currentCfg.flag} {currentCfg.code}</strong>. Pick a
              new currency and the exchange rate to convert your existing amounts — otherwise your
              numbers would just be relabeled, not converted.
            </p>
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>New currency</label>

            <select
              value={targetCode}
              onChange={(e) => setTargetCode(e.target.value)}
            >
              {CURRENCY_ORDER.map((code) => (
                <option key={code} value={code} disabled={code === currentCode}>
                  {CURRENCIES[code].flag} {CURRENCIES[code].code} — {CURRENCIES[code].name}
                  {code === currentCode ? " (current)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>
              Rate
            </label>
            <label>
              (1 {currentCfg.code} = ? {targetCfg.code})
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
                <span className="dw-goal-current-label">Your budget would become</span>
                <span className="dw-goal-current-value">
                  {formatMoney(previewAmount, targetCfg)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="new-project-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancel
          </button>

          <button
            type="button"
            className="primary-btn"
            disabled={!isValid}
            onClick={handleSubmit}
          >
            Convert & switch
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}