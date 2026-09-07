import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data files
const pokemonData = require("../../src/data/pokemon.json");
const alcremieForms = require("../../src/data/forms/alcremie.json");
const unownForms = require("../../src/data/forms/unown.json");
const alphaForms = require("../../src/data/forms/alpha.json");
const alphaotherForms = require("../../src/data/forms/alphaother.json");
const gmaxForms = require("../../src/data/forms/gmax.json");
const mightyForms = require("../../src/data/forms/mighty.json");
const otherForms = require("../../src/data/forms/other.json");
const galarianForms = require("../../src/data/forms/galarian.json");

// Category lists
const GMAX_FORMS_LIST = Array.isArray(gmaxForms) ? gmaxForms : [];
const MIGHTY_POKEMON_LIST = Array.isArray(mightyForms) ? mightyForms : [];
const ALCREMIE_FORMS_LIST = [
  pokemonData.find(p => p.id === 869),
  ...alcremieForms.filter(f => f.formType === 'alcremie')
].filter(Boolean);

const UNOWN_FORMS_LIST = [
  pokemonData.find(p => p.id === 201 && p.name === 'unown'),
  ...(Array.isArray(unownForms)
    ? unownForms.filter(f => f.formType === 'unown' && !f.name.endsWith('-alpha') && !f.stableId?.includes('-alpha'))
    : [])
].filter(Boolean);

const ALPHA_POKEMON_LIST = Array.from(
  new Map(
    [
      ...(Array.isArray(alphaForms) ? alphaForms : []),
      ...(Array.isArray(alphaotherForms) ? alphaotherForms : []),
      ...(Array.isArray(unownForms)
        ? unownForms.filter(f => f.name?.includes('alpha') || f.stableId?.includes('alpha') || f.formType === 'alpha')
        : [])
    ].map(p => [p.stableId || p.name, p])
  ).values()
);

const MYTHICAL_POKEMON_IDS = new Set([
  151, 251, 385, 386, 489, 490, 491, 492, 493, 494, 647, 648, 649,
  719, 720, 721, 801, 802, 807, 808, 809, 893, 1025
]);

function isMythical(poke) {
  if (!poke) return false;
  if (poke.isMythical === true) return true;
  if (MYTHICAL_POKEMON_IDS.has(Number(poke.id))) return true;
  return false;
}

const MYTHICAL_POKEMON_LIST = [
  ...pokemonData.filter(p => isMythical(p)),
  ...(Array.isArray(otherForms) ? otherForms.filter(f => isMythical(f)) : [])
];

const LEGENDARY_POKEMON_IDS = new Set([
  150, 249, 250, 382, 383, 384, 483, 484, 487, 643, 644, 646, 716, 717, 718,
  789, 790, 791, 792, 800, 888, 889, 890, 898, 1007, 1008, 1024
]);

const SUB_LEGENDARY_IDS = new Set([
  144, 145, 146, 243, 244, 245, 377, 378, 379, 380, 381, 480, 481, 482, 485,
  486, 488, 638, 639, 640, 641, 642, 645, 772, 773, 785, 786, 787, 788, 891,
  892, 894, 895, 896, 897, 905, 1001, 1002, 1003, 1004, 1014, 1015, 1016, 1017
]);

function isLegendaryOrSub(poke) {
  if (!poke) return false;
  const id = Number(poke.id);
  return LEGENDARY_POKEMON_IDS.has(id) || SUB_LEGENDARY_IDS.has(id);
}

const LEGENDARY_ACHIEVEMENT_LIST = [
  ...pokemonData.filter(p => isLegendaryOrSub(p)),
  ...(Array.isArray(galarianForms) ? galarianForms.filter(p => isLegendaryOrSub(p)) : []),
  ...(Array.isArray(otherForms) ? otherForms.filter(p => isLegendaryOrSub(p) && p.stableId !== 'origin-ball-dialga-483' && p.stableId !== 'origin-ball-palkia-484') : [])
];

const TITAN_SLAYER_SHINY_LOCKED_IDS = new Set([
  789, 790, 890, 891, 892, 896, 897, 898, 905,
  1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015, 1016, 1017, 1024
]);

const TITAN_SLAYER_SHINY_LOCKED_FORM_NAMES = new Set([
  'articuno-galar', 'zapdos-galar', 'moltres-galar', 'urshifu-rapid-strike', 'enamorus-therian'
]);

