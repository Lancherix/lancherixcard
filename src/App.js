import { Routes, Route } from "react-router-dom";
import AuthCallback from "./pages/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import CardAppLayout from "./components/CardAppLayout";
import { redirectToLogin } from "./utils/auth";
import { useEffect, useState } from "react";
import cardImage from "./assets/card.png";
import symbol from "./assets/symbolBlue.png";
import "./App.css";

import { AppProvider, useAppData } from "./context/AppContext";
import { I18nProvider, useTranslation } from "./context/I18nContext";
import { TransactionsList, ReportWidget, GoalsWidget, Empty } from "./components/DashboardWidgets";
import { MoneyTransactionsColumn, MoneyRecurringColumn } from "./components/MoneyTab";
import { BudgetOverviewColumn, BudgetCategoriesColumn } from "./components/BudgetTab";
import HistoryTab from "./components/HistoryTab";
import { ReportsTrendColumn, ReportsBreakdownColumn } from "./components/ReportsTab";
import CurrencyOnboarding from "./components/CurrencyOnboarding";
import { AccountColumn, CurrencyColumn } from "./components/SettingsTab";

// Same breakpoint convention as the old app's App.js (window.innerWidth < 900),
// tracked here since Home/CardAppLayout don't currently know about viewport size.
function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

function Redirecting() {
  useEffect(() => {
    redirectToLogin();
  }, []);
  return (
    <div className="app-loading-screen">
      <img src={symbol} alt="Lancherix" className="app-loading-logo" />
    </div>
  );
}

