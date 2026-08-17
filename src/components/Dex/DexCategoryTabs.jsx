import React, { useRef, useState, useLayoutEffect, useEffect } from "react";
import "./DexCategoryTabs.css";

export default function DexCategoryTabs({
  tabs = [],
  activeTab = "main",
  onTabSelect,
  isSearching = false,
}) {
  const containerRef = useRef(null);
  const activeTabRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({
    transform: "translate3d(0px, 0px, 0)",
    width: 0,
    height: 0,
    opacity: 0,
  });

  // Calculate sliding indicator position & dimensions
  const updateIndicator = () => {
    if (activeTabRef.current && containerRef.current) {
      const activeEl = activeTabRef.current;
      const left = activeEl.offsetLeft;
      const top = activeEl.offsetTop;
      const width = activeEl.offsetWidth;
      const height = activeEl.offsetHeight;

      setIndicatorStyle({
        transform: `translate3d(${left}px, ${top}px, 0)`,
        width: `${width}px`,
        height: `${height}px`,
        opacity: 1,
      });
    }
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [activeTab, tabs]);

  useEffect(() => {
    window.addEventListener("resize", updateIndicator);
    return () => {
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeTab, tabs]);

  if (!tabs || tabs.length === 0) return null;

  return (
    <div className="dex-category-tabs-wrapper" data-tutorial-id="dex-category-tabs">
      <div className="dex-category-tabs-bar" ref={containerRef} role="tablist">
        {/* Animated sliding background pill using site accent color */}
        <div
          className="dex-category-sliding-pill"
          style={{
            transform: indicatorStyle.transform,
            width: indicatorStyle.width,
            height: indicatorStyle.height,
            opacity: indicatorStyle.opacity,
          }}
        />

        {tabs.map((tab, index) => {
          const isActive = tab.key === activeTab;

          return (
            <React.Fragment key={tab.key}>
              {index > 0 && <span className="dex-category-divider" aria-hidden="true" />}
              <button
                ref={isActive ? activeTabRef : null}
                role="tab"
                aria-selected={isActive}
                className={`dex-category-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => onTabSelect && onTabSelect(tab.key)}
                type="button"
              >
                <span className="dex-category-tab-text">{tab.title}</span>

                {isSearching && typeof tab.count === "number" && (
                  <span className={`dex-category-count-badge ${isActive ? "active" : ""}`}>
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