function isTitanSlayerShinyLocked(poke) {
  if (!poke) return false;
  if (TITAN_SLAYER_SHINY_LOCKED_IDS.has(Number(poke.id))) return true;
  if (poke.name && TITAN_SLAYER_SHINY_LOCKED_FORM_NAMES.has(poke.name)) return true;
  if (poke.stableId && TITAN_SLAYER_SHINY_LOCKED_FORM_NAMES.has(poke.stableId)) return true;
  return false;
}

const ULTRA_BEAST_IDS = new Set([
  793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806
]);

const ULTRA_BEASTS_LIST = pokemonData.filter(p => ULTRA_BEAST_IDS.has(Number(p.id)));

const UNOBTAINABLE_SHINY_DEX_NUMBERS = [
  "0494", "0719", "0720", "0721", "0789", "0790", "0801", "0802",
  "0891", "0892", "0893", "0896", "0897", "0898", "1009", "1010",
  "1014", "1015", "1016", "1017", "1020", "1021", "1022", "1023",
  "1024", "1025"
];

const UNOBTAINABLE_SHINY_FORM_NAMES = [
  "vivillon-pokeball",
  "floette-eternal",
  "origin-ball-dialga-483",
  "origin-ball-palkia-484"
];

function isUnobtainableShiny(poke) {
  if (!poke) return false;
  const padId = String(poke.id).padStart(4, '0');
  if (UNOBTAINABLE_SHINY_DEX_NUMBERS.includes(padId)) return true;
  if (poke.name && UNOBTAINABLE_SHINY_FORM_NAMES.includes(poke.name)) return true;
  return false;
}

const isEntryCaught = (info) => {
  if (!info) return false;
  if (info === true) return true;
  if (typeof info === 'object') {
    if (info.caught === false) return false;
    if (info.caught === true) return true;
    if (Array.isArray(info.entries) && info.entries.length > 0) return true;
    if (info.ball || info.game || info.method || info.mark || (Array.isArray(info.marks) && info.marks.length > 0)) return true;
  }
  return false;
};

export function formatRarityDisplay(count, eligibleTotal) {
  if (!eligibleTotal || count === 0) return '0%';
  const pct = (count / eligibleTotal) * 100;
  if (pct >= 10) return `${pct.toFixed(1)}%`;
  if (pct >= 1) return `${pct.toFixed(1)}%`;
  if (pct >= 0.1) return `${pct.toFixed(1)}%`;
  if (pct >= 0.01) return `${pct.toFixed(2)}%`;
  return `${Number(pct.toFixed(3))}%`;
}

// All known slugs and their default tiers
const ALL_ACHIEVEMENT_SLUGS = [
  'living-legends', 'dual-mastery', 'mythical-enigma', 'titan-slayer',
  'extradimensional-encounter', 'anomalies-of-time', 'draconic-nobility',
  'first-partner-hall-of-fame', 'paleontologist', 'daycare-maestro',
  'patisserie-chef', 'ancient-alphabet', 'apex-predator', 'gigantamax-phenom',
  'global-phenotype', 'mighty-champion', 'dimorphic-discovery', 'relentless-hunter',
  'roll-the-dice', 'patience-of-a-saint', 'blessed-by-arceus', 'phase-veteran',
  'marathon-runner', 'phoenix-feather', 'apriball-artisan', 'beast-tamer',
  'premier-club', 'ancient-craft', 'mark-collector', 'bingo-sheet',
  'charter-member', 'dex-patron', 'popular-trainer', 'hall-of-fame-inductee',
  'sub-1-percent-miracle', 'one-in-8192'
];

/**
 * Evaluates an eligible user's caught data for configured achievements
 */
