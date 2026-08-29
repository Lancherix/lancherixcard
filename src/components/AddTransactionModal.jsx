import { useState } from "react";
import { createPortal } from "react-dom";
import { useAppData } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import "./mobile/ModalSystemMobile.css";
import useIsMobile from "../hooks/useIsMobile";

/* ============================================================
   MOBILE-AWARE MODAL HELPERS
   Same helpers as DashboardWidgets.jsx / MoneyTab.jsx / BudgetTab.jsx
   (ModalShell, FormRow, AmountField, TypeToggle, plus the shared
   class-name pickers), duplicated locally per that file's own
   convention so this modal renders correctly on both desktop and
   mobile, and can now portal itself instead of relying on a caller
   to supply the overlay.
   ============================================================ */

function ModalShell({ isMobile, title, onClose, confirm, footer, children }) {
  const windowClass = isMobile
    ? (confirm ? "mm-confirm-window" : "mm-window")
    : (confirm ? "confirm-window" : "new-project-window");
  const contentClass = isMobile
    ? (confirm ? "mm-confirm-content" : "mm-content")
    : "new-project-content";

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

function AmountField({ isMobile, currencySymbol, value, onChange, autoFocus }) {
  return (
    <div className={isMobile ? "mm-amount-wrap" : "dw-amount-wrap"}>
      <span className={isMobile ? "mm-currency" : "dw-currency"}>{currencySymbol}</span>
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={value}
        onChange={onChange}
        className={isMobile ? "mm-amount-input" : "dw-amount-input"}
        autoFocus={autoFocus}
      />
    </div>
  );
}

function TypeToggle({ isMobile, type, onChange }) {
  const { t } = useTranslation();
  const toggleClass = isMobile ? "mm-type-toggle" : "dw-type-toggle";
  const btnClass = isMobile ? "mm-type-btn" : "dw-type-btn";
  const activeClass = isMobile ? "mm-type-btn-active" : "dw-type-btn-active";
  const variantClass = (v) => (isMobile ? `mm-type-${v}` : `dw-type-${v}`);

  return (
    <div className={toggleClass} role="tablist" aria-label="Type">
      <button
        type="button" role="tab" aria-selected={type === "expense"}
        className={btnClass + (type === "expense" ? ` ${activeClass} ${variantClass("expense")}` : "")}
        onClick={() => onChange("expense")}
      >
        {t("common.spent")}
      </button>
      <button
        type="button" role="tab" aria-selected={type === "income"}
        className={btnClass + (type === "income" ? ` ${activeClass} ${variantClass("income")}` : "")}
        onClick={() => onChange("income")}
      >
        {t("common.acquired")}
      </button>
    </div>
  );
}

const primaryBtnClass = (isMobile) => (isMobile ? "mm-btn mm-btn-primary" : "primary-btn");
const secondaryBtnClass = (isMobile) => (isMobile ? "mm-btn mm-btn-secondary" : "secondary-btn");
const dangerBtnClass = (isMobile) => (isMobile ? "mm-btn mm-btn-danger" : "secondary-btn transaction-delete-btn");
const dangerLeftBtnClass = (isMobile) => (isMobile ? "mm-btn mm-btn-danger" : "secondary-btn transaction-delete-btn dw-btn-left");
// Delete is the action being confirmed on this screen, so on mobile it gets
// the filled/primary treatment instead of the quiet text-link style.
const confirmDeleteStyle = { background: "linear-gradient(#e5484d, #d1242f)", border: "1px solid #c4262f", color: "#fff" };

/* ---------------- Add/Edit Transaction modal (used from Settings tab) ----------------
   Self-portals via ModalShell like TransactionForm/RecurringForm/BudgetForm/
   CategoryForm elsewhere in the app, so whoever opens it in Settings just
   needs to render <AddTransactionModal .../> conditionally — no outer
   overlay wrapper required. Keeps its onSave/onDelete/onClose callback API
   (rather than calling context mutators directly) since it's driven from
   outside, unlike the tab-local forms. */

export default function AddTransactionModal({ onClose, onSave, onDelete, initialValues }) {
  const { t, tCategory } = useTranslation();
  const { categories, currencySymbol } = useAppData();
  const isMobile = useIsMobile();
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

  const handleDelete = () => {
    onDelete?.(initialValues.id);
    onClose();
  };

  if (confirmingDelete) {
    return (
      <ModalShell
        isMobile={isMobile}
        confirm
        title={t("common.delete")}
        onClose={onClose}
        footer={
          isMobile ? (
            <>
              <button type="button" className={dangerBtnClass(isMobile)} style={confirmDeleteStyle} onClick={handleDelete}>
                {t("common.delete")}
              </button>
              <button type="button" className={secondaryBtnClass(isMobile)} onClick={() => setConfirmingDelete(false)}>
                {t("common.cancel")}
              </button>
            </>
          ) : (
            <>
              <button type="button" className={secondaryBtnClass(isMobile)} onClick={() => setConfirmingDelete(false)}>
                {t("common.cancel")}
              </button>
              <button type="button" className={dangerBtnClass(isMobile)} onClick={handleDelete}>
                {t("common.delete")}
              </button>
            </>
          )
        }
      >
        {isMobile ? (
          <p className="mm-confirm-text">{t("transactionModal.deleteConfirm")}</p>
        ) : (
          <div className="confirm-row">
            <p className="dw-confirm-text">{t("transactionModal.deleteConfirm")}</p>
          </div>
        )}
      </ModalShell>
    );
  }

  return (
    <ModalShell
      isMobile={isMobile}
      title={isEditing ? t("moneyTab.editTransaction") : t("moneyTab.addTransaction")}
      onClose={onClose}
      footer={
        isMobile ? (
          <>
            <button type="button" className={primaryBtnClass(isMobile)} disabled={!isValid} onClick={handleSubmit}>
              {isEditing ? t("common.saveChanges") : t("common.save")}
            </button>
            <button type="button" className={secondaryBtnClass(isMobile)} onClick={onClose}>
              {t("common.cancel")}
            </button>
            {isEditing && (
              <button type="button" className={dangerBtnClass(isMobile)} onClick={() => setConfirmingDelete(true)}>
                {t("common.delete")}
              </button>
            )}
          </>
        ) : (
          <>
            {isEditing && (
              <button type="button" className={dangerLeftBtnClass(isMobile)} onClick={() => setConfirmingDelete(true)}>
                {t("common.delete")}
              </button>
            )}
            <button type="button" className={secondaryBtnClass(isMobile)} onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button type="button" className={primaryBtnClass(isMobile)} disabled={!isValid} onClick={handleSubmit}>
              {isEditing ? t("common.saveChanges") : t("common.save")}
            </button>
          </>
        )
      }
    >
      <FormRow isMobile={isMobile} label={t("common.type")}>
        <TypeToggle isMobile={isMobile} type={type} onChange={setType} />
      </FormRow>

      <FormRow isMobile={isMobile} label={t("common.amount")}>
        <AmountField
          isMobile={isMobile}
          currencySymbol={currencySymbol}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
      </FormRow>

      <FormRow isMobile={isMobile} label={t("common.category")}>
        {categories.length > 0 ? (
          <select value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.key}>{tCategory(c.key)}</option>
            ))}
          </select>
        ) : (
          <span className={isMobile ? "mm-field-hint" : "dw-field-hint"}>
            {t("budgetTab.noCategoriesHint")}
          </span>
        )}
      </FormRow>

      <FormRow isMobile={isMobile} label={t("common.date")}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </FormRow>

      <FormRow isMobile={isMobile} label={t("common.note")}>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("common.optional")}
          className="dw-textarea"
          rows={2}
        />
      </FormRow>
    </ModalShell>
  );
}