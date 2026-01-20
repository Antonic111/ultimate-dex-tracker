// caughtStorage.js
import { caughtAPI } from './utils/api.js';

/**
 * Get the storage key for a Pokemon
 * Uses stableId (never changes, even if name/formType changes)
 */
export function getCaughtKey(pokeOrId, fallbackFormType, isShiny = false) {
  if (typeof pokeOrId === "object" && pokeOrId?.stableId) {
    return isShiny ? `${pokeOrId.stableId}_shiny` : pokeOrId.stableId;
  }
  
  // If no stableId, return null (shouldn't happen after migration)
  return null;
}

// Get the entire caughtMap from the backend
export async function loadCaughtMap() {
  try {
    return await caughtAPI.getCaughtData();
  } catch (err) {
    console.error("Failed to fetch caughtMap:", err);
    return {};
  }
}

// Save a full caughtMap (overwrite)
export async function saveCaughtMap(caughtMap) {
  try {
    await caughtAPI.updateCaughtData(caughtMap);
  } catch (err) {
    console.error("Failed to save caughtMap:", err);
  }
}

// Save or update info for one Pokémon
export async function saveCaughtInfo(poke, info, isShiny = false) {
  const key = getCaughtKey(poke, null, isShiny);
  if (!key) return;
  const map = await loadCaughtMap();
  map[key] = info;
  await saveCaughtMap(map);
}

// Load one Pokémon's data from the full map
export async function loadCaughtInfo(poke, isShiny = false) {
  const key = getCaughtKey(poke, null, isShiny);
  if (!key) return null;
  const map = await loadCaughtMap();
  return map[key] || null;
}

/**
 * Get caught info using stableId key
 * @param {Object} poke - Pokemon object
 * @param {Object} caughtMap - The caught map from database
 * @param {boolean} isShiny - Whether to get shiny data
 * @returns {Object|null} - Caught info or null
 */
export function getCaughtInfoWithMigration(poke, caughtMap, isShiny = false) {
  if (!poke || !caughtMap) return null;
  
  const key = getCaughtKey(poke, null, isShiny);
  if (!key) return null;
  
  return caughtMap[key] || null;
}

// Helper function to get both regular and shiny caught status for a Pokémon
export function getPokemonCaughtStatus(poke, caughtMap) {
  const regularInfo = getCaughtInfoWithMigration(poke, caughtMap, false);
  const shinyInfo = getCaughtInfoWithMigration(poke, caughtMap, true);
  
  return {
    regular: !!regularInfo,
    shiny: !!shinyInfo,
    regularInfo: regularInfo || null,
    shinyInfo: shinyInfo || null
  };
}

// Migration helper: convert old caught data to new format
export function migrateOldCaughtData(oldCaughtMap) {
  // Handle null or undefined input
  if (!oldCaughtMap || typeof oldCaughtMap !== 'object') {
    return {};
  }
  
  const newCaughtMap = {};
  const migratedKeys = new Set();
  
  Object.entries(oldCaughtMap).forEach(([key, info]) => {
    // Skip null or undefined info values
    if (info === null || info === undefined) {
      return;
    }
    
    // Check if this needs migration
    if (info.entries && Array.isArray(info.entries) && info.entries.length > 0) {
      // Already properly migrated with data, keep as is
      newCaughtMap[key] = info;
    } else if (info.hasOwnProperty('ball') || info.hasOwnProperty('mark') || info.hasOwnProperty('method') || info.hasOwnProperty('game') || info.hasOwnProperty('checks') || info.hasOwnProperty('date') || info.hasOwnProperty('notes')) {
      // This is old format data, migrate it regardless of key
      newCaughtMap[key] = migrateToEntriesFormat(info);
    } else if (info.entries && Array.isArray(info.entries) && info.entries.length === 0) {
      // Has entries structure but empty - this is a broken migration
      // Check if there's old format data at the root level that should be moved into entries
      if (info.hasOwnProperty('ball') || info.hasOwnProperty('mark') || info.hasOwnProperty('method') || info.hasOwnProperty('game') || info.hasOwnProperty('checks') || info.hasOwnProperty('date') || info.hasOwnProperty('notes')) {
        // Move the old data into the first entry
        const fixedData = {
          ...info,
          entries: [{
            ball: info.ball || "",
            mark: info.mark || "",
            method: info.method || "",
            game: info.game || "",
            checks: info.checks || "",
            date: info.date || "",
            notes: info.notes || "",
            entryId: Math.random().toString(36).substr(2, 9)
          }]
        };
        // Clear the old fields from the root level
        delete fixedData.ball;
        delete fixedData.mark;
        delete fixedData.method;
        delete fixedData.game;
        delete fixedData.checks;
        delete fixedData.date;
        delete fixedData.notes;
        
        newCaughtMap[key] = fixedData;
      } else {
        // Empty entries with no old data, but Pokemon is caught - create default entry
        if (info.caught === true) {
          const defaultEntry = {
            ...info,
            entries: [{
              ball: "",
              mark: "",
              method: "",
              game: "",
              checks: "",
              date: "",
              notes: "",
              entryId: Math.random().toString(36).substr(2, 9)
            }]
          };
          newCaughtMap[key] = defaultEntry;
        } else {
          // Empty entries with no old data, keep as is
          newCaughtMap[key] = info;
        }
      }
    } else if (info.caught === true) {
      // Pokemon is marked as caught but has no entries structure - create default entry
      const defaultEntry = {
        caught: true,
        entries: [{
          ball: "",
          mark: "",
          method: "",
          game: "",
          checks: "",
          date: "",
          notes: "",
          entryId: Math.random().toString(36).substr(2, 9)
        }]
      };
      newCaughtMap[key] = defaultEntry;
    } else {
      // Simple data (boolean, empty object), keep as is
      newCaughtMap[key] = info;
    }
  });
  
  return newCaughtMap;
}

