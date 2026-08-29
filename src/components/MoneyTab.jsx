import { useState } from "react";
import { createPortal } from "react-dom";
import { useAppData } from "../context/AppContext";
import { getLocalDateString } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import Icon from "./Icon";
import "./MoneyTab.css";
import AnyIcon from "./AnyIcon";

const frequencyKeys = ["Weekly", "Biweekly", "Monthly", "Yearly"];

/* ---------------- shared type toggle ---------------- */

function TypeToggle({ type, onChange }) {
  const { t } = useTranslation();
  return (
    <div className="dw-type-toggle" role="tablist" aria-label="Type">
      <button
        type="button" role="tab" aria-selected={type === "expense"}
        className={"dw-type-btn" + (type === "expense" ? " dw-type-btn-active dw-type-expense" : "")}
        onClick={() => onChange("expense")}
      >
        {t("common.spent")}
      </button>
      <button
        type="button" role="tab" aria-selected={type === "income"}
        className={"dw-type-btn" + (type === "income" ? " dw-type-btn-active dw-type-income" : "")}
        onClick={() => onChange("income")}
      >
        {t("common.acquired")}
      </button>
    </div>
  );
}

/* ---------------- shared "no categories yet" hint ---------------- */

function NoCategoriesHint() {
  const { t } = useTranslation();
  return (
    <span className="dw-field-hint">
      {t("budgetTab.noCategoriesHint")}
    </span>
  );
}

/* ---------------- shared empty state: icon above label ----------------
   Same component/markup as DashboardWidgets.jsx's EmptyState, duplicated
   locally per that file's own convention (see TypeToggle above), reusing
   the global dw-empty-state / dw-empty-state-compact classes already
   defined in DashboardWidgets.css. */

function EmptyState({ icon, label, compact }) {
  return (
    <div className={"dw-empty-state" + (compact ? " dw-empty-state-compact" : "")}>
      <Icon name={icon} size={compact ? 18 : 32} color="var(--cal-muted)" />
      <span className="dw-empty-state-label">{label}</span>
    </div>
  );
}

/* ---------------- Transaction form: self-contained, same markup as GoalForm/TransactionForm ---------------- */

function TransactionForm({ onClose, initialValues }) {
  const { addTransaction, updateTransaction, deleteTransaction, categories, currencySymbol } = useAppData();
  const { t, tCategory } = useTranslation();
  const isEditing = Boolean(initialValues);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [type, setType] = useState(initialValues?.type ?? "expense");
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

  const handleDelete = () => {
    if (!initialValues?.id) return;
    deleteTransaction(initialValues.id);
    onClose();
  };

  if (confirmingDelete) {
    return createPortal(
      <div className="new-project-overlay">
        <div className="confirm-window" onClick={(e) => e.stopPropagation()}>
          <div className="new-project-header">
            <h4>{t("common.delete")}</h4>
          </div>

          <div className="new-project-content">
            <div className="confirm-row">
              <p className="dw-confirm-text">
                {t("moneyTab.deleteTransactionConfirm")}
              </p>
            </div>
          </div>

          <div className="new-project-footer">
            <button type="button" className="secondary-btn" onClick={() => setConfirmingDelete(false)}>
              {t("common.cancel")}
            </button>
            <button type="button" className="secondary-btn transaction-delete-btn" onClick={handleDelete}>
              {t("common.delete")}
            </button>
          </div>
        </div>
      </div>,
      document.getElementById("modal-root")
    );
  }

  return createPortal(
    <div className="new-project-overlay">
      <div className="new-project-window" onClick={(e) => e.stopPropagation()}>
        <div className="new-project-header">
          <h4>{isEditing ? t("moneyTab.editTransaction") : t("moneyTab.addTransaction")}</h4>
        </div>

        <div className="new-project-content">
          <div className="form-row form-row-a form-row-name">
            <label>{t("common.type")}</label>
            <TypeToggle type={type} onChange={setType} />
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>{t("common.name")}</label>
            <input
              type="text"
              placeholder={t("moneyTab.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>{t("common.amount")}</label>
            <div className="dw-amount-wrap">
              <span className="dw-currency">{currencySymbol}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="dw-amount-input"
                autoFocus
              />
            </div>
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>{t("common.category")}</label>
            {categories.length > 0 ? (
              <select value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.key}>{tCategory(c.key)}</option>
                ))}
              </select>
            ) : (
              <NoCategoriesHint />
            )}
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>{t("common.date")}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>{t("common.note")}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("common.optional")}
              className="dw-textarea"
              rows={2}
            />
          </div>
        </div>

        <div className="new-project-footer">
          {isEditing && (
            <button type="button" className="secondary-btn transaction-delete-btn dw-btn-left" onClick={() => setConfirmingDelete(true)}>
              {t("common.delete")}
            </button>
          )}
          <button type="button" className="secondary-btn" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button type="button" className="primary-btn" disabled={!isValid} onClick={handleSubmit}>
            {isEditing ? t("common.saveChanges") : t("common.save")}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}

