// caughtStorage.js
import { caughtAPI } from './utils/api.js';

export function getCaughtKey(pokeOrId, fallbackFormType, isShiny = false) {
  if (typeof pokeOrId === "object") {
    const name = pokeOrId.name?.toLowerCase();
    const form = pokeOrId.formType || fallbackFormType;
    const shinySuffix = isShiny ? "_shiny" : "";
    return form ? `${name}_${form}${shinySuffix}` : `${name}${shinySuffix}`;
  } else {
    const shinySuffix = isShiny ? "_shiny" : "";
    return String(pokeOrId).toLowerCase() + (fallbackFormType ? `_${fallbackFormType}` : "") + shinySuffix;
  }
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
  const map = await loadCaughtMap();
  map[key] = info;
  await saveCaughtMap(map);
}

// Load one Pokémon's data from the full map
export async function loadCaughtInfo(poke, isShiny = false) {
  const key = getCaughtKey(poke, null, isShiny);
  const map = await loadCaughtMap();
  return map[key] || null;
}

// Helper function to get both regular and shiny caught status for a Pokémon
export function getPokemonCaughtStatus(poke, caughtMap) {
  const regularKey = getCaughtKey(poke, null, false);
  const shinyKey = getCaughtKey(poke, null, true);
  
  return {
    regular: !!caughtMap[regularKey],
    shiny: !!caughtMap[shinyKey],
    regularInfo: caughtMap[regularKey] || null,
    shinyInfo: caughtMap[shinyKey] || null
  };
}

// Migration helper: convert old caught data to new format
export function migrateOldCaughtData(oldCaughtMap) {
  const newCaughtMap = {};
  const migratedKeys = new Set();
  
  Object.entries(oldCaughtMap).forEach(([key, info]) => {
    // If the key doesn't already have a shiny suffix, it's old data
    if (!key.endsWith('_shiny')) {
      // Check if this was likely a shiny Pokémon based on the data
      const isLikelyShiny = detectLikelyShinyPokemon(key, info);
      
      if (isLikelyShiny) {
        // This was likely a shiny, move it to shiny storage
        const shinyKey = key + '_shiny';
        newCaughtMap[shinyKey] = info;
        migratedKeys.add(key);
        console.log(`Migrated likely shiny Pokémon: ${key} → ${shinyKey}`);
      } else {
        // Keep as regular Pokémon
        newCaughtMap[key] = info;
      }
    } else {
      // This is already new format data, keep it
      newCaughtMap[key] = info;
    }
  });
  
  return newCaughtMap;
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
  if (info.note && typeof info.note === 'string') {
    const note = info.note.toLowerCase();
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
  const hasOtherIndicators = info.method || info.note || (info.ball && info.ball.toLowerCase().includes('master'));
  if (hasOtherIndicators && info.game && typeof info.game === 'string') {
    const game = info.game.toLowerCase();
    const shinyGames = ['go', 'legends', 'scarlet', 'violet', 'sword', 'shield'];
    if (shinyGames.some(g => game.includes(g))) return true;
  }
  
  return false;
}
