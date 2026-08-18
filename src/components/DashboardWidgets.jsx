import { useState } from "react";
import { useAppData } from "../context/AppContext";
import { getLocalDateString } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import Icon from "./Icon";
import "./DashboardWidgets.css";

const goalIconChoices = ["laptop", "ticket", "airplane", "bicycle", "car", "console", "boombox", "musicPlayer", "camera", "trip"];
const goalColorChoices = ["#ff9500", "#0071e3", "#5856d6", "#ff2d55", "#34c759", "#af52de", "#ff3b30", "#ffcc00"];

/* ---------------- shared bits ---------------- */

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

/* ---------------- Transaction form: dispatches through context ---------------- */

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
      name: name.trim() || tCategory(categoryKey),
    };
    if (isEditing) updateTransaction(tx);
    else addTransaction(tx);
    onClose();
  };

  if (confirmingDelete) {
    return (
      <div className="dw-confirm">
        <p className="dw-confirm-text">{t("transactionModal.deleteConfirm")}</p>
        <div className="dw-form-actions">
          <button type="button" className="dw-btn dw-btn-secondary" onClick={() => setConfirmingDelete(false)}>{t("common.cancel")}</button>
          <button
            type="button"
            className="dw-btn dw-btn-danger"
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
    <form className="dw-form" onSubmit={handleSubmit}>
      <TypeToggle type={type} onChange={setType} />
      <label className="dw-field">
        <span className="dw-label">{t("common.name")}</span>
        <input
          type="text"
          placeholder={t("moneyTab.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="dw-input"
        />
      </label>
      <label className="dw-field">
        <span className="dw-label">{t("common.amount")}</span>
        <div className="dw-amount-wrap">
          <span className="dw-currency">{currencySymbol}</span>
          <input
            type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.00"
            value={amount} onChange={(e) => setAmount(e.target.value)} className="dw-amount-input" autoFocus
          />
        </div>
      </label>
      <label className="dw-field">
        <span className="dw-label">{t("common.category")}</span>
        {categories.length > 0 ? (
          <select value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)} className="dw-select">
            {categories.map((c) => (
              <option key={c.id} value={c.key}>{tCategory(c.key)}</option>
            ))}
          </select>
        ) : (
          <span className="dw-field-hint">Add a category in the Budget tab first</span>
        )}
      </label>
      <label className="dw-field">
        <span className="dw-label">{t("common.date")}</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="dw-input" />
      </label>
      <div className="dw-form-actions">
        {isEditing && (
          <button type="button" className="dw-btn dw-btn-danger dw-btn-left" onClick={() => setConfirmingDelete(true)}>
            {t("common.delete")}
          </button>
        )}
        <button type="button" className="dw-btn dw-btn-secondary" onClick={onClose}>{t("common.cancel")}</button>
        <button type="submit" className="dw-btn dw-btn-primary" disabled={!isValid}>
          {isEditing ? t("common.saveChanges") : t("common.save")}
        </button>
      </div>
    </form>
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
        <Icon name={category?.icon ?? "other"} size={16} color={category?.color} />
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
          <span className="cal-actions-placeholder">{t("dashboard.noTransactionsYet")}</span>
        )}
      </div>

      {modalState && (
        <ModalShell title={modalState.mode === "edit" ? t("moneyTab.editTransaction") : t("moneyTab.addTransaction")} onClose={closeModal}>
          <TransactionForm
            onClose={closeModal}
            initialValues={modalState.mode === "edit" ? modalState.item : null}
          />
        </ModalShell>
      )}
    </div>
  );
}

/* ---------------- RIGHT COLUMN, ROW 1: Report, derived from context ---------------- */

