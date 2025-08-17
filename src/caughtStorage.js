// caughtStorage.js

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
    const res = await fetch("/api/caught", {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load caughtMap");
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch caughtMap:", err);
    return {};
  }
}

// Save a full caughtMap (overwrite)
export async function saveCaughtMap(caughtMap) {
  try {
    const res = await fetch("/api/caught", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caughtMap }),
    });
    if (!res.ok) throw new Error("Failed to save caughtMap");
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
