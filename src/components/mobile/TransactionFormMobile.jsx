import { useState } from "react";
import { createPortal } from "react-dom";
import { useAppData } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import "./ModalSystemMobile.css";

export default function TransactionFormMobile({ onClose, onSave, onDelete, initialValues }) {
  const { t, tCategory } = useTranslation();
  const { categories, currencySymbol } = useAppData();
  const isEditing = Boolean(initialValues);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [type, setType] = useState(initialValues?.type ?? "expense");
  const [name, setName] = useState(initialValues?.name ?? "");
  const [amount, setAmount] = useState(
    initialValues ? String(initialValues.amount) : ""
  );
  const [categoryKey, setCategoryKey] = useState(initialValues?.categoryKey ?? categories[0]?.key ?? "other");
  const [date, setDate] = useState(
    initialValues?.date ?? new Date().toISOString().slice(0, 10)
  );

  const parsedAmount = parseFloat(amount);
  const isValid = amount.trim() !== "" && !isNaN(parsedAmount) && parsedAmount > 0 && categories.length > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSave?.({
      id: initialValues?.id,
      type,
      name: name.trim(),
      amount: parsedAmount,
      categoryKey,
      date,
    });
    onClose();
  };

  // ---- Delete confirmation sheet ----
  if (confirmingDelete) {
    return createPortal(
      <div className="mm-overlay" onClick={onClose}>
        <div className="mm-confirm-window" onClick={(e) => e.stopPropagation()}>
          <div className="mm-handle"><span /></div>
          <div className="mm-confirm-content">
            <p className="mm-confirm-text">
              {t("transactionModal.deleteConfirm")}
            </p>
          </div>
          <div className="mm-footer">
            <button
              type="button"
              className="mm-btn mm-btn-primary"
              style={{ background: "linear-gradient(#e5484d, #d1242f)", border: "1px solid #c4262f" }}
              onClick={() => {
                onDelete?.(initialValues.id);
                onClose();
              }}
            >
              {t("common.delete")}
            </button>
            <button
              type="button"
              className="mm-btn mm-btn-secondary"
              onClick={() => setConfirmingDelete(false)}
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </div>,
      document.getElementById("modal-root")
    );
  }

  // ---- Main form sheet ----
  return createPortal(
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-window" onClick={(e) => e.stopPropagation()}>
        <div className="mm-handle"><span /></div>

        <div className="mm-header">
          <h4>{isEditing ? t("moneyTab.editTransaction") : t("common.newTransaction")}</h4>
          <button type="button" className="mm-close-btn" onClick={onClose} aria-label={t("common.cancel")}>
            ✕
          </button>
        </div>

        <div className="mm-content">
          <div className="mm-field">
            <span className="mm-label">{t("common.type")}</span>
            <div className="mm-type-toggle" role="tablist" aria-label="Transaction type">
              <button
                type="button"
                role="tab"
                aria-selected={type === "expense"}
                className={"mm-type-btn" + (type === "expense" ? " mm-type-btn-active mm-type-expense" : "")}
                onClick={() => setType("expense")}
              >
                {t("common.spent")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={type === "income"}
                className={"mm-type-btn" + (type === "income" ? " mm-type-btn-active mm-type-income" : "")}
                onClick={() => setType("income")}
              >
                {t("common.acquired")}
              </button>
            </div>
          </div>

          <label className="mm-field">
            <span className="mm-label">{t("common.name")}</span>
            <input
              type="text"
              placeholder={t("moneyTab.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="mm-field">
            <span className="mm-label">{t("common.amount")}</span>
            <div className="mm-amount-wrap">
              <span className="mm-currency">{currencySymbol}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mm-amount-input"
              />
            </div>
          </label>

          <label className="mm-field">
            <span className="mm-label">{t("common.category")}</span>
            {categories.length > 0 ? (
              <select value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.key}>{tCategory(c.key)}</option>
                ))}
              </select>
            ) : (
              <span className="mm-field-hint">{t("budgetTab.noCategoriesHint")}</span>
            )}
          </label>

          <label className="mm-field">
            <span className="mm-label">{t("common.date")}</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>

        <div className="mm-footer">
          <button
            type="button"
            className="mm-btn mm-btn-primary"
            disabled={!isValid}
            onClick={handleSubmit}
          >
            {isEditing ? t("common.saveChanges") : t("common.save")}
          </button>
          <button type="button" className="mm-btn mm-btn-secondary" onClick={onClose}>
            {t("common.cancel")}
          </button>
          {isEditing && (
            <button
              type="button"
              className="mm-btn mm-btn-danger"
              onClick={() => setConfirmingDelete(true)}
            >
              {t("common.delete")}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}