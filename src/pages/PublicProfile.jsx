import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../css/Profile.css";
import { Mars, Venus, VenusAndMars, Trophy, ArrowBigLeft, Link as LinkIcon, Heart } from "lucide-react";
import { GAME_OPTIONS_TWO, BALL_OPTIONS, MARK_OPTIONS } from "../Constants";
import pokemonData from "../data/pokemon.json";
import formsData from "../data/forms.json";
import { formatPokemonName } from "../utils";
import { getCaughtKey } from "../caughtStorage";
import { COUNTRY_OPTIONS } from "../data/countries";
import { LoadingSpinner, SkeletonLoader } from "../components/Shared";
import { useMessage } from "../components/Shared";

const POKEMON_OPTIONS = pokemonData.map((p) => ({
    name: formatPokemonName(p.name),
    value: p.name,
    image: p.sprites.front_default,
    shinyImage: p.sprites.front_shiny,
}));

// Turn "US" -> 🇺🇸  (works for any 2-letter ISO code)
const flagFromISO = (cc) =>
    cc && cc.length === 2
        ? String.fromCodePoint(...cc.toUpperCase().split("").map(c => 127397 + c.charCodeAt(0)))
        : null;

// Try to pull an ISO code out of the saved location string.
// Supports "US", "US - Texas", "Toronto, CA", "Canada (CA)" etc.
const guessISOFromLocation = (loc) => {
    const s = String(loc || "");
    const m = s.match(/\b([A-Z]{2})\b/); // first 2-letter word
    return m ? m[1] : null;
};


function getTimeAgo(dateString) {
    const now = new Date();
    const joined = new Date(dateString);
    const diff = now - joined;
    const s = Math.floor(diff / 1000);
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    const mo = Math.floor(d / 30.44);
    const y = Math.floor(d / 365.25);
    if (y >= 1) return `${y} year${y > 1 ? "s" : ""} ago`;
    if (mo >= 1) return `${mo} month${mo > 1 ? "s" : ""} ago`;
    if (d >= 1) return `${d} day${d > 1 ? "s" : ""} ago`;
    if (h >= 1) return `${h} hour${h > 1 ? "s" : ""} ago`;
    if (m >= 1) return `${m} minute${m > 1 ? "s" : ""} ago`;
    return `${s} second${s > 1 ? "s" : ""} ago`;
}

const toTitle = (s) => String(s || "").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const fromOptionsOrTitle = (opts, key, suffixIfMissing = "") => {
    if (!key) return null;
    const k = String(key).toLowerCase();
    const hit = opts.find(o =>
        String(o.value).toLowerCase() === k ||
        String(o.label ?? o.name ?? "").toLowerCase() === k
    );
    if (hit) return hit.label ?? hit.name ?? hit.value;
    const t = toTitle(k);
    return suffixIfMissing && !new RegExp(`${suffixIfMissing}$`, "i").test(t) ? t + suffixIfMissing : t;
};
const countTop = (list, key) => {
    const counts = {};
    for (const it of list) {
        const v = String(it?.[key] ?? "").trim().toLowerCase();
        if (!v || v === "none" || v === "unknown") continue;
        counts[v] = (counts[v] || 0) + 1;
    }
    let top = null, topCount = 0;
    for (const [k, c] of Object.entries(counts)) if (c > topCount) { top = k; topCount = c; }
    return top;
};

