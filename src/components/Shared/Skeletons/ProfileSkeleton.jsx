import React from "react";
import "../../Shared/LoadingSpinner.css";

export default function ProfileSkeleton() {
  return (
    <div
      className="profile-skeleton-wrapper fade-in-content w-full max-w-[1300px] flex flex-col items-center"
      style={{ width: '100%', maxWidth: '1300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      aria-busy="true"
      aria-label="Loading profile"
    >
      {/* 1. Hero Section Skeleton */}
      <div className="profile-hero-section" style={{ pointerEvents: 'none' }}>
        <div className="profile-hero-content">
          {/* Avatar */}
          <div className="profile-hero-avatar-wrapper">
            <div className="profile-hero-avatar">
              <div className="skeleton-box" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
            </div>
          </div>

          {/* Hero Info */}
          <div className="profile-hero-info">
            <div className="profile-hero-top-row">
              <div className="profile-hero-identity">
                {/* Username */}
                <div className="skeleton-box" style={{ width: '220px', height: '36px', borderRadius: '8px', marginBottom: '8px' }} />
                
                {/* Social icons + likes */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                  <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                  <div className="skeleton-box" style={{ width: '60px', height: '32px', borderRadius: '9999px' }} />
                </div>

                {/* Joined date */}
                <div className="skeleton-box" style={{ width: '130px', height: '16px', marginTop: '8px' }} />
                {/* Online pill */}
                <div className="skeleton-box" style={{ width: '80px', height: '22px', borderRadius: '9999px', marginTop: '6px' }} />
              </div>

              {/* Action Buttons */}
              <div className="profile-hero-actions">
                <div className="skeleton-box" style={{ width: '110px', height: '38px', borderRadius: '8px' }} />
                <div className="skeleton-box" style={{ width: '38px', height: '38px', borderRadius: '8px' }} />
              </div>
            </div>

            {/* Bio Box */}
            <div className="profile-hero-bio">
              <div className="skeleton-box" style={{ width: '100%', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-box" style={{ width: '75%', height: '14px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Stats Bar Skeleton */}
      <div className="profile-top-stats-container" style={{ pointerEvents: 'none' }}>
        <div className="profile-top-stats-grid">
          {/* Living Dex Card */}
          <div className="top-stat-card">
            <div className="skeleton-box" style={{ width: '130px', height: '12px', marginBottom: '14px' }} />
            <div className="skeleton-box" style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
            <div className="skeleton-box" style={{ width: '90px', height: '12px', marginTop: '10px' }} />
          </div>

          {/* Shiny Dex Card */}
          <div className="top-stat-card border-l-dark">
            <div className="skeleton-box" style={{ width: '130px', height: '12px', marginBottom: '14px' }} />
            <div className="skeleton-box" style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
            <div className="skeleton-box" style={{ width: '90px', height: '12px', marginTop: '10px' }} />
          </div>

          {/* Likes Card */}
          <div className="top-stat-card border-l-dark">
            <div className="skeleton-box" style={{ width: '90px', height: '12px', marginBottom: '18px' }} />
            <div className="skeleton-box" style={{ width: '70px', height: '42px', borderRadius: '8px' }} />
            <div className="skeleton-box" style={{ width: '60px', height: '12px', marginTop: '12px' }} />
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="profile-top-stats-links">
          <div className="top-stat-link-btn">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="skeleton-box" style={{ width: '110px', height: '16px' }} />
              <div className="skeleton-box" style={{ width: '70px', height: '11px' }} />
            </div>
            <div className="skeleton-box" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
          </div>
          <div className="top-stat-link-btn">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="skeleton-box" style={{ width: '100px', height: '16px' }} />
              <div className="skeleton-box" style={{ width: '80px', height: '11px' }} />
            </div>
            <div className="skeleton-box" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
          </div>
        </div>
      </div>

      {/* 3. Two Columns Skeleton */}
      <div className="profile-columns-container" style={{ pointerEvents: 'none' }}>
        {/* Left Column */}
        <div className="profile-left-col">
          {/* Info Box */}
          <div className="profile-info-box-container">
            <div className="skeleton-box" style={{ width: '140px', height: '18px', marginBottom: '1.25rem' }} />
            <div className="profile-info-grid">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="profile-info-row">
                  <div className="skeleton-box" style={{ width: '100px', height: '14px' }} />
                  <div className="skeleton-box" style={{ width: `${110 + (idx % 3) * 30}px`, height: '16px' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Favorite Games */}
          <div className="profile-favorites-section">
            <div className="skeleton-box" style={{ width: '150px', height: '18px', marginBottom: '1rem' }} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="skeleton-box" style={{ width: '68px', height: '68px', borderRadius: '10px' }} />
              ))}
            </div>
          </div>

          {/* Favorite Pokemon */}
          <div className="profile-favorites-section">
            <div className="skeleton-box" style={{ width: '160px', height: '18px', marginBottom: '1rem' }} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="skeleton-box" style={{ width: '68px', height: '68px', borderRadius: '10px' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="profile-right-col">
          <div className="profile-stats-grid">
            {/* Recent Catches Section */}
            <div>
              <div className="skeleton-box" style={{ width: '150px', height: '18px', marginBottom: '1rem' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="skeleton-box"
                    style={{
                      height: '110px',
                      borderRadius: '12px',
                      background: 'var(--pokemon-box-bg, #181818)'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Type/Generation Progress breakdown */}
            <div style={{ marginTop: '1rem' }}>
              <div className="skeleton-box" style={{ width: '180px', height: '18px', marginBottom: '1rem' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div className="skeleton-box" style={{ width: '90px', height: '13px' }} />
                      <div className="skeleton-box" style={{ width: '50px', height: '13px' }} />
                    </div>
                    <div className="skeleton-box" style={{ width: '100%', height: '8px', borderRadius: '4px' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
