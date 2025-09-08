import { Link } from "react-router-dom";
import { Sparkles, BarChart3, Filter, Users, Zap, Star, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import pokemonData from "../data/pokemon.json";
import "../css/PublicHome.css";

export default function PublicHome() {
  const [randomCards, setRandomCards] = useState([]);

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);
    
    // Generate 4-10 random cards with controlled positioning
    const cardCount = Math.floor(Math.random() * 5) + 4; // 4-8 cards
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

    // Predefined positions with maximum separation - only 8 positions
    const positions = [
      { top: 5, left: 5 },
      { top: 5, left: 95 },
      { top: 25, left: 25 },
      { top: 25, left: 75 },
      { top: 75, left: 25 },
      { top: 75, left: 75 },
      { top: 95, left: 5 },
      { top: 95, left: 95 }
    ];

    // Shuffle positions and take only what we need
    const shuffledPositions = [...positions].sort(() => Math.random() - 0.5);
    
    const cards = [];
    for (let i = 0; i < cardCount; i++) {
      // 95% chance for database Pokémon, 5% chance for local special forms
      const useLocalSprite = Math.random() < 0.05;
      
      if (useLocalSprite) {
        // Use local special form sprite
        const localSprite = localSprites[Math.floor(Math.random() * localSprites.length)];
        const isShiny = Math.random() < 0.3; // 30% chance for shiny
        const spriteName = isShiny ? `${localSprite}-shiny` : localSprite;
        
        cards.push({
          id: i,
          pokemon: { name: localSprite },
          spriteUrl: `/Sprites/${spriteName}.png`,
          color: accentColor,
          delay: Math.random() * 2,
          position: shuffledPositions[i]
        });
      } else {
        // Use database Pokémon
        const randomPokemon = allPokemon[Math.floor(Math.random() * allPokemon.length)];
        const isShiny = Math.random() < 0.3; // 30% chance for shiny
        const spriteUrl = isShiny ? randomPokemon.sprites.front_shiny : randomPokemon.sprites.front_default;
        
        cards.push({
          id: i,
          pokemon: randomPokemon,
          spriteUrl: spriteUrl,
          color: accentColor,
          delay: Math.random() * 2,
          position: shuffledPositions[i]
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
          <p className="hero-subtitle">Track your Pokémon collection across all games with ease. Build your perfect living dex and never lose track of your progress again.</p>
          
          {/* Creator Credit */}
          <div className="creator-credit">
            <span>Made by Antonic</span>
          </div>
          
          <div className="public-home-buttons">
            <Link to="/register" className="home-signup-btn primary-btn">
              <Zap className="btn-icon" />
              Get Started Free
            </Link>
            <Link to="/login" className="home-login-btn secondary-btn">
              <Users className="btn-icon" />
              Login
            </Link>
          </div>
          <div className="hero-navigation">
            <Link to="/trainers" className="trainers-nav-card group">
              <div className="nav-card-content">
                <div className="nav-card-icon">
                  <Users />
                </div>
                <div className="nav-card-text">
                  <span className="nav-card-title">Explore</span>
                  <span className="nav-card-subtitle">Trainer Profiles</span>
                </div>
              </div>
              <div className="nav-card-arrow">
                <ArrowRight />
              </div>
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="random-cards-container">
            {randomCards.map((card) => (
              <div
                key={card.id}
                className="random-card"
                style={{
                  background: card.color,
                  top: `${card.position.top}%`,
                  left: `${card.position.left}%`,
                  animationDelay: `${card.delay}s`
                }}
              >
                <img 
                  src={card.spriteUrl} 
                  alt={card.pokemon.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="features-header">
          <h2>Everything you need to master your collection</h2>
          <p>Powerful tools designed for serious Pokémon trainers</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <BarChart3 />
            </div>
            <h3>Track Progress</h3>
            <p>Track ball type, game caught, trainer info, and multiple forms for each Pokémon with visual progress bars.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Filter />
            </div>
            <h3>Smart Filters</h3>
            <p>Filter by type, generation, game, ball type, trainer, forms, and caught status with advanced search.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Users />
            </div>
            <h3>Share & Compare</h3>
            <p>Share your profile link and view other trainers' collections to compare progress worldwide.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Star />
            </div>
            <h3>Personalize</h3>
            <p>Customize themes, set favorites, and backup your data with your unique trainer identity.</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="cta-content">
          <h2>Ready to start tracking?</h2>
          <Link to="/register" className="cta-button">
            <Zap className="btn-icon" />
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
