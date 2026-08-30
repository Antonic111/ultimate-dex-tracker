import pokemonData from "../data/pokemon.json";
import formsDataDefault from "./loadFormsData";

/**
 * Cleans a raw Pokemon name, caughtKey, or hunt identifier (e.g. "Komala 775_shiny", "775_shiny", "775:shiny", "deoxys-attack:shiny")
 * into a clean, canonical Pokemon name.
 * 
 * @param {string} raw - The raw Pokemon name or key.
 * @returns {string} The cleaned Pokemon name.
 */
export function cleanPokemonNameOrKey(raw = "") {
    if (!raw || typeof raw !== "string") return "";
    let clean = raw.trim();

    // Strip out standard suffix tags like :shiny, _shiny, -shiny, (shiny)
    clean = clean.replace(/[:_ -]?shiny$/i, "").replace(/\(shiny\)$/i, "").trim();

    // Check if it's in format "Name 123" or "Name_123" or "Name-123"
    const matchNameWithId = clean.match(/^([a-zA-Z\s.-]+?)[\s_-]+(\d+)$/);
    if (matchNameWithId) {
        const namePart = matchNameWithId[1].trim();
        const idPart = Number(matchNameWithId[2]);
        const match = pokemonData.find(p => p.id === idPart || p.name?.toLowerCase() === namePart.toLowerCase());
        if (match) return match.name;
        return namePart;
    }

    // Check if it's pure numeric ID like "775"
    if (/^\d+$/.test(clean)) {
        const match = pokemonData.find(p => p.id === Number(clean));
        if (match) return match.name;
    }

    return clean;
}

/**
 * Resolves a full Pokémon object (with ID and sprites) from any entry, string, or partial object.
 * 
 * @param {Object|string} entryOrPokemon - The hunt entry or Pokémon object/name.
 * @returns {Object|null} Full Pokémon object or fallback object.
 */
export function resolvePokemon(entryOrPokemon) {
    if (!entryOrPokemon) return null;

    // If it already has full sprites or image, return as-is or enhance
    if (typeof entryOrPokemon === "object" && entryOrPokemon.sprites && entryOrPokemon.id) {
        return entryOrPokemon;
    }

    const rawName = typeof entryOrPokemon === "string"
        ? entryOrPokemon
        : (entryOrPokemon.pokemonName || entryOrPokemon.targetPokemon || entryOrPokemon.target || entryOrPokemon.name || entryOrPokemon.pokemon?.name || entryOrPokemon.caughtKey || "");
    
    const id = typeof entryOrPokemon === "object"
        ? (entryOrPokemon.pokemon?.id || entryOrPokemon.id || entryOrPokemon.speciesId || entryOrPokemon.pokemonId || null)
        : null;

    const stableId = typeof entryOrPokemon === "object"
        ? (entryOrPokemon.pokemon?.stableId || entryOrPokemon.stableId || null)
        : null;

    // 1. Try stableId against forms
    if (stableId) {
        const formMatch = formsDataDefault?.find(f => f.stableId === stableId);
        if (formMatch) return formMatch;
    }

    // 2. Clean the raw name
    const cleanName = cleanPokemonNameOrKey(rawName);

    if (cleanName) {
        const lower = cleanName.toLowerCase();
        // Check forms
        const formMatch = formsDataDefault?.find(f => 
            (f.stableId && f.stableId.toLowerCase() === lower) || 
            (f.name && f.name.toLowerCase() === lower)
        );
        if (formMatch) return formMatch;

        // Check base pokemonData
        const baseMatch = pokemonData.find(p => p.name && p.name.toLowerCase() === lower);
        if (baseMatch) return baseMatch;
    }

    // 3. Try numeric ID
    if (id && !isNaN(Number(id))) {
        const baseMatch = pokemonData.find(p => p.id === Number(id));
        if (baseMatch) return baseMatch;
    }

    // Fallback object with clean name
    return {
        name: cleanName || rawName || "Unknown",
        id: Number(id) || 1
    };
}

/**
 * Converts a raw PokeAPI sprite URL to the local pre-trimmed static asset path.
 * @param {string} url - Original sprite URL
 * @returns {string} Trimmed local asset path or original fallback
 */
export function toTrimmedSpriteUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/')) {
        return url.replace('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/', '/Sprites/trimmed/pokemon/');
    }
    return url;
}

