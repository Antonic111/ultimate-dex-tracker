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

const typeOptions = [
    "normal", "fire", "water", "grass", "electric", "ice", "fighting", "poison", "ground", "flying",
    "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

const GEN_OPTIONS = Array.from(new Set([
    ...pokemonData.map(p => p.gen),
    ...formsData.map(p => p.gen),
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
        "alpha"
    ];

    return [
        {
            key: "main",
            title: "Main Living Dex",
            getList: () => pokemonData
        },
        ...FORM_TYPES.map(type => ({
            key: type,
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} Forms`,
            getList: () => formsData.filter(p => p.formType === type)
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
        if (!pokemonList) return [];
        
        const sections = createDexSections();
        return sections.map(section => {
            const sectionPokemon = pokemonList.filter(pokemon => {
                if (section.key === "main") {
                    return !pokemon.formType; // Main Pokémon have no formType
                } else {
                    return pokemon.formType === section.key;
                }
            });
            
            return {
                ...section,
                getList: () => sectionPokemon
            };
        }).filter(section => section.getList().length > 0); // Only show sections with Pokémon
    };
    
    // Get suggestion for no results - using the EXACT same logic as App.jsx
    const getSuggestion = () => {
        if (!filters.searchTerm?.trim()) return "";
        
        const searchTerm = filters.searchTerm.toLowerCase();
        let allNames = [];
        
        if (shouldUseCustomList) {
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
    
    // Show no results when there's a search term and no results found
    // Use the showNoResults prop if provided (from App.jsx), otherwise use local logic
    const shouldShowNoResults = (showNoResults !== undefined) 
        ? showNoResults 
        : (!!filters.searchTerm?.trim() && (
            shouldUseCustomList 
                ? pokemonList.length === 0 
                : dexSections.every(section => {
                    const filteredMons = customFilterMons 
                        ? customFilterMons(section.getList(), showForms)
                        : section.getList().filter(mon => {
                            if (!showForms && mon.formType) return false;
                            return true;
                        });
                    return filteredMons.length === 0;
                })
        ));
    
    // Check if we actually have no results to show
    // This should work for both owner and viewer modes
    const hasNoResults = !!filters.searchTerm?.trim() && (
        shouldUseCustomList 
            ? pokemonList.length === 0  // Viewer mode: no Pokémon in the list
            : shouldShowNoResults       // Owner mode: use the showNoResults logic
    );

    // Debug logging to see what's happening
    console.log('DexView Debug:', {
        searchTerm: filters.searchTerm,
        shouldUseCustomList,
        pokemonListLength: pokemonList?.length || 0,
        shouldShowNoResults,
        hasNoResults,
        finalSuggestion
    });

    return (
        <>
            {/* Profile Header - Only show when viewing someone else's profile */}
            {viewingUsername && (
                <div className="profile-viewing-header">
                    <h1>Viewing <span className="username">{viewingUsername}'s</span> Profile</h1>
                </div>
            )}
            
            {/* Progress Manager */}
            <ProgressManager 
                allMons={allMons} 
                caughtInfoMap={caughtInfoMap} 
                readOnly={readOnly}
                progressBarsOverride={progressBarsOverride}
            />
            
            {/* Search Bar */}
            <SearchBar
                filters={filters}
                setFilters={setFilters}
                typeOptions={typeOptions}
                genOptions={GEN_OPTIONS}
                showShiny={showShiny}
                setShowShiny={setShowShiny}
                showForms={showForms}
                setShowForms={setShowForms}
            />

            {/* No Results Message - Show for both owner and viewer modes when there are no results */}
            {hasNoResults && (
                <NoResults
                    searchTerm={filters.searchTerm}
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
            <div className="main-bg">
                {shouldUseCustomList ? (
                    // ViewDex mode - organized sections with custom list
                    getViewDexSections().map(section => {
                        const sectionPokemon = section.getList();
                        if (!sectionPokemon.length) return null;

                        return (
                            <DexSection
                                key={section.key}
                                readOnly={true} // Keep Pokémon slots read-only
                                allowCollapse={true} // Allow collapsing sections
                                title={section.title}
                                pokemonList={sectionPokemon}
                                caughtInfoMapOverride={caughtInfoMap}
                                onSelect={handlePokemonSelect}
                                showShiny={showShiny}
                                showForms={showForms}
                                // Pass through the caught state for proper display
                                caught={caught || {}}
                                // Pass through update functions (will be no-ops in read-only mode)
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

            {/* Sidebar */}
            <Sidebar
                open={sidebarOpen}
                readOnly={readOnly}
                pokemon={selectedPokemon}
                onClose={handleSidebarClose}
                caughtInfo={selectedPokemon ? caughtInfoMap[getCaughtKey(selectedPokemon)] : null}
                updateCaughtInfo={updateCaughtInfo || (() => {})}
                showShiny={showShiny}
                viewingUsername={viewingUsername}
            />
        </>
    );
}
