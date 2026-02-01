import React from 'react';
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
  fullScreen = false,
  overlay = false
}) => {
  const sizeClass = `loading-${size}`;
  const variantClass = `loading-${variant}`;
  const colorClass = `loading-${color}`;

  // Use the module-level selected ball for consistency across all instances
  const randomBall = SELECTED_BALL;

  // Ball-based loader component (shared between fullscreen and overlay)
  const BallLoader = ({ showText = true }) => (
    <div className="logo-loader">
      <img
        src={`/data/balls/${randomBall}`}
        alt="Loading..."
        className="logo-bounce"
      />
      {showText && (
        <div className="logo-loader-text">
          <span className="logo-title">Ultimate Dex Tracker</span>
          <span className="logo-subtitle">{text || "Loading your Pokédex..."}</span>
        </div>
      )}
      <div className="loading-dots-row">
        <span className="loading-dot"></span>
        <span className="loading-dot"></span>
        <span className="loading-dot"></span>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
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
      </div>
    );
  }

  if (overlay) {
    return (
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
