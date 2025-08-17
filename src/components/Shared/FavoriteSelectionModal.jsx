import { useState, useEffect } from "react";
import "../../css/FavoriteSelectionModal.css";
import "../../css/SearchBar.css";
import { formatPokemonName, formatTrainerName } from "../../utils";

export default function FavoriteSelectionModal({
    isOpen,
    onClose,
    title,
    options,
    selected = [],
    onChange,
    max = 5,
}) {
    const [tempSelection, setTempSelection] = useState([]);
    const [search, setSearch] = useState("");
    const [showShiny, setShowShiny] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTempSelection(selected);
            setSearch(""); // clear search when reopened
            setClosing(false);
        }
    }, [isOpen, selected]);

    useEffect(() => {
        const body = document.body;
        const html = document.documentElement;

        if (isOpen) {
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
    }, [isOpen]);

    const handleClose = () => {
        setClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const toggleSelect = (value) => {
        if (max === 1) {
            setTempSelection([value]); // overwrite with new single selection
        } else {
            if (tempSelection.includes(value)) {
                setTempSelection(tempSelection.filter((v) => v !== value));
            } else if (tempSelection.length < max) {
                setTempSelection([...tempSelection, value]);
            }
        }
    };

    const handleSave = () => {
        const cleaned = tempSelection.filter(item => item && item !== "");
        const padded = [...cleaned, ...Array(max - cleaned.length).fill(null)];

        // If only selecting 1
        if (max === 1) {
            if (title.includes("Pokémon")) {
                onChange({ value: padded[0], isShiny: showShiny }); // for Pokémon
            } else {
                onChange(padded); // for games
            }
        } else {
            onChange(padded);
        }

        handleClose();
    };

    if (!isOpen && !closing) return null;

    const filteredOptions = options
        .filter(item => item.value !== "") // remove "None"
        .filter(item => item.name.toLowerCase().includes(search));

    return (
        <div className={`favorite-modal-backdrop${closing ? " closing" : ""}`}>
            <div className={`favorite-modal${closing ? " closing" : ""}`}>
                <div className="favorite-modal-header">
                    <h2>{title}</h2>
                    <button className="sidebar-close" onClick={handleClose} aria-label="Close">
                        <span className="sidebar-close-icon">
                            <svg
                                width="40"
                                height="40"
                                viewBox="0 0 40 40"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <circle cx="20" cy="20" r="18" fill="#fff" stroke="#232323" strokeWidth="2" />
                                <path d="M2 20a18 18 0 0 1 36 0" fill="#e62829" stroke="#232323" strokeWidth="2" />
                                <rect x="2" y="19" width="36" height="2" fill="#232323" />
                                <circle cx="20" cy="20" r="7" fill="#ffffffff" stroke="#232323" strokeWidth="2" />
                                <circle cx="20" cy="20" r="3.5" fill="#fff" stroke="#232323" strokeWidth="1.5" />
                            </svg>
                        </span>
                    </button>
                </div>

                <div className="favorite-modal-content">
                    <div className="favorite-modal-search-row">
                        <input
                            type="text"
                            className="favorite-modal-search-input"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value.toLowerCase())}
                        />

                        {title.includes("Pokémon") && (
                            <label className="switch-label">
                                <span className="switch">
                                    <input
                                        type="checkbox"
                                        className="switch-input"
                                        checked={showShiny}
                                        onChange={(e) => setShowShiny(e.target.checked)}
                                    />
                                    <span className="switch-slider" />
                                    <span className={`switch-emoji ${showShiny ? "active" : "inactive"}`}>✨</span>
                                </span>
                            </label>
                        )}
                    </div>

                    <div className="favorite-grid">
                        {filteredOptions.map((item) => (
                            <div
                                key={item.value}
                                className={`favorite-item ${tempSelection.includes(item.value) ? "selected" : ""}`}
                                onClick={() => toggleSelect(item.value)}
                            >
                                {item.image && (
                                    <img
                                        src={
                                            showShiny && item.shinyImage
                                                ? item.shinyImage
                                                : item.image
                                        }
                                        alt={item.name}
                                        className="favorite-img"
                                    />
                                )}
                                <div className="favorite-label">{item.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="favorite-modal-footer">
                    {!title.toLowerCase().includes("trainer") && (
                        <button
                            className="clear-btn"
                            onClick={() => setTempSelection([])}
                        >
                            Clear
                        </button>
                    )}
                    <button className="save-btn" onClick={handleSave}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
