/**
 * Game-to-PokéBall Availability Mapping
 * 
 * You can customize the exact Poké Balls obtainable/catchable in each Pokémon game below.
 * When a user assigns a game to an entry, the Poké Ball dropdown will be restricted to only
 * the balls listed for that game in this file.
 * 
 * AVAILABLE BALL NAMES (for easy copy/paste):
 * -------------------------------------------------------------
 * Standard / Apriballs / Modern:
 *   "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball",
 *   "Level Ball", "Lure Ball", "Moon Ball", "Friend Ball", "Love Ball",
 *   "Heavy Ball", "Fast Ball", "Sport Ball", "Premier Ball", "Repeat Ball",
 *   "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
 *   "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball", "Dream Ball",
 *   "Beast Ball", "Strange Ball"
 * 
 * Hisuian Balls (Legends: Arceus):
 *   "Poké Ball (Hisui)", "Great Ball (Hisui)", "Ultra Ball (Hisui)",
 *   "Feather Ball", "Wing Ball", "Jet Ball",
 *   "Heavy Ball (Hisui)", "Leaden Ball", "Gigaton Ball"
 * -------------------------------------------------------------
 */

export const GAME_BALLS = {
  // Gen 1
  "Red": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball"
  ],
  "Blue": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball"
  ],
  "Green": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball"
  ],
  "Yellow": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball"
  ],

  // Gen 2
  "Gold": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball",
    "Fast Ball", "Friend Ball", "Heavy Ball", "Level Ball", "Love Ball", "Lure Ball", "Moon Ball", "Safari Ball"
  ],
  "Silver": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball",
    "Fast Ball", "Friend Ball", "Heavy Ball", "Level Ball", "Love Ball", "Lure Ball", "Moon Ball", "Safari Ball"
  ],
  "Crystal": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball",
    "Fast Ball", "Friend Ball", "Heavy Ball", "Level Ball", "Love Ball", "Lure Ball", "Moon Ball", "Safari Ball"
  ],

  // Gen 3
  "Ruby": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball",
    "Dive Ball", "Luxury Ball", "Nest Ball", "Net Ball", "Premier Ball", "Repeat Ball", "Timer Ball"
  ],
  "Sapphire": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball",
    "Dive Ball", "Luxury Ball", "Nest Ball", "Net Ball", "Premier Ball", "Repeat Ball", "Timer Ball"
  ],
  "Emerald": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball",
    "Dive Ball", "Luxury Ball", "Nest Ball", "Net Ball", "Premier Ball", "Repeat Ball", "Timer Ball"
  ],
  "Fire Red": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball", "Dive Ball", "Luxury Ball", "Nest Ball", "Net Ball", "Premier Ball", "Repeat Ball", "Timer Ball"
  ],
  "Leaf Green": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball", "Dive Ball", "Luxury Ball", "Nest Ball", "Net Ball", "Premier Ball", "Repeat Ball", "Timer Ball"
  ],

  // Gen 4
  "Diamond": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball", "Cherish Ball",
    "Dive Ball", "Dusk Ball", "Heal Ball", "Luxury Ball", "Nest Ball", "Net Ball", "Premier Ball",
    "Quick Ball", "Repeat Ball", "Timer Ball"
  ],
  "Pearl": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball", "Cherish Ball",
    "Dive Ball", "Dusk Ball", "Heal Ball", "Luxury Ball", "Nest Ball", "Net Ball", "Premier Ball",
    "Quick Ball", "Repeat Ball", "Timer Ball"
  ],
  "Platinum": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball", "Cherish Ball",
    "Dive Ball", "Dusk Ball", "Heal Ball", "Luxury Ball", "Nest Ball", "Net Ball", "Premier Ball",
    "Quick Ball", "Repeat Ball", "Timer Ball"
  ],
  "Heart Gold": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball", "Sport Ball",
    "Level Ball", "Lure Ball", "Moon Ball", "Friend Ball", "Love Ball", "Heavy Ball", "Fast Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball"
  ],
  "Soul Silver": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball", "Sport Ball",
    "Level Ball", "Lure Ball", "Moon Ball", "Friend Ball", "Love Ball", "Heavy Ball", "Fast Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball"
  ],

  // Gen 5
  "Black": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball", "Dream Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball"
  ],
  "White": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball", "Dream Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball"
  ],
  "Black 2": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball", "Dream Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball"
  ],
  "White 2": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball", "Dream Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball"
  ],

  // Gen 6
  "X": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball", "Dream Ball", "Safari Ball"
  ],
  "Y": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball", "Dream Ball", "Safari Ball"
  ],
  "Omega Ruby": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball"
  ],
  "Alpha Sapphire": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball"
  ],

  // Gen 7
  "Sun": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Beast Ball",
    "Level Ball", "Lure Ball", "Moon Ball", "Friend Ball", "Love Ball", "Heavy Ball", "Fast Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball"
  ],
  "Moon": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Beast Ball",
    "Level Ball", "Lure Ball", "Moon Ball", "Friend Ball", "Love Ball", "Heavy Ball", "Fast Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball"
  ],
  "Ultra Sun": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Beast Ball",
    "Level Ball", "Lure Ball", "Moon Ball", "Friend Ball", "Love Ball", "Heavy Ball", "Fast Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball"
  ],
  "Ultra Moon": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Beast Ball",
    "Level Ball", "Lure Ball", "Moon Ball", "Friend Ball", "Love Ball", "Heavy Ball", "Fast Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball"
  ],
  "Let's Go Pikachu": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Premier Ball", "Cherish Ball"
  ],
  "Let's Go Eevee": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Premier Ball", "Cherish Ball"
  ],

  // Gen 8
  "Sword": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball", "Sport Ball", "Dream Ball", "Beast Ball",
    "Level Ball", "Lure Ball", "Moon Ball", "Friend Ball", "Love Ball", "Heavy Ball", "Fast Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball"
  ],
  "Shield": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball", "Sport Ball", "Dream Ball", "Beast Ball",
    "Level Ball", "Lure Ball", "Moon Ball", "Friend Ball", "Love Ball", "Heavy Ball", "Fast Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball"
  ],
  "Brilliant Diamond": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball", "Strange Ball"
  ],
  "Shining Pearl": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball", "Strange Ball"
  ],
  "Legends Arceus": [
    "Feather Ball", "Wing Ball", "Jet Ball",
    "Heavy Ball (Hisui)", "Leaden Ball", "Gigaton Ball",
    "Poké Ball (Hisui)", "Great Ball (Hisui)", "Ultra Ball (Hisui)",
    "Strange Ball"
  ],

  // Gen 9
  "Scarlet": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball", "Sport Ball", "Dream Ball", "Beast Ball",
    "Level Ball", "Lure Ball", "Moon Ball", "Friend Ball", "Love Ball", "Heavy Ball", "Fast Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball", "Strange Ball"
  ],
  "Violet": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Safari Ball", "Sport Ball", "Dream Ball", "Beast Ball",
    "Level Ball", "Lure Ball", "Moon Ball", "Friend Ball", "Love Ball", "Heavy Ball", "Fast Ball",
    "Premier Ball", "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Cherish Ball", "Strange Ball"
  ],

  // Gen 9.5
  "Legends Z-A": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Premier Ball",
    "Repeat Ball", "Timer Ball", "Nest Ball", "Net Ball", "Dive Ball", "Luxury Ball",
    "Heal Ball", "Quick Ball", "Dusk Ball", "Beast Ball", "Dream Ball", "Fast Ball", "Friend Ball", "Heavy Ball", "Level Ball", "Love Ball", "Lure Ball", "Moon Ball", "Safari Ball", "Sport Ball", "Cherish Ball", "Strange Ball"
  ],

  // Other
  "GO": [
    "Poké Ball", "Great Ball", "Ultra Ball", "Premier Ball", "Master Ball", "Safari Ball"
  ]
};

/**
 * Returns the list of valid ball names for a given game.
 * If the game is not defined or has an empty array, returns all standard non-Origin balls.
 */
export function getValidBallNamesForGame(gameName) {
  if (!gameName) return [];
  if (Array.isArray(GAME_BALLS[gameName]) && GAME_BALLS[gameName].length > 0) {
    return GAME_BALLS[gameName];
  }
  return null; // indicates no restrictions specified
}

/**
 * Checks whether a given ball is valid in a specified game.
 */
export function isBallValidForGame(ballName, gameName) {
  if (!ballName) return true; // "None" / empty ball is always allowed
  if (ballName === "Origin Ball") return false; // Origin ball is special/locked
  if (!gameName) return true;

  const validBalls = getValidBallNamesForGame(gameName);
  if (!validBalls) return true;
  return validBalls.includes(ballName);
}
