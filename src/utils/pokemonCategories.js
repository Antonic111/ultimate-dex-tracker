// Pokemon categorization utilities
// Legendary and Mythical Pokemon identification

// Legendary Pokemon IDs (main legendary Pokemon only)
const LEGENDARY_POKEMON_IDS = new Set([
  // Gen 1
  150, // Mewtwo
  
  // Gen 2
  249, // Lugia
  250, // Ho-Oh
  
  // Gen 3
  382, // Kyogre
  383, // Groudon
  384, // Rayquaza
  
  // Gen 4
  483, // Dialga
  484, // Palkia
  487, // Giratina
  
  // Gen 5
  643, // Reshiram
  644, // Zekrom
  646, // Kyurem
  
  // Gen 6
  716, // Xerneas
  717, // Yveltal
  718, // Zygarde
  
  // Gen 7
  789, // Cosmog
  790, // Cosmoem
  791, // Solgaleo
  792, // Lunala
  800, // Necrozma
  
  // Gen 8
  888, // Zacian
  889, // Zamazenta
  890, // Eternatus
  898, // Calyrex
  
  // Gen 9
  1007, // Koraidon
  1008, // Miraidon
  1024, // Terapagos
]);

// Mythical Pokemon IDs (based on official classifications)
const MYTHICAL_POKEMON_IDS = new Set([
  // Gen 1
  151, // Mew
  
  // Gen 2
  251, // Celebi
  
  // Gen 3
  385, // Jirachi
  386, // Deoxys
  
  // Gen 4
  489, // Phione
  490, // Manaphy
  491, // Darkrai
  492, // Shaymin
  493, // Arceus
  
  // Gen 5
  494, // Victini
  647, // Keldeo
  648, // Meloetta
  649, // Genesect
  
  // Gen 6
  719, // Diancie
  720, // Hoopa
  721, // Volcanion
  
  // Gen 7
  801, // Magearna
  802, // Marshadow
  807, // Zeraora
  808, // Meltan
  809, // Melmetal
  
  // Gen 8
  893, // Zarude
  
  // Gen 9
  1025, // Pecharunt
]);

// Ultra Beasts (special category)
const ULTRA_BEAST_IDS = new Set([
  793, // Nihilego
  794, // Buzzwole
  795, // Pheromosa
  796, // Xurkitree
  797, // Celesteela
  798, // Kartana
  799, // Guzzlord
  803, // Poipole
  804, // Naganadel
  805, // Stakataka
  806, // Blacephalon
]);

// Pseudo-Legendary Pokemon (high BST, 3-stage evolution lines)
const PSEUDO_LEGENDARY_IDS = new Set([
  // Gen 1
  149, // Dragonite
  
  // Gen 2
  248, // Tyranitar
  
  // Gen 3
  373, // Salamence
  376, // Metagross
  
  // Gen 4
  445, // Garchomp
  
  // Gen 5
  635, // Hydreigon
  
  // Gen 6
  706, // Goodra
  
  // Gen 7
  784, // Kommo-o
  
  // Gen 8
  887, // Dragapult
  
  // Gen 9
  998, // Baxcalibur
]);

// Pre-evolutions of each pseudo-legendary line (for "Show Evolutions" toggle)
const PSEUDO_LEGENDARY_EVOLUTION_IDS = new Set([
  // Dragonite line
  147, // Dratini
  148, // Dragonair

  // Tyranitar line
  246, // Larvitar
  247, // Pupitar

  // Salamence line
  371, // Bagon
  372, // Shelgon

  // Metagross line
  374, // Beldum
  375, // Metang

  // Garchomp line
  443, // Gible
  444, // Gabite

  // Hydreigon line
  633, // Deino
  634, // Zweilous

  // Goodra line
  704, // Goomy
  705, // Sliggoo

  // Kommo-o line
  782, // Jangmo-o
  783, // Hakamo-o

  // Dragapult line
  885, // Dreepy
  886, // Drakloak

  // Baxcalibur line
  996, // Frigibax
  997, // Arctibax
]);

