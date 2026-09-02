import { useState } from "react";
import { useAppData } from "../context/AppContext";
import { getLocalDateString } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import "./DashboardWidgets.css";
import "./mobile/ModalSystemMobile.css";
import IconPicker from "./IconPicker";
import AnyIcon from "./AnyIcon";
import useIsMobile from "../hooks/useIsMobile";

const goalIconChoices = ["laptop", "ticket", "airplane", "bicycle", "car", "console", "boombox", "musicPlayer", "camera", "trip"];
const goalColorChoices = ["#ff9500", "#0071e3", "#5856d6", "#ff2d55", "#34c759", "#af52de", "#ff3b30", "#ffcc00"];

/* ============================================================
   MOBILE-AWARE MODAL HELPERS
   Every modal below (TransactionForm, BudgetForm, GoalForm)
   calls useIsMobile() once and passes the result down through
   these helpers, which pick the desktop new-project-*dw-*
   classes or the mobile mm-* classes accordingly. This keeps
   each form a single source of truth instead of two parallel
   components to maintain.
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

/* Generalized so TransactionForm's expense/income, GoalForm's
   add/remove funds, and GoalForm's 3-way status toggle all share
   one implementation instead of three copies of the same markup. */
function TypeToggle({ isMobile, type, onChange, options }) {
  const toggleClass = isMobile ? "mm-type-toggle" : "dw-type-toggle";
  const btnClass = isMobile ? "mm-type-btn" : "dw-type-btn";
  const activeClass = isMobile ? "mm-type-btn-active" : "dw-type-btn-active";
  const variantClass = (v) => (isMobile ? `mm-type-${v}` : `dw-type-${v}`);

  return (
    <div className={toggleClass} role="tablist" aria-label="Type">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={type === opt.value}
          className={btnClass + (type === opt.value ? ` ${activeClass} ${variantClass(opt.variant)}` : "")}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const gridClass = (isMobile, kind) => (isMobile ? `mm-${kind}-grid` : `dw-${kind}-grid`);
const choiceClass = (isMobile, kind, active) =>
  (isMobile ? `mm-${kind}-choice` : `dw-${kind}-choice`) +
  (active ? (isMobile ? ` mm-${kind}-choice-active` : ` dw-${kind}-choice-active`) : "");

const primaryBtnClass = (isMobile) => (isMobile ? "mm-btn mm-btn-primary" : "primary-btn");
const secondaryBtnClass = (isMobile) => (isMobile ? "mm-btn mm-btn-secondary" : "secondary-btn");
const dangerBtnClass = (isMobile) => (isMobile ? "mm-btn mm-btn-danger" : "secondary-btn transaction-delete-btn");
const dangerLeftBtnClass = (isMobile) => (isMobile ? "mm-btn mm-btn-danger" : "secondary-btn transaction-delete-btn dw-btn-left");
// Delete is the action being confirmed on this screen, so on mobile it gets
// the filled/primary treatment instead of the quiet text-link style.
const confirmDeleteStyle = { background: "linear-gradient(#e5484d, #d1242f)", border: "1px solid #c4262f", color: "#fff" };

/* ---------------- Empty state: icon above label, nothing else ---------------- */

function EmptyState({ icon, label, compact }) {
  return (
    <div className={"dw-empty-state" + (compact ? " dw-empty-state-compact" : "")}>
      <Icon name={icon} size={compact ? 18 : 32} color="var(--cal-muted)" />
      <span className="dw-empty-state-label">{label}</span>
    </div>
  );
}

/* ---------------- Transaction form: dispatches through context ---------------- */

function TransactionForm({ onClose, initialValues }) {
  const {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    categories,
    currencySymbol
  } = useAppData();

  const { t, tCategory } = useTranslation();
  const isMobile = useIsMobile();

  const isEditing = Boolean(initialValues);

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [type, setType] = useState(
    initialValues?.type ?? "expense"
  );

  const [name, setName] = useState(
    initialValues?.name ?? ""
  );

  const [amount, setAmount] = useState(
    initialValues ? String(initialValues.amount) : ""
  );

  const [categoryKey, setCategoryKey] = useState(
    initialValues?.categoryKey ??
    categories[0]?.key ??
    "other"
  );

  const [date, setDate] = useState(
    initialValues?.date ?? getLocalDateString()
  );

  const parsedAmount = parseFloat(amount);

  const isValid =
    amount.trim() !== "" &&
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    categories.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isValid) return;

    const tx = {
      id: initialValues?.id,
      type,
      amount: parsedAmount,
      categoryKey,
      date,
      name: name.trim() || tCategory(categoryKey),
    };

    if (isEditing) {
      updateTransaction(tx);
    } else {
      addTransaction(tx);
    }

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
      title={isEditing ? t("moneyTab.editTransaction") : t("common.newTransaction")}
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
              <button type="button" className={dangerBtnClass(isMobile)} onClick={() => setConfirmingDelete(true)}>
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
        <TypeToggle
          isMobile={isMobile}
          type={type}
          onChange={setType}
          options={[
            { value: "expense", label: t("common.spent"), variant: "expense" },
            { value: "income", label: t("common.acquired"), variant: "income" },
          ]}
        />
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
          <select
            value={categoryKey}
            onChange={(e) => setCategoryKey(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.key}>
                {tCategory(c.key)}
              </option>
            ))}
          </select>
        ) : (
          <span className={isMobile ? "mm-field-hint" : "dw-field-hint"}>
            {t("budgetTab.noCategoriesHint")}
          </span>
        )}
      </FormRow>

      <FormRow isMobile={isMobile} label={t("common.date")}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </FormRow>
    </ModalShell>
  );
}