export function ReportWidget() {
  const { income, expenses, categories, formatMoney, formatMoneyCompact } = useAppData();
  const { t, tCategory } = useTranslation();

  const trend = [
    {
      key: "08",
      label: t("reportsTab.months.Aug"),
      income,
      expenses,
    },
  ];

  // was .slice(0, 3) — now shows every category with real spending,
  // sorted highest first, scrollable if the list runs long
  const spendingCategories = [...categories]
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  const current = trend[trend.length - 1];
  const previous = trend[trend.length - 2];
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
            <span className="cal-actions-placeholder">{t("dashboard.noSpendingYet")}</span>
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
  const [limit, setLimit] = useState(String(initialLimit));
  const parsed = parseFloat(limit);
  const isValid = limit.trim() !== "" && !isNaN(parsed) && parsed > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    setBudget(parsed);
    onClose();
  };

  return (
    <form className="dw-form" onSubmit={handleSubmit}>
      <label className="dw-field">
        <span className="dw-label">{t("dashboard.monthlyBudget")}</span>
        <div className="dw-amount-wrap">
          <span className="dw-currency">{currencySymbol}</span>
          <input
            type="number" inputMode="decimal" step="0.01" min="0"
            value={limit} onChange={(e) => setLimit(e.target.value)} className="dw-amount-input" autoFocus
          />
        </div>
      </label>
      <div className="dw-form-actions">
        <button type="button" className="dw-btn dw-btn-secondary" onClick={onClose}>{t("common.cancel")}</button>
        <button type="submit" className="dw-btn dw-btn-primary" disabled={!isValid}>{t("common.save")}</button>
      </div>
    </form>
  );
}

/* ---------------- RIGHT COLUMN, ROW 3: Goals, reads + writes context ---------------- */

