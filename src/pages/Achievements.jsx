import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock, Image as ImageIcon, Trophy, Unlock, Layers, Sparkles, X, Check
} from 'lucide-react';
import {
  SearchField, SectionLoader, NoResults
} from '../components/Shared';
import { buildApiUrl } from '../config/api';
import {
  ACHIEVEMENT_CATEGORIES,
  INITIAL_ACHIEVEMENTS
} from '../data/achievementsData';
import '../css/Achievements.css';

export default function Achievements() {
  const navigate = useNavigate();

  // Auth / Admin verification
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data & Filters
  const [achievements, setAchievements] = useState(INITIAL_ACHIEVEMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [floatingBadge, setFloatingBadge] = useState(null);
  const [originRect, setOriginRect] = useState(null);

  const handleSelectBadge = (ach, event) => {
    if (event?.currentTarget) {
      const frame = event.currentTarget.querySelector('.achievement-badge-frame') || event.currentTarget;
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
    setFloatingBadge(ach);
  };

  // Check admin access (currently unreleased to general public)
  useEffect(() => {
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
              if (isMounted) {
                setIsAdmin(true);
                setLoading(false);
              }
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

    checkAdmin();
    return () => { isMounted = false; };
  }, [navigate]);

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

  // Calculate badge stats for cards (counting tiers for total badges)
  const stats = useMemo(() => {
    const total = achievements.reduce((acc, a) => acc + (a.tiers?.length || 1), 0);
    const unlocked = achievements.reduce((acc, a) => acc + (a.unlockedTiersCount || (a.unlocked ? (a.tiers?.length || 1) : 0)), 0);
    const tiered = achievements.filter(a => a.type === 'tiered').length;
    const secret = achievements.filter(a => a.isSecret || a.type === 'secret').length;
    return { total, unlocked, tiered, secret };
  }, [achievements]);

  if (isAdmin === null || (loading && achievements.length === 0)) {
    return <SectionLoader minHeight="70vh" />;
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
        <p className="achievements-header-desc">
          Track your accomplishments, unlock prestige badges, and showcase your collection mastery.
        </p>
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
      {groupedAchievements.length === 0 ? (
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
                  onSelect={(e) => handleSelectBadge(ach, e)}
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
              originRect={originRect}
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
  const rawTier = (badge?.tier || 'bronze').toLowerCase();
  return TIER_CONFIG[rawTier] || TIER_CONFIG.bronze;
}

/**
 * Clean Badge Card:
 * Image for the badge (locked or not), Name, and Description
 * Clicking triggers center floating 3D viewer
 */
function AchievementCard({ achievement, onSelect }) {
  const isLocked = !achievement.unlocked; // default locked state for preview
  const isSecret = achievement.isSecret || achievement.type === 'secret';

  const displayName = isSecret && isLocked ? '???' : achievement.name;
  const displayDesc = isSecret && isLocked ? 'Secret achievement.' : achievement.description;
  const tierConfig = getBadgeTierConfig(achievement);

  return (
    <div
      className={`achievement-card ${isLocked ? 'is-locked' : ''}`}
      onClick={(e) => onSelect(e)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(e);
        }
      }}
      title={`Click to preview ${displayName} in 3D`}
    >
      {/* Badge Image: 3-layer composite with background, badge, and tier border */}
      <div className={`achievement-badge-frame ${achievement.artwork ? 'has-artwork' : ''} ${isLocked ? 'is-locked' : ''}`}>
        {achievement.artwork ? (
          <div className="achievement-badge-composite">
            <img src="/badges/borders-and-background/background.png" alt="" className="composite-bg" draggable={false} />
            <img src={achievement.artwork} alt={displayName} className="composite-badge" draggable={false} />
            <img src={tierConfig.borderUrl} alt="" className="composite-border" draggable={false} />
          </div>
        ) : (
          <>
            <ImageIcon size={26} style={{ opacity: 0.45, marginBottom: 3 }} />
            <span style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.7, lineHeight: 1.1 }}>
              No artwork uploaded
            </span>
          </>
        )}

        {isLocked && (
          <div className="achievement-lock-pill" title="Locked">
            <Lock size={12} />
          </div>
        )}
      </div>

      {/* Name and Description */}
      <div className="achievement-card-info">
        <h3 className="achievement-title" title={displayName}>
          {displayName}
        </h3>
        <p className="achievement-desc" title={displayDesc}>
          {displayDesc}
        </p>
      </div>
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
function FloatingBadgeViewer({ badge, originRect, onClose }) {
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

  const [activeTier, setActiveTier] = useState(() => (badge.tier || 'bronze').toLowerCase());

  const isLocked = !badge.unlocked;
  const isSecret = badge.isSecret || badge.type === 'secret';
  const displayName = isSecret && isLocked ? '???' : badge.name;
  const displayDesc = isSecret && isLocked ? 'Secret achievement.' : badge.description;
  const tierConfig = getBadgeTierConfig({ ...badge, tier: activeTier });

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
        <h2 className="floating-badge-name">{displayName}</h2>
        <p className="floating-badge-desc">{displayDesc}</p>

        <div className="floating-badge-tag-row">
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
          {/* Interactive Tier Switcher (Replaces category tag) */}
          <div className="floating-badge-tier-selector" role="tablist" aria-label="Select Badge Tier">
            {['bronze', 'silver', 'gold', 'diamond'].map((tierKey) => {
              const cfg = TIER_CONFIG[tierKey];
              const isSelected = activeTier === tierKey;
              return (
                <button
                  key={tierKey}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`floating-badge-tier-pill tier-${tierKey} ${isSelected ? 'is-active' : ''}`}
                  onClick={() => setActiveTier(tierKey)}
                  title={`View ${cfg.name} Medal`}
                >
                  <span className="tier-dot" />
                  {cfg.name}
                </button>
              );
            })}
          </div>
        </div>
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

              {/* 2. Overlapping Solid 3D Extruded Badge Emblem (Seamless 0.5px Slices) */}
              {badge.artwork ? (
                <div className="coin-3d-badge-layer">
                  <img src={badge.artwork} alt="" className="badge-slice slice-1" draggable={false} />
                  <img src={badge.artwork} alt="" className="badge-slice slice-2" draggable={false} />
                  <img src={badge.artwork} alt="" className="badge-slice slice-3" draggable={false} />
                  <img src={badge.artwork} alt="" className="badge-slice slice-4" draggable={false} />
                  <img src={badge.artwork} alt="" className="badge-slice slice-5" draggable={false} />
                  <img src={badge.artwork} alt="" className="badge-slice slice-6" draggable={false} />
                  <img src={badge.artwork} alt="" className="badge-slice slice-7" draggable={false} />
                  <img src={badge.artwork} alt="" className="badge-slice slice-8" draggable={false} />
                  <img
                    src={badge.artwork}
                    alt={displayName}
                    className={`badge-slice slice-top ${isLocked ? 'is-locked' : ''}`}
                    draggable={false}
                  />
                  {/* Subtle Specular Glisten strictly on the badge emblem itself */}
                  {!isLocked && (
                    <div
                      className="badge-emblem-glisten"
                      style={{
                        WebkitMaskImage: `url("${badge.artwork}")`,
                        maskImage: `url("${badge.artwork}")`
                      }}
                    />
                  )}
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
    </div>
  );
}