/* ---------------- LEFT COLUMN: transactions, read from context ---------------- */

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
      <span className={"dw-tx-amount" + (isIncome ? " dw-amount-income" : "")}>
        {isIncome ? "+" : "-"}{formatMoney(tx.amount)}
      </span>
    </button>
  );
}

export function TransactionsList() {
  const { transactions, categories, formatMoney } = useAppData();
  const { t } = useTranslation();
  const [modalState, setModalState] = useState(null);

  const closeModal = () => setModalState(null);

  const sorted = [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="leaf-fill dw-txl-panel">
      <div className="dw-col-header">
        <h3 className="dw-heading">{t("dashboard.transactions")}</h3>
        <button className="dw-add-btn" onClick={() => setModalState({ mode: "add" })}>+ {t("common.add")}</button>
      </div>
      <div className="dw-txl-list">
        {sorted.length > 0 ? (
          sorted.map((tx) => (
            <TxRow key={tx.id} tx={tx} categories={categories} formatMoney={formatMoney} onClick={(item) => setModalState({ mode: "edit", item })} />
          ))
        ) : (
          <EmptyState icon="receipt" label={t("dashboard.noTransactionsYet")} />
        )}
      </div>

      {modalState && (
        <TransactionForm
          onClose={closeModal}
          initialValues={
            modalState.mode === "edit"
              ? modalState.item
              : null
          }
        />
      )}
    </div>
  );
}

/* ---------------- RIGHT COLUMN, ROW 1: Report, derived from context ---------------- */

