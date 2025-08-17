import React, { useState } from "react";
import { getCaughtKey } from "../../caughtStorage";
import { formatPokemonName } from "../../utils";
import { Plus, Minus } from "lucide-react";
import '../../css/App.css';

function formatDexNumber(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return "----";
  return "#" + String(n).padStart(4, "0");
}

export default function DexSection({
  readOnly = false,
  allowCollapse = true, // New prop to control collapse button visibility
  externalUsername,
  caughtInfoMapOverride,
  updateCaughtInfoOverride, // (not used here)
  title = "Main Living Dex",
  pokemonList = [],
  caught,
  onMarkAll,
  onToggleCaught,
  onSelect,
  sidebarOpen,
  showShiny = false,
  showForms = true,
}) {

  const isSearchResults = title === "Search Results";
  const baseList = Array.isArray(pokemonList) ? pokemonList : [];
  const filteredList =
    !isSearchResults && showForms === false
      ? baseList.filter(
        (poke) =>
          !poke.formType ||
          poke.formType === "main" ||
          poke.formType === "default"
      )
      : baseList;

  // use external caught map in view mode if provided, else fall back
  const caughtMap = caughtInfoMapOverride ?? caught ?? {};
  const isCaught = (p) => !!caughtMap[getCaughtKey(p)];

  if (filteredList.length === 0) {
    return null;
  }

  const boxes = [];
  for (let i = 0; i < filteredList.length; i += 30) {
    boxes.push(filteredList.slice(i, i + 30));
  }

  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className={`dex-section${collapsed ? " collapsed" : ""}`}>
      <div className="site-content">
        <div
          className={`main-header${collapsed ? " collapsed" : ""} ${title === "Main Living Dex" ? "main-header-main" : ""
            }`}
        >
          <div>
            <div className="main-title">{title}</div>
            <div className="main-desc">{`Showing ${filteredList.length} Pokémon`}</div>
          </div>

          {allowCollapse && (
            <button
              className="collapse-btn"
              onClick={() => setCollapsed(v => !v)}
              aria-label={collapsed ? "Expand section" : "Collapse section"}
              tabIndex={0}
            >
              {collapsed ? (
                <Plus size={22} strokeWidth={4} className="collapse-icon" />
              ) : (
                <Minus size={22} strokeWidth={4} className="collapse-icon" />
              )}
            </button>
          )}
        </div>

        <div className={`main-divider${collapsed ? " collapsed" : ""}`}></div>

        {!collapsed && (
          <div className="boxes-row">
            {boxes.map((box, i) => (
              <div className="box" key={`box-${box[0]?.id ?? i}-${i}`}>
                <div className="box-header-overlap">
                  <span>
                    {(() => {
                      const FORM_TYPES = [
                        "gender",
                        "alolan",
                        "galarian",
                        "gmax",
                        "hisuian",
                        "paldean",
                        "unown",
                        "other",
                        "alcremie",
                        "alpha",
                      ];
                      const tstr = String(title || "").toLowerCase();
                      const match = FORM_TYPES.find((type) => tstr.includes(type));
                      if (match) {
                        const capitalized =
                          match.charAt(0).toUpperCase() +
                          match.slice(1).toLowerCase();
                        const label =
                          match === "alcremie"
                            ? "Alcremie's Box"
                            : match === "unown"
                              ? "Unown's Box"
                              : `${capitalized} Forms Box`;
                        return `${label} ${i + 1}`;
                      } else {
                        return `${String(box[0]?.id ?? "????").padStart(4, "0")} - ${String(box[box.length - 1]?.id ?? "????").padStart(4, "0")}`;
                      }
                    })()}
                  </span>

                  {/* hide mark-all in read-only */}
                  {!readOnly && onMarkAll && (
                    <button className="mark-all-btn" onClick={() => onMarkAll(box)}>
                      {box.every((p) => isCaught(p)) ? "Unmark All" : "Mark All"}
                    </button>
                  )}
                </div>

                <div className="box-grid">
                  {box.map((poke, idx) => {
                    const key = getCaughtKey(poke) + "_" + idx;
                    const sprites = poke?.sprites ?? {};
                    const sprite =
                      (showShiny && sprites.front_shiny) ? sprites.front_shiny : (sprites.front_default || "");

                    return (
                      <div
                        key={key}
                        className={`poke-slot${isCaught(poke) ? " caught" : ""}${readOnly ? " read-only" : ""
                          }`}
                        onClick={() => {
                          if (readOnly && onSelect) {
                            // In read-only mode, clicking the slot opens the sidebar
                            onSelect(poke);
                          } else if (!readOnly && onToggleCaught) {
                            // In edit mode, clicking toggles caught status
                            onToggleCaught(poke);
                          }
                        }}
                        title={formatPokemonName(poke.name)}
                      >
                        {!readOnly && (
                          <button
                            className="info-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelect) onSelect(poke);
                            }}
                            aria-label={`Details for ${formatPokemonName(poke.name)}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="info-icon"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-8h2v2z" />
                            </svg>
                          </button>
                        )}

                        <span className="poke-name">
                          {formatPokemonName(poke.name)}
                        </span>

                        {sprite ? (
                          <img
                            src={sprite}
                            alt={poke.name}
                            draggable={false}
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        ) : null}

                        <span className="poke-num">{formatDexNumber(poke?.id)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
