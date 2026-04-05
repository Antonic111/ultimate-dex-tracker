import { useState, useEffect, useRef, useMemo } from "react";
import { useUser } from "../components/Shared/UserContext";
import "../css/Profile.css";
import { NotebookPen, Trophy, Mars, Venus, VenusAndMars, PencilLine, SquareX, Link as LinkIcon, Heart, Sparkles, Crown, ChevronLeft, ChevronRight } from "lucide-react";
import { IconDropdown } from "../components/Shared/IconDropdown";
import FavoriteSelectionModal from "../components/Shared/FavoriteSelectionModal";
import "flag-icons/css/flag-icons.min.css";
import { COUNTRY_OPTIONS } from "../data/countries";
import { GAME_OPTIONS_TWO, BALL_OPTIONS, MARK_OPTIONS } from "../Constants";
import pokemonData from "../data/pokemon.json";
import { formatPokemonName, getFormDisplayName } from "../utils";
import trainerOptions from "../trainers.json";
import { useNavigate } from "react-router-dom";
import { useMessage } from "../components/Shared/MessageContext";
import formsData from "../utils/loadFormsData";
import { getCaughtKey } from "../caughtStorage";
import { useLoading } from "../components/Shared/LoadingContext";
import { LoadingSpinner, SkeletonLoader } from "../components/Shared";
import ContentFilterInput from "../components/Shared/ContentFilterInput";
import { validateContent } from "../../shared/contentFilter";
import { profileAPI, caughtAPI } from "../utils/api";
import { getFilteredFormsData } from "../utils/dexPreferences";
import { SearchbarIconDropdown } from "../components/Shared/SearchBar";

const FORM_TYPES_FOR_FAVORITES = [
    "alolan",
    "galarian",
    "gmax",
    "hisuian",
    "paldean",
    "unown",
    "other",
    "alcremie",
    "vivillon",
];

const BASE_POKEMON_OPTIONS = pokemonData.map((p) => ({
    name: formatPokemonName(p.name),
    value: p.name,
    image: p.sprites.front_default,
    shinyImage: p.sprites.front_shiny,
}));

// We'll calculate these inside the component to be reactive to user preferences

function getTimeAgo(dateString) {
    if (!dateString) return '';

    const now = new Date();
    let joined;

    // Handle different date formats
    if (typeof dateString === 'string') {
        // Try parsing as ISO string first
        joined = new Date(dateString);
        if (isNaN(joined.getTime())) {
            // Try parsing as timestamp
            const timestamp = parseInt(dateString, 10);
            if (!isNaN(timestamp)) {
                joined = new Date(timestamp);
            }
        }
    } else if (typeof dateString === 'number') {
        joined = new Date(dateString);
    } else {
        joined = new Date(dateString);
    }

    // Validate the date
    if (isNaN(joined.getTime())) {
        return 'Unknown date';
    }

    const diff = now - joined;

    // Handle future dates (shouldn't happen but just in case)
    if (diff < 0) {
        return 'Just now';
    }

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30.44);
    const years = Math.floor(days / 365.25);

    if (years >= 1) return `${years} year${years > 1 ? "s" : ""} ago`;
    if (months >= 1) return `${months} month${months > 1 ? "s" : ""} ago`;
    if (days >= 1) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours >= 1) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes >= 1) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    if (seconds >= 1) return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
    return 'Just now';
}

const SWITCH_FC_RE = /^SW-\d{4}-\d{4}-\d{4}$/;

function formatSwitchFCInput(value) {
    const digits = (value || "").replace(/\D/g, "").slice(0, 12);
    if (!digits) return "";
    const parts = digits.match(/.{1,4}/g) || [];
    return "SW-" + parts.join("-");
}

