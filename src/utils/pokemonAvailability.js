import gamePokemonData from "../data/gamePokemon.json";
import versionExclusives from "../data/versionExclusives.json";
import { getAvailableGamesForPokemon } from "./gameMapping";

const GAME_RELEASE_ORDER = [
  "Red", "Green",
  "Blue",
  "Yellow",
  "Gold", "Silver",
  "Crystal",
  "Ruby", "Sapphire",
  "Emerald",
  "Fire Red", "Leaf Green",
  "Diamond", "Pearl",
  "Platinum",
  "Heart Gold", "Soul Silver",
  "Black", "White",
  "Black 2", "White 2",
  "X", "Y",
  "Omega Ruby", "Alpha Sapphire",
  "Sun", "Moon",
  "Ultra Sun", "Ultra Moon",
  "Lets GO Pikachu", "Lets GO Eevee",
  "Sword", "Shield",
  "Brilliant Diamond", "Shining Pearl",
  "Legends Arceus",
  "Scarlet", "Violet",
  "Legends Z-A",
  "GO"
];

export const GAME_COUNTERPARTS = {
  "Red": ["Blue", "Green", "Yellow"],
  "Blue": ["Red", "Green", "Yellow"],
  "Green": ["Red", "Blue", "Yellow"],
  "Yellow": ["Red", "Blue", "Green"],
  "Gold": ["Silver", "Crystal"], "Silver": ["Gold", "Crystal"], "Crystal": ["Gold", "Silver"],
  "Ruby": ["Sapphire", "Emerald"], "Sapphire": ["Ruby", "Emerald"], "Emerald": ["Ruby", "Sapphire"],
  "Diamond": ["Pearl", "Platinum"], "Pearl": ["Diamond", "Platinum"], "Platinum": ["Diamond", "Pearl"],
  "Black": "White", "White": "Black",
  "Black 2": "White 2", "White 2": "Black 2",
  "X": "Y", "Y": "X",
  "Omega Ruby": "Alpha Sapphire", "Alpha Sapphire": "Omega Ruby",
  "Sun": "Moon", "Moon": "Sun",
  "Ultra Sun": "Ultra Moon", "Ultra Moon": "Ultra Sun",
  "Lets GO Pikachu": "Let's Go Eevee", "Lets GO Eevee": "Let's Go Pikachu",
  "Sword": "Shield", "Shield": "Sword",
  "Brilliant Diamond": "Shining Pearl", "Shining Pearl": "Brilliant Diamond",
  "Scarlet": "Violet", "Violet": "Scarlet"
};

export const normalizeGameName = (name) =>
  String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");

export const PLA_SHINY_LOCKED_IDS = new Set([
  480, // Uxie
  481, // Mesprit
  482, // Azelf
  483, // Dialga
  484, // Palkia
  485, // Heatran
  486, // Regigigas
  487, // Giratina
  488, // Cresselia
  489, // Phione
  490, // Manaphy
  491, // Darkrai
  492, // Shaymin
  493, // Arceus
  641, // Tornadus
  642, // Thundurus
  645, // Landorus
  905  // Enamorus
]);

export const PLA_SHINY_LOCKED_NAMES = [
  "enamorus",
  "landorus",
  "thundurus",
  "tornadus",
  "arceus",
  "shaymin",
  "darkrai",
  "manaphy",
  "phione",
  "cresselia",
  "giratina",
  "regigigas",
  "heatran",
  "palkia",
  "dialga",
  "azelf",
  "mesprit",
  "uxie"
];

export const isPLAShinyLocked = (pokemon) => {
  if (!pokemon) return false;
  const idNum = Number(pokemon.id);
  if (PLA_SHINY_LOCKED_IDS.has(idNum)) return true;
  const name = String(pokemon.name || "").toLowerCase().replace(/[^a-z]/g, "");
  return PLA_SHINY_LOCKED_NAMES.some(locked => name.includes(locked));
};

