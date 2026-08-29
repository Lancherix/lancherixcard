import React from "react";
import { BudgetOverviewColumn, BudgetCategoriesColumn } from "../BudgetTab";
import { GoalsWidget } from "../DashboardWidgets";
import "./BudgetTabMobile.css";

/**
 * Mobile equivalent of the "budget" tab. Desktop lays this out as
 * Overview + Goals stacked in one column next to Categories in another
 * (with an Empty spacer to balance the grid). Mobile flattens that into
 * a single stack — Overview, Goals, then Categories — and drops the
 * spacer since there's no grid row height to balance on a phone.
 */
export default function BudgetTabMobile() {
  return (
    <div className="btm-page">
      <div className="btm-widget">
        <BudgetOverviewColumn />
      </div>
      <div className="btm-widget">
        <GoalsWidget />
      </div>
      <div className="btm-widget">
        <BudgetCategoriesColumn />
      </div>
    </div>
  );
}