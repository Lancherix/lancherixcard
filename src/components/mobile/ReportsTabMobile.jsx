import React from "react";
import { ReportsTrendColumn, ReportsBreakdownColumn } from "../ReportsTab";
import HistoryTab from "../HistoryTab";
import "./ReportsTabMobile.css";

/**
 * Mobile equivalent of the "reports" tab. Desktop puts Trend + Breakdown
 * side by side above History; mobile stacks all three as separate
 * widget cards in one column.
 *
 * ReportsTrendColumn renders its bars with inline `height: X%` styles,
 * which only work if every ancestor up to a real fixed height stays
 * "height: 100%" rather than "auto" — so it gets its own explicit-height
 * class (rtm-widget-chart) instead of the generic auto-height one the
 * other two widgets use.
 */
export default function ReportsTabMobile() {
  return (
    <div className="rtm-page">
      <div className="rtm-widget rtm-widget-chart">
        <ReportsTrendColumn />
      </div>
      <div className="rtm-widget">
        <ReportsBreakdownColumn />
      </div>
      <div className="rtm-widget">
        <HistoryTab />
      </div>
    </div>
  );
}