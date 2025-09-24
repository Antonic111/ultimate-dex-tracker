// Migration utility to convert old hunt method entries to new hunt system format
import { HUNT_SYSTEM } from './huntSystem';

/**
 * Migrates caught data entries to use the new hunt system method names
 * @param {Object} caughtData - The caught data object from the database
 * @returns {Object} - Updated caught data with migrated method names
 */
export function migrateHuntMethods(caughtData) {
    if (!caughtData || typeof caughtData !== 'object') {
        return caughtData;
    }

    const migratedData = { ...caughtData };
    let migrationCount = 0;
    let removalCount = 0;
    let pokemonProcessed = 0;
    let methodsProcessed = 0;

    // Method name mappings from old system to new system
    const methodMappings = {
        "Soft Resets": "Soft Resets",
        "Encounters": "Random Encounters", 
        "Masuda": "Masuda Method",
        "Egg Hatching": "Breeding",
        "Poke Radar": "Poke Radar",
        "Chain Fishing": "Chain Fishing",
        "Friend Safari": "Friend Safari",
        "Dex Nav": "DexNav",
        "Hordes": "Horde Encounters",
        "SOS": "SOS",
        "Poke Pelago": "Poke Pelago",
        "Ultra Wormhole": "Ultra Wormholes",
        "Catch Combo": "Catch Combo",
        "Battle Method": "KO Method",
        "Dynamax Adventures": "Dynamax Adventures",
        "Max Raid/Raid Battles": "Max Raid Battles",
        "Grand Underground": "Underground Diglett Hunt",
        "Massive Mass Outbreaks": "Massive Mass Outbreaks", // Keep as is for Legends Arceus
        "Picnic Resets": "Picnic Resets",
        "Sandwich": "Mass Outbreaks", // Convert to Mass Outbreaks
        "Found Randomly": "Random Encounters",
        "Research Rewards/Quests": "Field Research",
        "Time Space Distortions": "Time Space Distortions",
        "Gift Pokémon": "Gift Pokemon",
        "Fossil Revivals": "Fossil Revivals",
        "Mystery Gift": "Gift Pokemon", // Convert to Gift Pokemon
        "Permutations": "Permutations"
    };

    // Process each Pokemon's caught data
    Object.keys(migratedData).forEach(key => {
        const pokemonData = migratedData[key];
        pokemonProcessed++;
        
        // Handle old format (simple boolean) - convert to new format
        if (pokemonData === true || pokemonData === false) {
            console.log(`Converting old format Pokemon ${key} to new format`);
            migratedData[key] = {
                caught: pokemonData,
                entries: []
            };
            return;
        }
        
        // Handle Pokemon with entries
        if (pokemonData && pokemonData.entries && Array.isArray(pokemonData.entries)) {
            // Process each entry for this Pokemon
            pokemonData.entries = pokemonData.entries.map(entry => {
                // Handle entries with method but no game
                if (entry.method && !entry.game) {
                    console.log(`Entry has method "${entry.method}" but no game, removing method`);
                    removalCount++;
                    return { ...entry, method: "" };
                }
                
                // Skip entries without method
                if (!entry.method) {
                    return entry; // Skip entries without method
                }

                const oldMethod = entry.method;
                const game = entry.game;
                methodsProcessed++; // Count all methods processed
                
                // Check if the game exists in the hunt system
                if (!HUNT_SYSTEM[game]) {
                    console.log(`Game "${game}" not found in hunt system, removing method from entry`);
                    removalCount++;
                    return { ...entry, method: "" };
                }

                // Get available methods for this game
                const availableMethods = HUNT_SYSTEM[game].methods.map(m => m.name);
                
                // Check if the current method is valid for this game
                if (availableMethods.includes(oldMethod)) {
                    // Method is already valid, no change needed
                    console.log(`Method "${oldMethod}" is already valid for game "${game}"`);
                    return entry;
                }

                // Try to map the old method to a new method
                const mappedMethod = methodMappings[oldMethod];
                if (mappedMethod && availableMethods.includes(mappedMethod)) {
                    console.log(`Migrating method "${oldMethod}" to "${mappedMethod}" for game "${game}"`);
                    migrationCount++;
                    return { ...entry, method: mappedMethod };
                }

                // Method doesn't exist for this game, remove it
                console.log(`Method "${oldMethod}" not available for game "${game}", removing method`);
                removalCount++;
                return { ...entry, method: "" };
            });
        } else if (pokemonData && typeof pokemonData === 'object' && !pokemonData.entries) {
            // Handle Pokemon that are caught but don't have entries yet - ensure they have the new format
            console.log(`Ensuring Pokemon ${key} has proper new format`);
            migratedData[key] = {
                caught: pokemonData.caught || true,
                entries: []
            };
        }
    });

    console.log(`Migration complete: ${pokemonProcessed} Pokemon processed, ${methodsProcessed} methods processed, ${migrationCount} methods migrated, ${removalCount} methods removed`);
    return migratedData;
}

/**
 * Validates that a method exists for a specific game in the hunt system
 * @param {string} game - The game name
 * @param {string} method - The method name
 * @returns {boolean} - True if the method exists for the game
 */
export function isValidMethodForGame(game, method) {
    if (!HUNT_SYSTEM[game] || !HUNT_SYSTEM[game].methods) {
        return false;
    }
    
    return HUNT_SYSTEM[game].methods.some(m => m.name === method);
}

/**
 * Gets all valid methods for a specific game
 * @param {string} game - The game name
 * @returns {Array} - Array of valid method names for the game
 */
export function getValidMethodsForGame(game) {
    if (!HUNT_SYSTEM[game] || !HUNT_SYSTEM[game].methods) {
        return [];
    }
    
    return HUNT_SYSTEM[game].methods.map(m => m.name);
}