function evaluateUserAchievements(caughtMap, isShiny = false) {
  const res = {};

  // 1. Living Legends: 1,025 Pokémon (Bronze: 100, Silver: 300, Gold: 600, Diamond: 1025)
  let dexCount = 0;
  pokemonData.forEach(poke => {
    const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
    const idKey = isShiny ? `${poke.id}_shiny` : `${poke.id}`;
    const paddedIdKey = isShiny ? `${String(poke.id).padStart(4, '0')}_shiny` : `${String(poke.id).padStart(4, '0')}`;
    const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
    const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;
    if (
      isEntryCaught(caughtMap[stableKey]) ||
      isEntryCaught(caughtMap[idKey]) ||
      isEntryCaught(caughtMap[paddedIdKey]) ||
      isEntryCaught(caughtMap[nameKey]) ||
      isEntryCaught(caughtMap[nameIdKey])
    ) dexCount++;
  });
  res['living-legends'] = {
    bronze: dexCount >= 100,
    silver: dexCount >= 300,
    gold: dexCount >= 600,
    diamond: dexCount >= 1025
  };

  // 2. Patisserie Chef: Alcremie (Bronze: 7, Silver: 21, Gold: 42, Diamond: 63)
  let alcremieCount = 0;
  ALCREMIE_FORMS_LIST.forEach(form => {
    const stableKey = isShiny ? `${form.stableId}_shiny` : form.stableId;
    const nameKey = isShiny ? `${form.name}_shiny` : form.name;
    const formKey = isShiny ? `${form.name}_alcremie_shiny` : `${form.name}_alcremie`;
    const numKey = isShiny ? `869_${form.name}_shiny` : `869_${form.name}`;
    if (
      isEntryCaught(caughtMap[stableKey]) ||
      isEntryCaught(caughtMap[nameKey]) ||
      isEntryCaught(caughtMap[formKey]) ||
      isEntryCaught(caughtMap[numKey])
    ) alcremieCount++;
  });
  res['patisserie-chef'] = {
    bronze: alcremieCount >= 7,
    silver: alcremieCount >= 21,
    gold: alcremieCount >= 42,
    diamond: alcremieCount >= 63
  };

  // 3. Ancient Alphabet: Unown (Bronze: 3, Silver: 8, Gold: 16, Diamond: 28)
  let unownCount = 0;
  UNOWN_FORMS_LIST.forEach(poke => {
    const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
    const idKey = isShiny ? `${poke.id}_shiny` : `${poke.id}`;
    const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
    const formKey = isShiny ? `${poke.name}_unown_shiny` : `${poke.name}_unown`;
    if (
      isEntryCaught(caughtMap[stableKey]) ||
      (poke.name === 'unown' && isEntryCaught(caughtMap[idKey])) ||
      isEntryCaught(caughtMap[nameKey]) ||
      isEntryCaught(caughtMap[formKey])
    ) unownCount++;
  });
  res['ancient-alphabet'] = {
    bronze: unownCount >= 3,
    silver: unownCount >= 8,
    gold: unownCount >= 16,
    diamond: unownCount >= 28
  };

  // 4. Apex Predator: Alphas (Bronze: 50, Silver: 150, Gold: 350, Diamond: 656)
  let alphaCount = 0;
  ALPHA_POKEMON_LIST.forEach(poke => {
    const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
    const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
    const formKey = isShiny ? `${poke.name}_${poke.formType}_shiny` : `${poke.name}_${poke.formType}`;
    if (
      isEntryCaught(caughtMap[stableKey]) ||
      isEntryCaught(caughtMap[nameKey]) ||
      isEntryCaught(caughtMap[formKey])
    ) alphaCount++;
  });
  res['apex-predator'] = {
    bronze: alphaCount >= 50,
    silver: alphaCount >= 150,
    gold: alphaCount >= 350,
    diamond: alphaCount >= 656
  };

  // 5. Gigantamax Phenom: G-Max (Bronze: 4, Silver: 10, Gold: 20, Diamond: 33 regular / 31 shiny)
  let gmaxCount = 0;
  const rawGmaxList = GMAX_FORMS_LIST;
  const gmaxList = isShiny ? rawGmaxList.filter(p => !isUnobtainableShiny(p)) : rawGmaxList;
  gmaxList.forEach(poke => {
    const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
    const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
    const formKey = isShiny ? `${poke.name}_gmax_shiny` : `${poke.name}_gmax`;
    if (
      isEntryCaught(caughtMap[stableKey]) ||
      isEntryCaught(caughtMap[nameKey]) ||
      isEntryCaught(caughtMap[formKey])
    ) gmaxCount++;
  });
  const gmaxDiamondThresh = isShiny ? 31 : 33;
  res['gigantamax-phenom'] = {
    bronze: gmaxCount >= 4,
    silver: gmaxCount >= 10,
    gold: gmaxCount >= 20,
    diamond: gmaxCount >= gmaxDiamondThresh
  };

  // 6. Mighty Champion: Mighty Mark (Bronze: 5, Silver: 15, Gold: 30, Diamond: 54)
  let mightyCount = 0;
  MIGHTY_POKEMON_LIST.forEach(poke => {
    const stableKey = poke.stableId;
    const nameKey = poke.name;
    const formKey = `${poke.name}_mighty`;
    if (
      isEntryCaught(caughtMap[stableKey]) ||
      isEntryCaught(caughtMap[nameKey]) ||
      isEntryCaught(caughtMap[formKey])
    ) mightyCount++;
  });
  res['mighty-champion'] = {
    bronze: mightyCount >= 5,
    silver: mightyCount >= 15,
    gold: mightyCount >= 30,
    diamond: mightyCount >= 54
  };

  // 7. Mythical Enigma: Mythicals (Bronze: 3, Silver: 8, Gold: 16, Diamond: 28 / scaled for shiny)
  const targetMythicals = isShiny ? MYTHICAL_POKEMON_LIST.filter(p => !isUnobtainableShiny(p)) : MYTHICAL_POKEMON_LIST;
  const mythTotal = targetMythicals.length || (isShiny ? 20 : 28);
  let mythCount = 0;
  targetMythicals.forEach(poke => {
    const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
    const idKey = isShiny ? `${poke.id}_shiny` : `${poke.id}`;
    const paddedIdKey = isShiny ? `${String(poke.id).padStart(4, '0')}_shiny` : `${String(poke.id).padStart(4, '0')}`;
    const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
    const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;
    const formKey = isShiny ? `${poke.name}_${poke.formType}_shiny` : `${poke.name}_${poke.formType}`;
    if (
      isEntryCaught(caughtMap[stableKey]) ||
      isEntryCaught(caughtMap[idKey]) ||
      isEntryCaught(caughtMap[paddedIdKey]) ||
      isEntryCaught(caughtMap[nameKey]) ||
      isEntryCaught(caughtMap[nameIdKey]) ||
      isEntryCaught(caughtMap[formKey])
    ) mythCount++;
  });
  const bThresh = isShiny ? Math.max(1, Math.round(3 * (mythTotal / 28))) : 3;
  const sThresh = isShiny ? Math.round(8 * (mythTotal / 28)) : 8;
  const gThresh = isShiny ? Math.round(16 * (mythTotal / 28)) : 16;
  res['mythical-enigma'] = {
    bronze: mythCount >= bThresh,
    silver: mythCount >= sThresh,
    gold: mythCount >= gThresh,
    diamond: mythCount >= mythTotal
  };

  // 8. Titan Slayer: Legendaries (Bronze: 8/5, Silver: 24/15, Gold: 45/30, Diamond: 80/55)
  const targetLegendaries = isShiny
    ? LEGENDARY_ACHIEVEMENT_LIST.filter(p => !isTitanSlayerShinyLocked(p))
    : LEGENDARY_ACHIEVEMENT_LIST;
  const legTotal = targetLegendaries.length || (isShiny ? 55 : 80);
  let legCount = 0;
  targetLegendaries.forEach(poke => {
    const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
    const idKey = isShiny ? `${poke.id}_shiny` : `${poke.id}`;
    const paddedIdKey = isShiny ? `${String(poke.id).padStart(4, '0')}_shiny` : `${String(poke.id).padStart(4, '0')}`;
    const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
    const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;
    const formKey = isShiny ? `${poke.name}_${poke.formType}_shiny` : `${poke.name}_${poke.formType}`;
    if (
      isEntryCaught(caughtMap[stableKey]) ||
      isEntryCaught(caughtMap[idKey]) ||
      isEntryCaught(caughtMap[paddedIdKey]) ||
      isEntryCaught(caughtMap[nameKey]) ||
      isEntryCaught(caughtMap[nameIdKey]) ||
      isEntryCaught(caughtMap[formKey])
    ) legCount++;
  });
  const legBThresh = isShiny ? 5 : 8;
  const legSThresh = isShiny ? 15 : 24;
  const legGThresh = isShiny ? 30 : 45;
  const legDThresh = isShiny ? 55 : 80;
  res['titan-slayer'] = {
    bronze: legCount >= legBThresh,
    silver: legCount >= legSThresh,
    gold: legCount >= legGThresh,
    diamond: legCount >= legDThresh
  };

  // 9. Extradimensional Encounter: Ultra Beasts (Bronze: 2, Silver: 4, Gold: 7, Diamond: 11)
  let ubCount = 0;
  ULTRA_BEASTS_LIST.forEach(poke => {
    const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
    const idKey = isShiny ? `${poke.id}_shiny` : `${poke.id}`;
    const paddedIdKey = isShiny ? `${String(poke.id).padStart(4, '0')}_shiny` : `${String(poke.id).padStart(4, '0')}`;
    const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
    const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;
    if (
      isEntryCaught(caughtMap[stableKey]) ||
      isEntryCaught(caughtMap[idKey]) ||
      isEntryCaught(caughtMap[paddedIdKey]) ||
      isEntryCaught(caughtMap[nameKey]) ||
      isEntryCaught(caughtMap[nameIdKey])
    ) ubCount++;
  });
  res['extradimensional-encounter'] = {
    bronze: ubCount >= 2,
    silver: ubCount >= 4,
    gold: ubCount >= 7,
    diamond: ubCount >= 11
  };

  return res;
}

