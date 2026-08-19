import { CURRENCIES, formatMoney } from "../context/AppContext";
import { useAppData } from "../context/AppContext";
import { useTranslation } from "../context/I18nContext";
import "./CurrencyOnboarding.css";

// A representative "everyday" price shown per-currency so the number scale
// is obvious before the user commits — this is what actually flags COP's
// long values ($10.000 for a coffee) versus USD's short ones ($4.50).
const SAMPLE_PRICE = {
  USD: 4.5,
  CAD: 5.75,
  EUR: 4.2,
  GBP: 3.8,
  COP: 10000,
};

const CURRENCY_ORDER = ["COP", "CAD", "EUR", "GBP", "USD"];

export default function CurrencyOnboarding() {
  const { setCurrency } = useAppData();
  const { t } = useTranslation();

  return (
    <div className="cur-onboard">
      <div className="cur-onboard-card">
        <span className="cur-onboard-eyebrow">{t("currencyOnboarding.eyebrow")}</span>
        <h1 className="cur-onboard-title">{t("currencyOnboarding.title")}</h1>
        <p className="cur-onboard-subtitle">
          {t("currencyOnboarding.subtitle")}
        </p>

        <div className="cur-onboard-grid">
          {CURRENCY_ORDER.map((code) => {
            const cfg = CURRENCIES[code];
            const sample = formatMoney(SAMPLE_PRICE[code], { code });
            return (
              <button
                key={code}
                type="button"
                className="cur-onboard-option"
                onClick={() => setCurrency(code)}
              >
                <span className="cur-onboard-flag" aria-hidden="true">{cfg.flag}</span>
                <span className="cur-onboard-option-main">
                  <span className="cur-onboard-code">{cfg.code}</span>
                  <span className="cur-onboard-name">{cfg.name}</span>
                </span>
                <span className="cur-onboard-sample">{sample}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}