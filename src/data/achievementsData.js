import pokemonData from './pokemon.json';
import alcremieForms from './forms/alcremie.json';
import otherForms from './forms/other.json';
import unownForms from './forms/unown.json';
import alphaForms from './forms/alpha.json';
import alphaotherForms from './forms/alphaother.json';
import gmaxForms from './forms/gmax.json';
import mightyForms from './forms/mighty.json';
import alolanForms from './forms/alolan.json';
import galarianForms from './forms/galarian.json';
import hisuianForms from './forms/hisuian.json';
import paldeanForms from './forms/paldean.json';
import genderForms from './forms/gender.json';
import vivillonForms from './forms/vivillon.json';
import { isStarter, isFossil, isBaby, isParadox, isMythical, isLegendary, isSubLegendary, isUltraBeast } from '../utils/pokemonCategories';
import {
  UNOBTAINABLE_SHINY_DEX_NUMBERS,
  UNOBTAINABLE_SHINY_FORM_NAMES
} from './blockedShinies';
import { isNonPartnerCapPikachu } from '../utils/pokemonAvailability';

/**
 * All Pokémon forms available on UltimateDexTracker
 */
export const ALL_FORMS_LIST = [
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

export function isUnobtainableShiny(poke) {
  if (!poke) return false;
  if (poke.formType === 'mighty') return true;
  if (
    poke.stableId === 'origin-ball-dialga-483' ||
    poke.stableId === 'origin-ball-palkia-484' ||
    poke.stableId?.startsWith('origin-ball-') ||
    poke.name?.startsWith('origin-ball-')
  ) return true;
  if (isNonPartnerCapPikachu(poke)) return true;

  const padId = String(poke.id).padStart(4, '0');
  if (UNOBTAINABLE_SHINY_DEX_NUMBERS.includes(padId)) {
    return true;
  }
  const name = (poke.name || '').toLowerCase();
  const sId = (poke.stableId || '').toLowerCase();
  if (UNOBTAINABLE_SHINY_FORM_NAMES.includes(name) || UNOBTAINABLE_SHINY_FORM_NAMES.includes(sId)) {
    return true;
  }
  return false;
}

export function isFormShinyLocked(p) {
  return isUnobtainableShiny(p);
}

/**
 * Dynamically computes the total number of regular + obtainable shiny Pokémon across the site
 */
export function getTotalTrackerPokemonCount() {
  const regularBaseCount = Array.isArray(pokemonData) ? pokemonData.length : 0;
  const regularFormsCount = ALL_FORMS_LIST.length;
  const regularCount = regularBaseCount + regularFormsCount;

  const shinyBaseCount = Array.isArray(pokemonData) ? pokemonData.filter(p => !isUnobtainableShiny(p)).length : 0;
  const shinyFormsCount = ALL_FORMS_LIST.filter(f => !isUnobtainableShiny(f)).length;
  const shinyCount = shinyBaseCount + shinyFormsCount;

  return regularCount + shinyCount;
}

export const TOTAL_TRACKER_POKEMON_COUNT = getTotalTrackerPokemonCount();

/**
 * 57 unique Regional Forms across Alola (18), Galar (19), Hisui (16), and Paldea (4)
 */
export const REGIONAL_FORMS_LIST = [
  ...(Array.isArray(alolanForms) ? alolanForms : []),
  ...(Array.isArray(galarianForms) ? galarianForms : []),
  ...(Array.isArray(hisuianForms) ? hisuianForms : []),
  ...(Array.isArray(paldeanForms) ? paldeanForms : [])
];

export const REGIONAL_SHINY_LOCKED_NAMES = new Set([
  'articuno-galar',
  'zapdos-galar',
  'moltres-galar'
]);

export function isRegionalShinyLocked(poke) {
  if (!poke) return false;
  return REGIONAL_SHINY_LOCKED_NAMES.has(poke.name) ||
         REGIONAL_SHINY_LOCKED_NAMES.has(poke.stableId) ||
         ((poke.id === 144 || poke.id === 145 || poke.id === 146) && (poke.formType === 'galarian' || poke.name?.includes('galar')));
}

/**
 * 16 eligible Special Balls for Ball Connoisseur
 */
export const SPECIAL_BALLS_LIST = [
  { name: 'Dream Ball', image: '/data/balls/dream-ball.png' },
  { name: 'Fast Ball', image: '/data/balls/fast-ball.png' },
  { name: 'Friend Ball', image: '/data/balls/friend-ball.png' },
  { name: 'Heavy Ball', image: '/data/balls/heavy-ball.png' },
  { name: 'Level Ball', image: '/data/balls/level-ball.png' },
  { name: 'Love Ball', image: '/data/balls/love-ball.png' },
  { name: 'Lure Ball', image: '/data/balls/lure-ball.png' },
  { name: 'Moon Ball', image: '/data/balls/moon-ball.png' },
  { name: 'Safari Ball', image: '/data/balls/safari-ball.png' },
  { name: 'Sport Ball', image: '/data/balls/sport-ball.png' },
  { name: 'Luxury Ball', image: '/data/balls/luxury-ball.png' },
  { name: 'Dive Ball', image: '/data/balls/dive-ball.png' },
  { name: 'Nest Ball', image: '/data/balls/nest-ball.png' },
  { name: 'Net Ball', image: '/data/balls/net-ball.png' },
  { name: 'Repeat Ball', image: '/data/balls/repeat-ball.png' },
  { name: 'Timer Ball', image: '/data/balls/timer-ball.png' }
];

export function normalizeSpecialBall(rawBall) {
  if (!rawBall || typeof rawBall !== 'string') return null;
  const clean = rawBall.toLowerCase().trim().replace(/[-_]/g, ' ');
  const withoutBall = clean.replace(/\s*ball\s*$/, '').trim();
  const withBall = `${withoutBall} ball`;

  const match = SPECIAL_BALLS_LIST.find(
    b => b.name.toLowerCase() === clean || b.name.toLowerCase() === withBall
  );
  return match ? match.name : null;
}

/**
 * 103 unique female gender forms
 */
export const GENDER_FORMS_LIST = Array.isArray(genderForms) ? genderForms : [];

/**
 * 33 unique Gigantamax forms
 */
export const GMAX_FORMS_LIST = Array.isArray(gmaxForms) ? gmaxForms : [];

/**
 * 54 unique Mighty Mark event Pokémon
 */
export const MIGHTY_POKEMON_LIST = Array.isArray(mightyForms) ? mightyForms : [];

/**
 * 63 unique Alcremie forms (excluding Gigantamax):
 * 1 base form from pokemon.json + 62 form variants from forms/alcremie.json
 */
export const ALCREMIE_FORMS_LIST = [
  pokemonData.find(p => p.id === 869),
  ...alcremieForms.filter(f => f.formType === 'alcremie')
].filter(Boolean);

/**
 * 28 unique Unown forms (strictly excluding Alphas):
 * 1 base Unown (A) from pokemon.json + 27 forms (B-Z, ?, !) from forms/unown.json
 */
export const UNOWN_FORMS_LIST = [
  pokemonData.find(p => p.id === 201 && p.name === 'unown'),
  ...(Array.isArray(unownForms)
    ? unownForms.filter(f => f.formType === 'unown' && !f.name.endsWith('-alpha') && !f.stableId.includes('-alpha'))
    : [])
].filter(Boolean);

/**
 * 656 Alpha Pokémon and forms:
 * - alphaForms from forms/alpha.json (includes base species Alphas like Unown A)
 * - alphaotherForms from forms/alphaother.json
 * - Alpha Unown forms from forms/unown.json
 */
export const ALPHA_POKEMON_LIST = Array.from(
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

/**
 * All 28 official Mythical Pokémon and forms in National Dex & Other Forms
 */
export const MYTHICAL_POKEMON_LIST = [
  ...pokemonData.filter(p => isMythical(p)),
  ...(Array.isArray(otherForms) ? otherForms.filter(f => isMythical(f)) : [])
];

/**
 * 11 unique Ultra Beasts in National Living Dex
 */
export const ULTRA_BEASTS_LIST = pokemonData.filter(p => isUltraBeast(p));

/**
 * 11 unique Pseudo-Legendary Pokémon and forms for Near Legendary:
 * - 10 main living dex pseudos: Dragonite (#149), Tyranitar (#248), Salamence (#373), Metagross (#376),
 *   Garchomp (#445), Hydreigon (#635), Goodra (#706), Kommo-o (#784), Dragapult (#887), Baxcalibur (#998)
 * - 1 Hisuian regional form: Goodra-Hisui (#706)
 */
export const PSEUDO_LEGENDARY_LIST = [
  ...pokemonData.filter(p => [149, 248, 373, 376, 445, 635, 706, 784, 887, 998].includes(p.id)),
  ...(Array.isArray(hisuianForms) ? hisuianForms.filter(f => f.name === 'goodra-hisui' || f.stableId === 'goodra-hisui-0706') : [])
];

/**
 * 27 unique Starter Pokémon in National Living Dex (Gen 1 to Gen 9)
 */
export const STARTER_POKEMON_LIST = pokemonData.filter(p => isStarter(p));

/**
 * 15 unique Fossil Pokémon in National Living Dex
 */
export const FOSSIL_POKEMON_LIST = pokemonData.filter(p => isFossil(p));

/**
 * 19 unique Baby Pokémon in National Living Dex
 */
export const BABY_POKEMON_LIST = pokemonData.filter(p => isBaby(p));

/**
 * 22 unique Paradox Pokémon in National Living Dex (Gen 9)
 */
export const PARADOX_POKEMON_LIST = pokemonData.filter(p => isParadox(p));

/**
 * All 80 official Legendary Pokémon and forms for Master of Legends:
 * - 71 Legendaries and Sub-Legendaries in National Living Dex (pokemon.json)
 * - 3 Galarian Legendary Birds (Articuno, Zapdos, Moltres)
 * - 6 Legendary forms in Other Forms tab (excluding Origin Ball Dialga and Palkia)
 */
export const LEGENDARY_ACHIEVEMENT_LIST = [
  ...pokemonData.filter(p => isLegendary(p) || isSubLegendary(p)),
  ...(Array.isArray(galarianForms) ? galarianForms.filter(p => isLegendary(p) || isSubLegendary(p)) : []),
  ...(Array.isArray(otherForms) ? otherForms.filter(p => (isLegendary(p) || isSubLegendary(p)) && p.stableId !== 'origin-ball-dialga-483' && p.stableId !== 'origin-ball-palkia-484') : [])
];

/**
 * 25 Legendary Pokémon / forms that are shiny-locked:
 * - 20 from Living Dex: Cosmog, Cosmoem, Eternatus, Kubfu, Urshifu Single Strike, Glastrier, Spectrier, Calyrex,
 *   Enamorus Incarnate, Wo-Chien, Chien-Pao, Ting-Lu, Chi-Yu, Koraidon, Miraidon, Okidogi, Munkidori, Fezandipiti, Ogerpon, Terapagos
 * - 3 Galarian forms: Articuno-Galar, Zapdos-Galar, Moltres-Galar
 * - 2 Other forms: Urshifu Rapid Strike, Enamorus Therian
 */
const TITAN_SLAYER_SHINY_LOCKED_IDS = new Set([
  789, 790, // Cosmog, Cosmoem
  890,      // Eternatus
  891, 892, // Kubfu, Urshifu Single Strike
  896, 897, 898, // Glastrier, Spectrier, Calyrex
  905,      // Enamorus Incarnate
  1001, 1002, 1003, 1004, // Wo-Chien, Chien-Pao, Ting-Lu, Chi-Yu
  1007, 1008, // Koraidon, Miraidon
  1014, 1015, 1016, 1017, // Okidogi, Munkidori, Fezandipiti, Ogerpon
  1024      // Terapagos
]);

const TITAN_SLAYER_SHINY_LOCKED_FORM_NAMES = new Set([
  'articuno-galar',
  'zapdos-galar',
  'moltres-galar',
  'urshifu-rapid-strike',
  'enamorus-therian'
]);

export const isMasterOfLegendsShinyLocked = isTitanSlayerShinyLocked;
export function isTitanSlayerShinyLocked(poke) {
  if (!poke) return false;
  if (TITAN_SLAYER_SHINY_LOCKED_IDS.has(Number(poke.id))) return true;
  if (poke.name && TITAN_SLAYER_SHINY_LOCKED_FORM_NAMES.has(poke.name)) return true;
  if (poke.stableId && TITAN_SLAYER_SHINY_LOCKED_FORM_NAMES.has(poke.stableId)) return true;
  return false;
}

// (isUnobtainableShiny is exported at top of file)

export const ACHIEVEMENT_CATEGORIES = [
  'Collection',
  'Pokémon Groups',
  'Forms & Variants',
  'Hunting',
  'Poké Balls',
  'Events',
  'Account & Community',
  'Secret'
];

export const ACHIEVEMENT_TYPES = [
  { value: 'tiered', label: 'Tiered Progression' },
  { value: 'single', label: 'Single Completion' },
  { value: 'secret', label: 'Secret Badge' }
];

export const TRACKING_SCOPES = [
  { value: 'regular', label: 'Regular' },
  { value: 'shiny', label: 'Shiny' },
  { value: 'regular_shiny_separate', label: 'Regular + Shiny Separate' },
  { value: 'shared', label: 'Shared' }
];

export const REQUIREMENT_METRICS = [
  { value: 'pokemon_registered', label: 'Pokémon Registered' },
  { value: 'group_completed', label: 'Entire Pokémon Group Completed' },
  { value: 'hunts_completed', label: 'Completed Hunts Count' },
  { value: 'encounters_total', label: 'Total Encounters Milestone' },
  { value: 'odds_multiplier', label: 'Odds Multiplier Milestone (2x/3x/4x+)' },
  { value: 'under_odds_percent', label: 'Under Odds Percentage (<10%, <1%)' },
  { value: 'hunt_phases', label: 'Phases in Single Hunt' },
  { value: 'hunt_hours', label: 'Total Hunting Hours' },
  { value: 'failed_target_reclaim', label: 'Target Reclaimed After Failed Encounter' },
  { value: 'ball_catches', label: 'Specific Ball Catches' },
  { value: 'marks_collected', label: 'Marked Pokémon Collected' },
  { value: 'bingo_completed', label: 'Bingo Sheets Completed' },
  { value: 'account_age_days', label: 'Account Age Days' },
  { value: 'membership_months', label: 'Membership Months' },
  { value: 'profile_likes', label: 'Profile Likes Received' },
  { value: 'leaderboard_percentile', label: 'Leaderboard Top Percentile' },
  { value: 'custom_condition', label: 'Custom Condition / Mystery' }
];

export const DEFAULT_TIER_NAMES = ['Bronze', 'Silver', 'Gold', 'Diamond'];

export const INITIAL_ACHIEVEMENTS = [
  // ==========================================
  // COLLECTION
  // ==========================================
  {
    id: 'ach-col-01',
    slug: 'master-collector',
    name: 'Master Collector',
    description: 'Catch 100 Pokémon.',
    category: 'Collection',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 1,
    artwork: '/badges/master-collector/master-collector.png',
    shinyArtwork: '/badges/master-collector/master-collector-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 100, requirementDescription: 'Register 100 Pokémon in the Living Dex', artworkUrl: '/badges/master-collector/master-collector.png', shinyArtworkUrl: '/badges/master-collector/master-collector-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 300, requirementDescription: 'Register 300 Pokémon in the Living Dex', artworkUrl: '/badges/master-collector/master-collector.png', shinyArtworkUrl: '/badges/master-collector/master-collector-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 600, requirementDescription: 'Register 600 Pokémon in the Living Dex', artworkUrl: '/badges/master-collector/master-collector.png', shinyArtworkUrl: '/badges/master-collector/master-collector-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 1025, requirementDescription: 'Register all 1,025 Pokémon in the Living Dex', artworkUrl: '/badges/master-collector/master-collector.png', shinyArtworkUrl: '/badges/master-collector/master-collector-shiny.png' }
    ],
    requirements: {
      type: 'pokemon_registered',
      target: 'national_dex_all',
      details: 'All 1,025 mainline Pokémon in National Dex'
    },
    metadata: {
      totalPokemon: 1025
    }
  },
  {
    id: 'ach-col-02',
    slug: 'dual-mastery',
    name: 'Dual Mastery',
    description: 'Complete regular AND shiny entries for ALL species.',
    category: 'Collection',
    type: 'single',
    tier: 'diamond',
    trackingScope: 'shared',
    isSecret: false,
    enabled: true,
    sortOrder: 2,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Diamond', order: 1, threshold: null, requirementDescription: 'Complete 100% regular & shiny National Dex', artworkUrl: null }
    ],
    requirements: {
      type: 'pokemon_registered',
      target: 'national_dex_regular_and_shiny',
      details: '100% regular and shiny completion'
    },
    metadata: {
      instantDiamond: true
    }
  },
  {
    id: 'ach-col-03',
    slug: 'gotta-catch-em-all',
    name: 'Gotta Catch ’Em All!',
    description: 'Register every Pokémon on UltimateDexTracker.com',
    category: 'Collection',
    type: 'single',
    tier: 'diamond',
    trackingScope: 'shared',
    hasShinySwitch: false,
    hasShiny: false,
    isSecret: false,
    enabled: true,
    sortOrder: 3,
    artwork: '/badges/gotta-catch-em-all/gotta-catch-em-all.png',
    shinyArtwork: null,
    tiers: [
      { id: 't1', name: 'Diamond', order: 1, threshold: TOTAL_TRACKER_POKEMON_COUNT, requirementDescription: 'Register every Pokémon on UltimateDexTracker.com', artworkUrl: '/badges/gotta-catch-em-all/gotta-catch-em-all.png' }
    ],
    requirements: {
      type: 'pokemon_registered',
      target: 'all_pokemon_and_forms_regular_and_shiny',
      details: 'Register every Pokémon on UltimateDexTracker.com'
    },
    metadata: {
      instantDiamond: true,
      totalCount: TOTAL_TRACKER_POKEMON_COUNT
    }
  },

  // ==========================================
  // POKÉMON GROUPS
  // ==========================================
  {
    id: 'ach-grp-01',
    slug: 'mythical-pursuit',
    name: 'Mythical Pursuit',
    description: 'Catch 3 unique Mythical Pokémon.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 10,
    artwork: '/badges/mythical-pursuit/mythical-pursuit.png',
    shinyArtwork: '/badges/mythical-pursuit/mythical-pursuit-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 3, requirementDescription: 'Register 3 Mythical Pokémon in the Living Dex', artworkUrl: '/badges/mythical-pursuit/mythical-pursuit.png', shinyArtworkUrl: '/badges/mythical-pursuit/mythical-pursuit-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 8, requirementDescription: 'Register 8 Mythical Pokémon in the Living Dex', artworkUrl: '/badges/mythical-pursuit/mythical-pursuit.png', shinyArtworkUrl: '/badges/mythical-pursuit/mythical-pursuit-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 16, requirementDescription: 'Register 16 Mythical Pokémon in the Living Dex', artworkUrl: '/badges/mythical-pursuit/mythical-pursuit.png', shinyArtworkUrl: '/badges/mythical-pursuit/mythical-pursuit-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 28, requirementDescription: 'Register all 28 Mythical Pokémon and forms in the Living Dex', artworkUrl: '/badges/mythical-pursuit/mythical-pursuit.png', shinyArtworkUrl: '/badges/mythical-pursuit/mythical-pursuit-shiny.png' }
    ],
    requirements: {
      type: 'group_completed',
      target: 'mythicals',
      details: 'All 28 Mythical Pokémon and forms in National Dex'
    },
    metadata: {
      totalMythicals: 28
    }
  },
  {
    id: 'ach-grp-02',
    slug: 'master-of-legends',
    name: 'Master of Legends',
    description: 'Register Legendary Pokémon across the Living Dex, Galar forms, and Other forms.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 11,
    artwork: '/badges/master-of-legends/master-of-legends.png',
    shinyArtwork: '/badges/master-of-legends/master-of-legends-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 8, requirementDescription: 'Register 8 Legendary Pokémon in the Living Dex', artworkUrl: '/badges/master-of-legends/master-of-legends.png', shinyArtworkUrl: '/badges/master-of-legends/master-of-legends-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 24, requirementDescription: 'Register 24 Legendary Pokémon in the Living Dex', artworkUrl: '/badges/master-of-legends/master-of-legends.png', shinyArtworkUrl: '/badges/master-of-legends/master-of-legends-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 45, requirementDescription: 'Register 45 Legendary Pokémon in the Living Dex', artworkUrl: '/badges/master-of-legends/master-of-legends.png', shinyArtworkUrl: '/badges/master-of-legends/master-of-legends-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 80, requirementDescription: 'Register all 80 Legendary Pokémon and forms in the Living Dex', artworkUrl: '/badges/master-of-legends/master-of-legends.png', shinyArtworkUrl: '/badges/master-of-legends/master-of-legends-shiny.png' }
    ],
    requirements: {
      type: 'group_completed',
      target: 'legendaries',
      details: 'All 80 Legendary Pokémon and forms across Living Dex, Galar, and Other forms (55 for shiny)'
    },
    metadata: {
      totalLegendaries: 80,
      totalShinyLegendaries: 55
    }
  },
  {
    id: 'ach-grp-03',
    slug: 'otherworldly-beasts',
    name: 'Otherworldly Beasts',
    description: 'Catch all Ultra Beasts in the Living Dex.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 12,
    artwork: '/badges/otherworldly-beasts/otherworldly-beasts.png',
    shinyArtwork: '/badges/otherworldly-beasts/otherworldly-beasts-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 2, requirementDescription: 'Register 2 Ultra Beasts in the Living Dex', artworkUrl: '/badges/otherworldly-beasts/otherworldly-beasts.png', shinyArtworkUrl: '/badges/otherworldly-beasts/otherworldly-beasts-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 4, requirementDescription: 'Register 4 Ultra Beasts in the Living Dex', artworkUrl: '/badges/otherworldly-beasts/otherworldly-beasts.png', shinyArtworkUrl: '/badges/otherworldly-beasts/otherworldly-beasts-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 7, requirementDescription: 'Register 7 Ultra Beasts in the Living Dex', artworkUrl: '/badges/otherworldly-beasts/otherworldly-beasts.png', shinyArtworkUrl: '/badges/otherworldly-beasts/otherworldly-beasts-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 11, requirementDescription: 'Register all 11 Ultra Beasts in the Living Dex', artworkUrl: '/badges/otherworldly-beasts/otherworldly-beasts.png', shinyArtworkUrl: '/badges/otherworldly-beasts/otherworldly-beasts-shiny.png' }
    ],
    requirements: {
      type: 'group_completed',
      target: 'ultra_beasts',
      details: 'All 11 Ultra Beasts in National Living Dex'
    },
    metadata: {
      totalUltraBeasts: 11
    }
  },
  {
    id: 'ach-grp-04',
    slug: 'past-and-future',
    name: 'Past & Future',
    description: 'Catch 3 unique Paradox Pokémon.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 13,
    artwork: '/badges/past-and-future/past-and-future.png',
    shinyArtwork: '/badges/past-and-future/past-and-future-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 3, requirementDescription: 'Register 3 Paradox Pokémon in the Living Dex', artworkUrl: '/badges/past-and-future/past-and-future.png', shinyArtworkUrl: '/badges/past-and-future/past-and-future-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 7, requirementDescription: 'Register 7 Paradox Pokémon in the Living Dex', artworkUrl: '/badges/past-and-future/past-and-future.png', shinyArtworkUrl: '/badges/past-and-future/past-and-future-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 13, requirementDescription: 'Register 13 Paradox Pokémon in the Living Dex', artworkUrl: '/badges/past-and-future/past-and-future.png', shinyArtworkUrl: '/badges/past-and-future/past-and-future-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 22, requirementDescription: 'Register all 22 Paradox Pokémon in the Living Dex', artworkUrl: '/badges/past-and-future/past-and-future.png', shinyArtworkUrl: '/badges/past-and-future/past-and-future-shiny.png' }
    ],
    requirements: {
      type: 'group_completed',
      target: 'paradox',
      details: 'All 22 Paradox Pokémon in National Living Dex (14 for shiny)'
    },
    metadata: {
      totalParadox: 22,
      totalShinyParadox: 14
    }
  },
  {
    id: 'ach-grp-05',
    slug: 'near-legendary',
    name: 'Near Legendary',
    description: 'Catch 2 unique Pseudo-Legendary Pokémon.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 14,
    artwork: '/badges/near-legendary/near-legendary.png',
    shinyArtwork: '/badges/near-legendary/near-legendary-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 2, requirementDescription: 'Register 2 Pseudo-Legendary Pokémon in the Living Dex', artworkUrl: '/badges/near-legendary/near-legendary.png', shinyArtworkUrl: '/badges/near-legendary/near-legendary-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 4, requirementDescription: 'Register 4 Pseudo-Legendary Pokémon in the Living Dex', artworkUrl: '/badges/near-legendary/near-legendary.png', shinyArtworkUrl: '/badges/near-legendary/near-legendary-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 7, requirementDescription: 'Register 7 Pseudo-Legendary Pokémon in the Living Dex', artworkUrl: '/badges/near-legendary/near-legendary.png', shinyArtworkUrl: '/badges/near-legendary/near-legendary-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 11, requirementDescription: 'Register all 11 Pseudo-Legendary Pokémon in the Living Dex', artworkUrl: '/badges/near-legendary/near-legendary.png', shinyArtworkUrl: '/badges/near-legendary/near-legendary-shiny.png' }
    ],
    requirements: {
      type: 'group_completed',
      target: 'pseudo_legendaries',
      details: 'All 11 Pseudo-Legendary Pokémon across Living Dex and Hisuian form'
    },
    metadata: {
      totalPseudoLegendaries: 11
    }
  },
  {
    id: 'ach-grp-06',
    slug: 'where-it-all-began',
    name: 'Where It All Began',
    description: 'Catch 3 unique Starter Pokémon.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 15,
    artwork: '/badges/where-it-all-began/where-it-all-began.png',
    shinyArtwork: '/badges/where-it-all-began/where-it-all-began-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 3, requirementDescription: 'Register 3 Starter Pokémon in the Living Dex', artworkUrl: '/badges/where-it-all-began/where-it-all-began.png', shinyArtworkUrl: '/badges/where-it-all-began/where-it-all-began-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 8, requirementDescription: 'Register 8 Starter Pokémon in the Living Dex', artworkUrl: '/badges/where-it-all-began/where-it-all-began.png', shinyArtworkUrl: '/badges/where-it-all-began/where-it-all-began-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 15, requirementDescription: 'Register 15 Starter Pokémon in the Living Dex', artworkUrl: '/badges/where-it-all-began/where-it-all-began.png', shinyArtworkUrl: '/badges/where-it-all-began/where-it-all-began-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 27, requirementDescription: 'Register all 27 Starter Pokémon in the Living Dex', artworkUrl: '/badges/where-it-all-began/where-it-all-began.png', shinyArtworkUrl: '/badges/where-it-all-began/where-it-all-began-shiny.png' }
    ],
    requirements: {
      type: 'group_completed',
      target: 'starters',
      details: 'All 27 Starter Pokémon in National Living Dex'
    },
    metadata: {
      totalStarters: 27
    }
  },
  {
    id: 'ach-grp-07',
    slug: 'paleontologist',
    name: 'Paleontologist',
    description: 'Catch 2 unique Fossil Pokémon.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 16,
    artwork: '/badges/paleontologist/paleontologist.png',
    shinyArtwork: '/badges/paleontologist/paleontologist-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 2, requirementDescription: 'Register 2 Fossil Pokémon in the Living Dex', artworkUrl: '/badges/paleontologist/paleontologist.png', shinyArtworkUrl: '/badges/paleontologist/paleontologist-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 5, requirementDescription: 'Register 5 Fossil Pokémon in the Living Dex', artworkUrl: '/badges/paleontologist/paleontologist.png', shinyArtworkUrl: '/badges/paleontologist/paleontologist-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 9, requirementDescription: 'Register 9 Fossil Pokémon in the Living Dex', artworkUrl: '/badges/paleontologist/paleontologist.png', shinyArtworkUrl: '/badges/paleontologist/paleontologist-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 15, requirementDescription: 'Register all 15 Fossil Pokémon in the Living Dex', artworkUrl: '/badges/paleontologist/paleontologist.png', shinyArtworkUrl: '/badges/paleontologist/paleontologist-shiny.png' }
    ],
    requirements: {
      type: 'group_completed',
      target: 'fossils',
      details: 'All 15 Fossil Pokémon in National Living Dex'
    },
    metadata: {
      totalFossils: 15
    }
  },
  {
    id: 'ach-grp-08',
    slug: 'small-beginnings',
    name: 'Small Beginnings',
    description: 'Catch 2 unique Baby Pokémon.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 17,
    artwork: '/badges/small-beginnings/small-beginnings.png',
    shinyArtwork: '/badges/small-beginnings/small-beginnings-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 2, requirementDescription: 'Register 2 Baby Pokémon in the Living Dex', artworkUrl: '/badges/small-beginnings/small-beginnings.png', shinyArtworkUrl: '/badges/small-beginnings/small-beginnings-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 6, requirementDescription: 'Register 6 Baby Pokémon in the Living Dex', artworkUrl: '/badges/small-beginnings/small-beginnings.png', shinyArtworkUrl: '/badges/small-beginnings/small-beginnings-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 11, requirementDescription: 'Register 11 Baby Pokémon in the Living Dex', artworkUrl: '/badges/small-beginnings/small-beginnings.png', shinyArtworkUrl: '/badges/small-beginnings/small-beginnings-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 19, requirementDescription: 'Register all 19 Baby Pokémon in the Living Dex', artworkUrl: '/badges/small-beginnings/small-beginnings.png', shinyArtworkUrl: '/badges/small-beginnings/small-beginnings-shiny.png' }
    ],
    requirements: {
      type: 'group_completed',
      target: 'babies',
      details: 'All 19 Baby Pokémon in National Living Dex'
    },
    metadata: {
      totalBabies: 19
    }
  },

  // ==========================================
  // FORMS & VARIANTS
  // ==========================================
  {
    id: 'ach-var-01',
    slug: 'sweet-perfection',
    name: 'Sweet Perfection',
    description: 'Catch 7 unique Alcremie forms.',
    category: 'Forms & Variants',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 20,
    artwork: '/badges/sweet-perfection/sweet-perfection.png',
    shinyArtwork: '/badges/sweet-perfection/sweet-perfection-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 7, requirementDescription: 'Catch 7 unique Alcremie forms', artworkUrl: '/badges/sweet-perfection/sweet-perfection.png', shinyArtworkUrl: '/badges/sweet-perfection/sweet-perfection-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 21, requirementDescription: 'Catch 21 unique Alcremie forms', artworkUrl: '/badges/sweet-perfection/sweet-perfection.png', shinyArtworkUrl: '/badges/sweet-perfection/sweet-perfection-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 42, requirementDescription: 'Catch 42 unique Alcremie forms', artworkUrl: '/badges/sweet-perfection/sweet-perfection.png', shinyArtworkUrl: '/badges/sweet-perfection/sweet-perfection-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 63, requirementDescription: 'Catch all 63 unique Alcremie forms', artworkUrl: '/badges/sweet-perfection/sweet-perfection.png', shinyArtworkUrl: '/badges/sweet-perfection/sweet-perfection-shiny.png' }
    ],
    requirements: {
      type: 'group_completed',
      target: 'alcremie_forms',
      details: 'All 63 unique Alcremie forms (excluding Gigantamax)'
    },
    metadata: {
      totalForms: 63
    }
  },
  {
    id: 'ach-var-02',
    slug: 'ancient-alphabet',
    name: 'Ancient Alphabet',
    description: 'Catch 3 unique Unown forms.',
    category: 'Forms & Variants',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 21,
    artwork: '/badges/ancient-alphabet/ancient-alphabet.png',
    shinyArtwork: '/badges/ancient-alphabet/ancient-alphabet-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 3, requirementDescription: 'Register 3 unique Unown forms in the Living Dex', artworkUrl: '/badges/ancient-alphabet/ancient-alphabet.png', shinyArtworkUrl: '/badges/ancient-alphabet/ancient-alphabet-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 8, requirementDescription: 'Register 8 unique Unown forms in the Living Dex', artworkUrl: '/badges/ancient-alphabet/ancient-alphabet.png', shinyArtworkUrl: '/badges/ancient-alphabet/ancient-alphabet-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 16, requirementDescription: 'Register 16 unique Unown forms in the Living Dex', artworkUrl: '/badges/ancient-alphabet/ancient-alphabet.png', shinyArtworkUrl: '/badges/ancient-alphabet/ancient-alphabet-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 28, requirementDescription: 'Register all 28 unique Unown forms in the Living Dex', artworkUrl: '/badges/ancient-alphabet/ancient-alphabet.png', shinyArtworkUrl: '/badges/ancient-alphabet/ancient-alphabet-shiny.png' }
    ],
    requirements: {
      type: 'group_completed',
      target: 'unown_forms',
      details: 'All 28 Unown forms (A-Z, ?, !)'
    },
    metadata: {
      totalForms: 28
    }
  },
  {
    id: 'ach-var-03',
    slug: 'apex-predator',
    name: 'Apex Predator',
    description: 'Catch 50 Alpha Pokémon.',
    category: 'Forms & Variants',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 22,
    artwork: '/badges/apex-predator/apex-predator.png',
    shinyArtwork: '/badges/apex-predator/apex-predator-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 50, requirementDescription: 'Register 50 Alpha Pokémon in the Living Dex', artworkUrl: '/badges/apex-predator/apex-predator.png', shinyArtworkUrl: '/badges/apex-predator/apex-predator-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 150, requirementDescription: 'Register 150 Alpha Pokémon in the Living Dex', artworkUrl: '/badges/apex-predator/apex-predator.png', shinyArtworkUrl: '/badges/apex-predator/apex-predator-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 350, requirementDescription: 'Register 350 Alpha Pokémon in the Living Dex', artworkUrl: '/badges/apex-predator/apex-predator.png', shinyArtworkUrl: '/badges/apex-predator/apex-predator-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 656, requirementDescription: 'Register all 656 Alpha Pokémon in the Living Dex', artworkUrl: '/badges/apex-predator/apex-predator.png', shinyArtworkUrl: '/badges/apex-predator/apex-predator-shiny.png' }
    ],
    requirements: {
      type: 'group_completed',
      target: 'alpha_forms',
      details: 'All 656 Alpha Pokémon and forms'
    },
    metadata: {
      totalForms: 656
    }
  },
  {
    id: 'ach-var-04',
    slug: 'gigantic-potential',
    name: 'Gigantic Potential',
    description: 'Catch 4 unique Gigantamax forms.',
    category: 'Forms & Variants',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 23,
    artwork: '/badges/gigantic-potential/gigantic-potential.png',
    shinyArtwork: '/badges/gigantic-potential/gigantic-potential-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 4, requirementDescription: 'Register 4 unique Gigantamax forms in the Living Dex', artworkUrl: '/badges/gigantic-potential/gigantic-potential.png', shinyArtworkUrl: '/badges/gigantic-potential/gigantic-potential-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 10, requirementDescription: 'Register 10 unique Gigantamax forms in the Living Dex', artworkUrl: '/badges/gigantic-potential/gigantic-potential.png', shinyArtworkUrl: '/badges/gigantic-potential/gigantic-potential-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 20, requirementDescription: 'Register 20 unique Gigantamax forms in the Living Dex', artworkUrl: '/badges/gigantic-potential/gigantic-potential.png', shinyArtworkUrl: '/badges/gigantic-potential/gigantic-potential-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 33, requirementDescription: 'Register all 33 unique Gigantamax forms in the Living Dex', artworkUrl: '/badges/gigantic-potential/gigantic-potential.png', shinyArtworkUrl: '/badges/gigantic-potential/gigantic-potential-shiny.png' }
    ],
    requirements: {
      type: 'group_completed',
      target: 'gmax_forms',
      details: 'All 33 Gigantamax forms'
    },
    metadata: {
      totalForms: 33
    }
  },
  {
    id: 'ach-var-05',
    slug: 'across-the-regions',
    name: 'Across the Regions',
    description: 'Catch 5 Regional Forms.',
    category: 'Forms & Variants',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 24,
    artwork: '/badges/across-the-regions/across-the-regions.png',
    shinyArtwork: '/badges/across-the-regions/across-the-regions-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 5, requirementDescription: 'Register 5 unique Regional Forms in the Living Dex', artworkUrl: '/badges/across-the-regions/across-the-regions.png', shinyArtworkUrl: '/badges/across-the-regions/across-the-regions-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 16, requirementDescription: 'Register 16 unique Regional Forms in the Living Dex', artworkUrl: '/badges/across-the-regions/across-the-regions.png', shinyArtworkUrl: '/badges/across-the-regions/across-the-regions-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 32, requirementDescription: 'Register 32 unique Regional Forms in the Living Dex', artworkUrl: '/badges/across-the-regions/across-the-regions.png', shinyArtworkUrl: '/badges/across-the-regions/across-the-regions-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 57, requirementDescription: 'Register all 57 unique Regional Forms in the Living Dex', artworkUrl: '/badges/across-the-regions/across-the-regions.png', shinyArtworkUrl: '/badges/across-the-regions/across-the-regions-shiny.png' }
    ],
    requirements: {
      type: 'group_completed',
      target: 'regional_forms',
      details: 'Alolan, Galarian, Hisuian, and Paldean forms'
    },
    metadata: {
      totalForms: 57,
      totalShinyForms: 54
    }
  },
  {
    id: 'ach-var-06',
    slug: 'mightiest-of-them-all',
    name: 'Mightiest of Them All',
    description: 'Catch 5 Mighty Mark Pokémon.',
    category: 'Forms & Variants',
    type: 'tiered',
    trackingScope: 'shared',
    hasShinySwitch: false,
    hasShiny: false,
    isUniversal: false,
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 25,
    artwork: '/badges/mightiest-of-them-all/mightiest-of-them-all.png',
    shinyArtwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 5, requirementDescription: 'Register 5 Mighty Mark Pokémon in the Living Dex', artworkUrl: '/badges/mightiest-of-them-all/mightiest-of-them-all.png', shinyArtworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: 15, requirementDescription: 'Register 15 Mighty Mark Pokémon in the Living Dex', artworkUrl: '/badges/mightiest-of-them-all/mightiest-of-them-all.png', shinyArtworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: 30, requirementDescription: 'Register 30 Mighty Mark Pokémon in the Living Dex', artworkUrl: '/badges/mightiest-of-them-all/mightiest-of-them-all.png', shinyArtworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: 54, requirementDescription: 'Register all 54 Mighty Mark Pokémon in the Living Dex', artworkUrl: '/badges/mightiest-of-them-all/mightiest-of-them-all.png', shinyArtworkUrl: null }
    ],
    requirements: {
      type: 'marks_collected',
      target: 'mightiest_mark',
      details: 'All 54 Mighty Mark Pokémon'
    },
    metadata: {
      totalForms: 54
    }
  },
  {
    id: 'ach-var-07',
    slug: 'ladies-first',
    name: 'Ladies First',
    description: 'Catch 10 female gender forms.',
    category: 'Forms & Variants',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 26,
    artwork: '/badges/ladies-first/ladies-first.png',
    shinyArtwork: '/badges/ladies-first/ladies-first-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 10, requirementDescription: 'Register 10 female gender forms in the Living Dex', artworkUrl: '/badges/ladies-first/ladies-first.png', shinyArtworkUrl: '/badges/ladies-first/ladies-first-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 30, requirementDescription: 'Register 30 female gender forms in the Living Dex', artworkUrl: '/badges/ladies-first/ladies-first.png', shinyArtworkUrl: '/badges/ladies-first/ladies-first-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 60, requirementDescription: 'Register 60 female gender forms in the Living Dex', artworkUrl: '/badges/ladies-first/ladies-first.png', shinyArtworkUrl: '/badges/ladies-first/ladies-first-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 103, requirementDescription: 'Register all 103 female gender forms in the Living Dex', artworkUrl: '/badges/ladies-first/ladies-first.png', shinyArtworkUrl: '/badges/ladies-first/ladies-first-shiny.png' }
    ],
    requirements: {
      type: 'group_completed',
      target: 'gender_forms',
      details: 'All 103 distinct female visual form differences'
    },
    metadata: {
      totalGenderForms: 103
    }
  },

  // ==========================================
  // HUNTING
  // ==========================================
  {
    id: 'ach-hnt-01',
    slug: 'relentless-hunter',
    name: 'Relentless Hunter',
    description: 'Total completed hunts using the Counters system.',
    category: 'Hunting',
    type: 'tiered',
    trackingScope: 'shared',
    isSecret: false,
    enabled: true,
    sortOrder: 30,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'hunts_completed',
      target: 'any_hunt',
      details: 'Completed hunt entries in Counters'
    },
    metadata: {}
  },
  {
    id: 'ach-hnt-02',
    slug: 'one-more-encounter',
    name: 'One More Encounter',
    description: 'Total encounter milestones.',
    category: 'Hunting',
    type: 'tiered',
    trackingScope: 'shared',
    isSecret: false,
    enabled: true,
    sortOrder: 31,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'encounters_total',
      target: 'all_encounters',
      details: 'Aggregate count across all logged hunts'
    },
    metadata: {}
  },
  {
    id: 'ach-hnt-03',
    slug: 'patience-of-a-saint',
    name: 'Patience of a Saint',
    description: 'Complete hunts that reached 2x / 3x / 4x+ odds.',
    category: 'Hunting',
    type: 'tiered',
    trackingScope: 'shared',
    isSecret: false,
    enabled: true,
    sortOrder: 32,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured (e.g. 2x odds)', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured (e.g. 3x odds)', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured (e.g. 4x odds)', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured (e.g. 5x+ odds)', artworkUrl: null }
    ],
    requirements: {
      type: 'odds_multiplier',
      target: 'hunts_over_odds',
      details: 'Hunts completed after exceeding standard mathematical odds'
    },
    metadata: {}
  },
  {
    id: 'ach-hnt-04',
    slug: 'blessed-by-arceus',
    name: 'Blessed by Arceus',
    description: 'Find a shiny within less than 10% of odds.',
    category: 'Hunting',
    type: 'single',
    tier: 'diamond',
    trackingScope: 'shared',
    isSecret: false,
    enabled: true,
    sortOrder: 33,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Diamond', order: 1, threshold: null, requirementDescription: 'Shiny found under 10% of standard odds', artworkUrl: null }
    ],
    requirements: {
      type: 'under_odds_percent',
      target: '10_percent',
      details: 'Shiny logged under 10% expected encounters'
    },
    metadata: {
      instantDiamond: true
    }
  },
  {
    id: 'ach-hnt-05',
    slug: 'phase-veteran',
    name: 'Phase Veteran',
    description: 'Complete a hunt requiring 3 or more phases.',
    category: 'Hunting',
    type: 'tiered',
    trackingScope: 'shared',
    isSecret: false,
    enabled: true,
    sortOrder: 34,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured (e.g. 3 phases)', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured (e.g. 5 phases)', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured (e.g. 10 phases)', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured (e.g. 15+ phases)', artworkUrl: null }
    ],
    requirements: {
      type: 'hunt_phases',
      target: 'multi_phase_hunts',
      details: 'Hunts requiring multiple phases before target capture'
    },
    metadata: {}
  },
  {
    id: 'ach-hnt-06',
    slug: 'marathon-runner',
    name: 'Marathon Runner',
    description: 'Total hours spent hunting.',
    category: 'Hunting',
    type: 'tiered',
    trackingScope: 'shared',
    isSecret: false,
    enabled: true,
    sortOrder: 35,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'hunt_hours',
      target: 'cumulative_timer',
      details: 'Active hunting timer elapsed hours'
    },
    metadata: {}
  },
  {
    id: 'ach-hnt-07',
    slug: 'redemption-arc',
    name: 'Redemption Arc',
    description: 'Catch a shiny target after previously logging a failed encounter.',
    category: 'Hunting',
    type: 'single',
    tier: 'diamond',
    trackingScope: 'shared',
    isSecret: false,
    enabled: true,
    sortOrder: 36,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Diamond', order: 1, threshold: null, requirementDescription: 'Successful reclaim of failed shiny target', artworkUrl: null }
    ],
    requirements: {
      type: 'failed_target_reclaim',
      target: 'reclaimed_shiny',
      details: 'Hunt completed following a failed encounter record'
    },
    metadata: {
      instantDiamond: true
    }
  },

  // ==========================================
  // POKÉ BALLS
  // ==========================================
  {
    id: 'ach-bal-01',
    slug: 'ball-connoisseur',
    legacySlug: 'apriball-artisan',
    name: 'Ball Connoisseur',
    description: 'Catch a Pokémon in every eligible Special Ball.',
    category: 'Poké Balls',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 40,
    artwork: '/badges/ball-connoisseur/ball-connoisseur.png',
    shinyArtwork: '/badges/ball-connoisseur/ball-connoisseur-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 3, requirementDescription: 'Register catches in 3 unique Special Ball types', artworkUrl: '/badges/ball-connoisseur/ball-connoisseur.png', shinyArtworkUrl: '/badges/ball-connoisseur/ball-connoisseur-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 6, requirementDescription: 'Register catches in 6 unique Special Ball types', artworkUrl: '/badges/ball-connoisseur/ball-connoisseur.png', shinyArtworkUrl: '/badges/ball-connoisseur/ball-connoisseur-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 10, requirementDescription: 'Register catches in 10 unique Special Ball types', artworkUrl: '/badges/ball-connoisseur/ball-connoisseur.png', shinyArtworkUrl: '/badges/ball-connoisseur/ball-connoisseur-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 16, requirementDescription: 'Catch a Pokémon in every eligible Special Ball', artworkUrl: '/badges/ball-connoisseur/ball-connoisseur.png', shinyArtworkUrl: '/badges/ball-connoisseur/ball-connoisseur-shiny.png' }
    ],
    requirements: {
      type: 'ball_catches',
      target: 'special_balls',
      details: 'Dream, Fast, Friend, Heavy, Level, Love, Lure, Moon, Safari, Sport, Luxury, Dive, Nest, Net, Repeat, and Timer Balls'
    },
    metadata: {
      totalBalls: 16,
      eligibleBalls: [
        'Dream Ball', 'Fast Ball', 'Friend Ball', 'Heavy Ball',
        'Level Ball', 'Love Ball', 'Lure Ball', 'Moon Ball',
        'Safari Ball', 'Sport Ball', 'Luxury Ball', 'Dive Ball',
        'Nest Ball', 'Net Ball', 'Repeat Ball', 'Timer Ball'
      ]
    }
  },
  {
    id: 'ach-bal-02',
    slug: 'beast-ballin',
    name: 'Beast Ballin',
    description: 'Catch unique Pokémon in Beast Balls.',
    category: 'Poké Balls',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 41,
    artwork: '/badges/beast-ballin/beast-ballin.png',
    shinyArtwork: '/badges/beast-ballin/beast-ballin-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 1, requirementDescription: 'Register 1 unique Pokémon caught in a Beast Ball', artworkUrl: '/badges/beast-ballin/beast-ballin.png', shinyArtworkUrl: '/badges/beast-ballin/beast-ballin-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 3, requirementDescription: 'Register 3 unique Pokémon caught in Beast Balls', artworkUrl: '/badges/beast-ballin/beast-ballin.png', shinyArtworkUrl: '/badges/beast-ballin/beast-ballin-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 7, requirementDescription: 'Register 7 unique Pokémon caught in Beast Balls', artworkUrl: '/badges/beast-ballin/beast-ballin.png', shinyArtworkUrl: '/badges/beast-ballin/beast-ballin-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 15, requirementDescription: 'Register 15 unique Pokémon caught in Beast Balls', artworkUrl: '/badges/beast-ballin/beast-ballin.png', shinyArtworkUrl: '/badges/beast-ballin/beast-ballin-shiny.png' }
    ],
    requirements: {
      type: 'ball_catches',
      target: 'beast_ball',
      details: 'Unique Pokémon caught in Beast Balls'
    },
    metadata: {
      totalCount: 15
    }
  },
  {
    id: 'ach-bal-03',
    slug: 'premier-club',
    name: 'Premier Club',
    description: 'Catch shinies in Premier Balls.',
    category: 'Poké Balls',
    type: 'tiered',
    trackingScope: 'shiny',
    isSecret: false,
    enabled: true,
    sortOrder: 42,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'ball_catches',
      target: 'premier_ball',
      details: 'Shinies caught in Premier Balls'
    },
    metadata: {}
  },
  {
    id: 'ach-bal-04',
    slug: 'ancient-craft',
    name: 'Ancient Craft',
    description: 'Catch Pokémon in Hisuian Poké Balls.',
    category: 'Poké Balls',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 43,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'ball_catches',
      target: 'hisuian_balls',
      details: 'Feather, Wing, Jet, Heavy, Leaden, Gigaton, Origin Balls'
    },
    metadata: {}
  },
  {
    id: 'ach-bal-05',
    slug: 'mark-collector',
    name: 'Mark Collector',
    description: 'Catch Pokémon with Marks.',
    category: 'Poké Balls',
    type: 'tiered',
    trackingScope: 'shared',
    isSecret: false,
    enabled: true,
    sortOrder: 44,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'marks_collected',
      target: 'any_mark',
      details: 'Pokémon caught with wild encounter marks'
    },
    metadata: {}
  },

  // ==========================================
  // EVENTS
  // ==========================================
  {
    id: 'ach-eve-01',
    slug: 'bingo',
    name: 'BINGO!',
    description: 'Complete a BINGO sheet from any year.',
    category: 'Events',
    type: 'single',
    tier: 'diamond',
    trackingScope: 'shared',
    hasShinySwitch: false,
    hasShiny: false,
    isSecret: false,
    enabled: true,
    sortOrder: 50,
    artwork: '/badges/bingo!/bingo!.png',
    shinyArtwork: null,
    tiers: [
      { id: 't1', name: 'Diamond', order: 1, threshold: 1, requirementDescription: 'Complete a BINGO from any year', artworkUrl: '/badges/bingo!/bingo!.png' }
    ],
    requirements: {
      type: 'bingo_completed',
      target: 'any_year',
      details: 'Complete a BINGO from any annual board'
    },
    metadata: {
      instantDiamond: true
    }
  },

  // ==========================================
  // ACCOUNT & COMMUNITY
  // ==========================================
  {
    id: 'ach-com-01',
    slug: 'pokeveteran',
    name: 'PokéVeteran',
    description: 'Account age milestones.',
    category: 'Account & Community',
    type: 'tiered',
    trackingScope: 'shared',
    isSecret: false,
    enabled: true,
    sortOrder: 60,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured (e.g. 30 days)', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured (e.g. 180 days)', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured (e.g. 365 days)', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured (e.g. 730+ days)', artworkUrl: null }
    ],
    requirements: {
      type: 'account_age_days',
      target: 'days_since_created',
      details: 'Time since user registration'
    },
    metadata: {}
  },
  {
    id: 'ach-com-02',
    slug: 'dex-supporter',
    name: 'Dex Supporter',
    description: 'Membership month milestones.',
    category: 'Account & Community',
    type: 'tiered',
    trackingScope: 'shared',
    isSecret: false,
    enabled: true,
    sortOrder: 61,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured (e.g. 1 month)', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured (e.g. 3 months)', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured (e.g. 6 months)', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured (e.g. 12+ months)', artworkUrl: null }
    ],
    requirements: {
      type: 'membership_months',
      target: 'active_premium_months',
      details: 'Cumulative active supporter membership months'
    },
    metadata: {}
  },
  {
    id: 'ach-com-03',
    slug: 'popular-trainer',
    name: 'Popular Trainer',
    description: 'Profile like milestones.',
    category: 'Account & Community',
    type: 'tiered',
    trackingScope: 'shared',
    isSecret: false,
    enabled: true,
    sortOrder: 62,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'profile_likes',
      target: 'likes_count',
      details: 'Likes received from community trainers'
    },
    metadata: {}
  },
  {
    id: 'ach-com-04',
    slug: 'among-the-elite',
    name: 'Among the Elite',
    description: 'Reach configured top percentile milestones on leaderboards.',
    category: 'Account & Community',
    type: 'tiered',
    trackingScope: 'shared',
    isSecret: false,
    enabled: true,
    sortOrder: 63,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured (e.g. Top 25%)', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured (e.g. Top 10%)', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured (e.g. Top 5%)', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured (e.g. Top 1% / Podium)', artworkUrl: null }
    ],
    requirements: {
      type: 'leaderboard_percentile',
      target: 'global_rank',
      details: 'Global dex leaderboard standing percentiles'
    },
    metadata: {}
  },

  // ==========================================
  // SECRET
  // ==========================================
  {
    id: 'ach-sec-01',
    slug: 'arceus-chosen',
    name: 'Arceus Chosen',
    description: 'Internal concept: Extremely rare achievement for completing a hunt in less than 1% of odds.',
    category: 'Secret',
    type: 'secret',
    tier: 'diamond',
    trackingScope: 'shared',
    isSecret: true,
    enabled: true,
    sortOrder: 70,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Diamond', order: 1, threshold: null, requirementDescription: 'Find a shiny within less than 1% of standard mathematical odds', artworkUrl: null }
    ],
    requirements: {
      type: 'under_odds_percent',
      target: '1_percent',
      details: 'Hunt encounters under 1% standard odds'
    },
    metadata: {
      publicSecretName: '???',
      publicSecretDescription: '???',
      publicSecretRequirement: 'Unknown requirement'
    }
  },
  {
    id: 'ach-sec-02',
    slug: '1-8192-logo',
    name: '1/8192 Logo',
    description: 'Internal concept: Extremely rare hidden badge related to the site\'s 1/8192 logo concept.',
    category: 'Secret',
    type: 'secret',
    tier: 'diamond',
    trackingScope: 'shared',
    isSecret: true,
    enabled: true,
    sortOrder: 71,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Diamond', order: 1, threshold: null, requirementDescription: 'Log a full-odds 1/8192 shiny encounter', artworkUrl: null }
    ],
    requirements: {
      type: 'custom_condition',
      target: 'exact_8192_odds',
      details: 'Full-odds Gen 2-5 wild encounter captured'
    },
    metadata: {
      publicSecretName: '???',
      publicSecretDescription: '???',
      publicSecretRequirement: 'Unknown requirement'
    }
  }
];

