import pokemonData from './pokemon.json';
import alcremieForms from './forms/alcremie.json';
import otherForms from './forms/other.json';
import unownForms from './forms/unown.json';
import alphaForms from './forms/alpha.json';
import alphaotherForms from './forms/alphaother.json';
import gmaxForms from './forms/gmax.json';
import mightyForms from './forms/mighty.json';
import galarianForms from './forms/galarian.json';
import { isMythical, isLegendary, isSubLegendary, isUltraBeast } from '../utils/pokemonCategories';
import {
  UNOBTAINABLE_SHINY_DEX_NUMBERS,
  UNOBTAINABLE_SHINY_FORM_NAMES
} from './blockedShinies';

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
 * All 80 official Legendary Pokémon and forms for Titan Slayer:
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

export function isTitanSlayerShinyLocked(poke) {
  if (!poke) return false;
  if (TITAN_SLAYER_SHINY_LOCKED_IDS.has(Number(poke.id))) return true;
  if (poke.name && TITAN_SLAYER_SHINY_LOCKED_FORM_NAMES.has(poke.name)) return true;
  if (poke.stableId && TITAN_SLAYER_SHINY_LOCKED_FORM_NAMES.has(poke.stableId)) return true;
  return false;
}

/**
 * Helper to check if a Pokémon / form shiny is unobtainable / shiny-locked
 */
