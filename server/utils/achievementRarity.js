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
const hisuianForms = require("../../src/data/forms/hisuian.json");
const alolanForms = require("../../src/data/forms/alolan.json");
const paldeanForms = require("../../src/data/forms/paldean.json");
const genderForms = require("../../src/data/forms/gender.json");
const vivillonForms = require("../../src/data/forms/vivillon.json");

const ALL_FORMS_LIST_SERVER = [
  ...(Array.isArray(genderForms) ? genderForms : []),
  ...(Array.isArray(alolanForms) ? alolanForms : []),
  ...(Array.isArray(galarianForms) ? galarianForms : []),
  ...(Array.isArray(hisuianForms) ? hisuianForms : []),
  ...(Array.isArray(paldeanForms) ? paldeanForms : []),
  ...(Array.isArray(gmaxForms) ? gmaxForms : []),
  ...(Array.isArray(unownForms) ? unownForms : []),
  ...(Array.isArray(otherForms) ? otherForms : []),
  ...(Array.isArray(alcremieForms) ? alcremieForms : []),
  ...(Array.isArray(vivillonForms) ? vivillonForms : []),
  ...(Array.isArray(alphaForms) ? alphaForms : []),
  ...(Array.isArray(alphaotherForms) ? alphaotherForms : []),
  ...(Array.isArray(mightyForms) ? mightyForms : []),
];

const UNOBTAINABLE_SHINY_DEX_NUMBERS_SERVER = [
  "0494", "0719", "0720", "0721", "0789", "0790", "0801", "0802",
  "0891", "0892", "0893", "0896", "0897", "0898", "1007", "1008",
  "1009", "1010", "1014", "1015", "1016", "1017", "1020", "1021",
  "1022", "1023", "1024", "1025"
];
const UNOBTAINABLE_SHINY_FORM_NAMES_SERVER = [
  "vivillon-pokeball", "floette-eternal", "origin-ball-dialga-483", "origin-ball-palkia-484",
  "pikachu-original-cap", "pikachu-kalos-cap", "pikachu-sinnoh-cap", "pikachu-unova-cap",
  "pikachu-world-cap", "pikachu-alola-cap", "pikachu-hoenn-cap",
  "pikachu-original-cap-0025", "pikachu-kalos-cap-0025", "pikachu-sinnoh-cap-0025",
  "pikachu-unova-cap-0025", "pikachu-world-cap-0025", "pikachu-alola-cap-0025", "pikachu-hoenn-cap-0025"
];

function isUnobtainableShinyServer(p) {
  if (!p) return false;
  if (p.formType === 'mighty') return true;
  if (p.stableId === 'origin-ball-dialga-483' || p.stableId === 'origin-ball-palkia-484' || p.stableId?.startsWith('origin-ball-') || p.name?.startsWith('origin-ball-')) return true;
  const name = (p.name || '').toLowerCase();
  const sId = (p.stableId || '').toLowerCase();
  if (name !== 'pikachu-partner-cap' && sId !== 'pikachu-partner-cap-0025') {
    if (name.endsWith('-cap') || sId.includes('-cap-')) return true;
  }
  const padId = String(p.id).padStart(4, '0');
  if (UNOBTAINABLE_SHINY_DEX_NUMBERS_SERVER.includes(padId)) return true;
  if (UNOBTAINABLE_SHINY_FORM_NAMES_SERVER.includes(name) || UNOBTAINABLE_SHINY_FORM_NAMES_SERVER.includes(sId)) return true;
  return false;
}

function getTotalTrackerPokemonCountServer() {
  const regularBaseCount = Array.isArray(pokemonData) ? pokemonData.length : 0;
  const regularFormsCount = ALL_FORMS_LIST_SERVER.length;
  const regularCount = regularBaseCount + regularFormsCount;

  const shinyBaseCount = Array.isArray(pokemonData) ? pokemonData.filter(p => !isUnobtainableShinyServer(p)).length : 0;
  const shinyFormsCount = ALL_FORMS_LIST_SERVER.filter(f => !isUnobtainableShinyServer(f)).length;
  const shinyCount = shinyBaseCount + shinyFormsCount;

  return regularCount + shinyCount;
}

