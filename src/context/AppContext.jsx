import { createContext, useContext, useReducer, useEffect } from "react";
import { apiFetch, getToken } from "../utils/auth";

/* ---------------- currency ----------------
   `currency` starts as `null` so the UI can tell "brand new user" apart from
   "user picked USD". Once set it's { code, exchangeRate }. `exchangeRate` is
   unused today (amounts are entered directly in the chosen currency) but is
   there for the "change currency" menu, which needs a rate to convert
   existing amounts rather than just relabeling them. */

export const CURRENCIES = {
  USD: { code: "USD", symbol: "$", locale: "en-US", name: "US Dollar", flag: "🇺🇸" },
  CAD: { code: "CAD", symbol: "$", locale: "en-CA", name: "Canadian Dollar", flag: "🇨🇦" },
  EUR: { code: "EUR", symbol: "€", locale: "en-IE", name: "Euro", flag: "🇪🇺" },
  GBP: { code: "GBP", symbol: "£", locale: "en-GB", name: "British Pound", flag: "🇬🇧" },
  COP: { code: "COP", symbol: "$", locale: "es-CO", name: "Colombian Peso", flag: "🇨🇴" },
};

// COP (and similarly-scaled currencies) are conventionally shown with no
// decimal places — "$10.000" not "$10.000,00" — otherwise everyday amounts
// get needlessly long.
const ZERO_DECIMAL_CODES = new Set(["COP"]);

/**
 * Formats `amount` in the given currency.
 * Pass { compact: true } for tight UI spots (rings, small cards) where a
 * long formatted number would overflow — this renders e.g. "$1.2M" instead
 * of "$1,234,567".
 */
export function formatMoney(amount, currency, opts = {}) {
  const cfg = CURRENCIES[currency?.code] ?? CURRENCIES.USD;
  const { compact = false } = opts;
  const value = Number.isFinite(amount) ? amount : 0;
  const isZeroDecimal = ZERO_DECIMAL_CODES.has(cfg.code);

  try {
    return new Intl.NumberFormat(cfg.locale, {
      style: "currency",
      currency: cfg.code,
      notation: compact ? "compact" : "standard",
      minimumFractionDigits: compact ? 0 : isZeroDecimal ? 0 : 2,
      maximumFractionDigits: compact ? 1 : isZeroDecimal ? 0 : 2,
    }).format(value);
  } catch {
    return `${cfg.symbol}${value.toFixed(isZeroDecimal ? 0 : 2)}`;
  }
}

// Local-date helper — use this everywhere a "today" or "YYYY-MM-DD" default
// is needed (transaction dates, recurring nextDate, goal contribution
// dates, etc). `new Date().toISOString().slice(0, 10)` looks equivalent but
// is NOT: toISOString() is UTC, so anyone west of UTC (most of the
// Americas) can get tomorrow's date stamped on a transaction made tonight,
// which then silently fails to match today's bucket in `last7Days` below.
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const initialState = {
  profile: null,
  transactions: [],
  recurring: [],
  categories: [],
  budget: {
    monthlyLimit: 0,
  },
  goals: [],
  currency: null,
  // true until the first GET /state resolves (or we determine there's no
  // token at all) — lets the UI tell "still loading" apart from "brand new
  // user with no currency yet", which both otherwise look like `!currency`.
  loading: true,
  error: null,
};

// Mongo docs come back as { _id, ... }; the rest of the app (keys, .find,
// sorting) expects `.id` like the old client-generated ids did. Centralizing
// the rename here means nothing else in the app needs to know about `_id`.
function withId(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return { ...rest, id: _id };
}

function withIds(docs) {
  return (docs ?? []).map(withId);
}

/* ---------------- reducer ----------------
   Purely a local cache now — every mutation is triggered by an action
   creator in useAppData that hits the backend first and dispatches only
   once the server confirms it, using the server's own id. */

function reducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_PROFILE":
      return { ...state, profile: action.payload };
    case "HYDRATE":
      return {
        ...state,
        transactions: withIds(action.payload.transactions),
        recurring: withIds(action.payload.recurring),
        categories: withIds(action.payload.categories),
        goals: withIds(action.payload.goals),
        budget: action.payload.budget ?? { monthlyLimit: 0 },
        currency: action.payload.currency ?? null,
        loading: false,
        error: null,
      };

    case "ADD_TRANSACTION":
      return { ...state, transactions: [...state.transactions, action.payload] };
    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      };
    case "DELETE_TRANSACTION":
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.payload) };

    case "ADD_RECURRING":
      return { ...state, recurring: [...state.recurring, action.payload] };
    case "UPDATE_RECURRING":
      return {
        ...state,
        recurring: state.recurring.map((r) => (r.id === action.payload.id ? { ...r, ...action.payload } : r)),
      };
    case "DELETE_RECURRING":
      return { ...state, recurring: state.recurring.filter((r) => r.id !== action.payload) };

    case "ADD_CATEGORY":
      return { ...state, categories: [...state.categories, action.payload] };
    case "UPDATE_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((c) => (c.id === action.payload.id ? { ...c, ...action.payload } : c)),
      };
    case "DELETE_CATEGORY":
      return { ...state, categories: state.categories.filter((c) => c.id !== action.payload) };

    case "SET_BUDGET":
      return { ...state, budget: { ...state.budget, monthlyLimit: action.payload } };

    case "SET_CURRENCY":
      return { ...state, currency: action.payload };

    case "ADD_GOAL":
      return { ...state, goals: [...state.goals, action.payload] };
    case "UPDATE_GOAL":
      return { ...state, goals: state.goals.map((g) => (g.id === action.payload.id ? { ...g, ...action.payload } : g)) };
    case "DELETE_GOAL":
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
        transactions: state.transactions.filter((t) => t.goalId !== action.payload),
      };

    default:
      return state;
  }
}