export function isUnobtainableShiny(poke) {
  if (!poke) return false;
  const padId = String(poke.id).padStart(4, '0');
  if (UNOBTAINABLE_SHINY_DEX_NUMBERS.includes(padId)) {
    return true;
  }
  if (poke.name && UNOBTAINABLE_SHINY_FORM_NAMES.includes(poke.name)) {
    return true;
  }
  return false;
}

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
    slug: 'living-legends',
    name: 'Living Legends',
    description: 'Catch 100 Pokémon to unlock Bronze.',
    category: 'Collection',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 1,
    artwork: '/badges/living-legends/living-legends.png',
    shinyArtwork: '/badges/living-legends/living-legends-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 100, requirementDescription: 'Register 100 Pokémon in the Living Dex', artworkUrl: '/badges/living-legends/living-legends.png', shinyArtworkUrl: '/badges/living-legends/living-legends-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 300, requirementDescription: 'Register 300 Pokémon in the Living Dex', artworkUrl: '/badges/living-legends/living-legends.png', shinyArtworkUrl: '/badges/living-legends/living-legends-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 600, requirementDescription: 'Register 600 Pokémon in the Living Dex', artworkUrl: '/badges/living-legends/living-legends.png', shinyArtworkUrl: '/badges/living-legends/living-legends-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 1025, requirementDescription: 'Register all 1,025 Pokémon in the Living Dex', artworkUrl: '/badges/living-legends/living-legends.png', shinyArtworkUrl: '/badges/living-legends/living-legends-shiny.png' }
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

  // ==========================================
  // POKÉMON GROUPS
  // ==========================================
  {
    id: 'ach-grp-01',
    slug: 'mythical-enigma',
    name: 'Mythical Enigma',
    description: 'Catch 3 unique Mythical Pokémon to unlock Bronze.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 10,
    artwork: '/badges/mythical-enigma/mythical-enigma.png',
    shinyArtwork: '/badges/mythical-enigma/mythical-enigma-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 3, requirementDescription: 'Register 3 Mythical Pokémon in the Living Dex', artworkUrl: '/badges/mythical-enigma/mythical-enigma.png', shinyArtworkUrl: '/badges/mythical-enigma/mythical-enigma-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 8, requirementDescription: 'Register 8 Mythical Pokémon in the Living Dex', artworkUrl: '/badges/mythical-enigma/mythical-enigma.png', shinyArtworkUrl: '/badges/mythical-enigma/mythical-enigma-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 16, requirementDescription: 'Register 16 Mythical Pokémon in the Living Dex', artworkUrl: '/badges/mythical-enigma/mythical-enigma.png', shinyArtworkUrl: '/badges/mythical-enigma/mythical-enigma-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 28, requirementDescription: 'Register all 28 Mythical Pokémon and forms in the Living Dex', artworkUrl: '/badges/mythical-enigma/mythical-enigma.png', shinyArtworkUrl: '/badges/mythical-enigma/mythical-enigma-shiny.png' }
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
    slug: 'titan-slayer',
    name: 'Titan Slayer',
    description: 'Register Legendary Pokémon across the Living Dex, Galar forms, and Other forms.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 11,
    artwork: '/badges/titan-slayer/titan-slayer.png',
    shinyArtwork: '/badges/titan-slayer/titan-slayer-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 8, requirementDescription: 'Register 8 Legendary Pokémon in the Living Dex', artworkUrl: '/badges/titan-slayer/titan-slayer.png', shinyArtworkUrl: '/badges/titan-slayer/titan-slayer-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 24, requirementDescription: 'Register 24 Legendary Pokémon in the Living Dex', artworkUrl: '/badges/titan-slayer/titan-slayer.png', shinyArtworkUrl: '/badges/titan-slayer/titan-slayer-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 45, requirementDescription: 'Register 45 Legendary Pokémon in the Living Dex', artworkUrl: '/badges/titan-slayer/titan-slayer.png', shinyArtworkUrl: '/badges/titan-slayer/titan-slayer-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 80, requirementDescription: 'Register all 80 Legendary Pokémon and forms in the Living Dex', artworkUrl: '/badges/titan-slayer/titan-slayer.png', shinyArtworkUrl: '/badges/titan-slayer/titan-slayer-shiny.png' }
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
    slug: 'extradimensional-encounter',
    name: 'Extradimensional Encounter',
    description: 'Catch all Ultra Beasts in the Living Dex.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 12,
    artwork: '/badges/extradimensional-encounter/extradimensional-encounter.png',
    shinyArtwork: '/badges/extradimensional-encounter/extradimensional-encounter-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 2, requirementDescription: 'Register 2 Ultra Beasts in the Living Dex', artworkUrl: '/badges/extradimensional-encounter/extradimensional-encounter.png', shinyArtworkUrl: '/badges/extradimensional-encounter/extradimensional-encounter-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 4, requirementDescription: 'Register 4 Ultra Beasts in the Living Dex', artworkUrl: '/badges/extradimensional-encounter/extradimensional-encounter.png', shinyArtworkUrl: '/badges/extradimensional-encounter/extradimensional-encounter-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 7, requirementDescription: 'Register 7 Ultra Beasts in the Living Dex', artworkUrl: '/badges/extradimensional-encounter/extradimensional-encounter.png', shinyArtworkUrl: '/badges/extradimensional-encounter/extradimensional-encounter-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 11, requirementDescription: 'Register all 11 Ultra Beasts in the Living Dex', artworkUrl: '/badges/extradimensional-encounter/extradimensional-encounter.png', shinyArtworkUrl: '/badges/extradimensional-encounter/extradimensional-encounter-shiny.png' }
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
    slug: 'anomalies-of-time',
    name: 'Anomalies of Time',
    description: 'Catch all Paradox Pokémon.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 13,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'group_completed',
      target: 'paradox',
      details: 'All Paradox Pokémon'
    },
    metadata: {}
  },
  {
    id: 'ach-grp-05',
    slug: 'draconic-nobility',
    name: 'Draconic Nobility',
    description: 'Catch all Pseudo Legendary Pokémon.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 14,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'group_completed',
      target: 'pseudo_legendaries',
      details: 'All Pseudo Legendary Pokémon'
    },
    metadata: {}
  },
  {
    id: 'ach-grp-06',
    slug: 'first-partner-hall-of-fame',
    name: 'First Partner Hall of Fame',
    description: 'Catch all Starter Pokémon and evolutions.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 15,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'group_completed',
      target: 'starters',
      details: 'All Starter Pokémon and evolutions'
    },
    metadata: {}
  },
  {
    id: 'ach-grp-07',
    slug: 'paleontologist',
    name: 'Paleontologist',
    description: 'Catch all Fossil Pokémon.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 16,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'group_completed',
      target: 'fossils',
      details: 'All Fossil Pokémon'
    },
    metadata: {}
  },
  {
    id: 'ach-grp-08',
    slug: 'daycare-maestro',
    name: 'Daycare Maestro',
    description: 'Catch all Baby Pokémon and evolutions.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 17,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'group_completed',
      target: 'babies',
      details: 'All Baby Pokémon and evolutions'
    },
    metadata: {}
  },

  // ==========================================
  // FORMS & VARIANTS
  // ==========================================
  {
    id: 'ach-var-01',
    slug: 'patisserie-chef',
    name: 'Patisserie Chef',
    description: 'Catch 7 unique Alcremie forms to unlock Bronze.',
    category: 'Forms & Variants',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 20,
    artwork: '/badges/patisserie-chef/patisserie-chef.png',
    shinyArtwork: '/badges/patisserie-chef/patisserie-chef-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 7, requirementDescription: 'Catch 7 unique Alcremie forms', artworkUrl: '/badges/patisserie-chef/patisserie-chef.png', shinyArtworkUrl: '/badges/patisserie-chef/patisserie-chef-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 21, requirementDescription: 'Catch 21 unique Alcremie forms', artworkUrl: '/badges/patisserie-chef/patisserie-chef.png', shinyArtworkUrl: '/badges/patisserie-chef/patisserie-chef-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 42, requirementDescription: 'Catch 42 unique Alcremie forms', artworkUrl: '/badges/patisserie-chef/patisserie-chef.png', shinyArtworkUrl: '/badges/patisserie-chef/patisserie-chef-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 63, requirementDescription: 'Catch all 63 unique Alcremie forms', artworkUrl: '/badges/patisserie-chef/patisserie-chef.png', shinyArtworkUrl: '/badges/patisserie-chef/patisserie-chef-shiny.png' }
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
    description: 'Catch 3 unique Unown forms to unlock Bronze.',
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
    description: 'Catch 50 Alpha Pokémon to unlock Bronze.',
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
    slug: 'gigantamax-phenom',
    name: 'Gigantamax Phenom',
    description: 'Catch 4 unique Gigantamax forms to unlock Bronze.',
    category: 'Forms & Variants',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: false,
    sortOrder: 23,
    artwork: '/badges/gigantamax-phenom/gigantamax-phenom.png',
    shinyArtwork: '/badges/gigantamax-phenom/gigantamax-phenom-shiny.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 4, requirementDescription: 'Register 4 unique Gigantamax forms in the Living Dex', artworkUrl: '/badges/gigantamax-phenom/gigantamax-phenom.png', shinyArtworkUrl: '/badges/gigantamax-phenom/gigantamax-phenom-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 10, requirementDescription: 'Register 10 unique Gigantamax forms in the Living Dex', artworkUrl: '/badges/gigantamax-phenom/gigantamax-phenom.png', shinyArtworkUrl: '/badges/gigantamax-phenom/gigantamax-phenom-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 20, requirementDescription: 'Register 20 unique Gigantamax forms in the Living Dex', artworkUrl: '/badges/gigantamax-phenom/gigantamax-phenom.png', shinyArtworkUrl: '/badges/gigantamax-phenom/gigantamax-phenom-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 33, requirementDescription: 'Register all 33 unique Gigantamax forms in the Living Dex', artworkUrl: '/badges/gigantamax-phenom/gigantamax-phenom.png', shinyArtworkUrl: '/badges/gigantamax-phenom/gigantamax-phenom-shiny.png' }
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
    slug: 'global-phenotype',
    name: 'Global Phenotype',
    description: 'Catch all Regional Forms.',
    category: 'Forms & Variants',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 24,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'group_completed',
      target: 'regional_forms',
      details: 'Alolan, Galarian, Hisuian, and Paldean forms'
    },
    metadata: {}
  },
  {
    id: 'ach-var-06',
    slug: 'mighty-champion',
    name: 'Mighty Champion',
    description: 'Catch 5 Mighty Mark Pokémon to unlock Bronze.',
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
    artwork: '/badges/mighty-champion/mighty-champion.png',
    shinyArtwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: 5, requirementDescription: 'Register 5 Mighty Mark Pokémon in the Living Dex', artworkUrl: '/badges/mighty-champion/mighty-champion.png', shinyArtworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: 15, requirementDescription: 'Register 15 Mighty Mark Pokémon in the Living Dex', artworkUrl: '/badges/mighty-champion/mighty-champion.png', shinyArtworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: 30, requirementDescription: 'Register 30 Mighty Mark Pokémon in the Living Dex', artworkUrl: '/badges/mighty-champion/mighty-champion.png', shinyArtworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: 54, requirementDescription: 'Register all 54 Mighty Mark Pokémon in the Living Dex', artworkUrl: '/badges/mighty-champion/mighty-champion.png', shinyArtworkUrl: null }
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
    slug: 'dimorphic-discovery',
    name: 'Dimorphic Discovery',
    description: 'Catch all female gender forms.',
    category: 'Forms & Variants',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 26,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'group_completed',
      target: 'gender_forms',
      details: 'All distinct female visual form differences'
    },
    metadata: {}
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
    slug: 'roll-the-dice',
    name: 'Roll the Dice',
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
    slug: 'phoenix-feather',
    name: 'Phoenix Feather',
    description: 'Catch a shiny target after previously logging a failed encounter.',
    category: 'Hunting',
    type: 'single',
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
    slug: 'apriball-artisan',
    name: 'Apriball Artisan',
    description: 'Catch shinies in rare Apricorn Balls.',
    category: 'Poké Balls',
    type: 'tiered',
    trackingScope: 'shiny',
    isSecret: false,
    enabled: true,
    sortOrder: 40,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'ball_catches',
      target: 'apriballs',
      details: 'Fast, Friend, Heavy, Level, Love, Lure, Moon Balls'
    },
    metadata: {}
  },
  {
    id: 'ach-bal-02',
    slug: 'beast-tamer',
    name: 'Beast Tamer',
    description: 'Catch shinies in Beast Balls.',
    category: 'Poké Balls',
    type: 'tiered',
    trackingScope: 'shiny',
    isSecret: false,
    enabled: true,
    sortOrder: 41,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'ball_catches',
      target: 'beast_ball',
      details: 'Shinies caught in Beast Balls'
    },
    metadata: {}
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
    slug: 'bingo-sheet',
    name: 'Bingo Sheet',
    description: 'Complete a BINGO sheet.',
    category: 'Events',
    type: 'single',
    trackingScope: 'shared',
    isSecret: false,
    enabled: true,
    sortOrder: 50,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Diamond', order: 1, threshold: null, requirementDescription: 'Complete an entire 5x5 BINGO event board', artworkUrl: null }
    ],
    requirements: {
      type: 'bingo_completed',
      target: 'full_board',
      details: 'Complete 25 tiles on a Dex BINGO board'
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
    slug: 'charter-member',
    name: 'Charter Member',
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
    slug: 'dex-patron',
    name: 'Dex Patron',
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
    slug: 'hall-of-fame-inductee',
    name: 'Hall of Fame Inductee',
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
    slug: 'sub-1-percent-miracle',
    name: 'Sub-1% Miracle',
    description: 'Internal concept: Extremely rare achievement for completing a hunt in less than 1% of odds.',
    category: 'Secret',
    type: 'secret',
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
    slug: 'one-in-8192',
    name: 'One in 8,192',
    description: 'Internal concept: Extremely rare hidden badge related to the site\'s 1/8192 logo concept.',
    category: 'Secret',
    type: 'secret',
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

  // 1. Patisserie Chef: 63 unique Alcremie combinations (excluding G-Max)
  if (achievement.slug === 'patisserie-chef' || achievement.requirements?.target === 'alcremie_forms') {
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
      // Starts with a lock; text says first goal to unlock bronze
      displayGoal = `Catch 7 unique ${shinyLabel}Alcremie forms to unlock Bronze.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === 63 ? 'all 63' : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Alcremie forms to unlock ${nextTier.name}.`;
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

  // 2. Living Legends: 1,025 mainline Pokémon in the Living Dex
  if (achievement.slug === 'living-legends' || achievement.requirements?.target === 'national_dex_all') {
    const totalCount = 1025;
    let currentCount = 0;

    pokemonData.forEach(poke => {
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

    const tiers = achievement.tiers || [
      { id: 't1', name: 'Bronze', order: 1, threshold: 100, requirementDescription: 'Register 100 Pokémon in the Living Dex', artworkUrl: '/badges/living-legends/living-legends.png', shinyArtworkUrl: '/badges/living-legends/living-legends-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 300, requirementDescription: 'Register 300 Pokémon in the Living Dex', artworkUrl: '/badges/living-legends/living-legends.png', shinyArtworkUrl: '/badges/living-legends/living-legends-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 600, requirementDescription: 'Register 600 Pokémon in the Living Dex', artworkUrl: '/badges/living-legends/living-legends.png', shinyArtworkUrl: '/badges/living-legends/living-legends-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 1025, requirementDescription: 'Register all 1,025 Pokémon in the Living Dex', artworkUrl: '/badges/living-legends/living-legends.png', shinyArtworkUrl: '/badges/living-legends/living-legends-shiny.png' }
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
      displayGoal = `Catch 100 ${shinyLabel}Pokémon to unlock Bronze.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === 1025 ? 'all 1,025' : nextTier.threshold;
      displayGoal = `Catch ${targetStr} ${shinyLabel}Pokémon to unlock ${nextTier.name}.`;
    } else {
      displayGoal = `All 1,025 ${shinyLabel}Pokémon registered!`;
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

  // 3. Mythical Enigma: All 28 Mythical Pokémon & Forms (excluding unobtainable locked shinies for shiny tracking)
  if (achievement.slug === 'mythical-enigma' || achievement.requirements?.target === 'mythicals') {
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
      { id: 't1', name: 'Bronze', order: 1, threshold: bThresh, requirementDescription: `Register ${bThresh} ${isShiny ? 'shiny ' : ''}Mythical Pokémon in the Living Dex`, artworkUrl: '/badges/mythical-enigma/mythical-enigma.png', shinyArtworkUrl: '/badges/mythical-enigma/mythical-enigma-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: sThresh, requirementDescription: `Register ${sThresh} ${isShiny ? 'shiny ' : ''}Mythical Pokémon in the Living Dex`, artworkUrl: '/badges/mythical-enigma/mythical-enigma.png', shinyArtworkUrl: '/badges/mythical-enigma/mythical-enigma-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: gThresh, requirementDescription: `Register ${gThresh} ${isShiny ? 'shiny ' : ''}Mythical Pokémon in the Living Dex`, artworkUrl: '/badges/mythical-enigma/mythical-enigma.png', shinyArtworkUrl: '/badges/mythical-enigma/mythical-enigma-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: dThresh, requirementDescription: `Register all ${dThresh} ${isShiny ? 'shiny ' : ''}Mythical Pokémon and forms in the Living Dex`, artworkUrl: '/badges/mythical-enigma/mythical-enigma.png', shinyArtworkUrl: '/badges/mythical-enigma/mythical-enigma-shiny.png' }
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
      displayGoal = `Catch ${tiers[0].threshold} unique ${shinyLabel}Mythical Pokémon to unlock Bronze.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Mythical Pokémon to unlock ${nextTier.name}.`;
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

  // Titan Slayer: 80 Legendary Pokémon & Forms (55 for shiny excluding shiny-locked)
  if (achievement.slug === 'titan-slayer' || achievement.requirements?.target === 'legendaries') {
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
      { id: 't1', name: 'Bronze', order: 1, threshold: bThresh, requirementDescription: `Register ${bThresh} ${isShiny ? 'shiny ' : ''}Legendary Pokémon in the Living Dex`, artworkUrl: '/badges/titan-slayer/titan-slayer.png', shinyArtworkUrl: '/badges/titan-slayer/titan-slayer-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: sThresh, requirementDescription: `Register ${sThresh} ${isShiny ? 'shiny ' : ''}Legendary Pokémon in the Living Dex`, artworkUrl: '/badges/titan-slayer/titan-slayer.png', shinyArtworkUrl: '/badges/titan-slayer/titan-slayer-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: gThresh, requirementDescription: `Register ${gThresh} ${isShiny ? 'shiny ' : ''}Legendary Pokémon in the Living Dex`, artworkUrl: '/badges/titan-slayer/titan-slayer.png', shinyArtworkUrl: '/badges/titan-slayer/titan-slayer-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: dThresh, requirementDescription: `Register all ${dThresh} ${isShiny ? 'shiny ' : ''}Legendary Pokémon and forms in the Living Dex`, artworkUrl: '/badges/titan-slayer/titan-slayer.png', shinyArtworkUrl: '/badges/titan-slayer/titan-slayer-shiny.png' }
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
      displayGoal = `Catch ${tiers[0].threshold} unique ${shinyLabel}Legendary Pokémon to unlock Bronze.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Legendary Pokémon to unlock ${nextTier.name}.`;
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

  // Extradimensional Encounter: 11 Ultra Beasts (Bronze: 2, Silver: 4, Gold: 7, Diamond: 11)
  if (achievement.slug === 'extradimensional-encounter' || achievement.requirements?.target === 'ultra_beasts') {
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
      { id: 't1', name: 'Bronze', order: 1, threshold: 2, requirementDescription: `Register 2 ${isShiny ? 'shiny ' : ''}Ultra Beasts in the Living Dex`, artworkUrl: '/badges/extradimensional-encounter/extradimensional-encounter.png', shinyArtworkUrl: '/badges/extradimensional-encounter/extradimensional-encounter-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 4, requirementDescription: `Register 4 ${isShiny ? 'shiny ' : ''}Ultra Beasts in the Living Dex`, artworkUrl: '/badges/extradimensional-encounter/extradimensional-encounter.png', shinyArtworkUrl: '/badges/extradimensional-encounter/extradimensional-encounter-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 7, requirementDescription: `Register 7 ${isShiny ? 'shiny ' : ''}Ultra Beasts in the Living Dex`, artworkUrl: '/badges/extradimensional-encounter/extradimensional-encounter.png', shinyArtworkUrl: '/badges/extradimensional-encounter/extradimensional-encounter-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: 11, requirementDescription: `Register all 11 ${isShiny ? 'shiny ' : ''}Ultra Beasts in the Living Dex`, artworkUrl: '/badges/extradimensional-encounter/extradimensional-encounter.png', shinyArtworkUrl: '/badges/extradimensional-encounter/extradimensional-encounter-shiny.png' }
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
      displayGoal = `Catch ${tiers[0].threshold} unique ${shinyLabel}Ultra Beasts to unlock Bronze.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Ultra Beasts to unlock ${nextTier.name}.`;
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
      displayGoal = `Catch 3 unique ${shinyLabel}Unown forms to unlock Bronze.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Unown forms to unlock ${nextTier.name}.`;
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
      displayGoal = `Catch 50 unique ${shinyLabel}Alpha Pokémon to unlock Bronze.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Alpha Pokémon to unlock ${nextTier.name}.`;
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

  // 6. Gigantamax Phenom: 33 GMAX forms (31 for shiny due to locked Urshifus)
  if (achievement.slug === 'gigantamax-phenom' || achievement.requirements?.target === 'gmax_forms') {
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
      { id: 't1', name: 'Bronze', order: 1, threshold: 4, requirementDescription: `Register 4 unique ${isShiny ? 'shiny ' : ''}Gigantamax forms in the Living Dex`, artworkUrl: '/badges/gigantamax-phenom/gigantamax-phenom.png', shinyArtworkUrl: '/badges/gigantamax-phenom/gigantamax-phenom-shiny.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: 10, requirementDescription: `Register 10 unique ${isShiny ? 'shiny ' : ''}Gigantamax forms in the Living Dex`, artworkUrl: '/badges/gigantamax-phenom/gigantamax-phenom.png', shinyArtworkUrl: '/badges/gigantamax-phenom/gigantamax-phenom-shiny.png' },
      { id: 't3', name: 'Gold', order: 3, threshold: 20, requirementDescription: `Register 20 unique ${isShiny ? 'shiny ' : ''}Gigantamax forms in the Living Dex`, artworkUrl: '/badges/gigantamax-phenom/gigantamax-phenom.png', shinyArtworkUrl: '/badges/gigantamax-phenom/gigantamax-phenom-shiny.png' },
      { id: 't4', name: 'Diamond', order: 4, threshold: diamondThresh, requirementDescription: `Register all ${diamondThresh} unique ${isShiny ? 'shiny ' : ''}Gigantamax forms in the Living Dex`, artworkUrl: '/badges/gigantamax-phenom/gigantamax-phenom.png', shinyArtworkUrl: '/badges/gigantamax-phenom/gigantamax-phenom-shiny.png' }
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
      displayGoal = `Catch 4 unique ${shinyLabel}Gigantamax forms to unlock Bronze.`;
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} unique ${shinyLabel}Gigantamax forms to unlock ${nextTier.name}.`;
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

  // 7. Mighty Champion: 54 Mighty Mark Pokémon (Regular only)
  if (achievement.slug === 'mighty-champion' || achievement.requirements?.target === 'mightiest_mark') {
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
      { id: 't1', name: 'Bronze', order: 1, threshold: 5, requirementDescription: 'Register 5 Mighty Mark Pokémon in the Living Dex', artworkUrl: '/badges/mighty-champion/mighty-champion.png', shinyArtworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: 15, requirementDescription: 'Register 15 Mighty Mark Pokémon in the Living Dex', artworkUrl: '/badges/mighty-champion/mighty-champion.png', shinyArtworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: 30, requirementDescription: 'Register 30 Mighty Mark Pokémon in the Living Dex', artworkUrl: '/badges/mighty-champion/mighty-champion.png', shinyArtworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: 54, requirementDescription: 'Register all 54 Mighty Mark Pokémon in the Living Dex', artworkUrl: '/badges/mighty-champion/mighty-champion.png', shinyArtworkUrl: null }
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
      displayGoal = 'Catch 5 Mighty Mark Pokémon to unlock Bronze.';
    } else if (nextTier) {
      const targetStr = nextTier.threshold === totalCount ? `all ${totalCount}` : nextTier.threshold;
      displayGoal = `Catch ${targetStr} Mighty Mark Pokémon to unlock ${nextTier.name}.`;
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


