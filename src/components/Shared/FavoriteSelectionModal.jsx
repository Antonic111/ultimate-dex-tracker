import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Check, Trash2, Sparkles, Gamepad2, User, Trophy, Search, X } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import SearchField from "./FormField/SearchField";
import "../../css/FavoriteSelectionModal.css";

const POKEMON_FORM_CATEGORIES = [
    { id: "all", label: "All" },
    { id: "alpha", label: "Alpha" },
    { id: "vivillon", label: "Vivillon" },
    { id: "gender", label: "Gender" },
    { id: "alolan", label: "Alola" },
    { id: "galarian", label: "Galar" },
    { id: "hisuian", label: "Hisui" },
    { id: "paldean", label: "Paldea" },
    { id: "gmax", label: "G-Max" },
    { id: "unown", label: "Unown" },
    { id: "alcremie", label: "Alcremie" },
    { id: "mighty", label: "Mighty" },
    { id: "other", label: "Other" }
];

export default function FavoriteSelectionModal({
    isOpen,
    onClose,
    title = "Select Favorite",
    options = [],
    selected = [],
    selectedShiny = [],
    initialShiny = false,
    onChange,
    max = 1,
    showHoverPreview = false,
    size,
}) {
    const [tempSelection, setTempSelection] = useState([]);
    const [tempShiny, setTempShiny] = useState([]);
    const [search, setSearch] = useState("");
    const [showShiny, setShowShiny] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [hovered, setHovered] = useState(null);
    const [renderLimit, setRenderLimit] = useState(100);
    const gridRef = useRef(null);

    const isPokemonModal = title.toLowerCase().includes("pokémon") || title.toLowerCase().includes("pokemon");
    const isGameModal = title.toLowerCase().includes("game");
    const isTrainerModal = title.toLowerCase().includes("trainer");
    const isBallModal = title.toLowerCase().includes("ball") || title.toLowerCase().includes("pokéball");

    // Initialize state on open
    useEffect(() => {
        if (isOpen) {
            const initialList = Array.isArray(selected) ? [...selected] : selected ? [selected] : [];
            while (initialList.length < max) initialList.push("");
            setTempSelection(initialList.slice(0, max));

            const initialShinyList = Array.isArray(selectedShiny)
                ? [...selectedShiny]
                : Array.from({ length: max }, () => Boolean(initialShiny));
            while (initialShinyList.length < max) initialShinyList.push(false);
            setTempShiny(initialShinyList.slice(0, max));

            setSearch("");
            setSelectedCategory("all");
            setShowShiny(Boolean(initialShiny));
            setRenderLimit(100);
        }
    }, [isOpen]);

    // Reset render limit on search or category filter change
    useEffect(() => {
        setRenderLimit(100);
        if (gridRef.current) {
            gridRef.current.scrollTop = 0;
        }
    }, [search, selectedCategory]);

    const toggleSelect = (value) => {
        if (max === 1) {
            const isAlreadySelected = isPokemonModal
                ? tempSelection[0] === value && Boolean(tempShiny[0]) === Boolean(showShiny)
                : tempSelection[0] === value;

            if (isAlreadySelected) {
                setTempSelection([""]);
                setTempShiny([false]);
            } else {
                setTempSelection([value]);
                setTempShiny([isPokemonModal ? Boolean(showShiny) : false]);
            }
        } else {
            const existingIndex = isPokemonModal
                ? tempSelection.findIndex((v, idx) => v === value && Boolean(tempShiny[idx]) === Boolean(showShiny))
                : tempSelection.findIndex((v) => v === value);

            if (existingIndex !== -1) {
                // Deselect: open up this exact slot
                const next = [...tempSelection];
                next[existingIndex] = "";
                setTempSelection(next);

                const nextShiny = [...tempShiny];
                nextShiny[existingIndex] = false;
                setTempShiny(nextShiny);
            } else {
                // Not selected yet: find the first available open slot
                const openIndex = tempSelection.findIndex((v) => !v);
                if (openIndex !== -1) {
                    const next = [...tempSelection];
                    next[openIndex] = value;
                    setTempSelection(next);

                    const nextShiny = [...tempShiny];
                    nextShiny[openIndex] = isPokemonModal ? Boolean(showShiny) : false;
                    setTempShiny(nextShiny);
                }
            }
        }
    };

    const handleRemoveSlot = (index) => {
        const next = [...tempSelection];
        next[index] = "";
        setTempSelection(next);

        const nextShiny = [...tempShiny];
        nextShiny[index] = false;
        setTempShiny(nextShiny);
    };

    const handleSave = (closeModal) => {
        if (max === 1) {
            if (isPokemonModal) {
                onChange({ value: tempSelection[0] || "", isShiny: Boolean(tempShiny[0]) });
            } else {
                onChange([tempSelection[0] || ""]);
            }
        } else {
            if (isPokemonModal) {
                onChange(tempSelection, tempShiny);
            } else {
                onChange(tempSelection);
            }
        }
        if (typeof closeModal === "function") {
            closeModal();
        } else {
            onClose?.();
        }
    };

    const handleClear = () => {
        setTempSelection(Array(max).fill(""));
        setTempShiny(Array(max).fill(false));
    };

    // Helper to find option metadata by value or ID
    const getOptionByValue = useCallback((val) => {
        if (!val) return null;
        return options.find(
            (opt) => opt.value === val || opt.stableId === val || String(opt.id) === String(val) || opt.name === val
        ) || { name: val, value: val, image: "", shinyImage: "" };
    }, [options]);

    // Filter items
    const filteredOptions = useMemo(() => {
        const query = search.trim().toLowerCase();

        return options.filter((item) => {
            if (!item || !item.value) return false;

            // Search filter
            if (query) {
                const nameMatch = item.name && item.name.toLowerCase().includes(query);
                const valueMatch = item.value && item.value.toLowerCase().includes(query);
                const idMatch = item.id !== undefined && String(item.id).includes(query.replace("#", ""));
                const formMatch = item.formLabel && item.formLabel.toLowerCase().includes(query);
                if (!nameMatch && !valueMatch && !idMatch && !formMatch) {
                    return false;
                }
            }

            // Category filter for Pokemon
            if (isPokemonModal && selectedCategory !== "all") {
                const itemFormType = (item.formType || "").toLowerCase();
                if (selectedCategory === "alpha") {
                    if (itemFormType !== "alpha" && itemFormType !== "alphaother" && itemFormType !== "alpha_other") {
                        return false;
                    }
                } else if (selectedCategory === "other") {
                    if (itemFormType !== "other") {
                        return false;
                    }
                } else {
                    if (itemFormType !== selectedCategory) {
                        return false;
                    }
                }
            }

            return true;
        });
    }, [options, search, selectedCategory, isPokemonModal]);

    // Handle smooth infinite scroll loading
    const handleScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 200) {
            setRenderLimit((prev) => Math.min(prev + 80, filteredOptions.length));
        }
    }, [filteredOptions.length]);

    const displayedOptions = useMemo(() => {
        return filteredOptions.slice(0, renderLimit);
    }, [filteredOptions, renderLimit]);

    // Helper for formatting form labels
    const getCardFormLabel = (item) => {
        if (item.formLabel) return item.formLabel;
        if (item.name && item.name.includes("(")) {
            const match = item.name.match(/\(([^)]+)\)/);
            if (match) return match[1];
        }
        return null;
    };

    const getCleanName = (name) => {
        if (!name) return "";
        return name.split(" (")[0];
    };

    // Modal Header Icon (Accent-colored)
    const modalIcon = useMemo(() => {
        if (isPokemonModal) return <Sparkles size={22} />;
        if (isGameModal) return <Gamepad2 size={22} />;
        if (isTrainerModal) return <User size={22} />;
        return <Trophy size={22} />;
    }, [isPokemonModal, isGameModal, isTrainerModal]);

    const chosenCount = useMemo(() => {
        return tempSelection.filter(Boolean).length;
    }, [tempSelection]);

    const subtitleText = useMemo(() => {
        if (max > 1) {
            return `Select up to ${max} (${chosenCount}/${max} selected)`;
        }
        if (isPokemonModal) return "Choose a Pokémon to showcase on your profile";
        if (isGameModal) return "Choose a favorite game to showcase on your profile";
        if (isTrainerModal) return "Select a trainer avatar for your trainer card";
        return "Select an option";
    }, [max, chosenCount, isPokemonModal, isGameModal, isTrainerModal]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            subtitle={subtitleText}
            icon={modalIcon}
            size={size || (isPokemonModal ? "xl" : "lg")}
            footer={({ close }) => (
                <div className="fav-modal-footer">
                    {chosenCount > 0 && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleClear}
                            icon={<Trash2 size={14} />}
                        >
                            Clear All
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={close}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSave(close)}
                        icon={<Check size={15} strokeWidth={2.5} />}
                    >
                        Save Selection
                    </Button>
                </div>
            )}
        >
            <div className="fav-modal-body">
                {/* Selected Favorites Slots Tray (When multi-select) */}
                {max > 1 && (
                    <div className="fav-slots-tray">
                        {Array.from({ length: max }).map((_, slotIdx) => {
                            const val = tempSelection[slotIdx];
                            const isShiny = tempShiny[slotIdx];
                            const opt = getOptionByValue(val);
                            const isFilled = Boolean(val && opt);
                            const imgSrc = isFilled
                                ? (isPokemonModal && isShiny && opt.shinyImage ? opt.shinyImage : opt.image)
                                : null;
                            const formLabel = isFilled && isPokemonModal ? getCardFormLabel(opt) : null;
                            const displayName = isFilled
                                ? (isPokemonModal ? getCleanName(opt.name) : opt.name)
                                : `Slot ${slotIdx + 1}`;

                            return (
                                <div
                                    key={slotIdx}
                                    className={`fav-slot-card ${isFilled ? "filled" : "empty"}`}
                                    onClick={() => {
                                        if (isFilled) handleRemoveSlot(slotIdx);
                                    }}
                                    title={isFilled ? `Click to remove ${displayName} from Slot ${slotIdx + 1}` : `Slot ${slotIdx + 1} (Empty)`}
                                >
                                    <div className="fav-slot-num">{slotIdx + 1}</div>

                                    {isFilled ? (
                                        <>
                                            {isPokemonModal && isShiny && (
                                                <div className="fav-slot-shiny-badge" title="Shiny Variant">
                                                    <Sparkles size={11} />
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                className="fav-slot-remove-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveSlot(slotIdx);
                                                }}
                                                title="Remove from favorites"
                                                aria-label="Remove"
                                            >
                                                <X size={11} strokeWidth={2.5} />
                                            </button>

                                            <div className="fav-slot-content">
                                                <div className="fav-slot-img-wrap">
                                                    {imgSrc ? (
                                                        <img
                                                            src={imgSrc}
                                                            alt={displayName}
                                                            className={`fav-slot-img ${isPokemonModal ? "pixelated" : ""}`}
                                                        />
                                                    ) : (
                                                        <div className="fav-slot-no-img">?</div>
                                                    )}
                                                </div>

                                                <div className="fav-slot-info">
                                                    <span className="fav-slot-name" title={displayName}>
                                                        {displayName}
                                                    </span>
                                                    {formLabel && (
                                                        <span className="fav-slot-form-tag" title={formLabel}>
                                                            {formLabel}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="fav-slot-empty-content">
                                            <span className="fav-slot-empty-icon">+</span>
                                            <span className="fav-slot-empty-label">Empty</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Search and Controls Toolbar */}
                <div className="fav-toolbar">
                    <div className="fav-search-container">
                        <SearchField
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClear={() => setSearch("")}
                            placeholder={
                                isPokemonModal
                                    ? "Search Pokémon by name or #dex..."
                                    : isGameModal
                                    ? "Search game title..."
                                    : "Search trainers..."
                            }
                            size="md"
                            fullWidth
                            clearable
                        />
                    </div>

                    {isPokemonModal && (
                        <button
                            type="button"
                            className={`fav-shiny-toggle-btn ${showShiny ? "active" : ""}`}
                            onClick={() => setShowShiny((prev) => !prev)}
                            title={showShiny ? "Showing shiny sprites" : "Showing regular sprites"}
                            aria-label="Toggle Shiny Sprites"
                        >
                            <Sparkles size={15} className={`fav-shiny-icon ${showShiny ? "spin-pulse" : ""}`} />
                            <span>Shiny Sprites</span>
                        </button>
                    )}
                </div>

                {/* Form Category filter chips for Pokémon */}
                {isPokemonModal && (
                    <div className="fav-categories-bar">
                        {POKEMON_FORM_CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                className={`fav-category-chip ${selectedCategory === cat.id ? "active" : ""}`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Items Grid */}
                <div
                    ref={gridRef}
                    onScroll={handleScroll}
                    className={`fav-grid custom-scrollbar ${
                        isPokemonModal
                            ? "fav-grid--pokemon"
                            : isGameModal
                            ? "fav-grid--game"
                            : isBallModal
                            ? "fav-grid--ball"
                            : "fav-grid--trainer"
                    }`}
                >
                    {displayedOptions.length === 0 ? (
                        <div className="fav-no-results">
                            <Search size={28} className="fav-no-results-icon" />
                            <p className="fav-no-results-title">No matches found</p>
                            <p className="fav-no-results-desc">
                                {search ? `No items found matching "${search}"` : "No items available in this category"}
                            </p>
                            {search && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setSearch("")}
                                    className="mt-2"
                                >
                                    Clear Search
                                </Button>
                            )}
                        </div>
                    ) : (
                        displayedOptions.map((item) => {
                            const slotIndex = isPokemonModal
                                ? tempSelection.findIndex((v, idx) => v === item.value && Boolean(tempShiny[idx]) === Boolean(showShiny))
                                : tempSelection.findIndex((v) => v === item.value);
                            const isSelected = slotIndex !== -1;
                            const slotNumber = slotIndex + 1;
                            const formLabel = isPokemonModal ? getCardFormLabel(item) : null;
                            const isCardShiny = isPokemonModal ? showShiny : false;
                            const imgSrc = isPokemonModal && isCardShiny && item.shinyImage ? item.shinyImage : item.image;

                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    className={`fav-card ${
                                        isPokemonModal ? "fav-card--pokemon" : isGameModal ? "fav-card--game" : isBallModal ? "fav-card--ball" : "fav-card--trainer"
                                    } ${isSelected ? "selected" : ""}`}
                                    onClick={() => toggleSelect(item.value)}
                                    onMouseEnter={() => (showHoverPreview ? setHovered(item) : null)}
                                    onMouseLeave={() => (showHoverPreview ? setHovered(null) : null)}
                                    title={item.name}
                                >
                                    {/* Selection Badge: Number if multi-select, Checkmark if single */}
                                    {isSelected && (
                                        <div
                                            className="fav-card-selected-badge"
                                            title={`Slot #${slotNumber}`}
                                            aria-label={`Slot ${slotNumber}`}
                                        >
                                            {max > 1 ? slotNumber : <Check size={11} strokeWidth={3.5} />}
                                        </div>
                                    )}

                                    {/* Pokémon Dex # Badge */}
                                    {isPokemonModal && item.id && (
                                        <span className="fav-card-dex-badge">
                                            #{String(item.id).padStart(3, "0")}
                                        </span>
                                    )}

                                    {/* Image Container */}
                                    <div className="fav-card-image-wrap">
                                        {imgSrc ? (
                                            <img
                                                src={imgSrc}
                                                alt={item.name}
                                                className="fav-card-img"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="fav-card-no-img">No Image</div>
                                        )}
                                    </div>

                                    {/* Info / Label */}
                                    <div className="fav-card-info">
                                        <span className="fav-card-name">
                                            {isPokemonModal ? getCleanName(item.name) : item.name}
                                        </span>
                                        {formLabel && (
                                             <span className="fav-card-form-tag" title={formLabel}>
                                                {formLabel}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Trainer hover preview */}
                {showHoverPreview && hovered?.image && (
                    <div className="fav-hover-preview">
                        <img src={hovered.image} alt={hovered.name} />
                        <div className="fav-hover-caption">{hovered.name}</div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
