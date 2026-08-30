/**
 * Initial Achievements & Badges Schema & Dataset
 * 
 * Configurable achievements definitions for the Ultimate Dex Tracker.
 * This is an admin/development baseline and will be stored in the database.
 * No arbitrary thresholds are invented; unconfigured milestones remain null / 'Not configured'.
 */

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
    description: 'Register ALL National Dex species in Living Dex.',
    category: 'Collection',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 1,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'pokemon_registered',
      target: 'national_dex_all',
      details: 'All mainline species in National Dex'
    },
    metadata: {
      publicSecretPlaceholder: null
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
    description: 'Catch all Mythical Pokémon.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 10,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'group_completed',
      target: 'mythicals',
      details: 'All Mythical Pokémon'
    },
    metadata: {}
  },
  {
    id: 'ach-grp-02',
    slug: 'titan-slayer',
    name: 'Titan Slayer',
    description: 'Catch all Legendary Pokémon.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 11,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'group_completed',
      target: 'legendaries',
      details: 'All Legendary Pokémon'
    },
    metadata: {}
  },
  {
    id: 'ach-grp-03',
    slug: 'extradimensional-encounter',
    name: 'Extradimensional Encounter',
    description: 'Catch all Ultra Beasts.',
    category: 'Pokémon Groups',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 12,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'group_completed',
      target: 'ultra_beasts',
      details: 'All Ultra Beasts'
    },
    metadata: {}
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
    description: 'Catch all unique Alcremie combinations.',
    category: 'Forms & Variants',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    unlocked: true,
    sortOrder: 20,
    artwork: '/badges/patisserie-chef/regular-bronze.png',
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: '/badges/patisserie-chef/regular-bronze.png' },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'group_completed',
      target: 'alcremie_forms',
      details: 'All Alcremie cream & sweet combinations'
    },
    metadata: {}
  },
  {
    id: 'ach-var-02',
    slug: 'ancient-alphabet',
    name: 'Ancient Alphabet',
    description: 'Catch all unique Unown forms.',
    category: 'Forms & Variants',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 21,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'group_completed',
      target: 'unown_forms',
      details: 'All 28 Unown forms (A-Z, ?, !)'
    },
    metadata: {}
  },
  {
    id: 'ach-var-03',
    slug: 'apex-predator',
    name: 'Apex Predator',
    description: 'Catch all Alpha Pokémon.',
    category: 'Forms & Variants',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 22,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'group_completed',
      target: 'alpha_forms',
      details: 'All Alpha Pokémon species'
    },
    metadata: {}
  },
  {
    id: 'ach-var-04',
    slug: 'gigantamax-phenom',
    name: 'Gigantamax Phenom',
    description: 'Catch all Gigantamax forms.',
    category: 'Forms & Variants',
    type: 'tiered',
    trackingScope: 'regular_shiny_separate',
    isSecret: false,
    enabled: true,
    sortOrder: 23,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'group_completed',
      target: 'gmax_forms',
      details: 'All Gigantamax forms'
    },
    metadata: {}
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
    description: 'Catch all Mighty Mark Pokémon.',
    category: 'Forms & Variants',
    type: 'tiered',
    trackingScope: 'shared',
    isSecret: false,
    enabled: true,
    sortOrder: 25,
    artwork: null,
    tiers: [
      { id: 't1', name: 'Bronze', order: 1, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't2', name: 'Silver', order: 2, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't3', name: 'Gold', order: 3, threshold: null, requirementDescription: 'Not configured', artworkUrl: null },
      { id: 't4', name: 'Diamond', order: 4, threshold: null, requirementDescription: 'Not configured', artworkUrl: null }
    ],
    requirements: {
      type: 'marks_collected',
      target: 'mightiest_mark',
      details: '7-Star Tera Raid Mighty Mark Pokémon'
    },
    metadata: {}
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
