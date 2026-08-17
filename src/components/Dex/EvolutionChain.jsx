import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import "../../css/EvolutionChain.css";
import { Dna } from "lucide-react";
import { findPokemon, getRelatedForms } from "../../utils";
import { getSpriteUrl } from "../../utils/spriteUtils";

export default function EvolutionChain({ pokemon, showShiny = false, onPokemonSelect = null, dexPreferences = null }) {

  // --- MAIN LOGIC TO INHERIT CHAIN FROM BASE FORM ---
  // If the current Pokémon has no evolution chain, try to use the "main" one with same id
  let evoSource = pokemon;
  if (
    !pokemon.evolution ||
    (
      (!pokemon.evolution.pre || pokemon.evolution.pre === null) &&
      (!pokemon.evolution.next || pokemon.evolution.next.length === 0)
    )
  ) {
    // fallback to base form with the same id
    const base = findPokemon(pokemon.id, null);
    if (base && base !== pokemon && base.evolution) evoSource = base;
  }
  if (
    !evoSource.evolution ||
    (
      (!evoSource.evolution.pre || evoSource.evolution.pre === null) &&
      (!evoSource.evolution.next || evoSource.evolution.next.length === 0)
    )
  ) {
    return null;
  }

  // Find the true base (walk backward)
  let base = evoSource;
  while (base.evolution?.pre) {
    const prev = findPokemon(base.evolution.pre.id, base.evolution.pre.name);
    if (!prev) break;
    base = prev;
  }

  return (
    <div className="evolution-chain-section">
      <div className="sidebar-info-section-header">
        <Dna size={18} className="text-[var(--accent)]" />
        <span className="sidebar-info-section-title">EVOLUTION CHAIN</span>
      </div>
      <div className="sidebar-info-section-divider"></div>
      <div className="evo-chain-table">
        <EvoChainNode
          mon={base}
          showShiny={showShiny}
          onPokemonSelect={onPokemonSelect}
          currentPokemon={pokemon}
          dexPreferences={dexPreferences}
        />
      </div>
    </div>
  );
}

function buildTree(mon) {
  if (!mon.evolution?.next?.length) return { mon, children: [] };
  return {
    mon,
    children: mon.evolution.next
      .map(e => findPokemon(e.id, e.name))
      .filter(Boolean)
      .map(buildTree)
  };
}

function EvoSprite({ mon, size = 44, showShiny = false, onPokemonSelect = null, currentPokemon = null, dexPreferences = null }) {
  if (!mon)
    return <div className="evo-sprite blank" style={{ width: size, height: size }} />;

  const imgSrc = getSpriteUrl(mon, showShiny, dexPreferences?.useHomeSprites);

  const isSelected = currentPokemon && mon.id === currentPokemon.id && mon.name === currentPokemon.name;
  const isClickable = onPokemonSelect !== null;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isClickable && onPokemonSelect) {
      onPokemonSelect(mon);
    }
  };

  return (
    <div
      className={`evo-sprite ${isClickable ? 'evo-sprite-clickable' : ''} ${isSelected ? 'evo-sprite-selected' : ''}`}
      onClick={handleClick}
      style={{ cursor: isClickable ? 'pointer' : 'default' }}
      title={mon.name}
    >
      <img
        src={imgSrc}
        alt={mon.name}
        title={mon.name}
        className="evo-img"
        width={size}
        height={size}
      />
      {isSelected && (
        <div className="evo-sprite-selection-indicator">
          <div className="evo-sprite-selection-ring"></div>
        </div>
      )}
    </div>
  );
}

function EvoArrow({ how }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const arrowRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = () => {
    if (arrowRef.current) {
      const rect = arrowRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left + rect.width / 2
      });
    }
  };

  const handleMouseEnter = () => {
    if (!how) return;
    updatePosition();
    setShowTooltip(true);
  };

  return (
    <div className="evo-arrow">
      <span
        ref={arrowRef}
        className="evo-arrow-symbol"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        style={{ cursor: how ? 'help' : 'default' }}
      >
        →
      </span>
      {showTooltip && how && createPortal(
        <div
          style={{
            position: 'fixed',
            top: Math.round(coords.top - 10),
            left: Math.round(coords.left),
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
            pointerEvents: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            textShadow: 'none'
          }}
        >
          {how}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              border: '6px solid transparent',
              borderTopColor: 'rgba(0, 0, 0, 0.95)',
              width: 0,
              height: 0
            }}
          />
        </div>,
        document.body
      )}
    </div>
  );
}

