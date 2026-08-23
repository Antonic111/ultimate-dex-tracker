import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import {
  Plus,
  Check,
  Edit,
  Sparkles,
  History,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle,
  X,
  Layers
} from "lucide-react";
import { GAME_OPTIONS } from "../Constants";
import { calculateOdds, getModifiersForGame } from "../utils/huntSystem";
import { formatPokemonName, getFormDisplayName } from "../utils";
import {
  DetailedHuntCard,
  OddsBreakdownModal,
  AdjustHuntModal,
  ShinyEncounterModal,
  HuntIdentityOddsCard,
  HuntHistoryModal,
  useHuntManager
} from "../components/Counters";
import { getSpriteUrl } from "../utils/spriteUtils";
import { UserContext } from "../components/Shared/UserContext";
import { useMessage } from "../components/Shared/MessageContext";
import pokemonData from "../data/pokemon.json";
import formsData from "../utils/loadFormsData";
import { getAvailableGamesForPokemonSidebar } from "../utils/pokemonAvailability";
import PermutationTable from "../components/MMO/PermutationTable";
import { Modal, ConfirmModal } from "../components/Shared/Modal";
import { Button } from "../components/Shared/Button";
import { Tooltip } from "../components/Shared/Tooltip";
import { TextArea, SearchField } from "../components/Shared/FormField";
import {
  formatDigitalTime,
  getHuntElapsedTime,
  setCachedHuntsData
} from "../utils/huntSync";
import "../css/Counters.css";
import "../css/Onboarding.css";
import "../css/MMOTool.css";

