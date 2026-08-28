import { useState, useMemo } from "react";
import { useAppData } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import Icon from "./Icon";
import "./HistoryTab.css";
import AnyIcon from "./AnyIcon";

/* ---------------- row ---------------- */

function HistoryRow({ tx, categories, formatMoney }) {
  const { tCategory } = useTranslation();
  const isIncome = tx.type === "income";
  const category = categories.find((c) => c.key === tx.categoryKey);
  return (
    <div className="ht-row">
      <span
        className="ht-icon"
        style={{
          background: (category?.color ?? "#6e6e73") + "22",
        }}
      >
        <AnyIcon name={category?.icon ?? "other"} size={16} color={category?.color} />
      </span>
      <span className="ht-info">
        <span className="ht-name">{tx.name}</span>
        <span className="ht-sub">{tCategory(tx.categoryKey)} · {tx.date}</span>
      </span>
      <span className={"ht-amount" + (isIncome ? " ht-amount-income" : "")}>
        {isIncome ? "+" : "-"}{formatMoney(tx.amount)}
      </span>
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

/* ---------------- main panel ---------------- */

export default function HistoryTab() {
  const { transactions, categories, formatMoney } = useAppData();
  const { t, tCategory } = useTranslation();

  const typeFilters = ["All", "Spent", "Acquired"];
  const sortOptions = [
    { value: "date-desc", label: t("historyTab.sortNewest") },
    { value: "date-asc", label: t("historyTab.sortOldest") },
    { value: "amount-desc", label: t("historyTab.sortAmountDesc") },
    { value: "amount-asc", label: t("historyTab.sortAmountAsc") },
  ];

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date-desc");

  const categoryFilterOptions = ["All", ...categories.map((c) => c.key)];

  const filtered = useMemo(() => {
    let result = transactions;

    if (query.trim() !== "") {
      const q = query.trim().toLowerCase();
      result = result.filter((tx) => tx.name.toLowerCase().includes(q));
    }

    if (categoryFilter !== "All") {
      result = result.filter((tx) => tx.categoryKey === categoryFilter);
    }

    if (typeFilter !== "All") {
      const wanted = typeFilter === "Spent" ? "expense" : "income";
      result = result.filter((tx) => tx.type === wanted);
    }

    const sorted = [...result].sort((a, b) => {
      if (sortBy === "date-desc") return a.date < b.date ? 1 : -1;
      if (sortBy === "date-asc") return a.date > b.date ? 1 : -1;
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "amount-asc") return a.amount - b.amount;
      return 0;
    });

    return sorted;
  }, [transactions, query, categoryFilter, typeFilter, sortBy]);

  const typeFilterLabel = (t_) => (t_ === "All" ? t("historyTab.all") : t_ === "Spent" ? t("common.spent") : t("common.acquired"));

  return (
    <div className="leaf-fill ht-panel">
      <div className="ht-search-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("historyTab.searchPlaceholder")}
          className="ht-search-input"
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="ht-sort-select">
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="ht-chip-row">
        {typeFilters.map((tf) => (
          <button
            key={tf}
            className={"ht-chip" + (typeFilter === tf ? " ht-chip-active" : "")}
            onClick={() => setTypeFilter(tf)}
          >
            {typeFilterLabel(tf)}
          </button>
        ))}
        <span className="ht-chip-divider" aria-hidden="true" />
        {categoryFilterOptions.map((c) => (
          <button
            key={c}
            className={"ht-chip" + (categoryFilter === c ? " ht-chip-active" : "")}
            onClick={() => setCategoryFilter(c)}
          >
            {c === "All" ? t("historyTab.all") : tCategory(c)}
          </button>
        ))}
      </div>

      <div className="ht-list">
        {filtered.length > 0 ? (
          filtered.map((tx) => <HistoryRow key={tx.id} tx={tx} categories={categories} formatMoney={formatMoney} />)
        ) : (
          <EmptyState icon="receipt" label={t("historyTab.noMatch")} />
        )}
      </div>
    </div>
  );
}