// Sub-Legendary Pokemon (lower-tier legendary Pokemon)
const SUB_LEGENDARY_IDS = new Set([
  // Gen 1
  144, // Articuno
  145, // Zapdos
  146, // Moltres
  
  // Gen 2
  243, // Raikou
  244, // Entei
  245, // Suicune
  
  // Gen 3
  377, // Regirock
  378, // Regice
  379, // Registeel
  380, // Latias
  381, // Latios
  
  // Gen 4
  480, // Uxie
  481, // Mesprit
  482, // Azelf
  485, // Heatran
  486, // Regigigas
  488, // Cresselia
  
  // Gen 5
  638, // Cobalion
  639, // Terrakion
  640, // Virizion
  641, // Tornadus
  642, // Thundurus
  645, // Landorus
  
  // Gen 7
  772, // Type: Null
  773, // Silvally
  785, // Tapu Koko
  786, // Tapu Lele
  787, // Tapu Bulu
  788, // Tapu Fini
  891, // Kubfu
  892, // Urshifu
  
  // Gen 8
  894, // Regieleki
  895, // Regidrago
  896, // Glastrier
  897, // Spectrier
  905, // Enamorus
  
  // Gen 9
  1001, // Wo-Chien
  1002, // Chien-Pao
  1003, // Ting-Lu
  1004, // Chi-Yu
  1014, // Okidogi
  1015, // Munkidori
  1016, // Fezandipiti
  1017, // Ogerpon
]);

// Starter Pokemon base forms only (stage 1)
const STARTER_BASE_IDS = new Set([
  // Gen 1
  1,   // Bulbasaur
  4,   // Charmander
  7,   // Squirtle
  // Gen 2
  152, // Chikorita
  155, // Cyndaquil
  158, // Totodile
  // Gen 3
  252, // Treecko
  255, // Torchic
  258, // Mudkip
  // Gen 4
  387, // Turtwig
  390, // Chimchar
  393, // Piplup
  // Gen 5
  495, // Snivy
  498, // Tepig
  501, // Oshawott
  // Gen 6
  650, // Chespin
  653, // Fennekin
  656, // Froakie
  // Gen 7
  722, // Rowlet
  725, // Litten
  728, // Popplio
  // Gen 8
  810, // Grookey
  813, // Scorbunny
  816, // Sobble
  // Gen 9
  906, // Sprigatito
  909, // Fuecoco
  912, // Quaxly
]);

// Starter evolutions (stage 2 & 3) — shown when "Show Evolutions" is toggled
const STARTER_EVOLUTION_IDS = new Set([
  // Gen 1
  2, 3,   // Ivysaur, Venusaur
  5, 6,   // Charmeleon, Charizard
  8, 9,   // Wartortle, Blastoise
  // Gen 2
  153, 154, // Bayleef, Meganium
  156, 157, // Quilava, Typhlosion
  159, 160, // Croconaw, Feraligatr
  // Gen 3
  253, 254, // Grovyle, Sceptile
  256, 257, // Combusken, Blaziken
  259, 260, // Marshtomp, Swampert
  // Gen 4
  388, 389, // Grotle, Torterra
  391, 392, // Monferno, Infernape
  394, 395, // Prinplup, Empoleon
  // Gen 5
  496, 497, // Servine, Serperior
  499, 500, // Pignite, Emboar
  502, 503, // Dewott, Samurott
  // Gen 6
  651, 652, // Quilladin, Chesnaught
  654, 655, // Braixen, Delphox
  657, 658, // Frogadier, Greninja
  // Gen 7
  723, 724, // Dartrix, Decidueye
  726, 727, // Torracat, Incineroar
  729, 730, // Brionne, Primarina
  // Gen 8
  811, 812, // Thwackey, Rillaboom
  814, 815, // Raboot, Cinderace
  817, 818, // Drizzile, Inteleon
  // Gen 9
  907, 908, // Floragato, Meowscarada
  910, 911, // Crocalor, Skeledirge
  913, 914, // Quaxwell, Quaquaval
]);

// Keep for backward compatibility (anything that needs the full set)
const STARTER_POKEMON_IDS = new Set([...STARTER_BASE_IDS, ...STARTER_EVOLUTION_IDS]);

// Fossil Pokemon IDs (all fossil Pokemon from all generations)
const FOSSIL_BASE_IDS = new Set([
  // Gen 1
  138, // Omanyte
  140, // Kabuto
  142, // Aerodactyl (no standard evolution)
  // Gen 3
  345, // Lileep
  347, // Anorith
  // Gen 4
  408, // Cranidos
  410, // Shieldon
  // Gen 5
  564, // Tirtouga
  566, // Archen
  // Gen 6
  696, // Tyrunt
  698, // Amaura
  // Gen 8 (no evolutions)
  880, // Dracozolt
  881, // Arctozolt
  882, // Dracovish
  883, // Arctovish
]);

