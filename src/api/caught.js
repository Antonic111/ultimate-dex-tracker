// src/api/caught.js

export async function fetchCaughtData(username) {
  try {
    const res = await fetch("/api/caught", {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load caught data");
    return await res.json(); // should return the full caughtInfoMap
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



    const res = await fetch("/api/caught", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error("Failed to save caught data");
  } catch (err) {
    console.error("updateCaughtData error:", err);
  }
}