function GoalForm({ onClose, initialValues }) {
  const { addGoal, updateGoal, deleteGoal, contributeToGoal, withdrawFromGoal, currencySymbol, formatMoney } = useAppData();
  const { t } = useTranslation();
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
      <div className="dw-confirm">
        <p className="dw-confirm-text">{t("goalForm.deleteGoalConfirm")}</p>
        <div className="dw-form-actions">
          <button type="button" className="dw-btn dw-btn-secondary" onClick={() => setView("details")}>{t("common.cancel")}</button>
          <button type="button" className="dw-btn dw-btn-danger" onClick={() => { deleteGoal(initialValues.id); onClose(); }}>
            {t("common.delete")}
          </button>
        </div>
      </div>
    );
  }

  if (view === "funds") {
    return (
      <form className="dw-form" onSubmit={handleFundsSubmit}>
        <div className="dw-type-toggle" role="tablist" aria-label="Funds direction">
          <button
            type="button" role="tab" aria-selected={fundsMode === "add"}
            className={"dw-type-btn" + (fundsMode === "add" ? " dw-type-btn-active dw-type-income" : "")}
            onClick={() => setFundsMode("add")}
          >
            {t("common.add")}
          </button>
          <button
            type="button" role="tab" aria-selected={fundsMode === "remove"}
            className={"dw-type-btn" + (fundsMode === "remove" ? " dw-type-btn-active dw-type-expense" : "")}
            onClick={() => setFundsMode("remove")}
          >
            {t("common.remove")}
          </button>
        </div>

        <p className="dw-goal-contribute-hint">
          {fundsMode === "add" ? t("goalForm.addFundsHint") : t("goalForm.removeFundsHint")}
        </p>

        <label className="dw-field">
          <span className="dw-label">{t("common.amount")}</span>
          <div className="dw-amount-wrap">
            <span className="dw-currency">{currencySymbol}</span>
            <input
              type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.00"
              value={amount} onChange={(e) => setAmount(e.target.value)} className="dw-amount-input" autoFocus
            />
          </div>
        </label>
        {overRemoving && (
          <span className="dw-goal-error">
            {t("goalForm.cantRemoveMore", { amount: formatMoney(initialValues.current) })}
          </span>
        )}

        <label className="dw-field">
          <span className="dw-label">{t("common.date")}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="dw-input" />
        </label>

        <div className="dw-form-actions">
          <button type="button" className="dw-btn dw-btn-secondary" onClick={() => setView("details")}>{t("common.back")}</button>
          <button type="submit" className="dw-btn dw-btn-primary" disabled={!fundsValid}>
            {fundsMode === "add" ? t("goalForm.addFunds") : t("goalForm.removeFunds")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="dw-form" onSubmit={handleSaveDetails}>
      {isEditing && (
        <div className="dw-field">
          <span className="dw-label">{t("goalForm.status")}</span>
          <div className="dw-type-toggle" role="tablist" aria-label="Goal status">
            <button
              type="button" role="tab" aria-selected={status === "active"}
              className={"dw-type-btn" + (status === "active" ? " dw-type-btn-active dw-type-income" : "")}
              onClick={() => setStatus("active")}
            >
              {t("goalForm.statusActive")}
            </button>
            <button
              type="button" role="tab" aria-selected={status === "completed"}
              className={"dw-type-btn" + (status === "completed" ? " dw-type-btn-active dw-type-income" : "")}
              onClick={() => setStatus("completed")}
            >
              {t("goalForm.statusCompleted")}
            </button>
            <button
              type="button" role="tab" aria-selected={status === "acquired"}
              className={"dw-type-btn" + (status === "acquired" ? " dw-type-btn-active dw-type-income" : "")}
              onClick={() => setStatus("acquired")}
            >
              {t("goalForm.statusAcquired")}
            </button>
          </div>
        </div>
      )}

      <label className="dw-field">
        <span className="dw-label">{t("goalForm.goalName")}</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="dw-input" autoFocus />
      </label>

      <div className="dw-field">
        <span className="dw-label">{t("common.icon")}</span>
        <div className="dw-icon-grid">
          {goalIconChoices.map((i) => (
            <button
              type="button" key={i}
              className={"dw-icon-choice" + (icon === i ? " dw-icon-choice-active" : "")}
              onClick={() => setIcon(i)}
            >
              <Icon name={i} size={18} color={icon === i ? color : undefined} />
            </button>
          ))}
        </div>
      </div>

      <div className="dw-field">
        <span className="dw-label">{t("common.color")}</span>
        <div className="dw-color-grid">
          {goalColorChoices.map((c) => (
            <button
              type="button" key={c}
              className={"dw-color-choice" + (color === c ? " dw-color-choice-active" : "")}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      <label className="dw-field">
        <span className="dw-label">{t("common.target")}</span>
        <div className="dw-amount-wrap">
          <span className="dw-currency">{currencySymbol}</span>
          <input
            type="number" inputMode="decimal" step="0.01" min="0"
            value={target} onChange={(e) => setTarget(e.target.value)} className="dw-amount-input"
          />
        </div>
      </label>

      <div className="dw-form-actions">
        {isEditing && (
          <button type="button" className="dw-btn dw-btn-danger dw-btn-left" onClick={() => setView("confirmDelete")}>{t("common.delete")}</button>
        )}
        <button type="button" className="dw-btn dw-btn-secondary" onClick={onClose}>{t("common.cancel")}</button>
        {isEditing && (
          <button type="button" className="dw-btn dw-btn-accent" onClick={() => setView("funds")}>{t("goalForm.addRemove")}</button>
        )}
        <button type="submit" className="dw-btn dw-btn-primary" disabled={!detailsValid}>
          {isEditing ? t("common.saveChanges") : t("goalForm.createGoal")}
        </button>
      </div>
    </form>
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
        <Icon name={icon} size={20} color={status === "acquired" ? "#0969da" : (done ? "#1a7f37" : color)} />
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
          <span className="cal-actions-placeholder">{t("dashboard.noGoalsYet")}</span>
        )}
      </div>

      {modalState && (
        <ModalShell title={modalState.mode === "edit" ? t("goalForm.editGoal") : t("goalForm.newGoal")} onClose={closeModal}>
          <GoalForm onClose={closeModal} initialValues={modalState.mode === "edit" ? modalState.item : null} />
        </ModalShell>
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