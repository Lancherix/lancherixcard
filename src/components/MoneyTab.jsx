import { useState } from "react";
import { useAppData } from "../context/AppContext";
import { getLocalDateString } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import Icon from "./Icon";
import "./MoneyTab.css";

const frequencyKeys = ["Weekly", "Biweekly", "Monthly", "Yearly"];

/* ---------------- shared type toggle ---------------- */

function TypeToggle({ type, onChange }) {
  const { t } = useTranslation();
  return (
    <div className="mt-type-toggle" role="tablist" aria-label="Type">
      <button
        type="button" role="tab" aria-selected={type === "expense"}
        className={"mt-type-btn" + (type === "expense" ? " mt-type-btn-active mt-type-expense" : "")}
        onClick={() => onChange("expense")}
      >
        {t("common.spent")}
      </button>
      <button
        type="button" role="tab" aria-selected={type === "income"}
        className={"mt-type-btn" + (type === "income" ? " mt-type-btn-active mt-type-income" : "")}
        onClick={() => onChange("income")}
      >
        {t("common.acquired")}
      </button>
    </div>
  );
}

/* ---------------- shared "no categories yet" hint ---------------- */

function NoCategoriesHint() {
  return (
    <span style={{ fontSize: 12, color: "var(--cal-muted)", fontStyle: "italic" }}>
      Add a category in the Budget tab first
    </span>
  );
}

/* ---------------- Transaction form: dispatches through context ---------------- */

function TransactionForm({ onClose, initialValues }) {
  const { addTransaction, updateTransaction, deleteTransaction, categories, currencySymbol } = useAppData();
  const { t, tCategory } = useTranslation();
  const isEditing = Boolean(initialValues);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [type, setType] = useState(initialValues?.type ?? "expense");
  // Mirrors the dashboard's TransactionForm: an optional display name that
  // falls back to the category label, so mt-tx-name is never blank
  // regardless of which form created the transaction.
  const [name, setName] = useState(initialValues?.name ?? "");
  const [amount, setAmount] = useState(initialValues ? String(initialValues.amount) : "");
  const [categoryKey, setCategoryKey] = useState(initialValues?.categoryKey ?? categories[0]?.key ?? "other");
  const [date, setDate] = useState(initialValues?.date ?? getLocalDateString());
  const [note, setNote] = useState(initialValues?.note ?? "");

  const parsedAmount = parseFloat(amount);
  const isValid = amount.trim() !== "" && !isNaN(parsedAmount) && parsedAmount > 0 && categories.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    const tx = {
      id: initialValues?.id,
      type,
      amount: parsedAmount,
      categoryKey,
      date,
      note: note.trim(),
      name: name.trim() || tCategory(categoryKey),
    };
    if (isEditing) updateTransaction(tx);
    else addTransaction(tx);
    onClose();
  };

  if (confirmingDelete) {
    return (
      <div className="mt-confirm">
        <p className="mt-confirm-text">{t("moneyTab.deleteTransactionConfirm")}</p>
        <div className="mt-form-actions">
          <button type="button" className="mt-btn mt-btn-secondary" onClick={() => setConfirmingDelete(false)}>{t("common.cancel")}</button>
          <button
            type="button"
            className="mt-btn mt-btn-danger"
            onClick={() => {
              deleteTransaction(initialValues.id);
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
    <form className="mt-form" onSubmit={handleSubmit}>
      <TypeToggle type={type} onChange={setType} />
      <label className="mt-field">
        <span className="mt-label">{t("common.name")}</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("moneyTab.namePlaceholder")}
          className="mt-input"
          autoFocus
        />
      </label>
      <label className="mt-field">
        <span className="mt-label">{t("common.amount")}</span>
        <div className="mt-amount-wrap">
          <span className="mt-currency">{currencySymbol}</span>
          <input type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.00"
            value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-amount-input" />
        </div>
      </label>
      <label className="mt-field">
        <span className="mt-label">{t("common.category")}</span>
        {categories.length > 0 ? (
          <select value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)} className="mt-select">
            {categories.map((c) => <option key={c.id} value={c.key}>{tCategory(c.key)}</option>)}
          </select>
        ) : (
          <NoCategoriesHint />
        )}
      </label>
      <label className="mt-field">
        <span className="mt-label">{t("common.date")}</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-input" />
      </label>
      <label className="mt-field">
        <span className="mt-label">{t("common.note")}</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("common.optional")} className="mt-textarea" rows={2} />
      </label>
      <div className="mt-form-actions">
        {isEditing && (
          <button type="button" className="mt-btn mt-btn-danger mt-btn-left" onClick={() => setConfirmingDelete(true)}>{t("common.delete")}</button>
        )}
        <button type="button" className="mt-btn mt-btn-secondary" onClick={onClose}>{t("common.cancel")}</button>
        <button type="submit" className="mt-btn mt-btn-primary" disabled={!isValid}>
          {isEditing ? t("common.saveChanges") : t("common.save")}
        </button>
      </div>
    </form>
  );
}

