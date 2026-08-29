import React, { useState, useEffect } from "react";
import { useTranslation } from "../context/I18nContext";
import { useAppData } from "../context/AppContext";
import "./CardAppLayout.css";

function PanelRenderer({ panel }) {
  const { t } = useTranslation();
  if (!panel) return null;

  if (panel.type === "split") {
    const directionClass =
      panel.direction === "column" ? "cal-panel-col" : "cal-panel-row";
    return (
      <div className={directionClass}>
        {panel.children.map((child, i) => (
          <div
            key={i}
            className="cal-panel-slot"
            style={child.flex ? { flex: child.flex } : undefined}
          >
            <PanelRenderer panel={child} />
          </div>
        ))}
      </div>
    );
  }

  if (panel.type === "empty") {
    return (
      <div className="cal-panel-empty">
        {panel.content}
      </div>
    );
  }

  // leaf
  return (
    <div className="cal-panel-leaf">
      {panel.content ?? (
        <span className="cal-actions-placeholder">{t("cardLayout.actionsPlaceholder")}</span>
      )}
    </div>
  );
}

function Modal({ item, onClose }) {
  const { t } = useTranslation();
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const body =
    typeof item.modal.content === "function"
      ? item.modal.content({ onClose })
      : item.modal.content ?? (
        <span className="cal-actions-placeholder">{t("cardLayout.nothingHereYet")}</span>
      );

  return (
    <div className="cal-modal-backdrop" onClick={onClose}>
      <div
        className="cal-modal"
        role="dialog"
        aria-modal="true"
        aria-label={item.modal.title ?? item.label}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cal-modal-header">
          <span className="cal-modal-title">
            {item.modal.title ?? item.label}
          </span>
          <button className="cal-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="cal-modal-body">{body}</div>
      </div>
    </div>
  );
}

const tileValueStyle = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
  fontSize: "clamp(14px, 4vw, 20px)",
};

const tileSubStyle = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
  display: "block",
};

