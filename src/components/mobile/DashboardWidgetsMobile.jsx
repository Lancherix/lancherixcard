import React from "react";
import { useTranslation } from "../../context/I18nContext";
import { useAppData } from "../../context/AppContext";
import { TransactionsList } from "../DashboardWidgets";
import "./DashboardWidgetsMobile.css";

// Same inline safeguards as CardAppLayout.jsx, kept in sync since both
// render the same balance/budget tile markup — see the note there.
const tileValueStyle = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
  fontSize: "clamp(14px, 4vw, 20px)",
};

const tileSubStyle = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
  display: "block",
};

/**
 * Mobile equivalent of the "dashboard" tab. On desktop, the card image +
 * balance/budget/weekly-activity tiles live outside the tab content in
 * CardAppLayout's permanent column (visible on every tab). On mobile
 * there's no room for a permanent side column, so this component folds
 * that same content into the top of the Home tab instead — scrollable,
 * and only shown when "dashboard" is the active tab.
 */
export default function DashboardWidgetsMobile({
  cardImage,
  cardLabel = "Card",
  totalBalance = 0,
  availableBalance = 0,
  remainingBudget = 0,
  weeklyActivity = [],
}) {
  const { t } = useTranslation();
  const { formatMoney, formatMoneyCompact } = useAppData();

  return (
    <div className="dwm-page">
      <div className="cal-card-thumb dwm-card-thumb" role="img" aria-label={cardLabel}>
        {cardImage ? (
          <img src={cardImage} alt={cardLabel} />
        ) : (
          <span className="cal-card-thumb-label">{cardLabel}</span>
        )}
      </div>

      <div className="cal-permanent-panel dwm-permanent-panel">
        <div className="cal-permanent-row">
          <div className="cal-permanent-tile">
            <span className="cal-permanent-tile-label">{t("cardLayout.totalBalance")}</span>
            <span className="cal-permanent-tile-value" style={tileValueStyle} title={formatMoney(totalBalance)}>
              {formatMoneyCompact(totalBalance)}
            </span>
            <span className="cal-permanent-tile-sub" style={tileSubStyle} title={formatMoney(availableBalance)}>
              {t("cardLayout.available", { amount: formatMoneyCompact(availableBalance) })}
            </span>
          </div>
          <div className="cal-permanent-tile">
            <span className="cal-permanent-tile-label">{t("cardLayout.remainingBudget")}</span>
            <span className="cal-permanent-tile-value" style={tileValueStyle} title={formatMoney(remainingBudget)}>
              {formatMoneyCompact(remainingBudget)}
            </span>
          </div>
        </div>

        <div className="cal-permanent-tile cal-permanent-tile-wide">
          <span className="cal-permanent-tile-label">{t("cardLayout.weeklyActivity")}</span>
          <div className="cal-permanent-bars">
            {weeklyActivity.map((day, i) => (
              <span
                key={i}
                style={{ height: `${day.height}%` }}
                title={`${day.label}: ${formatMoney(day.amount)}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="dwm-transactions-wrap">
        <TransactionsList />
      </div>
    </div>
  );
}