/* ---------------- Recurring form: dispatches through context ---------------- */

function RecurringForm({ onClose, initialValues }) {
  const { addRecurring, updateRecurring, deleteRecurring, categories, currencySymbol } = useAppData();
  const { t, tCategory } = useTranslation();
  const isEditing = Boolean(initialValues);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [type, setType] = useState(initialValues?.type ?? "expense");
  const [name, setName] = useState(initialValues?.name ?? "");
  const [amount, setAmount] = useState(initialValues ? String(initialValues.amount) : "");
  const [categoryKey, setCategoryKey] = useState(initialValues?.categoryKey ?? categories[0]?.key ?? "other");
  const [frequency, setFrequency] = useState(initialValues?.frequency ?? frequencyKeys[2]);
  const [nextDate, setNextDate] = useState(initialValues?.nextDate ?? getLocalDateString());

  const parsedAmount = parseFloat(amount);
  const isValid = name.trim() !== "" && amount.trim() !== "" && !isNaN(parsedAmount) && parsedAmount > 0 && categories.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    const item = { id: initialValues?.id, type, name: name.trim(), amount: parsedAmount, categoryKey, frequency, nextDate };
    if (isEditing) updateRecurring(item);
    else addRecurring(item);
    onClose();
  };

  if (confirmingDelete) {
    return (
      <div className="mt-confirm">
        <p className="mt-confirm-text">{t("moneyTab.deleteRecurringConfirm")}</p>
        <div className="mt-form-actions">
          <button type="button" className="mt-btn mt-btn-secondary" onClick={() => setConfirmingDelete(false)}>{t("common.cancel")}</button>
          <button
            type="button"
            className="mt-btn mt-btn-danger"
            onClick={() => {
              deleteRecurring(initialValues.id);
              onClose();
            }}
          >
            {t("common.remove")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="mt-form" onSubmit={handleSubmit}>
      <TypeToggle type={type} onChange={setType} />
      <label className="mt-field">
        <span className="mt-label">{t("common.name")}</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("moneyTab.namePlaceholder")} className="mt-input" autoFocus />
      </label>
      <label className="mt-field">
        <span className="mt-label">{t("common.amount")}</span>
        <div className="mt-amount-wrap">
          <span className="mt-currency">{currencySymbol}</span>
          <input type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.00"
            value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-amount-input" />
        </div>
      </label>
      <label className="mt-field">
        <span className="mt-label">{t("common.category")}</span>
        {categories.length > 0 ? (
          <select value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)} className="mt-select">
            {categories.map((c) => <option key={c.id} value={c.key}>{tCategory(c.key)}</option>)}
          </select>
        ) : (
          <NoCategoriesHint />
        )}
      </label>
      <label className="mt-field">
        <span className="mt-label">{t("common.frequency")}</span>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="mt-select">
          {frequencyKeys.map((f) => <option key={f} value={f}>{t(`frequencies.${f}`)}</option>)}
        </select>
      </label>
      <label className="mt-field">
        <span className="mt-label">{t("common.nextDate")}</span>
        <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} className="mt-input" />
      </label>
      <div className="mt-form-actions">
        {isEditing && (
          <button type="button" className="mt-btn mt-btn-danger mt-btn-left" onClick={() => setConfirmingDelete(true)}>{t("common.remove")}</button>
        )}
        <button type="button" className="mt-btn mt-btn-secondary" onClick={onClose}>{t("common.cancel")}</button>
        <button type="submit" className="mt-btn mt-btn-primary" disabled={!isValid}>
          {isEditing ? t("common.saveChanges") : t("common.add")}
        </button>
      </div>
    </form>
  );
}

/* ---------------- rows ---------------- */