function Home() {
  const { totalBalance, remainingBudget, weeklyActivity, addTransaction, currency, loading, error } = useAppData();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Still fetching from the backend — `currency` is null here too, but that
  // doesn't mean "new user" yet, so check loading first or every user would
  // flash the onboarding screen before their real data arrives.
  if (loading) {
    return (
      <div className="app-loading-screen">
        <img src={symbol} alt="Lancherix" className="app-loading-logo" />
      </div>
    );
  }

  if (error) {
    return <p>Something went wrong loading your data: {error}</p>;
  }

  // Brand-new user (currency is null until they pick one): show the
  // one-time currency picker instead of the dashboard.
  if (!currency) {
    return <CurrencyOnboarding />;
  }

  const menuItems = [
    {
      key: "dashboard",
      label: t("nav.dashboard"),
      icon: t("icons.home"),
      panel: {
        type: "split",
        direction: "row",
        children: [
          { type: "leaf", content: <TransactionsList /> },
          {
            type: "split",
            direction: "column",
            children: [
              { type: "leaf", content: <ReportWidget /> },
              { type: "leaf", content: <BudgetOverviewColumn /> },
              { type: "leaf", content: <GoalsWidget /> },
            ],
          },
        ],
      },
    },
    {
      key: "money",
      label: t("nav.money"),
      icon: t("dashboard.transactions"),
      panel: {
        type: "split",
        direction: "row",
        children: [
          { type: "leaf", content: <TransactionsList /> },
          { type: "leaf", content: <MoneyRecurringColumn /> },
        ],
      },
    },
    {
      key: "budget",
      label: t("nav.budget"),
      icon: t("icons.budget"),
      panel: {
        type: "split",
        direction: "row",
        children: [
          {
            type: "split",
            direction: "column",
            children: [
              { type: "leaf", content: <BudgetOverviewColumn /> },
              { type: "leaf", content: <GoalsWidget /> },
              { type: "empty", content: <Empty /> },
            ],
          },
          { type: "leaf", content: <BudgetCategoriesColumn /> },
        ],
      },
    },
    {
      key: "reports",
      label: t("nav.reports"),
      icon: t("dashboard.report"),
      panel: {
        type: "split",
        direction: "column",
        children: [
          {
            type: "split",
            direction: "row",
            children: [
              { type: "leaf", content: <ReportsTrendColumn /> },
              { type: "leaf", content: <ReportsBreakdownColumn /> },
            ],
          },
          {
            type: "leaf",
            content: <HistoryTab />,
          },
        ],
      },
    },
    {
      key: "settings",
      label: t("nav.settings"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          width="18"
          height="18"
          aria-hidden="true"
        >
          <path d="M17.004 10.407c.138.435-.216.842-.672.842h-3.465a.75.75 0 0 1-.65-.375l-1.732-3c-.229-.396-.053-.907.393-1.004a5.252 5.252 0 0 1 6.126 3.537ZM8.12 8.464c.307-.338.838-.235 1.066.16l1.732 3a.75.75 0 0 1 0 .75l-1.732 3c-.229.397-.76.5-1.067.161A5.23 5.23 0 0 1 6.75 12a5.23 5.23 0 0 1 1.37-3.536ZM10.878 17.13c-.447-.098-.623-.608-.394-1.004l1.733-3.002a.75.75 0 0 1 .65-.375h3.465c.457 0 .81.407.672.842a5.252 5.252 0 0 1-6.126 3.539Z" />
          <path
            fillRule="evenodd"
            d="M21 12.75a.75.75 0 1 0 0-1.5h-.783a8.22 8.22 0 0 0-.237-1.357l.734-.267a.75.75 0 1 0-.513-1.41l-.735.268a8.24 8.24 0 0 0-.689-1.192l.6-.503a.75.75 0 1 0-.964-1.149l-.6.504a8.3 8.3 0 0 0-1.054-.885l.391-.678a.75.75 0 1 0-1.299-.75l-.39.676a8.188 8.188 0 0 0-1.295-.47l.136-.77a.75.75 0 0 0-1.477-.26l-.136.77a8.36 8.36 0 0 0-1.377 0l-.136-.77a.75.75 0 1 0-1.477.26l.136.77c-.448.121-.88.28-1.294.47l-.39-.676a.75.75 0 1 0-1.3.75l.392.678a8.29 8.29 0 0 0-1.054.885l-.6-.504a.75.75 0 1 0-.965 1.149l.6.503a8.243 8.243 0 0 0-.689 1.192L3.8 8.216a.75.75 0 1 0-.513 1.41l.735.267a8.222 8.222 0 0 0-.238 1.356h-.783a.75.75 0 0 0 0 1.5h.783c.042.464.122.917.238 1.356l-.735.268a.75.75 0 0 0 .513 1.41l.735-.268c.197.417.428.816.69 1.191l-.6.504a.75.75 0 0 0 .963 1.15l.601-.505c.326.323.679.62 1.054.885l-.392.68a.75.75 0 0 0 1.3.75l.39-.679c.414.192.847.35 1.294.471l-.136.77a.75.75 0 0 0 1.477.261l.137-.772a8.332 8.332 0 0 0 1.376 0l.136.772a.75.75 0 1 0 1.477-.26l-.136-.771a8.19 8.19 0 0 0 1.294-.47l.391.677a.75.75 0 1 0 1.3-.75l-.393-.679a8.29 8.29 0 0 0 1.054-.885l.601.504a.75.75 0 0 0 .964-1.15l-.6-.503c.261-.375.492-.774.69-1.191l.735.267a.75.75 0 1 0 .512-1.41l-.734-.267c.115-.439.195-.892.237-1.356h.784Zm-2.657-3.06a6.744 6.744 0 0 0-1.19-2.053 6.784 6.784 0 0 0-1.82-1.51A6.705 6.705 0 0 0 12 5.25a6.8 6.8 0 0 0-1.225.11 6.7 6.7 0 0 0-2.15.793 6.784 6.784 0 0 0-2.952 3.489.76.76 0 0 1-.036.098A6.74 6.74 0 0 0 5.251 12a6.74 6.74 0 0 0 3.366 5.842l.009.005a6.704 6.704 0 0 0 2.18.798l.022.003a6.792 6.792 0 0 0 2.368-.004 6.704 6.704 0 0 0 2.205-.811 6.785 6.785 0 0 0 1.762-1.484l.009-.01.009-.01a6.743 6.743 0 0 0 1.18-2.066c.253-.707.39-1.469.39-2.263a6.74 6.74 0 0 0-.408-2.309Z"
            clipRule="evenodd"
          />
        </svg>
      ),
      panel: {
        type: "split",
        direction: "row",
        children: [
          {
            type: "split",
            direction: "column",
            children: [
              { type: "leaf", content: <AccountColumn /> },
              { type: "empty", content: <Empty /> },
            ],
          },
          {
            type: "split",
            direction: "column",
            children: [
              { type: "leaf", content: <CurrencyColumn /> },
              { type: "empty", content: <Empty /> },
            ],
          },
        ],
      },
    },
  ];

  return (
    <CardAppLayout
      cardImage={cardImage}
      cardLabel="Lancherix card"
      menuItems={menuItems}
      footerText="Lancherix"
      totalBalance={totalBalance}
      availableBalance={totalBalance}
      remainingBudget={remainingBudget}
      weeklyActivity={weeklyActivity}
      isMobile={isMobile}
    />
  );
}

function App() {
  return (
    <AppProvider>
      <I18nProvider>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/redirecting" element={<Redirecting />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
        </Routes>
      </I18nProvider>
    </AppProvider>
  );
}

export default App;