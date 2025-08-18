import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import DexView from "../components/Dex/DexView";
import pokemonData from "../data/pokemon.json";
import formsData from "../data/forms.json";
import { getCaughtKey } from "../caughtStorage";
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

    // fetch the public caught map your API exposes
    useEffect(() => {
        setLoading('view-dex-data', true);
        (async () => {
            try {
                const data = await profileAPI.getPublicCaughtData(username);
                setCaughtInfoMap(data || {});
            } catch (error) {
                // Handle error silently
            } finally {
                setLoading('view-dex-data', false);
            }
        })();
    }, [username, setLoading]);

    // Fetch the viewed user's public profile to get their saved progress bars
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
            } catch (error) {
                // Handle error silently
                setProgressBars([]);
            } finally {
                setLoading('view-dex-profile', false);
            }
        })();
    }, [username, setLoading]);

    const allMons = [...pokemonData, ...formsData];

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
        "alpha"
    ];

    const dexSections = [
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

            // Custom filter function for public profile view
        const customFilterMons = (list, forceShowForms = false) => {
            return list.filter(pokemon => {
                // Respect forms toggle
                if (!forceShowForms && !showForms && pokemon.formType && pokemon.formType !== "main" && pokemon.formType !== "default") {
                    return false;
                }

                const caughtInfo = caughtInfoMap[getCaughtKey(pokemon)];

                // Search by name/dex
                if (filters.searchTerm) {
                    const term = filters.searchTerm.toLowerCase();
                    const nameMatch = pokemon.name.toLowerCase().includes(term);
                    const idStr = String(pokemon.id).padStart(4, "0");
                    const dexMatch = idStr.includes(term.replace(/^#/, ""));
                    
                    if (!nameMatch && !dexMatch) return false;
                }

                // Game filter
                if (filters.game && caughtInfo?.game !== filters.game) return false;
                
                // Ball filter
                if (filters.ball && caughtInfo?.ball !== filters.ball) return false;
                
                // Mark filter
                if (filters.mark && caughtInfo?.mark !== filters.mark) return false;
                
                // Method filter
                if (filters.method && caughtInfo?.method !== filters.method) return false;
                
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
            <div style={{ position: 'relative' }}>
                {(isLoading('view-dex-data') || isLoading('view-dex-profile')) && (
                    <LoadingSpinner 
                        overlay 
                        text="Loading..." 
                        variant="dots"
                    />
                )}
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
        );
}
