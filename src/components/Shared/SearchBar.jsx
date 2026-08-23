import {
    Award,
    ChevronDown,
    ChevronUp,
    CirclePlus,
    Crown,
    Dna,
    Flame,
    Gamepad2,
    Hash,
    ListCollapse,
    Package,
    Search as SearchIcon,
    Sparkles,
    Star,
    X
} from "lucide-react";
import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { BALL_OPTIONS, GAME_OPTIONS, MARK_OPTIONS, METHOD_OPTIONS } from "../../Constants";
import { HUNT_SYSTEM } from "../../utils/huntSystem";
import { getPokemonCategories } from "../../utils/pokemonCategories";
import "../../css/Settings.css";
import "../../css/SearchBar.css";
import ShinyCharmModal from "./ShinyCharmModal";
import { SearchField, SelectField } from "../Shared/FormField";

// Get all unique methods from the hunt system
function getAllUniqueMethods() {
    const methodSet = new Set();

    // Extract all method names from all games
    Object.values(HUNT_SYSTEM).forEach(game => {
        if (game.methods) {
            game.methods.forEach(method => {
                methodSet.add(method.name);
            });
        }
    });

    // Convert to array and sort alphabetically
    return Array.from(methodSet).sort();
}

// Unique dropdown for SearchBar, with placeholder classes and image support
export function SearchbarIconDropdown({ id, options, value, onChange, placeholder, customBackground, customBorder, hideClearButton = false, disabled = false, isSidebar = false }) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [isClickingInside, setIsClickingInside] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const ref = React.useRef();

    React.useEffect(() => {
        function handle(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                if (!isClickingInside) {
                    setOpen(false);
                    setIsFocused(false);
                }
            }
        }
        if (open) document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [open, isClickingInside]);

    const selected = options.find(o => o.value === value) || null;

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <style>{`
                .dropdown-item-hover:hover {
                    background-color: var(--dropdown-item-hover-bg) !important;
                    color: var(--dropdown-item-hover-text) !important;
                }
                .dropdown-item-selected {
                    background-color: var(--searchbar-dropdown-selected) !important;
                }
            `}</style>
            <div className="relative w-full" tabIndex={0} ref={ref} style={{ zIndex: 10000 }}>
                <div className="relative w-full">
                    <div
                        className="mobile-dropdown-field flex items-center justify-between px-3 py-2 rounded-lg shadow-sm transition-colors duration-200 w-full"
                        style={{
                            backgroundColor: disabled ? 'var(--sidebar-edit-inputs-disabled)' : (customBackground || 'var(--searchbar-inputs)'),
                            border: isFocused && !disabled ? `1px solid var(--accent)` : `1px solid ${customBorder || 'var(--border-color)'}`,
                            height: '42px',
                            minHeight: '42px',
                            maxHeight: '42px',
                            overflow: 'hidden',
                            outline: 'none',
                            boxShadow: 'none',
                            opacity: disabled ? 0.6 : 1,
                            cursor: disabled ? 'not-allowed' : 'pointer'
                        }}
                        onMouseDown={() => !disabled && setIsClickingInside(true)}
                        onMouseUp={() => !disabled && setIsClickingInside(false)}
                        onClick={() => !disabled && setOpen(true)}
                    >
                        <div className="flex items-center flex-1 min-w-0">
                            {selected?.image && (
                                <img
                                    src={selected.image}
                                    alt=""
                                    className="w-5 h-5 mr-2 flex-shrink-0"
                                    onError={e => (e.target.style.display = "none")}
                                />
                            )}
                            {!selected?.image && selected?.icon && (
                                <span className="mr-2 flex items-center justify-center flex-shrink-0">
                                    {selected.icon}
                                </span>
                            )}
                            <div className="flex-1 flex items-center min-w-0 w-full">
                                <input
                                    type="text"
                                    className="flex-1 bg-transparent outline-none text-sm min-w-0 w-full"
                                    style={{
                                        color: disabled ? 'var(--sidebar-text-disabled)' : 'var(--dropdown-item-text)',
                                        border: 'none',
                                        cursor: disabled ? 'not-allowed' : 'text'
                                    }}
                                    placeholder={placeholder}
                                    value={(isFocused || open || search.length > 0) ? search : (selected && selected.value !== "" && selected.value !== "default") ? selected.name : ""}
                                    onChange={(e) => !disabled && setSearch(e.target.value)}
                                    onFocus={() => {
                                        if (!disabled) {
                                            setIsFocused(true);
                                            setOpen(true);
                                        }
                                    }}
                                    onClick={() => !disabled && setOpen(true)}
                                    onBlur={() => setIsFocused(false)}
                                    onKeyDown={(e) => {
                                        if (disabled) return;
                                        if (e.key === 'Escape') {
                                            setOpen(false);
                                            if (e.target && typeof e.target.blur === 'function') {
                                                e.target.blur();
                                            }
                                        }
                                    }}
                                    id={id}
                                    autoComplete="off"
                                    disabled={disabled}
                                    readOnly={disabled}
                                />
                                {!hideClearButton && !disabled && (
                                    <button
                                        type="button"
                                        className={`ml-2 p-1 transition-colors ${(search || (selected && selected.value !== "")) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                        style={{ color: 'var(--accent)' }}
                                        onMouseEnter={(e) => {
                                            e.target.style.color = 'var(--text)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.color = 'var(--accent)';
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSearch("");
                                            onChange("");
                                        }}
                                        title={search ? "Clear search" : "Clear selection"}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        {!disabled && (open ? (
                            <ChevronDown
                                className="ml-2 flex-shrink-0 transition-transform duration-200 cursor-pointer"
                                style={{ color: 'var(--accent)' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpen(false);
                                }}
                                title="Close dropdown"
                            />
                        ) : (
                            <ChevronUp
                                className="ml-2 flex-shrink-0 transition-transform duration-200 cursor-pointer"
                                style={{ color: 'var(--accent)' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpen(true);
                                }}
                                title="Open dropdown"
                            />
                        ))}
                    </div>
                </div>

                {createPortal(
                    <AnimatePresence>
                        {open && !disabled && (
                            <motion.ul
                                className={`${isSidebar ? "fixed" : "absolute"} rounded-md shadow-lg max-h-60 overflow-auto`}
                                style={{
                                    zIndex: 100000,
                                    backgroundColor: 'var(--searchbar-dropdown)',
                                    border: '1px solid var(--border-color)',
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: 'var(--accent) var(--searchbar-dropdown)',
                                    top: isSidebar
                                        ? (ref.current?.getBoundingClientRect().bottom || 0) + 4
                                        : (ref.current?.getBoundingClientRect().bottom || 0) + window.scrollY + 4,
                                    left: isSidebar
                                        ? (ref.current?.getBoundingClientRect().left || 0)
                                        : (ref.current?.getBoundingClientRect().left || 0) + window.scrollX,
                                    width: ref.current?.getBoundingClientRect().width || "auto"
                                }}
                                initial={{ opacity: 0, scale: 0.97, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.97, y: -4 }}
                                transition={{ duration: 0.13, ease: [0.16, 1, 0.3, 1] }}
                                role="listbox"
                                onMouseDown={() => setIsClickingInside(true)}
                                onMouseUp={() => setIsClickingInside(false)}
                            >
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map(opt => (
                                        <li
                                            key={opt.value}
                                            className={`px-3 py-1 cursor-pointer transition-colors duration-150 dropdown-item ${opt.value === value ? 'dropdown-item-selected' : 'dropdown-item-hover'
                                                }`}
                                            style={{
                                                backgroundColor: opt.value === value ? 'var(--searchbar-dropdown-selected)' : 'transparent',
                                                color: 'var(--dropdown-item-text)'
                                            }}
                                            onClick={() => {
                                                onChange(opt.value);
                                                setSearch("");
                                                setOpen(false);
                                                setIsFocused(false);
                                            }}
                                            tabIndex={0}
                                            role="option"
                                            aria-selected={opt.value === value}
                                        >
                                            <div className="flex items-center">
                                                {opt.image && (
                                                    <div 
                                                        className={`w-6 h-6 mr-2 flex items-center justify-center overflow-hidden flex-shrink-0 ${(opt.isType || opt.image?.includes('/type-icons/')) ? "rounded-full" : "rounded"}`}
                                                    >
                                                        <img
                                                            src={opt.image}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            style={(opt.isType || opt.image?.includes('/type-icons/')) ? { transform: "scale(1.35)", transformOrigin: "center" } : {}}
                                                            onError={e => (e.target.style.display = "none")}
                                                        />
                                                    </div>
                                                )}
                                                {!opt.image && opt.icon && (
                                                    <span className="w-6 h-6 mr-2 flex items-center justify-center">
                                                        {opt.icon}
                                                    </span>
                                                )}
                                                <span className="truncate">{opt.name}</span>
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <li className="px-3 py-2 text-center" style={{ color: 'var(--dropdown-item-text)' }}>
                                        No results found
                                    </li>
                                )}
                            </motion.ul>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
            </div>
        </>
    );
}

// Poké Ball icon
export function PokeballIcon({ size, color, className = "", style = {}, ...props }) {
    const strokeColor = color || "currentColor";
    const w = size ? (typeof size === "number" ? `${size}px` : size) : "1.3em";
    const h = size ? (typeof size === "number" ? `${size}px` : size) : "1.3em";

    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            width={w}
            height={h}
            className={className}
            style={{ display: "inline-block", verticalAlign: "middle", ...style }}
            {...props}
        >
            <circle cx="12" cy="12" r="10" fill="none" />
            <path d="M2 12h20" />
            <circle cx="12" cy="12" r="3.5" fill="none" />
            <circle cx="12" cy="12" r="1.5" fill={strokeColor} />
        </svg>
    );
}

// Nickname / ID Badge icon
export function NicknameIcon({ size = 16, color = "currentColor", className = "", style = {}, ...props }) {
    const w = typeof size === "number" ? `${size}px` : size;
    const h = typeof size === "number" ? `${size}px` : size;

    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            width={w}
            height={h}
            className={className}
            style={{ display: "inline-block", verticalAlign: "middle", ...style }}
            {...props}
        >
            <circle cx="9" cy="9" r="2" />
            <path d="M13 15C13 16.1046 13 17 9 17C5 17 5 16.1046 5 15C5 13.8954 6.79086 13 9 13C11.2091 13 13 13.8954 13 15Z" />
            <path d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12C22 15.7712 22 17.6569 20.8284 18.8284C19.6569 20 17.7712 20 14 20H10C6.22876 20 4.34315 20 3.17157 18.8284C2 17.6569 2 15.7712 2 12Z" />
            <path d="M19 12H15" />
            <path d="M19 9H14" />
            <path d="M19 15H16" />
        </svg>
    );
}
// Bullseye / Target icon for Hunt Method
export function BullseyeIcon({ size = 16, color = "currentColor", className = "", style = {}, ...props }) {
    const w = typeof size === "number" ? `${size}px` : size;
    const h = typeof size === "number" ? `${size}px` : size;

    return (
        <svg
            viewBox="0 0 56 56"
            fill={color}
            width={w}
            height={h}
            className={className}
            style={{ display: "inline-block", verticalAlign: "middle", ...style }}
            {...props}
        >
            <path
                d="M 1.6349 29.6579 L 6.3092 29.6579 C 7.1152 40.3421 15.6810 48.9309 26.3422 49.7369 L 26.3422 54.3421 C 26.3422 55.2632 27.0560 56 27.9770 56 C 28.9211 56 29.6349 55.2632 29.6349 54.3421 L 29.6349 49.7369 C 40.2961 48.9309 48.8621 40.3421 49.6676 29.6579 L 54.3423 29.6579 C 55.2633 29.6579 55.9999 28.9210 55.9999 28 C 55.9999 27.0790 55.2633 26.3651 54.3423 26.3651 L 49.6676 26.3651 C 48.8621 15.6809 40.2961 7.0921 29.6349 6.2862 L 29.6349 1.6579 C 29.6349 .7368 28.9211 -2.9976e-15 27.9770 -2.9976021664879227e-15 C 27.0560 -2.9976e-15 26.3422 .7368 26.3422 1.6578829473684213 L 26.3422 6.2862 C 15.6810 7.0921 7.1152 15.6809 6.3092 26.3651 L 1.6349 26.3651 C .7139 26.3651 .1 27.0790 .1 28 C .1 28.9210 .7139 29.6579 1.6349 29.6579 Z M 27.9770 18.9046 C 28.9211 18.9046 29.6349 18.1678 29.6349 17.2467 L 29.6349 10.0395 C 38.2928 10.8224 45.0164 17.6151 45.7766 26.3651 L 38.7534 26.3651 C 37.8323 26.3651 37.0954 27.0790 37.0954 28 C 37.0954 28.9210 37.8323 29.6579 38.7534 29.6579 L 45.7766 29.6579 C 45.0164 38.3849 38.2928 45.1776 29.6349 45.9605 L 29.6349 38.7533 C 29.6349 37.8322 28.9211 37.1185 27.9770 37.1185 C 27.0560 37.1185 26.3422 37.8322 26.3422 38.7533 L 26.3422 45.9605 C 17.6842 45.1776 10.9606 38.3849 10.2007 29.6579 L 17.2238 29.6579 C 18.1448 29.6579 18.8816 28.9210 18.8816 28 C 18.8816 27.0790 18.1448 26.3651 17.2238 26.3651 L 10.2007 26.3651 C 10.9606 17.6151 17.6842 10.8224 26.3422 10.0395 L 26.3422 17.2467 C 26.3422 18.1678 27.0560 18.9046 27.9770 18.9046 Z"
            />
        </svg>
    );
}

export default function SearchBar({
    filters,
    setFilters,
    typeOptions,
    genOptions,
    showShiny,
    setShowShiny,
    viewingUsername = null,
    viewedUserShinyCharmGames = [],
    caughtInfoMap = null
}) {
    const [collapsed, setCollapsed] = React.useState(true);
    const [shinyCharmModalOpen, setShinyCharmModalOpen] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

    // Extract all games that actually have caught Pokémon in caughtInfoMap
    const availableCaughtGameOptions = React.useMemo(() => {
        const baseOptions = GAME_OPTIONS.filter(opt => opt.value !== "");
        if (!caughtInfoMap || typeof caughtInfoMap !== "object") {
            return baseOptions;
        }

        const caughtGamesSet = new Set();
        Object.values(caughtInfoMap).forEach(info => {
            if (!info) return;
            if (Array.isArray(info.entries)) {
                info.entries.forEach(entry => {
                    if (entry?.game) caughtGamesSet.add(entry.game);
                });
            }
            if (info.game) {
                caughtGamesSet.add(info.game);
            }
        });

        // Ensure any currently selected game filter is retained in options
        if (Array.isArray(filters?.game)) {
            filters.game.forEach(g => caughtGamesSet.add(g));
        }

        return baseOptions.filter(opt => caughtGamesSet.has(opt.value));
    }, [caughtInfoMap, filters?.game]);

    // Extract all balls that actually have caught Pokémon in caughtInfoMap
    const availableCaughtBallOptions = React.useMemo(() => {
        const baseOptions = BALL_OPTIONS.filter(opt => opt.value !== "" && opt.value !== "Origin Ball");
        if (!caughtInfoMap || typeof caughtInfoMap !== "object") {
            return baseOptions;
        }

        const caughtBallsSet = new Set();
        Object.values(caughtInfoMap).forEach(info => {
            if (!info) return;
            if (Array.isArray(info.entries)) {
                info.entries.forEach(entry => {
                    if (entry?.ball) caughtBallsSet.add(entry.ball.toLowerCase());
                });
            }
            if (info.ball) {
                caughtBallsSet.add(info.ball.toLowerCase());
            }
        });

        // Ensure any currently selected ball filter is retained in options
        if (Array.isArray(filters?.ball)) {
            filters.ball.forEach(b => caughtBallsSet.add(String(b).toLowerCase()));
        }

        return baseOptions.filter(opt =>
            caughtBallsSet.has(opt.value.toLowerCase()) ||
            caughtBallsSet.has((opt.name || "").toLowerCase())
        );
    }, [caughtInfoMap, filters?.ball]);

    // Extract all marks that actually have caught Pokémon in caughtInfoMap
    const availableCaughtMarkOptions = React.useMemo(() => {
        const baseOptions = MARK_OPTIONS.filter(opt => opt.value !== "");
        if (!caughtInfoMap || typeof caughtInfoMap !== "object") {
            return baseOptions;
        }

        const caughtMarksSet = new Set();
        Object.values(caughtInfoMap).forEach(info => {
            if (!info) return;
            const processMark = (rawMark) => {
                if (!rawMark) return;
                const v = String(rawMark).trim().toLowerCase();
                if (v && v !== "none" && v !== "unknown") {
                    caughtMarksSet.add(v);
                }
            };

            if (Array.isArray(info.entries)) {
                info.entries.forEach(entry => {
                    if (Array.isArray(entry?.marks) && entry.marks.length > 0) {
                        entry.marks.forEach(processMark);
                    } else if (entry?.mark) {
                        processMark(entry.mark);
                    }
                });
            } else {
                if (Array.isArray(info.marks) && info.marks.length > 0) {
                    info.marks.forEach(processMark);
                } else if (info.mark) {
                    processMark(info.mark);
                }
            }
        });

        // Ensure any currently selected mark filter is retained in options
        if (Array.isArray(filters?.mark)) {
            filters.mark.forEach(m => caughtMarksSet.add(String(m).toLowerCase()));
        }

        return baseOptions.filter(opt =>
            caughtMarksSet.has(opt.value.toLowerCase()) ||
            caughtMarksSet.has((opt.name || "").toLowerCase())
        );
    }, [caughtInfoMap, filters?.mark]);

    // Extract all hunt methods that actually have caught Pokémon in caughtInfoMap
    const availableCaughtMethodOptions = React.useMemo(() => {
        const allMethods = getAllUniqueMethods();
        if (!caughtInfoMap || typeof caughtInfoMap !== "object") {
            return allMethods.map(method => ({ label: method, value: method }));
        }

        const caughtMethodsSet = new Set();
        Object.values(caughtInfoMap).forEach(info => {
            if (!info) return;
            if (Array.isArray(info.entries)) {
                info.entries.forEach(entry => {
                    if (entry?.method && entry.method !== "None" && entry.method !== "none") {
                        caughtMethodsSet.add(entry.method);
                    }
                });
            }
            if (info.method && info.method !== "None" && info.method !== "none") {
                caughtMethodsSet.add(info.method);
            }
        });

        // Ensure any currently selected method filter is retained in options
        if (Array.isArray(filters?.method)) {
            filters.method.forEach(m => caughtMethodsSet.add(m));
        }

        // Filter and sort the unique caught methods
        const methodsList = Array.from(caughtMethodsSet)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        return methodsList.map(method => ({
            label: method,
            value: method
        }));
    }, [caughtInfoMap, filters?.method]);

    React.useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="mb-8 relative z-20">
            <ShinyCharmModal
                isOpen={shinyCharmModalOpen}
                onClose={() => setShinyCharmModalOpen(false)}
                readOnly={!!viewingUsername}
                viewedUserShinyCharmGames={viewedUserShinyCharmGames}
                viewedUsername={viewingUsername}
            />
            <form data-tutorial-id="search-bar" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4 rounded-lg shadow-sm max-w-[1300px] mx-auto" style={{ backgroundColor: 'var(--searchbar-bg)', border: '1px solid var(--border-color)' }} onSubmit={e => e.preventDefault()} autoComplete="off">
                {/* Mobile-only header */}
                <div className="md:hidden col-span-full mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Search & Filters</h2>
                    <button
                        className="p-2 rounded-lg transition-colors duration-200 hover:scale-105"
                        onClick={() => setCollapsed(v => !v)}
                        aria-label={collapsed ? "Expand search options" : "Collapse search options"}
                        tabIndex={0}
                    >
                        <ListCollapse size={22} strokeWidth={4} style={{ color: 'var(--accent)' }} />
                    </button>
                </div>
                {/* Name/Dex input */}
                <SearchField
                    id="searchbar-name"
                    value={filters.searchTerm || ""}
                    onChange={e => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                    onClear={() => setFilters(f => ({ ...f, searchTerm: "" }))}
                    placeholder="Name or Dex #"
                    startIcon={<SearchIcon size={16} />}
                    size="md"
                    fullWidth
                    maxLength={20}
                />

                {/* Search options - always visible on PC (md+), collapsible on mobile only */}
                {(collapsed === false || window.innerWidth >= 768) && (
                    <>
                        {/* Game Caught Dropdown - Only show games that have caught pokemon */}
                        <SelectField
                            id="searchbar-game"
                            options={availableCaughtGameOptions}
                            value={filters.game || []}
                            onChange={values => setFilters(f => ({ ...f, game: values }))}
                            placeholder="Game Caught"
                            multiple
                            searchable
                            searchPlaceholder="Filter games..."
                            clearable
                            startIcon={<Gamepad2 size={16} />}
                            size="md"
                            fullWidth
                        />

                        {/* Game Obtainable In Multi-Select Dropdown */}
                        <SelectField
                            id="searchbar-game-obtainable"
                            options={GAME_OPTIONS.filter(opt => opt.value !== "" && opt.value !== "Home")}
                            value={filters.gameObtainable || []}
                            onChange={values => setFilters(f => ({ ...f, gameObtainable: values }))}
                            placeholder="Game Obtainable In"
                            multiple
                            searchable
                            searchPlaceholder="Filter games..."
                            clearable
                            startIcon={<Gamepad2 size={16} />}
                            size="md"
                            fullWidth
                        />

                        {/* Ball Dropdown */}
                        <SelectField
                            id="searchbar-ball"
                            options={availableCaughtBallOptions}
                            value={filters.ball || []}
                            onChange={values => setFilters(f => ({ ...f, ball: values }))}
                            placeholder="Ball Caught"
                            multiple
                            searchable
                            searchPlaceholder="Filter balls..."
                            clearable
                            startIcon={<PokeballIcon size={16} />}
                            size="md"
                            fullWidth
                        />

                        {/* Type Dropdown */}
                        <SelectField
                            id="searchbar-type"
                            options={[
                                {
                                    label: "Dual Type",
                                    value: "dual-type",
                                    image: "/type-icons/dual.png",
                                    isType: true
                                },
                                ...typeOptions.filter(Boolean).map(t => ({
                                    label: t.charAt(0).toUpperCase() + t.slice(1),
                                    value: t,
                                    image: `/type-icons/${t.toLowerCase()}.png`,
                                    isType: true
                                }))
                            ]}
                            value={filters.type || []}
                            onChange={values => {
                                const isDualType = values.includes("dual-type");
                                if (isDualType) {
                                    const pureTypes = values.filter(v => v !== "dual-type");
                                    const limitedTypes = pureTypes.slice(-2);
                                    setFilters(f => ({ ...f, type: ["dual-type", ...limitedTypes] }));
                                } else {
                                    setFilters(f => ({ ...f, type: values }));
                                }
                            }}
                            placeholder="Type"
                            multiple
                            searchable
                            searchPlaceholder="Filter types..."
                            clearable
                            startIcon={<Flame size={16} />}
                            size="md"
                            fullWidth
                        />

                        {/* Gen Dropdown */}
                        <SelectField
                            id="searchbar-gen"
                            options={[...new Set(genOptions.filter(Boolean).map(g => String(g)))].map(g => ({
                                label: `Gen ${g}`,
                                value: g
                            }))}
                            value={filters.gen || []}
                            onChange={values => setFilters(f => ({ ...f, gen: values }))}
                            placeholder="Generation"
                            multiple
                            clearable
                            startIcon={<Hash size={16} />}
                            size="md"
                            fullWidth
                        />

                        {/* Mark Dropdown */}
                        <SelectField
                            id="searchbar-mark"
                            options={availableCaughtMarkOptions}
                            value={filters.mark || []}
                            onChange={values => setFilters(f => ({ ...f, mark: values }))}
                            placeholder="Mark/Ribbon"
                            multiple
                            searchable
                            searchPlaceholder="Filter marks..."
                            clearable
                            startIcon={<Award size={16} />}
                            size="md"
                            fullWidth
                        />

                        {/* Method Dropdown */}
                        <SelectField
                            id="searchbar-method"
                            options={availableCaughtMethodOptions}
                            value={filters.method || []}
                            onChange={values => setFilters(f => ({ ...f, method: values }))}
                            placeholder="Hunt Method"
                            multiple
                            searchable
                            searchPlaceholder="Filter methods..."
                            clearable
                            startIcon={<BullseyeIcon size={16} />}
                            size="md"
                            fullWidth
                        />

                        {/* Category Multi-Select Dropdown */}
                        <SelectField
                            id="searchbar-category"
                            options={getPokemonCategories().map(c => ({
                                label: c.name || c.label,
                                value: c.value,
                                icon: c.icon || null,
                                image: c.image || null
                            }))}
                            value={filters.categories || []}
                            onChange={values => setFilters(f => ({ ...f, categories: values }))}
                            placeholder="Category"
                            multiple
                            searchable
                            searchPlaceholder="Filter categories..."
                            clearable
                            startIcon={<Crown size={16} />}
                            size="md"
                            fullWidth
                        />

                        {/* Caught/Uncaught/Failed Dropdown */}
                        <SelectField
                            id="searchbar-caught"
                            options={[
                                { label: "None", value: "" },
                                { label: "Caught", value: "caught" },
                                { label: "Uncaught", value: "uncaught" },
                                { label: "Failed", value: "failed" }
                            ]}
                            value={filters.caught}
                            onChange={val => setFilters(f => ({ ...f, caught: val }))}
                            placeholder="Caught/Uncaught"
                            clearable
                            startIcon={<Star size={16} />}
                            size="md"
                            fullWidth
                        />
                    </>
                )}
                <div className={`col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-5 mt-4 pt-4 ${isMobile ? 'flex flex-col gap-3' : 'flex items-center justify-center gap-6 relative'}`} style={{ borderTop: '1px solid var(--border-color)' }}>
                    {/* Shiny Charm Button - on mobile: first row centered, on desktop: absolute left */}
                    <button
                        onClick={() => setShinyCharmModalOpen(true)}
                        className={`${isMobile ? 'self-center' : 'absolute left-0'} flex items-center justify-center transition-transform hover:scale-110`}
                        title="Manage Shiny Charm games"
                        style={{ color: 'var(--text)' }}
                    >
                        <img
                            src="/Charm.png"
                            alt="Shiny Charm"
                            className="w-10 h-10"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'block';
                                }
                            }}
                        />
                        <span style={{ display: 'none' }}>✨</span>
                    </button>

                    {/* Centered switches */}
                    <div className={`flex items-center flex-wrap justify-center ${isMobile ? 'gap-x-4 gap-y-2 w-full' : 'gap-6'}`}>
                        {/* Segmented Control: Regular | Shiny */}
                        <div
                            data-tutorial-id="shiny-toggle"
                            className="dex-shiny-segmented-control"
                            role="group"
                            aria-label="Pokemon sprite display mode"
                        >
                            <button
                                type="button"
                                className={`dex-shiny-segmented-btn ${!showShiny ? 'active is-regular' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowShiny(false);
                                }}
                                title="Show regular Pokémon sprites"
                            >
                                <span className="dex-segmented-dot" />
                                <span>Regular</span>
                            </button>
                            <button
                                type="button"
                                className={`dex-shiny-segmented-btn ${showShiny ? 'active is-shiny' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowShiny(true);
                                }}
                                title="Show shiny Pokémon sprites"
                            >
                                <Sparkles
                                    size={isMobile ? 14 : 16}
                                    className={`dex-segmented-sparkles ${showShiny ? 'active' : ''}`}
                                />
                                <span>Shiny</span>
                            </button>
                        </div>

                        {/* Show Evolutions Switch - show when there's a search term OR a category that supports evolutions is selected */}
                        {(filters.searchTerm || ['pseudo-legendary', 'starter', 'fossil', 'baby'].some(c => (filters.categories || []).includes(c))) && (
                            <label className="flex items-center gap-1.5 cursor-pointer" title="Show evolution chain members in search results">
                                <div className="switch">
                                    <input
                                        type="checkbox"
                                        className="switch-input"
                                        checked={filters.showEvolutions || false}
                                        onChange={e => setFilters(f => ({ ...f, showEvolutions: e.target.checked }))}
                                    />
                                    <div className="switch-slider" />
                                </div>
                                <span className={`font-medium flex items-center gap-1.5 ${isMobile ? 'text-sm' : 'text-base gap-2'}`} style={{ color: 'var(--text)' }}>
                                    <Dna
                                        size={isMobile ? 16 : 20}
                                        style={{
                                            color: filters.showEvolutions ? 'var(--accent)' : '#6b7280',
                                            filter: filters.showEvolutions ? 'none' : 'grayscale(100%)'
                                        }}
                                    />
                                    Show Evolutions
                                </span>
                            </label>
                        )}

                        {/* Show Full Box Switch - show when there is a search term */}
                        {filters.searchTerm && (
                            <label className="flex items-center gap-1.5 cursor-pointer" title="Show complete box containing search results">
                                <div className="switch">
                                    <input
                                        type="checkbox"
                                        className="switch-input"
                                        checked={filters.showFullBox || false}
                                        onChange={e => setFilters(f => ({ ...f, showFullBox: e.target.checked }))}
                                    />
                                    <div className="switch-slider" />
                                </div>
                                <span className={`font-medium flex items-center gap-1.5 ${isMobile ? 'text-sm' : 'text-base gap-2'}`} style={{ color: 'var(--text)' }}>
                                    <Package
                                        size={isMobile ? 16 : 20}
                                        style={{
                                            color: filters.showFullBox ? 'var(--accent)' : '#6b7280',
                                            filter: filters.showFullBox ? 'none' : 'grayscale(100%)'
                                        }}
                                    />
                                    Show Full Box
                                </span>
                            </label>
                        )}
                    </div>

                    {/* Mobile tip removed here; moved below entire section */}

                </div>



            </form>
        </div>
    );
}
