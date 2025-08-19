import { useState, useEffect, useRef } from "react";
import { useUser } from "../components/Shared/UserContext";
import "../css/Profile.css";
import { NotebookPen, Trophy, Mars, Venus, VenusAndMars, PencilLine, SquareX, Link as LinkIcon, Heart } from "lucide-react";
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
import formsData from "../data/forms.json";
import { getCaughtKey } from "../caughtStorage";
import { useLoading } from "../components/Shared/LoadingContext";
import { LoadingSpinner, SkeletonLoader } from "../components/Shared";
import ContentFilterInput from "../components/Shared/ContentFilterInput";
import { validateContent } from "../../shared/contentFilter";
import { profileAPI, caughtAPI } from "../utils/api";

const FORM_TYPES_FOR_FAVORITES = [
    "alolan",
    "galarian",
    "gmax",
    "hisuian",
    "paldean",
    "unown",
    "other",
    "alcremie",
];

const BASE_POKEMON_OPTIONS = pokemonData.map((p) => ({
    name: formatPokemonName(p.name),
    value: p.name,
    image: p.sprites.front_default,
    shinyImage: p.sprites.front_shiny,
}));

const FORM_POKEMON_OPTIONS = formsData
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

const POKEMON_OPTIONS = [...BASE_POKEMON_OPTIONS, ...FORM_POKEMON_OPTIONS];

