// src/api/caught.js
import { caughtAPI } from '../utils/api.js';

export async function fetchCaughtData(username) {
  try {
    return await caughtAPI.getCaughtData();
  } catch (err) {
    console.error("fetchCaughtData error:", err);
    return {};
  }
}

export async function updateCaughtData(username, key, infoMap) {
  try {
    // Get existing caught data first
    const existingData = await caughtAPI.getCaughtData();
    
    let updatedCaughtMap;
    
    if (key) {
      // Single Pokémon update - merge with existing data
      if (infoMap === null) {
        // Remove this Pokémon from caught data
        const { [key]: removed, ...rest } = existingData;
        updatedCaughtMap = rest;
      } else {
        // Add/update this Pokémon
        updatedCaughtMap = { ...existingData, [key]: infoMap };
      }
    } else {
      // Full map update (from mark all operations)
      updatedCaughtMap = infoMap;
    }
    
    await caughtAPI.updateCaughtData(updatedCaughtMap);
  } catch (err) {
    console.error("updateCaughtData error:", err);
  }
}
