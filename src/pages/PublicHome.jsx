import { Link } from "react-router-dom";
import { Sparkles, Users, SquarePen, Star, ArrowRight, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import pokemonData from "../data/pokemon.json";
import formsData from "../utils/loadFormsData";
import "../css/PublicHome.css";

export default function PublicHome() {
  const [totalCaught, setTotalCaught] = useState(null);
  const [displayCount, setDisplayCount] = useState(0);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${API_BASE}/api/profiles/stats/total-caught`)
      .then(r => r.json())
      .then(data => {
        if (typeof data.total === 'number') {
          setTotalCaught(data.total);
        }
      })
      .catch(() => {/* silently fail */});
  }, []);

  // Animate count-up when totalCaught arrives
  useEffect(() => {
    if (totalCaught === null) return;
    const duration = 1400;
    const start = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayCount(Math.floor(easeOut(progress) * totalCaught));
      if (progress < 1) animFrameRef.current = requestAnimationFrame(step);
    };
    animFrameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [totalCaught]);

  const features = [
    {
      title: "Track Every Detail",
      description: "Log specific details for each Pokémon including date caught, Poké Ball, origin game, hunt method, marks, and ribbons.",
      image: "/data/public_home_images/track_progress.png",
    },
    {
      title: "Smart Filters",
      description: "Filter by type, generation, game, ball type, forms, and caught status with advanced search.",
      image: "/data/public_home_images/smart_filters.png",
    },
    {
      title: "Share & Compare",
      description: "Share your profile link and view other trainers' collections to compare progress worldwide.",
      image: "/data/public_home_images/share_and_compare.png",
    },
    {
      title: "Personalize",
      description: "Customize themes, set favorites, and backup your data with your unique trainer identity.",
      image: "/data/public_home_images/personalize.png",
    },
  ];

  const [activeFeature, setActiveFeature] = useState(0);
  const [featurePaused, setFeaturePaused] = useState(false);
  const [featureTransitioning, setFeatureTransitioning] = useState(false);

  const goToFeature = (index) => {
    if (featureTransitioning) return;
    setFeatureTransitioning(true);
    setTimeout(() => {
      setActiveFeature(typeof index === 'function' ? index(activeFeature) : index);
      setFeatureTransitioning(false);
    }, 250);
  };

  useEffect(() => {
    if (featurePaused) return;
    const id = setInterval(() => {
      setFeatureTransitioning(true);
      setTimeout(() => {
        setActiveFeature(prev => (prev + 1) % features.length);
        setFeatureTransitioning(false);
      }, 250);
    }, 7000);
    return () => clearInterval(id);
  }, [featurePaused]);

  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    if (!lightboxSrc) return;
    const handler = (e) => { if (e.key === 'Escape') setLightboxSrc(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxSrc]);

  // Pre-define card positions to prevent CLS - these are fixed and known at render time
  const cardPositions = [
    { top: 10, left: 20, size: 'large', rotation: -8 },
    { top: 25, left: 70, size: 'medium', rotation: 12 },
    { top: 45, left: 5, size: 'small', rotation: -15 },
    { top: 60, left: 80, size: 'large', rotation: 6 },
    { top: 85, left: 35, size: 'medium', rotation: -10 }
  ];

  // Initialize with placeholder cards to prevent CLS
  const [randomCards, setRandomCards] = useState(() => {
    return cardPositions.map((position, i) => ({
      id: i,
      pokemon: { name: 'loading' },
      spriteUrl: '/Sprites/pikachu.png', // Default sprite that's likely cached
      color: 'var(--accent)',
      delay: i * 0.1,
      position
    }));
  });

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);

    // Use the full Pokémon database
    const allPokemon = pokemonData;

    // Local special forms sprites
    const localSprites = [
      'flabebe-blue', 'flabebe-orange', 'flabebe-red', 'flabebe-white', 'flabebe-yellow',
      'floette-blue', 'floette-orange', 'floette-red', 'floette-white', 'floette-yellow', 'floette-eternal',
      'florges-blue', 'florges-orange', 'florges-red', 'florges-white', 'florges-yellow',
      'furfrou-dandy', 'furfrou-debutante', 'furfrou-diamond', 'furfrou-heart', 'furfrou-kabuki', 'furfrou-lareine', 'furfrou-matron', 'furfrou-pharaoh', 'furfrou-star',
      'gourgeist-average', 'gourgeist-large', 'gourgeist-small', 'gourgeist-super',
      'lycanroc-dusk', 'lycanroc-midnight',
      'maushold-family-of-three',
      'minior-blue', 'minior-green', 'minior-indigo', 'minior-orange', 'minior-red', 'minior-violet', 'minior-yellow',
      'oricorio-baile', 'oricorio-pau', 'oricorio-pom-pom', 'oricorio-sensu',
      'partner-cap-pikachu',
      'pumpkaboo-average', 'pumpkaboo-large', 'pumpkaboo-small', 'pumpkaboo-super',
      'sqwuawkabilly-blue', 'sqwuawkabilly-green', 'sqwuawkabilly-white', 'sqwuawkabilly-yellow',
      'tatsugiri-curly', 'tatsugiri-droopy', 'tatsugiri-stretchy',
      'toxtricity-lowkey',
      'vivillon-archipelago', 'vivillon-continental', 'vivillon-elegant', 'vivillon-fancy', 'vivillon-garden', 'vivillon-high-plains', 'vivillon-icy-snow', 'vivillon-jungle', 'vivillon-marine', 'vivillon-meadow', 'vivillon-modern', 'vivillon-monsoon', 'vivillon-ocean', 'vivillon-pokeball', 'vivillon-polar', 'vivillon-river', 'vivillon-sandstorm', 'vivillon-savanna', 'vivillon-sun', 'vivillon-tundra',
      'zygarde-10'
    ];
    // Use site accent color for all cards
    const accentColor = 'var(--accent)';

    const cards = [];
    for (let i = 0; i < cardPositions.length; i++) {
      // 90% chance for database Pokémon, 10% chance for local special forms
      const useLocalSprite = Math.random() < 0.1;
      const isShiny = Math.random() < 0.5;

      if (useLocalSprite) {
        // Use local special form sprite
        const localSprite = localSprites[Math.floor(Math.random() * localSprites.length)];
        const spriteName = isShiny ? `${localSprite}-shiny` : localSprite;

        cards.push({
          id: i,
          pokemon: { name: localSprite },
          spriteUrl: `/Sprites/${spriteName}.png`,
          color: accentColor,
          delay: i * 0.1,
          position: cardPositions[i]
        });
      } else {
        // Use database Pokémon
        const randomPokemon = allPokemon[Math.floor(Math.random() * allPokemon.length)];
        const spriteUrl = isShiny && randomPokemon.sprites.front_shiny
          ? randomPokemon.sprites.front_shiny
          : randomPokemon.sprites.front_default;

        cards.push({
          id: i,
          pokemon: randomPokemon,
          spriteUrl: spriteUrl,
          color: accentColor,
          delay: i * 0.1,
          position: cardPositions[i]
        });
      }
    }
    setRandomCards(cards);
  }, []);

  return (
    <div className="public-home page-container">
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles className="sparkle-icon" />
            <span>Ultimate Pokémon Collection Tracker</span>
          </div>
          <h1>Welcome to Ultimate Dex Tracker!</h1>
          <p className="hero-subtitle">The ultimate tracker for Living Dexes, shiny hunting, marks, forms, Poké Balls, and collection completion.</p>

          <p className="tracking-count">
            Track {(pokemonData.length + formsData.length).toLocaleString()} Pokémon Forms &amp; Variants
          </p>

          {totalCaught !== null && (
            <div className="live-caught-stat">
              <div className="live-caught-inner">
                <div className="live-dot-wrapper">
                  <span className="live-dot" />
                </div>
                <Globe className="live-globe-icon" />
                <span className="live-caught-number">{displayCount.toLocaleString()}</span>
                <span className="live-caught-label">Pokémon tracked worldwide</span>
              </div>
            </div>
          )}

          {/* Creator Credit */}
          <div className="creator-credit">
            <span>
              Created by Pokémon collector &amp; content creator{" "}
              <a href="https://solo.to/antonic" target="_blank" rel="noopener noreferrer">
                Antonic
              </a>
            </span>
          </div>

          <div className="public-home-buttons">
            <Link to="/register" className="home-signup-btn primary-btn">
              <SquarePen className="btn-icon" />
              Get Started Free
            </Link>
            <Link to="/login" className="home-login-btn secondary-btn">
              <Users className="btn-icon" />
              Login
            </Link>
            <Link to="/trainers" className="home-trainers-btn secondary-btn">
              <ArrowRight className="btn-icon" />
              Explore Trainers
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="random-cards-container">
            {randomCards.map((card) => {
              // Get image dimensions based on card size
              const sizeMap = { large: 96, medium: 80, small: 64 };
              const imgSize = sizeMap[card.position.size] || 80;

              return (
                <div
                  key={card.id}
                  className={`random-card ${card.position.size}`}
                  style={{
                    background: card.color,
                    top: `${card.position.top}%`,
                    left: `${card.position.left}%`,
                    animationDelay: `${card.delay}s`,
                    '--rotation': `${card.position.rotation}deg`
                  }}
                >
                  <img
                    src={card.spriteUrl}
                    alt={card.pokemon.name}
                    width={imgSize}
                    height={imgSize}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="features-section"
        onMouseEnter={() => setFeaturePaused(true)}
        onMouseLeave={() => setFeaturePaused(false)}
      >
        <div className="features-header">
          <h2>Everything you need to master your collection</h2>
          <p>Powerful tools designed for serious Pokémon trainers</p>
        </div>

        <div className="feature-carousel">
          <button
            className="feature-carousel-arrow left"
            onClick={() => goToFeature((activeFeature - 1 + features.length) % features.length)}
            aria-label="Previous feature"
          >
            <ChevronLeft size={22} />
          </button>

          <div className={`feature-slide ${featureTransitioning ? 'fading' : 'visible'}`}>
            <div
              className="feature-slide-image"
              onClick={() => setLightboxSrc(features[activeFeature].image)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setLightboxSrc(features[activeFeature].image)}
              aria-label={`View ${features[activeFeature].title} full screen`}
            >
              <img
                src={features[activeFeature].image}
                alt={features[activeFeature].title}
                draggable={false}
              />
            </div>
            <div className="feature-slide-text">
              <h3>{features[activeFeature].title}</h3>
              <p>{features[activeFeature].description}</p>
            </div>
          </div>

          <button
            className="feature-carousel-arrow right"
            onClick={() => goToFeature((activeFeature + 1) % features.length)}
            aria-label="Next feature"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        <div className="feature-dots">
          {features.map((_, i) => (
            <button
              key={i}
              className={`feature-dot ${i === activeFeature ? 'active' : ''}`}
              onClick={() => goToFeature(i)}
              aria-label={`Go to feature ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && createPortal(
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxSrc(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Full screen image"
        >
          <button
            className="lightbox-close"
            onClick={() => setLightboxSrc(null)}
            aria-label="Close"
          >
            ✕
          </button>
          <img
            src={lightboxSrc}
            alt="Feature screenshot"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}

      <div className="cta-section">
        <div className="cta-content">
          <h2>Ready to start tracking?</h2>
          <Link to="/register" className="cta-button">
            <SquarePen className="btn-icon" />
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