/* ---------------- Recurring form: self-contained, same markup pattern ---------------- */

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

  const handleDelete = () => {
    if (!initialValues?.id) return;
    deleteRecurring(initialValues.id);
    onClose();
  };

  if (confirmingDelete) {
    return createPortal(
      <div className="new-project-overlay">
        <div className="confirm-window" onClick={(e) => e.stopPropagation()}>
          <div className="new-project-header">
            <h4>{t("common.remove")}</h4>
          </div>

          <div className="new-project-content">
            <div className="confirm-row">
              <p className="dw-confirm-text">
                {t("moneyTab.deleteRecurringConfirm")}
              </p>
            </div>
          </div>

          <div className="new-project-footer">
            <button type="button" className="secondary-btn" onClick={() => setConfirmingDelete(false)}>
              {t("common.cancel")}
            </button>
            <button type="button" className="secondary-btn transaction-delete-btn" onClick={handleDelete}>
              {t("common.remove")}
            </button>
          </div>
        </div>
      </div>,
      document.getElementById("modal-root")
    );
  }

  return createPortal(
    <div className="new-project-overlay">
      <div className="new-project-window" onClick={(e) => e.stopPropagation()}>
        <div className="new-project-header">
          <h4>{isEditing ? t("moneyTab.editRecurring") : t("moneyTab.addRecurring")}</h4>
        </div>

        <div className="new-project-content">
          <div className="form-row form-row-a form-row-name">
            <label>{t("common.type")}</label>
            <TypeToggle type={type} onChange={setType} />
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>{t("common.name")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("moneyTab.namePlaceholder")}
              autoFocus
            />
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>{t("common.amount")}</label>
            <div className="dw-amount-wrap">
              <span className="dw-currency">{currencySymbol}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="dw-amount-input"
              />
            </div>
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>{t("common.category")}</label>
            {categories.length > 0 ? (
              <select value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.key}>{tCategory(c.key)}</option>
                ))}
              </select>
            ) : (
              <NoCategoriesHint />
            )}
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>{t("common.frequency")}</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              {frequencyKeys.map((f) => (
                <option key={f} value={f}>{t(`frequencies.${f}`)}</option>
              ))}
            </select>
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>{t("common.nextDate")}</label>
            <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
          </div>
        </div>

        <div className="new-project-footer">
          {isEditing && (
            <button type="button" className="secondary-btn transaction-delete-btn dw-btn-left" onClick={() => setConfirmingDelete(true)}>
              {t("common.remove")}
            </button>
          )}
          <button type="button" className="secondary-btn" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button type="button" className="primary-btn" disabled={!isValid} onClick={handleSubmit}>
            {isEditing ? t("common.saveChanges") : t("common.add")}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}

/* ---------------- rows ---------------- */

function TxRow({ tx, onClick, categories, formatMoney }) {
  const isIncome = tx.type === "income";
  const { tCategory } = useTranslation();
  const category = categories.find((c) => c.key === tx.categoryKey);

  return (
    <button className="dw-tx-row" onClick={() => onClick(tx)}>
      <span className="dw-tx-icon" style={{ background: (category?.color ?? "#6e6e73") + "22" }}>
        <AnyIcon name={category?.icon ?? "other"} size={16} color={category?.color} />
      </span>
      <span className="dw-tx-info">
        <span className="dw-tx-name">{tx.name}</span>
        <span className="dw-tx-sub">{tCategory(tx.categoryKey)} · {tx.date}</span>
      </span>
      <span className={"dw-tx-amount" + (isIncome ? " dw-amount-income" : " dw-amount-expense")}>
        {isIncome ? "+" : "-"}{formatMoney(tx.amount)}
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
      <span className="dw-tx-icon" style={{ background: (category?.color ?? "#6e6e73") + "22" }}>
        <AnyIcon name={category?.icon ?? "other"} size={16} color={category?.color} />
      </span>
      <span className="mt-rec-info">
        <span className="mt-rec-name">{item.name}</span>
        <span className="mt-rec-sub">
          {tCategory(item.categoryKey)} · {t(`frequencies.${item.frequency}`)}
          <br />
          {t("moneyTab.nextLabel")}: {item.nextDate}
        </span>
      </span>
      <span className={"mt-rec-amount" + (isIncome ? " mt-amount-income" : "")}>
        {isIncome ? "+" : "-"}{formatMoney(item.amount)}
      </span>
    </button>
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
        <button className="dw-add-btn" onClick={() => setModalState({ mode: "add" })}>
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
              onClick={(item) => setModalState({ mode: "edit", item })}
            />
          ))
        ) : (
          <EmptyState icon="receipt" label={t("moneyTab.noTransactionsYet")} />
        )}
      </div>

      {modalState && (
        <TransactionForm
          onClose={closeModal}
          initialValues={modalState.mode === "edit" ? modalState.item : null}
        />
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
            <RecurringRow
              key={item.id}
              item={item}
              categories={categories}
              formatMoney={formatMoney}
              onClick={(i) => setModalState({ mode: "edit", item: i })}
            />
          ))
        ) : (
          <EmptyState icon="cycle" label={t("moneyTab.noRecurringYet")} />
        )}
      </div>

      {modalState && (
        <RecurringForm
          onClose={closeModal}
          initialValues={modalState.mode === "edit" ? modalState.item : null}
        />
      )}
    </div>
  );
}