// Helper function to migrate old data structure to new entries format
function migrateToEntriesFormat(oldInfo) {
  // Handle null or undefined input
  if (oldInfo === null || oldInfo === undefined) {
    return null;
  }
  
  // If it's already in the new format with actual data, return as is
  if (oldInfo.entries && Array.isArray(oldInfo.entries) && oldInfo.entries.length > 0) {
    return oldInfo;
  }
  
  // If it's the old format (has ball, mark, etc. directly), convert to entries
  if (oldInfo.hasOwnProperty('ball') || oldInfo.hasOwnProperty('mark') || oldInfo.hasOwnProperty('method') || oldInfo.hasOwnProperty('game') || oldInfo.hasOwnProperty('checks') || oldInfo.hasOwnProperty('date') || oldInfo.hasOwnProperty('notes')) {
    const newFormat = {
      caught: true,
      entries: [{
        ball: oldInfo.ball || "",
        mark: oldInfo.mark || "",
        method: oldInfo.method || "",
        game: oldInfo.game || "",
        checks: oldInfo.checks || "",
        date: oldInfo.date || "",
        notes: oldInfo.notes || "",
        entryId: Math.random().toString(36).substr(2, 9)
      }]
    };
    return newFormat;
  }
  
  // If it's marked as caught but has no specific data, create default entry
  if (oldInfo.caught === true) {
    const defaultFormat = {
      caught: true,
      entries: [{
        ball: "",
        mark: "",
        method: "",
        game: "",
        checks: "",
        date: "",
        notes: "",
        entryId: Math.random().toString(36).substr(2, 9)
      }]
    };
    return defaultFormat;
  }
  
  // If it's just a boolean or empty object, keep as is
  return oldInfo;
}



// Helper function to detect if a Pokémon was likely shiny
function detectLikelyShinyPokemon(key, info) {
  if (!info || typeof info !== 'object') return false;
  
  // Check if the user explicitly marked it as shiny
  if (info.shiny === true || info.isShiny === true) return true;
  
  // Check if the user used a shiny-related method
  if (info.method && typeof info.method === 'string') {
    const method = info.method.toLowerCase();
    const shinyMethods = [
      'shiny', 'charm', 'masuda', 'sos', 'chain', 'radar', 'dexnav', 
      'friend safari', 'horde', 'dynamax adventure', 'max raid',
      'outbreak', 'alpha', 'mass outbreak'
    ];
    if (shinyMethods.some(m => method.includes(m))) return true;
  }
  
  // Check if the user used a Master Ball (often used for shinies)
  if (info.ball && typeof info.ball === 'string') {
    const ball = info.ball.toLowerCase();
    if (ball.includes('master') || ball.includes('cherish')) return true;
  }
  
  // Check if the user added a note about it being shiny
  if (info.notes && typeof info.notes === 'string') {
    const note = info.notes.toLowerCase();
    const shinyKeywords = [
      'shiny', '✨', 'sparkle', 'star', 'golden', 'alternate color',
      'different color', 'rare color', 'special color'
    ];
    if (shinyKeywords.some(k => note.includes(k))) return true;
  }
  
  // Check for specific marks that indicate shiny hunting
  if (info.mark && typeof info.mark === 'string') {
    const mark = info.mark.toLowerCase();
    const shinyMarks = ['rare', 'uncommon', 'alpha', 'jumbo', 'mini'];
    if (shinyMarks.some(m => mark.includes(m))) return true;
  }
  
  // Only migrate from high shiny probability games if other indicators are present
  const hasOtherIndicators = info.method || info.notes || (info.ball && info.ball.toLowerCase().includes('master'));
  if (hasOtherIndicators && info.game && typeof info.game === 'string') {
    const game = info.game.toLowerCase();
    const shinyGames = ['go', 'legends', 'scarlet', 'violet', 'sword', 'shield'];
    if (shinyGames.some(g => game.includes(g))) return true;
  }
  
  return false;
}