function getTimeAgo(dateString) {
    const now = new Date();
    const joined = new Date(dateString);
    const diff = now - joined;

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
    return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
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
        gamesPlayed: 0,
        topBall: null,
        topMark: null,
        topGame: null,
    });
    const [recentAdded, setRecentAdded] = useState([]);

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

    useEffect(() => {
        if (!loading && (!username || !email)) {
            navigate("/");
        }
    }, [loading, username, email, navigate]);

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
                const map = await caughtAPI.getCaughtData();

                const allKeys = [
                    ...pokemonData.map(p => getCaughtKey(p)),
                    ...formsData.map(p => getCaughtKey(p)),
                ];
                const total = allKeys.length;

                const caughtInfos = Object.values(map).filter(Boolean);
                const shinies = caughtInfos.length;
                const completion = total ? Math.round((shinies / total) * 100) : 0;
                const gamesPlayed = new Set(caughtInfos.map(i => i.game).filter(Boolean)).size;

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

                const countTop = (list, key) => {
                    const counts = {};
                    for (const it of list) {
                        const v = String(it?.[key] ?? "").trim().toLowerCase();
                        if (!v || v === "none" || v === "unknown") continue;
                        counts[v] = (counts[v] || 0) + 1;
                    }
                    let top = null, topCount = 0;
                    for (const [k, c] of Object.entries(counts)) {
                        if (c > topCount) { top = k; topCount = c; }
                    }
                    return top;
                };

                const topBallKey = countTop(caughtInfos, "ball");
                const topMarkKey = countTop(caughtInfos, "mark");
                const topGameKey = countTop(caughtInfos, "game");

                const topBall = fromOptionsOrTitle(BALL_OPTIONS, topBallKey, " Ball");
                const topMark = fromOptionsOrTitle(MARK_OPTIONS, topMarkKey, " Mark");
                const topGame = fromOptionsOrTitle(GAME_OPTIONS_TWO, topGameKey) ? "Pokemon " + fromOptionsOrTitle(GAME_OPTIONS_TWO, topGameKey) : null;

                if (!ignore) setStats({ shinies, completion, gamesPlayed, topBall, topMark, topGame });

                // Build recent 5 added list (newest by date first)
                try {
                    const allMonsList = [...pokemonData, ...formsData];
                    const keyToMon = new Map(allMonsList.map(m => [getCaughtKey(m), m]));
                    const recentList = Object.entries(map)
                        .filter(([_, info]) => !!info)
                        .map(([key, info]) => {
                            const mon = keyToMon.get(key);
                            const ts = info && info.date ? Date.parse(info.date) : Number.NEGATIVE_INFINITY;
                            return { key, mon, info, ts };
                        })
                        .filter(item => !!item.mon)
                        .sort((a, b) => b.ts - a.ts)
                        .slice(0, 5)
                        .map(({ mon, info }) => ({ mon, info }));
                    if (!ignore) setRecentAdded(recentList);
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
    }, [setLoading]);

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
        try {
            await navigator.clipboard.writeText(url);
            showMessage("🔗 Share link copied", "success");
        } catch {
            showMessage("❌ Couldn't copy link", "error");
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
            showMessage(liked ? "❤️ Profile liked!" : "💔 Like removed", "success");
        } catch (error) {
            setHasLiked(wasLiked);
            setLikeCount(previousCount);
            showMessage("❌ Failed to update like", "error");
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

    if (loading || !username || !email || isLoading('profile-data')) {
        return (
            <div className="profile-wrapper">
                <LoadingSpinner 
                    fullScreen 
                    text="Loading your profile..." 
                    variant="dots"
                    size="large"
                />
            </div>
        );
    }

    return (
        <div className="profile-wrapper page-container profile-page">
            <div className="profile-header-bar">
                <div className="profile-header-left">
                    <div className="profile-top-line">
                        <h1 className="profile-username">{username}</h1>
                        <button
                            className="profile-copy-link"
                            onClick={handleCopyLink}
                            title="Copy shareable link"
                            aria-label="Copy shareable link"
                        >
                            <LinkIcon size={16} />
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
                                        <span className="like-heart" style={{"--tx":"-26px","--ty":"-38px","--rot":"-18deg"}}>❤</span>
                                        <span className="like-heart" style={{"--tx":"22px","--ty":"-44px","--rot":"14deg"}}>❤</span>
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
                                        showMessage("❌ Friend code must be like: SW-1234-5678-9012", "error");
                                        return;
                                    }

                                    const reorderedGames = reorderGames(form.favoriteGames);
                                    const reorderedPokemon = reorderToFront(form.favoritePokemon, "");
                                    const reorderedShiny = reorderToFront(form.favoritePokemonShiny, false);

                                    try {
                                        // Validate bio at save-time
                                        const bioValidation = validateContent(String(form.bio || ''), 'bio');
                                        if (!bioValidation.isValid) {
                                            showMessage(`❌ ${bioValidation.error}`, 'error');
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

                                        showMessage("✅ Profile changes saved", "success");

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
                                        showMessage("❌ Failed to update profile", "error");
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
                                <IconDropdown
                                    options={COUNTRY_OPTIONS.map(country => ({
                                        name: country.name,
                                        value: country.value,
                                        icon: <span className={`fi fi-${country.code.toLowerCase()}`} />
                                    }))}
                                    value={form.location}
                                    onChange={(value) => setForm({ ...form, location: value })}
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
                                <IconDropdown
                                    options={[
                                        { name: "Male", value: "Male", icon: <Mars size={18} color="#4aaaff" /> },
                                        { name: "Female", value: "Female", icon: <Venus size={18} color="#ff6ec7" /> },
                                        { name: "Other", value: "Other", icon: <VenusAndMars size={18} color="#ffffff" /> },
                                    ]}
                                    value={form.gender}
                                    onChange={(value) => setForm({ ...form, gender: value })}
                                />
                            ) : (
                                <div className="field-display">
                                    {form.gender === "Male" && <Mars size={16} color="#4aaaff" style={{ marginRight: "6px" }} />}
                                    {form.gender === "Female" && <Venus size={16} color="#ff6ec7" style={{ marginRight: "6px" }} />}
                                    {form.gender === "Other" && <VenusAndMars size={16} color="#ffffff" style={{ marginRight: "6px" }} />}
                                    {form.gender || "N/A"}
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
                            <label>Total Shinies</label>
                            <div className="field-display">{stats.shinies}</div>
                        </div>
                        <div className="profile-field">
                            <label>Living Dex Completion</label>
                            <div className="field-display">{stats.completion}%</div>
                        </div>
                        <div className="profile-field">
                            <label>Games Hunted In</label>
                            <div className="field-display">{stats.gamesPlayed}</div>
                        </div>
                        <div className="profile-field">
                            <label>Most Used Ball</label>
                            <div className="field-display">{stats.topBall ? stats.topBall : "—"}</div>
                        </div>
                        <div className="profile-field">
                            <label>Top Mark</label>
                            <div className="field-display">{stats.topMark ? stats.topMark : "—"}</div>
                        </div>
                        <div className="profile-field">
                            <label>Top Game</label>
                            <div className="field-display">{stats.topGame ? stats.topGame : "—"}</div>
                        </div>
                        <div className="profile-field full-span recent-field">
                            <label>Recent Pokémon</label>
                            <div className="field-display recent-field-box">
                                <div className="profile-rank-row">
                                    {recentAdded && recentAdded.length > 0 ? (
                                        recentAdded.map(({ mon, info }, idx) => (
                                            <div key={idx} className="profile-rank-item">
                                                <div className="profile-pokemon-box" style={{ marginBottom: "2px" }}>
                                                    <img
                                                        src={mon?.sprites?.front_default}
                                                        alt={formatPokemonName(mon?.name)}
                                                        className="pokemon-img"
                                                    />
                                                </div>
                                                <div className="rank-label">{formatPokemonName(mon?.name)}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ opacity: 0.7 }}>No recent additions yet</div>
                                    )}
                                </div>
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
