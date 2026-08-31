import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Gamepad2, 
  User, 
  PencilLine, 
  ChevronLeft, 
  ChevronRight, 
  Plus
} from "lucide-react";
import { FAVORITE_GAME_OPTIONS, BALL_OPTIONS, TRAINER_OPTIONS } from "../../Constants";
import { formatPokemonName } from "../../utils";
import { Tooltip } from "../Shared/Tooltip";
import { PokeballIcon } from "../Shared/SearchBar";
import "../../css/ProfileFavorites.css";

const TROPHY_CONFIG = [
  { label: "#1", className: "trophy-rank-1", icon: <Trophy size={13} className="text-yellow-400" /> },
  { label: "#2", className: "trophy-rank-2", icon: <Trophy size={13} className="text-slate-300" /> },
  { label: "#3", className: "trophy-rank-3", icon: <Trophy size={13} className="text-amber-600" /> },
  { label: "#4", className: "trophy-rank-4", icon: <Trophy size={13} className="text-indigo-400" /> },
  { label: "#5", className: "trophy-rank-5", icon: <Trophy size={13} className="text-purple-400" /> }
];

export default function ProfileFavorites({
  isOwner,
  isEditing,
  form,
  isPremium = false,
  useHomeSprites = false,
  POKEMON_OPTIONS = [],
  openGameModal,
  openPokemonModal,
  openBallModal,
  openTrainerModal
}) {
  const [activeRank, setActiveRank] = useState(0); // 0 to 4
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100

  const DURATION = 6000; // 6 seconds

  const hasAnyPokemon = Boolean(form.favoritePokemon && form.favoritePokemon.some(Boolean));
  const hasAnyGames = Boolean(form.favoriteGames && form.favoriteGames.some(Boolean));
  const hasAnyBalls = Boolean(form.favoriteBalls && form.favoriteBalls.some(Boolean));
  const hasAnyTrainers = Boolean(form.favoriteTrainers && form.favoriteTrainers.some(Boolean));

  const hasAnyFavorites = hasAnyPokemon || hasAnyGames || hasAnyBalls || hasAnyTrainers;

  // Maximum rank index with data (0 to 4)
  const maxRankWithData = useMemo(() => {
    let max = -1;
    for (let i = 0; i < 5; i++) {
      if (
        form.favoritePokemon?.[i] ||
        form.favoriteGames?.[i] ||
        form.favoriteBalls?.[i] ||
        form.favoriteTrainers?.[i]
      ) {
        max = i;
      }
    }
    return max;
  }, [form.favoritePokemon, form.favoriteGames, form.favoriteBalls, form.favoriteTrainers]);

  const numRanks = isEditing ? 5 : Math.max(1, maxRankWithData + 1);

  // Auto-cycle loop using requestAnimationFrame for flawless frame-accurate sync
  useEffect(() => {
    if (isPaused || isHovered || (!isEditing && numRanks <= 1)) return;

    let lastTime = performance.now();
    let animId;

    const loop = (currentTime) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      setProgress((prev) => {
        const next = prev + (delta / DURATION) * 100;
        if (next >= 100) {
          setActiveRank((r) => (r + 1) % numRanks);
          return 0;
        }
        return next;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, isHovered, isEditing, numRanks]);

  const handlePrev = () => {
    setProgress(0);
    setActiveRank((prev) => (prev === 0 ? numRanks - 1 : prev - 1));
  };

  const handleNext = () => {
    setProgress(0);
    setActiveRank((prev) => (prev + 1) % numRanks);
  };

  const handleSelectRank = (index) => {
    setProgress(0);
    setActiveRank(index);
  };

  // 1. Current Pokémon Data
  const pokeValue = form.favoritePokemon?.[activeRank];
  const isShiny = Boolean(form.favoritePokemonShiny?.[activeRank]);
  const pokeData = POKEMON_OPTIONS.find(
    (p) => p.value === pokeValue || (p.stableId && p.stableId === pokeValue) || p.name === pokeValue || (p.baseName && p.baseName === pokeValue)
  );
  const hasPokemon = Boolean(pokeValue && pokeData);
  const pokeTooltip = pokeData
    ? `${isShiny ? "Shiny " : ""}${pokeData.baseName ? formatPokemonName(pokeData.baseName) : pokeData.name}${pokeData.formLabel ? ` (${pokeData.formLabel})` : ""}`
    : "";

  // 2. Current Game Data
  const gameValue = form.favoriteGames?.[activeRank];
  const gameData = FAVORITE_GAME_OPTIONS.find((g) => g.value === gameValue);
  const hasGame = Boolean(gameValue && gameData);
  const gameTooltip = gameData?.name || "";

  // 3. Current Ball Data
  const ballValue = form.favoriteBalls?.[activeRank];
  const ballData = BALL_OPTIONS.find((b) => b.value === ballValue);
  const hasBall = Boolean(ballValue && ballData);
  const ballTooltip = ballData?.name || "";

  // 4. Current Trainer Data
  const trainerValue = form.favoriteTrainers?.[activeRank];
  const trainerData = TRAINER_OPTIONS.find((t) => t.value === trainerValue);
  const hasTrainer = Boolean(trainerValue && trainerData);
  const trainerTooltip = trainerData?.name || "";

  // Active Trophy configuration
  const currentTrophy = TROPHY_CONFIG[activeRank] || TROPHY_CONFIG[0];

  // If viewing mode and no favorites are set at all, don't show empty widget
  if (!isEditing && !hasAnyFavorites) {
    return null;
  }

  const showPokemonCard = isEditing || hasAnyPokemon;
  const showGamesCard = isEditing || hasAnyGames;
  const showBallsCard = isEditing || hasAnyBalls;
  const showTrainersCard = isEditing || hasAnyTrainers;

  const rawCats = (Array.isArray(form.favoriteCategoryOrder) && form.favoriteCategoryOrder.length > 0)
    ? form.favoriteCategoryOrder
    : ['pokemon', 'games', 'balls', 'trainers'];
  const visibleCategoryList = isPremium ? rawCats : rawCats.slice(0, 2);

  return (
    <div 
      className="profile-favorites-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="profile-favorites-section-header">
        <h3 className="profile-section-title">
          <Trophy size={18} /> FAVORITES
        </h3>
      </div>

      {/* Showcase Grid */}
      <div className="favorites-2x2-grid">
        {visibleCategoryList.map((catKey) => {
          if (catKey === 'pokemon' && showPokemonCard) {
            return (
              <div 
                key="pokemon"
                className={`favorite-box-card ${isOwner && isEditing ? 'is-editable' : ''}`}
                onClick={() => { if (isOwner && isEditing) openPokemonModal?.(activeRank); }}
                title={isOwner && isEditing ? "Click to edit Favorite Pokémon" : undefined}
              >
                <div className="favorite-card-header">
                  <span className="favorite-card-title">Favorite Pokémon</span>
                  <div className="favorite-header-right">
                    {isOwner && isEditing && (
                      <span className="favorite-edit-badge">
                        <PencilLine size={11} /> Edit
                      </span>
                    )}
                    <div key={activeRank} className={`favorite-trophy-badge ${currentTrophy.className} favorite-trophy-animate`}>
                      {currentTrophy.icon}
                      <span>#{activeRank + 1}</span>
                    </div>
                  </div>
                </div>
                <div className="favorite-showcase-body">
                  {hasPokemon ? (
                    <Tooltip content={pokeTooltip} position="top">
                      <div key={activeRank} className="favorite-content-fill favorite-swap-animate">
                        <div className="favorite-artwork-center">
                          <div className="favorite-pedestal">
                            <div className="favorite-artwork-box">
                              <img
                                src={isShiny ? (pokeData.shinyImage || pokeData.image) : pokeData.image}
                                alt={pokeData.name}
                                className={`favorite-artwork-img ${!useHomeSprites ? 'pixelated' : ''}`}
                                loading="lazy"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tooltip>
                  ) : (
                    <div key={activeRank} className="favorite-empty-slot favorite-swap-animate">
                      <div className="favorite-empty-circle">
                        {isOwner && isEditing ? <Plus size={20} /> : <Sparkles size={18} />}
                      </div>
                      <span className="favorite-empty-label">
                        {isOwner && isEditing ? `Set #${activeRank + 1} Pokémon` : `Empty #${activeRank + 1}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (catKey === 'games' && showGamesCard) {
            return (
              <div 
                key="games"
                className={`favorite-box-card ${isOwner && isEditing ? 'is-editable' : ''}`}
                onClick={() => { if (isOwner && isEditing) openGameModal?.(activeRank); }}
                title={isOwner && isEditing ? "Click to edit Favorite Games" : undefined}
              >
                <div className="favorite-card-header">
                  <span className="favorite-card-title">Favorite Games</span>
                  <div className="favorite-header-right">
                    {isOwner && isEditing && (
                      <span className="favorite-edit-badge">
                        <PencilLine size={11} /> Edit
                      </span>
                    )}
                    <div key={activeRank} className={`favorite-trophy-badge ${currentTrophy.className} favorite-trophy-animate`}>
                      {currentTrophy.icon}
                      <span>#{activeRank + 1}</span>
                    </div>
                  </div>
                </div>
                <div className="favorite-showcase-body">
                  {hasGame ? (
                    <Tooltip content={gameTooltip} position="top">
                      <div key={activeRank} className="favorite-content-fill favorite-swap-animate">
                        <div className="favorite-artwork-center">
                          <div className="favorite-pedestal">
                            <div className="favorite-artwork-box game-logo-box">
                              <img
                                src={gameData.image}
                                alt={gameData.name}
                                className="favorite-artwork-img game-logo-img"
                                loading="lazy"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tooltip>
                  ) : (
                    <div key={activeRank} className="favorite-empty-slot favorite-swap-animate">
                      <div className="favorite-empty-circle">
                        {isOwner && isEditing ? <Plus size={20} /> : <Gamepad2 size={18} />}
                      </div>
                      <span className="favorite-empty-label">
                        {isOwner && isEditing ? `Set #${activeRank + 1} Game` : `Empty #${activeRank + 1}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (catKey === 'balls' && showBallsCard) {
            return (
              <div 
                key="balls"
                className={`favorite-box-card ${isOwner && isEditing ? 'is-editable' : ''}`}
                onClick={() => { if (isOwner && isEditing) openBallModal?.(activeRank); }}
                title={isOwner && isEditing ? "Click to edit Favorite Pokéballs" : undefined}
              >
                <div className="favorite-card-header">
                  <span className="favorite-card-title">Favorite Balls</span>
                  <div className="favorite-header-right">
                    {isOwner && isEditing && (
                      <span className="favorite-edit-badge">
                        <PencilLine size={11} /> Edit
                      </span>
                    )}
                    <div key={activeRank} className={`favorite-trophy-badge ${currentTrophy.className} favorite-trophy-animate`}>
                      {currentTrophy.icon}
                      <span>#{activeRank + 1}</span>
                    </div>
                  </div>
                </div>
                <div className="favorite-showcase-body">
                  {hasBall ? (
                    <Tooltip content={ballTooltip} position="top">
                      <div key={activeRank} className="favorite-content-fill favorite-swap-animate">
                        <div className="favorite-artwork-center">
                          <div className="favorite-pedestal">
                            <div className="favorite-artwork-box">
                              <img
                                src={ballData.image}
                                alt={ballData.name}
                                className="favorite-artwork-img"
                                loading="lazy"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tooltip>
                  ) : (
                    <div key={activeRank} className="favorite-empty-slot favorite-swap-animate">
                      <div className="favorite-empty-circle">
                        {isOwner && isEditing ? <Plus size={20} /> : <PokeballIcon size={18} color="currentColor" />}
                      </div>
                      <span className="favorite-empty-label">
                        {isOwner && isEditing ? `Set #${activeRank + 1} Ball` : `Empty #${activeRank + 1}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (catKey === 'trainers' && showTrainersCard) {
            return (
              <div 
                key="trainers"
                className={`favorite-box-card ${isOwner && isEditing ? 'is-editable' : ''}`}
                onClick={() => { if (isOwner && isEditing) openTrainerModal?.(activeRank); }}
                title={isOwner && isEditing ? "Click to edit Favorite Trainers" : undefined}
              >
                <div className="favorite-card-header">
                  <span className="favorite-card-title">Favorite Trainers</span>
                  <div className="favorite-header-right">
                    {isOwner && isEditing && (
                      <span className="favorite-edit-badge">
                        <PencilLine size={11} /> Edit
                      </span>
                    )}
                    <div key={activeRank} className={`favorite-trophy-badge ${currentTrophy.className} favorite-trophy-animate`}>
                      {currentTrophy.icon}
                      <span>#{activeRank + 1}</span>
                    </div>
                  </div>
                </div>
                <div className="favorite-showcase-body">
                  {hasTrainer ? (
                    <Tooltip content={trainerTooltip} position="top">
                      <div key={activeRank} className="favorite-content-fill favorite-swap-animate">
                        <div className="favorite-artwork-center">
                          <div className="favorite-pedestal">
                            <div className="favorite-artwork-box">
                              <img
                                src={trainerData.image}
                                alt={trainerData.name}
                                className="favorite-artwork-img trainer-sprite-img"
                                loading="lazy"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tooltip>
                  ) : (
                    <div key={activeRank} className="favorite-empty-slot favorite-swap-animate">
                      <div className="favorite-empty-circle">
                        {isOwner && isEditing ? <Plus size={20} /> : <User size={18} />}
                      </div>
                      <span className="favorite-empty-label">
                        {isOwner && isEditing ? `Set #${activeRank + 1} Trainer` : `Empty #${activeRank + 1}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* ── SYNCHRONIZED CYCLING CONTROL BAR (BOTTOM) ── */}
      {(isEditing || numRanks > 1) && (
        <div className="favorites-sync-bar">
          {/* Left: Prev / Progress Bar (or Paused button) / Next */}
          <div className="favorites-sync-left">
            <button
              type="button"
              className="favorites-control-btn"
              onClick={handlePrev}
              title="Previous Rank"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              className={`favorites-timer-pill ${isPaused ? 'is-paused' : ''}`}
              onClick={() => setIsPaused((prev) => !prev)}
              title={isPaused ? "Click to resume auto-cycling" : "Auto-cycling: click to pause"}
            >
              {isPaused ? (
                <span className="favorites-paused-label">Paused</span>
              ) : (
                <div className="favorites-progress-track">
                  <div 
                    className="favorites-progress-fill" 
                    style={{ transform: `scaleX(${progress / 100})` }} 
                  />
                </div>
              )}
            </button>

            <button
              type="button"
              className="favorites-control-btn"
              onClick={handleNext}
              title="Next Rank"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Right: Interactive Rank Steps */}
          <div className="favorites-sync-right favorites-sync-steps">
            {Array.from({ length: numRanks }).map((_, index) => {
              const isActive = activeRank === index;
              return (
                <button
                  key={index}
                  type="button"
                  className={`favorites-step-pill ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectRank(index)}
                  title={`Jump to #${index + 1}`}
                >
                  <span>#{index + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
