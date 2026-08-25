import pokemonData from "../data/pokemon.json";
import formsData from "./loadFormsData";
import { getCaughtKey } from "../caughtStorage";
import { GAME_OPTIONS_TWO, BALL_OPTIONS, MARK_OPTIONS } from "../Constants";
import { getFilteredFormsDataForProfile } from "./profileUtils";
import { getSpriteUrl, resolvePokemon, cleanPokemonNameOrKey } from "./spriteUtils";
import { calculateOdds } from "./huntSystem";
import {
  isLegendary,
  isSubLegendary,
  isMythical,
  isUltraBeast,
  isParadox,
  isPseudoLegendary,
  isPseudoLegendaryEvo,
  isStarter,
  isStarterEvo,
  isFossil,
  isFossilEvo,
  isBaby
} from "./pokemonCategories";

export const GENERATION_CONFIG = [
  { gen: 1, roman: "I", name: "Generation I", region: "Kanto", startId: 1, endId: 151, starterIds: [1, 4, 7], color: "#ef4444" },
  { gen: 2, roman: "II", name: "Generation II", region: "Johto", startId: 152, endId: 251, starterIds: [152, 155, 158], color: "#f97316" },
  { gen: 3, roman: "III", name: "Generation III", region: "Hoenn", startId: 252, endId: 386, starterIds: [252, 255, 258], color: "#eab308" },
  { gen: 4, roman: "IV", name: "Generation IV", region: "Sinnoh", startId: 387, endId: 493, starterIds: [387, 390, 393], color: "#22c55e" },
  { gen: 5, roman: "V", name: "Generation V", region: "Unova", startId: 494, endId: 649, starterIds: [495, 498, 501], color: "#06b6d4" },
  { gen: 6, roman: "VI", name: "Generation VI", region: "Kalos", startId: 650, endId: 721, starterIds: [650, 653, 656], color: "#3b82f6" },
  { gen: 7, roman: "VII", name: "Generation VII", region: "Alola", startId: 722, endId: 809, starterIds: [722, 725, 728], color: "#a855f7" },
  { gen: 8, roman: "VIII", name: "Generation VIII", region: "Galar", startId: 810, endId: 905, starterIds: [810, 813, 816], color: "#ec4899" },
  { gen: 9, roman: "IX", name: "Generation IX", region: "Paldea", startId: 906, endId: 1025, starterIds: [906, 909, 912], color: "#84cc16" },
];

export const TYPE_CONFIG = [
  { key: "normal", name: "Normal", color: "#9fa19f" },
  { key: "fire", name: "Fire", color: "#e62829" },
  { key: "water", name: "Water", color: "#2980ef" },
  { key: "grass", name: "Grass", color: "#3fa129" },
  { key: "electric", name: "Electric", color: "#fac000" },
  { key: "ice", name: "Ice", color: "#3dcef3" },
  { key: "fighting", name: "Fighting", color: "#ff8000" },
  { key: "poison", name: "Poison", color: "#9141cb" },
  { key: "ground", name: "Ground", color: "#915121" },
  { key: "flying", name: "Flying", color: "#81b9ef" },
  { key: "psychic", name: "Psychic", color: "#ef4179" },
  { key: "bug", name: "Bug", color: "#91a119" },
  { key: "rock", name: "Rock", color: "#afa981" },
  { key: "ghost", name: "Ghost", color: "#704170" },
  { key: "dragon", name: "Dragon", color: "#5060e1" },
  { key: "steel", name: "Steel", color: "#60a1b8" },
  { key: "dark", name: "Dark", color: "#50413f" },
  { key: "fairy", name: "Fairy", color: "#ef70ef" },
  { key: "stellar", name: "Stellar", color: "#438297" },
];

export const SPECIAL_CATEGORIES_DEFINITIONS = [
  { key: "legendary", title: "Legendary", spriteId: 382, checkFn: isLegendary },
  { key: "sub-legendary", title: "Sub-Legendary", spriteId: 145, checkFn: isSubLegendary },
  { key: "mythical", title: "Mythical", spriteId: 151, checkFn: isMythical },
  { key: "ultra-beast", title: "Ultra Beasts", spriteId: 793, checkFn: isUltraBeast },
  { key: "paradox", title: "Paradox Pokémon", spriteId: 1005, checkFn: isParadox },
  { key: "pseudo-legendary", title: "Pseudo-Legendary", spriteId: 445, checkFn: (p) => isPseudoLegendary(p) || isPseudoLegendaryEvo(p) },
  { key: "starter", title: "Starter Pokémon", spriteId: 6, checkFn: (p) => isStarter(p) || isStarterEvo(p) },
  { key: "fossil", title: "Fossil Pokémon", spriteId: 142, checkFn: (p) => isFossil(p) || isFossilEvo(p) },
  { key: "baby", title: "Baby Pokémon", spriteId: 172, checkFn: isBaby },
];

