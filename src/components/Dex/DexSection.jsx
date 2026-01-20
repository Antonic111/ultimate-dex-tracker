import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { formatPokemonName } from "../../utils";
import { Plus, Minus, Info, Lock } from "lucide-react";

function formatDexNumber(num) {
  if (!num) return "????";
  return `#${String(num).padStart(4, "0")}`;
}



export default function DexSection({
  title,
  pokemonList,
  isCaught = () => false,
  onToggleCaught,
  onSelect,
  onMarkAll,
  readOnly = false,
  allowCollapse = true,
  showShiny = false,
  showForms = false,
  isAlphaBox = false,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [transitionReady, setTransitionReady] = useState(false);
  const contentRef = useRef(null);
  const touchTimerRef = useRef(null);
  const touchMovedRef = useRef(false);
  const longPressTriggeredRef = useRef(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  // Ensure isCaught is always a function and gets fresh data
  const safeIsCaught = useCallback((poke) => {
    if (typeof isCaught === 'function') {
      return isCaught(poke);
    }
    return false;
  }, [isCaught]);

  const boxes = useMemo(() => {
    if (!pokemonList || pokemonList.length === 0) return [];

    // Special handling for Unown boxes: split normal vs alpha forms
    const sectionTitle = String(title || '').toLowerCase();
    const isUnownSection = sectionTitle.includes('unown');
    if (isUnownSection) {
      const isAlphaForm = (p) => {
        const form = String(p.form || '').toLowerCase();
        const name = String(p.name || '').toLowerCase();
        return p.formType === 'alpha' || form.includes('alpha') || name.includes('alpha');
      };
      const normals = (pokemonList || []).filter(p => !isAlphaForm(p));
      const alphas = (pokemonList || []).filter(p => isAlphaForm(p));
      if (normals.length > 0 && alphas.length > 0) {
        // Regular Unown's Box first, Alpha Unown's Box second
        return [
          { pokemon: normals },
          { pokemon: alphas, isAlphaBox: true }
        ];
      }
      // Fallback to default chunking if detection failed
    }

    const boxSize = 30; // 6x5 grid
    const out = [];
    for (let i = 0; i < pokemonList.length; i += boxSize) {
      out.push(pokemonList.slice(i, i + boxSize));
    }
    return out;
  }, [pokemonList, title]);

  const filteredList = pokemonList || [];

  // Calculate content height for smooth animation
  useEffect(() => {
    if (!contentRef.current) return;
    const height = contentRef.current.scrollHeight;
    setContentHeight(height);
  }, [filteredList]);

  // Enable transitions only after initial mount so first paint is natural height
  useEffect(() => {
    const raf = requestAnimationFrame(() => setTransitionReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);


  // Helpers for mobile interactions: tap = toggle caught, long-press = open sidebar
  const handleTouchStart = useCallback((e, poke) => {
    if (typeof window !== 'undefined' && window.innerWidth > 768) return; // desktop: ignore
    touchMovedRef.current = false;
    longPressTriggeredRef.current = false;
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    const t = e.touches && e.touches[0];
    if (t) {
      touchStartXRef.current = t.clientX;
      touchStartYRef.current = t.clientY;
    }
    touchTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      if (onSelect) onSelect(poke);
    }, 350); // 350ms long-press (faster)
  }, [onSelect]);

  const handleTouchMove = useCallback((e) => {
    if (typeof window !== 'undefined' && window.innerWidth > 768) return;
    const t = e.touches && e.touches[0];
    if (!t) return;
    const dx = Math.abs(t.clientX - touchStartXRef.current);
    const dy = Math.abs(t.clientY - touchStartYRef.current);
    // If user scrolls/moves finger more than threshold, cancel long-press
    if (dx > 12 || dy > 12) {
      touchMovedRef.current = true;
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
      }
    }
  }, []);

  const handleTouchEnd = useCallback((poke, readOnlyFlag) => {
    if (typeof window !== 'undefined' && window.innerWidth > 768) return; // desktop: ignore
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
    // If long-press already handled, do nothing
    if (longPressTriggeredRef.current) return;
    // If the finger moved significantly, treat as cancel
    if (touchMovedRef.current) return;
    // Short tap behavior on mobile
    if (readOnlyFlag) {
      if (onSelect) onSelect(poke);
    } else if (onToggleCaught) {
      onToggleCaught(poke);
    }
  }, [onSelect, onToggleCaught]);

  if (filteredList.length === 0) {
    return null;
  }

  return (
    <section className={`w-full ${collapsed ? "mb-1 opacity-75" : "mb-8"}`}>
      <div className="w-full">
        <div
          className={`flex items-center justify-between pl-0 pr-4 rounded-lg mb-2 ${collapsed ? " opacity-75 py-0" : "py-2"}`}
        >
          <div>
            <div className={`font-bold leading-none ${collapsed ? "text-lg" : "text-2xl"}`} style={{ color: 'var(--text)' }}>{title}</div>
            {!collapsed && (
              <div className="text-sm text-gray-600 dark:text-gray-400 leading-none mt-1">{`Showing ${filteredList.length} Pokémon`}</div>
            )}
          </div>

          {allowCollapse && (
            <button
              className="p-2 rounded-lg transition-colors duration-200 hover:scale-105"
              onClick={() => setCollapsed(v => !v)}
              aria-label={collapsed ? "Expand section" : "Collapse section"}
              tabIndex={0}
            >
              {collapsed ? (
                <Plus size={22} strokeWidth={4} style={{ color: 'var(--accent)' }} />
              ) : (
                <Minus size={22} strokeWidth={4} style={{ color: 'var(--accent)' }} />
              )}
            </button>
          )}
        </div>
        
        {/* Divider below header */}
        <div className={`w-full h-1 rounded-full ${collapsed ? "mb-2" : "mb-6"}`} style={{ 
          background: `linear-gradient(to right, var(--border-color) 35%, var(--accent))`
        }}></div>


        <div 
          ref={contentRef}
          className={transitionReady ? "transition-all duration-300 ease-in-out" : ""}
          style={{
            maxHeight: transitionReady ? (collapsed ? '0px' : `${contentHeight}px`) : 'none',
            opacity: collapsed ? 0 : 1,
            overflow: collapsed ? 'hidden' : 'visible'
          }}
        >
          <div className={`${boxes.length === 1 ? 'grid grid-cols-1 justify-items-center' : 'grid grid-cols-1 lg:grid-cols-2'} gap-0 md:gap-6`}>
            {boxes.map((boxData, i) => {
              const box = boxData.pokemon || boxData; // Handle both new and old structure
              const isAlphaBox = !!boxData.isAlphaBox;
              const boxIndex = i;

              const single = boxes.length === 1;
              const isLastSingleOnLg = boxes.length > 1 && (boxes.length % 2 === 1) && i === boxes.length - 1;
              const containerClassName = single
                ? 'w-auto mb-8'
                : isLastSingleOnLg
                  ? 'w-auto mb-8 lg:col-span-2 place-self-center'
                  : 'w-full mb-8';
              return (
                <div className={containerClassName} key={`box-${box[0]?.id ?? i}-${i}`}>
                  <div className="rounded-lg p-2 md:p-3 shadow-lg overflow-visible" style={{ backgroundColor: 'var(--searchbar-bg)', border: '1px solid var(--border-color)', contentVisibility: 'auto', containIntrinsicSize: '400px' }}>
                    {/* Box Header */}
                    <div className="flex items-center justify-between py-0">
                      <span className="text-lg font-semibold leading-none self-center m-0 p-0" style={{ color: 'var(--accent)', margin: 0, padding: 0 }}>
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
                            "vivillon",
                            "alpha",
                          ];
                          // Check for specific titles first before doing form type matching
                          if (title === "Alpha Genders & Other's") {
                            return `Alpha Genders & Other's Box 1`;
                          }
                          
                          const tstr = String(title || "").toLowerCase();
                          const match = FORM_TYPES.find((type) => tstr.includes(type));
                          if (match) {
                            const capitalized =
                              match.charAt(0).toUpperCase() +
                              match.slice(1).toLowerCase();
                            let label;
                            
                            if (match === "alcremie") {
                              label = "Alcremie's Box";
                            } else if (match === "vivillon") {
                              label = "Vivillon's Box";
                            } else if (match === "unown") {
                              // Special naming for Unown boxes
                              if (isAlphaBox) {
                                label = "Alpha Unown's Box";
                              } else {
                                label = "Unown's Box";
                              }
                            } else if (match === "alpha") {
                              label = "Alpha Forms Box";
                            } else {
                              label = `${capitalized} Forms Box`;
                            }
                            
                            // For Unown boxes, always display Box 1 visually
                            if (match === "unown") {
                              return `${label} 1`;
                            }
                            return `${label} ${boxIndex + 1}`;
                          } else {
                            return `${String(box[0]?.id ?? "????").padStart(4, "0")} - ${String(box[box.length - 1]?.id ?? "????").padStart(4, "0")}`;
                          }
                        })()}
                      </span>

                      {/* hide mark-all in read-only */}
                      {!readOnly && onMarkAll && (
                        <button 
                          className="px-4 py-0.5 rounded-full text-base font-medium transition-all duration-100 self-center md:hover:scale-105 md:hover:shadow-lg" 
                          style={{ backgroundColor: 'var(--accent)', color: '#000000' }}
                          onMouseEnter={(e) => {
                            if (window.innerWidth >= 768) { // PC only
                              e.target.style.backgroundColor = 'var(--accent-hover)';
                              e.target.style.color = '#ffffff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (window.innerWidth >= 768) { // PC only
                              e.target.style.backgroundColor = 'var(--accent)';
                              e.target.style.color = '#000000';
                            }
                          }}
                          onClick={() => onMarkAll(box)}
                        >
                          {/* Only check unlocked Pokemon when determining button text */}
                          {box.filter(p => !p._isBlocked).every((p) => safeIsCaught(p)) ? "Unmark All" : "Mark All"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="grid grid-cols-6 gap-1 overflow-visible">
                      {box.map((poke, idx) => {
                        const key = getCaughtKey(poke) + "_" + idx;
                        const sprites = poke?.sprites ?? {};
                        const sprite =
                          (showShiny && sprites.front_shiny) ? sprites.front_shiny : (sprites.front_default || "");
                        const isBlocked = poke._isBlocked === true;

                        return (
                          <div
                            key={key}
                            className={`group relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-100 pokemon-slot-hover${readOnly ? " hover:bg-gray-700 dark:hover:bg-gray-600" : ""}${isBlocked ? " cursor-not-allowed" : " cursor-pointer"}`}
                            style={{ 
                              background: safeIsCaught(poke) ? 'linear-gradient(to top, rgba(21, 128, 61, 0.4), rgba(34, 197, 94, 0.2))' : 'var(--searchbar-inputs)',
                              border: safeIsCaught(poke) ? '2px solid rgb(34, 197, 94)' : '2px solid var(--border-color)',
                              width: 'clamp(60px, 15vw, 100px)',
                              height: 'clamp(60px, 15vw, 100px)',
                              WebkitTouchCallout: 'none',
                              WebkitUserSelect: 'none',
                              userSelect: 'none',
                              touchAction: 'manipulation',
                              opacity: isBlocked ? 0.5 : 1,
                              position: 'relative'
                            }}
                            data-caught={safeIsCaught(poke)}
                            data-readonly={readOnly}
                            data-blocked={isBlocked}
                            onContextMenu={(e) => e.preventDefault()}
                            onClick={(e) => {
                              // Prevent interaction if blocked
                              if (isBlocked) {
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                              }
                              // On mobile, touch handlers manage behavior; prevent duplicate click
                              if (typeof window !== 'undefined' && window.innerWidth <= 768) {
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
                            onTouchEnd={() => {
                              if (isBlocked) return;
                              handleTouchEnd(poke, readOnly);
                            }}
                            title={isBlocked ? `${formatPokemonName(poke.name)} (Locked)` : formatPokemonName(poke.name)}
                          >
                            {/* Blocked overlay with lock icon */}
                            {isBlocked && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center z-10" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
                                <Lock size={24} style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }} />
                              </div>
                            )}

                            {/* Info button - only show in edit mode if onSelect is available, hide in read-only mode, hide if blocked */}
                            {!readOnly && onSelect && !isBlocked && (
                              <button
                                className="absolute bottom-0.5 right-0.5 p-0.25 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 z-20 hidden md:block"
                                style={{ 
                                  color: 'white',
                                  backgroundColor: 'var(--accent)',
                                  border: 'none'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onSelect) onSelect(poke);
                                }}
                                aria-label={`Details for ${formatPokemonName(poke.name)}`}
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
                                loading="lazy"
                                decoding="async"
                                fetchPriority="low"
                                draggable={false}
                                onError={(e) => (e.currentTarget.style.display = "none")}
                                style={{ filter: isBlocked ? 'grayscale(100%)' : 'none' }}
                              />
                            ) : null}

                            <span className="absolute top-0 md:-top-1 left-1 right-1 text-center text-xs md:text-2xl font-medium truncate" style={{ color: 'var(--text)', fontSize: 'clamp(6.5px, 1.2vw, 14px)', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                              {formatPokemonName(poke.name)}
                            </span>

                            <span className="absolute bottom-0 md:-bottom-1 left-1 right-1 text-center text-xs md:text-2xl font-medium" style={{ color: 'var(--accent)', fontSize: 'clamp(10px, 1.2vw, 14px)', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{formatDexNumber(poke?.id)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function getCaughtKey(poke) {
  if (!poke) return "unknown";
  
  let key = poke.id?.toString() || "unknown";
  
  if (poke.form && poke.form !== "normal") {
    key += `-${poke.form}`;
  }
  
  if (poke.gender && poke.gender !== "unknown") {
    key += `-${poke.gender}`;
  }
  
  return key;
}