// Helper to find the matching form for the evolution stage
function getMatchingForm(baseMon, targetMon) {
  if (!targetMon || !baseMon) return baseMon;
  if (baseMon.id === targetMon.id) return targetMon;

  const related = getRelatedForms(baseMon);
  if (!related || related.length === 0) return baseMon;

  const targetBase = findPokemon(targetMon.id);
  const baseMonClean = findPokemon(baseMon.id);

  if (!targetBase || !baseMonClean) return baseMon;

  // Determine desired traits
  const isTargetAlpha = targetMon.formType === 'alpha' || targetMon.formType === 'alphaother' || targetMon.name.includes('-alpha');
  
  // Extract core regional suffix (remove alpha parts)
  const getCoreSuffix = (monName, baseName) => {
    let suffix = monName.replace(baseName, '');
    return suffix.replace(/-alphaother|-alpha/g, '');
  };

  const targetSuffix = getCoreSuffix(targetMon.name, targetBase.name);
  const baseSuffix = getCoreSuffix(baseMon.name, baseMonClean.name);

  // If target has no regional suffix (e.g., Sirfetch'd), preserve baseMon's explicitly defined regional suffix.
  // Otherwise, use the target's regional suffix (e.g., Alolan Ninetales dictates Alolan Vulpix).
  const desiredSuffix = targetSuffix || baseSuffix;

  // Score function for candidates
  const getScore = (candidate) => {
    let score = 0;
    const isCAlpha = candidate.formType === 'alpha' || candidate.formType === 'alphaother' || candidate.name.includes('-alpha');
    const cSuffix = getCoreSuffix(candidate.name, baseMonClean.name);

    // +100 for matching Alpha status
    if (isTargetAlpha === isCAlpha) score += 100;
    
    // +50 for matching Regional suffix
    if (cSuffix === desiredSuffix) score += 50;

    // Tie-breaker: EXACT match on target's formType string (if applicable)
    if (candidate.formType === targetMon.formType) score += 10;

    return score;
  };

  let bestMatch = baseMon;
  let highestScore = getScore(baseMon);

  for (const candidate of related) {
    const score = getScore(candidate);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

function EvoChainNode({ mon, showShiny, onPokemonSelect = null, currentPokemon = null, preventFormSwitch = false, dexPreferences = null }) {
  // Determine which form of 'mon' to display based on currentPokemon context
  const displayMon = preventFormSwitch ? mon : getMatchingForm(mon, currentPokemon);

  if (!mon.evolution?.next?.length) {
    return (
      <div className="evo-chain-leaf">
        <EvoSprite
          mon={displayMon}
          showShiny={showShiny}
          onPokemonSelect={onPokemonSelect}
          currentPokemon={currentPokemon}
          dexPreferences={dexPreferences}
        />
      </div>
    );
  }
  // Split branch
  if (mon.evolution.next.length > 1) {
    // Identify if any branches share the same ID (indicating form-based branching)
    const nextIds = mon.evolution.next.map(n => n.id);
    const idCounts = {};
    nextIds.forEach(id => idCounts[id] = (idCounts[id] || 0) + 1);

    return (
      <div className="evo-chain-split">
        <div className="evo-chain-parent">
          <EvoSprite
            mon={displayMon}
            showShiny={showShiny}
            onPokemonSelect={onPokemonSelect}
            currentPokemon={currentPokemon}
            dexPreferences={dexPreferences}
          />
        </div>
        <div className="evo-chain-children">
          {mon.evolution.next.map((next, i) => {
            const child = findPokemon(next.id, next.name);
            const isFormBranch = idCounts[next.id] > 1;

            return (
              <div className="evo-chain-child-row" key={i}>
                <EvoArrow how={next.how} />
                {child ? (
                  <EvoChainNode
                    mon={child}
                    showShiny={showShiny}
                    onPokemonSelect={onPokemonSelect}
                    currentPokemon={currentPokemon}
                    preventFormSwitch={isFormBranch}
                    dexPreferences={dexPreferences}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  // Linear branch
  const next = mon.evolution.next[0];
  const child = findPokemon(next.id, next.name);
  return (
    <div className="evo-chain-row">
      <div className="evo-chain-parent">
        <EvoSprite
          mon={displayMon}
          showShiny={showShiny}
          onPokemonSelect={onPokemonSelect}
          currentPokemon={currentPokemon}
          dexPreferences={dexPreferences}
        />
      </div>
      <EvoArrow how={next.how} />
      {child ? (
        <EvoChainNode
          mon={child}
          showShiny={showShiny}
          onPokemonSelect={onPokemonSelect}
          currentPokemon={currentPokemon}
          dexPreferences={dexPreferences}
        />
      ) : null}
    </div>
  );
}
