import { useState, useEffect, useContext, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

// Simple timer component that updates every second
function TimerDisplay({ huntId, lastCheckTime, isPaused, onTimeUpdate }) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start timer
    intervalRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused]);

  // Update parent with current seconds value
  useEffect(() => {
    if (onTimeUpdate && !isPaused) {
      onTimeUpdate(huntId, seconds * 1000);
    }
  }, [seconds, huntId, onTimeUpdate, isPaused]);

  // Reset timer when lastCheckTime changes (new hunt or add check)
  useEffect(() => {
    setSeconds(0);
  }, [lastCheckTime]);

  if (isPaused) {
    return "Paused";
  }

  return `${seconds}s`;
}
import { Search, X, Plus, Minus, Check, Trash2, Settings, Save, Info, RotateCcw, Pause, Play, CheckCircle, Edit } from "lucide-react";
import { BALL_OPTIONS, MARK_OPTIONS } from "../Constants";
import { getMethodsForGame, calculateOdds, getAllGames, getModifiersForGame, getCurrentHuntOdds } from "../utils/huntSystem";
import { GAME_OPTIONS } from "../Constants";
import { formatPokemonName, getFormDisplayName, renderTypeBadge } from "../utils";
import { getCaughtKey } from "../caughtStorage";
import { SearchbarIconDropdown } from "../components/Shared/SearchBar";
import ContentFilterInput from "../components/Shared/ContentFilterInput";
import { validateContent } from "../../shared/contentFilter";
import { UserContext } from "../components/Shared/UserContext";
import { useMessage } from "../components/Shared/MessageContext";
import { huntAPI, profileAPI } from "../utils/api";
import pokemonData from "../data/pokemon.json";
import formsData from "../utils/loadFormsData";
import gamePokemonData from "../data/gamePokemon.json";
import { getAvailableGamesForPokemon } from "../utils/gameMapping";
import { getFilteredFormsData } from "../utils/dexPreferences";
import "../css/Counters.css";