export function ReportWidget() {
  const {
    monthlyHistory,
    categories,
    formatMoney,
    formatMoneyCompact,
    activeMonthKey,
  } = useAppData();
  const { t, tCategory } = useTranslation();

  const trend = monthlyHistory.map((m) => ({
    key: m.key,
    label: t(`reportsTab.months.${m.abbrev}`),
    income: m.income,
    expenses: m.expenses,
  }));

  const spendingCategories = [...categories]
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  const currentIndex = trend.findIndex((m) => m.key === activeMonthKey);
  const current = trend[currentIndex];
  const previous = currentIndex > 0 ? trend[currentIndex - 1] : undefined;

  const delta = previous ? current.expenses - previous.expenses : 0;
  const deltaPct = previous && previous.expenses > 0 ? (delta / previous.expenses) * 100 : 0;
  const up = delta > 0;

  const maxVal = Math.max(...trend.map((m) => Math.max(m.income, m.expenses)), 1);
  const catTotal = spendingCategories.reduce((s, c) => s + c.spent, 0);

  return (
    <div className="leaf-fill dw-report-panel">
      <div className="dw-col-header">
        <h3 className="dw-heading">{t("dashboard.report")}</h3>
        {previous && (
          <span className={"dw-report-delta" + (up ? " dw-report-delta-up" : " dw-report-delta-down")}>
            {up ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(0)}%
          </span>
        )}
      </div>

      <div className="dw-report-body">
        <div className="dw-report-trend">
          {trend.map((m) => (
            <div className="dw-report-trend-col" key={m.key}>
              <div className="dw-report-trend-bars">
                <span
                  className="dw-report-bar dw-report-bar-income"
                  style={{ height: `${(m.income / maxVal) * 100}%` }}
                  title={`${t("common.income")}: ${formatMoney(m.income)}`}
                />
                <span
                  className="dw-report-bar dw-report-bar-expense"
                  style={{ height: `${(m.expenses / maxVal) * 100}%` }}
                  title={`${t("common.expenses")}: ${formatMoney(m.expenses)}`}
                />
              </div>
              <span className="dw-report-trend-label">{m.label}</span>
            </div>
          ))}
        </div>

        <div className="dw-report-cats">
          {spendingCategories.length > 0 ? (
            spendingCategories.map((c) => {
              const pct = catTotal > 0 ? (c.spent / catTotal) * 100 : 0;
              return (
                <div className="dw-report-cat-row" key={c.id}>
                  <span className="dw-report-cat-dot" style={{ background: c.color }} />
                  <span className="dw-report-cat-name">{tCategory(c.key)}</span>
                  <span className="dw-report-cat-bar-track">
                    <span className="dw-report-cat-bar-fill" style={{ width: `${pct}%`, background: c.color }} />
                  </span>
                  <span className="dw-report-cat-amount" title={formatMoney(c.spent)}>{formatMoneyCompact(c.spent)}</span>
                </div>
              );
            })
          ) : (
            <EmptyState icon="chart" label={t("dashboard.noSpendingYet")} compact />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- RIGHT COLUMN, ROW 2: Budget, reads + writes context ---------------- */

function BudgetForm({ onClose, initialLimit }) {
  const { setBudget, currencySymbol } = useAppData();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [limit, setLimit] = useState(String(initialLimit ?? ""));
  const parsed = parseFloat(limit);
  const isValid = limit.trim() !== "" && !isNaN(parsed) && parsed > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    setBudget(parsed);
    onClose();
  };

  return (
    <ModalShell
      isMobile={isMobile}
      title={t("dashboard.monthlyBudget")}
      onClose={onClose}
      footer={
        isMobile ? (
          <>
            <button type="button" className={primaryBtnClass(isMobile)} disabled={!isValid} onClick={handleSubmit}>
              {t("common.save")}
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
              {t("common.save")}
            </button>
          </>
        )
      }
    >
      <FormRow isMobile={isMobile} label={t("dashboard.monthlyBudget")}>
        <AmountField
          isMobile={isMobile}
          currencySymbol={currencySymbol}
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          autoFocus
        />
      </FormRow>
    </ModalShell>
  );
}

/* ---------------- RIGHT COLUMN, ROW 3: Goals, reads + writes context ---------------- */

function GoalForm({ onClose, initialValues }) {
  const { addGoal, updateGoal, deleteGoal, contributeToGoal, withdrawFromGoal, currencySymbol, formatMoney } = useAppData();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const isEditing = Boolean(initialValues);
  const [view, setView] = useState("details");

  const [name, setName] = useState(initialValues?.name ?? "");
  const [icon, setIcon] = useState(initialValues?.icon ?? goalIconChoices[0]);
  const [color, setColor] = useState(initialValues?.color ?? goalColorChoices[0]);
  const [target, setTarget] = useState(initialValues ? String(initialValues.target) : "");
  const [status, setStatus] = useState(initialValues?.status ?? "active");

  const [fundsMode, setFundsMode] = useState("add");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getLocalDateString());

  const parsedTarget = parseFloat(target);
  const detailsValid = name.trim() !== "" && !isNaN(parsedTarget) && parsedTarget > 0;

  const parsedAmount = parseFloat(amount);
  const overRemoving = fundsMode === "remove" && initialValues && parsedAmount > initialValues.current;
  const fundsValid = amount.trim() !== "" && !isNaN(parsedAmount) && parsedAmount > 0 && !overRemoving;

  const handleSaveDetails = (e) => {
    e.preventDefault();
    if (!detailsValid) return;
    const goal = { id: initialValues?.id, name: name.trim(), icon, color, target: parsedTarget, status };
    if (isEditing) updateGoal(goal);
    else addGoal(goal);

    const enteringDone = isEditing && (status === "completed" || status === "acquired");
    const wasAlreadyDone = initialValues?.status === "completed" || initialValues?.status === "acquired";
    const remaining = enteringDone ? parsedTarget - initialValues.current : 0;

    if (enteringDone && !wasAlreadyDone && remaining > 0) {
      contributeToGoal(
        initialValues.id,
        remaining,
        getLocalDateString(),
        undefined,
        t("categories.savings"),
        t("common.goal")
      );
    }

    onClose();
  };

  const handleFundsSubmit = (e) => {
    e.preventDefault();
    if (!fundsValid || !initialValues) return;
    if (fundsMode === "add") contributeToGoal(initialValues.id, parsedAmount, date, undefined, t("categories.savings"), t("common.goal"));
    else withdrawFromGoal(initialValues.id, parsedAmount, date, undefined, t("common.withdrawal"), t("common.goal"));
    onClose();
  };

  if (view === "confirmDelete") {
    return (
      <ModalShell
        isMobile={isMobile}
        confirm
        title={t("common.delete")}
        onClose={onClose}
        footer={
          isMobile ? (
            <>
              <button
                type="button"
                className={dangerBtnClass(isMobile)}
                style={confirmDeleteStyle}
                onClick={() => { deleteGoal(initialValues.id); onClose(); }}
              >
                {t("common.delete")}
              </button>
              <button type="button" className={secondaryBtnClass(isMobile)} onClick={() => setView("details")}>
                {t("common.cancel")}
              </button>
            </>
          ) : (
            <>
              <button type="button" className={secondaryBtnClass(isMobile)} onClick={() => setView("details")}>
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className={dangerBtnClass(isMobile)}
                onClick={() => { deleteGoal(initialValues.id); onClose(); }}
              >
                {t("common.delete")}
              </button>
            </>
          )
        }
      >
        {isMobile ? (
          <p className="mm-confirm-text">{t("goalForm.deleteGoalConfirm")}</p>
        ) : (
          <div className="confirm-row">
            <p className="dw-confirm-text">{t("goalForm.deleteGoalConfirm")}</p>
          </div>
        )}
      </ModalShell>
    );
  }

  if (view === "funds") {
    return (
      <ModalShell
        isMobile={isMobile}
        title={t("goalForm.addRemove")}
        onClose={onClose}
        footer={
          isMobile ? (
            <>
              <button type="button" className={primaryBtnClass(isMobile)} disabled={!fundsValid} onClick={handleFundsSubmit}>
                {fundsMode === "add" ? t("goalForm.addFunds") : t("goalForm.removeFunds")}
              </button>
              <button type="button" className={secondaryBtnClass(isMobile)} onClick={() => setView("details")}>
                {t("common.back")}
              </button>
            </>
          ) : (
            <>
              <button type="button" className={secondaryBtnClass(isMobile)} onClick={() => setView("details")}>
                {t("common.back")}
              </button>
              <button type="button" className={primaryBtnClass(isMobile)} disabled={!fundsValid} onClick={handleFundsSubmit}>
                {fundsMode === "add" ? t("goalForm.addFunds") : t("goalForm.removeFunds")}
              </button>
            </>
          )
        }
      >
        <FormRow isMobile={isMobile} label={t("common.type")}>
          <TypeToggle
            isMobile={isMobile}
            type={fundsMode}
            onChange={setFundsMode}
            options={[
              { value: "add", label: t("common.add"), variant: "income" },
              { value: "remove", label: t("common.remove"), variant: "expense" },
            ]}
          />
        </FormRow>

        <FormRow isMobile={isMobile}>
          <p className="dw-goal-contribute-hint">
            {fundsMode === "add" ? t("goalForm.addFundsHint") : t("goalForm.removeFundsHint")}
          </p>
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

        {overRemoving && (
          <FormRow isMobile={isMobile}>
            <span className="dw-goal-error">
              {t("goalForm.cantRemoveMore", { amount: formatMoney(initialValues.current) })}
            </span>
          </FormRow>
        )}

        <FormRow isMobile={isMobile} label={t("common.date")}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </FormRow>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      isMobile={isMobile}
      title={isEditing ? t("goalForm.editGoal") : t("goalForm.newGoal")}
      onClose={onClose}
      footer={
        isMobile ? (
          <>
            <button type="button" className={primaryBtnClass(isMobile)} disabled={!detailsValid} onClick={handleSaveDetails}>
              {isEditing ? t("common.saveChanges") : t("goalForm.createGoal")}
            </button>
            <button type="button" className={secondaryBtnClass(isMobile)} onClick={onClose}>
              {t("common.cancel")}
            </button>
            {isEditing && (
              <button type="button" className={secondaryBtnClass(isMobile)} onClick={() => setView("funds")}>
                {t("goalForm.addRemove")}
              </button>
            )}
            {isEditing && (
              <button type="button" className={dangerBtnClass(isMobile)} onClick={() => setView("confirmDelete")}>
                {t("common.delete")}
              </button>
            )}
          </>
        ) : (
          <>
            {isEditing && (
              <button type="button" className={dangerLeftBtnClass(isMobile)} onClick={() => setView("confirmDelete")}>
                {t("common.delete")}
              </button>
            )}
            <button type="button" className={secondaryBtnClass(isMobile)} onClick={onClose}>
              {t("common.cancel")}
            </button>
            {isEditing && (
              <button type="button" className={secondaryBtnClass(isMobile)} onClick={() => setView("funds")}>
                {t("goalForm.addRemove")}
              </button>
            )}
            <button type="button" className={primaryBtnClass(isMobile)} disabled={!detailsValid} onClick={handleSaveDetails}>
              {isEditing ? t("common.saveChanges") : t("goalForm.createGoal")}
            </button>
          </>
        )
      }
    >
      {isEditing && (
        <FormRow isMobile={isMobile} label={t("goalForm.status")}>
          <TypeToggle
            isMobile={isMobile}
            type={status}
            onChange={setStatus}
            options={[
              { value: "active", label: t("goalForm.statusActive"), variant: "income" },
              { value: "completed", label: t("goalForm.statusCompleted"), variant: "income" },
              { value: "acquired", label: t("goalForm.statusAcquired"), variant: "income" },
            ]}
          />
        </FormRow>
      )}

      <FormRow isMobile={isMobile} label={t("common.name")}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus={!isEditing}
        />
      </FormRow>

      <FormRow isMobile={isMobile} label={t("common.icon")}>
        <div className={gridClass(isMobile, "icon")}>
          {goalIconChoices.map((i) => (
            <button
              type="button" key={i}
              className={choiceClass(isMobile, "icon", icon === i)}
              onClick={() => setIcon(i)}
            >
              <Icon name={i} size={isMobile ? 20 : 18} color={icon === i ? color : undefined} />
            </button>
          ))}

          <IconPicker
            value={!goalIconChoices.includes(icon) ? icon : undefined}
            onChange={setIcon}
            triggerClassName={choiceClass(isMobile, "icon", !goalIconChoices.includes(icon))}
          />
        </div>
      </FormRow>

      <FormRow isMobile={isMobile} label={t("common.color")}>
        <div className={gridClass(isMobile, "color")}>
          {goalColorChoices.map((c) => (
            <button
              type="button" key={c}
              className={choiceClass(isMobile, "color", color === c)}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={c}
            />
          ))}
        </div>
      </FormRow>

      <FormRow isMobile={isMobile} label={t("common.target")}>
        <AmountField
          isMobile={isMobile}
          currencySymbol={currencySymbol}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
      </FormRow>
    </ModalShell>
  );
}

function GoalRing({ current, target, icon, color, status, size = 56, stroke = 6 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(current / target, 1) : 0;
  const offset = circumference * (1 - pct);
  const reached = current >= target;
  const done = status === "completed" || status === "acquired" || reached;
  const activeColor = status === "acquired" ? "#0969da" : done ? "#1a7f37" : (color ?? "var(--cal-accent)");

  return (
    <div className="dw-goal-ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--cal-bg)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={activeColor}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="dw-goal-ring-center">
        <AnyIcon name={icon} size={20} color={status === "acquired" ? "#0969da" : (done ? "#1a7f37" : color)} />
      </div>
    </div>
  );
}

export function GoalsWidget() {
  const { goals, formatMoney, formatMoneyCompact } = useAppData();
  const { t } = useTranslation();
  const [modalState, setModalState] = useState(null);

  const closeModal = () => setModalState(null);

  const visibleGoals = goals.filter((g) => g.status !== "acquired");

  return (
    <div className="leaf-fill dw-goals-panel">
      <div className="dw-col-header">
        <h3 className="dw-heading">{t("dashboard.goals")}</h3>
        <button className="dw-add-btn" onClick={() => setModalState({ mode: "add" })}>+ {t("common.add")}</button>
      </div>
      <div className="dw-goals-row">
        {visibleGoals.length > 0 ? (
          visibleGoals.map((g) => {
            const reached = g.current >= g.target;
            const done = g.status === "completed" || reached;
            return (
              <button key={g.id} className="dw-goal-card" onClick={() => setModalState({ mode: "edit", item: g })}>
                <GoalRing current={g.current} target={g.target} icon={g.icon} color={g.color} status={g.status} />
                <span className="dw-goal-card-name">{g.name}</span>
                <span
                  className={"dw-goal-card-amounts" + (done ? " dw-goal-card-complete" : "")}
                  title={`${formatMoney(g.current)} / ${formatMoney(g.target)}`}
                >
                  {formatMoneyCompact(g.current)} / {formatMoneyCompact(g.target)}
                </span>
              </button>
            );
          })
        ) : (
          <EmptyState icon="flag" label={t("dashboard.noGoalsYet")} />
        )}
      </div>

      {modalState && (
        <GoalForm
          onClose={closeModal}
          initialValues={modalState.mode === "edit" ? modalState.item : null}
        />
      )}
    </div>
  );
}

export function Empty() {

  return (
    <div className="leaf-fill">

    </div>
  );
}