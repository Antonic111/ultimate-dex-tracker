import "../../css/EvolutionChain.css";
import { findPokemon, getRelatedForms } from "../../utils";

export default function EvolutionChain({ pokemon, showShiny = false, onPokemonSelect = null }) {

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
      <div className="evo-chain-title">Evolution Chain</div>
      <div className="evo-chain-divider"></div>
      <div className="evo-chain-table">
        <EvoChainNode
          mon={base}
          showShiny={showShiny}
          onPokemonSelect={onPokemonSelect}
          currentPokemon={pokemon}
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

function EvoSprite({ mon, size = 44, showShiny = false, onPokemonSelect = null, currentPokemon = null }) {
  if (!mon)
    return <div className="evo-sprite blank" style={{ width: size, height: size }} />;

  const imgSrc =
    showShiny && mon.sprites?.front_shiny
      ? mon.sprites.front_shiny
      : mon.sprites?.front_default;

  const isSelected = currentPokemon && mon.id === currentPokemon.id && mon.name === currentPokemon.name;
  const isClickable = onPokemonSelect !== null;

  // Check if this Pokemon has evolutions (either pre or next)
  const hasEvolutions = mon.evolution && (
    (mon.evolution.pre && mon.evolution.pre !== null) ||
    (mon.evolution.next && mon.evolution.next.length > 0)
  );

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
  return (
    <div className="evo-arrow">
      <span className="evo-arrow-wrapper">
        <span className="evo-arrow-symbol">→</span>
        {how ? (
          <span className="evo-tooltip">{how}</span>
        ) : null}
      </span>
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

function EvoChainNode({ mon, showShiny, onPokemonSelect = null, currentPokemon = null, preventFormSwitch = false }) {
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
        />
      </div>
      <EvoArrow how={next.how} />
      {child ? (
        <EvoChainNode
          mon={child}
          showShiny={showShiny}
          onPokemonSelect={onPokemonSelect}
          currentPokemon={currentPokemon}
        />
      ) : null}
    </div>
  );
}
