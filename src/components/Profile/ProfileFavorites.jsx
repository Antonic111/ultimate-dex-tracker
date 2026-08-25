import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Gamepad2, 
  User, 
  CircleDot, 
  PencilLine, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause,
  Layers,
  Plus
} from "lucide-react";
import { FAVORITE_GAME_OPTIONS, BALL_OPTIONS, TRAINER_OPTIONS } from "../../Constants";
import { formatPokemonName } from "../../utils";
import { Tooltip } from "../Shared/Tooltip";
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

  // Auto-cycle loop using requestAnimationFrame for flawless frame-accurate sync
  useEffect(() => {
    if (isPaused || isHovered) return;

    let lastTime = performance.now();
    let animId;

    const loop = (currentTime) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      setProgress((prev) => {
        const next = prev + (delta / DURATION) * 100;
        if (next >= 100) {
          setActiveRank((r) => (r + 1) % 5);
          return 0;
        }
        return next;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, isHovered]);

  const handlePrev = () => {
    setProgress(0);
    setActiveRank((prev) => (prev === 0 ? 4 : prev - 1));
  };

  const handleNext = () => {
    setProgress(0);
    setActiveRank((prev) => (prev + 1) % 5);
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

  const hasAnyFavorites =
    (form.favoritePokemon && form.favoritePokemon.some(Boolean)) ||
    (form.favoriteGames && form.favoriteGames.some(Boolean)) ||
    (form.favoriteBalls && form.favoriteBalls.some(Boolean)) ||
    (form.favoriteTrainers && form.favoriteTrainers.some(Boolean));

  // If visitor view and no favorites are set at all, don't show empty widget
  if (!isOwner && !hasAnyFavorites) {
    return null;
  }

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

      {/* 2x2 Showcase Grid */}
      <div className="favorites-2x2-grid">
        
        {/* ── CARD 1: FAVORITE POKÉMON ── */}
        <div 
          className={`favorite-box-card ${isOwner && isEditing ? 'is-editable' : ''}`}
          onClick={() => { if (isOwner && isEditing) openPokemonModal?.(activeRank); }}
          title={isOwner && isEditing ? "Click to edit Favorite Pokémon" : undefined}
        >
          {/* Header */}
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

          {/* Showcase Body */}
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

        {/* ── CARD 2: FAVORITE GAMES ── */}
        <div 
          className={`favorite-box-card ${isOwner && isEditing ? 'is-editable' : ''}`}
          onClick={() => { if (isOwner && isEditing) openGameModal?.(activeRank); }}
          title={isOwner && isEditing ? "Click to edit Favorite Games" : undefined}
        >
          {/* Header */}
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

          {/* Showcase Body */}
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

        {/* ── CARD 3: FAVORITE BALLS ── */}
        <div 
          className={`favorite-box-card ${isOwner && isEditing ? 'is-editable' : ''}`}
          onClick={() => { if (isOwner && isEditing) openBallModal?.(activeRank); }}
          title={isOwner && isEditing ? "Click to edit Favorite Pokéballs" : undefined}
        >
          {/* Header */}
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

          {/* Showcase Body */}
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
                  {isOwner && isEditing ? <Plus size={20} /> : <CircleDot size={18} />}
                </div>
                <span className="favorite-empty-label">
                  {isOwner && isEditing ? `Set #${activeRank + 1} Ball` : `Empty #${activeRank + 1}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── CARD 4: FAVORITE TRAINERS ── */}
        <div 
          className={`favorite-box-card ${isOwner && isEditing ? 'is-editable' : ''}`}
          onClick={() => { if (isOwner && isEditing) openTrainerModal?.(activeRank); }}
          title={isOwner && isEditing ? "Click to edit Favorite Trainers" : undefined}
        >
          {/* Header */}
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

          {/* Showcase Body */}
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

      </div>

      {/* ── SYNCHRONIZED CYCLING CONTROL BAR (BOTTOM) ── */}
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

        {/* Right: 5 Interactive Rank Steps (#1, #2, #3, #4, #5) */}
        <div className="favorites-sync-right favorites-sync-steps">
          {Array.from({ length: 5 }).map((_, index) => {
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
    </div>
  );
}
