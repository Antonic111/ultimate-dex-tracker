import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "../../css/FavoriteSelectionModal.css";
import { formatPokemonName, formatTrainerName } from "../../utils";

export default function FavoriteSelectionModal({
    isOpen,
    onClose,
    title,
    options,
    selected = [],
    onChange,
    max = 5,
    showHoverPreview = false,
}) {
    const [tempSelection, setTempSelection] = useState([]);
    const [search, setSearch] = useState("");
    const [showShiny, setShowShiny] = useState(false);
    const [closing, setClosing] = useState(false);
    const [hovered, setHovered] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setTempSelection(selected);
            setSearch("");
            setClosing(false);
        }
    }, [isOpen, selected]);

    useEffect(() => {
        const preventScroll = (e) => {
            // Allow scrolling within the modal
            const modal = document.querySelector('.favorite-modal');
            if (modal && modal.contains(e.target)) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('wheel', preventScroll, { passive: false });
            document.addEventListener('touchmove', preventScroll, { passive: false });
        } else {
            document.body.style.overflow = '';
            document.removeEventListener('wheel', preventScroll);
            document.removeEventListener('touchmove', preventScroll);
        }
        
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('wheel', preventScroll);
            document.removeEventListener('touchmove', preventScroll);
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
            setTempSelection([value]);
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
        if (max === 1) {
            if (title.includes("Pokémon")) {
                onChange({ value: padded[0], isShiny: showShiny });
            } else {
                onChange(padded);
            }
        } else {
            onChange(padded);
        }
        handleClose();
    };

    if (!isOpen && !closing) return null;

    const filteredOptions = options
        .filter(item => item.value !== "")
        .filter(item => item.name.toLowerCase().includes(search));

    return createPortal(
        <div
            className={`favorite-modal-backdrop ${closing ? "closing" : ""}`}
            role="dialog"
            aria-modal="true"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
            <div className={`favorite-modal ${closing ? "closing" : ""}`}>
                <div className="favorite-modal-header">
                    <h2>{title}</h2>
                    <button className="close-btn" onClick={handleClose} aria-label="Close">
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

                <div className="favorite-modal-content">
                    <div className="favorite-modal-search-row">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value.toLowerCase())}
                                style={{ width: '100%' }}
                            />
                            {search && (
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 transition-colors"
                                    style={{ color: 'var(--accent)' }}
                                    onMouseEnter={(e) => {
                                        e.target.style.color = 'var(--text)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.color = 'var(--accent)';
                                    }}
                                    onClick={() => setSearch("")}
                                    title="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {title.includes("Pokémon") && (
                            <label className="switch-label">
                                <span className={`switch-emoji ${showShiny ? "active" : "inactive"}`}>
                                    ✨
                                </span>
                                <div className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only" 
                                        checked={showShiny} 
                                        onChange={(e) => setShowShiny(e.target.checked)} 
                                    />
                                    <div className="toggle-track"></div>
                                    <div className="toggle-knob"></div>
                                </div>
                            </label>
                        )}
                    </div>

                    <div className="favorite-grid">
                        {filteredOptions.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                className={`favorite-item ${tempSelection.includes(item.value) ? "selected" : ""}`}
                                onClick={() => toggleSelect(item.value)}
                                onMouseEnter={() => showHoverPreview ? setHovered(item) : null}
                                onMouseLeave={() => showHoverPreview ? setHovered(null) : null}
                            >
                                {item.image && (
                                    <img
                                        src={showShiny && item.shinyImage ? item.shinyImage : item.image}
                                        alt={item.name}
                                        className="favorite-img"
                                    />
                                )}
                                <div className="favorite-label">{item.name}</div>
                            </button>
                        ))}
                    </div>

                    {showHoverPreview && hovered?.image && (
                        <div className="favorite-hover-preview">
                            <img src={hovered.image} alt={hovered.name} />
                            <div className="favorite-hover-caption">{hovered.name}</div>
                        </div>
                    )}
                </div>

                <div className="favorite-modal-footer">
                    {!title.toLowerCase().includes("trainer") && (
                        <button className="clear-btn" onClick={() => setTempSelection([])}>Clear</button>
                    )}
                    <button className="save-btn" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>,
        document.body
    );
}
