import { useState } from "react";
import { useAppData } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import Icon from "./Icon";
import "./SavingsGoalsTab.css";

const goalIconChoices = ["laptop", "ticket", "airplane", "bicycle", "car", "console", "boombox", "musicPlayer", "camera", "trip"];
const goalColorChoices = ["#ff9500", "#0071e3", "#5856d6", "#ff2d55", "#34c759", "#af52de", "#ff3b30", "#ffcc00"];

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

/* ---------------- goal form: dispatches through context ---------------- */

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
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

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
        new Date().toISOString().slice(0, 10),
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

/* ---------------- progress ring ---------------- */

function GoalRing({ current, target, icon, color, status, size = 72, stroke = 8 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(current / target, 1) : 0;
  const offset = circumference * (1 - pct);

  const reached = current >= target;
  const done = status === "completed" || status === "acquired" || reached;

  const activeColor =
    status === "acquired"
      ? "#0969da"
      : done
        ? "#1a7f37"
        : (color ?? "var(--cal-accent)");

  const iconColor =
    status === "acquired"
      ? "#0969da"
      : done
        ? "#1a7f37"
        : color;

  return (
    <div className="sg-ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--cal-bg)"
          strokeWidth={stroke}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={activeColor}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <div className="sg-ring-center">
        <Icon
          name={icon}
          size={24}
          color={iconColor}
        />
      </div>
    </div>
  );
}

/* ---------------- goal card ---------------- */

function GoalCard({ goal, onClick, formatMoney, formatMoneyCompact }) {
  const reached = goal.current >= goal.target;
  const done = goal.status === "completed" || reached;

  return (
    <button
      className="sg-card"
      onClick={() => onClick(goal)}
    >
      <GoalRing
        current={goal.current}
        target={goal.target}
        icon={goal.icon}
        color={goal.color}
        status={goal.status}
      />

      <div className="sg-card-info">
        <span className="sg-card-name">
          {goal.name}
        </span>

        <span
          className={
            "sg-card-amounts" +
            (done ? " sg-card-complete" : "")
          }
          title={`${formatMoney(goal.current)} / ${formatMoney(goal.target)}`}
        >
          {formatMoneyCompact(goal.current)} / {formatMoneyCompact(goal.target)}
        </span>
      </div>
    </button>
  );
}

/* ---------------- main panel: reads goals from context ---------------- */

export default function SavingsGoalsTab() {
  const { goals, formatMoney, formatMoneyCompact } = useAppData();
  const { t } = useTranslation();
  const [modalState, setModalState] = useState(null);

  const closeModal = () => setModalState(null);

  const visibleGoals = goals.filter((g) => g.status !== "acquired");

  return (
    <div className="leaf-fill sg-panel">
      <div className="sg-header">
        <h3 className="sg-heading">{t("savingsGoalsTab.heading")}</h3>
        <button className="sg-add-btn" onClick={() => setModalState({ mode: "add" })}>{t("savingsGoalsTab.newGoal")}</button>
      </div>

      <div className="sg-grid">
        {visibleGoals.length > 0 ? (
          visibleGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onClick={(g) => setModalState({ mode: "edit", item: g })}
              formatMoney={formatMoney}
              formatMoneyCompact={formatMoneyCompact}
            />
          ))
        ) : (
          <span className="cal-actions-placeholder">{t("savingsGoalsTab.empty")}</span>
        )}
      </div>

      {modalState && (
        <ModalShell title={modalState.mode === "edit" ? t("goalForm.editGoal") : t("goalForm.newGoal")} onClose={closeModal}>
          <GoalForm
            onClose={closeModal}
            initialValues={modalState.mode === "edit" ? modalState.item : null}
          />
        </ModalShell>
      )}
    </div>
  );
}