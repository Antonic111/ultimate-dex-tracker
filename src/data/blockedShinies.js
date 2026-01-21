/**
 * Lists of Pokemon dex numbers and specific forms to block when shiny blocking preferences are enabled
 * 
 * These lists will be manually populated.
 * Pokemon IDs should match the id field in pokemon.json and forms.json
 * For specific forms, use the form name format (e.g., "vivillon-pokeball", "zapdos-galarian")
 */

// Pokemon dex numbers that have unobtainable shinies
export const UNOBTAINABLE_SHINY_DEX_NUMBERS = [
    "0494",
    "0719",
    "0720",
    "0721",
    "0789",
    "0790",
    "0801",
    "0802",
    "0891",
    "0892",
    "0893",
    "0896",
    "0897",
    "0898",
    "1009",
    "1010",
    "1014",
    "1015",
    "1016",
    "1017",
    "1020",
    "1021",
    "1022",
    "1023",
    "1024",
    "1025"
];

// Pokemon form names that have unobtainable shinies (for forms that share the same ID)
export const UNOBTAINABLE_SHINY_FORM_NAMES = [
    "vivillon-pokeball"
];

// Pokemon dex numbers that are GO exclusive shinies (only obtainable through Pokemon GO)
// genesect, keldeo, meloetta, meltan, melmetal, zamazenta, zacian
export const GO_EXCLUSIVE_SHINY_DEX_NUMBERS = [
    "0647",  // keldeo
    "0648",  // meloetta
    "0649",  // genesect
    "0808",  // meltan
    "0809",  // melmetal
    "0888",  // zacian
    "0889"   // zamazenta
];

// Pokemon form names that are GO exclusive shinies
// GMAX Melmetal, Galarian birds
export const GO_EXCLUSIVE_SHINY_FORM_NAMES = [
    "melmetal-gmax",
    "zapdos-galar",
    "articuno-galar",
    "moltres-galar"
];

// Pokemon dex numbers that are NO OT exclusive shinies (only obtainable without original trainer)
// zeraora, eternatus, enamorus, wo-chien, chien-pao, ting-lu, chi-yu, koraidon, miraidon
export const NO_OT_EXCLUSIVE_SHINY_DEX_NUMBERS = [
    "0807",  // zeraora
    "0890",  // eternatus
    "0905",  // enamorus (both forms share ID)
    "1001",  // wo-chien
    "1002",  // chien-pao
    "1003",  // ting-lu
    "1004",  // chi-yu
    "1007",  // koraidon
    "1008"   // miraidon
];

// Pokemon form names that are NO OT exclusive shinies
// therian enamorus is handled by the dex number since both forms share ID 905
export const NO_OT_EXCLUSIVE_SHINY_FORM_NAMES = [
    "enamorus-therian"
];

// Legacy combined exports for backward compatibility (if needed)
export const GO_NO_OT_EXCLUSIVE_SHINY_DEX_NUMBERS = [
    ...GO_EXCLUSIVE_SHINY_DEX_NUMBERS,
    ...NO_OT_EXCLUSIVE_SHINY_DEX_NUMBERS
];

export const GO_NO_OT_EXCLUSIVE_SHINY_FORM_NAMES = [
    ...GO_EXCLUSIVE_SHINY_FORM_NAMES,
    ...NO_OT_EXCLUSIVE_SHINY_FORM_NAMES
];
