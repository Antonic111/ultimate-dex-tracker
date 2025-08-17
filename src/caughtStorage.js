// caughtStorage.js
import { caughtAPI } from './utils/api.js';

export function getCaughtKey(pokeOrId, fallbackFormType) {
  if (typeof pokeOrId === "object") {
    const name = pokeOrId.name?.toLowerCase();
    const form = pokeOrId.formType || fallbackFormType;
    return form ? `${name}_${form}` : name;
  } else {
    return String(pokeOrId).toLowerCase() + (fallbackFormType ? `_${fallbackFormType}` : "");
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
export async function saveCaughtInfo(poke, info) {
  const key = getCaughtKey(poke);
  const map = await loadCaughtMap();
  map[key] = info;
  await saveCaughtMap(map);
}

// Load one Pokémon's data from the full map
export async function loadCaughtInfo(poke) {
  const key = getCaughtKey(poke);
  const map = await loadCaughtMap();
  return map[key] || null;
}
