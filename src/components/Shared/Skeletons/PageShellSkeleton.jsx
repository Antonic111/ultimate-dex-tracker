import React from "react";
import "../../Shared/LoadingSpinner.css";

export default function PageShellSkeleton({ titleWidth = "180px" }) {
  return (
    <div className="container page-container fade-in-content" style={{ padding: '2rem 1rem' }} aria-busy="true">
      {/* Top Title & Controls Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="skeleton-box" style={{ width: titleWidth, height: '34px', borderRadius: '8px' }} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="skeleton-box" style={{ width: '100px', height: '36px', borderRadius: '8px' }} />
          <div className="skeleton-box" style={{ width: '100px', height: '36px', borderRadius: '8px' }} />
        </div>
      </div>

      <div style={{ width: '100%', height: '1px', background: 'var(--dividers, #333)', marginBottom: '1.75rem' }} />

      {/* Main Content Area Skeletons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            style={{
              height: '180px',
              borderRadius: '14px',
              background: 'var(--pokemon-box-bg, #181818)',
              border: '1px solid var(--border-color, #333333)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="skeleton-box" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <div className="skeleton-box" style={{ width: '70%', height: '16px' }} />
                <div className="skeleton-box" style={{ width: '40%', height: '12px' }} />
              </div>
            </div>
            <div className="skeleton-box" style={{ width: '100%', height: '32px', borderRadius: '6px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
