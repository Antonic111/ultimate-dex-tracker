import { Eye, EyeOff, ListCollapse, Pencil, Plus, Settings, Trash2, ChevronUp, ChevronDown, RotateCcw, Check, SlidersHorizontal, Sparkles, Flame, Hash, Shapes, Crown } from "lucide-react";
import { useEffect, useState, useContext, useRef, useMemo } from "react";
import { getCaughtKey } from "../../caughtStorage";

import { BALL_OPTIONS, GAME_OPTIONS, MARK_OPTIONS } from "../../Constants";
import { UNOBTAINABLE_SHINY_DEX_NUMBERS, UNOBTAINABLE_SHINY_FORM_NAMES, GO_EXCLUSIVE_SHINY_DEX_NUMBERS, GO_EXCLUSIVE_SHINY_FORM_NAMES, NO_OT_EXCLUSIVE_SHINY_DEX_NUMBERS, NO_OT_EXCLUSIVE_SHINY_FORM_NAMES } from "../../data/blockedShinies";
import { isNonPartnerCapPikachu } from "../../utils/pokemonAvailability";
import { isLegendary, isSubLegendary, isMythical, isUltraBeast, isPseudoLegendary, isPseudoLegendaryEvo, isParadox, isStarter, isStarterEvo, isFossil, isFossilEvo, isBaby, isBabyEvo, getPokemonCategories } from "../../utils/pokemonCategories";
import SelectField from "../Shared/FormField/SelectField";
import ProgressBar from "./ProgressBar";
import "../../css/ProgressBar.css";
// Removed SortableItem import - using arrow controls instead
import { UserContext, useUser } from "../Shared/UserContext";
import { useMessage } from "../Shared/MessageContext";
import { validateContent } from "../../../shared/contentFilter";
import { progressAPI } from '../../utils/api';
import { Modal, ConfirmModal } from "../Shared/Modal";
import { Button } from "../Shared/Button";

const DEFAULT_BARS = [
    {
        id: "default_all",
        name: "All Pokémon",
        filters: {},
        visible: true,
    },
];

const TEMPLATE_PRESETS = [
    {
        id: "template_marks",
        name: "Marks Progress",
        filters: { tally: "mark" },
        visible: true,
        __locked: true,
    },
    {
        id: "template_balls",
        name: "Balls Progress",
        filters: { tally: "ball" },
        visible: true,
        __locked: true,
    },
    {
        id: "template_game",
        name: "Caught in Each Game",
        filters: { tally: "game" },
        visible: true,
        __locked: true,
    }
];

const MAX_CUSTOM_BARS = 8;

const FORM_TYPE_OPTIONS = [
    { label: "Main", value: "main" },
    { label: "Forms", value: "forms" },
    { label: "Gender", value: "gender" },
    { label: "Alolan", value: "alolan" },
    { label: "Galarian", value: "galarian" },
    { label: "Gmax", value: "gmax" },
    { label: "Hisuian", value: "hisuian" },
    { label: "Paldean", value: "paldean" },
    { label: "Unown", value: "unown" },
    { label: "Other", value: "other" },
    { label: "Alcremie", value: "alcremie" },
    { label: "Alpha", value: "alpha" },
    { label: "Alpha Genders & Other's", value: "alphaother" },
];

const GEN_OPTIONS = [
    { label: "Gen 1", value: "1" },
    { label: "Gen 2", value: "2" },
    { label: "Gen 3", value: "3" },
    { label: "Gen 4", value: "4" },
    { label: "Gen 5", value: "5" },
    { label: "Gen 6", value: "6" },
    { label: "Gen 7", value: "7" },
    { label: "Gen 8", value: "8" },
    { label: "Gen 9", value: "9" },
];

const TYPE_OPTIONS = [
    "normal", "fire", "water", "grass", "electric", "ice",
    "fighting", "poison", "ground", "flying", "psychic", "bug",
    "rock", "ghost", "dragon", "dark", "steel", "fairy"
].map(t => ({
    label: t.charAt(0).toUpperCase() + t.slice(1),
    value: t,
    image: `/type-icons/${t.toLowerCase()}.png`,
    isType: true
}));

const CATEGORY_OPTIONS = getPokemonCategories().map(c => ({
    label: c.name || c.label,
    value: c.value,
}));