export function getAchievementStatus(achievement) {
  if (!achievement.enabled) return 'Disabled';
  const hasArtwork = achievement.tiers && achievement.tiers.some(t => Boolean(t.artworkUrl));
  if (!hasArtwork) return 'Missing Artwork';
  const hasThresholds = achievement.tiers && achievement.tiers.some(t => t.threshold !== null && t.threshold !== '');
  if (!hasThresholds) return 'Draft';
  return 'Configured';
}

/**
 * Determines if an achievement badge supports regular / shiny variant toggling.
 * Planned ahead so badges can easily opt out in the future (e.g. universal achievements).
 */
export function isBadgeShinyToggleable(achievement) {
  if (!achievement) return false;
  if (achievement.hasShinySwitch === false || achievement.isUniversal === true) {
    return false;
  }
  // Future rule: if specific tracking scope is deemed universal, can be filtered here.
  return true;
}

/**
 * Resolves the artwork URL for an achievement badge given its shiny state and active tier.
 */
export function getBadgeArtwork(achievement, isShiny = false, activeTier = null) {
  if (!achievement) return null;

  // 1. Tier-specific artwork if available
  if (activeTier && achievement.tiers?.length) {
    const tierObj = achievement.tiers.find(
      t => (t.name || '').toLowerCase() === activeTier.toLowerCase() || t.id === activeTier
    );
    if (tierObj) {
      if (isShiny && (tierObj.shinyArtworkUrl || tierObj.artworkShinyUrl)) {
        return tierObj.shinyArtworkUrl || tierObj.artworkShinyUrl;
      }
      if (!isShiny && tierObj.artworkUrl) {
        return tierObj.artworkUrl;
      }
    }
  }

  // 2. Base achievement artwork
  if (isShiny) {
    if (achievement.shinyArtwork) return achievement.shinyArtwork;
    if (achievement.artworkShiny) return achievement.artworkShiny;
    if (achievement.shinyArtwork === null) return achievement.artwork || null;
    if (achievement.artwork && typeof achievement.artwork === 'string') {
      const shinyGuess = achievement.artwork.replace(/(\.png|\.jpg|\.jpeg|\.webp)$/i, '-shiny$1');
      if (shinyGuess !== achievement.artwork) {
        return shinyGuess;
      }
    }
  }

  return achievement.artwork || null;
}

