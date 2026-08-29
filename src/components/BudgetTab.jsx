import { useState } from "react";
import { createPortal } from "react-dom";
import { useAppData } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import Icon from "./Icon";
import "./BudgetTab.css";
import "./mobile/ModalSystemMobile.css";
import IconPicker from "./IconPicker";
import AnyIcon from "./AnyIcon";
import useIsMobile from "../hooks/useIsMobile";

const iconChoices = ["food", "transport", "school", "entertainment", "shopping", "other", "savings"];
const colorChoices = ["#ff9500", "#0071e3", "#5856d6", "#ff2d55", "#34c759", "#af52de", "#ff3b30", "#ffcc00"];

/* ============================================================
   MOBILE-AWARE MODAL HELPERS
   Same helpers as DashboardWidgets.jsx (ModalShell, FormRow,
   AmountField, plus the shared class-name pickers), duplicated
   locally per that file's own convention so BudgetForm and
   CategoryForm render correctly on both desktop and mobile.
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

function EmptyState({ icon, label, compact }) {
  return (
    <div className={"dw-empty-state" + (compact ? " dw-empty-state-compact" : "")}>
      <Icon name={icon} size={compact ? 18 : 32} color="var(--cal-muted)" />
      <span className="dw-empty-state-label">{label}</span>
    </div>
  );
}

/* ---------------- Budget form: mobile-aware, same pattern as DashboardWidgets' BudgetForm ---------------- */

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
      title={t("budgetTab.editMonthlyBudget")}
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
      <FormRow isMobile={isMobile} label={t("icons.budget")}>
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

/* ---------------- Category form: mobile-aware, same pattern as DashboardWidgets' GoalForm ---------------- */

function CategoryForm({ onClose, initialValues }) {
  const { addCategory, updateCategory, deleteCategory, currencySymbol } = useAppData();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const isEditing = Boolean(initialValues);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [name, setName] = useState(initialValues?.key ?? "");
  const [icon, setIcon] = useState(initialValues?.icon ?? iconChoices[0]);
  const [color, setColor] = useState(initialValues?.color ?? colorChoices[0]);
  const [limit, setLimit] = useState(initialValues ? String(initialValues.limit) : "");

  const isCustomIcon = !iconChoices.includes(icon);

  const parsedLimit = parseFloat(limit);
  const isValid =
    limit.trim() !== "" &&
    !isNaN(parsedLimit) &&
    parsedLimit > 0 &&
    (!isCustomIcon || name.trim() !== "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;

    const generatedKey = name.trim() || icon;
    const key = isEditing ? initialValues.key : generatedKey.replace(/\s+/g, "_");

    const cat = { id: initialValues?.id, key, icon, color, limit: parsedLimit };

    if (isEditing) updateCategory(cat);
    else addCategory(cat);

    onClose();
  };

  const handleDelete = () => {
    if (!initialValues?.id) return;
    deleteCategory(initialValues.id);
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
          <p className="mm-confirm-text">{t("budgetTab.deleteCategoryConfirm")}</p>
        ) : (
          <div className="confirm-row">
            <p className="dw-confirm-text">{t("budgetTab.deleteCategoryConfirm")}</p>
          </div>
        )}
      </ModalShell>
    );
  }

  return (
    <ModalShell
      isMobile={isMobile}
      title={isEditing ? t("budgetTab.editCategory") : t("budgetTab.addCategory")}
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
              {isEditing ? t("common.saveChanges") : t("common.add")}
            </button>
          </>
        )
      }
    >
      <FormRow
        isMobile={isMobile}
        label={
          <>
            {t("common.name")}
            {!isCustomIcon && <span className="bt-optional-hint"> ({t("common.optional")})</span>}
          </>
        }
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("budgetTab.namePlaceholder")}
        />
      </FormRow>

      <FormRow isMobile={isMobile} label={t("common.icon")}>
        <div className={gridClass(isMobile, "icon")}>
          {iconChoices.map((i) => (
            <button
              type="button" key={i}
              className={choiceClass(isMobile, "icon", icon === i)}
              onClick={() => setIcon(i)}
            >
              <Icon name={i} size={isMobile ? 20 : 18} color={icon === i ? color : undefined} />
            </button>
          ))}

          <IconPicker
            value={isCustomIcon ? icon : undefined}
            onChange={setIcon}
            triggerClassName={choiceClass(isMobile, "icon", isCustomIcon)}
          />
        </div>
      </FormRow>

      <FormRow isMobile={isMobile} label={t("common.color")}>
        <div className={gridClass(isMobile, "color")}>
          {colorChoices.map((c) => (
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

      <FormRow isMobile={isMobile} label={t("budgetTab.monthlyLimit")}>
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
                  <AnyIcon name={cat.icon} size={16} color={cat.color} />
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
          <EmptyState icon="tag" label={t("budgetTab.noCategoriesYet")} />
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