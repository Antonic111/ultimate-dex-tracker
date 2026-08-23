import pokemonData from "../data/pokemon.json";
import formsData from "../utils/loadFormsData";
import { getCaughtKey } from "../caughtStorage";
import { GAME_OPTIONS_TWO, BALL_OPTIONS, MARK_OPTIONS } from "../Constants";

export function getTimeAgo(dateString) {
    if (!dateString) return '';

    const now = new Date();
    let joined;

    if (typeof dateString === 'string') {
        joined = new Date(dateString);
        if (isNaN(joined.getTime())) {
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

    if (isNaN(joined.getTime())) return 'Unknown date';

    const diff = now - joined;
    if (diff < 0) return 'Just now';

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

export const flagFromISO = (cc) =>
    cc && cc.length === 2
        ? String.fromCodePoint(...cc.toUpperCase().split("").map(c => 127397 + c.charCodeAt(0)))
        : null;

export const guessISOFromLocation = (loc) => {
    const s = String(loc || "");
    const m = s.match(/\b([A-Z]{2})\b/);
    return m ? m[1] : null;
};

/**
 * Normalizes YouTube input into a valid URL:
 * - full url: https://youtube.com/@name or https://youtube.com/name -> https://youtube.com/@name
 * - handle with @: @name -> https://youtube.com/@name
 * - raw name: name -> https://youtube.com/@name
 * - channel/c/short urls: https://youtube.com/channel/... or https://youtu.be/... -> https://...
 */
export function normalizeYoutubeUrl(input) {
    if (!input) return "";
    let str = String(input).trim();
    if (!str) return "";

    // Keep direct channel, custom /c/, or youtu.be links
    if (/^(https?:\/\/)?(www\.)?youtu\.be\//i.test(str)) {
        return str.startsWith("http") ? str : `https://${str}`;
    }
    if (/^(https?:\/\/)?(www\.)?youtube\.com\/(channel\/|c\/)/i.test(str)) {
        return str.startsWith("http") ? str : `https://${str}`;
    }

    // Match full youtube.com url with handle or path
    const ytMatch = str.match(/^(?:https?:\/\/)?(?:www\.)?youtube\.com\/@?([a-zA-Z0-9_.\-]+)/i);
    if (ytMatch && ytMatch[1]) {
        return `https://youtube.com/@${ytMatch[1]}`;
    }

    // Handle @handle or raw username
    const handle = str.replace(/^@/, "").replace(/^\/+/, "").trim();
    if (handle) {
        return `https://youtube.com/@${handle}`;
    }
    return "";
}

/**
 * Normalizes Twitch input into a valid URL:
 * - full url: https://twitch.tv/name or twitch.tv/name -> https://twitch.tv/name
 * - handle with @: @name -> https://twitch.tv/name
 * - raw name: name -> https://twitch.tv/name
 */
export function normalizeTwitchUrl(input) {
    if (!input) return "";
    let str = String(input).trim();
    if (!str) return "";

    const twMatch = str.match(/^(?:https?:\/\/)?(?:www\.)?twitch\.tv\/@?([a-zA-Z0-9_]+)/i);
    if (twMatch && twMatch[1]) {
        return `https://twitch.tv/${twMatch[1]}`;
    }

    const handle = str.replace(/^@/, "").replace(/^\/+/, "").trim();
    if (handle) {
        return `https://twitch.tv/${handle}`;
    }
    return "";
}

/**
 * Extracts a clean channel name or handle for display/editing:
 * - https://youtube.com/@ChannelName -> @ChannelName
 * - https://youtube.com/c/ChannelName -> @ChannelName
 * - https://youtube.com/channel/UC12345 -> UC12345
 * - https://youtu.be/ChannelName -> ChannelName
 * - @ChannelName -> @ChannelName
 * - ChannelName -> @ChannelName
 */
export function extractYoutubeHandle(input) {
    if (!input) return "";
    let str = String(input).trim();
    if (!str) return "";

    const atMatch = str.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([a-zA-Z0-9_.\-]+)/i);
    if (atMatch && atMatch[1]) return `@${atMatch[1]}`;

    const cMatch = str.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c\/|user\/)?([a-zA-Z0-9_.\-]+)/i);
    if (cMatch && cMatch[1] && !['watch', 'results', 'feed', 'channel'].includes(cMatch[1].toLowerCase())) {
        return cMatch[1].startsWith('@') ? cMatch[1] : `@${cMatch[1]}`;
    }

    const channelMatch = str.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/([a-zA-Z0-9_.\-]+)/i);
    if (channelMatch && channelMatch[1]) return channelMatch[1];

    const shortMatch = str.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_.\-]+)/i);
    if (shortMatch && shortMatch[1]) return shortMatch[1];

    if (str.startsWith('@')) return str;
    return `@${str}`;
}

