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
    const body = {
      caughtMap: key ? { [key]: infoMap } : infoMap
    };
    console.log("Sending caught data:", body);
    
    await caughtAPI.updateCaughtData(key, infoMap);
  } catch (err) {
    console.error("updateCaughtData error:", err);
  }
}
