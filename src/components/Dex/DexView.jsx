import React from "react";
import DexSection from "./DexSection";
import DexCategoryTabs from "./DexCategoryTabs";
import Sidebar from "./PokemonSidebar";
import SearchBar from "../Shared/SearchBar";
import ProgressManager from "../Progress/ProgressManager";
import NoResults from "../Shared/NoResults";
import { getCaughtKey } from "../../caughtStorage";
import { getLevenshteinDistance } from "../../utils";
import noResultsImg from "../../data/pikachu.png";
import pokemonData from "../../data/pokemon.json";
import formsData from "../../utils/loadFormsData";
import { getFilteredFormsData } from "../../utils/dexPreferences";
import { Link } from "react-router-dom";
import { ArrowBigLeft, Sparkles } from "lucide-react";
import "../../css/PublicDex.css";

const typeOptions = [
    "normal", "fire", "water", "grass", "electric", "ice", "fighting", "poison", "ground", "flying",
    "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

const GEN_OPTIONS = Array.from(new Set([
    ...pokemonData.map(p => p.gen),
    ...getFilteredFormsData(formsData).map(p => p.gen),
])).filter(Boolean).sort((a, b) => a - b);

const DEX_TABS_CONFIG = [
    { key: "main", title: "Main Living Dex", sectionKeys: ["main"] },
    { key: "gender", title: "Gender", sectionKeys: ["gender"] },
    { key: "alolan", title: "Alola", sectionKeys: ["alolan"] },
    { key: "galarian", title: "Galar", sectionKeys: ["galarian"] },
    { key: "gmax", title: "Gmax", sectionKeys: ["gmax"] },
    { key: "hisuian", title: "Hisui", sectionKeys: ["hisuian"] },
    { key: "paldean", title: "Paldea", sectionKeys: ["paldean"] },
    { key: "unown", title: "Unown", sectionKeys: ["unown"] },
    { key: "other", title: "Other Forms", sectionKeys: ["other"] },
    { key: "mighty", title: "Mighty Marks", sectionKeys: ["mighty"] },
    { key: "alcremie", title: "Alcremie", sectionKeys: ["alcremie"] },
    { key: "vivillon", title: "Vivillon", sectionKeys: ["vivillon"] },
    { key: "alpha", title: "Alpha", sectionKeys: ["alpha", "alphaother"] }
];

// Create the same dex sections structure for ViewDex
const createDexSections = () => {
    const FORM_TYPES = [
        "gender",
        "alolan",
        "galarian",
        "gmax",
        "hisuian",
        "paldean",
        "unown",
        "other",
        "mighty",
        "alcremie",
        "vivillon",
        "alpha",
        "alphaother"
    ];

    // Get filtered forms data based on user preferences
    const filteredFormsData = getFilteredFormsData(formsData);

    return [
        {
            key: "main",
            title: "Main Living Dex",
            getList: () => pokemonData
        },
        ...FORM_TYPES.map(type => {
            let title = `${type.charAt(0).toUpperCase() + type.slice(1)} Forms`;
            if (type === "alphaother") title = "Alpha Genders & Other's";
            else if (type === "mighty") title = "Mighty Marks";
            else if (type === "other") title = "Other Forms";

            return {
                key: type,
                title,
                getList: () => {
                    const filtered = filteredFormsData.filter(p => p.formType === type);

                    // Special sorting for Alpha Forms - sort by Pokemon number (id)
                    if (type === "alpha" || type === "alphaother") {
                        return filtered.sort((a, b) => (a.id || 0) - (b.id || 0));
                    }

                    // Default sorting for other form types (by JSON order)
                    return filtered;
                }
            };
        })
    ];
};

export default function DexView({
    // Data props
    allMons,
    caughtInfoMap,
    dexSections,

    // State props
    filters,
    setFilters,
    showShiny,
    setShowShiny,
    showForms,
    setShowForms,
    selectedPokemon,
    setSelectedPokemon,
    sidebarOpen,
    setSidebarOpen,

    // Function props
    updateCaughtInfo,
    onToggleCaught,
    onMarkAll,
    onSelectPokemon,

    // Configuration props
    readOnly = false,
    title = "Living Dex",
    externalLinkPreference = 'serebii',
    pokemonList = null, // If provided, use this instead of filtering dexSections

    // Additional props for custom behavior
    caught = null,
    customFilterMons = null,
    showNoResults = true,
    suggestion = null,
    onSuggestionClick = null,

    // Profile viewing props
    viewingUsername = null, // Username of the profile being viewed (null if viewing own profile)
    progressBarsOverride = null,
    viewedUserShinyCharmGames = [], // Shiny charm games of the viewed user
    profileOwnerDexPreferences = null // Dex preferences of the profile owner (for progress bar counts)
}) {
    const searchBarRef = React.useRef(null);
    const [showFloatingShiny, setShowFloatingShiny] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            if (searchBarRef.current) {
                const rect = searchBarRef.current.getBoundingClientRect();
                // Show floating toggle when the search bar is scrolled up past the header area
                if (rect.bottom < 80) {
                    setShowFloatingShiny(true);
                } else {
                    setShowFloatingShiny(false);
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Check initial state

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Handle sidebar open/close
    const handlePokemonSelect = React.useCallback((pokemon) => {
        setSelectedPokemon(pokemon);
        setSidebarOpen(true);
    }, [setSelectedPokemon, setSidebarOpen]);

    const handleSidebarClose = () => {
        setSidebarOpen(false);
        setSelectedPokemon(null);
    };

    // If pokemonList is provided, use it directly (for ViewDex)
    // Otherwise, filter the dexSections (for main App)
    const shouldUseCustomList = pokemonList !== null;

    // For ViewDex mode, create organized sections from the filtered list
    const getViewDexSections = () => {
        if (!actualPokemonList) return [];

        const sections = createDexSections();
        return sections.map(section => {
            let sectionPokemon;

            if (section.key === "main") {
                sectionPokemon = actualPokemonList.filter(pokemon => !pokemon.formType);
            } else {
                sectionPokemon = actualPokemonList.filter(pokemon => pokemon.formType === section.key);
            }

            return {
                ...section,
                getList: () => sectionPokemon
            };
        }).filter(section => section.getList().length > 0); // Only show sections with Pokémon
    };

    // For ViewDex mode with customFilterMons, create the filtered pokemonList
    const getFilteredPokemonList = () => {
        if (customFilterMons && !pokemonList) {
            // Create filtered list from allMons using customFilterMons
            return allMons.filter(pokemon => {
                // Apply forms filter first
                if (!showForms && pokemon.formType && pokemon.formType !== "main" && pokemon.formType !== "default") {
                    return false;
                }
                return true;
            });
        }
        return pokemonList;
    };

    // Get the actual pokemon list to use (either provided or filtered)
    const actualPokemonList = getFilteredPokemonList();

    // Update shouldUseCustomList to include customFilterMons case
    const shouldUseCustomListUpdated = pokemonList !== null || customFilterMons !== null;

    // Get suggestion for no results - using the EXACT same logic as App.jsx
    const finalSuggestion = React.useMemo(() => {
        if (suggestion) return suggestion;
        if (!filters.searchTerm?.trim()) return "";

        const searchTerm = filters.searchTerm.toLowerCase();
        let allNames = [];

        if (shouldUseCustomListUpdated) {
            // ViewDex mode: use allMons names for suggestions (not the filtered pokemonList)
            // This ensures we can suggest Pokémon even when the filtered list is empty
            // Filter out any Pokémon without names to prevent errors
            allNames = allMons
                .filter(p => p && p.name && typeof p.name === 'string')
                .map(p => p.name);
        } else {
            // Main App mode: use all dexSections names
            allNames = dexSections.flatMap(section =>
                section.getList()
                    .filter(p => p && p.name && typeof p.name === 'string')
                    .map(p => p.name)
            );
        }

        if (allNames.length === 0) return "";

        // Use the EXACT same ranking algorithm as App.jsx
        const ranked = allNames
            .map(name => ({
                name,
                score:
                    getLevenshteinDistance(searchTerm, name.toLowerCase()) -
                    (name.toLowerCase().startsWith(searchTerm) ? 2 : 0) -
                    (name.toLowerCase().includes(searchTerm) ? 1 : 0)
            }))
            .sort((a, b) => a.score - b.score);

        // Use the EXACT same threshold as App.jsx
        if (ranked.length && ranked[0].score <= 4) {
            return ranked[0].name;
        }

        return "";
    }, [suggestion, filters.searchTerm, shouldUseCustomListUpdated, allMons, dexSections]);

    // Check if we have any active search criteria
    const hasActiveSearch = filters.searchTerm || (filters.game && filters.game.length > 0) || (filters.gameObtainable && filters.gameObtainable.length > 0) || (filters.ball && filters.ball.length > 0) || (filters.mark && filters.mark.length > 0) || (filters.method && filters.method.length > 0) || (filters.type && filters.type.length > 0) || (filters.gen && filters.gen.length > 0) || filters.caught || (filters.categories && filters.categories.length > 0);

    // Show no results when there are no results found for any active search criteria
    // For ViewDex mode, check if all sections have no results using customFilterMons
    // For main App mode, use the showNoResults prop if provided
    let hasNoResults = false;

    if (shouldUseCustomListUpdated) {
        // ViewDex mode: check if all sections have no results using customFilterMons
        if (customFilterMons) {
            const totalResults = dexSections.reduce((total, section) => {
                const filteredMons = customFilterMons(section.getList(), showForms);
                return total + filteredMons.length;
            }, 0);

            hasNoResults = hasActiveSearch && totalResults === 0;
        } else {
            // Fallback if no customFilterMons provided
            hasNoResults = hasActiveSearch && actualPokemonList && actualPokemonList.length === 0;
        }
    } else {
        // Main App mode: use the showNoResults prop if provided, otherwise use local logic
        hasNoResults = hasActiveSearch && (pokemonList && pokemonList.length === 0);
    }

    const [activeCategoryTab, setActiveCategoryTab] = React.useState("main");

    const hasSearchFilters = !!(filters.searchTerm || (filters.game && filters.game.length > 0) || (filters.gameObtainable && filters.gameObtainable.length > 0) || (filters.ball && filters.ball.length > 0) || (filters.type && filters.type.length > 0) || (filters.gen && filters.gen.length > 0) || (filters.mark && filters.mark.length > 0) || (filters.method && filters.method.length > 0) || filters.caught || (filters.categories && filters.categories.length > 0));

    const categorizedSections = React.useMemo(() => {
        return dexSections
            .filter(section => !showShiny || section.key !== 'mighty')
            .map(section => {
                const filteredMons = customFilterMons
                    ? customFilterMons(section.getList(), showForms)
                    : section.getList().filter(mon => {
                        if (showShiny && mon.formType === 'mighty') return false;
                        if (!showForms && mon.formType && mon.formType !== "main" && mon.formType !== "default") return false;
                        return true;
                    });

                if (!filteredMons.length) return null;
                return { section, filteredMons };
            })
            .filter(Boolean);
    }, [dexSections, showShiny, customFilterMons, showForms]);

    const availableTabs = React.useMemo(() => {
        return DEX_TABS_CONFIG.map(tab => {
            const matchingSections = categorizedSections.filter(({ section }) => tab.sectionKeys.includes(section.key));
            const totalCount = matchingSections.reduce((acc, curr) => {
                const hasExplicitMatch = curr.filteredMons.some(p => p._isSearchMatch !== undefined);
                const matchCount = hasExplicitMatch
                    ? curr.filteredMons.filter(p => p._isSearchMatch).length
                    : curr.filteredMons.length;
                return acc + matchCount;
            }, 0);
            if (totalCount === 0) return null;
            return {
                key: tab.key,
                title: tab.title,
                count: totalCount,
                sections: matchingSections
            };
        }).filter(Boolean);
    }, [categorizedSections]);

    const effectiveActiveTab = React.useMemo(() => {
        if (availableTabs.some(t => t.key === activeCategoryTab)) {
            return activeCategoryTab;
        }
        return availableTabs[0]?.key || "main";
    }, [availableTabs, activeCategoryTab]);

    const activeSections = React.useMemo(() => {
        const currentTabObj = availableTabs.find(t => t.key === effectiveActiveTab);
        return currentTabObj?.sections || [];
    }, [availableTabs, effectiveActiveTab]);

    return (
        <>
            {/* Profile Header - Only show when viewing someone else's profile */}
            {viewingUsername && (
                <div className="profile-viewing-header page-animate-1">
                    <div style={{ maxWidth: '1300px', margin: '0 auto', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <h1>Viewing <span className="username">{viewingUsername}'s</span> Profile</h1>
                        <Link
                            to={`/u/${viewingUsername}`}
                            className="absolute right-0 flex items-center gap-2 px-3.5 py-2 bg-[var(--accent)] text-black font-bold border-none rounded-lg cursor-pointer transition-colors duration-200 hover:bg-[var(--accent-hover)] hover:text-[var(--text)]"
                            title="Back to Profile"
                            style={{ textDecoration: 'none' }}
                        >
                            <ArrowBigLeft size={16} />
                            <span>Back to Profile</span>
                        </Link>
                    </div>
                </div>
            )}

            {/* Progress Manager */}
            <div className="progress-manager-container page-animate-1">
                <ProgressManager
                    allMons={allMons}
                    caughtInfoMap={caughtInfoMap}
                    readOnly={readOnly}
                    progressBarsOverride={progressBarsOverride}
                    showShiny={showShiny}
                    dexPreferences={profileOwnerDexPreferences}
                    showLockedCheckbox={!!profileOwnerDexPreferences && (profileOwnerDexPreferences.blockUnobtainableShinies || profileOwnerDexPreferences.blockGOExclusiveShinies || profileOwnerDexPreferences.blockNOOTExclusiveShinies)}
                />
            </div>

            {/* Search Bar */}
            <div className="search-bar-container page-animate-2" ref={searchBarRef}>
                <SearchBar
                    filters={filters}
                    setFilters={setFilters}
                    typeOptions={typeOptions}
                    genOptions={GEN_OPTIONS}
                    showShiny={showShiny}
                    setShowShiny={setShowShiny}
                    viewingUsername={viewingUsername}
                    viewedUserShinyCharmGames={viewedUserShinyCharmGames || []}
                />
            </div>

            {/* Floating Shiny Toggle */}
            <div
                className="floating-shiny-toggle"
                style={{
                    opacity: showFloatingShiny ? 1 : 0,
                    visibility: showFloatingShiny ? 'visible' : 'hidden',
                    transition: 'opacity 0.3s ease, visibility 0.3s ease',
                    pointerEvents: showFloatingShiny ? 'auto' : 'none'
                }}
            >
                <label className="flex items-center gap-2 cursor-pointer" title="Toggle all shiny sprites" style={{ margin: 0 }}>
                    <div className="switch" style={{ margin: 0 }}>
                        <input
                            type="checkbox"
                            className="switch-input"
                            checked={showShiny}
                            onChange={e => setShowShiny(e.target.checked)}
                        />
                        <div className="switch-slider" />
                    </div>
                    <span className="text-base font-medium flex items-center gap-2" style={{ color: 'var(--text)' }}>
                        <Sparkles
                            size={20}
                            style={{
                                color: showShiny ? '#fbbf24' : '#6b7280',
                                filter: showShiny ? 'none' : 'grayscale(100%)'
                            }}
                        />
                        Shiny
                    </span>
                </label>
            </div>

            {/* No Results Message - Show for both owner and viewer modes when there are no results */}
            {hasNoResults && (
                <NoResults
                    searchTerm={filters.searchTerm || "your search filters"}
                    suggestion={finalSuggestion}
                    onSuggestionClick={(suggestion) => {
                        if (onSuggestionClick) {
                            onSuggestionClick(suggestion);
                        } else {
                            setFilters(f => ({ ...f, searchTerm: suggestion }));
                        }
                    }}
                />
            )}

            {/* Main Dex Section */}
            <div className="main-bg page-animate-2">
                <DexCategoryTabs
                    tabs={availableTabs}
                    activeTab={effectiveActiveTab}
                    onTabSelect={setActiveCategoryTab}
                    isSearching={hasSearchFilters}
                />
                <div key={effectiveActiveTab} className="category-tab-content-animate">
                    {activeSections.map(({ section, filteredMons }) => (
                        <DexSection
                            readOnly={readOnly || shouldUseCustomListUpdated}
                            caughtInfoMap={caughtInfoMap}
                            caughtInfoMapOverride={shouldUseCustomListUpdated ? caughtInfoMap : undefined}
                            updateCaughtInfo={updateCaughtInfo || (() => { })}
                            key={section.key}
                            sidebarOpen={sidebarOpen}
                            title={section.title}
                            pokemonList={filteredMons}
                            caught={caught || {}}
                            isCaught={(poke) => (caught || {})[getCaughtKey(poke, null, showShiny)] || false}
                            onMarkAll={onMarkAll || (() => { })}
                            onToggleCaught={onToggleCaught || (() => { })}
                            onSelect={onSelectPokemon || handlePokemonSelect}
                            showShiny={showShiny}
                            showForms={showForms}
                            allowCollapse={activeSections.length > 1}
                        />
                    ))}
                </div>
            </div>

            {/* Sidebar - Only render when not in ViewDex mode (when viewingUsername is null) */}
            {!viewingUsername && (
                <Sidebar
                    open={sidebarOpen}
                    readOnly={readOnly}
                    pokemon={selectedPokemon}
                    onClose={handleSidebarClose}
                    caughtInfo={selectedPokemon ? caughtInfoMap[getCaughtKey(selectedPokemon, null, showShiny)] : null}
                    caughtInfoMap={caughtInfoMap}
                    updateCaughtInfo={updateCaughtInfo || (() => { })}
                    showShiny={showShiny}
                    viewingUsername={viewingUsername}
                    onPokemonSelect={setSelectedPokemon}
                    externalLinkPreference={externalLinkPreference}
                />
            )}
        </>
    );
}
