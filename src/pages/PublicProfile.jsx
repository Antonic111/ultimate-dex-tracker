import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
// import "../css/Profile.css"; // Moved to backup folder
import { Mars, Venus, VenusAndMars, Trophy, ArrowBigLeft, Link as LinkIcon, Heart, Sparkles, Crown } from "lucide-react";
import { GAME_OPTIONS_TWO, BALL_OPTIONS, MARK_OPTIONS } from "../Constants";
import pokemonData from "../data/pokemon.json";
import formsData from "../data/forms.json";
import { formatPokemonName } from "../utils";
import { getCaughtKey } from "../caughtStorage";
import { COUNTRY_OPTIONS } from "../data/countries";
import { LoadingSpinner, SkeletonLoader } from "../components/Shared";
import { useMessage } from "../components/Shared";
import { profileAPI } from "../utils/api";
import { UserContext } from "../components/Shared/UserContext";


const POKEMON_OPTIONS = pokemonData.map((p) => ({
    name: formatPokemonName(p.name),
    value: p.name,
    image: p.sprites.front_default,
    shinyImage: p.sprites.front_shiny,
}));

// Create a comprehensive Pokémon lookup that includes forms
const createPokemonLookup = () => {
    const lookup = new Map();
    
    // Add base forms
    pokemonData.forEach(p => {
        lookup.set(p.name, {
            name: formatPokemonName(p.name),
            value: p.name,
            image: p.sprites.front_default,
            shinyImage: p.sprites.front_shiny,
        });
    });
    
    // Add form-specific entries
    formsData.forEach(form => {
        if (form.sprites && form.sprites.front_default) {
            lookup.set(form.name, {
                name: formatPokemonName(form.name),
                value: form.name,
                image: form.sprites.front_default,
                shinyImage: form.sprites.front_shiny || form.sprites.front_default,
            });
        }
    });
    
    return lookup;
};