export const CATEGORY_DEFINITIONS = [
  { key: "gender", title: "Gender Forms", formType: "gender", badge: "/data/stat_badges/gender.png" },
  { key: "alolan", title: "Alolan Forms", formType: "alolan", badge: "/data/stat_badges/alolan.png" },
  { key: "galarian", title: "Galarian Forms", formType: "galarian", badge: "/data/stat_badges/galar.png" },
  { key: "hisuian", title: "Hisuian Forms", formType: "hisuian", badge: "/data/stat_badges/hisui.png" },
  { key: "paldean", title: "Paldean Forms", formType: "paldean", badge: "/data/stat_badges/paldea.png" },
  { key: "gmax", title: "Gigantamax", formType: "gmax", badge: "/data/stat_badges/gmax.png" },
  { key: "alpha", title: "Alpha Forms", formType: ["alpha", "alphaother", "alpha_other"], badge: "/data/stat_badges/alpha.png" },
  { key: "mighty", title: "Mighty Pokémon", formType: "mighty", noShiny: true, badge: "/data/stat_badges/mighty.png" },
  { key: "vivillon", title: "Vivillon Patterns", formType: "vivillon", badge: "/data/stat_badges/vivillon.png" },
  { key: "alcremie", title: "Alcremie Forms", formType: "alcremie", badge: "/data/stat_badges/alcremie.png" },
  { key: "unown", title: "Unown Forms", formType: "unown", badge: "/data/stat_badges/unown.png" },
  { key: "other", title: "Other Forms", formType: "other", badge: "/data/stat_badges/other.png" },
];

const toTitle = (s) => String(s || "").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());

