import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { 
    X, Search, Edit2, Check, RotateCcw, Link as LinkIcon, 
    Share2, Trash2, ArrowLeft, Lock, Trophy, 
    Calendar, Quote as QuoteIcon, Clock, CheckCircle2, Plus, Sparkles,
    ChevronLeft, ChevronRight, History, Gamepad2
} from "lucide-react";
import { GAME_OPTIONS, genderForms } from "../Constants";
import pokemonData from "../data/pokemon.json";
import formsData from "../utils/loadFormsData";
import { getFilteredFormsData } from "../utils/dexPreferences";
import { getAvailableGamesForPokemonSidebar, normalizeGameName, GAME_COUNTERPARTS } from "../utils/pokemonAvailability";
import versionExclusives from "../data/versionExclusives.json";
import { formatPokemonName, getFormDisplayName } from "../utils";
import { getSpriteUrl } from "../utils/spriteUtils";
import { SelectField, SearchField } from "../components/Shared/FormField";
import { useTheme } from '../components/Shared/ThemeContext';
import { bingoAPI } from "../utils/api";
import { useMessage } from "../components/Shared/MessageContext";
import { useUser } from "../components/Shared/UserContext";
import { Modal, ConfirmModal } from "../components/Shared/Modal";
import { Button } from "../components/Shared/Button";
import { Tooltip } from "../components/Shared/Tooltip";
import { getTimeAgo } from "../utils/profileUtils";
import './Bingo.css';
import '../css/Counters.css';

const createEmptyGrid = () => Array.from({ length: 25 }, (_, i) => ({
    id: i,
    text: '',
    completed: false,
    completedAt: null,
    pokemon: null,
    pokemonList: [],
    game: null
}));