const POKEMON_LOOKUP = createPokemonLookup();

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
    if (s >= 1) return `${s} second${s > 1 ? "s" : ""} ago`;
    return 'Just now';
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
    const [stats, setStats] = useState({ regularCaught: 0, regularCompletion: 0, shinyCaught: 0, shinyCompletion: 0, gamesPlayed: 0, topBall: null, topMark: null, topGame: null });
    const [loading, setLoading] = useState(true);
    const [recentAdded, setRecentAdded] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [likeCount, setLikeCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const [likeBurst, setLikeBurst] = useState(0);
    const [profileOwnerPreferences, setProfileOwnerPreferences] = useState(null);
    const { showMessage } = useMessage();
    const { username: currentUsername, loading: userLoading } = useContext(UserContext);

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

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const handleLike = async () => {
        if (likeLoading || !currentUsername) return;
        setLikeLoading(true);
        
        // Optimistically update the UI immediately for better user experience
        const wasLiked = hasLiked;
        const previousCount = likeCount;
        
        setHasLiked(!wasLiked);
        setLikeCount(wasLiked ? previousCount - 1 : previousCount + 1);
        if (!wasLiked) {
            setLikeBurst(n => n + 1);
        }
        
        try {
            // Use the authenticated likes endpoint
            const { hasLiked: newHasLiked, likeCount: newCount } = await profileAPI.toggleProfileLike(username);
            // Update with the actual server response
            setHasLiked(newHasLiked);
            setLikeCount(newCount);
            showMessage(newHasLiked ? "Profile liked!" : "Like removed", "success");
        } catch (error) {
            // Revert optimistic update on error
            setHasLiked(wasLiked);
            setLikeCount(previousCount);
            showMessage("Failed to update like", "error");
        } finally {
            setLikeLoading(false);
        }
    };



    // Load public profile
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const j = await profileAPI.getPublicProfile(username);
                if (!ignore) {
                    setData(j);
                    
                    
                    // Store the profile owner's dex preferences
                    if (j?.dexPreferences) {
                        setProfileOwnerPreferences(j.dexPreferences);
                    } else {
                        // Use default preferences if none are set
                        setProfileOwnerPreferences({
                            showGenderForms: true,
                            showAlolanForms: true,
                            showGalarianForms: true,
                            showHisuianForms: true,
                            showPaldeanForms: true,
                            showGmaxForms: true,
                            showUnownForms: true,
                            showOtherForms: true,
                            showAlcremieForms: true,
                            showVivillonForms: true,
                            showAlphaForms: true,
                            showAlphaOtherForms: true,
                        });
                    }
                }
            } catch {
                if (!ignore) {
                    setData(null);
                    // Set default preferences on error
                    setProfileOwnerPreferences({
                        showGenderForms: true,
                        showAlolanForms: true,
                        showGalarianForms: true,
                        showHisuianForms: true,
                        showPaldeanForms: true,
                        showGmaxForms: true,
                        showUnownForms: true,
                        showOtherForms: true,
                        showAlcremieForms: true,
                        showVivillonForms: true,
                        showAlphaForms: true,
                        showAlphaOtherForms: true,
                    });
                }
            } finally { if (!ignore) setLoading(false); }
        })();
        return () => { ignore = true; };
    }, [username]);

    // Custom filtering function that uses profile owner's preferences
    const getFilteredFormsDataForProfile = (forms, preferences) => {
        if (!preferences || !forms) return forms;
        
        return forms.filter(form => {
            const formType = form.formType;
            
            // Skip separator headers (they start with dashes)
            if (typeof formType === 'string' && formType.startsWith('-')) {
                return false;
            }
            
            // Skip forms without a valid formType
            if (!formType || typeof formType !== 'string') {
                return false;
            }
            
            switch (formType) {
                case 'gender': return preferences.showGenderForms;
                case 'alolan': return preferences.showAlolanForms;
                case 'galarian': return preferences.showGalarianForms;
                case 'hisuian': return preferences.showHisuianForms;
                case 'paldean': return preferences.showPaldeanForms;
                case 'gmax': return preferences.showGmaxForms;
                case 'unown': return preferences.showUnownForms;
                case 'other': return preferences.showOtherForms;
                case 'alcremie': return preferences.showAlcremieForms;
                case 'vivillon': return preferences.showVivillonForms;
                case 'alpha': return preferences.showAlphaForms;
                case 'alphaother': return preferences.showAlphaOtherForms;
                default: return true;
            }
        });
    };

    // Load public caught stats (so right column matches owner page)
    useEffect(() => {
        if (!username || loading) return; // Don't calculate stats while profile is still loading
        let ignore = false;
        (async () => {
            try {
                const response = await profileAPI.getPublicCaughtData(username); // { username: string, caughtPokemon: { [key]: info|null } }
                
                // Extract the actual caughtPokemon data from the response
                const map = response?.caughtPokemon || {};
                
                // Only calculate stats if we have the profile owner's preferences
                if (!profileOwnerPreferences) {
                    if (!ignore) setStats({ regularCaught: 0, regularCompletion: 0, shinyCaught: 0, shinyCompletion: 0, gamesPlayed: 0, topBall: null, topMark: null, topGame: null });
                    return;
                }
                
                const allKeys = [
                    ...pokemonData.map(p => getCaughtKey(p)),
                    ...getFilteredFormsDataForProfile(formsData, profileOwnerPreferences).map(p => getCaughtKey(p)),
                ];
                const total = allKeys.length;
                
                // Separate regular and shiny counts
                const regularEntries = Object.entries(map).filter(([key, info]) => info && !key.includes('_shiny'));
                const shinyEntries = Object.entries(map).filter(([key, info]) => info && key.includes('_shiny'));
                
                const regularCaught = regularEntries.length;
                const shinyCaught = shinyEntries.length;
                const regularCompletion = total ? Math.round((regularCaught / total) * 100) : 0;
                const shinyCompletion = total ? Math.round((shinyCaught / total) * 100) : 0;
                
                const allCaughtInfos = [...regularEntries.map(([, info]) => info), ...shinyEntries.map(([, info]) => info)];
                
                // Extract all entries from the new data structure
                const allEntries = [];
                allCaughtInfos.forEach(info => {
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
                
                const gamesPlayed = new Set(allEntries.map(i => i.game).filter(Boolean)).size;

                const topBallKey = countTop(allEntries, "ball");
                const topMarkKey = countTop(allEntries, "mark");
                const topGameKey = countTop(allEntries, "game");
                const topBall = fromOptionsOrTitle(BALL_OPTIONS, topBallKey, " Ball");
                const topMark = fromOptionsOrTitle(MARK_OPTIONS, topMarkKey, " Mark");
                const topGame = fromOptionsOrTitle(GAME_OPTIONS_TWO, topGameKey);

                if (!ignore) setStats({ regularCaught, regularCompletion, shinyCaught, shinyCompletion, gamesPlayed, topBall, topMark, topGame });

                // Build recent 5 added list (newest by date first)
                try {
                    // Only build recent list if we have the profile owner's preferences
                    if (!profileOwnerPreferences) {
                        if (!ignore) setRecentAdded([]);
                        return;
                    }
                    
                    const allMonsList = [...pokemonData, ...getFilteredFormsDataForProfile(formsData, profileOwnerPreferences)];
                    const keyToMon = new Map(allMonsList.map(m => [getCaughtKey(m), m]));
                                                              // First, separate Pokemon with and without caughtAt timestamps
                     const withTimestamps = [];
                     const withoutTimestamps = [];
                     
                     Object.entries(map).forEach(([key, info]) => {
                         if (!info) return;
                         
                         // Check if this is a shiny Pokémon by looking for _shiny suffix in the key
                         const isShiny = key.includes('_shiny');
                         
                         // Get the base key (without _shiny suffix) to find the Pokémon data
                         const baseKey = isShiny ? key.replace('_shiny', '') : key;
                         const mon = keyToMon.get(baseKey);
                         if (!mon) return;
                         
                         // Add shiny status to the info object
                         const infoWithShiny = { ...info, isShiny };
                         
                         if (info.caughtAt) {
                             const parsedDate = new Date(info.caughtAt);
                             if (!isNaN(parsedDate.getTime())) {
                                 withTimestamps.push({ key, mon, info: infoWithShiny, ts: parsedDate.getTime() });
                             }
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
                     
                     const recentList = allPokemon.slice(0, 5).map(({ mon, info }) => ({ mon, info }));
                    if (!ignore) {
                        setRecentAdded(recentList);
                    }
                } catch {
                    if (!ignore) setRecentAdded([]);
                }
                            } catch { }
        })();
        return () => { ignore = true; };
    }, [username, refreshKey, profileOwnerPreferences, loading]); // Add profileOwnerPreferences and loading dependencies

    // Load like data
    useEffect(() => {
        if (!username || userLoading) return; // Wait for user context to be ready
        let ignore = false;
        (async () => {
            try {
                if (currentUsername) {
                    // User is logged in - get their like status and count
                    const { hasLiked: userHasLiked, likeCount: count } = await profileAPI.getProfileLikes(username);
                    if (!ignore) {
                        setLikeCount(count);
                        setHasLiked(userHasLiked);
                    }
                } else {
                    // User is not logged in - just get the count
                    const { count } = await profileAPI.getPublicProfileLikes(username);
                    if (!ignore) {
                        setLikeCount(count);
                        setHasLiked(false);
                    }
                }
            } catch { }
        })();
        return () => { ignore = true; };
    }, [username, currentUsername, userLoading]);

    // Set initial like count from profile data
    useEffect(() => {
        if (data && typeof data.likeCount === 'number') {
            setLikeCount(data.likeCount);
        }
    }, [data]);

    // Initial load of likes
    useEffect(() => {
        if (!username) return;
        
        const loadInitialLikes = async () => {
            try {
                if (currentUsername) {
                    // User is logged in - get their like status and count
                    const { hasLiked: userHasLiked, likeCount: count } = await profileAPI.getProfileLikes(username);
                    setLikeCount(count);
                    setHasLiked(userHasLiked);
                } else {
                    // User is not logged in - just get the count
                    const { count } = await profileAPI.getPublicProfileLikes(username);
                    setLikeCount(count);
                    setHasLiked(false);
                }
            } catch (error) {
                // Silently handle errors
            }
        };
        
        loadInitialLikes();
    }, [username, currentUsername]);

    // Poll for like updates every 5 seconds to keep like count real-time (reduced from 2 seconds)
    useEffect(() => {
        if (!username) return;
        
        const interval = setInterval(async () => {
            try {
                if (currentUsername) {
                    // User is logged in - get their like status and count
                    const { hasLiked: userHasLiked, likeCount: count } = await profileAPI.getProfileLikes(username);
                    setLikeCount(prevCount => {
                        // Only update if the count actually changed
                        if (prevCount !== count) {
                            return count;
                        }
                        return prevCount;
                    });
                    setHasLiked(userHasLiked);
                } else {
                    // User is not logged in - just get the count
                    const { count } = await profileAPI.getPublicProfileLikes(username);
                    setLikeCount(prevCount => {
                        // Only update if the count actually changed
                        if (prevCount !== count) {
                            return count;
                        }
                        return prevCount;
                    });
                }
            } catch (error) {
                // Silently handle errors to avoid spam
            }
        }, 5000); // Check every 5 seconds instead of 2

        return () => clearInterval(interval);
    }, [username, currentUsername]);



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
        <div className="profile-wrapper page-container profile-page">
            {/* ===== header bar (same layout, no edit buttons) ===== */}
            <div className="profile-header-bar">
                <div className="profile-header-left">
                    <div className="profile-top-line">
                        <h1 className="profile-username">
                            <span>
                                {data.username}
                                {data.isAdmin && (
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
                        {currentUsername ? (
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
                        ) : (
                            <div className="profile-like-display liked">
                                <Heart size={20} fill="currentColor" />
                                <span className="like-count">{likeCount}</span>
                            </div>
                        )}

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
                                 {data.gender === "Other" ? "Female" : (data.gender || "N/A")}
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
                        {Array.isArray(data.favoritePokemon) && data.favoritePokemon.some(poke => poke && poke.trim() !== '') && (
                            <>
                                <h3>Favorite Pokémon</h3>
                                <div className="profile-rank-row">
                                    {Array.from({ length: 5 }).map((_, index) => {
                                        const poke = data.favoritePokemon[index];
                                        const shiny = Array.isArray(data.favoritePokemonShiny) ? data.favoritePokemonShiny[index] : false;
                                        
                                        
                                        const p = poke && poke.trim() !== '' ? POKEMON_LOOKUP.get(poke) || 
                                            // Fallback: try to find base form for special forms like gmax, alolan, etc.
                                            POKEMON_LOOKUP.get(poke.split('-')[0]) : null;
                                        const isEmpty = !p || !poke || poke.trim() === '';
                                        
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
                                                <div className="rank-label">{p?.name ? formatPokemonName(poke) : null}</div>
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
                            <label>Regular Caught</label>
                            <div className="field-display">{stats.regularCaught}</div>
                        </div>
                        <div className="profile-field">
                            <label>Regular Completion</label>
                            <div className="field-display">{stats.regularCompletion}%</div>
                        </div>
                        <div className="profile-field">
                            <label>Shiny Caught</label>
                            <div className="field-display">{stats.shinyCaught}</div>
                        </div>
                        <div className="profile-field">
                            <label>Shiny Completion</label>
                            <div className="field-display">{stats.shinyCompletion}%</div>
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
                    {/* Full Dex button - place below the recent section */}
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
    );
}
