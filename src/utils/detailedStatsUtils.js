import pokemonData from "../data/pokemon.json";
import formsData from "./loadFormsData";
import { getCaughtKey } from "../caughtStorage";
import { GAME_OPTIONS_TWO, BALL_OPTIONS, MARK_OPTIONS } from "../Constants";
import { getFilteredFormsDataForProfile } from "./profileUtils";
import { getSpriteUrl } from "./spriteUtils";
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
    } else if (info.ball || info.mark || info.game || info.method || info.gender) {
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
    const markList = Array.isArray(entry.marks)
      ? entry.marks
      : (entry.mark ? [entry.mark] : []);
    markList.forEach(rawMark => {
      const mark = String(rawMark || "").trim();
      if (!mark || mark === "none" || mark === "Unknown") return;
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