const TOTAL_TRACKER_POKEMON_COUNT_SERVER = getTotalTrackerPokemonCountServer();

// Category lists
const REGIONAL_FORMS_LIST = [
  ...(Array.isArray(alolanForms) ? alolanForms : []),
  ...(Array.isArray(galarianForms) ? galarianForms : []),
  ...(Array.isArray(hisuianForms) ? hisuianForms : []),
  ...(Array.isArray(paldeanForms) ? paldeanForms : [])
];
const REGIONAL_SHINY_LOCKED_NAMES = new Set([
  'articuno-galar',
  'zapdos-galar',
  'moltres-galar'
]);
const SPECIAL_BALLS_SET = new Set([
  'dream ball', 'fast ball', 'friend ball', 'heavy ball',
  'level ball', 'love ball', 'lure ball', 'moon ball',
  'safari ball', 'sport ball', 'luxury ball', 'dive ball',
  'nest ball', 'net ball', 'repeat ball', 'timer ball'
]);
function normalizeSpecialBallServer(rawBall) {
  if (!rawBall || typeof rawBall !== 'string') return null;
  const clean = rawBall.toLowerCase().trim().replace(/[-_]/g, ' ');
  const withoutBall = clean.replace(/\s*ball\s*$/, '').trim();
  const withBall = `${withoutBall} ball`;

  if (SPECIAL_BALLS_SET.has(clean)) return clean;
  if (SPECIAL_BALLS_SET.has(withBall)) return withBall;
  return null;
}
const GENDER_FORMS_LIST = Array.isArray(genderForms) ? genderForms : [];
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

const PSEUDO_LEGENDARY_LIST = [
  ...pokemonData.filter(p => [149, 248, 373, 376, 445, 635, 706, 784, 887, 998].includes(p.id)),
  ...(Array.isArray(hisuianForms) ? hisuianForms.filter(f => f.name === 'goodra-hisui' || f.stableId === 'goodra-hisui-0706') : [])
];

const STARTER_BASE_IDS = new Set([
  1, 4, 7,
  152, 155, 158,
  252, 255, 258,
  387, 390, 393,
  495, 498, 501,
  650, 653, 656,
  722, 725, 728,
  810, 813, 816,
  906, 909, 912
]);

const STARTER_POKEMON_LIST = pokemonData.filter(p => STARTER_BASE_IDS.has(Number(p.id)));

const FOSSIL_BASE_IDS = new Set([
  138, 140, 142,
  345, 347,
  408, 410,
  564, 566,
  696, 698,
  880, 881, 882, 883
]);
const FOSSIL_POKEMON_LIST = pokemonData.filter(p => FOSSIL_BASE_IDS.has(Number(p.id)));

const BABY_BASE_IDS = new Set([
  172, 173, 174, 175,
  236, 238, 239, 240,
  298, 360,
  406, 433, 438, 439, 440, 446, 447, 458,
  848
]);
const BABY_POKEMON_LIST = pokemonData.filter(p => BABY_BASE_IDS.has(Number(p.id)));

const PARADOX_BASE_IDS = new Set([
  984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 995,
  1005, 1006, 1007, 1008, 1009, 1010,
  1020, 1021, 1022, 1023
]);
const PARADOX_POKEMON_LIST = pokemonData.filter(p => PARADOX_BASE_IDS.has(Number(p.id)));

