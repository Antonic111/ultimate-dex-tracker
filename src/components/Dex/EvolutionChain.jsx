import "../../css/EvolutionChain.css";
import { findPokemon } from "../../utils";

export default function EvolutionChain({ pokemon, showShiny = false }) {

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
      <div className="evo-chain-none-wrapper">
        <EvoSprite
          mon={pokemon}
          highlight={true}
          leaving={false}
          showShiny={showShiny}
          size={64}
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
      <div className="evo-chain-table">
        <EvoChainNode
          mon={base}
          showShiny={showShiny}
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

function EvoSprite({ mon, size = 44, showShiny = false }) {
  if (!mon)
    return <div className="evo-sprite blank" style={{ width: size, height: size }} />;
  const imgSrc =
    showShiny && mon.sprites?.front_shiny
      ? mon.sprites.front_shiny
      : mon.sprites?.front_default;
  return (
    <div className="evo-sprite">
      <img
        src={imgSrc}
        alt={mon.name}
        title={mon.name}
        className="evo-img"
        width={size}
        height={size}
      />
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

function EvoChainNode({ mon, showShiny }) {

  if (!mon.evolution?.next?.length) {
    return (
      <div className="evo-chain-leaf">
        <EvoSprite
          mon={mon}
          showShiny={showShiny}
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
        />
      </div>
      <EvoArrow how={next.how} />
      {child ? (
        <EvoChainNode
          mon={child}
          showShiny={showShiny}
        />
      ) : null}
    </div>
  );
}
