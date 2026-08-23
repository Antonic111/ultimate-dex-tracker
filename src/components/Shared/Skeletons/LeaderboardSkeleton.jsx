import React from "react";
import "../../Shared/LoadingSpinner.css";

export default function LeaderboardSkeleton() {
  return (
    <div className="leaderboard-skeleton-wrap fade-in-content" aria-busy="true" aria-label="Loading leaderboard">
      {/* Top 3 Podium Skeletons */}
      <div className="leaderboard-podium-section" style={{ pointerEvents: 'none' }}>
        {/* #2 Silver */}
        <div className="podium-card rank-2" style={{ opacity: 0.85 }}>
          <div className="skeleton-box" style={{ width: '42px', height: '22px', borderRadius: '20px', margin: '-10px auto 12px auto' }} />
          <div className="skeleton-box" style={{ width: '68px', height: '68px', borderRadius: '50%', marginBottom: '0.6rem' }} />
          <div className="skeleton-box" style={{ width: '110px', height: '18px', borderRadius: '6px', marginBottom: '0.4rem' }} />
          <div className="skeleton-box" style={{ width: '75px', height: '14px', borderRadius: '4px', marginBottom: '0.75rem' }} />
          <div className="skeleton-box" style={{ width: '130px', height: '22px', borderRadius: '6px', marginBottom: '0.35rem' }} />
          <div className="skeleton-box" style={{ width: '90px', height: '14px', borderRadius: '4px' }} />
        </div>

        {/* #1 Gold */}
        <div className="podium-card rank-1" style={{ opacity: 0.9 }}>
          <div className="skeleton-box" style={{ width: '46px', height: '24px', borderRadius: '20px', margin: '-12px auto 12px auto' }} />
          <div className="skeleton-box" style={{ width: '78px', height: '78px', borderRadius: '50%', marginBottom: '0.7rem' }} />
          <div className="skeleton-box" style={{ width: '130px', height: '20px', borderRadius: '6px', marginBottom: '0.45rem' }} />
          <div className="skeleton-box" style={{ width: '85px', height: '14px', borderRadius: '4px', marginBottom: '0.85rem' }} />
          <div className="skeleton-box" style={{ width: '145px', height: '24px', borderRadius: '6px', marginBottom: '0.35rem' }} />
          <div className="skeleton-box" style={{ width: '95px', height: '14px', borderRadius: '4px' }} />
        </div>

        {/* #3 Bronze */}
        <div className="podium-card rank-3" style={{ opacity: 0.85 }}>
          <div className="skeleton-box" style={{ width: '42px', height: '22px', borderRadius: '20px', margin: '-10px auto 12px auto' }} />
          <div className="skeleton-box" style={{ width: '68px', height: '68px', borderRadius: '50%', marginBottom: '0.6rem' }} />
          <div className="skeleton-box" style={{ width: '105px', height: '18px', borderRadius: '6px', marginBottom: '0.4rem' }} />
          <div className="skeleton-box" style={{ width: '70px', height: '14px', borderRadius: '4px', marginBottom: '0.75rem' }} />
          <div className="skeleton-box" style={{ width: '125px', height: '22px', borderRadius: '6px', marginBottom: '0.35rem' }} />
          <div className="skeleton-box" style={{ width: '85px', height: '14px', borderRadius: '4px' }} />
        </div>
      </div>

      {/* Table Skeletons */}
      <div className="leaderboard-table-card has-metric-col" style={{ pointerEvents: 'none' }}>
        <div className="leaderboard-table-head">
          <span className="col-rank">RANK</span>
          <span className="col-trainer">TRAINER</span>
          <span className="col-country">REGION</span>
          <span className="col-progress">LIVING DEX PROGRESS</span>
          <span className="col-action">VIEW</span>
        </div>

        <div className="leaderboard-table-body">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="leaderboard-row" style={{ cursor: 'default' }}>
              <div className="col-rank">
                <div className="skeleton-box" style={{ width: '32px', height: '24px', borderRadius: '12px' }} />
              </div>
              <div className="col-trainer">
                <div className="skeleton-box" style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div className="skeleton-box" style={{ width: `${90 + (idx % 4) * 25}px`, height: '15px' }} />
                </div>
              </div>
              <div className="col-country">
                <div className="skeleton-box" style={{ width: '70px', height: '14px' }} />
              </div>
              <div className="col-progress">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', maxWidth: '300px' }}>
                  <div className="skeleton-box" style={{ width: '100%', height: '8px', borderRadius: '4px' }} />
                  <div className="skeleton-box" style={{ width: '120px', height: '11px' }} />
                </div>
              </div>
              <div className="col-action">
                <div className="skeleton-box" style={{ width: '65px', height: '28px', borderRadius: '8px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
