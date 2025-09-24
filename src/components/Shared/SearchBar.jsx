import {
    Award,
    ChevronDown,
    ChevronUp,
    CirclePlus,
    Flame,
    Gamepad2,
    Hash,
    ListCollapse,
    Search as SearchIcon,
    Sparkles,
    Star,
    X
} from "lucide-react";
import React from "react";
import { createPortal } from "react-dom";
import { BALL_OPTIONS, GAME_OPTIONS, MARK_OPTIONS, METHOD_OPTIONS } from "../../Constants";
import { HUNT_SYSTEM } from "../../utils/huntSystem";
import "../../css/Settings.css";

import { IconDropdown } from "../Shared/IconDropdown";

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
export function SearchbarIconDropdown({ id, options, value, onChange, placeholder, customBackground, customBorder, hideClearButton = false, disabled = false }) {
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

    const selected = options.find(o => o.value === value) || options[0];

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
                        cursor: disabled ? 'not-allowed' : 'default'
                    }}
                    onMouseDown={() => !disabled && setIsClickingInside(true)}
                    onMouseUp={() => !disabled && setIsClickingInside(false)}
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
                                        if (selected && selected.value !== "") {
                                            const noneOption = options.find(opt => opt.value === "");
                                            if (noneOption) {
                                                onChange(noneOption.value);
                                            }
                                        }
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
                            onClick={() => setOpen(false)}
                            title="Close dropdown"
                        />
                    ) : (
                        <ChevronUp 
                            className="ml-2 flex-shrink-0 transition-transform duration-200 cursor-pointer" 
                            style={{ color: 'var(--accent)' }}
                            onClick={() => setOpen(true)}
                            title="Open dropdown"
                        />
                    ))}
                </div>
            </div>

            {open && !disabled && createPortal(
                <ul 
                    className="absolute rounded-md shadow-lg max-h-60 overflow-auto"
                    style={{ 
                        zIndex: 100000,
                        backgroundColor: 'var(--searchbar-dropdown)', 
                        border: '1px solid var(--border-color)',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'var(--accent) var(--searchbar-dropdown)',
                        top: ref.current?.getBoundingClientRect().bottom + window.scrollY + 4,
                        left: ref.current?.getBoundingClientRect().left + window.scrollX,
                        width: ref.current?.getBoundingClientRect().width
                    }} 
                    role="listbox"
                    onMouseDown={() => setIsClickingInside(true)}
                    onMouseUp={() => setIsClickingInside(false)}
                >
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(opt => (
                            <li
                                key={opt.value}
                                className={`px-3 py-1 cursor-pointer transition-colors duration-150 dropdown-item ${
                                    opt.value === value ? 'dropdown-item-selected' : 'dropdown-item-hover'
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
                                        <img
                                            src={opt.image}
                                            alt=""
                                            className="w-6 h-6 mr-2 rounded"
                                            onError={e => (e.target.style.display = "none")}
                                        />
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
                </ul>,
                document.body
            )}
        </div>
        </>
    );
}


// Poké Ball icon, yellow
export function PokeballIcon({ style = {}, ...props }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            width="1.3em"
            height="1.3em"
            style={{ display: "block", ...style }}
            {...props}
        >
            <circle cx="12" cy="12" r="10" fill="none" />
            <path d="M2 12h20" />
            <circle cx="12" cy="12" r="3" fill="none" />
            <circle cx="12" cy="12" r="1" fill="none" />
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
}) {
    const [collapsed, setCollapsed] = React.useState(true);
    
    return (
        <div className="mb-8" style={{ position: 'relative', zIndex: 100000 }}>
            <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-lg shadow-sm max-w-[1300px] mx-auto" style={{ backgroundColor: 'var(--searchbar-bg)', border: '1px solid var(--border-color)' }} onSubmit={e => e.preventDefault()} autoComplete="off">
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
            <div className="relative flex items-center" style={{ height: '42px' }}>
                <SearchIcon className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <div className="relative w-full">
                    <input
                        type="text"
                        className="w-full bg-transparent outline-none text-sm px-3 py-2 pr-4 md:pr-10 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-[var(--accent)] focus-within:border-[var(--accent)] transition-colors duration-200"
                        style={{ 
                            backgroundColor: 'var(--searchbar-inputs)', 
                            border: '1px solid var(--border-color)',
                            color: 'var(--sidebar-text)' 
                        }}
                        placeholder="Name or Dex #"
                        value={filters.searchTerm}
                        onChange={e => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                        maxLength={20}
                        id="searchbar-name"
                        autoComplete="off"
                    />
                    {filters.searchTerm && (
                        <button
                            type="button"
                            className="absolute -right-2 md:right-3 top-1/2 transform -translate-y-1/2 p-1 transition-colors"
                            style={{ color: 'var(--accent)' }}
                            onMouseEnter={(e) => {
                                e.target.style.color = 'var(--text)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.color = 'var(--accent)';
                            }}
                            onClick={() => setFilters(f => ({ ...f, searchTerm: "" }))}
                            title="Clear search"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Search options - always visible on PC (md+), collapsible on mobile only */}
            {(collapsed === false || window.innerWidth >= 768) && (
                <>
                {/* Game Dropdown */}
                <div className="relative flex items-center" style={{ height: '42px' }}>
                    <Gamepad2 className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                    <SearchbarIconDropdown
                        id="searchbar-game"
                        options={[
                            { name: "None", value: "" },
                            ...GAME_OPTIONS.filter(opt => opt.name !== "None")
                        ]}
                        value={filters.game}
                        onChange={val => setFilters(f => ({ ...f, game: val }))}
                        placeholder="Game Caught"
                    />
                </div>

            {/* Ball Dropdown */}
            <div className="relative flex items-center" style={{ height: '42px' }}>
                <PokeballIcon className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <SearchbarIconDropdown
                    id="searchbar-ball"
                    options={[
                        { name: "None", value: "" },
                        ...BALL_OPTIONS.filter(opt => opt.name !== "None")
                    ]}
                    value={filters.ball}
                    onChange={val => setFilters(f => ({ ...f, ball: val }))}
                    placeholder="Ball Caught"
                />
            </div>

            {/* Type Dropdown */}
            <div className="relative flex items-center" style={{ height: '42px' }}>
                <Flame className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <SearchbarIconDropdown
                    id="searchbar-type"
                    options={[
                        { name: "None", value: "" },
                        ...typeOptions.filter(Boolean).map(t => ({
                            name: t.charAt(0).toUpperCase() + t.slice(1),
                            value: t,
                            image: `/type-icons/${t.toLowerCase()}.png`
                        }))
                    ]}
                    value={filters.type}
                    onChange={val => setFilters(f => ({ ...f, type: val }))}
                    placeholder="Type"
                />
            </div>

            {/* Gen Dropdown */}
            <div className="relative flex items-center" style={{ height: '42px' }}>
                <Hash className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <SearchbarIconDropdown
                    id="searchbar-gen"
                    options={[
                        { name: "None", value: "" },
                        ...[...new Set(genOptions.filter(Boolean).map(g => String(g)))].map(g => ({
                            name: `Gen ${g}`,
                            value: g
                        }))
                    ]}
                    value={filters.gen}
                    onChange={val => setFilters(f => ({ ...f, gen: val }))}
                    placeholder="Generation"
                />
            </div>




            {/* Mark Dropdown */}
            <div className="relative flex items-center" style={{ height: '42px' }}>
                <Award className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <SearchbarIconDropdown
                    id="searchbar-mark"
                    options={[
                        { name: "None", value: "" },
                        ...MARK_OPTIONS.filter(opt => opt.name !== "None")
                    ]}
                    value={filters.mark}
                    onChange={val => setFilters(f => ({ ...f, mark: val }))}
                    placeholder="Mark/Ribbon"
                />
            </div>

            {/* Method Dropdown */}
            <div className="relative flex items-center" style={{ height: '42px' }}>
                <CirclePlus className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <SearchbarIconDropdown
                    id="searchbar-method"
                    options={[
                        { name: "None", value: "" },
                        ...getAllUniqueMethods().map(method => ({
                            name: method,
                            value: method
                        }))
                    ]}
                    value={filters.method}
                    onChange={val => setFilters(f => ({ ...f, method: val }))}
                    placeholder="Hunt Method"
                />
            </div>

            {/* Caught/Uncaught Dropdown */}
            <div className="relative flex items-center" style={{ height: '42px' }}>
                <Star className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <SearchbarIconDropdown
                    id="searchbar-caught"
                    options={[
                        { name: "None", value: "" },
                        { name: "Caught", value: "caught" },
                        { name: "Uncaught", value: "uncaught" }
                    ]}
                    value={filters.caught}
                    onChange={val => setFilters(f => ({ ...f, caught: val }))}
                    placeholder="Caught/Uncaught"
                />
            </div>
                </>
            )}
<div className="col-span-1 md:col-span-2 lg:col-span-4 flex items-center justify-center gap-6 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
  {/* Shiny Switch */}
  <label className="flex items-center gap-2 cursor-pointer" title="Toggle all shiny sprites">
    <div className="switch">
      <input
        type="checkbox"
        className="switch-input"
        checked={showShiny}
        onChange={e => setShowShiny(e.target.checked)}
      />
      <div className="switch-slider" />
    </div>
    <span className="text-base font-medium flex items-center gap-2" style={{ color: 'var(--text)' }}>
      <Sparkles 
        size={20} 
        style={{ 
          color: showShiny ? '#fbbf24' : '#6b7280',
          filter: showShiny ? 'none' : 'grayscale(100%)'
        }} 
      />
      Shiny
    </span>
  </label>
  

  {/* Mobile tip removed here; moved below entire section */}

</div>



            </form>
        </div>
    );
}