/**
 * Extracts a clean Twitch username for display/editing:
 * - https://twitch.tv/channelname -> channelname
 * - https://www.twitch.tv/channelname -> channelname
 * - @channelname -> channelname
 * - channelname -> channelname
 */
export function extractTwitchHandle(input) {
    if (!input) return "";
    let str = String(input).trim();
    if (!str) return "";

    const twMatch = str.match(/(?:https?:\/\/)?(?:www\.)?twitch\.tv\/@?([a-zA-Z0-9_]+)/i);
    if (twMatch && twMatch[1]) return twMatch[1];

    return str.replace(/^@/, "").replace(/^\/+/, "").trim();
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

const countAll = (list, key) => {
    const counts = {};
    for (const it of list) {
        if (key === "mark") {
            const markList = (Array.isArray(it?.marks) && it.marks.length > 0)
                ? it.marks
                : (it?.mark && it.mark !== "none" && it.mark !== "Unknown" && it.mark !== "unknown" ? [it.mark] : []);
            for (const rawMark of markList) {
                const v = String(rawMark ?? "").trim().toLowerCase();
                if (!v || v === "none" || v === "unknown") continue;
                counts[v] = (counts[v] || 0) + 1;
            }
            continue;
        }
        const v = String(it?.[key] ?? "").trim().toLowerCase();
        if (!v || v === "none" || v === "unknown") continue;
        counts[v] = (counts[v] || 0) + 1;
    }
    return Object.entries(counts)
        .map(([k, count]) => ({ key: k, count }))
        .sort((a, b) => b.count - a.count);
};

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

export function getFilteredFormsDataForProfile(forms, preferences) {
    if (!preferences || !forms) return forms;
    
    return forms.filter(form => {
        const formType = form.formType;
        if (typeof formType === 'string' && formType.startsWith('-')) return false;

        const p = preferences;
        if (p.showGenderForms === false && formType === 'gender') return false;
        if (p.showAlolanForms === false && formType === 'alolan') return false;
        if (p.showGalarianForms === false && formType === 'galarian') return false;
        if (p.showHisuianForms === false && formType === 'hisuian') return false;
        if (p.showPaldeanForms === false && formType === 'paldean') return false;
        if (p.showGmaxForms === false && formType === 'gmax') return false;
        if (p.showUnownForms === false && formType === 'unown') return false;
        if (p.showOtherForms === false && formType === 'other') return false;
        if (p.showAlcremieForms === false && formType === 'alcremie') return false;
        if (p.showVivillonForms === false && formType === 'vivillon') return false;
        if (p.showAlphaForms === false && formType === 'alpha') return false;
        if (p.showAlphaOtherForms === false && (formType === 'alpha_other' || formType === 'alphaother')) return false;
        if (p.showMightyForms === false && formType === 'mighty') return false;

        return true;
    });
}

export function calculateProfileStats(map, dexPreferences, optimisticOrder = null) {
    if (!map) return { stats: null, recentAdded: [] };

    // Get the correct filtered forms based on preferences
    const filteredForms = dexPreferences 
        ? getFilteredFormsDataForProfile(formsData, dexPreferences)
        : formsData;

    const allMonsList = [...pokemonData, ...filteredForms];

    // Build list of valid keys for calculating completion percentages
    const regularKeys = [
        ...pokemonData.map(p => getCaughtKey(p, null, false)),
        ...filteredForms.map(p => getCaughtKey(p, null, false)),
    ];
    const shinyKeys = [
        ...pokemonData.map(p => getCaughtKey(p, null, true)),
        ...filteredForms.filter(p => p.formType !== 'mighty').map(p => getCaughtKey(p, null, true)),
    ];
    
    const totalRegular = regularKeys.length;
    const totalShiny = shinyKeys.length;

    // Filter caught entries (checking both regular and shiny suffixes)
    const isEntryCaught = (info) => Boolean(info && info.caught !== false && (info.entries?.length > 0 || info.caught === true));
    const regularEntries = Object.entries(map).filter(([key, info]) => isEntryCaught(info) && !key.includes('_shiny'));
    const shinyEntries = Object.entries(map).filter(([key, info]) => isEntryCaught(info) && key.includes('_shiny'));

    const regularCaught = regularEntries.length;
    const shinyCaught = shinyEntries.length;
    const regularCompletion = totalRegular ? Math.round((regularCaught / totalRegular) * 100) : 0;
    const shinyCompletion = totalShiny ? Math.round((shinyCaught / totalShiny) * 100) : 0;

    const allCaughtInfos = [...regularEntries.map(([, info]) => info), ...shinyEntries.map(([, info]) => info)];

    // Extract detailed entries for stats (balls, marks, games)
    const allEntries = [];
    allCaughtInfos.forEach(info => {
        if (info.entries && Array.isArray(info.entries)) {
            info.entries.forEach(entry => {
                if (entry && (entry.ball || entry.mark || (Array.isArray(entry.marks) && entry.marks.length > 0) || entry.game || entry.method)) {
                    allEntries.push(entry);
                }
            });
        } else if (info.ball || info.mark || (Array.isArray(info.marks) && info.marks.length > 0) || info.game || info.method) {
            allEntries.push(info);
        }
    });

    const gamesPlayed = new Set(allEntries.map(i => i.game).filter(Boolean)).size;

    const rankedBalls = countAll(allEntries, "ball");
    const rankedMarks = countAll(allEntries, "mark");
    const rankedGames = countAll(allEntries, "game");

    const topBallKey = rankedBalls[0]?.key || null;
    const topMarkKey = rankedMarks[0]?.key || null;
    const topGameKey = rankedGames[0]?.key || null;

    const topBall = fromOptionsOrTitle(BALL_OPTIONS, topBallKey, " Ball");
    const topMark = fromOptionsOrTitle(MARK_OPTIONS, topMarkKey, " Mark");
    const topGame = fromOptionsOrTitle(GAME_OPTIONS_TWO, topGameKey);

    const allBalls = buildRankedList(rankedBalls, BALL_OPTIONS, " Ball");
    const allMarks = buildRankedList(rankedMarks, MARK_OPTIONS, " Mark");
    const allGames = buildRankedList(rankedGames, GAME_OPTIONS_TWO);

    const stats = {
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
        shinies: regularCaught, // Backwards compat for UI logic
        completion: regularCompletion,
    };

    // Calculate recent catches
    const keyToMon = new Map();
    allMonsList.forEach(m => {
        const rKey = getCaughtKey(m, null, false);
        const sKey = getCaughtKey(m, null, true);
        if (rKey) keyToMon.set(rKey, m);
        if (sKey) keyToMon.set(sKey, m);
    });

    const withTimestamps = [];
    const withoutTimestamps = [];

    Object.entries(map).forEach(([key, info]) => {
        if (!info || !isEntryCaught(info)) return;

        const isShiny = key.includes('_shiny');
        const mon = keyToMon.get(key) || keyToMon.get(key.replace('_shiny', '')); // Handle both exact match or base match
        if (!mon) return;

        const infoWithShiny = { ...info, isShiny };

        let bestTimestamp = null;
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

    withTimestamps.sort((a, b) => b.ts - a.ts);

    const baseTime = withTimestamps.length > 0 ? withTimestamps[withTimestamps.length - 1].ts - 86400000 : Date.now();
    withoutTimestamps.forEach((item, idx) => {
        const reverseIdx = withoutTimestamps.length - 1 - idx;
        item.ts = baseTime - (reverseIdx * 86400000);
    });

    const allPokemon = [...withTimestamps, ...withoutTimestamps];
    allPokemon.sort((a, b) => b.ts - a.ts);

    const serverRecentList = allPokemon.slice(0, 5).map(({ mon, info }) => ({ mon, info }));

    let recentList = serverRecentList;
    if (optimisticOrder && optimisticOrder.length > 0) {
        const order = optimisticOrder;
        const serverMap = new Map();
        serverRecentList.forEach(item => {
            const k = (item.mon?.stableId || '') + '|' + !!item.info?.isShiny;
            serverMap.set(k, item);
        });

        recentList = [];
        order.forEach(o => {
            const k = (o.stableId || '') + '|' + !!o.isShiny;
            if (serverMap.has(k)) {
                recentList.push(serverMap.get(k));
                serverMap.delete(k);
            }
        });

        serverMap.forEach(item => {
            recentList.push(item);
        });
        
        recentList = recentList.slice(0, 5);
    }

    return { stats, recentAdded: recentList };
}

export const DEFAULT_PROFILE_PICTURES = [
    "/data/default_profile_pictures/butterfree.png",
    "/data/default_profile_pictures/celebi.png",
    "/data/default_profile_pictures/charizard.png",
    "/data/default_profile_pictures/ditto.png",
    "/data/default_profile_pictures/gardevoir.png",
    "/data/default_profile_pictures/gengar.png",
    "/data/default_profile_pictures/guzzlord.png",
    "/data/default_profile_pictures/gyarados.png",
    "/data/default_profile_pictures/lucario.png",
    "/data/default_profile_pictures/metagross.png",
    "/data/default_profile_pictures/mew.png",
    "/data/default_profile_pictures/mewtwo.png",
    "/data/default_profile_pictures/noctowl.png",
    "/data/default_profile_pictures/pikachu.png",
    "/data/default_profile_pictures/psyduck.png",
    "/data/default_profile_pictures/rayquaza.png",
    "/data/default_profile_pictures/shaymin.png"
];

/**
 * Deterministically returns one of the 7 default avatars based on a string seed (e.g. username or id).
 */
export function getDefaultAvatarUrl(seed = "") {
    if (!seed) return DEFAULT_PROFILE_PICTURES[0];
    let hash = 0;
    const str = String(seed);
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    const index = Math.abs(hash) % DEFAULT_PROFILE_PICTURES.length;
    return DEFAULT_PROFILE_PICTURES[index];
}

/**
 * Resolves avatar image URL for a user or profile object.
 * Priority:
 * 1. user.avatar (custom uploaded image or assigned default profile picture)
 * 2. Deterministic default profile picture
 */
export function getUserAvatarUrl(userOrAvatar) {
    if (!userOrAvatar) return DEFAULT_PROFILE_PICTURES[0];
    if (typeof userOrAvatar === "string") {
        if (
            userOrAvatar.startsWith("/uploads/") ||
            userOrAvatar.startsWith("http://") ||
            userOrAvatar.startsWith("https://") ||
            userOrAvatar.startsWith("data:") ||
            userOrAvatar.startsWith("blob:") ||
            userOrAvatar.startsWith("/data/default_profile_pictures/")
        ) {
            // Map legacy default[1-7].png paths to new named paths
            if (userOrAvatar.includes("/default1.png")) return "/data/default_profile_pictures/charizard.png";
            if (userOrAvatar.includes("/default2.png")) return "/data/default_profile_pictures/gengar.png";
            if (userOrAvatar.includes("/default3.png")) return "/data/default_profile_pictures/lucario.png";
            if (userOrAvatar.includes("/default4.png")) return "/data/default_profile_pictures/mew.png";
            if (userOrAvatar.includes("/default5.png")) return "/data/default_profile_pictures/mewtwo.png";
            if (userOrAvatar.includes("/default6.png")) return "/data/default_profile_pictures/pikachu.png";
            if (userOrAvatar.includes("/default7.png")) return "/data/default_profile_pictures/rayquaza.png";
            return userOrAvatar;
        }
        return getDefaultAvatarUrl(userOrAvatar);
    }
    if (userOrAvatar.avatar) {
        if (userOrAvatar.avatar.includes("/default1.png")) return "/data/default_profile_pictures/charizard.png";
        if (userOrAvatar.avatar.includes("/default2.png")) return "/data/default_profile_pictures/gengar.png";
        if (userOrAvatar.avatar.includes("/default3.png")) return "/data/default_profile_pictures/lucario.png";
        if (userOrAvatar.avatar.includes("/default4.png")) return "/data/default_profile_pictures/mew.png";
        if (userOrAvatar.avatar.includes("/default5.png")) return "/data/default_profile_pictures/mewtwo.png";
        if (userOrAvatar.avatar.includes("/default6.png")) return "/data/default_profile_pictures/pikachu.png";
        if (userOrAvatar.avatar.includes("/default7.png")) return "/data/default_profile_pictures/rayquaza.png";
        return userOrAvatar.avatar;
    }
    const seed = userOrAvatar.username || userOrAvatar._id || userOrAvatar.id || userOrAvatar.email || "";
    return getDefaultAvatarUrl(seed);
}