/* ---------------- context + provider ---------------- */

const AppContext = createContext(null);

// Small helper: hits the backend, parses JSON, and throws a real Error on
// a non-2xx response instead of silently handing back an error body as if
// it were data.
async function requestJson(path, options) {
  const res = await apiFetch(path, options);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || `Request to ${path} failed`);
  }
  return data;
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Re-fetches everything from the backend and replaces local state.
  // Called on mount if a token already exists (page refresh), and again
  // right after login (see AuthCallback), since AppProvider itself doesn't
  // remount when AuthCallback navigates to "/".
  const refreshState = async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const data = await requestJson(
        `/state?today=${getLocalDateString()}`
      );

      dispatch({
        type: "HYDRATE",
        payload: data,
      });

      try {
        const profile = await requestJson("/me");

        dispatch({
          type: "SET_PROFILE",
          payload: profile,
        });
      } catch (profileError) {
        console.error("Failed to load user profile:", profileError);
      }
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error.message,
      });
    }
  };

  useEffect(() => {
    if (getToken()) {
      refreshState();
    } else {
      // No token yet (e.g. we're mid-flight on /auth/callback) — nothing to
      // load, and ProtectedRoute will bounce to login for any other route.
      dispatch({ type: "SET_LOADING", payload: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, refreshState }}>
      {children}
    </AppContext.Provider>
  );
}

/* ---------------- hook: state + derived values + actions ---------------- */

export function useAppData() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppData must be used inside <AppProvider>");
  const { state, dispatch, refreshState } = ctx;

  const income = state.transactions
    .filter((t) => t.type === "income" && t.categoryKey !== "savings")
    .reduce((sum, t) => sum + t.amount, 0);

  const rawExpenses = state.transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsWithdrawals = state.transactions
    .filter((t) => t.type === "income" && t.categoryKey === "savings")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = rawExpenses - savingsWithdrawals;

  const spentByCategoryKey = (categoryKey) => {
    const spent = state.transactions
      .filter((t) => t.type === "expense" && t.categoryKey === categoryKey)
      .reduce((sum, t) => sum + t.amount, 0);
    const returned = state.transactions
      .filter((t) => t.type === "income" && t.categoryKey === categoryKey)
      .reduce((sum, t) => sum + t.amount, 0);
    return spent - returned;
  };

  const categoriesWithSpent = state.categories.map((c) => ({ ...c, spent: spentByCategoryKey(c.key) }));

  const today = new Date();
  // Uses the shared getLocalDateString helper (see above) so these keys are
  // computed the same way transaction dates are now generated — both local.
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return getLocalDateString(d);
  });

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const dailyExpenseTotals = last7Days.map((date) =>
    state.transactions
      .filter((t) => t.type === "expense" && t.date === date)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const maxDaily = Math.max(...dailyExpenseTotals, 1);

  const weeklyActivity = dailyExpenseTotals.map((amount, i) => {
    const [y, m, d] = last7Days[i].split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return {
      height: amount > 0 ? Math.max(8, Math.round((amount / maxDaily) * 100)) : 4,
      amount,
      label: dayLabels[dateObj.getDay()],
    };
  });

  const contributedToGoal = (goalId) => {
    const added = state.transactions
      .filter((t) => t.type === "expense" && t.categoryKey === "savings" && t.goalId === goalId)
      .reduce((sum, t) => sum + t.amount, 0);
    const removed = state.transactions
      .filter((t) => t.type === "income" && t.categoryKey === "savings" && t.goalId === goalId)
      .reduce((sum, t) => sum + t.amount, 0);
    return added - removed;
  };

  const goalsWithCurrent = state.goals.map((g) => ({
    ...g,
    current: contributedToGoal(g.id),
  }));

  const currencyConfig = CURRENCIES[state.currency?.code] ?? CURRENCIES.USD;

  return {
    profile: state.profile,
    transactions: state.transactions,
    recurring: state.recurring,
    categories: categoriesWithSpent,
    budget: state.budget.monthlyLimit,
    goals: goalsWithCurrent,
    weeklyActivity,

    loading: state.loading,
    error: state.error,
    refreshState,

    // null until the user has completed currency selection — components
    // that need money formatting should treat `!currency` as "still onboarding"
    // (but check `loading` first — see App.js's Home component).
    currency: state.currency,
    currencySymbol: currencyConfig.symbol,
    formatMoney: (amount, opts) => formatMoney(amount, state.currency, opts),
    formatMoneyCompact: (amount) => formatMoney(amount, state.currency, { compact: true }),

    income,
    expenses,
    totalBalance: income - expenses,
    remainingBudget: state.budget.monthlyLimit - expenses,

    addTransaction: async (tx) => {
      const data = await requestJson("/transactions", { method: "POST", body: JSON.stringify(tx) });
      dispatch({ type: "ADD_TRANSACTION", payload: withId(data) });
    },
    updateTransaction: async (tx) => {
      const { id, ...rest } = tx;
      const data = await requestJson(`/transactions/${id}`, { method: "PATCH", body: JSON.stringify(rest) });
      dispatch({ type: "UPDATE_TRANSACTION", payload: withId(data) });
    },
    deleteTransaction: async (id) => {
      await apiFetch(`/transactions/${id}`, { method: "DELETE" });
      dispatch({ type: "DELETE_TRANSACTION", payload: id });
    },

    addRecurring: async (r) => {
      const data = await requestJson("/recurring", { method: "POST", body: JSON.stringify(r) });
      dispatch({ type: "ADD_RECURRING", payload: withId(data) });
    },
    updateRecurring: async (r) => {
      const { id, ...rest } = r;
      const data = await requestJson(`/recurring/${id}`, { method: "PATCH", body: JSON.stringify(rest) });
      dispatch({ type: "UPDATE_RECURRING", payload: withId(data) });
    },
    deleteRecurring: async (id) => {
      await apiFetch(`/recurring/${id}`, { method: "DELETE" });
      dispatch({ type: "DELETE_RECURRING", payload: id });
    },

    addCategory: async (c) => {
      const data = await requestJson("/categories", { method: "POST", body: JSON.stringify(c) });
      dispatch({ type: "ADD_CATEGORY", payload: withId(data) });
    },
    updateCategory: async (c) => {
      const { id, ...rest } = c;
      const data = await requestJson(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(rest) });
      dispatch({ type: "UPDATE_CATEGORY", payload: withId(data) });
    },
    deleteCategory: async (id) => {
      await apiFetch(`/categories/${id}`, { method: "DELETE" });
      dispatch({ type: "DELETE_CATEGORY", payload: id });
    },

    setBudget: async (limit) => {
      const data = await requestJson("/settings/budget", {
        method: "PATCH",
        body: JSON.stringify({ monthlyLimit: limit }),
      });
      dispatch({ type: "SET_BUDGET", payload: data.monthlyLimit });
    },

    // First-time currency pick — no conversion needed yet.
    setCurrency: async (code, exchangeRate) => {
      const data = await requestJson("/settings/currency", {
        method: "POST",
        body: JSON.stringify({ code, exchangeRate }),
      });
      dispatch({ type: "SET_CURRENCY", payload: { code: data.currencyCode, exchangeRate: data.exchangeRate } });
    },

    // Existing user switching currency later: rate = how many units of the
    // new currency equal 1 unit of the current currency. The backend
    // rescales every stored amount server-side, so we just re-hydrate
    // afterward rather than re-deriving the math on the client.
    changeCurrency: async (code, rate) => {
      await requestJson("/settings/currency/change", {
        method: "POST",
        body: JSON.stringify({ code, rate }),
      });
      await refreshState();
    },

    addGoal: async (g) => {
      const data = await requestJson("/goals", { method: "POST", body: JSON.stringify(g) });
      dispatch({ type: "ADD_GOAL", payload: withId(data) });
    },
    updateGoal: async (g) => {
      const { id, current, ...rest } = g; // `current` is derived, never sent
      const data = await requestJson(`/goals/${id}`, { method: "PATCH", body: JSON.stringify(rest) });
      dispatch({ type: "UPDATE_GOAL", payload: withId(data) });
    },
    deleteGoal: async (id) => {
      await apiFetch(`/goals/${id}`, { method: "DELETE" });
      dispatch({ type: "DELETE_GOAL", payload: id });
    },

    contributeToGoal: async (goalId, amount, date, note, savingsLabel, goalLabel) => {
      const data = await requestJson(`/goals/${goalId}/contribute`, {
        method: "POST",
        body: JSON.stringify({ amount, date, note, savingsLabel, goalLabel }),
      });
      dispatch({ type: "ADD_TRANSACTION", payload: withId(data) });
    },
    withdrawFromGoal: async (goalId, amount, date, note, withdrawalLabel, goalLabel) => {
      const data = await requestJson(`/goals/${goalId}/withdraw`, {
        method: "POST",
        body: JSON.stringify({ amount, date, note, withdrawalLabel, goalLabel }),
      });
      dispatch({ type: "ADD_TRANSACTION", payload: withId(data) });
    },
  };
}