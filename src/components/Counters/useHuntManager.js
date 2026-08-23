import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  huntAPI,
  profileAPI
} from "../../utils/api";
import {
  formatPokemonName,
  getFormDisplayName
} from "../../utils";
import { getCaughtKey } from "../../caughtStorage";
import {
  normalizeHunt,
  getHuntElapsedTime,
  applyHuntActionToState,
  getCachedHuntsData,
  setCachedHuntsData,
  createHuntChannel
} from "../../utils/huntSync";
import {
  calculateOdds,
  getCurrentHuntOdds
} from "../../utils/huntSystem";
import { getSpriteUrl } from "../../utils/spriteUtils";
import { validateContent } from "../../../shared/contentFilter";

export function useHuntManager({
  mode = "counters", // "counters" | "mmo"
  enableHotkeys = true,
  user = null,
  pokemonData = [],
  formsData = [],
  useHomeSprites = false,
  showMessage = () => {}
}) {
  const username = user?.username || null;

  // ── State Initialization ──────────────────────────────────────────────────
  const [allActiveHunts, setAllActiveHunts] = useState(() => {
    const cached = getCachedHuntsData();
    if (cached?.activeHunts && Array.isArray(cached.activeHunts)) {
      return cached.activeHunts.map(h => normalizeHunt(h));
    }
    try {
      const saved = localStorage.getItem("activeHunts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(h => normalizeHunt(h));
      }
    } catch {}
    return [];
  });

  const [currentHuntId, setCurrentHuntId] = useState(() => {
    try {
      const saved = localStorage.getItem("currentHuntId");
      if (saved) return isNaN(Number(saved)) ? saved : Number(saved);
    } catch {}
    return null;
  });

  const [huntIncrements, setHuntIncrements] = useState(() => {
    try {
      const saved = localStorage.getItem("dex_hunt_increments");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [collapsedPhasesMap, setCollapsedPhasesMap] = useState(() => {
    try {
      const saved = localStorage.getItem("dex_collapsed_phases");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [metricModeMap, setMetricModeMap] = useState(() => {
    try {
      const saved = localStorage.getItem("dex_hunt_metric_mode_map");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [metricMode, setMetricMode] = useState(() => {
    try {
      const saved = localStorage.getItem("dex_hunt_metric_mode");
      return saved === "total" ? "total" : "phase";
    } catch {
      return "phase";
    }
  });

  const [huntHistory, setHuntHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeMenuHuntId, setActiveMenuHuntId] = useState(null);

  // ── Modal States ──────────────────────────────────────────────────────────
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [phaseHistoryModal, setPhaseHistoryModal] = useState({ show: false, hunt: null });
  const [oddsModal, setOddsModal] = useState({ show: false, hunt: null });
  const [resetModal, setResetModal] = useState({ show: false, hunt: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, hunt: null });
  const [settingsModal, setSettingsModal] = useState({ show: false, hunt: null });
  const [settingsForm, setSettingsForm] = useState({
    manualChecks: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    manualIncrements: 1
  });

  const [shinyEncounterModal, setShinyEncounterModal] = useState({
    show: false,
    hunt: null,
    step: 1,
    selectedPokemon: null,
    isTarget: true,
    outcome: null,
    nickname: "",
    ball: "",
    mark: "",
    notes: "",
    addedToCollection: false,
    searchTerm: "",
    formTab: "all",
    phaseResult: null
  });

  const [shinyCharmGames, setShinyCharmGames] = useState(() => {
    if (user?.shinyCharmGames && Array.isArray(user.shinyCharmGames)) {
      return user.shinyCharmGames;
    }
    return [];
  });

  useEffect(() => {
    if (user?.shinyCharmGames && Array.isArray(user.shinyCharmGames)) {
      setShinyCharmGames(user.shinyCharmGames);
    } else if (username) {
      profileAPI.getProfile().then(profile => {
        if (profile?.shinyCharmGames && Array.isArray(profile.shinyCharmGames)) {
          setShinyCharmGames(profile.shinyCharmGames);
        }
      }).catch(() => {});
    }
  }, [user, username]);

  useEffect(() => {
    const handleShinyCharmUpdate = (event) => {
      if (event.detail?.shinyCharmGames && Array.isArray(event.detail.shinyCharmGames)) {
        setShinyCharmGames(event.detail.shinyCharmGames);
      }
    };
    window.addEventListener('shinyCharmGamesUpdated', handleShinyCharmUpdate);
    return () => window.removeEventListener('shinyCharmGamesUpdated', handleShinyCharmUpdate);
  }, []);

  const [huntWizard, setHuntWizard] = useState({
    isOpen: false,
    step: 0,
    game: mode === "mmo" ? "Legends Arceus" : "Scarlet",
    method: mode === "mmo" ? "Permutations" : "Mass Outbreaks",
    modifiers: mode === "mmo" ? { shinyCharm: false, researchLv10: false, perfectResearch: false } : {},
    selectedPokemon: null,
    possiblePhases: [],
    allowAnyPhase: true,
    startChecks: 0,
    startTime: { hours: 0, minutes: 0, seconds: 0 },
    huntIncrement: 1,
    targetPhasesNotes: "",
    searchTerm: "",
    formTab: "all"
  });

  // ── Hotkey Configuration State ────────────────────────────────────────────
  const [hotkey, setHotkey] = useState(() => {
    try {
      return localStorage.getItem("huntHotkey") || " ";
    } catch {
      return " ";
    }
  });

  const [decrementHotkey, setDecrementHotkey] = useState(() => {
    try {
      return localStorage.getItem("huntDecrementHotkey") || "-";
    } catch {
      return "-";
    }
  });

  const [hotkeyModal, setHotkeyModal] = useState(false);
  const [listeningFor, setListeningFor] = useState(null);
  const [hotkeyError, setHotkeyError] = useState("");

  // Sync profile hotkeys when user logs in
  useEffect(() => {
    if (user?.huntHotkey) {
      setHotkey(user.huntHotkey);
      try { localStorage.setItem("huntHotkey", user.huntHotkey); } catch {}
    }
    if (user?.huntDecrementHotkey) {
      setDecrementHotkey(user.huntDecrementHotkey);
      try { localStorage.setItem("huntDecrementHotkey", user.huntDecrementHotkey); } catch {}
    }
  }, [user]);

  // ── BroadcastChannel Reference ────────────────────────────────────────────
  const channelRef = useRef(null);
  const allActiveHuntsRef = useRef(allActiveHunts);
  allActiveHuntsRef.current = allActiveHunts;

  // ── Filtered Lists for Mode Scoping ───────────────────────────────────────
  const activeHunts = useMemo(() => {
    if (mode === "mmo") {
      return allActiveHunts.filter(h => (h.game === "Legends Arceus" && h.method === "Permutations") || h.method === "Permutations");
    }
    return allActiveHunts.filter(h => !(h.game === "Legends Arceus" && h.method === "Permutations") && h.method !== "Permutations");
  }, [allActiveHunts, mode]);

  const currentHunt = useMemo(() => {
    if (activeHunts.length === 0) return null;
    if (currentHuntId != null) {
      const found = activeHunts.find(h => String(h.id) === String(currentHuntId));
      if (found) return found;
    }
    return activeHunts[0] || null;
  }, [activeHunts, currentHuntId]);

  const otherHunts = useMemo(() => {
    if (!currentHunt) return activeHunts;
    return activeHunts.filter(h => String(h.id) !== String(currentHunt.id));
  }, [activeHunts, currentHunt]);

  const historyBadgeCount = useMemo(() => {
    if (mode === "mmo") {
      return (huntHistory || []).filter(h => (h.game === "Legends Arceus" && h.method === "Permutations") || h.method === "Permutations").length;
    }
    return (huntHistory || []).filter(h => !(h.game === "Legends Arceus" && h.method === "Permutations") && h.method !== "Permutations").length;
  }, [huntHistory, mode]);

  // ── Debounced Backend & Local Persistence ─────────────────────────────────
  const saveTimeoutRef = useRef(null);

  const debouncedSave = useCallback((huntsToSave, activeId = currentHuntId) => {
    const listToSave = huntsToSave || allActiveHuntsRef.current;
    try {
      localStorage.setItem("activeHunts", JSON.stringify(listToSave));
      if (activeId != null) {
        localStorage.setItem("currentHuntId", String(activeId));
      }
    } catch {}

    if (username) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        huntAPI.updateHuntData({
          activeHunts: listToSave,
          currentHuntId: activeId
        }).catch(err => console.error("Failed to save hunts to backend:", err));
      }, 350);
    }
  }, [username, currentHuntId]);

  // ── Initial Fetch from Backend ────────────────────────────────────────────
  useEffect(() => {
    if (!username) return;
    let isMounted = true;

    huntAPI.getHuntData().then(data => {
      if (!isMounted || !data) return;
      if (Array.isArray(data.activeHunts)) {
        const normalized = data.activeHunts.map(h => normalizeHunt(h));
        setAllActiveHunts(normalized);
        setCachedHuntsData({ activeHunts: normalized });
        try { localStorage.setItem("activeHunts", JSON.stringify(normalized)); } catch {}
      }
      if (data.currentHuntId != null) {
        setCurrentHuntId(data.currentHuntId);
        try { localStorage.setItem("currentHuntId", String(data.currentHuntId)); } catch {}
      }
    }).catch(err => console.error("Error fetching hunts data:", err));

    return () => { isMounted = false; };
  }, [username]);

  // ── BroadcastChannel Multi-tab Sync ───────────────────────────────────────
  useEffect(() => {
    channelRef.current = createHuntChannel((msg) => {
      if (!msg) return;

      if (msg.type === "HUNT_ACTION" && msg.action) {
        setAllActiveHunts(prev => {
          const next = applyHuntActionToState(prev, msg.action, msg.action.timestamp || Date.now());
          setCachedHuntsData({ activeHunts: next });
          return next;
        });
      } else if (msg.type === "HUNT_UPDATED" && msg.hunt) {
        setAllActiveHunts(prev => {
          const idx = prev.findIndex(h => String(h.id) === String(msg.hunt.id));
          let next;
          if (idx >= 0) {
            next = [...prev];
            next[idx] = normalizeHunt(msg.hunt);
          } else {
            next = [normalizeHunt(msg.hunt), ...prev];
          }
          setCachedHuntsData({ activeHunts: next });
          return next;
        });
      } else if (msg.type === "RESPONSE_HUNT_STATE" && Array.isArray(msg.hunts)) {
        const normalized = msg.hunts.map(h => normalizeHunt(h));
        setAllActiveHunts(normalized);
        setCachedHuntsData({ activeHunts: normalized });
      } else if (msg.type === "GET_HUNT_STATE") {
        if (channelRef.current && allActiveHuntsRef.current?.length > 0) {
          channelRef.current.broadcast({
            type: "RESPONSE_HUNT_STATE",
            hunts: allActiveHuntsRef.current
          });
        }
      }
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
    };
  }, []);

  // ── Auto-Pause on Page Departure / Close ──────────────────────────────────
  const autoPauseRunningHunts = useCallback(() => {
    const currentHunts = allActiveHuntsRef.current;
    if (!currentHunts || currentHunts.length === 0) return;

    const now = Date.now();
    const runningHunts = currentHunts.filter(
      h => h.status === "running" || (!h.isPaused && h.status !== "paused")
    );

    if (runningHunts.length === 0) return;

    let updatedHunts = currentHunts;
    runningHunts.forEach(rh => {
      const action = { type: "PAUSE", huntId: rh.id, timestamp: now };
      updatedHunts = applyHuntActionToState(updatedHunts, action, now);
    });

    setAllActiveHunts(updatedHunts);
    setCachedHuntsData({ activeHunts: updatedHunts });
    try {
      localStorage.setItem("dex_hunt_auto_paused", "true");
    } catch {}

    if (username) {
      huntAPI.updateHuntData({ activeHunts: updatedHunts, currentHuntId }).catch(() => {});
    }

    if (channelRef.current) {
      runningHunts.forEach(rh => {
        channelRef.current.broadcast({
          type: "HUNT_ACTION",
          huntId: rh.id,
          action: { type: "PAUSE", huntId: rh.id, timestamp: now }
        });
      });
    }
  }, [username, currentHuntId]);

  useEffect(() => {
    const handleBeforeUnload = () => autoPauseRunningHunts();
    const handlePageHide = () => autoPauseRunningHunts();

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      autoPauseRunningHunts();
    };
  }, [autoPauseRunningHunts]);

  // Check for auto-paused notice on mount
  useEffect(() => {
    try {
      const flag = localStorage.getItem("dex_hunt_auto_paused");
      if (flag) {
        localStorage.removeItem("dex_hunt_auto_paused");
        showMessage("Hunt was automatically paused when you left.", "info");
      }
    } catch {}
  }, [showMessage]);

  // ── Canonical Action Handlers ─────────────────────────────────────────────
  const handleAddCheck = useCallback((huntId, customDelta = null) => {
    const targetHunt = allActiveHuntsRef.current.find(h => String(h.id) === String(huntId));
    const delta = customDelta !== null ? customDelta : (huntIncrements[huntId] || targetHunt?.increment || 1);
    const now = Date.now();
    const action = {
      type: "INCREMENT",
      huntId,
      amount: delta,
      timestamp: now
    };

    setAllActiveHunts(prev => {
      const next = applyHuntActionToState(prev, action, now);
      setCachedHuntsData({ activeHunts: next });
      debouncedSave(next);
      return next;
    });

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_ACTION",
        huntId,
        action
      });
    }
  }, [huntIncrements, debouncedSave]);

  const handleDecreaseCheck = useCallback((huntId, customDelta = null) => {
    const targetHunt = allActiveHuntsRef.current.find(h => String(h.id) === String(huntId));
    const delta = customDelta !== null ? customDelta : (huntIncrements[huntId] || targetHunt?.increment || 1);
    const now = Date.now();
    const action = {
      type: "DECREMENT",
      huntId,
      amount: delta,
      timestamp: now
    };

    setAllActiveHunts(prev => {
      const next = applyHuntActionToState(prev, action, now);
      setCachedHuntsData({ activeHunts: next });
      debouncedSave(next);
      return next;
    });

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_ACTION",
        huntId,
        action
      });
    }
  }, [huntIncrements, debouncedSave]);


  const handleTogglePause = useCallback((huntId) => {
    const now = Date.now();
    const action = {
      type: "TOGGLE_PAUSE",
      huntId,
      timestamp: now
    };

    setAllActiveHunts(prev => {
      const next = applyHuntActionToState(prev, action, now);
      setCachedHuntsData({ activeHunts: next });
      debouncedSave(next);
      return next;
    });

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_ACTION",
        huntId,
        action
      });
    }
  }, [debouncedSave]);

  const handleConfirmResetTimer = useCallback((huntId) => {
    const now = Date.now();
    const action = {
      type: "RESET_STATS",
      huntId,
      timestamp: now
    };

    setAllActiveHunts(prev => {
      const next = applyHuntActionToState(prev, action, now);
      setCachedHuntsData({ activeHunts: next });
      debouncedSave(next);
      return next;
    });

    setResetModal({ show: false, hunt: null });
    showMessage("Hunt timer and stats reset", "success");

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_ACTION",
        huntId,
        action
      });
    }
  }, [debouncedSave, showMessage]);

  const handleDeleteHunt = useCallback((huntId) => {
    const nextHunts = allActiveHuntsRef.current.filter(h => String(h.id) !== String(huntId));
    const nextActive = mode === "mmo"
      ? nextHunts.filter(h => (h.game === "Legends Arceus" && h.method === "Permutations") || h.method === "Permutations")
      : nextHunts.filter(h => !(h.game === "Legends Arceus" && h.method === "Permutations") && h.method !== "Permutations");
    const nextCurrentId = String(currentHuntId) === String(huntId) ? (nextActive[0]?.id || null) : currentHuntId;

    setAllActiveHunts(nextHunts);
    setCurrentHuntId(nextCurrentId);
    try {
      if (nextCurrentId != null) localStorage.setItem("currentHuntId", String(nextCurrentId));
      else localStorage.removeItem("currentHuntId");
    } catch {}

    setCachedHuntsData({ activeHunts: nextHunts });
    setDeleteModal({ show: false, hunt: null });
    setActiveMenuHuntId(null);
    showMessage("Hunt deleted", "info");

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_ACTION",
        huntId,
        action: { type: "DELETE", huntId, timestamp: Date.now() }
      });
      channelRef.current.broadcast({
        type: "RESPONSE_HUNT_STATE",
        hunts: nextHunts
      });
    }

    debouncedSave(nextHunts, nextCurrentId);
  }, [mode, currentHuntId, debouncedSave, showMessage]);

  const handleSwitchCurrentHunt = useCallback((newHuntId) => {
    if (!newHuntId || String(newHuntId) === String(currentHuntId)) return;

    const now = Date.now();
    let updatedHunts = allActiveHuntsRef.current;
    const runningHunts = updatedHunts.filter(h => h.status === "running" || (!h.isPaused && h.status !== "paused"));

    if (runningHunts.length > 0) {
      runningHunts.forEach(rh => {
        const action = { type: "PAUSE", huntId: rh.id, timestamp: now };
        updatedHunts = applyHuntActionToState(updatedHunts, action, now);
        if (channelRef.current) {
          channelRef.current.broadcast({
            type: "HUNT_ACTION",
            huntId: rh.id,
            action
          });
        }
      });
      setAllActiveHunts(updatedHunts);
      setCachedHuntsData({ activeHunts: updatedHunts });
    }

    setCurrentHuntId(newHuntId);
    try {
      localStorage.setItem("currentHuntId", String(newHuntId));
    } catch {}
    debouncedSave(updatedHunts, newHuntId);
  }, [currentHuntId, debouncedSave]);

  const handleToggleCollapsePhases = useCallback((huntId) => {
    setCollapsedPhasesMap(prev => {
      const next = { ...prev, [huntId]: !prev[huntId] };
      try {
        localStorage.setItem("dex_collapsed_phases", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleToggleMetricMode = useCallback((huntId) => {
    if (huntId) {
      setMetricModeMap(prev => {
        const current = prev[huntId] || "phase";
        const nextMode = current === "phase" ? "total" : "phase";
        const next = { ...prev, [huntId]: nextMode };
        try {
          localStorage.setItem("dex_hunt_metric_mode_map", JSON.stringify(next));
        } catch {}
        return next;
      });
    }
    setMetricMode(prev => {
      const next = prev === "total" ? "phase" : "total";
      try {
        localStorage.setItem("dex_hunt_metric_mode", next);
      } catch {}
      return next;
    });
  }, []);

  const handleSaveAdjustValues = useCallback((hunt, values) => {
    if (!hunt) return;
    const now = Date.now();
    const newChecks = Math.max(0, parseInt(values.manualChecks, 10) || 0);
    const hMs = (parseInt(values.hours, 10) || 0) * 3600000;
    const mMs = (parseInt(values.minutes, 10) || 0) * 60000;
    const sMs = (parseInt(values.seconds, 10) || 0) * 1000;
    const newElapsedMs = Math.max(0, hMs + mMs + sMs);
    const newIncrement = Math.max(1, parseInt(values.manualIncrements, 10) || 1);

    setHuntIncrements(prev => {
      const next = { ...prev, [hunt.id]: newIncrement };
      try {
        localStorage.setItem("dex_hunt_increments", JSON.stringify(next));
      } catch {}
      return next;
    });

    const action = {
      type: "ADJUST_VALUES",
      huntId: hunt.id,
      checks: newChecks,
      elapsedMs: newElapsedMs,
      increment: newIncrement,
      timestamp: now
    };

    setAllActiveHunts(prev => {
      const next = applyHuntActionToState(prev, action, now);
      setCachedHuntsData({ activeHunts: next });
      debouncedSave(next);
      return next;
    });

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_ACTION",
        huntId: hunt.id,
        action
      });
    }

    setSettingsModal({ show: false, hunt: null });
    showMessage("Hunt values updated successfully!", "success");
  }, [debouncedSave, showMessage]);

  const handleOpenPopout = useCallback((hunt) => {
    setActiveMenuHuntId(null);
    const w = 540;
    const h = 530;
    const left = Math.max(0, Math.floor(window.screen.width / 2 - w / 2));
    const top = Math.max(0, Math.floor(window.screen.height / 2 - h / 2));
    window.open(`/hunt-popout/${hunt.id}`, `hunt_popout_${hunt.id}`, `width=${w},height=${h},top=${top},left=${left},resizable=yes`);
  }, []);

  // ── Shiny Encounter & Phase Lifecycles ────────────────────────────────────
  const handleOpenShinyEncounterModal = useCallback((hunt) => {
    if (!hunt) return;

    let activeHuntObj = hunt;
    if (hunt.status === "running" || (!hunt.isPaused && hunt.status !== "paused")) {
      const now = Date.now();
      const action = { type: "PAUSE", huntId: hunt.id, timestamp: now };
      const nextHunts = applyHuntActionToState(allActiveHuntsRef.current, action, now);
      setAllActiveHunts(nextHunts);
      setCachedHuntsData({ activeHunts: nextHunts });
      if (channelRef.current) {
        channelRef.current.broadcast({
          type: "HUNT_ACTION",
          huntId: hunt.id,
          action
        });
      }
      debouncedSave(nextHunts);
      activeHuntObj = nextHunts.find(h => String(h.id) === String(hunt.id)) || hunt;
    }

    setShinyEncounterModal({
      show: true,
      hunt: activeHuntObj,
      step: 1,
      selectedPokemon: activeHuntObj.pokemon,
      isTarget: true,
      outcome: null,
      nickname: "",
      ball: activeHuntObj.ball || "",
      mark: activeHuntObj.mark || "",
      notes: "",
      addedToCollection: false,
      searchTerm: "",
      formTab: "all",
      phaseResult: null
    });
    setActiveMenuHuntId(null);
  }, [debouncedSave]);

  const handleAddShinyToCollection = useCallback(async (pokemon, phaseRecord, huntParam = null) => {
    const hunt = huntParam || shinyEncounterModal.hunt;
    if (!hunt || !pokemon || !phaseRecord) return false;

    const isFormPokemon = pokemon.formType && pokemon.formType !== "main";
    const canonicalForm = isFormPokemon
      ? formsData.find(f => (f.stableId && f.stableId === pokemon.stableId) || (f.id === pokemon.id && f.name?.toLowerCase() === pokemon.name?.toLowerCase()) || (f.id === pokemon.id && f.formType === pokemon.formType))
      : null;
    const canonicalBase = pokemonData.find(p => p.id === pokemon.id && (!pokemon.name || p.name?.toLowerCase() === pokemon.name?.toLowerCase()));
    const workingPokemon = canonicalForm || canonicalBase || pokemon;

    const caughtKey = getCaughtKey(workingPokemon, null, true);
    if (!caughtKey) {
      showMessage("Could not save to Living Dex: unknown Pokémon key", "error");
      return false;
    }

    const caughtEntry = {
      date: phaseRecord.date ? phaseRecord.date.split("T")[0] : new Date().toISOString().split("T")[0],
      game: hunt.game,
      method: hunt.method,
      nickname: (phaseRecord.nickname || shinyEncounterModal.nickname || "").trim(),
      ball: phaseRecord.ball || shinyEncounterModal.ball || "",
      mark: phaseRecord.mark || shinyEncounterModal.mark || "",
      checks: phaseRecord.phaseChecks || 0,
      totalChecks: phaseRecord.totalChecks || 0,
      time: phaseRecord.elapsedMs || 0,
      phases: hunt.phases || [],
      fails: (hunt.phases || []).filter(p => p.outcome === "failed"),
      phaseCount: phaseRecord.phaseNumber || (hunt.phases ? hunt.phases.length + 1 : 1),
      notes: phaseRecord.notes || (shinyEncounterModal.notes || "").trim() || "",
      entryId: phaseRecord.entryId || Math.random().toString(36).substr(2, 9),
      modifiers: hunt.modifiers || {},
      isHuntTracker: true
    };

    try {
      const { fetchCaughtData, updateCaughtData } = await import("../../api/caught");
      const existingData = await fetchCaughtData(username);
      const existingInfo = existingData[caughtKey] || null;

      const updatedInfo = {
        caught: true,
        caughtAt: Date.now(),
        entries: (existingInfo?.entries && Array.isArray(existingInfo.entries))
          ? [...existingInfo.entries, caughtEntry]
          : [caughtEntry]
      };

      if (username) {
        const isFeedPublic = user?.isGlobalFeedPublic !== false;
        const pokeName = formatPokemonName(workingPokemon.name);
        const formName = getFormDisplayName(workingPokemon) || null;
        const sprite = getSpriteUrl(workingPokemon, true, useHomeSprites);
        const newCatchTrigger = isFeedPublic ? { pokemonName: pokeName, formName, sprite, username, profileTrainer: user?.profileTrainer } : null;
        await updateCaughtData(username, caughtKey, updatedInfo, newCatchTrigger);

        try {
          const raw = localStorage.getItem(`caughtInfoMap:${username}`);
          const cached = raw ? JSON.parse(raw) : {};
          cached[caughtKey] = updatedInfo;
          localStorage.setItem(`caughtInfoMap:${username}`, JSON.stringify(cached));
        } catch {}
      }

      try {
        const localMap = JSON.parse(localStorage.getItem("caughtInfoMap") || "{}");
        localMap[caughtKey] = updatedInfo;
        localStorage.setItem("caughtInfoMap", JSON.stringify(localMap));

        const localCaught = JSON.parse(localStorage.getItem("caught") || "{}");
        localCaught[caughtKey] = true;
        localStorage.setItem("caught", JSON.stringify(localCaught));
      } catch {}

      try {
        const rawToggles = localStorage.getItem("dexToggles");
        const currentToggles = rawToggles ? JSON.parse(rawToggles) : {};
        const updatedToggles = { ...currentToggles, showShiny: true };
        localStorage.setItem("dexToggles", JSON.stringify(updatedToggles));
        window.dispatchEvent(new CustomEvent("dexTogglesChanged", { detail: updatedToggles }));
      } catch {}

      window.dispatchEvent(new CustomEvent("caughtDataChanged", {
        detail: {
          pokemon: workingPokemon,
          caughtInfo: updatedInfo,
          caughtKey,
          wasCaught: !!existingInfo,
          isShiny: true
        }
      }));

      setShinyEncounterModal(prev => ({ ...prev, addedToCollection: true }));
      showMessage(`Added Shiny ${formatPokemonName(workingPokemon.name)} to your Living Dex!`, "success");
      return true;
    } catch (e) {
      console.error("Failed to save shiny to collection:", e);
      showMessage("Failed to save to Living Dex", "error");
      return false;
    }
  }, [formsData, pokemonData, shinyEncounterModal, user, username, useHomeSprites, showMessage]);

  const handleAddShinyFailToCollection = useCallback(async (pokemon, phaseRecord, huntParam = null) => {
    const hunt = huntParam || shinyEncounterModal.hunt;
    if (!hunt || !pokemon || !phaseRecord) return false;

    const isFormPokemon = pokemon.formType && pokemon.formType !== "main";
    const canonicalForm = isFormPokemon
      ? formsData.find(f => (f.stableId && f.stableId === pokemon.stableId) || (f.id === pokemon.id && f.name?.toLowerCase() === pokemon.name?.toLowerCase()) || (f.id === pokemon.id && f.formType === pokemon.formType))
      : null;
    const canonicalBase = pokemonData.find(p => p.id === pokemon.id && (!pokemon.name || p.name?.toLowerCase() === pokemon.name?.toLowerCase()));
    const workingPokemon = canonicalForm || canonicalBase || pokemon;

    const caughtKey = getCaughtKey(workingPokemon, null, true);
    if (!caughtKey) {
      showMessage("Could not save to Living Dex: unknown Pokémon key", "error");
      return false;
    }

    const failEntry = {
      date: phaseRecord.date ? phaseRecord.date.split("T")[0] : new Date().toISOString().split("T")[0],
      game: hunt.game,
      method: hunt.method,
      checks: phaseRecord.phaseChecks || 0,
      totalChecks: phaseRecord.totalChecks || 0,
      time: phaseRecord.elapsedMs || 0,
      odds: phaseRecord.odds || calculateOdds(hunt.game, hunt.method, hunt.modifiers || {}) || 4096,
      notes: phaseRecord.notes || (shinyEncounterModal.notes || "").trim() || "",
      modifiers: hunt.modifiers || {},
      outcome: "failed",
      isTarget: phaseRecord.isTarget,
      phaseNumber: phaseRecord.phaseNumber,
      id: phaseRecord.id || Date.now(),
      entryId: phaseRecord.entryId || Math.random().toString(36).substr(2, 9),
      isHuntTracker: true
    };

    try {
      const { fetchCaughtData, updateCaughtData } = await import("../../api/caught");
      const existingData = await fetchCaughtData(username);
      const existingInfo = existingData[caughtKey] || null;
      const isAlreadyCaught = !!(existingInfo && existingInfo.caught !== false && (existingInfo.entries?.length > 0 || existingInfo.caught === true));
      const existingFails = Array.isArray(existingInfo?.fails) ? existingInfo.fails : [];

      const updatedInfo = {
        ...(existingInfo || {}),
        caught: isAlreadyCaught,
        fails: [...existingFails, failEntry]
      };

      if (username) {
        await updateCaughtData(username, caughtKey, updatedInfo);
        try {
          const raw = localStorage.getItem(`caughtInfoMap:${username}`);
          const cached = raw ? JSON.parse(raw) : {};
          cached[caughtKey] = updatedInfo;
          localStorage.setItem(`caughtInfoMap:${username}`, JSON.stringify(cached));
        } catch {}
      }

      try {
        const localMap = JSON.parse(localStorage.getItem("caughtInfoMap") || "{}");
        localMap[caughtKey] = updatedInfo;
        localStorage.setItem("caughtInfoMap", JSON.stringify(localMap));

        if (!isAlreadyCaught) {
          const localCaught = JSON.parse(localStorage.getItem("caught") || "{}");
          if (localCaught[caughtKey]) {
            delete localCaught[caughtKey];
            localStorage.setItem("caught", JSON.stringify(localCaught));
          }
        }
      } catch {}

      window.dispatchEvent(new CustomEvent("caughtDataChanged", {
        detail: {
          pokemon: workingPokemon,
          caughtInfo: updatedInfo,
          caughtKey,
          wasCaught: isAlreadyCaught,
          isShiny: true
        }
      }));

      setShinyEncounterModal(prev => ({ ...prev, addedToCollection: true }));
      showMessage(`Saved Shiny ${formatPokemonName(workingPokemon.name)} fail to Living Dex!`, "success");
      return true;
    } catch (e) {
      console.error("Failed to save fail to collection:", e);
      showMessage("Failed to save to Living Dex", "error");
      return false;
    }
  }, [formsData, pokemonData, shinyEncounterModal, username, showMessage]);

  const handleContinueAfterPhase = useCallback((phaseRecord) => {
    const hunt = shinyEncounterModal.hunt;
    if (!hunt || !phaseRecord) return;
    const now = Date.now();

    const action = {
      type: "LOG_SHINY_PHASE",
      huntId: hunt.id,
      phaseEvent: phaseRecord,
      timestamp: now
    };

    const updatedHunts = applyHuntActionToState(allActiveHuntsRef.current, action, now);
    setAllActiveHunts(updatedHunts);
    setCachedHuntsData({ activeHunts: updatedHunts });

    if (phaseRecord.outcome === "failed") {
      const failEntry = {
        id: phaseRecord.id || now,
        entryId: phaseRecord.entryId || Math.random().toString(36).substr(2, 9),
        pokemon: shinyEncounterModal.selectedPokemon || hunt.pokemon,
        pokemonName: (shinyEncounterModal.selectedPokemon || hunt.pokemon)?.name || "Unknown",
        game: hunt.game,
        method: hunt.method,
        checks: phaseRecord.phaseChecks || 0,
        totalChecks: phaseRecord.totalChecks || hunt.checks || 0,
        elapsedMs: phaseRecord.elapsedMs || 0,
        time: phaseRecord.elapsedMs || 0,
        odds: phaseRecord.odds || hunt.odds || null,
        reason: phaseRecord.reason || (shinyEncounterModal.notes || "").trim() || "Failed Encounter",
        notes: phaseRecord.notes || (shinyEncounterModal.notes || "").trim() || "",
        date: phaseRecord.date || new Date().toISOString(),
        timestamp: now,
        outcome: "failed",
        isFail: true,
        isHuntTracker: true,
        addedToLivingDex: Boolean(shinyEncounterModal.addedToCollection)
      };

      try {
        const storageKey = username ? `completedFails:${username}` : "completedFails";
        const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const updated = [failEntry, ...existing.filter(e => e.entryId !== failEntry.entryId)];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        if (username) localStorage.setItem("completedFails", JSON.stringify(updated));
        setHuntHistory(prev => [failEntry, ...prev.filter(e => e.entryId !== failEntry.entryId)]);
      } catch {}
    }

    setShinyEncounterModal({
      show: false,
      hunt: null,
      step: 1,
      selectedPokemon: null,
      isTarget: true,
      outcome: null,
      nickname: "",
      ball: "",
      mark: "",
      notes: "",
      addedToCollection: false,
      searchTerm: "",
      formTab: "all",
      phaseResult: null
    });

    showMessage(
      phaseRecord.outcome === "failed"
        ? `Phase recorded. Keep hunting, the shiny will return!`
        : `Phase ${phaseRecord.phaseNumber} logged! Continuing hunt for Shiny ${formatPokemonName(hunt.pokemon?.name)}...`,
      "success"
    );

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_ACTION",
        huntId: hunt.id,
        action
      });
      channelRef.current.broadcast({
        type: "HUNT_UPDATED",
        hunt: updatedHunts.find(h => String(h.id) === String(hunt.id))
      });
    }

    debouncedSave(updatedHunts);
  }, [shinyEncounterModal, username, debouncedSave, showMessage]);

  const handleCompleteTargetHunt = useCallback(async (hunt, phaseRecord) => {
    if (!hunt || !phaseRecord) return;
    const workingPokemon = phaseRecord?.pokemon || hunt.pokemon;
    const huntId = hunt.id;
    const now = Date.now();

    const calculatedOdds = phaseRecord.odds || hunt.odds || calculateOdds(hunt.game, hunt.method, hunt.modifiers || {}) || 4096;
    const isFail = phaseRecord.outcome === "failed";

    const completedEntry = {
      id: now,
      entryId: phaseRecord.entryId || Math.random().toString(36).substr(2, 9),
      pokemon: workingPokemon,
      pokemonName: workingPokemon?.name || "Unknown",
      game: hunt.game,
      method: hunt.method,
      checks: phaseRecord.phaseChecks || 0,
      totalChecks: phaseRecord.totalChecks || hunt.checks || 0,
      elapsedMs: phaseRecord.elapsedMs || hunt.elapsedMs || 0,
      time: phaseRecord.elapsedMs || hunt.elapsedMs || 0,
      odds: calculatedOdds,
      modifiers: hunt.modifiers || {},
      phases: hunt.phases || [],
      phaseCount: (hunt.phases ? hunt.phases.length + 1 : 1),
      nickname: (phaseRecord.nickname || shinyEncounterModal.nickname || "").trim(),
      ball: phaseRecord.ball || shinyEncounterModal.ball || "",
      mark: phaseRecord.mark || shinyEncounterModal.mark || "",
      notes: phaseRecord.notes || (shinyEncounterModal.notes || "").trim(),
      date: new Date().toISOString(),
      timestamp: now,
      outcome: isFail ? "failed" : "caught",
      isFail,
      addedToLivingDex: Boolean(shinyEncounterModal.addedToCollection),
      isHuntTracker: true
    };

    try {
      const storageKey = isFail
        ? (username ? `completedFails:${username}` : "completedFails")
        : (username ? `completedHunts:${username}` : "completedHunts");
      const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const updated = [completedEntry, ...existing.filter(e => e.entryId !== completedEntry.entryId)];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      if (username) {
        localStorage.setItem(isFail ? "completedFails" : "completedHunts", JSON.stringify(updated));
      }
      setHuntHistory(prev => [completedEntry, ...prev.filter(e => e.entryId !== completedEntry.entryId)]);
    } catch {}

    const nextHunts = allActiveHuntsRef.current.filter(h => String(h.id) !== String(huntId));
    const nextActive = mode === "mmo"
      ? nextHunts.filter(h => (h.game === "Legends Arceus" && h.method === "Permutations") || h.method === "Permutations")
      : nextHunts.filter(h => !(h.game === "Legends Arceus" && h.method === "Permutations") && h.method !== "Permutations");
    const nextCurrentId = String(currentHuntId) === String(huntId) ? (nextActive[0]?.id || null) : currentHuntId;

    setAllActiveHunts(nextHunts);
    setCurrentHuntId(nextCurrentId);
    try {
      if (nextCurrentId != null) localStorage.setItem("currentHuntId", String(nextCurrentId));
      else localStorage.removeItem("currentHuntId");
    } catch {}

    setCachedHuntsData({ activeHunts: nextHunts });
    setShinyEncounterModal({
      show: false,
      hunt: null,
      step: 1,
      selectedPokemon: null,
      isTarget: true,
      outcome: null,
      nickname: "",
      ball: "",
      mark: "",
      notes: "",
      addedToCollection: false,
      searchTerm: "",
      formTab: "all",
      phaseResult: null
    });

    showMessage(
      isFail
        ? `Logged failed hunt for ${formatPokemonName(workingPokemon?.name)}.`
        : `Completed Hunt for Shiny ${formatPokemonName(workingPokemon?.name)} in ${(phaseRecord.totalChecks || hunt.checks || 0).toLocaleString()} checks!`,
      "success"
    );

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_ACTION",
        huntId,
        action: { type: "DELETE", huntId, timestamp: now }
      });
    }

    debouncedSave(nextHunts, nextCurrentId);
  }, [shinyEncounterModal, username, mode, currentHuntId, debouncedSave, showMessage]);

  // ── Hunt Wizard Setup ─────────────────────────────────────────────────────
  const handleOpenHuntWizard = useCallback((initialProps = {}) => {
    const targetGame = initialProps.game || (mode === "mmo" ? "Legends Arceus" : "Scarlet");
    const targetMethod = initialProps.method || (mode === "mmo" ? "Permutations" : "Mass Outbreaks");
    const hasCharm = Array.isArray(shinyCharmGames) && shinyCharmGames.includes(targetGame);
    const isPLA = targetGame === "Legends Arceus";

    const defaultModifiers = {
      shinyCharm: hasCharm,
      ...(isPLA ? { researchLv10: hasCharm } : {}),
      perfectResearch: false,
      ...(initialProps.modifiers || {})
    };

    setHuntWizard({
      isOpen: true,
      step: 0,
      game: targetGame,
      method: targetMethod,
      modifiers: defaultModifiers,
      selectedPokemon: initialProps.pokemon || null,
      possiblePhases: initialProps.possiblePhases || [],
      allowAnyPhase: true,
      startChecks: 0,
      startTime: { hours: 0, minutes: 0, seconds: 0 },
      huntIncrement: 1,
      targetPhasesNotes: "",
      searchTerm: "",
      formTab: "all"
    });
  }, [mode, shinyCharmGames]);

  const handleStartWizardHunt = useCallback((customHunt = null) => {
    if (!customHunt && !huntWizard.selectedPokemon) return;

    const now = Date.now();
    const game = customHunt?.game || huntWizard.game;
    const method = customHunt?.method || huntWizard.method;
    const odds = calculateOdds(game, method, customHunt?.modifiers || huntWizard.modifiers || {}) || 4096;

    const hMs = (parseInt(customHunt?.startTime?.hours ?? huntWizard.startTime.hours, 10) || 0) * 3600000;
    const mMs = (parseInt(customHunt?.startTime?.minutes ?? huntWizard.startTime.minutes, 10) || 0) * 60000;
    const sMs = (parseInt(customHunt?.startTime?.seconds ?? huntWizard.startTime.seconds, 10) || 0) * 1000;
    const manualElapsedMs = Math.max(0, hMs + mMs + sMs);
    const startedAt = now - manualElapsedMs;

    const startChecks = customHunt?.startChecks ?? huntWizard.startChecks ?? 0;
    const huntIncrement = customHunt?.huntIncrement ?? huntWizard.huntIncrement ?? 1;

    let initialStats = {
      avgIntervalSec: 0,
      lastIntervalSec: 0,
      fastestIntervalSec: 0,
      recentIntervals: [],
      last10AvgSec: 0
    };

    if (startChecks > 0 && manualElapsedMs > 0) {
      const avgPace = (manualElapsedMs / 1000) / startChecks;
      initialStats = {
        avgIntervalSec: avgPace,
        lastIntervalSec: avgPace,
        fastestIntervalSec: avgPace,
        recentIntervals: [avgPace],
        last10AvgSec: avgPace
      };
    }

    const newHunt = normalizeHunt({
      id: now,
      huntId: now,
      pokemon: customHunt?.pokemon || huntWizard.selectedPokemon,
      game,
      method,
      ball: "",
      mark: "",
      notes: customHunt?.notes || huntWizard.targetPhasesNotes || "",
      checks: startChecks,
      odds,
      startDate: new Date().toISOString(),
      startedAt,
      startTime: startedAt,
      pausedAt: now,
      totalPausedMs: 0,
      status: "paused",
      isPaused: true,
      increment: huntIncrement,
      currentPhase: 1,
      phases: [],
      possiblePhases: customHunt?.possiblePhases || huntWizard.possiblePhases || [],
      allowAnyPhase: customHunt?.allowAnyPhase ?? (huntWizard.allowAnyPhase !== false),
      fails: [],
      modifiers: { ...(customHunt?.modifiers || huntWizard.modifiers) },
      stats: initialStats,
      version: 1,
      updatedAt: now,
      chartData: customHunt?.chartData || {},
      chartConfig: customHunt?.chartConfig || (mode === "mmo" ? {
        firstSpawn: 8,
        secondSpawn: 6,
        isAdvanced: false,
        isSaveOrder: false,
        showSecondWave: false,
        showGhostChecks: false
      } : {})
    }, now);

    let normalizedActiveHunts = allActiveHuntsRef.current;
    const runningHunts = normalizedActiveHunts.filter(h => h.status === "running" || (!h.isPaused && h.status !== "paused"));
    if (runningHunts.length > 0) {
      runningHunts.forEach(rh => {
        const action = { type: "PAUSE", huntId: rh.id, timestamp: now };
        normalizedActiveHunts = applyHuntActionToState(normalizedActiveHunts, action, now);
        if (channelRef.current) {
          channelRef.current.broadcast({
            type: "HUNT_ACTION",
            huntId: rh.id,
            action
          });
        }
      });
    }

    const updatedHunts = [newHunt, ...normalizedActiveHunts];
    const updatedIncrements = { ...huntIncrements, [now]: huntIncrement };

    setAllActiveHunts(updatedHunts);
    setCurrentHuntId(now);
    setHuntIncrements(updatedIncrements);
    setCachedHuntsData({ activeHunts: updatedHunts });
    setHuntWizard(prev => ({ ...prev, isOpen: false }));

    showMessage(`Started hunting shiny ${formatPokemonName((customHunt?.pokemon || huntWizard.selectedPokemon)?.name)}! (Paused)`, "success");

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_UPDATED",
        hunt: newHunt
      });
    }

    debouncedSave(updatedHunts, now);
  }, [huntWizard, huntIncrements, debouncedSave, showMessage]);

  // ── Hunt History Loading & Management ─────────────────────────────────────
  const loadHuntHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const historyList = [];
      const seenEntryIds = new Set();

      let deletedIds = [];
      try {
        const uKey = username ? `deleted_hunt_history_ids:${username}` : "deleted_hunt_history_ids:global";
        const userDeleted = JSON.parse(localStorage.getItem(uKey) || "[]");
        const globalDeleted = JSON.parse(localStorage.getItem("deleted_hunt_history_ids:global") || "[]");
        deletedIds = [...userDeleted, ...globalDeleted].map(String);
      } catch {}

      const isItemDeleted = (item) => {
        if (!item) return true;
        if (item.entryId && deletedIds.includes(String(item.entryId))) return true;
        if (item.id && deletedIds.includes(String(item.id))) return true;
        if (item.timestamp && deletedIds.includes(String(item.timestamp))) return true;
        const key = `${item.date}-${item.checks || item.phaseChecks || 0}-${item.time || item.elapsedMs || 0}-${item.game || ''}`;
        if (deletedIds.includes(key)) return true;
        return false;
      };

      const storageKeys = [
        username ? `completedHunts:${username}` : null,
        "completedHunts",
        "huntHistory"
      ].filter(Boolean);

      storageKeys.forEach(k => {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach(h => {
                const eid = h.entryId || `${h.id}-${h.timestamp}`;
                if (!seenEntryIds.has(eid) && !isItemDeleted(h)) {
                  seenEntryIds.add(eid);
                  historyList.push({
                    ...h,
                    entryId: eid,
                    outcome: h.outcome || (h.isFail ? "failed" : "caught"),
                    isFail: h.outcome === "failed" || Boolean(h.isFail)
                  });
                }
              });
            }
          } catch {}
        }
      });

      const failStorageKeys = [
        username ? `completedFails:${username}` : null,
        "completedFails"
      ].filter(Boolean);

      failStorageKeys.forEach(k => {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach(f => {
                const eid = f.entryId || `${f.id}-${f.timestamp}`;
                if (!seenEntryIds.has(eid) && !isItemDeleted(f)) {
                  seenEntryIds.add(eid);
                  historyList.push({
                    ...f,
                    entryId: eid,
                    outcome: "failed",
                    isFail: true
                  });
                }
              });
            }
          } catch {}
        }
      });

      historyList.sort((a, b) => (b.timestamp || new Date(b.date).getTime() || 0) - (a.timestamp || new Date(a.date).getTime() || 0));
      setHuntHistory(historyList);
    } catch (e) {
      console.error("Failed to load hunt history:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [username]);

  // Load history on mount
  useEffect(() => {
    loadHuntHistory();
  }, [loadHuntHistory]);

  const handleDeleteHistoryEntry = useCallback(async (entryToDelete) => {
    if (!entryToDelete) return;
    const targetId = entryToDelete.id;
    const targetEntryId = entryToDelete.entryId;
    const targetTimestamp = entryToDelete.timestamp;
    const targetKey = `${entryToDelete.date}-${entryToDelete.checks || entryToDelete.phaseChecks || 0}-${entryToDelete.time || entryToDelete.elapsedMs || 0}-${entryToDelete.game || ''}`;

    const idsToAdd = [targetEntryId, targetId, targetTimestamp, targetKey].filter(Boolean).map(String);
    try {
      const blacklistKey = username ? `deleted_hunt_history_ids:${username}` : "deleted_hunt_history_ids:global";
      const existing = JSON.parse(localStorage.getItem(blacklistKey) || "[]");
      const globalExisting = JSON.parse(localStorage.getItem("deleted_hunt_history_ids:global") || "[]");
      let changed = false;
      idsToAdd.forEach(id => {
        if (!existing.includes(id)) {
          existing.push(id);
          changed = true;
        }
        if (!globalExisting.includes(id)) {
          globalExisting.push(id);
        }
      });
      if (changed) {
        localStorage.setItem(blacklistKey, JSON.stringify(existing));
        localStorage.setItem("deleted_hunt_history_ids:global", JSON.stringify(globalExisting));
      }
    } catch {}

    const isMatch = (item) => {
      if (!item) return false;
      if (targetEntryId && item.entryId && String(item.entryId) === String(targetEntryId)) return true;
      if (targetId && item.id && String(item.id) === String(targetId)) return true;
      if (targetTimestamp && item.timestamp && String(item.timestamp) === String(targetTimestamp)) return true;
      const itemKey = `${item.date}-${item.checks || item.phaseChecks || 0}-${item.time || item.elapsedMs || 0}-${item.game || ''}`;
      if (itemKey === targetKey) return true;
      return false;
    };

    setHuntHistory(prev => prev.filter(item => !isMatch(item)));

    const filterStorage = (key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter(item => !isMatch(item));
          localStorage.setItem(key, JSON.stringify(updated));
        }
      } catch {}
    };

    filterStorage("completedHunts");
    filterStorage("completedFails");
    filterStorage("huntHistory");
    if (username) {
      filterStorage(`completedHunts:${username}`);
      filterStorage(`completedFails:${username}`);
    }

    showMessage("Entry permanently removed from history", "success");
  }, [username, showMessage]);

  const handleClearAllHistory = useCallback((clearMode = "counters") => {
    const storageKey = username ? `completedHunts:${username}` : "completedHunts";
    const failStorageKey = username ? `completedFails:${username}` : "completedFails";

    const isMatch = (item) => {
      const isMMOHunt = item.game === "Legends Arceus" && (item.method === "Permutations" || item.method === "Massive Mass Outbreak" || item.method === "Massive Mass Outbreaks");
      return clearMode === "mmo" ? isMMOHunt : !isMMOHunt;
    };

    setHuntHistory(prev => prev.filter(h => !isMatch(h)));

    const filterStorage = (key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter(h => !isMatch(h));
          localStorage.setItem(key, JSON.stringify(updated));
        }
      } catch {}
    };

    filterStorage(storageKey);
    filterStorage(failStorageKey);
    if (username) {
      filterStorage("completedHunts");
      filterStorage("completedFails");
    }

    showMessage("Hunt history cleared", "success");
  }, [username, showMessage]);

  // ── Keyboard Hotkey Handling ──────────────────────────────────────────────
  const isKeyMatch = useCallback((e, targetKey) => {
    if (!targetKey) return false;
    if (targetKey === " " && (e.code === "Space" || e.key === " " || e.key === "Spacebar")) return true;
    if (targetKey === "+" && (e.key === "+" || e.key === "Add" || e.code === "NumpadAdd" || (e.key === "=" && e.shiftKey))) return true;
    if (targetKey === "-" && (e.key === "-" || e.key === "Subtract" || e.code === "NumpadSubtract" || e.code === "Minus")) return true;
    if (e.key.toLowerCase() === targetKey.toLowerCase()) return true;
    if (e.code.toLowerCase() === targetKey.toLowerCase()) return true;
    return false;
  }, []);

  useEffect(() => {
    if (!enableHotkeys) return;

    const handleKeyDown = (e) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.isContentEditable
      ) {
        return;
      }

      if (
        huntWizard.isOpen ||
        shinyEncounterModal.show ||
        phaseHistoryModal.show ||
        oddsModal.show ||
        resetModal.show ||
        deleteModal.show ||
        settingsModal.show ||
        hotkeyModal ||
        showHistoryModal
      ) {
        return;
      }

      if (isKeyMatch(e, hotkey)) {
        e.preventDefault();
        const target = currentHunt || activeHunts[0];
        if (target) {
          const isRunning = target.status === "running" || (!target.isPaused && target.status !== "paused");
          if (isRunning) {
            handleAddCheck(target.id);
          }
        }
        return;
      }

      if (isKeyMatch(e, decrementHotkey)) {
        e.preventDefault();
        const target = currentHunt || activeHunts[0];
        if (target) {
          const isRunning = target.status === "running" || (!target.isPaused && target.status !== "paused");
          if (isRunning) {
            handleDecreaseCheck(target.id);
          }
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enableHotkeys,
    hotkey,
    decrementHotkey,
    currentHunt,
    activeHunts,
    huntWizard.isOpen,
    shinyEncounterModal.show,
    phaseHistoryModal.show,
    oddsModal.show,
    resetModal.show,
    deleteModal.show,
    settingsModal.show,
    hotkeyModal,
    showHistoryModal,
    isKeyMatch,
    handleAddCheck,
    handleDecreaseCheck
  ]);

  return {
    // Hunts Data & Lists
    allActiveHunts,
    setAllActiveHunts,
    activeHunts,
    currentHunt,
    otherHunts,
    currentHuntId,
    setCurrentHuntId,
    huntIncrements,
    setHuntIncrements,
    collapsedPhasesMap,
    metricMode,
    metricModeMap,
    activeMenuHuntId,
    setActiveMenuHuntId,

    // Action Handlers
    handleAddCheck,
    handleDecreaseCheck,
    handleTogglePause,
    handleConfirmResetTimer,
    handleDeleteHunt,
    handleSwitchCurrentHunt,
    handleToggleCollapsePhases,
    handleToggleMetricMode,
    handleSaveAdjustValues,
    handleOpenPopout,
    debouncedSave,

    // Shiny Encounter Modal
    shinyEncounterModal,
    setShinyEncounterModal,
    handleOpenShinyEncounterModal,
    handleCompleteTargetHunt,
    handleContinueAfterPhase,
    handleAddShinyToCollection,
    handleAddShinyFailToCollection,

    // Hunt Wizard Setup
    huntWizard,
    setHuntWizard,
    handleOpenHuntWizard,
    handleStartWizardHunt,

    // Hunt History
    huntHistory,
    setHuntHistory,
    historyBadgeCount,
    isLoadingHistory,
    loadHuntHistory,
    handleDeleteHistoryEntry,
    handleClearAllHistory,
    showHistoryModal,
    setShowHistoryModal,

    // Dialog & Modal Controllers
    phaseHistoryModal,
    setPhaseHistoryModal,
    oddsModal,
    setOddsModal,
    resetModal,
    setResetModal,
    deleteModal,
    setDeleteModal,
    settingsModal,
    setSettingsModal,
    settingsForm,
    setSettingsForm,

    // Hotkey settings
    hotkey,
    setHotkey,
    decrementHotkey,
    setDecrementHotkey,
    hotkeyModal,
    setHotkeyModal,
    listeningFor,
    setListeningFor,
    hotkeyError,
    setHotkeyError
  };
}