const UNOBTAINABLE_SHINY_DEX_NUMBERS = [
  "0494", "0719", "0720", "0721", "0789", "0790", "0801", "0802",
  "0891", "0892", "0893", "0896", "0897", "0898", "1007", "1008", "1009", "1010",
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
  'gotta-catch-em-all', 'master-collector', 'living-legends', 'dual-mastery',
  'mythical-pursuit', 'mythical-enigma',
  'master-of-legends', 'titan-slayer',
  'otherworldly-beasts', 'extradimensional-encounter',
  'past-and-future', 'anomalies-of-time',
  'near-legendary', 'draconic-nobility',
  'where-it-all-began', 'first-partner-hall-of-fame',
  'paleontologist',
  'small-beginnings', 'daycare-maestro',
  'sweet-perfection', 'patisserie-chef',
  'ancient-alphabet', 'apex-predator',
  'gigantic-potential', 'gigantamax-phenom',
  'across-the-regions', 'global-phenotype',
  'mightiest-of-them-all', 'mighty-champion',
  'ladies-first', 'dimorphic-discovery',
  'relentless-hunter',
  'one-more-encounter', 'roll-the-dice',
  'patience-of-a-saint', 'blessed-by-arceus', 'phase-veteran',
  'marathon-runner',
  'redemption-arc', 'phoenix-feather',
  'ball-connoisseur', 'apriball-artisan',
  'beast-ballin', 'beast-tamer',
  'premier-club', 'ancient-craft', 'mark-collector',
  'bingo', 'bingo-sheet',
  'pokeveteran', 'charter-member',
  'dex-supporter', 'dex-patron',
  'popular-trainer',
  'among-the-elite', 'hall-of-fame-inductee',
  'arceus-chosen', 'sub-1-percent-miracle',
  '1-8192-logo', 'one-in-8192'
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
  // 1. Master Collector (formerly Living Legends)
  const masterCollectorDiamond = isShiny ? 997 : 1025;
  res['master-collector'] = res['living-legends'] = {
    bronze: dexCount >= 100,
    silver: dexCount >= 300,
    gold: dexCount >= 600,
    diamond: dexCount >= masterCollectorDiamond
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
  // 2. Sweet Perfection (formerly Patisserie Chef)
  res['sweet-perfection'] = res['patisserie-chef'] = {
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
  // 5. Gigantic Potential (formerly Gigantamax Phenom)
  res['gigantic-potential'] = res['gigantamax-phenom'] = {
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
  // 6. Mightiest of Them All (formerly Mighty Champion)
  res['mightiest-of-them-all'] = res['mighty-champion'] = {
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
  // 7. Mythical Pursuit (formerly Mythical Enigma)
  res['mythical-pursuit'] = res['mythical-enigma'] = {
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
  // 8. Master of Legends (formerly Titan Slayer)
  res['master-of-legends'] = res['titan-slayer'] = {
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
  // 9. Otherworldly Beasts (formerly Extradimensional Encounter)
  res['otherworldly-beasts'] = res['extradimensional-encounter'] = {
    bronze: ubCount >= 2,
    silver: ubCount >= 4,
    gold: ubCount >= 7,
    diamond: ubCount >= 11
  };

  // 10. Gotta Catch ’Em All!: All regular & obtainable shiny Pokemon & forms - Single Diamond Badge
  let totalCaught = 0;
  // Check regular base
  pokemonData.forEach(poke => {
    const stableKey = poke.stableId;
    const idKey = `${poke.id}`;
    const paddedIdKey = String(poke.id).padStart(4, '0');
    const nameKey = poke.name;
    const nameIdKey = `${poke.name}-${poke.id}`;
    if (
      isEntryCaught(caughtMap[stableKey]) ||
      isEntryCaught(caughtMap[idKey]) ||
      isEntryCaught(caughtMap[paddedIdKey]) ||
      isEntryCaught(caughtMap[nameKey]) ||
      isEntryCaught(caughtMap[nameIdKey])
    ) totalCaught++;
  });
  // Check regular forms
  ALL_FORMS_LIST_SERVER.forEach(form => {
    const stableKey = form.stableId;
    const nameKey = form.name;
    const formKey = form.formType ? `${form.name}_${form.formType}` : form.name;
    if (
      isEntryCaught(caughtMap[stableKey]) ||
      isEntryCaught(caughtMap[nameKey]) ||
      isEntryCaught(caughtMap[formKey])
    ) totalCaught++;
  });
  // Check shiny base (obtainable only)
  pokemonData.forEach(poke => {
    if (isUnobtainableShinyServer(poke)) return;
    const stableKey = `${poke.stableId}_shiny`;
    const idKey = `${poke.id}_shiny`;
    const paddedIdKey = `${String(poke.id).padStart(4, '0')}_shiny`;
    const nameKey = `${poke.name}_shiny`;
    const nameIdKey = `${poke.name}-${poke.id}_shiny`;
    if (
      isEntryCaught(caughtMap[stableKey]) ||
      isEntryCaught(caughtMap[idKey]) ||
      isEntryCaught(caughtMap[paddedIdKey]) ||
      isEntryCaught(caughtMap[nameKey]) ||
      isEntryCaught(caughtMap[nameIdKey])
    ) totalCaught++;
  });
  // Check shiny forms (obtainable only)
  ALL_FORMS_LIST_SERVER.forEach(form => {
    if (isUnobtainableShinyServer(form)) return;
    const stableKey = `${form.stableId}_shiny`;
    const nameKey = `${form.name}_shiny`;
    const formKey = form.formType ? `${form.name}_${form.formType}_shiny` : `${form.name}_shiny`;
    if (
      isEntryCaught(caughtMap[stableKey]) ||
      isEntryCaught(caughtMap[nameKey]) ||
      isEntryCaught(caughtMap[formKey])
    ) totalCaught++;
  });

  res['gotta-catch-em-all'] = {
    diamond: totalCaught >= TOTAL_TRACKER_POKEMON_COUNT_SERVER
  };

  // 11. Near Legendary (formerly Draconic Nobility): 11 Pseudo-Legendaries (Bronze: 2, Silver: 4, Gold: 7, Diamond: 11)
  let pseudoCount = 0;
  PSEUDO_LEGENDARY_LIST.forEach(poke => {
    if (poke.name === 'goodra-hisui' || poke.formType === 'hisuian') {
      const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
      const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
      const altKey = isShiny ? 'goodra-hisui-706_shiny' : 'goodra-hisui-706';
      if (
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[altKey])
      ) pseudoCount++;
      return;
    }
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
    ) pseudoCount++;
  });
  res['near-legendary'] = res['draconic-nobility'] = {
    bronze: pseudoCount >= 2,
    silver: pseudoCount >= 4,
    gold: pseudoCount >= 7,
    diamond: pseudoCount >= 11
  };

  // 12. Where It All Began (formerly First Partner Hall of Fame): 27 Starters (Bronze: 3, Silver: 8, Gold: 15, Diamond: 27)
  let starterCount = 0;
  STARTER_POKEMON_LIST.forEach(poke => {
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
    ) starterCount++;
  });
  res['where-it-all-began'] = res['first-partner-hall-of-fame'] = {
    bronze: starterCount >= 3,
    silver: starterCount >= 8,
    gold: starterCount >= 15,
    diamond: starterCount >= 27
  };

  // 13. Paleontologist: 15 Fossils (Bronze: 2, Silver: 5, Gold: 9, Diamond: 15)
  let fossilCount = 0;
  FOSSIL_POKEMON_LIST.forEach(poke => {
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
    ) fossilCount++;
  });
  res['paleontologist'] = {
    bronze: fossilCount >= 2,
    silver: fossilCount >= 5,
    gold: fossilCount >= 9,
    diamond: fossilCount >= 15
  };

  // 14. Small Beginnings (formerly Daycare Maestro): 19 Babies (Bronze: 2, Silver: 6, Gold: 11, Diamond: 19)
  let babyCount = 0;
  BABY_POKEMON_LIST.forEach(poke => {
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
    ) babyCount++;
  });
  res['small-beginnings'] = res['daycare-maestro'] = {
    bronze: babyCount >= 2,
    silver: babyCount >= 6,
    gold: babyCount >= 11,
    diamond: babyCount >= 19
  };

  // 15. Past & Future (formerly Anomalies of Time): 22 Paradox (Bronze: 3/2, Silver: 7/5, Gold: 13/9, Diamond: 22/14)
  const targetParadox = isShiny
    ? PARADOX_POKEMON_LIST.filter(p => !isUnobtainableShiny(p))
    : PARADOX_POKEMON_LIST;
  let paradoxCount = 0;
  targetParadox.forEach(poke => {
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
    ) paradoxCount++;
  });
  const parBThresh = isShiny ? 2 : 3;
  const parSThresh = isShiny ? 5 : 7;
  const parGThresh = isShiny ? 9 : 13;
  const parDThresh = isShiny ? 14 : 22;
  res['past-and-future'] = res['anomalies-of-time'] = {
    bronze: paradoxCount >= parBThresh,
    silver: paradoxCount >= parSThresh,
    gold: paradoxCount >= parGThresh,
    diamond: paradoxCount >= parDThresh
  };

  // 16. Ladies First (formerly Dimorphic Discovery): 103 Female Gender Forms (Bronze: 10, Silver: 30, Gold: 60, Diamond: 103)
  let genderCount = 0;
  GENDER_FORMS_LIST.forEach(poke => {
    const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
    const formKey = isShiny ? `${poke.name}_gender_shiny` : `${poke.name}_gender`;
    const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
    const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;
    if (
      isEntryCaught(caughtMap[stableKey]) ||
      isEntryCaught(caughtMap[formKey]) ||
      isEntryCaught(caughtMap[nameKey]) ||
      isEntryCaught(caughtMap[nameIdKey])
    ) genderCount++;
  });
  res['ladies-first'] = res['dimorphic-discovery'] = {
    bronze: genderCount >= 10,
    silver: genderCount >= 30,
    gold: genderCount >= 60,
    diamond: genderCount >= 103
  };

  // 17. Across the Regions (formerly Global Phenotype): 57 Regional Forms (54 for shiny due to locked Galarian birds)
  const targetRegional = isShiny
    ? REGIONAL_FORMS_LIST.filter(p => !REGIONAL_SHINY_LOCKED_NAMES.has(p.name) && !REGIONAL_SHINY_LOCKED_NAMES.has(p.stableId))
    : REGIONAL_FORMS_LIST;
  let regCount = 0;
  targetRegional.forEach(poke => {
    const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
    const formKey = isShiny ? `${poke.name}_${poke.formType}_shiny` : `${poke.name}_${poke.formType}`;
    const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
    const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;
    if (
      isEntryCaught(caughtMap[stableKey]) ||
      isEntryCaught(caughtMap[formKey]) ||
      isEntryCaught(caughtMap[nameKey]) ||
      isEntryCaught(caughtMap[nameIdKey])
    ) regCount++;
  });
  const regBThresh = 5;
  const regSThresh = isShiny ? 15 : 16;
  const regGThresh = isShiny ? 30 : 32;
  const regDThresh = isShiny ? 54 : 57;
  res['across-the-regions'] = res['global-phenotype'] = {
    bronze: regCount >= regBThresh,
    silver: regCount >= regSThresh,
    gold: regCount >= regGThresh,
    diamond: regCount >= regDThresh
  };

  // 18. Ball Connoisseur (formerly Apriball Artisan): 16 Special Ball types (Bronze: 3, Silver: 6, Gold: 10, Diamond: 16)
  const usedSpecialBalls = new Set();
  Object.entries(caughtMap || {}).forEach(([key, info]) => {
    if (!isEntryCaught(info)) return;
    const isEntryShiny = key.endsWith('_shiny') || Boolean(info?.isShiny);
    if (Array.isArray(info?.entries) && info.entries.length > 0) {
      info.entries.forEach(sub => {
        if (!sub || !sub.ball) return;
        const subShiny = sub.isShiny !== undefined ? Boolean(sub.isShiny) : isEntryShiny;
        if (subShiny === isShiny) {
          const matched = normalizeSpecialBallServer(sub.ball);
          if (matched) usedSpecialBalls.add(matched);
        }
      });
    } else if (info?.ball) {
      if (isEntryShiny === isShiny) {
        const matched = normalizeSpecialBallServer(info.ball);
        if (matched) usedSpecialBalls.add(matched);
      }
    }
  });
  const ballCount = usedSpecialBalls.size;
  res['ball-connoisseur'] = res['apriball-artisan'] = {
    bronze: ballCount >= 3,
    silver: ballCount >= 6,
    gold: ballCount >= 10,
    diamond: ballCount >= 16
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