function TxRow({ tx, onClick, categories, formatMoney }) {
  const isIncome = tx.type === "income";
  const { tCategory } = useTranslation();
  const category = categories.find((c) => c.key === tx.categoryKey);

  return (
    <button className="dw-tx-row" onClick={() => onClick(tx)}>
      <span
        className="dw-tx-icon"
        style={{
          background: (category?.color ?? "#6e6e73") + "22",
        }}
      >
        <Icon
          name={category?.icon ?? "other"}
          size={16}
          color={category?.color}
        />
      </span>

      <span className="dw-tx-info">
        <span className="dw-tx-name">{tx.name}</span>
        <span className="dw-tx-sub">
          {tCategory(tx.categoryKey)} · {tx.date}
        </span>
      </span>

      <span
        className={
          "dw-tx-amount" +
          (isIncome ? " dw-amount-income" : " dw-amount-expense")
        }
      >
        {isIncome ? "+" : "-"}
        {formatMoney(tx.amount)}
      </span>
    </button>
  );
}

function RecurringRow({ item, onClick, categories, formatMoney }) {
  const { t, tCategory } = useTranslation();
  const isIncome = item.type === "income";
  const category = categories.find((c) => c.key === item.categoryKey);
  return (
    <button className="mt-rec-row" onClick={() => onClick(item)}>
      <span className={"mt-rec-dot" + (isIncome ? " mt-rec-dot-income" : "")} aria-hidden="true" />
      <span className="mt-rec-info">
        <span className="mt-rec-name">{item.name}</span>
        <span className="mt-rec-sub">
          {tCategory(item.categoryKey)} · {t(`frequencies.${item.frequency}`)} · {t("moneyTab.nextLabel")} {item.nextDate}
        </span>
      </span>
      <span className={"mt-rec-amount" + (isIncome ? " mt-amount-income" : "")}>
        {isIncome ? "+" : "-"}{formatMoney(item.amount)}
      </span>
    </button>
  );
}

/* ---------------- shared modal shell ---------------- */

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

/* ---------------- LEFT COLUMN: reads transactions from context ---------------- */

export function MoneyTransactionsColumn() {
  const { transactions, categories, formatMoney } = useAppData();
  const { t } = useTranslation();
  const [modalState, setModalState] = useState(null); // null | { mode: "add" | "edit", item? }

  const closeModal = () => setModalState(null);

  const sorted = [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="leaf-fill dw-tx-panel">
      <div className="dw-col-header">
        <h3 className="dw-heading">{t("moneyTab.transactions")}</h3>
        <button
          className="dw-add-btn"
          onClick={() => setModalState({ mode: "add" })}
        >
          + {t("common.add")}
        </button>
      </div>

      <div className="dw-txl-list">
        {sorted.length > 0 ? (
          sorted.map((tx) => (
            <TxRow
              key={tx.id}
              tx={tx}
              categories={categories}
              formatMoney={formatMoney}
              onClick={(item) =>
                setModalState({ mode: "edit", item })
              }
            />
          ))
        ) : (
          <span className="cal-actions-placeholder">
            {t("moneyTab.noTransactionsYet")}
          </span>
        )}
      </div>

      {modalState && (
        <ModalShell
          title={
            modalState.mode === "edit"
              ? t("moneyTab.editTransaction")
              : t("moneyTab.addTransaction")
          }
          onClose={closeModal}
        >
          <TransactionForm
            onClose={closeModal}
            initialValues={
              modalState.mode === "edit"
                ? modalState.item
                : null
            }
          />
        </ModalShell>
      )}
    </div>
  );
}

/* ---------------- RIGHT COLUMN: reads recurring from context ---------------- */

export function MoneyRecurringColumn() {
  const { recurring, categories, formatMoney } = useAppData();
  const { t } = useTranslation();
  const [modalState, setModalState] = useState(null);

  const closeModal = () => setModalState(null);

  const sorted = [...recurring].sort((a, b) => (a.nextDate > b.nextDate ? 1 : -1));

  return (
    <div className="leaf-fill dw-tx-panel">
      <div className="dw-col-header">
        <h3 className="dw-heading">{t("moneyTab.recurring")}</h3>
        <button className="dw-add-btn" onClick={() => setModalState({ mode: "add" })}>+ {t("common.add")}</button>
      </div>
      <div className="dw-txl-list">
        {sorted.length > 0 ? (
          sorted.map((item) => (
            <RecurringRow key={item.id} item={item} categories={categories} formatMoney={formatMoney} onClick={(i) => setModalState({ mode: "edit", item: i })} />
          ))
        ) : (
          <span className="cal-actions-placeholder">{t("moneyTab.noRecurringYet")}</span>
        )}
      </div>

      {modalState && (
        <ModalShell title={modalState.mode === "edit" ? t("moneyTab.editRecurring") : t("moneyTab.addRecurring")} onClose={closeModal}>
          <RecurringForm
            onClose={closeModal}
            initialValues={modalState.mode === "edit" ? modalState.item : null}
          />
        </ModalShell>
      )}
    </div>
  );
}