// Game mapping system to handle merged game names
// Maps individual game names to their merged group names in gamePokemon.json

export const GAME_MAPPING = {
  // Gen 1
  "Blue": "Blue Red Green And Yellow",
  "Red": "Blue Red Green And Yellow", 
  "Green": "Blue Red Green And Yellow",
  "Yellow": "Blue Red Green And Yellow",
  
  // Gen 2
  "Gold": "Gold Silver And Crystal",
  "Silver": "Gold Silver And Crystal",
  "Crystal": "Gold Silver And Crystal",
  
  // Gen 3
  "Ruby": "Ruby Sapphire Fire Red Leaf Green And Emerald",
  "Sapphire": "Ruby Sapphire Fire Red Leaf Green And Emerald",
  "Fire Red": "Ruby Sapphire Fire Red Leaf Green And Emerald",
  "Leaf Green": "Ruby Sapphire Fire Red Leaf Green And Emerald",
  "Emerald": "Ruby Sapphire Fire Red Leaf Green And Emerald",
  
  // Gen 4
  "Diamond": "Diamond Pearl And Platinum",
  "Pearl": "Diamond Pearl And Platinum", 
  "Platinum": "Diamond Pearl And Platinum",
  "Heart Gold": "Heart Gold And Soul Silver",
  "Soul Silver": "Heart Gold And Soul Silver",
  
  // Gen 5
  "Black": "Black And White",
  "White": "Black And White",
  "Black 2": "Black 2 And White 2",
  "White 2": "Black 2 And White 2",
  
  // Gen 6
  "X": "X And Y",
  "Y": "X And Y",
  "Omega Ruby": "Omega Ruby And Alpha Sapphire",
  "Alpha Sapphire": "Omega Ruby And Alpha Sapphire",
  
  // Gen 7
  "Sun": "Sun And Moon",
  "Moon": "Sun And Moon",
  "Ultra Sun": "Ultra Sun And Ultra Moon",
  "Ultra Moon": "Ultra Sun And Ultra Moon",
  
  // Gen 8
  "Lets GO Pikachu": "Lets GO Eevee And Pikachu",
  "Lets GO Eevee": "Lets GO Eevee And Pikachu",
  "Sword": "Sword And Shield",
  "Shield": "Sword And Shield",
  "Brilliant Diamond": "Brilliant Diamond And Shining Pearl",
  "Shining Pearl": "Brilliant Diamond And Shining Pearl",
  
  // Gen 8.5
  "Legends Arceus": "Legends Arceus",
  
  // Gen 9
  "Scarlet": "Scarlet And Violet",
  "Violet": "Scarlet And Violet",
  
  // Mobile/Spin-off
  "GO": "GO"
};

// Reverse mapping: from merged names to individual games
export const REVERSE_GAME_MAPPING = {
  "Blue Red Green And Yellow": ["Blue", "Red", "Green", "Yellow"],
  "Gold Silver And Crystal": ["Gold", "Silver", "Crystal"],
  "Ruby Sapphire Fire Red Leaf Green And Emerald": ["Ruby", "Sapphire", "Fire Red", "Leaf Green", "Emerald"],
  "Diamond Pearl And Platinum": ["Diamond", "Pearl", "Platinum"],
  "Heart Gold And Soul Silver": ["Heart Gold", "Soul Silver"],
  "Black And White": ["Black", "White"],
  "Black 2 And White 2": ["Black 2", "White 2"],
  "X And Y": ["X", "Y"],
  "Omega Ruby And Alpha Sapphire": ["Omega Ruby", "Alpha Sapphire"],
  "Sun And Moon": ["Sun", "Moon"],
  "Ultra Sun And Ultra Moon": ["Ultra Sun", "Ultra Moon"],
  "Lets GO Eevee And Pikachu": ["Lets GO Pikachu", "Lets GO Eevee"],
  "Sword And Shield": ["Sword", "Shield"],
  "Brilliant Diamond And Shining Pearl": ["Brilliant Diamond", "Shining Pearl"],
  "Legends Arceus": ["Legends Arceus"],
  "Scarlet And Violet": ["Scarlet", "Violet"],
  "GO": ["GO"]
};

// Function to get the merged game name for a given individual game
export function getMergedGameName(individualGameName) {
  return GAME_MAPPING[individualGameName] || individualGameName;
}

// Function to get individual game names from a merged game name
export function getIndividualGameNames(mergedGameName) {
  return REVERSE_GAME_MAPPING[mergedGameName] || [mergedGameName];
}

// Function to check if a Pokemon is available in a specific game
export function isPokemonAvailableInGame(pokemonId, gameName, gamePokemonData) {
  const mergedGameName = getMergedGameName(gameName);
  const pokemonIds = gamePokemonData[mergedGameName];
  // Convert pokemonId to string with leading zeros (4 digits)
  const formattedId = String(pokemonId).padStart(4, '0');
  return pokemonIds ? pokemonIds.includes(formattedId) : false;
}

// Function to get all games where a Pokemon is available
export function getAvailableGamesForPokemon(pokemonId, gamePokemonData) {
  const availableGames = [];
  
  // Convert pokemonId to string with leading zeros (4 digits)
  const formattedId = String(pokemonId).padStart(4, '0');
  
  Object.entries(gamePokemonData).forEach(([mergedGameName, pokemonIds]) => {
    if (pokemonIds.includes(formattedId)) {
      // Add individual game names instead of merged names
      const individualGames = getIndividualGameNames(mergedGameName);
      availableGames.push(...individualGames);
    }
  });
  
  return availableGames;
}