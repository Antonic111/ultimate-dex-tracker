import React from "react";
import "../../Shared/LoadingSpinner.css";

export default function DexViewSkeleton({ count = 30 }) {
  return (
    <div className="dex-view-skeleton fade-in-content" aria-busy="true" aria-label="Loading Pokémon Pokédex">
      {/* Box / Summary Bar Skeleton */}
      <div
        style={{
          width: '100%',
          height: '42px',
          background: 'var(--pokemon-box-bg, #181818)',
          border: '1px solid var(--border-color, #333333)',
          borderRadius: '10px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem'
        }}
      >
        <div className="skeleton-box" style={{ width: '120px', height: '18px' }} />
        <div className="skeleton-box" style={{ width: '160px', height: '14px' }} />
      </div>

      {/* Pokémon Cards Grid Skeleton */}
      <div
        className="pokemon-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '0.65rem',
          pointerEvents: 'none'
        }}
      >
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="pokemon-box"
            style={{
              height: '148px',
              padding: '0.6rem',
              background: 'var(--pokemon-box-bg, #181818)',
              border: '1px solid var(--border-color, #333333)',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
              <div className="skeleton-box" style={{ width: '32px', height: '12px' }} />
              <div className="skeleton-box" style={{ width: '14px', height: '14px', borderRadius: '50%' }} />
            </div>

            <div className="skeleton-box" style={{ width: '64px', height: '64px', borderRadius: '8px' }} />

            <div className="skeleton-box" style={{ width: '80%', height: '13px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
