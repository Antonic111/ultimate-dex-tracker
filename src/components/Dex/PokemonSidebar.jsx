import { useEffect, useState, useContext, useCallback } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Plus, Trash2, ChevronLeft, ChevronRight, Calendar, ChevronUp, ChevronDown, X, RotateCcw } from "lucide-react";
import { BALL_OPTIONS, GAME_OPTIONS, MARK_OPTIONS, METHOD_OPTIONS } from "../../Constants";
import EvolutionChain from "../Dex/EvolutionChain";
import { formatPokemonName, getFormDisplayName, renderTypeBadge } from "../../utils";

import { SearchbarIconDropdown } from "../Shared/SearchBar";
import ContentFilterInput from "../Shared/ContentFilterInput";
import { useMessage } from "../Shared/MessageContext";
import { validateContent } from "../../../shared/contentFilter";
import gamePokemonData from "../../data/gamePokemon.json";
import { getAvailableGamesForPokemon, getMergedGameName } from "../../utils/gameMapping";
import { getMethodsForGame, getCurrentHuntOdds, getModifiersForGame } from "../../utils/huntSystem";
import { profileAPI } from "../../utils/api";
import { UserContext } from "../Shared/UserContext";
// import "../../css/EvolutionChain.css"; // Moved to backup folder
import "../../css/Sidebar.css";


