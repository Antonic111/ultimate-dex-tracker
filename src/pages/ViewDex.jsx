import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import DexView from "../components/Dex/DexView";
import Sidebar from "../components/Dex/PokemonSidebar";
import pokemonData from "../data/pokemon.json";
import formsData from "../data/forms.json";
import { getCaughtKey, migrateOldCaughtData } from "../caughtStorage";
import { LoadingSpinner, SkeletonLoader } from "../components/Shared";
import { useLoading } from "../components/Shared/LoadingContext";
import { profileAPI } from "../utils/api";


// Helper function to load the viewer's own dex toggle preferences
function loadDexToggles() {
    const raw = localStorage.getItem("dexToggles");
    if (!raw) return { showShiny: false, showForms: true };
    try { return JSON.parse(raw); } catch { return { showShiny: false, showForms: true }; }
}

export default function ViewDex() {
    const { username } = useParams();
    const { setLoading, isLoading } = useLoading();
    const [caughtInfoMap, setCaughtInfoMap] = useState({});
    const [progressBars, setProgressBars] = useState([]);
    const [filters, setFilters] = useState({
        searchTerm: "",
        game: "",
        ball: "",
        type: "",
        gen: "",
        mark: "",
        method: "",
        caught: ""
    });
    const [toggles, setToggles] = useState(() => loadDexToggles());
    const togglesRef = useRef(toggles);
    togglesRef.current = toggles;
    
    const showShiny = toggles.showShiny;
    const showForms = toggles.showForms;
    
    // Debug logging for toggle state
    
    const setShowShiny = useCallback(val => {
        const updated = { ...togglesRef.current, showShiny: val };
        setToggles(updated);
        localStorage.setItem("dexToggles", JSON.stringify(updated));
        
        // Dispatch custom event to notify App component
        window.dispatchEvent(new CustomEvent('dexTogglesChanged', { detail: updated }));
    }, []);
    
    const setShowForms = useCallback(val => {
        const updated = { ...togglesRef.current, showForms: val };
        setToggles(updated);
        localStorage.setItem("dexToggles", JSON.stringify(updated));
        
        // Dispatch custom event to notify App component
        window.dispatchEvent(new CustomEvent('dexTogglesChanged', { detail: updated }));
    }, []);
    
    // Sync localStorage changes from other tabs/windows and custom events from App
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === "dexToggles") {
                try {
                    const newToggles = JSON.parse(e.newValue || "{}");
                    setToggles(prev => ({ ...prev, ...newToggles }));
                } catch (error) {
                    // Handle error silently
                }
            }
        };
        
        const handleToggleChange = (e) => {
            setToggles(prev => ({ ...prev, ...e.detail }));
        };
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('dexTogglesChanged', handleToggleChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('dexTogglesChanged', handleToggleChange);
        };
    }, []);
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOwnerPreferences, setProfileOwnerPreferences] = useState(null);

    // fetch the public caught map your API exposes
    useEffect(() => {
        setLoading('view-dex-data', true);
        (async () => {
            try {
                const data = await profileAPI.getPublicCaughtData(username);
                const caughtData = data?.caughtPokemon || {};
                
                // Migrate old data format to new entries format if needed
                const migratedData = migrateOldCaughtData(caughtData);
                setCaughtInfoMap(migratedData);
            } catch (error) {
                // Handle error silently
            } finally {
                setLoading('view-dex-data', false);
            }
        })();
    }, [username, setLoading]);

    // Fetch the viewed user's public profile to get their saved progress bars and dex preferences
    useEffect(() => {
        setLoading('view-dex-profile', true);
        (async () => {
            try {
                const user = await profileAPI.getPublicProfile(username);
                const bars = Array.isArray(user.progressBars) ? user.progressBars : [];
                // Update progress bars when they change
                if (bars && bars.length > 0) {
                    setProgressBars(bars);
                }
                
                // Store the profile owner's dex preferences
                if (user.dexPreferences) {
                    setProfileOwnerPreferences(user.dexPreferences);
                } else {
                    // Use default preferences if none are set
                    setProfileOwnerPreferences({
                        showGenderForms: true,
                        showAlolanForms: true,
                        showGalarianForms: true,
                        showHisuianForms: true,
                        showPaldeanForms: true,
                        showGmaxForms: true,
                        showUnownForms: true,
                        showOtherForms: true,
                        showAlcremieForms: true,
                        showVivillonForms: true,
                        showAlphaForms: true,
                        showAlphaOtherForms: true,
                    });
                }
            } catch (error) {
                // Handle error silently
                setProgressBars([]);
                // Set default preferences on error
                setProfileOwnerPreferences({
                    showGenderForms: true,
                    showAlolanForms: true,
                    showGalarianForms: true,
                    showHisuianForms: true,
                    showPaldeanForms: true,
                    showGmaxForms: true,
                    showUnownForms: true,
                    showOtherForms: true,
                        showAlcremieForms: true,
                        showVivillonForms: true,
                        showAlphaForms: true,
                        showAlphaOtherForms: true,
                });
            } finally {
                setLoading('view-dex-profile', false);
            }
        })();
    }, [username, setLoading]);

    // Create dex sections structure for ViewDex
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

    // Get filtered forms data based on profile owner's preferences
    const getFilteredFormsDataForProfile = (forms, preferences) => {
        if (!preferences || !forms) return forms;
        return forms.filter(form => {
            const formType = form.formType;
            switch (formType) {
                case 'gender': return preferences.showGenderForms;
                case 'alolan': return preferences.showAlolanForms;
                case 'galarian': return preferences.showGalarianForms;
                case 'hisuian': return preferences.showHisuianForms;
                case 'paldean': return preferences.showPaldeanForms;
                case 'gmax': return preferences.showGmaxForms;
                case 'unown': return preferences.showUnownForms;
                case 'other': return preferences.showOtherForms;
                case 'alcremie': return preferences.showAlcremieForms;
                case 'vivillon': return preferences.showVivillonForms;
                case 'alpha': return preferences.showAlphaForms;
                case 'alphaother': return preferences.showAlphaOtherForms;
                default: return true;
            }
        });
    };

    const filteredFormsData = profileOwnerPreferences 
        ? getFilteredFormsDataForProfile(formsData, profileOwnerPreferences)
        : formsData; // Show all forms while loading preferences

    const allMons = [...pokemonData, ...filteredFormsData];

    const dexSections = [
        {
            key: "main",
            title: "Main Living Dex",
            getList: () => pokemonData
        },
        ...FORM_TYPES.map(type => {
            // Check if this form type should be shown based on profile owner's preferences
            if (profileOwnerPreferences) {
                let shouldShow = false;
                switch (type) {
                    case 'gender': shouldShow = profileOwnerPreferences.showGenderForms; break;
                    case 'alolan': shouldShow = profileOwnerPreferences.showAlolanForms; break;
                    case 'galarian': shouldShow = profileOwnerPreferences.showGalarianForms; break;
                    case 'hisuian': shouldShow = profileOwnerPreferences.showHisuianForms; break;
                    case 'paldean': shouldShow = profileOwnerPreferences.showPaldeanForms; break;
                    case 'gmax': shouldShow = profileOwnerPreferences.showGmaxForms; break;
                    case 'unown': shouldShow = profileOwnerPreferences.showUnownForms; break;
                    case 'other': shouldShow = profileOwnerPreferences.showOtherForms; break;
                    case 'alcremie': shouldShow = profileOwnerPreferences.showAlcremieForms; break;
                    case 'alpha': shouldShow = profileOwnerPreferences.showAlphaForms; break;
                    case 'alphaother': shouldShow = profileOwnerPreferences.showAlphaOtherForms; break;
                    default: shouldShow = true;
                }
                
                // Only create section if this form type should be shown
                if (!shouldShow) return null;
            }
            
            return {
                key: type,
                title: type === "alphaother" ? "Alpha Genders & Other's" : `${type.charAt(0).toUpperCase() + type.slice(1)} Forms`,
                getList: () => filteredFormsData.filter(p => p.formType === type)
            };
        }).filter(Boolean) // Remove null sections
    ];

            // Custom filter function for public profile view
        const customFilterMons = (list, forceShowForms = false) => {
            return list.filter(pokemon => {
                // When viewing someone else's dex, always show forms (respect their preferences)
                // The current user's showForms toggle doesn't apply to viewing other people's dexes
                if (pokemon.formType && pokemon.formType !== "main" && pokemon.formType !== "default") {
                    // Check if this form type is enabled in the profile owner's preferences
                    const formType = pokemon.formType;
                    if (profileOwnerPreferences) {
                        switch (formType) {
                            case 'gender': 
                                if (!profileOwnerPreferences.showGenderForms) return false;
                                break;
                            case 'alolan': 
                                if (!profileOwnerPreferences.showAlolanForms) return false;
                                break;
                            case 'galarian': 
                                if (!profileOwnerPreferences.showGalarianForms) return false;
                                break;
                            case 'hisuian': 
                                if (!profileOwnerPreferences.showHisuianForms) return false;
                                break;
                            case 'paldean': 
                                if (!profileOwnerPreferences.showPaldeanForms) return false;
                                break;
                            case 'gmax': 
                                if (!profileOwnerPreferences.showGmaxForms) return false;
                                break;
                            case 'unown': 
                                if (!profileOwnerPreferences.showUnownForms) return false;
                                break;
                            case 'other': 
                                if (!profileOwnerPreferences.showOtherForms) return false;
                                break;
                            case 'alcremie': 
                                if (!profileOwnerPreferences.showAlcremieForms) return false;
                                break;
                            case 'vivillon': 
                                if (!profileOwnerPreferences.showVivillonForms) return false;
                                break;
                            case 'alpha': 
                                if (!profileOwnerPreferences.showAlphaForms) return false;
                                break;
                            case 'alphaother': 
                                if (!profileOwnerPreferences.showAlphaOtherForms) return false;
                                break;
                            default: 
                                break;
                        }
                    }
                }

                // Get caught info based on the current shiny toggle state
                const caughtInfo = caughtInfoMap[getCaughtKey(pokemon, null, showShiny)];
                
                // Get the first entry for filtering (or use old structure for backward compatibility)
                const firstEntry = caughtInfo?.entries?.[0] || caughtInfo;

                // Search by name/dex
                if (filters.searchTerm) {
                    const term = filters.searchTerm.toLowerCase();
                    const nameMatch = pokemon.name.toLowerCase().includes(term);
                    const idStr = String(pokemon.id).padStart(4, "0");
                    const dexMatch = idStr.includes(term.replace(/^#/, ""));
                    
                    if (!nameMatch && !dexMatch) return false;
                }

                // Game filter
                if (filters.game && firstEntry?.game !== filters.game) return false;
                
                // Ball filter
                if (filters.ball && firstEntry?.ball !== filters.ball) return false;
                
                // Mark filter
                if (filters.mark && firstEntry?.mark !== filters.mark) return false;
                
                // Method filter
                if (filters.method && firstEntry?.method !== filters.method) return false;
                
                // Type filter
                if (filters.type && !pokemon.types?.includes(filters.type)) return false;
                
                // Generation filter
                if (filters.gen && String(pokemon.gen) !== String(filters.gen)) return false;
                
                // Caught/uncaught filter
                const isCaught = !!caughtInfo;
                if (filters.caught === "caught" && !isCaught) return false;
                if (filters.caught === "uncaught" && isCaught) return false;
                
                return true;
            });
        };

        return (
            <>
                <div className="page-container">
                    <DexView
                        viewingUsername={username}
                        allMons={allMons}
                        caughtInfoMap={caughtInfoMap}
                        dexSections={dexSections}
                        progressBarsOverride={progressBars}
                        filters={filters}
                        setFilters={setFilters}
                        showShiny={showShiny}
                        setShowShiny={setShowShiny}
                        showForms={showForms}
                        setShowForms={setShowForms}
                        selectedPokemon={selectedPokemon}
                        setSelectedPokemon={setSelectedPokemon}
                        sidebarOpen={sidebarOpen}
                        setSidebarOpen={setSidebarOpen}
                        readOnly={true}
                        title={`${username}'s Living Dex`}
                        caught={caughtInfoMap}
                        customFilterMons={customFilterMons}
                    />
                </div>
                
                {/* Sidebar - rendered outside page container to avoid stacking context issues */}
                <Sidebar
                    open={sidebarOpen}
                    readOnly={true}
                    pokemon={selectedPokemon}
                    onClose={() => {
                        setSidebarOpen(false);
                        setSelectedPokemon(null);
                    }}
                    caughtInfo={selectedPokemon ? caughtInfoMap[getCaughtKey(selectedPokemon, null, showShiny)] : null}
                    updateCaughtInfo={() => {}} // No-op for read-only mode
                    showShiny={showShiny}
                    viewingUsername={username}
                />
            </>
        );
}
