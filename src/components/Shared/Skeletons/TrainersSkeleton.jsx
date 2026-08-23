import React from "react";
import "../../Shared/LoadingSpinner.css";
import "../../../css/Trainers.css";

export default function TrainersSkeleton() {
  return (
    <div className="trainer-grid fade-in-content" aria-busy="true" aria-label="Loading trainers" style={{ pointerEvents: 'none' }}>
      {Array.from({ length: 12 }).map((_, idx) => (
        <div key={idx} className="trainer-card" style={{ opacity: 0.9 }}>
          {/* Card Head (Avatar on left, Name & Sub on right) */}
          <div className="trainer-card-head">
            <div className="skeleton-box trainer-avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0 }} />
            <div className="trainer-meta" style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
              <div className="skeleton-box" style={{ width: `${100 + (idx % 4) * 20}px`, height: '16px', borderRadius: '4px' }} />
              <div className="skeleton-box" style={{ width: '60px', height: '12px', borderRadius: '3px' }} />
            </div>
          </div>

          {/* Card Progress Section */}
          <div className="trainer-card-progress-section">
            <div className="trainer-progress-header">
              <div className="skeleton-box" style={{ width: '90px', height: '14px', borderRadius: '4px' }} />
              <div className="skeleton-box" style={{ width: '40px', height: '14px', borderRadius: '4px' }} />
            </div>

            <div className="trainer-progress-bar-track">
              <div className="skeleton-box" style={{ width: '100%', height: '100%' }} />
            </div>

            <div className="trainer-progress-footer-stats" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <div className="skeleton-box" style={{ width: '70px', height: '12px', borderRadius: '3px' }} />
              <div className="skeleton-box" style={{ width: '60px', height: '12px', borderRadius: '3px' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
