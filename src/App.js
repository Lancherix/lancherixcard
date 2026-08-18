import { Routes, Route } from "react-router-dom";
import AuthCallback from "./pages/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import CardAppLayout from "./components/CardAppLayout";
import { redirectToLogin } from "./utils/auth";
import { useEffect } from "react";
import cardImage from "./assets/card.png"; // swap in your real card art
import "./App.css";

import { AppProvider, useAppData } from "./context/AppContext";
import { I18nProvider, useTranslation } from "./context/I18nContext";
import { TransactionsList, ReportWidget, BudgetProgressRing, GoalsWidget, Empty } from "./components/DashboardWidgets";
import AddTransactionModal from "./components/AddTransactionModal";
import { MoneyTransactionsColumn, MoneyRecurringColumn } from "./components/MoneyTab";
import { BudgetOverviewColumn, BudgetCategoriesColumn } from "./components/BudgetTab";
import HistoryTab from "./components/HistoryTab";
import { ReportsTrendColumn, ReportsBreakdownColumn } from "./components/ReportsTab";
import SavingsGoalsTab from "./components/SavingsGoalsTab";
import CurrencyOnboarding from "./components/CurrencyOnboarding";
import ChangeCurrencyModal from "./components/ChangeCurrencyModal";

function Redirecting() {
  useEffect(() => {
    redirectToLogin();
  }, []);
  return <p>Redirecting to login...</p>;
}

function Home() {
  const { totalBalance, remainingBudget, weeklyActivity, addTransaction, currency, loading, error } = useAppData();
  const { t } = useTranslation();

  // Still fetching from the backend — `currency` is null here too, but that
  // doesn't mean "new user" yet, so check loading first or every user would
  // flash the onboarding screen before their real data arrives.
  if (loading) {
    return <p>Loading...</p>;
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
              { type: "leaf", content: <BudgetProgressRing /> },
              { type: "leaf", content: <GoalsWidget /> },
            ],
          },
        ],
      },
    },
    {
      key: "money",
      label: t("nav.money"),
      icon: t("icons.flows"),
      panel: {
        type: "split",
        direction: "row",
        children: [
          { type: "leaf", content: <MoneyTransactionsColumn /> },
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
              { type: "empty", content: <Empty /> },
              { type: "empty", content: <Empty /> },
            ],
          },
          { type: "leaf", content: <BudgetCategoriesColumn /> },
        ],
      },
    },
    {
      key: "history",
      label: t("nav.history"),
      icon: t("icons.history"),
      panel: { type: "leaf", content: <HistoryTab /> },
    },
    {
      key: "reports",
      label: t("nav.reports"),
      icon: t("icons.reports"),
      panel: {
        type: "split",
        direction: "row",
        children: [
          { type: "leaf", content: <ReportsTrendColumn /> },
          { type: "leaf", content: <ReportsBreakdownColumn /> },
        ],
      },
    },
    {
      key: "goals",
      label: t("nav.goals"),
      icon: t("icons.goals"),
      panel: { type: "leaf", content: <SavingsGoalsTab /> },
    },
    {
      key: "currency",
      label: "Currency",
      icon: "💱",
      modal: {
        title: "Change currency",
        content: ({ onClose }) => <ChangeCurrencyModal onClose={onClose} />,
      },
    },
    {
      key: "new",
      label: t("nav.newTransaction"),
      icon: "+",
      modal: {
        title: t("moneyTab.addTransaction"),
        content: ({ onClose }) => (
          <AddTransactionModal
            onClose={onClose}
            onSave={(tx) => addTransaction(tx)}
          />
        ),
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
    />
  );
}

function App() {
  return (
    <I18nProvider>
      <AppProvider>
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
      </AppProvider>
    </I18nProvider>
  );
}

export default App;