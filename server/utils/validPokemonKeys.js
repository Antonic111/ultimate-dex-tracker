import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");

let cachedKeysSet = null;

export function getCanonicalKeysSet() {
  if (cachedKeysSet) return cachedKeysSet;

  const validKeys = new Set();
  try {
    const pokemonDataPath = path.join(rootDir, "src/data/pokemon.json");
    const formsDirPath = path.join(rootDir, "src/data/forms");

    if (fs.existsSync(pokemonDataPath)) {
      const pokemonData = JSON.parse(fs.readFileSync(pokemonDataPath, "utf-8"));
      pokemonData.forEach(p => {
        if (p.stableId) {
          validKeys.add(p.stableId);
          validKeys.add(`${p.stableId}_shiny`);
        }
      });
    }

    if (fs.existsSync(formsDirPath)) {
      const formsFiles = fs.readdirSync(formsDirPath).filter(f => f.endsWith(".json"));
      formsFiles.forEach(file => {
        const forms = JSON.parse(fs.readFileSync(path.join(formsDirPath, file), "utf-8"));
        forms.forEach(f => {
          if (f.stableId) {
            validKeys.add(f.stableId);
            validKeys.add(`${f.stableId}_shiny`);
          }
        });
      });
    }
  } catch (err) {
    console.error("Error loading canonical Pokemon keys set:", err);
  }

  cachedKeysSet = validKeys;
  return cachedKeysSet;
}

export function isValidPokemonKey(key) {
  if (!key || typeof key !== "string") return false;
  const keysSet = getCanonicalKeysSet();
  return keysSet.has(key);
}
