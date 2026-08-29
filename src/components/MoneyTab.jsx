import { useState } from "react";
import { createPortal } from "react-dom";
import { useAppData } from "../context/AppContext";
import { getLocalDateString } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import Icon from "./Icon";
import "./MoneyTab.css";
import "./mobile/ModalSystemMobile.css";
import AnyIcon from "./AnyIcon";
import useIsMobile from "../hooks/useIsMobile";

const frequencyKeys = ["Weekly", "Biweekly", "Monthly", "Yearly"];

/* ============================================================
   MOBILE-AWARE MODAL HELPERS
   Same helpers as DashboardWidgets.jsx (ModalShell, FormRow,
   AmountField, TypeToggle, plus the shared class-name pickers),
   duplicated locally per that file's own convention so
   TransactionForm and RecurringForm render correctly on both
   desktop and mobile.
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
// Delete/remove is the action being confirmed on this screen, so on mobile
// it gets the filled/primary treatment instead of the quiet text-link style.
const confirmDeleteStyle = { background: "linear-gradient(#e5484d, #d1242f)", border: "1px solid #c4262f", color: "#fff" };

/* ---------------- shared "no categories yet" hint ---------------- */

function NoCategoriesHint({ isMobile }) {
  const { t } = useTranslation();
  return (
    <span className={isMobile ? "mm-field-hint" : "dw-field-hint"}>
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

/* ---------------- Transaction form: mobile-aware, same pattern as DashboardWidgets' TransactionForm ---------------- */

function TransactionForm({ onClose, initialValues }) {
  const { addTransaction, updateTransaction, deleteTransaction, categories, currencySymbol } = useAppData();
  const { t, tCategory } = useTranslation();
  const isMobile = useIsMobile();
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
          <p className="mm-confirm-text">{t("moneyTab.deleteTransactionConfirm")}</p>
        ) : (
          <div className="confirm-row">
            <p className="dw-confirm-text">{t("moneyTab.deleteTransactionConfirm")}</p>
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

      <FormRow isMobile={isMobile} label={t("common.name")}>
        <input
          type="text"
          placeholder={t("moneyTab.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          <NoCategoriesHint isMobile={isMobile} />
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

/* ---------------- Recurring form: mobile-aware, same pattern as DashboardWidgets' GoalForm ---------------- */

function RecurringForm({ onClose, initialValues }) {
  const { addRecurring, updateRecurring, deleteRecurring, categories, currencySymbol } = useAppData();
  const { t, tCategory } = useTranslation();
  const isMobile = useIsMobile();
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
    return (
      <ModalShell
        isMobile={isMobile}
        confirm
        title={t("common.remove")}
        onClose={onClose}
        footer={
          isMobile ? (
            <>
              <button type="button" className={dangerBtnClass(isMobile)} style={confirmDeleteStyle} onClick={handleDelete}>
                {t("common.remove")}
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
                {t("common.remove")}
              </button>
            </>
          )
        }
      >
        {isMobile ? (
          <p className="mm-confirm-text">{t("moneyTab.deleteRecurringConfirm")}</p>
        ) : (
          <div className="confirm-row">
            <p className="dw-confirm-text">{t("moneyTab.deleteRecurringConfirm")}</p>
          </div>
        )}
      </ModalShell>
    );
  }

  return (
    <ModalShell
      isMobile={isMobile}
      title={isEditing ? t("moneyTab.editRecurring") : t("moneyTab.addRecurring")}
      onClose={onClose}
      footer={
        isMobile ? (
          <>
            <button type="button" className={primaryBtnClass(isMobile)} disabled={!isValid} onClick={handleSubmit}>
              {isEditing ? t("common.saveChanges") : t("common.add")}
            </button>
            <button type="button" className={secondaryBtnClass(isMobile)} onClick={onClose}>
              {t("common.cancel")}
            </button>
            {isEditing && (
              <button type="button" className={dangerBtnClass(isMobile)} onClick={() => setConfirmingDelete(true)}>
                {t("common.remove")}
              </button>
            )}
          </>
        ) : (
          <>
            {isEditing && (
              <button type="button" className={dangerLeftBtnClass(isMobile)} onClick={() => setConfirmingDelete(true)}>
                {t("common.remove")}
              </button>
            )}
            <button type="button" className={secondaryBtnClass(isMobile)} onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button type="button" className={primaryBtnClass(isMobile)} disabled={!isValid} onClick={handleSubmit}>
              {isEditing ? t("common.saveChanges") : t("common.add")}
            </button>
          </>
        )
      }
    >
      <FormRow isMobile={isMobile} label={t("common.type")}>
        <TypeToggle isMobile={isMobile} type={type} onChange={setType} />
      </FormRow>

      <FormRow isMobile={isMobile} label={t("common.name")}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("moneyTab.namePlaceholder")}
          autoFocus={!isEditing}
        />
      </FormRow>

      <FormRow isMobile={isMobile} label={t("common.amount")}>
        <AmountField
          isMobile={isMobile}
          currencySymbol={currencySymbol}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
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
          <NoCategoriesHint isMobile={isMobile} />
        )}
      </FormRow>

      <FormRow isMobile={isMobile} label={t("common.frequency")}>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          {frequencyKeys.map((f) => (
            <option key={f} value={f}>{t(`frequencies.${f}`)}</option>
          ))}
        </select>
      </FormRow>

      <FormRow isMobile={isMobile} label={t("common.nextDate")}>
        <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
      </FormRow>
    </ModalShell>
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