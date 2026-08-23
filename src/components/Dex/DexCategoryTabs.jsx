import React from "react";
import { motion } from "motion/react";
import "./DexCategoryTabs.css";

export default function DexCategoryTabs({
  tabs = [],
  activeTab = "main",
  onTabSelect,
  isSearching = false,
}) {
  if (!tabs || tabs.length === 0) return null;

  return (
    <div className="dex-category-tabs-wrapper" data-tutorial-id="dex-category-tabs">
      <div className="dex-category-tabs-bar" role="tablist">
        {tabs.map((tab, index) => {
          const isActive = tab.key === activeTab;

          return (
            <React.Fragment key={tab.key}>
              {index > 0 && <span className="dex-category-divider" aria-hidden="true" />}
              <button
                role="tab"
                aria-selected={isActive}
                className={`dex-category-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => onTabSelect && onTabSelect(tab.key)}
                type="button"
              >
                {isActive && (
                  <motion.div
                    layoutId="dexCategoryPill"
                    className="dex-category-sliding-pill"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="dex-category-tab-text" style={{ position: "relative", zIndex: 2 }}>
                  {tab.title}
                </span>

                {isSearching && typeof tab.count === "number" && (
                  <span
                    className={`dex-category-count-badge ${isActive ? "active" : ""}`}
                    style={{ position: "relative", zIndex: 2 }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
