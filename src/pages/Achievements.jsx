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
      {/* Badge Image: neutral empty state or artwork, with lock */}
      <div className={`achievement-badge-frame ${achievement.artwork ? 'has-artwork' : ''} ${isLocked ? 'is-locked' : ''}`}>
        {achievement.artwork ? (
          <img src={achievement.artwork} alt={displayName} />
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

  // Drag & Physics State
  const isDragging = useRef(false);
  const isFlipping = useRef(false);
  const isSnapping = useRef(false);

  // 3D Rotations (Degrees)
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

  const [draggingState, setDraggingState] = useState(false);

  const isLocked = !badge.unlocked;
  const isSecret = badge.isSecret || badge.type === 'secret';
  const displayName = isSecret && isLocked ? '???' : badge.name;
  const displayDesc = isSecret && isLocked ? 'Secret achievement.' : badge.description;

  // Star rating: 1 star for bronze, expandable to 2 for silver, 3 for gold, 4 for master
  const starCount = badge.tier === 'master' ? 4 : badge.tier === 'gold' ? 3 : badge.tier === 'silver' ? 2 : 1;
  const starsString = Array.from({ length: starCount }, () => '★').join(' ');

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

  // Active 3D Mouse Following Perspective Tilt (Across Entire Viewport)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging.current) return;

      let coinCenterX = window.innerWidth / 2;
      let coinCenterY = window.innerHeight / 2;

      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        coinCenterX = rect.left + rect.width / 2;
        coinCenterY = rect.top + rect.height / 2;
      }

      const normX = Math.max(-1, Math.min(1, (e.clientX - coinCenterX) / (window.innerWidth / 2 || 1)));
      const normY = Math.max(-1, Math.min(1, (e.clientY - coinCenterY) / (window.innerHeight / 2 || 1)));

      // Stronger, more responsive 3D mouse following tilt
      targetTiltX.current = -normY * 30;
      targetTiltY.current = normX * 30;
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

  // Pointer Handlers for Controlled Drag & Deliberate Flick
  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    isDragging.current = true;
    isFlipping.current = false;
    isSnapping.current = false;
    spinVelX.current = 0;
    spinVelY.current = 0;

    const now = performance.now();
    pointerStart.current = { x: e.clientX, y: e.clientY, time: now };
    lastPointer.current = { x: e.clientX, y: e.clientY, time: now };
    smoothedVx.current = 0;
    smoothedVy.current = 0;

    setDraggingState(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;

    const now = performance.now();
    const dt = Math.max(1, now - lastPointer.current.time);
    const deltaX = e.clientX - lastPointer.current.x;
    const deltaY = e.clientY - lastPointer.current.y;

    const instVx = deltaX / dt;
    const instVy = deltaY / dt;
    smoothedVx.current = smoothedVx.current * 0.35 + instVx * 0.65;
    smoothedVy.current = smoothedVy.current * 0.35 + instVy * 0.65;

    // Solid, weighted 3D drag (not twitchy)
    flipRotY.current += deltaX * 0.42;
    flipRotX.current -= deltaY * 0.42;

    lastPointer.current = { x: e.clientX, y: e.clientY, time: now };
  };

  const handlePointerUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setDraggingState(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const now = performance.now();
    const totalDist = Math.hypot(e.clientX - pointerStart.current.x, e.clientY - pointerStart.current.y);
    const totalTime = now - pointerStart.current.time;
    const speed = Math.hypot(smoothedVx.current, smoothedVy.current);

    // Deliberate flick (speed > 0.75px/ms, distance > 40px in under 380ms)
    const isFlick = speed > 0.75 && totalDist > 40 && totalTime < 380;

    if (isFlick) {
      isFlipping.current = true;
      // Generous rotational velocity: spins freely for a bit
      spinVelY.current = Math.max(-28, Math.min(28, smoothedVx.current * 16));
      spinVelX.current = Math.max(-28, Math.min(28, -smoothedVy.current * 16));
    } else {
      // Normal slow drag release: softly ease to closest 180° face
      targetSnapX.current = Math.round(flipRotX.current / 180) * 180;
      targetSnapY.current = Math.round(flipRotY.current / 180) * 180;
      isSnapping.current = true;
    }
  };

  // Continuous Animation Loop (Inertia, Damping & Harmonic Float)
  useEffect(() => {
    let rafId;

    const animate = (now) => {
      const time = (now || performance.now()) * 0.0015;
      const floatOffset = Math.sin(time * 1.5) * 6;

      if (isFlipping.current) {
        // Spin freely with pure, natural momentum
        flipRotX.current += spinVelX.current;
        flipRotY.current += spinVelY.current;

        // Gentle air resistance: spins for a bit, gradually coasting down
        spinVelX.current *= 0.980;
        spinVelY.current *= 0.980;

        const currentSpeed = Math.hypot(spinVelX.current, spinVelY.current);

        // Only when the spin has naturally coasted down to a crawl, slowly snap
        if (currentSpeed < 0.45) {
          targetSnapX.current = Math.round(flipRotX.current / 180) * 180;
          targetSnapY.current = Math.round(flipRotY.current / 180) * 180;
          isFlipping.current = false;
          isSnapping.current = true;
        }
      } else if (isSnapping.current) {
        // Very slow, gentle settling into the resting face (soft glide, no snap)
        const diffX = targetSnapX.current - flipRotX.current;
        const diffY = targetSnapY.current - flipRotY.current;
        flipRotX.current += diffX * 0.042;
        flipRotY.current += diffY * 0.042;

        if (Math.abs(diffX) < 0.04 && Math.abs(diffY) < 0.04) {
          flipRotX.current = targetSnapX.current;
          flipRotY.current = targetSnapY.current;
          isSnapping.current = false;
        }
      } else if (!isDragging.current) {
        // Active mouse following across viewport + gentle breathing
        currentTiltX.current += (targetTiltX.current - currentTiltX.current) * 0.09;
        currentTiltY.current += (targetTiltY.current - currentTiltY.current) * 0.09;
        currentFloatY.current += (floatOffset - currentFloatY.current) * 0.09;
      }

      if (cardRef.current) {
        const isMotionActive = isFlipping.current || isDragging.current;
        if (cardRef.current.classList.contains('is-spinning') !== isMotionActive) {
          cardRef.current.classList.toggle('is-spinning', isMotionActive);
        }

        const totalRotX = flipRotX.current + (!isDragging.current && !isFlipping.current ? currentTiltX.current : 0);
        const totalRotY = flipRotY.current + (!isDragging.current && !isFlipping.current ? currentTiltY.current : 0);
        const floatY = !isDragging.current && !isFlipping.current ? currentFloatY.current : 0;

        cardRef.current.style.transform = `perspective(1200px) translateY(${floatY.toFixed(2)}px) rotateX(${totalRotX.toFixed(2)}deg) rotateY(${totalRotY.toFixed(2)}deg)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Compute offset from origin position on screen to viewport center
  const targetCenterY = typeof window !== 'undefined' ? window.innerHeight / 2 : 300;
  const targetCenterX = typeof window !== 'undefined' ? window.innerWidth / 2 : 400;

  const dx = originRect ? originRect.x - targetCenterX : 0;
  const dy = originRect ? originRect.y - targetCenterY : 0;
  const initScale = originRect ? Math.max(0.25, originRect.width / 280) : 0.35;

  return (
    <motion.div
      className="floating-badge-overlay"
      role="dialog"
      aria-modal="true"
      initial={{ opacity: 0, backdropFilter: 'blur(0px)', WebkitBackdropFilter: 'blur(0px)' }}
      animate={{ opacity: 1, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      exit={{ opacity: 0, backdropFilter: 'blur(0px)', WebkitBackdropFilter: 'blur(0px)' }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
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
        </div>
      </motion.div>

      {/* Close button at top right */}
      <motion.button
        type="button"
        className="floating-badge-close-btn"
        onClick={onClose}
        title="Close (Esc)"
        aria-label="Close floating badge viewer"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.7 }}
        transition={{ delay: 0.1, duration: 0.2 }}
      >
        <X size={22} />
      </motion.button>

      {/* 3D Floating Coin (The ONLY 3D object) */}
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
            className={`floating-badge-coin-3d ${draggingState ? 'is-dragging' : ''}`}
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
                    transform: `rotateZ(${angle}deg) translateY(calc(-1 * var(--coin-radius, 140px))) rotateX(90deg)`
                  }}
                />
              ))}
            </div>

            {/* Front Face with Badge Artwork (Photo matches coin diameter with no extra edge) */}
            <div className="coin-face-front">
              {badge.artwork ? (
                <img
                  src={badge.artwork}
                  alt={displayName}
                  className={`floating-badge-img ${isLocked ? 'is-locked' : ''}`}
                  draggable={false}
                />
              ) : (
                <div className="floating-badge-placeholder">
                  <ImageIcon size={52} style={{ opacity: 0.45 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.75 }}>
                    No Artwork
                  </span>
                </div>
              )}
              {/* Metallic Specular Glisten Sweep */}
              <div className="coin-shine-sweep" />
            </div>

            {/* Back Face with Metallic Collector's Seal (Cherish Ball + Bronze Star) */}
            <div className="coin-face-back">
              <div className="coin-back-inner-ring">
                <div className="coin-back-stars">{starsString}</div>
                <div className="coin-back-cherishball">
                  <svg viewBox="0 0 100 100" className="cherishball-svg">
                    <defs>
                      <radialGradient id="cherishSphere" cx="38%" cy="28%" r="68%">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="30%" stopColor="#dc2626" />
                        <stop offset="72%" stopColor="#991b1b" />
                        <stop offset="100%" stopColor="#681212" />
                      </radialGradient>
                      <radialGradient id="cherishBtn" cx="35%" cy="35%" r="60%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#991b1b" />
                      </radialGradient>
                    </defs>

                    {/* Red Base Sphere */}
                    <circle cx="50" cy="50" r="48" fill="url(#cherishSphere)" stroke="#18181b" strokeWidth="1.5" />

                    {/* Horizontal Seam */}
                    <line x1="2" y1="50" x2="98" y2="50" stroke="#18181b" strokeWidth="3" />

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
                    <circle cx="50" cy="50" r="12" fill="url(#cherishBtn)" stroke="#18181b" strokeWidth="1.2" />
                  </svg>
                </div>
                <span className="coin-back-text">ULTIMATE DEX</span>
                <span className="coin-back-subtext">TRACKER</span>
              </div>
              {/* Metallic Specular Glisten Sweep */}
              <div className="coin-shine-sweep" />
            </div>
          </div>

          {/* Dynamic Floor Shadow */}
          <div className="coin-floor-shadow" />
        </div>
      </motion.div>
    </motion.div>
  );
}
