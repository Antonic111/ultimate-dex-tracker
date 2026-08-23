import React from "react";
import "../../Shared/LoadingSpinner.css";
import "../../../css/Counters.css";

export default function CountersSkeleton() {
  return (
    <div className="container page-container counters-page fade-in-content" aria-busy="true" aria-label="Loading hunts" style={{ pointerEvents: 'none' }}>
      {/* 1. Header Row Skeleton */}
      <div className="counters-header-row">
        <div className="counters-title-block">
          <div className="skeleton-box" style={{ width: '220px', height: '40px', borderRadius: '10px' }} />
        </div>
        <div className="counters-stats-banner">
          <div className="skeleton-box" style={{ width: '130px', height: '24px', borderRadius: '6px' }} />
          <div className="skeleton-box" style={{ width: '140px', height: '24px', borderRadius: '6px' }} />
          <div className="skeleton-box" style={{ width: '120px', height: '24px', borderRadius: '6px' }} />
        </div>
        <div className="counters-header-actions">
          <div className="skeleton-box" style={{ width: '110px', height: '36px', borderRadius: '10px' }} />
          <div className="skeleton-box" style={{ width: '85px', height: '36px', borderRadius: '10px' }} />
          <div className="skeleton-box" style={{ width: '105px', height: '36px', borderRadius: '10px' }} />
        </div>
      </div>

      <div className="counters-divider" />

      {/* 2. Section Header */}
      <div className="counters-section-header">
        <div className="skeleton-box" style={{ width: '140px', height: '20px', borderRadius: '4px' }} />
      </div>

      {/* 3. Hunts Grid Skeleton */}
      <div className="hunts-grid">
        {[1, 2].map((i) => (
          <div key={i} className="hunt-card" style={{ minHeight: '430px' }}>
            <div className="hunt-card-top-bar">
              <div className="skeleton-box" style={{ width: '70px', height: '22px', borderRadius: '9999px' }} />
              <div className="skeleton-box" style={{ width: '28px', height: '28px', borderRadius: '8px' }} />
            </div>

            <div className="hunt-pokemon-row">
              <div className="skeleton-box" style={{ width: '82px', height: '82px', borderRadius: '50%' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="skeleton-box" style={{ width: '150px', height: '24px', borderRadius: '6px' }} />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div className="skeleton-box" style={{ width: '65px', height: '20px', borderRadius: '6px' }} />
                  <div className="skeleton-box" style={{ width: '90px', height: '20px', borderRadius: '6px' }} />
                </div>
              </div>
            </div>

            <div className="skeleton-box" style={{ width: '100%', height: '80px', borderRadius: '14px', marginBottom: '1rem' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1fr 0.8fr', gap: '8px', marginBottom: '0.75rem' }}>
              <div className="skeleton-box" style={{ height: '42px', borderRadius: '12px' }} />
              <div className="skeleton-box" style={{ height: '42px', borderRadius: '12px' }} />
              <div className="skeleton-box" style={{ height: '42px', borderRadius: '12px' }} />
              <div className="skeleton-box" style={{ height: '42px', borderRadius: '12px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px', marginBottom: '0.85rem' }}>
              <div className="skeleton-box" style={{ height: '40px', borderRadius: '12px' }} />
              <div className="skeleton-box" style={{ height: '40px', borderRadius: '12px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.65rem' }}>
              <div className="skeleton-box" style={{ width: '80px', height: '20px', borderRadius: '6px' }} />
              <div className="skeleton-box" style={{ width: '120px', height: '18px', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