function loadFullCaughtMap() {
    const caughtMap = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("caughtInfo_")) {
            const id = key.replace("caughtInfo_", "");
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data) caughtMap[id] = data;
            } catch (e) {
                console.error("Failed to parse localStorage for", key, e);
            }
        }
    }
    return caughtMap;
}

export default function ProgressManager({ allMons, caughtInfoMap, readOnly = false, progressBarsOverride = null, showShiny = false, dexPreferences = null, showLockedCheckbox = false }) {
    const userContext = useContext(UserContext);
    const { username, progressBars: contextSavedBars = [] } = userContext;
    const { showMessage } = useMessage();

    // Use refs to track previous values and prevent infinite loops
    const prevProgressBarsOverride = useRef(progressBarsOverride);
    const prevContextSavedBars = useRef(contextSavedBars);

    // Initialize bars based on whether we have override data or not
    const getInitialBars = () => {
        const savedBars = Array.isArray(progressBarsOverride)
            ? (progressBarsOverride.length > 0 ? progressBarsOverride : DEFAULT_BARS)
            : (contextSavedBars.length > 0 ? contextSavedBars : DEFAULT_BARS);

        // Apply __locked logic to initial bars
        return savedBars.map((bar) => {
            // Check if this bar matches any template preset by multiple criteria
            const isTemplate = TEMPLATE_PRESETS.some((tpl) => {
                // Match by tally type
                if (bar.filters?.tally && tpl.filters?.tally === bar.filters.tally) {
                    return true;
                }
                // Match by name (fallback for existing bars)
                if (bar.name === tpl.name) {
                    return true;
                }
                return false;
            });

            // If it's already marked as locked or matches a template, keep it locked
            const shouldBeLocked = bar.__locked === true || isTemplate;


            return { ...bar, __locked: shouldBeLocked };
        });
    };

    const [bars, setBars] = useState(getInitialBars());
    const [editingBars, setEditingBars] = useState([]); // New state for editing
    const [deleteModal, setDeleteModal] = useState({ show: false, index: null, barName: '' });
    const [showResetModal, setShowResetModal] = useState(false);
    const [deleteModalClosing, setDeleteModalClosing] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Track changes
    // Removed drag state - using arrow controls instead

    const caughtMap = caughtInfoMap;

    // Filter allMons based on dex preferences to only count visible forms
    // This ensures progress bars only count Pokémon that are actually visible to the user
    const visibleMons = useMemo(() => {
        if (!dexPreferences || !allMons) return allMons;

        const filtered = allMons.filter(pokemon => {
            // Always include main Pokémon (no formType or formType is "main"/"default")
            if (!pokemon.formType || pokemon.formType === "main" || pokemon.formType === "default") {
                return true;
            }

            // Check if this form type is enabled in preferences
            const formType = pokemon.formType;
            switch (formType) {
                case 'gender': return dexPreferences.showGenderForms;
                case 'alolan': return dexPreferences.showAlolanForms;
                case 'galarian': return dexPreferences.showGalarianForms;
                case 'hisuian': return dexPreferences.showHisuianForms;
                case 'paldean': return dexPreferences.showPaldeanForms;
                case 'gmax': return dexPreferences.showGmaxForms;
                case 'unown': return dexPreferences.showUnownForms;
                case 'other': return dexPreferences.showOtherForms;
                case 'alcremie': return dexPreferences.showAlcremieForms;
                case 'vivillon': return dexPreferences.showVivillonForms;
                case 'alpha': return dexPreferences.showAlphaForms;
                case 'alphaother': return dexPreferences.showAlphaOtherForms;
                case 'mighty': return dexPreferences.showMightyForms;
                default: return true;
            }
        });

        return filtered;
    }, [allMons, dexPreferences]);





    // Determine which saved bars to use: override (viewer) or context (owner)
    const savedBars = Array.isArray(progressBarsOverride) ? progressBarsOverride : contextSavedBars;

    // Sync bars when saved bars updates
    useEffect(() => {
        // Only update if the actual data has changed
        // Use JSON.stringify for deep comparison to avoid infinite loops when parent passes new array references with same content
        const progressBarsChanged = JSON.stringify(prevProgressBarsOverride.current) !== JSON.stringify(progressBarsOverride);
        const contextBarsChanged = JSON.stringify(prevContextSavedBars.current) !== JSON.stringify(contextSavedBars);

        if (!progressBarsChanged && !contextBarsChanged) {
            return; // No changes, skip update
        }

        // Update refs
        prevProgressBarsOverride.current = progressBarsOverride;
        prevContextSavedBars.current = contextSavedBars;

        if (savedBars && savedBars.length > 0) {
            const withLocked = savedBars.map((bar) => {
                // Check if this bar matches any template preset by multiple criteria
                const isTemplate = TEMPLATE_PRESETS.some((tpl) => {
                    // Match by tally type
                    if (bar.filters?.tally && tpl.filters?.tally === bar.filters.tally) {
                        return true;
                    }
                    // Match by name (fallback for existing bars)
                    if (bar.name === tpl.name) {
                        return true;
                    }
                    return false;
                });

                // If it's already marked as locked or matches a template, keep it locked
                const shouldBeLocked = bar.__locked === true || isTemplate;


                return { ...bar, __locked: shouldBeLocked };
            });
            setBars(withLocked);
        } else if (Array.isArray(progressBarsOverride) && progressBarsOverride.length === 0) {
            // If progressBarsOverride is explicitly an empty array, show default bars
            setBars(DEFAULT_BARS);
        } else if (!progressBarsOverride && contextSavedBars.length === 0) {
            // Only show default bars if we're not in override mode and have no saved bars
            setBars(DEFAULT_BARS);
        }
    }, [savedBars, progressBarsOverride, contextSavedBars]);


    // Arrow key reorder functions
    function moveBarUp(index) {
        if (index > 0) {
            const newBars = [...editingBars];
            [newBars[index - 1], newBars[index]] = [newBars[index], newBars[index - 1]];
            setEditingBars(newBars);
            setHasUnsavedChanges(true);
        }
    }

    function moveBarDown(index) {
        if (index < editingBars.length - 1) {
            const newBars = [...editingBars];
            [newBars[index], newBars[index + 1]] = [newBars[index + 1], newBars[index]];
            setEditingBars(newBars);
            setHasUnsavedChanges(true);
        }
    }

    const { setUser } = useUser();

    async function saveBarsToProfile(updatedBars) {
        const cleanBars = updatedBars.map(bar => ({
            id: bar.id,
            name: bar.name,
            visible: bar.visible,
            filters: bar.filters || {}, // ✅ ENSURE FILTERS IS INCLUDED
            __locked: bar.__locked || false, // ✅ PRESERVE LOCKED STATUS
        }));

        try {
            await progressAPI.updateProgressBars(cleanBars);

            // ✅ UPDATE USER CONTEXT so progress bars persist during SPA navigation
            // This fixes the iOS Safari issue where bars reset after navigating away and back
            // Note: We need to pass a full user object since handleUserUpdate doesn't support functional updates
            setUser({
                username: userContext.username,
                email: userContext.email,
                createdAt: userContext.createdAt,
                profileTrainer: userContext.profileTrainer,
                verified: userContext.verified,
                progressBars: cleanBars,
            });
        } catch (err) {
            console.error("❌ Error saving bars:", err);
        }
    }



    const [showSettings, setShowSettings] = useState(false);
    const [collapsed, setCollapsed] = useState(true);

    // New functions for save/cancel system
    function openEditModal() {
        // Collapse all open filters and set editing state
        const collapsedBars = bars.map(bar => ({
            ...bar,
            __showFilters: false,
            // Ensure __locked property is preserved for template bars
            __locked: bar.__locked || false,
        }));
        setEditingBars(collapsedBars);
        setHasUnsavedChanges(false);
        setShowSettings(true);
    }

    function saveChanges() {
        // Validate all progress bar names before saving
        const validationErrors = [];

        editingBars.forEach((bar, index) => {
            if (bar.__locked) return; // Skip template bars

            // Use the comprehensive content filter system
            const validation = validateContent(bar.name, 'progressBar');
            if (!validation.isValid) {
                validationErrors.push(`Progress bar "${bar.name}": ${validation.error}`);
            }
        });

        if (validationErrors.length > 0) {
            showMessage('Please fix the following errors:\n\n' + validationErrors.join('\n'), 'error');
            return;
        }

        setBars(editingBars);
        saveBarsToProfile(editingBars);
        showMessage('Progress bars updated successfully!', 'success');
        setShowSettings(false);
    }

    function cancelChanges() {
        setEditingBars([]);
        setHasUnsavedChanges(false);
        setShowSettings(false);
        showMessage('Changes discarded', 'info');
    }

    function handleCloseModal() {
        setShowSettings(false);
    }

    function handleEditChange(index, field, value) {
        const updated = [...editingBars];
        if (field === 'name') {
            updated[index].name = value;
        } else if (field === 'visible') {
            updated[index].visible = value;
        } else if (field === 'filters') {
            if (!updated[index].filters) updated[index].filters = {};
            updated[index].filters = { ...updated[index].filters, ...value };
        }
        setEditingBars(updated);
        setHasUnsavedChanges(true);
    }

    function computeProgress(bar) {
        if (!bar.filters) bar.filters = {};

        if (bar.filters?.tally === "mark") {
            const isShinyBar = bar.filters?.shiny === true;
            const isShinyMode = isShinyBar || (showShiny && bar.filters?.shiny !== false);
            const availableMarks = isShinyMode
                ? MARK_OPTIONS.filter((m) => m.value && m.value !== "mightiest")
                : MARK_OPTIONS.filter((m) => m.value);
            const allMarkValues = new Set(availableMarks.map((m) => m.value));
            const foundMarks = new Set();

            Object.entries(caughtMap).forEach(([key, data]) => {
                // Only count entries that match the current shiny state
                const isShinyKey = key.includes('_shiny') || key.endsWith('_true');
                if (isShinyKey !== showShiny) return;

                if (data && data.entries && Array.isArray(data.entries)) {
                    // New format: extract from entries array
                    data.entries.forEach(entry => {
                        const mList = (Array.isArray(entry?.marks) && entry.marks.length > 0)
                            ? entry.marks
                            : (entry?.mark && entry.mark !== "none" && entry.mark !== "Unknown" ? [entry.mark] : []);
                        mList.forEach(m => {
                            if (m && allMarkValues.has(m)) {
                                foundMarks.add(m);
                            }
                        });
                    });
                } else if (data) {
                    const mList = (Array.isArray(data.marks) && data.marks.length > 0)
                        ? data.marks
                        : (data.mark && data.mark !== "none" && data.mark !== "Unknown" ? [data.mark] : []);
                    mList.forEach(m => {
                        if (m && allMarkValues.has(m)) {
                            foundMarks.add(m);
                        }
                    });
                }
            });

            return { total: allMarkValues.size, caught: foundMarks.size };
        }

        if (bar.filters?.tally === "ball") {
            const allBallValues = new Set(BALL_OPTIONS.map((b) => b.value).filter(Boolean));
            const foundBalls = new Set();

            Object.entries(caughtMap).forEach(([key, data]) => {
                // Only count entries that match the current shiny state
                const isShinyKey = key.includes('_shiny') || key.endsWith('_true');
                if (isShinyKey !== showShiny) return;

                if (data && data.entries && Array.isArray(data.entries)) {
                    // New format: extract from entries array
                    data.entries.forEach(entry => {
                        if (entry && entry.ball && allBallValues.has(entry.ball)) {
                            foundBalls.add(entry.ball);
                        }
                    });
                } else if (data && data.ball && allBallValues.has(data.ball)) {
                    // Old format: use data directly
                    foundBalls.add(data.ball);
                }
            });

            return { total: allBallValues.size, caught: foundBalls.size };
        }

        if (bar.filters?.tally === "game") {
            const allGameValues = new Set(GAME_OPTIONS.map((g) => g.value).filter(Boolean));
            const foundGames = new Set();

            Object.entries(caughtMap).forEach(([key, data]) => {
                // Only count entries that match the current shiny state
                const isShinyKey = key.includes('_shiny') || key.endsWith('_true');
                if (isShinyKey !== showShiny) return;

                if (data && data.entries && Array.isArray(data.entries)) {
                    // New format: extract from entries array
                    data.entries.forEach(entry => {
                        if (entry && entry.game && allGameValues.has(entry.game)) {
                            foundGames.add(entry.game);
                        }
                    });
                } else if (data && data.game && allGameValues.has(data.game)) {
                    // Old format: use data directly
                    foundGames.add(data.game);
                }
            });

            return { total: allGameValues.size, caught: foundGames.size };
        }

        const isShinyBar = bar.filters?.shiny === true;
        const isShinyMode = isShinyBar || (showShiny && !isShinyBar);

        const filtered = visibleMons.filter((mon) => {
            const formType = mon.formType || "main";

            // Mighty Pokemon, Origin Ball Pokemon, and non-partner Cap Pikachu cannot be shiny
            if (isShinyMode && (formType === "mighty" || mon.stableId === "origin-ball-dialga-483" || mon.stableId === "origin-ball-palkia-484" || mon.stableId?.startsWith("origin-ball-") || isNonPartnerCapPikachu(mon))) {
                return false;
            }

            if (bar.filters?.formType?.length > 0) {
                if (!bar.filters.formType.includes(formType)) {
                    if (!(formType !== "main" && bar.filters.formType.includes("forms"))) {
                        return false;
                    }
                }
            }

            if (bar.filters?.gen?.length > 0 && !bar.filters.gen.includes(String(mon.gen))) {
                return false;
            }

            if (bar.filters?.type?.length > 0) {
                const types = mon.types || [];
                if (!types.some((t) => bar.filters.type.includes(t))) return false;
            }

            if (bar.filters?.categories?.length > 0) {
                const matchesAnyCategory = bar.filters.categories.some(category => {
                    switch (category) {
                        case "legendary":
                            return isLegendary(mon);
                        case "mythical":
                            return isMythical(mon);
                        case "ultra-beast":
                            return isUltraBeast(mon);
                        case "pseudo-legendary":
                            return isPseudoLegendary(mon) || isPseudoLegendaryEvo(mon);
                        case "sub-legendary":
                            return isSubLegendary(mon);
                        case "paradox":
                            return isParadox(mon);
                        case "starter":
                            return isStarter(mon) || isStarterEvo(mon);
                        case "fossil":
                            return isFossil(mon) || isFossilEvo(mon);
                        case "baby":
                            return isBaby(mon) || isBabyEvo(mon);
                        default:
                            return false;
                    }
                });
                if (!matchesAnyCategory) return false;
            }

            // Exclude locked Pokemon if the option is enabled
            if (bar.filters?.excludeLocked && showShiny && dexPreferences) {
                // Check if this Pokemon should be blocked based on user preferences
                const isBlockedUnobtainableById = dexPreferences.blockUnobtainableShinies && UNOBTAINABLE_SHINY_DEX_NUMBERS.map(Number).includes(mon.id);
                const isBlockedGOById = dexPreferences.blockGOExclusiveShinies && GO_EXCLUSIVE_SHINY_DEX_NUMBERS.map(Number).includes(mon.id);
                const isBlockedNOOTById = dexPreferences.blockNOOTExclusiveShinies && NO_OT_EXCLUSIVE_SHINY_DEX_NUMBERS.map(Number).includes(mon.id);

                // Check if Pokemon should be blocked by form name
                const pokemonName = mon.name?.toLowerCase() || "";
                const isBlockedUnobtainableByForm = dexPreferences.blockUnobtainableShinies && UNOBTAINABLE_SHINY_FORM_NAMES.some(formName => pokemonName === formName.toLowerCase());
                const isBlockedGOByForm = dexPreferences.blockGOExclusiveShinies && GO_EXCLUSIVE_SHINY_FORM_NAMES.some(formName => pokemonName === formName.toLowerCase());
                const isBlockedNOOTByForm = dexPreferences.blockNOOTExclusiveShinies && NO_OT_EXCLUSIVE_SHINY_FORM_NAMES.some(formName => pokemonName === formName.toLowerCase());

                if (isBlockedUnobtainableById || isBlockedGOById || isBlockedNOOTById || isBlockedUnobtainableByForm || isBlockedGOByForm || isBlockedNOOTByForm) {
                    return false; // Exclude this locked Pokemon
                }
            }

            return true;
        });

        const total = filtered.length;

        // If showShiny is true and this is a general progress bar (not specifically shiny), 
        // prioritize showing shiny progress. If showShiny is false, prioritize regular progress.
        const shouldShowShinyProgress = showShiny && !isShinyBar;

        const isMonCaught = (k) => {
            const entry = caughtMap[k];
            return Boolean(entry && entry.caught !== false && (entry.entries?.length > 0 || entry.caught === true));
        };

        const caught = filtered.filter((mon) => {
            const regularKey = getCaughtKey(mon, null, false);
            const shinyKey = getCaughtKey(mon, null, true);

            if (isShinyBar) {
                // This bar tracks shiny Pokémon specifically
                return isMonCaught(shinyKey);
            } else if (shouldShowShinyProgress) {
                // We're showing shiny grid, so prioritize shiny progress for general bars
                return isMonCaught(shinyKey);
            } else {
                // We're showing regular grid, so show regular progress for general bars
                return isMonCaught(regularKey);
            }
        }).length;

        return { total, caught };
    }

    // Removed handleDragEnd - using arrow controls instead

    const visibleBars = bars.filter((b) => b.visible);


    return (
        <div data-tutorial-id="progress-bars" className="w-full max-w-[1300px] mx-auto px-4 pt-2 pb-1 rounded-lg shadow-sm mb-6 mt-6" style={{ width: '100%', maxWidth: '1300px', backgroundColor: 'var(--searchbar-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Progress Bars</h2>
                <div className="flex items-center gap-2">
                    {/* Mobile-only collapse button - hide when only 1 progress bar */}
                    {bars.length > 1 && (
                        <button
                            className="md:hidden p-2 rounded-lg transition-colors duration-200 hover:scale-105"
                            onClick={() => setCollapsed(v => !v)}
                            aria-label={collapsed ? "Expand progress bars" : "Collapse progress bars"}
                            tabIndex={0}
                        >
                            <ListCollapse size={22} strokeWidth={4} style={{ color: 'var(--accent)' }} />
                        </button>
                    )}
                    {!readOnly && (
                        <button
                            className="p-2 rounded-lg hover:rotate-45 transition-transform duration-300"
                            style={{ color: 'var(--accent)' }}
                            title="Edit Progress Bars"
                            onClick={openEditModal}
                        >
                            <Settings size={24} />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pb-4">
                {visibleBars.map((bar, index) => {
                    const { total, caught } = computeProgress(bar);
                    const isLastOdd = index === visibleBars.length - 1 && visibleBars.length % 2 !== 0;
                    const shouldShow = collapsed === false || window.innerWidth >= 768 || index === 0;

                    if (!shouldShow) return null;

                    return (
                        <div key={bar.id} className={`w-full h-full ${isLastOdd ? 'md:col-span-2' : ''}`}>
                            <ProgressBar label={bar.name} total={total} caughtCount={caught} />
                        </div>
                    );
                })}
            </div>



            {!readOnly && (
                <Modal
                    isOpen={showSettings}
                    onClose={handleCloseModal}
                    title="Progress Bars"
                    subtitle="Customize and reorder your collection progress bars"
                    icon={<SlidersHorizontal size={22} />}
                    size="lg"
                    actions={
                        <>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowResetModal(true)}
                                icon={<RotateCcw size={15} />}
                                title="Reset to default progress bar"
                            >
                                Reset Default
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={saveChanges}
                                disabled={!hasUnsavedChanges}
                                icon={<Check size={15} strokeWidth={2.5} />}
                                title={hasUnsavedChanges ? "Save changes to progress bars" : "No changes to save"}
                            >
                                Save Changes
                            </Button>
                        </>
                    }
                >
                    <div className="drag-container custom-scrollbar">
                        {editingBars.map((bar, index) => {
                            const visibleCount = editingBars.filter(b => b.visible).length;
                            const isLastVisible = visibleCount <= 1 && bar.visible;

                            return (
                                <div key={bar.id} className={`bar-settings-group ${bar.__showFilters ? "filters-open" : ""}`}>
                                    <div className="bar-settings-row">
                                        <div className="arrow-controls">
                                            <button
                                                className="arrow-btn"
                                                onClick={() => moveBarUp(index)}
                                                disabled={index === 0}
                                                title="Move up"
                                            >
                                                <ChevronUp size={13} />
                                            </button>
                                            <button
                                                className="arrow-btn"
                                                onClick={() => moveBarDown(index)}
                                                disabled={index === editingBars.length - 1}
                                                title="Move down"
                                            >
                                                <ChevronDown size={13} />
                                            </button>
                                        </div>

                                        {bar.__locked ? (
                                            <div className="bar-template-layout">
                                                <div className="bar-name-wrap">
                                                    <span className="bar-preset-pill">PRESET</span>
                                                    <span className="bar-name-label">{bar.name}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bar-input-wrap">
                                                <input
                                                    type="text"
                                                    value={bar.name}
                                                    onChange={(e) => {
                                                        handleEditChange(index, 'name', e.target.value);
                                                    }}
                                                    placeholder="Progress Bar Name"
                                                    className="bar-name-input"
                                                />
                                            </div>
                                        )}

                                        <div className="bar-controls">
                                            {!bar.__locked && (
                                                <>
                                                    <button
                                                        className={`eye-toggle-btn ${!bar.visible ? "hidden-bar" : ""}`}
                                                        onClick={() => {
                                                            if (isLastVisible) return;
                                                            handleEditChange(index, 'visible', !bar.visible);
                                                        }}
                                                        disabled={isLastVisible}
                                                        title={isLastVisible ? "You must keep at least 1 visible bar" : (bar.visible ? "Hide progress bar" : "Show progress bar")}
                                                    >
                                                        {bar.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                                    </button>

                                                    <button
                                                        className={`filter-toggle-btn ${bar.__showFilters ? "active" : ""}`}
                                                        onClick={() => {
                                                            const updated = [...editingBars];
                                                            updated[index].__showFilters = !updated[index].__showFilters;
                                                            setEditingBars(updated);
                                                        }}
                                                        title="Configure filters"
                                                    >
                                                        <Pencil size={13} />
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                className="delete-bar-btn"
                                                onClick={() => {
                                                    if (editingBars.length <= 1) return;
                                                    setDeleteModal({
                                                        show: true,
                                                        index: index,
                                                        barName: bar.name
                                                    });
                                                }}
                                                disabled={editingBars.length <= 1}
                                                title={editingBars.length <= 1 ? "You must keep at least 1 progress bar" : "Delete progress bar"}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {bar.__showFilters && !bar.__locked && (
                                        <div className="bar-settings-filters">
                                            <div className="filters-header-tag">
                                                <SlidersHorizontal size={14} style={{ color: "var(--accent)" }} />
                                                <span>Filter Pokémon Included in this Bar</span>
                                            </div>
                                            <div className="bar-filter-editor">
                                                <SelectField
                                                    id={`progress-bar-${bar.id || index}-form-type`}
                                                    label="Form Types"
                                                    options={FORM_TYPE_OPTIONS}
                                                    value={bar.filters?.formType || []}
                                                    onChange={(val) => {
                                                        handleEditChange(index, 'filters', { formType: val });
                                                    }}
                                                    placeholder="Select Form Types"
                                                    multiple
                                                    searchable
                                                    searchPlaceholder="Filter forms..."
                                                    clearable
                                                    startIcon={<Shapes size={16} />}
                                                    size="md"
                                                    fullWidth
                                                />

                                                <SelectField
                                                    id={`progress-bar-${bar.id || index}-gen`}
                                                    label="Generations"
                                                    options={GEN_OPTIONS}
                                                    value={bar.filters?.gen || []}
                                                    onChange={(val) => {
                                                        handleEditChange(index, 'filters', { gen: val });
                                                    }}
                                                    placeholder="Select Generations"
                                                    multiple
                                                    searchable
                                                    searchPlaceholder="Filter generations..."
                                                    clearable
                                                    startIcon={<Hash size={16} />}
                                                    size="md"
                                                    fullWidth
                                                />

                                                <SelectField
                                                    id={`progress-bar-${bar.id || index}-type`}
                                                    label="Types"
                                                    options={TYPE_OPTIONS}
                                                    value={bar.filters?.type || []}
                                                    onChange={(val) => {
                                                        handleEditChange(index, 'filters', { type: val });
                                                    }}
                                                    placeholder="Select Types"
                                                    multiple
                                                    searchable
                                                    searchPlaceholder="Filter types..."
                                                    clearable
                                                    startIcon={<Flame size={16} />}
                                                    size="md"
                                                    fullWidth
                                                />

                                                <SelectField
                                                    id={`progress-bar-${bar.id || index}-categories`}
                                                    label="Categories"
                                                    options={CATEGORY_OPTIONS}
                                                    value={bar.filters?.categories || []}
                                                    onChange={(val) => {
                                                        handleEditChange(index, 'filters', { categories: val });
                                                    }}
                                                    placeholder="Select Categories"
                                                    multiple
                                                    searchable
                                                    searchPlaceholder="Filter categories..."
                                                    clearable
                                                    startIcon={<Crown size={16} />}
                                                    size="md"
                                                    fullWidth
                                                />

                                                {showLockedCheckbox && (
                                                    <div className="chip-filter-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                                        <label className="filter-checkbox-card">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!bar.filters?.excludeLocked}
                                                                onChange={(e) => {
                                                                    handleEditChange(index, 'filters', { excludeLocked: e.target.checked });
                                                                }}
                                                                className="w-4 h-4 cursor-pointer"
                                                                style={{ accentColor: 'var(--accent)' }}
                                                            />
                                                            <span className="filter-checkbox-text">Exclude Locked</span>
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="modal-footer-section">
                        <div className="add-bar-row">
                            <Button
                                variant="secondary"
                                block
                                size="md"
                                onClick={() => {
                                    if (editingBars.filter(b => !b.__locked).length >= MAX_CUSTOM_BARS) {
                                        return;
                                    }

                                    const newBar = {
                                        id: `custom_${Date.now()}`,
                                        name: "New Progress Bar",
                                        filters: {},
                                        visible: true,
                                    };
                                    const updated = [...editingBars, newBar];
                                    setEditingBars(updated);
                                    setHasUnsavedChanges(true);
                                }}
                                disabled={editingBars.filter(b => !b.__locked).length >= MAX_CUSTOM_BARS}
                                icon={<Plus size={18} strokeWidth={2.5} />}
                            >
                                Add Custom Progress Bar ({editingBars.filter(b => !b.__locked).length}/{MAX_CUSTOM_BARS})
                            </Button>
                        </div>

                        <div className="template-presets-container">
                            <div className="presets-label">
                                <Sparkles size={14} style={{ color: "var(--accent)" }} />
                                <span>Quick Presets</span>
                            </div>
                            <div className="template-bar-buttons">
                                {TEMPLATE_PRESETS.map((template) => {
                                    const alreadyExists = editingBars.some(
                                        (bar) => bar.filters?.tally === template.filters.tally
                                    );

                                    return (
                                        <Button
                                            key={template.id}
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                if (alreadyExists) return;

                                                const totalBars = editingBars.length;
                                                if (totalBars >= MAX_CUSTOM_BARS) return;

                                                const newBar = {
                                                    ...template,
                                                    id: `custom_${template.id}_${Date.now()}`,
                                                    __locked: true, // Ensure template bars are locked
                                                };
                                                const updated = [...editingBars, newBar];
                                                setEditingBars(updated);
                                                setHasUnsavedChanges(true);
                                            }}
                                            disabled={alreadyExists || editingBars.length >= MAX_CUSTOM_BARS}
                                            icon={alreadyExists ? <Check size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
                                            title={alreadyExists ? "Already added" : `Add ${template.name}`}
                                        >
                                            {template.name}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, index: null, barName: '' })}
                onConfirm={() => {
                    if (deleteModal.index !== null) {
                        const updated = editingBars.filter((_, i) => i !== deleteModal.index);
                        setEditingBars(updated);
                        setHasUnsavedChanges(true);
                    }
                    setDeleteModal({ show: false, index: null, barName: '' });
                }}
                title="Delete Progress Bar"
                message={`Are you sure you want to delete "${deleteModal.barName}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />

            {/* Reset to Default Confirmation Modal */}
            <ConfirmModal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                onConfirm={() => {
                    setEditingBars(DEFAULT_BARS.map(bar => ({
                        ...bar,
                        __locked: false
                    })));
                    setHasUnsavedChanges(true);
                    setShowResetModal(false);
                }}
                title="Reset Progress Bars"
                message="Are you sure you want to reset all progress bars back to default? Any custom progress bars and configurations will be replaced."
                confirmText="Reset to Default"
                variant="danger"
            />
        </div>
    );
}