export default function Profile() {
    const navigate = useNavigate();
    const { username, email, createdAt, loading } = useUser();
    const { setLoading, isLoading } = useLoading();
    const { showMessage } = useMessage();

    // Get user's dex preferences for filtering forms
    const [dexPreferences, setDexPreferences] = useState(() => {
        try {
            const savedPrefs = localStorage.getItem('dexPreferences');
            return savedPrefs ? JSON.parse(savedPrefs) : null;
        } catch (error) {
            return null;
        }
    });

    // Calculate filtered forms data based on current preferences
    const filteredFormsData = useMemo(() => {
        if (!dexPreferences) return formsData; // Show all forms if no preferences
        return getFilteredFormsData(formsData, dexPreferences);
    }, [dexPreferences]);

    // Calculate form options for favorites
    const FORM_POKEMON_OPTIONS = useMemo(() => {
        return filteredFormsData
            .filter((p) => FORM_TYPES_FOR_FAVORITES.includes(p.formType))
            .map((p) => {
                const formLabel = getFormDisplayName(p);
                const baseName = formatPokemonName(p.name);
                const name = formLabel ? `${baseName} (${formLabel})` : baseName;
                return {
                    name,
                    value: p.name,
                    image: p.sprites.front_default,
                    shinyImage: p.sprites.front_shiny,
                };
            });
    }, [filteredFormsData]);

    const POKEMON_OPTIONS = useMemo(() => {
        return [...BASE_POKEMON_OPTIONS, ...FORM_POKEMON_OPTIONS];
    }, [FORM_POKEMON_OPTIONS]);

    const [isEditing, setIsEditing] = useState(false);
    const [showGameModal, setShowGameModal] = useState(false);
    const [gameSlotIndex, setGameSlotIndex] = useState(null);
    const [showPokemonModal, setShowPokemonModal] = useState(false);
    const [pokemonSlotIndex, setPokemonSlotIndex] = useState(null);
    const [showTrainerModal, setShowTrainerModal] = useState(false);
    const formBeforeEditRef = useRef(null);
    const [likeCount, setLikeCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const [likeBurst, setLikeBurst] = useState(0);

    const [stats, setStats] = useState({
        shinies: 0,
        completion: 0,
        regularCaught: 0,
        regularCompletion: 0,
        shinyCaught: 0,
        shinyCompletion: 0,
        gamesPlayed: 0,
        topBall: null,
        topMark: null,
        topGame: null,
        allBalls: [],
        allMarks: [],
        allGames: [],
    });
    const [statPage, setStatPage] = useState({ games: 0, balls: 0, marks: 0 });
    const STAT_PAGE_SIZE = 8;
    const [recentAdded, setRecentAdded] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    // Tracks the order of items set by optimistic updates so that server refetches
    // don't overwrite the correct slot-1 item. Each element is { stableId, isShiny }.
    const optimisticOrderRef = useRef(null);

    const [form, setForm] = useState({
        bio: "",
        location: "",
        gender: "",
        profileTrainer: "",
        favoriteGames: ["", "", "", "", ""],
        favoritePokemon: ["", "", "", "", ""],
        favoritePokemonShiny: [false, false, false, false, false],
        switchFriendCode: ""
    });
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!loading && (!username || !email)) {
            navigate("/");
        }
    }, [loading, username, email, navigate]);

    // Listen for dex preference changes
    useEffect(() => {
        const handleDexPreferencesChanged = () => {
            try {
                const savedPrefs = localStorage.getItem('dexPreferences');
                if (savedPrefs) {
                    setDexPreferences(JSON.parse(savedPrefs));
                }
            } catch (error) {
                console.error('Failed to parse dex preferences:', error);
            }
        };

        window.addEventListener('dexPreferencesChanged', handleDexPreferencesChanged);
        return () => {
            window.removeEventListener('dexPreferencesChanged', handleDexPreferencesChanged);
        };
    }, []);

    useEffect(() => {
        setLoading('profile-data', true);
        profileAPI.getProfile()
            .then(data => {
                setForm(prev => ({
                    ...prev,
                    bio: data.bio && data.bio.length > 150 ? data.bio.substring(0, 150) : (data.bio ?? prev.bio),
                    location: data.location ?? prev.location,
                    gender: data.gender ?? prev.gender,
                    profileTrainer: data.profileTrainer ?? prev.profileTrainer,
                    favoriteGames: Array.isArray(data.favoriteGames) ? [...data.favoriteGames] : prev.favoriteGames,
                    favoritePokemon: Array.isArray(data.favoritePokemon) ? [...data.favoritePokemon] : prev.favoritePokemon,
                    favoritePokemonShiny: Array.isArray(data.favoritePokemonShiny) ? [...data.favoritePokemonShiny] : prev.favoritePokemonShiny,
                    switchFriendCode: data.switchFriendCode ?? prev.switchFriendCode
                }));
                setIsAdmin(data.isAdmin ?? false);

                // Don't call setUser here - it causes infinite loops with App.jsx checkAuth
                // The profileTrainer will be updated when the user actually edits their profile
            })
            .catch(err => {
                console.error("Failed to fetch profile:", err);
            })
            .finally(() => {
                setLoading('profile-data', false);
            });
    }, [setLoading]);

    useEffect(() => {
        let ignore = false;
        setLoading('profile-stats', true);

        async function loadStats() {
            try {
                const serverMap = await caughtAPI.getCaughtData();

                // The server save is async — newly toggled Pok\u00e9mon may not be persisted yet.
                // App.jsx always writes the optimistic state to localStorage before the server
                // responds, so we merge that cache over the server data to get the latest picture.
                let map = serverMap;
                try {
                    const raw = localStorage.getItem(`caughtInfoMap:${username}`);
                    if (raw) {
                        const localCache = JSON.parse(raw);
                        if (localCache && typeof localCache === 'object') {
                            // Local cache wins for any key it has, giving us instant updates
                            map = { ...serverMap, ...localCache };
                        }
                    }
                } catch {
                    // localStorage unavailable or parse error — use server data as-is
                }

                // Seed optimisticOrderRef from sessionStorage if it hasn't been set yet.
                // App.jsx writes to sessionStorage on every catch, so this survives Profile
                // being unmounted (e.g. user was on the dex page when they caught something).
                if (!optimisticOrderRef.current) {
                    try {
                        const stored = JSON.parse(sessionStorage.getItem('recentCatchOrder') || '[]');
                        if (stored.length > 0) {
                            optimisticOrderRef.current = stored;
                        }
                    } catch { /* sessionStorage unavailable */ }
                }

                // Count regular and shiny Pokémon separately
                const regularKeys = [
                    ...pokemonData.map(p => getCaughtKey(p, null, false)),
                    ...filteredFormsData.map(p => getCaughtKey(p, null, false)),
                ];
                const shinyKeys = [
                    ...pokemonData.map(p => getCaughtKey(p, null, true)),
                    ...filteredFormsData.map(p => getCaughtKey(p, null, true)),
                ];
                const totalRegular = regularKeys.length;
                const totalShiny = shinyKeys.length;

                const caughtInfos = Object.values(map).filter(Boolean);

                // Extract all entries from the new data structure
                const allEntries = [];
                caughtInfos.forEach(info => {
                    if (info.entries && Array.isArray(info.entries)) {
                        // New format: extract entries
                        info.entries.forEach(entry => {
                            if (entry && (entry.ball || entry.mark || entry.game || entry.method)) {
                                allEntries.push(entry);
                            }
                        });
                    } else if (info.ball || info.mark || info.game || info.method) {
                        // Old format: use the info directly
                        allEntries.push(info);
                    }
                });

                // Count regular and shiny Pokémon separately
                const regularCaught = regularKeys.filter(key => map[key]).length;
                const shinyCaught = shinyKeys.filter(key => map[key]).length;

                const regularCompletion = totalRegular ? Math.round((regularCaught / totalRegular) * 100) : 0;
                const shinyCompletion = totalShiny ? Math.round((shinyCaught / totalShiny) * 100) : 0;

                // For backward compatibility, keep the old stats structure
                const shinies = regularCaught; // This was actually regular Pokémon count
                const completion = regularCompletion;
                const gamesPlayed = new Set(allEntries.map(i => i.game).filter(Boolean)).size;

                const toTitle = (s) =>
                    String(s || "")
                        .replace(/[-_]/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase());

                const fromOptionsOrTitle = (opts, key, suffixIfMissing = "") => {
                    if (!key) return null;
                    const k = String(key).toLowerCase();
                    const hit = opts.find(
                        (o) =>
                            String(o.value).toLowerCase() === k ||
                            String(o.label ?? o.name ?? "").toLowerCase() === k
                    );
                    if (hit) return hit.label ?? hit.name ?? hit.value;
                    const t = toTitle(k);
                    return suffixIfMissing && !new RegExp(`${suffixIfMissing}$`, "i").test(t)
                        ? t + suffixIfMissing
                        : t;
                };

                const countAll = (list, key) => {
                    const counts = {};
                    for (const it of list) {
                        const v = String(it?.[key] ?? "").trim().toLowerCase();
                        if (!v || v === "none" || v === "unknown") continue;
                        counts[v] = (counts[v] || 0) + 1;
                    }
                    return Object.entries(counts)
                        .map(([k, count]) => ({ key: k, count }))
                        .sort((a, b) => b.count - a.count);
                };

                const rankedBalls = countAll(allEntries, "ball");
                const rankedMarks = countAll(allEntries, "mark");
                const rankedGames = countAll(allEntries, "game");

                const topBallKey = rankedBalls[0]?.key || null;
                const topMarkKey = rankedMarks[0]?.key || null;
                const topGameKey = rankedGames[0]?.key || null;

                const topBall = fromOptionsOrTitle(BALL_OPTIONS, topBallKey, " Ball");
                const topMark = fromOptionsOrTitle(MARK_OPTIONS, topMarkKey, " Mark");
                const topGame = fromOptionsOrTitle(GAME_OPTIONS_TWO, topGameKey);

                // Build full ranked lists with display names and images
                const buildRankedList = (ranked, options, suffix = "") => {
                    return ranked.map(({ key: k, count }) => {
                        const kLower = String(k).toLowerCase();
                        const hit = options.find(o =>
                            String(o.value).toLowerCase() === kLower ||
                            String(o.label ?? o.name ?? "").toLowerCase() === kLower
                        );
                        return {
                            key: k,
                            name: hit ? (hit.label ?? hit.name ?? hit.value) : toTitle(k) + suffix,
                            image: hit?.image || null,
                            count
                        };
                    });
                };

                const allBalls = buildRankedList(rankedBalls, BALL_OPTIONS, " Ball");
                const allMarks = buildRankedList(rankedMarks, MARK_OPTIONS, " Mark");
                const allGames = buildRankedList(rankedGames, GAME_OPTIONS_TWO);

                if (!ignore) setStats({
                    shinies,
                    completion,
                    regularCaught,
                    regularCompletion,
                    shinyCaught,
                    shinyCompletion,
                    gamesPlayed,
                    topBall,
                    topMark,
                    topGame,
                    allBalls,
                    allMarks,
                    allGames,
                });

                // Build recent 5 added list (newest by date first)
                try {
                    const allMonsList = [...pokemonData, ...filteredFormsData];
                    // Build a lookup map for both regular and shiny keys so shiny
                    // entries resolve correctly to their Pokémon data.
                    const keyToMon = new Map();
                    allMonsList.forEach(m => {
                        const regularKey = getCaughtKey(m, null, false);
                        const shinyKey = getCaughtKey(m, null, true);
                        if (regularKey) keyToMon.set(regularKey, m);
                        if (shinyKey) keyToMon.set(shinyKey, m);
                    });
                    // First, separate Pokemon with and without caughtAt timestamps
                    const withTimestamps = [];
                    const withoutTimestamps = [];

                    Object.entries(map).forEach(([key, info]) => {
                        if (!info) return;

                        // Check if this is a shiny Pokémon by looking for _shiny suffix in the key
                        const isShiny = key.includes('_shiny');

                        // Look up by the full key (map contains both regular and shiny keys)
                        const mon = keyToMon.get(key);
                        if (!mon) return;

                        // Add shiny status to the info object
                        const infoWithShiny = { ...info, isShiny };

                        let bestTimestamp = null;

                        // Parse helper
                        const getTs = (d) => {
                            if (!d) return null;
                            const t = new Date(d).getTime();
                            return isNaN(t) ? null : t;
                        };

                        if (info.entries && Array.isArray(info.entries)) {
                            info.entries.forEach(entry => {
                                if (entry) {
                                    const ts = getTs(entry.caughtAt) || getTs(entry.date);
                                    if (ts && (!bestTimestamp || ts > bestTimestamp)) {
                                        bestTimestamp = ts;
                                    }
                                }
                            });
                        }

                        // Also check root level, in case entries exist but don't have dates, or entries don't exist
                        const rootTs = getTs(info.caughtAt) || getTs(info.date);
                        if (rootTs && (!bestTimestamp || rootTs > bestTimestamp)) {
                            bestTimestamp = rootTs;
                        }

                        if (bestTimestamp) {
                            withTimestamps.push({ key, mon, info: infoWithShiny, ts: bestTimestamp });
                        } else {
                            withoutTimestamps.push({ key, mon, info: infoWithShiny });
                        }
                    });

                    // Sort Pokemon with timestamps by newest first
                    withTimestamps.sort((a, b) => b.ts - a.ts);

                    // Add fallback timestamps to Pokemon without caughtAt (older than any with timestamps)
                    // Reverse the order so the first Pokemon without timestamp gets the oldest fallback
                    const baseTime = withTimestamps.length > 0 ? withTimestamps[withTimestamps.length - 1].ts - 86400000 : Date.now();
                    withoutTimestamps.forEach((item, idx) => {
                        // Reverse the index so first Pokemon gets oldest timestamp
                        const reverseIdx = withoutTimestamps.length - 1 - idx;
                        item.ts = baseTime - (reverseIdx * 86400000);
                    });

                    // Combine and sort all Pokemon by timestamp
                    const allPokemon = [...withTimestamps, ...withoutTimestamps];
                    allPokemon.sort((a, b) => b.ts - a.ts);

                    const serverRecentList = allPokemon.slice(0, 5).map(({ mon, info }) => ({ mon, info }));

                    // If we have an optimistic order from a recent catch, re-apply it so the
                    // server fetch (which may be stale) doesn't overwrite the correct slot-1 item.
                    let recentList = serverRecentList;
                    if (optimisticOrderRef.current) {
                        const order = optimisticOrderRef.current;
                        // Build a map of stableId+isShiny -> item from the server list
                        const serverMap = new Map();
                        serverRecentList.forEach(item => {
                            const k = (item.mon?.stableId || '') + '|' + !!item.info?.isShiny;
                            serverMap.set(k, item);
                        });
                        // Rebuild in optimistic order, falling back to server items not in the order
                        const ordered = [];
                        order.forEach(({ stableId, isShiny }) => {
                            const k = stableId + '|' + isShiny;
                            if (serverMap.has(k)) {
                                ordered.push(serverMap.get(k));
                                serverMap.delete(k);
                            }
                        });
                        // Append any server items not covered by the optimistic order
                        serverMap.forEach(item => ordered.push(item));
                        recentList = ordered.slice(0, 5);
                    }

                    if (!ignore) {
                        setRecentAdded(recentList);
                    }
                } catch {
                    if (!ignore) setRecentAdded([]);
                }

            } catch (error) {
                console.error("Failed to load stats:", error);
            }
        }

        loadStats();
        return () => {
            ignore = true;
            setLoading('profile-stats', false);
        };
    }, [setLoading, username, refreshKey]); // Add refreshKey dependency to allow manual refresh

    useEffect(() => {
        if (!username) return;
        let ignore = false;
        (async () => {
            try {
                const { hasLiked: userHasLiked, likeCount: count } = await profileAPI.getProfileLikes(username);
                if (!ignore) {
                    setLikeCount(count);
                    setHasLiked(userHasLiked);
                }
            } catch (error) {
                console.error("Failed to load likes:", error);
            }
        })();
        return () => { ignore = true; };
    }, [username]);

    useEffect(() => {
        if (!username) return;

        const interval = setInterval(async () => {
            try {
                const { hasLiked: userHasLiked, likeCount: count } = await profileAPI.getProfileLikes(username);
                setLikeCount(prevCount => {
                    if (prevCount !== count) {
                        return count;
                    }
                    return prevCount;
                });
                setHasLiked(userHasLiked);
            } catch (error) {
                // Silently handle errors to avoid spam
            }
        }, 5000); // Reduced from 2 seconds to 5 seconds

        return () => clearInterval(interval);
    }, [username]);

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/u/${encodeURIComponent(username)}`;

        // Try modern clipboard API first (requires HTTPS or localhost)
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(url);
                showMessage("Share link copied", "success");
                return;
            } catch (err) {
                console.warn("Clipboard API failed, trying fallback:", err);
            }
        }

        // Fallback for HTTP or when clipboard API fails
        try {
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                showMessage("Share link copied", "success");
            } else {
                throw new Error("execCommand failed");
            }
        } catch (err) {
            console.error("Copy failed:", err);
            showMessage("Couldn't copy link", "error");
        }
    };

    const handleLike = async () => {
        if (likeLoading) return;
        setLikeLoading(true);

        const wasLiked = hasLiked;
        const previousCount = likeCount;

        setHasLiked(!wasLiked);
        setLikeCount(wasLiked ? previousCount - 1 : previousCount + 1);
        if (!wasLiked) {
            setLikeBurst((n) => n + 1);
        }

        try {
            const { hasLiked: liked, likeCount: newCount } = await profileAPI.toggleProfileLike(username);
            setHasLiked(liked);
            setLikeCount(newCount);
            showMessage(liked ? "Profile liked!" : "Like removed", "success");
        } catch (error) {
            setHasLiked(wasLiked);
            setLikeCount(previousCount);
            showMessage("Failed to update like", "error");
        } finally {
            setLikeLoading(false);
        }
    };

    const reorderToFront = (arr, fill = null) => {
        const cleaned = arr.filter((v) => v !== null && v !== undefined);
        return [...cleaned, ...Array(5 - cleaned.length).fill(fill)];
    };

    const reorderGames = (arr) => {
        const valid = arr.filter(v => v !== "" && v !== null && v !== undefined);
        const padded = [...valid, ...Array(5 - valid.length).fill("")];
        return padded.slice(0, 5);
    };

    const openPokemonModal = (index) => {
        setPokemonSlotIndex(index);
        setShowPokemonModal(true);
    };

    const updatePokemonAtIndex = (value, isShiny) => {
        const updatedPokemon = [...form.favoritePokemon];
        const updatedShiny = [...form.favoritePokemonShiny];

        while (updatedPokemon.length < 5) updatedPokemon.push("");
        while (updatedShiny.length < 5) updatedShiny.push(false);

        updatedPokemon[pokemonSlotIndex] = value;
        updatedShiny[pokemonSlotIndex] = isShiny;

        setForm({
            ...form,
            favoritePokemon: updatedPokemon,
            favoritePokemonShiny: updatedShiny,
        });

        setShowPokemonModal(false);
    };

    const openGameModal = (index) => {
        setGameSlotIndex(index);
        setShowGameModal(true);
    };

    const updateGameAtIndex = (value) => {
        const updated = [...form.favoriteGames];
        while (updated.length < 5) updated.push("");
        updated[gameSlotIndex] = value;
        setForm({ ...form, favoriteGames: updated });
        setShowGameModal(false);
    };

    const refreshRecentPokemon = () => {
        setRefreshKey(prev => prev + 1);
    };



    // Refresh recent Pokemon when the page becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                refreshRecentPokemon();
            }
        };

        const handleFocus = () => {
            refreshRecentPokemon();
        };

        // When a Pok\u00e9mon is caught from the dex, App.jsx fires 'caughtDataChanged' with the
        // full data in the event detail. We can immediately update recentAdded without waiting
        // for a server fetch (which would be stale due to async save timing).
        const handleCaughtDataChanged = (e) => {
            const { pokemon, caughtInfo, wasCaught, isShiny } = e?.detail || {};

            if (pokemon && caughtInfo && !wasCaught) {
                // Newly caught: prepend to recentAdded immediately
                setRecentAdded(prev => {
                    const newEntry = { mon: pokemon, info: { ...caughtInfo, isShiny: !!isShiny } };
                    // Remove any existing entry for the same Pokémon (same stableId), then prepend
                    const filtered = prev.filter(p => p.mon?.stableId !== pokemon.stableId || !!p.info?.isShiny !== !!isShiny);
                    const next = [newEntry, ...filtered].slice(0, 5);
                    // Record order so server refetches respect it
                    optimisticOrderRef.current = next.map(p => ({ stableId: p.mon?.stableId, isShiny: !!p.info?.isShiny }));
                    return next;
                });
            } else if (pokemon && wasCaught) {
                // Uncaught: remove from recentAdded
                setRecentAdded(prev => {
                    const next = prev.filter(p => !(p.mon?.stableId === pokemon.stableId && !!p.info?.isShiny === !!isShiny));
                    optimisticOrderRef.current = next.map(p => ({ stableId: p.mon?.stableId, isShiny: !!p.info?.isShiny }));
                    return next;
                });
            }
            // Note: no refreshRecentPokemon() here — that would re-fetch from the still-stale
            // server and immediately overwrite the correct optimistic order above.
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('caughtDataChanged', handleCaughtDataChanged);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('caughtDataChanged', handleCaughtDataChanged);
        };
    }, []);

    if (loading || !username || !email || isLoading('profile-data')) {
        return (
            <div className="profile-wrapper">
                <LoadingSpinner
                    fullScreen
                />
            </div>
        );
    }

    return (
        <div className="profile-wrapper page-container profile-page">
            <div className="profile-header-bar">
                <div className="profile-header-left">
                    <div className="profile-top-line">
                        <h1 className="profile-username">
                            <span>
                                {username}
                                {isAdmin && (
                                    <span className="crown-wrapper">
                                        <Crown
                                            size={22}
                                            strokeWidth={2.5}
                                            style={{
                                                color: "#fbbf24",
                                                flexShrink: 0
                                            }}
                                        />
                                        <span className="crown-tooltip">Admin</span>
                                    </span>
                                )}
                            </span>
                        </h1>
                        <button
                            className="profile-copy-link"
                            onClick={handleCopyLink}
                            aria-label="Copy shareable link"
                        >
                            <LinkIcon size={16} />
                            <span className="copy-tooltip">Copy shareable link</span>
                        </button>
                        <button
                            className={`profile-like-button ${hasLiked ? 'liked' : ''}`}
                            onClick={handleLike}
                            disabled={likeLoading}
                            title={hasLiked ? "Remove like" : "Like profile"}
                            aria-label={hasLiked ? "Remove like" : "Like profile"}
                        >
                            <span className="like-heart-anchor">
                                <Heart size={20} fill={hasLiked ? "currentColor" : "none"} />
                                {likeBurst > 0 && (
                                    <span key={likeBurst} aria-hidden="true">
                                        <span className="like-heart">❤</span>
                                        <span className="like-heart" style={{ "--tx": "-26px", "--ty": "-38px", "--rot": "-18deg" }}>❤</span>
                                        <span className="like-heart" style={{ "--tx": "22px", "--ty": "-44px", "--rot": "14deg" }}>❤</span>
                                    </span>
                                )}
                            </span>
                            <span className="like-count">{likeCount}</span>
                        </button>
                    </div>
                    <p className="profile-date">
                        {createdAt
                            ? `Joined ${new Date(createdAt).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                            })} (${getTimeAgo(createdAt)})`
                            : "Join date unknown"}
                    </p>
                </div>

                <div className="profile-header-right">
                    <div className="profile-actions">

                        <button
                            className={`profile-edit-btn ${isEditing ? "active" : ""}`}
                            disabled={isLoading('save-profile')}
                            onClick={async () => {
                                if (isEditing) {
                                    const fc = (form.switchFriendCode || "").toUpperCase().trim();

                                    if (fc && !SWITCH_FC_RE.test(fc)) {
                                        showMessage("Friend code must be like: SW-1234-5678-9012", "error");
                                        return;
                                    }

                                    const reorderedGames = reorderGames(form.favoriteGames);
                                    const reorderedPokemon = reorderToFront(form.favoritePokemon, "");
                                    const reorderedShiny = reorderToFront(form.favoritePokemonShiny, false);

                                    try {
                                        // Validate bio at save-time
                                        const bioValidation = validateContent(String(form.bio || ''), 'bio');
                                        if (!bioValidation.isValid) {
                                            showMessage(`${bioValidation.error}`, 'error');
                                            return;
                                        }
                                        setLoading('save-profile', true);
                                        await profileAPI.updateProfile({
                                            bio: form.bio,
                                            location: form.location,
                                            gender: form.gender,
                                            profileTrainer: form.profileTrainer,
                                            favoriteGames: reorderedGames,
                                            favoritePokemon: reorderedPokemon,
                                            favoritePokemonShiny: reorderedShiny,
                                            switchFriendCode: fc,
                                        });

                                        showMessage("Profile changes saved", "success");

                                        setForm((prev) => ({
                                            ...prev,
                                            favoriteGames: reorderedGames,
                                            favoritePokemon: reorderedPokemon,
                                            favoritePokemonShiny: reorderedShiny,
                                            profileTrainer: form.profileTrainer,
                                            switchFriendCode: fc,
                                        }));
                                        // setUser((prev) => ({ // This line was removed
                                        //     ...prev,
                                        //     profileTrainer: form.profileTrainer || prev.profileTrainer,
                                        // }));

                                        setIsEditing(false);
                                    } catch (err) {
                                        showMessage("Failed to update profile", "error");
                                    } finally {
                                        setLoading('save-profile', false);
                                    }

                                    return;
                                }

                                formBeforeEditRef.current = JSON.parse(JSON.stringify(form));
                                setIsEditing(true);
                            }}
                        >
                            <NotebookPen size={16} className="edit-icon" />
                            <span>{isEditing ? "Save" : "Edit"}</span>
                        </button>

                        {isEditing && (
                            <button
                                className="profile-cancel-btn"
                                onClick={() => {
                                    if (formBeforeEditRef.current) setForm(formBeforeEditRef.current);
                                    setIsEditing(false);
                                    showMessage("Changes discarded", "info");
                                }}
                            >
                                <SquareX size={16} />
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className={`profile-two-column ${isEditing ? "editing-mode" : ""}`}>
                <div className="profile-left">
                    <div className="profile-header-row">
                        <div className="profile-avatar-block" style={{ position: "relative" }}>
                            <div
                                className="profile-avatar"
                                onClick={() => isEditing && setShowTrainerModal(true)}
                                style={{ cursor: isEditing ? "pointer" : "default" }}
                            >
                                <img
                                    src={`/data/trainer_sprites/${form.profileTrainer || "ash.png"}`}
                                    alt="Trainer"
                                    className="profile-avatar-img"
                                />

                                {isEditing && (
                                    <PencilLine
                                        size={45}
                                        strokeWidth={2}
                                        className="edit-overlay-icon"
                                        style={{
                                            position: "absolute",
                                            top: "0px",
                                            right: "0px",
                                            background: "none",
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="profile-bio-block">
                            <div className="profile-field">
                                <label>Bio</label>
                                {isLoading('profile-data') ? (
                                    <SkeletonLoader type="text" lines={2} height="60px" />
                                ) : isEditing ? (
                                    <ContentFilterInput
                                        type="textarea"
                                        value={form.bio}
                                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                        configType="bio"
                                        showCharacterCount={true}
                                        showRealTimeValidation={true}
                                        placeholder="Tell us about yourself..."
                                        maxLength={250}
                                    />
                                ) : (
                                    <div className="field-display">
                                        {form.bio && form.bio.length > 150 ? `${form.bio.slice(0, 150)}…` : (form.bio || "N/A")}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="profile-row-split">
                        <div className="profile-field">
                            <label>Location</label>
                            {isEditing ? (
                                <SearchbarIconDropdown
                                    options={COUNTRY_OPTIONS.map(country => ({
                                        name: country.name,
                                        value: country.value,
                                        icon: <span className={`fi fi-${country.code.toLowerCase()}`} />
                                    }))}
                                    value={form.location}
                                    onChange={(value) => setForm({ ...form, location: value })}
                                    placeholder="Select location"
                                    hideClearButton
                                />
                            ) : (
                                <div className="field-display">
                                    {(() => {
                                        const selected = COUNTRY_OPTIONS.find(c => c.name === form.location);
                                        return selected ? (
                                            <>
                                                <span className={`fi fi-${selected.code.toLowerCase()}`} style={{ marginRight: "8px" }} />
                                                {selected.name}
                                            </>
                                        ) : (
                                            form.location || "N/A"
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        <div className="profile-field">
                            <label>Gender</label>
                            {isEditing ? (
                                <SearchbarIconDropdown
                                    options={[
                                        { name: "Male", value: "Male", icon: <Mars size={18} color="#4aaaff" /> },
                                        { name: "Female", value: "Female", icon: <Venus size={18} color="#ff6ec7" /> },
                                        { name: "Other", value: "Other", icon: <VenusAndMars size={18} color="#ffffff" /> },
                                    ]}
                                    value={form.gender}
                                    onChange={(value) => setForm({ ...form, gender: value })}
                                    placeholder="Select gender"
                                    hideClearButton
                                />
                            ) : (
                                <div className="field-display">
                                    {form.gender === "Male" && <Mars size={16} color="#4aaaff" style={{ marginRight: "6px" }} />}
                                    {form.gender === "Female" && <Venus size={16} color="#ff6ec7" style={{ marginRight: "6px" }} />}
                                    {form.gender === "Other" && <VenusAndMars size={16} color="#ffffff" style={{ marginRight: "6px" }} />}
                                    {form.gender === "Other" ? "Female" : (form.gender || "N/A")}
                                </div>
                            )}
                        </div>

                        <div className="profile-field full-span">
                            <label>Nintendo Switch Friend Code</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    placeholder="SW-1234-5678-9012"
                                    value={form.switchFriendCode}
                                    onChange={(e) =>
                                        setForm({ ...form, switchFriendCode: formatSwitchFCInput(e.target.value) })
                                    }
                                    onPaste={(e) => {
                                        e.preventDefault();
                                        const text = (e.clipboardData || window.clipboardData).getData("text");
                                        setForm({ ...form, switchFriendCode: formatSwitchFCInput(text) });
                                    }}
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={17}
                                    pattern="^SW-\d{4}-\d{4}-\d{4}$"
                                    title="Format: SW-1234-5678-9012"
                                />
                            ) : (
                                <div className="field-display">{form.switchFriendCode || "N/A"}</div>
                            )}
                        </div>
                    </div>

                    <div className="profile-ranking-group">
                        {isEditing || form.favoriteGames.some(g => g) ? (
                            <>
                                <h3>Favorite Games</h3>
                                <div className="profile-rank-row">
                                    {Array.from({ length: 5 }).map((_, index) => {
                                        const game = form.favoriteGames[index];
                                        const gameData = GAME_OPTIONS_TWO.find(g => g.value === game);
                                        const isEmpty = !gameData;

                                        return (
                                            <div
                                                key={index}
                                                className="profile-rank-item"
                                                onClick={() => isEditing && openGameModal(index)}
                                            >
                                                {index < 3 && !isEmpty && (
                                                    <div className={`trophy-icon trophy-${index + 1}`}>
                                                        <Trophy size={16} />
                                                    </div>
                                                )}

                                                {isEmpty ? (
                                                    isEditing ? (
                                                        <div className="empty-game-slot">
                                                            <PencilLine className="edit-icon" size={22} strokeWidth={2} />
                                                        </div>
                                                    ) : (
                                                        <div style={{ width: "96px", height: "96px" }} />
                                                    )
                                                ) : (
                                                    <div className="profile-game-box">
                                                        <img src={gameData.image} alt={gameData.name} className="game-img" />
                                                    </div>
                                                )}

                                                <div className="rank-label">{!isEmpty ? gameData.name : null}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : null}

                        {isEditing || form.favoritePokemon.some(p => p) ? (
                            <>
                                <h3>Favorite Pokémon</h3>
                                <div className="profile-rank-row">
                                    {Array.from({ length: 5 }).map((_, index) => {
                                        const poke = form.favoritePokemon[index];
                                        const data = POKEMON_OPTIONS.find(p => p.value === poke);
                                        const isEmpty = !data;

                                        return (
                                            <div
                                                key={index}
                                                className="profile-rank-item"
                                                onClick={() => isEditing && openPokemonModal(index)}
                                            >
                                                {index < 3 && !isEmpty && (
                                                    <div className={`trophy-icon trophy-${index + 1}`}>
                                                        <Trophy size={16} />
                                                    </div>
                                                )}

                                                {isEmpty ? (
                                                    isEditing ? (
                                                        <div className="empty-pokemon-slot">
                                                            <PencilLine className="edit-icon" size={22} strokeWidth={2} />
                                                        </div>
                                                    ) : (
                                                        <div style={{ width: "96px", height: "96px" }} />
                                                    )
                                                ) : (
                                                    <div className="profile-pokemon-box">
                                                        <img
                                                            src={
                                                                form.favoritePokemonShiny[index]
                                                                    ? data.shinyImage
                                                                    : data.image
                                                            }
                                                            alt={data.name}
                                                            className="pokemon-img"
                                                        />
                                                    </div>
                                                )}

                                                <div className="rank-label">
                                                    {data?.name ? formatPokemonName(data.value) : null}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>

                <div className="profile-divider" />

                <div className="profile-right">
                    <div className="profile-stats-grid">
                        <div className="profile-field">
                            <label>Regular Pokémon</label>
                            <div className="field-display">{stats.regularCaught || stats.shinies}</div>
                        </div>
                        <div className="profile-field">
                            <label>Regular Completion</label>
                            <div className="field-display">{stats.regularCompletion || stats.completion}%</div>
                        </div>
                        <div className="profile-field">
                            <label>Shiny Pokémon</label>
                            <div className="field-display">{stats.shinyCaught || 0}</div>
                        </div>
                        <div className="profile-field">
                            <label>Shiny Completion</label>
                            <div className="field-display">{stats.shinyCompletion || 0}%</div>
                        </div>
                        {/* --- Games Hunted In --- */}
                        <div className="profile-field full-span">
                            <div className="stat-section-header">
                                <label>Games Hunted In ({stats.gamesPlayed}/{GAME_OPTIONS_TWO.length})</label>
                                {stats.allGames && stats.allGames.length > STAT_PAGE_SIZE && (
                                    <div className="stat-page-controls">
                                        <button className="stat-page-btn" disabled={statPage.games === 0} onClick={() => setStatPage(p => ({ ...p, games: p.games - 1 }))}>
                                            <ChevronLeft size={14} />
                                        </button>
                                        <span className="stat-page-info">{statPage.games + 1}/{Math.ceil(stats.allGames.length / STAT_PAGE_SIZE)}</span>
                                        <button className="stat-page-btn" disabled={(statPage.games + 1) * STAT_PAGE_SIZE >= stats.allGames.length} onClick={() => setStatPage(p => ({ ...p, games: p.games + 1 }))}>
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className={`field-display stat-icon-row${(() => { const s = stats.allGames.slice(statPage.games * STAT_PAGE_SIZE, (statPage.games + 1) * STAT_PAGE_SIZE); return s.length === STAT_PAGE_SIZE ? ' stat-icon-row--full' : ''; })()}`}>
                                {stats.allGames && stats.allGames.length > 0 ? (
                                    stats.allGames.slice(statPage.games * STAT_PAGE_SIZE, (statPage.games + 1) * STAT_PAGE_SIZE).map((g, i) => (
                                        <div key={i} className="stat-icon-item" title={`${g.name}: ${g.count}`}>
                                            {g.image ? (
                                                <img src={g.image} alt={g.name} className="stat-icon-img" />
                                            ) : (
                                                <span className="stat-icon-text">{g.name}</span>
                                            )}
                                            <span className="stat-icon-count">{g.count}</span>
                                        </div>
                                    ))
                                ) : "—"}
                            </div>
                        </div>
                        {/* --- Poké Balls Used --- */}
                        <div className="profile-field full-span">
                            <div className="stat-section-header">
                                <label>Poké Balls Used ({stats.allBalls.length}/{BALL_OPTIONS.length - 1})</label>
                                {stats.allBalls && stats.allBalls.length > STAT_PAGE_SIZE && (
                                    <div className="stat-page-controls">
                                        <button className="stat-page-btn" disabled={statPage.balls === 0} onClick={() => setStatPage(p => ({ ...p, balls: p.balls - 1 }))}>
                                            <ChevronLeft size={14} />
                                        </button>
                                        <span className="stat-page-info">{statPage.balls + 1}/{Math.ceil(stats.allBalls.length / STAT_PAGE_SIZE)}</span>
                                        <button className="stat-page-btn" disabled={(statPage.balls + 1) * STAT_PAGE_SIZE >= stats.allBalls.length} onClick={() => setStatPage(p => ({ ...p, balls: p.balls + 1 }))}>
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className={`field-display stat-icon-row${(() => { const s = stats.allBalls.slice(statPage.balls * STAT_PAGE_SIZE, (statPage.balls + 1) * STAT_PAGE_SIZE); return s.length === STAT_PAGE_SIZE ? ' stat-icon-row--full' : ''; })()}`}>
                                {stats.allBalls && stats.allBalls.length > 0 ? (
                                    stats.allBalls.slice(statPage.balls * STAT_PAGE_SIZE, (statPage.balls + 1) * STAT_PAGE_SIZE).map((b, i) => (
                                        <div key={i} className="stat-icon-item" title={`${b.name}: ${b.count}`}>
                                            {b.image ? (
                                                <img src={b.image} alt={b.name} className="stat-icon-img" />
                                            ) : (
                                                <span className="stat-icon-text">{b.name}</span>
                                            )}
                                            <span className="stat-icon-count">{b.count}</span>
                                        </div>
                                    ))
                                ) : "—"}
                            </div>
                        </div>
                        {/* --- Marks Obtained --- */}
                        <div className="profile-field full-span">
                            <div className="stat-section-header">
                                <label>Marks Obtained ({stats.allMarks.length}/{MARK_OPTIONS.length - 1})</label>
                                {stats.allMarks && stats.allMarks.length > STAT_PAGE_SIZE && (
                                    <div className="stat-page-controls">
                                        <button className="stat-page-btn" disabled={statPage.marks === 0} onClick={() => setStatPage(p => ({ ...p, marks: p.marks - 1 }))}>
                                            <ChevronLeft size={14} />
                                        </button>
                                        <span className="stat-page-info">{statPage.marks + 1}/{Math.ceil(stats.allMarks.length / STAT_PAGE_SIZE)}</span>
                                        <button className="stat-page-btn" disabled={(statPage.marks + 1) * STAT_PAGE_SIZE >= stats.allMarks.length} onClick={() => setStatPage(p => ({ ...p, marks: p.marks + 1 }))}>
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className={`field-display stat-icon-row${(() => { const s = stats.allMarks.slice(statPage.marks * STAT_PAGE_SIZE, (statPage.marks + 1) * STAT_PAGE_SIZE); return s.length === STAT_PAGE_SIZE ? ' stat-icon-row--full' : ''; })()}`}>
                                {stats.allMarks && stats.allMarks.length > 0 ? (
                                    stats.allMarks.slice(statPage.marks * STAT_PAGE_SIZE, (statPage.marks + 1) * STAT_PAGE_SIZE).map((m, i) => (
                                        <div key={i} className="stat-icon-item" title={`${m.name}: ${m.count}`}>
                                            {m.image ? (
                                                <img src={m.image} alt={m.name} className="stat-icon-img" />
                                            ) : (
                                                <span className="stat-icon-text">{m.name}</span>
                                            )}
                                            <span className="stat-icon-count">{m.count}</span>
                                        </div>
                                    ))
                                ) : "—"}
                            </div>
                        </div>
                        <div className="profile-field full-span recent-field">
                            <label>Recent Entries</label>
                            <div className="field-display recent-field-box">
                                {recentAdded.length === 0 ? (
                                    <div className="no-recent-pokemon">
                                        <p>No recent entries yet</p>
                                    </div>
                                ) : (
                                    <div className="profile-rank-row recent-pokemon-row">
                                        {recentAdded.map((pokemon, idx) => {
                                            const { mon, info } = pokemon;
                                            const isNewest = idx === 0;
                                            const isShiny = info?.isShiny;

                                            return (
                                                <div key={idx} className={`profile-rank-item recent-pokemon-item ${isNewest ? 'newest' : ''}`}>
                                                    {isNewest && (
                                                        <div className="newest-badge">LATEST</div>
                                                    )}
                                                    <div className="profile-pokemon-box recent-pokemon-box">
                                                        <img
                                                            src={isShiny ? mon?.sprites?.front_shiny : mon?.sprites?.front_default}
                                                            alt={formatPokemonName(mon?.name)}
                                                            className="pokemon-img"
                                                        />
                                                        {isShiny && (
                                                            <div className="shiny-indicator">
                                                                <Sparkles size={20} className="shiny-sparkles-icon" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="rank-label recent-pokemon-name" data-order={idx + 1}>
                                                        {formatPokemonName(mon?.name)}
                                                        {mon?.formType && !['alcremie', 'other', 'unown'].includes(mon.formType.toLowerCase()) && (
                                                            <div className="form-type-tag">
                                                                {mon.formType.charAt(0).toUpperCase() + mon.formType.slice(1)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <FavoriteSelectionModal
                isOpen={showGameModal}
                onClose={() => setShowGameModal(false)}
                title="Select a Favorite Game"
                options={GAME_OPTIONS_TWO}
                selected={form.favoriteGames[gameSlotIndex] ? [form.favoriteGames[gameSlotIndex]] : []}
                onChange={(val) => updateGameAtIndex(val[0])}
                max={1}
            />
            <FavoriteSelectionModal
                isOpen={showPokemonModal}
                onClose={() => setShowPokemonModal(false)}
                title="Select a Favorite Pokémon"
                options={POKEMON_OPTIONS}
                selected={form.favoritePokemon[pokemonSlotIndex] ? [form.favoritePokemon[pokemonSlotIndex]] : []}
                onChange={(val) => updatePokemonAtIndex(val.value, val.isShiny)}
                max={1}
            />
            <FavoriteSelectionModal
                isOpen={showTrainerModal}
                onClose={() => setShowTrainerModal(false)}
                title="Choose a Trainer"
                options={trainerOptions.map(t => ({
                    name: t.name,
                    value: t.filename,
                    image: `/data/trainer_sprites/${t.filename}`,
                }))}
                selected={form.profileTrainer ? [form.profileTrainer] : []}
                onChange={(val) => {
                    setForm({ ...form, profileTrainer: val[0] });
                    setShowTrainerModal(false);
                }}
                max={1}
                showHoverPreview
            />
        </div>
    );
}
