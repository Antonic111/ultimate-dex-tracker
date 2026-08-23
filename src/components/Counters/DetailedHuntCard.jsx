import React, { useState, useCallback, useRef, useEffect } from "react";
import { formatPokemonName, getFormDisplayName as defaultGetFormDisplayName } from "../../utils";
import { getCurrentHuntOdds } from "../../utils/huntSystem";
import {
  formatDigitalTime,
  formatIntervalTime,
  getHuntElapsedTime
} from "../../utils/huntSync";
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  MoreVertical,
  BarChart3,
  Sliders,
  Maximize2,
  Trash2,
  Flag,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from "lucide-react";

export default function DetailedHuntCard({
  hunt,
  isPopout = false,
  getPokemonImage,
  useHomeSprites = false,
  getFormDisplayName,
  hotkey = " ",
  decrementHotkey = "-",
  huntIncrement = 1,
  metricMode = "phase",
  onToggleMetricMode,
  isPhasesCollapsed = false,
  onToggleCollapsePhases,
  isMenuOpen = false,
  onToggleMenu,
  onCloseMenu,
  onAddCheck,
  onDecreaseCheck,
  onTogglePause,
  onReset,
  onLogShiny,
  onOpenOdds,
  onOpenHistory,
  onAdjustValues,
  onPopout,
  onDelete
}) {
  const [internalSpinning, setInternalSpinning] = useState(false);
  const [internalHoveredRotate, setInternalHoveredRotate] = useState(false);
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const menuContainerRef = useRef(null);

  // If menu state is controlled externally, use it; otherwise use internal state
  const menuOpen = onToggleMenu !== undefined ? isMenuOpen : internalMenuOpen;

  const toggleMenu = useCallback((e) => {
    e.stopPropagation();
    if (onToggleMenu) {
      onToggleMenu();
    } else {
      setInternalMenuOpen(prev => !prev);
    }
  }, [onToggleMenu]);

  // Click outside listener to dismiss the menu
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target)) {
        if (onCloseMenu) {
          onCloseMenu();
        } else if (onToggleMenu) {
          onToggleMenu();
        } else {
          setInternalMenuOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpen, onCloseMenu, onToggleMenu]);

  if (!hunt) return null;

  const isPaused = hunt.status === "paused" || hunt.isPaused;
  const totalElapsedMs = getHuntElapsedTime(hunt);

  // Live dynamic odds calculation
  const dynamicOdds = getCurrentHuntOdds(
    hunt.game || "Scarlet",
    hunt.method || "Mass Outbreaks",
    hunt.modifiers || {},
    hunt.checks
  );

  const phases = hunt.phases || [];
  const hasPhases = phases.length > 0;
  const lastPhase = hasPhases ? phases[phases.length - 1] : null;
  const isLastFail = lastPhase?.outcome === "failed";

  const nonTargetPhasesCount = phases.filter(p => !p.isTarget && p.outcome === 'caught').length;
  const phaseCount = nonTargetPhasesCount + 1;
  const failCount = phases.filter(p => p.outcome === 'failed').length;

  let totalOverallChecks = hunt.checks || 0;
  let currentIntervalChecks = hunt.checks || 0;

  if (hasPhases && lastPhase) {
    const lastTotal = lastPhase.totalChecks !== undefined && lastPhase.totalChecks !== null
      ? lastPhase.totalChecks
      : phases.reduce((acc, p) => acc + (p.phaseChecks || p.checks || 0), 0);

    if (hunt.checks >= lastTotal && lastTotal > 0) {
      // Legacy un-reset continuous counter
      totalOverallChecks = hunt.checks;
      currentIntervalChecks = hunt.checks - lastTotal;
    } else {
      // Modern interval reset counter
      totalOverallChecks = lastTotal + (hunt.checks || 0);
      currentIntervalChecks = hunt.checks || 0;
    }
  }

  const progressPercent = Math.round((currentIntervalChecks / dynamicOdds) * 100);
  const formLabel = (getFormDisplayName || defaultGetFormDisplayName)(hunt.pokemon);

  const currentIntervalLabel = isLastFail
    ? "Checks Since Fail"
    : (nonTargetPhasesCount > 0 ? `Phase ${phaseCount} Checks` : "Encounters");

  const currentIntervalSubtext = isLastFail
    ? `Since Fail: ${currentIntervalChecks.toLocaleString()} checks`
    : (nonTargetPhasesCount > 0 ? `Phase ${phaseCount}: ${currentIntervalChecks.toLocaleString()} checks` : `Current: ${currentIntervalChecks.toLocaleString()} checks`);

  const handleRotate = (e) => {
    e.stopPropagation();
    setInternalSpinning(true);
    setTimeout(() => {
      setInternalSpinning(false);
    }, 450);
    if (onToggleMetricMode) {
      onToggleMetricMode();
    }
  };

  return (
    <div className={`hunt-card ${isPaused ? "is-paused" : "is-active"}`} style={isPopout ? { margin: 0 } : undefined}>
      {/* Card Top Row: Status Pill & Action Controls (Arrow + 3 Dots) */}
      <div className="hunt-card-top-bar">
        <span className={`hunt-status-pill ${isPaused ? "paused" : "active"}`}>
          {isPaused ? "Paused" : "Active"}
        </span>

        <div className="hunt-top-actions-group">
          {hasPhases && onToggleCollapsePhases && (
            <button
              type="button"
              className={`hunt-panel-collapse-btn ${isPhasesCollapsed ? "is-collapsed" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapsePhases();
              }}
              title={isPhasesCollapsed ? "Open Fails & Phases panel" : "Close Fails & Phases panel"}
            >
              {isPhasesCollapsed ? <ChevronLeft size={20} strokeWidth={2.2} /> : <ChevronRight size={20} strokeWidth={2.2} />}
            </button>
          )}

          {!isPopout && (
            <div className="hunt-menu-container" ref={menuContainerRef}>
              <button
                type="button"
                className="hunt-menu-trigger"
                onClick={toggleMenu}
                title="Hunt options"
              >
                <MoreVertical size={18} />
              </button>

              <div className={`hunt-context-dropdown ${menuOpen ? "is-open" : ""}`}>
                {onOpenOdds && (
                  <button
                    type="button"
                    className="hunt-dropdown-item"
                    onClick={() => {
                      onOpenOdds(hunt);
                      if (onToggleMenu) onToggleMenu(); else setInternalMenuOpen(false);
                    }}
                  >
                    <BarChart3 size={15} /> View Odds Breakdown
                  </button>
                )}

                {onAdjustValues && (
                  <button
                    type="button"
                    className="hunt-dropdown-item"
                    onClick={() => {
                      onAdjustValues(hunt, totalElapsedMs);
                      if (onToggleMenu) onToggleMenu(); else setInternalMenuOpen(false);
                    }}
                  >
                    <Sliders size={15} /> Adjust Values
                  </button>
                )}

                {onPopout && (
                  <button
                    type="button"
                    className="hunt-dropdown-item"
                    onClick={() => {
                      onPopout(hunt);
                      if (onToggleMenu) onToggleMenu(); else setInternalMenuOpen(false);
                    }}
                  >
                    <Maximize2 size={15} /> Popout Window
                  </button>
                )}

                {onDelete && (
                  <>
                    <div className="hunt-dropdown-divider" />
                    <button
                      type="button"
                      className="hunt-dropdown-item danger"
                      onClick={() => {
                        onDelete(hunt);
                        if (onToggleMenu) onToggleMenu(); else setInternalMenuOpen(false);
                      }}
                    >
                      <Trash2 size={15} /> Delete Hunt
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pokemon Identity Header */}
      <div className="hunt-pokemon-row">
        <div className="hunt-sprite-well">
          <img
            src={getPokemonImage ? getPokemonImage(hunt.pokemon) : "/fallback.png"}
            alt={hunt.pokemon?.name || "Pokemon"}
            className={`hunt-sprite-img ${!useHomeSprites ? "pixelated image-render-pixelated" : ""}`}
            style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
            onError={(e) => { e.currentTarget.src = "/fallback.png"; }}
          />
        </div>

        <div className="hunt-pokemon-meta">
          <h3 className="hunt-pokemon-title">
            {formatPokemonName(hunt.pokemon?.name)} <Sparkles size={18} className="hunt-sparkle-icon" />
          </h3>
          <div className="hunt-badges-row">
            <span className="hunt-meta-badge game-badge">{hunt.game || "Scarlet"}</span>
            <span className="hunt-meta-badge method-badge">{hunt.method || "Outbreaks"}</span>
            {formLabel && (
              <span className="hunt-meta-badge form-badge">{formLabel}</span>
            )}
            {hunt.modifiers?.shinyCharm && (
              <span className="hunt-meta-badge modifier-badge flex items-center gap-1" title="Shiny Charm Active">
                <img src="/modifier_images/shinycharm.png" alt="" className="w-3.5 h-3.5 object-contain" />
                <span>Charm</span>
              </span>
            )}
            {hunt.modifiers?.sparklingLv3 && (
              <span className="hunt-meta-badge modifier-badge flex items-center gap-1" title="Sparkling Power Lv 3">
                <img src="/modifier_images/sandwich.png" alt="" className="w-3.5 h-3.5 object-contain" />
                <span>Lv 3</span>
              </span>
            )}
            {hunt.modifiers?.sparklingLv2 && (
              <span className="hunt-meta-badge modifier-badge flex items-center gap-1" title="Sparkling Power Lv 2">
                <img src="/modifier_images/sandwich.png" alt="" className="w-3.5 h-3.5 object-contain" />
                <span>Lv 2</span>
              </span>
            )}
            {hunt.modifiers?.sparklingLv1 && (
              <span className="hunt-meta-badge modifier-badge flex items-center gap-1" title="Sparkling Power Lv 1">
                <img src="/modifier_images/sandwich.png" alt="" className="w-3.5 h-3.5 object-contain" />
                <span>Lv 1</span>
              </span>
            )}
            {hunt.modifiers?.communityDay && (
              <span className="hunt-meta-badge modifier-badge">Comm Day</span>
            )}
            {hunt.modifiers?.eventBoosted && (
              <span className="hunt-meta-badge modifier-badge flex items-center gap-1" title="Event Boosted">
                <img src="/modifier_images/eventboosted.png" alt="" className="w-3.5 h-3.5 object-contain" />
                <span>Event</span>
              </span>
            )}
            {hunt.modifiers?.lureActive && (
              <span className="hunt-meta-badge modifier-badge flex items-center gap-1" title="Lure Active">
                <img src="/modifier_images/lure.png" alt="" className="w-3.5 h-3.5 object-contain" />
                <span>Lure</span>
              </span>
            )}
            {hunt.modifiers?.researchLv10 && (
              <span className="hunt-meta-badge modifier-badge flex items-center gap-1" title="Research Lv 10">
                <img src="/modifier_images/research.png" alt="" className="w-3.5 h-3.5 object-contain" />
                <span>Lv 10</span>
              </span>
            )}
            {hunt.modifiers?.perfectResearch && (
              <span className="hunt-meta-badge modifier-badge flex items-center gap-1" title="Perfect Research">
                <img src="/modifier_images/perfectresearch.png" alt="" className="w-3.5 h-3.5 object-contain" />
                <span>Perfect</span>
              </span>
            )}
            {hunt.modifiers?.shinyParents && (
              <span className="hunt-meta-badge modifier-badge flex items-center gap-1" title="Shiny Parent">
                <img src="/modifier_images/shinyparents.png" alt="" className="w-3.5 h-3.5 object-contain" />
                <span>Parent</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid (Phase Checks vs Total Checks & Elapsed Time) */}
      <div className="hunt-metrics-grid">
        <div
          className={`hunt-metric-box ${onOpenOdds ? "cursor-pointer group" : ""}`}
          onClick={() => onOpenOdds && onOpenOdds(hunt)}
          title={onOpenOdds ? "Click to view special odds chart and breakdown" : undefined}
        >
          {hasPhases && (
            <button
              type="button"
              className={`hunt-metric-rotate-btn ${internalSpinning ? "is-spinning" : ""}`}
              onMouseEnter={() => setInternalHoveredRotate(true)}
              onMouseLeave={() => setInternalHoveredRotate(false)}
              onClick={handleRotate}
              title={metricMode === "total" ? `Switch to ${currentIntervalLabel}` : "Switch to Total Checks"}
            >
              <RefreshCw size={12} />
            </button>
          )}

          <span className="hunt-metric-label">
            {metricMode === "total"
              ? "Total Checks"
              : currentIntervalLabel}
          </span>

          <span className="hunt-metric-value encounters">
            {metricMode === "total"
              ? totalOverallChecks.toLocaleString()
              : currentIntervalChecks.toLocaleString()}
          </span>

          {hasPhases && (
            <span className={`hunt-metric-subtext transition-colors ${internalHoveredRotate ? "" : "group-hover:text-[var(--accent)]"}`}>
              {metricMode === "total"
                ? currentIntervalSubtext
                : `Total: ${totalOverallChecks.toLocaleString()} checks`}
            </span>
          )}
        </div>

        <div className="hunt-metric-box">
          <span className="hunt-metric-label">Elapsed Time</span>
          <span className="hunt-metric-value time">{formatDigitalTime(totalElapsedMs)}</span>
          <span className="hunt-metric-subtext">
            ⏱ {totalOverallChecks > 0 && totalElapsedMs > 0 ? `${formatIntervalTime(totalElapsedMs / 1000 / totalOverallChecks)} / check` : "0.0s / check"}
          </span>
        </div>
      </div>

      {/* Quick Action Buttons (-Increment, Pause/Resume, +Increment) */}
      <div className="hunt-quick-controls">
        <button
          type="button"
          className="hunt-btn-minus"
          onClick={() => onDecreaseCheck && onDecreaseCheck(hunt.id)}
          title={`Decrease encounters by ${huntIncrement}${decrementHotkey ? ` (Hotkey: ${decrementHotkey === " " ? "SPACE" : decrementHotkey.toUpperCase()})` : ""}`}
        >
          −{huntIncrement}
        </button>

        <button
          type="button"
          className="hunt-btn-pause"
          onClick={() => onTogglePause && onTogglePause(hunt.id)}
        >
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
          <span>{isPaused ? "Resume" : "Pause"}</span>
        </button>

        <button
          type="button"
          className="hunt-btn-plus"
          onClick={() => onAddCheck && onAddCheck(hunt.id)}
          title={`Add ${huntIncrement} encounter (Hotkey: ${hotkey === " " ? "SPACE" : hotkey.toUpperCase()})`}
        >
          +{huntIncrement}
        </button>
      </div>

      {/* State Control Row (Reset + Log Shiny) */}
      <div className="hunt-state-controls">
        <button
          type="button"
          className={`hunt-btn-reset ${isPopout ? "is-disabled-popout" : ""}`}
          disabled={isPopout || !onReset}
          onClick={() => onReset && onReset(hunt)}
          title={isPopout ? "Please use the main site to reset this hunt" : "Reset hunt timer & stats"}
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>

        <button
          type="button"
          className={`hunt-btn-complete ${isPopout ? "is-disabled-popout" : ""}`}
          disabled={isPopout || !onLogShiny}
          onClick={() => onLogShiny && onLogShiny(hunt)}
          title={isPopout ? "Please use the main site to log a shiny" : "Log shiny encounter"}
        >
          <span>Log Shiny</span>
        </button>
      </div>

      {/* Card Footer: Phase & Fail Status Pill Bar + Progress % & Odds */}
      <div className="hunt-card-footer-bar">
        <div className="flex items-center gap-2">
          <span
            className={`hunt-phase-badge ${onOpenHistory ? "cursor-pointer" : "cursor-default"} ${nonTargetPhasesCount === 0 ? "is-zero" : ""}`}
            onClick={() => onOpenHistory && onOpenHistory(hunt)}
            title={onOpenHistory ? "Click to view phase history" : undefined}
          >
            <Flag size={13} /> Phases: {nonTargetPhasesCount}
          </span>

          <span
            className={`hunt-fails-badge ${onOpenHistory ? "cursor-pointer" : "cursor-default"} ${failCount === 0 ? "is-zero" : ""}`}
            onClick={() => onOpenHistory && onOpenHistory(hunt)}
            title={onOpenHistory ? "Click to view failed encounters" : undefined}
          >
            <AlertCircle size={13} /> Fails: {failCount}
          </span>
        </div>

        <div
          className={`hunt-footer-odds-container ${onOpenOdds ? "cursor-pointer group/odds" : ""}`}
          onClick={() => onOpenOdds && onOpenOdds(hunt)}
          title={onOpenOdds ? "Click to view special odds chart and breakdown" : undefined}
        >
          <span className="hunt-total-progress-text">{progressPercent}% of odds</span>
          <span className="hunt-footer-odds-subtext">
            1 / {dynamicOdds.toLocaleString()} Odds
          </span>
        </div>
      </div>
    </div>
  );
}
