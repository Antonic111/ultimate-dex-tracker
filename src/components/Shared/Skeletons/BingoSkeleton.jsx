import React from "react";
import "../../Shared/LoadingSpinner.css";
import "../../../pages/Bingo.css";

export default function BingoSkeleton() {
  return (
    <div className="bingo-container fade-in-content" aria-busy="true" aria-label="Loading Bingo" style={{ pointerEvents: 'none' }}>
      <div className="bingo-header-row">
        <h1 className="page-title">Shiny Bingo</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="skeleton-box" style={{ width: '90px', height: '36px', borderRadius: '6px' }} />
          <div className="skeleton-box" style={{ width: '90px', height: '36px', borderRadius: '6px' }} />
        </div>
      </div>

      <div className="bingo-grid">
        {['B', 'I', 'N', 'G', 'O'].map((letter) => (
          <div key={letter} className="bingo-header-cell">
            {letter}
          </div>
        ))}
        {Array.from({ length: 25 }).map((_, idx) => (
          <div key={idx} className="bingo-cell-wrapper">
            <div className="bingo-cell empty" style={{ opacity: 0.85 }}>
              <div className="skeleton-box" style={{ width: '55%', height: '55%', borderRadius: '8px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
