import { useAppData } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import Icon from "./Icon";
import "./ReportsTab.css";
import AnyIcon from "./AnyIcon";

/* ---------------- LEFT: trend + comparison ---------------- */

function EmptyState({ icon, label, compact }) {
  return (
    <div className={"dw-empty-state" + (compact ? " dw-empty-state-compact" : "")}>
      <Icon name={icon} size={compact ? 18 : 32} color="var(--cal-muted)" />
      <span className="dw-empty-state-label">{label}</span>
    </div>
  );
}

export function ReportsTrendColumn() {
  const { monthlyHistory, formatMoney, isViewingCurrentMonth, activeMonthKey, setViewMonth } = useAppData();
  const { t } = useTranslation();

  const monthlyData = monthlyHistory.map((m) => ({
    key: m.key,
    label: t(`reportsTab.months.${m.abbrev}`),
    income: m.income,
    expenses: m.expenses,
  }));

  const maxVal = Math.max(
    ...monthlyData.map((m) => Math.max(m.income, m.expenses)),
    1
  );

  const currentIndex = monthlyData.findIndex((m) => m.key === activeMonthKey);
  const current = monthlyData[currentIndex];
  const previous = currentIndex > 0 ? monthlyData[currentIndex - 1] : undefined;

  const spentDelta = previous
    ? current.expenses - previous.expenses
    : 0;

  const spentDeltaPct =
    previous && previous.expenses > 0
      ? (spentDelta / previous.expenses) * 100
      : 0;

  const spentUp = spentDelta > 0;

  return (
    <div className="leaf-fill rp-trend-panel">
      <div className="dw-col-header">
        <h3 className="rp-heading">
          {t("reportsTab.incomeVsExpenses")}
        </h3>
        <button
          className="dw-add-btn dw-add-btn-neutral"
          onClick={() => setViewMonth(isViewingCurrentMonth ? -1 : 0)}
        >
          {isViewingCurrentMonth ? t("reportsTab.lastMonth") : t("reportsTab.backToThisMonth")}
        </button>
      </div>
      <div className="rp-chart">
        {monthlyData.map((m) => (
          <div className="rp-chart-col" key={m.key}>
            <div className="rp-chart-bars">
              <span
                className="rp-bar rp-bar-income"
                style={{
                  height: `${(m.income / maxVal) * 100}%`,
                }}
                title={`${t("common.income")}: ${formatMoney(m.income)}`}
              />

              <span
                className="rp-bar rp-bar-expense"
                style={{
                  height: `${(m.expenses / maxVal) * 100}%`,
                }}
                title={`${t("common.expenses")}: ${formatMoney(m.expenses)}`}
              />
            </div>

            <span className="rp-chart-label">
              {m.label}
            </span>
          </div>
        ))}
      </div>

      <div className="rp-legend">
        <span className="rp-legend-item">
          <span className="rp-legend-dot rp-legend-income" />
          {t("common.income")}
        </span>

        <span className="rp-legend-item">
          <span className="rp-legend-dot rp-legend-expense" />
          {t("common.expenses")}
        </span>
      </div>

      {previous && (
        <div className="rp-compare">
          <span className="rp-compare-label">
            {t("reportsTab.thisMonthVsLast")}
          </span>

          <div className="rp-compare-row">
            <span
              className={
                "rp-compare-value" +
                (spentUp
                  ? " rp-compare-up"
                  : " rp-compare-down")
              }
            >
              {spentUp ? "▲" : "▼"}{" "}
              {Math.abs(spentDeltaPct).toFixed(1)}%
            </span>

            <span className="rp-compare-sub">
              {spentUp
                ? t("reportsTab.spendingUp")
                : t("reportsTab.spendingDown")}{" "}
              — {formatMoney(current.expenses)} vs {formatMoney(previous.expenses)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- RIGHT: spending breakdown ---------------- */

export function ReportsBreakdownColumn() {
  const { categories, formatMoney, formatMoneyCompact } = useAppData();
  const { t, tCategory } = useTranslation();

  const spendingCategories = [...categories]
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  const total = spendingCategories.reduce((sum, c) => sum + c.spent, 0);

  return (
    <div className="leaf-fill rp-breakdown-panel">
      <h3 className="rp-heading">{t("reportsTab.spendingBreakdown")}</h3>
      <span className="rp-breakdown-total">{t("reportsTab.thisMonth", { amount: formatMoney(total) })}</span>

      <div className="rp-breakdown-list">
        {spendingCategories.length > 0 ? (
          spendingCategories.map((cat) => {
            const pct = total > 0 ? (cat.spent / total) * 100 : 0;
            return (
              <div className="rp-breakdown-row" key={cat.id}>
                <span className="rp-breakdown-icon" style={{ background: cat.color + "22" }}>
                  <AnyIcon name={cat.icon} size={16} color={cat.color} />
                </span>
                <div className="rp-breakdown-info">
                  <div className="rp-breakdown-top">
                    <span className="rp-breakdown-name">{tCategory(cat.key)}</span>
                    <span className="rp-breakdown-amount" title={formatMoney(cat.spent)}>{formatMoneyCompact(cat.spent)}</span>
                  </div>
                  <div className="rp-breakdown-bar-track">
                    <div className="rp-breakdown-bar-fill" style={{ width: `${pct}%`, background: cat.color }} />
                  </div>
                </div>
                <span className="rp-breakdown-pct">{pct.toFixed(0)}%</span>
              </div>
            );
          })
        ) : (
          <EmptyState icon="chart" label={t("reportsTab.noSpendingYet")} />
        )}
      </div>
    </div>
  );
}