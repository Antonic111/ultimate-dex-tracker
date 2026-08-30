import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import DexView from "../components/Dex/DexView";
import Sidebar from "../components/Dex/PokemonSidebar";
import { Button } from "../components/Shared/Button";
import pokemonData from "../data/pokemon.json";
import formsData from "../utils/loadFormsData";
import { getCaughtKey, migrateOldCaughtData } from "../caughtStorage";
import { LoadingSpinner, SectionLoader } from "../components/Shared";
import { useLoading } from "../components/Shared/LoadingContext";
import { profileAPI } from "../utils/api";
import { isLegendary, isMythical, isUltraBeast, isPseudoLegendary, isPseudoLegendaryEvo, isSubLegendary, isStarter, isStarterEvo, isFossil, isFossilEvo, isBaby, isBabyEvo, isParadox, getPokemonCategory } from "../utils/pokemonCategories";
import { getEvolutionChainIds, findPokemon } from "../utils";
import { UNOBTAINABLE_SHINY_DEX_NUMBERS, UNOBTAINABLE_SHINY_FORM_NAMES, GO_EXCLUSIVE_SHINY_DEX_NUMBERS, GO_EXCLUSIVE_SHINY_FORM_NAMES, NO_OT_EXCLUSIVE_SHINY_DEX_NUMBERS, NO_OT_EXCLUSIVE_SHINY_FORM_NAMES } from "../data/blockedShinies";
import { getFilteredFormsData } from "../utils/dexPreferences";
import { getAvailableGamesForPokemonSidebar, normalizeGameName } from "../utils/pokemonAvailability";


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
        game: [],
        gameObtainable: [],
        ball: [],
        type: [],
        gen: [],
        mark: [],
        method: [],
        categories: [],
        caught: "",
        showEvolutions: false,
        showFullBox: false
    });
    const [toggles, setToggles] = useState(() => loadDexToggles());
    const togglesRef = useRef(toggles);
    togglesRef.current = toggles;

    const showShiny = toggles.showShiny;
    const showForms = toggles.showForms;

    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);

    const setShowShiny = useCallback(val => {
        if (val && (selectedPokemon?.formType === "mighty" || selectedPokemon?.stableId === "origin-ball-dialga-483" || selectedPokemon?.stableId === "origin-ball-palkia-484" || selectedPokemon?.stableId?.startsWith("origin-ball-"))) {
            setSelectedPokemon(null);
            setSidebarOpen(false);
        }
        const updated = { ...togglesRef.current, showShiny: val };
        setToggles(updated);
        localStorage.setItem("dexToggles", JSON.stringify(updated));

        // Dispatch custom event to notify App component
        window.dispatchEvent(new CustomEvent('dexTogglesChanged', { detail: updated }));
    }, [selectedPokemon]);

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

    // Auto-close sidebar on mighty or origin ball pokemon if switched to shiny
    useEffect(() => {
        if (showShiny && (selectedPokemon?.formType === "mighty" || selectedPokemon?.stableId === "origin-ball-dialga-483" || selectedPokemon?.stableId === "origin-ball-palkia-484" || selectedPokemon?.stableId?.startsWith("origin-ball-"))) {
            setSelectedPokemon(null);
            setSidebarOpen(false);
        }
    }, [showShiny, selectedPokemon]);
    const [profileOwnerPreferences, setProfileOwnerPreferences] = useState(null);
    const [viewedUserShinyCharmGames, setViewedUserShinyCharmGames] = useState([]);
    const [externalLinkPreference, setExternalLinkPreference] = useState('serebii');

    // Load external link preference from localStorage
    useEffect(() => {
        const savedPreference = localStorage.getItem('externalLinkPreference');
        if (savedPreference) {
            setExternalLinkPreference(savedPreference);
        }
    }, []);

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
                if ((user?.isProfilePublic === false || user?.isPrivate) && !user?.isPrivateAdminView) {
                    setIsPrivate(true);
                    return;
                }
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
                        showMightyForms: true,
                    });
                }

                // Store the viewed user's shiny charm games
                setViewedUserShinyCharmGames(user.shinyCharmGames || []);
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
                    showMightyForms: true,
                });
                // Reset shiny charm games on error
                setViewedUserShinyCharmGames([]);
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
        "mighty",
        "alcremie",
        "vivillon",
        "alpha",
        "alphaother"
    ];

    // Use the same filtering function from dexPreferences to ensure consistency
    const filteredFormsData = useMemo(() => {
        return profileOwnerPreferences
            ? getFilteredFormsData(formsData, profileOwnerPreferences)
            : formsData; // Show all forms while loading preferences
    }, [profileOwnerPreferences]);

    const allMons = useMemo(() => [...pokemonData, ...filteredFormsData], [filteredFormsData]);

    const dexSections = useMemo(() => [
        {
            key: "main",
            title: "Main Living Dex",
            getList: () => pokemonData
        },
        ...FORM_TYPES.map(type => {
            // Mighty forms cannot be shiny
            if (showShiny && type === 'mighty') return null;

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
                    case 'vivillon': shouldShow = profileOwnerPreferences.showVivillonForms; break;
                    case 'alpha': shouldShow = profileOwnerPreferences.showAlphaForms; break;
                    case 'alphaother': shouldShow = profileOwnerPreferences.showAlphaOtherForms; break;
                    case 'mighty': shouldShow = profileOwnerPreferences.showMightyForms; break;
                    default: shouldShow = true;
                }

                // Only create section if this form type should be shown
                if (!shouldShow) return null;
            }

            return {
                key: type,
                title: type === "alphaother" ? "Alpha Genders & Other's" : `${type.charAt(0).toUpperCase() + type.slice(1)} Forms`,
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
        }).filter(Boolean) // Remove null sections
    ], [filteredFormsData, profileOwnerPreferences]);

    // Custom filter function for public profile view
    const customFilterMons = useCallback((list, forceShowForms = false) => {
        // First, mark Pokemon as blocked based on profile owner's preferences
        const markedList = list.map(pokemon => {
            // Create a copy to avoid mutating the original
            const poke = { ...pokemon };

            // Mark shiny Pokemon as blocked based on PROFILE OWNER's preferences (not viewer's)
            // IMPORTANT: Only apply blocking to shiny Pokemon, never to non-shiny
            if (showShiny && profileOwnerPreferences) {
                // Check if Pokemon should be blocked by ID
                const isBlockedUnobtainableById = profileOwnerPreferences.blockUnobtainableShinies && UNOBTAINABLE_SHINY_DEX_NUMBERS.map(Number).includes(poke.id);
                const isBlockedGOById = profileOwnerPreferences.blockGOExclusiveShinies && GO_EXCLUSIVE_SHINY_DEX_NUMBERS.map(Number).includes(poke.id);
                const isBlockedNOOTById = profileOwnerPreferences.blockNOOTExclusiveShinies && NO_OT_EXCLUSIVE_SHINY_DEX_NUMBERS.map(Number).includes(poke.id);

                // Check if Pokemon should be blocked by form name (for forms that share the same ID)
                const pokemonName = poke.name?.toLowerCase() || "";
                const isBlockedUnobtainableByForm = profileOwnerPreferences.blockUnobtainableShinies && UNOBTAINABLE_SHINY_FORM_NAMES.some(formName => pokemonName === formName.toLowerCase());
                const isBlockedGOByForm = profileOwnerPreferences.blockGOExclusiveShinies && GO_EXCLUSIVE_SHINY_FORM_NAMES.some(formName => pokemonName === formName.toLowerCase());
                const isBlockedNOOTByForm = profileOwnerPreferences.blockNOOTExclusiveShinies && NO_OT_EXCLUSIVE_SHINY_FORM_NAMES.some(formName => pokemonName === formName.toLowerCase());

                const isBlockedUnobtainable = isBlockedUnobtainableById || isBlockedUnobtainableByForm;
                const isBlockedGO = isBlockedGOById || isBlockedGOByForm;
                const isBlockedNOOT = isBlockedNOOTById || isBlockedNOOTByForm;

                if (isBlockedUnobtainable || isBlockedGO || isBlockedNOOT) {
                    // If profile owner has hideLockedShinies enabled, filter out this Pokemon
                    if (profileOwnerPreferences.hideLockedShinies) {
                        return null; // Will be filtered out below
                    }
                    // Mark as blocked but don't filter out
                    poke._isBlocked = true;
                } else {
                    // Ensure not blocked if conditions aren't met
                    poke._isBlocked = false;
                }
            } else {
                // For non-shiny Pokemon, always ensure they are not blocked
                poke._isBlocked = false;
            }

            return poke;
        }).filter(poke => poke !== null);

        // Helper to test single Pokemon against filters
        const testPokemon = (pokemon) => {
            // When viewing someone else's dex, always show forms (respect their preferences)
            // The current user's showForms toggle doesn't apply to viewing other people's dexes
            if (pokemon.formType && pokemon.formType !== "main" && pokemon.formType !== "default") {
                // Check if this form type is enabled in the profile owner's preferences
                const formType = pokemon.formType;
                if (profileOwnerPreferences) {
                    switch (formType) {
                        case 'gender':
                            if (!profileOwnerPreferences.showGenderForms) return { match: false, isSearchMatch: false };
                            break;
                        case 'alolan':
                            if (!profileOwnerPreferences.showAlolanForms) return { match: false, isSearchMatch: false };
                            break;
                        case 'galarian':
                            if (!profileOwnerPreferences.showGalarianForms) return { match: false, isSearchMatch: false };
                            break;
                        case 'hisuian':
                            if (!profileOwnerPreferences.showHisuianForms) return { match: false, isSearchMatch: false };
                            break;
                        case 'paldean':
                            if (!profileOwnerPreferences.showPaldeanForms) return { match: false, isSearchMatch: false };
                            break;
                        case 'gmax':
                            if (!profileOwnerPreferences.showGmaxForms) return { match: false, isSearchMatch: false };
                            break;
                        case 'unown':
                            if (!profileOwnerPreferences.showUnownForms) return { match: false, isSearchMatch: false };
                            break;
                        case 'other':
                            if (!profileOwnerPreferences.showOtherForms) return { match: false, isSearchMatch: false };
                            break;
                        case 'alcremie':
                            if (!profileOwnerPreferences.showAlcremieForms) return { match: false, isSearchMatch: false };
                            break;
                        case 'vivillon':
                            if (!profileOwnerPreferences.showVivillonForms) return { match: false, isSearchMatch: false };
                            break;
                        case 'alpha':
                            if (!profileOwnerPreferences.showAlphaForms) return { match: false, isSearchMatch: false };
                            break;
                        case 'alphaother':
                            if (!profileOwnerPreferences.showAlphaOtherForms) return { match: false, isSearchMatch: false };
                            break;
                        case 'mighty':
                            if (!profileOwnerPreferences.showMightyForms) return { match: false, isSearchMatch: false };
                            break;
                        default:
                            break;
                    }
                }
            }

            // Mighty forms and Origin Ball forms cannot be shiny
            if (showShiny && (pokemon.formType === "mighty" || pokemon.stableId === "origin-ball-dialga-483" || pokemon.stableId === "origin-ball-palkia-484" || pokemon.stableId?.startsWith("origin-ball-"))) {
                return { match: false, isSearchMatch: false };
            }

            // Get caught info based on the current shiny toggle state
            const caughtInfo = caughtInfoMap[getCaughtKey(pokemon, null, showShiny)];
            const firstEntry = caughtInfo?.entries?.[0] || caughtInfo;

            let isSearchMatch = false;
            // Search by name/dex
            if (filters.searchTerm) {
                const term = filters.searchTerm.toLowerCase();
                const nameMatch = pokemon.name.toLowerCase().includes(term);
                const idStr = String(pokemon.id).padStart(4, "0");
                const dexMatch = idStr.includes(term.replace(/^#/, ""));

                if (nameMatch || dexMatch) {
                    isSearchMatch = true;
                } else if (filters.showEvolutions) {
                    const chainIds = getEvolutionChainIds(pokemon);
                    const chainMatches = chainIds.some(chainId => {
                        const chainPoke = findPokemon(chainId);
                        if (!chainPoke) return false;
                        const chainNameMatch = chainPoke.name.toLowerCase().includes(term);
                        const chainIdStr = String(chainPoke.id).padStart(4, "0");
                        const chainDexMatch = chainIdStr.includes(term.replace(/^#/, ""));
                        return chainNameMatch || chainDexMatch;
                    });
                    if (chainMatches) {
                        isSearchMatch = true;
                    }
                }

                if (!isSearchMatch) {
                    return { match: false, isSearchMatch: false };
                }
            } else {
                isSearchMatch = true;
            }

            // Game filter (multi-select)
            if (filters.game && filters.game.length > 0) {
                const matchesGame = filters.game.some(game => firstEntry?.game === game);
                if (!matchesGame) return { match: false, isSearchMatch: false };
            }
            // Game obtainable in (multi-select)
            if (filters.gameObtainable && filters.gameObtainable.length > 0) {
                const availableGames = getAvailableGamesForPokemonSidebar(pokemon, showShiny);
                const normalizedAvailable = new Set(availableGames.map(normalizeGameName));
                const matchesGame = filters.gameObtainable.some(game =>
                    normalizedAvailable.has(normalizeGameName(game))
                );
                if (!matchesGame) return { match: false, isSearchMatch: false };
            }

            // Ball filter (multi-select)
            if (filters.ball && filters.ball.length > 0) {
                const matchesBall = filters.ball.some(ball => firstEntry?.ball === ball);
                if (!matchesBall) return { match: false, isSearchMatch: false };
            }

            // Mark filter (multi-select)
            if (filters.mark && filters.mark.length > 0) {
                const matchesMark = filters.mark.some(mark => firstEntry?.mark === mark);
                if (!matchesMark) return { match: false, isSearchMatch: false };
            }

            // Method filter (multi-select)
            if (filters.method && filters.method.length > 0) {
                const matchesMethod = filters.method.some(method => firstEntry?.method === method);
                if (!matchesMethod) return { match: false, isSearchMatch: false };
            }

            // Type filter (multi-select - supports dual-type)
            if (filters.type && filters.type.length > 0) {
                const isDualType = filters.type.includes("dual-type");
                const pureTypes = filters.type.filter(t => t !== "dual-type");
                const pokeTypes = pokemon.types || [];

                if (isDualType) {
                    if (pokeTypes.length < 2) return { match: false, isSearchMatch: false };
                    if (pureTypes.length === 2) {
                        const hasBoth = pureTypes.every(t => pokeTypes.includes(t));
                        if (!hasBoth) return { match: false, isSearchMatch: false };
                    } else if (pureTypes.length === 1) {
                        if (!pokeTypes.includes(pureTypes[0])) return { match: false, isSearchMatch: false };
                    }
                } else {
                    const matchesType = pureTypes.some(type => pokeTypes.includes(type));
                    if (!matchesType) return { match: false, isSearchMatch: false };
                }
            }

            // Generation filter (multi-select)
            if (filters.gen && filters.gen.length > 0) {
                const matchesGen = filters.gen.some(gen => String(pokemon.gen) === String(gen));
                if (!matchesGen) return { match: false, isSearchMatch: false };
            }

            // Caught/uncaught/failed filter
            const isCaught = !!(caughtInfo && caughtInfo.caught !== false && (caughtInfo.entries?.length > 0 || caughtInfo.caught === true));
            const hasFail = Boolean(caughtInfo?.fails && caughtInfo.fails.length > 0);
            if (filters.caught === "caught" && !isCaught) return { match: false, isSearchMatch: false };
            if (filters.caught === "uncaught" && isCaught) return { match: false, isSearchMatch: false };
            if (filters.caught === "failed" && !hasFail) return { match: false, isSearchMatch: false };

            // Category filtering
            if (filters.categories && filters.categories.length > 0) {
                const matchesAnyCategory = filters.categories.some(category => {
                    switch (category) {
                        case "legendary":
                            return isLegendary(pokemon);
                        case "mythical":
                            return isMythical(pokemon);
                        case "ultra-beast":
                            return isUltraBeast(pokemon);
                        case "pseudo-legendary":
                            return isPseudoLegendary(pokemon) || (filters.showEvolutions && isPseudoLegendaryEvo(pokemon));
                        case "sub-legendary":
                            return isSubLegendary(pokemon);
                        case "paradox":
                            return isParadox(pokemon);
                        case "starter":
                            return isStarter(pokemon) || (filters.showEvolutions && isStarterEvo(pokemon));
                        case "fossil":
                            return isFossil(pokemon) || (filters.showEvolutions && isFossilEvo(pokemon));
                        case "baby":
                            return isBaby(pokemon) || (filters.showEvolutions && isBabyEvo(pokemon));
                        default:
                            return false;
                    }
                });

                if (!matchesAnyCategory) return { match: false, isSearchMatch: false };
            }

            return { match: true, isSearchMatch };
        };

        // When Show Full Box and a search term are active, chunk into boxes of 30 and keep full boxes that contain matches
        if (filters.searchTerm && filters.showFullBox) {
            const boxSize = 30;
            const result = [];
            for (let i = 0; i < markedList.length; i += boxSize) {
                const boxIndex = Math.floor(i / boxSize);
                const boxSlice = markedList.slice(i, i + boxSize);
                const testedBox = boxSlice.map(p => {
                    const res = testPokemon(p);
                    return {
                        ...p,
                        _isSearchMatch: res.match && res.isSearchMatch,
                        _boxIndex: boxIndex
                    };
                });

                const hasMatch = testedBox.some(p => p._isSearchMatch);
                if (hasMatch) {
                    result.push(...testedBox);
                }
            }
            return result;
        }

        // Then apply standard filtering logic
        return markedList.filter(pokemon => {
            const res = testPokemon(pokemon);
            return res.match;
        });
    }, [filters, profileOwnerPreferences, showShiny]);

    if (isPrivate) {
        return (
            <div className="page-container fade-in-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '65vh' }}>
                <div className="stats-private-card">
                    <Lock className="stats-private-icon" />
                    <h2>This Profile is Private</h2>
                    <p>{username}'s Pokédex collection is hidden by their privacy settings.</p>
                    <Button
                        as={Link}
                        to="/trainers"
                        variant="secondary"
                        size="sm"
                        className="stats-back-btn"
                        icon={<ArrowLeft size={16} />}
                    >
                        Back to Trainers
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <DexView
                viewingUsername={username}
                allMons={allMons}
                caught={caughtInfoMap}
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
                customFilterMons={customFilterMons}
                externalLinkPreference={externalLinkPreference}
                viewedUserShinyCharmGames={viewedUserShinyCharmGames}
                profileOwnerDexPreferences={profileOwnerPreferences}
            />

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
                caughtInfoMap={caughtInfoMap}
                updateCaughtInfo={() => { }} // No-op for read-only mode
                showShiny={showShiny}
                viewingUsername={username}
                onPokemonSelect={setSelectedPokemon}
                externalLinkPreference={externalLinkPreference}
                dexPreferences={profileOwnerPreferences}
            />
        </>
    );
}
