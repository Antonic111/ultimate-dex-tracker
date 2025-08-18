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
    const caughtMap = key ? { [key]: infoMap } : infoMap;
    
    await caughtAPI.updateCaughtData(caughtMap);
  } catch (err) {
    console.error("updateCaughtData error:", err);
  }
}