export default function CardAppLayout({
  cardImage,
  cardLabel = "Card",
  menuItems = [],
  onMenuSelect,
  footerText = "Lancherix",
  totalBalance = 0,
  availableBalance = 0,
  remainingBudget = 0,
  weeklyActivity = [
    { height: 4, amount: 0, label: "Sun" },
    { height: 4, amount: 0, label: "Mon" },
    { height: 4, amount: 0, label: "Tue" },
    { height: 4, amount: 0, label: "Wed" },
    { height: 4, amount: 0, label: "Thu" },
    { height: 4, amount: 0, label: "Fri" },
    { height: 4, amount: 0, label: "Sat" },
  ],
  isMobile = false,
}) {
  const year = new Date().getFullYear();
  const { t } = useTranslation();
  const { formatMoney, formatMoneyCompact } = useAppData();

  const [selectedKey, setSelectedKey] = useState(
    menuItems.find((item) => !item.modal)?.key ?? menuItems[0]?.key ?? null
  );
  const [modalItem, setModalItem] = useState(null);

  const selectedItem =
    menuItems.find((item) => item.key === selectedKey) ?? menuItems[0];
  const selectedIndex = menuItems.findIndex(
    (item) => item.key === selectedItem?.key
  );

  const activePanel =
    selectedItem?.panel ?? {
      type: "leaf",
      content: `Actions ${selectedIndex + 1}`,
    };

  const handleSelect = (item) => {
    if (item.modal) {
      setModalItem(item);
    } else {
      setSelectedKey(item.key);
    }
    onMenuSelect?.(item);
  };

  const isItemActive = (item) =>
    item.modal ? modalItem?.key === item.key : selectedItem?.key === item.key;

  return (
    <div className={"cal-shell" + (isMobile ? " cal-shell-mobile" : "")}>
      <div className="cal-frame">
        <div className="cal-content">
          <div className="cal-margin cal-margin-left" aria-hidden="true" />

          <div className="cal-card-column">
            <div className="cal-card-thumb" role="img" aria-label={cardLabel}>
              {cardImage ? (
                <img src={cardImage} alt={cardLabel} />
              ) : (
                <span className="cal-card-thumb-label">{cardLabel}</span>
              )}
            </div>

            <div className="cal-permanent-panel">
              <div className="cal-permanent-row">
                <div className="cal-permanent-tile">
                  <span className="cal-permanent-tile-label">{t("cardLayout.totalBalance")}</span>
                  <span className="cal-permanent-tile-value" style={tileValueStyle} title={formatMoney(totalBalance)}>
                    {formatMoneyCompact(totalBalance)}
                  </span>
                  <span className="cal-permanent-tile-sub" style={tileSubStyle} title={formatMoney(availableBalance)}>
                    {t("cardLayout.available", { amount: formatMoneyCompact(availableBalance) })}
                  </span>
                </div>
                <div className="cal-permanent-tile">
                  <span className="cal-permanent-tile-label">{t("cardLayout.remainingBudget")}</span>
                  <span className="cal-permanent-tile-value" style={tileValueStyle} title={formatMoney(remainingBudget)}>
                    {formatMoneyCompact(remainingBudget)}
                  </span>
                </div>
              </div>

              <div className="cal-permanent-tile cal-permanent-tile-wide">
                <span className="cal-permanent-tile-label">{t("cardLayout.weeklyActivity")}</span>
                <div className="cal-permanent-bars">
                  {weeklyActivity.map((day, i) => (
                    <span
                      key={i}
                      style={{ height: `${day.height}%` }}
                      title={`${day.label}: ${formatMoney(day.amount)}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop tab row: text by default, icon-only when item.iconOnly is true (settings) */}
          <div className="cal-menu-buttons">
            {menuItems.length > 0
              ? menuItems.map((item, i) => {
                const isActive = isItemActive(item);
                return (
                  <button
                    key={item.key ?? i}
                    className={
                      "cal-menu-btn" +
                      (isActive ? " cal-menu-btn-active" : "")
                    }
                    onClick={() => handleSelect(item)}
                    aria-pressed={isActive}
                    aria-haspopup={item.modal ? "dialog" : undefined}
                    aria-label={item.iconOnly ? item.label : undefined}
                    title={item.iconOnly ? item.label : undefined}
                  >
                    {item.iconOnly ? item.icon : item.label}
                  </button>
                );
              })
              : Array.from({ length: 5 }).map((_, i) => (
                <button key={i} className="cal-menu-btn" disabled />
              ))}
          </div>

          <main className="cal-actions">
            <PanelRenderer panel={activePanel} />
          </main>

          <div className="cal-margin cal-margin-right" aria-hidden="true" />
        </div>

        <footer className="cal-footer">
          <span className="cal-footer-copy">
            © {year} {footerText}
          </span>
        </footer>
      </div>

      {/* Mobile bottom tab bar: icon + text for every item, including settings */}
      {!isMobile && (
        <div className="cal-card-column">
          <div className="cal-card-thumb" role="img" aria-label={cardLabel}>
            {cardImage ? (
              <img src={cardImage} alt={cardLabel} />
            ) : (
              <span className="cal-card-thumb-label">{cardLabel}</span>
            )}
          </div>

          <div className="cal-permanent-panel">
            <div className="cal-permanent-row">
              <div className="cal-permanent-tile">
                <span className="cal-permanent-tile-label">{t("cardLayout.totalBalance")}</span>
                <span className="cal-permanent-tile-value" style={tileValueStyle} title={formatMoney(totalBalance)}>
                  {formatMoneyCompact(totalBalance)}
                </span>
                <span className="cal-permanent-tile-sub" style={tileSubStyle} title={formatMoney(availableBalance)}>
                  {t("cardLayout.available", { amount: formatMoneyCompact(availableBalance) })}
                </span>
              </div>
              <div className="cal-permanent-tile">
                <span className="cal-permanent-tile-label">{t("cardLayout.remainingBudget")}</span>
                <span className="cal-permanent-tile-value" style={tileValueStyle} title={formatMoney(remainingBudget)}>
                  {formatMoneyCompact(remainingBudget)}
                </span>
              </div>
            </div>

            <div className="cal-permanent-tile cal-permanent-tile-wide">
              <span className="cal-permanent-tile-label">{t("cardLayout.weeklyActivity")}</span>
              <div className="cal-permanent-bars">
                {weeklyActivity.map((day, i) => (
                  <span
                    key={i}
                    style={{ height: `${day.height}%` }}
                    title={`${day.label}: ${formatMoney(day.amount)}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {modalItem && (
        <Modal item={modalItem} onClose={() => setModalItem(null)} />
      )}
    </div>
  );
}