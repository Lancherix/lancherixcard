import React from "react";
import { MoneyTransactionsColumn, MoneyRecurringColumn } from "../MoneyTab";
import "./MoneyTabMobile.css";

/**
 * Mobile equivalent of the "money" tab. Desktop splits Transactions and
 * Recurring side by side (cal-panel-row); mobile stacks them as two
 * separate widget cards in a single column, matching the pattern
 * DashboardWidgetsMobile established.
 */
export default function MoneyTabMobile() {
  return (
    <div className="mtm-page">
      <div className="mtm-widget">
        <MoneyRecurringColumn />
      </div>
      <div className="mtm-widget">
        <MoneyTransactionsColumn />
      </div>
    </div>
  );
}