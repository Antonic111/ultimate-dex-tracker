import { useState, useEffect, useContext, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Minus, Check, Trash2, Settings, RotateCcw, Pause, Play,
  Info, Edit, X, BarChart3, Sparkles, Zap, CheckCircle
} from "lucide-react";
import { calculateOdds, getMethodsForGame, getModifiersForGame } from "../utils/huntSystem";
import { formatPokemonName, getFormDisplayName } from "../utils";
import { getCaughtKey } from "../caughtStorage";
import { UserContext } from "../components/Shared/UserContext";
import { useMessage } from "../components/Shared/MessageContext";
import { huntAPI, profileAPI, caughtAPI } from "../utils/api";
import { BALL_OPTIONS, MARK_OPTIONS, GAME_OPTIONS } from "../Constants";
import pokemonData from "../data/pokemon.json";
import gamePokemonData from "../data/gamePokemon.json";
import formsData from "../utils/loadFormsData";
import { getFilteredFormsData } from "../utils/dexPreferences";
import ContentFilterInput from "../components/Shared/ContentFilterInput";
import { SearchbarIconDropdown } from "../components/Shared/SearchBar";
import { validateContent } from "../../shared/contentFilter";
import PermutationTable from "../components/MMO/PermutationTable";
import "../css/Counters.css";
import "../css/MMOTool.css";

// ─── Inline timer (same pattern as Counters) ─────────────────────────────────
function TimerDisplay({ huntId, lastCheckTime, isPaused, onTimeUpdate }) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isPaused) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = setInterval(() => setSeconds(p => p + 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, [isPaused]);

  useEffect(() => {
    if (onTimeUpdate && !isPaused) onTimeUpdate(huntId, seconds * 1000);
  }, [seconds, huntId, onTimeUpdate, isPaused]);

  useEffect(() => { setSeconds(0); }, [lastCheckTime]);

  if (isPaused) return "Paused";
  return `${seconds}s`;
}

// ─── Legends Arceus permutation ball filter ──────────────────────────────────
const HISUIAN_BALLS = [
  "Feather Ball","Wing Ball","Jet Ball","Heavy Ball (Hisui)",
  "Leaden Ball","Gigaton Ball","Poké Ball (Hisui)",
  "Great Ball (Hisui)","Ultra Ball (Hisui)","Origin Ball","Strange Ball"
];

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

const formatTimeCompact = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
};

