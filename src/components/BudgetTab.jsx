import { useState } from "react";
import { createPortal } from "react-dom";
import { useAppData } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import Icon from "./Icon";
import "./BudgetTab.css";

const iconChoices = ["food", "transport", "school", "entertainment", "shopping", "other", "savings"];
const colorChoices = ["#ff9500", "#0071e3", "#5856d6", "#ff2d55", "#34c759", "#af52de", "#ff3b30", "#ffcc00"];

/* ---------------- progress ring ---------------- */

function ProgressRing({ spent, limit, size = 120, stroke = 12 }) {
  const { formatMoney, formatMoneyCompact } = useAppData();
  const { t } = useTranslation();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = limit > 0 ? Math.min(spent / limit, 1) : 0;
  const offset = circumference * (1 - pct);
  const remaining = Math.max(limit - spent, 0);
  const overBudget = spent > limit;

  return (
    <div className="bt-ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--cal-bg)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={overBudget ? "#d1242f" : "var(--cal-accent)"}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="bt-ring-center">
        <span
          className="bt-ring-value"
          title={formatMoney(remaining)}
          style={{ whiteSpace: "nowrap", fontSize: "clamp(14px, 4vw, 20px)" }}
        >
          {formatMoneyCompact(remaining)}
        </span>
        <span className="bt-ring-label">{overBudget ? t("dashboard.over") : t("dashboard.left")}</span>
      </div>
    </div>
  );
}

/* ---------------- Budget form: self-contained, same markup as GoalForm/TransactionForm ---------------- */

function BudgetForm({ onClose, initialLimit }) {
  const { setBudget, currencySymbol } = useAppData();
  const { t } = useTranslation();
  const [limit, setLimit] = useState(String(initialLimit ?? ""));
  const parsed = parseFloat(limit);
  const isValid = limit.trim() !== "" && !isNaN(parsed) && parsed > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    setBudget(parsed);
    onClose();
  };

  return createPortal(
    <div className="new-project-overlay">
      <div
        className="new-project-window"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="new-project-header">
          <h4>{t("budgetTab.editMonthlyBudget")}</h4>
        </div>

        <div className="new-project-content">
          <div className="form-row form-row-a form-row-name">
            <label>{t("icons.budget")}</label>

            <div className="dw-amount-wrap">
              <span className="dw-currency">{currencySymbol}</span>

              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="dw-amount-input"
                autoFocus
              />
            </div>
          </div>
        </div>

        <div className="new-project-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>
            {t("common.cancel")}
          </button>

          <button
            type="button"
            className="primary-btn"
            disabled={!isValid}
            onClick={handleSubmit}
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}

/* ---------------- Category form: self-contained, same markup pattern as GoalForm ---------------- */

