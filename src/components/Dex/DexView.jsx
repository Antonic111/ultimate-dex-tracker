import DexSection from "./DexSection";
import Sidebar from "./PokemonSidebar";
import SearchBar from "../Shared/SearchBar";
import ProgressManager from "../Progress/ProgressManager";
import NoResults from "../Shared/NoResults";
import { getCaughtKey } from "../../caughtStorage";
import { getLevenshteinDistance } from "../../utils";
import noResultsImg from "../../data/pikachu.png";
import pokemonData from "../../data/pokemon.json";
import formsData from "../../data/forms.json";
import { getFilteredFormsData } from "../../utils/dexPreferences";
import "../../css/PublicDex.css";

const typeOptions = [
    "normal", "fire", "water", "grass", "electric", "ice", "fighting", "poison", "ground", "flying",
    "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

const GEN_OPTIONS = Array.from(new Set([
    ...pokemonData.map(p => p.gen),
    ...getFilteredFormsData(formsData).map(p => p.gen),
])).filter(Boolean).sort((a, b) => a - b);

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
        ...FORM_TYPES.map(type => ({
            key: type,
            title: type === "alphaother" ? "Alpha Genders & Other's" : `${type.charAt(0).toUpperCase() + type.slice(1)} Forms`,
            getList: () => filteredFormsData.filter(p => p.formType === type)
        }))
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
    progressBarsOverride = null
}) {
    // Handle sidebar open/close
    const handlePokemonSelect = (pokemon) => {
        setSelectedPokemon(pokemon);
        setSidebarOpen(true);
    };

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
    const getSuggestion = () => {
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
    };

    const finalSuggestion = suggestion || getSuggestion();
    
    // Check if we have any active search criteria
    const hasActiveSearch = filters.searchTerm || filters.game || filters.ball || filters.mark || filters.method || filters.type || filters.gen || filters.caught;
    
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

    return (
        <>
            {/* Profile Header - Only show when viewing someone else's profile */}
            {viewingUsername && (
                <div className="profile-viewing-header page-animate-1">
                    <h1>Viewing <span className="username">{viewingUsername}'s</span> Profile</h1>
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
                />
            </div>
            
            {/* Search Bar */}
            <div className="search-bar-container page-animate-2">
                <SearchBar
                    filters={filters}
                    setFilters={setFilters}
                    typeOptions={typeOptions}
                    genOptions={GEN_OPTIONS}
                    showShiny={showShiny}
                    setShowShiny={setShowShiny}
                />
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
                {shouldUseCustomListUpdated ? (
                    // ViewDex mode - use customFilterMons to filter and display sections
                    dexSections.map(section => {
                        const filteredMons = customFilterMons 
                            ? customFilterMons(section.getList(), showForms)
                            : section.getList().filter(mon => {
                                if (!showForms && mon.formType && mon.formType !== "main" && mon.formType !== "default") return false;
                                return true;
                            });
                        
                        if (!filteredMons.length) return null;

                        return (
                            <DexSection
                                key={section.key}
                                readOnly={true}
                                allowCollapse={true}
                                title={section.title}
                                pokemonList={filteredMons}
                                caughtInfoMapOverride={caughtInfoMap}
                                onSelect={handlePokemonSelect}
                                showShiny={showShiny}
                                showForms={showForms}
                                caught={caught || {}}
                                isCaught={(poke) => (caught || {})[getCaughtKey(poke, null, showShiny)] || false}
                                updateCaughtInfo={updateCaughtInfo || (() => {})}
                                onToggleCaught={onToggleCaught || (() => {})}
                                onMarkAll={onMarkAll || (() => {})}
                            />
                        );
                    })
                ) : (
                    // Main App mode - multiple sections with filtering and collapsing
                    <>
                        {(filters.searchTerm || filters.game || filters.ball || filters.type || filters.gen || filters.mark || filters.method || filters.caught)
                            ? dexSections.map(section => {
                                const filteredMons = customFilterMons 
                                    ? customFilterMons(section.getList(), showForms)
                                    : section.getList().filter(mon => {
                                        // Basic filtering if no custom function provided
                                        if (!showForms && mon.formType) return false;
                                        return true;
                                    });
                                
                                if (!filteredMons.length) return null;

                                return (
                                    <DexSection
                                        readOnly={readOnly}
                                        caughtInfoMap={caughtInfoMap}
                                        updateCaughtInfo={updateCaughtInfo}
                                        key={section.key}
                                        sidebarOpen={sidebarOpen}
                                        title={section.title}
                                        pokemonList={filteredMons}
                                        caught={caught}
                                        isCaught={(poke) => (caught || {})[getCaughtKey(poke, null, showShiny)] || false}
                                        onMarkAll={onMarkAll}
                                        onToggleCaught={onToggleCaught}
                                        onSelect={onSelectPokemon || handlePokemonSelect}
                                        showShiny={showShiny}
                                        showForms={showForms}
                                        allowCollapse={true}
                                    />
                                );
                            })
                            : dexSections.map(section => {
                                const filteredMons = customFilterMons 
                                    ? customFilterMons(section.getList(), showForms)
                                    : section.getList().filter(mon => {
                                        if (!showForms && mon.formType) return false;
                                        return true;
                                    });
                                
                                if (!filteredMons.length) return null;

                                return (
                                    <DexSection
                                        readOnly={readOnly}
                                        caughtInfoMap={caughtInfoMap}
                                        updateCaughtInfo={updateCaughtInfo}
                                        key={section.key}
                                        sidebarOpen={sidebarOpen}
                                        title={section.title}
                                        pokemonList={filteredMons}
                                        caught={caught}
                                        isCaught={(poke) => (caught || {})[getCaughtKey(poke, null, showShiny)] || false}
                                        onMarkAll={onMarkAll}
                                        onToggleCaught={onToggleCaught}
                                        onSelect={onSelectPokemon || handlePokemonSelect}
                                        showShiny={showShiny}
                                        showForms={showForms}
                                        allowCollapse={true}
                                    />
                                );
                            })}
                    </>
                )}
            </div>

            {/* Sidebar - Only render when not in ViewDex mode (when viewingUsername is null) */}
            {!viewingUsername && (
                <Sidebar
                    open={sidebarOpen}
                    readOnly={readOnly}
                    pokemon={selectedPokemon}
                    onClose={handleSidebarClose}
                    caughtInfo={selectedPokemon ? caughtInfoMap[getCaughtKey(selectedPokemon, null, showShiny)] : null}
                    updateCaughtInfo={updateCaughtInfo || (() => {})}
                    showShiny={showShiny}
                    viewingUsername={viewingUsername}
                    onPokemonSelect={setSelectedPokemon}
                    externalLinkPreference={externalLinkPreference}
                />
            )}
        </>
    );
}
