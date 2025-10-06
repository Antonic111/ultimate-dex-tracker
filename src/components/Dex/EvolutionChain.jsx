import "../../css/EvolutionChain.css";
import { findPokemon } from "../../utils";

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
  return (
    <div className="evolution-chain-section">
      <div className="evo-chain-title">Evolution Chain</div>
      <div className="evo-chain-divider"></div>
      <div className="evo-chain-none-wrapper">
        <EvoSprite
          mon={pokemon}
          highlight={true}
          leaving={false}
          showShiny={showShiny}
          size={64}
          onPokemonSelect={onPokemonSelect}
          currentPokemon={pokemon}
        />
        <div className="evo-chain-none">No Evolutions</div>
      </div>
    </div>
  );
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
      {isSelected && hasEvolutions && (
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

function EvoChainNode({ mon, showShiny, onPokemonSelect = null, currentPokemon = null }) {

  if (!mon.evolution?.next?.length) {
    return (
      <div className="evo-chain-leaf">
        <EvoSprite
          mon={mon}
          showShiny={showShiny}
          onPokemonSelect={onPokemonSelect}
          currentPokemon={currentPokemon}
        />
      </div>
    );
  }
  // Split branch
  if (mon.evolution.next.length > 1) {
    return (
      <div className="evo-chain-split">
        <div className="evo-chain-parent">
          <EvoSprite
            mon={mon}
            showShiny={showShiny}
            onPokemonSelect={onPokemonSelect}
            currentPokemon={currentPokemon}
          />
        </div>
        <div className="evo-chain-children">
          {mon.evolution.next.map((next, i) => {
            const child = findPokemon(next.id, next.name);
            return (
              <div className="evo-chain-child-row" key={i}>
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
          mon={mon}
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
