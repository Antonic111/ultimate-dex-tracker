import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createPortal } from "react-dom";
import { X, Search, Edit2, Check, RotateCcw, Link as LinkIcon, ArrowBigLeft, Lock, ArrowLeft } from "lucide-react";
import { GAME_OPTIONS, genderForms } from "../Constants";
import pokemonData from "../data/pokemon.json";
import formsData from "../utils/loadFormsData";
import { getFilteredFormsData } from "../utils/dexPreferences";
import { getAvailableGamesForPokemonSidebar, normalizeGameName, GAME_COUNTERPARTS } from "../utils/pokemonAvailability";
import versionExclusives from "../data/versionExclusives.json";
import { formatPokemonName, getFormDisplayName } from "../utils";
import { getSpriteUrl } from "../utils/spriteUtils";
import './Bingo.css';
import '../css/Counters.css'; // Import Counters styles for the modal
import { SearchbarIconDropdown } from "../components/Shared/SearchBar";
import { useTheme } from '../components/Shared/ThemeContext';
import { bingoAPI } from "../utils/api";
import { useMessage } from "../components/Shared/MessageContext";
import { useUser } from "../components/Shared/UserContext";
import { Modal, ConfirmModal } from "../components/Shared/Modal";
import { Button } from "../components/Shared/Button";

const createEmptyGrid = () => Array.from({ length: 25 }, (_, i) => ({
    id: i,
    text: '',
    completed: false,
    pokemon: null,
    pokemonList: [],
    game: null
}));

