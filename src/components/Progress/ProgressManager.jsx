// This is a replacement for ProgressManager.jsx — copy and paste fully

import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Eye, EyeOff, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import { useEffect, useState, useContext, useRef } from "react";
import { getCaughtKey } from "../../caughtStorage";
import { showConfirm } from "../Shared/ConfirmDialog";
import { BALL_OPTIONS, GAME_OPTIONS, MARK_OPTIONS } from "../../Constants";
import MultiSelectChips from "../Shared/MultiSelectChips";
import ProgressBar from "./ProgressBar";
import { SortableItem } from "../Shared/SortableItem";
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

export default function ProgressManager({ allMons, caughtInfoMap, readOnly = false, progressBarsOverride = null, }) {
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
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Track changes

    const caughtMap = caughtInfoMap;



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


    function handleDragStart() {
        setBars(prev =>
            prev.map(bar => ({ ...bar, __showFilters: false }))
        );
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

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const body = document.body;
        const html = document.documentElement;

        if (showSettings) {
            body.classList.add("modal-open");
            html.classList.add("modal-open");
        } else {
            body.classList.remove("modal-open");
            html.classList.remove("modal-open");
        }

        return () => {
            body.classList.remove("modal-open");
            html.classList.remove("modal-open");
        };
    }, [showSettings]);

    // New functions for save/cancel system
    function openEditModal() {
        // Collapse all open filters and set editing state
        const collapsed = bars.map(bar => ({
            ...bar,
            __showFilters: false,
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
        showMessage('✅ Progress bars updated successfully!', 'success');
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
                if (data && data.mark && allMarkValues.has(data.mark)) {
                    foundMarks.add(data.mark);
                }
            });


            return { total: allMarkValues.size, caught: foundMarks.size };
        }

        if (bar.filters?.tally === "ball") {
            const allBallValues = new Set(BALL_OPTIONS.map((b) => b.value).filter(Boolean));
            const foundBalls = new Set();

            Object.values(caughtMap).forEach((data) => {
                if (data && data.ball && allBallValues.has(data.ball)) {
                    foundBalls.add(data.ball);
                }
            });

            return { total: allBallValues.size, caught: foundBalls.size };
        }

        if (bar.filters?.tally === "game") {
            const allGameValues = new Set(GAME_OPTIONS.map((g) => g.value).filter(Boolean));
            const foundGames = new Set();

            Object.values(caughtMap).forEach((data) => {
                if (data && data.game && allGameValues.has(data.game)) {
                    foundGames.add(data.game);
                }
            });

            return { total: allGameValues.size, caught: foundGames.size };
        }



        const filtered = allMons.filter((mon) => {
            const key = getCaughtKey(mon);
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
        const caught = filtered.filter((mon) => !!caughtMap[getCaughtKey(mon)]).length;
        return { total, caught };
    }

    function handleDragEnd(event) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = editingBars.findIndex((bar) => bar.id === active.id);
            const newIndex = editingBars.findIndex((bar) => bar.id === over.id);
            const updated = arrayMove(editingBars, oldIndex, newIndex);
            setEditingBars(updated);
            setHasUnsavedChanges(true);
        }
    }

    const visibleBars = bars.filter((b) => b.visible);
    const isOdd = visibleBars.length % 2 === 1;
    const gridClass = `progress-bar-grid${isOdd ? " odd-count" : ""}`;


    return (
        <div className="progress-manager-wrapper">
            <div className="progress-header-row">
                <h2 className="progress-title">Progress Bars</h2>
                        {!readOnly && (
         <button
                    className="progress-settings-btn"
                    title="Edit Progress Bars"
                    onClick={openEditModal}
                >
                    <Settings size={30} />
                          </button>
        )}

            </div>

            <div className={gridClass}>
                {visibleBars.map((bar) => {
                    const { total, caught } = computeProgress(bar);
                    return (
                        <div className="progress-bar-grid-item" key={bar.id}>
                            <ProgressBar label={bar.name} total={total} caughtCount={caught} />
                        </div>
                    );
                })}
            </div>



            {!readOnly && showSettings && (
                <div className={`progress-modal-overlay${closing ? " closing" : ""}`}>
                    <div className={`progress-modal-panel${closing ? " closing" : ""}`}>
                        <div className="modal-header">
                            <h3>Edit Progress Bars</h3>
                            <div className="modal-actions">
                                <button 
                                    className="modal-cancel-btn" 
                                    onClick={() => {
                                        // Revert to default progress bars
                                        setEditingBars(DEFAULT_BARS);
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
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext items={editingBars.map((bar) => bar.id)} strategy={verticalListSortingStrategy}>
                                    {editingBars.map((bar, index) => {
                                        const visibleCount = editingBars.filter(b => b.visible).length;
                                        const isLastVisible = visibleCount <= 1 && bar.visible;

                                        return (

                                            <SortableItem key={bar.id} id={bar.id}>
                                                {(listeners) => (
                                                    <div className="bar-settings-group">
                                                        <div className="bar-settings-row">
                                                            <span className="drag-handle" title="Drag to reorder" {...listeners}>
                                                                ⠇
                                                            </span>

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
                                                            )
                                                            }

                                                            <div className="bar-controls">
                                                                <>
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
                                                                        onClick={async (e) => {
                                                                            if (editingBars.length <= 1) return;

                                                                            const button = e.currentTarget;
                                                                            button.disabled = true;

                                                                            try {
                                                                                const confirm = await showConfirm("Are you sure you want to delete this progress bar?");
                                                                                if (confirm) {
                                                                                    const updated = editingBars.filter((_, i) => i !== index);
                                                                                    setEditingBars(updated);
                                                                                    setHasUnsavedChanges(true);
                                                                                }
                                                                            } finally {
                                                                                // Always re-enable the button, even if confirm is false or an error occurs
                                                                                button.disabled = false;
                                                                            }
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



                                                                </>

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
                                                )}
                                            </SortableItem>
                                        );
                                    })}
                                </SortableContext>
                            </DndContext>

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
                </div>
            )}
        </div>
    );
}
