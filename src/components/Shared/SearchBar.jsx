import {
    Award,
    CirclePlus,
    Flame,
    Gamepad2,
    Hash,
    Search as SearchIcon,
    Star
} from "lucide-react";
import React from "react";
import { BALL_OPTIONS, GAME_OPTIONS, MARK_OPTIONS, METHOD_OPTIONS } from "../../Constants";
import "../../css/SearchBar.css";
import { IconDropdown } from "../Shared/IconDropdown";

// Unique dropdown for SearchBar, with placeholder classes and image support
function SearchbarIconDropdown({ id, options, value, onChange, placeholder }) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const ref = React.useRef();

    React.useEffect(() => {
        function handle(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        if (open) document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [open]);

    const selected = options.find(o => o.value === value) || options[0];

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={`searchbar-icon-dropdown${open ? " open" : ""}`} tabIndex={0} ref={ref}>
            <button
                type="button"
                className={
                    "searchbar-icon-dropdown-selected" +
                    (selected && selected.value === "" ? " is-placeholder" : "")
                }
                aria-haspopup="listbox"
                aria-expanded={open}
                id={id}
                onClick={() => {
                    setOpen(o => !o);
                    setSearch(""); // clear search on open
                }}
            >
                <>
                    {selected?.image && (
                        <img
                            src={selected.image}
                            alt=""
                            className="dropdown-selected-image"
                            width={22}
                            height={22}
                            style={{ marginRight: 8, verticalAlign: 'middle', pointerEvents: 'none' }}
                            onError={e => (e.target.style.display = "none")}
                        />
                    )}
                    <>
                        {selected && selected.value && (
                            <img
                                src={`/type-icons/${selected.value}.png`}
                                alt={selected.name}
                                className="type-icon-img"
                                width={22}
                                height={22}
                                style={{ marginRight: 8, verticalAlign: "middle", pointerEvents: "none" }}
                                onError={e => (e.target.style.display = "none")}
                            />
                        )}
                        {selected && selected.value === "" ? placeholder : (selected ? selected.name : placeholder)}
                    </>
                </>
                <span className="searchbar-icon-dropdown-arrow">▼</span>
            </button>

            {open && (
                <ul className="searchbar-icon-dropdown-list" role="listbox">
                    <li className="dropdown-search-wrapper">
                        <input
                            type="text"
                            className="dropdown-search-input"
                            placeholder="Type to filter..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </li>
                    {filteredOptions.map(opt => (
                        <li
                            key={opt.value}
                            className={
                                "searchbar-icon-dropdown-option" +
                                (opt.value === value ? " selected" : "") +
                                (opt.value === "" ? " placeholder-option" : "")
                            }
                            onClick={() => {
                                onChange(opt.value);
                                setOpen(false);
                            }}
                            tabIndex={0}
                            role="option"
                            aria-selected={opt.value === value}
                        >
                            {opt.image && (
                                <img
                                    src={opt.image}
                                    alt=""
                                    className="dropdown-option-image"
                                    width={24}
                                    height={24}
                                    style={{ marginRight: 8, verticalAlign: 'middle', pointerEvents: 'none' }}
                                    onError={e => (e.target.style.display = "none")}
                                />
                            )}
                            {opt.value && (
                                <img
                                    src={`/type-icons/${opt.value}.png`}
                                    alt={opt.name}
                                    className="type-icon-img"
                                    width={28}
                                    height={28}
                                    style={{ marginRight: 9, verticalAlign: "middle", pointerEvents: "none" }}
                                    onError={e => (e.target.style.display = "none")}
                                />
                            )}
                            {opt.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
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
  showForms,
  setShowForms,
}) {
    return (
        <form className="search-bar-grid" onSubmit={e => e.preventDefault()} autoComplete="off">
            {/* Name/Dex input */}
            <div className="filter-input">
                <SearchIcon />
                <input
                    type="text"
                    placeholder="Name or Dex #"
                    value={filters.searchTerm}
                    onChange={e => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                    maxLength={20}
                />
            </div>

            {/* Game Dropdown */}
            <div className="filter-input">
                <Gamepad2 />
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
            <div className="filter-input">
                <PokeballIcon />
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
            <div className="filter-input">
                <Flame />
                <SearchbarIconDropdown
                    id="searchbar-type"
                    options={[
                        { name: "None", value: "" },
                        ...typeOptions.filter(Boolean).map(t => ({
                            name: t.charAt(0).toUpperCase() + t.slice(1),
                            value: t
                        }))
                    ]}
                    value={filters.type}
                    onChange={val => setFilters(f => ({ ...f, type: val }))}
                    placeholder="Type"
                />
            </div>

            {/* Gen Dropdown */}
            <div className="filter-input">
                <Hash />
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
            <div className="filter-input">
                <Award />
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
            <div className="filter-input">
                <CirclePlus />
                <SearchbarIconDropdown
                    id="searchbar-method"
                    options={[
                        { name: "None", value: "" },
                        ...METHOD_OPTIONS.filter(m => m).map(opt =>
                            typeof opt === "string"
                                ? { name: opt, value: opt }
                                : { name: opt.name, value: opt.value }
                        )
                    ]}
                    value={filters.method}
                    onChange={val => setFilters(f => ({ ...f, method: val }))}
                    placeholder="Hunt Method"
                />
            </div>

            {/* Caught/Uncaught Dropdown */}
            <div className="filter-input">
                <Star />
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
<div className="search-toggles-row search-toggles-row--fullwidth">
  {/* Shiny Switch */}
  <label className="switch-label" title="Toggle all shiny sprites">
    <span className="switch">
      <input
        type="checkbox"
        className="switch-input"
        checked={showShiny}
        onChange={e => setShowShiny(e.target.checked)}
      />
      <span className="switch-slider" />
      <span className="switch-emoji">✨</span>
    </span>
  </label>
  {/* Forms Switch */}
  <label className="switch-label" title="Toggle alternate forms">
    <span className="switch">
      <input
        type="checkbox"
        className="switch-input"
        checked={showForms}
        onChange={e => setShowForms(e.target.checked)}
      />
      <span className="switch-slider" />
      <span className="switch-emoji">🧬</span>
    </span>
  </label>
</div>



        </form>
    );
}
