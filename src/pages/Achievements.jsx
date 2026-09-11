import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock, Image as ImageIcon, Trophy, Unlock, Layers, Sparkles, X, Check, ShieldAlert, Info
} from 'lucide-react';
import {
  SearchField, SectionLoader, InlineLoader, NoResults, Tooltip
} from '../components/Shared';
import { useUser } from '../components/Shared/UserContext';
import { buildApiUrl } from '../config/api';
import { profileAPI, caughtAPI, achievementsAPI, bingoAPI } from '../utils/api';
import {
  ACHIEVEMENT_CATEGORIES,
  INITIAL_ACHIEVEMENTS,
  isBadgeShinyToggleable,
  getBadgeArtwork,
  calculateAchievementProgress,
  SPECIAL_BALLS_LIST
} from '../data/achievementsData';
import '../css/Achievements.css';

function SpecialBallsTooltipContent({ usedBalls = [], isShiny = false }) {
  const usedCount = usedBalls.length;
  return (
    <div className="special-balls-tooltip-content">
      <div className="special-balls-tooltip-header">
        <div className="special-balls-tooltip-title-row">
          <strong>Eligible Special Balls</strong>
          <span className="special-balls-tooltip-count">{usedCount} / 16</span>
        </div>
        <span className="special-balls-tooltip-sub">
          {isShiny ? 'Shiny catches registered in eligible balls:' : 'Regular catches registered in eligible balls:'}
        </span>
      </div>
      <div className="special-balls-tooltip-grid">
        {SPECIAL_BALLS_LIST.map((ball) => {
          const isUsed = usedBalls.includes(ball.name);
          return (
            <div
              key={ball.name}
              className={`special-ball-tooltip-item ${isUsed ? 'is-used' : ''}`}
            >
              <img src={ball.image} alt="" className="special-ball-tooltip-img" draggable={false} />
              <span className="special-ball-tooltip-name">{ball.name}</span>
              {isUsed && <Check size={11} className="special-ball-check" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Achievements() {
  const navigate = useNavigate();

  // Auth / Admin verification from UserContext
  const { user, isAdmin: contextIsAdmin, loading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(() => {
    if (contextIsAdmin || user?.isAdmin) return true;
    try {
      if (localStorage.getItem('isAdmin') === 'true') return true;
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Admin Preview State (Admins Only)
  const [adminUnlockAll, setAdminUnlockAll] = useState(false);

  // Data & Filters
  const [achievements, setAchievements] = useState(INITIAL_ACHIEVEMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [floatingBadge, setFloatingBadge] = useState(null);
  const [originRect, setOriginRect] = useState(null);

  // Badge Rarity Data across eligible accounts
  const [rarityMap, setRarityMap] = useState({});
  const [totalEligibleUsers, setTotalEligibleUsers] = useState(0);

  // Load caught records for the current user only
  const getUserCaughtMap = () => {
    try {
      const u = localStorage.getItem('username');
      if (u) {
        const userRaw = localStorage.getItem(`caughtInfoMap:${u}`);
        if (userRaw) {
          const parsed = JSON.parse(userRaw);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      }
      const genericRaw = localStorage.getItem('caughtPokemon') || localStorage.getItem('caughtInfoMap');
      if (genericRaw) {
        const parsed = JSON.parse(genericRaw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {};
  };

  // User caught map from localStorage and caughtAPI
  const [caughtMap, setCaughtMap] = useState(() => getUserCaughtMap());

  // Preload all badge artworks and composite borders for instant responsiveness
  useEffect(() => {
    const urls = new Set([
      '/badges/borders-and-background/background.png',
      '/badges/borders-and-background/front-border-bronze.png?v=3',
      '/badges/borders-and-background/front-border-silver.png?v=4',
      '/badges/borders-and-background/front-border-gold.png?v=3',
      '/badges/borders-and-background/front-border-diamond.png?v=3',
      '/badges/borders-and-background/back-border-bronze.png?v=3',
      '/badges/borders-and-background/back-border-silver.png?v=4',
      '/badges/borders-and-background/back-border-gold.png?v=3',
      '/badges/borders-and-background/back-border-diamond.png?v=3'
    ]);

    achievements.forEach(a => {
      if (a.artwork) urls.add(a.artwork);
      if (a.shinyArtwork) urls.add(a.shinyArtwork);
      a.tiers?.forEach(t => {
        if (t.artworkUrl) urls.add(t.artworkUrl);
        if (t.shinyArtworkUrl) urls.add(t.shinyArtworkUrl);
      });
    });

    urls.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [achievements]);

  // Sync caught data and fetch global rarity in parallel
  useEffect(() => {
    let isMounted = true;

    const syncCaught = () => {
      if (isMounted) {
        setCaughtMap(getUserCaughtMap());
      }
    };

    window.addEventListener('storage', syncCaught);
    window.addEventListener('bingoCompleted', syncCaught);

    const loadData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const [caughtRes, rarityRes, bingoRes] = await Promise.allSettled([
          token ? caughtAPI.getCaughtData() : Promise.resolve(null),
          achievementsAPI.getRarity(),
          token ? bingoAPI.getBingo() : Promise.resolve(null)
        ]);

        if (isMounted) {
          if (caughtRes.status === 'fulfilled' && caughtRes.value && typeof caughtRes.value === 'object') {
            setCaughtMap(caughtRes.value);
          }
          if (rarityRes.status === 'fulfilled' && rarityRes.value) {
            if (rarityRes.value.rarity) setRarityMap(rarityRes.value.rarity);
            if (rarityRes.value.totalEligibleUsers != null) setTotalEligibleUsers(rarityRes.value.totalEligibleUsers);
          }
          if (bingoRes.status === 'fulfilled' && bingoRes.value) {
            const bData = bingoRes.value;
            const u = localStorage.getItem('username') || '';
            if (bData.years && typeof bData.years === 'object') {
              Object.entries(bData.years).forEach(([yr, yrData]) => {
                if (yrData && Array.isArray(yrData.grid) && yrData.grid.length > 0 && u) {
                  try {
                    localStorage.setItem(`bingo-grid-state-v1:${u}:${yr}`, JSON.stringify(yrData.grid));
                  } catch {}
                }
              });
            } else if (Array.isArray(bData.grid) && bData.grid.length > 0 && u) {
              const yr = bData.selectedYear || new Date().getFullYear();
              try {
                localStorage.setItem(`bingo-grid-state-v1:${u}:${yr}`, JSON.stringify(bData.grid));
              } catch {}
            }
          }
        }
      } catch (err) {
        console.warn('Could not load achievement data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      window.removeEventListener('storage', syncCaught);
      window.removeEventListener('bingoCompleted', syncCaught);
    };
  }, []);

  const handleSelectBadge = (ach, event, isShiny = false, activeTier = null, progressData = null) => {
    if (event?.currentTarget) {
      const frame = event.currentTarget.classList?.contains('achievement-badge-frame')
        ? event.currentTarget
        : (event.currentTarget.querySelector?.('.achievement-badge-frame') || event.currentTarget);
      const rect = frame.getBoundingClientRect();
      setOriginRect({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height
      });
    } else {
      setOriginRect(null);
    }
    setFloatingBadge({
      ...ach,
      initialIsShiny: isShiny,
      initialActiveTier: activeTier,
      initialProgressData: progressData
    });
  };

  // Check admin access (currently unreleased to general public)
  useEffect(() => {
    if (contextIsAdmin || user?.isAdmin) {
      setIsAdmin(true);
      return;
    }

    if (!userLoading && user && !user.isAdmin && !contextIsAdmin) {
      setIsAdmin(false);
      navigate('/', { replace: true });
      return;
    }

    let isMounted = true;
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(buildApiUrl('/profile'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include'
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (data?.isAdmin) {
              if (isMounted) setIsAdmin(true);
              return;
            }
          }
        }
        if (isMounted) {
          setIsAdmin(false);
          navigate('/', { replace: true });
        }
      } catch (err) {
        if (isMounted) {
          setIsAdmin(false);
          navigate('/', { replace: true });
        }
      }
    };

    if (isAdmin === null) {
      checkAdmin();
    }
    return () => { isMounted = false; };
  }, [contextIsAdmin, user, userLoading, isAdmin, navigate]);

  // Filtered achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter(ach => {
      // Category filter
      if (selectedCategory !== 'All' && ach.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ach.name?.toLowerCase().includes(q);
        const matchesDesc = ach.description?.toLowerCase().includes(q);
        const matchesCat = ach.category?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat) {
          return false;
        }
      }
      return true;
    });
  }, [achievements, selectedCategory, searchQuery]);

  // Group by category when 'All' categories is chosen
  const groupedAchievements = useMemo(() => {
    if (selectedCategory !== 'All') {
      return [{ category: selectedCategory, items: filteredAchievements }];
    }
    return ACHIEVEMENT_CATEGORIES.map(cat => ({
      category: cat,
      items: filteredAchievements.filter(a => a.category === cat)
    })).filter(g => g.items.length > 0);
  }, [filteredAchievements, selectedCategory]);

  // Calculate badge stats for cards (counting tiers for total badges and dynamic unlocked counts)
  const stats = useMemo(() => {
    const total = achievements.reduce((acc, a) => acc + (a.tiers?.length || 1), 0);
    const unlocked = achievements.reduce((acc, a) => {
      const progress = calculateAchievementProgress(a, caughtMap, false);
      return acc + (progress.tierOrder || (progress.unlocked ? 1 : 0));
    }, 0);
    const tiered = achievements.filter(a => a.type === 'tiered').length;
    const secret = achievements.filter(a => a.isSecret || a.type === 'secret').length;
    return { total, unlocked, tiered, secret };
  }, [achievements, caughtMap]);

  if (isAdmin === null && userLoading) {
    return (
      <div className="achievements-page fade-in-up">
        <div className="achievements-header-wrap">
          <div className="achievements-title-row">
            <h1 className="achievements-main-title">Achievements & Badges</h1>
          </div>
        </div>
        <SectionLoader minHeight="350px" message="Loading achievements & badges..." />
      </div>
    );
  }

  if (isAdmin === false) {
    return null;
  }

  return (
    <div className="achievements-page fade-in-up">
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="achievements-header-wrap">
        <div className="achievements-title-row">
          <h1 className="achievements-main-title">Achievements & Badges</h1>
        </div>
      </div>

      <div className="app-divider" />

      {/* ── 4 STAT CARDS ROW (TRAINERS PAGE STYLE) ─────────────────────────── */}
      <div className="achievements-stat-cards-row">
        {/* Stat 1: Total Badges */}
        <div className="stat-pill-card">
          <div className="stat-pill-icon-wrap">
            <Trophy size={30} className="stat-icon-trophy" />
          </div>
          <div className="stat-pill-content">
            <span className="stat-pill-num">{stats.total}</span>
            <span className="stat-pill-title">Total Badges</span>
          </div>
        </div>

        {/* Stat 2: Unlocked Badges */}
        <div className="stat-pill-card">
          <div className="stat-pill-icon-wrap">
            <Unlock size={30} className="stat-icon-unlocked" />
          </div>
          <div className="stat-pill-content">
            <span className="stat-pill-num">{stats.unlocked}</span>
            <span className="stat-pill-title">Unlocked</span>
          </div>
        </div>

        {/* Stat 3: Tiered Progression */}
        <div className="stat-pill-card">
          <div className="stat-pill-icon-wrap">
            <Layers size={30} className="stat-icon-tiered" />
          </div>
          <div className="stat-pill-content">
            <span className="stat-pill-num">{stats.tiered}</span>
            <span className="stat-pill-title">Tiered Badges</span>
          </div>
        </div>

        {/* Stat 4: Secret Badges */}
        <div className="stat-pill-card">
          <div className="stat-pill-icon-wrap">
            <Sparkles size={30} className="stat-icon-secret" />
          </div>
          <div className="stat-pill-content">
            <span className="stat-pill-num">{stats.secret}</span>
            <span className="stat-pill-title">Secret Badges</span>
          </div>
        </div>
      </div>

      {/* ── OVERALL ACHIEVEMENTS PROGRESS BAR (ACCENT COLORED) ───────────────── */}
      <div className="achievements-progress-wrapper">
        <div className="achievements-progress-labels">
          <span className="achievements-progress-title">Achievements Progress</span>
          <span className="achievements-progress-stats">
            {stats.unlocked} / {stats.total} · {stats.total === 0 ? 0 : Math.round((stats.unlocked / stats.total) * 100)}% done! · {Math.max(0, stats.total - stats.unlocked)} to go!
          </span>
        </div>
        <div className="achievements-progress-track">
          <div
            className="achievements-progress-fill"
            style={{
              width: `${stats.total === 0 ? 0 : Math.min(100, Math.round((stats.unlocked / stats.total) * 100))}%`
            }}
          />
        </div>
      </div>

      {/* ── TOOLBAR / SEARCH & CATEGORIES ────────────────────────────────────── */}
      <div className="achievements-toolbar">
        <div className="achievements-toolbar-top">
          <div className="achievements-search-wrap">
            <SearchField
              placeholder="Search achievements by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>
          {loading && <InlineLoader className="achievements-search-loader" />}
        </div>

        {/* Category Chips Bar */}
        <div className="achievements-category-chips">
          <button
            type="button"
            className={`achievements-category-chip ${selectedCategory === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            All Categories
          </button>
          {ACHIEVEMENT_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              className={`achievements-category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── ACHIEVEMENTS SECTIONS ────────────────────────────────────────────── */}
      {loading && achievements.length === 0 ? (
        <SectionLoader minHeight="350px" message="Loading achievements & badges..." />
      ) : groupedAchievements.length === 0 ? (
        <NoResults
          title="No achievements match your search"
          message="Try clearing your search query or selecting another category."
          onClear={() => {
            setSearchQuery('');
            setSelectedCategory('All');
          }}
        />
      ) : (
        groupedAchievements.map(group => (
          <section key={group.category} className="achievements-section">
            <div className="achievements-section-header">
              <h2 className="achievements-section-title">
                {group.category}
              </h2>
              <span className="achievements-section-count">
                {group.items.length} {group.items.length === 1 ? 'badge' : 'badges'}
              </span>
            </div>

            <div className="app-divider" style={{ margin: '8px 0 18px 0 !important' }} />

            <div className="achievements-grid">
              {group.items.map(ach => (
                <AchievementCard
                  key={ach.id}
                  achievement={ach}
                  caughtMap={caughtMap}
                  adminUnlockAll={adminUnlockAll}
                  rarityMap={rarityMap}
                  totalEligibleUsers={totalEligibleUsers}
                  onSelect={(e, isShiny, tier, prog) => handleSelectBadge(ach, e, isShiny, tier, prog)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {/* ── FLOATING 3D BADGE VIEWER OVERLAY (PORTALED TO BODY FOR TRUE VIEWPORT CENTERING) ── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {floatingBadge && (
            <FloatingBadgeViewer
              badge={floatingBadge}
              caughtMap={caughtMap}
              originRect={originRect}
              isAdmin={isAdmin}
              adminUnlockAll={adminUnlockAll}
              setAdminUnlockAll={setAdminUnlockAll}
              rarityMap={rarityMap}
              totalEligibleUsers={totalEligibleUsers}
              onClose={() => setFloatingBadge(null)}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

export const TIER_CONFIG = {
  bronze: {
    name: 'Bronze',
    borderUrl: '/badges/borders-and-background/front-border-bronze.png?v=3',
    backBorderUrl: '/badges/borders-and-background/back-border-bronze.png?v=3',
    stars: '★',
    starCount: 1,
    className: 'tier-bronze'
  },
  silver: {
    name: 'Silver',
    borderUrl: '/badges/borders-and-background/front-border-silver.png?v=4',
    backBorderUrl: '/badges/borders-and-background/back-border-silver.png?v=4',
    stars: '★ ★',
    starCount: 2,
    className: 'tier-silver'
  },
  gold: {
    name: 'Gold',
    borderUrl: '/badges/borders-and-background/front-border-gold.png?v=3',
    backBorderUrl: '/badges/borders-and-background/back-border-gold.png?v=3',
    stars: '★ ★ ★',
    starCount: 3,
    className: 'tier-gold'
  },
  diamond: {
    name: 'Diamond',
    borderUrl: '/badges/borders-and-background/front-border-diamond.png?v=3',
    backBorderUrl: '/badges/borders-and-background/back-border-diamond.png?v=3',
    stars: '★ ★ ★ ★',
    starCount: 4,
    className: 'tier-diamond'
  },
  master: {
    name: 'Diamond',
    borderUrl: '/badges/borders-and-background/front-border-diamond.png?v=3',
    backBorderUrl: '/badges/borders-and-background/back-border-diamond.png?v=3',
    stars: '★ ★ ★ ★',
    starCount: 4,
    className: 'tier-diamond'
  }
};

export function getBadgeTierConfig(badge) {
  const isSingle = badge?.type === 'single' || badge?.type === 'secret' || (badge?.tiers && badge.tiers.length === 1);
  const rawTier = (badge?.tier || (isSingle ? 'diamond' : 'bronze')).toLowerCase();
  return TIER_CONFIG[rawTier] || TIER_CONFIG.bronze;
}

/**
 * Clean Badge Card:
 * Image for the badge (locked or not), Name, and Description
 * Top-right type badge (Tiered / Single / Secret)
 * Bottom-right switch toggles between regular and shiny variant
 * Clicking triggers center floating 3D viewer with the selected variant
 */
function AchievementCard({ achievement, caughtMap = {}, onSelect, adminUnlockAll = false, rarityMap = {}, totalEligibleUsers = 0 }) {
  const [isShiny, setIsShiny] = useState(false);
  const isSecret = achievement.isSecret || achievement.type === 'secret';

  const progressData = useMemo(
    () => calculateAchievementProgress(achievement, caughtMap, isShiny),
    [achievement, caughtMap, isShiny]
  );
  const isLocked = !progressData.unlocked && !adminUnlockAll;

  const displayName = isSecret && isLocked ? '???' : achievement.name;
  const displayDesc = isSecret && isLocked ? 'Secret achievement.' : progressData.displayGoal;

  // For single/secret badges, always resolve tier to Diamond; otherwise use highest unlocked tier or Bronze
  const isSingle = achievement.type === 'single' || achievement.type === 'secret' || (achievement.tiers && achievement.tiers.length === 1);
  const activeTier = isSingle
    ? (achievement.tier ? achievement.tier.toLowerCase() : 'diamond')
    : (progressData.unlockedTier || (achievement.tier || 'bronze').toLowerCase());
  const tierConfig = getBadgeTierConfig({ ...achievement, tier: activeTier });
  const canToggleShiny = isBadgeShinyToggleable(achievement);
  const currentArtwork = getBadgeArtwork(achievement, isShiny, activeTier);

  // Resolve independent tier rarity
  const badgeSlug = achievement.slug || achievement.id;
  const badgeRarityData = rarityMap[badgeSlug] || rarityMap[achievement.id];
  const tierRarity = (isShiny && badgeRarityData?.shiny?.[activeTier])
    || badgeRarityData?.[activeTier]
    || { count: 0, percentage: 0, display: '0%' };

  const isTiered = achievement.type === 'tiered';
  const typeLabel = isTiered ? 'Tiered' : isSecret ? 'Secret' : 'Single';
  const typeClass = isTiered ? 'type-tiered' : isSecret ? 'type-secret' : 'type-single';

  return (
    <div className={`achievement-card ${isLocked ? 'is-locked' : ''}`}>
      {/* Top-Right Badge: Tiered / Single / Secret */}
      <span className={`achievement-type-pill ${typeClass}`} title={typeLabel}>
        {typeLabel}
      </span>

      {/* Badge Image: Clickable to view in 3D only when unlocked */}
      {isLocked ? (
        <div className="achievement-badge-frame is-locked" title="Locked">
          <div className="achievement-locked-placeholder">
            <Lock size={26} className="locked-badge-lock-icon" />
          </div>
        </div>
      ) : (
        <div
          className="achievement-badge-frame is-unlocked has-artwork"
          onClick={(e) => onSelect(e, isShiny, activeTier, progressData)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(e, isShiny, activeTier, progressData);
            }
          }}
          title={`Click to view ${displayName} in 3D`}
        >
          <div className="achievement-badge-composite">
            <img src="/badges/borders-and-background/background.png" alt="" className="composite-bg" draggable={false} />
            {currentArtwork && (
              <img
                key={currentArtwork}
                src={currentArtwork}
                alt={displayName}
                className="composite-badge"
                loading="eager"
                decoding="async"
                draggable={false}
              />
            )}
            <img src={tierConfig.borderUrl} alt="" className="composite-border" draggable={false} />
          </div>
        </div>
      )}

      {/* Rarity Number Pill Box - Horizontally aligned with shiny toggle at bottom */}
      <div className="achievement-badge-rarity-wrap">
        <Tooltip
          content={
            <span>
              <strong>{tierRarity.display}</strong> of all registered trainers have achieved this <strong>{tierConfig.name}</strong> badge.
              {totalEligibleUsers > 0 && tierRarity.count > 0 && (
                <span style={{ display: 'block', opacity: 0.78, fontSize: '0.72rem', marginTop: '2px' }}>
                  ({tierRarity.count.toLocaleString()} of {totalEligibleUsers.toLocaleString()} eligible trainers)
                </span>
              )}
            </span>
          }
          position="top"
          align="start"
          maxWidth={280}
          wrap
        >
          <span className="achievement-badge-rarity-pill">
            {tierRarity.display}
          </span>
        </Tooltip>
      </div>

      {/* Name, Description, and Progress */}
      <div className="achievement-card-info">
        <div className="achievement-title-row">
          <h3 className="achievement-title" title={displayName}>
            {displayName}
          </h3>
          {(badgeSlug === 'ball-connoisseur' || badgeSlug === 'apriball-artisan') && (
            <Tooltip
              content={
                <SpecialBallsTooltipContent
                  usedBalls={progressData.usedSpecialBalls || []}
                  isShiny={isShiny}
                />
              }
              position="top"
              align="center"
              maxWidth={350}
              wrap
            >
              <button
                type="button"
                className="achievement-info-trigger-btn"
                onClick={(e) => e.stopPropagation()}
                aria-label="Eligible Special Balls"
              >
                <Info size={11} />
              </button>
            </Tooltip>
          )}
        </div>
        <p className="achievement-desc" title={displayDesc}>
          {displayDesc}
        </p>

        {progressData.totalCount > 1 && (
          <div className="achievement-card-progress-wrap">
            <div className="achievement-card-progress-bar">
              <div
                className="achievement-card-progress-fill"
                style={{
                  width: `${Math.min(100, Math.round((progressData.currentCount / (progressData.nextTier?.threshold || progressData.totalCount)) * 100))}%`
                }}
              />
            </div>
            <span className="achievement-card-progress-count">
              {progressData.currentCount} / {progressData.nextTier?.threshold || progressData.totalCount}
            </span>
          </div>
        )}
      </div>

      {/* Shiny Switch in Bottom Right of Card */}
      {canToggleShiny && (
        <button
          type="button"
          role="switch"
          aria-checked={isShiny}
          aria-label={isShiny ? 'Switch to regular badge' : 'Switch to shiny badge'}
          className={`achievement-shiny-switch card-bottom-right ${isShiny ? 'is-shiny' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsShiny(prev => !prev);
          }}
          title={isShiny ? 'Showing Shiny Variant (Click for Regular)' : 'Showing Regular Variant (Click for Shiny)'}
        >
          <span className="shiny-switch-label">Shiny</span>
          <span className="shiny-switch-slider">
            <span className="shiny-switch-knob" />
          </span>
        </button>
      )}
    </div>
  );
}

const COIN_SEGMENTS = Array.from({ length: 32 }, (_, i) => i * 11.25);

/**
 * Floating 3D Badge Viewer:
 * - Static info box pinned at top center of the screen
 * - Real 3D Coin with 32-segment reeded cylinder edges and metallic collector back
 * - Interactive physics: slow drag to inspect at any 3D angle, fast drag/flick in ANY direction to flip!
 */
function FloatingBadgeViewer({ badge, caughtMap = {}, originRect, onClose, isAdmin = false, adminUnlockAll = false, setAdminUnlockAll, rarityMap = {}, totalEligibleUsers = 0 }) {
  const cardRef = useRef(null);
  const isDragging = useRef(false);
  const isFlipping = useRef(false);
  const isSnapping = useRef(false);

  // 3D Rotations (Degrees) - Center straight ahead at 0, 0
  const flipRotX = useRef(0);
  const flipRotY = useRef(0);
  const spinVelX = useRef(0);
  const spinVelY = useRef(0);
  const targetSnapX = useRef(0);
  const targetSnapY = useRef(0);

  // Pointer drag kinematics
  const pointerStart = useRef({ x: 0, y: 0, time: 0 });
  const lastPointer = useRef({ x: 0, y: 0, time: 0 });
  const smoothedVx = useRef(0);
  const smoothedVy = useRef(0);

  // Hover tilt & breathing
  const targetTiltX = useRef(0);
  const targetTiltY = useRef(0);
  const currentTiltX = useRef(0);
  const currentTiltY = useRef(0);
  const currentFloatY = useRef(0);
  const dragFloatY = useRef(0);

  const [draggingState, setDraggingState] = useState(false);

  const [isShiny, setIsShiny] = useState(() => !!badge.initialIsShiny);
  const progressData = calculateAchievementProgress(badge, caughtMap, isShiny);

  const isSingle = badge.type === 'single' || badge.type === 'secret' || (badge.tiers && badge.tiers.length === 1);

  const [activeTier, setActiveTier] = useState(() => (
    isSingle
      ? (badge.tier ? badge.tier.toLowerCase() : 'diamond')
      : (badge.initialActiveTier || progressData.unlockedTier || (badge.tier || 'bronze').toLowerCase())
  ));

  const isLocked = !progressData.unlocked && !adminUnlockAll;
  const isSecret = badge.isSecret || badge.type === 'secret';
  const displayName = isSecret && isLocked ? '???' : badge.name;
  const displayDesc = isSecret && isLocked ? 'Secret achievement.' : progressData.displayGoal;
  const tierConfig = getBadgeTierConfig({ ...badge, tier: activeTier });
  const canToggleShiny = isBadgeShinyToggleable(badge);
  const displayArtwork = getBadgeArtwork(badge, isShiny, activeTier);

  // Prevent background scrolling without touching body overflow
  useEffect(() => {
    const preventScroll = (e) => {
      e.preventDefault();
    };
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Active 3D Mouse Following Perspective Tilt (Centered at 0, 0)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging.current) return;

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      // Normalized distance from center (-1 to +1)
      const normX = Math.max(-1, Math.min(1, (e.clientX - centerX) / (centerX || 1)));
      const normY = Math.max(-1, Math.min(1, (e.clientY - centerY) / (centerY || 1)));

      // Dynamic tilt: moving mouse up tilts up, right tilts right
      targetTiltX.current = -normY * 22;
      targetTiltY.current = normX * 22;
    };

    const handleMouseLeave = () => {
      targetTiltX.current = 0;
      targetTiltY.current = 0;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Pointer Drag & Flick Handlers
  const handlePointerDown = (e) => {
    isDragging.current = true;
    isFlipping.current = false;
    isSnapping.current = false;
    spinVelX.current = 0;
    spinVelY.current = 0;

    // Absorb any active hover tilt directly into flipRot so there is ZERO jump in angle
    flipRotX.current += currentTiltX.current;
    flipRotY.current += currentTiltY.current;
    currentTiltX.current = 0;
    currentTiltY.current = 0;
    targetTiltX.current = 0;
    targetTiltY.current = 0;

    // Lock the current floating position so the coin drags from its EXACT spot without lifting
    dragFloatY.current = currentFloatY.current;

    const now = performance.now();
    pointerStart.current = { x: e.clientX, y: e.clientY, time: now };
    lastPointer.current = { x: e.clientX, y: e.clientY, time: now };
    smoothedVx.current = 0;
    smoothedVy.current = 0;

    setDraggingState(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch { }
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;

    const now = performance.now();
    const dt = Math.max(1, now - lastPointer.current.time);
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;

    flipRotY.current += dx * 0.72;
    flipRotX.current -= dy * 0.72;

    if (dt > 80) {
      // Stationary pause during drag
      smoothedVx.current = 0;
      smoothedVy.current = 0;
    } else {
      const vx = dx / dt;
      const vy = dy / dt;
      smoothedVx.current = smoothedVx.current * 0.4 + vx * 0.6;
      smoothedVy.current = smoothedVy.current * 0.4 + vy * 0.6;
    }

    lastPointer.current = { x: e.clientX, y: e.clientY, time: now };
  };

  const handlePointerUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setDraggingState(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch { }

    // Resume idle breathing smoothly from the drag height
    currentFloatY.current = dragFloatY.current;

    const now = performance.now();
    const timeSinceLastMove = now - lastPointer.current.time;

    // If pointer was held still before release (> 50ms), release velocity is STRICTLY 0
    let vx = 0;
    let vy = 0;

    if (timeSinceLastMove <= 50) {
      const decay = Math.max(0, 1 - (timeSinceLastMove / 50));
      vx = smoothedVx.current * decay;
      vy = smoothedVy.current * decay;
    }

    const speed = Math.hypot(vx, vy);

    // Only spin if released with actual moving momentum
    if (speed > 0.15) {
      isFlipping.current = true;
      isSnapping.current = false;
      spinVelY.current = Math.max(-22, Math.min(22, vx * 16));
      spinVelX.current = Math.max(-22, Math.min(22, -vy * 16));
    } else {
      // Released while held still or slow drag -> settle directly to nearest face
      isFlipping.current = false;
      spinVelX.current = 0;
      spinVelY.current = 0;
      const targetFace = Math.round(flipRotY.current / 180);
      targetSnapX.current = 0;
      targetSnapY.current = targetFace * 180;
      isSnapping.current = true;
    }
  };

  // Continuous Animation Loop
  useEffect(() => {
    let rafId;

    const animate = (now) => {
      const time = (now || performance.now()) * 0.0015;
      const floatOffset = Math.sin(time * 1.5) * 6;

      if (isFlipping.current) {
        flipRotX.current += spinVelX.current;
        flipRotY.current += spinVelY.current;

        // Smooth air resistance friction
        spinVelX.current *= 0.982;
        spinVelY.current *= 0.982;

        const currentSpeed = Math.hypot(spinVelX.current, spinVelY.current);

        // ONLY trigger snapping once it has completely come to a stop!
        if (currentSpeed < 0.02) {
          spinVelX.current = 0;
          spinVelY.current = 0;
          isFlipping.current = false;

          const targetFace = Math.round(flipRotY.current / 180);
          targetSnapX.current = 0;
          targetSnapY.current = targetFace * 180;
          isSnapping.current = true;
        }
      } else if (isSnapping.current) {
        const diffX = targetSnapX.current - flipRotX.current;
        const diffY = targetSnapY.current - flipRotY.current;

        flipRotX.current += diffX * 0.075;
        flipRotY.current += diffY * 0.075;

        if (Math.abs(diffX) < 0.05 && Math.abs(diffY) < 0.05) {
          flipRotX.current = targetSnapX.current;
          flipRotY.current = targetSnapY.current;
          isSnapping.current = false;
        }
      }

      if (!isDragging.current) {
        currentTiltX.current += (targetTiltX.current - currentTiltX.current) * 0.12;
        currentTiltY.current += (targetTiltY.current - currentTiltY.current) * 0.12;
        currentFloatY.current += (floatOffset - currentFloatY.current) * 0.1;
      }

      if (cardRef.current) {
        const isMotionActive = isFlipping.current || isDragging.current;
        if (cardRef.current.classList.contains('is-spinning') !== isMotionActive) {
          cardRef.current.classList.toggle('is-spinning', isMotionActive);
        }

        const totalRotX = flipRotX.current + currentTiltX.current;
        const totalRotY = flipRotY.current + currentTiltY.current;
        const floatY = isDragging.current ? dragFloatY.current : currentFloatY.current;

        cardRef.current.style.transform = `perspective(1200px) translateY(${floatY.toFixed(2)}px) rotateX(${totalRotX.toFixed(2)}deg) rotateY(${totalRotY.toFixed(2)}deg)`;

        // Dynamic Global Light Reflection Angle based on 3D tilt & spin
        const lightAngle = (135 - totalRotY * 1.6 - totalRotX * 0.9 + 3600) % 360;
        cardRef.current.style.setProperty('--border-light-angle', `${lightAngle.toFixed(1)}deg`);
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const targetCenterY = typeof window !== 'undefined' ? window.innerHeight / 2 : 300;
  const targetCenterX = typeof window !== 'undefined' ? window.innerWidth / 2 : 400;

  const dx = originRect ? originRect.x - targetCenterX : 0;
  const dy = originRect ? originRect.y - targetCenterY : 0;
  const initScale = originRect ? 78 / 280 : 0.8;

  return (
    <div className="floating-badge-overlay">
      {/* Static Info Box pinned at top center */}
      <motion.div
        className="floating-badge-static-info"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ delay: 0.1, duration: 0.25 }}
      >
        <div className="floating-badge-name-row">
          <h2 className="floating-badge-name">{displayName}</h2>
          {(badge.slug === 'ball-connoisseur' || badge.slug === 'apriball-artisan' || badge.id === 'ach-bal-01') && (
            <Tooltip
              content={
                <SpecialBallsTooltipContent
                  usedBalls={progressData.usedSpecialBalls || []}
                  isShiny={isShiny}
                />
              }
              position="bottom"
              align="center"
              maxWidth={350}
              wrap
            >
              <button
                type="button"
                className="achievement-info-trigger-btn floating-info-trigger"
                onClick={(e) => e.stopPropagation()}
                aria-label="Eligible Special Balls"
              >
                <Info size={13} />
              </button>
            </Tooltip>
          )}
        </div>
        <p className="floating-badge-desc">{displayDesc}</p>

        <div className="floating-badge-chips-row">
          {isLocked ? (
            <span className="floating-badge-status-chip locked">
              <Lock size={12} />
              Locked
            </span>
          ) : (
            <span className="floating-badge-status-chip unlocked">
              <Check size={12} />
              Unlocked
            </span>
          )}

          {/* Rarity chip for current tier */}
          {(() => {
            const badgeSlug = badge.slug || badge.id;
            const badgeRarityData = rarityMap[badgeSlug] || rarityMap[badge.id];
            const currentTierRarity = (isShiny && badgeRarityData?.shiny?.[activeTier])
              || badgeRarityData?.[activeTier]
              || { count: 0, percentage: 0, display: '0%' };

            return (
              <span
                className="floating-badge-status-chip rarity"
                title={
                  totalEligibleUsers > 0 && currentTierRarity.count > 0
                    ? `${currentTierRarity.display} of eligible users earned this ${tierConfig.name} badge (${currentTierRarity.count.toLocaleString()} of ${totalEligibleUsers.toLocaleString()} trainers)`
                    : `${currentTierRarity.display} of eligible users earned this ${tierConfig.name} badge`
                }
              >
                {currentTierRarity.display} Rarity
              </span>
            );
          })()}

          {/* Shiny Switch in 3D Viewer */}
          {canToggleShiny && (
            <button
              type="button"
              role="switch"
              aria-checked={isShiny}
              className={`floating-badge-shiny-switch ${isShiny ? 'is-shiny' : ''}`}
              onClick={() => setIsShiny(prev => !prev)}
              title={isShiny ? 'Showing Shiny Variant (Click for Regular)' : 'Showing Regular Variant (Click for Shiny)'}
            >
              <span className="shiny-switch-label">Shiny</span>
              <span className="shiny-switch-slider">
                <span className="shiny-switch-knob" />
              </span>
            </button>
          )}
        </div>

        {/* Interactive Tier Switcher 2x2 Grid (Tiered badges only) */}
        {!isSingle && (badge.type === 'tiered' || (badge.tiers && badge.tiers.length > 1)) && (
          <div className="floating-badge-tier-grid" role="tablist" aria-label="Select Badge Tier">
            {['bronze', 'silver', 'gold', 'diamond'].map((tierKey) => {
              const cfg = TIER_CONFIG[tierKey];
              const isSelected = activeTier === tierKey;
              const tierOrderMap = { bronze: 1, silver: 2, gold: 3, diamond: 4 };
              const currentOrder = progressData?.tierOrder || (progressData?.unlocked ? 1 : 0);
              const isTierUnlocked = adminUnlockAll || (currentOrder >= (tierOrderMap[tierKey] || 1));

              const badgeSlug = badge.slug || badge.id;
              const badgeRarityData = rarityMap[badgeSlug] || rarityMap[badge.id];
              const btnTierRarity = (isShiny && badgeRarityData?.shiny?.[tierKey])
                || badgeRarityData?.[tierKey]
                || { count: 0, percentage: 0, display: '0%' };

              return (
                <button
                  key={tierKey}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  disabled={!isTierUnlocked}
                  className={`floating-badge-tier-btn tier-${tierKey} ${isSelected ? 'is-active' : ''} ${!isTierUnlocked ? 'is-locked-tier' : ''}`}
                  onClick={isTierUnlocked ? () => setActiveTier(tierKey) : undefined}
                  title={
                    isTierUnlocked
                      ? `View ${cfg.name} Medal (${btnTierRarity.display} of users)`
                      : `${cfg.name} (Locked - ${btnTierRarity.display} of users)`
                  }
                >
                  <span className="tier-dot" />
                  <span className="tier-btn-label">{cfg.name}</span>
                  <span className="tier-btn-rarity">{btnTierRarity.display}</span>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Close button at top right */}
      <button
        type="button"
        className="floating-badge-close-btn"
        onClick={onClose}
        title="Close (Esc)"
        aria-label="Close floating badge viewer"
      >
        <X size={22} />
      </button>

      {/* 3D Floating Coin Viewport */}
      <motion.div
        className="floating-badge-viewport"
        onClick={(e) => e.stopPropagation()}
        initial={{ x: dx, y: dy, scale: initScale, opacity: 0.8 }}
        animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
        exit={{ x: dx, y: dy, scale: initScale, opacity: 0 }}
        transition={{
          type: 'spring',
          damping: 26,
          stiffness: 280,
          mass: 0.85
        }}
      >
        <div className="floating-badge-coin-wrapper">
          <div
            ref={cardRef}
            className={`floating-badge-coin-3d ${tierConfig.className} ${draggingState ? 'is-dragging' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* 3D Edge Cylinder with 32 reeded metallic segments */}
            <div className="coin-edge-cylinder">
              {COIN_SEGMENTS.map((angle, idx) => (
                <div
                  key={idx}
                  className="coin-edge-segment"
                  style={{
                    '--seg-angle': `${angle}deg`,
                    transform: `rotateZ(${angle}deg) translateY(calc(-1 * var(--coin-radius, 140px))) rotateX(90deg)`
                  }}
                />
              ))}
            </div>

            {/* Front Face: Flat Background base with 3D Extruded Badge and Flat Border */}
            <div className="coin-face-front">
              {/* 1. Flat Base Background */}
              <img
                src="/badges/borders-and-background/background.png"
                alt="Background"
                className="coin-flat-background"
                draggable={false}
              />

              {/* 2. Overlapping Solid 3D Extruded Badge Emblem (Only visible when unlocked) */}
              {!isLocked && displayArtwork ? (
                <div className="coin-3d-badge-layer" key={`${displayArtwork}-${isShiny ? 'shiny' : 'reg'}`}>
                  <img src={displayArtwork} alt="" className="badge-slice slice-1" loading="eager" decoding="async" draggable={false} />
                  <img src={displayArtwork} alt="" className="badge-slice slice-2" loading="eager" decoding="async" draggable={false} />
                  <img src={displayArtwork} alt="" className="badge-slice slice-3" loading="eager" decoding="async" draggable={false} />
                  <img src={displayArtwork} alt="" className="badge-slice slice-4" loading="eager" decoding="async" draggable={false} />
                  <img src={displayArtwork} alt="" className="badge-slice slice-5" loading="eager" decoding="async" draggable={false} />
                  <img src={displayArtwork} alt="" className="badge-slice slice-6" loading="eager" decoding="async" draggable={false} />
                  <img src={displayArtwork} alt="" className="badge-slice slice-7" loading="eager" decoding="async" draggable={false} />
                  <img src={displayArtwork} alt="" className="badge-slice slice-8" loading="eager" decoding="async" draggable={false} />
                  <img
                    src={displayArtwork}
                    alt={displayName}
                    className="badge-slice slice-top"
                    loading="eager"
                    decoding="async"
                    draggable={false}
                  />
                </div>
              ) : isLocked ? (
                <div className="coin-locked-center-icon">
                  <Lock size={46} className="coin-locked-lock" />
                </div>
              ) : (
                <div className="floating-badge-placeholder">
                  <ImageIcon size={52} style={{ opacity: 0.45 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.75 }}>
                    No Artwork
                  </span>
                </div>
              )}

              {/* 3. Overlapping Flat Tier Border */}
              <img
                src={tierConfig.borderUrl}
                alt={`${tierConfig.name} Border`}
                className="coin-flat-border"
                draggable={false}
              />

              {/* Recessed Cavity Inner Bevel & Wall Inset Shadow */}
              <div className="coin-cavity-inset-shadow" />

              {/* Dynamic Global Light Specular Shine on Border */}
              <div className="coin-border-shine" />
            </div>

            {/* Back Face: Minted Commemorative Reverse with Matching Back Rim */}
            <div className="coin-face-back">
              {/* Dedicated Matching Back Rim Border */}
              <img
                src={tierConfig.backBorderUrl}
                alt=""
                className="coin-flat-border"
                draggable={false}
              />

              {/* Recessed Cavity Inset Wall Shadow */}
              <div className="coin-cavity-inset-shadow" />

              <div className="coin-back-inner-ring">
                <div className="coin-back-stars">{tierConfig.stars}</div>
                <div className="coin-back-cherishball">
                  <svg viewBox="0 0 100 100" className="cherishball-svg">
                    <defs>
                      <radialGradient id="cherishSphere" cx="38%" cy="28%" r="68%">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="30%" stopColor="#dc2626" />
                        <stop offset="72%" stopColor="#991b1b" />
                        <stop offset="100%" stopColor="#550f0f" />
                      </radialGradient>
                      <radialGradient id="cherishBtn" cx="35%" cy="35%" r="60%">
                        <stop offset="0%" stopColor="#fca5a5" />
                        <stop offset="35%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#7f1d1d" />
                      </radialGradient>
                    </defs>

                    {/* Red Base Sphere */}
                    <circle cx="50" cy="50" r="48" fill="url(#cherishSphere)" stroke="#18181b" strokeWidth="1.8" />

                    {/* Horizontal Seam */}
                    <line x1="2" y1="50" x2="98" y2="50" stroke="#18181b" strokeWidth="3.2" />

                    {/* Left Black Bracket Pad */}
                    <path d="M 5 36 C 20 36 28 42 28 50 C 28 58 20 64 5 64 C 2 56 2 44 5 36 Z" fill="#18181b" />
                    {/* Left Red Groove */}
                    <rect x="4" y="47.5" width="16" height="5" rx="2.5" fill="#dc2626" />

                    {/* Right Black Bracket Pad */}
                    <path d="M 95 36 C 80 36 72 42 72 50 C 72 58 80 64 95 64 C 98 56 98 44 95 36 Z" fill="#18181b" />
                    {/* Right Red Groove */}
                    <rect x="80" y="47.5" width="16" height="5" rx="2.5" fill="#dc2626" />

                    {/* Center Black Ring */}
                    <circle cx="50" cy="50" r="19" fill="none" stroke="#18181b" strokeWidth="6.5" />

                    {/* Center Red Button */}
                    <circle cx="50" cy="50" r="12" fill="url(#cherishBtn)" stroke="#18181b" strokeWidth="1.5" />
                  </svg>
                </div>
                <span className="coin-back-text">ULTIMATE DEX</span>
                <span className="coin-back-subtext">TRACKER</span>
              </div>

              {/* Dynamic Global Light Specular Shine on Back Border */}
              <div className="coin-border-shine" />
            </div>
          </div>

          {/* Dynamic Floor Shadow */}
          <div className="coin-floor-shadow" />
        </div>
      </motion.div>

      {/* Admin Tools Dock (Admins Only) */}
      {isAdmin && (
        <div className="floating-badge-admin-dock" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={`floating-badge-admin-toggle ${adminUnlockAll ? 'is-active' : ''}`}
            onClick={() => setAdminUnlockAll && setAdminUnlockAll(prev => !prev)}
            title="Admin Preview: Toggle all badges and tiers unlocked"
          >
            <ShieldAlert size={15} className="admin-toggle-icon" />
            <span className="admin-toggle-text">Unlock All (Admin)</span>
            <div className={`admin-switch-slider ${adminUnlockAll ? 'is-on' : ''}`}>
              <div className="admin-switch-knob" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
