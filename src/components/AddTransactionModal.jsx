import { useState } from "react";
import { useAppData } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import "./AddTransactionModal.css";

export default function AddTransactionModal({ onClose, onSave, onDelete, initialValues }) {
  const { t, tCategory } = useTranslation();
  const { categories, currencySymbol } = useAppData();
  const isEditing = Boolean(initialValues);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [type, setType] = useState(initialValues?.type ?? "expense");
  const [amount, setAmount] = useState(
    initialValues ? String(initialValues.amount) : ""
  );
  const [categoryKey, setCategoryKey] = useState(initialValues?.categoryKey ?? categories[0]?.key ?? "other");
  const [date, setDate] = useState(
    initialValues?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState(initialValues?.note ?? "");

  const parsedAmount = parseFloat(amount);
  const isValid = amount.trim() !== "" && !isNaN(parsedAmount) && parsedAmount > 0 && categories.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    onSave?.({
      id: initialValues?.id,
      type,
      amount: parsedAmount,
      categoryKey,
      date,
      note: note.trim(),
    });
    onClose();
  };

  if (confirmingDelete) {
    return (
      <div className="atm-confirm">
        <p className="atm-confirm-text">
          {t("transactionModal.deleteConfirm")}
        </p>
        <div className="atm-actions">
          <button
            type="button"
            className="atm-btn atm-btn-secondary"
            onClick={() => setConfirmingDelete(false)}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="atm-btn atm-btn-danger"
            onClick={() => {
              onDelete?.(initialValues.id);
              onClose();
            }}
          >
            {t("common.delete")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="atm-form" onSubmit={handleSubmit}>
      <div className="atm-type-toggle" role="tablist" aria-label="Transaction type">
        <button
          type="button"
          role="tab"
          aria-selected={type === "expense"}
          className={"atm-type-btn" + (type === "expense" ? " atm-type-btn-active atm-type-expense" : "")}
          onClick={() => setType("expense")}
        >
          {t("common.spent")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={type === "income"}
          className={"atm-type-btn" + (type === "income" ? " atm-type-btn-active atm-type-income" : "")}
          onClick={() => setType("income")}
        >
          {t("common.acquired")}
        </button>
      </div>

      <label className="atm-field">
        <span className="atm-label">{t("common.amount")}</span>
        <div className="atm-amount-wrap">
          <span className="atm-currency">{currencySymbol}</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="atm-amount-input"
            autoFocus
          />
        </div>
      </label>

      <label className="atm-field">
        <span className="atm-label">{t("common.category")}</span>
        {categories.length > 0 ? (
          <select value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)} className="atm-select">
            {categories.map((c) => (
              <option key={c.id} value={c.key}>{tCategory(c.key)}</option>
            ))}
          </select>
        ) : (
          <span className="atm-field-hint" style={{ fontSize: 12, color: "var(--cal-muted)", fontStyle: "italic" }}>
            {t("budgetTab.noCategoriesHint")}
          </span>
        )}
      </label>

      <label className="atm-field">
        <span className="atm-label">{t("common.date")}</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="atm-input" />
      </label>

      <label className="atm-field">
        <span className="atm-label">{t("common.note")}</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("common.optional")}
          className="atm-textarea"
          rows={2}
        />
      </label>

      <div className="atm-actions">
        {isEditing && (
          <button
            type="button"
            className="atm-btn atm-btn-danger atm-btn-left"
            onClick={() => setConfirmingDelete(true)}
          >
            {t("common.delete")}
          </button>
        )}
        <button type="button" className="atm-btn atm-btn-secondary" onClick={onClose}>
          {t("common.cancel")}
        </button>
        <button type="submit" className="atm-btn atm-btn-primary" disabled={!isValid}>
          {isEditing ? t("common.saveChanges") : t("common.save")}
        </button>
      </div>
    </form>
  );
}