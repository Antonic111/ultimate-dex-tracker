import React from "react";
import "../../Shared/LoadingSpinner.css";
import "../../../css/Counters.css";
import "../../../css/MMOTool.css";

export default function MMOToolSkeleton() {
  return (
    <div className="container page-container mmo-page fade-in-content" aria-busy="true" aria-label="Loading MMO Tool" style={{ pointerEvents: 'none' }}>
      {/* 1. Header Row */}
      <div className="mmo-header">
        <div className="mmo-title-block">
          <h1 className="mmo-page-title" style={{ margin: 0 }}>MMO Tool</h1>
        </div>
      </div>

      <div className="app-divider" style={{ margin: '1.25rem 0 2rem 0' }} />

      {/* 2. Section Header: Active Permutation Hunts */}
      <div className="mmo-section-header">
        <div className="mmo-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="skeleton-box" style={{ width: '220px', height: '22px', borderRadius: '4px' }} />
            <div className="skeleton-box" style={{ width: '26px', height: '22px', borderRadius: '12px' }} />
          </div>
          <div className="skeleton-box" style={{ width: '210px', height: '32px', borderRadius: '6px' }} />
        </div>
      </div>

      {/* 3. Hunts Grid */}
      <div className="hunts-grid">
        {/* Mock Permutation Hunt Card */}
        <div className="hunt-card">
          <div className="hunt-header">
            <div className="hunt-pokemon">
              <div className="skeleton-box hunt-pokemon-image" style={{ width: '70px', height: '70px', borderRadius: '10px' }} />
              <div className="hunt-pokemon-info">
                <div className="skeleton-box" style={{ width: '140px', height: '22px', borderRadius: '4px', marginBottom: '6px' }} />
                <div className="skeleton-box" style={{ width: '80px', height: '14px', borderRadius: '3px' }} />
              </div>
            </div>
            <div className="hunt-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
              <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
            </div>
          </div>

          <div className="hunt-checks">
            <div className="checks-display">
              <div className="skeleton-box" style={{ width: '80px', height: '36px', borderRadius: '6px' }} />
            </div>
            <div className="timer-display">
              <div className="skeleton-box" style={{ width: '60px', height: '14px', marginBottom: '4px' }} />
              <div className="skeleton-box" style={{ width: '40px', height: '12px' }} />
            </div>
            <div className="checks-buttons" style={{ display: 'flex', gap: '6px' }}>
              <div className="skeleton-box" style={{ width: '42px', height: '42px', borderRadius: '8px' }} />
              <div className="skeleton-box" style={{ width: '42px', height: '42px', borderRadius: '8px' }} />
              <div className="skeleton-box" style={{ width: '42px', height: '42px', borderRadius: '8px' }} />
            </div>
          </div>

          <div className="hunt-complete">
            <div className="hunt-odds-display">
              <div className="skeleton-box" style={{ width: '90px', height: '16px', borderRadius: '4px' }} />
            </div>
          </div>
        </div>

        {/* Add Hunt Card */}
        <div className="add-hunt-card" style={{ cursor: 'default' }}>
          <div className="add-hunt-content">
            <div className="skeleton-box add-hunt-icon" style={{ width: '48px', height: '48px', borderRadius: '50%', marginBottom: '10px' }} />
            <div className="skeleton-box" style={{ width: '130px', height: '18px', borderRadius: '4px' }} />
          </div>
        </div>
      </div>

      {/* 4. Chart Placeholder Box */}
      <div
        style={{
          marginTop: '2.5rem',
          marginBottom: '2rem',
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          backgroundColor: 'var(--card-background)',
          border: '2px dashed var(--border-color)',
          borderRadius: '16px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div className="skeleton-box" style={{ width: '300px', height: '24px', borderRadius: '6px' }} />
        <div className="skeleton-box" style={{ width: '180px', height: '14px', borderRadius: '4px' }} />
      </div>
    </div>
  );
}