// In-memory cache
let cachedRarity = null;
let cacheExpiresAt = 0;
let calculationPromise = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Calculates global badge rarity across all eligible accounts.
 * An eligible account is defined as an account that has registered at least 1 Pokémon.
 */
export async function getBadgeRarity(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && cachedRarity && now < cacheExpiresAt) {
    return cachedRarity;
  }

  // Single-flight lock: if another request is already computing, await it
  if (calculationPromise) {
    return calculationPromise;
  }

  calculationPromise = (async () => {
    try {
      // Find all users with >= 1 caught Pokemon
      const eligibleUsers = await User.find(
        {
          $expr: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: { $objectToArray: { $ifNull: ["$caughtPokemon", {}] } },
                    as: "c",
                    cond: {
                      $or: [
                        { $eq: ["$$c.v.caught", true] },
                        { $gt: [{ $size: { $ifNull: ["$$c.v.entries", []] } }, 0] },
                        { $ne: ["$$c.v", null] }
                      ]
                    }
                  }
                }
              },
              0
            ]
          }
        },
        { caughtPokemon: 1 }
      ).lean();

      const totalEligible = eligibleUsers.length;
      const regularTierCounts = {};
      const shinyTierCounts = {};

      const defaultTiers = ['bronze', 'silver', 'gold', 'diamond'];

      ALL_ACHIEVEMENT_SLUGS.forEach(slug => {
        regularTierCounts[slug] = { bronze: 0, silver: 0, gold: 0, diamond: 0 };
        shinyTierCounts[slug] = { bronze: 0, silver: 0, gold: 0, diamond: 0 };
      });

      // Iterate through each eligible user once and accumulate counts
      eligibleUsers.forEach(user => {
        const cMap = user.caughtPokemon || {};

        // Regular evaluation
        const regResults = evaluateUserAchievements(cMap, false);
        for (const [slug, tiers] of Object.entries(regResults)) {
          if (!regularTierCounts[slug]) {
            regularTierCounts[slug] = { bronze: 0, silver: 0, gold: 0, diamond: 0 };
          }
          for (const [tier, earned] of Object.entries(tiers)) {
            if (earned) regularTierCounts[slug][tier]++;
          }
        }

        // Shiny evaluation
        const shinyResults = evaluateUserAchievements(cMap, true);
        for (const [slug, tiers] of Object.entries(shinyResults)) {
          if (!shinyTierCounts[slug]) {
            shinyTierCounts[slug] = { bronze: 0, silver: 0, gold: 0, diamond: 0 };
          }
          for (const [tier, earned] of Object.entries(tiers)) {
            if (earned) shinyTierCounts[slug][tier]++;
          }
        }
      });

      // Assemble final rarity output
      const rarity = {};

      ALL_ACHIEVEMENT_SLUGS.forEach(slug => {
        rarity[slug] = {};
        const regCounts = regularTierCounts[slug] || {};
        defaultTiers.forEach(t => {
          const count = regCounts[t] || 0;
          const pct = totalEligible > 0 ? (count / totalEligible) * 100 : 0;
          rarity[slug][t] = {
            count,
            percentage: Number(pct.toFixed(2)),
            display: formatRarityDisplay(count, totalEligible)
          };
        });

        // Shiny variant tiers
        rarity[slug].shiny = {};
        const shCounts = shinyTierCounts[slug] || {};
        defaultTiers.forEach(t => {
          const count = shCounts[t] || 0;
          const pct = totalEligible > 0 ? (count / totalEligible) * 100 : 0;
          rarity[slug].shiny[t] = {
            count,
            percentage: Number(pct.toFixed(2)),
            display: formatRarityDisplay(count, totalEligible)
          };
        });
      });

      const responsePayload = {
        totalEligibleUsers: totalEligible,
        lastUpdated: Date.now(),
        rarity
      };

      cachedRarity = responsePayload;
      cacheExpiresAt = Date.now() + CACHE_TTL_MS;

      return responsePayload;
    } finally {
      calculationPromise = null;
    }
  })();

  return calculationPromise;
}