function CategoryForm({ onClose, initialValues }) {
  const { addCategory, updateCategory, deleteCategory, currencySymbol } = useAppData();
  const { t } = useTranslation();
  const isEditing = Boolean(initialValues);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [name, setName] = useState(initialValues?.key ?? "");
  const [icon, setIcon] = useState(initialValues?.icon ?? iconChoices[0]);
  const [color, setColor] = useState(initialValues?.color ?? colorChoices[0]);
  const [limit, setLimit] = useState(initialValues ? String(initialValues.limit) : "");

  const parsedLimit = parseFloat(limit);
  const isValid = limit.trim() !== "" && !isNaN(parsedLimit) && parsedLimit > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;

    const generatedKey = name.trim() || icon;
    const key = isEditing ? initialValues.key : generatedKey.toLowerCase().replace(/\s+/g, "_");

    const cat = { id: initialValues?.id, key, icon, color, limit: parsedLimit };

    if (isEditing) updateCategory(cat);
    else addCategory(cat);

    onClose();
  };

  if (confirmingDelete) {
    return createPortal(
      <div className="new-project-overlay">
        <div
          className="new-project-window"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="new-project-header">
            <h4>{t("common.delete")}</h4>
          </div>

          <div className="new-project-content">
            <div className="form-row">
              <p className="dw-confirm-text">
                {t("budgetTab.deleteCategoryConfirm")}
              </p>
            </div>
          </div>

          <div className="new-project-footer">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setConfirmingDelete(false)}
            >
              {t("common.cancel")}
            </button>

            <button
              type="button"
              className="secondary-btn transaction-delete-btn"
              onClick={() => { deleteCategory(initialValues.id); onClose(); }}
            >
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
      <div
        className="new-project-window"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="new-project-header">
          <h4>{isEditing ? t("budgetTab.editCategory") : t("budgetTab.addCategory")}</h4>
        </div>

        <div className="new-project-content">
          <div className="form-row form-row-a form-row-name">
            <label>{t("common.name")}</label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("budgetTab.namePlaceholder")}
              autoFocus
            />
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>{t("common.icon")}</label>

            <div className="dw-icon-grid">
              {iconChoices.map((i) => (
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

          <div className="form-row form-row-a form-row-name">
            <label>{t("common.color")}</label>

            <div className="dw-color-grid">
              {colorChoices.map((c) => (
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

          <div className="form-row form-row-a form-row-name">
            <label>{t("budgetTab.monthlyLimit")}</label>

            <div className="dw-amount-wrap">
              <span className="dw-currency">{currencySymbol}</span>

              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="dw-amount-input"
              />
            </div>
          </div>
        </div>

        <div className="new-project-footer">
          {isEditing && (
            <button
              type="button"
              className="secondary-btn transaction-delete-btn dw-btn-left"
              onClick={() => setConfirmingDelete(true)}
            >
              {t("common.delete")}
            </button>
          )}

          <button type="button" className="secondary-btn" onClick={onClose}>
            {t("common.cancel")}
          </button>

          <button
            type="button"
            className="primary-btn"
            disabled={!isValid}
            onClick={handleSubmit}
          >
            {isEditing ? t("common.saveChanges") : t("common.add")}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}

/* ---------------- LEFT COLUMN: reads budget + expenses from context ---------------- */

export function BudgetOverviewColumn() {
  const { budget, expenses, formatMoney } = useAppData();
  const { t } = useTranslation();
  const [editingBudget, setEditingBudget] = useState(false);

  const remaining = Math.max(budget - expenses, 0);

  const statValueStyle = { whiteSpace: "nowrap", fontSize: "clamp(12px, 3vw, 16px)" };

  return (
    <div className="leaf-fill dw-txl-panel">
      <div className="dw-col-header">
        <h3 className="dw-heading">{t("icons.budget")}</h3>
        <button className="dw-add-btn dw-add-btn-neutral" onClick={() => setEditingBudget(true)}>{t("common.edit")}</button>
      </div>

      <div className="bt-overview-body">
        <ProgressRing spent={expenses} limit={budget} />
        <div className="bt-overview-stats">
          <div className="bt-overview-stat">
            <span className="bt-overview-stat-label">{t("common.spent")}</span>
            <span className="bt-overview-stat-value" style={statValueStyle}>{formatMoney(expenses)}</span>
          </div>
          <div className="bt-overview-stat">
            <span className="bt-overview-stat-label">{t("budgetTab.budget")}</span>
            <span className="bt-overview-stat-value" style={statValueStyle}>{formatMoney(budget)}</span>
          </div>
          <div className="bt-overview-stat">
            <span className="bt-overview-stat-label">{t("budgetTab.remaining")}</span>
            <span className="bt-overview-stat-value" style={statValueStyle}>{formatMoney(remaining)}</span>
          </div>
        </div>
      </div>

      {editingBudget && (
        <BudgetForm onClose={() => setEditingBudget(false)} initialLimit={budget} />
      )}
    </div>
  );
}

/* ---------------- RIGHT COLUMN: reads categories (with spent) from context ---------------- */

export function BudgetCategoriesColumn() {
  const { categories, formatMoney, formatMoneyCompact } = useAppData();
  const { t, tCategory } = useTranslation();
  const [modalState, setModalState] = useState(null); // null | { mode: "add" | "edit", item? }

  const closeModal = () => setModalState(null);

  const totalLimits = categories.reduce((sum, c) => sum + c.limit, 0);

  return (
    <div className="leaf-fill dw-txl-panel">
      <div className="dw-col-header">
        <h3 className="dw-heading">{t("budgetTab.categoriesHeading", { total: formatMoney(totalLimits) })}</h3>
        <button className="dw-add-btn" onClick={() => setModalState({ mode: "add" })}>+ {t("common.add")}</button>
      </div>

      <div className="dw-txl-list">
        {categories.length > 0 ? (
          categories.map((cat) => {
            const pct = cat.limit > 0 ? Math.min((cat.spent / cat.limit) * 100, 100) : 0;
            const over = cat.spent > cat.limit;

            return (
              <button
                key={cat.id}
                className="bt-cat-row"
                onClick={() => setModalState({ mode: "edit", item: cat })}
              >
                <span className="bt-cat-icon" style={{ background: cat.color + "22" }}>
                  <Icon name={cat.icon} size={16} color={cat.color} />
                </span>

                <span className="bt-cat-info">
                  <span className="bt-cat-top">
                    <span className="bt-cat-name">{tCategory(cat.key)}</span>

                    <span
                      className={"bt-cat-amounts" + (over ? " bt-cat-over" : "")}
                      title={`${formatMoney(cat.spent)} / ${formatMoney(cat.limit)}`}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {formatMoneyCompact(cat.spent)} / {formatMoneyCompact(cat.limit)}
                    </span>
                  </span>

                  <span className="bt-cat-bar-track">
                    <span
                      className="bt-cat-bar-fill"
                      style={{ width: `${pct}%`, background: over ? "#d1242f" : cat.color }}
                    />
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <span className="cal-actions-placeholder">{t("budgetTab.noCategoriesYet")}</span>
        )}
      </div>

      {modalState && (
        <CategoryForm
          onClose={closeModal}
          initialValues={modalState.mode === "edit" ? modalState.item : null}
        />
      )}
    </div>
  );
}