const normalizeGameKey = (str = "") => String(str).toLowerCase().replace(/['’\s\-_]/g, "");

const getGameImage = (gameName) => {
  if (!gameName) return null;
  const targetKey = normalizeGameKey(gameName);
  const match = GAME_OPTIONS.find(g =>
    g.value === gameName ||
    g.name === gameName ||
    normalizeGameKey(g.value) === targetKey ||
    normalizeGameKey(g.name) === targetKey
  );
  return match?.image || null;
};

export const getPhaseEntryDisplayInfo = (phase, allPhases = []) => {
  if (!phase) return { label: "Phase 1:", title: "", isFail: false, isTarget: false, count: 1 };
  const phaseIdx = allPhases.indexOf(phase);
  const preceding = phaseIdx >= 0 ? allPhases.slice(0, phaseIdx + 1) : [phase];

  const isTarget = !!phase.isTarget;
  const isFailed = phase.outcome === "failed";

  if (isTarget && isFailed) {
    const count = preceding.filter(p => p.isTarget && p.outcome === "failed").length || 1;
    return {
      type: "target_failed",
      label: `Target Failed ${count}:`,
      title: `Target Failed ${count}: ${formatPokemonName(phase.pokemon?.name)}`,
      badgeText: "Target Failed",
      isFail: true,
      isTarget: true,
      count
    };
  }

  if (isFailed) {
    const count = preceding.filter(p => !p.isTarget && p.outcome === "failed").length || 1;
    return {
      type: "phase_failed",
      label: `Phase ${phase.phaseNumber || (phaseIdx + 1)} Failed:`,
      title: `Phase ${phase.phaseNumber || (phaseIdx + 1)} Failed: ${formatPokemonName(phase.pokemon?.name)}`,
      badgeText: "Failed",
      isFail: true,
      isTarget: false,
      count
    };
  }

  if (!isTarget) {
    const count = preceding.filter(p => !p.isTarget && p.outcome === "caught").length || 1;
    return {
      type: "phase_caught",
      label: `Phase ${phase.phaseNumber || (phaseIdx + 1)}:`,
      title: `Phase ${phase.phaseNumber || (phaseIdx + 1)}: ${formatPokemonName(phase.pokemon?.name)}`,
      badgeText: "Phase Caught",
      isFail: false,
      isTarget: false,
      count
    };
  }

  return {
    type: "target_caught",
    label: "Target Caught:",
    title: `Target Caught: ${formatPokemonName(phase.pokemon?.name)}`,
    badgeText: "Caught",
    isFail: false,
    isTarget: true,
    count: 1
  };
};

export const getPhaseDisplayChecks = (phase, allPhases = []) => {
  if (!phase) return { intervalChecks: 0, totalChecks: 0 };
  const phaseIdx = allPhases.indexOf(phase);
  const priorPhases = phaseIdx > 0 ? allPhases.slice(0, phaseIdx) : [];
  const priorTotal = priorPhases.reduce((sum, p) => sum + (p.phaseChecks || p.checks || 0), 0);

  const rawChecks = phase.phaseChecks !== undefined ? phase.phaseChecks : (phase.checks || 0);
  const rawTotal = phase.totalChecks !== undefined ? phase.totalChecks : (priorTotal + rawChecks);

  let intervalChecks = rawChecks;
  if (rawChecks > priorTotal && priorTotal > 0 && phase.totalChecks === undefined) {
    intervalChecks = rawChecks - priorTotal;
  }

  return {
    intervalChecks: Math.max(0, intervalChecks),
    totalChecks: Math.max(0, rawTotal)
  };
};

export default function MMOTool({ useHomeSprites = false }) {
  const { user } = useContext(UserContext);
  const { showMessage } = useMessage();

  // ── Unified Hunt Manager Hook (Hotkeys Disabled for MMO Tool) ─────────────
  const huntManager = useHuntManager({
    mode: "mmo",
    enableHotkeys: false,
    user,
    pokemonData,
    formsData,
    useHomeSprites,
    showMessage
  });

  const {
    activeHunts,
    currentHunt,
    otherHunts,
    currentHuntId,
    setCurrentHuntId,
    huntIncrements,
    collapsedPhasesMap,
    metricModeMap,
    activeMenuHuntId,
    setActiveMenuHuntId,
    handleAddCheck,
    handleDecreaseCheck,
    handleTogglePause,
    handleConfirmResetTimer,
    handleDeleteHunt,
    handleToggleCollapsePhases,
    handleToggleMetricMode,
    handleSaveAdjustValues,
    handleOpenPopout,
    debouncedSave,
    setAllActiveHunts,
    shinyEncounterModal,
    setShinyEncounterModal,
    handleOpenShinyEncounterModal,
    handleCompleteTargetHunt,
    handleContinueAfterPhase,
    handleAddShinyToCollection,
    handleAddShinyFailToCollection,
    huntWizard,
    setHuntWizard,
    handleOpenHuntWizard,
    handleStartWizardHunt,
    huntHistory,
    historyBadgeCount,
    loadHuntHistory,
    handleDeleteHistoryEntry,
    handleClearAllHistory,
    showHistoryModal,
    setShowHistoryModal,
    phaseHistoryModal,
    setPhaseHistoryModal,
    oddsModal,
    setOddsModal,
    resetModal,
    setResetModal,
    deleteModal,
    setDeleteModal,
    settingsModal,
    setSettingsModal
  } = huntManager;

  // ── Permutation Table Local Preferences ───────────────────────────────────
  const [spawnCheckMode, setSpawnCheckMode] = useState(() => {
    try {
      return localStorage.getItem("mmo_spawn_check_mode") === "spawn" ? "spawn" : "permutation";
    } catch {
      return "permutation";
    }
  });

  const toggleSpawnCheckMode = () => {
    setSpawnCheckMode(prev => {
      const next = prev === "spawn" ? "permutation" : "spawn";
      try { localStorage.setItem("mmo_spawn_check_mode", next); } catch {}
      return next;
    });
  };

  const [legendColors, setLegendColors] = useState(() => {
    try {
      const saved = localStorage.getItem("mmo_legend_colors");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [editModal, setEditModal] = useState({
    show: false,
    hunt: null,
    pokemon: null,
    modifiers: {
      shinyCharm: false,
      researchLv10: false,
      perfectResearch: false
    },
    notes: ""
  });

  // ── All Pokémon List & Filtering for Legends Arceus ───────────────────────
  const allPokemon = useMemo(() => {
    const baseList = pokemonData.map(p => ({
      ...p,
      formType: "main",
      stableId: `${p.name}-main-${String(p.id).padStart(4, '0')}`
    }));

    const formsList = formsData
      .filter(f => f.formType !== "mighty")
      .map(f => ({
        ...f,
        stableId: f.stableId || `${f.name}-${f.formType}-${String(f.id).padStart(4, '0')}`
      }));

    return [...baseList, ...formsList];
  }, []);

  const isPokemonAvailableInGame = useCallback((pokemon, targetGame = "Legends Arceus") => {
    if (!pokemon || !targetGame) return true;
    const games = getAvailableGamesForPokemonSidebar(pokemon);
    return games.includes(targetGame);
  }, []);

  const getPokemonImage = useCallback((pokemon, useHomeSpritesOverride = useHomeSprites) => {
    if (!pokemon) return "/fallback.png";
    return getSpriteUrl(pokemon, true, useHomeSpritesOverride);
  }, [useHomeSprites]);

  // Form Tabs for PLA
  const availableFormTabs = useMemo(() => {
    const inGame = allPokemon.filter(p => isPokemonAvailableInGame(p, "Legends Arceus"));
    const counts = {
      all: inGame.length,
      main: inGame.filter(p => !p.formType || p.formType === "main").length,
      hisuian: inGame.filter(p => p.formType === "hisuian").length,
      alpha: inGame.filter(p => p.formType === "alpha" || p.formType === "alphaother").length,
      unown: inGame.filter(p => p.formType === "unown").length,
      alolan: inGame.filter(p => p.formType === "alolan").length,
      gender: inGame.filter(p => p.formType === "gender").length,
      other: inGame.filter(p => p.formType === "other").length
    };

    const definitions = [
      { id: "all", label: "All Forms" },
      { id: "main", label: "Base Species" },
      { id: "alpha", label: "Alpha" },
      { id: "hisuian", label: "Hisui" },
      { id: "unown", label: "Unown" },
      { id: "alolan", label: "Alola" },
      { id: "gender", label: "Gender" },
      { id: "other", label: "Other" }
    ];

    return definitions.filter(d => d.id === "all" || (counts[d.id] && counts[d.id] > 0));
  }, [allPokemon, isPokemonAvailableInGame]);

  const availablePhaseFormTabs = availableFormTabs;

  // Filtered Pokémon for Wizard Target
  const wizardGamePokemon = useMemo(() => {
    let inGame = allPokemon.filter(p => isPokemonAvailableInGame(p, "Legends Arceus"));

    if (huntWizard.formTab && huntWizard.formTab !== "all") {
      if (huntWizard.formTab === "main") {
        inGame = inGame.filter(p => !p.formType || p.formType === "main");
      } else if (huntWizard.formTab === "alpha") {
        inGame = inGame.filter(p => p.formType === "alpha" || p.formType === "alphaother");
      } else {
        inGame = inGame.filter(p => p.formType === huntWizard.formTab);
      }
    }

    if (!huntWizard.searchTerm?.trim()) return inGame;
    const q = huntWizard.searchTerm.toLowerCase();
    return inGame.filter(p =>
      p && p.name && (p.name.toLowerCase().includes(q) || String(p.id).includes(q))
    );
  }, [allPokemon, isPokemonAvailableInGame, huntWizard.formTab, huntWizard.searchTerm]);

  // Filtered Pokémon for Wizard Phases
  const wizardGamePhasePokemon = useMemo(() => {
    let inGame = allPokemon.filter(p => isPokemonAvailableInGame(p, "Legends Arceus"));

    if (huntWizard.phaseFormTab && huntWizard.phaseFormTab !== "all") {
      if (huntWizard.phaseFormTab === "main") {
        inGame = inGame.filter(p => !p.formType || p.formType === "main");
      } else if (huntWizard.phaseFormTab === "alpha") {
        inGame = inGame.filter(p => p.formType === "alpha" || p.formType === "alphaother");
      } else {
        inGame = inGame.filter(p => p.formType === huntWizard.phaseFormTab);
      }
    }

    if (!huntWizard.phaseSearchTerm?.trim()) return inGame;
    const q = huntWizard.phaseSearchTerm.toLowerCase();
    return inGame.filter(p =>
      p && p.name && (p.name.toLowerCase().includes(q) || String(p.id).includes(q))
    );
  }, [allPokemon, isPokemonAvailableInGame, huntWizard.phaseFormTab, huntWizard.phaseSearchTerm]);

  // ── Global Stats & Derived Timers ─────────────────────────────────────────
  const activeCount = activeHunts.length;
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalChecksToday = useMemo(() => {
    return activeHunts.reduce((sum, h) => sum + (h.checks || 0), 0);
  }, [activeHunts]);

  const totalHuntingTimeMs = useMemo(() => {
    return activeHunts.reduce((sum, h) => sum + getHuntElapsedTime(h), 0);
  }, [activeHunts]);

  const formatSummaryTime = (totalMs) => {
    const totalSec = Math.floor(totalMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // ── Permutation Chart Update Handlers ─────────────────────────────────────
  const handleChartUpdate = (chartData) => {
    if (!currentHunt) return;
    const huntId = currentHunt.id;

    setAllActiveHunts(prev => {
      const existingHunt = prev.find(h => String(h.id) === String(huntId));
      if (!existingHunt) return prev;
      const updated = {
        ...existingHunt,
        chartData,
        chartConfig: {
          firstSpawn: existingHunt.chartConfig?.firstSpawn ?? 8,
          secondSpawn: existingHunt.chartConfig?.secondSpawn ?? 6,
          isAdvanced: existingHunt.chartConfig?.isAdvanced ?? false,
          isSaveOrder: existingHunt.chartConfig?.isSaveOrder ?? false,
          showSecondWave: existingHunt.chartConfig?.showSecondWave ?? false,
          showGhostChecks: existingHunt.chartConfig?.showGhostChecks ?? false,
          ...(existingHunt.chartConfig || {})
        },
        version: (existingHunt.version || 0) + 1
      };
      const next = prev.map(h => String(h.id) === String(huntId) ? updated : h);
      setCachedHuntsData({ activeHunts: next });
      debouncedSave(next);
      return next;
    });
  };


  const handleChartConfigUpdate = (config) => {
    if (!currentHunt) return;
    const huntId = currentHunt.id;

    setAllActiveHunts(prev => {
      const existingHunt = prev.find(h => String(h.id) === String(huntId));
      if (!existingHunt) return prev;
      const updated = {
        ...existingHunt,
        chartConfig: {
          firstSpawn: existingHunt.chartConfig?.firstSpawn ?? 8,
          secondSpawn: existingHunt.chartConfig?.secondSpawn ?? 6,
          isAdvanced: existingHunt.chartConfig?.isAdvanced ?? false,
          isSaveOrder: existingHunt.chartConfig?.isSaveOrder ?? false,
          showSecondWave: existingHunt.chartConfig?.showSecondWave ?? false,
          showGhostChecks: existingHunt.chartConfig?.showGhostChecks ?? false,
          ...(existingHunt.chartConfig || {}),
          ...config
        },
        version: (existingHunt.version || 0) + 1
      };
      const next = prev.map(h => String(h.id) === String(huntId) ? updated : h);
      setCachedHuntsData({ activeHunts: next });
      debouncedSave(next);
      return next;
    });
  };


  // ── Dynamic Modifiers Form Helper ─────────────────────────────────────────
  const renderModifiersForm = (selectedGame, selectedMethod, currentMods, setMods) => {
    const availableMods = getModifiersForGame(selectedGame || "Legends Arceus") || {};
    const hasCharm = !!(availableMods["Shiny Charm"] && availableMods["Shiny Charm"] > 0);

    return (
      <div className="space-y-3">
        <label className="hunt-modal-label !text-white text-white font-bold">
          Active Modifiers & Boosts (Legends: Arceus)
        </label>

        <div className="hunt-modifiers-box space-y-3">
          {/* 1. Shiny Charm Toggle */}
          {hasCharm && (
            <button
              type="button"
              className={`modifier-select-btn ${currentMods.shinyCharm ? "is-active" : ""}`}
              onClick={() => setMods(prev => {
                const nextCharm = !prev.shinyCharm;
                return {
                  ...prev,
                  shinyCharm: nextCharm,
                  ...(nextCharm ? { researchLv10: true } : {})
                };
              })}
            >
              <span className="modifier-btn-left">
                <img src="/modifier_images/shinycharm.png" alt="" className="w-5 h-5 object-contain shrink-0" />
                <span>Shiny Charm Active</span>
              </span>
              <span className="modifier-btn-status">
                {currentMods.shinyCharm ? "Active ✓" : "Off"}
              </span>
            </button>
          )}

          {/* 2. Research Level 10 */}
          <button
            type="button"
            className={`modifier-select-btn ${currentMods.researchLv10 ? "is-active" : ""}`}
            onClick={() => setMods(prev => {
              const nextLv10 = !prev.researchLv10;
              return {
                ...prev,
                researchLv10: nextLv10,
                ...(!nextLv10 ? { perfectResearch: false, shinyCharm: false } : {})
              };
            })}
          >
            <span className="modifier-btn-left">
              <img src="/modifier_images/research.png" alt="" className="w-5 h-5 object-contain shrink-0" />
              <span>Research Level 10</span>
            </span>
            <span className="modifier-btn-status">
              {currentMods.researchLv10 ? "Active ✓" : "Off"}
            </span>
          </button>

          {/* 3. Perfect Research */}
          <button
            type="button"
            className={`modifier-select-btn ${currentMods.perfectResearch ? "is-active" : ""}`}
            onClick={() => setMods(prev => {
              const nextPerfect = !prev.perfectResearch;
              return {
                ...prev,
                perfectResearch: nextPerfect,
                ...(nextPerfect ? { researchLv10: true } : {})
              };
            })}
          >
            <span className="modifier-btn-left">
              <img src="/modifier_images/perfectresearch.png" alt="" className="w-5 h-5 object-contain shrink-0" />
              <span>Perfect Research Entry</span>
            </span>
            <span className="modifier-btn-status">
              {currentMods.perfectResearch ? "Active ✓" : "Off"}
            </span>
          </button>
        </div>
      </div>
    );
  };

  // ── Render Card Helpers ───────────────────────────────────────────────────
  const renderDetailedHuntCard = (hunt) => {
    return (
      <DetailedHuntCard
        hunt={hunt}
        isPopout={false}
        getPokemonImage={getPokemonImage}
        useHomeSprites={useHomeSprites}
        getFormDisplayName={getFormDisplayName}
        hotkey=""
        decrementHotkey=""
        huntIncrement={huntIncrements[hunt.id] || hunt.increment || 1}
        metricMode={metricModeMap[hunt.id] || "phase"}
        onToggleMetricMode={() => handleToggleMetricMode(hunt.id)}
        isPhasesCollapsed={!!collapsedPhasesMap[hunt.id]}
        onToggleCollapsePhases={() => handleToggleCollapsePhases(hunt.id)}
        isMenuOpen={activeMenuHuntId === hunt.id}
        onToggleMenu={() => setActiveMenuHuntId(prev => prev === hunt.id ? null : hunt.id)}
        onCloseMenu={() => setActiveMenuHuntId(null)}
        onAddCheck={() => handleAddCheck(hunt.id)}
        onDecreaseCheck={() => handleDecreaseCheck(hunt.id)}
        onTogglePause={() => handleTogglePause(hunt.id)}
        onReset={(h) => setResetModal({ show: true, hunt: h })}
        onLogShiny={handleOpenShinyEncounterModal}
        onOpenOdds={(h) => setOddsModal({ show: true, hunt: h })}
        onOpenHistory={(h) => setPhaseHistoryModal({ show: true, hunt: h })}
        onAdjustValues={(h) => setSettingsModal({ show: true, hunt: h })}
        onPopout={handleOpenPopout}
        onDelete={(h) => setDeleteModal({ show: true, hunt: h })}
      />
    );
  };

  const renderCompactHuntCard = (hunt) => {
    const isCurrent = currentHunt && String(currentHunt.id) === String(hunt.id);
    const formLabel = getFormDisplayName(hunt.pokemon);

    return (
      <button
        key={hunt.id}
        type="button"
        className={`compact-hunt-card ${isCurrent ? "is-current" : ""}`}
        onClick={() => setCurrentHuntId(hunt.id)}
      >
        <div className="compact-hunt-start">
          <div className="compact-hunt-sprite-box">
            <img
              src={getPokemonImage(hunt.pokemon)}
              alt={hunt.pokemon?.name || "Pokémon"}
              className={`compact-hunt-sprite ${!useHomeSprites ? "pixelated" : ""}`}
              style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
              onError={(e) => { e.currentTarget.src = "/fallback.png"; }}
            />
          </div>

          <div className="compact-hunt-info">
            <div className="flex items-center gap-1.5">
              <span className="compact-hunt-name">
                Shiny {formatPokemonName(hunt.pokemon?.name)}
              </span>
            </div>

            <div className="compact-hunt-meta">
              <span className="compact-hunt-tag">
                {getGameImage("Legends Arceus") && <img src={getGameImage("Legends Arceus")} alt="" />}
                <span>Legends Arceus</span>
              </span>
              <span className="compact-hunt-tag">
                <span>Permutations</span>
              </span>
              {formLabel && (
                <span className="compact-hunt-tag text-[var(--accent)]">
                  <span>{formLabel}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="compact-hunt-end">
          <div className="flex flex-col items-end gap-0.5">
            <span className="compact-hunt-checks">
              {hunt.checks.toLocaleString()} checks
            </span>
            <span className={`compact-hunt-status ${hunt.status === "paused" || hunt.isPaused ? "paused" : "active"}`}>
              {hunt.status === "paused" || hunt.isPaused ? "Paused" : "Hunting"}
            </span>
          </div>

          <ChevronRight size={18} className="text-gray-400 shrink-0" />
        </div>
      </button>
    );
  };

  return (
    <div className={`counters-page fade-in-content ${!useHomeSprites ? "using-gen5-sprites" : ""}`}>
      {/* ============================================================
          1. HEADER & LIVE QUICK STATS BAR
          ============================================================ */}
      <div className="counters-header-row">
        <div className="counters-title-block">
          <h1 className="counters-page-title">
            MMO Tool
          </h1>
        </div>

        {/* Global Live Summary Chips */}
        <div className="counters-stats-banner">
          <div className="stat-chip active-hunts" title="Total active ongoing outbreaks">
            <span className="stat-chip-icon"><Flame size={18} /></span>
            <span><strong className="stat-chip-value">{activeCount}</strong> Active Hunts</span>
          </div>

          <div className="stat-chip today-checks" title="Encounters checked across MMO outbreaks">
            <span className="stat-chip-icon"><CheckCircle size={18} /></span>
            <span><strong className="stat-chip-value">{totalChecksToday.toLocaleString()}</strong> Total Checks</span>
          </div>

          <div className="stat-chip total-time" title="Total accumulated hunt timer">
            <span className="stat-chip-icon"><Clock size={18} /></span>
            <span><strong className="stat-chip-value">{formatSummaryTime(totalHuntingTimeMs)}</strong> Hunting</span>
          </div>
        </div>

        {/* Top Right Controls: Action Buttons (No Hotkeys) */}
        <div className="counters-header-actions">
          <Tooltip
            content={
              <span>
                When <strong>ON</strong>, each permutation row you check counts as{" "}
                <strong>{currentHunt?.chartConfig?.secondSpawn ?? 6} encounters</strong>{" "}
                (matching your Second Wave spawn count).<br />
                When <strong>OFF</strong>, each row counts as <strong>1 encounter</strong>.
              </span>
            }
            position="bottom"
            align="end"
            maxWidth={280}
            wrap
          >
            <Button
              variant={spawnCheckMode === "spawn" ? "primary" : "secondary"}
              size="sm"
              onClick={toggleSpawnCheckMode}
              icon={<Layers size={16} />}
            >
              Count Each Spawn as a Check
            </Button>
          </Tooltip>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              loadHuntHistory();
              setShowHistoryModal(true);
            }}
            icon={<History size={16} />}
          >
            <span>History</span>
            {historyBadgeCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-white/15 text-white border border-white/10 leading-none">
                {historyBadgeCount}
              </span>
            )}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenHuntWizard()}
            icon={<Plus size={16} strokeWidth={2.5} />}
          >
            New Hunt
          </Button>
        </div>
      </div>

      <div className="counters-divider" />

      {/* ============================================================
          2. HUNT LAYOUT: CURRENT HUNT + COMPACT HUNT QUEUE + PERMUTATIONS
          ============================================================ */}
      {activeHunts.length === 0 ? (
        <div className="hunts-empty-state">
          <div className="hunts-empty-logo-stack">
            <img
              src="/counters_logos/counters_logo1.png"
              alt=""
              className="hunts-empty-logo-layer base-layer"
              draggable={false}
            />
            <div
              className="hunts-empty-logo-layer accent-layer"
              aria-hidden="true"
            />
          </div>

          <div className="hunts-empty-text-group">
            <h3 className="empty-state-title">Ready for your next MMO hunt?</h3>
            <p className="empty-state-description">
              Track permutation trees, bonus waves, and shiny encounters
              <br />
              all in one place.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="empty-state-start-btn"
            onClick={() => handleOpenHuntWizard()}
            icon={<Plus size={18} strokeWidth={2.5} />}
          >
            Start New Hunt
          </Button>
        </div>
      ) : (
        <div className="counters-hunt-layout">
          {/* CURRENT HUNT SECTION */}
          <section className="current-hunt-section">
            <div className="counters-section-header">
              <h2 className="counters-section-title">
                CURRENT HUNT
              </h2>
            </div>

            <div className="current-hunt-container">
              {currentHunt && (() => {
                const isPhasesCollapsed = !!collapsedPhasesMap[currentHunt.id];
                const hasPhasesOrFails = (currentHunt.phases?.length || 0) > 0;
                const showPhasesPanel = hasPhasesOrFails && !isPhasesCollapsed;

                return (
                  <div key={currentHunt.id} className={`current-hunt-wrapper ${showPhasesPanel ? "has-phases-panel" : ""}`}>
                    <div className="current-hunt-card-box">
                      {renderDetailedHuntCard(currentHunt)}
                    </div>

                    {hasPhasesOrFails && (
                      <div className={`current-hunt-phases-box ${showPhasesPanel ? "is-open" : "is-closed"}`}>
                        <div className="hunt-phases-panel">
                          <div className="hunt-phases-panel-header">
                            <div className="flex items-center gap-2">
                              <History size={17} className="text-[var(--accent)]" />
                              <h3 className="hunt-phases-panel-title">FAILS & PHASES</h3>
                            </div>
                            <span className="hunt-phases-count-badge">
                              {currentHunt.phases.length}
                            </span>
                          </div>

                          <div className="hunt-phases-panel-list custom-scrollbar">
                            {currentHunt.phases.map((phase, idx) => {
                              const info = getPhaseEntryDisplayInfo(phase, currentHunt.phases);
                              const displayChecks = getPhaseDisplayChecks(phase, currentHunt.phases);
                              return (
                                <div
                                  key={phase.id || idx}
                                  className={`hunt-phase-card-item ${info.isFail ? "is-failed" : "is-caught"}`}
                                >
                                  <div className="hunt-phase-item-sprite-well">
                                    <img
                                      src={getPokemonImage(phase.pokemon)}
                                      alt=""
                                      className={`hunt-phase-item-sprite ${!useHomeSprites ? "pixelated" : ""}`}
                                      style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                                      onError={(e) => { e.currentTarget.src = "/fallback.png"; }}
                                    />
                                  </div>

                                  <div className="hunt-phase-item-body">
                                    <div className="hunt-phase-item-top">
                                      <span className={`hunt-phase-item-label ${info.isFail ? "text-rose-400" : "text-[var(--accent)]"}`}>
                                        {info.label}
                                      </span>
                                      <span className="hunt-phase-item-name">
                                        {formatPokemonName(phase.pokemon?.name)}
                                      </span>
                                    </div>

                                    <div className="hunt-phase-item-metrics">
                                      <span>{displayChecks.intervalChecks.toLocaleString()} checks</span>
                                      <span>•</span>
                                      <span>Total: {displayChecks.totalChecks.toLocaleString()}</span>
                                      {phase.elapsedMs > 0 && (
                                        <>
                                          <span>•</span>
                                          <span className="font-mono">{formatDigitalTime(phase.elapsedMs)}</span>
                                        </>
                                      )}
                                    </div>

                                    {phase.notes && (
                                      <p className="hunt-phase-item-notes">"{phase.notes}"</p>
                                    )}
                                  </div>

                                  {phase.ball && (
                                    <span className="hunt-phase-item-ball-badge" title={`Caught in ${phase.ball}`}>
                                      {phase.ball}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </section>

          {/* OTHER HUNTS QUEUE */}
          {otherHunts.length > 0 && (
            <section className="other-hunts-section">
              <div className="counters-section-header other-hunts-header">
                <h2 className="counters-section-title">
                  OTHER HUNTS <span className="counters-section-count">{otherHunts.length}</span>
                </h2>
              </div>

              <div className="other-hunts-grid">
                {otherHunts.map(hunt => renderCompactHuntCard(hunt))}
              </div>
            </section>
          )}

          {/* ── PERMUTATION TABLE & GRAPH SECTION ───────────────────── */}
          {currentHunt && (
            <section className="w-full mt-4">
              <div className="mmo-graph-section">
                <PermutationTable
                  chartData={currentHunt?.chartData || {}}
                  chartConfig={{
                    firstSpawn: currentHunt?.chartConfig?.firstSpawn ?? 8,
                    secondSpawn: currentHunt?.chartConfig?.secondSpawn ?? 6,
                    isAdvanced: currentHunt?.chartConfig?.isAdvanced ?? false,
                    isSaveOrder: currentHunt?.chartConfig?.isSaveOrder ?? false,
                    showSecondWave: currentHunt?.chartConfig?.showSecondWave ?? false,
                    showGhostChecks: currentHunt?.chartConfig?.showGhostChecks ?? false,
                    ...(currentHunt?.chartConfig || {})
                  }}
                  legendColors={legendColors}
                  setLegendColors={setLegendColors}
                  onChartUpdate={handleChartUpdate}
                  onChartConfigUpdate={handleChartConfigUpdate}
                  onChartCheck={(isChecked) => {
                    if (currentHunt) {
                      const spawnDelta = spawnCheckMode === "spawn"
                        ? (currentHunt.chartConfig?.secondSpawn ?? 6)
                        : 1;
                      if (isChecked) {
                        handleAddCheck(currentHunt.id, spawnDelta);
                      } else {
                        handleDecreaseCheck(currentHunt.id, spawnDelta);
                      }
                    }
                  }}
                />
              </div>
            </section>
          )}
        </div>
      )}

      {/* ============================================================
          MODALS & DIALOGS (WITH UNIVERSAL MODAL SYSTEM)
          ============================================================ */}

      {/* 1. UNIFIED 5-STEP HUNT SETUP WIZARD */}
      <Modal
        isOpen={huntWizard.isOpen}
        onClose={() => setHuntWizard(prev => ({ ...prev, isOpen: false }))}
        title="Shiny Hunt Setup"
        subtitle={`Step ${huntWizard.step + 1} of 5: ${
          huntWizard.step === 0 ? "Game & Modifiers (Legends Arceus • Permutations)" :
          huntWizard.step === 1 ? "Target Pokémon (Legends Arceus)" :
          huntWizard.step === 2 ? "Possible Phases — Optional" :
          huntWizard.step === 3 ? "Counter & Initial Settings" :
          "Review Hunt & Live Odds"
        }`}
        icon={<Sparkles size={22} />}
        size="md"
        className="!max-w-[700px]"
        closeOnBackdrop={false}
        footer={({ close }) => (
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="md"
              onClick={close}
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2.5">
              {huntWizard.step > 0 && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setHuntWizard(prev => ({ ...prev, step: prev.step - 1 }))}
                >
                  Back
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                onClick={huntWizard.step === 4 ? () => handleStartWizardHunt() : () => setHuntWizard(prev => ({ ...prev, step: prev.step + 1 }))}
                disabled={
                  (huntWizard.step === 1 && !huntWizard.selectedPokemon)
                }
                icon={huntWizard.step === 4 ? <Sparkles size={16} strokeWidth={2.5} /> : undefined}
              >
                {huntWizard.step === 4
                  ? "Start Hunting"
                  : huntWizard.step === 2 && huntWizard.possiblePhases.length === 0
                  ? "Skip"
                  : "Next"}
              </Button>
            </div>
          </div>
        )}
      >
        <div>
          {/* Styled Progress Stepper Header */}
          <div className="onboarding-progress-container hunt-wizard-progress-container">
            <div className="onboarding-progress-track" />
            <div
              className="onboarding-progress-fill"
              style={{ width: `calc(${(huntWizard.step / 4)} * (100% - 86px))` }}
            />

            {[
              { id: "game", shortLabel: "GAME", title: "Game & Modifiers" },
              { id: "hunt", shortLabel: "HUNT", title: "Target Pokémon" },
              { id: "phases", shortLabel: "PHASES", title: "Phase Encounters" },
              { id: "settings", shortLabel: "COUNTER", title: "Counter & Settings" },
              { id: "preview", shortLabel: "PREVIEW", title: "Review Hunt & Live Odds" }
            ].map((step, i) => {
              const isActive = i === huntWizard.step;
              const isCompleted = i < huntWizard.step;
              const isDisabled = (i > 1 && !huntWizard.selectedPokemon);

              return (
                <button
                  key={step.id}
                  type="button"
                  className="onboarding-step-wrapper"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    setHuntWizard(prev => ({ ...prev, step: i }));
                  }}
                  title={`Go to Step ${i + 1}: ${step.title}`}
                >
                  <div className={`onboarding-step-circle ${isActive ? 'active' : isCompleted ? 'completed' : 'upcoming'}`}>
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : i + 1}
                  </div>
                  <span className={`onboarding-step-label ${isActive ? 'active' : isCompleted ? 'completed' : 'upcoming'}`}>
                    {step.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Step Content */}
          <div style={{ minHeight: '120px' }}>
            {/* Step 1: Game, Method & Modifiers */}
            {huntWizard.step === 0 && (
              <div className="space-y-4">
                {renderModifiersForm(
                  huntWizard.game,
                  huntWizard.method,
                  huntWizard.modifiers,
                  (callback) => {
                    setHuntWizard(prev => ({
                      ...prev,
                      modifiers: typeof callback === "function" ? callback(prev.modifiers) : callback
                    }));
                  }
                )}
              </div>
            )}

            {/* Step 2: HUNT (Target Pokémon) */}
            {huntWizard.step === 1 && (
              <div className="space-y-3">
                <SearchField
                  value={huntWizard.searchTerm}
                  onChange={(val) => setHuntWizard(prev => ({ ...prev, searchTerm: typeof val === "string" ? val : val?.target?.value || "" }))}
                  placeholder="Search Pokémon in Legends Arceus by name or #dex..."
                  fullWidth
                  autoFocus
                />

                {availableFormTabs.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none custom-scrollbar">
                    {availableFormTabs.map(tab => {
                      const isActive = (huntWizard.formTab || "all") === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                            isActive
                              ? "bg-[var(--accent)] text-black shadow-sm"
                              : "bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"
                          }`}
                          onClick={() => setHuntWizard(prev => ({ ...prev, formTab: tab.id }))}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                  <span>Showing <strong>{wizardGamePokemon.length}</strong> obtainable in <strong>Legends Arceus</strong></span>
                  {huntWizard.selectedPokemon && (
                    <span className="text-[var(--accent)] font-bold flex items-center gap-1">
                      Selected: {formatPokemonName(huntWizard.selectedPokemon.name)} ✓
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1 overscroll-contain">
                  {wizardGamePokemon.map(pokemon => {
                    const isSelected = (huntWizard.selectedPokemon?.stableId || huntWizard.selectedPokemon?.name) === (pokemon.stableId || pokemon.name);
                    const formLabel = getFormDisplayName(pokemon);
                    const dexNum = pokemon.id != null ? `#${String(pokemon.id).padStart(4, "0")}` : "";

                    return (
                      <button
                        key={pokemon.stableId || `${pokemon.id}-${pokemon.name}`}
                        type="button"
                        className={`flex flex-col items-center pt-0 pb-2 px-1.5 rounded-xl border transition group text-left relative overflow-hidden ${
                          isSelected
                            ? "bg-[var(--accent)]/15 border-[var(--accent)]"
                            : "bg-white/[0.03] border-white/[0.08] hover:border-[var(--accent)] hover:bg-[var(--accent)]/10"
                        }`}
                        onClick={() => {
                          setHuntWizard(prev => ({
                            ...prev,
                            selectedPokemon: pokemon
                          }));
                        }}
                        onDoubleClick={() => {
                          setHuntWizard(prev => ({
                            ...prev,
                            selectedPokemon: pokemon,
                            step: 2
                          }));
                        }}
                      >
                        <img
                          src={getPokemonImage(pokemon)}
                          alt={pokemon.name}
                          className={`w-14 h-14 object-contain group-hover:scale-110 transition-transform ${!useHomeSprites ? "pixelated" : ""}`}
                          style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                        />
                        <div className="flex flex-col items-center w-full -mt-2.5 relative z-10">
                          <span className="text-xs font-bold text-white text-center line-clamp-1 max-w-[95%]">
                            {formatPokemonName(pokemon.name)}
                          </span>
                          {dexNum && (
                            <span className="text-[10px] font-mono text-gray-400 font-medium leading-tight mt-0.5">
                              {dexNum}
                            </span>
                          )}
                          {formLabel && (
                            <span className="text-[10px] text-[var(--accent)] font-semibold truncate max-w-[95%] text-center leading-tight mt-0.5">
                              {formLabel}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--accent)] text-black flex items-center justify-center shrink-0 aspect-square shadow-sm pointer-events-none z-20">
                            <Check size={11} strokeWidth={3.5} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: PHASES (Possible Phase Encounters - Optional) */}
            {huntWizard.step === 2 && (
              <div className="space-y-3.5">
                <SearchField
                  value={huntWizard.phaseSearchTerm}
                  onChange={(val) => setHuntWizard(prev => ({ ...prev, phaseSearchTerm: typeof val === "string" ? val : val?.target?.value || "" }))}
                  placeholder="Search and add Pokémon in Legends Arceus..."
                  fullWidth
                />

                {availablePhaseFormTabs.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none custom-scrollbar">
                    {availablePhaseFormTabs.map(tab => {
                      const isActive = (huntWizard.phaseFormTab || "all") === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                            isActive
                              ? "bg-[var(--accent)] text-black shadow-sm"
                              : "bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"
                          }`}
                          onClick={() => setHuntWizard(prev => ({ ...prev, phaseFormTab: tab.id }))}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">
                        Selected Phases
                      </span>
                      <span className="text-sm font-bold text-[var(--accent)]">
                        {huntWizard.possiblePhases.length}/10
                      </span>
                    </div>
                    {huntWizard.possiblePhases.length > 0 && (
                      <button
                        type="button"
                        className="text-xs text-[var(--accent)] hover:underline font-bold transition cursor-pointer"
                        onClick={() => setHuntWizard(prev => ({ ...prev, possiblePhases: [] }))}
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {huntWizard.possiblePhases.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto custom-scrollbar pr-1">
                      {huntWizard.possiblePhases.map(pkm => (
                        <div
                          key={pkm.stableId || `${pkm.id}-${pkm.name}`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-bold text-white shadow-sm hover:border-white/20 transition group"
                        >
                          <span>{formatPokemonName(pkm.name)}</span>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-rose-400 transition p-0.5 rounded cursor-pointer"
                            title="Remove"
                            onClick={() => {
                              setHuntWizard(prev => ({
                                ...prev,
                                possiblePhases: prev.possiblePhases.filter(
                                  p => (p.stableId || p.id) !== (pkm.stableId || pkm.id)
                                )
                              }));
                            }}
                          >
                            <X size={13} strokeWidth={2.5} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1 overscroll-contain">
                  {wizardGamePhasePokemon.map(pkm => {
                    const isAdded = huntWizard.possiblePhases.some(
                      p => (p.stableId || p.id) === (pkm.stableId || pkm.id)
                    );
                    const formLabel = getFormDisplayName(pkm);
                    const dexNum = pkm.id != null ? `#${String(pkm.id).padStart(4, "0")}` : "";

                    return (
                      <button
                        key={pkm.stableId || `${pkm.id}-${pkm.name}`}
                        type="button"
                        className={`flex flex-col items-center pt-0 pb-2 px-1.5 rounded-xl border transition group text-left relative overflow-hidden ${
                          isAdded
                            ? "bg-[var(--accent)]/15 border-[var(--accent)]"
                            : "bg-white/[0.03] border-white/[0.08] hover:border-[var(--accent)] hover:bg-[var(--accent)]/10"
                        }`}
                        onClick={() => {
                          setHuntWizard(prev => ({
                            ...prev,
                            possiblePhases: isAdded
                              ? prev.possiblePhases.filter(p => (p.stableId || p.id) !== (pkm.stableId || pkm.id))
                              : prev.possiblePhases.length >= 10
                              ? prev.possiblePhases
                              : [...prev.possiblePhases, pkm]
                          }));
                        }}
                      >
                        <img
                          src={getPokemonImage(pkm)}
                          alt={pkm.name}
                          className={`w-14 h-14 object-contain group-hover:scale-110 transition-transform ${!useHomeSprites ? "pixelated" : ""}`}
                          style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                        />
                        <div className="flex flex-col items-center w-full -mt-2.5 relative z-10">
                          <span className="text-xs font-bold text-white text-center line-clamp-1 max-w-[95%]">
                            {formatPokemonName(pkm.name)}
                          </span>
                          {dexNum && (
                            <span className="text-[10px] font-mono text-gray-400 font-medium leading-tight mt-0.5">
                              {dexNum}
                            </span>
                          )}
                          {formLabel && (
                            <span className="text-[10px] text-[var(--accent)] font-semibold truncate max-w-[95%] text-center leading-tight mt-0.5">
                              {formLabel}
                            </span>
                          )}
                        </div>
                        {isAdded && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[var(--accent)] text-black flex items-center justify-center shrink-0 aspect-square shadow-sm pointer-events-none z-20">
                            <Check size={11} strokeWidth={3.5} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition text-left cursor-pointer group"
                  onClick={() => setHuntWizard(prev => ({ ...prev, allowAnyPhase: prev.allowAnyPhase === false }))}
                >
                  <div className="flex items-center gap-2 text-gray-300 font-medium text-xs">
                    <span className="text-[var(--accent)] font-black text-sm leading-none">+</span>
                    <span>Any obtainable Pokémon can phase at any time</span>
                  </div>
                  <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${
                    huntWizard.allowAnyPhase !== false
                      ? "bg-[var(--accent)]"
                      : "bg-white/20"
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-black shadow-sm transition-transform ${
                      huntWizard.allowAnyPhase !== false ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </div>
                </button>
              </div>
            )}

            {/* Step 4: COUNTER & INITIAL SETTINGS */}
            {huntWizard.step === 3 && (
              <div className="space-y-4">
                <div className="hunt-modal-card space-y-3 p-4">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-white">
                    Counter & Initial Settings
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="hunt-modal-label !text-white text-white font-bold">
                        Starting Encounters
                      </label>
                      <p className="text-[11px] text-gray-400 mb-1.5">
                        Already started hunting before tracking here? Enter your existing check count.
                      </p>
                      <div className="flex items-stretch rounded-xl bg-black/40 border border-white/10 focus-within:border-[var(--accent)] transition overflow-hidden">
                        <input
                          type="number"
                          min="0"
                          className="w-full bg-transparent pl-3 pr-2 py-2 text-sm text-white font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={huntWizard.startChecks}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") {
                              setHuntWizard(prev => ({ ...prev, startChecks: "" }));
                            } else {
                              const n = parseInt(v, 10);
                              setHuntWizard(prev => ({ ...prev, startChecks: isNaN(n) ? 0 : Math.max(0, n) }));
                            }
                          }}
                          onBlur={() => setHuntWizard(prev => ({ ...prev, startChecks: Math.max(0, parseInt(prev.startChecks, 10) || 0) }))}
                          placeholder="0"
                        />
                        <div className="flex flex-col border-l border-white/10 divide-y divide-white/10 shrink-0">
                          <button
                            type="button"
                            className="px-2.5 flex-1 bg-white/[0.03] hover:bg-[var(--accent)] text-gray-300 hover:text-black transition flex items-center justify-center"
                            onClick={() => setHuntWizard(prev => ({ ...prev, startChecks: (parseInt(prev.startChecks, 10) || 0) + 1 }))}
                            title="Increment"
                          >
                            <ChevronUp size={11} strokeWidth={3} />
                          </button>
                          <button
                            type="button"
                            className="px-2.5 flex-1 bg-white/[0.03] hover:bg-[var(--accent)] text-gray-300 hover:text-black transition flex items-center justify-center"
                            onClick={() => setHuntWizard(prev => ({ ...prev, startChecks: Math.max(0, (parseInt(prev.startChecks, 10) || 0) - 1) }))}
                            title="Decrement"
                          >
                            <ChevronDown size={11} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="hunt-modal-label !text-white text-white font-bold">
                        Step Increment
                      </label>
                      <p className="text-[11px] text-gray-400 mb-1.5">
                        How many encounters are added per count increment (default 1).
                      </p>
                      <div className="flex items-stretch rounded-xl bg-black/40 border border-white/10 focus-within:border-[var(--accent)] transition overflow-hidden">
                        <input
                          type="number"
                          min="1"
                          className="w-full bg-transparent pl-3 pr-2 py-2 text-sm text-white font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={huntWizard.huntIncrement}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") {
                              setHuntWizard(prev => ({ ...prev, huntIncrement: "" }));
                            } else {
                              const n = parseInt(v, 10);
                              setHuntWizard(prev => ({ ...prev, huntIncrement: isNaN(n) ? 1 : Math.max(1, n) }));
                            }
                          }}
                          onBlur={() => setHuntWizard(prev => ({ ...prev, huntIncrement: Math.max(1, parseInt(prev.huntIncrement, 10) || 1) }))}
                          placeholder="1"
                        />
                        <div className="flex flex-col border-l border-white/10 divide-y divide-white/10 shrink-0">
                          <button
                            type="button"
                            className="px-2.5 flex-1 bg-white/[0.03] hover:bg-[var(--accent)] text-gray-300 hover:text-black transition flex items-center justify-center"
                            onClick={() => setHuntWizard(prev => ({ ...prev, huntIncrement: (parseInt(prev.huntIncrement, 10) || 1) + 1 }))}
                            title="Increment"
                          >
                            <ChevronUp size={11} strokeWidth={3} />
                          </button>
                          <button
                            type="button"
                            className="px-2.5 flex-1 bg-white/[0.03] hover:bg-[var(--accent)] text-gray-300 hover:text-black transition flex items-center justify-center"
                            onClick={() => setHuntWizard(prev => ({ ...prev, huntIncrement: Math.max(1, (parseInt(prev.huntIncrement, 10) || 1) - 1) }))}
                            title="Decrement"
                          >
                            <ChevronDown size={11} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-2 flex flex-col items-center text-center">
                      <label className="hunt-modal-label !text-white text-white font-bold text-center">
                        Starting Elapsed Time
                      </label>
                      <p className="text-[11px] text-gray-400 mb-1.5 text-center">
                        Time already spent on this hunt (Hours, Minutes, Seconds).
                      </p>
                      <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
                        <div className="flex items-center rounded-xl bg-black/40 border border-white/10 px-2.5 py-1.5">
                          <input
                            type="number"
                            min="0"
                            className="w-full bg-transparent text-sm text-white font-bold focus:outline-none text-center"
                            placeholder="0"
                            value={huntWizard.startTime.hours || ""}
                            onChange={(e) => setHuntWizard(prev => ({ ...prev, startTime: { ...prev.startTime, hours: e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0) } }))}
                          />
                          <span className="text-xs text-gray-400 font-bold ml-1">h</span>
                        </div>
                        <div className="flex items-center rounded-xl bg-black/40 border border-white/10 px-2.5 py-1.5">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            className="w-full bg-transparent text-sm text-white font-bold focus:outline-none text-center"
                            placeholder="0"
                            value={huntWizard.startTime.minutes || ""}
                            onChange={(e) => setHuntWizard(prev => ({ ...prev, startTime: { ...prev.startTime, minutes: e.target.value === "" ? "" : Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)) } }))}
                          />
                          <span className="text-xs text-gray-400 font-bold ml-1">m</span>
                        </div>
                        <div className="flex items-center rounded-xl bg-black/40 border border-white/10 px-2.5 py-1.5">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            className="w-full bg-transparent text-sm text-white font-bold focus:outline-none text-center"
                            placeholder="0"
                            value={huntWizard.startTime.seconds || ""}
                            onChange={(e) => setHuntWizard(prev => ({ ...prev, startTime: { ...prev.startTime, seconds: e.target.value === "" ? "" : Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)) } }))}
                          />
                          <span className="text-xs text-gray-400 font-bold ml-1">s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: PREVIEW */}
            {huntWizard.step === 4 && (
              <div className="space-y-4 max-h-[440px] overflow-y-auto custom-scrollbar pr-1 overscroll-contain">
                {huntWizard.selectedPokemon && (
                  <HuntIdentityOddsCard
                    pokemon={huntWizard.selectedPokemon}
                    game="Legends Arceus"
                    method="Permutations"
                    modifiers={huntWizard.modifiers}
                    useHomeSprites={useHomeSprites}
                  />
                )}

                <div className="hunt-modal-card space-y-2.5 p-3.5 bg-white/[0.03] border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between text-xs border-b border-white/[0.08] pb-2">
                    <span className="font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={13} className="text-[var(--accent)]" /> Counter & Pacing Settings
                    </span>
                    <span className="text-gray-400 text-[11px]">Configured for hunt start</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                    <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Starting Checks</span>
                      <span className="text-sm font-extrabold text-white mt-1">
                        {(parseInt(huntWizard.startChecks, 10) || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Step Increment</span>
                      <span className="text-sm font-extrabold text-[var(--accent)] mt-1">
                        +{huntWizard.huntIncrement || 1}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Starting Elapsed</span>
                      <span className="text-sm font-extrabold text-white mt-1">
                        {(() => {
                          const h = parseInt(huntWizard.startTime.hours, 10) || 0;
                          const m = parseInt(huntWizard.startTime.minutes, 10) || 0;
                          const s = parseInt(huntWizard.startTime.seconds, 10) || 0;
                          const totalMs = ((h * 3600) + (m * 60) + s) * 1000;
                          return totalMs > 0 ? formatDigitalTime(totalMs) : "00:00:00";
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Odds Breakdown Modal */}
      <OddsBreakdownModal
        isOpen={oddsModal.show}
        onClose={() => setOddsModal(prev => ({ ...prev, show: false }))}
        hunt={oddsModal.hunt}
      />

      {/* Adjust Values Modal */}
      <AdjustHuntModal
        isOpen={settingsModal.show}
        onClose={() => setSettingsModal({ show: false, hunt: null })}
        hunt={settingsModal.hunt}
        huntIncrements={huntIncrements}
        onSaveAdjustments={(huntId, payload) => {
          handleSaveAdjustValues(settingsModal.hunt, payload);
        }}
      />

      {/* Shiny Encounter Modal */}
      <ShinyEncounterModal
        isOpen={shinyEncounterModal.show}
        onClose={() => setShinyEncounterModal(prev => ({ ...prev, show: false }))}
        hunt={shinyEncounterModal.hunt}
        allPokemon={allPokemon}
        formsData={formsData}
        useHomeSprites={useHomeSprites}
        username={user?.username || null}
        showMessage={showMessage}
        onCompleteTargetHunt={handleCompleteTargetHunt}
        onContinueAfterPhase={handleContinueAfterPhase}
        onAddShinyToCollection={handleAddShinyToCollection}
        onAddShinyFailToCollection={handleAddShinyFailToCollection}
      />

      {/* 4. EDIT OUTBREAK MODAL */}
      <Modal
        isOpen={editModal.show}
        onClose={() => setEditModal(prev => ({ ...prev, show: false }))}
        title="Edit Outbreak Settings"
        subtitle="Update outbreak modifiers or target Pokémon"
        icon={<Edit size={22} />}
        size="sm"
        footer={({ close }) => (
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const hunt = editModal.hunt;
                if (!hunt || !editModal.pokemon) return;
                const odds = calculateOdds(hunt.game, hunt.method, editModal.modifiers);
                setAllActiveHunts(prev => {
                  const next = prev.map(h => String(h.id) === String(hunt.id) ? {
                    ...h,
                    pokemon: editModal.pokemon,
                    modifiers: editModal.modifiers,
                    notes: editModal.notes,
                    odds
                  } : h);
                  setCachedHuntsData({ activeHunts: next });
                  debouncedSave(next);
                  return next;
                });
                setEditModal({ show: false, hunt: null, pokemon: null, modifiers: {}, notes: "" });
                showMessage("Outbreak settings updated!", "success");
              }}
            >
              Save Changes
            </Button>
          </>
        )}
      >
        {editModal.hunt && (
          <div className="space-y-4">
            {renderModifiersForm(
              editModal.hunt.game,
              editModal.hunt.method,
              editModal.modifiers,
              (callback) => {
                setEditModal(prev => ({
                  ...prev,
                  modifiers: typeof callback === "function" ? callback(prev.modifiers) : callback
                }));
              }
            )}

            <TextArea
              label="Hunt Notes"
              placeholder="Notes..."
              value={editModal.notes}
              onChange={(e) => setEditModal(prev => ({ ...prev, notes: e.target?.value !== undefined ? e.target.value : e }))}
              maxLength={200}
              fullWidth
              rows={2}
              resize="none"
            />
          </div>
        )}
      </Modal>

      {/* 5. FAILS & PHASES HISTORY MODAL */}
      <Modal
        isOpen={phaseHistoryModal.show}
        onClose={() => setPhaseHistoryModal(prev => ({ ...prev, show: false }))}
        title="Fails & Phases History"
        subtitle={`Timeline for Shiny ${formatPokemonName(phaseHistoryModal.hunt?.pokemon?.name)}`}
        icon={<History size={22} />}
        size="md"
      >
        {phaseHistoryModal.hunt && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
            {(!phaseHistoryModal.hunt.phases || phaseHistoryModal.hunt.phases.length === 0) ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No phase or failed encounters recorded yet for this hunt.
              </div>
            ) : (
              phaseHistoryModal.hunt.phases.map((phase, idx) => {
                const info = getPhaseEntryDisplayInfo(phase, phaseHistoryModal.hunt.phases);
                const displayChecks = getPhaseDisplayChecks(phase, phaseHistoryModal.hunt.phases);

                return (
                  <div
                    key={phase.id || idx}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      info.isFail
                        ? "bg-rose-500/10 border-rose-500/20"
                        : "bg-white/[0.03] border-white/[0.08]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={getPokemonImage(phase.pokemon)}
                        alt=""
                        className={`w-12 h-12 object-contain ${!useHomeSprites ? "pixelated" : ""}`}
                        style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                      />
                      <div>
                        <span className={`text-xs font-black uppercase ${info.isFail ? "text-rose-400" : "text-[var(--accent)]"}`}>
                          {info.label}
                        </span>
                        <h4 className="text-sm font-extrabold text-white">
                          {formatPokemonName(phase.pokemon?.name)}
                        </h4>
                        <span className="text-xs text-gray-400 font-semibold">
                          {displayChecks.intervalChecks.toLocaleString()} checks (Total: {displayChecks.totalChecks.toLocaleString()})
                          {phase.elapsedMs > 0 && ` • ${formatDigitalTime(phase.elapsedMs)}`}
                        </span>
                      </div>
                    </div>

                    {phase.ball && (
                      <span className="text-xs font-bold text-gray-300 bg-white/[0.06] border border-white/10 px-2 py-1 rounded-md">
                        {phase.ball}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </Modal>

      {/* 6. GLOBAL HUNT HISTORY MODAL */}
      <HuntHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        huntHistory={huntHistory}
        mode="mmo"
        onDeleteEntry={handleDeleteHistoryEntry}
        onClearAll={handleClearAllHistory}
        onOpenWizard={handleOpenHuntWizard}
        useHomeSprites={useHomeSprites}
        formsData={formsData}
      />

      {/* 7. RESET OUTBREAK CONFIRM MODAL */}
      <ConfirmModal
        isOpen={resetModal.show}
        onClose={() => setResetModal({ show: false, hunt: null })}
        onConfirm={() => resetModal.hunt && handleConfirmResetTimer(resetModal.hunt.id)}
        title="Reset Outbreak"
        message={`Are you sure you want to reset this outbreak for "${resetModal.hunt ? formatPokemonName(resetModal.hunt.pokemon?.name) : ''}"? This will reset the check count and timer.`}
        confirmText="Reset Outbreak"
        variant="warning"
      />

      {/* 8. DELETE OUTBREAK CONFIRM MODAL */}
      <ConfirmModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, hunt: null })}
        onConfirm={() => deleteModal.hunt && handleDeleteHunt(deleteModal.hunt.id)}
        title="Delete Outbreak"
        message={`Are you sure you want to delete this outbreak for "${deleteModal.hunt ? formatPokemonName(deleteModal.hunt.pokemon?.name) : ''}"? This will permanently remove this outbreak.`}
        confirmText="Delete Outbreak"
        variant="danger"
      />
    </div>
  );
}