function getPokemonImage(pokemon) {
  if (!pokemon) return "";
  return pokemon.sprites?.front_shiny || pokemon.sprites?.front_default || "";
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MMOTool() {
  const { username } = useContext(UserContext);
  const { showMessage } = useMessage();

  // ── Hunt state (shared with Counters via huntAPI) ─────────────────────────
  const [activeHunts, setActiveHunts]         = useState([]);
  const [huntTimers, setHuntTimers]           = useState({});
  const [lastCheckTimes, setLastCheckTimes]   = useState({});
  const [totalCheckTimes, setTotalCheckTimes] = useState({});
  const [pausedHunts, setPausedHunts]         = useState(new Set());
  const [huntIncrements, setHuntIncrements]   = useState({});
  const [currentBottomTimers, setCurrentBottomTimers] = useState({});
  const [expandedHunts, setExpandedHunts]     = useState(new Set());
  const [shinyCharmGames, setShinyCharmGames] = useState([]);

  const lastSaveTime = useRef(0);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [showPokemonModal, setShowPokemonModal] = useState(false);
  const [showHuntModal, setShowHuntModal]       = useState(false);
  const [searchTerm, setSearchTerm]             = useState("");
  const [selectedPokemon, setSelectedPokemon]   = useState(null);
  const [huntDetails, setHuntDetails] = useState({ game: "Legends Arceus", method: "Permutations", modifiers: {} });

  const [resetModal, setResetModal]     = useState({ show: false, hunt: null });
  const [deleteModal, setDeleteModal]   = useState({ show: false, hunt: null });
  const [completionModal, setCompletionModal] = useState({ show: false, hunt: null });

  const [pokemonModalClosing, setPokemonModalClosing]     = useState(false);
  const [huntModalClosing, setHuntModalClosing]           = useState(false);
  const [backdropClosing, setBackdropClosing]             = useState(false);
  const [resetModalClosing, setResetModalClosing]         = useState(false);
  const [deleteModalClosing, setDeleteModalClosing]       = useState(false);
  const [completionModalClosing, setCompletionModalClosing]= useState(false);

  const isHisuianBall = (ballValue) => {
    return HISUIAN_BALLS.includes(ballValue);
  };

  const getCompletionBallOptions = () => {
    if (completionModal.hunt && completionModal.hunt.game === "Legends Arceus") {
      return BALL_OPTIONS.filter(ball =>
        ball.value === "" || isHisuianBall(ball.value)
      );
    }
    return BALL_OPTIONS;
  };

  const [modifiers, setModifiers] = useState({
    shinyCharm: false,
    researchLv10: false,
    perfectResearch: false,
  });

  const [settingsForm, setSettingsForm] = useState({
    manualChecks: '',
    manualTotalTime: '',
    manualIncrements: '',
  });

  const [settingsModal, setSettingsModal] = useState({ show: false, hunt: null });
  const [settingsModalClosing, setSettingsModalClosing] = useState(false);
  const [completionForm, setCompletionForm] = useState({ ball: '', mark: '', notes: '' });
  const [editModal, setEditModal] = useState({ show: false, hunt: null });
  const [editModalClosing, setEditModalClosing] = useState(false);
  const [editForm, setEditForm] = useState({
    game: '',
    method: '',
    pokemon: null,
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
  });
  const currentOdds = useMemo(() => {
    if (!huntDetails.game || !huntDetails.method) return "NA";

    // Special case for Poke Radar in Diamond/Pearl/Platinum - show table
    if (huntDetails.method === "Poke Radar" && (huntDetails.game === "Diamond" || huntDetails.game === "Pearl" || huntDetails.game === "Platinum")) {
      return "pokeradarDPP"; // Special flag to show Poke Radar table in display
    }

    // Special case for Poke Radar in X/Y - show table
    if (huntDetails.method === "Poke Radar" && (huntDetails.game === "X" || huntDetails.game === "Y")) {
      return "pokeradarXY"; // Special flag to show X/Y Poke Radar table in display
    }

    // Special case for Poke Radar in Brilliant Diamond/Shining Pearl - show table
    if (huntDetails.method === "Poke Radar" && (huntDetails.game === "Brilliant Diamond" || huntDetails.game === "Shining Pearl")) {
      return "pokeradarBDSP"; // Special flag to show BDSP Poke Radar table in display
    }

    // Special case for Chain Fishing in X/Y - show table
    if (huntDetails.method === "Chain Fishing" && (huntDetails.game === "X" || huntDetails.game === "Y")) {
      return "chainFishingXY"; // Special flag to show X/Y Chain Fishing table in display
    }

    // Special case for Chain Fishing in Omega Ruby/Alpha Sapphire - show table
    if (huntDetails.method === "Chain Fishing" && (huntDetails.game === "Omega Ruby" || huntDetails.game === "Alpha Sapphire")) {
      return "chainFishingORAS"; // Special flag to show ORAS Chain Fishing table in display
    }

    // Special case for DexNav in Omega Ruby/Alpha Sapphire - show chart
    if (huntDetails.method === "DexNav" && (huntDetails.game === "Omega Ruby" || huntDetails.game === "Alpha Sapphire")) {
      return "dexNavORAS"; // Special flag to show DexNav chart in display
    }

    // Special case for SOS method in Sun/Moon and Ultra Sun/Ultra Moon - show chart
    if (huntDetails.method === "SOS" && (huntDetails.game === "Sun" || huntDetails.game === "Moon" || huntDetails.game === "Ultra Sun" || huntDetails.game === "Ultra Moon")) {
      return "sosSMUSUM"; // Special flag to show SOS chart in display
    }

    // Special case for Ultra Wormholes in Ultra Sun/Ultra Moon - show percentage odds
    if (huntDetails.method === "Ultra Wormholes" && (huntDetails.game === "Ultra Sun" || huntDetails.game === "Ultra Moon")) {
      return "ultraWormholes"; // Special flag to show Ultra Wormhole percentage in display
    }

    // Special case for KO Method in Sword/Shield - show dynamic odds
    if (huntDetails.method === "KO Method" && (huntDetails.game === "Sword" || huntDetails.game === "Shield")) {
      return "koMethod"; // Special flag to show KO method dynamic odds in display
    }

    // Special case for Horde Encounters - show odds with note
    if (huntDetails.method === "Horde Encounters") {
      return "hordeEncounters"; // Special flag to show Horde Encounters with note
    }

    // Special case for Catch Combo in Let's Go games - show table
    if (huntDetails.method === "Catch Combo" && (huntDetails.game === "Let's Go Pikachu" || huntDetails.game === "Let's Go Eevee")) {
      return "catchComboLetsGo"; // Special flag to show Catch Combo table in display
    }

    // Special case for Mass Outbreaks in Scarlet/Violet - show table
    if (huntDetails.method === "Mass Outbreaks" && (huntDetails.game === "Scarlet" || huntDetails.game === "Violet")) {
      return "massOutbreaksSV"; // Special flag to show Mass Outbreaks table in display
    }

    // Special case for Random Encounters and Daily Adventure Incense in Pokemon Go - show odds with note
    if ((huntDetails.method === "Random Encounters" || huntDetails.method === "Daily Adventure Incense") && huntDetails.game === "GO") {
      return "pokemonGoRandom"; // Special flag to show Pokemon Go Random Encounters/Daily Adventure Incense with note
    }

    return calculateOdds(huntDetails.game, huntDetails.method, modifiers);
  }, [huntDetails.game, huntDetails.method, modifiers]);

  const [isEditingPokemon, setIsEditingPokemon] = useState(false);
  const [selectedHuntId, setSelectedHuntId] = useState(null);
  const [multiCheckEnabled, setMultiCheckEnabled] = useState(false);
  const [legendColors, setLegendColors] = useState({});
  const [isSaveOrder, setIsSaveOrder] = useState(false);
  const [showSecondWave, setShowSecondWave] = useState(true);
  const [showGhostChecks, setShowGhostChecks] = useState(true);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [secondSpawn, setSecondSpawn] = useState(6);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!username) return;
    const timer = setTimeout(() => {
      huntAPI.updateHuntData({
        mmoSettings: {
          multiCheckEnabled,
          legendColors,
          isSaveOrder,
          showSecondWave,
          showGhostChecks,
          isAdvanced,
          secondSpawn
        }
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [multiCheckEnabled, legendColors, isSaveOrder, showSecondWave, showGhostChecks, isAdvanced, secondSpawn, username]);


  const lastPauseAction = useRef({});
  const prevEditGameRef = useRef(editForm.game);
  const editModalJustOpenedRef = useRef(false);

  // ── All pokemon list ──────────────────────────────────────────────────────
  const allPokemon = useMemo(() => {
    const baseList = pokemonData.map(p => ({
      ...p,
      formType: "main",
      stableId: `${p.name}-main-${String(p.id).padStart(4, '0')}`
    }));

    const formsList = formsData.map(f => ({
      ...f,
      stableId: f.stableId || `${f.name}-${f.formType}-${String(f.id).padStart(4, '0')}`
    }));

    return [...baseList, ...formsList];
  }, []);

  const filteredPokemon = useMemo(() => {
    const legendsArceusIds = gamePokemonData["Legends Arceus"] || [];
    const alphas = allPokemon.filter(p => {
      const isAlpha = p.formType && p.formType.toLowerCase().includes("alpha");
      if (!isAlpha) return false;
      const formattedId = String(p.id).padStart(4, "0");
      return legendsArceusIds.includes(formattedId);
    });
    if (!searchTerm.trim()) return alphas;
    const q = searchTerm.toLowerCase();
    return alphas.filter(p =>
      p && p.name && (p.name.toLowerCase().includes(q) || String(p.id).includes(q))
    );
  }, [allPokemon, searchTerm]);

  // ── Only permutation hunts from Legends Arceus ────────────────────────────
  const permutationHunts = useMemo(() =>
    activeHunts.filter(h => h.game === "Legends Arceus" && h.method === "Permutations"),
    [activeHunts]
  );

  useEffect(() => {
    if (selectedHuntId && !permutationHunts.find(h => h.id === selectedHuntId)) {
      setSelectedHuntId(null);
    }
  }, [permutationHunts, selectedHuntId]);


  // ── Save hunt data ────────────────────────────────────────────────────────
  const saveHuntData = useCallback(async (override = null) => {
    if (!username) return;
    const now = Date.now();
    if (!override && now - lastSaveTime.current < 500) return;
    lastSaveTime.current = now;
    try {
      const data = override || {
        activeHunts,
        huntTimers: Object.fromEntries(Object.entries(huntTimers)),
        lastCheckTimes: Object.fromEntries(Object.entries(lastCheckTimes)),
        totalCheckTimes: Object.fromEntries(Object.entries(totalCheckTimes)),
        pausedHunts: Array.from(pausedHunts),
        huntIncrements: Object.fromEntries(Object.entries(huntIncrements)),
      };
      await huntAPI.updateHuntData(data);
    } catch {
      showMessage('Failed to save hunt data', 'error');
    }
  }, [username, activeHunts, huntTimers, lastCheckTimes, totalCheckTimes, pausedHunts, huntIncrements, showMessage]);

  // ── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!username) return;
    (async () => {
      try {
        const data = await huntAPI.getHuntData();
        if (data.activeHunts) {
          setActiveHunts(data.activeHunts.map(h => ({
            ...h,
            modifiers: h.modifiers || { shinyCharm: false, researchLv10: false, perfectResearch: false }
          })));
        }
        if (data.huntTimers)      setHuntTimers(data.huntTimers);
        if (data.lastCheckTimes)  setLastCheckTimes(data.lastCheckTimes);
        if (data.totalCheckTimes) setTotalCheckTimes(data.totalCheckTimes);
        if (data.huntIncrements)  setHuntIncrements(data.huntIncrements);
        if (data.mmoSettings) {
          if (data.mmoSettings.multiCheckEnabled !== undefined) setMultiCheckEnabled(data.mmoSettings.multiCheckEnabled);
          if (data.mmoSettings.legendColors) setLegendColors(data.mmoSettings.legendColors);
          if (data.mmoSettings.isSaveOrder !== undefined) setIsSaveOrder(data.mmoSettings.isSaveOrder);
          if (data.mmoSettings.showSecondWave !== undefined) setShowSecondWave(data.mmoSettings.showSecondWave);
          if (data.mmoSettings.showGhostChecks !== undefined) setShowGhostChecks(data.mmoSettings.showGhostChecks);
          if (data.mmoSettings.isAdvanced !== undefined) setIsAdvanced(data.mmoSettings.isAdvanced);
          if (data.mmoSettings.secondSpawn !== undefined) setSecondSpawn(data.mmoSettings.secondSpawn);
        }
        // Start all paused
        if (data.activeHunts?.length) {
          setPausedHunts(new Set(data.activeHunts.map(h => h.id)));
        }
      } catch { /* silently ignore */ }
    })();
  }, [username]);

  // ── Load profile (shiny charm) ────────────────────────────────────────────
  useEffect(() => {
    if (!username) return;
    profileAPI.getProfile()
      .then(p => setShinyCharmGames(p.shinyCharmGames || []))
      .catch(() => {});
  }, [username]);

  // Auto-set shiny charm when modifiers opened
  const hasCharmForLA = shinyCharmGames.includes("Legends Arceus");

  // Auto-check/uncheck shiny charm modifier when game is selected or shinyCharmGames changes (new hunt)
  useEffect(() => {
    if (huntDetails.game) {
      const shouldHaveCharm = shinyCharmGames.includes(huntDetails.game);
      setModifiers(prev => {
        let changed = false;
        const newModifiers = { ...prev };
        
        if (prev.shinyCharm !== shouldHaveCharm) {
          newModifiers.shinyCharm = shouldHaveCharm;
          changed = true;
        }
        
        if (huntDetails.game === "Legends Arceus" && shouldHaveCharm && !prev.researchLv10) {
          newModifiers.researchLv10 = true;
          changed = true;
        }
        
        return changed ? newModifiers : prev;
      });
    }
  }, [huntDetails.game, shinyCharmGames]);

  // Auto-check shiny charm modifier ONLY when user manually changes the game in edit modal
  useEffect(() => {
    // Skip if this is from the modal opening (not a manual game change)
    if (editModalJustOpenedRef.current) {
      editModalJustOpenedRef.current = false;
      prevEditGameRef.current = editForm.game;
      return;
    }

    // Only auto-check if the game actually changed (user action, not data load)
    if (prevEditGameRef.current !== editForm.game && editForm.game) {
      prevEditGameRef.current = editForm.game;

      // Only auto-check shiny charm if user has this game in their shiny charm list
      if (shinyCharmGames.includes(editForm.game)) {
        setEditForm(prev => {
          const newModifiers = { ...prev.modifiers, shinyCharm: true };
          if (editForm.game === "Legends Arceus") {
            newModifiers.researchLv10 = true;
          }
          return {
            ...prev,
            modifiers: newModifiers
          };
        });
      }
    }
  }, [editForm.game, shinyCharmGames]);

  // ── Body scroll lock while modal open ────────────────────────────────────
  useEffect(() => {
    const open = showPokemonModal || showHuntModal || resetModal.show ||
      deleteModal.show || completionModal.show || editModal.show || settingsModal.show;
    if (open) {
      const scrollY = window.scrollY;
      document.body.dataset.scrollY = scrollY;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      const saved = parseInt(document.body.dataset.scrollY || '0', 10);
      window.scrollTo(0, saved);
    }
  }, [showPokemonModal, showHuntModal, resetModal.show, deleteModal.show, completionModal.show, editModal.show, settingsModal.show]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleEditHunt = (huntId) => {
    const hunt = activeHunts.find(h => h.id === huntId);
    setEditModal({ show: true, hunt });
    // Mark that we're opening the modal (not a manual game change)
    editModalJustOpenedRef.current = true;
    setEditForm({
      game: hunt.game || '',
      method: hunt.method || '',
      pokemon: hunt.pokemon || null,
      modifiers: hunt.modifiers || {
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
    });
  };

  const handleEditConfirm = () => {
    if (!editModal.hunt) return;

    const huntId = editModal.hunt.id;

    // Calculate new odds based on the updated game, method, and modifiers
    const newOdds = editForm.game && editForm.method
      ? calculateOdds(editForm.game, editForm.method, editForm.modifiers)
      : null;

    // Update the hunt with new game, method, pokemon, modifiers, and recalculated odds
    const updatedActiveHunts = activeHunts.map(hunt =>
      hunt.id === huntId ? {
        ...hunt,
        game: editForm.game,
        method: editForm.method,
        pokemon: editForm.pokemon,
        modifiers: editForm.modifiers,
        odds: newOdds
      } : hunt
    );

    setActiveHunts(updatedActiveHunts);

    // Save immediately with the updated hunt data
    if (username) {
      const huntData = {
        activeHunts: updatedActiveHunts,
        huntTimers: Object.fromEntries(Object.entries(huntTimers)),
        lastCheckTimes: Object.fromEntries(Object.entries(lastCheckTimes)),
        totalCheckTimes: Object.fromEntries(Object.entries(totalCheckTimes)),
        pausedHunts: Array.from(pausedHunts),
        huntIncrements: Object.fromEntries(Object.entries(huntIncrements))
      };
      saveHuntData(huntData);
    }

    // Close modal with animation
    setEditModalClosing(true);
    setTimeout(() => {
      setEditModal({ show: false, hunt: null });
      setEditModalClosing(false);
      showMessage("Hunt updated", "success");
    }, 300);
  };

  const handleAddHunt = () => {
    setIsEditingPokemon(false);
    setSelectedPokemon(null);
    setEditForm({
      game: "Legends Arceus",
      method: "Permutations",
      odds: 4096,
      charms: 0,
      shinyCharm: false,
      lure: false,
      modifiers: {}
    });
    setHuntDetails({
      game: "Legends Arceus",
      method: "Permutations",
      modifiers: {}
    });
    setHuntModalClosing(false);
    setPokemonModalClosing(false);
    setBackdropClosing(false);
    setShowPokemonModal(true);
  };

  const handlePokemonSelect = (pokemon) => {
    if (pokemonModalClosing) return;
    setSelectedPokemon(pokemon);
    setPokemonModalClosing(true);
    setTimeout(() => {
      setShowPokemonModal(false);
      setPokemonModalClosing(false);
      setShowHuntModal(true);
    }, 280);
  };

  const handleStartHunt = () => {
    if (!selectedPokemon || huntModalClosing) return;

    // Calculate the odds for this hunt
    const huntOdds = huntDetails.game && huntDetails.method
      ? calculateOdds(huntDetails.game, huntDetails.method, modifiers)
      : null; // Use null to indicate no odds available

    const startTime = Date.now();
    const huntId = startTime;

    const newHunt = {
      id: huntId,
      pokemon: selectedPokemon,
      game: huntDetails.game,
      ball: huntDetails.ball,
      mark: huntDetails.mark,
      method: huntDetails.method,
      notes: huntDetails.notes,
      checks: 0,
      odds: huntOdds,
      startDate: new Date().toISOString(),
      startTime: startTime,
      increment: 1,
      modifiers: { ...modifiers } // Store modifiers with each hunt
    };

    const updatedActiveHunts = [...activeHunts, newHunt];
    const updatedHuntTimers = { ...huntTimers, [huntId]: startTime };
    const updatedLastCheckTimes = { ...lastCheckTimes, [huntId]: startTime };
    const updatedTotalCheckTimes = { ...totalCheckTimes, [huntId]: 0 };
    const updatedHuntIncrements = { ...huntIncrements, [huntId]: 1 };
    const updatedPausedHunts = new Set([...pausedHunts, huntId]);

    setActiveHunts(updatedActiveHunts);
    setHuntTimers(updatedHuntTimers);
    setLastCheckTimes(updatedLastCheckTimes);
    setTotalCheckTimes(updatedTotalCheckTimes);
    setHuntIncrements(updatedHuntIncrements);
    setPausedHunts(updatedPausedHunts);

    // Save immediately with updated state
    if (username) {
      const huntData = {
        activeHunts: updatedActiveHunts,
        huntTimers: Object.fromEntries(Object.entries(updatedHuntTimers).map(([k, v]) => [k, v])),
        lastCheckTimes: Object.fromEntries(Object.entries(updatedLastCheckTimes).map(([k, v]) => [k, v])),
        totalCheckTimes: Object.fromEntries(Object.entries(updatedTotalCheckTimes).map(([k, v]) => [k, v])),
        pausedHunts: Array.from(updatedPausedHunts),
        huntIncrements: Object.fromEntries(Object.entries(updatedHuntIncrements).map(([k, v]) => [k, v]))
      };
      saveHuntData(huntData);
    }

    // Close hunt modal with animation
    setHuntModalClosing(true);
    setBackdropClosing(true);
    setTimeout(() => {
      setShowHuntModal(false);
      setHuntModalClosing(false);
      setBackdropClosing(false);

      // Reset form states after animation completes
      setHuntDetails({
        game: "Legends Arceus",
        ball: "",
        mark: "",
        method: "Permutations",
        notes: ""
      });
      setModifiers({
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
      });
      setSelectedPokemon(null);
      showMessage("Hunt started!", "success");
    }, 300);
  };

  const handleAddCheck = useCallback((huntId) => {
    const now = Date.now();
    const isPaused = pausedHunts.has(huntId);
    const bottomTimerValue = currentBottomTimers[huntId] || 0;
    const timeToAdd = isPaused ? 0 : bottomTimerValue;
    const increment = huntIncrements[huntId] || 1;

    const updatedHunts = activeHunts.map(h =>
      h.id === huntId ? { ...h, checks: h.checks + increment } : h
    );
    const updatedLastCheck  = { ...lastCheckTimes,  [huntId]: now };
    const updatedTotalTimes = { ...totalCheckTimes, [huntId]: (totalCheckTimes[huntId] || 0) + timeToAdd };

    setActiveHunts(updatedHunts);
    setLastCheckTimes(updatedLastCheck);
    setTotalCheckTimes(updatedTotalTimes);

    if (username) {
      saveHuntData({
        activeHunts: updatedHunts,
        huntTimers: { ...huntTimers },
        lastCheckTimes: { ...updatedLastCheck },
        totalCheckTimes: { ...updatedTotalTimes },
        pausedHunts: Array.from(pausedHunts),
        huntIncrements: { ...huntIncrements },
      });
    }
  }, [activeHunts, pausedHunts, currentBottomTimers, huntIncrements, lastCheckTimes, totalCheckTimes, huntTimers, username, saveHuntData]);

  const handleChartConfigUpdate = useCallback((newConfig) => {
    if (!selectedHuntId) return;

    if (newConfig.isSaveOrder !== undefined) setIsSaveOrder(newConfig.isSaveOrder);
    if (newConfig.showSecondWave !== undefined) setShowSecondWave(newConfig.showSecondWave);
    if (newConfig.showGhostChecks !== undefined) setShowGhostChecks(newConfig.showGhostChecks);
    if (newConfig.isAdvanced !== undefined) setIsAdvanced(newConfig.isAdvanced);
    if (newConfig.secondSpawn !== undefined) setSecondSpawn(newConfig.secondSpawn);

    const updatedHunts = activeHunts.map(h => 
      h.id === selectedHuntId ? { ...h, chartConfig: newConfig } : h
    );
    setActiveHunts(updatedHunts);
    if (username) {
      saveHuntData({ activeHunts: updatedHunts, huntTimers: { ...huntTimers }, lastCheckTimes: { ...lastCheckTimes }, totalCheckTimes: { ...totalCheckTimes }, pausedHunts: Array.from(pausedHunts), huntIncrements: { ...huntIncrements } });
    }
  }, [selectedHuntId, activeHunts, huntTimers, lastCheckTimes, totalCheckTimes, pausedHunts, huntIncrements, username, saveHuntData]);

  const handleChartUpdate = useCallback((newChartData) => {
    if (!selectedHuntId) return;
    const updatedHunts = activeHunts.map(h => 
      h.id === selectedHuntId ? { ...h, chartData: newChartData } : h
    );
    setActiveHunts(updatedHunts);
    // Explicit save
    if (username) {
      saveHuntData({
        activeHunts: updatedHunts,
        huntTimers: { ...huntTimers },
        lastCheckTimes: { ...lastCheckTimes },
        totalCheckTimes: { ...totalCheckTimes },
        pausedHunts: Array.from(pausedHunts),
        huntIncrements: { ...huntIncrements },
      });
    }
  }, [selectedHuntId, activeHunts, huntTimers, lastCheckTimes, totalCheckTimes, pausedHunts, huntIncrements, username, saveHuntData]);

  const handleChartCheck = useCallback((isAdding) => {
    if (!selectedHuntId) return;
    const now = Date.now();
    const isPaused = pausedHunts.has(selectedHuntId);
    const bottomTimerValue = currentBottomTimers[selectedHuntId] || 0;
    const timeToAdd = isPaused ? 0 : bottomTimerValue;

    const activeHuntConfig = activeHunts.find(h => h.id === selectedHuntId)?.chartConfig || {};
    const currentSecondSpawn = activeHuntConfig.secondSpawn ?? 6;
    const incrementValue = multiCheckEnabled ? currentSecondSpawn : 1;

    const updatedHunts = activeHunts.map(h => {
      if (h.id !== selectedHuntId) return h;
      const newChecks = isAdding ? h.checks + incrementValue : Math.max(0, h.checks - incrementValue);
      return { ...h, checks: newChecks };
    });

    const updatedLastCheck = { ...lastCheckTimes, [selectedHuntId]: now };
    const updatedTotalTimes = { ...totalCheckTimes, [selectedHuntId]: (totalCheckTimes[selectedHuntId] || 0) + timeToAdd };

    setActiveHunts(updatedHunts);
    if (isAdding) {
      setLastCheckTimes(updatedLastCheck);
      setTotalCheckTimes(updatedTotalTimes);
    }

    if (username) {
      saveHuntData({
        activeHunts: updatedHunts,
        huntTimers: { ...huntTimers },
        lastCheckTimes: isAdding ? { ...updatedLastCheck } : { ...lastCheckTimes },
        totalCheckTimes: isAdding ? { ...updatedTotalTimes } : { ...totalCheckTimes },
        pausedHunts: Array.from(pausedHunts),
        huntIncrements: { ...huntIncrements },
      });
    }
  }, [selectedHuntId, activeHunts, pausedHunts, currentBottomTimers, lastCheckTimes, totalCheckTimes, huntTimers, username, saveHuntData, huntIncrements, multiCheckEnabled]);

  const handleDecreaseCheck = useCallback((huntId) => {
    const hunt = activeHunts.find(h => h.id === huntId);
    if (!hunt || hunt.checks <= 0) return;
    const increment = huntIncrements[huntId] || 1;
    const updatedHunts = activeHunts.map(h =>
      h.id === huntId ? { ...h, checks: Math.max(0, h.checks - increment) } : h
    );
    setActiveHunts(updatedHunts);
    if (username) {
      saveHuntData({
        activeHunts: updatedHunts,
        huntTimers: { ...huntTimers },
        lastCheckTimes: { ...lastCheckTimes },
        totalCheckTimes: { ...totalCheckTimes },
        pausedHunts: Array.from(pausedHunts),
        huntIncrements: { ...huntIncrements },
      });
    }
  }, [activeHunts, huntIncrements, huntTimers, lastCheckTimes, totalCheckTimes, pausedHunts, username, saveHuntData]);

  const handlePauseHunt = useCallback((huntId) => {
    const now = Date.now();
    const last = lastPauseAction.current[huntId];
    if (last && now - last < 500) return;
    lastPauseAction.current[huntId] = now;
    const wasPaused = pausedHunts.has(huntId);
    setPausedHunts(prev => {
      const s = new Set(prev);
      wasPaused ? s.delete(huntId) : s.add(huntId);
      return s;
    });
    showMessage(wasPaused ? "Hunt resumed" : "Hunt paused", "info");
  }, [pausedHunts, showMessage]);

  const handleResetHunt = (huntId) => {
    const hunt = activeHunts.find(h => h.id === huntId);
    setResetModal({ show: true, hunt });
  };

  const handleResetConfirm = () => {
    if (!resetModal.hunt) return;
    setResetModalClosing(true);
    setTimeout(() => {
      const now = Date.now();
      const huntId = resetModal.hunt.id;
      const updatedHunts      = activeHunts.map(h => h.id === huntId ? { ...h, checks: 0 } : h);
      const updatedLastCheck  = { ...lastCheckTimes,  [huntId]: now };
      const updatedTotalTimes = { ...totalCheckTimes, [huntId]: 0 };
      setActiveHunts(updatedHunts);
      setLastCheckTimes(updatedLastCheck);
      setTotalCheckTimes(updatedTotalTimes);
      setCurrentBottomTimers(p => ({ ...p, [huntId]: 0 }));
      if (username) {
        saveHuntData({
          activeHunts: updatedHunts,
          huntTimers: { ...huntTimers },
          lastCheckTimes: { ...updatedLastCheck },
          totalCheckTimes: { ...updatedTotalTimes },
          pausedHunts: Array.from(pausedHunts),
          huntIncrements: { ...huntIncrements },
        });
      }
      setResetModal({ show: false, hunt: null });
      setResetModalClosing(false);
      showMessage("Hunt reset", "info");
    }, 280);
  };

  const handleDeleteHunt = (huntId) => {
    const hunt = activeHunts.find(h => h.id === huntId);
    setDeleteModal({ show: true, hunt });
  };

  const handleDeleteConfirm = () => {
    if (!deleteModal.hunt) return;
    const huntId = deleteModal.hunt.id;

    const updatedHunts      = activeHunts.filter(h => h.id !== huntId);
    const updatedLastCheck  = { ...lastCheckTimes };  delete updatedLastCheck[huntId];
    const updatedTotalTimes = { ...totalCheckTimes }; delete updatedTotalTimes[huntId];
    const updatedTimers     = { ...huntTimers };       delete updatedTimers[huntId];
    const updatedIncrements = { ...huntIncrements };   delete updatedIncrements[huntId];
    const updatedPaused     = new Set(pausedHunts);    updatedPaused.delete(huntId);

    setActiveHunts(updatedHunts);
    setLastCheckTimes(updatedLastCheck);
    setTotalCheckTimes(updatedTotalTimes);
    setHuntTimers(updatedTimers);
    setHuntIncrements(updatedIncrements);
    setPausedHunts(updatedPaused);
    setCurrentBottomTimers(p => { const n = { ...p }; delete n[huntId]; return n; });

    if (username) {
      saveHuntData({
        activeHunts: updatedHunts,
        huntTimers: updatedTimers,
        lastCheckTimes: updatedLastCheck,
        totalCheckTimes: updatedTotalTimes,
        pausedHunts: Array.from(updatedPaused),
        huntIncrements: updatedIncrements,
      });
    }

    setDeleteModalClosing(true);
    setTimeout(() => {
      setDeleteModal({ show: false, hunt: null });
      setDeleteModalClosing(false);
      showMessage("Hunt deleted", "info");
    }, 280);
  };

  const handleSettingsHunt = (huntId) => {
    const hunt = activeHunts.find(h => h.id === huntId);
    setSettingsModal({ show: true, hunt });
    setSettingsForm({
      manualChecks: hunt.checks.toString(),
      manualTotalTime: formatTime(totalCheckTimes[huntId] || 0),
      manualIncrements: (huntIncrements[huntId] || 1).toString(),
    });
  };

  const handleSettingsConfirm = () => {
    if (!settingsModal.hunt) return;
    const huntId = settingsModal.hunt.id;
    const newChecks = parseInt(settingsForm.manualChecks) || 0;
    const timeStr = settingsForm.manualTotalTime;
    let totalMs = 0;
    if (timeStr) {
      const h = (timeStr.match(/(\d+)h/) || [0,0])[1];
      const m = (timeStr.match(/(\d+)m/) || [0,0])[1];
      const s = (timeStr.match(/(\d+)s/) || [0,0])[1];
      totalMs = (parseInt(h)*3600 + parseInt(m)*60 + parseInt(s)) * 1000;
    }
    const newIncrements = parseInt(settingsForm.manualIncrements) || 1;

    const updatedHunts      = activeHunts.map(h => h.id === huntId ? { ...h, checks: newChecks } : h);
    const updatedTotalTimes = { ...totalCheckTimes, [huntId]: totalMs };
    const updatedIncrements = { ...huntIncrements,  [huntId]: newIncrements };

    setActiveHunts(updatedHunts);
    setTotalCheckTimes(updatedTotalTimes);
    setHuntIncrements(updatedIncrements);

    if (username) {
      saveHuntData({
        activeHunts: updatedHunts,
        huntTimers: { ...huntTimers },
        lastCheckTimes: { ...lastCheckTimes },
        totalCheckTimes: updatedTotalTimes,
        pausedHunts: Array.from(pausedHunts),
        huntIncrements: updatedIncrements,
      });
    }

    setSettingsModalClosing(true);
    setTimeout(() => {
      setSettingsModal({ show: false, hunt: null });
      setSettingsModalClosing(false);
      showMessage("Hunt settings updated", "success");
    }, 280);
  };

  const handleCompleteHunt = (hunt) => {
    setCompletionModal({ show: true, hunt });
    setCompletionForm({ ball: hunt.ball || '', mark: hunt.mark || '', notes: hunt.notes || '' });
  };

  const handleCompletionConfirm = async () => {
    if (!completionModal.hunt) return;
    const validation = validateContent(String(completionForm.notes || ''), 'notes');
    if (!validation.isValid) return;

    const hunt = activeHunts.find(h => h.id === completionModal.hunt.id);
    if (!hunt) { showMessage('Hunt not found', 'error'); return; }

    let workingPokemon = hunt.pokemon;
    if (!workingPokemon.stableId) {
      const full = allPokemon.find(p => p.id === workingPokemon.id && p.name === workingPokemon.name);
      if (full?.stableId) workingPokemon = { ...workingPokemon, stableId: full.stableId };
      else { showMessage('Error: Could not determine stable ID', 'error'); return; }
    }

    const caughtEntry = {
      date: new Date().toISOString().split('T')[0],
      ball: completionForm.ball || "",
      mark: completionForm.mark || "",
      game: hunt.game,
      method: hunt.method,
      checks: hunt.checks || "",
      time: totalCheckTimes[hunt.id] || 0,
      notes: completionForm.notes || "",
      entryId: Math.random().toString(36).substr(2, 9),
      modifiers: hunt.modifiers || {},
      isHuntTracker: true,
      ...(hunt.method === "Permutations" && {
        chartData: hunt.chartData || {},
        chartConfig: {
          firstSpawn: hunt.chartConfig?.firstSpawn ?? 8,
          secondSpawn: hunt.chartConfig?.secondSpawn ?? secondSpawn,
          isAdvanced,
          isSaveOrder,
          showSecondWave,
          showGhostChecks,
          legendColors: legendColors
        }
      })
    };

    const caughtKey = getCaughtKey(workingPokemon, null, true);

    try {
      const { fetchCaughtData, updateCaughtData } = await import('../api/caught');
      const existing = await fetchCaughtData(username);
      const existingInfo = existing[caughtKey] || null;

      const updatedInfo = existingInfo?.entries
        ? { ...existingInfo, caught: true, caughtAt: Date.now(), entries: [...existingInfo.entries, caughtEntry] }
        : { caught: true, caughtAt: Date.now(), entries: [caughtEntry] };

      await updateCaughtData(username, caughtKey, updatedInfo);
      window.dispatchEvent(new CustomEvent('caughtDataChanged', {
        detail: { pokemon: workingPokemon, caughtInfo: updatedInfo, caughtKey }
      }));
    } catch {
      showMessage('Failed to save to collection', 'error');
      return;
    }

    const huntId = hunt.id;
    const updatedHunts      = activeHunts.filter(h => h.id !== huntId);
    const updatedLastCheck  = { ...lastCheckTimes };  delete updatedLastCheck[huntId];
    const updatedTotalTimes = { ...totalCheckTimes }; delete updatedTotalTimes[huntId];
    const updatedTimers     = { ...huntTimers };       delete updatedTimers[huntId];
    const updatedIncrements = { ...huntIncrements };   delete updatedIncrements[huntId];
    const updatedPaused     = new Set(pausedHunts);    updatedPaused.delete(huntId);

    setActiveHunts(updatedHunts);
    setLastCheckTimes(updatedLastCheck);
    setTotalCheckTimes(updatedTotalTimes);
    setHuntTimers(updatedTimers);
    setHuntIncrements(updatedIncrements);
    setPausedHunts(updatedPaused);

    if (username) {
      saveHuntData({
        activeHunts: updatedHunts,
        huntTimers: updatedTimers,
        lastCheckTimes: updatedLastCheck,
        totalCheckTimes: updatedTotalTimes,
        pausedHunts: Array.from(updatedPaused),
        huntIncrements: updatedIncrements,
      });
    }

    setCompletionModalClosing(true);
    setTimeout(() => {
      setCompletionForm({ ball: '', mark: '', notes: '' });
      showMessage(`${formatPokemonName(hunt.pokemon.name)} caught and added to collection!`, "success");
      setCompletionModal({ show: false, hunt: null });
      setCompletionModalClosing(false);
    }, 280);
  };

  const handleInfoHunt = (huntId) => {
    setExpandedHunts(prev => {
      const s = new Set(prev);
      s.has(huntId) ? s.delete(huntId) : s.add(huntId);
      return s;
    });
  };

  const handleBottomTimerUpdate = useCallback((huntId, ms) => {
    setCurrentBottomTimers(p => ({ ...p, [huntId]: ms }));
  }, []);

  // ── Computed odds for new hunt modal ──────────────────────────────────────
  const newHuntOdds = useMemo(() =>
    calculateOdds("Legends Arceus", "Permutations", modifiers),
    [modifiers]
  );

  // ── Ball options for completion (Hisui only) ──────────────────────────────
  const hisuiBalls = BALL_OPTIONS.filter(b => b.value === "" || HISUIAN_BALLS.includes(b.value));

  // Get all available games (use GAME_OPTIONS with images)
  const allGames = useMemo(() => {
    return GAME_OPTIONS;
  }, []);

  // Get modifiers for the selected game
  const gameModifiers = useMemo(() => {
    if (!huntDetails.game) return [];
    return getModifiersForGame(huntDetails.game);
  }, [huntDetails.game]);

  // Get methods for the selected game
  const availableMethods = useMemo(() => {
    if (!huntDetails.game) return [];
    return getMethodsForGame(huntDetails.game);
  }, [huntDetails.game]);


  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="container page-container mmo-page">
        {/* MMO Tool Header */}
        <div className="mmo-header">
          <div className="mmo-title-block">
            <h1 className="mmo-page-title">
              MMO Tool
            </h1>
          </div>
        </div>

        <div className="app-divider" />

        <div className="mmo-section-header">
          <div className="mmo-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              Active Permutation Hunts
              <span className="mmo-section-count">{permutationHunts.length}</span>
            </div>
            <label className="modifier-checkbox" style={{ fontSize: '0.9rem', margin: 0, padding: '4px 10px', backgroundColor: 'var(--bg-color)', borderRadius: '6px' }}>
              <input
                type="checkbox"
                checked={multiCheckEnabled}
                onChange={(e) => setMultiCheckEnabled(e.target.checked)}
              />
              +{activeHunts.find(h => h.id === selectedHuntId)?.chartConfig?.secondSpawn ?? 6} Checks per Chart Click
            </label>
          </div>
        </div>

        <div className={`hunts-grid ${selectedHuntId ? 'single-hunt-active' : ''}`}>
          {permutationHunts
            .filter(hunt => !selectedHuntId || hunt.id === selectedHuntId)
            .map(hunt => (
            <div key={hunt.id} className="hunt-card" style={{ position: 'relative' }}>
              <div className="hunt-header">
                {!expandedHunts.has(hunt.id) ? (
                  <>
                    <div className="hunt-pokemon">
                      <img
                        src={getPokemonImage(hunt.pokemon) || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${hunt.pokemon.id}.png`}
                        alt={formatPokemonName(hunt.pokemon.name)}
                        className="hunt-pokemon-image"
                      />
                      <div className="hunt-pokemon-info">
                        <h3>{formatPokemonName(hunt.pokemon.name)}</h3>
                        {hunt.pokemon.formType && hunt.pokemon.formType !== "main" && (
                          <div className="hunt-pokemon-form">
                            {hunt.pokemon.formType === "alpha" || hunt.pokemon.formType === "alphaother"
                              ? "Alpha"
                              : hunt.pokemon.formType === "gmax"
                                ? "Gigantamax"
                                : hunt.pokemon.formType === "alolan"
                                  ? "Alolan"
                                  : hunt.pokemon.formType === "galarian"
                                    ? "Galarian"
                                    : hunt.pokemon.formType === "hisuian"
                                      ? "Hisuian"
                                      : hunt.pokemon.formType === "paldean"
                                        ? "Paldean"
                                        : hunt.pokemon.formType === "mega"
                                          ? "Mega"
                                          : hunt.pokemon.formType === "primal"
                                            ? "Primal"
                                            : hunt.pokemon.formType === "gender"
                                              ? "Gender"
                                              : hunt.pokemon.formType === "therian"
                                                ? "Therian"
                                                : hunt.pokemon.formType === "ash-cap" || hunt.pokemon.formType === "partner-cap"
                                                  ? "Partner Cap"
                                                  : hunt.pokemon.formType}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="hunt-actions">
                      <button
                        onClick={() => handleResetHunt(hunt.id)}
                        className="hunt-reset-btn"
                        title="Reset hunt"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteHunt(hunt.id)}
                        className="hunt-delete-btn"
                        title="Delete hunt"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => handleSettingsHunt(hunt.id)}
                        className="hunt-settings-btn"
                        title="Hunt settings"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        onClick={() => handleInfoHunt(hunt.id)}
                        className="hunt-info-btn"
                        title="Show hunt details"
                      >
                        <Info size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hunt-details">
                      <div className="hunt-detail-item">Game: {hunt.game || "NA"}</div>
                      <div className="hunt-detail-item">Method: {hunt.method || "NA"}</div>
                    </div>
                    <div className="hunt-actions expanded-view">
                      <button
                        onClick={() => handleEditHunt(hunt.id)}
                        className="hunt-edit-btn"
                        title="Edit hunt"
                        style={{ gridColumn: '2', gridRow: '1' }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleInfoHunt(hunt.id)}
                        className="hunt-info-btn"
                        title="Hide hunt details"
                        style={{ gridColumn: '2', gridRow: '2' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="hunt-checks">
                <div className="checks-display">
                  <span className="checks-count">{hunt.checks}</span>
                </div>
                <div className="timer-display">
                  <div className="total-time">
                    {formatTime(totalCheckTimes[hunt.id] || 0)}
                  </div>
                  <div className="last-check-time">
                    <TimerDisplay
                      huntId={hunt.id}
                      lastCheckTime={lastCheckTimes[hunt.id] || huntTimers[hunt.id]}
                      isPaused={pausedHunts.has(hunt.id)}
                      onTimeUpdate={handleBottomTimerUpdate}
                    />
                  </div>
                </div>
                <div className="checks-buttons">
                  <button
                    onClick={() => handlePauseHunt(hunt.id)}
                    className="pause-btn"
                    title={pausedHunts.has(hunt.id) ? "Resume hunt" : "Pause hunt"}
                  >
                    {pausedHunts.has(hunt.id) ? <Play size={16} /> : <Pause size={16} />}
                  </button>
                  <button
                    onClick={() => handleDecreaseCheck(hunt.id)}
                    className="decrease-check-btn"
                    title="Decrease check"
                    disabled={hunt.checks <= 0}
                  >
                    <Minus size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedHuntId(selectedHuntId === hunt.id ? null : hunt.id)}
                    className="pause-btn"
                    title={selectedHuntId === hunt.id ? "Unlink from Chart" : "Link to Chart"}
                    style={{
                      backgroundColor: selectedHuntId === hunt.id ? '#ff4444' : undefined,
                      borderColor: selectedHuntId === hunt.id ? '#ff4444' : undefined
                    }}
                  >
                    {selectedHuntId === hunt.id ? <X size={16} strokeWidth={3} color="#ffffff" /> : <Check size={16} strokeWidth={3} />}
                  </button>
                </div>
              </div>

              <div className="hunt-complete">
                <div className="hunt-odds-display">
                  <span className="odds-label">Odds:</span>
                  <span className="odds-value">
                    1/{hunt.odds || 4096}
                  </span>
                </div>
                <button
                  className="complete-hunt-btn"
                  onClick={() => handleCompleteHunt(hunt)}
                  title="Mark as caught"
                >
                  <Check size={20} />
                  Complete Hunt
                </button>
              </div>
            </div>
          ))}

          {/* ─ Add Hunt Card ─ */}
          {!selectedHuntId && (
          <div className="add-hunt-card" onClick={handleAddHunt}>
            <div className="add-hunt-content">
              <div className="add-hunt-icon">
                <Plus size={32} />
              </div>
              <h3>Start New Hunt</h3>
            </div>
          </div>
          )}
        </div>

        {permutationHunts.length === 0 && (
          <div style={{
            marginTop: '3rem',
            marginBottom: '2rem',
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--card-background)',
            border: '2px dashed var(--border-color)',
            borderRadius: '16px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}>
            <p style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              color: 'var(--text)',
              margin: 0,
              letterSpacing: '0.5px'
            }}>
              No active permutation hunts - click the card above to start one!
            </p>
          </div>
        )}

        {permutationHunts.length > 0 && !selectedHuntId && (
          <div style={{
            marginTop: '3rem',
            marginBottom: '2rem',
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--card-background)',
            border: '2px dashed var(--border-color)',
            borderRadius: '16px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}>
            <p style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              color: 'var(--text)',
              margin: 0,
              letterSpacing: '0.5px'
            }}>
              Select a hunt to show the permutation chart
            </p>
          </div>
        )}

        {/* ── Permutation Table ─────────────────────────────────── */}
        {selectedHuntId && (() => {
          const selectedHunt = activeHunts.find(h => h.id === selectedHuntId);
          return (
            <div className="mmo-graph-section">
              <PermutationTable 
                chartData={selectedHunt?.chartData || {}} 
                chartConfig={{
                  firstSpawn: selectedHunt?.chartConfig?.firstSpawn ?? 8,
                  secondSpawn: selectedHunt?.chartConfig?.secondSpawn ?? secondSpawn,
                  isAdvanced: isAdvanced,
                  isSaveOrder: isSaveOrder,
                  showSecondWave: showSecondWave,
                  showGhostChecks: showGhostChecks
                }}
                legendColors={legendColors}
                setLegendColors={setLegendColors}
                onChartUpdate={handleChartUpdate} 
                onChartConfigUpdate={handleChartConfigUpdate}
                onChartCheck={handleChartCheck} />
            </div>
          );
        })()}

      </div>

      {/* Combined Modal Backdrop - Persistent between Pokemon and Hunt modals */}
      {((showPokemonModal || pokemonModalClosing) || (showHuntModal || huntModalClosing) || backdropClosing) && (
        <div
          className={`pokemon-modal-backdrop ${backdropClosing ? 'closing' : ''}`}
        >
          {/* Pokemon Selection Modal */}
          {(showPokemonModal || pokemonModalClosing) && (
            <div className={`pokemon-modal ${pokemonModalClosing ? 'closing' : ''}`}>
              <div className="pokemon-modal-header">
                <h2>Select Pokemon to Hunt</h2>
                <button
                  onClick={() => {
                    if (!pokemonModalClosing) {
                      setPokemonModalClosing(true);
                      setBackdropClosing(true);
                      setIsEditingPokemon(false); // Reset editing state when closing modal
                      setTimeout(() => {
                        setShowPokemonModal(false);
                        setPokemonModalClosing(false);
                        setBackdropClosing(false);
                      }, 300);
                    }
                  }}
                  className="close-btn"
                  aria-label="Close"
                >
                  <span className="sidebar-close-icon">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" fill="#fff" stroke="#232323" strokeWidth="2" />
                      <path d="M2 20a18 18 0 0 1 36 0" fill="#e62829" stroke="#232323" strokeWidth="2" />
                      <rect x="2" y="19" width="36" height="2" fill="#232323" />
                      <circle cx="20" cy="20" r="7" fill="#ffffffff" stroke="#232323" strokeWidth="2" />
                      <circle cx="20" cy="20" r="3.5" fill="#fff" stroke="#232323" strokeWidth="1.5" />
                    </svg>
                  </span>
                </button>
              </div>

              <div className="pokemon-modal-content">
                <div className="pokemon-modal-search-row">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search Pokemon..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 transition-colors"
                        style={{ color: 'var(--accent)' }}
                        onMouseEnter={(e) => {
                          e.target.style.color = 'var(--text)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = 'var(--accent)';
                        }}
                        onClick={() => setSearchTerm("")}
                        title="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="pokemon-grid">
                  {filteredPokemon.map((pokemon, index) => (
                    <button
                      key={`pokemon-${pokemon?.id || 'unknown'}-${pokemon?.name || 'unknown'}-${pokemon?.formType || 'main'}-${index}`}
                      type="button"
                      className="pokemon-item"
                      onClick={() => handlePokemonSelect(pokemon)}
                    >
                      <img
                        src={getPokemonImage(pokemon)}
                        alt={formatPokemonName(String(pokemon?.name || ''))}
                        className="pokemon-img"
                      />
                      <div className="pokemon-text-container">
                        <div className="pokemon-label">
                          {pokemon?.name && pokemon.name === "unown"
                            ? "Unown A" // Main Unown is Unown A
                            : (pokemon?.name && pokemon.name === "unown-alpha")
                              ? "Unown A" // Alpha Unown A
                              : (pokemon?.formType && pokemon.formType !== "main" && pokemon.name && pokemon.name.includes('unown-'))
                                ? `Unown ${pokemon.name.split('-')[1].toUpperCase()}` // Show "Unown B", "Unown C", etc.
                                : (pokemon?.formType && pokemon.formType !== "main")
                                  ? formatPokemonName(String(pokemon?.name || '').split('-')[0])
                                  : formatPokemonName(String(pokemon?.name || ''))}
                        </div>
                        {pokemon?.formType && pokemon.formType !== "main" && (
                          <div className="pokemon-form">
                            {String(pokemon.formType) === "alpha" ? "Alpha" :
                              String(pokemon.formType) === "alphaother" ? "Alpha Forms" :
                                (pokemon.name && pokemon.name.toLowerCase().includes('-alpha')) ? "Alpha" :
                                  String(pokemon.formType) === "hisuian" ? "Hisuian" :
                                    String(pokemon.formType) === "galarian" ? "Galarian" :
                                      String(pokemon.formType) === "alolan" ? "Alolan" :
                                        String(pokemon.formType) === "paldean" ? "Paldean" :
                                          String(pokemon.formType) === "gmax" ? "Gigantamax" :
                                            String(pokemon.formType) === "gender" ? "Gender" :
                                              String(pokemon.formType) === "unown" ? "Unown" :
                                                String(pokemon.formType) === "other" ? "Other" :
                                                  String(pokemon.formType) === "alcremie" ? "Alcremie" :
                                                    String(pokemon.formType) === "vivillon" ? "Vivillon" :
                                                      String(pokemon.formType)}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pokemon-modal-footer">
              </div>
            </div>
          )}

          {/* Hunt Details Modal */}
          {(showHuntModal || huntModalClosing) && selectedPokemon && (
            <div
              className={`hunt-modal ${huntModalClosing ? 'closing' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="hunt-modal-header">
                <div className="hunt-pokemon-info">
                  <div className="hunt-pokemon-image-container">
                    <img
                      src={getPokemonImage(selectedPokemon)}
                      alt={formatPokemonName(selectedPokemon.name)}
                      className="hunt-pokemon-image"
                    />
                  </div>
                  <div className="hunt-pokemon-details">
                    <h2 className="hunt-pokemon-name">{formatPokemonName(selectedPokemon.name)}</h2>
                    <p className="hunt-pokemon-number">#{selectedPokemon.id ? selectedPokemon.id.toString().padStart(4, "0") : "????"}</p>
                    {selectedPokemon?.formType && selectedPokemon.formType !== "main" && (
                      <p className="hunt-pokemon-form">
                        {String(selectedPokemon.formType) === "alpha" ? "Alpha" :
                          String(selectedPokemon.formType) === "alphaother" ? "Alpha Forms" :
                            (selectedPokemon.name && selectedPokemon.name.toLowerCase().includes('-alpha')) ? "Alpha" :
                              String(selectedPokemon.formType) === "hisuian" ? "Hisuian" :
                                String(selectedPokemon.formType) === "galarian" ? "Galarian" :
                                  String(selectedPokemon.formType) === "alolan" ? "Alolan" :
                                    String(selectedPokemon.formType) === "paldean" ? "Paldean" :
                                      String(selectedPokemon.formType) === "gmax" ? "Gigantamax" :
                                        String(selectedPokemon.formType) === "gender" ? "Gender" :
                                          String(selectedPokemon.formType) === "partner-cap" ? "Partner Cap" :
                                            String(selectedPokemon.formType) === "level-100" ? "Level 100" :
                                              String(selectedPokemon.formType) === "therian" ? "Therian" :
                                                String(selectedPokemon.formType) === "unown" ? "Unown" :
                                                  String(selectedPokemon.formType)}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!huntModalClosing) {
                      setHuntModalClosing(true);
                      setBackdropClosing(true);
                      setTimeout(() => {
                        setShowHuntModal(false);
                        setHuntModalClosing(false);
                        setBackdropClosing(false);
                      }, 300);
                    }
                  }}
                  className="close-btn"
                  aria-label="Close"
                >
                  <span className="sidebar-close-icon">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" fill="#fff" stroke="#232323" strokeWidth="2" />
                      <path d="M2 20a18 18 0 0 1 36 0" fill="#e62829" stroke="#232323" strokeWidth="2" />
                      <rect x="2" y="19" width="36" height="2" fill="#232323" />
                      <circle cx="20" cy="20" r="7" fill="#ffffffff" stroke="#232323" strokeWidth="2" />
                    </svg>
                  </span>
                </button>
              </div>

              <div className="hunt-modal-content">
                <div className="hunt-form">
                  <div className="hunt-form-group">
                    <label className="hunt-label">Game:</label>
                    <SearchbarIconDropdown
                      id="hunt-game-dropdown"
                      options={allGames}
                      value={huntDetails.game}
                      onChange={val => setHuntDetails(prev => ({ ...prev, game: val, method: "" }))}
                      placeholder="Select a game..."
                      customBackground="var(--sidebar-edit-inputs)"
                      customBorder="var(--border-color)"
                    disabled={true}
                    hideClearButton={true}
                  />
                  </div>

                  <div className="hunt-form-group">
                    <label className="hunt-label">Method:</label>
                    <SearchbarIconDropdown
                      id="hunt-method-dropdown"
                      options={[
                        { name: "None", value: "" },
                        ...availableMethods.map(method => ({
                          name: method.name,
                          value: method.name
                        })),
                      ]}
                      value={huntDetails.method}
                      onChange={val => {
                        setHuntDetails(prev => ({ ...prev, method: val }));
                        // Clear modifiers when method changes
                        if (val !== "Breeding") {
                          setModifiers(prev => ({ ...prev, shinyParents: false }));
                        }
                        if (val !== "Catch Combo" && val !== "Random Encounters" && val !== "Soft Resets") {
                          setModifiers(prev => ({ ...prev, lureActive: false }));
                        }
                        // For Sandwich method: automatically set Sparkling Lv 3
                        if (val === "Sandwich" && (huntDetails.game === "Scarlet" || huntDetails.game === "Violet")) {
                          setModifiers(prev => ({
                            ...prev,
                            sparklingLv1: false,
                            sparklingLv2: false,
                            sparklingLv3: true
                          }));
                        }
                      }}
                      placeholder={huntDetails.game ? "Select a method..." : "Select a game first"}
                      customBackground="var(--sidebar-edit-inputs)"
                      customBorder="var(--border-color)"
                      disabled={true}
                      hideClearButton={true}
                    />
                  </div>

                  {/* Modifiers Section */}
                  {huntDetails.game && availableMethods.length > 0 && (
                    (gameModifiers["Shiny Charm"] > 0 && !(huntDetails.method === "Fossil Revivals" && (huntDetails.game === "Let's Go Pikachu" || huntDetails.game === "Let's Go Eevee" || huntDetails.game === "Sword" || huntDetails.game === "Shield")) && !(huntDetails.method === "Fossil Revivals" && huntDetails.game === "Legends Z-A") && !(huntDetails.method === "Dynamax Raids" && (huntDetails.game === "Sword" || huntDetails.game === "Shield")) && !(huntDetails.method === "Gift Pokemon" && (huntDetails.game === "Sword" || huntDetails.game === "Shield" || huntDetails.game === "Let's Go Eevee" || huntDetails.game === "Let's Go Pikachu")) && !(huntDetails.method === "Tera Raids" && (huntDetails.game === "Scarlet" || huntDetails.game === "Violet")) && !((huntDetails.method === "Random Encounters" || huntDetails.method === "Poke Radar" || huntDetails.method === "Soft Resets" || huntDetails.method === "Fossil Revivals" || huntDetails.method === "Gift Pokemon" || huntDetails.method === "Underground Diglett Hunt") && (huntDetails.game === "Brilliant Diamond" || huntDetails.game === "Shining Pearl")) && !(huntDetails.method === "Poke Radar" && (huntDetails.game === "X" || huntDetails.game === "Y")) && !(huntDetails.method === "Ultra Wormholes" && (huntDetails.game === "Ultra Sun" || huntDetails.game === "Ultra Moon"))) ||
                    (gameModifiers["Shiny Parents"] > 0 && huntDetails.method === "Breeding") ||
                    (gameModifiers["Lure Active"] > 0 && (huntDetails.method === "Catch Combo" || huntDetails.method === "Random Encounters" || (huntDetails.method === "Soft Resets" && huntDetails.game !== "Let's Go Pikachu" && huntDetails.game !== "Let's Go Eevee"))) ||
                    (gameModifiers["Research Lv 10"] > 0 && huntDetails.game === "Legends Arceus") ||
                    (gameModifiers["Perfect Research"] > 0 && huntDetails.game === "Legends Arceus") ||
                    (gameModifiers["Sparkling Lv 1"] > 0 && ((huntDetails.game === "Scarlet" || huntDetails.game === "Violet") && (huntDetails.method === "Random Encounters" || huntDetails.method === "Mass Outbreaks" || huntDetails.method === "Sandwich") || (huntDetails.game === "Legends Z-A" && huntDetails.method === "Hyperspaces"))) ||
                    (gameModifiers["Sparkling Lv 2"] > 0 && ((huntDetails.game === "Scarlet" || huntDetails.game === "Violet") && (huntDetails.method === "Random Encounters" || huntDetails.method === "Mass Outbreaks" || huntDetails.method === "Sandwich") || (huntDetails.game === "Legends Z-A" && huntDetails.method === "Hyperspaces"))) ||
                    (gameModifiers["Sparkling Lv 3"] > 0 && ((huntDetails.game === "Scarlet" || huntDetails.game === "Violet") && (huntDetails.method === "Random Encounters" || huntDetails.method === "Mass Outbreaks" || huntDetails.method === "Sandwich") || (huntDetails.game === "Legends Z-A" && huntDetails.method === "Hyperspaces"))) ||
                    (gameModifiers["Event Boosted"] > 0 && (huntDetails.game === "Scarlet" || huntDetails.game === "Violet") && huntDetails.method === "Mass Outbreaks") ||
                    (gameModifiers["Community Day"] > 0 && huntDetails.game === "GO" && (huntDetails.method === "Random Encounters" || huntDetails.method === "Daily Adventure Incense")) ||
                    (gameModifiers["Raid Day"] > 0 && huntDetails.game === "GO" && huntDetails.method === "Raid Battles") ||
                    (gameModifiers["Research Day"] > 0 && huntDetails.game === "GO" && huntDetails.method === "Field Research") ||
                    (gameModifiers["Galar Birds"] > 0 && huntDetails.game === "GO" && huntDetails.method === "Daily Adventure Incense") ||
                    (gameModifiers["Hatch Day"] > 0 && huntDetails.game === "GO" && huntDetails.method === "Breeding")
                  ) && (
                      <div className="hunt-form-group">
                        <label className="hunt-label">Modifiers:</label>
                        <div className="modifiers-section">
                          {gameModifiers["Shiny Charm"] > 0 && !(huntDetails.method === "Fossil Revivals" && (huntDetails.game === "Let's Go Pikachu" || huntDetails.game === "Let's Go Eevee" || huntDetails.game === "Sword" || huntDetails.game === "Shield")) && !(huntDetails.method === "Fossil Revivals" && huntDetails.game === "Legends Z-A") && !(huntDetails.method === "Dynamax Raids" && (huntDetails.game === "Sword" || huntDetails.game === "Shield")) && !(huntDetails.method === "Gift Pokemon" && (huntDetails.game === "Sword" || huntDetails.game === "Shield" || huntDetails.game === "Let's Go Eevee" || huntDetails.game === "Let's Go Pikachu")) && !(huntDetails.method === "Tera Raids" && (huntDetails.game === "Scarlet" || huntDetails.game === "Violet")) && !((huntDetails.method === "Random Encounters" || huntDetails.method === "Poke Radar" || huntDetails.method === "Soft Resets" || huntDetails.method === "Fossil Revivals" || huntDetails.method === "Gift Pokemon" || huntDetails.method === "Underground Diglett Hunt") && (huntDetails.game === "Brilliant Diamond" || huntDetails.game === "Shining Pearl")) && !(huntDetails.method === "Poke Radar" && (huntDetails.game === "X" || huntDetails.game === "Y")) && !(huntDetails.method === "Ultra Wormholes" && (huntDetails.game === "Ultra Sun" || huntDetails.game === "Ultra Moon")) && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={modifiers.shinyCharm}
                                onChange={(e) => {
                                  const newShinyCharm = e.target.checked;
                                  setModifiers(prev => {
                                    const newModifiers = { ...prev, shinyCharm: newShinyCharm };
                                    // Auto-check Research Lv 10 when Shiny Charm is checked in Legends Arceus
                                    if (newShinyCharm && huntDetails.game === "Legends Arceus" && !prev.researchLv10) {
                                      newModifiers.researchLv10 = true;
                                    }
                                    return newModifiers;
                                  });
                                }}
                              />
                              <span>Shiny Charm</span>
                            </label>
                          )}
                          {gameModifiers["Shiny Parents"] > 0 && huntDetails.method === "Breeding" && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={modifiers.shinyParents}
                                onChange={(e) => setModifiers(prev => ({ ...prev, shinyParents: e.target.checked }))}
                              />
                              <span>Shiny Parents</span>
                            </label>
                          )}
                          {gameModifiers["Lure Active"] > 0 && (huntDetails.method === "Catch Combo" || huntDetails.method === "Random Encounters" || (huntDetails.method === "Soft Resets" && huntDetails.game !== "Let's Go Pikachu" && huntDetails.game !== "Let's Go Eevee")) && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={modifiers.lureActive}
                                onChange={(e) => setModifiers(prev => ({ ...prev, lureActive: e.target.checked }))}
                              />
                              <span>Lure Active</span>
                            </label>
                          )}
                          {gameModifiers["Research Lv 10"] > 0 && huntDetails.game === "Legends Arceus" && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={modifiers.researchLv10}
                                onChange={(e) => {
                                  const newResearchLv10 = e.target.checked;
                                  setModifiers(prev => {
                                    const newModifiers = { ...prev, researchLv10: newResearchLv10 };
                                    // Auto-uncheck Shiny Charm and Perfect Research when Research Lv 10 is unchecked in Legends Arceus
                                    if (!newResearchLv10 && huntDetails.game === "Legends Arceus") {
                                      if (prev.shinyCharm) {
                                        newModifiers.shinyCharm = false;
                                      }
                                      if (prev.perfectResearch) {
                                        newModifiers.perfectResearch = false;
                                      }
                                    }
                                    return newModifiers;
                                  });
                                }}
                              />
                              <span>Research Lv 10</span>
                            </label>
                          )}
                          {gameModifiers["Perfect Research"] > 0 && huntDetails.game === "Legends Arceus" && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={modifiers.perfectResearch}
                                onChange={(e) => {
                                  const newPerfectResearch = e.target.checked;
                                  setModifiers(prev => {
                                    const newModifiers = { ...prev, perfectResearch: newPerfectResearch };
                                    // Auto-check Research Lv 10 when Perfect Research is checked in Legends Arceus
                                    if (newPerfectResearch && huntDetails.game === "Legends Arceus" && !prev.researchLv10) {
                                      newModifiers.researchLv10 = true;
                                    }
                                    return newModifiers;
                                  });
                                }}
                              />
                              <span>Perfect Research</span>
                            </label>
                          )}
                          {gameModifiers["Sparkling Lv 1"] > 0 && ((huntDetails.game === "Scarlet" || huntDetails.game === "Violet") && (huntDetails.method === "Random Encounters" || huntDetails.method === "Mass Outbreaks" || huntDetails.method === "Sandwich") || (huntDetails.game === "Legends Z-A" && huntDetails.method === "Hyperspaces")) && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={modifiers.sparklingLv1}
                                onChange={(e) => {
                                  const newSparklingLv1 = e.target.checked;
                                  setModifiers(prev => {
                                    const newModifiers = {
                                      ...prev,
                                      sparklingLv1: newSparklingLv1,
                                      sparklingLv2: newSparklingLv1 ? false : prev.sparklingLv2,
                                      sparklingLv3: newSparklingLv1 ? false : prev.sparklingLv3
                                    };

                                    // For Sandwich method: if turning off Lv 1 and no other sparkling is active, default to Lv 3
                                    if (huntDetails.method === "Sandwich" && !newSparklingLv1 && !newModifiers.sparklingLv2 && !newModifiers.sparklingLv3) {
                                      newModifiers.sparklingLv3 = true;
                                    }

                                    return newModifiers;
                                  });
                                }}
                              />
                              <span>Sparkling Lv 1</span>
                            </label>
                          )}
                          {gameModifiers["Sparkling Lv 2"] > 0 && ((huntDetails.game === "Scarlet" || huntDetails.game === "Violet") && (huntDetails.method === "Random Encounters" || huntDetails.method === "Mass Outbreaks" || huntDetails.method === "Sandwich") || (huntDetails.game === "Legends Z-A" && huntDetails.method === "Hyperspaces")) && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={modifiers.sparklingLv2}
                                onChange={(e) => {
                                  const newSparklingLv2 = e.target.checked;
                                  setModifiers(prev => {
                                    const newModifiers = {
                                      ...prev,
                                      sparklingLv2: newSparklingLv2,
                                      sparklingLv1: newSparklingLv2 ? false : prev.sparklingLv1,
                                      sparklingLv3: newSparklingLv2 ? false : prev.sparklingLv3
                                    };

                                    // For Sandwich method: if turning off Lv 2 and no other sparkling is active, default to Lv 3
                                    if (huntDetails.method === "Sandwich" && !newSparklingLv2 && !newModifiers.sparklingLv1 && !newModifiers.sparklingLv3) {
                                      newModifiers.sparklingLv3 = true;
                                    }

                                    return newModifiers;
                                  });
                                }}
                              />
                              <span>Sparkling Lv 2</span>
                            </label>
                          )}
                          {gameModifiers["Sparkling Lv 3"] > 0 && ((huntDetails.game === "Scarlet" || huntDetails.game === "Violet") && (huntDetails.method === "Random Encounters" || huntDetails.method === "Mass Outbreaks" || huntDetails.method === "Sandwich") || (huntDetails.game === "Legends Z-A" && huntDetails.method === "Hyperspaces")) && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={modifiers.sparklingLv3}
                                onChange={(e) => {
                                  const newSparklingLv3 = e.target.checked;
                                  setModifiers(prev => {
                                    const newModifiers = {
                                      ...prev,
                                      sparklingLv3: newSparklingLv3,
                                      sparklingLv1: newSparklingLv3 ? false : prev.sparklingLv1,
                                      sparklingLv2: newSparklingLv3 ? false : prev.sparklingLv2
                                    };

                                    // For Sandwich method: if turning off Lv 3 and no other sparkling is active, default back to Lv 3
                                    if (huntDetails.method === "Sandwich" && !newSparklingLv3 && !newModifiers.sparklingLv1 && !newModifiers.sparklingLv2) {
                                      newModifiers.sparklingLv3 = true;
                                    }

                                    return newModifiers;
                                  });
                                }}
                              />
                              <span>Sparkling Lv 3</span>
                            </label>
                          )}
                          {gameModifiers["Event Boosted"] > 0 && (huntDetails.game === "Scarlet" || huntDetails.game === "Violet") && huntDetails.method === "Mass Outbreaks" && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={modifiers.eventBoosted}
                                onChange={(e) => setModifiers(prev => ({ ...prev, eventBoosted: e.target.checked }))}
                              />
                              <span>Event Boosted</span>
                            </label>
                          )}
                          {gameModifiers["Community Day"] > 0 && huntDetails.game === "GO" && (huntDetails.method === "Random Encounters" || huntDetails.method === "Daily Adventure Incense") && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={modifiers.communityDay}
                                onChange={(e) => {
                                  const newCommunityDay = e.target.checked;
                                  setModifiers(prev => ({
                                    ...prev,
                                    communityDay: newCommunityDay,
                                    raidDay: newCommunityDay ? false : prev.raidDay, // Uncheck Raid Day if Community Day is checked
                                    researchDay: newCommunityDay ? false : prev.researchDay, // Uncheck Research Day if Community Day is checked
                                    galarBirds: newCommunityDay ? false : prev.galarBirds, // Uncheck Galar Birds if Community Day is checked
                                    hatchDay: newCommunityDay ? false : prev.hatchDay // Uncheck Hatch Day if Community Day is checked
                                  }));
                                }}
                              />
                              <span>Community Day</span>
                            </label>
                          )}
                          {gameModifiers["Raid Day"] > 0 && huntDetails.game === "GO" && huntDetails.method === "Raid Battles" && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={modifiers.raidDay}
                                onChange={(e) => {
                                  const newRaidDay = e.target.checked;
                                  setModifiers(prev => ({
                                    ...prev,
                                    raidDay: newRaidDay,
                                    communityDay: newRaidDay ? false : prev.communityDay, // Uncheck Community Day if Raid Day is checked
                                    researchDay: newRaidDay ? false : prev.researchDay // Uncheck Research Day if Raid Day is checked
                                  }));
                                }}
                              />
                              <span>Raid Day</span>
                            </label>
                          )}
                          {gameModifiers["Research Day"] > 0 && huntDetails.game === "GO" && huntDetails.method === "Field Research" && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={modifiers.researchDay}
                                onChange={(e) => {
                                  const newResearchDay = e.target.checked;
                                  setModifiers(prev => ({
                                    ...prev,
                                    researchDay: newResearchDay,
                                    communityDay: newResearchDay ? false : prev.communityDay, // Uncheck Community Day if Research Day is checked
                                    raidDay: newResearchDay ? false : prev.raidDay // Uncheck Raid Day if Research Day is checked
                                  }));
                                }}
                              />
                              <span>Research Day</span>
                            </label>
                          )}
                          {gameModifiers["Galar Birds"] > 0 && huntDetails.game === "GO" && huntDetails.method === "Daily Adventure Incense" && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={modifiers.galarBirds}
                                onChange={(e) => {
                                  const newGalarBirds = e.target.checked;
                                  setModifiers(prev => ({
                                    ...prev,
                                    galarBirds: newGalarBirds,
                                    communityDay: newGalarBirds ? false : prev.communityDay // Uncheck Community Day if Galar Birds is checked
                                  }));
                                }}
                              />
                              <span>Galar Birds</span>
                            </label>
                          )}
                          {gameModifiers["Hatch Day"] > 0 && huntDetails.game === "GO" && huntDetails.method === "Breeding" && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={modifiers.hatchDay}
                                onChange={(e) => {
                                  const newHatchDay = e.target.checked;
                                  setModifiers(prev => ({
                                    ...prev,
                                    hatchDay: newHatchDay,
                                    communityDay: newHatchDay ? false : prev.communityDay // Uncheck Community Day if Hatch Day is checked
                                  }));
                                }}
                              />
                              <span>Hatch Day</span>
                            </label>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Odds Display */}
                  {((huntDetails.game && huntDetails.method && availableMethods.length > 0) || (!huntDetails.game || !huntDetails.method)) && (
                    <div className="hunt-form-group">
                      <label className="hunt-label">Current Odds:</label>
                      <div className="odds-display">
                        {currentOdds === "pokeradarXY" ? (
                          // Special display for Poke Radar in X/Y - show table every 5 checks up to 40
                          <div className="pokeradar-odds">
                            <div className="pokeradar-odds-table">
                              <div className="pokeradar-odds-table-header">
                                <div className="pokeradar-odds-cell">Chain</div>
                                <div className="pokeradar-odds-cell">Odds</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">0</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 0).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">5</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 5).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">10</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 10).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">15</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 15).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">20</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 20).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">25</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 25).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">30</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 30).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">35</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 35).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">40+</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 40).toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        ) : currentOdds === "chainFishingXY" ? (
                          // Special display for Chain Fishing in X/Y - show table every 5 checks up to 20
                          <div className="chainfishing-odds">
                            <div className="chainfishing-odds-table">
                              <div className="chainfishing-odds-table-header">
                                <div className="chainfishing-odds-cell">Chain</div>
                                <div className="chainfishing-odds-cell">Odds</div>
                              </div>
                              <div className="chainfishing-odds-table-row">
                                <div className="chainfishing-odds-cell">0</div>
                                <div className="chainfishing-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 0).toLocaleString()}</div>
                              </div>
                              <div className="chainfishing-odds-table-row">
                                <div className="chainfishing-odds-cell">5</div>
                                <div className="chainfishing-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 5).toLocaleString()}</div>
                              </div>
                              <div className="chainfishing-odds-table-row">
                                <div className="chainfishing-odds-cell">10</div>
                                <div className="chainfishing-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 10).toLocaleString()}</div>
                              </div>
                              <div className="chainfishing-odds-table-row">
                                <div className="chainfishing-odds-cell">15</div>
                                <div className="chainfishing-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 15).toLocaleString()}</div>
                              </div>
                              <div className="chainfishing-odds-table-row">
                                <div className="chainfishing-odds-cell">20+</div>
                                <div className="chainfishing-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 20).toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        ) : currentOdds === "chainFishingORAS" ? (
                          // Special display for Chain Fishing in Omega Ruby/Alpha Sapphire - show table every 5 checks up to 20
                          <div className="chainfishing-odds">
                            <div className="chainfishing-odds-table">
                              <div className="chainfishing-odds-table-header">
                                <div className="chainfishing-odds-cell">Chain</div>
                                <div className="chainfishing-odds-cell">Odds</div>
                              </div>
                              <div className="chainfishing-odds-table-row">
                                <div className="chainfishing-odds-cell">0</div>
                                <div className="chainfishing-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 0).toLocaleString()}</div>
                              </div>
                              <div className="chainfishing-odds-table-row">
                                <div className="chainfishing-odds-cell">5</div>
                                <div className="chainfishing-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 5).toLocaleString()}</div>
                              </div>
                              <div className="chainfishing-odds-table-row">
                                <div className="chainfishing-odds-cell">10</div>
                                <div className="chainfishing-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 10).toLocaleString()}</div>
                              </div>
                              <div className="chainfishing-odds-table-row">
                                <div className="chainfishing-odds-cell">15</div>
                                <div className="chainfishing-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 15).toLocaleString()}</div>
                              </div>
                              <div className="chainfishing-odds-table-row">
                                <div className="chainfishing-odds-cell">20+</div>
                                <div className="chainfishing-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 20).toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        ) : currentOdds === "dexNavORAS" ? (
                          // Special display for DexNav in Omega Ruby/Alpha Sapphire - show chart with key milestones
                          <div className="dexnav-odds">
                            <div className="dexnav-odds-table">
                              <div className="dexnav-odds-table-header">
                                <div className="dexnav-odds-cell">Search Level</div>
                                <div className="dexnav-odds-cell">Odds</div>
                              </div>
                              <div className="dexnav-odds-table-row">
                                <div className="dexnav-odds-cell">0</div>
                                <div className="dexnav-odds-cell">1/{modifiers.shinyCharm ? "1,366" : "4,096"}</div>
                              </div>
                              <div className="dexnav-odds-table-row">
                                <div className="dexnav-odds-cell">1-16</div>
                                <div className="dexnav-odds-cell">1/{modifiers.shinyCharm ? "969" : "2,906"}</div>
                              </div>
                              <div className="dexnav-odds-table-row">
                                <div className="dexnav-odds-cell">17-33</div>
                                <div className="dexnav-odds-cell">1/{modifiers.shinyCharm ? "751" : "2,252"}</div>
                              </div>
                              <div className="dexnav-odds-table-row">
                                <div className="dexnav-odds-cell">34-50</div>
                                <div className="dexnav-odds-cell">1/{modifiers.shinyCharm ? "613" : "1,838"}</div>
                              </div>
                              <div className="dexnav-odds-table-row">
                                <div className="dexnav-odds-cell">84-100</div>
                                <div className="dexnav-odds-cell">1/{modifiers.shinyCharm ? "395" : "1,185"}</div>
                              </div>
                              <div className="dexnav-odds-table-row">
                                <div className="dexnav-odds-cell">101-150</div>
                                <div className="dexnav-odds-cell">1/{modifiers.shinyCharm ? "353" : "1,059"}</div>
                              </div>
                              <div className="dexnav-odds-table-row">
                                <div className="dexnav-odds-cell">201-300</div>
                                <div className="dexnav-odds-cell">1/{modifiers.shinyCharm ? "291" : "874"}</div>
                              </div>
                              <div className="dexnav-odds-table-row">
                                <div className="dexnav-odds-cell">401-500</div>
                                <div className="dexnav-odds-cell">1/{modifiers.shinyCharm ? "248" : "744"}</div>
                              </div>
                              <div className="dexnav-odds-table-row">
                                <div className="dexnav-odds-cell">701-800</div>
                                <div className="dexnav-odds-cell">1/{modifiers.shinyCharm ? "203" : "608"}</div>
                              </div>
                              <div className="dexnav-odds-table-row">
                                <div className="dexnav-odds-cell">901-999</div>
                                <div className="dexnav-odds-cell">1/{modifiers.shinyCharm ? "181" : "542"}</div>
                              </div>
                            </div>
                            <div className="dexnav-odds-note">
                              <span className="dexnav-odds-note-text">Each encounter has a 4% chance for random shiny odds boost. Encounters at multiples of 50 and 100 have additional boosted odds (not dynamically tracked).</span>
                            </div>
                          </div>
                        ) : currentOdds === "sosSMUSUM" ? (
                          // Special display for SOS method in Sun/Moon and Ultra Sun/Ultra Moon - show chart with chain ranges
                          <div className="sos-odds">
                            <div className="sos-odds-table">
                              <div className="sos-odds-table-header">
                                <div className="sos-odds-cell">Chain</div>
                                <div className="sos-odds-cell">Odds</div>
                              </div>
                              <div className="sos-odds-table-row">
                                <div className="sos-odds-cell">0-10</div>
                                <div className="sos-odds-cell">1/{modifiers.shinyCharm ? "1,366" : "4,096"}</div>
                              </div>
                              <div className="sos-odds-table-row">
                                <div className="sos-odds-cell">11-20</div>
                                <div className="sos-odds-cell">1/{modifiers.shinyCharm ? "586" : "820"}</div>
                              </div>
                              <div className="sos-odds-table-row">
                                <div className="sos-odds-cell">21-30</div>
                                <div className="sos-odds-cell">1/{modifiers.shinyCharm ? "373" : "456"}</div>
                              </div>
                              <div className="sos-odds-table-row">
                                <div className="sos-odds-cell">31+</div>
                                <div className="sos-odds-cell">1/{modifiers.shinyCharm ? "274" : "316"}</div>
                              </div>
                            </div>
                          </div>
                        ) : currentOdds === "ultraWormholes" ? (
                          // Special display for Ultra Wormholes in Ultra Sun/Ultra Moon
                          <div className="ultra-wormhole-odds">
                            <div className="ultra-wormhole-main">
                              <span className="ultra-wormhole-base">1%</span>
                              <span className="ultra-wormhole-separator">→</span>
                              <span className="ultra-wormhole-max">36%</span>
                            </div>
                            <div className="ultra-wormhole-note">
                              <span className="ultra-wormhole-note-text">Odds increase with distance traveled</span>
                            </div>
                          </div>
                        ) : currentOdds === "koMethod" ? (
                          // Special display for KO Method in Sword/Shield - show full chart
                          <div className="ko-method-odds">
                            <div className="ko-odds-table">
                              <div className="ko-odds-table-header">
                                <div className="ko-odds-cell">KOs</div>
                                <div className="ko-odds-cell">Odds</div>
                              </div>
                              <div className="ko-odds-table-row">
                                <div className="ko-odds-cell">1</div>
                                <div className="ko-odds-cell">{modifiers.shinyCharm ? "1/1,024" : "1/2,048"}</div>
                              </div>
                              <div className="ko-odds-table-row">
                                <div className="ko-odds-cell">50</div>
                                <div className="ko-odds-cell">{modifiers.shinyCharm ? "1/820" : "1/1,366"}</div>
                              </div>
                              <div className="ko-odds-table-row">
                                <div className="ko-odds-cell">100</div>
                                <div className="ko-odds-cell">{modifiers.shinyCharm ? "1/683" : "1/1,025"}</div>
                              </div>
                              <div className="ko-odds-table-row">
                                <div className="ko-odds-cell">200</div>
                                <div className="ko-odds-cell">{modifiers.shinyCharm ? "1/586" : "1/820"}</div>
                              </div>
                              <div className="ko-odds-table-row">
                                <div className="ko-odds-cell">300</div>
                                <div className="ko-odds-cell">{modifiers.shinyCharm ? "1/512" : "1/683"}</div>
                              </div>
                              <div className="ko-odds-table-row">
                                <div className="ko-odds-cell">500+</div>
                                <div className="ko-odds-cell">{modifiers.shinyCharm ? "1/456" : "1/586"}</div>
                              </div>
                            </div>
                            <div className="ko-odds-note">
                              <span className="ko-odds-note-text">Odds only apply to brilliant aura Pokemon</span>
                            </div>
                          </div>
                        ) : currentOdds === "pokeradarDPP" ? (
                          // Special display for Poke Radar in Diamond/Pearl/Platinum - show table every 5 checks up to 40
                          <div className="pokeradar-odds">
                            <div className="pokeradar-odds-table">
                              <div className="pokeradar-odds-table-header">
                                <div className="pokeradar-odds-cell">Chain</div>
                                <div className="pokeradar-odds-cell">Odds</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">0</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 0).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">5</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 5).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">10</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 10).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">15</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 15).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">20</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 20).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">25</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 25).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">30</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 30).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">35</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 35).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">40+</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 40).toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        ) : currentOdds === "pokeradarBDSP" ? (
                          // Special display for Poke Radar in Brilliant Diamond/Shining Pearl - show table every 5 checks up to 40
                          <div className="pokeradar-odds">
                            <div className="pokeradar-odds-table">
                              <div className="pokeradar-odds-table-header">
                                <div className="pokeradar-odds-cell">Chain</div>
                                <div className="pokeradar-odds-cell">Odds</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">0</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 0).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">5</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 5).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">10</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 10).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">15</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 15).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">20</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 20).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">25</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 25).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">30</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 30).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">35</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 35).toLocaleString()}</div>
                              </div>
                              <div className="pokeradar-odds-table-row">
                                <div className="pokeradar-odds-cell">40+</div>
                                <div className="pokeradar-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 40).toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        ) : currentOdds === "catchComboLetsGo" ? (
                          // Special display for Catch Combo in Let's Go games - show table with combo ranges
                          <div className="catchcombo-odds">
                            <div className="catchcombo-odds-table">
                              <div className="catchcombo-odds-table-header">
                                <div className="catchcombo-odds-cell">Combo</div>
                                <div className="catchcombo-odds-cell">Odds</div>
                              </div>
                              <div className="catchcombo-odds-table-row">
                                <div className="catchcombo-odds-cell">0-10</div>
                                <div className="catchcombo-odds-cell">1/{modifiers.shinyCharm && modifiers.lureActive ? "1,024" : modifiers.shinyCharm ? "1,365" : modifiers.lureActive ? "2,048" : "4,096"}</div>
                              </div>
                              <div className="catchcombo-odds-table-row">
                                <div className="catchcombo-odds-cell">11-20</div>
                                <div className="catchcombo-odds-cell">1/{modifiers.shinyCharm && modifiers.lureActive ? "585" : modifiers.shinyCharm ? "683" : modifiers.lureActive ? "819" : "1,024"}</div>
                              </div>
                              <div className="catchcombo-odds-table-row">
                                <div className="catchcombo-odds-cell">21-30</div>
                                <div className="catchcombo-odds-cell">1/{modifiers.shinyCharm && modifiers.lureActive ? "372" : modifiers.shinyCharm ? "410" : modifiers.lureActive ? "455" : "512"}</div>
                              </div>
                              <div className="catchcombo-odds-table-row">
                                <div className="catchcombo-odds-cell">31+</div>
                                <div className="catchcombo-odds-cell">1/{modifiers.shinyCharm && modifiers.lureActive ? "273" : modifiers.shinyCharm ? "293" : modifiers.lureActive ? "315" : "341"}</div>
                              </div>
                            </div>
                          </div>
                        ) : currentOdds === "hordeEncounters" ? (
                          // Special display for Horde Encounters - show odds with note
                          <div className="horde-encounters-odds">
                            <span className="odds-text">1 in {calculateOdds(huntDetails.game, huntDetails.method, modifiers).toLocaleString()}</span>
                            <div className="horde-encounters-note">
                              <span className="horde-encounters-note-text">Odds apply to each full horde encounter, not individual Pokemon</span>
                            </div>
                          </div>
                        ) : currentOdds === "massOutbreaksSV" ? (
                          // Special display for Mass Outbreaks in Scarlet/Violet - show table with sparkling power levels
                          <div className="massoutbreak-odds">
                            <div className="massoutbreak-odds-table">
                              <div className="massoutbreak-odds-table-header">
                                <div className="massoutbreak-odds-cell">Checks Cleared</div>
                                <div className="massoutbreak-odds-cell">Odds</div>
                              </div>
                              <div className="massoutbreak-odds-table-row">
                                <div className="massoutbreak-odds-cell">0-29</div>
                                <div className="massoutbreak-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 15).toLocaleString()}</div>
                              </div>
                              <div className="massoutbreak-odds-table-row">
                                <div className="massoutbreak-odds-cell">30-59</div>
                                <div className="massoutbreak-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 45).toLocaleString()}</div>
                              </div>
                              <div className="massoutbreak-odds-table-row">
                                <div className="massoutbreak-odds-cell">60+</div>
                                <div className="massoutbreak-odds-cell">1/{getCurrentHuntOdds(huntDetails.game, huntDetails.method, modifiers, 75).toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        ) : currentOdds === "pokemonGoRandom" ? (
                          // Special display for Pokemon Go Random Encounters and Daily Adventure Incense - show odds with note (hidden for Galar Birds)
                          <div className="pokemon-go-random-odds">
                            <span className="odds-text">1 in {calculateOdds(huntDetails.game, huntDetails.method, modifiers).toLocaleString()}</span>
                            {!modifiers.galarBirds && (
                              <div className="pokemon-go-random-note">
                                <span className="pokemon-go-random-note-text">Pokemon Go shiny odds vary significantly between species and events. This represents the most common base rate, but actual odds may differ.</span>
                              </div>
                            )}
                          </div>
                        ) : currentOdds === "NA" ? (
                          // Display NA when no game/method selected
                          <span className="odds-text">NA</span>
                        ) : (
                          // Standard display for other methods
                          <span className="odds-text">1 in {currentOdds.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* No Hunt Data Available Message */}
                  {huntDetails.game && availableMethods.length === 0 && (
                    <div className="hunt-form-group">
                      <div className="no-hunt-data-message">
                        <p>No hunt data available for {huntDetails.game} yet.</p>
                        <p>Hunt methods and odds will be added as data is provided.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="hunt-modal-footer">
                <button
                  onClick={handleStartHunt}
                  className="hunt-start-btn"
                >
                  <Plus size={16} />
                  Start Hunt
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reset Hunt Modal */}
      {resetModal.show && createPortal(
        <div
          className={`fixed inset-0 z-[20000] ${resetModalClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
        >
          <div className="bg-black/80 w-full h-full flex items-center justify-center">
            <div
              className={`bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl ${resetModalClosing ? 'animate-[slideOut_0.3s_ease-in_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--accent)]">Reset Hunt</h3>
                  <p className="text-sm text-[var(--progressbar-info)]">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Are you sure you want to reset this hunt for <span className="font-semibold text-[var(--accent)]">{resetModal.hunt ? formatPokemonName(resetModal.hunt.pokemon.name) : ''}</span>?
                This will reset the check count and timer.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setResetModalClosing(true);
                    setTimeout(() => {
                      setResetModal({ show: false, hunt: null });
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
                  Reset Hunt
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Hunt Modal */}
      {deleteModal.show && createPortal(
        <div
          className={`fixed inset-0 z-[20000] ${deleteModalClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
        >
          <div className="bg-black/80 w-full h-full flex items-center justify-center">
            <div
              className={`bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl ${deleteModalClosing ? 'animate-[slideOut_0.3s_ease-in_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--accent)]">Delete Hunt</h3>
                  <p className="text-sm text-[var(--progressbar-info)]">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this hunt for <span className="font-semibold text-[var(--accent)]">{deleteModal.hunt ? formatPokemonName(deleteModal.hunt.pokemon.name) : ''}</span>?
                This will permanently delete all hunt data.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setDeleteModalClosing(true);
                    setTimeout(() => {
                      setDeleteModal({ show: false, hunt: null });
                      setDeleteModalClosing(false);
                    }, 300);
                  }}
                  className="px-4 py-2 rounded-lg bg-transparent border-2 border-[var(--dividers)] text-[var(--text)] hover:bg-[var(--dividers)] transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors font-semibold"
                >
                  Delete Hunt
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Settings Hunt Modal */}
      {settingsModal.show && createPortal(
        <div
          className={`fixed inset-0 z-[20000] ${settingsModalClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
        >
          <div className="bg-black/80 w-full h-full flex items-center justify-center">
            <div
              className={`bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl ${settingsModalClosing ? 'animate-[slideOut_0.3s_ease-in_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--accent)]">Hunt Settings</h3>
                  <p className="text-sm text-[var(--progressbar-info)]">Manually adjust hunt values</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Adjust Encounter Count
                  </label>
                  <div className="settings-number-input-wrapper">
                    <input
                      type="number"
                      value={settingsForm.manualChecks}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, manualChecks: e.target.value }))}
                      className="settings-number-input"
                      placeholder="Enter encounter count"
                      min="0"
                    />
                    <div className="settings-number-buttons">
                      <button
                        type="button"
                        className="settings-number-btn settings-number-btn-up"
                        onClick={() => setSettingsForm(prev => ({ ...prev, manualChecks: String(Math.max(0, (parseInt(prev.manualChecks) || 0) + 1)) }))}
                      >
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
                          <path d="M5 0L10 6H0L5 0Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="settings-number-btn settings-number-btn-down"
                        onClick={() => setSettingsForm(prev => ({ ...prev, manualChecks: String(Math.max(0, (parseInt(prev.manualChecks) || 0) - 1)) }))}
                      >
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
                          <path d="M5 6L0 0H10L5 6Z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Adjust Timer (format: 1h 2m 3s)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.manualTotalTime}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, manualTotalTime: e.target.value }))}
                    className="w-full px-3 py-2 bg-[var(--searchbar-bg)] border border-[var(--border-color)] rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
                    placeholder="e.g., 1h 30m 45s"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setSettingsModalClosing(true);
                    setTimeout(() => {
                      setSettingsModal({ show: false, hunt: null });
                      setSettingsModalClosing(false);
                    }, 300);
                  }}
                  className="px-4 py-2 rounded-lg bg-transparent border-2 border-[var(--dividers)] text-[var(--text)] hover:bg-[var(--dividers)] transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSettingsConfirm}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black hover:text-white transition-colors font-semibold"
                >
                  Apply Settings
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Hunt Modal */}
      {editModal.show && createPortal(
        <div
          className={`fixed inset-0 z-[20000] ${editModalClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
        >
          <div className="bg-black/80 w-full h-full flex items-center justify-center">
            <div
              className={`bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl ${editModalClosing ? 'animate-[slideOut_0.3s_ease-in_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Edit className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--accent)]">Edit Hunt</h3>
                  <p className="text-sm text-[var(--progressbar-info)]">Change game, method, or Pokemon</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Pokemon Selection */}
                <div className="hunt-form-group">
                  <label className="hunt-label">Pokemon:</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--sidebar-edit-inputs)] text-[var(--text)]">
                      {editForm.pokemon ? formatPokemonName(editForm.pokemon.name) : "Select Pokemon"}
                    </div>
                    <button
                      onClick={() => {
                        setIsEditingPokemon(true);
                        setEditModalClosing(true);
                        setTimeout(() => {
                          setEditModal(prev => ({ ...prev, show: false }));
                          setEditModalClosing(false);
                          setShowPokemonModal(true);
                        }, 300);
                      }}
                      className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--sidebar-edit-inputs)] text-[var(--text)] hover:bg-[var(--dividers)] transition-colors flex items-center justify-center h-[42px]"
                      title="Change Pokemon"
                    >
                      <Edit size={20} className="text-[var(--accent)]" />
                    </button>
                  </div>
                </div>

                {/* Game Selection */}
                <div className="hunt-form-group">
                  <label className="hunt-label">Game:</label>
                  <SearchbarIconDropdown
                    id="edit-game-dropdown"
                    options={GAME_OPTIONS}
                    value={editForm.game}
                    onChange={val => setEditForm(prev => ({ ...prev, game: val }))}
                    placeholder="Select a game..."
                    customBackground="var(--sidebar-edit-inputs)"
                    customBorder="var(--border-color)"
                    disabled={true}
                    hideClearButton={true}
                  />
                </div>

                {/* Method Selection */}
                <div className="hunt-form-group">
                  <label className="hunt-label">Method:</label>
                  <SearchbarIconDropdown
                    id="edit-method-dropdown"
                    options={[
                      { name: "None", value: "" },
                      ...(editForm.game ? getMethodsForGame(editForm.game).map(method => ({
                        name: method.name,
                        value: method.name
                      })) : [])
                    ]}
                    value={editForm.method}
                    onChange={val => setEditForm(prev => ({ ...prev, method: val }))}
                    placeholder={editForm.game ? "Select a method..." : "Select a game first"}
                    customBackground="var(--sidebar-edit-inputs)"
                    customBorder="var(--border-color)"
                    disabled={true}
                    hideClearButton={true}
                  />
                </div>

                {/* Modifiers Section */}
                {editForm.game && (() => {
                  const editAvailableMethods = getMethodsForGame(editForm.game);
                  const editGameModifiers = getModifiersForGame(editForm.game);

                  return (
                    (editGameModifiers["Shiny Charm"] > 0 && !(editForm.method === "Fossil Revivals" && (editForm.game === "Let's Go Pikachu" || editForm.game === "Let's Go Eevee" || editForm.game === "Sword" || editForm.game === "Shield")) && !(editForm.method === "Fossil Revivals" && editForm.game === "Legends Z-A") && !(editForm.method === "Dynamax Raids" && (editForm.game === "Sword" || editForm.game === "Shield")) && !(editForm.method === "Gift Pokemon" && (editForm.game === "Sword" || editForm.game === "Shield" || editForm.game === "Let's Go Eevee" || editForm.game === "Let's Go Pikachu")) && !(editForm.method === "Tera Raids" && (editForm.game === "Scarlet" || editForm.game === "Violet")) && !((editForm.method === "Random Encounters" || editForm.method === "Poke Radar" || editForm.method === "Soft Resets" || editForm.method === "Fossil Revivals" || editForm.method === "Gift Pokemon" || editForm.method === "Underground Diglett Hunt") && (editForm.game === "Brilliant Diamond" || editForm.game === "Shining Pearl")) && !(editForm.method === "Poke Radar" && (editForm.game === "X" || editForm.game === "Y")) && !(editForm.method === "Ultra Wormholes" && (editForm.game === "Ultra Sun" || editForm.game === "Ultra Moon"))) ||
                    (editGameModifiers["Shiny Parents"] > 0 && editForm.method === "Breeding") ||
                    (editGameModifiers["Lure Active"] > 0 && (editForm.method === "Catch Combo" || editForm.method === "Random Encounters" || (editForm.method === "Soft Resets" && editForm.game !== "Let's Go Pikachu" && editForm.game !== "Let's Go Eevee"))) ||
                    (editGameModifiers["Research Lv 10"] > 0 && editForm.game === "Legends Arceus") ||
                    (editGameModifiers["Perfect Research"] > 0 && editForm.game === "Legends Arceus") ||
                    (editGameModifiers["Sparkling Lv 1"] > 0 && ((editForm.game === "Scarlet" || editForm.game === "Violet") && (editForm.method === "Random Encounters" || editForm.method === "Mass Outbreaks" || editForm.method === "Sandwich") || (editForm.game === "Legends Z-A" && editForm.method === "Hyperspaces"))) ||
                    (editGameModifiers["Sparkling Lv 2"] > 0 && ((editForm.game === "Scarlet" || editForm.game === "Violet") && (editForm.method === "Random Encounters" || editForm.method === "Mass Outbreaks" || editForm.method === "Sandwich") || (editForm.game === "Legends Z-A" && editForm.method === "Hyperspaces"))) ||
                    (editGameModifiers["Sparkling Lv 3"] > 0 && ((editForm.game === "Scarlet" || editForm.game === "Violet") && (editForm.method === "Random Encounters" || editForm.method === "Mass Outbreaks" || editForm.method === "Sandwich") || (editForm.game === "Legends Z-A" && editForm.method === "Hyperspaces"))) ||
                    (editGameModifiers["Event Boosted"] > 0 && (editForm.game === "Scarlet" || editForm.game === "Violet") && editForm.method === "Mass Outbreaks") ||
                    (editGameModifiers["Community Day"] > 0 && editForm.game === "GO" && (editForm.method === "Random Encounters" || editForm.method === "Daily Adventure Incense")) ||
                    (editGameModifiers["Raid Day"] > 0 && editForm.game === "GO" && editForm.method === "Raid Battles") ||
                    (editGameModifiers["Research Day"] > 0 && editForm.game === "GO" && editForm.method === "Field Research") ||
                    (editGameModifiers["Galar Birds"] > 0 && editForm.game === "GO" && editForm.method === "Daily Adventure Incense") ||
                    (editGameModifiers["Hatch Day"] > 0 && editForm.game === "GO" && editForm.method === "Breeding")
                  ) && editAvailableMethods.length > 0 && (
                      <div className="hunt-form-group">
                        <label className="hunt-label">Modifiers:</label>
                        <div className="modifiers-section">
                          {editGameModifiers["Shiny Charm"] > 0 && !(editForm.method === "Fossil Revivals" && (editForm.game === "Let's Go Pikachu" || editForm.game === "Let's Go Eevee" || editForm.game === "Sword" || editForm.game === "Shield")) && !(editForm.method === "Fossil Revivals" && editForm.game === "Legends Z-A") && !(editForm.method === "Dynamax Raids" && (editForm.game === "Sword" || editForm.game === "Shield")) && !(editForm.method === "Gift Pokemon" && (editForm.game === "Sword" || editForm.game === "Shield" || editForm.game === "Let's Go Eevee" || editForm.game === "Let's Go Pikachu")) && !(editForm.method === "Tera Raids" && (editForm.game === "Scarlet" || editForm.game === "Violet")) && !((editForm.method === "Random Encounters" || editForm.method === "Poke Radar" || editForm.method === "Soft Resets" || editForm.method === "Fossil Revivals" || editForm.method === "Gift Pokemon" || editForm.method === "Underground Diglett Hunt") && (editForm.game === "Brilliant Diamond" || editForm.game === "Shining Pearl")) && !(editForm.method === "Poke Radar" && (editForm.game === "X" || editForm.game === "Y")) && !(editForm.method === "Ultra Wormholes" && (editForm.game === "Ultra Sun" || editForm.game === "Ultra Moon")) && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={editForm.modifiers.shinyCharm}
                                onChange={(e) => {
                                  const newShinyCharm = e.target.checked;
                                  setEditForm(prev => {
                                    const newModifiers = { ...prev.modifiers, shinyCharm: newShinyCharm };
                                    // Auto-check Research Lv 10 when Shiny Charm is checked in Legends Arceus
                                    if (newShinyCharm && editForm.game === "Legends Arceus" && !prev.modifiers.researchLv10) {
                                      newModifiers.researchLv10 = true;
                                    }
                                    return { ...prev, modifiers: newModifiers };
                                  });
                                }}
                              />
                              <span>Shiny Charm</span>
                            </label>
                          )}
                          {editGameModifiers["Shiny Parents"] > 0 && editForm.method === "Breeding" && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={editForm.modifiers.shinyParents}
                                onChange={(e) => setEditForm(prev => ({ ...prev, modifiers: { ...prev.modifiers, shinyParents: e.target.checked } }))}
                              />
                              <span>Shiny Parents</span>
                            </label>
                          )}
                          {editGameModifiers["Lure Active"] > 0 && (editForm.method === "Catch Combo" || editForm.method === "Random Encounters" || (editForm.method === "Soft Resets" && editForm.game !== "Let's Go Pikachu" && editForm.game !== "Let's Go Eevee")) && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={editForm.modifiers.lureActive}
                                onChange={(e) => setEditForm(prev => ({ ...prev, modifiers: { ...prev.modifiers, lureActive: e.target.checked } }))}
                              />
                              <span>Lure Active</span>
                            </label>
                          )}
                          {editGameModifiers["Research Lv 10"] > 0 && editForm.game === "Legends Arceus" && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={editForm.modifiers.researchLv10}
                                onChange={(e) => {
                                  const newResearchLv10 = e.target.checked;
                                  setEditForm(prev => {
                                    const newModifiers = { ...prev.modifiers, researchLv10: newResearchLv10 };
                                    // Auto-uncheck Shiny Charm and Perfect Research when Research Lv 10 is unchecked in Legends Arceus
                                    if (!newResearchLv10 && editForm.game === "Legends Arceus") {
                                      if (prev.modifiers.shinyCharm) {
                                        newModifiers.shinyCharm = false;
                                      }
                                      if (prev.modifiers.perfectResearch) {
                                        newModifiers.perfectResearch = false;
                                      }
                                    }
                                    return { ...prev, modifiers: newModifiers };
                                  });
                                }}
                              />
                              <span>Research Lv 10</span>
                            </label>
                          )}
                          {editGameModifiers["Perfect Research"] > 0 && editForm.game === "Legends Arceus" && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={editForm.modifiers.perfectResearch}
                                onChange={(e) => {
                                  const newPerfectResearch = e.target.checked;
                                  setEditForm(prev => {
                                    const newModifiers = { ...prev.modifiers, perfectResearch: newPerfectResearch };
                                    // Auto-check Research Lv 10 when Perfect Research is checked in Legends Arceus
                                    if (newPerfectResearch && editForm.game === "Legends Arceus" && !prev.modifiers.researchLv10) {
                                      newModifiers.researchLv10 = true;
                                    }
                                    return { ...prev, modifiers: newModifiers };
                                  });
                                }}
                              />
                              <span>Perfect Research</span>
                            </label>
                          )}
                          {editGameModifiers["Sparkling Lv 1"] > 0 && ((editForm.game === "Scarlet" || editForm.game === "Violet") && (editForm.method === "Random Encounters" || editForm.method === "Mass Outbreaks" || editForm.method === "Sandwich") || (editForm.game === "Legends Z-A" && editForm.method === "Hyperspaces")) && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={editForm.modifiers.sparklingLv1}
                                onChange={(e) => {
                                  const newSparklingLv1 = e.target.checked;
                                  setEditForm(prev => {
                                    const newModifiers = {
                                      ...prev.modifiers,
                                      sparklingLv1: newSparklingLv1,
                                      sparklingLv2: newSparklingLv1 ? false : prev.modifiers.sparklingLv2,
                                      sparklingLv3: newSparklingLv1 ? false : prev.modifiers.sparklingLv3
                                    };

                                    // For Sandwich method: if turning off Lv 1 and no other sparkling is active, default to Lv 3
                                    if (editForm.method === "Sandwich" && !newSparklingLv1 && !newModifiers.sparklingLv2 && !newModifiers.sparklingLv3) {
                                      newModifiers.sparklingLv3 = true;
                                    }

                                    return { ...prev, modifiers: newModifiers };
                                  });
                                }}
                              />
                              <span>Sparkling Lv 1</span>
                            </label>
                          )}
                          {editGameModifiers["Sparkling Lv 2"] > 0 && ((editForm.game === "Scarlet" || editForm.game === "Violet") && (editForm.method === "Random Encounters" || editForm.method === "Mass Outbreaks" || editForm.method === "Sandwich") || (editForm.game === "Legends Z-A" && editForm.method === "Hyperspaces")) && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={editForm.modifiers.sparklingLv2}
                                onChange={(e) => {
                                  const newSparklingLv2 = e.target.checked;
                                  setEditForm(prev => {
                                    const newModifiers = {
                                      ...prev.modifiers,
                                      sparklingLv2: newSparklingLv2,
                                      sparklingLv1: newSparklingLv2 ? false : prev.modifiers.sparklingLv1,
                                      sparklingLv3: newSparklingLv2 ? false : prev.modifiers.sparklingLv3
                                    };

                                    // For Sandwich method: if turning off Lv 2 and no other sparkling is active, default to Lv 3
                                    if (editForm.method === "Sandwich" && !newSparklingLv2 && !newModifiers.sparklingLv1 && !newModifiers.sparklingLv3) {
                                      newModifiers.sparklingLv3 = true;
                                    }

                                    return { ...prev, modifiers: newModifiers };
                                  });
                                }}
                              />
                              <span>Sparkling Lv 2</span>
                            </label>
                          )}
                          {editGameModifiers["Sparkling Lv 3"] > 0 && ((editForm.game === "Scarlet" || editForm.game === "Violet") && (editForm.method === "Random Encounters" || editForm.method === "Mass Outbreaks" || editForm.method === "Sandwich") || (editForm.game === "Legends Z-A" && editForm.method === "Hyperspaces")) && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={editForm.modifiers.sparklingLv3}
                                onChange={(e) => {
                                  const newSparklingLv3 = e.target.checked;
                                  setEditForm(prev => {
                                    const newModifiers = {
                                      ...prev.modifiers,
                                      sparklingLv3: newSparklingLv3,
                                      sparklingLv1: newSparklingLv3 ? false : prev.modifiers.sparklingLv1,
                                      sparklingLv2: newSparklingLv3 ? false : prev.modifiers.sparklingLv2
                                    };

                                    // For Sandwich method: if turning off Lv 3 and no other sparkling is active, default back to Lv 3
                                    if (editForm.method === "Sandwich" && !newSparklingLv3 && !newModifiers.sparklingLv1 && !newModifiers.sparklingLv2) {
                                      newModifiers.sparklingLv3 = true;
                                    }

                                    return { ...prev, modifiers: newModifiers };
                                  });
                                }}
                              />
                              <span>Sparkling Lv 3</span>
                            </label>
                          )}
                          {editGameModifiers["Event Boosted"] > 0 && (editForm.game === "Scarlet" || editForm.game === "Violet") && editForm.method === "Mass Outbreaks" && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={editForm.modifiers.eventBoosted}
                                onChange={(e) => setEditForm(prev => ({ ...prev, modifiers: { ...prev.modifiers, eventBoosted: e.target.checked } }))}
                              />
                              <span>Event Boosted</span>
                            </label>
                          )}
                          {editGameModifiers["Community Day"] > 0 && editForm.game === "GO" && (editForm.method === "Random Encounters" || editForm.method === "Daily Adventure Incense") && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={editForm.modifiers.communityDay}
                                onChange={(e) => {
                                  const newCommunityDay = e.target.checked;
                                  setEditForm(prev => ({
                                    ...prev,
                                    modifiers: {
                                      ...prev.modifiers,
                                      communityDay: newCommunityDay,
                                      raidDay: newCommunityDay ? false : prev.modifiers.raidDay,
                                      researchDay: newCommunityDay ? false : prev.modifiers.researchDay,
                                      galarBirds: newCommunityDay ? false : prev.modifiers.galarBirds,
                                      hatchDay: newCommunityDay ? false : prev.modifiers.hatchDay
                                    }
                                  }));
                                }}
                              />
                              <span>Community Day</span>
                            </label>
                          )}
                          {editGameModifiers["Raid Day"] > 0 && editForm.game === "GO" && editForm.method === "Raid Battles" && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={editForm.modifiers.raidDay}
                                onChange={(e) => {
                                  const newRaidDay = e.target.checked;
                                  setEditForm(prev => ({
                                    ...prev,
                                    modifiers: {
                                      ...prev.modifiers,
                                      raidDay: newRaidDay,
                                      communityDay: newRaidDay ? false : prev.modifiers.communityDay,
                                      researchDay: newRaidDay ? false : prev.modifiers.researchDay
                                    }
                                  }));
                                }}
                              />
                              <span>Raid Day</span>
                            </label>
                          )}
                          {editGameModifiers["Research Day"] > 0 && editForm.game === "GO" && editForm.method === "Field Research" && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={editForm.modifiers.researchDay}
                                onChange={(e) => {
                                  const newResearchDay = e.target.checked;
                                  setEditForm(prev => ({
                                    ...prev,
                                    modifiers: {
                                      ...prev.modifiers,
                                      researchDay: newResearchDay,
                                      communityDay: newResearchDay ? false : prev.modifiers.communityDay,
                                      raidDay: newResearchDay ? false : prev.modifiers.raidDay
                                    }
                                  }));
                                }}
                              />
                              <span>Research Day</span>
                            </label>
                          )}
                          {editGameModifiers["Galar Birds"] > 0 && editForm.game === "GO" && editForm.method === "Daily Adventure Incense" && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={editForm.modifiers.galarBirds}
                                onChange={(e) => {
                                  const newGalarBirds = e.target.checked;
                                  setEditForm(prev => ({
                                    ...prev,
                                    modifiers: {
                                      ...prev.modifiers,
                                      galarBirds: newGalarBirds,
                                      communityDay: newGalarBirds ? false : prev.modifiers.communityDay
                                    }
                                  }));
                                }}
                              />
                              <span>Galar Birds</span>
                            </label>
                          )}
                          {editGameModifiers["Hatch Day"] > 0 && editForm.game === "GO" && editForm.method === "Breeding" && (
                            <label className="modifier-checkbox">
                              <input
                                type="checkbox"
                                checked={editForm.modifiers.hatchDay}
                                onChange={(e) => {
                                  const newHatchDay = e.target.checked;
                                  setEditForm(prev => ({
                                    ...prev,
                                    modifiers: {
                                      ...prev.modifiers,
                                      hatchDay: newHatchDay,
                                      communityDay: newHatchDay ? false : prev.modifiers.communityDay
                                    }
                                  }));
                                }}
                              />
                              <span>Hatch Day</span>
                            </label>
                          )}
                        </div>
                      </div>
                    );
                })()}
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => {
                    setEditModalClosing(true);
                    setTimeout(() => {
                      setEditModal({ show: false, hunt: null });
                      setEditModalClosing(false);
                    }, 300);
                  }}
                  className="px-4 py-2 rounded-lg bg-transparent border-2 border-[var(--dividers)] text-[var(--text)] hover:bg-[var(--dividers)] transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditConfirm}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black hover:text-white transition-colors font-semibold"
                >
                  Update Hunt
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Completion Hunt Modal */}
      {completionModal.show && createPortal(
        <div
          className={`fixed inset-0 z-[20000] ${completionModalClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
        >
          <div className="bg-black/80 w-full h-full flex items-center justify-center">
            <div
              className={`bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl ${completionModalClosing ? 'animate-[slideOut_0.3s_ease-in_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--accent)]">Complete Hunt</h3>
                  <p className="text-sm text-[var(--progressbar-info)]">Add final hunt details</p>
                </div>
              </div>

              {/* Display existing hunt info */}
              {completionModal.hunt && (
                <div className="bg-[var(--searchbar-bg)] border border-[var(--border-color)] rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Pokemon:</span>
                      <div className="font-medium text-white">{formatPokemonName(completionModal.hunt.pokemon.name)}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Form:</span>
                      <div className="font-medium text-white">{getFormDisplayName(completionModal.hunt.pokemon) || "None"}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Method:</span>
                      <div className="font-medium text-white">{completionModal.hunt.method}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Game:</span>
                      <div className="font-medium text-white">{completionModal.hunt.game}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Date:</span>
                      <div className="font-medium text-white">{new Date().toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Final Check:</span>
                      <div className="font-medium text-white">
                        {completionModal.hunt.checks} in {formatTimeCompact(totalCheckTimes[completionModal.hunt.id] || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="sidebar-form-group">
                  <label className="sidebar-label">Ball Used:</label>
                  <SearchbarIconDropdown
                    id="completion-ball-dropdown"
                    options={getCompletionBallOptions()}
                    value={completionForm.ball}
                    onChange={val => setCompletionForm(prev => ({ ...prev, ball: val }))}
                    placeholder="Select a ball..."
                    customBackground="var(--sidebar-edit-inputs)"
                    customBorder="var(--border-color)"
                  />
                </div>

                {/* Only show mark field for games that support marks */}
                {completionModal.hunt && ['Sword', 'Shield', 'Scarlet', 'Violet'].includes(completionModal.hunt.game) && (
                  <div className="sidebar-form-group">
                    <label className="sidebar-label">Mark:</label>
                    <SearchbarIconDropdown
                      id="completion-mark-dropdown"
                      options={MARK_OPTIONS}
                      value={completionForm.mark}
                      onChange={val => setCompletionForm(prev => ({ ...prev, mark: val }))}
                      placeholder="Select a mark..."
                      customBackground="var(--sidebar-edit-inputs)"
                      customBorder="var(--border-color)"
                  />
                  </div>
                )}

                <div className="sidebar-form-group">
                  <label className="sidebar-label">Notes/extras:</label>
                  <ContentFilterInput
                    id="completion-notes-textarea"
                    name="notes"
                    type="textarea"
                    value={completionForm.notes}
                    onChange={(e) => setCompletionForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add notes about this hunt..."
                    configType="notes"
                    showCharacterCount={true}
                    showRealTimeValidation={true}
                    className="sidebar-input"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setCompletionModalClosing(true);
                    setTimeout(() => {
                      setCompletionModal({ show: false, hunt: null });
                      setCompletionModalClosing(false);
                      setCompletionForm({ ball: '', mark: '', notes: '' });
                    }, 300);
                  }}
                  className="px-4 py-2 rounded-lg bg-transparent border-2 border-[var(--dividers)] text-[var(--text)] hover:bg-[var(--dividers)] transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompletionConfirm}
                  className="sidebar-button"
                >
                  Complete Hunt
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

          </>
  );
}
