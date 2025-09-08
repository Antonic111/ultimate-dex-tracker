import { genderForms, specialCases, specialFormLabels } from "./Constants";
import formsData from './data/forms.json';
import pokemonData from './data/pokemon.json';
import { getFilteredFormsData } from './utils/dexPreferences';


// utils.js or at the top of App.jsx for now:
export function chunkArray(arr, chunkSize) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

export function getCaughtInfo(pokemonId) {
  const info = localStorage.getItem(`caughtInfo_${pokemonId}`);
  return info ? JSON.parse(info) : null;
}
export function setCaughtInfo(pokemonId, info) {
  localStorage.setItem(`caughtInfo_${pokemonId}`, JSON.stringify(info));
}

export function formatFormType(type) {
  if (!type) return "Normal";
  switch (type) {
    case "gmax": return "G-Max";
    case "alolan": return "Alolan";
    case "galarian": return "Galarian";
    case "hisuian": return "Hisuian";
    case "paldean": return "Paldean";
    case "alpha": return "Alpha";
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

const allSources = [pokemonData, getFilteredFormsData(formsData)]; // Add more arrays here if you have them separately

export function findPokemon(id, name = null) {
  // First try exact id + name in all sources
  for (const arr of allSources) {
    const found = arr.find(p => p.id === id && (!name || p.name === name));
    if (found) return found;
  }
  // Fallback: try just id in all sources
  for (const arr of allSources) {
    const found = arr.find(p => p.id === id);
    if (found) return found;
  }
  return null;
}

export function renderTypeBadge(type) {
  const typeColors = {
    normal: "#9fa19f",
    fire: "#e62829",
    water: "#2980ef",
    grass: "#3fa129",
    electric: "#fac000",
    ice: "#3fd8ff",
    fighting: "#ff8000",
    poison: "#9141cb",
    ground: "#915121",
    flying: "#81b9ef",
    psychic: "#ef4179",
    bug: "#91a119",
    rock: "#afa981",
    ghost: "#704170",
    dragon: "#5060e1",
    dark: "#50413f",
    steel: "#60a1b8",
    fairy: "#ef70ef"
  };

  const typeBorders = {
    normal: "#545554",
    fire: "#861212",
    water: "#104073",
    grass: "#265817",
    electric: "#b39400",
    ice: "#156077",
    fighting: "#a14500",
    poison: "#431061",
    ground: "#513011",
    flying: "#335985",
    psychic: "#7d1f3f",
    bug: "#495710",
    rock: "#63603f",
    ghost: "#2f1933",
    dragon: "#2c3073",
    dark: "#201313",
    steel: "#285466",
    fairy: "#b030b0"
  };

  const bgColor = typeColors[type.toLowerCase()] || "#9fa19f";
  const borderColor = typeBorders[type.toLowerCase()] || "#545554";

  return (
         <span 
       key={type}
       className="inline-flex items-center justify-center gap-1 px-3 py-0.5 rounded-full text-white font-semibold text-sm border-4 w-28"
       style={{ backgroundColor: bgColor, borderColor: borderColor, borderStyle: 'solid' }}
     >
      <img
        src={`/type-icons/${type.toLowerCase()}.png`}
        alt={type}
        className="w-5 h-5"
        draggable={false}
      />
      <span className="text-base">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
    </span>
  );
}

export function getLevenshteinDistance(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i])
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitute
          matrix[i][j - 1] + 1,     // insert
          matrix[i - 1][j] + 1      // delete
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

export function formatPokemonName(name) {

  if (specialCases[name]) return specialCases[name];

  if (name?.startsWith("alcremie")) return "Alcremie";

  if (!name) return "";

  // Remove common regional form keywords from fallback names
  name = name
    .replace(/-alola(n)?/i, "")
    .replace(/-galar(i(a)n)?/i, "")
    .replace(/-gmax/i, "")
    .replace(/-hisui(a)?/i, "")
    .replace(/-paldea(n)?/i, "")
    .replace(/-alphaother/i, "")  // Remove alphaother first (before alpha)
    .replace(/-alpha/i, "");

  // If the name is empty after removing suffixes, return empty string
  if (!name.trim()) return "";

  // Split by remaining hyphens and format each part
  const parts = name.split("-").filter(part => part.trim() !== "");
  
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatTrainerName(filename) {
  const name = filename.replace(".png", "");
  let parts = name.split("-");

  // Remove trailing 'gen1' to 'gen9' if present
  const last = parts[parts.length - 1].toLowerCase();
  if (/^gen[1-9]$/.test(last)) {
    parts.pop(); // Remove the 'genX' part
  }

  // Handle gender suffix
  let suffix = "";
  const newLast = parts[parts.length - 1];
  if (newLast === "f" || newLast === "m") {
    suffix = ` (${newLast.toUpperCase()})`;
    parts.pop();
  }

  const label = parts
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return label + suffix;
}


export function getFormDisplayName(pokemon) {
  const name = pokemon?.name;

  // ✅ Alcremie: Gigantamax or Cream/Sweet
  if (name?.startsWith("alcremie")) {
    if (name === "alcremie-gmax") {
      return "Gigantamax";
    }

    const parts = name.split("alcremie-")[1]?.split("-") || [];
    const flavor = parts[0] || "";
    const sweet = parts[2] || "";
    const flavorLabel = flavor.charAt(0).toUpperCase() + flavor.slice(1);
    const sweetLabel = sweet.charAt(0).toUpperCase() + sweet.slice(1);
    return `${flavorLabel} / ${sweetLabel}`;
  }


  // ✅ Unown form display
  if (pokemon.formType === "unown" || name === "unown") {
    let suffix = "";
    if (name.startsWith("unown-")) {
      suffix = name.split("unown-")[1];
    } else if (name === "unown") {
      const letterIndex = (pokemon.id || 201) - 201;
      suffix = String.fromCharCode(65 + letterIndex); // A-Z
    }

    // Check if this is an alpha variant
    if (name.endsWith("-alpha")) {
      const letter = suffix.replace("-alpha", "");
      if (letter === "!") return "Alpha Form (!)";
      if (letter === "?") return "Alpha Form (?)";
      if (/^[a-z]$/i.test(letter)) return `Alpha Form (${letter.toUpperCase()})`;
      return "Alpha Form";
    }

    if (suffix === "!") return "Unown Form (!)";
    if (suffix === "?") return "Unown Form (?)";
    if (/^[a-z]$/i.test(suffix)) return `Unown Form (${suffix.toUpperCase()})`;
    return "Unown Form";
  }

  // ✅ Gender forms
  if (pokemon.formType === "gender") {
    // Check if this is an alpha gender variant
    if (name.endsWith("-alpha")) {
      return "Alpha Female";
    }
    return "Female";
  }

  // ✅ Paldean Tauros
  if (name === "tauros-paldea-aqua-breed") return "Paldean Aqua Form";
  if (name === "tauros-paldea-blaze-breed") return "Paldean Blaze Form";

  // ✅ Special cases like Lycanroc, Tatsugiri, etc.
  if (specialFormLabels[name]) return specialFormLabels[name];

  // ✅ Male form if baseSpecies is a gendered form
  if (!pokemon.formType && genderForms.includes(name)) {
    return "Male";
  }

  // ✅ Alpha variants for other forms (not Unown)
  if (name.endsWith("-alpha") && pokemon.formType === "other") {
    // Remove the -alpha suffix and format the base name
    const baseName = name.replace("-alpha", "");
    const formattedName = formatPokemonName(baseName);
    return `Alpha ${formattedName}`;
  }

  const formLabels = {
    alolan: "Alolan Form",
    galarian: "Galarian Form",
    gmax: "Gigantamax",
    hisuian: "Hisuian Form",
    paldean: "Paldean Form",
    other: "Alt Form",
    alcremie: "Alcremie Variant",
    alpha: "Alpha Pokémon",
    alphaother: "Alpha Female"
  };

  return formLabels[pokemon.formType] || "";
}
