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

// Get games where a Pokemon can be caught, ordered by release date.
// This mirrors the sidebar "Obtainable In" logic for 1:1 matching.
export const getAvailableGamesForPokemonSidebar = (pokemon) => {
  if (!pokemon || !pokemon.id) return [];

  const pokemonName = pokemon.name?.toLowerCase() || "";
  const formType = pokemon.formType?.toLowerCase() || "";
  let availableGames = [];

  // 1. Determine base availability (Hardcoded Forms vs Default)
  if (formType === "alpha" || formType === "alphaother") {
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
  else if (pokemonName.includes("therian") || pokemonName.includes("therian-") || pokemonName.includes("-therian")) {
    availableGames = ["Legends Arceus", "GO"];
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
        availableGames = ["Sun", "Moon", "Ultra Sun", "Ultra Moon", "Lets GO Pikachu", "Lets GO Eevee", "Sword", "Shield", "Legends Arceus", "Scarlet", "Violet", "GO"];
      } else if (alolanInSV_Only.includes(baseName)) {
        availableGames = ["Sun", "Moon", "Ultra Sun", "Ultra Moon", "Lets GO Pikachu", "Lets GO Eevee", "Legends Arceus", "Scarlet", "Violet", "GO"];
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

  return availableGames.sort((a, b) => GAME_RELEASE_ORDER.indexOf(a) - GAME_RELEASE_ORDER.indexOf(b));
};
