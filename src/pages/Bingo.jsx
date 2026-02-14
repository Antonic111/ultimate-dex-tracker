import React, { useState, useMemo, useEffect, useRef, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { createPortal } from "react-dom";
import { X, Search, Edit2, Check, RotateCcw, Link as LinkIcon } from "lucide-react";
import { GAME_OPTIONS, genderForms } from "../Constants";
import pokemonData from "../data/pokemon.json";
import formsData from "../utils/loadFormsData";
import { getFilteredFormsData } from "../utils/dexPreferences";
import { getAvailableGamesForPokemonSidebar, normalizeGameName } from "../utils/pokemonAvailability";
import { formatPokemonName, getFormDisplayName } from "../utils";
import './Bingo.css';
import '../css/Counters.css'; // Import Counters styles for the modal
import { SearchbarIconDropdown } from "../components/Shared/SearchBar";
import { useTheme } from '../components/Shared/ThemeContext';
import { bingoAPI } from "../utils/api";
import { useMessage } from "../components/Shared/MessageContext";
import { UserContext } from "../components/Shared/UserContext";

const Bingo = () => {
    const { showMessage } = useMessage();
    const { username: currentUsername } = useContext(UserContext);

    // Local storage key
    const STORAGE_KEY = 'bingo-grid-state-v1';

    // State initialization
    const { username } = useParams();
    const readOnly = !!username;

    // State initialization
    const [grid, setGrid] = useState(() => {
        if (readOnly) {
            return Array.from({ length: 25 }, (_, i) => ({
                id: i,
                text: '',
                completed: false,
                pokemon: null,
                game: null
            }));
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Migration: Clear "Goal X" and "FREE" texts and unmark auto-completed center
                return parsed.map((cell, i) => ({
                    ...cell,
                    text: (cell.text === 'FREE' || (cell.text && cell.text.startsWith('Goal '))) ? '' : cell.text,
                    completed: (cell.id === 12 && cell.text === 'FREE') ? false : cell.completed
                }));
            } catch (e) {
                console.error("Failed to parse saved bingo grid", e);
            }
        }
        // distinct initial state
        return Array.from({ length: 25 }, (_, i) => ({
            id: i,
            text: '',
            completed: false,
            pokemon: null,
            game: null
        }));
    });

    const [showModal, setShowModal] = useState(false);
    const [editingCellId, setEditingCellId] = useState(null);
    const [selectedGame, setSelectedGame] = useState("Red");
    const [searchTerm, setSearchTerm] = useState("");
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [clearConfirmClosing, setClearConfirmClosing] = useState(false);

    const closeClearConfirmModal = () => {
        setClearConfirmClosing(true);
        setTimeout(() => {
            setShowClearConfirm(false);
            setClearConfirmClosing(false);
        }, 300);
    };

    const handleClearBoard = () => {
        setGrid(Array.from({ length: 25 }, (_, i) => ({
            id: i,
            text: '',
            completed: false,
            pokemon: null,
            game: null
        })));
        closeClearConfirmModal();
        showMessage("Board cleared!", "success");
    };

    const handleShare = () => {
        if (!currentUsername) return;
        const url = `${window.location.origin}/u/${currentUsername}/bingo`;
        navigator.clipboard.writeText(url)
            .then(() => showMessage("Bingo link copied!", "success"))
            .catch(() => showMessage("Failed to copy link", "error"));
    };



    // Load grid from server on mount
    const gridRef = useRef(grid);

    // Keep ref updated
    useEffect(() => {
        gridRef.current = grid;
    }, [grid]);

    // Load grid from server on mount
    useEffect(() => {
        let isMounted = true;
        const loadBingoData = async () => {
            try {
                const data = readOnly
                    ? await bingoAPI.getPublicBingo(username)
                    : await bingoAPI.getBingo();

                // Check if we received valid data
                if (isMounted && data && Array.isArray(data.grid) && data.grid.length > 0) {
                    setGrid(data.grid);
                }
            } catch (error) {
                console.error("Failed to load bingo data:", error);
            }
        };
        loadBingoData();
        return () => { isMounted = false; };
    }, [username, readOnly]);

    // Persist grid changes to Local Storage AND Server
    useEffect(() => {
        if (readOnly) return;

        // Save to local storage immediately
        localStorage.setItem(STORAGE_KEY, JSON.stringify(grid));

        // Debounce save to server
        const timeoutId = setTimeout(async () => {
            try {
                await bingoAPI.updateBingo(grid);
            } catch (error) {
                console.error("Failed to save bingo data to server:", error);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [grid, readOnly]);

    // Save on unload
    useEffect(() => {
        if (readOnly) return;

        const handleBeforeUnload = () => {
            const token = localStorage.getItem('authToken');
            if (token && gridRef.current) {
                try {
                    const xhr = new XMLHttpRequest();
                    xhr.open('PUT', '/api/bingo', false); // Synchronous request
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    xhr.send(JSON.stringify({ bingoData: gridRef.current }));
                } catch (e) {
                    console.error("Failed to save on unload", e);
                }
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [readOnly]);

    // Robust scroll locking for modals
    useEffect(() => {
        const preventScroll = (e) => {
            // Check for edit modal
            const editModal = document.querySelector('.pokemon-modal');
            if (editModal && editModal.contains(e.target)) return;

            // Check for clear confirm modal
            const clearModal = document.querySelector('.clear-confirm-modal');
            if (clearModal && clearModal.contains(e.target)) return;

            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        if (showModal || showClearConfirm) {
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
    }, [showModal, showClearConfirm]);

    // Memoize all pokemon data (base + forms)
    const allPokemon = useMemo(() => {
        const filteredFormsData = getFilteredFormsData(formsData);
        return [...pokemonData, ...filteredFormsData];
    }, []);

    // Filter pokemon based on selection
    const filteredPokemon = useMemo(() => {
        if (!selectedGame) return [];

        // First filter by game availability
        let candidates = allPokemon.filter(p => {
            const availableGames = getAvailableGamesForPokemonSidebar(p);
            const targetGame = normalizeGameName(selectedGame);
            return availableGames.some(g => normalizeGameName(g) === targetGame);
        });

        // Then filter by search term if present
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            candidates = candidates.filter(p =>
                (p.name && p.name.toLowerCase().includes(term)) ||
                (p.id && p.id.toString().includes(term))
            );
        }

        return candidates;
    }, [allPokemon, selectedGame, searchTerm]);


    const openEditModal = (id, e) => {
        if (e) e.stopPropagation();
        setEditingCellId(id);

        // If cell has existing data, pre-fill game?
        const cell = grid.find(c => c.id === id);
        if (cell && cell.game) {
            setSelectedGame(cell.game);
        } else {
            setSelectedGame("Red");
        }
        setSearchTerm("");
        setShowModal(true);
    };

    const handlePokemonSelect = (pokemon) => {
        if (editingCellId === null) return;

        setGrid(prev => prev.map(cell => {
            if (cell.id === editingCellId) {
                return {
                    ...cell,
                    pokemon: pokemon,
                    game: selectedGame,
                    text: formatPokemonName(pokemon.name) // Optional: update text fallback
                };
            }
            return cell;
        }));

        closeModal();
    };

    const handleClearSlot = () => {
        if (editingCellId === null) return;
        setGrid(prev => prev.map(cell => {
            if (cell.id === editingCellId) {
                return {
                    ...cell,
                    pokemon: null,
                    game: null,
                    text: '',
                    completed: false
                };
            }
            return cell;
        }));
        closeModal();
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCellId(null);
        setSearchTerm("");
    };

    const toggleCompletion = (id, e) => {
        if (readOnly) return;
        if (e) e.stopPropagation();
        setGrid(prev => prev.map(c =>
            c.id === id ? { ...c, completed: !c.completed } : c
        ));
    };

    const getPokemonImage = (pokemon) => {
        return pokemon?.sprites?.front_shiny || pokemon?.sprites?.front_default || "";
    };

    // Helper to get game icon if available (optional)
    const getGameIcon = (gameName) => {
        const game = GAME_OPTIONS.find(g => g.value === gameName);
        return game ? game.image : null;
    };

    const getFormIconInfo = (pokemon) => {
        if (!pokemon) return null;

        // Check attributes
        const isAlpha = pokemon.formType === 'alpha' || pokemon.formType === 'alphaother' || (pokemon.name && pokemon.name.includes('-alpha'));

        let nameToCheck = pokemon.name || "";
        if (nameToCheck.includes("-alpha")) nameToCheck = nameToCheck.replace("-alpha", "");

        const isFemale = pokemon.formType === 'gender' || (pokemon.formType === 'alphaother' && pokemon.stableId && pokemon.stableId.includes('female')) || (pokemon.name && pokemon.name.includes('-female'));
        const isMale = !isFemale && ((pokemon.name && pokemon.name.includes('-male')) || (pokemon.stableId && pokemon.stableId.includes('male')) || genderForms.includes(nameToCheck));

        if (isAlpha) {
            if (isFemale) {
                return { src: "/data/SidebarIcons/Alpha_Mark_Female.png", color: "#ef6491", padding: "2px" };
            } else if (isMale) {
                return { src: "/data/SidebarIcons/Alpha_Mark_Male.png", color: "#316497", padding: "2px" };
            } else {
                return { src: "/data/SidebarIcons/Alpha_Mark.png", color: "#e05555", padding: "2px" };
            }
        } else {
            if (isFemale) {
                return { src: "/data/SidebarIcons/Female.svg", color: "#ef6491", padding: "5px" };
            } else if (isMale) {
                return { src: "/data/SidebarIcons/Male.svg", color: "#316497", padding: "5px" };
            }
        }
        return null;
    };

    return (
        <div className="bingo-page">
            <div className="bingo-container">
                <div className="mt-12 mb-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    <h1 className="bingo-page-title !m-0">
                        {readOnly ? `${username}'s ` : ''}2026 Shiny BINGO
                    </h1>
                    {!readOnly && currentUsername && (
                        <button
                            onClick={handleShare}
                            className="bingo-copy-btn p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--accent)]"
                            aria-label="Copy shareable link"
                        >
                            <LinkIcon size={32} />
                            <span className="copy-tooltip">Copy Link</span>
                        </button>
                    )}
                </div>
                <div className="app-divider" />

                {!readOnly && (
                    <div className="bingo-info-box">
                        <ul>
                            <li>Tap a slot to add a Pokémon.</li>
                            <li>Tap top-left to complete.</li>
                            <li>Tap top-right to edit.</li>
                        </ul>
                    </div>
                )}

                <div className="bingo-grid">
                    {['B', 'I', 'N', 'G', 'O'].map((letter) => (
                        <div key={letter} className="bingo-header-cell">
                            {letter}
                        </div>
                    ))}
                    {grid.map((cell) => (
                        <div
                            key={cell.id}
                            className={`bingo-cell-wrapper`}
                            onClick={(e) => {
                                if (readOnly) return;
                                if (!cell.pokemon) openEditModal(cell.id);
                                else if (cell.completed) toggleCompletion(cell.id, e);
                            }}
                            style={{ cursor: readOnly ? 'default' : (!cell.pokemon || cell.completed) ? 'pointer' : 'default' }}
                        >
                            <div className={`bingo-cell ${cell.completed ? 'completed' : ''} ${!cell.pokemon ? 'empty' : ''}`}>
                                {cell.pokemon ? (
                                    <div className="bingo-content">
                                        <img
                                            src={getPokemonImage(cell.pokemon)}
                                            alt={cell.pokemon.name}
                                            className="bingo-pokemon-img"
                                        />
                                        {cell.game && getGameIcon(cell.game) && (
                                            <img
                                                src={getGameIcon(cell.game)}
                                                alt={cell.game}
                                                className="bingo-game-overlay-icon"
                                            />
                                        )}
                                        {getFormIconInfo(cell.pokemon) && (
                                            <div className="bingo-form-overlay-icon">
                                                <img
                                                    src={getFormIconInfo(cell.pokemon).src}
                                                    alt="Form"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <span className="bingo-placeholder">{cell.text}</span>
                                )}

                                {!cell.completed && !readOnly && (
                                    <button
                                        className="edit-cell-btn"
                                        onClick={(e) => openEditModal(cell.id, e)}
                                        title="Edit Slot"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                )}

                                {cell.pokemon && !readOnly && (
                                    <button
                                        className={`bingo-check-btn ${cell.completed ? 'completed' : ''}`}
                                        onClick={(e) => toggleCompletion(cell.id, e)}
                                        title="Mark Complete"
                                    >
                                        {!cell.completed && <Check size={14} strokeWidth={3} />}
                                    </button>
                                )}

                                {cell.completed && (
                                    <div className="bingo-completed-overlay">
                                        <Check size={48} strokeWidth={4} />
                                    </div>
                                )}

                                {cell.completed && (
                                    <div className="completion-stamp">
                                        {/* Optional stamp graphic or just style change */}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {!readOnly && (
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', paddingBottom: '2rem' }}>
                        <button
                            onClick={() => setShowClearConfirm(true)}
                            style={{
                                padding: '0.8rem 2rem',
                                border: 'none',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <X size={18} />
                            Clear Board
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Portal - Using Counters.css classes */}
            {
                showModal && createPortal(
                    <div className="pokemon-modal-backdrop">
                        <div className="pokemon-modal bingo-custom-modal" onClick={e => e.stopPropagation()}>
                            <div className="pokemon-modal-header">
                                <h2>Select Game & Pokemon</h2>
                                <button
                                    onClick={closeModal}
                                    className="close-btn"
                                    aria-label="Close"
                                >
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

                            <div className="pokemon-modal-content">
                                {/* Game Selection - Added as first step */}
                                <div className="pokemon-modal-search-row" style={{ marginBottom: '1rem', borderBottom: 'none', paddingBottom: 0 }}>
                                    <div className="hunt-form-group" style={{ width: '100%' }}>
                                        <label className="hunt-label">Game:</label>
                                        <SearchbarIconDropdown
                                            id="bingo-game-dropdown"
                                            options={GAME_OPTIONS.filter(g => g.value)}
                                            value={selectedGame}
                                            onChange={(val) => setSelectedGame(val)}
                                            placeholder="Select a Game..."
                                            customBackground="var(--sidebar-edit-inputs)"
                                            customBorder="var(--sidebar-edit-inputs)"
                                            hideClearButton={true}
                                        />
                                    </div>
                                </div>



                                {/* Search and Grid - Only if game selected */}
                                {selectedGame ? (
                                    <>
                                        <div className="pokemon-modal-search-row">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Search Pokemon..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="search-input"
                                                />
                                                {searchTerm && (
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 transition-colors"
                                                        style={{ color: 'var(--accent)' }}
                                                        onClick={() => setSearchTerm("")}
                                                        title="Clear search"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pokemon-grid">
                                            {filteredPokemon.map((pokemon, index) => (
                                                <button
                                                    key={`pokemon-${pokemon?.id || 'unknown'}-${index}`}
                                                    type="button"
                                                    className="pokemon-item"
                                                    onClick={() => handlePokemonSelect(pokemon)}
                                                >
                                                    <img
                                                        src={getPokemonImage(pokemon)}
                                                        alt={formatPokemonName(String(pokemon?.name || ''))}
                                                        className="pokemon-img"
                                                    />
                                                    <div className="pokemon-text-container">
                                                        <div className="pokemon-label">
                                                            {formatPokemonName(String(pokemon?.name || ''))}
                                                        </div>
                                                        {pokemon?.formType && pokemon.formType !== "main" && (
                                                            <div className="pokemon-form">
                                                                {getFormDisplayName(pokemon)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                            {filteredPokemon.length === 0 && (
                                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                                    No Pokemon found matching your search.
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        Please select a game to view available Pokemon.
                                    </div>
                                )}

                                {/* Clear Slot Button - Bottom of modal */}
                                {editingCellId !== null && grid.find(c => c.id === editingCellId)?.pokemon && (
                                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', paddingBottom: '0.5rem' }}>
                                        <button
                                            type="button"
                                            style={{
                                                width: 'auto',
                                                padding: '0.5rem 1.5rem',
                                                border: 'none',
                                                backgroundColor: '#ef4444',
                                                color: 'white',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                fontSize: '0.9rem',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                transition: 'transform 0.1s'
                                            }}
                                            onClick={handleClearSlot}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            Clear Slot
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Clear Board Confirmation Modal */}
            {
                showClearConfirm && createPortal(
                    <div
                        className={`fixed inset-0 z-[20000] ${clearConfirmClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
                    >
                        <div className="bg-black/80 w-full h-full flex items-center justify-center">
                            <div
                                className={`clear-confirm-modal bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl ${clearConfirmClosing ? 'animate-[slideOut_0.3s_ease-in_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}`}
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                        <RotateCcw className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-[var(--accent)]">Clear Board</h3>
                                        <p className="text-sm text-[var(--progressbar-info)]">This action cannot be undone</p>
                                    </div>
                                </div>
                                <p className="text-gray-300 mb-6">
                                    Are you sure you want to clear the entire bingo board? This will delete all saved data.
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={closeClearConfirmModal}
                                        className="px-4 py-2 rounded-lg bg-transparent border-2 border-[var(--dividers)] text-[var(--text)] hover:bg-[var(--dividers)] transition-colors font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleClearBoard}
                                        className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black hover:text-white transition-colors font-semibold"
                                    >
                                        Clear Board
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div >
    );
};

export default Bingo;
