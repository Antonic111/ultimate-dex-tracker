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
    if (key) {
      // Atomic per-entry update to avoid race conditions
      const result = await caughtAPI.updateCaughtEntry(key, infoMap);
      return result;
    } else {
      // Full map update (from mark all operations)
      const result = await caughtAPI.updateCaughtData(infoMap);
      return result;
    }
  } catch (err) {
    console.error("updateCaughtData error:", err);
    throw err;
  }
}