export default function Counters() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [huntDetails, setHuntDetails] = useState({
    game: "",
    ball: "",
    mark: "",
    method: "",
    notes: ""
  });
  const [modifiers, setModifiers] = useState({
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
  const [currentChecks, setCurrentChecks] = useState(0);
  const [showPokemonModal, setShowPokemonModal] = useState(false);
  const [showHuntModal, setShowHuntModal] = useState(false);
  const [activeHunts, setActiveHunts] = useState([]);
  const [huntTimers, setHuntTimers] = useState({});
  const [lastCheckTimes, setLastCheckTimes] = useState({});
  const [totalCheckTimes, setTotalCheckTimes] = useState({});
  const [pausedHunts, setPausedHunts] = useState(new Set());
  const [expandedHunts, setExpandedHunts] = useState(new Set());
  const [currentBottomTimers, setCurrentBottomTimers] = useState({});
  const [huntIncrements, setHuntIncrements] = useState({});
  const [resetModal, setResetModal] = useState({ show: false, hunt: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, hunt: null });
  const [settingsModal, setSettingsModal] = useState({ show: false, hunt: null });
  const [editModal, setEditModal] = useState({ show: false, hunt: null });
  const [completionModal, setCompletionModal] = useState({ show: false, hunt: null });
  const [resetModalClosing, setResetModalClosing] = useState(false);
  const [deleteModalClosing, setDeleteModalClosing] = useState(false);
  const [settingsModalClosing, setSettingsModalClosing] = useState(false);
  const [editModalClosing, setEditModalClosing] = useState(false);
  const [pokemonModalClosing, setPokemonModalClosing] = useState(false);
  const [huntModalClosing, setHuntModalClosing] = useState(false);
  const [backdropClosing, setBackdropClosing] = useState(false);
  const [completionModalClosing, setCompletionModalClosing] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    manualChecks: '',
    manualTotalTime: '',
    manualIncrements: ''
  });
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
  const [isEditingPokemon, setIsEditingPokemon] = useState(false);
  const [completionForm, setCompletionForm] = useState({
    ball: '',
    mark: '',
    notes: ''
  });

  // Function to identify Hisuian balls
  const isHisuianBall = (ballValue) => {
    const hisuianBalls = [
      "Feather Ball", "Wing Ball", "Jet Ball", "Heavy Ball (Hisui)",
      "Leaden Ball", "Gigaton Ball", "Poké Ball (Hisui)",
      "Great Ball (Hisui)", "Ultra Ball (Hisui)", "Origin Ball", "Strange Ball"
    ];
    return hisuianBalls.includes(ballValue);
  };

  // Filter ball options based on selected game for completion modal
  const getCompletionBallOptions = () => {
    if (completionModal.hunt && completionModal.hunt.game === "Legends Arceus") {
      // Show only Hisuian balls for Legends Arceus
      return BALL_OPTIONS.filter(ball =>
        ball.value === "" || isHisuianBall(ball.value)
      );
    }
    return BALL_OPTIONS;
  };
  const lastPauseAction = useRef({});
  const lastSaveTime = useRef(0);
  const { username } = useContext(UserContext);
  const { showMessage } = useMessage();
  const [shinyCharmGames, setShinyCharmGames] = useState([]);

  // Save hunt data to server - immediate save with current state and throttling
  const saveHuntData = useCallback(async (huntDataOverride = null) => {
    if (!username) return; // Don't save if user is not logged in

    // Only throttle automatic saves (when no explicit data provided)
    // Allow immediate saves when explicit data is provided (like from handleAddCheck)
    const now = Date.now();
    if (!huntDataOverride && now - lastSaveTime.current < 500) {
      return; // Skip this save if it's too soon (only for automatic saves)
    }
    lastSaveTime.current = now;

    try {
      const huntData = huntDataOverride || {
        activeHunts,
        huntTimers: Object.fromEntries(Object.entries(huntTimers).map(([k, v]) => [k, v])),
        lastCheckTimes: Object.fromEntries(Object.entries(lastCheckTimes).map(([k, v]) => [k, v])),
        totalCheckTimes: Object.fromEntries(Object.entries(totalCheckTimes).map(([k, v]) => [k, v])),
        pausedHunts: Array.from(pausedHunts),
        huntIncrements: Object.fromEntries(Object.entries(huntIncrements).map(([k, v]) => [k, v]))
      };

      await huntAPI.updateHuntData(huntData);
    } catch (error) {
      console.error('Failed to save hunt data:', error);
      showMessage('Failed to save hunt data', 'error');
    }
  }, [username, showMessage]);


  // Load user's shiny charm games
  const loadShinyCharmGames = useCallback(async () => {
    if (!username) return;

    try {
      const profile = await profileAPI.getProfile();
      setShinyCharmGames(profile.shinyCharmGames || []);
    } catch (error) {
      console.error('Failed to load shiny charm games:', error);
    }
  }, [username]);

  useEffect(() => {
    loadShinyCharmGames();

    // Listen for updates from ShinyCharmModal
    const handleShinyCharmUpdate = (event) => {
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
  }, [username, loadShinyCharmGames]);

  // Load hunt data on component mount
  useEffect(() => {
    const loadHuntData = async () => {
      if (!username) return;

      try {
        const data = await huntAPI.getHuntData();

        if (data.activeHunts) {
          // Ensure each hunt has modifiers field for backward compatibility
          const huntsWithModifiers = data.activeHunts.map(hunt => ({
            ...hunt,
            modifiers: hunt.modifiers || {
              shinyCharm: false,
              shinyParents: false,
              lureActive: false,
              researchLv10: false,
              perfectResearch: false,
              sparklingLv1: false,
              sparklingLv2: false,
              sparklingLv3: false,
              eventBoosted: false
            }
          }));
          setActiveHunts(huntsWithModifiers);
        }
        if (data.huntTimers) {
          setHuntTimers(data.huntTimers);
        }
        if (data.lastCheckTimes) {
          setLastCheckTimes(data.lastCheckTimes);
        }
        if (data.totalCheckTimes) {
          setTotalCheckTimes(data.totalCheckTimes);
        }
        if (data.huntIncrements) {
          setHuntIncrements(data.huntIncrements);
        }

        // Always set all hunts to paused on page load/refresh
        if (data.activeHunts && data.activeHunts.length > 0) {
          const allHuntIds = data.activeHunts.map(hunt => hunt.id);
          setPausedHunts(new Set(allHuntIds));
        } else {
          setPausedHunts(new Set());
        }
      } catch (error) {
        console.error('Failed to load hunt data:', error);
        // Don't show error message for initial load failure
      }
    };

    loadHuntData();
  }, [username]);

  // Auto-check shiny charm modifier when game is selected (new hunt)
  useEffect(() => {
    if (huntDetails.game && shinyCharmGames.includes(huntDetails.game)) {
      setModifiers(prev => ({ ...prev, shinyCharm: true }));
    }
  }, [huntDetails.game, shinyCharmGames]);

  // Auto-check shiny charm modifier when game is selected (edit modal)
  useEffect(() => {
    if (editForm.game && shinyCharmGames.includes(editForm.game)) {
      setEditForm(prev => ({
        ...prev,
        modifiers: { ...prev.modifiers, shinyCharm: true }
      }));
    }
  }, [editForm.game, shinyCharmGames]);

  // Save immediately on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (username && activeHunts.length > 0) {
        // Use sendBeacon for reliable saving on page unload
        const huntData = {
          activeHunts,
          huntTimers: Object.fromEntries(Object.entries(huntTimers).map(([k, v]) => [k, v])),
          lastCheckTimes: Object.fromEntries(Object.entries(lastCheckTimes).map(([k, v]) => [k, v])),
          totalCheckTimes: Object.fromEntries(Object.entries(totalCheckTimes).map(([k, v]) => [k, v])),
          pausedHunts: Array.from(pausedHunts),
          huntIncrements: Object.fromEntries(Object.entries(huntIncrements).map(([k, v]) => [k, v]))
        };

        // Try to save synchronously on page unload
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', '/api/hunts', false); // Synchronous request
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('authToken')}`);
          xhr.send(JSON.stringify(huntData));
        } catch (error) {
          console.error('Failed to save on page unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [username, activeHunts, huntTimers, lastCheckTimes, totalCheckTimes, pausedHunts, huntIncrements]);


  // Get all Pokemon data (main + forms) using the same logic as the main app
  const allPokemon = useMemo(() => {
    // Use the same filtered forms data as the main app
    const filteredFormsData = getFilteredFormsData(formsData);

    // Combine main Pokemon with filtered forms data
    return [...pokemonData, ...filteredFormsData];
  }, []);

  // Filter Pokemon based on search term
  const filteredPokemon = useMemo(() => {
    if (!searchTerm.trim()) return allPokemon;

    return allPokemon.filter(pokemon => {
      if (!pokemon || !pokemon.name || !pokemon.id) return false;

      const searchLower = searchTerm.toLowerCase();
      const nameMatch = pokemon.name.toLowerCase().includes(searchLower);
      const idMatch = pokemon.id.toString().includes(searchLower);

      return nameMatch || idMatch;
    });
  }, [allPokemon, searchTerm]);

  const handlePokemonSelect = (pokemon) => {
    if (!pokemonModalClosing) {
      setSelectedPokemon(pokemon);
      setPokemonModalClosing(true);
      setTimeout(() => {
        setShowPokemonModal(false);
        setPokemonModalClosing(false);

        if (isEditingPokemon) {
          // If we're editing, update the edit form and return to edit modal
          setEditForm(prev => ({ ...prev, pokemon: pokemon }));
          setIsEditingPokemon(false);
          // Restore the edit modal with the original hunt data
          setEditModal(prev => ({ ...prev, show: true }));
        } else {
          // Normal flow - go to hunt modal
          setShowHuntModal(true);
        }
      }, 300);
    }
  };

  // OLD COMPLEX SCROLL PREVENTION - DISABLED
  // Disable body scrolling when modals are open
  useEffect(() => {
    const hasOpenModal = showPokemonModal || showHuntModal || resetModal.show || deleteModal.show || settingsModal.show || completionModal.show;

    if (hasOpenModal) {
      const preventScroll = (e) => {
        // Check if the scroll event is happening inside modal content or dropdown
        const target = e.target;
        const isInsideModalContent = target.closest('.hunt-modal-content, .pokemon-modal-content');
        const isInsideDropdown = target.closest('.dropdown, .dropdown-content, .select-dropdown, [role="listbox"], [role="option"]');

        // Only allow scrolling inside modal content or dropdowns
        if (isInsideModalContent || isInsideDropdown) {
          return;
        }

        // Prevent all other scrolling when modal is open
        e.preventDefault();
        e.stopPropagation();
        return false;
      };

      const preventKeyboardScroll = (e) => {
        // Check if the keydown event is happening inside modal content or dropdown
        const target = e.target;
        const isInsideModalContent = target.closest('.hunt-modal-content, .pokemon-modal-content');
        const isInsideDropdown = target.closest('.dropdown, .dropdown-content, .select-dropdown, [role="listbox"], [role="option"]');
        const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

        // Only allow keyboard scrolling inside modal content, dropdowns, or input fields
        if (isInsideModalContent || isInsideDropdown || isInputField) {
          return;
        }

        // Prevent keyboard scrolling everywhere else
        if ([32, 33, 34, 35, 36, 37, 38, 39, 40].includes(e.keyCode)) {
          e.preventDefault();
        }
      };

      // Add event listeners to prevent scrolling - use capture phase to catch all events
      document.addEventListener('wheel', preventScroll, { passive: false, capture: true });
      document.addEventListener('touchmove', preventScroll, { passive: false, capture: true });
      document.addEventListener('keydown', preventKeyboardScroll, { capture: true });

      // Also add event listeners to modal backdrops to ensure they catch scroll events
      const modalBackdrops = document.querySelectorAll('.pokemon-modal-backdrop, .hunt-modal-backdrop');
      modalBackdrops.forEach(backdrop => {
        backdrop.addEventListener('wheel', preventScroll, { passive: false });
        backdrop.addEventListener('touchmove', preventScroll, { passive: false });
      });

      return () => {
        document.removeEventListener('wheel', preventScroll, { capture: true });
        document.removeEventListener('touchmove', preventScroll, { capture: true });
        document.removeEventListener('keydown', preventKeyboardScroll, { capture: true });

        // Remove backdrop event listeners
        modalBackdrops.forEach(backdrop => {
          backdrop.removeEventListener('wheel', preventScroll);
          backdrop.removeEventListener('touchmove', preventScroll);
        });
      };
    }
  }, [showPokemonModal, showHuntModal, resetModal.show, deleteModal.show, settingsModal.show, editModal.show, completionModal.show]);

  // Simple body scroll disable when modals are open
  useEffect(() => {
    const hasOpenModal = showPokemonModal || showHuntModal || resetModal.show || deleteModal.show || settingsModal.show || editModal.show || completionModal.show;

    if (hasOpenModal) {
      const html = document.documentElement;
      const body = document.body;
      // Store the current scroll position
      const scrollY = window.scrollY;
      body.dataset.scrollY = scrollY;

      // Prevent scrolling without using position:fixed on body
      // This avoids breaking fixed-position modals during page transitions
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      html.style.height = '100vh';
      body.style.height = '100vh';
      body.style.marginTop = `-${scrollY}px`;
      body.style.paddingTop = `${scrollY}px`;

      return () => {
        // Re-enable body scrolling
        html.style.overflow = '';
        body.style.overflow = '';
        html.style.height = '';
        body.style.height = '';
        body.style.marginTop = '';
        body.style.paddingTop = '';

        // Restore scroll position
        const savedScrollY = parseInt(body.dataset.scrollY || '0', 10);
        window.scrollTo(0, savedScrollY);
      };
    }
  }, [showPokemonModal, showHuntModal, resetModal.show, deleteModal.show, settingsModal.show, editModal.show, completionModal.show]);

  // Add CSS to prevent scroll chaining on modal content
  useEffect(() => {
    const hasOpenModal = showPokemonModal || showHuntModal || resetModal.show || deleteModal.show || settingsModal.show || editModal.show || completionModal.show;

    if (hasOpenModal) {
      // Add CSS to prevent scroll chaining
      const style = document.createElement('style');
      style.textContent = `
        .hunt-modal-content, .pokemon-modal-content {
          overscroll-behavior: contain;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [showPokemonModal, showHuntModal, resetModal.show, deleteModal.show, settingsModal.show, editModal.show, completionModal.show]);


  const handleAddHunt = () => {
    setSearchTerm("");
    setPokemonModalClosing(false);
    setIsEditingPokemon(false); // Reset editing state to ensure we start a new hunt
    setShowPokemonModal(true);
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
        game: "",
        ball: "",
        mark: "",
        method: "",
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

  const handleAddCheck = (huntId) => {
    const now = Date.now();
    const isPaused = pausedHunts.has(huntId);

    // Get the current bottom timer value (what's actually displayed)
    const bottomTimerValue = currentBottomTimers[huntId] || 0;

    // Only add the bottom timer value if hunt is not currently paused
    const timeToAdd = isPaused ? 0 : bottomTimerValue;

    // Get the increment value for this hunt (default to 1 if not set)
    const incrementValue = huntIncrements[huntId] || 1;

    const updatedActiveHunts = activeHunts.map(hunt =>
      hunt.id === huntId
        ? { ...hunt, checks: hunt.checks + incrementValue }
        : hunt
    );
    const updatedLastCheckTimes = { ...lastCheckTimes, [huntId]: now };
    const updatedTotalCheckTimes = {
      ...totalCheckTimes,
      [huntId]: (totalCheckTimes[huntId] || 0) + timeToAdd
    };

    setActiveHunts(updatedActiveHunts);
    setLastCheckTimes(updatedLastCheckTimes);
    setTotalCheckTimes(updatedTotalCheckTimes);

    // Save immediately for critical actions like adding checks
    if (username) {
      const huntData = {
        activeHunts: updatedActiveHunts,
        huntTimers: Object.fromEntries(Object.entries(huntTimers).map(([k, v]) => [k, v])),
        lastCheckTimes: Object.fromEntries(Object.entries(updatedLastCheckTimes).map(([k, v]) => [k, v])),
        totalCheckTimes: Object.fromEntries(Object.entries(updatedTotalCheckTimes).map(([k, v]) => [k, v])),
        pausedHunts: Array.from(pausedHunts),
        huntIncrements: Object.fromEntries(Object.entries(huntIncrements).map(([k, v]) => [k, v]))
      };
      saveHuntData(huntData);
    }
  };

  const handleDecreaseCheck = (huntId) => {
    const hunt = activeHunts.find(h => h.id === huntId);
    if (!hunt || hunt.checks <= 0) return; // Don't go below 0

    // Get the increment value for this hunt (default to 1 if not set)
    const incrementValue = huntIncrements[huntId] || 1;

    const updatedActiveHunts = activeHunts.map(h =>
      h.id === huntId
        ? { ...h, checks: Math.max(0, h.checks - incrementValue) } // Ensure it doesn't go below 0
        : h
    );

    setActiveHunts(updatedActiveHunts);

    // Save immediately for critical actions like decreasing checks
    if (username) {
      const huntData = {
        activeHunts: updatedActiveHunts,
        huntTimers: Object.fromEntries(Object.entries(huntTimers).map(([k, v]) => [k, v])),
        lastCheckTimes: Object.fromEntries(Object.entries(lastCheckTimes).map(([k, v]) => [k, v])),
        totalCheckTimes: Object.fromEntries(Object.entries(totalCheckTimes).map(([k, v]) => [k, v])),
        pausedHunts: Array.from(pausedHunts),
        huntIncrements: Object.fromEntries(Object.entries(huntIncrements).map(([k, v]) => [k, v]))
      };
      saveHuntData(huntData);
    }
  };

  const handleCompleteHunt = (hunt) => {
    // Open completion modal to get final details
    setCompletionModal({ show: true, hunt });
    setCompletionForm({
      ball: hunt.ball || '',
      mark: hunt.mark || '',
      notes: hunt.notes || ''
    });
  };

  const handleCompletionConfirm = async () => {
    if (!completionModal.hunt) return;

    // Validate notes content before proceeding (silent validation - no toast)
    const validation = validateContent(String(completionForm.notes || ''), 'notes');
    if (!validation.isValid) {
      // Don't show toast here since ContentFilterInput already showed it
      return;
    }

    // Get the current hunt data from activeHunts (in case it was edited)
    const currentHunt = activeHunts.find(h => h.id === completionModal.hunt.id);
    if (!currentHunt) {
      showMessage('Hunt not found', 'error');
      return;
    }

    const hunt = currentHunt;
    const huntId = hunt.id;

    // Create the caught entry with completion details
    const caughtEntry = {
      date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      ball: completionForm.ball || "",
      mark: completionForm.mark || "",
      game: hunt.game,
      method: hunt.method,
      checks: hunt.checks || "",
      time: totalCheckTimes[huntId] || 0, // Store time in milliseconds
      notes: completionForm.notes || "",
      entryId: Math.random().toString(36).substr(2, 9),
      modifiers: hunt.modifiers || {} // Store modifiers with the entry
    };

    // Get the caught key for this Pokemon - all hunts in the Counters page are shiny hunts
    const caughtKey = getCaughtKey(hunt.pokemon, null, true); // Always true since this is a shiny hunting tracker
    console.log('Completion - Pokemon:', hunt.pokemon);
    console.log('Completion - Caught Key:', caughtKey);
    console.log('Completion - Username:', username);

    // First, fetch existing caught data from the database
    try {
      const { fetchCaughtData } = await import('../api/caught');
      const existingCaughtData = await fetchCaughtData(username);
      console.log('Completion - Existing caught data:', existingCaughtData);
      const existingCaughtInfo = existingCaughtData[caughtKey] || null;
      console.log('Completion - Existing caught info for this Pokemon:', existingCaughtInfo);

      // Create or update caught info
      let updatedCaughtInfo;
      if (existingCaughtInfo && existingCaughtInfo.entries) {
        // Pokemon is already caught, add new entry
        updatedCaughtInfo = {
          ...existingCaughtInfo,
          caught: true,
          entries: [...existingCaughtInfo.entries, caughtEntry]
        };
        console.log('Completion - Adding to existing entries:', updatedCaughtInfo);
      } else {
        // Pokemon is not caught yet, create new caught info
        updatedCaughtInfo = {
          caught: true,
          entries: [caughtEntry]
        };
        console.log('Completion - Creating new caught info:', updatedCaughtInfo);
      }

      // Save to database using the same system as the main grid
      const { updateCaughtData } = await import('../api/caught');
      console.log('Completion - About to save to database...');
      await updateCaughtData(username, caughtKey, updatedCaughtInfo);
      console.log('Completion - Successfully saved to database');

      // Dispatch custom event to notify other components of caught data change
      window.dispatchEvent(new CustomEvent('caughtDataChanged', {
        detail: {
          pokemon: hunt.pokemon,
          caughtInfo: updatedCaughtInfo,
          caughtKey: caughtKey
        }
      }));
      console.log('Completion - Dispatched caughtDataChanged event');
    } catch (error) {
      console.error('Failed to save caught data to database:', error);
      showMessage('Failed to save to collection', 'error');
      return; // Don't proceed with hunt cleanup if save failed
    }

    // Remove from active hunts
    const updatedActiveHunts = activeHunts.filter(h => h.id !== huntId);
    const updatedTotalCheckTimes = { ...totalCheckTimes };
    delete updatedTotalCheckTimes[huntId];
    const updatedLastCheckTimes = { ...lastCheckTimes };
    delete updatedLastCheckTimes[huntId];
    const updatedHuntTimers = { ...huntTimers };
    delete updatedHuntTimers[huntId];
    const updatedHuntIncrements = { ...huntIncrements };
    delete updatedHuntIncrements[huntId];
    const updatedPausedHunts = new Set(pausedHunts);
    updatedPausedHunts.delete(huntId);

    setActiveHunts(updatedActiveHunts);
    setTotalCheckTimes(updatedTotalCheckTimes);
    setLastCheckTimes(updatedLastCheckTimes);
    setHuntTimers(updatedHuntTimers);
    setHuntIncrements(updatedHuntIncrements);
    setPausedHunts(updatedPausedHunts);

    // Save the updated hunt data to the database immediately
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

    // Close modal with animation
    setCompletionModalClosing(true);
    setTimeout(() => {
      setCompletionModal({ show: false, hunt: null });
      setCompletionModalClosing(false);
      setCompletionForm({ ball: '', mark: '', notes: '' });
      showMessage(`${formatPokemonName(hunt.pokemon.name)} hunt completed and added to collection!`, "success");
    }, 300);
  };

  const handleDeleteHunt = (huntId) => {
    const hunt = activeHunts.find(h => h.id === huntId);
    setDeleteModal({ show: true, hunt });
  };

  const handleDeleteConfirm = () => {
    if (!deleteModal.hunt) return;

    const huntId = deleteModal.hunt.id;

    // Apply deletion immediately
    const updatedActiveHunts = activeHunts.filter(h => h.id !== huntId);
    const updatedTotalCheckTimes = { ...totalCheckTimes };
    delete updatedTotalCheckTimes[huntId];
    const updatedLastCheckTimes = { ...lastCheckTimes };
    delete updatedLastCheckTimes[huntId];
    const updatedHuntTimers = { ...huntTimers };
    delete updatedHuntTimers[huntId];
    const updatedHuntIncrements = { ...huntIncrements };
    delete updatedHuntIncrements[huntId];
    const updatedPausedHunts = new Set(pausedHunts);
    updatedPausedHunts.delete(huntId);

    setActiveHunts(updatedActiveHunts);
    setTotalCheckTimes(updatedTotalCheckTimes);
    setCurrentBottomTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[huntId];
      return newTimers;
    });
    setLastCheckTimes(updatedLastCheckTimes);
    setHuntTimers(updatedHuntTimers);
    setHuntIncrements(updatedHuntIncrements);
    setPausedHunts(updatedPausedHunts);

    // Save the updated hunt data to the database immediately
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

    // Close modal with animation
    setDeleteModalClosing(true);
    setTimeout(() => {
      setDeleteModal({ show: false, hunt: null });
      setDeleteModalClosing(false);
      showMessage("Hunt deleted", "info");
    }, 300);
  };

  const handleInfoHunt = (huntId) => {
    setExpandedHunts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(huntId)) {
        newSet.delete(huntId);
      } else {
        newSet.add(huntId);
      }
      return newSet;
    });
  };

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

      setActiveHunts(prev => prev.map(hunt =>
        hunt.id === huntId ? { ...hunt, checks: 0 } : hunt
      ));
      setTotalCheckTimes(prev => ({ ...prev, [huntId]: 0 }));
      setCurrentBottomTimers(prev => ({ ...prev, [huntId]: 0 }));
      setLastCheckTimes(prev => ({ ...prev, [huntId]: now })); // Force timer reset

      setResetModal({ show: false, hunt: null });
      setResetModalClosing(false);
      showMessage("Hunt reset", "info");
    }, 300);
  };

  const handleBottomTimerUpdate = useCallback((huntId, timeInMs) => {
    setCurrentBottomTimers(prev => ({ ...prev, [huntId]: timeInMs }));
  }, []);

  const handleSettingsHunt = (huntId) => {
    const hunt = activeHunts.find(h => h.id === huntId);
    setSettingsModal({ show: true, hunt });
    setSettingsForm({
      manualChecks: hunt.checks.toString(),
      manualTotalTime: formatTime(totalCheckTimes[huntId] || 0),
      manualIncrements: (huntIncrements[huntId] || 1).toString()
    });
  };

  const handleEditHunt = (huntId) => {
    const hunt = activeHunts.find(h => h.id === huntId);
    setEditModal({ show: true, hunt });
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

  const handleSettingsConfirm = () => {
    if (!settingsModal.hunt) return;

    const huntId = settingsModal.hunt.id;

    // Parse and apply manual checks
    const newChecks = parseInt(settingsForm.manualChecks) || 0;

    // Parse and apply manual total time (convert from "1h 2m 3s" format to milliseconds)
    const timeStr = settingsForm.manualTotalTime;
    let totalMs = 0;
    if (timeStr) {
      const hours = (timeStr.match(/(\d+)h/) || [0, 0])[1];
      const minutes = (timeStr.match(/(\d+)m/) || [0, 0])[1];
      const seconds = (timeStr.match(/(\d+)s/) || [0, 0])[1];
      totalMs = (parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)) * 1000;
    }

    // Parse and apply manual increments (default to 1 if invalid)
    const newIncrements = parseInt(settingsForm.manualIncrements) || 1;

    // Apply changes immediately
    setActiveHunts(prev => prev.map(hunt =>
      hunt.id === huntId ? { ...hunt, checks: newChecks } : hunt
    ));
    setTotalCheckTimes(prev => ({ ...prev, [huntId]: totalMs }));
    setHuntIncrements(prev => ({ ...prev, [huntId]: newIncrements }));

    // Save immediately after settings changes
    if (username) {
      saveHuntData();
    }

    // Close modal with animation
    setSettingsModalClosing(true);
    setTimeout(() => {
      setSettingsModal({ show: false, hunt: null });
      setSettingsModalClosing(false);
      showMessage("Hunt settings updated", "success");
    }, 300);
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
        huntTimers: Object.fromEntries(Object.entries(huntTimers).map(([k, v]) => [k, v])),
        lastCheckTimes: Object.fromEntries(Object.entries(lastCheckTimes).map(([k, v]) => [k, v])),
        totalCheckTimes: Object.fromEntries(Object.entries(totalCheckTimes).map(([k, v]) => [k, v])),
        pausedHunts: Array.from(pausedHunts),
        huntIncrements: Object.fromEntries(Object.entries(huntIncrements).map(([k, v]) => [k, v]))
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

  const handlePauseHunt = (huntId) => {
    const now = Date.now();
    const lastAction = lastPauseAction.current[huntId];

    // Prevent duplicate calls within 500ms
    if (lastAction && now - lastAction < 500) {
      return;
    }

    lastPauseAction.current[huntId] = now;

    const wasPaused = pausedHunts.has(huntId);

    setPausedHunts(prev => {
      const newSet = new Set(prev);
      if (wasPaused) {
        newSet.delete(huntId);
      } else {
        newSet.add(huntId);
      }
      return newSet;
    });

    // Show message after state update
    if (wasPaused) {
      showMessage("Hunt resumed", "info");
    } else {
      showMessage("Hunt paused", "info");
    }
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

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

  const getPokemonImage = (pokemon) => {
    if (!pokemon) return "";

    // Always show shiny sprites for hunt tracking
    return pokemon.sprites?.front_shiny || pokemon.sprites?.front_default || "";
  };

  // Get available methods for selected game
  const availableMethods = useMemo(() => {
    if (!huntDetails.game) return [];
    return getMethodsForGame(huntDetails.game);
  }, [huntDetails.game]);

  // Get current odds based on selected method and modifiers
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

  // Get all available games (use GAME_OPTIONS with images)
  const allGames = useMemo(() => {
    return GAME_OPTIONS;
  }, []);

  // Get modifiers for the selected game
  const gameModifiers = useMemo(() => {
    return getModifiersForGame(huntDetails.game);
  }, [huntDetails.game]);

  return (
    <>
      <div className="container page-container counters-page">
        <h1 className="page-title">Hunt Tracker</h1>
        <div className="app-divider" />

        {/* Active Hunts Section */}
        <div className="active-hunts-section">
          <div className="hunts-grid">
            {activeHunts.map((hunt) => (
              <div key={hunt.id} className="hunt-card">
                <div className="hunt-header">
                  {!expandedHunts.has(hunt.id) ? (
                    // Normal view: Pokemon name and sprite
                    <>
                      <div className="hunt-pokemon">
                        <img
                          src={getPokemonImage(hunt.pokemon)}
                          alt={formatPokemonName(hunt.pokemon.name)}
                          className="hunt-pokemon-image"
                        />
                        <div className="hunt-pokemon-info">
                          <h3>{formatPokemonName(hunt.pokemon.name)}</h3>
                          {hunt.pokemon.formType && hunt.pokemon.formType !== "main" && (
                            <div className="hunt-pokemon-form">
                              {hunt.pokemon.formType === "alpha" || hunt.pokemon.formType === "alphaother"
                                ? "Alpha"
                                : hunt.pokemon.formType === "alphaother"
                                  ? "Alpha Forms"
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
                        {!expandedHunts.has(hunt.id) ? (
                          <>
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
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditHunt(hunt.id)}
                              className="hunt-edit-btn"
                              title="Edit hunt"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleInfoHunt(hunt.id)}
                              className="hunt-info-btn"
                              title="Hide hunt details"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    // Expanded view: Game and method details
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
                    <button
                      onClick={() => handleDecreaseCheck(hunt.id)}
                      className="decrease-check-btn"
                      title="Decrease check"
                      disabled={hunt.checks <= 0}
                    >
                      <Minus size={12} />
                    </button>
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
                      onClick={() => handleAddCheck(hunt.id)}
                      className="add-check-btn"
                      title="Add check"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="hunt-complete">
                  <div className="hunt-odds-display">
                    <span className="odds-label">Odds:</span>
                    <span className="odds-value">
                      {(() => {
                        // Special case for Ultra Wormholes in Ultra Sun/Ultra Moon
                        if (hunt.method === "Ultra Wormholes" && (hunt.game === "Ultra Sun" || hunt.game === "Ultra Moon")) {
                          return "1% - 36%";
                        }

                        // Use the hunt's own modifiers instead of global modifiers
                        // Provide default modifiers if not present (for backward compatibility)
                        const huntModifiers = hunt.modifiers || {
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
                        };

                        // For Poke Radar in Diamond/Pearl/Platinum, calculate current odds based on chain length
                        if (hunt.method === "Poke Radar" && (hunt.game === "Diamond" || hunt.game === "Pearl" || hunt.game === "Platinum")) {
                          return `1/${getCurrentHuntOdds(hunt.game, hunt.method, huntModifiers, hunt.checks)}`;
                        }
                        // For Poke Radar in X/Y, calculate current odds based on chain length
                        if (hunt.method === "Poke Radar" && (hunt.game === "X" || hunt.game === "Y")) {
                          return `1/${getCurrentHuntOdds(hunt.game, hunt.method, huntModifiers, hunt.checks)}`;
                        }
                        // For Poke Radar in Brilliant Diamond/Shining Pearl, calculate current odds based on chain length
                        if (hunt.method === "Poke Radar" && (hunt.game === "Brilliant Diamond" || hunt.game === "Shining Pearl")) {
                          return `1/${getCurrentHuntOdds(hunt.game, hunt.method, huntModifiers, hunt.checks)}`;
                        }
                        // For Chain Fishing in X/Y, calculate current odds based on streak length
                        if (hunt.method === "Chain Fishing" && (hunt.game === "X" || hunt.game === "Y")) {
                          return `1/${getCurrentHuntOdds(hunt.game, hunt.method, huntModifiers, hunt.checks)}`;
                        }
                        // For Chain Fishing in Omega Ruby/Alpha Sapphire, calculate current odds based on streak length
                        if (hunt.method === "Chain Fishing" && (hunt.game === "Omega Ruby" || hunt.game === "Alpha Sapphire")) {
                          return `1/${getCurrentHuntOdds(hunt.game, hunt.method, huntModifiers, hunt.checks)}`;
                        }
                        // For DexNav in Omega Ruby/Alpha Sapphire, calculate current odds based on search level
                        if (hunt.method === "DexNav" && (hunt.game === "Omega Ruby" || hunt.game === "Alpha Sapphire")) {
                          return `1/${getCurrentHuntOdds(hunt.game, hunt.method, huntModifiers, hunt.checks)}`;
                        }
                        // For SOS method in Sun/Moon and Ultra Sun/Ultra Moon, calculate current odds based on chain length
                        if (hunt.method === "SOS" && (hunt.game === "Sun" || hunt.game === "Moon" || hunt.game === "Ultra Sun" || hunt.game === "Ultra Moon")) {
                          return `1/${getCurrentHuntOdds(hunt.game, hunt.method, huntModifiers, hunt.checks)}`;
                        }
                        // For KO Method in Sword/Shield, calculate current odds based on KO count
                        if (hunt.method === "KO Method" && (hunt.game === "Sword" || hunt.game === "Shield")) {
                          return `1/${getCurrentHuntOdds(hunt.game, hunt.method, huntModifiers, hunt.checks)}`;
                        }
                        // For Catch Combo in Let's Go games, calculate current odds based on combo count
                        if (hunt.method === "Catch Combo" && (hunt.game === "Let's Go Pikachu" || hunt.game === "Let's Go Eevee")) {
                          return `1/${getCurrentHuntOdds(hunt.game, hunt.method, huntModifiers, hunt.checks)}`;
                        }
                        // For Mass Outbreaks in Scarlet/Violet, calculate current odds based on checks cleared
                        if (hunt.method === "Mass Outbreaks" && (hunt.game === "Scarlet" || hunt.game === "Violet")) {
                          return `1/${getCurrentHuntOdds(hunt.game, hunt.method, huntModifiers, hunt.checks)}`;
                        }
                        // For all other methods, use the stored odds
                        if (hunt.odds === null) {
                          return "NA";
                        }
                        return `1/${hunt.odds || 4096}`;
                      })()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCompleteHunt(hunt)}
                    className="complete-hunt-btn"
                  >
                    <Check size={16} />
                    Complete Hunt
                  </button>
                </div>
              </div>
            ))}

            {/* Add Hunt Card - always at the end */}
            <div className="add-hunt-card" onClick={handleAddHunt}>
              <div className="add-hunt-content">
                <div className="add-hunt-icon">
                  <Plus size={32} />
                </div>
                <h3>Start New Hunt</h3>
              </div>
            </div>
          </div>
        </div>

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
                      disabled={!huntDetails.game}
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
                  <input
                    type="number"
                    value={settingsForm.manualChecks}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, manualChecks: e.target.value }))}
                    className="w-full px-3 py-2 bg-[var(--searchbar-bg)] border border-[var(--border-color)] rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
                    placeholder="Enter encounter count"
                    min="0"
                  />
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Adjust Increments
                  </label>
                  <input
                    type="number"
                    value={settingsForm.manualIncrements}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, manualIncrements: e.target.value }))}
                    className="w-full px-3 py-2 bg-[var(--searchbar-bg)] border border-[var(--border-color)] rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
                    placeholder="Enter increment value (default: 1)"
                    min="1"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    How many encounters to add each time you click the + button
                  </p>
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
                    disabled={!editForm.game}
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