export const isNonPartnerCapPikachu = (pokemon) => {
  if (!pokemon) return false;
  const name = (pokemon.name || "").toLowerCase();
  const stableId = (pokemon.stableId || "").toLowerCase();
  if (name === "pikachu-partner-cap" || stableId === "pikachu-partner-cap-0025") return false;
  return (
    name.endsWith("-cap") ||
    stableId.includes("-cap-") ||
    name === "pikachu-original-cap" ||
    name === "pikachu-kalos-cap" ||
    name === "pikachu-sinnoh-cap" ||
    name === "pikachu-unova-cap" ||
    name === "pikachu-world-cap" ||
    name === "pikachu-alola-cap" ||
    name === "pikachu-hoenn-cap"
  );
};

export const isCapPikachu = (pokemon) => {
  if (!pokemon) return false;
  const name = (pokemon.name || "").toLowerCase();
  const stableId = (pokemon.stableId || "").toLowerCase();
  return (
    name.endsWith("-cap") ||
    stableId.includes("-cap-") ||
    name.includes("partner-cap") ||
    stableId.includes("partner-cap")
  );
};

// Get games where a Pokemon can be caught, ordered by release date.
// This mirrors the sidebar "Obtainable In" logic for 1:1 matching.
export const getAvailableGamesForPokemonSidebar = (pokemon, isShiny = true) => {
  if (!pokemon || !pokemon.id) return [];

  const pokemonName = pokemon.name?.toLowerCase() || "";
  const formType = pokemon.formType?.toLowerCase() || "";
  let availableGames = [];

  // 1. Determine base availability (Hardcoded Forms vs Default)
  if (pokemon.stableId === "origin-ball-dialga-483" || pokemon.stableId === "origin-ball-palkia-484" || pokemon.stableId?.startsWith("origin-ball-") || pokemonName.startsWith("origin-ball-")) {
    return isShiny ? [] : ["Legends Arceus"];
  }

  // Non-partner Cap Pikachus (Sword & Shield only, cannot be shiny)
  if (isNonPartnerCapPikachu(pokemon)) {
    return isShiny ? [] : ["Sword", "Shield"];
  }

  if (formType === "mighty" && Number(pokemon.id) !== 151 && pokemonName !== "mew") {
    return ["Scarlet", "Violet"];
  }

  const isAlpha =
    formType === "alpha" ||
    formType === "alphaother" ||
    pokemonName.includes("alpha") ||
    pokemon.form === "alpha" ||
    String(pokemon.form || "").toLowerCase().includes("alpha") ||
    pokemon.stableId?.includes("-alpha-") ||
    pokemon.stableId?.endsWith("-alpha");

  if (isAlpha) {
    if (pokemonName.includes("alolan") || pokemonName.includes("galarian") || pokemonName.includes("paldean") || pokemonName.includes("gmax") || pokemonName.includes("mega")) {
      availableGames = [];
    } else {
      // Alpha Pokemon - check Legends Arceus / Legends Z-A only
      const formattedId = String(pokemon.id).padStart(4, "0");
      const legendsArceusIds = gamePokemonData["Legends Arceus"];
      if (legendsArceusIds && legendsArceusIds.includes(formattedId)) {
        availableGames.push("Legends Arceus");
      }
      const legendsZAIds = gamePokemonData["Legends Z-A"];
      if (legendsZAIds && legendsZAIds.includes(formattedId)) {
        availableGames.push("Legends Z-A");
      }
      if (availableGames.length === 0) availableGames = ["Legends Arceus"];
    }
  }
  else if (pokemonName.includes("therian") || pokemonName.includes("therian-") || pokemonName.includes("-therian")) {
    availableGames = (isShiny && isPLAShinyLocked(pokemon)) ? ["GO"] : ["Legends Arceus", "GO"];
  }
  else if (pokemonName.includes("magikarp") && (pokemonName.includes("level-100") || pokemonName.includes("level 100") || pokemonName.includes("lvl-100") || pokemonName.includes("lvl 100"))) {
    availableGames = ["Diamond", "Pearl", "Platinum", "Scarlet", "Violet"];
  }
  else if (pokemonName.includes("partner-cap") || pokemonName.includes("partner cap") || pokemonName.includes("ash-cap") || pokemonName.includes("ash cap")) {
    availableGames = ["Ultra Sun", "Ultra Moon"];
  }
  else if (pokemonName.includes("unown")) {
    availableGames = ["Gold", "Silver", "Crystal", "Heart Gold", "Soul Silver", "Brilliant Diamond", "Shining Pearl", "Legends Arceus", "GO"];
  }
  else if (formType === "gmax" || pokemonName.includes("gmax") || pokemonName.includes("gigantamax")) {
    availableGames = ["Sword", "Shield", "GO"];
  }
  else if (formType === "alolan" || pokemonName.includes("-alolan") || pokemonName.includes("alolan-") || pokemonName.includes("alolan ")) {
    let baseName = pokemonName;
    if (pokemonName.includes("-alolan")) {
      baseName = pokemonName.replace("-alolan", "").trim();
    } else if (pokemonName.includes("alolan ")) {
      baseName = pokemonName.replace("alolan ", "").trim();
    } else if (pokemonName.includes("alolan")) {
      baseName = pokemonName.replace("alolan", "").trim();
    }
    baseName = baseName.replace(/\s*\([^)]*\)\s*/, "").trim();

    if (baseName === "vulpix" || baseName === "ninetales") {
      availableGames = ["Sun", "Moon", "Ultra Sun", "Ultra Moon", "Lets GO Pikachu", "Lets GO Eevee", "Sword", "Shield", "Legends Arceus", "Scarlet", "Violet", "GO"];
    } else {
      const alolanInSV_SWSH = ["raichu", "sandshrew", "sandslash", "diglett", "dugtrio", "meowth", "persian", "marowak", "exeggutor"];
      const alolanInSV_Only = ["geodude", "graveler", "golem", "grimer", "muk"];

      if (alolanInSV_SWSH.includes(baseName)) {
        availableGames = ["Sun", "Moon", "Ultra Sun", "Ultra Moon", "Lets GO Pikachu", "Lets GO Eevee", "Sword", "Shield", "Scarlet", "Violet", "GO"];
      } else if (alolanInSV_Only.includes(baseName)) {
        availableGames = ["Sun", "Moon", "Ultra Sun", "Ultra Moon", "Lets GO Pikachu", "Lets GO Eevee", "Scarlet", "Violet", "GO"];
      } else {
        availableGames = ["Sun", "Moon", "Ultra Sun", "Ultra Moon", "Lets GO Pikachu", "Lets GO Eevee", "GO"];
      }
    }
  }
  else if (formType === "galarian" || pokemonName.includes("-galarian") || pokemonName.includes("galarian-") || pokemonName.includes("galarian ") || pokemonName.includes("-galar") || pokemonName.includes("galar-")) {
    const galarianInSV = ["slowpoke", "slowbro", "slowking", "meowth", "weezing"];
    let baseName = pokemonName;
    if (pokemonName.includes("-galarian")) {
      baseName = pokemonName.replace("-galarian", "").trim();
    } else if (pokemonName.includes("-galar")) {
      baseName = pokemonName.replace("-galar", "").trim();
    } else if (pokemonName.includes("galarian ")) {
      baseName = pokemonName.replace("galarian ", "").trim();
    } else if (pokemonName.includes("galarian")) {
      baseName = pokemonName.replace("galarian", "").trim();
    }
    baseName = baseName.replace(/\s*\([^)]*\)\s*/, "").trim();

    if (galarianInSV.includes(baseName)) {
      availableGames = ["Sword", "Shield", "Scarlet", "Violet", "GO"];
    } else {
      availableGames = ["Sword", "Shield", "GO"];
    }
  }
  else if (pokemonName.includes("basculin") && (pokemonName.includes("white-striped") || pokemonName.includes("white stripe"))) {
    availableGames = ["Legends Arceus", "Scarlet", "Violet", "GO"];
  }
  else if (formType === "hisuian" || pokemonName.includes("-hisuian") || pokemonName.includes("hisuian-") || pokemonName.includes("hisuian ") || pokemonName.includes("-hisui") || pokemonName.includes("hisui-")) {
    let baseName = pokemonName;
    if (pokemonName.includes("-hisuian")) {
      baseName = pokemonName.replace("-hisuian", "").trim();
    } else if (pokemonName.includes("-hisui")) {
      baseName = pokemonName.replace("-hisui", "").trim();
    } else if (pokemonName.includes("hisuian ")) {
      baseName = pokemonName.replace("hisuian", "").trim();
    } else if (pokemonName.includes("hisuian")) {
      baseName = pokemonName.replace("hisuian", "").trim();
    }
    baseName = baseName.replace(/\s*\([^)]*\)\s*/, "").trim();

    const hisuianInSV = ["voltorb", "electrode", "qwilfish", "sneasel", "sliggoo", "goodra"];
    if (hisuianInSV.includes(baseName)) {
      availableGames = ["Legends Arceus", "Scarlet", "Violet", "GO"];
    } else {
      availableGames = ["Legends Arceus", "GO"];
    }
  }
  else if (formType === "paldean" || pokemonName.includes("-paldean") || pokemonName.includes("paldean-") || pokemonName.includes("paldean ")) {
    availableGames = ["Scarlet", "Violet", "GO"];
  }
  else {
    // Default behavior - use gamePokemonData
    availableGames = getAvailableGamesForPokemon(pokemon.id, gamePokemonData);
  }

  const isGenderForm =
    formType === "gender" ||
    pokemon.form === "gender" ||
    pokemonName.includes("-gender") ||
    pokemonName.endsWith(" gender") ||
    pokemon.stableId?.includes("-gender-");

  if (isGenderForm) {
    // Gender difference forms cannot be caught in Gen 1 (Red, Green, Blue, Yellow)
    availableGames = availableGames.filter(
      game => !["Red", "Green", "Blue", "Yellow"].includes(game)
    );
  }

  // Filter out exclusives based on versionExclusives.json
  // If a pokemon is in likely exclusive to the counterpart game, remove the current game from availability
  availableGames = availableGames.filter(game => {
    const counterparts = GAME_COUNTERPARTS[game];

    if (counterparts) {
      // Handle both string (single counterpart) and array (multiple counterparts)
      const list = Array.isArray(counterparts) ? counterparts : [counterparts];

      for (const counterpart of list) {
        const exclusives = versionExclusives[counterpart];
        const formattedId = String(pokemon.id).padStart(4, "0");

        // If this pokemon is listed as exclusive to ANY counterpart...
        if (exclusives && (exclusives.includes(pokemon.name) || exclusives.includes(formattedId))) {
          // ...Check if it is ALSO listed in the current game's list (Shared Availability)
          const myExclusives = versionExclusives[game];
          if (myExclusives && (myExclusives.includes(pokemon.name) || myExclusives.includes(formattedId))) {
            // It is explicitly listed in THIS game too, so don't exclude it.
            continue;
          }

          // Otherwise, it's exclusive to the counterpart, so remove it from 'game'
          return false;
        }
      }
    }
    return true;
  });

  // Filter out Legends Arceus for shiny-locked Pokémon when calculating shiny availability
  if (isShiny && isPLAShinyLocked(pokemon)) {
    availableGames = availableGames.filter(g => g !== "Legends Arceus");
  }

  return availableGames.sort((a, b) => GAME_RELEASE_ORDER.indexOf(a) - GAME_RELEASE_ORDER.indexOf(b));
};
