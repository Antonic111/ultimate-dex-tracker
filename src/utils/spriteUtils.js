import pokemonData from "../data/pokemon.json";
import formsDataDefault from "./loadFormsData";

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

    let resolved = pokemon;

    // If pokemon object does not have full sprites, resolve it from pokemonData / formsData
    if (!pokemon.sprites) {
        const name = typeof pokemon === 'string' ? pokemon : (pokemon.name || pokemon.pokemonName || pokemon.targetPokemon || '');
        const id = typeof pokemon === 'object' ? (pokemon.id || pokemon.speciesId) : null;
        const stableId = typeof pokemon === 'object' ? pokemon.stableId : null;

        if (stableId) {
            const formMatch = formsDataDefault?.find(f => f.stableId === stableId);
            if (formMatch && formMatch.sprites) resolved = formMatch;
        }
        if (!resolved.sprites && id) {
            const baseMatch = pokemonData.find(p => p.id === Number(id));
            if (baseMatch && baseMatch.sprites) resolved = baseMatch;
        }
        if (!resolved.sprites && name) {
            const cleanName = name.trim().toLowerCase();
            const formMatch = formsDataDefault?.find(f => (f.stableId && f.stableId.toLowerCase() === cleanName) || (f.name && f.name.toLowerCase() === cleanName));
            if (formMatch && formMatch.sprites) {
                resolved = formMatch;
            } else {
                const baseMatch = pokemonData.find(p => p.name && p.name.toLowerCase() === cleanName);
                if (baseMatch && baseMatch.sprites) resolved = baseMatch;
            }
        }
    }

    if (resolved && resolved.sprites) {
        if (!useHomeSprites) {
            return isShiny && resolved.sprites.front_shiny
                ? resolved.sprites.front_shiny
                : (resolved.sprites.front_default || resolved.sprites.other?.['official-artwork']?.front_default || '/fallback.png');
        }

        // User prefers HOME sprites - fall back to front sprites if home sprite is unavailable
        if (isShiny) {
            return resolved.sprites.home_shiny || resolved.sprites.front_shiny || resolved.sprites.front_default || '/fallback.png';
        } else {
            return resolved.sprites.home_default || resolved.sprites.front_default || '/fallback.png';
        }
    }

    // If pokemon has an existing static image URL, transform it according to viewer preferences
    if (typeof pokemon === 'object' && pokemon.image) {
        return transformSpriteUrlForViewer(pokemon.image, useHomeSprites);
    }
    if (typeof pokemon === 'string' && pokemon.startsWith('http')) {
        return transformSpriteUrlForViewer(pokemon, useHomeSprites);
    }

    return '/fallback.png';
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
    
    // We can only reliably transform PokeAPI URLs without the full pokemon object
    if (url.includes('githubusercontent.com/PokeAPI')) {
        if (useHomeSprites) {
            // Transform to HOME
            if (!url.includes('/other/home/')) {
                if (url.includes('/shiny/')) {
                    return url.replace('/pokemon/shiny/', '/pokemon/other/home/shiny/');
                } else {
                    return url.replace('/pokemon/', '/pokemon/other/home/');
                }
            }
        } else {
            // Transform back to default (if it was sent as a HOME sprite by a user who has it ON)
            if (url.includes('/other/home/')) {
                if (url.includes('/shiny/')) {
                    return url.replace('/pokemon/other/home/shiny/', '/pokemon/shiny/');
                } else {
                    return url.replace('/pokemon/other/home/', '/pokemon/');
                }
            }
        }
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
