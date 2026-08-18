import { useState } from "react";
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

  return (
    <form className="dw-form" onSubmit={handleSubmit}>
      <p className="dw-goal-contribute-hint">
        You're currently using <strong>{currentCfg.flag} {currentCfg.code}</strong>. Pick a new
        currency and the exchange rate to convert your existing amounts — otherwise your numbers
        would just be relabeled, not converted.
      </p>

      <label className="dw-field">
        <span className="dw-label">New currency</span>
        <select
          value={targetCode}
          onChange={(e) => setTargetCode(e.target.value)}
          className="dw-select"
        >
          {CURRENCY_ORDER.map((code) => (
            <option key={code} value={code} disabled={code === currentCode}>
              {CURRENCIES[code].flag} {CURRENCIES[code].code} — {CURRENCIES[code].name}
              {code === currentCode ? " (current)" : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="dw-field">
        <span className="dw-label">
          Exchange rate (1 {currentCfg.code} = ? {targetCfg.code})
        </span>
        <input
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          placeholder="e.g. 0.00028 or 3900"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="dw-input"
          autoFocus
        />
      </label>

      {isValid && (
        <div className="dw-goal-current-readout">
          <span className="dw-goal-current-label">Your budget would become</span>
          <span className="dw-goal-current-value">{formatMoney(previewAmount, targetCfg)}</span>
        </div>
      )}

      <div className="dw-form-actions">
        <button type="button" className="dw-btn dw-btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="dw-btn dw-btn-primary" disabled={!isValid}>
          Convert & switch
        </button>
      </div>
    </form>
  );
}