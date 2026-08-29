import React from "react";
import { ReportsTrendColumn, ReportsBreakdownColumn } from "../ReportsTab";
import HistoryTab from "../HistoryTab";
import "./ReportsTabMobile.css";

/**
 * Mobile equivalent of the "reports" tab. Desktop puts Trend + Breakdown
 * side by side above History; mobile stacks all three as separate
 * widget cards in one column.
 */
export default function ReportsTabMobile() {
  return (
    <div className="rtm-page">
      <div className="rtm-widget">
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