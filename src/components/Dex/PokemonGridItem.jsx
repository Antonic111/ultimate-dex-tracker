import React, { memo } from "react";
import { Info, Lock } from "lucide-react";
import { formatPokemonName } from "../../utils";

function formatDexNumber(num) {
  if (!num) return "????";
  return `#${String(num).padStart(4, "0")}`;
}

function PokemonGridItem({
  poke,
  isCaught,
  hasFail = false,
  isBlocked,
  sprite,
  readOnly,
  displayName,
  dexNumber,
  priorityLoad = false,
  onSelect,
  onToggleCaught,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleTouchCancel,
}) {
  const cardBackground = isCaught
    ? "linear-gradient(to top, rgba(21, 128, 61, 0.4), rgba(34, 197, 94, 0.2))"
    : (hasFail
        ? "linear-gradient(to top, rgba(220, 38, 38, 0.35), rgba(239, 68, 68, 0.2))"
        : "var(--searchbar-inputs)");

  const cardBorder = poke?._isSearchMatch
    ? "2px solid var(--accent)"
    : (isCaught
        ? "2px solid rgb(34, 197, 94)"
        : (hasFail
            ? "2px solid rgb(239, 68, 68)"
            : "2px solid var(--border-color)"));

  return (
    <div
      data-tutorial-id="pokemon-card"
      className={`group relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-100 pokemon-slot-hover${readOnly ? " hover:bg-gray-700 dark:hover:bg-gray-600" : ""}${isBlocked ? " cursor-not-allowed" : " cursor-pointer"}${poke?._isSearchMatch ? " search-match-highlight" : ""}`}
      style={{
        background: cardBackground,
        border: cardBorder,
        width: "clamp(60px, 15vw, 100px)",
        height: "clamp(60px, 15vw, 100px)",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "manipulation",
        opacity: isBlocked ? 0.5 : 1,
        position: "relative",
        zIndex: poke?._isSearchMatch ? 5 : 1,
      }}
      data-caught={isCaught}
      data-fail={!isCaught && hasFail}
      data-readonly={readOnly}
      data-blocked={isBlocked}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        if (isBlocked) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        // On mobile, touch handlers manage behavior; prevent duplicate click
        if (typeof window !== "undefined" && window.innerWidth <= 768) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (readOnly && onSelect) {
          onSelect(poke);
        } else if (!readOnly && onToggleCaught) {
          onToggleCaught(poke);
        }
      }}
      onTouchStart={(e) => {
        if (isBlocked) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        handleTouchStart(e, poke);
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={(e) => {
        e.preventDefault();
        if (isBlocked) return;
        handleTouchEnd(poke, readOnly);
      }}
      onTouchCancel={handleTouchCancel}
      title={isBlocked ? `${formatPokemonName(poke.name)} (Locked)` : formatPokemonName(poke.name)}
    >
      {isBlocked && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center z-10"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        >
          <Lock size={24} style={{ color: "white", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))" }} />
        </div>
      )}

      {!readOnly && onSelect && !isBlocked && (
        <button
          data-tutorial-id={poke.id === 1 ? "info-button" : undefined}
          className="absolute bottom-0.5 right-0.5 p-0.25 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 z-20 hidden md:block"
          style={{
            color: "white",
            backgroundColor: "var(--accent)",
            border: "none",
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect(poke);
          }}
          aria-label={`Details for ${displayName}`}
        >
          <Info size={20} strokeWidth={3} color="white" />
        </button>
      )}

      {sprite ? (
        <img
          src={sprite}
          alt={poke.name}
          className="w-12 h-12 md:w-16 md:h-16 object-contain"
          width={64}
          height={64}
          loading={priorityLoad ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          onError={(e) => (e.currentTarget.style.display = "none")}
          style={{ filter: isBlocked ? "grayscale(100%)" : "none" }}
        />
      ) : null}

      <span
        className="absolute top-0 md:-top-1 left-1 right-1 text-center text-xs md:text-2xl font-medium truncate"
        style={{ color: "var(--text)", fontSize: "clamp(6.5px, 1.2vw, 14px)", textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
      >
        {displayName}
      </span>

      <span
        className="absolute bottom-0 md:-bottom-1 left-1 right-1 text-center text-xs md:text-2xl font-medium"
        style={{ color: "var(--accent)", fontSize: "clamp(10px, 1.2vw, 14px)", textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
      >
        {dexNumber || formatDexNumber(poke?.id)}
      </span>
    </div>
  );
}

export default memo(PokemonGridItem, (prev, next) => {
  return (
    prev.poke === next.poke &&
    prev.poke?._isSearchMatch === next.poke?._isSearchMatch &&
    prev.isCaught === next.isCaught &&
    prev.hasFail === next.hasFail &&
    prev.isBlocked === next.isBlocked &&
    prev.sprite === next.sprite &&
    prev.readOnly === next.readOnly &&
    prev.displayName === next.displayName &&
    prev.dexNumber === next.dexNumber &&
    prev.priorityLoad === next.priorityLoad &&
    prev.onToggleCaught === next.onToggleCaught &&
    prev.onSelect === next.onSelect
  );
});