export default function PublicProfile() {
    const { username } = useParams();
    const [data, setData] = useState(null);
    const [stats, setStats] = useState({ shinies: 0, completion: 0, gamesPlayed: 0, topBall: null, topMark: null, topGame: null });
    const [loading, setLoading] = useState(true);
    const [likeCount, setLikeCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const { showMessage } = useMessage();

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
        
        // Optimistically update the UI immediately for better user experience
        const wasLiked = hasLiked;
        const previousCount = likeCount;
        
        setHasLiked(!wasLiked);
        setLikeCount(wasLiked ? previousCount - 1 : previousCount + 1);
        
        try {
            const response = await fetch(`/api/profiles/${encodeURIComponent(username)}/like`, {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                const { liked, newCount } = await response.json();
                // Update with the actual server response
                setHasLiked(liked);
                setLikeCount(newCount);
                showMessage(liked ? "❤️ Profile liked!" : "💔 Like removed", "success");
            } else {
                // Revert optimistic update on error
                setHasLiked(wasLiked);
                setLikeCount(previousCount);
                showMessage("❌ Failed to update like", "error");
            }
        } catch (error) {
            // Revert optimistic update on error
            setHasLiked(wasLiked);
            setLikeCount(previousCount);
            showMessage("❌ Failed to update like", "error");
        } finally {
            setLikeLoading(false);
        }
    };



    // Load public profile
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const r = await fetch(`/api/users/${encodeURIComponent(username)}/public`, { credentials: "include" });
                if (!r.ok) throw new Error();
                const j = await r.json();
                if (!ignore) {
                    setData(j);
                }
            } catch {
                if (!ignore) setData(null);
            } finally { if (!ignore) setLoading(false); }
        })();
        return () => { ignore = true; };
    }, [username]);

    // Load public caught stats (so right column matches owner page)
    useEffect(() => {
        if (!username) return;
        let ignore = false;
        (async () => {
            try {
                const r = await fetch(`/api/caught/${encodeURIComponent(username)}/public`, { credentials: "include" });
                if (!r.ok) return;
                const map = await r.json(); // { [key]: info|null }
                const allKeys = [
                    ...pokemonData.map(p => getCaughtKey(p)),
                    ...formsData.map(p => getCaughtKey(p)),
                ];
                const total = allKeys.length;
                const caughtInfos = Object.values(map).filter(Boolean);
                const shinies = caughtInfos.length;
                const completion = total ? Math.round((shinies / total) * 100) : 0;
                const gamesPlayed = new Set(caughtInfos.map(i => i.game).filter(Boolean)).size;

                const topBallKey = countTop(caughtInfos, "ball");
                const topMarkKey = countTop(caughtInfos, "mark");
                const topGameKey = countTop(caughtInfos, "game");
                const topBall = fromOptionsOrTitle(BALL_OPTIONS, topBallKey, " Ball");
                const topMark = fromOptionsOrTitle(MARK_OPTIONS, topMarkKey, " Mark");
                const topGame = fromOptionsOrTitle(GAME_OPTIONS_TWO, topGameKey) ? "Pokemon " + fromOptionsOrTitle(GAME_OPTIONS_TWO, topGameKey) : null;

                if (!ignore) setStats({ shinies, completion, gamesPlayed, topBall, topMark, topGame });
            } catch { }
        })();
        return () => { ignore = true; };
    }, [username]);

    // Load like data
    useEffect(() => {
        if (!username) return;
        let ignore = false;
        (async () => {
            try {
                const r = await fetch(`/api/profiles/${encodeURIComponent(username)}/likes`, { credentials: "include" });
                if (r.ok) {
                    const { count, hasLiked: userHasLiked } = await r.json();
                    if (!ignore) {
                        setLikeCount(count);
                        setHasLiked(userHasLiked);
                    }
                }
            } catch { }
        })();
        return () => { ignore = true; };
    }, [username]);

    // Set initial like count from profile data
    useEffect(() => {
        if (data && typeof data.likeCount === 'number') {
            setLikeCount(data.likeCount);
        }
    }, [data]);

    // Poll for like updates every 2 seconds to keep like count real-time
    useEffect(() => {
        if (!username) return;
        
        const interval = setInterval(async () => {
            try {
                console.log(`[${new Date().toLocaleTimeString()}] Polling for like updates for ${username}`);
                const r = await fetch(`/api/profiles/${encodeURIComponent(username)}/likes`, { 
                    credentials: "include" 
                });
                if (r.ok) {
                    const { count, hasLiked: userHasLiked } = await r.json();
                    console.log(`[${new Date().toLocaleTimeString()}] Like data received: count=${count}, hasLiked=${userHasLiked}`);
                    setLikeCount(prevCount => {
                        // Only update if the count actually changed
                        if (prevCount !== count) {
                            console.log(`[${new Date().toLocaleTimeString()}] Like count updated: ${prevCount} -> ${count}`);
                            return count;
                        }
                        return prevCount;
                    });
                    setHasLiked(userHasLiked);
                }
            } catch (error) {
                console.error('Error polling for likes:', error);
            }
        }, 2000); // Check every 2 seconds

        return () => clearInterval(interval);
    }, [username]);



    if (loading) return (
        <div className="profile-wrapper">
            <div className="profile-header-bar">
                <div className="profile-header-left">
                    <SkeletonLoader type="text" width="200px" height="2em" />
                    <SkeletonLoader type="text" width="300px" height="1.2em" />
                </div>
                <div className="profile-header-right">
                    <SkeletonLoader type="button" width="100px" height="40px" />
                </div>
            </div>
            <div className="profile-two-column">
                <div className="profile-left">
                    <div className="profile-header-row">
                        <SkeletonLoader type="avatar" width="120px" height="120px" />
                        <div className="profile-bio-block">
                            <SkeletonLoader type="text" lines={2} height="60px" />
                        </div>
                    </div>
                    <div className="profile-row-split">
                        <SkeletonLoader type="text" width="150px" height="1.5em" />
                        <SkeletonLoader type="text" width="150px" height="1.5em" />
                    </div>
                    <SkeletonLoader type="text" width="100%" height="1.5em" />
                </div>
                <div className="profile-divider" />
                <div className="profile-right">
                    <div className="profile-stats-grid">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <SkeletonLoader key={i} type="text" width="100%" height="2em" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
    if (!data) {
        return (
            <div className="profile-wrapper">
                <div style={{ 
                    maxWidth: '1300px', 
                    width: '100%', 
                    margin: '0 auto', 
                    padding: '16px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    minHeight: '50vh',
                    justifyContent: 'center'
                }}>
                    <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--text)' }}>User not found or private</h1>
                    <Link to="/trainers" className="profile-edit-btn" style={{ textDecoration: 'none' }}>
                        ← Back to Trainers
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-wrapper">
            {/* ===== header bar (same layout, no edit buttons) ===== */}
            <div className="profile-header-bar">
                <div className="profile-header-left">
                    <div className="profile-top-line">
                        <h1 className="profile-username">{data.username}</h1>
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
                            <Heart size={16} fill={hasLiked ? "currentColor" : "none"} />
                            <span className="like-count">{likeCount}</span>
                        </button>

                    </div>
                    <p className="profile-date">
                        {data.createdAt
                            ? `Joined ${new Date(data.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} (${getTimeAgo(data.createdAt)})`
                            : "Join date unknown"}
                    </p>
                </div>

                <div className="profile-header-right">
                    <Link to="/trainers" className="profile-edit-btn">
                        <ArrowBigLeft size={18} />
                        Back
                    </Link>
                </div>
            </div>

            <div className="profile-two-column">
                {/* ===== left column ===== */}
                <div className="profile-left">
                    <div className="profile-header-row">
                        <div className="profile-avatar-block">
                            <div className="profile-avatar" style={{ cursor: "default" }}>
                                <img
                                    src={`/data/trainer_sprites/${data.profileTrainer || "ash.png"}`}
                                    alt="Trainer"
                                    className="profile-avatar-img"
                                />
                            </div>
                        </div>

                        <div className="profile-bio-block">
                            <div className="profile-field">
                                <label>Bio</label>
                                <div className="field-display">{data.bio || "N/A"}</div>
                            </div>
                        </div>
                    </div>

                    <div className="profile-row-split">
                        <div className="profile-field">
                            <label>Location</label>
                            <div className="field-display">
                                {(() => {
                                    const selected = COUNTRY_OPTIONS.find(
                                        c => c.name === data.location || c.value === data.location
                                    );
                                    return selected ? (
                                        <>
                                            <span className={`fi fi-${selected.code.toLowerCase()}`} style={{ marginRight: 8 }} />
                                            {selected.name}
                                        </>
                                    ) : (data.location || "—");
                                })()}
                            </div>

                        </div>

                        <div className="profile-field">
                            <label>Gender</label>
                            <div className="field-display">
                                {data.gender === "Male" && <Mars size={16} color="#4aaaff" style={{ marginRight: 6 }} />}
                                {data.gender === "Female" && <Venus size={16} color="#ff6ec7" style={{ marginRight: 6 }} />}
                                {data.gender === "Other" && <VenusAndMars size={16} color="#ffffff" style={{ marginRight: 6 }} />}
                                {data.gender || "N/A"}
                            </div>
                        </div>
                    </div>

                    <div className="profile-field full-span">
                        <label>Nintendo Switch Friend Code</label>
                        <div className="field-display">{data.switchFriendCode || "N/A"}</div>
                    </div>

                    {/* Favorite Games */}
                    <div className="profile-ranking-group">
                        {Array.isArray(data.favoriteGames) && data.favoriteGames.some(Boolean) && (
                            <>
                                <h3>Favorite Games</h3>
                                <div className="profile-rank-row">
                                    {Array.from({ length: 5 }).map((_, index) => {
                                        const game = data.favoriteGames[index];
                                        const gameKey = String(game || "").toLowerCase();
                                        const gameData = GAME_OPTIONS_TWO.find(
                                            g =>
                                                String(g.value).toLowerCase() === gameKey ||
                                                String(g.name || g.label || "").toLowerCase() === gameKey
                                        );
                                        const isEmpty = !gameData;
                                        return (
                                            <div key={index} className="profile-rank-item">
                                                {index < 3 && !isEmpty && (
                                                    <div className={`trophy-icon trophy-${index + 1}`}><Trophy size={16} /></div>
                                                )}
                                                {isEmpty ? (
                                                    <div style={{ width: 96, height: 96 }} />
                                                ) : (
                                                    <div className="profile-game-box">
                                                        <img
                                                            src={gameData?.image?.startsWith("/") ? gameData.image : `/${gameData.image}`}
                                                            alt={gameData?.name || ""} className="game-img"
                                                        />
                                                    </div>
                                                )}
                                                <div className="rank-label">{!isEmpty ? gameData.name : null}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* Favorite Pokémon */}
                        {Array.isArray(data.favoritePokemon) && data.favoritePokemon.some(Boolean) && (
                            <>
                                <h3>Favorite Pokémon</h3>
                                <div className="profile-rank-row">
                                    {Array.from({ length: 5 }).map((_, index) => {
                                        const poke = data.favoritePokemon[index];
                                        const shiny = Array.isArray(data.favoritePokemonShiny) ? data.favoritePokemonShiny[index] : false;
                                        const p = POKEMON_OPTIONS.find(x => x.value === poke);
                                        const isEmpty = !p;
                                        return (
                                            <div key={index} className="profile-rank-item">
                                                {index < 3 && !isEmpty && (
                                                    <div className={`trophy-icon trophy-${index + 1}`}><Trophy size={16} /></div>
                                                )}
                                                {isEmpty ? (
                                                    <div style={{ width: 96, height: 96 }} />
                                                ) : (
                                                    <div className="profile-pokemon-box">
                                                        <img
                                                            src={shiny ? p.shinyImage : p.image}
                                                            alt={p.name}
                                                            className="pokemon-img"
                                                        />
                                                    </div>
                                                )}
                                                <div className="rank-label">{p?.name ? formatPokemonName(p.value) : null}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="profile-divider" />

                {/* ===== right column (stats) ===== */}
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
                            <div className="field-display">{stats.topBall || "—"}</div>
                        </div>
                        <div className="profile-field">
                            <label>Top Mark</label>
                            <div className="field-display">{stats.topMark || "—"}</div>
                        </div>
                        <div className="profile-field">
                            <label>Top Game</label>
                            <div className="field-display">{stats.topGame || "—"}</div>
                        </div>
                        {/* Full Dex button - standalone, full width */}
                        <div className="profile-full-dex-button">
                            <Link
                                to={`/u/${encodeURIComponent(username)}/dex`}
                                className="profile-full-dex-link"
                            >
                                View Full Dex
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
