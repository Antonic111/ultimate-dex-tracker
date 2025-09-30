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
  715, // Noivern
  
  // Gen 7
  784, // Kommo-o
  
  // Gen 8
  887, // Dragapult
  
  // Gen 9
  998, // Baxcalibur
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

// Starter Pokemon IDs (all starter Pokemon from all generations)
const STARTER_POKEMON_IDS = new Set([
  // Gen 1
  1, // Bulbasaur
  2, // Ivysaur
  3, // Venusaur
  4, // Charmander
  5, // Charmeleon
  6, // Charizard
  7, // Squirtle
  8, // Wartortle
  9, // Blastoise
  
  // Gen 2
  152, // Chikorita
  153, // Bayleef
  154, // Meganium
  155, // Cyndaquil
  156, // Quilava
  157, // Typhlosion
  158, // Totodile
  159, // Croconaw
  160, // Feraligatr
  
  // Gen 3
  252, // Treecko
  253, // Grovyle
  254, // Sceptile
  255, // Torchic
  256, // Combusken
  257, // Blaziken
  258, // Mudkip
  259, // Marshtomp
  260, // Swampert
  
  // Gen 4
  387, // Turtwig
  388, // Grotle
  389, // Torterra
  390, // Chimchar
  391, // Monferno
  392, // Infernape
  393, // Piplup
  394, // Prinplup
  395, // Empoleon
  
  // Gen 5
  495, // Snivy
  496, // Servine
  497, // Serperior
  498, // Tepig
  499, // Pignite
  500, // Emboar
  501, // Oshawott
  502, // Dewott
  503, // Samurott
  
  // Gen 6
  650, // Chespin
  651, // Quilladin
  652, // Chesnaught
  653, // Fennekin
  654, // Braixen
  655, // Delphox
  656, // Froakie
  657, // Frogadier
  658, // Greninja
  
  // Gen 7
  722, // Rowlet
  723, // Dartrix
  724, // Decidueye
  725, // Litten
  726, // Torracat
  727, // Incineroar
  728, // Popplio
  729, // Brionne
  730, // Primarina
  
  // Gen 8
  810, // Grookey
  811, // Thwackey
  812, // Rillaboom
  813, // Scorbunny
  814, // Raboot
  815, // Cinderace
  816, // Sobble
  817, // Drizzile
  818, // Inteleon
  
  // Gen 9
  906, // Sprigatito
  907, // Floragato
  908, // Meowscarada
  909, // Fuecoco
  910, // Crocalor
  911, // Skeledirge
  912, // Quaxly
  913, // Quaxwell
  914, // Quaquaval
]);

// Fossil Pokemon IDs (all fossil Pokemon from all generations)
const FOSSIL_POKEMON_IDS = new Set([
  // Gen 1
  138, // Omanyte
  139, // Omastar
  140, // Kabuto
  141, // Kabutops
  142, // Aerodactyl
  
  // Gen 3
  345, // Lileep
  346, // Cradily
  347, // Anorith
  348, // Armaldo
  
  // Gen 4
  408, // Cranidos
  409, // Rampardos
  410, // Shieldon
  411, // Bastiodon
  
  // Gen 5
  564, // Tirtouga
  565, // Carracosta
  566, // Archen
  567, // Archeops
  
  // Gen 6
  696, // Tyrunt
  697, // Tyrantrum
  698, // Amaura
  699, // Aurorus
  
  // Gen 8
  880, // Dracozolt
  881, // Arctozolt
  882, // Dracovish
  883, // Arctovish
]);

// Baby Pokemon IDs (all baby Pokemon from all generations)
const BABY_POKEMON_IDS = new Set([
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
  return STARTER_POKEMON_IDS.has(pokemon.id);
}

/**
 * Check if a Pokemon is a fossil
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {boolean}
 */
export function isFossil(pokemon) {
  if (!pokemon || !pokemon.id) return false;
  return FOSSIL_POKEMON_IDS.has(pokemon.id);
}

/**
 * Check if a Pokemon is a baby
 * @param {Object} pokemon - Pokemon object with id property
 * @returns {boolean}
 */
export function isBaby(pokemon) {
  if (!pokemon || !pokemon.id) return false;
  return BABY_POKEMON_IDS.has(pokemon.id);
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
    { name: "Starter Lines", value: "starter" },
    { name: "Fossil Mons", value: "fossil" },
    { name: "Baby Mons", value: "baby" }
  ];
}
