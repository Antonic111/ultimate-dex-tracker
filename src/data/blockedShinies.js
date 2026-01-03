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

// Pokemon dex numbers that are GO & NO OT exclusive shinies
export const GO_NO_OT_EXCLUSIVE_SHINY_DEX_NUMBERS = [
    "0648",
    "0647",
    "0649",
    "0807",
    "0808",
    "0809",
    "0888",
    "0889",
    "0890",
    "0905",
    "1001",
    "1002",
    "1003",
    "1004",
    "1007",
    "1008"
];

// Pokemon form names that are GO & NO OT exclusive shinies (for forms that share the same ID)
export const GO_NO_OT_EXCLUSIVE_SHINY_FORM_NAMES = [
    "zapdos-galar",
    "articuno-galar",
    "moltres-galar"
];

