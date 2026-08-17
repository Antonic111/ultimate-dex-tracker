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
            const markList = Array.isArray(it?.marks)
                ? it.marks
                : (it?.mark ? [it.mark] : []);
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
    const regularEntries = Object.entries(map).filter(([key, info]) => info && !key.includes('_shiny'));
    const shinyEntries = Object.entries(map).filter(([key, info]) => info && key.includes('_shiny'));

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
                if (entry && (entry.ball || entry.mark || entry.game || entry.method)) {
                    allEntries.push(entry);
                }
            });
        } else if (info.ball || info.mark || info.game || info.method) {
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
        if (!info) return;

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
