import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Clock, Pause, AlertTriangle, CheckCircle2, Flame, Award, Activity, Target, Swords, Flag } from "lucide-react";
import { formatPokemonName, getFormDisplayName } from "../../utils";
import { getSpriteUrl } from "../../utils/spriteUtils";
import { formatDigitalTime, formatIntervalTime, getHuntElapsedTime } from "../../utils/huntSync";
import "../../css/StreamerOverlay.css";

const getActiveModifierIcons = (modifiers = {}) => {
  if (!modifiers || typeof modifiers !== "object") return [];
  const icons = [];
  if (modifiers.shinyCharm) {
    icons.push({ key: "charm", src: "/modifier_images/shinycharm.png", label: "Shiny Charm" });
  }
  if (modifiers.sparklingLv3 || modifiers.sparklingPower === 3 || modifiers.sparklingPower3) {
    icons.push({ key: "sandwich3", src: "/modifier_images/sandwich.png", label: "Sparkling Power Lv 3", badge: "3" });
  } else if (modifiers.sparklingLv2 || modifiers.sparklingPower === 2 || modifiers.sparklingPower2) {
    icons.push({ key: "sandwich2", src: "/modifier_images/sandwich.png", label: "Sparkling Power Lv 2", badge: "2" });
  } else if (modifiers.sparklingLv1 || modifiers.sparklingPower === 1 || modifiers.sparklingPower1 || modifiers.sandwich) {
    icons.push({ key: "sandwich1", src: "/modifier_images/sandwich.png", label: "Sparkling Power Lv 1", badge: "1" });
  }
  if (modifiers.lureActive || modifiers.lure) {
    icons.push({ key: "lure", src: "/modifier_images/lure.png", label: "Lure Active" });
  }
  if (modifiers.eventBoosted) {
    icons.push({ key: "event", src: "/modifier_images/eventboosted.png", label: "Event Boosted" });
  }
  if (modifiers.shinyParents || modifiers.masuda) {
    icons.push({ key: "masuda", src: "/modifier_images/shinyparents.png", label: "Foreign Parents (Masuda)" });
  }
  if (modifiers.perfectResearch) {
    icons.push({ key: "perfect", src: "/modifier_images/perfectresearch.png", label: "Perfect Research Entry" });
  } else if (modifiers.researchLv10 || modifiers.researchLevel10 || modifiers.research) {
    icons.push({ key: "research", src: "/modifier_images/research.png", label: "Research Level 10" });
  }
  return icons;
};

const FONT_FAMILIES = {
  system: "inherit",
  inherit: "inherit",
  inter: "'Inter', system-ui, -apple-system, sans-serif",
  orbitron: "'Orbitron', sans-serif",
  rubik: "'Rubik', sans-serif",
  poppins: "'Poppins', sans-serif",
  "press-start": "'Press Start 2P', monospace",
  pixelify: "'Pixelify Sans', sans-serif",
  chakra: "'Chakra Petch', sans-serif",
  outfit: "'Outfit', sans-serif",
};

/**
 * Universal Hunt Overlay Renderer
 * Used identically in both the OBS Browser Source page and the Overlay Editor Preview.
 */
