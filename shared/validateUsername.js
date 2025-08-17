import { distance } from "fastest-levenshtein";
import { bannedWords } from "./bannedTerms.js";

// Normalize username to catch obfuscation like b!tch, fuuuuck, etc.
function normalizeUsername(username) {
  return username
    .toLowerCase()
    .replace(/[@]/g, "a")
    .replace(/[!1|l]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4]/g, "a")
    .replace(/[5\$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[0]/g, "o")
    .replace(/[^ a-z0-9_\-.,~\*]/g, "")
    .replace(/(.)\1{2,}/g, "$1");
}

function isBadUsername(username) {
  const norm = normalizeUsername(username);

  // Check length first
  if (username.length < 3) return "Username must be at least 3 characters";
  if (username.length > 20) return "Username must be no more than 20 characters";

  // Check against banned words
  const isBad = bannedWords.some(word => {
    if (norm.includes(word)) return true;
    return distance(norm, word) <= Math.min(1, Math.floor(word.length / 5));
  });

  if (isBad) return "Inappropriate or restricted username.";

  return false; // Username is fine
}

export { isBadUsername };
