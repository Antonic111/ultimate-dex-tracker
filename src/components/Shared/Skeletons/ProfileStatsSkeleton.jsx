import React from "react";
import "../../Shared/LoadingSpinner.css";
import "../../../css/ProfileStatsPage.css";

export default function ProfileStatsSkeleton() {
  return (
    <div className="container page-container stats-page-container fade-in-content" aria-busy="true" aria-label="Loading statistics" style={{ pointerEvents: 'none' }}>
      {/* 1. Hero Trainer Banner Skeleton */}
      <div className="stats-hero-card">
        <div className="stats-hero-profile">
          <div className="stats-hero-avatar-wrap">
            <div className="skeleton-box" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
          </div>
          <div className="stats-hero-info">
            <div className="skeleton-box" style={{ width: '220px', height: '28px', borderRadius: '6px', marginBottom: '8px' }} />
            <div className="skeleton-box" style={{ width: '150px', height: '14px', borderRadius: '4px' }} />
          </div>
        </div>

        {/* Master Completion Center Display Skeleton */}
        <div className="stats-hero-master-box">
          <div className="skeleton-box stats-hero-legend-sprite stats-hero-legend-left" style={{ width: '85px', height: '85px', borderRadius: '8px', background: 'transparent' }} />
          <div className="stats-hero-master-center">
            <div className="skeleton-box" style={{ width: '130px', height: '14px', borderRadius: '4px', margin: '0 auto 8px auto' }} />
            <div className="skeleton-box" style={{ width: '90px', height: '36px', borderRadius: '8px', margin: '0 auto 8px auto' }} />
            <div className="skeleton-box" style={{ width: '160px', height: '12px', borderRadius: '4px', margin: '0 auto 10px auto' }} />
            <div className="stats-hero-master-bar">
              <div className="skeleton-box" style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
          <div className="skeleton-box stats-hero-legend-sprite stats-hero-legend-right" style={{ width: '85px', height: '85px', borderRadius: '8px', background: 'transparent' }} />
        </div>

        <div className="stats-hero-right">
          <div className="skeleton-box" style={{ width: '130px', height: '38px', borderRadius: '8px' }} />
        </div>
      </div>

      {/* 2. 5 Key Overview Metric Cards Skeleton */}
      <div className="stats-overview-grid">
        {/* Regular Living Dex */}
        <div className="stat-overview-card">
          <div className="stat-overview-header">
            <div className="skeleton-box" style={{ width: '120px', height: '12px' }} />
          </div>
          <div className="stat-overview-body">
            <div className="stat-overview-left">
              <div className="skeleton-box" style={{ width: '110px', height: '24px', marginBottom: '6px' }} />
              <div className="skeleton-box" style={{ width: '80px', height: '12px' }} />
            </div>
            <div className="stat-overview-right">
              <div className="skeleton-box" style={{ width: '54px', height: '54px', borderRadius: '50%' }} />
            </div>
          </div>
        </div>

        {/* Shiny Living Dex */}
        <div className="stat-overview-card">
          <div className="stat-overview-header">
            <div className="skeleton-box" style={{ width: '110px', height: '12px' }} />
          </div>
          <div className="stat-overview-body">
            <div className="stat-overview-left">
              <div className="skeleton-box" style={{ width: '110px', height: '24px', marginBottom: '6px' }} />
              <div className="skeleton-box" style={{ width: '80px', height: '12px' }} />
            </div>
            <div className="stat-overview-right">
              <div className="skeleton-box" style={{ width: '54px', height: '54px', borderRadius: '50%' }} />
            </div>
          </div>
        </div>

        {/* Top Game */}
        <div className="stat-overview-card">
          <div className="stat-overview-header">
            <div className="skeleton-box" style={{ width: '110px', height: '12px' }} />
          </div>
          <div className="stat-overview-body">
            <div className="stat-overview-left">
              <div className="skeleton-box" style={{ width: '100px', height: '20px', marginBottom: '6px' }} />
              <div className="skeleton-box" style={{ width: '90px', height: '12px' }} />
            </div>
            <div className="stat-overview-right">
              <div className="skeleton-box" style={{ width: '42px', height: '42px', borderRadius: '8px' }} />
            </div>
          </div>
        </div>

        {/* Favorite Ball */}
        <div className="stat-overview-card">
          <div className="stat-overview-header">
            <div className="skeleton-box" style={{ width: '90px', height: '12px' }} />
          </div>
          <div className="stat-overview-body">
            <div className="stat-overview-left">
              <div className="skeleton-box" style={{ width: '90px', height: '20px', marginBottom: '6px' }} />
              <div className="skeleton-box" style={{ width: '70px', height: '12px' }} />
            </div>
            <div className="stat-overview-right">
              <div className="skeleton-box" style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
            </div>
          </div>
        </div>

        {/* Top Mark */}
        <div className="stat-overview-card">
          <div className="stat-overview-header">
            <div className="skeleton-box" style={{ width: '80px', height: '12px' }} />
          </div>
          <div className="stat-overview-body">
            <div className="stat-overview-left">
              <div className="skeleton-box" style={{ width: '100px', height: '20px', marginBottom: '6px' }} />
              <div className="skeleton-box" style={{ width: '70px', height: '12px' }} />
            </div>
            <div className="stat-overview-right">
              <div className="skeleton-box" style={{ width: '38px', height: '38px', borderRadius: '8px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Generations Breakdown Skeleton */}
      <div className="stats-section-block">
        <div className="stats-section-title">
          <div className="stats-section-title-left">
            <div className="skeleton-box" style={{ width: '160px', height: '20px' }} />
          </div>
          <div className="stats-section-title-right">
            <div className="skeleton-box" style={{ width: '120px', height: '28px', borderRadius: '20px' }} />
          </div>
        </div>

        <div className="generations-grid">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div key={idx} className="gen-card">
              <div className="gen-card-header">
                <div className="gen-card-header-left">
                  <div className="skeleton-box" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                  <div>
                    <div className="skeleton-box" style={{ width: '75px', height: '16px', marginBottom: '4px' }} />
                    <div className="skeleton-box" style={{ width: '90px', height: '11px' }} />
                  </div>
                </div>
                <div className="gen-card-header-right">
                  <div className="skeleton-box" style={{ width: '44px', height: '44px', borderRadius: '50%' }} />
                </div>
              </div>

              {/* Starter sprites row */}
              <div className="gen-starters-row">
                <div className="skeleton-box" style={{ width: '36px', height: '36px', borderRadius: '6px' }} />
                <div className="skeleton-box" style={{ width: '36px', height: '36px', borderRadius: '6px' }} />
                <div className="skeleton-box" style={{ width: '36px', height: '36px', borderRadius: '6px' }} />
              </div>

              {/* Regular Progress */}
              <div className="gen-progress-row">
                <div className="gen-progress-label-wrap">
                  <div className="skeleton-box" style={{ width: '50px', height: '11px' }} />
                  <div className="skeleton-box" style={{ width: '70px', height: '11px' }} />
                </div>
                <div className="gen-progress-bar">
                  <div className="skeleton-box" style={{ width: '100%', height: '100%' }} />
                </div>
              </div>

              {/* Shiny Progress */}
              <div className="gen-progress-row">
                <div className="gen-progress-label-wrap">
                  <div className="skeleton-box" style={{ width: '40px', height: '11px' }} />
                  <div className="skeleton-box" style={{ width: '70px', height: '11px' }} />
                </div>
                <div className="gen-progress-bar">
                  <div className="skeleton-box" style={{ width: '100%', height: '100%' }} />
                </div>
              </div>

              {/* Master Combined Progress */}
              <div className="gen-master-row">
                <div className="gen-master-label-wrap">
                  <div className="skeleton-box" style={{ width: '90px', height: '11px' }} />
                  <div className="skeleton-box" style={{ width: '35px', height: '11px' }} />
                </div>
                <div className="gen-master-bar">
                  <div className="skeleton-box" style={{ width: '100%', height: '100%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