// Fossil evolutions (shown when "Show Evolutions" is toggled)
const FOSSIL_EVOLUTION_IDS = new Set([
  // Gen 1
  139, // Omastar
  141, // Kabutops
  // Gen 3
  346, // Cradily
  348, // Armaldo
  // Gen 4
  409, // Rampardos
  411, // Bastiodon
  // Gen 5
  565, // Carracosta
  567, // Archeops
  // Gen 6
  697, // Tyrantrum
  699, // Aurorus
]);

// Keep for backward compatibility
const FOSSIL_POKEMON_IDS = new Set([...FOSSIL_BASE_IDS, ...FOSSIL_EVOLUTION_IDS]);

// Baby Pokemon IDs (all baby Pokemon from all generations)
// Baby forms only
const BABY_BASE_IDS = new Set([
  // Gen 2
  172, // Pichu
  173, // Cleffa
  174, // Igglybuff
  175, // Togepi
  236, // Tyrogue
  238, // Smoochum
  239, // Elekid
  240, // Magby
  // Gen 3
  298, // Azurill
  360, // Wynaut
  // Gen 4
  406, // Budew
  433, // Chingling
  438, // Bonsly
  439, // Mime Jr.
  440, // Happiny
  446, // Munchlax
  447, // Riolu
  458, // Mantyke
  // Gen 8
  848, // Toxel
]);

// Evolutions of baby Pokemon (shown when "Show Evolutions" is toggled)
const BABY_EVOLUTION_IDS = new Set([
  // Pichu → Pikachu → Raichu
  25, 26,
  // Cleffa → Clefairy → Clefable
  35, 36,
  // Igglybuff → Jigglypuff → Wigglytuff
  39, 40,
  // Togepi → Togetic → Togekiss
  176, 468,
  // Tyrogue → Hitmonlee / Hitmonchan / Hitmontop
  106, 107, 237,
  // Smoochum → Jynx
  124,
  // Elekid → Electabuzz → Electivire
  125, 466,
  // Magby → Magmar → Magmortar
  126, 467,
  // Azurill → Marill → Azumarill
  183, 184,
  // Wynaut → Wobbuffet
  202,
  // Budew → Roselia → Roserade
  315, 407,
  // Chingling → Chimecho
  358,
  // Bonsly → Sudowoodo
  185,
  // Mime Jr. → Mr. Mime → Mr. Rime
  122, 866,
  // Happiny → Chansey → Blissey
  113, 242,
  // Munchlax → Snorlax
  143,
  // Riolu → Lucario
  448,
  // Mantyke → Mantine
  226,
  // Toxel → Toxtricity
  849,
]);

// Keep for backward compatibility
const BABY_POKEMON_IDS = new Set([...BABY_BASE_IDS, ...BABY_EVOLUTION_IDS]);

// Paradox Pokemon IDs (all Paradox Pokemon from Gen 9)
const PARADOX_POKEMON_IDS = new Set([
  // Gen 9 Paradox Pokemon
  984, // Great Tusk
  985, // Scream Tail
  986, // Brute Bonnet
  987, // Flutter Mane
  988, // Slither Wing
  989, // Sandy Shocks
  990, // Iron Treads
  991, // Iron Bundle
  992, // Iron Hands
  993, // Iron Jugulis
  994, // Iron Moth
  995, // Iron Thorns
  1005, // Roaring Moon
  1006, // Iron Valiant
  1009, // Walking Wake
  1010, // Iron Leaves
  1020, // Gouging Fire
  1021, // Raging Bolt
  1022, // Iron Boulder
  1023, // Iron Crown
]);

/**
 * Check if a Pokemon is legendary
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {boolean}
 */
export function isLegendary(pokemon) {
  if (!pokemon || !pokemon.id) return false;
  return LEGENDARY_POKEMON_IDS.has(pokemon.id);
}

/**
 * Check if a Pokemon is mythical
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {boolean}
 */
export function isMythical(pokemon) {
  if (!pokemon || !pokemon.id) return false;
  return MYTHICAL_POKEMON_IDS.has(pokemon.id);
}

/**
 * Check if a Pokemon is an Ultra Beast
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {boolean}
 */
export function isUltraBeast(pokemon) {
  if (!pokemon || !pokemon.id) return false;
  return ULTRA_BEAST_IDS.has(pokemon.id);
}