/**
 * Gets the appropriate sprite URL for a Pokémon, considering shiny status and HOME sprite preference.
 * Reliably resolves sprites even for legacy hunt records or partial Pokémon objects.
 * 
 * @param {Object|string} pokemon - The Pokémon object or name.
 * @param {boolean} isShiny - Whether to fetch the shiny variant.
 * @param {boolean} useHomeSprites - Whether the user prefers HOME sprites.
 * @returns {string} The URL to the appropriate sprite.
 */
export function getSpriteUrl(pokemon, isShiny = false, useHomeSprites = false) {
    if (!pokemon) {
        return '/fallback.png';
    }

    const resolved = resolvePokemon(pokemon) || pokemon;
    let finalUrl = '/fallback.png';

    if (resolved && resolved.sprites) {
        if (!useHomeSprites) {
            finalUrl = isShiny && resolved.sprites.front_shiny
                ? resolved.sprites.front_shiny
                : (resolved.sprites.front_default || resolved.sprites.other?.['official-artwork']?.front_default || '/fallback.png');
        } else {
            // User prefers HOME sprites - fall back to front sprites if home sprite is unavailable
            if (isShiny) {
                finalUrl = resolved.sprites.home_shiny || resolved.sprites.front_shiny || resolved.sprites.front_default || '/fallback.png';
            } else {
                finalUrl = resolved.sprites.home_default || resolved.sprites.front_default || '/fallback.png';
            }
        }
    } else if (typeof pokemon === 'object' && pokemon.image) {
        finalUrl = transformSpriteUrlForViewer(pokemon.image, useHomeSprites);
    } else if (typeof pokemon === 'string' && pokemon.startsWith('http')) {
        finalUrl = transformSpriteUrlForViewer(pokemon, useHomeSprites);
    }

    return toTrimmedSpriteUrl(finalUrl);
}

/**
 * Transforms an existing sprite URL based on the viewer's preferences.
 * Useful for data from the backend (like the global feed) where we only have the URL.
 * 
 * @param {string} url - The original sprite URL.
 * @param {boolean} useHomeSprites - Whether the viewer prefers HOME sprites.
 * @returns {string} The transformed URL.
 */
export function transformSpriteUrlForViewer(url, useHomeSprites = false) {
    if (!url) return '/fallback.png';
    
    // Handle trimmed local sprites
    if (url.includes('/Sprites/trimmed/pokemon/')) {
        if (useHomeSprites) {
            if (!url.includes('/other/home/')) {
                if (url.includes('/shiny/')) {
                    return url.replace('/pokemon/shiny/', '/pokemon/other/home/shiny/');
                } else {
                    return url.replace('/pokemon/', '/pokemon/other/home/');
                }
            }
        } else {
            if (url.includes('/other/home/')) {
                if (url.includes('/shiny/')) {
                    return url.replace('/pokemon/other/home/shiny/', '/pokemon/shiny/');
                } else {
                    return url.replace('/pokemon/other/home/', '/pokemon/');
                }
            }
        }
        return url;
    }

    // We can only reliably transform PokeAPI URLs without the full pokemon object
    if (url.includes('githubusercontent.com/PokeAPI')) {
        if (useHomeSprites) {
            // Transform to HOME
            if (!url.includes('/other/home/')) {
                if (url.includes('/shiny/')) {
                    return toTrimmedSpriteUrl(url.replace('/pokemon/shiny/', '/pokemon/other/home/shiny/'));
                } else {
                    return toTrimmedSpriteUrl(url.replace('/pokemon/', '/pokemon/other/home/'));
                }
            }
        } else {
            // Transform back to default (if it was sent as a HOME sprite by a user who has it ON)
            if (url.includes('/other/home/')) {
                if (url.includes('/shiny/')) {
                    return toTrimmedSpriteUrl(url.replace('/pokemon/other/home/shiny/', '/pokemon/shiny/'));
                } else {
                    return toTrimmedSpriteUrl(url.replace('/pokemon/other/home/', '/pokemon/'));
                }
            }
        }
        return toTrimmedSpriteUrl(url);
    }
    // Handle Local Sprites
    if (url.startsWith('/Sprites/')) {
        if (useHomeSprites) {
            // Transform to HOME
            if (!url.startsWith('/Sprites/Home/')) {
                return url.replace('/Sprites/', '/Sprites/Home/');
            }
        } else {
            // Transform back to default
            if (url.startsWith('/Sprites/Home/')) {
                return url.replace('/Sprites/Home/', '/Sprites/');
            }
        }
    }

    return url;
}