/**
 * Checks if the user has completed a BINGO (5 in a row/column/diagonal or full 25 board) from any year.
 */
export function checkUserHasCompletedBingo(extraGrids = null) {
  const isGridBingoComplete = (grid) => {
    if (!Array.isArray(grid) || grid.length < 25) return false;

    const isCellCompleted = (index) => Boolean(grid[index]?.completed);

    // 5 Rows (Horizontal)
    for (let r = 0; r < 5; r++) {
      const start = r * 5;
      if (
        isCellCompleted(start) &&
        isCellCompleted(start + 1) &&
        isCellCompleted(start + 2) &&
        isCellCompleted(start + 3) &&
        isCellCompleted(start + 4)
      ) {
        return true;
      }
    }

    // 5 Columns (Vertical)
    for (let c = 0; c < 5; c++) {
      if (
        isCellCompleted(c) &&
        isCellCompleted(c + 5) &&
        isCellCompleted(c + 10) &&
        isCellCompleted(c + 15) &&
        isCellCompleted(c + 20)
      ) {
        return true;
      }
    }

    // 2 Diagonals
    if (
      isCellCompleted(0) &&
      isCellCompleted(6) &&
      isCellCompleted(12) &&
      isCellCompleted(18) &&
      isCellCompleted(24)
    ) {
      return true;
    }

    if (
      isCellCompleted(4) &&
      isCellCompleted(8) &&
      isCellCompleted(12) &&
      isCellCompleted(16) &&
      isCellCompleted(20)
    ) {
      return true;
    }

    return false;
  };

  // 1. Explicit flag in localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      if (localStorage.getItem('hasCompletedBingo') === 'true') {
        return true;
      }
    }
  } catch {}

  // 2. Extra grids passed in (e.g. from server API or memory)
  if (extraGrids) {
    if (Array.isArray(extraGrids)) {
      if (isGridBingoComplete(extraGrids)) return true;
    } else if (typeof extraGrids === 'object') {
      for (const val of Object.values(extraGrids)) {
        if (Array.isArray(val) && isGridBingoComplete(val)) return true;
        if (val && Array.isArray(val.grid) && isGridBingoComplete(val.grid)) return true;
      }
    }
  }

  // 3. Scan all localStorage keys for bingo grids
  try {
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('bingo-grid-state') || key.includes('bingo-grid'))) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (isGridBingoComplete(parsed)) return true;
            } catch {}
          }
        }
      }
    }
  } catch {}

  return false;
}