export default function PokemonSidebar({ open = false, readOnly = false, pokemon, onClose, caughtInfo, updateCaughtInfo, showShiny, viewingUsername = null, onPokemonSelect = null, externalLinkPreference = 'serebii' }) {
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(0);
  const [localEntries, setLocalEntries] = useState([]);
  const { showMessage } = useMessage();
  const { username } = useContext(UserContext);
  const [shinyCharmGames, setShinyCharmGames] = useState([]);

  // Format time in full format (e.g., "1 Hour 5 Minutes 15 Seconds")
  const formatTimeFull = (milliseconds) => {
    if (!milliseconds || milliseconds === 0) return "";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const parts = [];
    if (hours > 0) {
      parts.push(`${hours} Hour${hours !== 1 ? 's' : ''}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} Minute${minutes !== 1 ? 's' : ''}`);
    }
    if (seconds > 0 || parts.length === 0) {
      parts.push(`${seconds} Second${seconds !== 1 ? 's' : ''}`);
    }
    
    return parts.join(' ');
  };

  // Modal states
  const [resetModal, setResetModal] = useState({ show: false, pokemonName: '' });
  const [deleteEntryModal, setDeleteEntryModal] = useState({ show: false, entryIndex: null, entryNumber: null });
  const [resetModalClosing, setResetModalClosing] = useState(false);
  const [deleteEntryModalClosing, setDeleteEntryModalClosing] = useState(false);

  // Always use .value, never the full object, in editData
  const defaultEditData = {
    date: "",
    ball: "",
    mark: "",
    method: "",
    game: "",
    checks: "",
    time: "",
    notes: "",
    entryId: "",
    modifiers: {
      shinyCharm: false,
      shinyParents: false,
      lureActive: false,
      researchLv10: false,
      perfectResearch: false,
      sparklingLv1: false,
      sparklingLv2: false,
      sparklingLv3: false,
      eventBoosted: false,
      communityDay: false,
      raidDay: false,
      researchDay: false,
      galarBirds: false,
      hatchDay: false
    }
  };






  const [editData, setEditData] = useState(defaultEditData);
  
  // Get available methods based on selected game
  const availableMethods = getMethodsForGame(editData.game);
  
  // Get available modifiers for the selected game
  const gameModifiers = editData.game ? getModifiersForGame(editData.game) : {};
  
  // Check if marks are available for the selected game
  const marksAvailable = ["Scarlet", "Violet", "Sword", "Shield"].includes(editData.game);

  // Load user's shiny charm games
  const loadShinyCharmGames = useCallback(async () => {
    if (!username || readOnly) return;
    
    try {
      const profile = await profileAPI.getProfile();
      setShinyCharmGames(profile.shinyCharmGames || []);
    } catch (error) {
      console.error('Failed to load shiny charm games:', error);
    }
  }, [username, readOnly]);

  useEffect(() => {
    loadShinyCharmGames();
    
    // Listen for updates from ShinyCharmModal
    const handleShinyCharmUpdate = (event) => {
      if (readOnly) return;
      if (event.detail?.shinyCharmGames) {
        setShinyCharmGames(event.detail.shinyCharmGames);
      } else {
        // Reload from server if detail not provided
        loadShinyCharmGames();
      }
    };
    
    window.addEventListener('shinyCharmGamesUpdated', handleShinyCharmUpdate);
    return () => {
      window.removeEventListener('shinyCharmGamesUpdated', handleShinyCharmUpdate);
    };
  }, [username, readOnly, loadShinyCharmGames]);

  // Auto-check shiny charm modifier when game is selected
  useEffect(() => {
    if (!readOnly && editData.game && shinyCharmGames.includes(editData.game)) {
      setEditData(prev => ({
        ...prev,
        modifiers: { ...prev.modifiers, shinyCharm: true }
      }));
    }
  }, [editData.game, shinyCharmGames, readOnly]);

  // Function to identify Hisuian balls
  const isHisuianBall = (ballValue) => {
    const hisuianBalls = [
      "Feather Ball", "Wing Ball", "Jet Ball", "Heavy Ball (Hisui)", 
      "Leaden Ball", "Gigaton Ball", "Poké Ball (Hisui)", 
      "Great Ball (Hisui)", "Ultra Ball (Hisui)", "Origin Ball", "Strange Ball"
    ];
    return hisuianBalls.includes(ballValue);
  };

  // Filter ball options based on selected game
  const getFilteredBallOptions = () => {
    if (editData.game === "Legends Arceus") {
      // Show only Hisuian balls for Legends Arceus
      return BALL_OPTIONS.filter(ball => 
        ball.value === "" || isHisuianBall(ball.value)
      );
    }
    return BALL_OPTIONS;
  };

  // Game tag mapping with colors and abbreviations
  const getGameTagInfo = (gameName) => {
    const gameMap = {
      "Red": { abbr: "R", colors: ["#ed2927", "#ed2927"] },
      "Blue": { abbr: "B", colors: ["#027faf", "#027faf"] },
      "Green": { abbr: "G", colors: ["#2ecc71", "#2ecc71"] },
      "Yellow": { abbr: "Y", colors: ["#f9cf25", "#f9cf25"] },
      "Gold": { abbr: "G", colors: ["#f39c12", "#f39c12"] },
      "Silver": { abbr: "S", colors: ["#95a5a6", "#95a5a6"] },
      "Crystal": { abbr: "C", colors: ["#8b8bc1", "#8b8bc1"] },
      "Ruby": { abbr: "R", colors: ["#ed2927", "#ed2927"] },
      "Sapphire": { abbr: "S", colors: ["#027faf", "#027faf"] },
      "Emerald": { abbr: "E", colors: ["#2d993c", "#2d993c"] },
      "Fire Red": { abbr: "FR", colors: ["#e74c3c", "#e74c3c"] },
      "Leaf Green": { abbr: "LG", colors: ["#27ae60", "#27ae60"] },
      "Diamond": { abbr: "D", colors: ["#74b9ff", "#74b9ff"] },
      "Pearl": { abbr: "P", colors: ["#fd79a8", "#fd79a8"] },
      "Platinum": { abbr: "P", colors: ["#f9e79f", "#f9e79f"] },
      "Heart Gold": { abbr: "HG", colors: ["#f39c12", "#f39c12"] },
      "Soul Silver": { abbr: "SS", colors: ["#95a5a6", "#95a5a6"] },
      "Black": { abbr: "B", colors: ["#2c3e50", "#ecf0f1"] },
      "White": { abbr: "W", colors: ["#ecf0f1", "#2c3e50"] },
      "Black 2": { abbr: "B2", colors: ["#2c3e50", "#2c3e50"] },
      "White 2": { abbr: "W2", colors: ["#ffffff", "#ffffff"] },
      "X": { abbr: "X", colors: ["#065ba0", "#065ba0"] },
      "Y": { abbr: "Y", colors: ["#d02942", "#d02942"] },
      "Omega Ruby": { abbr: "OR", colors: ["#e04429", "#e04429"] },
      "Alpha Sapphire": { abbr: "AS", colors: ["#079fd4", "#079fd4"] },
      "Sun": { abbr: "S", colors: ["#f39c12", "#f39c12"] },
      "Moon": { abbr: "M", colors: ["#9b59b6", "#9b59b6"] },
      "Ultra Sun": { abbr: "US", colors: ["#f39c12", "#f39c12"] },
      "Ultra Moon": { abbr: "UM", colors: ["#9b59b6", "#9b59b6"] },
      "Lets GO Pikachu": { abbr: "LGPE", colors: ["#f2cb40", "#f2cb40"] },
      "Lets GO Eevee": { abbr: "LGPE", colors: ["#d69c58", "#d69c58"] },
      "Sword": { abbr: "Sw", colors: ["#3498db", "#3498db"] },
      "Shield": { abbr: "Sh", colors: ["#e74c3c", "#e74c3c"] },
      "Brilliant Diamond": { abbr: "BD", colors: ["#74b9ff", "#74b9ff"] },
      "Shining Pearl": { abbr: "SP", colors: ["#fd79a8", "#fd79a8"] },
      "Legends Arceus": { abbr: "LA", colors: ["#6bbd8d", "#6bbd8d"] },
      "Scarlet": { abbr: "Sc", colors: ["#e74c3c", "#e74c3c"] },
      "Violet": { abbr: "V", colors: ["#9b59b6", "#9b59b6"] },
      "Legends Z-A": { abbr: "ZA", colors: ["#fac3c8", "#fac3c8"] },
      "GO": { abbr: "GO", colors: ["#4285f4", "#4285f4"] }
    };
    // Try exact match first, then case-insensitive match
    const exactMatch = gameMap[gameName];
    if (exactMatch) return exactMatch;
    
    // Try case-insensitive match
    const caseInsensitiveMatch = Object.keys(gameMap).find(key => 
      key.toLowerCase() === gameName.toLowerCase()
    );
    if (caseInsensitiveMatch) return gameMap[caseInsensitiveMatch];
    
    // Fallback to first 3 characters
    return { abbr: gameName.substring(0, 3), colors: ["#95a5a6", "#95a5a6"] };
  };

  // Get games where a Pokemon can be caught, ordered by release date
  const getAvailableGames = (pokemon) => {
    if (!pokemon || !pokemon.id) return [];
    
    // Game release order (chronological) - matches exact display order
    const gameReleaseOrder = [
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
    
    // Special cases for regional forms
    const pokemonName = pokemon.name?.toLowerCase() || '';
    const formType = pokemon.formType?.toLowerCase() || '';
    
    // Alpha Pokemon - check if available in Legends Arceus or Legends Z-A
    if (formType === 'alpha' || formType === 'alphaother') {
      const availableGames = [];
      const formattedId = String(pokemon.id).padStart(4, '0');
      
      // Check if available in Legends Arceus
      const legendsArceusIds = gamePokemonData["Legends Arceus"];
      if (legendsArceusIds && legendsArceusIds.includes(formattedId)) {
        availableGames.push("Legends Arceus");
      }
      
      // Check if available in Legends Z-A
      const legendsZAIds = gamePokemonData["Legends Z-A"];
      if (legendsZAIds && legendsZAIds.includes(formattedId)) {
        availableGames.push("Legends Z-A");
      }
      
      // Return the games found, or default to Legends Arceus if neither found (backward compatibility)
      return availableGames.length > 0 ? availableGames : ["Legends Arceus"];
    }
    
    // Therian forms - only available in Legends Arceus and GO
    if (pokemonName.includes('therian') || pokemonName.includes('therian-') || pokemonName.includes('-therian')) {
      return ["Legends Arceus", "GO"];
    }
    
    // Level 100 Magikarps - only available in Platinum, Diamond, Pearl, and Scarlet/Violet
    if (pokemonName.includes('magikarp') && (pokemonName.includes('level-100') || pokemonName.includes('level 100') || pokemonName.includes('lvl-100') || pokemonName.includes('lvl 100'))) {
      return ["Diamond", "Pearl", "Platinum", "Scarlet", "Violet"];
    }
    
    // Partner Cap Pikachu - only available in Ultra Sun and Ultra Moon
    if (pokemonName.includes('partner-cap') || pokemonName.includes('partner cap') || pokemonName.includes('ash-cap') || pokemonName.includes('ash cap')) {
      return ["Ultra Sun", "Ultra Moon"];
    }
    
    // Unown forms - special availability
    if (pokemonName.includes('unown') || pokemonName.toLowerCase().includes('unown')) {
      // Regular Unown forms - available in multiple games
      return ["Gold", "Silver", "Crystal", "Heart Gold", "Soul Silver", "Brilliant Diamond", "Shining Pearl", "Legends Arceus", "GO"];
    }
    
    // GMAX forms - only available in Sword, Shield, and GO
    if (formType === 'gmax' || pokemonName.includes('gmax') || pokemonName.includes('gigantamax')) {
      return ["Sword", "Shield", "GO"];
    }
    
    // Alolan forms - available in Alola games, LGPE, and some in other games
    if (formType === 'alolan' || pokemonName.includes('-alolan') || pokemonName.includes('alolan-') || pokemonName.includes('alolan ')) {
      // Handle different naming patterns: "rattata-alolan", "raichu-alolan", etc.
      let baseName = pokemonName;
      if (pokemonName.includes('-alolan')) {
        baseName = pokemonName.replace('-alolan', '').trim();
      } else if (pokemonName.includes('alolan ')) {
        baseName = pokemonName.replace('alolan ', '').trim();
      } else if (pokemonName.includes('alolan')) {
        baseName = pokemonName.replace('alolan', '').trim();
      }
      // Remove any parentheses content like "(alolan)"
      baseName = baseName.replace(/\s*\([^)]*\)\s*/, '').trim();
      
      
      // Special cases for specific Alolan forms
      if (baseName === 'vulpix' || baseName === 'ninetales') {
        return ["Sun", "Moon", "Ultra Sun", "Ultra Moon", "Lets GO Pikachu", "Lets GO Eevee", "Sword", "Shield", "Legends Arceus", "Scarlet", "Violet", "GO"];
      }
      
      // Alolan forms available in SV and SWSH: Raichu, Sandshrew, Sandslash, Diglett, Dugtrio, Meowth, Persian, Marowak, Exeggutor
      const alolanInSV_SWSH = ['raichu', 'sandshrew', 'sandslash', 'diglett', 'dugtrio', 'meowth', 'persian', 'marowak', 'exeggutor'];
      
      // Alolan forms available in SV but NOT in SWSH: Geodude, Graveler, Golem, Grimer, Muk
      const alolanInSV_Only = ['geodude', 'graveler', 'golem', 'grimer', 'muk'];
      
      if (alolanInSV_SWSH.includes(baseName)) {
        return ["Sun", "Moon", "Ultra Sun", "Ultra Moon", "Lets GO Pikachu", "Lets GO Eevee", "Sword", "Shield", "Legends Arceus", "Scarlet", "Violet", "GO"];
      } else if (alolanInSV_Only.includes(baseName)) {
        return ["Sun", "Moon", "Ultra Sun", "Ultra Moon", "Lets GO Pikachu", "Lets GO Eevee", "Legends Arceus", "Scarlet", "Violet", "GO"];
      } else {
        // Alolan forms NOT in SV/SWSH: Rattata, Raticate, etc.
        return ["Sun", "Moon", "Ultra Sun", "Ultra Moon", "Lets GO Pikachu", "Lets GO Eevee", "GO"];
      }
    }
    
    // Galarian forms - available in Galar games and some in SV
    if (formType === 'galarian' || pokemonName.includes('-galarian') || pokemonName.includes('galarian-') || pokemonName.includes('galarian ') || pokemonName.includes('-galar') || pokemonName.includes('galar-')) {
      // Galarian forms available in SV: Slowpoke, Slowbro, Slowking, Meowth, Weezing
      const galarianInSV = ['slowpoke', 'slowbro', 'slowking', 'meowth', 'weezing'];
      
      // Check if this specific Galarian form is available in SV
      let baseName = pokemonName;
      if (pokemonName.includes('-galarian')) {
        baseName = pokemonName.replace('-galarian', '').trim();
      } else if (pokemonName.includes('-galar')) {
        baseName = pokemonName.replace('-galar', '').trim();
      } else if (pokemonName.includes('galarian ')) {
        baseName = pokemonName.replace('galarian ', '').trim();
      } else if (pokemonName.includes('galarian')) {
        baseName = pokemonName.replace('galarian', '').trim();
      }
      // Remove any parentheses content like "(galarian)"
      baseName = baseName.replace(/\s*\([^)]*\)\s*/, '').trim();
      
      
      if (galarianInSV.includes(baseName)) {
        return ["Sword", "Shield", "Scarlet", "Violet", "GO"];
      } else {
        // Galarian forms NOT in SV: Zigzagoon, Linoone, etc.
        return ["Sword", "Shield", "GO"];
      }
    }
    
    // Hisuian forms - mostly only available in Legends: Arceus, but some exceptions
    if (formType === 'hisuian' || pokemonName.includes('-hisuian') || pokemonName.includes('hisuian-') || pokemonName.includes('hisuian ') || pokemonName.includes('-hisui') || pokemonName.includes('hisui-')) {
      // Handle different naming patterns: "voltorb-hisuian", "electrode-hisuian", etc.
      let baseName = pokemonName;
      if (pokemonName.includes('-hisuian')) {
        baseName = pokemonName.replace('-hisuian', '').trim();
      } else if (pokemonName.includes('-hisui')) {
        baseName = pokemonName.replace('-hisui', '').trim();
      } else if (pokemonName.includes('hisuian ')) {
        baseName = pokemonName.replace('hisuian ', '').trim();
      } else if (pokemonName.includes('hisuian')) {
        baseName = pokemonName.replace('hisuian', '').trim();
      }
      // Remove any parentheses content like "(hisuian)"
      baseName = baseName.replace(/\s*\([^)]*\)\s*/, '').trim();
      
      // Hisuian forms available in SV: Voltorb, Electrode, Qwilfish, Sneasel, Sliggoo, Goodra
      const hisuianInSV = ['voltorb', 'electrode', 'qwilfish', 'sneasel', 'sliggoo', 'goodra'];
      
      
      if (hisuianInSV.includes(baseName)) {
        return ["Legends Arceus", "Scarlet", "Violet", "GO"];
      } else {
        // Other Hisuian forms - only available in Legends: Arceus and GO
        return ["Legends Arceus", "GO"];
      }
    }
    
    // Paldean forms - only available in Paldea games and GO
    if (formType === 'paldean' || pokemonName.includes('-paldean') || pokemonName.includes('paldean-') || pokemonName.includes('paldean ')) {
      return ["Scarlet", "Violet", "GO"];
    }
    
    // Default behavior for regular forms - use gamePokemonData as the source of truth
    const availableGames = getAvailableGamesForPokemon(pokemon.id, gamePokemonData);
    
    // Sort by release order instead of alphabetically
    return availableGames.sort((a, b) => {
      const indexA = gameReleaseOrder.indexOf(a);
      const indexB = gameReleaseOrder.indexOf(b);
      return indexA - indexB;
    });
  };

  // Group games into pairs for combined display, maintaining chronological order
  const getGroupedGames = (games) => {
    const gameGroups = [];
    const processedGames = new Set();
    
    // Define game pairs with correct abbreviations in chronological order
    const gamePairs = [
      { games: ["Red", "Green", "Blue", "Yellow"], abbr: "RGBY" },
      { games: ["Gold", "Silver"], abbr: "GS" },
      { games: ["Ruby", "Sapphire"], abbr: "RS" },
      { games: ["Fire Red", "Leaf Green"], abbr: "FRLG" },
      { games: ["Diamond", "Pearl"], abbr: "DP" },
      { games: ["Heart Gold", "Soul Silver"], abbr: "HGSS" },
      { games: ["Black", "White"], abbr: "BW" },
      { games: ["Black 2", "White 2"], abbr: "B2W2" },
      { games: ["X", "Y"], abbr: "XY" },
      { games: ["Omega Ruby", "Alpha Sapphire"], abbr: "ORAS" },
      { games: ["Sun", "Moon"], abbr: "SM" },
      { games: ["Ultra Sun", "Ultra Moon"], abbr: "USUM" },
      { games: ["Lets GO Pikachu", "Lets GO Eevee"], abbr: "LGPE" },
      { games: ["Sword", "Shield"], abbr: "SWSH" },
      { games: ["Brilliant Diamond", "Shining Pearl"], abbr: "BDSP" },
      { games: ["Scarlet", "Violet"], abbr: "SV" }
    ];
    
    // Define individual games with their proper abbreviations
    const individualGames = {
      "Blue": "B",
      "Yellow": "Y", 
      "Crystal": "C",
      "Emerald": "E",
      "Platinum": "P",
      "Legends Arceus": "LA",
      "Legends Z-A": "ZA",
      "GO": "GO"
    };
    
    // Process games in chronological order to maintain correct display order
    const gameReleaseOrder = [
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
    
    // Process games in chronological order
    gameReleaseOrder.forEach(game => {
      if (!games.includes(game) || processedGames.has(game)) return;
      
      // Check if this game is part of a pair
      const pair = gamePairs.find(p => p.games.includes(game));
      
      if (pair) {
        // Check if all games in the pair are available
        const allGamesAvailable = pair.games.every(g => games.includes(g));
        
        if (allGamesAvailable) {
          // All games in the pair are available, create pair
          if (pair.games.length === 2) {
            // Regular pair (2 games)
        const tagInfo1 = getGameTagInfo(pair.games[0]);
        const tagInfo2 = getGameTagInfo(pair.games[1]);
        gameGroups.push({
          type: "pair",
          games: pair.games,
          displayName: pair.abbr,
          colors: [tagInfo1.colors[0], tagInfo2.colors[0]]
        });
          } else if (pair.games.length === 4) {
            // RGBY case (4 games) - use a gradient with all 4 colors
            const tagInfo1 = getGameTagInfo(pair.games[0]);
            const tagInfo2 = getGameTagInfo(pair.games[1]);
            const tagInfo3 = getGameTagInfo(pair.games[2]);
            const tagInfo4 = getGameTagInfo(pair.games[3]);
            gameGroups.push({
              type: "quad",
              games: pair.games,
              displayName: pair.abbr,
              colors: [tagInfo1.colors[0], tagInfo2.colors[0], tagInfo3.colors[0], tagInfo4.colors[0]]
            });
          }
          // Mark all games in the pair as processed
          pair.games.forEach(g => processedGames.add(g));
      } else {
        // Individual game
        const tagInfo = getGameTagInfo(game);
          const displayName = individualGames[game] || tagInfo.abbr;
        gameGroups.push({
          type: "single",
          games: [game],
            displayName: displayName,
            colors: tagInfo.colors
          });
          processedGames.add(game);
        }
      } else {
        // Individual game
        const tagInfo = getGameTagInfo(game);
        const displayName = individualGames[game] || tagInfo.abbr;
        gameGroups.push({
          type: "single",
          games: [game],
          displayName: displayName,
          colors: tagInfo.colors
        });
        processedGames.add(game);
      }
    });
    
    return gameGroups;
  };

  // Initialize state when component first mounts or when caughtInfo changes
  useEffect(() => {
    if (caughtInfo?.entries && caughtInfo.entries.length > 0) {
      setLocalEntries(caughtInfo.entries);
      // Only reset to first entry if we don't have a valid selectedEntryIndex
      if (selectedEntryIndex >= caughtInfo.entries.length) {
        setSelectedEntryIndex(0);
        const firstEntry = caughtInfo.entries[0];
        setEditData({
          date: firstEntry.date || "",
          ball: firstEntry.ball || BALL_OPTIONS[0].value,
          mark: firstEntry.mark || MARK_OPTIONS[0].value,
          method: firstEntry.method || METHOD_OPTIONS[0],
          game: firstEntry.game || GAME_OPTIONS[0].value,
          checks: firstEntry.checks || "",
          time: firstEntry.time || "",
          notes: firstEntry.notes || "",
          entryId: firstEntry.entryId || Math.random().toString(36).substr(2, 9),
          modifiers: firstEntry.modifiers || defaultEditData.modifiers
        });
      } else {
        // Keep current selection but update editData to show current entry
        const currentEntry = caughtInfo.entries[selectedEntryIndex];
        setEditData({
          date: currentEntry.date || "",
          ball: currentEntry.ball || BALL_OPTIONS[0].value,
          mark: currentEntry.mark || MARK_OPTIONS[0].value,
          method: currentEntry.method || METHOD_OPTIONS[0],
          game: currentEntry.game || GAME_OPTIONS[0].value,
          checks: currentEntry.checks || "",
          time: currentEntry.time || "",
          notes: currentEntry.notes || "",
          entryId: currentEntry.entryId || Math.random().toString(36).substr(2, 9),
          modifiers: currentEntry.modifiers || defaultEditData.modifiers
        });
      }
    } else {
      setLocalEntries([]);
      setEditData(defaultEditData);
      setSelectedEntryIndex(0);
    }
    setEditing(false);
  }, [caughtInfo, pokemon]);



  // Mobile scroll handling removed - was causing page jumps
  // The sidebar now works naturally with page scrolling

  // Lightweight mobile scroll prevention - only when sidebar is fully open
  useEffect(() => {
    if (window.innerWidth <= 768) {
      if (open && !closing) {
        // Only prevent scrolling when sidebar is fully open (not during animations)
        document.body.classList.add('sidebar-open');
      } else {
        // Allow scrolling during closing animation and when closed
        document.body.classList.remove('sidebar-open');
      }
    }
  }, [open, closing]);

  // Cleanup effect to ensure CSS class is removed on unmount
  useEffect(() => {
    return () => {
      // Clean up if component unmounts while sidebar is open
      if (window.innerWidth <= 768) {
        document.body.classList.remove('sidebar-open');
      }
    };
  }, []);

  // Prevent scrolling when reset modal is open
  useEffect(() => {
    const preventScroll = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    if (resetModal.show) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    }
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [resetModal.show]);

  // Function to format date from YYYY-MM-DD to MMM DD YYYY format
  function formatDate(dateString) {
    if (!dateString) return "";
    
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = months[parseInt(parts[1]) - 1] || parts[1];
      const day = parts[2];
      return `${month} ${day} ${year}`;
    }
    
    return dateString; // Return original if format is unexpected
  }

  // Function to manually update editData when switching entries
  function switchToEntry(index) {
    if (localEntries && localEntries[index]) {
      const selectedEntry = localEntries[index];
      setEditData({
        date: selectedEntry.date || "",
        ball: selectedEntry.ball || BALL_OPTIONS[0].value,
        mark: selectedEntry.mark || MARK_OPTIONS[0].value,
        method: selectedEntry.method || METHOD_OPTIONS[0],
        game: selectedEntry.game || GAME_OPTIONS[0].value,
        checks: selectedEntry.checks || "",
        time: selectedEntry.time || "",
        notes: selectedEntry.notes || "",
        entryId: selectedEntry.entryId || Math.random().toString(36).substr(2, 9),
        modifiers: selectedEntry.modifiers || defaultEditData.modifiers
      });
    }
  }

  function handleSetCaught() {
    const newEntry = {
      date: "",
      ball: BALL_OPTIONS[0].value,
      mark: MARK_OPTIONS[0].value,
      method: METHOD_OPTIONS[0],
      game: GAME_OPTIONS[0].value,
      checks: "",
      time: "",
      notes: "",
      entryId: Math.random().toString(36).substr(2, 9),
      modifiers: { ...defaultEditData.modifiers }
    };
    
    const newInfo = {
      caught: true,
      entries: [newEntry]
    };
    
    // Update local state immediately for instant UI update
    setLocalEntries([newEntry]);
    setEditData(newEntry);
    setSelectedEntryIndex(0);
    
    // Then update the global state
    updateCaughtInfo(pokemon, newInfo, showShiny);
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditData(edit => ({ ...edit, [name]: value }));
  }

  function handleSaveEdit() {
    // Save-time validation for notes
    const validation = validateContent(String(editData.notes || ''), 'notes');
    if (!validation.isValid) {
              showMessage(`${validation.error}`, 'error');
      return;
    }
    
    // Check if we're updating an existing entry or creating a new one
    const currentEntries = [...localEntries]; // Create a copy to avoid mutation
    let updatedEntries;
    let newSelectedIndex = selectedEntryIndex;
    
         // Check if we're updating an existing entry based on selectedEntryIndex
     if (selectedEntryIndex < currentEntries.length) {
       // Update existing entry at the current index
      const cleaned = {
        date: editData.date || "",
        ball: editData.ball || "",
        mark: editData.mark || "",
        game: editData.game || "",
        method: editData.method || "",
        checks:
          editData.checks === null ||
            String(editData.checks).trim() === "" ||
            String(editData.checks).trim() === "0"
            ? ""
            : String(editData.checks).trim(),
        time: editData.time || "",
        notes: editData.notes || "",
        entryId: currentEntries[selectedEntryIndex].entryId, // Keep the existing entryId
        modifiers: editData.modifiers || defaultEditData.modifiers
      };
      
             updatedEntries = currentEntries.map((entry, index) => 
         index === selectedEntryIndex ? cleaned : entry
       );
     } else {
       // Add new entry - select the new entry
      const cleaned = {
        date: editData.date || "",
        ball: editData.ball || "",
        mark: editData.mark || "",
        game: editData.game || "",
        method: editData.method || "",
        checks:
          editData.checks === null ||
            String(editData.checks).trim() === "" ||
            String(editData.checks).trim() === "0"
            ? ""
            : String(editData.checks).trim(),
        time: editData.time || "",
        notes: editData.notes || "",
        entryId: Math.random().toString(36).substr(2, 9), // Generate new entryId for new entries
        modifiers: editData.modifiers || defaultEditData.modifiers
      };
      
             updatedEntries = [...currentEntries, cleaned];
       newSelectedIndex = currentEntries.length; // Select the new entry
     }
 
     const updatedInfo = {
       caught: true,
       entries: updatedEntries
     };

    // Update global state first
    updateCaughtInfo(pokemon, updatedInfo, showShiny);
    
    // Update local state and editData in the correct order
    setLocalEntries(updatedEntries);
    
    // Update editData to show the current entry
    if (selectedEntryIndex < updatedEntries.length) {
      setEditData(updatedEntries[selectedEntryIndex]);
    } else {
      setEditData(updatedEntries[updatedEntries.length - 1]);
    }
    setSelectedEntryIndex(newSelectedIndex);
    
    // Exit edit mode
    setEditing(false);
  }


  function handleCancelEdit() {
    setEditing(false);
    const firstEntry = localEntries[0] || {};
    setEditData({
      date: firstEntry.date || "",
      ball: firstEntry.ball || "",
      mark: firstEntry.mark || "",
      method: firstEntry.method || "",
      game: firstEntry.game || "",
      checks: firstEntry.checks || "",
      time: firstEntry.time || "",
      notes: firstEntry.notes || "",
      entryId: firstEntry.entryId || Math.random().toString(36).substr(2, 9),
      modifiers: firstEntry.modifiers || defaultEditData.modifiers
    });
  }


  async function handleReset() {
    setResetModal({ show: true, pokemonName: formatPokemonName(pokemon?.name) });
  }

  // Handle reset confirmation
  const handleResetConfirm = () => {
    setResetModalClosing(true);
    setTimeout(() => {
      setResetModal({ show: false, pokemonName: '' });
      setResetModalClosing(false);
      
      // Execute the reset
      updateCaughtInfo(pokemon, null, showShiny);
      setLocalEntries([]);
      setEditData(defaultEditData); // all blanks
      setEditing(true);
    }, 300);
  };

  // Handle delete entry confirmation
  const handleDeleteEntryConfirm = () => {
    setDeleteEntryModalClosing(true);
    setTimeout(() => {
      setDeleteEntryModal({ show: false, entryIndex: null, entryNumber: null });
      setDeleteEntryModalClosing(false);
      
      // Execute the delete
      const updatedEntries = localEntries.filter((_, i) => i !== deleteEntryModal.entryIndex);
      if (updatedEntries.length === 0) {
        updateCaughtInfo(pokemon, null, showShiny);
        setLocalEntries([]);
      } else {
        updateCaughtInfo(pokemon, {
          caught: true,
          entries: updatedEntries
        }, showShiny);
        setLocalEntries(updatedEntries);
        
        // Adjust selectedEntryIndex if needed
        if (deleteEntryModal.entryIndex >= updatedEntries.length) {
          setSelectedEntryIndex(updatedEntries.length - 1);
        } else if (deleteEntryModal.entryIndex > 0) {
          setSelectedEntryIndex(deleteEntryModal.entryIndex - 1);
        }
      }
    }, 300);
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 370); // Match the original backup animation duration
  };

  if (!open && !closing) return null;

  // Safety check for pokemon
  if (!pokemon) return null;

  // Look up objects for display by value
  const ballObj = BALL_OPTIONS.find(opt => opt.value === (editData?.ball ?? ""));
  const gameObj = GAME_OPTIONS.find(opt => opt.value === (editData?.game ?? ""));
  const markObj = MARK_OPTIONS.find(opt => opt.value === (editData?.mark ?? ""));

  const pokeImg = showShiny && pokemon?.sprites?.front_shiny
    ? pokemon.sprites.front_shiny
    : pokemon?.sprites?.front_default || "/fallback.png";
  const pokeName = formatPokemonName(pokemon?.name);
  const pokeTypes = pokemon?.types || [];

  // Generate external link URL based on preference
  const getExternalLink = () => {
    if (!pokemon?.name) return '#';
    
    if (externalLinkPreference === 'pokemondb') {
      // Special case for Type: Null - PokemonDB uses "type-null" format
      if (pokemon.name.toLowerCase().includes('type-null') || pokemon.name.toLowerCase().includes('type: null') || pokemon.name.toLowerCase().includes('type null')) {
        return `https://pokemondb.net/pokedex/type-null`;
      }
      
      // Special case for Mr. Mime - PokemonDB uses "mr-mime" format
      if (pokemon.name.toLowerCase().includes('mr-mime') || pokemon.name.toLowerCase().includes('mr. mime') || pokemon.name.toLowerCase().includes('mr mime')) {
        return `https://pokemondb.net/pokedex/mr-mime`;
      }
      
      // Special case for Mime Jr. - PokemonDB uses "mime-jr" format
      if (pokemon.name.toLowerCase().includes('mime-jr') || pokemon.name.toLowerCase().includes('mime jr') || pokemon.name.toLowerCase().includes('mime jr.')) {
        return `https://pokemondb.net/pokedex/mime-jr`;
      }
      
      // Special case for Mr. Rime - PokemonDB uses "mr-rime" format
      if (pokemon.name.toLowerCase().includes('mr-rime') || pokemon.name.toLowerCase().includes('mr. rime') || pokemon.name.toLowerCase().includes('mr rime')) {
        return `https://pokemondb.net/pokedex/mr-rime`;
      }
      
      // Special case for Nidoran♀ - PokemonDB uses "nidoran-f" format
      if (pokemon.name.toLowerCase().includes('nidoran-f') || pokemon.name.toLowerCase().includes('nidoran♀') || pokemon.name.toLowerCase().includes('nidoran female')) {
        return `https://pokemondb.net/pokedex/nidoran-f`;
      }
      
      // Special case for Nidoran♂ - PokemonDB uses "nidoran-m" format
      if (pokemon.name.toLowerCase().includes('nidoran-m') || pokemon.name.toLowerCase().includes('nidoran♂') || pokemon.name.toLowerCase().includes('nidoran male')) {
        return `https://pokemondb.net/pokedex/nidoran-m`;
      }
      
      // Special case for Farfetch'd - PokemonDB uses "farfetchd" format (no apostrophe)
      if (pokemon.name.toLowerCase().includes('farfetch') || pokemon.name.toLowerCase().includes('farfetch\'d') || pokemon.name.toLowerCase().includes('farfetchd')) {
        return `https://pokemondb.net/pokedex/farfetchd`;
      }
      
      // Special case for Sirfetch'd - PokemonDB uses "sirfetchd" format (no apostrophe)
      if (pokemon.name.toLowerCase().includes('sirfetch') || pokemon.name.toLowerCase().includes('sirfetch\'d') || pokemon.name.toLowerCase().includes('sirfetchd')) {
        return `https://pokemondb.net/pokedex/sirfetchd`;
      }
      
      // PokemonDB - use the display name and clean it for URL
      let displayName = formatPokemonName(pokemon.name);
      
      // Special case for Unown forms - always use base "unown"
      if (pokemon.name.toLowerCase().startsWith('unown')) {
        displayName = 'Unown';
      }
      
      // PokemonDB uses lowercase names with hyphens for spaces
      const pokemonName = displayName.toLowerCase().replace(/\s+/g, '-');
      return `https://pokemondb.net/pokedex/${pokemonName}`;
    } else if (externalLinkPreference === 'bulbapedia') {
      // Special case for Type: Null - Bulbapedia uses "Type:_Null" format
      if (pokemon.name.toLowerCase().includes('type-null') || pokemon.name.toLowerCase().includes('type: null') || pokemon.name.toLowerCase().includes('type null')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Type:_Null_(Pokémon)`;
      }
      
      // Special case for Mr. Mime - Bulbapedia uses "Mr._Mime" format
      if (pokemon.name.toLowerCase().includes('mr-mime') || pokemon.name.toLowerCase().includes('mr. mime') || pokemon.name.toLowerCase().includes('mr mime')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Mr._Mime_(Pokémon)`;
      }
      
      // Special case for Mime Jr. - Bulbapedia uses "Mime_Jr." format
      if (pokemon.name.toLowerCase().includes('mime-jr') || pokemon.name.toLowerCase().includes('mime jr') || pokemon.name.toLowerCase().includes('mime jr.')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Mime_Jr._(Pokémon)`;
      }
      
      // Special case for Mr. Rime - Bulbapedia uses "Mr._Rime" format
      if (pokemon.name.toLowerCase().includes('mr-rime') || pokemon.name.toLowerCase().includes('mr. rime') || pokemon.name.toLowerCase().includes('mr rime')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Mr._Rime_(Pokémon)`;
      }
      
      // Special case for Nidoran♀ - Bulbapedia uses URL-encoded gender symbol
      if (pokemon.name.toLowerCase().includes('nidoran-f') || pokemon.name.toLowerCase().includes('nidoran♀') || pokemon.name.toLowerCase().includes('nidoran female')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Nidoran%E2%99%80_(Pokémon)`;
      }
      
      // Special case for Nidoran♂ - Bulbapedia uses URL-encoded gender symbol
      if (pokemon.name.toLowerCase().includes('nidoran-m') || pokemon.name.toLowerCase().includes('nidoran♂') || pokemon.name.toLowerCase().includes('nidoran male')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Nidoran%E2%99%82_(Pokémon)`;
      }
      
      // Special case for Farfetch'd - Bulbapedia uses URL-encoded apostrophe
      if (pokemon.name.toLowerCase().includes('farfetch') || pokemon.name.toLowerCase().includes('farfetch\'d') || pokemon.name.toLowerCase().includes('farfetchd')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Farfetch%27d_(Pokémon)`;
      }
      
      // Special case for Sirfetch'd - Bulbapedia uses URL-encoded apostrophe
      if (pokemon.name.toLowerCase().includes('sirfetch') || pokemon.name.toLowerCase().includes('sirfetch\'d') || pokemon.name.toLowerCase().includes('sirfetchd')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Sirfetch%27d_(Pokémon)`;
      }
      
      // Special case for Ho-Oh - Bulbapedia uses "Ho-Oh" format (with hyphen)
      if (pokemon.name.toLowerCase().includes('ho-oh') || pokemon.name.toLowerCase().includes('hooh') || pokemon.name.toLowerCase().includes('ho oh')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Ho-Oh_(Pokémon)`;
      }
      
      // Special case for Porygon-Z - Bulbapedia uses "Porygon-Z" format (with hyphen)
      if (pokemon.name.toLowerCase() === 'porygon-z' || pokemon.name.toLowerCase().includes('porygon-z') || pokemon.name.toLowerCase().includes('porygonz') || pokemon.name.toLowerCase().includes('porygon z')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Porygon-Z_(Pokémon)`;
      }
      
      // Special case for Jangmo-o - Bulbapedia uses "Jangmo-o" format (with hyphen)
      if (pokemon.name.toLowerCase() === 'jangmo-o' || pokemon.name.toLowerCase().includes('jangmo-o') || pokemon.name.toLowerCase().includes('jangmoo') || pokemon.name.toLowerCase().includes('jangmo o')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Jangmo-o_(Pokémon)`;
      }
      
      // Special case for Hakamo-o - Bulbapedia uses "Hakamo-o" format (with hyphen)
      if (pokemon.name.toLowerCase() === 'hakamo-o' || pokemon.name.toLowerCase().includes('hakamo-o') || pokemon.name.toLowerCase().includes('hakamoo') || pokemon.name.toLowerCase().includes('hakamo o')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Hakamo-o_(Pokémon)`;
      }
      
      // Special case for Kommo-o - Bulbapedia uses "Kommo-o" format (with hyphen)
      if (pokemon.name.toLowerCase() === 'kommo-o' || pokemon.name.toLowerCase().includes('kommo-o') || pokemon.name.toLowerCase().includes('kommoo') || pokemon.name.toLowerCase().includes('kommo o')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Kommo-o_(Pokémon)`;
      }
      
      // Special case for Tapu Koko - Bulbapedia uses "Tapu_Koko" format (with underscore)
      if (pokemon.name.toLowerCase() === 'tapu-koko' || pokemon.name.toLowerCase().includes('tapu koko') || pokemon.name.toLowerCase().includes('tapukoko')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Tapu_Koko_(Pokémon)`;
      }
      
      // Special case for Tapu Lele - Bulbapedia uses "Tapu_Lele" format (with underscore)
      if (pokemon.name.toLowerCase() === 'tapu-lele' || pokemon.name.toLowerCase().includes('tapu lele') || pokemon.name.toLowerCase().includes('tapulele')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Tapu_Lele_(Pokémon)`;
      }
      
      // Special case for Tapu Bulu - Bulbapedia uses "Tapu_Bulu" format (with underscore)
      if (pokemon.name.toLowerCase() === 'tapu-bulu' || pokemon.name.toLowerCase().includes('tapu bulu') || pokemon.name.toLowerCase().includes('tapubulu')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Tapu_Bulu_(Pokémon)`;
      }
      
      // Special case for Tapu Fini - Bulbapedia uses "Tapu_Fini" format (with underscore)
      if (pokemon.name.toLowerCase() === 'tapu-fini' || pokemon.name.toLowerCase().includes('tapu fini') || pokemon.name.toLowerCase().includes('tapufini')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Tapu_Fini_(Pokémon)`;
      }
      
      // Special case for Great Tusk - Bulbapedia uses "Great_Tusk" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase().includes('great tusk') || pokemon.name.toLowerCase().includes('great-tusk') || pokemon.name.toLowerCase().includes('greattusk')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Great_Tusk_(Pokémon)`;
      }
      
      // Special case for Scream Tail - Bulbapedia uses "Scream_Tail" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'scream-tail' || pokemon.name.toLowerCase().includes('scream tail') || pokemon.name.toLowerCase().includes('screamtail')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Scream_Tail_(Pokémon)`;
      }
      
      // Special case for Brute Bonnet - Bulbapedia uses "Brute_Bonnet" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'brute-bonnet' || pokemon.name.toLowerCase().includes('brute bonnet') || pokemon.name.toLowerCase().includes('brutebonnet')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Brute_Bonnet_(Pokémon)`;
      }
      
      // Special case for Flutter Mane - Bulbapedia uses "Flutter_Mane" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'flutter-mane' || pokemon.name.toLowerCase().includes('flutter mane') || pokemon.name.toLowerCase().includes('fluttermane')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Flutter_Mane_(Pokémon)`;
      }
      
      // Special case for Slither Wing - Bulbapedia uses "Slither_Wing" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'slither-wing' || pokemon.name.toLowerCase().includes('slither wing') || pokemon.name.toLowerCase().includes('slitherwing')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Slither_Wing_(Pokémon)`;
      }
      
      // Special case for Sandy Shocks - Bulbapedia uses "Sandy_Shocks" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'sandy-shocks' || pokemon.name.toLowerCase().includes('sandy shocks') || pokemon.name.toLowerCase().includes('sandyshocks')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Sandy_Shocks_(Pokémon)`;
      }
      
      // Special case for Iron Treads - Bulbapedia uses "Iron_Treads" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-treads' || pokemon.name.toLowerCase().includes('iron treads') || pokemon.name.toLowerCase().includes('irontreads')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Treads_(Pokémon)`;
      }
      
      // Special case for Iron Bundle - Bulbapedia uses "Iron_Bundle" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-bundle' || pokemon.name.toLowerCase().includes('iron bundle') || pokemon.name.toLowerCase().includes('ironbundle')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Bundle_(Pokémon)`;
      }
      
      // Special case for Iron Hands - Bulbapedia uses "Iron_Hands" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-hands' || pokemon.name.toLowerCase().includes('iron hands') || pokemon.name.toLowerCase().includes('ironhands')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Hands_(Pokémon)`;
      }
      
      // Special case for Iron Jugulis - Bulbapedia uses "Iron_Jugulis" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-jugulis' || pokemon.name.toLowerCase().includes('iron jugulis') || pokemon.name.toLowerCase().includes('ironjugulis')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Jugulis_(Pokémon)`;
      }
      
      // Special case for Iron Moth - Bulbapedia uses "Iron_Moth" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-moth' || pokemon.name.toLowerCase().includes('iron moth') || pokemon.name.toLowerCase().includes('ironmoth')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Moth_(Pokémon)`;
      }
      
      // Special case for Iron Thorns - Bulbapedia uses "Iron_Thorns" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-thorns' || pokemon.name.toLowerCase().includes('iron thorns') || pokemon.name.toLowerCase().includes('ironthorns')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Thorns_(Pokémon)`;
      }
      
      // Special case for Wo-Chien - Bulbapedia uses "Wo-Chien" format (with hyphen and proper capitalization)
      if (pokemon.name.toLowerCase() === 'wo-chien' || pokemon.name.toLowerCase().includes('wo chien') || pokemon.name.toLowerCase().includes('wochien')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Wo-Chien_(Pokémon)`;
      }
      
      // Special case for Chien-Pao - Bulbapedia uses "Chien-Pao" format (with hyphen and proper capitalization)
      if (pokemon.name.toLowerCase() === 'chien-pao' || pokemon.name.toLowerCase().includes('chien pao') || pokemon.name.toLowerCase().includes('chienpao')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Chien-Pao_(Pokémon)`;
      }
      
      // Special case for Ting-Lu - Bulbapedia uses "Ting-Lu" format (with hyphen and proper capitalization)
      if (pokemon.name.toLowerCase() === 'ting-lu' || pokemon.name.toLowerCase().includes('ting lu') || pokemon.name.toLowerCase().includes('tinglu')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Ting-Lu_(Pokémon)`;
      }
      
      // Special case for Chi-Yu - Bulbapedia uses "Chi-Yu" format (with hyphen and proper capitalization)
      if (pokemon.name.toLowerCase() === 'chi-yu' || pokemon.name.toLowerCase().includes('chi yu') || pokemon.name.toLowerCase().includes('chiyu')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Chi-Yu_(Pokémon)`;
      }
      
      // Special case for Roaring Moon - Bulbapedia uses "Roaring_Moon" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'roaring-moon' || pokemon.name.toLowerCase().includes('roaring moon') || pokemon.name.toLowerCase().includes('roaringmoon')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Roaring_Moon_(Pokémon)`;
      }
      
      // Special case for Iron Valiant - Bulbapedia uses "Iron_Valiant" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-valiant' || pokemon.name.toLowerCase().includes('iron valiant') || pokemon.name.toLowerCase().includes('ironvaliant')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Valiant_(Pokémon)`;
      }
      
      // Special case for Walking Wake - Bulbapedia uses "Walking_Wake" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'walking-wake' || pokemon.name.toLowerCase().includes('walking wake') || pokemon.name.toLowerCase().includes('walkingwake')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Walking_Wake_(Pokémon)`;
      }
      
      // Special case for Iron Leaves - Bulbapedia uses "Iron_Leaves" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-leaves' || pokemon.name.toLowerCase().includes('iron leaves') || pokemon.name.toLowerCase().includes('ironleaves')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Leaves_(Pokémon)`;
      }
      
      // Special case for Gouging Fire - Bulbapedia uses "Gouging_Fire" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'gouging-fire' || pokemon.name.toLowerCase().includes('gouging fire') || pokemon.name.toLowerCase().includes('gougingfire')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Gouging_Fire_(Pokémon)`;
      }
      
      // Special case for Raging Bolt - Bulbapedia uses "Raging_Bolt" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'raging-bolt' || pokemon.name.toLowerCase().includes('raging bolt') || pokemon.name.toLowerCase().includes('ragingbolt')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Raging_Bolt_(Pokémon)`;
      }
      
      // Special case for Iron Boulder - Bulbapedia uses "Iron_Boulder" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-boulder' || pokemon.name.toLowerCase().includes('iron boulder') || pokemon.name.toLowerCase().includes('ironboulder')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Boulder_(Pokémon)`;
      }
      
      // Special case for Iron Crown - Bulbapedia uses "Iron_Crown" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-crown' || pokemon.name.toLowerCase().includes('iron crown') || pokemon.name.toLowerCase().includes('ironcrown')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Crown_(Pokémon)`;
      }
      
      // Use the display name and clean it for URL
      let displayName = formatPokemonName(pokemon.name);
      
      // Special case for Unown forms - always use base "unown"
      if (pokemon.name.toLowerCase().startsWith('unown')) {
        displayName = 'Unown';
      }
      
      const pokemonName = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return `https://bulbapedia.bulbagarden.net/wiki/${pokemonName}_(Pokémon)`;
    } else if (externalLinkPreference === 'smogon') {
      // Smogon - use the Pokemon strategy page
      let displayName = formatPokemonName(pokemon.name);
      
      // Special case for Nidoran♀ - Smogon uses "nidoran-f" format
      if (pokemon.name.toLowerCase().includes('nidoran-f') || pokemon.name.toLowerCase().includes('nidoran♀') || pokemon.name.toLowerCase().includes('nidoran female')) {
        return `https://www.smogon.com/dex/sv/pokemon/nidoran-f/`;
      }
      
      // Special case for Nidoran♂ - Smogon uses "nidoran-m" format
      if (pokemon.name.toLowerCase().includes('nidoran-m') || pokemon.name.toLowerCase().includes('nidoran♂') || pokemon.name.toLowerCase().includes('nidoran male')) {
        return `https://www.smogon.com/dex/sv/pokemon/nidoran-m/`;
      }
      
      // Special case for Unown forms - always use base "unown"
      if (pokemon.name.toLowerCase().startsWith('unown')) {
        displayName = 'Unown';
      }
      
      // Smogon uses lowercase names with hyphens for spaces
      const pokemonName = displayName.toLowerCase().replace(/\s+/g, '-');
      return `https://www.smogon.com/dex/sv/pokemon/${pokemonName}/`;
    } else {
      // Serebii - use the main Pokemon hub with Pokemon name
      let displayName = formatPokemonName(pokemon.name);
      
      // Special case for Unown forms - always use base "unown"
      if (pokemon.name.toLowerCase().startsWith('unown')) {
        displayName = 'Unown';
      }
      
      // Special case for Mr. Mime - Serebii uses "mr.mime" format
      if (pokemon.name.toLowerCase().includes('mr-mime') || pokemon.name.toLowerCase().includes('mr. mime') || pokemon.name.toLowerCase().includes('mr mime')) {
        return `https://www.serebii.net/pokemon/mr.mime`;
      }
      
      // Special case for Mime Jr. - Serebii uses "mimejr." format
      if (pokemon.name.toLowerCase().includes('mime-jr') || pokemon.name.toLowerCase().includes('mime jr') || pokemon.name.toLowerCase().includes('mime jr.')) {
        return `https://www.serebii.net/pokemon/mimejr.`;
      }
      
      // Special case for Mr. Rime - Serebii uses "mr.rime" format
      if (pokemon.name.toLowerCase().includes('mr-rime') || pokemon.name.toLowerCase().includes('mr. rime') || pokemon.name.toLowerCase().includes('mr rime')) {
        return `https://www.serebii.net/pokemon/mr.rime`;
      }
      
      // Special case for Type: Null - Serebii uses "type:null" format
      if (pokemon.name.toLowerCase().includes('type-null') || pokemon.name.toLowerCase().includes('type: null') || pokemon.name.toLowerCase().includes('type null')) {
        return `https://www.serebii.net/pokemon/type:null`;
      }
      
      // Special case for Nidoran♀ - Serebii uses "nidoranf" format
      if (pokemon.name.toLowerCase().includes('nidoran-f') || pokemon.name.toLowerCase().includes('nidoran♀') || pokemon.name.toLowerCase().includes('nidoran female')) {
        return `https://www.serebii.net/pokemon/nidoranf`;
      }
      
          // Special case for Nidoran♂ - Serebii uses "nidoranm" format
          if (pokemon.name.toLowerCase().includes('nidoran-m') || pokemon.name.toLowerCase().includes('nidoran♂') || pokemon.name.toLowerCase().includes('nidoran male')) {
            return `https://www.serebii.net/pokemon/nidoranm`;
          }
          
          // Special case for Farfetch'd - Serebii uses "farfetch'd" format (with apostrophe)
          if (pokemon.name.toLowerCase().includes('farfetch') || pokemon.name.toLowerCase().includes('farfetch\'d') || pokemon.name.toLowerCase().includes('farfetchd')) {
            return `https://www.serebii.net/pokemon/farfetch'd`;
          }
          
          // Special case for Sirfetch'd - Serebii uses "sirfetch'd" format (with apostrophe)
          if (pokemon.name.toLowerCase().includes('sirfetch') || pokemon.name.toLowerCase().includes('sirfetch\'d') || pokemon.name.toLowerCase().includes('sirfetchd')) {
            return `https://www.serebii.net/pokemon/sirfetch'd`;
          }
      
      // Use cleaned name for most Pokémon - preserve hyphens and colons but remove other special characters
      const pokemonName = displayName.toLowerCase().replace(/[^a-z0-9-:]/g, '');
      return `https://www.serebii.net/pokemon/${pokemonName}`;
    }
  };

  return (
                                               <div 
          className={`sidebar-container ${closing ? 'sidebar-slide-out' : 'sidebar-slide-in'}`} 
          onClick={(e) => e.stopPropagation()}
        >
                                   <button className="sidebar-close-button" onClick={handleClose} aria-label="Close">
          <span className="flex items-center justify-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
                                                           className="sidebar-close-icon"
            >
              <path d="M2 20a18 18 0 0 1 36 0" fill="#e62829" stroke="#232323" strokeWidth="2" />
              <path d="M2 20a18 18 0 0 1 36 0" fill="#fff" stroke="#232323" strokeWidth="2" transform="rotate(180 20 20)" />
              <rect x="2" y="19" width="36" height="2" fill="#232323" />
              <circle cx="20" cy="20" r="7" fill="#ffffffff" stroke="#232323" strokeWidth="2" />
              <circle cx="20" cy="20" r="3.5" fill="#fff" stroke="#232323" strokeWidth="1.5" />
            </svg>
          </span>
        </button>

                 {/* Top row: Image + Name */}
                   <div className="sidebar-header">
                                                                                                                                                                               <div className="sidebar-pokemon-image">
                                                       <img
                 src={pokeImg}
                 alt={pokeName}
                 className="w-22 h-22 object-contain image-render-pixelated"
                 width={88}
                 height={88}
                 style={{ imageRendering: 'pixelated' }}
               />
            {showShiny && (
              <div className="shiny-sparkles-overlay">
                <Sparkles 
                  size={16} 
                  className="shiny-sparkles-icon" 
                />
              </div>
            )}
          </div>
                                                                                                                                                                               <div className="flex-1">
                <a 
                  href={getExternalLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sidebar-pokemon-name-link"
                  title={`View ${pokeName} on ${externalLinkPreference === 'serebii' ? 'Serebii' : externalLinkPreference === 'bulbapedia' ? 'Bulbapedia' : 'PokemonDB'}`}
                >
                  <span className="sidebar-pokemon-name">{pokeName}</span>
                </a>
              </div>
        </div>

                {/* Second row: Meta (left) + Badges (right) */}
                 <div className="sidebar-meta-section">
                                           <div className="sidebar-meta-info">
                                                     <div className="sidebar-meta-text">
                 #{pokemon?.id ? String(pokemon.id).padStart(4, "0") : "----"}
               </div>
              <div className="sidebar-meta-text">
               Generation {pokemon?.gen ?? "?"}
               </div>
              <div className="sidebar-meta-text">
               {pokemon ? getFormDisplayName(pokemon) : null}
               </div>
           </div>
                     <div className="sidebar-type-badges">
            {pokeTypes.map(type => renderTypeBadge(type))}
          </div>
        </div>

                                                                       <hr className="sidebar-divider" style={{ top: '235px' }} />

       {/* Caught info section */}
      <div className="sidebar-content" style={{ top: '275px' }}>
  {!caughtInfo ? (
         <div className="sidebar-not-caught">
              <div className="sidebar-not-caught-text">
         {readOnly && viewingUsername ? (
           <>
             <div>{viewingUsername} has not caught</div>
             <div>{formatPokemonName(pokemon?.name)} yet</div>
           </>
         ) : (
           "Not caught"
         )}
       </div>
      {!readOnly && (
                                   <button className="sidebar-set-caught-button" onClick={handleSetCaught}>
           Set as caught
         </button>
      )}
    </div>
  ) : editing && !readOnly ? (
                   <form
        className="sidebar-form"
        onSubmit={e => {
          e.preventDefault();
          handleSaveEdit();
        }}
      >
                                                       <div className="sidebar-form-group">
           <label className="sidebar-label">Date caught:</label>
           <div className="relative">
             <input
               type="date"
               id="date-caught"
               name="date"
               value={editData.date}
               onChange={handleEditChange}
               className="sidebar-input pr-20"
               autoComplete="off"
             />
                           <Calendar 
                             className="absolute right-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--accent)] cursor-pointer hover:text-[var(--accent-hover)] transition-colors" 
                             onClick={() => document.getElementById('date-caught').showPicker?.() || document.getElementById('date-caught').click()}
                             title="Open date picker"
                           />
                                                           {editData.date && (
                                     <button
                     type="button"
                     onClick={() => handleEditChange({ target: { name: 'date', value: '' } })}
                     className="p-1"
                     title="Clear date"
                   >
                    <X size={14} />
                  </button>
                )}
           </div>
        </div>

             <div className="sidebar-form-group">
                  <label className="sidebar-label">Ball caught in:</label>
                                   <SearchbarIconDropdown
            id="ball-dropdown"
            options={getFilteredBallOptions()}
            value={editData.ball}
            onChange={val => {
              // Auto-set game to Legends Arceus if a Hisuian ball is selected
              if (val && isHisuianBall(val)) {
                setEditData(edit => ({ ...edit, ball: val, game: "Legends Arceus", method: "", mark: "" }));
              } else {
                setEditData(edit => ({ ...edit, ball: val }));
              }
            }}
            placeholder="Select a ball..."
            customBackground="var(--sidebar-edit-inputs)"
            customBorder="var(--border-color)"
            isSidebar={true}
          />
      </div>

             <div className="sidebar-form-group">
                  <label className="sidebar-label">Game:</label>
                                   <SearchbarIconDropdown
            id="game-dropdown"
            options={GAME_OPTIONS}
            value={editData.game}
            onChange={val => {
              // Clear ball selection if switching away from Legends Arceus and current ball is Hisuian
              const shouldClearBall = editData.game === "Legends Arceus" && 
                                    val !== "Legends Arceus" && 
                                    editData.ball && 
                                    isHisuianBall(editData.ball);
              setEditData(edit => ({ 
                ...edit, 
                game: val, 
                method: "", 
                mark: "",
                ball: shouldClearBall ? "" : edit.ball
              }));
            }}
            placeholder="Select a game..."
            customBackground="var(--sidebar-edit-inputs)"
            customBorder="var(--border-color)"
            isSidebar={true}
          />
      </div>

             <div className="sidebar-form-group">
                  <label className="sidebar-label">Method:</label>
                                   <SearchbarIconDropdown
            id="method-dropdown"
            options={[
              { name: "None", value: "" },
              ...availableMethods.map(method => ({ name: method.name, value: method.name })),
            ]}
            value={editData.method}
            onChange={val => {
              setEditData(edit => {
                const updatedEdit = { ...edit, method: val };
                // Clear incompatible modifiers when method changes
                if (!edit.modifiers) edit.modifiers = { ...defaultEditData.modifiers };
                if (val !== "Breeding") {
                  updatedEdit.modifiers = { ...updatedEdit.modifiers, shinyParents: false };
                }
                if (val !== "Catch Combo" && val !== "Random Encounters" && val !== "Soft Resets") {
                  updatedEdit.modifiers = { ...updatedEdit.modifiers, lureActive: false };
                }
                // Clear sparkling levels if method changes away from ones that use them
                if (val !== "Random Encounters" && val !== "Mass Outbreaks" && val !== "Sandwich" && val !== "Hyperspaces") {
                  updatedEdit.modifiers = { 
                    ...updatedEdit.modifiers, 
                    sparklingLv1: false, 
                    sparklingLv2: false, 
                    sparklingLv3: false 
                  };
                }
                return updatedEdit;
              });
            }}
            placeholder={editData.game ? "Select a method..." : "Select a game first"}
            customBackground="var(--sidebar-edit-inputs)"
            customBorder="var(--border-color)"
            disabled={!editData.game}
            isSidebar={true}
          />
      </div>

             {/* Modifiers Section */}
             {showShiny && editData.game && availableMethods.length > 0 && (
               (gameModifiers["Shiny Charm"] > 0 && !(editData.method === "Fossil Revivals" && (editData.game === "Let's Go Pikachu" || editData.game === "Let's Go Eevee" || editData.game === "Sword" || editData.game === "Shield")) && !(editData.method === "Fossil Revivals" && editData.game === "Legends Z-A") && !(editData.method === "Dynamax Raids" && (editData.game === "Sword" || editData.game === "Shield")) && !(editData.method === "Gift Pokemon" && (editData.game === "Sword" || editData.game === "Shield" || editData.game === "Let's Go Eevee" || editData.game === "Let's Go Pikachu")) && !(editData.method === "Tera Raids" && (editData.game === "Scarlet" || editData.game === "Violet")) && !((editData.method === "Random Encounters" || editData.method === "Poke Radar" || editData.method === "Soft Resets" || editData.method === "Fossil Revivals" || editData.method === "Gift Pokemon" || editData.method === "Underground Diglett Hunt") && (editData.game === "Brilliant Diamond" || editData.game === "Shining Pearl")) && !(editData.method === "Poke Radar" && (editData.game === "X" || editData.game === "Y")) && !(editData.method === "Ultra Wormholes" && (editData.game === "Ultra Sun" || editData.game === "Ultra Moon"))) ||
               (gameModifiers["Shiny Parents"] > 0 && editData.method === "Breeding") ||
               (gameModifiers["Lure Active"] > 0 && (editData.method === "Catch Combo" || editData.method === "Random Encounters" || (editData.method === "Soft Resets" && editData.game !== "Let's Go Pikachu" && editData.game !== "Let's Go Eevee"))) ||
               (gameModifiers["Research Lv 10"] > 0 && editData.game === "Legends Arceus") ||
               (gameModifiers["Perfect Research"] > 0 && editData.game === "Legends Arceus") ||
               (gameModifiers["Sparkling Lv 1"] > 0 && ((editData.game === "Scarlet" || editData.game === "Violet") && (editData.method === "Random Encounters" || editData.method === "Mass Outbreaks" || editData.method === "Sandwich") || (editData.game === "Legends Z-A" && editData.method === "Hyperspaces"))) ||
               (gameModifiers["Sparkling Lv 2"] > 0 && ((editData.game === "Scarlet" || editData.game === "Violet") && (editData.method === "Random Encounters" || editData.method === "Mass Outbreaks" || editData.method === "Sandwich") || (editData.game === "Legends Z-A" && editData.method === "Hyperspaces"))) ||
               (gameModifiers["Sparkling Lv 3"] > 0 && ((editData.game === "Scarlet" || editData.game === "Violet") && (editData.method === "Random Encounters" || editData.method === "Mass Outbreaks" || editData.method === "Sandwich") || (editData.game === "Legends Z-A" && editData.method === "Hyperspaces"))) ||
               (gameModifiers["Event Boosted"] > 0 && editData.game === "Scarlet" && editData.method === "Mass Outbreaks") ||
               (gameModifiers["Community Day"] > 0 && editData.game === "GO" && (editData.method === "Random Encounters" || editData.method === "Daily Adventure Incense")) ||
               (gameModifiers["Raid Day"] > 0 && editData.game === "GO" && editData.method === "Raid Battles") ||
               (gameModifiers["Research Day"] > 0 && editData.game === "GO" && editData.method === "Field Research") ||
               (gameModifiers["Galar Birds"] > 0 && editData.game === "GO" && editData.method === "Daily Adventure Incense") ||
               (gameModifiers["Hatch Day"] > 0 && editData.game === "GO" && editData.method === "Breeding")
             ) && (
               <div className="sidebar-form-group">
                 <label className="sidebar-label">Modifiers:</label>
                 <div className="flex flex-wrap gap-3">
                   {gameModifiers["Shiny Charm"] > 0 && !(editData.method === "Fossil Revivals" && (editData.game === "Let's Go Pikachu" || editData.game === "Let's Go Eevee" || editData.game === "Sword" || editData.game === "Shield")) && !(editData.method === "Fossil Revivals" && editData.game === "Legends Z-A") && !(editData.method === "Dynamax Raids" && (editData.game === "Sword" || editData.game === "Shield")) && !(editData.method === "Gift Pokemon" && (editData.game === "Sword" || editData.game === "Shield" || editData.game === "Let's Go Eevee" || editData.game === "Let's Go Pikachu")) && !(editData.method === "Tera Raids" && (editData.game === "Scarlet" || editData.game === "Violet")) && !((editData.method === "Random Encounters" || editData.method === "Poke Radar" || editData.method === "Soft Resets" || editData.method === "Fossil Revivals" || editData.method === "Gift Pokemon" || editData.method === "Underground Diglett Hunt") && (editData.game === "Brilliant Diamond" || editData.game === "Shining Pearl")) && !(editData.method === "Poke Radar" && (editData.game === "X" || editData.game === "Y")) && !(editData.method === "Ultra Wormholes" && (editData.game === "Ultra Sun" || editData.game === "Ultra Moon")) && (
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={editData.modifiers?.shinyCharm || false}
                         onChange={(e) => {
                           const newShinyCharm = e.target.checked;
                           setEditData(edit => ({
                             ...edit,
                             modifiers: {
                               ...edit.modifiers,
                               shinyCharm: newShinyCharm,
                               // Auto-check Research Lv 10 when Shiny Charm is checked in Legends Arceus
                               researchLv10: newShinyCharm && editData.game === "Legends Arceus" ? true : edit.modifiers?.researchLv10 || false
                             }
                           }));
                         }}
                       />
                       <span className="text-sm">Shiny Charm</span>
                     </label>
                   )}
                   {gameModifiers["Shiny Parents"] > 0 && editData.method === "Breeding" && (
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={editData.modifiers?.shinyParents || false}
                         onChange={(e) => setEditData(edit => ({
                           ...edit,
                           modifiers: { ...edit.modifiers, shinyParents: e.target.checked }
                         }))}
                       />
                       <span className="text-sm">Shiny Parents</span>
                     </label>
                   )}
                   {gameModifiers["Lure Active"] > 0 && (editData.method === "Catch Combo" || editData.method === "Random Encounters" || (editData.method === "Soft Resets" && editData.game !== "Let's Go Pikachu" && editData.game !== "Let's Go Eevee")) && (
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={editData.modifiers?.lureActive || false}
                         onChange={(e) => setEditData(edit => ({
                           ...edit,
                           modifiers: { ...edit.modifiers, lureActive: e.target.checked }
                         }))}
                       />
                       <span className="text-sm">Lure Active</span>
                     </label>
                   )}
                   {gameModifiers["Research Lv 10"] > 0 && editData.game === "Legends Arceus" && (
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={editData.modifiers?.researchLv10 || false}
                         onChange={(e) => setEditData(edit => ({
                           ...edit,
                           modifiers: { ...edit.modifiers, researchLv10: e.target.checked }
                         }))}
                       />
                       <span className="text-sm">Research Lv 10</span>
                     </label>
                   )}
                   {gameModifiers["Perfect Research"] > 0 && editData.game === "Legends Arceus" && (
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={editData.modifiers?.perfectResearch || false}
                         onChange={(e) => setEditData(edit => ({
                           ...edit,
                           modifiers: { ...edit.modifiers, perfectResearch: e.target.checked }
                         }))}
                       />
                       <span className="text-sm">Perfect Research</span>
                     </label>
                   )}
                   {gameModifiers["Sparkling Lv 1"] > 0 && ((editData.game === "Scarlet" || editData.game === "Violet") && (editData.method === "Random Encounters" || editData.method === "Mass Outbreaks" || editData.method === "Sandwich") || (editData.game === "Legends Z-A" && editData.method === "Hyperspaces")) && (
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={editData.modifiers?.sparklingLv1 || false}
                         onChange={(e) => {
                           const newSparklingLv1 = e.target.checked;
                           setEditData(edit => ({
                             ...edit,
                             modifiers: {
                               ...edit.modifiers,
                               sparklingLv1: newSparklingLv1,
                               sparklingLv2: newSparklingLv1 ? false : edit.modifiers?.sparklingLv2 || false,
                               sparklingLv3: newSparklingLv1 ? false : edit.modifiers?.sparklingLv3 || false
                             }
                           }));
                         }}
                       />
                       <span className="text-sm">Sparkling Lv 1</span>
                     </label>
                   )}
                   {gameModifiers["Sparkling Lv 2"] > 0 && ((editData.game === "Scarlet" || editData.game === "Violet") && (editData.method === "Random Encounters" || editData.method === "Mass Outbreaks" || editData.method === "Sandwich") || (editData.game === "Legends Z-A" && editData.method === "Hyperspaces")) && (
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={editData.modifiers?.sparklingLv2 || false}
                         onChange={(e) => {
                           const newSparklingLv2 = e.target.checked;
                           setEditData(edit => ({
                             ...edit,
                             modifiers: {
                               ...edit.modifiers,
                               sparklingLv2: newSparklingLv2,
                               sparklingLv1: newSparklingLv2 ? false : edit.modifiers?.sparklingLv1 || false,
                               sparklingLv3: newSparklingLv2 ? false : edit.modifiers?.sparklingLv3 || false
                             }
                           }));
                         }}
                       />
                       <span className="text-sm">Sparkling Lv 2</span>
                     </label>
                   )}
                   {gameModifiers["Sparkling Lv 3"] > 0 && ((editData.game === "Scarlet" || editData.game === "Violet") && (editData.method === "Random Encounters" || editData.method === "Mass Outbreaks" || editData.method === "Sandwich") || (editData.game === "Legends Z-A" && editData.method === "Hyperspaces")) && (
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={editData.modifiers?.sparklingLv3 || false}
                         onChange={(e) => {
                           const newSparklingLv3 = e.target.checked;
                           setEditData(edit => ({
                             ...edit,
                             modifiers: {
                               ...edit.modifiers,
                               sparklingLv3: newSparklingLv3,
                               sparklingLv1: newSparklingLv3 ? false : edit.modifiers?.sparklingLv1 || false,
                               sparklingLv2: newSparklingLv3 ? false : edit.modifiers?.sparklingLv2 || false
                             }
                           }));
                         }}
                       />
                       <span className="text-sm">Sparkling Lv 3</span>
                     </label>
                   )}
                   {gameModifiers["Event Boosted"] > 0 && editData.game === "Scarlet" && editData.method === "Mass Outbreaks" && (
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={editData.modifiers?.eventBoosted || false}
                         onChange={(e) => setEditData(edit => ({
                           ...edit,
                           modifiers: { ...edit.modifiers, eventBoosted: e.target.checked }
                         }))}
                       />
                       <span className="text-sm">Event Boosted</span>
                     </label>
                   )}
                   {gameModifiers["Community Day"] > 0 && editData.game === "GO" && (editData.method === "Random Encounters" || editData.method === "Daily Adventure Incense") && (
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={editData.modifiers?.communityDay || false}
                         onChange={(e) => setEditData(edit => ({
                           ...edit,
                           modifiers: { ...edit.modifiers, communityDay: e.target.checked }
                         }))}
                       />
                       <span className="text-sm">Community Day</span>
                     </label>
                   )}
                   {gameModifiers["Raid Day"] > 0 && editData.game === "GO" && editData.method === "Raid Battles" && (
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={editData.modifiers?.raidDay || false}
                         onChange={(e) => setEditData(edit => ({
                           ...edit,
                           modifiers: { ...edit.modifiers, raidDay: e.target.checked }
                         }))}
                       />
                       <span className="text-sm">Raid Day</span>
                     </label>
                   )}
                   {gameModifiers["Research Day"] > 0 && editData.game === "GO" && editData.method === "Field Research" && (
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={editData.modifiers?.researchDay || false}
                         onChange={(e) => setEditData(edit => ({
                           ...edit,
                           modifiers: { ...edit.modifiers, researchDay: e.target.checked }
                         }))}
                       />
                       <span className="text-sm">Research Day</span>
                     </label>
                   )}
                   {gameModifiers["Galar Birds"] > 0 && editData.game === "GO" && editData.method === "Daily Adventure Incense" && (
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={editData.modifiers?.galarBirds || false}
                         onChange={(e) => setEditData(edit => ({
                           ...edit,
                           modifiers: { ...edit.modifiers, galarBirds: e.target.checked }
                         }))}
                       />
                       <span className="text-sm">Galar Birds</span>
                     </label>
                   )}
                   {gameModifiers["Hatch Day"] > 0 && editData.game === "GO" && editData.method === "Breeding" && (
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={editData.modifiers?.hatchDay || false}
                         onChange={(e) => setEditData(edit => ({
                           ...edit,
                           modifiers: { ...edit.modifiers, hatchDay: e.target.checked }
                         }))}
                       />
                       <span className="text-sm">Hatch Day</span>
                     </label>
                   )}
                 </div>
               </div>
             )}

             <div className="sidebar-form-group">
                  <label className="sidebar-label">Mark:</label>
                                   <SearchbarIconDropdown
            id="mark-dropdown"
            options={MARK_OPTIONS}
            value={editData.mark}
            onChange={val => setEditData(edit => ({ ...edit, mark: val }))}
            placeholder={marksAvailable ? "Select a mark..." : "Marks not available in this game"}
            customBackground="var(--sidebar-edit-inputs)"
            customBorder="var(--border-color)"
            disabled={!marksAvailable}
            isSidebar={true}
          />
      </div>

                                                       <div className="sidebar-form-group">
           <label className="sidebar-label">Checks:</label>
           <div className="relative">
             <input
               type="number"
               id="checks-input"
               name="checks"
               value={editData.checks}
               min="0"
               max="999999"
               onChange={handleEditChange}
               placeholder="Number of checks"
               className="sidebar-input pr-20"
               autoComplete="off"
             />
                                                    <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2 flex flex-col gap-0">
                <button
                  type="button"
                  onClick={() => {
                    const newValue = Math.min(999999, (editData.checks || 0) + 1);
                    handleEditChange({ target: { name: 'checks', value: newValue } });
                  }}
                  className="flex items-center justify-center p-0.5 transition-colors duration-200"
                  title="Increase checks"
                >
                  <ChevronUp className="w-4 h-4 text-[var(--accent)] hover:text-white transition-colors duration-200" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newValue = Math.max(0, (editData.checks || 0) - 1);
                    handleEditChange({ target: { name: 'checks', value: newValue } });
                  }}
                  className="flex items-center justify-center p-0.5 transition-colors duration-200"
                  title="Decrease checks"
                >
                  <ChevronDown className="w-4 h-4 text-[var(--accent)] hover:text-white transition-colors duration-200" />
                </button>
              </div>
                                                                                                               {(editData.checks !== '' && editData.checks !== null && editData.checks !== undefined) && (
                                     <button
                     type="button"
                     onClick={() => handleEditChange({ target: { name: 'checks', value: '' } })}
                     className="p-1"
                     title="Clear checks"
                   >
                    <X size={14} />
                  </button>
                )}
           </div>
        </div>

                           <div className="sidebar-form-group">
          <label className="sidebar-label">Notes/extras:</label>
         <ContentFilterInput
           id="notes-textarea"
           name="notes"
           type="textarea"
           value={editData.notes}
           onChange={handleEditChange}
           placeholder="Add notes about this Pokemon..."
           configType="notes"
           showCharacterCount={true}
           showRealTimeValidation={true}
           className="sidebar-input"
           autoComplete="off"
         />
       </div>

                                                       <div className="sidebar-form-buttons">
           <button type="submit" className="sidebar-button">Save</button>
           <button type="button" className="sidebar-button" onClick={handleCancelEdit}>Cancel</button>
         </div>
    </form>
         ) : (
     <div>
                               {/* Paginated entries display with page navigation */}
                                       {localEntries.length > 0 && (
             <div className="space-y-4">
               {/* Entry info display - moved above the navigation */}
                               <div className="sidebar-entries-info">
                  Entry {selectedEntryIndex + 1} of {localEntries.length}
                </div>
               
                                                                                                                         <div className="sidebar-navigation">
                  {/* Only show navigation buttons when there are multiple entries */}
                  {localEntries.length > 1 ? (
                    <>
                                             {/* Delete button for current entry - positioned on the left */}
                       {!readOnly && (
                         <button
                           className="sidebar-delete-button"
                           onClick={async (e) => {
                             e.stopPropagation();
                             
                             const currentEntry = localEntries[selectedEntryIndex];
                             // Check if this entry has any saved data
                             const hasData = currentEntry.date || currentEntry.ball || currentEntry.game || currentEntry.mark || 
                                            currentEntry.method || currentEntry.checks || currentEntry.notes;
                             
                             // Only show confirmation if entry has data, otherwise delete immediately
                             if (hasData) {
                               setDeleteEntryModal({ show: true, entryIndex: selectedEntryIndex, entryNumber: selectedEntryIndex + 1 });
                             } else {
                               const updatedEntries = localEntries.filter((_, i) => i !== selectedEntryIndex);
                               if (updatedEntries.length === 0) {
                                 updateCaughtInfo(pokemon, null, showShiny);
                                 setLocalEntries([]);
                               } else {
                                 updateCaughtInfo(pokemon, {
                                   caught: true,
                                   entries: updatedEntries
                                 }, showShiny);
                                 setLocalEntries(updatedEntries);
                                 
                                 // Adjust selectedEntryIndex if needed
                                 if (selectedEntryIndex >= updatedEntries.length) {
                                   setSelectedEntryIndex(updatedEntries.length - 1);
                                 } else if (selectedEntryIndex > 0) {
                                   setSelectedEntryIndex(selectedEntryIndex - 1);
                                 }
                               }
                             }
                           }}
                           title="Delete current entry"
                         >
                           <Trash2 size={16} />
                         </button>
                       )}
                      
                                                                                                                                         {/* Entry 1 button */}
                         <button 
                           className="sidebar-nav-button"
                        onClick={() => {
                          setSelectedEntryIndex(0);
                          switchToEntry(0);
                        }}
                        disabled={selectedEntryIndex === 0}
                        title="Go to first entry"
                      >
                        1
                      </button>
                      
                                                                                                                                         {/* Back 1 entry */}
                         <button 
                           className="sidebar-nav-button"
                        onClick={() => {
                          if (selectedEntryIndex > 0) {
                            const newIndex = selectedEntryIndex - 1;
                            setSelectedEntryIndex(newIndex);
                            switchToEntry(newIndex);
                          }
                        }}
                        disabled={selectedEntryIndex === 0}
                        title="Previous entry"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                                             {/* Current entry (highlighted) */}
                       <button 
                         className="sidebar-current-entry"
                         disabled
                         title="Current entry"
                       >
                        {selectedEntryIndex + 1}
                      </button>
                      
                                                                                                                                         {/* Forward 1 entry */}
                         <button 
                           className="sidebar-nav-button"
                        onClick={() => {
                          if (selectedEntryIndex < localEntries.length - 1) {
                            const newIndex = selectedEntryIndex + 1;
                            setSelectedEntryIndex(newIndex);
                            switchToEntry(newIndex);
                          }
                        }}
                        disabled={selectedEntryIndex >= localEntries.length - 1}
                        title="Next entry"
                      >
                        <ChevronRight size={16} />
                      </button>
                      
                                                                                                                                         {/* Last entry button */}
                         <button 
                           className="sidebar-nav-button"
                        onClick={() => {
                          const newIndex = localEntries.length - 1;
                          setSelectedEntryIndex(newIndex);
                          switchToEntry(newIndex);
                        }}
                        disabled={selectedEntryIndex === localEntries.length - 1}
                        title="Go to last entry"
                      >
                        {localEntries.length}
                      </button>
                    </>
                  ) : (
                                                                                   /* Show just the current entry display when there's only 1 entry */
                      <button 
                        className="sidebar-current-entry"
                        disabled
                        title="Current entry"
                      >
                       1
                     </button>
                  )}
                  
                                     {/* Add entry button - always show */}
                   {!readOnly && (
                     <button 
                       className={`sidebar-add-button ${localEntries.length >= 30 ? 'sidebar-add-button-disabled' : ''}`}
                       onClick={() => {
                         if (localEntries.length >= 30) return; // Prevent action if at max
                         
                         const newEntry = {
                           date: "",
                           ball: BALL_OPTIONS[0].value,
                           mark: MARK_OPTIONS[0].value,
                           method: METHOD_OPTIONS[0],
                           game: GAME_OPTIONS[0].value,
                           checks: "",
                           notes: "",
                           entryId: Math.random().toString(36).substr(2, 9)
                         };
                         
                         const currentEntries = localEntries;
                         const updatedInfo = {
                           caught: true,
                           entries: [...currentEntries, newEntry]
                         };
                         
                         updateCaughtInfo(pokemon, updatedInfo, showShiny);
                         setLocalEntries([...currentEntries, newEntry]);
                         setSelectedEntryIndex(currentEntries.length); // Select the new entry
                         setEditData(newEntry); // Update editData to show the new entry
                       }}
                       disabled={localEntries.length >= 30}
                       title={localEntries.length >= 30 ? "Maximum entries reached (30)" : "Add another entry for this Pokémon (max 30)"}
                     >
                       <Plus size={16} />
                     </button>
                   )}
                </div>
            </div>
          )}
        
                 {/* Display info from the selected entry */}
         <div className="sidebar-display-section">
                                                                                                                                   {editData.date && (
                <div className="sidebar-display-card">
               <div className="sidebar-display-info">
                 <div className="sidebar-display-label">Date</div>
                 <div className="sidebar-display-value">{formatDate(editData.date)}</div>
               </div>
               <div className="sidebar-display-icon">
                 <img src="/data/SidebarIcons/Date.svg" alt="Date" className="w-full h-full object-contain" />
               </div>
             </div>
           )}

                                                                                                                                   {ballObj && editData.ball && (
                <div className="sidebar-display-card">
               <div className="sidebar-display-info">
                 <div className="sidebar-display-label">Ball</div>
                 <div className="sidebar-display-value">{ballObj.name}</div>
               </div>
               <div className="sidebar-display-image">
                 <img src={ballObj.image} alt="" className="w-full h-full object-contain" onError={e => (e.target.style.display = "none")} />
               </div>
             </div>
           )}

                                                                                       {gameObj && editData.game && (
               <div className="sidebar-display-card">
               <div className="sidebar-display-info">
                 <div className="sidebar-display-label">Game</div>
                 <div className="sidebar-display-value">{gameObj.name}</div>
               </div>
               <div className="sidebar-display-image">
                 <img src={gameObj.image} alt="" className="w-full h-full object-contain" onError={e => (e.target.style.display = "none")} />
               </div>
             </div>
           )}

                                                                                                                                   {editData.method && editData.method !== "" && (
                <div className="sidebar-display-card">
               <div className="sidebar-display-info">
                 <div className="sidebar-display-label">Method</div>
                 <div className="sidebar-display-value">{editData.method}</div>
               </div>
               <div className="sidebar-display-icon">
                 <img src="/data/SidebarIcons/Method.svg" alt="Method" className="w-full h-full object-contain" />
               </div>
             </div>
           )}

                                                                                                                                   {markObj && editData.mark && (
                <div className="sidebar-display-card">
               <div className="sidebar-display-info">
                 <div className="sidebar-display-label">Mark</div>
                 <div className="sidebar-display-value">{markObj.name}</div>
               </div>
               <div className="sidebar-display-image-large">
                 <img src={markObj.image} alt="" className="w-full h-full object-contain" onError={e => (e.target.style.display = "none")} />
               </div>
             </div>
           )}

                                                                                                                               {(editData.checks !== undefined &&
               editData.checks !== null &&
               String(editData.checks).trim() !== "") && (
                <div className="sidebar-display-card">
               <div className="sidebar-display-info">
                 <div className="sidebar-display-label">Checks</div>
                 <div className="sidebar-display-value">{Number(editData.checks).toLocaleString()}</div>
               </div>
               <div className="sidebar-display-icon">
                 <img src="/data/SidebarIcons/Checks.svg" alt="Checks" className="w-full h-full object-contain" />
               </div>
             </div>
           )}

                                                                                                                               {showShiny && editData.game && editData.method && (() => {
               try {
                 const checkCount = editData.checks ? Number(editData.checks) : 0;
                 const modifiers = editData.modifiers || {};
                 const odds = getCurrentHuntOdds(editData.game, editData.method, modifiers, checkCount);
                 return (
                   <div className="sidebar-display-card">
                     <div className="sidebar-display-info">
                       <div className="sidebar-display-label">Odds</div>
                       <div className="sidebar-display-value">1/{odds.toLocaleString()}</div>
                     </div>
                     <div className="sidebar-display-icon">
                       <img src="/data/SidebarIcons/Odds.svg" alt="Odds" className="w-full h-full object-contain" />
                     </div>
                   </div>
                 );
               } catch (e) {
                 return null;
               }
             })()}

                                                                                                                               {(editData.time !== undefined && editData.time !== null && editData.time !== "" && editData.time !== 0) && (
                <div className="sidebar-display-card">
               <div className="sidebar-display-info">
                 <div className="sidebar-display-label">Time</div>
                 <div className="sidebar-display-value">{formatTimeFull(typeof editData.time === 'string' ? parseInt(editData.time) || 0 : (typeof editData.time === 'number' ? editData.time : 0))}</div>
               </div>
               <div className="sidebar-display-icon">
                 <img src="/data/SidebarIcons/Time.svg" alt="Time" className="w-full h-full object-contain" />
               </div>
             </div>
           )}

                                                                                                                                   {editData.notes && editData.notes !== "" && (
                <div className="sidebar-display-card">
               <div className="sidebar-display-info flex-1 mr-4">
                 <div className="sidebar-display-label">Notes</div>
                 <div className="sidebar-display-value break-words">{editData.notes}</div>
               </div>
               <div className="sidebar-display-icon flex-shrink-0">
                 <img src="/data/SidebarIcons/Notes.svg" alt="Notes" className="w-full h-full object-contain" />
               </div>
             </div>
           )}

                                           
            
                                                 {/* Show warning when viewing an entry with no data - only for read-only modes and multiple entries */}
              {readOnly && localEntries.length > 1 && !editData.date && !editData.ball && !editData.game && !editData.mark && 
               !editData.method && !editData.checks && !editData.notes && (
                <div className="sidebar-warning">
                  <span className="sidebar-warning-text">This entry has no saved data</span>
                </div>
              )}
        </div>

               {/* Edit button */}
                 {!readOnly && (
                       <div className="sidebar-edit-section">
              <button
                className="sidebar-button"
                onClick={() => setEditing(true)}
              >
                Edit Info
              </button>
            </div>
         )}

                             {/* Show message when caught but no data in read-only mode */}
                {readOnly && viewingUsername && caughtInfo && (
           !localEntries.length || 
           localEntries.every(entry => 
             !entry.date && 
             !entry.ball && 
             !entry.mark && 
             !entry.method && 
             !entry.game && 
             !entry.checks && 
             !entry.notes
           ) ? (
                         <div className="sidebar-message">
               <div>{viewingUsername} has not set any data for {formatPokemonName(pokemon?.name)}</div>
             </div>
          ) : null
        )}

      

                           {!readOnly && (
          ((localEntries.some(entry => entry.ball)) ||
            (localEntries.some(entry => entry.game)) ||
            (localEntries.some(entry => entry.mark)) ||
            (localEntries.some(entry => entry.method && entry.method !== "" && entry.method !== METHOD_OPTIONS[0])) ||
            (localEntries.some(entry => entry.checks && String(entry.checks).trim() !== "" && entry.checks !== 0)) ||
            (localEntries.some(entry => entry.notes && entry.notes !== "")) ||
            (localEntries.some(entry => entry.date && entry.date !== "")) ||
            (localEntries.length > 1)) && (
                                               <div className="sidebar-reset-section">
               <button className="sidebar-reset-button" onClick={handleReset}>Reset</button>
             </div>
         )
       )}

    </div>
  )}

        {/* Spacer for evolution chain */}
        <div className="evolution-chain-spacer"></div>
        
        {/* Available Games Section */}
        {pokemon && (
          <div className="available-games-section">
            <h3 className="available-games-title">OBTAINABLE IN</h3>
            <div className="available-games-divider"></div>
            <div className="available-games-grid">
              {getGroupedGames(getAvailableGames(pokemon)).map((gameGroup, index) => (
                <div
                  key={`${gameGroup.displayName}-${index}`}
                  className={`game-tag ${gameGroup.type === 'pair' ? 'game-tag-pair' : gameGroup.type === 'quad' ? 'game-tag-quad' : 'game-tag-single'}`}
                  style={{
                    background: gameGroup.type === 'pair' 
                      ? `linear-gradient(90deg, ${gameGroup.colors[0]} 50%, ${gameGroup.colors[1]} 50%)`
                      : gameGroup.type === 'quad'
                      ? `linear-gradient(90deg, ${gameGroup.colors[0]} 25%, ${gameGroup.colors[1]} 25%, ${gameGroup.colors[1]} 50%, ${gameGroup.colors[2]} 50%, ${gameGroup.colors[2]} 75%, ${gameGroup.colors[3]} 75%)`
                      : gameGroup.colors[0]
                  }}
                >
                  {gameGroup.displayName}
                </div>
              ))}
            </div>
          </div>
        )}

        {pokemon && <EvolutionChain pokemon={pokemon} showShiny={showShiny} onPokemonSelect={onPokemonSelect} />}

      </div>

             {/* Reset Pokémon Modal */}
       {resetModal.show && createPortal(
         <div 
           className={`fixed inset-0 z-[20000] ${resetModalClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
           style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
           onClick={() => {
             setResetModalClosing(true);
             setTimeout(() => {
               setResetModal({ show: false, pokemonName: '' });
               setResetModalClosing(false);
             }, 300);
           }}
         >
           <div className="bg-black/80  w-full h-full flex items-center justify-center">
                           <div 
                className={`bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl ${resetModalClosing ? 'animate-[slideOut_0.3s_ease-in_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}`}
                onClick={(e) => e.stopPropagation()}
              >
                                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                     <RotateCcw className="w-5 h-5 text-red-400" />
                   </div>
                   <div>
                     <h3 className="text-lg font-semibold text-[var(--accent)]">Reset Pokémon</h3>
                     <p className="text-sm text-[var(--progressbar-info)]">This action cannot be undone</p>
                   </div>
                 </div>
                 <p className="text-gray-300 mb-6">
                   Are you sure you want to reset <span className="font-semibold text-[var(--accent)]">{resetModal.pokemonName}</span>? 
                   This will delete all saved data.
                 </p>
                               <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setResetModalClosing(true);
                      setTimeout(() => {
                        setResetModal({ show: false, pokemonName: '' });
                        setResetModalClosing(false);
                      }, 300);
                    }}
                    className="px-4 py-2 rounded-lg bg-transparent border-2 border-[var(--dividers)] text-[var(--text)] hover:bg-[var(--dividers)] transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetConfirm}
                    className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black hover:text-white transition-colors font-semibold"
                  >
                    Reset Pokémon
                  </button>
                </div>
             </div>
           </div>
         </div>,
         document.body
       )}

             {/* Delete Entry Modal */}
       {deleteEntryModal.show && createPortal(
         <div 
           className={`fixed inset-0 z-[20000] ${deleteEntryModalClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
           style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
           onClick={() => {
             setDeleteEntryModalClosing(true);
             setTimeout(() => {
               setDeleteEntryModal({ show: false, entryIndex: null, entryNumber: null });
               setDeleteEntryModalClosing(false);
             }, 300);
           }}
         >
           <div className="bg-black/80  w-full h-full flex items-center justify-center">
                           <div 
                className={`bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl ${deleteEntryModalClosing ? 'animate-[slideOut_0.3s_ease-in_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}`}
                onClick={(e) => e.stopPropagation()}
              >
                                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                     <Trash2 className="w-5 h-5 text-red-400" />
                   </div>
                   <div>
                     <h3 className="text-lg font-semibold text-[var(--accent)]">Delete Entry</h3>
                     <p className="text-sm text-[var(--progressbar-info)]">This action cannot be undone</p>
                   </div>
                 </div>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete entry <span className="font-semibold text-[var(--accent)]">#{deleteEntryModal.entryNumber}</span>? 
                  This will remove all data for this entry including date, ball, mark, method, game, checks, and notes.
                </p>
               <div className="flex gap-3 justify-end">
                 <button
                   onClick={() => {
                     setDeleteEntryModalClosing(true);
                     setTimeout(() => {
                       setDeleteEntryModal({ show: false, entryIndex: null, entryNumber: null });
                       setDeleteEntryModalClosing(false);
                     }, 300);
                   }}
                   className="px-4 py-2 rounded-lg bg-transparent border-2 border-[var(--dividers)] text-[var(--text)] hover:bg-[var(--dividers)] transition-colors font-semibold"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleDeleteEntryConfirm}
                   className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black hover:text-white transition-colors"
                 >
                   Delete Entry
                 </button>
               </div>
             </div>
           </div>
         </div>,
         document.body
       )}
    </div>
  );
}
