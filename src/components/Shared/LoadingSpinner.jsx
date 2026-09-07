import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, X, Play } from 'lucide-react';
import './LoadingSpinner.css';

// List of available Poké Balls for random selection
const BALL_OPTIONS = [
  'poke-ball.png', 'great-ball.png', 'ultra-ball.png', 'master-ball.png',
  'premier-ball.png', 'luxury-ball.png', 'dive-ball.png', 'nest-ball.png',
  'net-ball.png', 'timer-ball.png', 'quick-ball.png', 'dusk-ball.png',
  'heal-ball.png', 'dream-ball.png', 'love-ball.png', 'moon-ball.png',
  'level-ball.png', 'lure-ball.png', 'friend-ball.png', 'heavy-ball.png',
  'fast-ball.png', 'sport-ball.png', 'safari-ball.png', 'beast-ball.png',
  'cherish-ball.png', 'repeat-ball.png'
];

// Module-level variable - selected once when the module loads, shared by ALL LoadingSpinner instances
// This ensures the same ball is shown even if multiple spinners mount/unmount during loading
const SELECTED_BALL = BALL_OPTIONS[Math.floor(Math.random() * BALL_OPTIONS.length)];

const LoadingSpinner = ({
  size = 'medium',
  variant = 'logo', // Changed default to 'logo' for a nicer look
  color = 'accent',
  text = '',
  progress = null, // Supports real numeric progress (0-100)
  fullScreen = false,
  overlay = false,
  isPreview = false
}) => {
  const sizeClass = `loading-${size}`;
  const variantClass = `loading-${variant}`;
  const colorClass = `loading-${color}`;

  // Check if preview mode is active via prop or URL query parameter (?previewLoading or ?preview=loading or path /loading-preview)
  const isPreviewMode = isPreview || (typeof window !== 'undefined' && (
    window.location.pathname === '/loading-preview' ||
    new URLSearchParams(window.location.search).has('previewLoading') ||
    new URLSearchParams(window.location.search).get('preview') === 'loading'
  ));

  const [currentBallIndex, setCurrentBallIndex] = useState(() => {
    return Math.max(0, BALL_OPTIONS.indexOf(SELECTED_BALL));
  });

  // Preview interactive progression simulation
  const [previewProgress, setPreviewProgress] = useState(15);
  const [previewStage, setPreviewStage] = useState("Initializing Pokédex database...");

  const runPreviewSequence = useCallback(() => {
    setPreviewProgress(0);
    setPreviewStage("Initializing Pokédex database...");

    const t1 = setTimeout(() => {
      setPreviewProgress(32);
      setPreviewStage("Checking trainer session...");
    }, 450);

    const t2 = setTimeout(() => {
      setPreviewProgress(68);
      setPreviewStage("Verifying credentials with server...");
    }, 1150);

    const t3 = setTimeout(() => {
      setPreviewProgress(88);
      setPreviewStage("Loading settings & preferences...");
    }, 1900);

    const t4 = setTimeout(() => {
      setPreviewProgress(100);
      setPreviewStage("Loading complete! Welcome back.");
    }, 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  useEffect(() => {
    if (isPreviewMode) {
      return runPreviewSequence();
    }
  }, [isPreviewMode, runPreviewSequence]);

  // Non-preview progressive loading simulation when no explicit progress is passed
  const [simulatedProgress, setSimulatedProgress] = useState(15);
  const [simulatedStage, setSimulatedStage] = useState(text || "Loading your Pokédex...");

  useEffect(() => {
    if (isPreviewMode || typeof progress === 'number') return;

    const t1 = setTimeout(() => {
      setSimulatedProgress(38);
      if (!text) setSimulatedStage("Verifying session data...");
    }, 400);

    const t2 = setTimeout(() => {
      setSimulatedProgress(70);
      if (!text) setSimulatedStage("Fetching Pokédex resources...");
    }, 950);

    const t3 = setTimeout(() => {
      setSimulatedProgress(92);
      if (!text) setSimulatedStage("Synchronizing collection...");
    }, 1700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isPreviewMode, progress, text]);

  const hideKofiStyle = (fullScreen || overlay || isPreviewMode) ? (
    <style>{`
      html body .floatingchat-container-wrap, 
      html body .floating-chat-kofi-popup-iframe {
        display: none !important;
      }
    `}</style>
  ) : null;

  // Use the module-level selected ball for consistency, or active ball when previewing
  const activeBall = isPreviewMode ? BALL_OPTIONS[currentBallIndex] : SELECTED_BALL;

  // Compute active numeric progress and label
  const activePercent = isPreviewMode
    ? previewProgress
    : (typeof progress === 'number' ? Math.min(100, Math.max(0, progress)) : simulatedProgress);

  const activeLabel = isPreviewMode
    ? previewStage
    : (text || (typeof progress === 'number' ? text : simulatedStage));

  // Ball-based loader component (shared between fullscreen and overlay)
  const BallLoader = ({ showText = true }) => (
    <div className="logo-loader">
      <div className="logo-ball-glow" aria-hidden="true" />
      <img
        src={`/data/balls/${activeBall}`}
        alt="Loading..."
        className="logo-bounce"
      />
      {showText && (
        <div className="logo-loader-text">
          <span className="logo-title">Ultimate Dex Tracker</span>
          <span className="logo-subtitle">{activeLabel}</span>
        </div>
      )}
      <div className="loading-bar-wrapper">
        <div
          className="loading-bar-track"
          role="progressbar"
          aria-valuenow={Math.round(activePercent)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="loading-bar-fill"
            style={{ width: `${Math.min(100, Math.max(0, activePercent))}%` }}
          />
        </div>
        <span className="loading-bar-percent">
          {Math.round(activePercent)}%
        </span>
      </div>
    </div>
  );

  if (fullScreen || isPreviewMode) {
    return (
      <>
        {hideKofiStyle}
        <div className="loading-fullscreen">
          {variant === 'logo' ? (
          <BallLoader />
        ) : (
          <>
            <div className={`loading-spinner ${sizeClass} ${variantClass} ${colorClass}`}>
              {variant === 'spinner' && <div className="spinner-ring"></div>}
              {variant === 'dots' && (
                <div className="dots-container">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              )}
              {variant === 'pulse' && <div className="pulse-circle"></div>}
              {variant === 'bars' && (
                <div className="bars-container">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
              )}
            </div>
            {text && <div className="loading-text">{text}</div>}
          </>
        )}

        {/* Hidden SEO content for AdSense/crawlers - visually hidden but in DOM */}
        <div
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: 0
          }}
          aria-hidden="true"
        >
          <h1>Ultimate Dex Tracker - Pokémon Living Dex Tracker</h1>
          <p>Track your Pokémon collection across all games with Ultimate Dex Tracker. Build your perfect living dex, track shinies, forms, and progress. Currently tracking 2064+ Pokémon including all regional forms, Gigantamax, Alpha, and shiny variants.</p>
          <h2>Features</h2>
          <ul>
            <li>Track Progress: Ball type, game caught, trainer info, hunt methods with visual progress bars</li>
            <li>Smart Filters: Filter by type, generation, game, ball, forms, caught status</li>
            <li>Shiny Tracking: Dedicated shiny forms support with hunt method tracking</li>
            <li>Share and Compare: Public profiles to compare with other trainers worldwide</li>
            <li>Cloud Sync: Data stored securely and accessible from any device</li>
            <li>Personalize: Custom themes, favorites, and backup options</li>
          </ul>
          <h2>Supported Pokémon Games</h2>
          <p>Pokémon Scarlet, Violet, Legends Arceus, Sword, Shield, Let's Go Pikachu, Let's Go Eevee, Sun, Moon, Ultra Sun, Ultra Moon, X, Y, Omega Ruby, Alpha Sapphire, Black, White, Black 2, White 2, Diamond, Pearl, Platinum, HeartGold, SoulSilver, Ruby, Sapphire, Emerald, FireRed, LeafGreen, Gold, Silver, Crystal, Red, Blue, Yellow</p>
          <p>Create a free account to start tracking your Pokémon collection today! Join thousands of trainers.</p>
          <nav>
            <a href="/register">Register</a>
            <a href="/login">Login</a>
            <a href="/trainers">Browse Trainers</a>
            <a href="/changelog">Changelog</a>
          </nav>
          <footer>
            <p>Made by Antonic | © 2024-2025 Ultimate Dex Tracker</p>
            <p>Pokémon and Pokémon character names are trademarks of Nintendo.</p>
          </footer>
        </div>

        {/* Interactive preview toolbar when testing loading screen */}
        {isPreviewMode && (
          <div className="loading-preview-toolbar">
            <div className="loading-preview-badge">
              <Sparkles size={14} /> Loading Screen Preview
            </div>
            <div className="loading-preview-controls">
              <button
                type="button"
                className="loading-preview-btn"
                title="Replay loading sequence"
                onClick={runPreviewSequence}
              >
                <Play size={12} />
                <span>Replay</span>
              </button>
              <button
                type="button"
                className="loading-preview-btn"
                title="Cycle through Pokéball designs"
                onClick={() => setCurrentBallIndex((prev) => (prev + 1) % BALL_OPTIONS.length)}
              >
                <RefreshCw size={12} />
                <span>Ball: {BALL_OPTIONS[currentBallIndex].replace('.png', '').replace(/-/g, ' ')}</span>
              </button>
              <button
                type="button"
                className="loading-preview-btn exit"
                title="Exit preview mode"
                onClick={() => {
                  if (window.location.pathname === '/loading-preview') {
                    window.location.href = '/';
                  } else {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('previewLoading');
                    url.searchParams.delete('preview');
                    window.location.href = url.pathname + (url.search ? url.search : '');
                  }
                }}
              >
                <X size={12} />
                <span>Exit Preview</span>
              </button>
            </div>
          </div>
        )}
      </div>
      </>
    );
  }

  if (overlay) {
    return (
      <>
        {hideKofiStyle}
        <div className="loading-overlay">
          {variant === 'logo' ? (
          <BallLoader showText={false} />
        ) : (
          <>
            <div className={`loading-spinner ${sizeClass} ${variantClass} ${colorClass}`}>
              {variant === 'spinner' && <div className="spinner-ring"></div>}
              {variant === 'dots' && (
                <div className="dots-container">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              )}
              {variant === 'pulse' && <div className="pulse-circle"></div>}
              {variant === 'bars' && (
                <div className="bars-container">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
              )}
            </div>
            {text && <div className="loading-text">{text}</div>}
          </>
        )}
      </div>
      </>
    );
  }

  // Inline/small spinner - use simple variants
  return (
    <div className={`loading-spinner ${sizeClass} ${variantClass} ${colorClass}`}>
      {variant === 'spinner' && <div className="spinner-ring"></div>}
      {variant === 'logo' && <div className="spinner-ring"></div>}
      {variant === 'dots' && (
        <div className="dots-container">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      )}
      {variant === 'pulse' && <div className="pulse-circle"></div>}
      {variant === 'bars' && (
        <div className="bars-container">
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
      )}
      {text && <div className="loading-text">{text}</div>}
    </div>
  );
};

export default LoadingSpinner;
