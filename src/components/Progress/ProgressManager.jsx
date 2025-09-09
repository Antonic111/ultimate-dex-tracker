// This is a replacement for ProgressManager.jsx — copy and paste fully

// Removed @dnd-kit imports - using arrow key controls instead
import { Eye, EyeOff, ListCollapse, Pencil, Plus, Settings, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useEffect, useState, useContext, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { getCaughtKey } from "../../caughtStorage";

import { BALL_OPTIONS, GAME_OPTIONS, MARK_OPTIONS } from "../../Constants";
import MultiSelectChips from "../Shared/MultiSelectChips";
import ProgressBar from "./ProgressBar";
// Removed SortableItem import - using arrow controls instead
import { UserContext, useUser } from "../Shared/UserContext";
import { useMessage } from "../Shared/MessageContext";
import { validateContent } from "../../../shared/contentFilter";
import { progressAPI } from '../../utils/api';

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

export default function ProgressManager({ allMons, caughtInfoMap, readOnly = false, progressBarsOverride = null, showShiny = false, dexPreferences = null }) {
    const { username, progressBars: contextSavedBars = [] } = useContext(UserContext);
    const { showMessage } = useMessage();
    
    // Use refs to track previous values and prevent infinite loops
    const prevProgressBarsOverride = useRef(progressBarsOverride);
    const prevContextSavedBars = useRef(contextSavedBars);
    
    // Initialize bars based on whether we have override data or not
    const initialBars = Array.isArray(progressBarsOverride) 
        ? (progressBarsOverride.length > 0 ? progressBarsOverride : DEFAULT_BARS)
        : (contextSavedBars.length > 0 ? contextSavedBars : DEFAULT_BARS);
    
    const [bars, setBars] = useState(initialBars);
    const [editingBars, setEditingBars] = useState([]); // New state for editing
    const [deleteModal, setDeleteModal] = useState({ show: false, index: null, barName: '' });
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
        const progressBarsChanged = prevProgressBarsOverride.current !== progressBarsOverride;
        const contextBarsChanged = prevContextSavedBars.current !== contextSavedBars;
        
        if (!progressBarsChanged && !contextBarsChanged) {
            return; // No changes, skip update
        }
        
        // Update refs
        prevProgressBarsOverride.current = progressBarsOverride;
        prevContextSavedBars.current = contextSavedBars;
        
        if (savedBars && savedBars.length > 0) {
            const withLocked = savedBars.map((bar) => {
                const isTemplate = TEMPLATE_PRESETS.some(
                    (tpl) => bar.filters?.tally && tpl.filters?.tally === bar.filters.tally
                );
                return isTemplate ? { ...bar, __locked: true } : bar;
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
        }));

        try {
            await progressAPI.updateProgressBars(cleanBars);
        } catch (err) {
            console.error("❌ Error saving bars:", err);
        }
    }



    const [showSettings, setShowSettings] = useState(false);
    const [closing, setClosing] = useState(false);
    const [collapsed, setCollapsed] = useState(true);

    // Removed drag-related modifiers and sensors - using arrow controls instead
    

    useEffect(() => {
        const body = document.body;
        if (showSettings) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = '';
        }
        return () => {
            body.style.overflow = '';
        };
    }, [showSettings]);

    // New functions for save/cancel system
    function openEditModal() {
        // Collapse all open filters and set editing state
        const collapsed = bars.map(bar => ({
            ...bar,
            __showFilters: false,
            // Ensure __locked property is preserved for template bars
            __locked: bar.__locked || false,
        }));
        setEditingBars(collapsed);
        setHasUnsavedChanges(false);
        setShowSettings(true);
        setClosing(false);
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
        handleCloseModal();
    }

    function cancelChanges() {
        setEditingBars([]);
        setHasUnsavedChanges(false);
        handleCloseModal();
        showMessage('Changes discarded', 'info');
    }

    function handleCloseModal() {
        setClosing(true);
        setTimeout(() => {
            setShowSettings(false);
            setClosing(false);
        }, 300);
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
            const allMarkValues = new Set(MARK_OPTIONS.map((m) => m.value).filter(Boolean));
            const foundMarks = new Set();

            Object.values(caughtMap).forEach((data) => {
                if (data && data.entries && Array.isArray(data.entries)) {
                    // New format: extract from entries array
                    data.entries.forEach(entry => {
                        if (entry && entry.mark && allMarkValues.has(entry.mark)) {
                            foundMarks.add(entry.mark);
                        }
                    });
                } else if (data && data.mark && allMarkValues.has(data.mark)) {
                    // Old format: use data directly
                    foundMarks.add(data.mark);
                }
            });

            return { total: allMarkValues.size, caught: foundMarks.size };
        }

        if (bar.filters?.tally === "ball") {
            const allBallValues = new Set(BALL_OPTIONS.map((b) => b.value).filter(Boolean));
            const foundBalls = new Set();

            Object.values(caughtMap).forEach((data) => {
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

            Object.values(caughtMap).forEach((data) => {
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

        const filtered = visibleMons.filter((mon) => {
            const formType = mon.formType || "main";

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

            return true;
        });

        const total = filtered.length;
        
        // Count both regular and shiny Pokémon for the total
        // For caught count, check if the progress bar is specifically for shiny tracking
        const isShinyBar = bar.filters?.shiny === true;
        
        // If showShiny is true and this is a general progress bar (not specifically shiny), 
        // prioritize showing shiny progress. If showShiny is false, prioritize regular progress.
        const shouldShowShinyProgress = showShiny && !isShinyBar;
        
        const caught = filtered.filter((mon) => {
            const regularKey = getCaughtKey(mon, null, false);
            const shinyKey = getCaughtKey(mon, null, true);
            
            if (isShinyBar) {
                // This bar tracks shiny Pokémon specifically
                return !!caughtMap[shinyKey];
            } else if (shouldShowShinyProgress) {
                // We're showing shiny grid, so prioritize shiny progress for general bars
                return !!caughtMap[shinyKey];
            } else {
                // We're showing regular grid, so show regular progress for general bars
                return !!caughtMap[regularKey];
            }
        }).length;
        
        return { total, caught };
    }

    // Removed handleDragEnd - using arrow controls instead

    const visibleBars = bars.filter((b) => b.visible);


    return (
                                    <div className="w-full max-w-[1300px] mx-auto px-4 pt-2 pb-1 rounded-lg shadow-sm mb-6 mt-6" style={{ width: '100%', maxWidth: '1300px', backgroundColor: 'var(--searchbar-bg)', border: '1px solid var(--border-color)' }}>
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



            {!readOnly && showSettings && (
                createPortal(
                <div className={`progress-modal-overlay${closing ? " closing" : ""}`}>
                    <div className={`progress-modal-panel${closing ? " closing" : ""}`}>
                        <div className="modal-header">
                            <h3>Edit Progress Bars</h3>
                            <div className="modal-actions">
                                <button 
                                    className="modal-cancel-btn" 
                                    onClick={() => {
                                        // Revert to default progress bars
                                        setEditingBars(DEFAULT_BARS.map(bar => ({
                                            ...bar,
                                            __locked: false // Default bars are not locked
                                        })));
                                        setHasUnsavedChanges(true);
                                    }}
                                >
                                    Revert to Default
                                </button>
                                <button 
                                    className="modal-save-btn" 
                                    onClick={saveChanges}
                                    disabled={!hasUnsavedChanges}
                                >
                                    Save Changes
                                </button>
                                <button className="modal-close-btn" onClick={handleCloseModal} aria-label="Cancel">
                                    <span className="sidebar-close-icon">
                                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="20" cy="20" r="18" fill="#fff" stroke="#232323" strokeWidth="2" />
                                            <path d="M2 20a18 18 0 0 1 36 0" fill="#e62829" stroke="#232323" strokeWidth="2" />
                                            <rect x="2" y="19" width="36" height="2" fill="#232323" />
                                            <circle cx="20" cy="20" r="7" fill="#ffffffff" stroke="#232323" strokeWidth="2" />
                                            <circle cx="20" cy="20" r="3.5" fill="#fff" stroke="#232323" strokeWidth="1.5" />
                                        </svg>
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="modal-body">
                            <div className="drag-container">
                                {editingBars.map((bar, index) => {
                                    const visibleCount = editingBars.filter(b => b.visible).length;
                                    const isLastVisible = visibleCount <= 1 && bar.visible;

                                    return (
                                        <div key={bar.id} className="bar-settings-group">
                                            <div className="bar-settings-row">
                                                <div className="arrow-controls">
                                                    <button
                                                        className="arrow-btn"
                                                        onClick={() => moveBarUp(index)}
                                                        disabled={index === 0}
                                                        title="Move up"
                                                    >
                                                        <ChevronUp size={16} />
                                                    </button>
                                                    <button
                                                        className="arrow-btn"
                                                        onClick={() => moveBarDown(index)}
                                                        disabled={index === editingBars.length - 1}
                                                        title="Move down"
                                                    >
                                                        <ChevronDown size={16} />
                                                    </button>
                                                </div>

                                                {bar.__locked ? (
                                                    <div className="bar-template-layout">
                                                        <span className="bar-name-label">{bar.name}</span>
                                                        <div className="bar-controls">
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={bar.name}
                                                        onChange={(e) => {
                                                            handleEditChange(index, 'name', e.target.value);
                                                        }}
                                                        className="bar-name-input"
                                                    />
                                                )}

                                                <div className="bar-controls">
                                                    {!bar.__locked && (
                                                        <>
                                                            <button
                                                                className="eye-toggle-btn"
                                                                onClick={() => {
                                                                    if (isLastVisible) return;
                                                                    handleEditChange(index, 'visible', !bar.visible);
                                                                }}
                                                                disabled={isLastVisible}
                                                                title={isLastVisible ? "You must keep at least 1 visible bar" : (bar.visible ? "Hide" : "Show")}
                                                                style={{
                                                                    opacity: isLastVisible ? 0.5 : 1,
                                                                    cursor: isLastVisible ? "not-allowed" : "pointer"
                                                                }}
                                                            >
                                                                {bar.visible ? <Eye size={20} /> : <EyeOff size={20} />}
                                                            </button>

                                                            <button
                                                                className={`filter-toggle-btn${bar.__showFilters ? " active" : ""}`}
                                                                onClick={() => {
                                                                    const updated = [...editingBars];
                                                                    updated[index].__showFilters = !updated[index].__showFilters;
                                                                    setEditingBars(updated);
                                                                }}
                                                                title="Configure filters"
                                                            >
                                                                <Pencil size={18} />
                                                            </button>
                                                        </>
                                                    )}

                                                    <button
                                                        onClick={() => {
                                                            if (editingBars.length <= 1) return;
                                                            setDeleteModalClosing(false);
                                                            setDeleteModal({ 
                                                                show: true, 
                                                                index: index, 
                                                                barName: bar.name 
                                                            });
                                                        }}
                                                        disabled={editingBars.length <= 1}
                                                        title={editingBars.length <= 1 ? "You must keep at least 1 progress bar" : "Delete"}
                                                        style={{
                                                            opacity: editingBars.length <= 1 ? 0.5 : 1,
                                                            cursor: editingBars.length <= 1 ? "not-allowed" : "pointer"
                                                        }}
                                                    >
                                                        <Trash2 />
                                                    </button>
                                                </div>
                                            </div>

                                            {bar.__showFilters && !bar.__locked && (
                                                <div className="bar-settings-filters">
                                                    <div className="bar-filter-editor">
                                                        <MultiSelectChips
                                                            label="Form Types"
                                                            value={bar.filters.formType || []}
                                                            options={[
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
                                                            ]}
                                                            onChange={(val) => {
                                                                handleEditChange(index, 'filters', { formType: val });
                                                            }}
                                                        />

                                                        <MultiSelectChips
                                                            label="Generations"
                                                            value={bar.filters.gen || []}
                                                            options={["1", "2", "3", "4", "5", "6", "7", "8", "9"]}
                                                            onChange={(val) => {
                                                                handleEditChange(index, 'filters', { gen: val });
                                                            }}
                                                        />

                                                        <MultiSelectChips
                                                            label="Types"
                                                            value={bar.filters.type || []}
                                                            options={[
                                                                "normal", "fire", "water", "grass", "electric", "ice",
                                                                "fighting", "poison", "ground", "flying", "psychic", "bug",
                                                                "rock", "ghost", "dragon", "dark", "steel", "fairy"
                                                            ]}
                                                            onChange={(val) => {
                                                                handleEditChange(index, 'filters', { type: val });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="add-bar-row">
                                <button
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

                                    style={{
                                        opacity: editingBars.length >= MAX_CUSTOM_BARS ? 0.4 : 1,
                                        cursor: editingBars.length >= MAX_CUSTOM_BARS ? "not-allowed" : "pointer",
                                    }}
                                >
                                    <Plus size={22} strokeWidth={3} />
                                    Add Progress Bar
                                </button>
                            </div>

                            <div className="template-bar-buttons">
                                {TEMPLATE_PRESETS.map((template) => {
                                    const alreadyExists = editingBars.some(
                                        (bar) => bar.filters?.tally === template.filters.tally
                                    );

                                    return (
                                        <button
                                            key={template.id}
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
                                            title={alreadyExists ? "Already added" : ""}
                                            style={{
                                                opacity: alreadyExists || editingBars.length >= MAX_CUSTOM_BARS ? 0.4 : 1,
                                                cursor: alreadyExists || editingBars.length >= MAX_CUSTOM_BARS ? "not-allowed" : "pointer"
                                            }}
                                        >
                                            <Plus size={18} strokeWidth={2.5} />
                                            {template.name}
                                        </button>
                                    );
                                })}

                            </div>
                        </div>
                    </div>
                </div>,
                document.body)
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.show && createPortal(
                <div className={`fixed inset-0 z-[20000] flex items-center justify-center ${deleteModalClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}>
                    {/* Backdrop */}
                    <div 
                        className={`absolute inset-0 bg-black/80 ${deleteModalClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
                        onClick={() => {
                            setDeleteModalClosing(true);
                            setTimeout(() => {
                                setDeleteModal({ show: false, index: null, barName: '' });
                                setDeleteModalClosing(false);
                            }, 300);
                        }}
                    />
                    
                    {/* Modal */}
                    <div className={`relative bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl ${deleteModalClosing ? 'animate-[slideOut_0.3s_ease-in_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}`}>
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--accent)]">Delete Progress Bar</h3>
                                <p className="text-sm text-[var(--progressbar-info)]">This action cannot be undone</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="mb-6">
                            <p className="text-[var(--text)]">
                                Are you sure you want to delete <span className="font-semibold text-[var(--accent)]">"{deleteModal.barName}"</span>?
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setDeleteModalClosing(true);
                                    setTimeout(() => {
                                        setDeleteModal({ show: false, index: null, barName: '' });
                                        setDeleteModalClosing(false);
                                    }, 300);
                                }}
                                className="px-4 py-2 text-[var(--text)] hover:text-[var(--modal-buttons-hover-text)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (deleteModal.index !== null) {
                                        const updated = editingBars.filter((_, i) => i !== deleteModal.index);
                                        setEditingBars(updated);
                                        setHasUnsavedChanges(true);
                                    }
                                    setDeleteModalClosing(true);
                                    setTimeout(() => {
                                        setDeleteModal({ show: false, index: null, barName: '' });
                                        setDeleteModalClosing(false);
                                    }, 300);
                                }}
                                className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black hover:text-[var(--text)] rounded-lg transition-colors font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