/**
 * Calculates current progress, unlocked status, active tier, and goal text for an achievement.
 * Handles both regular and shiny variant tracking separately.
 */
export function calculateAchievementProgress(achievement, caughtMap = {}, isShiny = false) {
  if (!achievement) {
    return {
      currentCount: 0,
      totalCount: 0,
      unlocked: false,
      unlockedTier: null,
      highestTierName: null,
      nextTier: null,
      displayGoal: '',
      tierOrder: 0,
      tiers: []
    };
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

  // 1. Sweet Perfection: 63 unique Alcremie combinations (excluding G-Max)
  if (achievement.slug === 'sweet-perfection' || achievement.slug === 'patisserie-chef' || achievement.requirements?.target === 'alcremie_forms') {
    const totalCount = 63;
    let currentCount = 0;

    ALCREMIE_FORMS_LIST.forEach(form => {
      const stableKey = isShiny ? `${form.stableId}_shiny` : form.stableId;
      const nameKey = isShiny ? `${form.name}_shiny` : form.name;
      const formKey = isShiny ? `${form.name}_alcremie_shiny` : `${form.name}_alcremie`;
      const numKey = isShiny ? `869_${form.name}_shiny` : `869_${form.name}`;

      const isCaught = 
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[formKey]) ||
        isEntryCaught(caughtMap[numKey]);

      if (isCaught) {
        currentCount++;
      }
    });

    // 4 Tiered Thresholds: Bronze: 7 (11%), Silver: 21 (33%), Gold: 42 (67%), Diamond: 63 (100%)
    const tiers = achievement.tiers || [
      { id: 't1', name: 'Bronze', order: 1, threshold: 7 },
      { id: 't2', name: 'Silver', order: 2, threshold: 21 },
      { id: 't3', name: 'Gold', order: 3, threshold: 42 },
      { id: 't4', name: 'Diamond', order: 4, threshold: 63 }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch 7 unique ${shinyLabel}Alcremie forms.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === 63 ? 'all 63' : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Alcremie forms.`;
    } else {
      displayGoal = `All 63 unique ${shinyLabel}Alcremie forms registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // 2. Master Collector: 1,025 mainline Pokémon in the Living Dex (997 for shiny excluding locked)
  if (achievement.slug === 'master-collector' || achievement.slug === 'living-legends' || achievement.requirements?.target === 'national_dex_all') {
    const targetPokemon = isShiny ? pokemonData.filter(p => !isUnobtainableShiny(p)) : pokemonData;
    const totalCount = targetPokemon.length || (isShiny ? 997 : 1025);
    let currentCount = 0;

    targetPokemon.forEach(poke => {
      const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
      const idKey = isShiny ? `${poke.id}_shiny` : `${poke.id}`;
      const paddedIdKey = isShiny ? `${String(poke.id).padStart(4, '0')}_shiny` : `${String(poke.id).padStart(4, '0')}`;
      const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
      const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;

      const isCaught =
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[idKey]) ||
        isEntryCaught(caughtMap[paddedIdKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[nameIdKey]);

      if (isCaught) {
        currentCount++;
      }
    });

    const diamondThresh = totalCount;
    const tiers = [
      { id: 't1', name: 'Bronze', order: 1, threshold: 100, requirementDescription: `Register 100 ${isShiny ? 'shiny ' : ''}Pokémon in the Living Dex`, artworkUrl: '/badges/master-collector/master-collector.png', shinyArtworkUrl: '/badges/master-collector/master-collector-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 300, requirementDescription: `Register 300 ${isShiny ? 'shiny ' : ''}Pokémon in the Living Dex`, artworkUrl: '/badges/master-collector/master-collector.png', shinyArtworkUrl: '/badges/master-collector/master-collector-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 600, requirementDescription: `Register 600 ${isShiny ? 'shiny ' : ''}Pokémon in the Living Dex`, artworkUrl: '/badges/master-collector/master-collector.png', shinyArtworkUrl: '/badges/master-collector/master-collector-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: diamondThresh, requirementDescription: `Register all ${diamondThresh.toLocaleString()} ${isShiny ? 'shiny ' : ''}Pokémon in the Living Dex`, artworkUrl: '/badges/master-collector/master-collector.png', shinyArtworkUrl: '/badges/master-collector/master-collector-shiny.png' }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch 100 ${shinyLabel}Pokémon.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount.toLocaleString()}` : nextTier.threshold.toLocaleString();
      displayGoal = `Catch ${targetStr} ${shinyLabel}Pokémon.`;
    } else {
      displayGoal = `All ${totalCount.toLocaleString()} ${shinyLabel}Pokémon registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // 3. Mythical Pursuit: All 28 Mythical Pokémon & Forms (excluding unobtainable locked shinies for shiny tracking)
  if (achievement.slug === 'mythical-pursuit' || achievement.slug === 'mythical-enigma' || achievement.requirements?.target === 'mythicals') {
    const allMythicals = MYTHICAL_POKEMON_LIST;
    const targetMythicals = isShiny ? allMythicals.filter(p => !isUnobtainableShiny(p)) : allMythicals;
    const totalCount = targetMythicals.length || (isShiny ? 20 : 28);
    let currentCount = 0;

    targetMythicals.forEach(poke => {
      const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
      const idKey = isShiny ? `${poke.id}_shiny` : `${poke.id}`;
      const paddedIdKey = isShiny ? `${String(poke.id).padStart(4, '0')}_shiny` : `${String(poke.id).padStart(4, '0')}`;
      const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
      const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;
      const formKey = isShiny ? `${poke.name}_${poke.formType}_shiny` : `${poke.name}_${poke.formType}`;

      const isCaught =
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[idKey]) ||
        isEntryCaught(caughtMap[paddedIdKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[nameIdKey]) ||
        isEntryCaught(caughtMap[formKey]);

      if (isCaught) {
        currentCount++;
      }
    });

    const bThresh = isShiny ? Math.max(1, Math.round(3 * (totalCount / 28))) : 3;
    const sThresh = isShiny ? Math.round(8 * (totalCount / 28)) : 8;
    const gThresh = isShiny ? Math.round(16 * (totalCount / 28)) : 16;
    const dThresh = totalCount;

    const tiers = [
      { id: 't1', name: 'Bronze', order: 1, threshold: bThresh, requirementDescription: `Register ${bThresh} ${isShiny ? 'shiny ' : ''}Mythical Pokémon in the Living Dex`, artworkUrl: '/badges/mythical-pursuit/mythical-pursuit.png', shinyArtworkUrl: '/badges/mythical-pursuit/mythical-pursuit-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: sThresh, requirementDescription: `Register ${sThresh} ${isShiny ? 'shiny ' : ''}Mythical Pokémon in the Living Dex`, artworkUrl: '/badges/mythical-pursuit/mythical-pursuit.png', shinyArtworkUrl: '/badges/mythical-pursuit/mythical-pursuit-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: gThresh, requirementDescription: `Register ${gThresh} ${isShiny ? 'shiny ' : ''}Mythical Pokémon in the Living Dex`, artworkUrl: '/badges/mythical-pursuit/mythical-pursuit.png', shinyArtworkUrl: '/badges/mythical-pursuit/mythical-pursuit-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: dThresh, requirementDescription: `Register all ${dThresh} ${isShiny ? 'shiny ' : ''}Mythical Pokémon and forms in the Living Dex`, artworkUrl: '/badges/mythical-pursuit/mythical-pursuit.png', shinyArtworkUrl: '/badges/mythical-pursuit/mythical-pursuit-shiny.png' }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch ${tiers[0].threshold} unique ${shinyLabel}Mythical Pokémon.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Mythical Pokémon.`;
    } else {
      displayGoal = `All ${totalCount} unique ${shinyLabel}Mythical Pokémon registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // Master of Legends: 80 Legendary Pokémon & Forms (55 for shiny excluding shiny-locked)
  if (achievement.slug === 'master-of-legends' || achievement.slug === 'titan-slayer' || achievement.requirements?.target === 'legendaries') {
    const allLegendaries = LEGENDARY_ACHIEVEMENT_LIST;
    const targetLegendaries = isShiny
      ? allLegendaries.filter(p => !isTitanSlayerShinyLocked(p))
      : allLegendaries;
    const totalCount = targetLegendaries.length || (isShiny ? 55 : 80);
    let currentCount = 0;

    targetLegendaries.forEach(poke => {
      const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
      const idKey = isShiny ? `${poke.id}_shiny` : `${poke.id}`;
      const paddedIdKey = isShiny ? `${String(poke.id).padStart(4, '0')}_shiny` : `${String(poke.id).padStart(4, '0')}`;
      const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
      const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;
      const formKey = isShiny ? `${poke.name}_${poke.formType}_shiny` : `${poke.name}_${poke.formType}`;

      const isCaught =
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[idKey]) ||
        isEntryCaught(caughtMap[paddedIdKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[nameIdKey]) ||
        isEntryCaught(caughtMap[formKey]);

      if (isCaught) {
        currentCount++;
      }
    });

    const bThresh = isShiny ? 5 : 8;
    const sThresh = isShiny ? 15 : 24;
    const gThresh = isShiny ? 30 : 45;
    const dThresh = isShiny ? 55 : 80;

    const tiers = [
      { id: 't1', name: 'Bronze', order: 1, threshold: bThresh, requirementDescription: `Register ${bThresh} ${isShiny ? 'shiny ' : ''}Legendary Pokémon in the Living Dex`, artworkUrl: '/badges/master-of-legends/master-of-legends.png', shinyArtworkUrl: '/badges/master-of-legends/master-of-legends-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: sThresh, requirementDescription: `Register ${sThresh} ${isShiny ? 'shiny ' : ''}Legendary Pokémon in the Living Dex`, artworkUrl: '/badges/master-of-legends/master-of-legends.png', shinyArtworkUrl: '/badges/master-of-legends/master-of-legends-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: gThresh, requirementDescription: `Register ${gThresh} ${isShiny ? 'shiny ' : ''}Legendary Pokémon in the Living Dex`, artworkUrl: '/badges/master-of-legends/master-of-legends.png', shinyArtworkUrl: '/badges/master-of-legends/master-of-legends-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: dThresh, requirementDescription: `Register all ${dThresh} ${isShiny ? 'shiny ' : ''}Legendary Pokémon and forms in the Living Dex`, artworkUrl: '/badges/master-of-legends/master-of-legends.png', shinyArtworkUrl: '/badges/master-of-legends/master-of-legends-shiny.png' }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch ${tiers[0].threshold} unique ${shinyLabel}Legendary Pokémon.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Legendary Pokémon.`;
    } else {
      displayGoal = `All ${totalCount} unique ${shinyLabel}Legendary Pokémon registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // Otherworldly Beasts: 11 Ultra Beasts (Bronze: 2, Silver: 4, Gold: 7, Diamond: 11)
  if (achievement.slug === 'otherworldly-beasts' || achievement.slug === 'extradimensional-encounter' || achievement.requirements?.target === 'ultra_beasts') {
    const ubList = ULTRA_BEASTS_LIST;
    const totalCount = ubList.length || 11;
    let currentCount = 0;

    ubList.forEach(poke => {
      const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
      const idKey = isShiny ? `${poke.id}_shiny` : `${poke.id}`;
      const paddedIdKey = isShiny ? `${String(poke.id).padStart(4, '0')}_shiny` : `${String(poke.id).padStart(4, '0')}`;
      const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
      const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;

      const isCaught =
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[idKey]) ||
        isEntryCaught(caughtMap[paddedIdKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[nameIdKey]);

      if (isCaught) {
        currentCount++;
      }
    });

    const tiers = [
      { id: 't1', name: 'Bronze', order: 1, threshold: 2, requirementDescription: `Register 2 ${isShiny ? 'shiny ' : ''}Ultra Beasts in the Living Dex`, artworkUrl: '/badges/otherworldly-beasts/otherworldly-beasts.png', shinyArtworkUrl: '/badges/otherworldly-beasts/otherworldly-beasts-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 4, requirementDescription: `Register 4 ${isShiny ? 'shiny ' : ''}Ultra Beasts in the Living Dex`, artworkUrl: '/badges/otherworldly-beasts/otherworldly-beasts.png', shinyArtworkUrl: '/badges/otherworldly-beasts/otherworldly-beasts-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 7, requirementDescription: `Register 7 ${isShiny ? 'shiny ' : ''}Ultra Beasts in the Living Dex`, artworkUrl: '/badges/otherworldly-beasts/otherworldly-beasts.png', shinyArtworkUrl: '/badges/otherworldly-beasts/otherworldly-beasts-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 11, requirementDescription: `Register all 11 ${isShiny ? 'shiny ' : ''}Ultra Beasts in the Living Dex`, artworkUrl: '/badges/otherworldly-beasts/otherworldly-beasts.png', shinyArtworkUrl: '/badges/otherworldly-beasts/otherworldly-beasts-shiny.png' }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch ${tiers[0].threshold} unique ${shinyLabel}Ultra Beasts.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Ultra Beasts.`;
    } else {
      displayGoal = `All ${totalCount} unique ${shinyLabel}Ultra Beasts registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // Near Legendary: 11 Pseudo-Legendary Pokémon (Bronze: 2, Silver: 4, Gold: 7, Diamond: 11)
  if (achievement.slug === 'near-legendary' || achievement.slug === 'draconic-nobility' || achievement.requirements?.target === 'pseudo_legendaries') {
    const pseudoList = PSEUDO_LEGENDARY_LIST;
    const totalCount = pseudoList.length || 11;
    let currentCount = 0;

    pseudoList.forEach(poke => {
      if (poke.name === 'goodra-hisui' || poke.formType === 'hisuian') {
        const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
        const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
        const altKey = isShiny ? 'goodra-hisui-706_shiny' : 'goodra-hisui-706';
        if (
          isEntryCaught(caughtMap[stableKey]) ||
          isEntryCaught(caughtMap[nameKey]) ||
          isEntryCaught(caughtMap[altKey])
        ) {
          currentCount++;
        }
        return;
      }
      const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
      const idKey = isShiny ? `${poke.id}_shiny` : `${poke.id}`;
      const paddedIdKey = isShiny ? `${String(poke.id).padStart(4, '0')}_shiny` : `${String(poke.id).padStart(4, '0')}`;
      const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
      const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;

      const isCaught =
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[idKey]) ||
        isEntryCaught(caughtMap[paddedIdKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[nameIdKey]);

      if (isCaught) {
        currentCount++;
      }
    });

    const tiers = [
      { id: 't1', name: 'Bronze', order: 1, threshold: 2, requirementDescription: `Register 2 ${isShiny ? 'shiny ' : ''}Pseudo-Legendary Pokémon in the Living Dex`, artworkUrl: '/badges/near-legendary/near-legendary.png', shinyArtworkUrl: '/badges/near-legendary/near-legendary-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 4, requirementDescription: `Register 4 ${isShiny ? 'shiny ' : ''}Pseudo-Legendary Pokémon in the Living Dex`, artworkUrl: '/badges/near-legendary/near-legendary.png', shinyArtworkUrl: '/badges/near-legendary/near-legendary-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 7, requirementDescription: `Register 7 ${isShiny ? 'shiny ' : ''}Pseudo-Legendary Pokémon in the Living Dex`, artworkUrl: '/badges/near-legendary/near-legendary.png', shinyArtworkUrl: '/badges/near-legendary/near-legendary-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 11, requirementDescription: `Register all 11 ${isShiny ? 'shiny ' : ''}Pseudo-Legendary Pokémon in the Living Dex`, artworkUrl: '/badges/near-legendary/near-legendary.png', shinyArtworkUrl: '/badges/near-legendary/near-legendary-shiny.png' }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch 2 unique ${shinyLabel}Pseudo-Legendary Pokémon.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Pseudo-Legendary Pokémon.`;
    } else {
      displayGoal = `All ${totalCount} unique ${shinyLabel}Pseudo-Legendary Pokémon registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // Past & Future: 22 Paradox Pokémon (14 for shiny)
  // Regular: Bronze: 3, Silver: 7, Gold: 13, Diamond: 22
  // Shiny: Bronze: 2, Silver: 5, Gold: 9, Diamond: 14
  if (achievement.slug === 'past-and-future' || achievement.slug === 'anomalies-of-time' || achievement.requirements?.target === 'paradox') {
    const rawParadoxList = PARADOX_POKEMON_LIST;
    const paradoxList = isShiny
      ? rawParadoxList.filter(p => !isUnobtainableShiny(p))
      : rawParadoxList;
    const totalCount = paradoxList.length || (isShiny ? 14 : 22);
    let currentCount = 0;

    paradoxList.forEach(poke => {
      const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
      const idKey = isShiny ? `${poke.id}_shiny` : `${poke.id}`;
      const paddedIdKey = isShiny ? `${String(poke.id).padStart(4, '0')}_shiny` : `${String(poke.id).padStart(4, '0')}`;
      const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
      const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;

      const isCaught =
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[idKey]) ||
        isEntryCaught(caughtMap[paddedIdKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[nameIdKey]);

      if (isCaught) {
        currentCount++;
      }
    });

    const bThresh = isShiny ? 2 : 3;
    const sThresh = isShiny ? 5 : 7;
    const gThresh = isShiny ? 9 : 13;
    const dThresh = isShiny ? 14 : 22;

    const tiers = [
      { id: 't1', name: 'Bronze', order: 1, threshold: bThresh, requirementDescription: `Register ${bThresh} ${isShiny ? 'shiny ' : ''}Paradox Pokémon in the Living Dex`, artworkUrl: '/badges/past-and-future/past-and-future.png', shinyArtworkUrl: '/badges/past-and-future/past-and-future-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: sThresh, requirementDescription: `Register ${sThresh} ${isShiny ? 'shiny ' : ''}Paradox Pokémon in the Living Dex`, artworkUrl: '/badges/past-and-future/past-and-future.png', shinyArtworkUrl: '/badges/past-and-future/past-and-future-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: gThresh, requirementDescription: `Register ${gThresh} ${isShiny ? 'shiny ' : ''}Paradox Pokémon in the Living Dex`, artworkUrl: '/badges/past-and-future/past-and-future.png', shinyArtworkUrl: '/badges/past-and-future/past-and-future-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: dThresh, requirementDescription: `Register all ${dThresh} ${isShiny ? 'shiny ' : ''}Paradox Pokémon in the Living Dex`, artworkUrl: '/badges/past-and-future/past-and-future.png', shinyArtworkUrl: '/badges/past-and-future/past-and-future-shiny.png' }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch ${bThresh} unique ${shinyLabel}Paradox Pokémon.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Paradox Pokémon.`;
    } else {
      displayGoal = `All ${totalCount} unique ${shinyLabel}Paradox Pokémon registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // Where It All Began: 27 Starter Pokémon (Bronze: 3, Silver: 8, Gold: 15, Diamond: 27)
  if (achievement.slug === 'where-it-all-began' || achievement.slug === 'first-partner-hall-of-fame' || achievement.requirements?.target === 'starters') {
    const starterList = STARTER_POKEMON_LIST;
    const totalCount = starterList.length || 27;
    let currentCount = 0;

    starterList.forEach(poke => {
      const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
      const idKey = isShiny ? `${poke.id}_shiny` : `${poke.id}`;
      const paddedIdKey = isShiny ? `${String(poke.id).padStart(4, '0')}_shiny` : `${String(poke.id).padStart(4, '0')}`;
      const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
      const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;

      const isCaught =
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[idKey]) ||
        isEntryCaught(caughtMap[paddedIdKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[nameIdKey]);

      if (isCaught) {
        currentCount++;
      }
    });

    const tiers = [
      { id: 't1', name: 'Bronze', order: 1, threshold: 3, requirementDescription: `Register 3 ${isShiny ? 'shiny ' : ''}Starter Pokémon in the Living Dex`, artworkUrl: '/badges/where-it-all-began/where-it-all-began.png', shinyArtworkUrl: '/badges/where-it-all-began/where-it-all-began-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 8, requirementDescription: `Register 8 ${isShiny ? 'shiny ' : ''}Starter Pokémon in the Living Dex`, artworkUrl: '/badges/where-it-all-began/where-it-all-began.png', shinyArtworkUrl: '/badges/where-it-all-began/where-it-all-began-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 15, requirementDescription: `Register 15 ${isShiny ? 'shiny ' : ''}Starter Pokémon in the Living Dex`, artworkUrl: '/badges/where-it-all-began/where-it-all-began.png', shinyArtworkUrl: '/badges/where-it-all-began/where-it-all-began-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 27, requirementDescription: `Register all 27 ${isShiny ? 'shiny ' : ''}Starter Pokémon in the Living Dex`, artworkUrl: '/badges/where-it-all-began/where-it-all-began.png', shinyArtworkUrl: '/badges/where-it-all-began/where-it-all-began-shiny.png' }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch 3 unique ${shinyLabel}Starter Pokémon.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Starter Pokémon.`;
    } else {
      displayGoal = `All ${totalCount} unique ${shinyLabel}Starter Pokémon registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // Paleontologist: 15 Fossil Pokémon (Bronze: 2, Silver: 5, Gold: 9, Diamond: 15)
  if (achievement.slug === 'paleontologist' || achievement.requirements?.target === 'fossils') {
    const fossilList = FOSSIL_POKEMON_LIST;
    const totalCount = fossilList.length || 15;
    let currentCount = 0;

    fossilList.forEach(poke => {
      const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
      const idKey = isShiny ? `${poke.id}_shiny` : `${poke.id}`;
      const paddedIdKey = isShiny ? `${String(poke.id).padStart(4, '0')}_shiny` : `${String(poke.id).padStart(4, '0')}`;
      const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
      const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;

      const isCaught =
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[idKey]) ||
        isEntryCaught(caughtMap[paddedIdKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[nameIdKey]);

      if (isCaught) {
        currentCount++;
      }
    });

    const tiers = [
      { id: 't1', name: 'Bronze', order: 1, threshold: 2, requirementDescription: `Register 2 ${isShiny ? 'shiny ' : ''}Fossil Pokémon in the Living Dex`, artworkUrl: '/badges/paleontologist/paleontologist.png', shinyArtworkUrl: '/badges/paleontologist/paleontologist-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 5, requirementDescription: `Register 5 ${isShiny ? 'shiny ' : ''}Fossil Pokémon in the Living Dex`, artworkUrl: '/badges/paleontologist/paleontologist.png', shinyArtworkUrl: '/badges/paleontologist/paleontologist-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 9, requirementDescription: `Register 9 ${isShiny ? 'shiny ' : ''}Fossil Pokémon in the Living Dex`, artworkUrl: '/badges/paleontologist/paleontologist.png', shinyArtworkUrl: '/badges/paleontologist/paleontologist-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 15, requirementDescription: `Register all 15 ${isShiny ? 'shiny ' : ''}Fossil Pokémon in the Living Dex`, artworkUrl: '/badges/paleontologist/paleontologist.png', shinyArtworkUrl: '/badges/paleontologist/paleontologist-shiny.png' }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch 2 unique ${shinyLabel}Fossil Pokémon.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Fossil Pokémon.`;
    } else {
      displayGoal = `All ${totalCount} unique ${shinyLabel}Fossil Pokémon registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // Small Beginnings: 19 Baby Pokémon (Bronze: 2, Silver: 6, Gold: 11, Diamond: 19)
  if (achievement.slug === 'small-beginnings' || achievement.slug === 'daycare-maestro' || achievement.requirements?.target === 'babies') {
    const babyList = BABY_POKEMON_LIST;
    const totalCount = babyList.length || 19;
    let currentCount = 0;

    babyList.forEach(poke => {
      const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
      const idKey = isShiny ? `${poke.id}_shiny` : `${poke.id}`;
      const paddedIdKey = isShiny ? `${String(poke.id).padStart(4, '0')}_shiny` : `${String(poke.id).padStart(4, '0')}`;
      const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
      const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;

      const isCaught =
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[idKey]) ||
        isEntryCaught(caughtMap[paddedIdKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[nameIdKey]);

      if (isCaught) {
        currentCount++;
      }
    });

    const tiers = [
      { id: 't1', name: 'Bronze', order: 1, threshold: 2, requirementDescription: `Register 2 ${isShiny ? 'shiny ' : ''}Baby Pokémon in the Living Dex`, artworkUrl: '/badges/small-beginnings/small-beginnings.png', shinyArtworkUrl: '/badges/small-beginnings/small-beginnings-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 6, requirementDescription: `Register 6 ${isShiny ? 'shiny ' : ''}Baby Pokémon in the Living Dex`, artworkUrl: '/badges/small-beginnings/small-beginnings.png', shinyArtworkUrl: '/badges/small-beginnings/small-beginnings-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 11, requirementDescription: `Register 11 ${isShiny ? 'shiny ' : ''}Baby Pokémon in the Living Dex`, artworkUrl: '/badges/small-beginnings/small-beginnings.png', shinyArtworkUrl: '/badges/small-beginnings/small-beginnings-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 19, requirementDescription: `Register all 19 ${isShiny ? 'shiny ' : ''}Baby Pokémon in the Living Dex`, artworkUrl: '/badges/small-beginnings/small-beginnings.png', shinyArtworkUrl: '/badges/small-beginnings/small-beginnings-shiny.png' }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch 2 unique ${shinyLabel}Baby Pokémon.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Baby Pokémon.`;
    } else {
      displayGoal = `All ${totalCount} unique ${shinyLabel}Baby Pokémon registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // 4. Ancient Alphabet: 28 unique Unown forms (A from base dex + 27 forms from unown category)
  if (achievement.slug === 'ancient-alphabet' || achievement.requirements?.target === 'unown_forms') {
    const unownList = UNOWN_FORMS_LIST;
    const totalCount = unownList.length || 28;
    let currentCount = 0;

    unownList.forEach(poke => {
      const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
      const idKey = isShiny ? `${poke.id}_shiny` : `${poke.id}`;
      const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
      const formKey = isShiny ? `${poke.name}_unown_shiny` : `${poke.name}_unown`;

      const isCaught =
        isEntryCaught(caughtMap[stableKey]) ||
        (poke.name === 'unown' && isEntryCaught(caughtMap[idKey])) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[formKey]);

      if (isCaught) {
        currentCount++;
      }
    });

    const tiers = achievement.tiers || [
      { id: 't1', name: 'Bronze', order: 1, threshold: 3, requirementDescription: `Register 3 unique ${isShiny ? 'shiny ' : ''}Unown forms in the Living Dex`, artworkUrl: '/badges/ancient-alphabet/ancient-alphabet.png', shinyArtworkUrl: '/badges/ancient-alphabet/ancient-alphabet-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 8, requirementDescription: `Register 8 unique ${isShiny ? 'shiny ' : ''}Unown forms in the Living Dex`, artworkUrl: '/badges/ancient-alphabet/ancient-alphabet.png', shinyArtworkUrl: '/badges/ancient-alphabet/ancient-alphabet-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 16, requirementDescription: `Register 16 unique ${isShiny ? 'shiny ' : ''}Unown forms in the Living Dex`, artworkUrl: '/badges/ancient-alphabet/ancient-alphabet.png', shinyArtworkUrl: '/badges/ancient-alphabet/ancient-alphabet-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 28, requirementDescription: `Register all 28 unique ${isShiny ? 'shiny ' : ''}Unown forms in the Living Dex`, artworkUrl: '/badges/ancient-alphabet/ancient-alphabet.png', shinyArtworkUrl: '/badges/ancient-alphabet/ancient-alphabet-shiny.png' }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch 3 unique ${shinyLabel}Unown forms.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Unown forms.`;
    } else {
      displayGoal = `All ${totalCount} unique ${shinyLabel}Unown forms registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // 5. Apex Predator: 656 Alpha Pokémon & Forms
  if (achievement.slug === 'apex-predator' || achievement.requirements?.target === 'alpha_forms' || achievement.requirements?.target === 'alpha_pokemon') {
    const alphaList = ALPHA_POKEMON_LIST;
    const totalCount = alphaList.length || 656;
    let currentCount = 0;

    alphaList.forEach(poke => {
      const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
      const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
      const formKey = isShiny ? `${poke.name}_${poke.formType}_shiny` : `${poke.name}_${poke.formType}`;

      const isCaught =
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[formKey]);

      if (isCaught) {
        currentCount++;
      }
    });

    const tiers = achievement.tiers || [
      { id: 't1', name: 'Bronze', order: 1, threshold: 50, requirementDescription: `Register 50 ${isShiny ? 'shiny ' : ''}Alpha Pokémon in the Living Dex`, artworkUrl: '/badges/apex-predator/apex-predator.png', shinyArtworkUrl: '/badges/apex-predator/apex-predator-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 150, requirementDescription: `Register 150 ${isShiny ? 'shiny ' : ''}Alpha Pokémon in the Living Dex`, artworkUrl: '/badges/apex-predator/apex-predator.png', shinyArtworkUrl: '/badges/apex-predator/apex-predator-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 350, requirementDescription: `Register 350 ${isShiny ? 'shiny ' : ''}Alpha Pokémon in the Living Dex`, artworkUrl: '/badges/apex-predator/apex-predator.png', shinyArtworkUrl: '/badges/apex-predator/apex-predator-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 656, requirementDescription: `Register all 656 ${isShiny ? 'shiny ' : ''}Alpha Pokémon in the Living Dex`, artworkUrl: '/badges/apex-predator/apex-predator.png', shinyArtworkUrl: '/badges/apex-predator/apex-predator-shiny.png' }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch 50 unique ${shinyLabel}Alpha Pokémon.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Alpha Pokémon.`;
    } else {
      displayGoal = `All ${totalCount} unique ${shinyLabel}Alpha Pokémon registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // 6. Gigantic Potential: 33 GMAX forms (31 for shiny due to locked Urshifus)
  if (achievement.slug === 'gigantic-potential' || achievement.slug === 'gigantamax-phenom' || achievement.requirements?.target === 'gmax_forms') {
    const rawGmaxList = GMAX_FORMS_LIST;
    const gmaxList = isShiny
      ? rawGmaxList.filter(p => !isUnobtainableShiny(p))
      : rawGmaxList;
    const totalCount = gmaxList.length || (isShiny ? 31 : 33);
    let currentCount = 0;

    gmaxList.forEach(poke => {
      const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
      const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
      const formKey = isShiny ? `${poke.name}_gmax_shiny` : `${poke.name}_gmax`;

      const isCaught =
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[formKey]);

      if (isCaught) {
        currentCount++;
      }
    });

    const diamondThresh = isShiny ? 31 : 33;
    const tiers = [
      { id: 't1', name: 'Bronze', order: 1, threshold: 4, requirementDescription: `Register 4 unique ${isShiny ? 'shiny ' : ''}Gigantamax forms in the Living Dex`, artworkUrl: '/badges/gigantic-potential/gigantic-potential.png', shinyArtworkUrl: '/badges/gigantic-potential/gigantic-potential-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 10, requirementDescription: `Register 10 unique ${isShiny ? 'shiny ' : ''}Gigantamax forms in the Living Dex`, artworkUrl: '/badges/gigantic-potential/gigantic-potential.png', shinyArtworkUrl: '/badges/gigantic-potential/gigantic-potential-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 20, requirementDescription: `Register 20 unique ${isShiny ? 'shiny ' : ''}Gigantamax forms in the Living Dex`, artworkUrl: '/badges/gigantic-potential/gigantic-potential.png', shinyArtworkUrl: '/badges/gigantic-potential/gigantic-potential-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: diamondThresh, requirementDescription: `Register all ${diamondThresh} unique ${isShiny ? 'shiny ' : ''}Gigantamax forms in the Living Dex`, artworkUrl: '/badges/gigantic-potential/gigantic-potential.png', shinyArtworkUrl: '/badges/gigantic-potential/gigantic-potential-shiny.png' }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch 4 unique ${shinyLabel}Gigantamax forms.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Gigantamax forms.`;
    } else {
      displayGoal = `All ${totalCount} unique ${shinyLabel}Gigantamax forms registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // Across the Regions: 57 Regional Forms (54 for shiny due to locked Galarian birds)
  if (achievement.slug === 'across-the-regions' || achievement.slug === 'global-phenotype' || achievement.requirements?.target === 'regional_forms') {
    const rawRegionalList = REGIONAL_FORMS_LIST;
    const regionalList = isShiny
      ? rawRegionalList.filter(p => !isRegionalShinyLocked(p))
      : rawRegionalList;
    const totalCount = regionalList.length || (isShiny ? 54 : 57);
    let currentCount = 0;

    regionalList.forEach(poke => {
      const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
      const formKey = isShiny ? `${poke.name}_${poke.formType}_shiny` : `${poke.name}_${poke.formType}`;
      const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
      const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;

      const isCaught =
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[formKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[nameIdKey]);

      if (isCaught) {
        currentCount++;
      }
    });

    const bronzeThresh = 5;
    const silverThresh = isShiny ? 15 : 16;
    const goldThresh = isShiny ? 30 : 32;
    const diamondThresh = isShiny ? 54 : 57;

    const tiers = [
      { id: 't1', name: 'Bronze', order: 1, threshold: bronzeThresh, requirementDescription: `Register ${bronzeThresh} unique ${isShiny ? 'shiny ' : ''}Regional Forms in the Living Dex`, artworkUrl: '/badges/across-the-regions/across-the-regions.png', shinyArtworkUrl: '/badges/across-the-regions/across-the-regions-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: silverThresh, requirementDescription: `Register ${silverThresh} unique ${isShiny ? 'shiny ' : ''}Regional Forms in the Living Dex`, artworkUrl: '/badges/across-the-regions/across-the-regions.png', shinyArtworkUrl: '/badges/across-the-regions/across-the-regions-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: goldThresh, requirementDescription: `Register ${goldThresh} unique ${isShiny ? 'shiny ' : ''}Regional Forms in the Living Dex`, artworkUrl: '/badges/across-the-regions/across-the-regions.png', shinyArtworkUrl: '/badges/across-the-regions/across-the-regions-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: diamondThresh, requirementDescription: `Register all ${diamondThresh} unique ${isShiny ? 'shiny ' : ''}Regional Forms in the Living Dex`, artworkUrl: '/badges/across-the-regions/across-the-regions.png', shinyArtworkUrl: '/badges/across-the-regions/across-the-regions-shiny.png' }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch ${bronzeThresh} unique ${shinyLabel}Regional Forms.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Regional Forms.`;
    } else {
      displayGoal = `All ${totalCount} unique ${shinyLabel}Regional Forms registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // 7. Mightiest of Them All: 54 Mighty Mark Pokémon (Regular only)
  if (achievement.slug === 'mightiest-of-them-all' || achievement.slug === 'mighty-champion' || achievement.requirements?.target === 'mightiest_mark') {
    const mightyList = MIGHTY_POKEMON_LIST;
    const totalCount = mightyList.length || 54;
    let currentCount = 0;

    mightyList.forEach(poke => {
      const stableKey = poke.stableId;
      const nameKey = poke.name;
      const formKey = `${poke.name}_mighty`;

      const isCaught =
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[formKey]);

      if (isCaught) {
        currentCount++;
      }
    });

    const tiers = achievement.tiers || [
      { id: 't1', name: 'Bronze', order: 1, threshold: 5, requirementDescription: 'Register 5 Mighty Mark Pokémon in the Living Dex', artworkUrl: '/badges/mightiest-of-them-all/mightiest-of-them-all.png', shinyArtworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: 15, requirementDescription: 'Register 15 Mighty Mark Pokémon in the Living Dex', artworkUrl: '/badges/mightiest-of-them-all/mightiest-of-them-all.png', shinyArtworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: 30, requirementDescription: 'Register 30 Mighty Mark Pokémon in the Living Dex', artworkUrl: '/badges/mightiest-of-them-all/mightiest-of-them-all.png', shinyArtworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: 54, requirementDescription: 'Register all 54 Mighty Mark Pokémon in the Living Dex', artworkUrl: '/badges/mightiest-of-them-all/mightiest-of-them-all.png', shinyArtworkUrl: null }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = 'Catch 5 Mighty Mark Pokémon.';
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} Mighty Mark Pokémon.`;
    } else {
      displayGoal = `All ${totalCount} Mighty Mark Pokémon registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // Ladies First: 103 Female Gender Forms (Bronze: 10, Silver: 30, Gold: 60, Diamond: 103)
  if (achievement.slug === 'ladies-first' || achievement.slug === 'dimorphic-discovery' || achievement.requirements?.target === 'gender_forms') {
    const genderList = GENDER_FORMS_LIST;
    const totalCount = genderList.length || 103;
    let currentCount = 0;

    genderList.forEach(poke => {
      const stableKey = isShiny ? `${poke.stableId}_shiny` : poke.stableId;
      const formKey = isShiny ? `${poke.name}_gender_shiny` : `${poke.name}_gender`;
      const nameKey = isShiny ? `${poke.name}_shiny` : poke.name;
      const nameIdKey = isShiny ? `${poke.name}-${poke.id}_shiny` : `${poke.name}-${poke.id}`;

      const isCaught =
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[formKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[nameIdKey]);

      if (isCaught) {
        currentCount++;
      }
    });

    const tiers = [
      { id: 't1', name: 'Bronze', order: 1, threshold: 10, requirementDescription: `Register 10 ${isShiny ? 'shiny ' : ''}female gender forms in the Living Dex`, artworkUrl: '/badges/ladies-first/ladies-first.png', shinyArtworkUrl: '/badges/ladies-first/ladies-first-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 30, requirementDescription: `Register 30 ${isShiny ? 'shiny ' : ''}female gender forms in the Living Dex`, artworkUrl: '/badges/ladies-first/ladies-first.png', shinyArtworkUrl: '/badges/ladies-first/ladies-first-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 60, requirementDescription: `Register 60 ${isShiny ? 'shiny ' : ''}female gender forms in the Living Dex`, artworkUrl: '/badges/ladies-first/ladies-first.png', shinyArtworkUrl: '/badges/ladies-first/ladies-first-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 103, requirementDescription: `Register all 103 ${isShiny ? 'shiny ' : ''}female gender forms in the Living Dex`, artworkUrl: '/badges/ladies-first/ladies-first.png', shinyArtworkUrl: '/badges/ladies-first/ladies-first-shiny.png' }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch 10 unique ${shinyLabel}female gender forms.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}female gender forms.`;
    } else {
      displayGoal = `All ${totalCount} unique ${shinyLabel}female gender forms registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // Gotta Catch ’Em All!: All regular and obtainable shiny Pokémon and forms across the site
  if (achievement.slug === 'gotta-catch-em-all' || achievement.requirements?.target === 'all_pokemon_and_forms_regular_and_shiny') {
    const totalCount = getTotalTrackerPokemonCount();
    let currentCount = 0;

    // 1. Regular Base Pokémon (1,025)
    (pokemonData || []).forEach(poke => {
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
      ) {
        currentCount++;
      }
    });

    // 2. Regular Forms (1,105)
    ALL_FORMS_LIST.forEach(form => {
      const stableKey = form.stableId;
      const nameKey = form.name;
      const formKey = form.formType ? `${form.name}_${form.formType}` : form.name;
      if (
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[formKey])
      ) {
        currentCount++;
      }
    });

    // 3. Obtainable Shiny Base Pokémon (997)
    (pokemonData || []).forEach(poke => {
      if (isUnobtainableShiny(poke)) return;
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
      ) {
        currentCount++;
      }
    });

    // 4. Obtainable Shiny Forms (1,037)
    ALL_FORMS_LIST.forEach(form => {
      if (isUnobtainableShiny(form)) return;
      const stableKey = `${form.stableId}_shiny`;
      const nameKey = `${form.name}_shiny`;
      const formKey = form.formType ? `${form.name}_${form.formType}_shiny` : `${form.name}_shiny`;
      if (
        isEntryCaught(caughtMap[stableKey]) ||
        isEntryCaught(caughtMap[nameKey]) ||
        isEntryCaught(caughtMap[formKey])
      ) {
        currentCount++;
      }
    });

    const displayCount = Math.min(currentCount, totalCount);
    const unlocked = displayCount >= totalCount;
    const displayGoal = unlocked
      ? 'Every obtainable Pokémon on UltimateDexTracker.com registered!'
      : 'Register every obtainable Pokémon on UltimateDexTracker.com';

    const diamondTier = {
      ...(achievement.tiers?.[0] || {
        id: 't1',
        name: 'Diamond',
        order: 1,
        requirementDescription: 'Register every obtainable Pokémon on UltimateDexTracker.com',
        artworkUrl: '/badges/gotta-catch-em-all/gotta-catch-em-all.png'
      }),
      threshold: totalCount
    };

    return {
      currentCount: displayCount,
      totalCount,
      unlocked,
      unlockedTier: unlocked ? 'diamond' : null,
      highestTierName: unlocked ? 'Diamond' : null,
      nextTier: diamondTier,
      displayGoal,
      tierOrder: unlocked ? 1 : 0,
      tiers: [diamondTier]
    };
  }

  // Ball Connoisseur (formerly Apriball Artisan): 16 Special Ball types
  // Bronze: 3, Silver: 6, Gold: 10, Diamond: 16
  if (
    achievement.slug === 'ball-connoisseur' ||
    achievement.slug === 'apriball-artisan' ||
    achievement.requirements?.target === 'special_balls' ||
    achievement.requirements?.target === 'apriballs'
  ) {
    const usedBallsSet = new Set();

    Object.entries(caughtMap || {}).forEach(([key, info]) => {
      if (!isEntryCaught(info)) return;

      const isEntryShiny = key.endsWith('_shiny') || Boolean(info?.isShiny);

      if (Array.isArray(info?.entries) && info.entries.length > 0) {
        info.entries.forEach(sub => {
          if (!sub || !sub.ball) return;
          const subShiny = sub.isShiny !== undefined ? Boolean(sub.isShiny) : isEntryShiny;
          if (subShiny === isShiny) {
            const matched = normalizeSpecialBall(sub.ball);
            if (matched) usedBallsSet.add(matched);
          }
        });
      } else if (info?.ball) {
        if (isEntryShiny === isShiny) {
          const matched = normalizeSpecialBall(info.ball);
          if (matched) usedBallsSet.add(matched);
        }
      }
    });

    const currentCount = usedBallsSet.size;
    const totalCount = 16;
    const usedSpecialBalls = Array.from(usedBallsSet);

    const tiers = [
      { id: 't1', name: 'Bronze', order: 1, threshold: 3, requirementDescription: `Register ${isShiny ? 'shiny ' : ''}catches in 3 unique Special Ball types`, artworkUrl: '/badges/ball-connoisseur/ball-connoisseur.png', shinyArtworkUrl: '/badges/ball-connoisseur/ball-connoisseur-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 6, requirementDescription: `Register ${isShiny ? 'shiny ' : ''}catches in 6 unique Special Ball types`, artworkUrl: '/badges/ball-connoisseur/ball-connoisseur.png', shinyArtworkUrl: '/badges/ball-connoisseur/ball-connoisseur-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 10, requirementDescription: `Register ${isShiny ? 'shiny ' : ''}catches in 10 unique Special Ball types`, artworkUrl: '/badges/ball-connoisseur/ball-connoisseur.png', shinyArtworkUrl: '/badges/ball-connoisseur/ball-connoisseur-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 16, requirementDescription: `Use every eligible ${isShiny ? 'shiny ' : ''}Special Ball`, artworkUrl: '/badges/ball-connoisseur/ball-connoisseur.png', shinyArtworkUrl: '/badges/ball-connoisseur/ball-connoisseur-shiny.png' }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch Pokémon in 3 unique ${shinyLabel}Special Ball types.`;
    } else if (nextTier) {
      if (nextTier.name === 'Diamond') {
        displayGoal = isShiny
          ? 'Catch a shiny Pokémon in every eligible Special Ball.'
          : 'Catch a Pokémon in every eligible Special Ball.';
      } else {
        displayGoal = `Catch Pokémon in ${nextTier.threshold} unique ${shinyLabel}Special Ball types.`;
      }
    } else {
      displayGoal = `All 16 eligible ${shinyLabel}Special Ball types registered!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers,
      usedSpecialBalls
    };
  }

  // Beast Ballin: Unique Pokémon caught in Beast Balls
  // Bronze: 1, Silver: 3, Gold: 7, Diamond: 15
  if (
    achievement.slug === 'beast-ballin' ||
    achievement.requirements?.target === 'beast_ball' ||
    achievement.id === 'ach-bal-02'
  ) {
    const isBeastBall = (ball) => {
      if (!ball || typeof ball !== 'string') return false;
      const b = ball.trim().toLowerCase().replace(/[-_]/g, ' ');
      return b === 'beast ball';
    };

    const uniquePokemonSet = new Set();

    Object.entries(caughtMap || {}).forEach(([key, info]) => {
      if (!isEntryCaught(info)) return;

      const isEntryShiny = key.endsWith('_shiny') || Boolean(info?.isShiny);
      const baseMonId = (info?.stableId || key).replace(/_shiny$/, '');

      if (Array.isArray(info?.entries) && info.entries.length > 0) {
        info.entries.forEach(sub => {
          if (!sub || !sub.ball) return;
          const subShiny = sub.isShiny !== undefined ? Boolean(sub.isShiny) : isEntryShiny;
          if (subShiny === isShiny && isBeastBall(sub.ball)) {
            uniquePokemonSet.add(baseMonId);
          }
        });
      } else if (info?.ball) {
        if (isEntryShiny === isShiny && isBeastBall(info.ball)) {
          uniquePokemonSet.add(baseMonId);
        }
      }
    });

    const currentCount = uniquePokemonSet.size;
    const totalCount = 15;

    const tiers = [
      { id: 't1', name: 'Bronze', order: 1, threshold: 1, requirementDescription: `Register 1 unique ${isShiny ? 'shiny ' : ''}Pokémon in a Beast Ball`, artworkUrl: '/badges/beast-ballin/beast-ballin.png', shinyArtworkUrl: '/badges/beast-ballin/beast-ballin-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 3, requirementDescription: `Register 3 unique ${isShiny ? 'shiny ' : ''}Pokémon in Beast Balls`, artworkUrl: '/badges/beast-ballin/beast-ballin.png', shinyArtworkUrl: '/badges/beast-ballin/beast-ballin-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 7, requirementDescription: `Register 7 unique ${isShiny ? 'shiny ' : ''}Pokémon in Beast Balls`, artworkUrl: '/badges/beast-ballin/beast-ballin.png', shinyArtworkUrl: '/badges/beast-ballin/beast-ballin-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 15, requirementDescription: `Register 15 unique ${isShiny ? 'shiny ' : ''}Pokémon in Beast Balls`, artworkUrl: '/badges/beast-ballin/beast-ballin.png', shinyArtworkUrl: '/badges/beast-ballin/beast-ballin-shiny.png' }
    ];

    let unlockedTier = null;
    let highestTierName = null;
    let tierOrder = 0;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const thresh = tier.threshold || 0;
      if (currentCount >= thresh) {
        unlockedTier = (tier.name || '').toLowerCase();
        highestTierName = tier.name;
        tierOrder = tier.order || (i + 1);
      } else {
        if (!nextTier) {
          nextTier = tier;
        }
      }
    }

    const unlocked = unlockedTier !== null;
    const shinyLabel = isShiny ? 'shiny ' : '';

    let displayGoal = '';
    if (!unlocked) {
      displayGoal = `Catch a unique ${shinyLabel}Pokémon in a Beast Ball.`;
    } else if (nextTier) {
      displayGoal = `Catch ${nextTier.threshold} unique ${shinyLabel}Pokémon in Beast Balls.`;
    } else {
      displayGoal = `All 15 unique ${shinyLabel}Pokémon registered in Beast Balls!`;
    }

    return {
      currentCount,
      totalCount,
      unlocked,
      unlockedTier,
      highestTierName,
      nextTier,
      displayGoal,
      tierOrder,
      tiers
    };
  }

  // BINGO!: Complete a BINGO from any year
  if (
    achievement.slug === 'bingo' ||
    achievement.id === 'ach-eve-01' ||
    achievement.requirements?.type === 'bingo_completed'
  ) {
    const isCompleted = checkUserHasCompletedBingo();
    const diamondTier = achievement.tiers?.[0] || {
      id: 't1',
      name: 'Diamond',
      order: 1,
      threshold: 1,
      requirementDescription: 'Complete a BINGO from any year',
      artworkUrl: '/badges/bingo!/bingo!.png'
    };

    return {
      currentCount: isCompleted ? 1 : 0,
      totalCount: 1,
      unlocked: isCompleted,
      unlockedTier: isCompleted ? 'diamond' : null,
      highestTierName: isCompleted ? 'Diamond' : null,
      nextTier: isCompleted ? null : diamondTier,
      displayGoal: isCompleted ? 'BINGO completed!' : 'Complete a BINGO from any year.',
      tierOrder: isCompleted ? 1 : 0,
      tiers: [diamondTier]
    };
  }

  // 8. Default/Baseline for other achievements
  const unlocked = Boolean(achievement.unlocked);
  const firstTier = achievement.tiers?.[0];
  const displayGoal = achievement.description || (firstTier ? firstTier.requirementDescription : 'Not configured');

  return {
    currentCount: 0,
    totalCount: 1,
    unlocked,
    unlockedTier: unlocked ? (achievement.tier || 'bronze').toLowerCase() : null,
    highestTierName: unlocked ? (achievement.tier || 'Bronze') : null,
    nextTier: firstTier || null,
    displayGoal,
    tierOrder: unlocked ? 1 : 0,
    tiers: achievement.tiers || []
  };
}