const Bingo = () => {
    const { showMessage } = useMessage();
    const { username: authUsername } = useUser();
    const { username: routeUsername } = useParams();
    const [searchParams] = useSearchParams();
    const readOnly = !!routeUsername;
    const currentUsername = routeUsername || authUsername;

    const currentSystemYear = new Date().getFullYear();
    const queryYear = searchParams.get('year');
    const initialYear = queryYear ? parseInt(queryYear, 10) : currentSystemYear;

    const [selectedYear, setSelectedYear] = useState(initialYear || currentSystemYear);
    const [availableYears, setAvailableYears] = useState([2026]);
    const [yearsData, setYearsData] = useState({});

    const isEditable = !readOnly && (selectedYear === currentSystemYear);
    const selectedYearRef = useRef(selectedYear);
    useEffect(() => {
        selectedYearRef.current = selectedYear;
    }, [selectedYear]);

    const defaultQuoteForYear = (yr) => ({
        text: `${yr} is my year for shiny hunting!`,
        author: authUsername || routeUsername || "Antonic"
    });

    const STORAGE_KEY = authUsername ? `bingo-grid-state-v1:${authUsername}:${selectedYear}` : null;
    const QUOTE_STORAGE_KEY = authUsername ? `bingo-quote-v1:${authUsername}:${selectedYear}` : `bingo-quote-guest:${selectedYear}`;

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

    // Grid State
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
                        completed: (cell.id === 12 && cell.text === 'FREE') ? false : Boolean(cell.completed),
                        completedAt: cell.completedAt || (cell.completed ? new Date().toISOString() : null),
                        pokemonList: (cell.pokemonList && cell.pokemonList.length > 0) ? cell.pokemonList : (cell.pokemon ? [cell.pokemon] : [])
                    }));
                } catch (e) {
                    console.error("Failed to parse saved bingo grid", e);
                }
            }
        }
        return createEmptyGrid();
    });

    // Customizable Annual Quote
    const [bingoQuote, setBingoQuote] = useState(() => {
        if (QUOTE_STORAGE_KEY) {
            try {
                const savedQuote = localStorage.getItem(QUOTE_STORAGE_KEY);
                if (savedQuote) return JSON.parse(savedQuote);
            } catch (e) { }
        }
        return defaultQuoteForYear(selectedYear);
    });

    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quoteDraftText, setQuoteDraftText] = useState("");
    const [quoteDraftAuthor, setQuoteDraftAuthor] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingCellId, setEditingCellId] = useState(null);
    const [draftGame, setDraftGame] = useState("Scarlet");
    const [draftPokemonList, setDraftPokemonList] = useState([]);
    const [formTab, setFormTab] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [renderLimit, setRenderLimit] = useState(80);
    const [isPrivate, setIsPrivate] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [cycleIndex, setCycleIndex] = useState(0);

    const isDataLoadedRef = useRef(false);
    const gridRef = useRef(grid);
    const quoteRef = useRef(bingoQuote);

    // Keep refs updated
    useEffect(() => {
        gridRef.current = grid;
    }, [grid]);

    useEffect(() => {
        quoteRef.current = bingoQuote;
    }, [bingoQuote]);

    // Cycling timer for multi-pokemon slots
    useEffect(() => {
        const interval = setInterval(() => {
            setCycleIndex(prev => prev + 1);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Load grid and quote from server
    useEffect(() => {
        let isMounted = true;
        isDataLoadedRef.current = false;

        const loadBingoData = async () => {
            try {
                const data = readOnly
                    ? await bingoAPI.getPublicBingo(routeUsername, selectedYear)
                    : await bingoAPI.getBingo(selectedYear);

                if (!isMounted) return;

                if (data && data.availableYears) {
                    setAvailableYears(data.availableYears);
                }
                if (data && data.years) {
                    setYearsData(data.years);
                }

                if (data && Array.isArray(data.grid) && data.grid.length > 0) {
                    const loadedGrid = data.grid.map(cell => ({
                        ...cell,
                        completedAt: cell.completedAt || (cell.completed ? new Date().toISOString() : null),
                        pokemonList: (cell.pokemonList && cell.pokemonList.length > 0) ? cell.pokemonList : (cell.pokemon ? [cell.pokemon] : [])
                    }));
                    setGrid(loadedGrid);
                    if (STORAGE_KEY) {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedGrid));
                    }
                } else if (!readOnly && selectedYear === currentSystemYear) {
                    const emptyGrid = createEmptyGrid();
                    setGrid(emptyGrid);
                    if (STORAGE_KEY) {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyGrid));
                    }
                }

                if (data && data.bingoQuote && data.bingoQuote.text) {
                    setBingoQuote(data.bingoQuote);
                    if (QUOTE_STORAGE_KEY) {
                        localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(data.bingoQuote));
                    }
                } else {
                    const dQuote = defaultQuoteForYear(selectedYear);
                    setBingoQuote(dQuote);
                    if (QUOTE_STORAGE_KEY) {
                        localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(dQuote));
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
    }, [routeUsername, readOnly, authUsername, selectedYear]);

    // Persist grid and quote changes to Local Storage AND Server (debounced)
    useEffect(() => {
        if (readOnly || !isDataLoadedRef.current || !isEditable) return;

        if (STORAGE_KEY) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(grid));
        }

        const timeoutId = setTimeout(async () => {
            try {
                await bingoAPI.updateBingo(grid, bingoQuote, selectedYear);
                setYearsData(prev => ({
                    ...prev,
                    [selectedYear]: {
                        grid: grid,
                        quote: bingoQuote
                    }
                }));
            } catch (error) {
                console.error("Failed to save bingo data to server:", error);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [grid, bingoQuote, readOnly, STORAGE_KEY, isEditable, selectedYear]);

    // Save on beforeunload
    useEffect(() => {
        if (readOnly || !isDataLoadedRef.current || !isEditable) return;

        const handleBeforeUnload = () => {
            const token = localStorage.getItem('authToken');
            if (token && gridRef.current) {
                try {
                    const xhr = new XMLHttpRequest();
                    xhr.open('PUT', '/api/bingo', false);
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    xhr.send(JSON.stringify({
                        bingoData: gridRef.current,
                        bingoQuote: quoteRef.current,
                        year: selectedYearRef.current
                    }));
                } catch (e) {
                    console.error("Failed to save on unload", e);
                }
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [readOnly, isEditable]);

    // Check if a pokemon or form is obtainable/huntable in targetGame
    const isPokemonAvailableInGame = useCallback((pokemon, targetGame) => {
        if (!pokemon || !targetGame) return false;
        const games = getAvailableGamesForPokemonSidebar(pokemon);
        const targetKey = normalizeGameName(targetGame);
        if (games.some(g => normalizeGameName(g) === targetKey)) return true;

        const counterparts = GAME_COUNTERPARTS[targetGame];
        if (counterparts) {
            const counterpartsList = Array.isArray(counterparts) ? counterparts : [counterparts];
            for (const counterpart of counterpartsList) {
                const exclusives = versionExclusives[counterpart];
                const formattedId = String(pokemon.id).padStart(4, "0");
                if (exclusives && (exclusives.includes(pokemon.name) || exclusives.includes(formattedId))) {
                    return true;
                }
            }
        }
        return false;
    }, []);

    // Memoize all pokemon data (base + forms with unique stableIds)
    const allPokemon = useMemo(() => {
        let currentPrefs = null;
        try {
            currentPrefs = JSON.parse(localStorage.getItem("dexPreferences"));
        } catch { }

        const baseList = pokemonData.map(p => ({
            ...p,
            formType: "main",
            stableId: p.stableId || `${p.name}-${String(p.id).padStart(4, "0")}`
        }));

        const formsList = getFilteredFormsData(formsData, currentPrefs)
            .filter(f => f.formType !== "mighty" && !f.stableId?.startsWith("origin-ball-") && !f.name?.startsWith("origin-ball-"))
            .map(f => ({
                ...f,
                stableId: f.stableId || `${f.name}-${f.formType}-${String(f.id).padStart(4, "0")}`
            }));

        return [...baseList, ...formsList];
    }, []);

    // Dynamic Form Tabs for current draftGame
    const getTabsForGame = useCallback((gameName) => {
        if (!gameName) return [{ id: "all", label: "All Forms" }];
        const inGame = allPokemon.filter(p => isPokemonAvailableInGame(p, gameName));

        const counts = {
            all: inGame.length,
            main: inGame.filter(p => !p.formType || p.formType === "main").length,
            alolan: inGame.filter(p => p.formType === "alolan").length,
            galarian: inGame.filter(p => p.formType === "galarian").length,
            hisuian: inGame.filter(p => p.formType === "hisuian").length,
            paldean: inGame.filter(p => p.formType === "paldean").length,
            gmax: inGame.filter(p => p.formType === "gmax").length,
            gender: inGame.filter(p => p.formType === "gender").length,
            unown: inGame.filter(p => p.formType === "unown").length,
            vivillon: inGame.filter(p => p.formType === "vivillon").length,
            alcremie: inGame.filter(p => p.formType === "alcremie").length,
            alpha: inGame.filter(p => p.formType === "alpha" || p.formType === "alphaother").length,
            other: inGame.filter(p => p.formType === "other").length
        };

        const definitions = [
            { id: "all", label: "All Forms" },
            { id: "main", label: "Base Species" },
            { id: "alolan", label: "Alola" },
            { id: "galarian", label: "Galar" },
            { id: "hisuian", label: "Hisui" },
            { id: "paldean", label: "Paldea" },
            { id: "gmax", label: "Gigantamax" },
            { id: "gender", label: "Gender" },
            { id: "unown", label: "Unown" },
            { id: "vivillon", label: "Vivillon" },
            { id: "alcremie", label: "Alcremie" },
            { id: "alpha", label: "Alpha" },
            { id: "other", label: "Other" }
        ];

        return definitions.filter(d => d.id === "all" || (counts[d.id] && counts[d.id] > 0));
    }, [allPokemon, isPokemonAvailableInGame]);

    const availableFormTabs = useMemo(() => {
        return getTabsForGame(draftGame);
    }, [getTabsForGame, draftGame]);

    // Filter pokemon based on draftGame, formTab, and search
    const filteredPokemon = useMemo(() => {
        if (!draftGame) return [];
        let inGame = allPokemon.filter(p => isPokemonAvailableInGame(p, draftGame));

        if (formTab && formTab !== "all") {
            if (formTab === "main") {
                inGame = inGame.filter(p => !p.formType || p.formType === "main");
            } else if (formTab === "alpha") {
                inGame = inGame.filter(p => p.formType === "alpha" || p.formType === "alphaother");
            } else {
                inGame = inGame.filter(p => p.formType === formTab);
            }
        }

        if (!searchTerm.trim()) return inGame;
        const q = searchTerm.trim().toLowerCase();
        return inGame.filter(p =>
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.id && String(p.id).includes(q.replace("#", ""))) ||
            (p.formLabel && p.formLabel.toLowerCase().includes(q))
        );
    }, [allPokemon, draftGame, formTab, searchTerm, isPokemonAvailableInGame]);

    const displayedPokemon = useMemo(() => {
        return filteredPokemon.slice(0, renderLimit);
    }, [filteredPokemon, renderLimit]);

    const handleGridScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 220) {
            setRenderLimit(prev => Math.min(prev + 60, filteredPokemon.length));
        }
    }, [filteredPokemon.length]);

    // Reset render limit when draft game, form tab, or search changes
    useEffect(() => {
        setRenderLimit(80);
    }, [draftGame, formTab, searchTerm]);

    const editingCell = useMemo(() => {
        if (editingCellId === null) return null;
        return grid.find(c => c.id === editingCellId) || null;
    }, [grid, editingCellId]);

    // Progress metrics
    const completedCount = useMemo(() => {
        return grid.filter(cell => cell.completed).length;
    }, [grid]);

    const percentComplete = useMemo(() => {
        return Math.round((completedCount / 25) * 100);
    }, [completedCount]);

    // Days remaining in selectedYear (or 0 if past year)
    const daysRemaining = useMemo(() => {
        const targetDate = new Date(`${selectedYear}-12-31T23:59:59`);
        const now = new Date();
        const diff = targetDate.getTime() - now.getTime();
        if (diff <= 0) return 0;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [selectedYear]);

    // Recent Activity (derived from completed slots sorted by completedAt descending)
    const recentActivity = useMemo(() => {
        return grid
            .filter(c => c.completed && (c.pokemonList?.length > 0 || c.pokemon))
            .map(c => {
                const poke = (c.pokemonList && c.pokemonList.length > 0) ? c.pokemonList[0] : c.pokemon;
                return {
                    id: c.id,
                    pokemon: poke,
                    game: c.game,
                    completedAt: c.completedAt || new Date().toISOString()
                };
            })
            .sort((a, b) => {
                const tA = new Date(a.completedAt).getTime();
                const tB = new Date(b.completedAt).getTime();
                return tB - tA;
            });
    }, [grid]);

    // Recent Activity pagination (3 per page)
    const [activityPage, setActivityPage] = useState(1);
    const ACTIVITY_PER_PAGE = 3;
    const totalActivityPages = Math.max(1, Math.ceil(recentActivity.length / ACTIVITY_PER_PAGE));
    const currentPage = Math.min(activityPage, totalActivityPages);
    const paginatedActivity = useMemo(() => {
        const start = (currentPage - 1) * ACTIVITY_PER_PAGE;
        return recentActivity.slice(start, start + ACTIVITY_PER_PAGE);
    }, [recentActivity, currentPage]);

    const handleSelectYear = (yr) => {
        if (yr === selectedYear) return;

        // Save current active year's grid and quote into yearsData state first
        setYearsData(prev => ({
            ...prev,
            [selectedYear]: {
                grid: grid,
                quote: bingoQuote
            }
        }));

        // If target year's data is already in yearsData, switch to it immediately
        if (yearsData[yr]) {
            const yrData = yearsData[yr];
            if (Array.isArray(yrData.grid)) {
                setGrid(yrData.grid.map(c => ({
                    ...c,
                    completedAt: c.completedAt || (c.completed ? new Date().toISOString() : null),
                    pokemonList: (c.pokemonList && c.pokemonList.length > 0) ? c.pokemonList : (c.pokemon ? [c.pokemon] : [])
                })));
            } else {
                setGrid(createEmptyGrid());
            }

            if (yrData.quote && yrData.quote.text) {
                setBingoQuote(yrData.quote);
            } else {
                setBingoQuote(defaultQuoteForYear(yr));
            }
        }

        setSelectedYear(yr);
        setActivityPage(1);
    };

    const handleClearBoardConfirm = async () => {
        const empty = createEmptyGrid();
        setGrid(empty);
        setYearsData(prev => ({
            ...prev,
            [selectedYear]: {
                ...(prev[selectedYear] || {}),
                grid: empty
            }
        }));
        if (STORAGE_KEY) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
        }
        setShowClearConfirm(false);
        showMessage(`${selectedYear} Board cleared!`, "success");

        try {
            await bingoAPI.updateBingo(empty, bingoQuote, selectedYear);
        } catch (e) {
            console.error("Failed to clear board on server:", e);
        }
    };

    const handleShare = () => {
        if (!currentUsername) return;
        const url = `${window.location.origin}/u/${encodeURIComponent(currentUsername)}/bingo?year=${selectedYear}`;
        navigator.clipboard.writeText(url)
            .then(() => showMessage(`${selectedYear} Bingo link copied to clipboard!`, "success"))
            .catch(() => showMessage("Failed to copy link", "error"));
    };

    const openQuoteModal = () => {
        if (readOnly) return;
        setQuoteDraftText(bingoQuote.text || `${selectedYear} is my year for shiny hunting!`);
        setQuoteDraftAuthor(bingoQuote.author || (readOnly ? routeUsername : currentUsername) || "Antonic");
        setShowQuoteModal(true);
    };

    const handleSaveQuote = async () => {
        const newQuote = {
            text: quoteDraftText.trim() || `${selectedYear} is my year for shiny hunting!`,
            author: quoteDraftAuthor.trim() || (readOnly ? routeUsername : currentUsername) || "Antonic"
        };
        setBingoQuote(newQuote);
        setYearsData(prev => ({
            ...prev,
            [selectedYear]: {
                ...(prev[selectedYear] || {}),
                quote: newQuote
            }
        }));
        if (QUOTE_STORAGE_KEY) {
            localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(newQuote));
        }
        setShowQuoteModal(false);
        showMessage("Bingo quote updated!", "success");

        if (!readOnly) {
            try {
                await bingoAPI.updateBingo(grid, newQuote, selectedYear);
            } catch (e) {
                console.error("Failed to save quote to server:", e);
            }
        }
    };

    const openEditModal = (id, e) => {
        if (!isEditable) return;
        if (e) e.stopPropagation();
        setEditingCellId(id);
        const cell = grid.find(c => c.id === id);
        if (cell) {
            setDraftGame(cell.game || "Scarlet");
            const list = (cell.pokemonList && cell.pokemonList.length > 0)
                ? [...cell.pokemonList]
                : (cell.pokemon ? [cell.pokemon] : []);
            setDraftPokemonList(list);
        } else {
            setDraftGame("Scarlet");
            setDraftPokemonList([]);
        }
        setSearchTerm("");
        setFormTab("all");
        setRenderLimit(80);
        setShowModal(true);
    };

    const handleTogglePokemon = (pokemon) => {
        if (editingCellId === null || !isEditable) return;

        setDraftPokemonList(prev => {
            const existsIndex = prev.findIndex(p => (p.stableId || p.name) === (pokemon.stableId || pokemon.name));
            if (existsIndex >= 0) {
                return prev.filter((_, i) => i !== existsIndex);
            } else {
                if (prev.length >= 8) {
                    showMessage("Maximum 8 Pokémon per slot", "warning");
                    return prev;
                }
                return [...prev, pokemon];
            }
        });
    };

    const handleRemoveFromDraft = (pokemon) => {
        setDraftPokemonList(prev => prev.filter(p => (p.stableId || p.name) !== (pokemon.stableId || pokemon.name)));
    };

    const handleSaveSlot = () => {
        if (editingCellId === null || !isEditable) return;

        const primaryPokemon = draftPokemonList.length > 0 ? draftPokemonList[0] : null;
        const slotText = primaryPokemon ? formatPokemonName(primaryPokemon.name) : "";
        const slotGame = draftPokemonList.length > 0 ? draftGame : (draftGame || null);

        setGrid(prev => prev.map(cell => {
            if (cell.id === editingCellId) {
                return {
                    ...cell,
                    pokemon: primaryPokemon,
                    pokemonList: draftPokemonList,
                    game: slotGame,
                    text: slotText
                };
            }
            return cell;
        }));

        closeModal();
        showMessage(`Slot #${editingCellId + 1} updated!`, "success");
    };

    const handleClearSlot = () => {
        if (editingCellId === null || !isEditable) return;
        setGrid(prev => prev.map(cell => {
            if (cell.id === editingCellId) {
                return {
                    ...cell,
                    pokemon: null,
                    pokemonList: [],
                    game: null,
                    text: '',
                    completed: false,
                    completedAt: null
                };
            }
            return cell;
        }));
        closeModal();
        showMessage(`Slot #${editingCellId + 1} cleared!`, "info");
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCellId(null);
        setSearchTerm("");
        setDraftPokemonList([]);
    };

    const toggleCompletion = (id, e) => {
        if (!isEditable) return;
        if (e) e.stopPropagation();
        setGrid(prev => prev.map(c => {
            if (c.id === id) {
                const isNowCompleted = !c.completed;
                return {
                    ...c,
                    completed: isNowCompleted,
                    completedAt: isNowCompleted ? new Date().toISOString() : null
                };
            }
            return c;
        }));
    };

    const getPokemonImage = (pokemon) => {
        if (!pokemon) return "/fallback.png";
        const freshPokemon = allPokemon.find(p => p.id === pokemon.id && p.name === pokemon.name) || pokemon;
        return getSpriteUrl(freshPokemon, true, useHomeSprites);
    };

    const getGameIcon = (gameName) => {
        const game = GAME_OPTIONS.find(g => g.value === gameName);
        return game ? game.image : null;
    };

    const getFormIconInfo = (pokemon) => {
        if (!pokemon) return null;

        const isAlpha = pokemon.formType === 'alpha' || pokemon.formType === 'alphaother' || (pokemon.name && pokemon.name.includes('-alpha'));
        let nameToCheck = pokemon.name || "";
        if (nameToCheck.includes("-alpha")) nameToCheck = nameToCheck.replace("-alpha", "");

        const isFemale = pokemon.formType === 'gender' || (pokemon.formType === 'alphaother' && pokemon.stableId && pokemon.stableId.includes('female')) || (pokemon.name && pokemon.name.includes('-female'));
        const isMale = !isFemale && ((pokemon.name && pokemon.name.includes('-male')) || (pokemon.stableId && pokemon.stableId.includes('male')) || genderForms.includes(nameToCheck));

        if (isAlpha) {
            if (isFemale) {
                return { src: "/data/SidebarIcons/Alpha_Mark_Female.png", color: "#ef6491" };
            } else if (isMale) {
                return { src: "/data/SidebarIcons/Alpha_Mark_Male.png", color: "#316497" };
            } else {
                return { src: "/data/SidebarIcons/Alpha_Mark.png", color: "#e05555" };
            }
        } else {
            if (isFemale) {
                return { src: "/data/SidebarIcons/Female.svg", color: "#ef6491" };
            } else if (isMale) {
                return { src: "/data/SidebarIcons/Male.svg", color: "#316497" };
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
                {/* ── STANDARD SITE HEADER ────────────────────────────────────────── */}
                <div className="bingo-header-wrap">
                    <div className="bingo-title-row">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="bingo-main-title">
                                {readOnly ? `${routeUsername}'s ` : ''}{selectedYear} Shiny BINGO
                            </h1>
                            {selectedYear !== currentSystemYear && (
                                <span className="bingo-archive-indicator">
                                    Archived Sheet
                                </span>
                            )}
                        </div>

                        <div className="bingo-header-actions">
                            {isEditable && (
                                <Button
                                    variant="danger"
                                    onClick={() => setShowClearConfirm(true)}
                                    icon={<Trash2 size={16} />}
                                >
                                    Clear Board
                                </Button>
                            )}

                            {readOnly ? (
                                <Button
                                    as={Link}
                                    to={`/u/${routeUsername}`}
                                    variant="primary"
                                    icon={<ArrowLeft size={16} />}
                                >
                                    Back to Profile
                                </Button>
                            ) : (
                                currentUsername && (
                                    <Button
                                        variant="secondary"
                                        onClick={handleShare}
                                        icon={<Share2 size={16} />}
                                    >
                                        Share Board
                                    </Button>
                                )
                            )}
                        </div>
                    </div>
                </div>

                <div className="app-divider" />

                {/* ── STATS & PROGRESS BANNER ────────────────────────────────────── */}
                <div className="bingo-stats-banner">
                    {/* Card 1: Progress */}
                    <div className="bingo-stat-card progress-card">
                        <div className="bingo-stat-icon-wrap">
                            <Trophy size={24} className="text-[var(--accent)]" />
                        </div>
                        <div className="bingo-stat-info">
                            <span className="bingo-stat-label">Progress</span>
                            <div className="bingo-stat-val-row">
                                <span className="bingo-stat-value">{completedCount} / 25</span>
                                <span className="bingo-stat-pct">{percentComplete}% Complete</span>
                            </div>
                            <div className="bingo-progress-track">
                                <div
                                    className="bingo-progress-fill"
                                    style={{ width: `${percentComplete}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Countdown / Year Status */}
                    <div className="bingo-stat-card countdown-card">
                        <div className="bingo-stat-icon-wrap">
                            <Calendar size={24} className="text-[var(--accent)]" />
                        </div>
                        <div className="bingo-stat-info">
                            <span className="bingo-stat-label">
                                {selectedYear === currentSystemYear ? "Days Remaining" : "Year Status"}
                            </span>
                            <span className="bingo-stat-value">
                                {selectedYear === currentSystemYear ? daysRemaining : "Archived"}
                            </span>
                            <span className="bingo-stat-sub">
                                {selectedYear === currentSystemYear ? `Ends Dec 31, ${selectedYear}` : `Concluded ${selectedYear}`}
                            </span>
                        </div>
                    </div>

                    {/* Card 3: Customizable Annual Quote */}
                    <div className={`bingo-stat-card quote-card ${!readOnly ? 'editable' : ''}`} onClick={!readOnly ? openQuoteModal : undefined}>
                        <div className="bingo-quote-content">
                            <div className="bingo-quote-text">
                                “{bingoQuote.text || `${selectedYear} is my year for shiny hunting!`}”
                            </div>
                            <div className="bingo-quote-author">
                                — {bingoQuote.author || (readOnly ? routeUsername : currentUsername) || "Antonic"}
                            </div>
                        </div>

                        {!readOnly && (
                            <button
                                type="button"
                                className="bingo-quote-edit-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openQuoteModal();
                                }}
                                title="Customize Quote"
                            >
                                <Edit2 size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── MAIN WORKSPACE: BOARD (LEFT) + RECENT ACTIVITY (RIGHT) ─────── */}
                <div className="bingo-workspace-layout">
                    {/* LEFT COLUMN: THE BINGO BOARD */}
                    <div className="bingo-board-column">
                        {/* Bingo Grid Box */}
                        <div className="bingo-board-wrapper">
                            <div className="bingo-grid">
                                {/* B - I - N - G - O Column Headers */}
                                {['B', 'I', 'N', 'G', 'O'].map((letter) => (
                                    <div key={letter} className="bingo-header-cell">
                                        {letter}
                                    </div>
                                ))}

                                {/* 25 Cells */}
                                {grid.map((cell) => {
                                    const list = (cell.pokemonList && cell.pokemonList.length > 0) ? cell.pokemonList : (cell.pokemon ? [cell.pokemon] : []);

                                    return (
                                        <div
                                            key={cell.id}
                                            className="bingo-cell-wrapper"
                                            onClick={(e) => {
                                                if (!isEditable) return;
                                                if (list.length === 0) openEditModal(cell.id);
                                                else if (cell.completed) toggleCompletion(cell.id, e);
                                            }}
                                            style={{ cursor: !isEditable ? 'default' : (list.length === 0 || cell.completed) ? 'pointer' : 'default' }}
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
                                                                        src={getPokemonImage(pokemon)}
                                                                        alt={pokemon.name}
                                                                        className="bingo-pokemon-img"
                                                                    />

                                                                    {/* Corner Badge: Game overlay icon with Universal Tooltip */}
                                                                    {cell.game && getGameIcon(cell.game) && (
                                                                        <Tooltip
                                                                            content={cell.game}
                                                                            position="top"
                                                                            align="end"
                                                                            className="bingo-game-tooltip-wrap"
                                                                            style={{ position: 'absolute', bottom: '4px', right: '4px', zIndex: 20 }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <div className="bingo-game-icon-container">
                                                                                <img
                                                                                    src={getGameIcon(cell.game)}
                                                                                    alt={cell.game}
                                                                                    className="bingo-game-overlay-icon"
                                                                                />
                                                                            </div>
                                                                        </Tooltip>
                                                                    )}

                                                                    {/* Corner Badge: Form icon */}
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
                                                    <div className="bingo-empty-placeholder">
                                                        {isEditable && (
                                                            <div className="bingo-empty-plus">
                                                                <Plus size={20} />
                                                            </div>
                                                        )}
                                                        <span className="bingo-placeholder-text">
                                                            {cell.text || (isEditable ? "Add Target" : "Empty")}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Top-Right: Edit Button */}
                                                {!cell.completed && isEditable && (
                                                    <button
                                                        type="button"
                                                        className="edit-cell-btn"
                                                        onClick={(e) => openEditModal(cell.id, e)}
                                                        title="Edit Slot"
                                                    >
                                                        <Edit2 size={13} />
                                                    </button>
                                                )}

                                                {/* Top-Left: Mark Complete Button */}
                                                {list.length > 0 && isEditable && (
                                                    <button
                                                        type="button"
                                                        className={`bingo-check-btn ${cell.completed ? 'completed' : ''}`}
                                                        onClick={(e) => toggleCompletion(cell.id, e)}
                                                        title={cell.completed ? "Mark Incomplete" : "Mark Complete"}
                                                    >
                                                        <Check size={14} strokeWidth={3} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bingo-board-footer-hint">
                            {isEditable
                                ? "Click any slot to add Pokémon • Top-left check to complete • Top-right to edit"
                                : `Viewing ${selectedYear} Bingo Archive • Read-Only`
                            }
                        </div>
                    </div>

                    {/* RIGHT COLUMN: RECENT ACTIVITY + YEARLY SHEETS */}
                    <div className="bingo-activity-column">
                        {/* ── CARD 1: RECENT ACTIVITY (Fixed Height) ─────────────── */}
                        <div className="bingo-activity-card">
                            <div className="bingo-activity-header">
                                <div className="flex items-center gap-2">
                                    <Clock size={18} className="text-[var(--accent)]" />
                                    <h2 className="bingo-activity-title">Recent Activity</h2>
                                </div>
                                <span className="bingo-activity-pill">
                                    {recentActivity.length} Caught
                                </span>
                            </div>

                            <div className="bingo-activity-body">
                                {recentActivity.length > 0 ? (
                                    <>
                                        <div className="bingo-activity-list">
                                            {paginatedActivity.map((item) => {
                                                const catchDate = new Date(item.completedAt);
                                                const dateStr = !isNaN(catchDate.getTime())
                                                    ? catchDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                                    : 'Caught';
                                                const timeAgoStr = getTimeAgo(item.completedAt);

                                                return (
                                                    <div key={`act-${item.id}`} className="bingo-activity-item">
                                                        <div className="bingo-activity-thumb">
                                                            <img
                                                                src={getPokemonImage(item.pokemon)}
                                                                alt={item.pokemon.name}
                                                            />
                                                            <div className="bingo-activity-check-badge">
                                                                <Check size={9} strokeWidth={3.5} />
                                                            </div>
                                                        </div>

                                                        <div className="bingo-activity-details">
                                                            <div className="bingo-activity-name">
                                                                {formatPokemonName(item.pokemon.name)}
                                                            </div>
                                                            <div className="bingo-activity-date" title={catchDate.toLocaleString()}>
                                                                {timeAgoStr ? `${timeAgoStr} (${dateStr})` : dateStr}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Pagination Controls (3 entries per page) */}
                                        <div className="bingo-activity-pagination">
                                            <button
                                                type="button"
                                                className="bingo-page-nav-btn"
                                                disabled={currentPage <= 1 || totalActivityPages <= 1}
                                                onClick={() => setActivityPage(prev => Math.max(1, prev - 1))}
                                                aria-label="Previous page"
                                            >
                                                <ChevronLeft size={15} />
                                            </button>
                                            <span className="bingo-page-indicator">
                                                Page {currentPage} of {Math.max(1, totalActivityPages)}
                                            </span>
                                            <button
                                                type="button"
                                                className="bingo-page-nav-btn"
                                                disabled={currentPage >= totalActivityPages}
                                                onClick={() => setActivityPage(prev => Math.min(totalActivityPages, prev + 1))}
                                                aria-label="Next page"
                                            >
                                                <ChevronRight size={15} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bingo-activity-empty">
                                        <Sparkles size={28} className="text-[var(--text-muted)] opacity-50 mb-2" />
                                        <p className="bingo-empty-title">No Caught Pokémon Yet</p>
                                        <p className="bingo-empty-sub">
                                            Check off completed slots on your bingo board to automatically track your catch dates!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── CARD 2: YEARLY SHEETS ARCHIVE BOX ──────────────────── */}
                        <div className="bingo-years-card">
                            <div className="bingo-years-header">
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-[var(--accent)]" />
                                    <h2 className="bingo-years-title">Yearly Sheets</h2>
                                </div>
                                <span className="bingo-years-pill">
                                    {selectedYear} Selected
                                </span>
                            </div>

                            <div className="bingo-years-list">
                                {availableYears.map(yr => {
                                    const isSelected = yr === selectedYear;
                                    const isCurrent = yr === currentSystemYear;
                                    const yrData = yearsData[yr] || {};
                                    const yrGrid = (yr === selectedYear) ? grid : (yrData.grid || []);
                                    const yrCaught = yrGrid.filter(c => c.completed).length;

                                    return (
                                        <button
                                            key={`year-card-${yr}`}
                                            type="button"
                                            className={`bingo-year-btn ${isSelected ? 'active' : ''}`}
                                            onClick={() => handleSelectYear(yr)}
                                        >
                                            <div className="bingo-year-btn-left">
                                                <span className="bingo-year-name">{yr} Bingo</span>
                                                <span className={`bingo-year-status-badge ${isCurrent ? 'current' : 'archived'}`}>
                                                    {isCurrent ? 'Active' : 'Archived'}
                                                </span>
                                            </div>

                                            <div className="bingo-year-btn-right">
                                                <div className="bingo-year-caught-count">
                                                    <CheckCircle2 size={13} className={yrCaught > 0 ? "text-[#22c55e]" : "text-[var(--text-muted)]"} />
                                                    <span>{yrCaught} / 25</span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MODAL 1: EDIT POKÉMON & GAME ──────────────────────────────────── */}
            {/* ── MODAL 1: EDIT POKÉMON & GAME (REVAMPED) ───────────────────────── */}
            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={`Configure Bingo Slot #${(editingCellId ?? 0) + 1}`}
                subtitle={
                    draftGame 
                        ? `${draftGame} • ${draftPokemonList.length} Pokémon selected`
                        : "Select target game & Pokémon for this slot"
                }
                icon={<Gamepad2 size={22} />}
                size="lg"
                className="bingo-slot-modal"
                footer={({ close }) => (
                    <div className="flex items-center justify-between w-full">
                        <div>
                            {(editingCell?.pokemon || editingCell?.game || draftPokemonList.length > 0) && (
                                <Button
                                    variant="danger"
                                    size="md"
                                    onClick={handleClearSlot}
                                    icon={<Trash2 size={15} />}
                                >
                                    Clear Slot
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="md"
                                onClick={close}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                size="md"
                                onClick={handleSaveSlot}
                                icon={<Check size={16} strokeWidth={2.5} />}
                            >
                                {draftPokemonList.length > 1
                                    ? `Save Slot (${draftPokemonList.length} Pokémon)`
                                    : "Save Slot"}
                            </Button>
                        </div>
                    </div>
                )}
            >
                <div className="bingo-modal-body space-y-3.5">
                    {/* Game & Search Controls */}
                    <div className="bingo-picker-top-controls">
                        <div className="bingo-picker-game-col">
                            <SelectField
                                label="Target Game"
                                options={GAME_OPTIONS.filter(g => g.value && g.name !== "None").map(g => ({
                                    value: g.value,
                                    label: g.name,
                                    image: g.image
                                }))}
                                value={draftGame}
                                placeholder="Select a game..."
                                onChange={(nextGame) => {
                                    setDraftGame(nextGame);
                                    setFormTab("all");
                                }}
                                searchable
                                fullWidth
                            />
                        </div>

                        <div className="bingo-picker-search-col">
                            <SearchField
                                label="Search Pokémon"
                                value={searchTerm}
                                onChange={(val) => setSearchTerm(typeof val === "string" ? val : val?.target?.value || "")}
                                placeholder={`Search ${draftGame || 'game'} by name or #dex...`}
                                fullWidth
                            />
                        </div>
                    </div>

                    {/* Selected Pokémon Shelf / Chips */}
                    {draftPokemonList.length > 0 && (
                        <div className="bingo-selected-tray">
                            <div className="bingo-selected-tray-header">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-[var(--accent)]" />
                                    <span className="bingo-selected-tray-title">
                                        Assigned to Slot ({draftPokemonList.length}/8)
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="bingo-selected-clear-btn"
                                    onClick={() => {
                                        setDraftPokemonList([]);
                                        setDraftText("");
                                    }}
                                >
                                    Clear Selection
                                </button>
                            </div>

                            <div className="bingo-selected-chips-row custom-scrollbar">
                                {draftPokemonList.map((pkm, pIdx) => {
                                    const formLabel = getFormDisplayName(pkm);
                                    return (
                                        <div
                                            key={pkm.stableId || `${pkm.id}-${pkm.name}-${pIdx}`}
                                            className="bingo-selected-chip"
                                        >
                                            <img
                                                src={getPokemonImage(pkm)}
                                                alt=""
                                                className={`bingo-selected-chip-sprite ${!useHomeSprites ? 'pixelated' : ''}`}
                                            />
                                            <div className="bingo-selected-chip-info">
                                                <span className="bingo-selected-chip-name">
                                                    {formatPokemonName(pkm.name)}
                                                </span>
                                                {formLabel && (
                                                    <span className="bingo-selected-chip-form">
                                                        {formLabel}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                className="bingo-selected-chip-remove"
                                                onClick={() => handleRemoveFromDraft(pkm)}
                                                title="Remove"
                                            >
                                                <X size={12} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}



                    {/* Form Tabs */}
                    {draftGame && availableFormTabs.length > 1 && (
                        <div className="bingo-picker-tabs-row custom-scrollbar">
                            {availableFormTabs.map(tab => {
                                const isActive = formTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        className={`bingo-picker-tab-btn ${isActive ? 'is-active' : ''}`}
                                        onClick={() => setFormTab(tab.id)}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Grid Meta Header */}
                    {draftGame && (
                        <div className="bingo-picker-meta-row">
                            <span>
                                Showing <strong>{filteredPokemon.length}</strong> obtainable in <strong>{draftGame}</strong>
                            </span>
                            <span className="bingo-picker-hint">
                                Click Pokémon to add or remove from slot
                            </span>
                        </div>
                    )}

                    {/* Pokémon Selection Grid */}
                    {draftGame ? (
                        <div
                            className="bingo-pokemon-picker-grid custom-scrollbar"
                            onScroll={handleGridScroll}
                        >
                            {displayedPokemon.map((pokemon, index) => {
                                const isSelected = draftPokemonList.some(p => (p.stableId || p.name) === (pokemon.stableId || pokemon.name));
                                const formLabel = getFormDisplayName(pokemon);
                                const dexNum = pokemon.id != null ? `#${String(pokemon.id).padStart(4, "0")}` : "";

                                return (
                                    <button
                                        key={pokemon.stableId || `${pokemon.id}-${pokemon.name}-${index}`}
                                        type="button"
                                        className={`bingo-picker-card ${isSelected ? 'is-selected' : ''}`}
                                        onClick={() => handleTogglePokemon(pokemon)}
                                    >
                                        <div className="bingo-picker-sprite-wrap">
                                            <img
                                                src={getPokemonImage(pokemon)}
                                                alt={pokemon.name}
                                                className={`bingo-picker-sprite ${!useHomeSprites ? 'pixelated' : ''}`}
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className="bingo-picker-card-info">
                                            <span className="bingo-picker-card-name">
                                                {formatPokemonName(pokemon.name)}
                                            </span>
                                            <div className="bingo-picker-card-sub">
                                                {dexNum && <span className="bingo-picker-card-dex">{dexNum}</span>}
                                                {formLabel && <span className="bingo-picker-card-form">{formLabel}</span>}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="bingo-picker-check-badge">
                                                <Check size={11} strokeWidth={3.5} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}

                            {filteredPokemon.length === 0 && (
                                <div className="bingo-picker-empty">
                                    No Pokémon found matching your filters for {draftGame}.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bingo-picker-empty">
                            Please select a game above to browse available Pokémon.
                        </div>
                    )}
                </div>
            </Modal>

            {/* ── MODAL 2: CUSTOMIZE ANNUAL QUOTE ───────────────────────────────── */}
            <Modal
                isOpen={showQuoteModal}
                onClose={() => setShowQuoteModal(false)}
                title={`Customize ${selectedYear} Bingo Motto & Quote`}
                subtitle={`Personalize your annual shiny hunting quote for ${selectedYear}`}
                size="md"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setShowQuoteModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSaveQuote}
                            icon={<Check size={16} strokeWidth={2.5} />}
                        >
                            Save Quote
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--progressbar-info)]">
                            Your {selectedYear} Motto or Quote:
                        </label>
                        <textarea
                            rows={3}
                            maxLength={160}
                            value={quoteDraftText}
                            onChange={(e) => setQuoteDraftText(e.target.value)}
                            placeholder={`${selectedYear} is my year for shiny hunting!`}
                            className="w-full px-3.5 py-2 text-sm rounded-xl bg-[var(--progressbar-input)] border border-[var(--border-color)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none resize-none"
                        />
                        <div className="text-[11px] text-right text-[var(--text-muted)]">
                            {quoteDraftText.length} / 160 characters
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--progressbar-info)]">
                            Signature / Author:
                        </label>
                        <input
                            type="text"
                            maxLength={40}
                            value={quoteDraftAuthor}
                            onChange={(e) => setQuoteDraftAuthor(e.target.value)}
                            placeholder={currentUsername || "Trainer"}
                            className="w-full px-3.5 py-2 text-sm rounded-xl bg-[var(--progressbar-input)] border border-[var(--border-color)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                        />
                    </div>
                </div>
            </Modal>

            {/* ── MODAL 3: CLEAR BOARD CONFIRMATION ─────────────────────────────── */}
            <ConfirmModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={handleClearBoardConfirm}
                title={`Clear ${selectedYear} Bingo Board`}
                message={`Are you sure you want to clear your entire ${selectedYear} bingo board? All assigned Pokémon and completion records for ${selectedYear} will be reset.`}
                confirmText="Clear Board"
                variant="danger"
            />
        </div>
    );
};

export default Bingo;
