import React from "react";
import { AccountColumn, CurrencyColumn } from "../SettingsTab";
import "./SettingsTabMobile.css";

/**
 * Mobile equivalent of the "settings" tab. Desktop splits Account and
 * Currency into two side-by-side columns (each with an Empty spacer
 * below); mobile stacks the two real widgets and drops the spacers.
 */
export default function SettingsTabMobile() {
  return (
    <div className="stm-page">
      <div className="stm-widget">
        <AccountColumn />
      </div>
      <div className="stm-widget">
        <CurrencyColumn />
      </div>
    </div>
  );
}