export default function HuntOverlayRenderer({
  hunt = null,
  overlayConfig = {},
  isPaused = false,
  accentColor = "cyan",
  useHomeSprites = false,
  triggerAnim = null, // e.g. { type: 'INCREMENT' | 'PHASE' | 'FAIL' | 'SHINY', id: timestamp }
  previewMode = false,
  selectedElementId = null,
  onSelectElement = null,
}) {
  const [activeAlert, setActiveAlert] = useState(null);
  const [isAlertExiting, setIsAlertExiting] = useState(false);
  const [counterAnimClass, setCounterAnimClass] = useState("");
  const [now, setNow] = useState(Date.now());
  const prevHuntKeyRef = useRef(null);
  const prevChecksRef = useRef(hunt?.checks ?? 0);
  const isInitialMountRef = useRef(true);
  const lastTriggerAnimIdRef = useRef(null);
  const alertDismissTimerRef = useRef(null);
  const alertExitTimerRef = useRef(null);
  // hasMountedRef: set synchronously before first paint so motion.div
  // sees initial=false on mount and skips the enter animation entirely.
  const hasMountedRef = useRef(false);
  const [hasMounted, setHasMounted] = useState(false);

  // useLayoutEffect runs before the browser paints — this guarantees
  // hasMountedRef is false for the very first render, and only flips
  // to true after that first committed frame, so hunt switches AFTER
  // that point correctly animate, but page load never does.
  useLayoutEffect(() => {
    // One frame after initial paint, enable switch animations.
    const raf = requestAnimationFrame(() => {
      hasMountedRef.current = true;
      setHasMounted(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const dismissAlert = useCallback(() => {
    setIsAlertExiting(true);
    if (alertExitTimerRef.current) clearTimeout(alertExitTimerRef.current);
    alertExitTimerRef.current = setTimeout(() => {
      setActiveAlert(null);
      setIsAlertExiting(false);
    }, 450);
  }, []);

  const layout = overlayConfig.layout || {};
  const pokemonSettings = overlayConfig.pokemonSettings || {};
  const counterSettings = overlayConfig.counterSettings || {};
  const elementStyles = overlayConfig.elementStyles || {};
  const styleSettings = overlayConfig.styleSettings || {};
  const typographySettings = overlayConfig.typographySettings || {};
  const animationSettings = overlayConfig.animationSettings || {};
  const eventSettings = overlayConfig.eventSettings || {};
  const timerSettings = overlayConfig.timerSettings || {};
  const pausedBehavior = overlayConfig.pausedBehavior || "visible-indicator";
  const idleBehavior = overlayConfig.idleBehavior || "hide";

  const accentColorMap = {
    yellow: "#facc15",
    red: "#ef4444",
    orange: "#f97316",
    green: "#22c55e",
    lime: "#84cc16",
    blue: "#3b82f6",
    cyan: "#06b6d4",
    purple: "#a855f7",
    lavender: "#c084fc",
    pink: "#ec4899",
    brown: "#5c3810",
    platinum: "#cbd5e1",
  };

  const themeAccentHex = accentColorMap[accentColor] || accentColor || "var(--accent, #facc15)";

  // Accent color resolution
  const resolvedAccent =
    styleSettings.accentColorMode === "custom" && styleSettings.customAccentColor
      ? styleSettings.customAccentColor
      : styleSettings.accentColor && styleSettings.accentColor !== "default"
      ? (accentColorMap[styleSettings.accentColor] || styleSettings.accentColor)
      : themeAccentHex;

  const applyColorOpacity = (colorStr, opacityPct = 100) => {
    if (!colorStr) return "rgba(255,255,255,1)";
    if (colorStr.startsWith("rgba")) {
      return colorStr.replace(/[\d\.]+\)$/, `${(opacityPct / 100).toFixed(2)})`);
    }
    if (colorStr.startsWith("#")) {
      const hex = colorStr.replace("#", "");
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${(opacityPct / 100).toFixed(2)})`;
      }
    }
    return colorStr;
  };

  const buildElementFilter = (s) => {
    let filterStr = "";
    if (s.dropShadow) {
      const sColor = s.shadowColor || "#000000";
      const sOpacity = s.shadowOpacity ?? 60;
      const sX = s.shadowX ?? 2;
      const sY = s.shadowY ?? 4;
      const sBlur = s.shadowBlur ?? 8;
      const colorWithAlpha = applyColorOpacity(sColor, sOpacity);
      filterStr += ` drop-shadow(${sX}px ${sY}px ${sBlur}px ${colorWithAlpha})`;
    }
    if (s.glow) {
      const gColor = s.glowColor || resolvedAccent;
      const gBlur = s.glowBlur ?? 16;
      const gOpacity = s.glowOpacity ?? 80;
      const colorWithAlpha = applyColorOpacity(gColor, gOpacity);
      filterStr += ` drop-shadow(0 0 ${gBlur}px ${colorWithAlpha})`;
    }
    return filterStr.trim();
  };

  // Safe element style resolver with multi-select inspection support
  const getElemStyle = (elemId) => {
    const s = elementStyles[elemId] || {};
    const st = {};
    if (s.x || s.y) {
      st.transform = `translate(${s.x || 0}px, ${s.y || 0}px)`;
    }
    if (s.opacity !== undefined) {
      st.opacity = s.opacity / 100;
    }
    if (s.color) {
      st.color = s.color;
    }
    if (s.fontSize) {
      st.fontSize = `${s.fontSize}px`;
    }
    if (s.fontFamily) {
      st.fontFamily = FONT_FAMILIES[s.fontFamily] || s.fontFamily;
    }
    if (s.italic !== undefined) {
      st.fontStyle = s.italic ? "italic" : "normal";
    }
    if (s.uppercase !== undefined) {
      st.textTransform = s.uppercase ? "uppercase" : "none";
    }
    if (s.showBackground === false || s.hideBackground) {
      st.background = "transparent";
      st.border = "none";
      st.boxShadow = "none";
      st.padding = "0 4px";
    } else {
      if (s.backgroundColor) {
        st.background = s.backgroundColor;
      }
      if (s.borderColor) {
        st.borderColor = s.borderColor;
      }
      if (s.pillPadding !== undefined || s.padding !== undefined) {
        const p = s.pillPadding ?? s.padding;
        const py = Math.max(0, Math.round(p * 0.35));
        const px = Math.max(0, Math.round(p));
        st.padding = `${py}px ${px}px`;
      }
      if (s.borderRadius !== undefined) {
        st.borderRadius = `${s.borderRadius}px`;
      }
    }
    return st;
  };

  // Dedicated badge style resolver (typography, colors, pill styling only)
  const getBadgeElemStyle = (elemId = "game-tags") => {
    const s = elementStyles[elemId] || {};
    const st = {};
    if (s.color) {
      st.color = s.color;
    } else if (resolvedAccent) {
      st.color = resolvedAccent;
    }
    if (s.fontSize) {
      st.fontSize = `${s.fontSize}px`;
    }
    if (s.fontFamily) {
      st.fontFamily = FONT_FAMILIES[s.fontFamily] || s.fontFamily;
    }
    if (s.italic !== undefined) {
      st.fontStyle = s.italic ? "italic" : "normal";
    }
    if (s.uppercase !== undefined) {
      st.textTransform = s.uppercase ? "uppercase" : "none";
    }
    if (s.showBackground === false || s.hideBackground) {
      st.background = "transparent";
      st.border = "none";
      st.boxShadow = "none";
      st.padding = "0";
    } else {
      if (s.backgroundColor) {
        st.background = s.backgroundColor;
      }
      if (s.borderColor) {
        st.borderColor = s.borderColor;
      }
      if (s.pillPadding !== undefined || s.padding !== undefined) {
        const p = s.pillPadding ?? s.padding;
        const py = Math.max(0, Math.round(p * 0.35));
        const px = Math.max(0, Math.round(p));
        st.padding = `${py}px ${px}px`;
      }
      if (s.borderRadius !== undefined) {
        st.borderRadius = `${s.borderRadius}px`;
      }
    }
    return st;
  };

  const getElemFilter = (elemId) => {
    const s = elementStyles[elemId] || {};
    const filterStr = buildElementFilter(s);
    return filterStr || undefined;
  };
  // Check if hunt is paused
  const huntIsPaused = hunt ? (hunt.status === "paused" || hunt.isPaused || isPaused) : false;

  const phases = hunt?.phases || [];
  const hasPhases = phases.length > 0;
  const lastPhase = hasPhases ? phases[phases.length - 1] : null;
  const isLastFail = lastPhase?.outcome === "failed";
  const nonTargetPhasesCount = phases.filter((p) => !p.isTarget && p.outcome === "caught").length;
  const phaseCount = nonTargetPhasesCount + 1;
  const failCount = phases.filter((p) => p.outcome === "failed" || p.isFail).length || (hunt?.fails?.length || 0);

  let totalOverallChecks = Number(hunt?.checks || 0);
  let currentIntervalChecks = Number(hunt?.checks || 0);

  if (hasPhases && lastPhase) {
    const lastTotal = lastPhase.totalChecks !== undefined && lastPhase.totalChecks !== null
      ? Number(lastPhase.totalChecks)
      : phases.reduce((acc, p) => acc + Number(p.phaseChecks || p.checks || 0), 0);

    if (Number(hunt?.checks || 0) >= lastTotal && lastTotal > 0) {
      totalOverallChecks = Number(hunt?.checks || 0);
      currentIntervalChecks = Number(hunt?.checks || 0) - lastTotal;
    } else {
      totalOverallChecks = lastTotal + Number(hunt?.checks || 0);
      currentIntervalChecks = Number(hunt?.checks || 0);
    }
  } else if (hunt?.totalChecks !== undefined && Number(hunt?.totalChecks) > 0) {
    totalOverallChecks = Number(hunt?.totalChecks);
    if (!hunt?.checks) {
      currentIntervalChecks = totalOverallChecks;
    }
  }

  const isTotalMode = hunt?.metricMode === "total" || !hasPhases;
  const checksCount = isTotalMode ? Math.max(totalOverallChecks, currentIntervalChecks) : currentIntervalChecks;

  // Realtime clock tick for elapsed time
  useEffect(() => {
    if (huntIsPaused || !hunt) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [huntIsPaused, hunt?.id, hunt?.huntId, hunt?.status, hunt?.startedAt]);

  // Unique hunt identifier key
  const huntKey = hunt
    ? (hunt.id || hunt.huntId || `${hunt.pokemon?.name || hunt.pokemonName || "unknown"}-${hunt.game || ""}`)
    : "no-hunt";

  // Calculate slower, more cinematic duration based on speed setting
  const switchDurationSeconds = useMemo(() => {
    const speed = animationSettings.animationSpeed || "normal";
    if (speed === "fast") return 0.45;
    if (speed === "slow") return 1.5;
    return 0.85; // normal (smooth, cinematic pace)
  }, [animationSettings.animationSpeed]);

  // Motion Switch Variants
  const switchVariants = useMemo(() => {
    const type = animationSettings.huntSwitch || "fade";
    if (animationSettings.enableAnimations === false || type === "none") {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      };
    }
    if (type === "slide") {
      return {
        initial: { opacity: 0, x: 26 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -26 },
      };
    }
    if (type === "scale") {
      return {
        initial: { opacity: 0, scale: 0.88 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.88 },
      };
    }
    // "fade"
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }, [animationSettings.enableAnimations, animationSettings.huntSwitch]);

  // Handle Hunt Key synchronization
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevHuntKeyRef.current = huntKey;
      prevChecksRef.current = checksCount;
      return;
    }

    if (huntKey !== prevHuntKeyRef.current) {
      prevHuntKeyRef.current = huntKey;
      prevChecksRef.current = checksCount;
      setCounterAnimClass(""); // Clear any false counter animations on hunt switch
    }
  }, [huntKey, checksCount]);

  // Handle counter increment animations (runs ONLY when checks count changes on the SAME hunt)
  useEffect(() => {
    if (huntKey !== prevHuntKeyRef.current) {
      return;
    }

    if (animationSettings.enableAnimations === false || animationSettings.counterIncrement === "none") {
      prevChecksRef.current = checksCount;
      setCounterAnimClass("");
      return;
    }

    if (hunt && checksCount !== prevChecksRef.current) {
      prevChecksRef.current = checksCount;
      const anim = animationSettings.counterIncrement === "pulse" ? "counter-pulse-anim" : "counter-pop-anim";
      setCounterAnimClass(anim);
      const timer = setTimeout(() => setCounterAnimClass(""), 500);
      return () => clearTimeout(timer);
    }
  }, [huntKey, checksCount, animationSettings.enableAnimations, animationSettings.counterIncrement]);

  // Handle one-shot alert popup triggers (Phase, Fail, Shiny)
  useEffect(() => {
    if (!triggerAnim || !triggerAnim.id || triggerAnim.id === lastTriggerAnimIdRef.current) return;
    lastTriggerAnimIdRef.current = triggerAnim.id;

    if (animationSettings.enableAnimations === false) return;

    if (triggerAnim.type === "INCREMENT") {
      if (animationSettings.counterIncrement !== "none") {
        const anim = animationSettings.counterIncrement === "pulse" ? "counter-pulse-anim" : "counter-pop-anim";
        setCounterAnimClass(anim);
        const timer = setTimeout(() => setCounterAnimClass(""), 350);
        return () => clearTimeout(timer);
      }
    }

    if (triggerAnim.type === "PHASE" && animationSettings.phaseAlert !== false) {
      setActiveAlert({
        id: triggerAnim.id || Date.now(),
        type: "phase",
        title: eventSettings.phaseAlertTitle || "Shiny Phase Found!",
        subtitle: triggerAnim.text || "Phase recorded",
        duration: 10000,
      });
    }

    if (triggerAnim.type === "FAIL" && animationSettings.failAlert !== false) {
      setActiveAlert({
        id: triggerAnim.id || Date.now(),
        type: "fail",
        title: eventSettings.failAlertTitle || "Shiny Failed",
        subtitle: triggerAnim.text || "Encounter missed",
        duration: 10000,
      });
    }

    if (triggerAnim.type === "SHINY" && animationSettings.shinyCelebration !== false) {
      setActiveAlert({
        id: triggerAnim.id || Date.now(),
        type: "celebration",
        title: eventSettings.celebrationTitle || "TARGET SHINY CAUGHT!",
        subtitle: eventSettings.celebrationSubtitle || triggerAnim.text || "Hunt completed!",
        duration: 10000,
      });
    }
  }, [triggerAnim, animationSettings, eventSettings]);

  // Dedicated Auto-Dismiss timer for active alerts (10 seconds total, with 450ms smooth exit animation)
  useEffect(() => {
    if (!activeAlert) {
      setIsAlertExiting(false);
      return;
    }
    setIsAlertExiting(false);
    if (alertDismissTimerRef.current) clearTimeout(alertDismissTimerRef.current);
    if (alertExitTimerRef.current) clearTimeout(alertExitTimerRef.current);

    const duration = activeAlert.duration || 10000;
    const holdTime = Math.max(1000, duration - 450);

    alertDismissTimerRef.current = setTimeout(() => {
      dismissAlert();
    }, holdTime);

    return () => {
      if (alertDismissTimerRef.current) clearTimeout(alertDismissTimerRef.current);
      if (alertExitTimerRef.current) clearTimeout(alertExitTimerRef.current);
    };
  }, [activeAlert?.id, dismissAlert]);

  const elapsedMs = getHuntElapsedTime(hunt, now);
  const formattedTime = formatDigitalTime(elapsedMs);
  const formattedPace = useMemo(() => {
    if (checksCount > 0 && elapsedMs > 0) {
      return `${formatIntervalTime(elapsedMs / 1000 / checksCount)} / check`;
    }
    return "0.0s / check";
  }, [checksCount, elapsedMs]);

  // Paused behavior checks
  if (huntIsPaused && pausedBehavior === "hide") {
    if (previewMode) {
      return (
        <div
          className="hunt-overlay-card style-horizontal"
          style={{
            background: "rgba(18, 18, 24, 0.45)",
            border: "1px dashed rgba(239, 68, 68, 0.45)",
            borderRadius: `${layout.borderRadius || 16}px`,
            padding: "16px 22px",
            color: "#f87171",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "0.82rem",
            fontWeight: 800,
          }}
        >
          <Pause size={15} strokeWidth={2.5} />
          <span>Overlay is Hidden on Stream (Hunt Paused)</span>
        </div>
      );
    }
    return null;
  }

  // When no active hunt is present and idleBehavior is "hide" (and not in editor preview), hide completely
  if (!hunt && idleBehavior === "hide" && !previewMode) {
    return null;
  }

  // Font family mapping
  const fontFamilies = {
    system: "inherit",
    inter: "'Inter', system-ui, -apple-system, sans-serif",
    orbitron: "'Orbitron', sans-serif",
    rubik: "'Rubik', sans-serif",
    poppins: "'Poppins', sans-serif",
    "press-start": "'Press Start 2P', monospace",
    pixelify: "'Pixelify Sans', sans-serif",
    chakra: "'Chakra Petch', sans-serif",
    outfit: "'Outfit', sans-serif",
  };

  const chosenFont = fontFamilies[typographySettings.font] || "inherit";

  // Typography resolutions
  const fontWeightMap = {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  };
  const chosenWeight =
    fontWeightMap[typographySettings.fontWeight] ||
    (typographySettings.fontWeight && !isNaN(Number(typographySettings.fontWeight))
      ? String(typographySettings.fontWeight)
      : "700");

  const fontScaleNum = Number(typographySettings.fontSizeScale ?? typographySettings.fontSize ?? 100);
  const baseScaleFactor = isNaN(fontScaleNum) ? 1 : Math.max(0.5, Math.min(2.5, fontScaleNum / 100));

  const nameScaleNum = Number(typographySettings.nameScale ?? 100);
  const nameScaleFactor = (isNaN(nameScaleNum) ? 1 : Math.max(0.5, Math.min(2.5, nameScaleNum / 100))) * baseScaleFactor;

  const counterScaleNum = Number(typographySettings.counterScale ?? 100);
  const counterScaleFactor = (isNaN(counterScaleNum) ? 1 : Math.max(0.5, Math.min(2.5, counterScaleNum / 100))) * baseScaleFactor;

  const detailsScaleNum = Number(typographySettings.detailsScale ?? 100);
  const detailsScaleFactor = (isNaN(detailsScaleNum) ? 1 : Math.max(0.5, Math.min(2.5, detailsScaleNum / 100))) * baseScaleFactor;

  const letterSpacingMap = {
    tight: "-0.03em",
    normal: "normal",
    wide: "0.06em",
  };
  const chosenLetterSpacing = letterSpacingMap[typographySettings.letterSpacing] || "normal";

  // Shiny sparkle color resolution
  const resolvedSparkleColor =
    pokemonSettings.shinySparkleColorMode === "custom" && pokemonSettings.customShinySparkleColor
      ? pokemonSettings.customShinySparkleColor
      : resolvedAccent;

  // Background styling
  let bgStyle = "transparent";
  if (styleSettings.backgroundMode === "solid" || (styleSettings.backgroundMode !== "transparent" && styleSettings.backgroundColor)) {
    const opacity = (styleSettings.backgroundOpacity ?? 100) / 100;
    const base = styleSettings.backgroundColor || "#181818";
    if (base.startsWith("#") && base.length === 7) {
      const r = parseInt(base.slice(1, 3), 16);
      const g = parseInt(base.slice(3, 5), 16);
      const b = parseInt(base.slice(5, 7), 16);
      bgStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } else {
      bgStyle = base;
    }
  }

  // Border styling
  let borderStyle = "none";
  if (styleSettings.border !== false && styleSettings.borderStyle !== "none") {
    const width = styleSettings.borderWidth || 1;
    if (styleSettings.borderUseAccent || styleSettings.borderStyle === "accent") {
      borderStyle = `${width}px solid ${resolvedAccent}`;
    } else if (styleSettings.borderColor) {
      borderStyle = `${width}px solid ${styleSettings.borderColor}`;
    } else {
      borderStyle = `${width}px solid rgba(255, 255, 255, 0.15)`;
    }
  }

  // Shadow and Glow resolution
  const shadows = [];
  if (styleSettings.shadow !== false) {
    const sColor = styleSettings.shadowColor || "#000000";
    const sBlur = styleSettings.shadowBlur ?? 25;
    const sDist = styleSettings.shadowDistance ?? 10;
    const sOpacity = (styleSettings.shadowOpacity ?? 60) / 100;
    if (sColor.startsWith("#") && sColor.length === 7) {
      const r = parseInt(sColor.slice(1, 3), 16);
      const g = parseInt(sColor.slice(3, 5), 16);
      const b = parseInt(sColor.slice(5, 7), 16);
      shadows.push(`0 ${sDist}px ${sBlur}px rgba(${r}, ${g}, ${b}, ${sOpacity})`);
    } else {
      shadows.push(`0 ${sDist}px ${sBlur}px ${sColor}`);
    }
  }
  if (styleSettings.glow) {
    const gColor =
      styleSettings.glowColorMode === "custom" && styleSettings.glowColor
        ? styleSettings.glowColor
        : resolvedAccent;
    const gRadius = styleSettings.glowRadius ?? 14;
    const gSpread = styleSettings.glowSpread ?? 2;
    const gOpacity = (styleSettings.glowOpacity ?? 50) / 100;
    if (gColor && gColor.startsWith("#") && gColor.length === 7) {
      const r = parseInt(gColor.slice(1, 3), 16);
      const g = parseInt(gColor.slice(3, 5), 16);
      const b = parseInt(gColor.slice(5, 7), 16);
      shadows.push(`0 0 ${gRadius}px ${gSpread}px rgba(${r}, ${g}, ${b}, ${gOpacity})`);
    } else {
      shadows.push(`0 0 ${gRadius}px ${gSpread}px ${gColor || "rgba(250, 204, 21, 0.4)"}`);
    }
  }
  const computedBoxShadow = shadows.length > 0 ? shadows.join(", ") : undefined;

  const spriteUrl = hunt?.pokemon ? getSpriteUrl(hunt.pokemon, true, useHomeSprites) : "";
  const rawPokemonName = formatPokemonName(hunt?.pokemon?.name || hunt?.pokemonName || "Unknown");
  const pokemonDisplayName =
    typographySettings.textTransform === "uppercase" ? rawPokemonName.toUpperCase() : rawPokemonName;
  const formDisplayName = hunt?.pokemon ? getFormDisplayName(hunt.pokemon) : "";
  const activeModifierIcons = hunt?.modifiers ? getActiveModifierIcons(hunt.modifiers) : [];
  const cardPadding = Number(layout.padding ?? 16);
  // Counter labels (allow empty string if user clears it)
  const defaultLabel = isTotalMode
    ? "Total Checks"
    : (isLastFail ? "Checks Since Fail" : (nonTargetPhasesCount > 0 ? `Phase ${phaseCount} Checks` : "Encounters"));

  const counterLabel =
    typeof counterSettings.customLabel === "string"
      ? counterSettings.customLabel
      : (counterSettings.customLabel ?? defaultLabel);

  // Odds calculation
  const oddsRatio = hunt?.odds ? `1/${hunt.odds.toLocaleString()}` : null;

  const hasSprite = pokemonSettings.showSprite !== false;
  const hasEncounters = counterSettings.showEncounters !== false;
  const hasPhase = counterSettings.showPhase !== false;
  const hasTimer = timerSettings.showTimer !== false;
  const hasAvgTime = counterSettings.showAverageTime !== false;
  const activeCapsuleCount = [hasPhase, hasTimer, hasAvgTime].filter(Boolean).length;
  const hasRightCol = hasEncounters || activeCapsuleCount > 0;

  let computedMinHeight = 110;
  let computedMinWidth = 360;

  const spriteBoxHeight = hasSprite ? Number(pokemonSettings.spriteSize || 90) : 0;
  const infoBoxHeight = 80;
  const metricsCount = [hasEncounters, hasPhase, hasTimer, hasAvgTime].filter(Boolean).length;
  const rightColumnHeight = metricsCount > 0 ? metricsCount * 36 : 0;

  if (layout.style === "vertical") {
    computedMinHeight = (hasSprite ? spriteBoxHeight + 10 : 0) + infoBoxHeight + (hasRightCol ? rightColumnHeight + 12 : 0) + cardPadding * 2;
    computedMinWidth = Math.max(260, hasSprite ? spriteBoxHeight + 40 : 260);
  } else if (layout.style === "compact") {
    computedMinHeight = Math.max(spriteBoxHeight, 72) + cardPadding * 2;
    computedMinWidth = 320;
  } else if (layout.style === "minimal") {
    computedMinHeight = 56 + cardPadding * 2;
    computedMinWidth = Math.max(
      220,
      (hasSprite ? 44 : 0) + (pokemonSettings.showName !== false ? 90 : 0) + (hasEncounters ? 90 : 0) + cardPadding * 2
    );
  } else {
    const leftColumnHeight = Math.max(spriteBoxHeight, infoBoxHeight);
    computedMinHeight = Math.max(leftColumnHeight, rightColumnHeight) + cardPadding * 2;
    const rightColWidth = hasRightCol ? 190 : 0;
    const spriteWidth = hasSprite ? Number(pokemonSettings.spriteSize || 90) : 0;
    const leftColWidth = (hasSprite ? spriteWidth + 16 : 0) + 180;
    computedMinWidth = leftColWidth + rightColWidth + cardPadding * 2 + Number(layout.gap ?? 12);
  }

  const resolvedMinHeight = layout.height && Number(layout.height) > 0
    ? Math.max(Number(layout.height), computedMinHeight)
    : computedMinHeight;

  const resolvedMinWidth = layout.width && Number(layout.width) > 0
    ? Math.max(Number(layout.width), computedMinWidth)
    : computedMinWidth;

  const scaleRatio = previewMode ? 1 : (layout.scale || 100) / 100;

  // Dynamic Watermark Theme & Contrast Adaptation (automatically contrasts with light, dark & vibrant backgrounds)
  const getWatermarkVars = () => {
    if (styleSettings.backgroundMode === "transparent") {
      return {
        "--watermark-color": "#ffffff",
        "--watermark-opacity": "0.08",
        "--watermark-blend": "normal",
        "--watermark-shadow": "0 1px 2px rgba(0, 0, 0, 0.4)",
      };
    }
    const hex = (styleSettings.backgroundColor || "#181818").replace("#", "");
    let r = 24, g = 24, b = 24;
    if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16) || 24;
      g = parseInt(hex.slice(2, 4), 16) || 24;
      b = parseInt(hex.slice(4, 6), 16) || 24;
    } else if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16) || 24;
      g = parseInt(hex[1] + hex[1], 16) || 24;
      b = parseInt(hex[2] + hex[2], 16) || 24;
    }
    // Perceived brightness (HSP formula)
    const brightness = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

    // For bright/vibrant solid backgrounds (e.g. red, yellow, lime, white, cyan, pink)
    if (brightness > 115) {
      return {
        "--watermark-color": "#000000",
        "--watermark-opacity": "0.14",
        "--watermark-blend": "multiply",
        "--watermark-shadow": "none",
      };
    }
    // For dark solid backgrounds (e.g. dark gray, black, dark navy)
    return {
      "--watermark-color": "#ffffff",
      "--watermark-opacity": "0.075",
      "--watermark-blend": "screen",
      "--watermark-shadow": "none",
    };
  };

  const watermarkVars = getWatermarkVars();

  return (
    <div
      className={`hunt-overlay-card style-${layout.style || "horizontal"} font-${
        typographySettings.font || "system"
      } ${typographySettings.italic ? "is-italic" : ""} ${
        typographySettings.textTransform === "uppercase" ? "is-uppercase" : ""
      } ${animationSettings.enableAnimations === false ? "animations-disabled" : ""}`}
      style={{
        background: bgStyle,
        border: borderStyle,
        borderRadius: `${layout.borderRadius ?? 16}px`,
        padding: `${layout.padding ?? 16}px`,
        gap: `${layout.gap ?? 12}px`,
        color: styleSettings.textColor || "#fff",
        width: `${resolvedMinWidth}px`,
        minWidth: `${resolvedMinWidth}px`,
        minHeight: `${resolvedMinHeight}px`,
        height: layout.height ? `${resolvedMinHeight}px` : "auto",
        opacity: styleSettings.opacity != null ? Number(styleSettings.opacity) / 100 : 1,
        boxShadow: computedBoxShadow,
        fontFamily: chosenFont,
        fontWeight: chosenWeight,
        fontStyle: typographySettings.italic ? "italic" : "normal",
        "--accent": resolvedAccent,
        "--site-accent": themeAccentHex,
        "--card-font-weight": chosenWeight,
        "--card-font-scale": baseScaleFactor,
        "--name-font-scale": nameScaleFactor,
        "--counter-font-scale": counterScaleFactor,
        "--details-font-scale": detailsScaleFactor,
        "--card-padding": `${layout.padding ?? 16}px`,
        "--card-border-radius": `${layout.borderRadius ?? 16}px`,
        "--card-border-width": `${styleSettings.border ? (styleSettings.borderWidth || 2) : 0}px`,
        transform: scaleRatio !== 1 ? `scale(${scaleRatio})` : undefined,
        transformOrigin: "top left",
      }}
    >
      {/* Background Watermark Layer (Optional for Pro/Member overlays) */}
      {styleSettings.showWatermark !== false && (
        <div className="hunt-overlay-watermark-container" aria-hidden="true">
          <div className="hunt-overlay-watermark-rotator" style={watermarkVars}>
            {[...Array(28)].map((_, i) => (
              <div key={i} className="hunt-overlay-watermark-line">
                ULTIMATEDEXTRACKER.COM &nbsp;&bull;&nbsp; ULTIMATEDEXTRACKER.COM &nbsp;&bull;&nbsp; ULTIMATEDEXTRACKER.COM &nbsp;&bull;&nbsp; ULTIMATEDEXTRACKER.COM &nbsp;&bull;&nbsp; ULTIMATEDEXTRACKER.COM &nbsp;&bull;&nbsp; ULTIMATEDEXTRACKER.COM
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert Banner Notification Overlay with Enter & Exit Animations */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            key={`alert-${activeAlert.id}`}
            initial={{ opacity: 0, y: -20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={`hunt-overlay-alert-banner ${activeAlert.type} ${isAlertExiting ? "is-exiting" : ""}`}
            onClick={dismissAlert}
            title="Click to dismiss"
            style={{ cursor: "pointer" }}
          >
            <svg
              viewBox="0 0 512 512"
              className="hunt-overlay-shiny-sparkle-svg"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M247.355,106.9C222.705,82.241,205.833,39.18,197.46,0c-8.386,39.188-25.24,82.258-49.899,106.917 c-24.65,24.642-67.724,41.514-106.896,49.904c39.188,8.373,82.254,25.235,106.904,49.895c24.65,24.65,41.522,67.72,49.908,106.9 c8.373-39.188,25.24-82.258,49.886-106.917c24.65-24.65,67.724-41.514,106.896-49.904 C315.08,148.422,272.014,131.551,247.355,106.9z" />
              <path d="M407.471,304.339c-14.714-14.721-24.81-40.46-29.812-63.864c-5.011,23.404-15.073,49.142-29.803,63.872 c-14.73,14.714-40.464,24.801-63.864,29.812c23.408,5.01,49.134,15.081,63.864,29.811c14.73,14.722,24.81,40.46,29.82,63.864 c5.001-23.413,15.081-49.142,29.802-63.872c14.722-14.722,40.46-24.802,63.856-29.82 C447.939,329.14,422.201,319.061,407.471,304.339z" />
              <path d="M146.352,354.702c-4.207,19.648-12.655,41.263-25.019,53.626c-12.362,12.354-33.968,20.82-53.613,25.027 c19.645,4.216,41.251,12.656,53.613,25.027c12.364,12.362,20.829,33.96,25.036,53.618c4.203-19.658,12.655-41.255,25.023-53.626 c12.354-12.362,33.964-20.82,53.605-25.035c-19.64-4.2-41.251-12.656-53.613-25.019 C159.024,395.966,150.555,374.351,146.352,354.702z" />
            </svg>
            <div className="flex flex-col text-center">
              <span className="font-extrabold text-sm uppercase tracking-wider">{activeAlert.title}</span>
              <span className="text-xs font-semibold opacity-90">{activeAlert.subtitle}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Card Paused Overlay with Blurred Background & Centered Big Pause */}
      <AnimatePresence>
        {huntIsPaused && (pausedBehavior === "visible-indicator" || !pausedBehavior) && (
          <motion.div
            key="paused-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="hunt-overlay-paused-backdrop"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="hunt-overlay-paused-center-content"
            >
              <div className="hunt-overlay-paused-icon-wrap" style={{ color: resolvedAccent }}>
                <Pause size={24} strokeWidth={3} />
              </div>
              <span className="hunt-overlay-paused-text" style={{ color: resolvedAccent }}>
                {eventSettings.pauseText || "PAUSED"}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Standby / Idle State Content vs Active Hunt ── */}
      <AnimatePresence mode="wait" initial={false}>
        {!hunt ? (
          <motion.div
            key="idle-state"
            variants={switchVariants}
            initial={hasMounted ? "initial" : false}
            animate="animate"
            exit="exit"
            transition={{ duration: switchDurationSeconds, ease: [0.16, 1, 0.3, 1] }}
            className="hunt-overlay-idle-container"
          >
            <div className="hunt-overlay-idle-logo-wrap">
              {/* Layer 1: Base Logo Image */}
              <img
                src="/Logo_Layer1.png"
                alt="Ultimate Dex Tracker"
                className="hunt-overlay-idle-logo-layer1"
                draggable={false}
              />
              {/* Layer 2: Secondary Accents */}
              <img
                src="/Logo_Layer2.png"
                alt=""
                className="hunt-overlay-idle-logo-layer2"
                draggable={false}
              />
              {/* Layer 3: Dynamic Accent Color Overlay */}
              <div
                className="hunt-overlay-idle-logo-layer3"
                style={{ backgroundColor: resolvedAccent }}
              />
            </div>
            <div className="hunt-overlay-idle-text">
              {idleBehavior === "hide" && previewMode
                ? "Hidden on Stream (No Active Hunt)"
                : "No hunt selected"}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={huntKey}
            variants={switchVariants}
            initial={hasMounted ? "initial" : false}
            animate="animate"
            exit="exit"
            transition={{ duration: switchDurationSeconds, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: "flex",
              flexDirection: layout.style === "vertical" ? "column" : "row",
              width: "100%",
              height: "100%",
              alignItems: "stretch",
              justifyContent: "space-between",
              gap: `${layout.gap ?? 12}px`,
            }}
          >
            {/* ── Left Pokemon Section: Sprite Column (with bottom-left odds) + Info Box ── */}
            <div className="hunt-overlay-pokemon-section">
            <div className="hunt-overlay-sprite-col">
              {pokemonSettings.showSprite !== false && (
            <div
              data-element-id="pokemon-sprite"
              className={`hunt-overlay-sprite-box ${selectedElementId === "pokemon-sprite" ? "is-element-selected" : ""}`}
              onClick={(e) => {
                if (onSelectElement) {
                  e.stopPropagation();
                  onSelectElement("pokemon-sprite");
                }
              }}
              style={{
                width: `${pokemonSettings.spriteSize || 90}px`,
                height: `${pokemonSettings.spriteSize || 90}px`,
                ...getElemStyle("pokemon-sprite", false),
              }}
            >
              <img
                src={spriteUrl}
                alt=""
                className={`hunt-overlay-sprite ${!useHomeSprites ? "pixelated" : ""}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  imageRendering: !useHomeSprites ? "pixelated" : "auto",
                  filter: getElemFilter("pokemon-sprite"),
                }}
                onError={(e) => {
                  e.currentTarget.src = "/fallback.png";
                }}
              />
              {pokemonSettings.showShinyIndicator !== false && (
                <span
                  className="hunt-overlay-shiny-sparkle-badge"
                  title="Shiny Pokemon Target"
                  style={{
                    width: `${pokemonSettings.sparkleSize ?? 22}px`,
                    height: `${pokemonSettings.sparkleSize ?? 22}px`,
                    color: resolvedSparkleColor,
                    filter: `drop-shadow(0 0 5px ${resolvedSparkleColor}) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))`,
                  }}
                >
                  <svg
                    viewBox="0 0 512 512"
                    className="hunt-overlay-shiny-sparkle-svg"
                    fill={resolvedSparkleColor}
                    style={{ fill: resolvedSparkleColor }}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path fill={resolvedSparkleColor} d="M247.355,106.9C222.705,82.241,205.833,39.18,197.46,0c-8.386,39.188-25.24,82.258-49.899,106.917 c-24.65,24.642-67.724,41.514-106.896,49.904c39.188,8.373,82.254,25.235,106.904,49.895c24.65,24.65,41.522,67.72,49.908,106.9 c8.373-39.188,25.24-82.258,49.886-106.917c24.65-24.65,67.724-41.514,106.896-49.904 C315.08,148.422,272.014,131.551,247.355,106.9z" />
                    <path fill={resolvedSparkleColor} d="M407.471,304.339c-14.714-14.721-24.81-40.46-29.812-63.864c-5.011,23.404-15.073,49.142-29.803,63.872 c-14.73,14.714-40.464,24.801-63.864,29.812c23.408,5.01,49.134,15.081,63.864,29.811c14.73,14.722,24.81,40.46,29.82,63.864 c5.001-23.413,15.081-49.142,29.802-63.872c14.722-14.722,40.46-24.802,63.856-29.82 C447.939,329.14,422.201,319.061,407.471,304.339z" />
                    <path fill={resolvedSparkleColor} d="M146.352,354.702c-4.207,19.648-12.655,41.263-25.019,53.626c-12.362,12.354-33.968,20.82-53.613,25.027 c19.645,4.216,41.251,12.656,53.613,25.027c12.364,12.362,20.829,33.96,25.036,53.618c4.203-19.658,12.655-41.255,25.023-53.626 c12.354-12.362,33.964-20.82,53.605-25.035c-19.64-4.2-41.251-12.656-53.613-25.019 C159.024,395.966,150.555,374.351,146.352,354.702z" />
                  </svg>
                </span>
              )}
            </div>
          )}

          {/* Dynamic Odds Badge (Bottom-Left underneath Sprite) */}
          {counterSettings.showOdds !== false && oddsRatio && (
            <div
              data-element-id="odds"
              className={`hunt-overlay-odds-pill ${selectedElementId === "odds" ? "is-element-selected" : ""}`}
              onClick={(e) => {
                if (onSelectElement) {
                  e.stopPropagation();
                  onSelectElement("odds");
                }
              }}
              style={getElemStyle("odds")}
            >
              <span className="hunt-overlay-odds-text">{oddsRatio}</span>
            </div>
          )}
        </div>

        {/* Center / Pokemon Info Column */}
        <div className="hunt-overlay-info-box">
          {pokemonSettings.showName !== false && (
            <div
              data-element-id="pokemon-name"
              className={`hunt-overlay-pokemon-name ${selectedElementId === "pokemon-name" ? "is-element-selected" : ""}`}
              onClick={(e) => {
                if (onSelectElement) {
                  e.stopPropagation();
                  onSelectElement("pokemon-name");
                }
              }}
              style={{
                display: "block",
                width: "100%",
                textTransform: typographySettings.textTransform === "uppercase" ? "uppercase" : "none",
                fontStyle: typographySettings.italic ? "italic" : "normal",
                ...getElemStyle("pokemon-name"),
              }}
            >
              {pokemonDisplayName}
            </div>
          )}

          {/* Badges Row (Game, Method, Form) */}
          {(() => {
            const badges = [];
            if (pokemonSettings.showGame !== false && hunt.game) {
              badges.push({ key: "game", label: hunt.game, className: "game-badge" });
            }
            if (pokemonSettings.showMethod !== false && hunt.method) {
              badges.push({ key: "method", label: hunt.method, className: "method-badge" });
            }
            if (pokemonSettings.showForm !== false && formDisplayName) {
              badges.push({ key: "form", label: formDisplayName, className: "form-badge" });
            }

            if (badges.length === 0) return null;

            const isNoBackground = elementStyles["game-tags"]?.showBackground === false;

            return (
              <div
                data-element-id="game-tags"
                className={`hunt-overlay-meta-badges ${isNoBackground ? "no-background" : ""} ${selectedElementId === "game-tags" ? "is-element-selected" : ""}`}
                onClick={(e) => {
                  if (onSelectElement) {
                    e.stopPropagation();
                    onSelectElement("game-tags");
                  }
                }}
                style={{
                  width: "100%",
                  ...getElemStyle("game-tags")
                }}
              >
                {badges.map((b, idx) => (
                  <React.Fragment key={b.key}>
                    {idx > 0 && isNoBackground && (
                      <span className="hunt-overlay-badge-divider" aria-hidden="true">
                        •
                      </span>
                    )}
                    <span
                      className={`hunt-overlay-meta-badge ${b.className}`}
                      style={getBadgeElemStyle("game-tags")}
                    >
                      {b.label}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            );
          })()}

          {/* Dedicated Modifier Icons Row (Under Game & Method) */}
          {pokemonSettings.showModifiers !== false && activeModifierIcons.length > 0 && (() => {
            const modProps = elementStyles["held-items"] || {};
            return (
              <div
                data-element-id="held-items"
                className={`hunt-overlay-modifier-icons-row ${selectedElementId === "held-items" ? "is-element-selected" : ""}`}
                onClick={(e) => {
                  if (onSelectElement) {
                    e.stopPropagation();
                    onSelectElement("held-items");
                  }
                }}
                style={{
                  width: "100%",
                  ...getElemStyle("held-items")
                }}
              >
                {activeModifierIcons.map((mod) => (
                  <div key={mod.key} className="hunt-overlay-mod-icon-item" title={mod.label} data-mod-key={mod.key}>
                    <img
                      src={mod.src}
                      alt={mod.label}
                      className={`hunt-overlay-mod-img ${mod.key === "lure" ? "is-pixelated" : ""}`}
                      style={{
                        ...(mod.key === "lure" ? { imageRendering: "pixelated" } : {}),
                        ...(modProps.iconSize ? { width: `${modProps.iconSize}px`, height: `${modProps.iconSize}px` } : {})
                      }}
                    />
                    {mod.badge && (
                      <span
                        className="hunt-overlay-mod-lvl"
                        style={{
                          ...(modProps.badgeColor ? { color: modProps.badgeColor } : {}),
                          ...(modProps.badgeSize ? { fontSize: `${modProps.badgeSize}px` } : {})
                        }}
                      >
                        {mod.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Right Section: Vertical Divider + Counter + Stats ── */}
      {hasRightCol && (
        <div className="hunt-overlay-counter-section">
          {hasEncounters && (() => {
            const counterProps = elementStyles["counter"] || {};
            const labelPos = counterProps.labelPosition || "below"; // "below" | "right" | "above"
            const flexDirection = labelPos === "right" ? "row" : labelPos === "above" ? "column-reverse" : "column";
            const alignItems = labelPos === "right" ? "baseline" : "center";

            return (
              <div
                data-element-id="counter"
                className={`hunt-overlay-count-wrap label-pos-${labelPos} ${selectedElementId === "counter" ? "is-element-selected" : ""}`}
                onClick={(e) => {
                  if (onSelectElement) {
                    e.stopPropagation();
                    onSelectElement("counter");
                  }
                }}
                style={{
                  display: "flex",
                  flexDirection,
                  alignItems,
                  justifyContent: "center",
                  gap: labelPos === "right" ? "8px" : "2px",
                  ...getElemStyle("counter")
                }}
              >
                <motion.span
                  key={checksCount}
                  initial={false}
                  animate={
                    counterAnimClass === "counter-pop-anim"
                      ? { scale: [1, 1.28, 1], transition: { duration: 0.45, ease: "easeOut" } }
                      : counterAnimClass === "counter-pulse-anim"
                      ? { scale: [1, 1.15, 1], filter: ["drop-shadow(0 0 0px transparent)", `drop-shadow(0 0 14px ${resolvedAccent})`, "drop-shadow(0 0 0px transparent)"], transition: { duration: 0.55 } }
                      : {}
                  }
                  className="hunt-overlay-counter-number"
                  style={{
                    display: "inline-block",
                    color: counterProps.color || resolvedAccent,
                    fontSize: counterProps.fontSize ? `${counterProps.fontSize}px` : undefined,
                    fontFamily: counterProps.fontFamily ? (FONT_FAMILIES[counterProps.fontFamily] || counterProps.fontFamily) : undefined,
                    fontStyle: counterProps.italic ? "italic" : undefined,
                  }}
                >
                  {checksCount.toLocaleString()}
                </motion.span>
                {counterProps.showLabel !== false && Boolean(counterProps.customLabel || counterLabel) && (
                  <span
                    className="hunt-overlay-counter-label"
                    style={{
                      color: counterProps.labelColor || undefined,
                      fontSize: counterProps.labelFontSize ? `${counterProps.labelFontSize}px` : undefined,
                      textTransform: counterProps.labelUppercase === false ? "none" : "uppercase",
                    }}
                  >
                    {counterProps.customLabel || counterLabel}
                  </span>
                )}
              </div>
            );
          })()}

          {/* Decorative Sparkle Divider */}
          {counterSettings.showDivider !== false && (() => {
            const divProps = elementStyles["divider"] || {};
            const isLineOnly = divProps.symbol === "none";
            const lineStyle = {
              background: divProps.lineColor
                ? `linear-gradient(90deg, transparent, ${divProps.lineColor}, transparent)`
                : undefined,
              height: divProps.lineThickness ? `${divProps.lineThickness}px` : undefined,
            };

            return (
              <div
                data-element-id="divider"
                className={`hunt-overlay-sparkle-divider ${selectedElementId === "divider" ? "is-element-selected" : ""}`}
                onClick={(e) => {
                  if (onSelectElement) {
                    e.stopPropagation();
                    onSelectElement("divider");
                  }
                }}
                style={{
                  width: "100%",
                  ...getElemStyle("divider")
                }}
              >
                {isLineOnly ? (
                  <div
                    className="hunt-overlay-divider-line"
                    style={{
                      width: "100%",
                      ...lineStyle
                    }}
                  />
                ) : (
                  <>
                    <div className="hunt-overlay-divider-line" style={lineStyle} />
                    <div
                      className="hunt-overlay-divider-diamond"
                      style={{
                        color: divProps.color || resolvedAccent,
                        fontSize: divProps.symbolSize ? `${divProps.symbolSize}px` : undefined,
                        filter: `drop-shadow(0 0 5px ${divProps.color || resolvedAccent})`,
                      }}
                    >
                      {divProps.symbol === "star"
                        ? "★"
                        : divProps.symbol === "dot"
                        ? "•"
                        : divProps.symbol === "dash"
                        ? "—"
                        : "✦"}
                    </div>
                    <div className="hunt-overlay-divider-line" style={lineStyle} />
                  </>
                )}
              </div>
            );
          })()}

          {/* Stacked Info Capsules */}
          {activeCapsuleCount > 0 && (
            <div className="hunt-overlay-capsules-stack">
              {counterSettings.showPhase !== false && (
                <div
                  data-element-id="phase"
                  className={`hunt-overlay-info-capsule ${selectedElementId === "phase" ? "is-element-selected" : ""}`}
                  onClick={(e) => {
                    if (onSelectElement) {
                      e.stopPropagation();
                      onSelectElement("phase");
                    }
                  }}
                  style={getElemStyle("phase")}
                >
                  <Flag size={13} className="text-[var(--accent)] shrink-0" />
                  <span>
                    Phase {phaseCount}
                    {counterSettings.showPhaseCount !== false && failCount > 0 ? ` (${failCount} fail)` : ""}
                  </span>
                </div>
              )}

              {timerSettings.showTimer !== false && (
                <div
                  data-element-id="timer"
                  className={`hunt-overlay-info-capsule ${selectedElementId === "timer" ? "is-element-selected" : ""}`}
                  onClick={(e) => {
                    if (onSelectElement) {
                      e.stopPropagation();
                      onSelectElement("timer");
                    }
                  }}
                  style={getElemStyle("timer")}
                >
                  <Clock size={13} className="text-[var(--accent)] shrink-0" />
                  <span className="font-mono">{formattedTime}</span>
                </div>
              )}

              {counterSettings.showAverageTime !== false && formattedPace && (
                <div
                  data-element-id="pace"
                  className={`hunt-overlay-info-capsule ${selectedElementId === "pace" ? "is-element-selected" : ""}`}
                  onClick={(e) => {
                    if (onSelectElement) {
                      e.stopPropagation();
                      onSelectElement("pace");
                    }
                  }}
                  style={getElemStyle("pace")}
                  title="Time per check"
                >
                  <Activity size={13} className="text-[var(--accent)] shrink-0" />
                  <span className="font-mono">{formattedPace}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