export function calculateDetailedStats(caughtMap, dexPreferences) {
  if (!caughtMap) return null;

  const useHomeSprites = Boolean(dexPreferences?.useHomeSprites);

  const filteredForms = dexPreferences 
    ? getFilteredFormsDataForProfile(formsData, dexPreferences)
    : formsData;

  // 1. All Pokémon Key Index
  const mainDex = pokemonData;
  const pokemonMap = new Map(mainDex.map(p => [p.id, p]));

  // 2. Separate Caught Entries
  const regularEntriesMap = {};
  const shinyEntriesMap = {};

  Object.entries(caughtMap).forEach(([key, info]) => {
    if (!info) return;
    const isEntryCaught = Boolean(info.caught !== false && (info.entries?.length > 0 || info.caught === true));
    if (!isEntryCaught) return;
    if (key.includes("_shiny")) {
      shinyEntriesMap[key] = info;
    } else {
      regularEntriesMap[key] = info;
    }
  });

  // Extract all sub-entries for balls, marks, games, methods, genders
  const allSubEntries = [];
  const processEntry = (info, isShiny) => {
    if (!info) return;
    if (info.entries && Array.isArray(info.entries)) {
      info.entries.forEach(sub => {
        if (sub) allSubEntries.push({ ...sub, isShiny });
      });
    } else if (info.ball || info.mark || (Array.isArray(info.marks) && info.marks.length > 0) || info.game || info.method || info.gender) {
      allSubEntries.push({ ...info, isShiny });
    }
  };

  Object.values(regularEntriesMap).forEach(info => processEntry(info, false));
  Object.values(shinyEntriesMap).forEach(info => processEntry(info, true));

  // 3. OVERALL METRICS
  const totalLivingSpecies = mainDex.length; // 1025
  const totalFormSpecies = filteredForms.length;
  const totalTrackableRegular = totalLivingSpecies + totalFormSpecies;
  const totalTrackableShiny = totalLivingSpecies + filteredForms.filter(f => f.formType !== 'mighty').length;

  const totalRegularCaught = Object.keys(regularEntriesMap).length;
  const totalShinyCaught = Object.keys(shinyEntriesMap).length;
  const totalCombinedCaught = totalRegularCaught + totalShinyCaught;
  const totalCombinedPossible = totalTrackableRegular + totalTrackableShiny;

  const overallRegularPct = totalTrackableRegular ? Math.round((totalRegularCaught / totalTrackableRegular) * 100) : 0;
  const overallShinyPct = totalTrackableShiny ? Math.round((totalShinyCaught / totalTrackableShiny) * 100) : 0;
  const overallCombinedPct = totalCombinedPossible ? Math.round((totalCombinedCaught / totalCombinedPossible) * 100) : 0;

  // 4. GENERATIONS BREAKDOWN (Gen 1-9)
  const generations = GENERATION_CONFIG.map(cfg => {
    const genPokemon = mainDex.filter(p => p.id >= cfg.startId && p.id <= cfg.endId);
    const genTotal = genPokemon.length;

    let regCaught = 0;
    let shinyCaught = 0;

    genPokemon.forEach(mon => {
      const regKey = getCaughtKey(mon, null, false);
      const shinyKey = getCaughtKey(mon, null, true);
      if (regularEntriesMap[regKey]) regCaught++;
      if (shinyEntriesMap[shinyKey]) shinyCaught++;
    });

    const regPct = genTotal ? Math.round((regCaught / genTotal) * 100) : 0;
    const shinyPct = genTotal ? Math.round((shinyCaught / genTotal) * 100) : 0;
    const combinedPct = genTotal ? Math.round(((regCaught + shinyCaught) / (genTotal * 2)) * 100) : 0;

    const starters = (cfg.starterIds || []).map(id => {
      const mon = mainDex.find(p => p.id === id);
      return {
        id,
        name: mon ? mon.name.charAt(0).toUpperCase() + mon.name.slice(1) : `#${id}`,
        sprite: mon ? getSpriteUrl(mon, true, useHomeSprites) : '/fallback.png'
      };
    });

    return {
      ...cfg,
      total: genTotal,
      starters,
      regularCaught: regCaught,
      shinyCaught: shinyCaught,
      regularPct: regPct,
      shinyPct: shinyPct,
      combinedPct: combinedPct,
      isCompleteRegular: regCaught === genTotal && genTotal > 0,
      isCompleteShiny: shinyCaught === genTotal && genTotal > 0,
      isCompleteMaster: regCaught === genTotal && shinyCaught === genTotal && genTotal > 0
    };
  });

  // 5. SPECIAL CATEGORIES BREAKDOWN
  const specialCategories = SPECIAL_CATEGORIES_DEFINITIONS.map(cat => {
    const catMons = mainDex.filter(mon => cat.checkFn(mon));
    const total = catMons.length;
    if (total === 0) return null;

    let regCaught = 0;
    let shinyCaught = 0;

    catMons.forEach(mon => {
      const regKey = getCaughtKey(mon, null, false);
      const shinyKey = getCaughtKey(mon, null, true);
      if (regularEntriesMap[regKey]) regCaught++;
      if (shinyEntriesMap[shinyKey]) shinyCaught++;
    });

    const regPct = total ? Math.round((regCaught / total) * 100) : 0;
    const shinyPct = total ? Math.round((shinyCaught / total) * 100) : 0;
    const combinedPct = total ? Math.round(((regCaught + shinyCaught) / (total * 2)) * 100) : 0;

    const repMon = pokemonMap.get(cat.spriteId) || catMons[0];
    const sprite = repMon ? getSpriteUrl(repMon, true, useHomeSprites) : "";

    return {
      key: cat.key,
      title: cat.title,
      total,
      sprite,
      regularCaught: regCaught,
      shinyCaught: shinyCaught,
      regularPct: regPct,
      shinyPct: shinyPct,
      combinedPct: combinedPct,
      isCompleteRegular: regCaught === total && total > 0,
      isCompleteShiny: shinyCaught === total && total > 0,
      isCompleteMaster: regCaught === total && shinyCaught === total && total > 0,
    };
  }).filter(Boolean);

  // 6. FORMS & VARIANT CATEGORIES BREAKDOWN
  const categories = CATEGORY_DEFINITIONS.map(cat => {
    let catMons = [];
    if (cat.isMain) {
      catMons = mainDex;
    } else if (Array.isArray(cat.formType)) {
      catMons = filteredForms.filter(f => cat.formType.includes(f.formType));
    } else {
      catMons = filteredForms.filter(f => f.formType === cat.formType);
    }

    const total = catMons.length;
    if (total === 0) return null;

    let regCaught = 0;
    let shinyCaught = 0;

    catMons.forEach(mon => {
      const regKey = getCaughtKey(mon, null, false);
      const shinyKey = getCaughtKey(mon, null, true);
      if (regularEntriesMap[regKey]) regCaught++;
      if (!cat.noShiny && shinyEntriesMap[shinyKey]) shinyCaught++;
    });

    const regPct = total ? Math.round((regCaught / total) * 100) : 0;
    const shinyPct = (!cat.noShiny && total) ? Math.round((shinyCaught / total) * 100) : 0;
    const combinedPct = cat.noShiny 
      ? regPct 
      : (total ? Math.round(((regCaught + shinyCaught) / (total * 2)) * 100) : 0);

    return {
      key: cat.key,
      title: cat.title,
      badge: cat.badge,
      total,
      noShiny: !!cat.noShiny,
      regularCaught: regCaught,
      shinyCaught: shinyCaught,
      regularPct: regPct,
      shinyPct: shinyPct,
      combinedPct: combinedPct,
      isCompleteRegular: regCaught === total && total > 0,
      isCompleteShiny: !cat.noShiny && shinyCaught === total && total > 0,
      isCompleteMaster: cat.noShiny ? (regCaught === total && total > 0) : (!cat.noShiny && regCaught === total && shinyCaught === total && total > 0),
    };
  }).filter(Boolean);

  // 7. POKÉMON TYPES BREAKDOWN
  const types = TYPE_CONFIG.map(t => {
    const typeMons = mainDex.filter(mon => 
      Array.isArray(mon.types) && mon.types.some(typeName => String(typeName).toLowerCase() === t.key)
    );
    const total = typeMons.length;
    if (total === 0) return null;

    let regCaught = 0;
    let shinyCaught = 0;

    typeMons.forEach(mon => {
      const regKey = getCaughtKey(mon, null, false);
      const shinyKey = getCaughtKey(mon, null, true);
      if (regularEntriesMap[regKey]) regCaught++;
      if (shinyEntriesMap[shinyKey]) shinyCaught++;
    });

    const regPct = total ? Math.round((regCaught / total) * 100) : 0;
    const shinyPct = total ? Math.round((shinyCaught / total) * 100) : 0;
    const combinedPct = total ? Math.round(((regCaught + shinyCaught) / (total * 2)) * 100) : 0;

    return {
      key: t.key,
      name: t.name,
      color: t.color,
      total,
      regularCaught: regCaught,
      shinyCaught: shinyCaught,
      regularPct: regPct,
      shinyPct: shinyPct,
      combinedPct: combinedPct,
      isCompleteRegular: regCaught === total && total > 0,
      isCompleteShiny: shinyCaught === total && total > 0,
      isCompleteMaster: regCaught === total && shinyCaught === total && total > 0,
    };
  }).filter(Boolean);

  // 8. POKÉ BALLS RANKED BREAKDOWN
  const ballCounts = {};
  allSubEntries.forEach(entry => {
    const ball = String(entry.ball || "").trim();
    if (!ball || ball === "none" || ball === "Unknown") return;
    if (!ballCounts[ball]) {
      ballCounts[ball] = { count: 0, regular: 0, shiny: 0 };
    }
    ballCounts[ball].count++;
    if (entry.isShiny) ballCounts[ball].shiny++;
    else ballCounts[ball].regular++;
  });

  const allBalls = Object.entries(ballCounts)
    .map(([ballName, data]) => {
      const hit = BALL_OPTIONS.find(o =>
        String(o.value).toLowerCase() === ballName.toLowerCase() ||
        String(o.name).toLowerCase() === ballName.toLowerCase()
      );
      return {
        name: hit ? hit.name : (ballName.endsWith(" Ball") ? ballName : `${ballName} Ball`),
        image: hit?.image || null,
        count: data.count,
        regular: data.regular,
        shiny: data.shiny,
        sharePct: allSubEntries.length ? Math.round((data.count / allSubEntries.length) * 100) : 0
      };
    })
    .sort((a, b) => b.count - a.count);

  // 7. MARKS & RIBBONS RANKED BREAKDOWN
  const markCounts = {};
  allSubEntries.forEach(entry => {
    const markList = (Array.isArray(entry.marks) && entry.marks.length > 0)
      ? entry.marks
      : (entry.mark && entry.mark !== "none" && entry.mark !== "Unknown" && entry.mark !== "unknown" ? [entry.mark] : []);
    markList.forEach(rawMark => {
      const mark = String(rawMark || "").trim();
      if (!mark || mark === "none" || mark === "Unknown" || mark === "unknown") return;
      if (!markCounts[mark]) {
        markCounts[mark] = { count: 0, regular: 0, shiny: 0 };
      }
      markCounts[mark].count++;
      if (entry.isShiny) markCounts[mark].shiny++;
      else markCounts[mark].regular++;
    });
  });

  const allMarks = Object.entries(markCounts)
    .map(([markVal, data]) => {
      const hit = MARK_OPTIONS.find(o =>
        String(o.value).toLowerCase() === markVal.toLowerCase() ||
        String(o.name).toLowerCase() === markVal.toLowerCase()
      );
      return {
        name: hit ? hit.name : toTitle(markVal) + " Mark",
        image: hit?.image || null,
        count: data.count,
        regular: data.regular,
        shiny: data.shiny,
      };
    })
    .sort((a, b) => b.count - a.count);

  // 8. GAMES RANKED BREAKDOWN
  const gameCounts = {};
  allSubEntries.forEach(entry => {
    const game = String(entry.game || "").trim();
    if (!game || game === "none" || game === "Unknown") return;
    if (!gameCounts[game]) {
      gameCounts[game] = { count: 0, regular: 0, shiny: 0 };
    }
    gameCounts[game].count++;
    if (entry.isShiny) gameCounts[game].shiny++;
    else gameCounts[game].regular++;
  });

  const allGames = Object.entries(gameCounts)
    .map(([gameVal, data]) => {
      const hit = GAME_OPTIONS_TWO.find(o =>
        String(o.value).toLowerCase() === gameVal.toLowerCase() ||
        String(o.name).toLowerCase() === gameVal.toLowerCase()
      );
      return {
        name: hit ? hit.name : gameVal,
        image: hit?.image || null,
        count: data.count,
        regular: data.regular,
        shiny: data.shiny,
        sharePct: allSubEntries.length ? Math.round((data.count / allSubEntries.length) * 100) : 0
      };
    })
    .sort((a, b) => b.count - a.count);

  // 9. HUNT METHODS RANKED BREAKDOWN
  const methodCounts = {};
  allSubEntries.forEach(entry => {
    const method = String(entry.method || "").trim();
    if (!method || method === "none" || method === "Unknown") return;
    if (!methodCounts[method]) {
      methodCounts[method] = { count: 0, regular: 0, shiny: 0 };
    }
    methodCounts[method].count++;
    if (entry.isShiny) methodCounts[method].shiny++;
    else methodCounts[method].regular++;
  });

  const allMethods = Object.entries(methodCounts)
    .map(([name, data]) => ({
      name: name,
      count: data.count,
      regular: data.regular,
      shiny: data.shiny,
      sharePct: allSubEntries.length ? Math.round((data.count / allSubEntries.length) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // 10. GENDER RATIOS
  let maleCount = 0;
  let femaleCount = 0;
  let genderlessCount = 0;
  allSubEntries.forEach(entry => {
    const g = String(entry.gender || "").toLowerCase();
    if (g === "male" || g === "m") maleCount++;
    else if (g === "female" || g === "f") femaleCount++;
    else if (g === "genderless" || g === "none") genderlessCount++;
  });

  // Top Highlights
  const topBall = allBalls[0] || null;
  const topGame = allGames[0] || null;
  const topMark = allMarks[0] || null;
  const topMethod = allMethods[0] || null;

  return {
    overview: {
      totalRegularCaught,
      totalTrackableRegular,
      overallRegularPct,
      totalShinyCaught,
      totalTrackableShiny,
      overallShinyPct,
      totalCombinedCaught,
      totalCombinedPossible,
      overallCombinedPct,
      totalLoggedCatches: allSubEntries.length,
      uniqueBallsCount: allBalls.length,
      uniqueMarksCount: allMarks.length,
      uniqueGamesCount: allGames.length,
      uniqueMethodsCount: allMethods.length,
    },
    topHighlights: {
      topBall,
      topGame,
      topMark,
      topMethod,
    },
    heroSprites: {
      mewtwo: getSpriteUrl(mainDex.find(p => p.id === 150), true, useHomeSprites),
      rayquaza: getSpriteUrl(mainDex.find(p => p.id === 384), true, useHomeSprites)
    },
    generations,
    specialCategories,
    categories,
    types,
    allBalls,
    allMarks,
    allGames,
    allMethods,
    genderStats: {
      male: maleCount,
      female: femaleCount,
      genderless: genderlessCount,
      total: maleCount + femaleCount + genderlessCount
    }
  };
}

export function calculateHuntStats(completedHunts = [], caughtMap = {}) {
  const rawHunts = Array.isArray(completedHunts) ? [...completedHunts] : [];
  const hunts = [];

  // Helper to normalize any hunt entry into uniform schema
  const normalizeHuntEntry = (h, fallbackKey = "") => {
    if (!h) return null;
    const mon = resolvePokemon(h) || (typeof h.pokemon === "object" ? h.pokemon : null);
    const pokemonName = mon?.name || cleanPokemonNameOrKey(h.pokemonName || h.targetPokemon || h.target || h.name || fallbackKey) || "Unknown";
    const checks = Number(h.totalChecks ?? h.checks ?? h.phaseChecks ?? h.count ?? h.rolls ?? 0) || 0;
    const rawTime = h.elapsedMs ?? h.time ?? h.totalTime ?? 0;
    const timeMs = Number(rawTime > 0 && rawTime < 100000 && !h.elapsedMs ? rawTime * 1000 : rawTime) || 0;
    const timestamp = Number(h.timestamp) || (h.date ? new Date(h.date).getTime() : 0);
    const dateStr = h.date || (timestamp ? new Date(timestamp).toISOString().split("T")[0] : "");

    let game = h.game || "";
    if (game === "PLA" || game === "Legends: Arceus" || game === "Pokemon Legends Arceus") game = "Legends Arceus";
    if (game === "SV" || game === "Scarlet & Violet" || game === "Scarlet/Violet") game = "Scarlet";
    if (game === "SwSh" || game === "Sword & Shield" || game === "Sword/Shield") game = "Sword";
    if (game === "BDSP" || game === "Brilliant Diamond & Shining Pearl") game = "Brilliant Diamond";

    let method = h.method || "";
    if (method === "MMO" || method === "Massive Mass Outbreak" || method === "Massive Mass Outbreaks") {
      method = game === "Legends Arceus" && h.isPermutation ? "Permutations" : "Massive Mass Outbreaks";
    }
    if (method === "Encounters") method = "Random Encounters";
    if (method === "Masuda") method = "Masuda Method";
    if (method === "Egg Hatching") method = "Breeding";

    const odds = Number(h.odds) || (game && method ? calculateOdds(game, method, h.modifiers || {}) : 4096) || 4096;
    const phaseList = Array.isArray(h.phases) ? h.phases : [];
    const phaseCount = Number(h.phaseCount) || (phaseList.length ? phaseList.length + 1 : 1);
    const isFail = h.outcome === "failed" || !!h.isFail;

    return {
      ...h,
      id: h.id || h.entryId || `${dateStr}-${checks}-${game}`,
      entryId: h.entryId || h.id || `${dateStr}-${checks}-${game}`,
      pokemon: mon,
      pokemonName,
      checks,
      totalChecks: checks,
      time: timeMs,
      elapsedMs: timeMs,
      odds,
      game,
      method,
      phaseCount,
      phases: phaseList,
      fails: Array.isArray(h.fails) ? h.fails : [],
      outcome: isFail ? "failed" : "caught",
      isFail,
      timestamp,
      date: dateStr
    };
  };

  // Filter out corrupted/unrelated non-hunt entries that may have been stored in legacy caches
  const isActualHunt = (h) => {
    if (!h) return false;
    if (h.isHuntTracker || h.isCounter || h.isHunt || h.source === "completedHunts" || h.source === "completedFails") return true;
    if (h.outcome === "failed" || h.isFail) return true;
    if (Array.isArray(h.phases) && h.phases.length > 0) return true;
    if (Array.isArray(h.fails) && h.fails.length > 0) return true;
    // If it has actual count or time with a method/game
    if ((Number(h.totalChecks || h.checks || 0) > 0 || Number(h.elapsedMs || h.time || 0) > 0) && (h.method || h.game)) return true;
    // If it's a caughtMap harvested item without isHuntTracker, ignore it
    if (h.caughtKey && !h.isHuntTracker) return false;
    return false;
  };

  rawHunts.forEach(h => {
    if (isActualHunt(h)) {
      const normalized = normalizeHuntEntry(h);
      if (normalized) hunts.push(normalized);
    }
  });

  // Harvest any hunt entries from caughtMap that might not be in completedHunts
  if (caughtMap && typeof caughtMap === "object") {
    Object.entries(caughtMap).forEach(([caughtKey, info]) => {
      if (info && Array.isArray(info.entries)) {
        info.entries.forEach(entry => {
          const isHuntEntry = Boolean(
            entry.isHuntTracker ||
            entry.isCounter ||
            entry.isHunt ||
            entry.source === "completedHunts" ||
            entry.source === "completedFails"
          );

          if (isHuntEntry) {
            const entryId = entry.entryId || entry.id;
            const alreadyExists = hunts.some(h =>
              (entryId && (h.entryId === entryId || h.id === entryId)) ||
              (h.caughtKey === caughtKey && h.date === entry.date && (h.totalChecks === entry.totalChecks || h.checks === entry.checks))
            );
            if (!alreadyExists) {
              const normalized = normalizeHuntEntry({ ...entry, caughtKey, isHuntTracker: true, addedToLivingDex: true }, caughtKey);
              if (normalized) hunts.push(normalized);
            }
          }
        });
      }
    });
  }

  // Collect all fails from caughtMap and hunt entries
  const failsList = [];

  const addFailItem = (f, defaultMonName, defaultMon) => {
    if (!f) return;

    const cleanMonName = f.pokemonName || f.pokemon?.name || (typeof f.pokemon === "string" ? f.pokemon : "") || defaultMonName || "";
    const pObj = f.pokemon || defaultMon || (cleanMonName ? { name: cleanMonName } : null);
    const checks = Number(f.totalChecks ?? f.checks ?? f.phaseChecks ?? 0) || 0;
    const rawTime = f.elapsedMs ?? f.time ?? 0;
    const timeMs = Number(rawTime > 0 && rawTime < 100000 && !f.elapsedMs ? rawTime * 1000 : rawTime) || 0;
    const timestamp = Number(f.timestamp) || (f.date ? new Date(f.date).getTime() : 0);
    const dateStr = f.date || (timestamp ? new Date(timestamp).toISOString().split("T")[0] : "");
    const entryId = f.entryId || f.id || null;

    let game = f.game || "";
    if (game === "PLA" || game === "Legends: Arceus" || game === "Pokemon Legends Arceus") game = "Legends Arceus";
    if (game === "SV" || game === "Scarlet & Violet" || game === "Scarlet/Violet") game = "Scarlet";
    if (game === "SwSh" || game === "Sword & Shield" || game === "Sword/Shield") game = "Sword";
    if (game === "BDSP" || game === "Brilliant Diamond & Shining Pearl") game = "Brilliant Diamond";

    let method = f.method || "";
    if (method === "MMO" || method === "Massive Mass Outbreak" || method === "Massive Mass Outbreaks") {
      method = game === "Legends Arceus" && f.isPermutation ? "Permutations" : "Massive Mass Outbreaks";
    }
    if (method === "Encounters") method = "Random Encounters";
    if (method === "Masuda") method = "Masuda Method";
    if (method === "Egg Hatching") method = "Breeding";

    // Check if already in failsList
    const isDuplicate = failsList.some(existing => {
      // 1. Match by entryId or id
      if (entryId && existing.entryId && entryId === existing.entryId) return true;
      if (f.id && existing.id && f.id === existing.id) return true;

      // 2. Semantic matching: same pokemon + same game + same checks
      const sameMon = cleanMonName.toLowerCase() === (existing.pokemonName || "").toLowerCase();
      const sameGame = game.toLowerCase() === (existing.game || "").toLowerCase();
      const sameChecks = checks === (Number(existing.totalChecks || existing.checks) || 0);

      if (sameMon && sameGame && sameChecks) {
        const existingDate = (existing.date || "").split("T")[0];
        const newDate = dateStr.split("T")[0];
        if (existingDate && newDate && existingDate === newDate) return true;

        const timeDiff = Math.abs((timestamp || 0) - (existing.timestamp || 0));
        if (timestamp > 0 && existing.timestamp > 0 && timeDiff < 1000 * 60 * 60 * 24) {
          return true;
        }
      }
      return false;
    });

    if (isDuplicate) return;

    failsList.push({
      ...f,
      id: entryId || `${dateStr}-${checks}-${game}`,
      entryId: entryId || `${dateStr}-${checks}-${game}`,
      pokemonName: cleanMonName,
      pokemon: pObj,
      checks,
      totalChecks: checks,
      time: timeMs,
      elapsedMs: timeMs,
      game,
      method,
      timestamp,
      date: dateStr,
      reason: f.reason || f.notes || "Failed Encounter",
      outcome: "failed",
      isFail: true
    });
  };

  if (caughtMap && typeof caughtMap === "object") {
    Object.entries(caughtMap).forEach(([caughtKey, info]) => {
      if (info && Array.isArray(info.fails)) {
        const cleanKey = caughtKey.replace(/:shiny$|-shiny$/, "");
        info.fails.forEach(f => addFailItem(f, f.pokemonName || f.pokemon?.name || cleanKey, f.pokemon || null));
      }
    });
  }

  hunts.forEach(h => {
    if (h.outcome === "failed" || h.isFail) {
      addFailItem(h, h.pokemonName, h.pokemon);
      return;
    }
    if (Array.isArray(h.fails)) {
      h.fails.forEach(f => addFailItem(f, h.pokemonName, h.pokemon));
    }
    if (Array.isArray(h.phases)) {
      h.phases.forEach(p => {
        if (p.outcome === "failed" || p.isFail) {
          addFailItem(p, p.pokemonName || p.pokemon?.name || h.pokemonName || h.pokemon?.name, p.pokemon || h.pokemon);
        }
      });
    }
  });

  const successfulHunts = hunts.filter(h => h.outcome !== "failed" && !h.isFail);
  const totalFails = failsList.length;

  if (successfulHunts.length === 0 && totalFails === 0) {
    return null;
  }

  let totalChecks = 0;
  let totalTimeMs = 0;
  let totalPhases = 0;
  let fastestChecksHunt = null;
  let longestChecksHunt = null;
  let fastestTimeHunt = null;
  let longestTimeHunt = null;
  let mostPhasesHunt = null;
  let luckiestHunt = null;
  let toughestHunt = null;

  const methodMap = {};
  const gameMap = {};

  successfulHunts.forEach(h => {
    const checks = Number(h.totalChecks || h.checks) || 0;
    const timeMs = Number(h.elapsedMs || h.time) || 0;
    const phaseList = Array.isArray(h.phases) ? h.phases : [];
    const phaseCount = Number(h.phaseCount) || (phaseList.length + 1) || 1;
    const odds = Number(h.odds) || calculateOdds(h.game, h.method, h.modifiers || {}) || 4096;
    h.odds = odds;

    totalChecks += checks;
    totalTimeMs += timeMs;
    totalPhases += (phaseCount - 1); // count of extra phase shinies

    // Fastest Hunt (Fewest checks)
    if (checks > 0) {
      const fastChecks = Number(fastestChecksHunt?.totalChecks || fastestChecksHunt?.checks) || Infinity;
      if (!fastestChecksHunt || checks < fastChecks) {
        fastestChecksHunt = h;
      }
      // Longest Hunt (Most checks)
      const longChecks = Number(longestChecksHunt?.totalChecks || longestChecksHunt?.checks) || 0;
      if (!longestChecksHunt || checks > longChecks) {
        longestChecksHunt = h;
      }
    }

    // Fastest Time (lowest elapsed time > 0)
    if (timeMs > 0) {
      const fastestTime = Number(fastestTimeHunt?.elapsedMs || fastestTimeHunt?.time) || Infinity;
      if (!fastestTimeHunt || timeMs < fastestTime) {
        fastestTimeHunt = h;
      }
      // Longest Time (highest elapsed time)
      const longestTime = Number(longestTimeHunt?.elapsedMs || longestTimeHunt?.time) || 0;
      if (!longestTimeHunt || timeMs > longestTime) {
        longestTimeHunt = h;
      }
    }

    // Most Phases Record
    const curPhases = phaseCount;
    const recordPhases = Number(mostPhasesHunt?.phaseCount) || (mostPhasesHunt?.phases?.length ? mostPhasesHunt.phases.length + 1 : 1);
    if (!mostPhasesHunt || curPhases > recordPhases) {
      if (curPhases > 1) {
        mostPhasesHunt = h;
      }
    }

    // Luckiest Hunt (Lowest % of odds or ratio of checks/odds)
    if (odds > 0 && checks > 0) {
      const ratio = checks / odds;
      const luckyRatio = luckiestHunt ? ((Number(luckiestHunt.totalChecks || luckiestHunt.checks) || 0) / (Number(luckiestHunt.odds) || 1)) : Infinity;
      if (ratio < luckyRatio) {
        luckiestHunt = { ...h, oddsRatio: ratio, pctOfOdds: Math.round(ratio * 100) };
      }

      // Toughest Hunt (Highest multiple of odds)
      const toughRatio = toughestHunt ? ((Number(toughestHunt.totalChecks || toughestHunt.checks) || 0) / (Number(toughestHunt.odds) || 1)) : 0;
      if (ratio > toughRatio && ratio >= 1) {
        toughestHunt = { ...h, oddsRatio: ratio, multipleOfOdds: (checks / odds).toFixed(1) };
      }
    }

    // Method breakdown
    const method = h.method || "Standard Encounter";
    if (!methodMap[method]) {
      methodMap[method] = { method, count: 0, totalChecks: 0, totalTimeMs: 0 };
    }
    methodMap[method].count += 1;
    methodMap[method].totalChecks += checks;
    methodMap[method].totalTimeMs += timeMs;

    // Game breakdown
    const game = h.game || "Unknown Game";
    if (!gameMap[game]) {
      gameMap[game] = { game, count: 0, totalChecks: 0, totalTimeMs: 0 };
    }
    gameMap[game].count += 1;
    gameMap[game].totalChecks += checks;
    gameMap[game].totalTimeMs += timeMs;
  });

  const totalHunts = successfulHunts.length;
  const avgChecks = totalHunts > 0 ? Math.round(totalChecks / totalHunts) : 0;
  const avgTimeMs = totalHunts > 0 ? Math.round(totalTimeMs / totalHunts) : 0;

  const totalEncounters = totalHunts + totalFails;
  const successRate = totalEncounters > 0 ? Number(((totalHunts / totalEncounters) * 100).toFixed(1)) : 100;
  const failRate = totalEncounters > 0 ? Number(((totalFails / totalEncounters) * 100).toFixed(1)) : 0;

  const methodBreakdown = Object.values(methodMap)
    .map(m => ({
      ...m,
      avgChecks: Math.round(m.totalChecks / m.count),
      avgTimeMs: Math.round(m.totalTimeMs / m.count),
    }))
    .sort((a, b) => b.count - a.count);

  const gameBreakdown = Object.values(gameMap)
    .map(g => ({
      ...g,
      avgChecks: Math.round(g.totalChecks / g.count),
      avgTimeMs: Math.round(g.totalTimeMs / g.count),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalHunts,
    totalChecks,
    totalTimeMs,
    avgChecks,
    avgTimeMs,
    totalPhases,
    totalFails,
    totalEncounters,
    successRate,
    failRate,
    records: {
      fastestChecks: fastestChecksHunt,
      longestChecks: longestChecksHunt,
      fastestTime: fastestTimeHunt,
      longestTime: longestTimeHunt,
      mostPhases: mostPhasesHunt,
      luckiest: luckiestHunt,
      toughest: toughestHunt,
    },
    methodBreakdown,
    gameBreakdown,
    huntsList: successfulHunts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
    failsList: failsList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
  };
}
