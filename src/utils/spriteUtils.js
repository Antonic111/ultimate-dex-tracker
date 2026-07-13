/**
 * Utility functions for handling Pokémon sprites.
 */

/**
 * Gets the appropriate sprite URL for a Pokémon, considering shiny status and HOME sprite preference.
 * 
 * @param {Object} pokemon - The Pokémon object containing the sprites.
 * @param {boolean} isShiny - Whether to fetch the shiny variant.
 * @param {boolean} useHomeSprites - Whether the user prefers HOME sprites.
 * @returns {string} The URL to the appropriate sprite.
 */
export function getSpriteUrl(pokemon, isShiny = false, useHomeSprites = false) {
    if (!pokemon || !pokemon.sprites) {
        return '/fallback.png';
    }

    if (!useHomeSprites) {
        return isShiny && pokemon.sprites.front_shiny ? pokemon.sprites.front_shiny : (pokemon.sprites.front_default || '/fallback.png');
    }

    // User prefers HOME sprites - STRICT NO FALLBACK
    if (isShiny) {
        return pokemon.sprites.home_shiny || '';
    } else {
        return pokemon.sprites.home_default || '';
    }
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
    
    return url;
}