const Bingo = () => {
    const { showMessage } = useMessage();
    const { username: authUsername } = useUser();
    const { username: routeUsername } = useParams();
    const readOnly = !!routeUsername;
    const currentUsername = routeUsername || authUsername;

    const STORAGE_KEY = authUsername ? `bingo-grid-state-v1:${authUsername}` : null;

    const [useHomeSprites, setUseHomeSprites] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('dexPreferences'))?.useHomeSprites || false;
        } catch {
            return false;
        }
    });

    useEffect(() => {
        const handlePrefsChange = () => {
            try {
                setUseHomeSprites(JSON.parse(localStorage.getItem('dexPreferences'))?.useHomeSprites || false);
            } catch { }
        };
        window.addEventListener('dexPreferencesChanged', handlePrefsChange);
        return () => window.removeEventListener('dexPreferencesChanged', handlePrefsChange);
    }, []);

    // State initialization
    const [grid, setGrid] = useState(() => {
        if (readOnly) {
            return createEmptyGrid();
        }

        // Clean up legacy unscoped key if present
        localStorage.removeItem('bingo-grid-state-v1');

        if (STORAGE_KEY) {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    return parsed.map((cell, i) => ({
                        ...cell,
                        text: (cell.text === 'FREE' || (cell.text && cell.text.startsWith('Goal '))) ? '' : cell.text,
                        completed: (cell.id === 12 && cell.text === 'FREE') ? false : cell.completed,
                        pokemonList: (cell.pokemonList && cell.pokemonList.length > 0) ? cell.pokemonList : (cell.pokemon ? [cell.pokemon] : [])
                    }));
                } catch (e) {
                    console.error("Failed to parse saved bingo grid", e);
                }
            }
        }
        return createEmptyGrid();
    });

    const [showModal, setShowModal] = useState(false);
    const [editingCellId, setEditingCellId] = useState(null);
    const [selectedGame, setSelectedGame] = useState("Red");
    const [searchTerm, setSearchTerm] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [clearConfirmClosing, setClearConfirmClosing] = useState(false);
    const [cycleIndex, setCycleIndex] = useState(0);

    const isDataLoadedRef = useRef(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setCycleIndex(prev => prev + 1);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const closeClearConfirmModal = () => {
        setClearConfirmClosing(true);
        setTimeout(() => {
            setShowClearConfirm(false);
            setClearConfirmClosing(false);
        }, 300);
    };

    const handleClearBoard = () => {
        setGrid(createEmptyGrid());
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

    const gridRef = useRef(grid);

    // Keep ref updated
    useEffect(() => {
        gridRef.current = grid;
    }, [grid]);

    // Load grid from server on mount or user change
    useEffect(() => {
        let isMounted = true;
        isDataLoadedRef.current = false;

        const loadBingoData = async () => {
            try {
                const data = readOnly
                    ? await bingoAPI.getPublicBingo(routeUsername)
                    : await bingoAPI.getBingo();

                if (!isMounted) return;

                if (data && Array.isArray(data.grid) && data.grid.length > 0) {
                    const loadedGrid = data.grid.map(cell => ({
                        ...cell,
                        pokemonList: (cell.pokemonList && cell.pokemonList.length > 0) ? cell.pokemonList : (cell.pokemon ? [cell.pokemon] : [])
                    }));
                    setGrid(loadedGrid);
                    if (STORAGE_KEY) {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedGrid));
                    }
                } else if (!readOnly) {
                    // Empty or fresh user
                    const emptyGrid = createEmptyGrid();
                    setGrid(emptyGrid);
                    if (STORAGE_KEY) {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyGrid));
                    }
                }
            } catch (error) {
                console.error("Failed to load bingo data:", error);
                if (readOnly && (error?.status === 403 || error?.userMessage?.toLowerCase().includes("private") || error?.message?.toLowerCase().includes("private") || error?.data?.error?.toLowerCase().includes("private"))) {
                    setIsPrivate(true);
                }
            } finally {
                if (isMounted) {
                    isDataLoadedRef.current = true;
                }
            }
        };

        loadBingoData();
        return () => { isMounted = false; };
    }, [routeUsername, readOnly, authUsername]);

    // Persist grid changes to Local Storage AND Server (only after initial load has finished)
    useEffect(() => {
        if (readOnly || !isDataLoadedRef.current) return;

        // Save to user-scoped local storage
        if (STORAGE_KEY) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(grid));
        }

        // Debounce save to server
        const timeoutId = setTimeout(async () => {
            try {
                await bingoAPI.updateBingo(grid);
            } catch (error) {
                console.error("Failed to save bingo data to server:", error);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [grid, readOnly, STORAGE_KEY]);

    // Save on unload
    useEffect(() => {
        if (readOnly || !isDataLoadedRef.current) return;

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
        const filteredFormsData = getFilteredFormsData(formsData).filter(p => p.formType !== "mighty");
        return [...pokemonData, ...filteredFormsData];
    }, []);

    // Filter pokemon based on selection
    const filteredPokemon = useMemo(() => {
        if (!selectedGame) return [];

        // First filter by game availability including counterpart exclusives
        let candidates = allPokemon.filter(p => {
            const availableGames = getAvailableGamesForPokemonSidebar(p);
            const targetGame = normalizeGameName(selectedGame);

            // 1. Is it natively available in the selected game?
            const isAvailable = availableGames.some(g => normalizeGameName(g) === targetGame);
            if (isAvailable) return true;

            // 2. Is it exclusive to a counterpart game? (e.g. show Sword exclusives in Shield)
            const counterparts = GAME_COUNTERPARTS[selectedGame];
            if (counterparts) {
                const counterpartsList = Array.isArray(counterparts) ? counterparts : [counterparts];

                for (const counterpart of counterpartsList) {
                    const exclusives = versionExclusives[counterpart];
                    const formattedId = String(p.id).padStart(4, "0");

                    // Check if exclusive to the counterpart
                    if (exclusives && (exclusives.includes(p.name) || exclusives.includes(formattedId))) {
                        return true;
                    }
                }
            }
            return false;
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
                const currentList = (cell.pokemonList && cell.pokemonList.length > 0) ? cell.pokemonList : (cell.pokemon ? [cell.pokemon] : []);
                const existsIndex = currentList.findIndex(p => p.id === pokemon.id && p.name === pokemon.name);
                
                let newList;
                if (existsIndex >= 0) {
                    newList = currentList.filter((_, i) => i !== existsIndex);
                } else {
                    newList = [...currentList, pokemon];
                }

                return {
                    ...cell,
                    pokemon: newList.length > 0 ? newList[0] : null,
                    pokemonList: newList,
                    game: newList.length > 0 ? selectedGame : null,
                    text: newList.length > 0 ? formatPokemonName(newList[0].name) : ''
                };
            }
            return cell;
        }));
    };

    const handleClearSlot = () => {
        if (editingCellId === null) return;
        setGrid(prev => prev.map(cell => {
            if (cell.id === editingCellId) {
                return {
                    ...cell,
                    pokemon: null,
                    pokemonList: [],
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
        // In Bingo, we often use shiny sprites by default, so we'll pass true for isShiny
        // Look up fresh data to avoid missing new sprites in stale localStorage entries
        const freshPokemon = allPokemon.find(p => p.id === pokemon.id && p.name === pokemon.name) || pokemon;
        return getSpriteUrl(freshPokemon, true, useHomeSprites);
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

    if (isPrivate) {
        return (
            <div className="bingo-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '65vh' }}>
                <div className="stats-private-card">
                    <Lock className="stats-private-icon" />
                    <h2>This Profile is Private</h2>
                    <p>{routeUsername}'s Bingo board is hidden by their privacy settings.</p>
                    <Button
                        as={Link}
                        to="/trainers"
                        variant="secondary"
                        size="sm"
                        className="stats-back-btn"
                        icon={<ArrowLeft size={16} />}
                    >
                        Back to Trainers
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bingo-page">
            <div className="bingo-container">
                <div className="bingo-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    <h1 className="bingo-page-title">
                        {readOnly ? `${routeUsername}'s ` : ''}2026 Shiny BINGO
                    </h1>

                    {readOnly ? (
                        <Link
                            to={`/u/${routeUsername}`}
                            className="flex items-center gap-2 px-3.5 py-2 bg-[var(--accent)] text-black font-bold border-none rounded-lg cursor-pointer transition-colors duration-200 hover:bg-[var(--accent-hover)] hover:text-[var(--text)]"
                            title="Back to Profile"
                            style={{ textDecoration: 'none' }}
                        >
                            <ArrowBigLeft size={20} />
                            <span>Back to Profile</span>
                        </Link>
                    ) : (
                        authUsername && (
                            <button
                                onClick={handleShare}
                                className="bingo-copy-btn p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--accent)]"
                                aria-label="Copy shareable link"
                            >
                                <LinkIcon size={32} />
                                <span className="copy-tooltip">Copy Link</span>
                            </button>
                        )
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
                    {grid.map((cell) => {
                        const list = (cell.pokemonList && cell.pokemonList.length > 0) ? cell.pokemonList : (cell.pokemon ? [cell.pokemon] : []);

                        return (
                        <div
                            key={cell.id}
                            className={`bingo-cell-wrapper`}
                            onClick={(e) => {
                                if (readOnly) return;
                                if (list.length === 0) openEditModal(cell.id);
                                else if (cell.completed) toggleCompletion(cell.id, e);
                            }}
                            style={{ cursor: readOnly ? 'default' : (list.length === 0 || cell.completed) ? 'pointer' : 'default' }}
                        >
                            <div className={`bingo-cell ${cell.completed ? 'completed' : ''} ${list.length === 0 ? 'empty' : ''}`}>
                                {list.length > 0 ? (
                                    <div className="bingo-content">
                                        {list.map((pokemon, idx) => {
                                            const isActive = idx === (cycleIndex % list.length);
                                            return (
                                                <div 
                                                    key={`${pokemon.id}-${pokemon.formType}-${idx}`}
                                                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
                                                >
                                                    <img
                                                        src={getPokemonImage(pokemon) || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="}
                                                        alt={pokemon.name}
                                                        className="bingo-pokemon-img"
                                                    />
                                                    {cell.game && getGameIcon(cell.game) && (
                                                        <div className="bingo-game-icon-container">
                                                            <img
                                                                src={getGameIcon(cell.game)}
                                                                alt={cell.game}
                                                                className="bingo-game-overlay-icon"
                                                            />
                                                            <span className="game-tooltip">{cell.game}</span>
                                                        </div>
                                                    )}
                                                    {getFormIconInfo(pokemon) && (
                                                        <div className="bingo-form-overlay-icon">
                                                            <img
                                                                src={getFormIconInfo(pokemon).src}
                                                                alt="Form"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

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

                                {list.length > 0 && !readOnly && (
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
                    )})}
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
            {/* Edit Slot Modal */}
            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title="Select Game & Pokemon"
                subtitle="Choose a game and Pokemon for this slot"
                size="lg"
                footer={
                    editingCellId !== null && (
                        <>
                            {grid.find(c => c.id === editingCellId)?.pokemonList?.length > 0 && (
                                <Button
                                    variant="danger"
                                    onClick={handleClearSlot}
                                    icon={<X size={15} />}
                                >
                                    Clear Slot
                                </Button>
                            )}
                            <Button
                                variant="primary"
                                onClick={closeModal}
                                icon={<Check size={16} strokeWidth={2.5} />}
                            >
                                Done
                            </Button>
                        </>
                    )
                }
            >
                <div className="space-y-4">
                    {/* Game Selection */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[var(--progressbar-info)]">Game:</label>
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

                    {/* Search and Grid */}
                    {selectedGame ? (
                        <>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search Pokemon..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-[var(--progressbar-input)] border border-[var(--border-color)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--progressbar-info)] hover:text-[var(--text)] transition-colors p-1"
                                        onClick={() => setSearchTerm("")}
                                        title="Clear search"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="pokemon-grid">
                                {filteredPokemon.map((pokemon, index) => {
                                    const isSelected = grid.find(c => c.id === editingCellId)?.pokemonList?.some(p => p.id === pokemon.id && p.name === pokemon.name);
                                    return (
                                        <button
                                            key={`pokemon-${pokemon?.id || 'unknown'}-${index}`}
                                            type="button"
                                            className={`pokemon-item ${isSelected ? 'selected ring-2 ring-[var(--accent)]' : ''}`}
                                            onClick={() => handlePokemonSelect(pokemon)}
                                            style={isSelected ? { backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)', borderColor: 'var(--accent)' } : {}}
                                        >
                                            <img
                                                src={getPokemonImage(pokemon) || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="}
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
                                    );
                                })}
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
                </div>
            </Modal>

            {/* Clear Board Confirmation Modal */}
            <ConfirmModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={handleClearBoard}
                title="Clear Board"
                message="Are you sure you want to clear the entire bingo board? This will delete all saved data."
                confirmText="Clear Board"
                variant="danger"
            />
        </div>
    );
};

export default Bingo;