/**
 * Check if a Pokemon is pseudo-legendary
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {boolean}
 */
export function isPseudoLegendary(pokemon) {
  if (!pokemon || !pokemon.id) return false;
  return PSEUDO_LEGENDARY_IDS.has(pokemon.id);
}

/**
 * Check if a Pokemon is a pre-evolution of a pseudo-legendary
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {boolean}
 */
export function isPseudoLegendaryEvo(pokemon) {
  if (!pokemon || !pokemon.id) return false;
  return PSEUDO_LEGENDARY_EVOLUTION_IDS.has(pokemon.id);
}

/**
 * Check if a Pokemon is sub-legendary
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {boolean}
 */
export function isSubLegendary(pokemon) {
  if (!pokemon || !pokemon.id) return false;
  return SUB_LEGENDARY_IDS.has(pokemon.id);
}

/**
 * Check if a Pokemon is a starter
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {boolean}
 */
export function isStarter(pokemon) {
  if (!pokemon || !pokemon.id) return false;
  return STARTER_BASE_IDS.has(pokemon.id);
}

/**
 * Check if a Pokemon is an evolution of a starter
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {boolean}
 */
export function isStarterEvo(pokemon) {
  if (!pokemon || !pokemon.id) return false;
  return STARTER_EVOLUTION_IDS.has(pokemon.id);
}

/**
 * Check if a Pokemon is a fossil
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {boolean}
 */
export function isFossil(pokemon) {
  if (!pokemon || !pokemon.id) return false;
  return FOSSIL_BASE_IDS.has(pokemon.id);
}

/**
 * Check if a Pokemon is an evolution of a fossil Pokemon
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {boolean}
 */
export function isFossilEvo(pokemon) {
  if (!pokemon || !pokemon.id) return false;
  return FOSSIL_EVOLUTION_IDS.has(pokemon.id);
}

/**
 * Check if a Pokemon is a baby
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {boolean}
 */
export function isBaby(pokemon) {
  if (!pokemon || !pokemon.id) return false;
  return BABY_BASE_IDS.has(pokemon.id);
}

/**
 * Check if a Pokemon is an evolution of a baby Pokemon
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {boolean}
 */
export function isBabyEvo(pokemon) {
  if (!pokemon || !pokemon.id) return false;
  return BABY_EVOLUTION_IDS.has(pokemon.id);
}

/**
 * Check if a Pokemon is a paradox
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {boolean}
 */
export function isParadox(pokemon) {
  if (!pokemon || !pokemon.id) return false;
  return PARADOX_POKEMON_IDS.has(pokemon.id);
}

/**
 * Check if a Pokemon is legendary or mythical
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {boolean}
 */
export function isLegendaryOrMythical(pokemon) {
  return isLegendary(pokemon) || isMythical(pokemon);
}

/**
 * Get the category of a Pokemon
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {string} - 'legendary', 'mythical', 'ultra-beast', 'pseudo-legendary', 'sub-legendary', or 'regular'
 */
export function getPokemonCategory(pokemon) {
  if (!pokemon || !pokemon.id) return 'regular';
  
  if (isUltraBeast(pokemon)) return 'ultra-beast';
  if (isLegendary(pokemon)) return 'legendary';
  if (isMythical(pokemon)) return 'mythical';
  if (isPseudoLegendary(pokemon)) return 'pseudo-legendary';
  if (isSubLegendary(pokemon)) return 'sub-legendary';
  if (isParadox(pokemon)) return 'paradox';
  if (isStarter(pokemon)) return 'starter';
  if (isFossil(pokemon)) return 'fossil';
  if (isBaby(pokemon)) return 'baby';
  
  return 'regular';
}

/**
 * Get all Pokemon categories for filtering
 * @returns {Array} - Array of category objects with name and value
 */
export function getPokemonCategories() {
  return [
    { name: "Legendary", value: "legendary" },
    { name: "Sub Legendary", value: "sub-legendary" },
    { name: "Mythical", value: "mythical" },
    { name: "Ultra Beast", value: "ultra-beast" },
    { name: "Pseudo Legendary", value: "pseudo-legendary" },
    { name: "Paradox Mons", value: "paradox" },
    { name: "Starters", value: "starter" },
    { name: "Fossil Mons", value: "fossil" },
    { name: "Baby Mons", value: "baby" }
  ];
}
