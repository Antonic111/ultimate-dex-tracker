import { useState, useEffect, useContext, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Plus,
  Minus,
  Check,
  Trash2,
  Settings,
  Info,
  RotateCcw,
  Pause,
  Play,
  CheckCircle,
  Edit,
  Maximize2,
  Sparkles,
  Flag,
  AlertCircle,
  History,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Sliders,
  Award,
  BarChart3,
  HelpCircle,
  BadgeCheck,
  HeartCrack,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Trophy,
  XCircle,
  Tv
} from "lucide-react";
import { BALL_OPTIONS, MARK_OPTIONS, GAME_OPTIONS } from "../Constants";
import {
  getMethodsForGame,
  calculateOdds,
  getModifiersForGame,
  getCurrentHuntOdds,
  calculateMassOutbreakOdds,
  calculateCatchComboOdds,
  calculateSOSOdds,
  calculateKOOdds,
  calculatePokeRadarOdds,
  calculatePokeRadarBDSPOdds,
  calculatePokeRadarXYOdds,
  calculateDexNavOdds,
  calculateChainFishingXYOdds
} from "../utils/huntSystem";
import { formatPokemonName, getFormDisplayName, findPokemon } from "../utils";
import {
  DetailedHuntCard,
  OddsBreakdownModal,
  AdjustHuntModal,
  ShinyEncounterModal,
  HuntIdentityOddsCard,
  HuntHistoryModal
} from "../components/Counters";
import { getCaughtKey } from "../caughtStorage";
import { SearchbarIconDropdown } from "../components/Shared/SearchBar";
import ContentFilterInput from "../components/Shared/ContentFilterInput";
import { validateContent } from "../../shared/contentFilter";
import { useTheme } from "../components/Shared/ThemeContext";
import { getSpriteUrl, resolvePokemon, cleanPokemonNameOrKey } from "../utils/spriteUtils";
import { UserContext } from "../components/Shared/UserContext";
import { useMessage } from "../components/Shared/MessageContext";
import { huntAPI, profileAPI } from "../utils/api";
import pokemonData from "../data/pokemon.json";
import formsData from "../utils/loadFormsData";
import { getValidBallNamesForGame } from "../data/gameBalls";
import gamePokemonData from "../data/gamePokemon.json";
import { getAvailableGamesForPokemon } from "../utils/gameMapping";
import { getFilteredFormsData, getDexPreferences } from "../utils/dexPreferences";
import { getAvailableGamesForPokemonSidebar, normalizeGameName, isNonPartnerCapPikachu } from "../utils/pokemonAvailability";
import { Modal, ConfirmModal } from "../components/Shared/Modal";
import { Button } from "../components/Shared/Button";
import { TextField, SelectField, NumberField, TextArea, SearchField } from "../components/Shared/FormField";
import {
  formatDigitalTime,
  formatIntervalTime,
  getHuntElapsedTime,
  normalizeHunt,
  updateHuntWithAction,
  applyHuntActionToState,
  createHuntChannel,
  getCachedHuntsData,
  setCachedHuntsData
} from "../utils/huntSync";
import "../css/Counters.css";
import "../css/Onboarding.css";

const getGamesForPokemon = (pokemon) => {
  if (!pokemon || !pokemon.id) return ["Scarlet", "Violet"];
  try {
    const games = getAvailableGamesForPokemon(pokemon.id, gamePokemonData);
    return games && games.length > 0 ? games : ["Scarlet", "Violet"];
  } catch {
    return ["Scarlet", "Violet"];
  }
};

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
    const targetFailCount = preceding.filter(p => p.isTarget && p.outcome === "failed").length || 1;
    const countLabel = targetFailCount > 1 ? `Target Failed ${targetFailCount}:` : "Target Failed:";
    const countTitle = targetFailCount > 1 ? `Target Failed ${targetFailCount}` : "Target Failed";
    return {
      type: "target_failed",
      label: countLabel,
      title: `${countTitle}: ${formatPokemonName(phase.pokemon?.name)}`,
      badgeText: targetFailCount > 1 ? `Target Failed ${targetFailCount}` : "Target Failed",
      isFail: true,
      isTarget: true,
      count: targetFailCount
    };
  }

  // Non-target count across all non-targets (both caught and failed)
  const nonTargetCount = preceding.filter(p => !p.isTarget).length || phase.phaseNumber || (phaseIdx + 1);

  if (isFailed) {
    return {
      type: "phase_failed",
      label: `Phase ${nonTargetCount} Failed:`,
      title: `Phase ${nonTargetCount} Failed: ${formatPokemonName(phase.pokemon?.name)}`,
      badgeText: "Phase Failed",
      isFail: true,
      isTarget: false,
      count: nonTargetCount
    };
  }

  if (!isTarget) {
    return {
      type: "phase_caught",
      label: `Phase ${nonTargetCount}:`,
      title: `Phase ${nonTargetCount}: ${formatPokemonName(phase.pokemon?.name)}`,
      badgeText: "✓ Caught",
      isFail: false,
      isTarget: false,
      count: nonTargetCount
    };
  }

  return {
    type: "target_caught",
    label: "Target Caught:",
    title: `Target Caught: ${formatPokemonName(phase.pokemon?.name)}`,
    badgeText: "✓ Caught",
    isFail: false,
    isTarget: true,
    count: 1
  };
};

export const getPhaseDisplayChecks = (phase, allPhases = []) => {
  if (!phase) return { intervalChecks: 0, totalChecks: 0 };
  const idx = allPhases.indexOf(phase);
  const total = phase.totalChecks !== undefined
    ? phase.totalChecks
    : (phase.phaseChecks || phase.checks || 0);

  let interval = phase.phaseChecks !== undefined ? phase.phaseChecks : (phase.checks || 0);

  if (idx > 0) {
    const prev = allPhases[idx - 1];
    const prevTotal = prev.totalChecks !== undefined
      ? prev.totalChecks
      : (prev.phaseChecks || prev.checks || 0);

    if (total >= prevTotal && total > 0) {
      interval = total - prevTotal;
    }
  } else if (phase.phaseChecks !== undefined) {
    interval = phase.phaseChecks;
  } else {
    interval = total;
  }

  return {
    intervalChecks: Math.max(0, interval),
    totalChecks: total
  };
};

// Check if a pokemon or form is obtainable/huntable in targetGame
const isPokemonAvailableInGame = (pokemon, targetGame) => {
  if (!pokemon || !targetGame) return true;
  const games = getAvailableGamesForPokemonSidebar(pokemon);
  const targetKey = normalizeGameName(targetGame);
  return games.some(g => normalizeGameName(g) === targetKey);
};

// Best possible odds summary
function getBestPossibleOdds(game, method) {
  if (!game) return "1 / 4,096";

  if (game === "Red" || game === "Blue" || game === "Green" || game === "Yellow") {
    return "1 / 8,192 (Base Rate)";
  }
  if (game === "Gold" || game === "Silver" || game === "Crystal") {
    if (method === "Breeding") return "1 / 64 (Shiny Parent)";
    if (method === "Odd Egg") return "1 / 10 (Odd Egg)";
    return "1 / 8,192 (Base Rate)";
  }
  if (game === "Ruby" || game === "Sapphire" || game === "Emerald" || game === "Fire Red" || game === "Leaf Green") {
    return "1 / 8,192 (Base Rate)";
  }
  if (game === "Diamond" || game === "Pearl") {
    if (method === "Poke Radar") return "1 / 200 (40+ Chain)";
    if (method === "Masuda Method") return "1 / 1,638 (Foreign Parent)";
    return "1 / 8,192 (Base Rate)";
  }
  if (game === "Platinum" || game === "Heart Gold" || game === "Soul Silver") {
    if (method === "Poke Radar") return "1 / 200 (40+ Chain)";
    if (method === "Masuda Method") return "1 / 1,638 (Foreign Parent)";
    return "1 / 8,192 (Base Rate)";
  }
  if (game === "Black" || game === "White") {
    if (method === "Masuda Method") return "1 / 1,365 (Foreign Parent)";
    return "1 / 8,192 (Base Rate)";
  }
  if (game === "Black 2" || game === "White 2") {
    if (method === "Masuda Method") return "1 / 1,024 (Charm + Masuda)";
    return "1 / 2,731 (Shiny Charm)";
  }
  if (game === "X" || game === "Y") {
    if (method === "Chain Fishing") return "1 / 96 (20+ Streak + Charm)";
    if (method === "Poke Radar") return "1 / 99 (40+ Chain + Charm)";
    if (method === "Friend Safari") return "1 / 585 (Flat Safari Rate + Charm)";
    if (method === "Masuda Method") return "1 / 512 (Charm + Masuda)";
    return "1 / 1,365 (Shiny Charm)";
  }
  if (game === "Omega Ruby" || game === "Alpha Sapphire") {
    if (method === "Chain Fishing") return "1 / 96 (20+ Streak + Charm)";
    if (method === "DexNav") return "1 / 181 (901-999 Search + Charm)";
    if (method === "Masuda Method") return "1 / 512 (Charm + Masuda)";
    return "1 / 1,365 (Shiny Charm)";
  }
  if (game === "Sun" || game === "Moon" || game.startsWith("Ultra Sun") || game.startsWith("Ultra Moon")) {
    if (method === "Ultra Wormhole") return "Up to 36% (~1 / 3)";
    if (method === "SOS" || method === "SOS Chaining") return "1 / 274 (31+ Chain + Charm)";
    if (method === "Masuda Method") return "1 / 512 (Charm + Masuda)";
    return "1 / 1,365 (Shiny Charm)";
  }
  if (game.startsWith("Let's Go") || game.startsWith("Lets GO")) {
    if (method === "Catch Combo") return "1 / 273 (31+ Streak + Lure + Charm)";
    if (method === "Random Encounters") return "1 / 1,024 (Lure + Charm)";
    if (method === "Soft Resets") return "1 / 1,365 (Shiny Charm)";
    if (method === "Fossil Revivals" || method === "Gift Pokemon") return "1 / 4,096 (Base Rate)";
    return "1 / 1,365 (Shiny Charm)";
  }
  if (game === "Sword" || game === "Shield") {
    if (method === "Dynamax Adventures") return "1 / 100 (Shiny Charm)";
    if (method === "Masuda Method") return "1 / 512 (Foreign Parent + Charm)";
    if (method === "KO Method" || method === "Number Battled") return "1 / 456 (500+ Battled + Charm)";
    if (method === "Dynamax Raids" || method === "Fossil Revivals" || method === "Gift Pokemon") return "1 / 4,096 (Base Rate)";
    return "1 / 1,365 (Shiny Charm)";
  }
  if (game === "Brilliant Diamond" || game === "Shining Pearl") {
    if (method === "Poke Radar") return "1 / 99 (40+ Chain)";
    if (method === "Grand Underground" || method === "Underground Diglett Hunt") return "1 / 2,048 (40/40 Diglett)";
    if (method === "Masuda Method") return "1 / 512 (Charm + Masuda)";
    if (method === "Breeding") return "1 / 2,048 (Shiny Charm)";
    return "1 / 4,096 (Base Rate)";
  }
  if (game === "Legends Arceus") {
    if (method === "Mass Outbreaks") return "1 / 128 (Perfect + Charm + Outbreak)";
    if (method === "Massive Mass Outbreaks") return "1 / 216 (Perfect + Charm + MMO)";
    return "1 / 585 (Perfect Research + Charm)";
  }
  if (game === "Legends Z-A") {
    if (method === "Hyperspaces") return "1 / 683 (Charm + Spark 3)";
    if (method === "Fossil Revivals") return "1 / 4,096 (Base Rate)";
    return "1 / 1,365 (Shiny Charm)";
  }
  if (game === "Scarlet" || game === "Violet") {
    if (method === "Mass Outbreaks") return "1 / 512 (60+ KOs + Charm + Spark 3)";
    if (method === "Masuda Method") return "1 / 512 (Foreign Ditto + Charm)";
    if (method === "Sandwich / Sparkling" || method === "Sandwich") return "1 / 683 (Charm + Spark 3)";
    if (method === "Tera Raids") return "1 / 4,103 (Base Rate)";
    return "1 / 1,365 (Shiny Charm)";
  }
  if (game === "Pokemon GO" || game === "Pokémon GO" || game === "GO") {
    if (method === "Community Day") return "1 / 25 (Active Event)";
    if (method === "Raid Day") return "1 / 10 (Event Boost)";
    return "1 / 512 (Base GO Rate)";
  }

  const gameData = HUNT_SYSTEM[game];
  const methodData = gameData?.methods?.find(m => m.name === method);
  const base = methodData?.baseOdds || 4096;
  const charmRolls = gameData?.modifiers?.["Shiny Charm"] || 0;
  if (charmRolls > 0) {
    const charmOdds = Math.round(base / (charmRolls + 1));
    return `1 / ${charmOdds.toLocaleString()} (Shiny Charm)`;
  }
  return `1 / ${base.toLocaleString()} (Base Rate)`;
}

function getModifierSubtext(game, method, modifiers = {}, checks = 0) {
  const parts = [];
  if (modifiers.shinyCharm) parts.push("Shiny Charm");
  if (modifiers.sparklingLv3) parts.push("Sparkling Lv 3");
  else if (modifiers.sparklingLv2) parts.push("Sparkling Lv 2");
  else if (modifiers.sparklingLv1) parts.push("Sparkling Lv 1");
  if (modifiers.eventBoosted) parts.push("Event Boosted");
  if (modifiers.lureActive) parts.push("Lure");
  if (modifiers.perfectResearch) parts.push("Perfect Research");
  else if (modifiers.researchLv10) parts.push("Research Lv 10");
  if (modifiers.shinyParents) parts.push("Shiny Parent");
  if (modifiers.communityDay) parts.push("Community Day");
  if (modifiers.raidDay) parts.push("Raid Day");
  if (parts.length === 0) return "";
  return `Active: ${parts.join(" • ")}`;
}

// Human-readable summary time (e.g. 3h 21m)
const formatSummaryTime = (milliseconds = 0) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${totalSeconds}s`;
};

// Common Fail Causes for Shiny Hunting
const FAIL_CAUSES = [
  { value: "fainted", label: "Fainted / Knocked Out" },
  { value: "ran_away", label: "Ran Away / Fled" },
  { value: "self_destruct", label: "Self-Destruct / Explosion / Memento" },
  { value: "recoil", label: "Recoil Damage / Life Orb / Crash" },
  { value: "struggle", label: "Out of PP / Struggle" },
  { value: "roar", label: "Roar / Whirlwind / Teleport" },
  { value: "crash", label: "Game Crash / Battery Died" },
  { value: "other", label: "Other / Unspecified" }
];



// ── Progressive Odds Matrix & Scaled Tiers Table ─────────────────────────────
function OddsMatrixView({ game = "Scarlet", method = "Random Encounters", modifiers = {}, checks = 0 }) {
  const isUltraWormhole = (game === "Ultra Sun" || game === "Ultra Moon") && (method === "Ultra Wormholes" || method === "Ultra Wormhole");
  const isSVOutbreak = (game === "Scarlet" || game === "Violet") && method === "Mass Outbreaks";
  const isLetsGoCombo = (game.startsWith("Let's Go") || game.startsWith("Lets GO")) && (method === "Catch Combo" || !method);
  const isGen7SOS = (game === "Sun" || game === "Moon" || game === "Ultra Sun" || game === "Ultra Moon") && (method === "SOS" || method === "SOS Chaining");
  const isPokeRadar = method === "Poke Radar" || method === "Poké Radar";
  const isDexNav = (game === "Omega Ruby" || game === "Alpha Sapphire") && method === "DexNav";
  const isChainFishing = method === "Chain Fishing";
  const isSwShKO = (game === "Sword" || game === "Shield") && (method === "KO Method" || method === "Number Battled");

  if (!isUltraWormhole && !isSVOutbreak && !isLetsGoCombo && !isGen7SOS && !isPokeRadar && !isDexNav && !isChainFishing && !isSwShKO) {
    return null;
  }

  if (isUltraWormhole) {
    return (
      <div className="hunt-modal-card overflow-hidden !p-0">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-color)] bg-black/[0.02] dark:bg-white/[0.02]">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text)]">
            Current Odds:
          </span>
        </div>
        <div className="w-full bg-black/5 dark:bg-black/50 p-4 flex flex-col items-center justify-center gap-2.5 shadow-inner">
          <div className="flex items-center justify-center gap-3">
            <div className="px-4 py-2 rounded-xl border border-emerald-500/80 bg-black/5 dark:bg-black/60 text-emerald-400 font-extrabold text-lg font-mono shadow-sm">
              1%
            </div>
            <span className="text-[var(--text)] text-base font-bold">→</span>
            <div className="px-4 py-2 rounded-xl border border-emerald-500/80 bg-black/5 dark:bg-black/60 text-emerald-400 font-extrabold text-lg font-mono shadow-sm">
              36%
            </div>
          </div>
          <p className="text-xs text-gray-300 italic text-center font-medium">
            Odds increase with distance traveled
          </p>
        </div>
      </div>
    );
  }

  let title = "Progressive Odds Chart";
  let buffSummary = "";
  let rows = [];
  let note = "";

  if (isSVOutbreak) {
    title = "Outbreak KO Progression";
    const sparklingLevel = modifiers?.sparklingLv3 ? 3 : modifiers?.sparklingLv2 ? 2 : modifiers?.sparklingLv1 ? 1 : 0;
    const hasCharm = !!modifiers?.shinyCharm;
    const isEvent = !!modifiers?.eventBoosted;

    const buffs = [];
    if (sparklingLevel > 0) buffs.push(`Sparkling Lv ${sparklingLevel}`);
    else buffs.push("No Sandwich");
    if (hasCharm) buffs.push("Shiny Charm");
    if (isEvent) buffs.push("Event Boost");
    buffSummary = buffs.join(" • ");

    rows = [
      { trigger: "0 – 29 KOs", odds: calculateMassOutbreakOdds(0, sparklingLevel, hasCharm, isEvent), isCurrent: checks >= 0 && checks <= 29 },
      { trigger: "30 – 59 KOs", odds: calculateMassOutbreakOdds(30, sparklingLevel, hasCharm, isEvent), isCurrent: checks >= 30 && checks <= 59 },
      { trigger: "60+ KOs (Max)", odds: calculateMassOutbreakOdds(60, sparklingLevel, hasCharm, isEvent), isCurrent: checks >= 60 }
    ];
  } else if (isLetsGoCombo) {
    title = "Catch Combo Odds";
    const hasCharm = !!modifiers?.shinyCharm;
    const hasLure = !!modifiers?.lureActive;

    const buffs = [];
    if (hasCharm) buffs.push("Shiny Charm");
    if (hasLure) buffs.push("Lure Active");
    buffSummary = buffs.length > 0 ? buffs.join(" • ") : "No Modifiers";

    rows = [
      { trigger: "0-10", odds: calculateCatchComboOdds(0, hasCharm, hasLure), isCurrent: checks >= 0 && checks <= 10 },
      { trigger: "11-20", odds: calculateCatchComboOdds(11, hasCharm, hasLure), isCurrent: checks >= 11 && checks <= 20 },
      { trigger: "21-30", odds: calculateCatchComboOdds(21, hasCharm, hasLure), isCurrent: checks >= 21 && checks <= 30 },
      { trigger: "31+", odds: calculateCatchComboOdds(31, hasCharm, hasLure), isCurrent: checks >= 31 }
    ];
  } else if (isGen7SOS) {
    title = "SOS Chain Odds";
    const hasCharm = !!modifiers?.shinyCharm;
    buffSummary = hasCharm ? "Shiny Charm" : "No Modifiers";

    rows = [
      { trigger: "0-10", odds: hasCharm ? 1366 : 4096, isCurrent: checks >= 0 && checks <= 10 },
      { trigger: "11-20", odds: hasCharm ? 586 : 820, isCurrent: checks >= 11 && checks <= 20 },
      { trigger: "21-30", odds: hasCharm ? 373 : 456, isCurrent: checks >= 21 && checks <= 30 },
      { trigger: "31+", odds: hasCharm ? 274 : 316, isCurrent: checks >= 31 }
    ];
  } else if (isPokeRadar) {
    const isGen4 = game === "Diamond" || game === "Pearl" || game === "Platinum";
    const isBDSP = game === "Brilliant Diamond" || game === "Shining Pearl";
    const isXY = game === "X" || game === "Y";
    const hasCharm = !!modifiers?.shinyCharm;
    const radarFn = isBDSP
      ? calculatePokeRadarBDSPOdds
      : isXY
      ? (c) => calculatePokeRadarXYOdds(c, hasCharm)
      : calculatePokeRadarOdds;
    title = "Poké Radar Chain Odds";
    buffSummary = isBDSP ? "BDSP Formula" : isXY ? (hasCharm ? "Gen 6 + Shiny Charm" : "Gen 6 Formula") : "Gen 4 Formula";

    if (isGen4) {
      rows = [
        { trigger: "0", odds: 8200, isCurrent: checks < 10 },
        { trigger: "10", odds: calculatePokeRadarOdds(10), isCurrent: checks >= 10 && checks < 20 },
        { trigger: "20", odds: calculatePokeRadarOdds(20), isCurrent: checks >= 20 && checks < 30 },
        { trigger: "30", odds: calculatePokeRadarOdds(30), isCurrent: checks >= 30 && checks < 35 },
        { trigger: "35", odds: calculatePokeRadarOdds(35), isCurrent: checks >= 35 && checks < 40 },
        { trigger: "40+", odds: calculatePokeRadarOdds(40), isCurrent: checks >= 40 }
      ];
    } else if (isXY) {
      rows = [
        { trigger: "0", odds: calculatePokeRadarXYOdds(0, hasCharm), isCurrent: checks < 10 },
        { trigger: "10", odds: calculatePokeRadarXYOdds(10, hasCharm), isCurrent: checks >= 10 && checks < 20 },
        { trigger: "20", odds: calculatePokeRadarXYOdds(20, hasCharm), isCurrent: checks >= 20 && checks < 30 },
        { trigger: "30", odds: calculatePokeRadarXYOdds(30, hasCharm), isCurrent: checks >= 30 && checks < 40 },
        { trigger: "40+", odds: calculatePokeRadarXYOdds(40, hasCharm), isCurrent: checks >= 40 }
      ];
    } else {
      rows = [
        { trigger: "0", odds: radarFn(0), isCurrent: checks < 10 },
        { trigger: "10", odds: radarFn(10), isCurrent: checks >= 10 && checks < 20 },
        { trigger: "20", odds: radarFn(20), isCurrent: checks >= 20 && checks < 30 },
        { trigger: "30", odds: radarFn(30), isCurrent: checks >= 30 && checks < 40 },
        { trigger: "40+", odds: radarFn(40), isCurrent: checks >= 40 }
      ];
    }
  } else if (isChainFishing) {
    title = "Chain Fishing Odds";
    const hasCharm = !!modifiers?.shinyCharm;
    buffSummary = hasCharm ? "Shiny Charm" : "No Modifiers";

    rows = [
      { trigger: "0", odds: calculateChainFishingXYOdds(0, hasCharm), isCurrent: checks < 5 },
      { trigger: "5", odds: calculateChainFishingXYOdds(5, hasCharm), isCurrent: checks >= 5 && checks < 10 },
      { trigger: "10", odds: calculateChainFishingXYOdds(10, hasCharm), isCurrent: checks >= 10 && checks < 20 },
      { trigger: "20+", odds: calculateChainFishingXYOdds(20, hasCharm), isCurrent: checks >= 20 }
    ];
  } else if (isSwShKO) {
    title = "KO Method Odds";
    const hasCharm = !!modifiers?.shinyCharm;
    buffSummary = hasCharm ? "Shiny Charm" : "No Modifiers";

    rows = [
      { trigger: "0-49", odds: calculateKOOdds(0, hasCharm), isCurrent: checks >= 0 && checks <= 49 },
      { trigger: "50-99", odds: calculateKOOdds(50, hasCharm), isCurrent: checks >= 50 && checks <= 99 },
      { trigger: "100-199", odds: calculateKOOdds(100, hasCharm), isCurrent: checks >= 100 && checks <= 199 },
      { trigger: "200-299", odds: calculateKOOdds(200, hasCharm), isCurrent: checks >= 200 && checks <= 299 },
      { trigger: "300-499", odds: calculateKOOdds(300, hasCharm), isCurrent: checks >= 300 && checks <= 499 },
      { trigger: "500+", odds: calculateKOOdds(500, hasCharm), isCurrent: checks >= 500 }
    ];
  } else if (isDexNav) {
    title = "DexNav Search Level Odds";
    const hasCharm = !!modifiers?.shinyCharm;
    buffSummary = hasCharm ? "Shiny Charm" : "No Modifiers";

    rows = [
      { trigger: "0", odds: hasCharm ? 1366 : 4096, isCurrent: checks === 0 },
      { trigger: "1-16", odds: hasCharm ? 969 : 2906, isCurrent: checks >= 1 && checks <= 16 },
      { trigger: "17-33", odds: hasCharm ? 751 : 2252, isCurrent: checks >= 17 && checks <= 33 },
      { trigger: "34-50", odds: hasCharm ? 613 : 1838, isCurrent: checks >= 34 && checks <= 50 },
      { trigger: "84-100", odds: hasCharm ? 395 : 1185, isCurrent: checks >= 51 && checks <= 100 },
      { trigger: "101-150", odds: hasCharm ? 353 : 1059, isCurrent: checks >= 101 && checks <= 150 },
      { trigger: "201-300", odds: hasCharm ? 291 : 874, isCurrent: checks >= 151 && checks <= 300 },
      { trigger: "401-500", odds: hasCharm ? 248 : 744, isCurrent: checks >= 301 && checks <= 500 },
      { trigger: "701-800", odds: hasCharm ? 203 : 608, isCurrent: checks >= 501 && checks <= 800 },
      { trigger: "901-999", odds: hasCharm ? 181 : 542, isCurrent: checks >= 801 }
    ];

    note = "Each encounter has a 4% chance for random shiny odds boost. Encounters at multiples of 50 and 100 have additional boosted odds (not dynamically tracked).";
  }

  const isTableStyle = isDexNav || isGen7SOS || isLetsGoCombo || isSwShKO || isPokeRadar || isChainFishing || isSVOutbreak;
  const firstColHeader = (isGen7SOS || isLetsGoCombo || isPokeRadar) ? "Chain" : isChainFishing ? "Streak" : isSVOutbreak ? "KOs Defeated" : isDexNav ? "Search Level" : isSwShKO ? "Number Battled" : "Milestone";

  return (
    <div className="hunt-modal-card overflow-hidden !p-0">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-color)] bg-black/[0.02] dark:bg-white/[0.02]">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text)]">
          {title}
        </span>
        {buffSummary && (
          <span className="text-[11px] font-semibold text-[var(--text-muted)] bg-black/5 dark:bg-white/[0.06] border border-[var(--border-color)] px-2 py-0.5 rounded-md">
            {buffSummary}
          </span>
        )}
      </div>

      {isTableStyle ? (
        <div className="w-full bg-black/5 dark:bg-black/50">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--accent)] text-black font-extrabold uppercase tracking-wider">
                <th className="py-2.5 px-4 text-left w-1/2">{firstColHeader}</th>
                <th className="py-2.5 px-4 text-right w-1/2">Odds</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] font-semibold">
              {rows.map((r, i) => {
                const isCurrent = r.isCurrent;
                return (
                  <tr
                    key={i}
                    className={`transition ${
                      isCurrent
                        ? "bg-[var(--accent)]/15 font-bold"
                        : "hover:bg-black/5 dark:hover:bg-white/[0.02] text-[var(--text-muted)]"
                    }`}
                  >
                    <td className="py-2.5 px-4 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className={isCurrent ? "text-[var(--accent)] font-extrabold" : "text-[var(--text)]"}>
                          {r.trigger}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[var(--accent)] text-black">
                            Current
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold ${isCurrent ? "text-[var(--accent)] font-black" : "text-[var(--text)]"}`}>
                      1 / {r.odds.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {note && (
            <div className="p-3 text-center text-[11px] text-[var(--text-muted)] italic border-t border-[var(--border-color)] bg-black/5 dark:bg-black/25 leading-relaxed">
              {note}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3.5 bg-black/5 dark:bg-black/50">
          <div className="grid grid-cols-2 gap-2">
            {rows.map((r, i) => {
              const isCurrent = r.isCurrent;
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between sm:flex-col sm:items-start p-2.5 rounded-xl border transition ${
                    isCurrent
                      ? "bg-[var(--accent)]/10 border-[var(--accent)]/50"
                      : "bg-black/5 dark:bg-black/30 border-[var(--border-color)]"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold ${isCurrent ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>
                      {r.trigger}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-[var(--accent)] text-black">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-extrabold text-[var(--text)] font-mono sm:mt-1">
                    1 / {r.odds.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const MARKS_GAMES = ["Scarlet", "Violet", "Sword", "Shield"];

export default function Counters() {
  const navigate = useNavigate();
  const user = useContext(UserContext);
  const username = user?.username;
  const { showMessage } = useMessage();

  // ── Modals & Wizard State ────────────────────────────────────────────────
  const [huntWizard, setHuntWizard] = useState({
    isOpen: false,
    step: 0,
    game: "",
    method: "",
    formTab: "all",
    phaseFormTab: "all",
    modifiers: {
      shinyCharm: false,
      sparklingLv1: false,
      sparklingLv2: false,
      sparklingLv3: false,
      eventBoosted: false,
      lureActive: false,
      researchLv10: false,
      perfectResearch: false,
      shinyParents: false,
      communityDay: false,
      raidDay: false,
      researchDay: false
    },
    searchTerm: "",
    selectedPokemon: null,
    phaseSearchTerm: "",
    possiblePhases: [],
    allowAnyPhase: true,
    startingChecks: 0,
    increment: 1,
    targetPhasesNotes: ""
  });

  // ── Global Raw Active Hunts (shared with MMO Tool) ────────────────────────
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

  // Filter out Legends Arceus MMO / Permutation hunts (handled exclusively in MMO Tool)
  const activeHunts = useMemo(() => {
    return (allActiveHunts || []).filter(h => !((h.game === "Legends Arceus" && (h.method === "Permutations" || h.method === "Massive Mass Outbreak" || h.method === "Massive Mass Outbreaks")) || h.method === "Permutations" || h.isMMO));
  }, [allActiveHunts]);

  const [currentHuntId, setCurrentHuntId] = useState(() => {
    try {
      const saved = localStorage.getItem("currentHuntId");
      return saved ? (isNaN(saved) ? saved : Number(saved)) : null;
    } catch {
      return null;
    }
  });

  // Persist currentHuntId across reloads
  useEffect(() => {
    if (currentHuntId != null) {
      try {
        localStorage.setItem("currentHuntId", String(currentHuntId));
      } catch {}
    }
  }, [currentHuntId]);

  // Derived Current Hunt and Other Hunts queue
  const currentHunt = useMemo(() => {
    if (!activeHunts || activeHunts.length === 0) return null;
    if (currentHuntId != null) {
      const match = activeHunts.find(
        h => String(h.id) === String(currentHuntId) || String(h.huntId) === String(currentHuntId)
      );
      if (match) return match;
    }
    return activeHunts[0];
  }, [activeHunts, currentHuntId]);

  const otherHunts = useMemo(() => {
    if (!activeHunts || activeHunts.length <= 1 || !currentHunt) return [];
    return activeHunts.filter(
      h => String(h.id) !== String(currentHunt.id) && String(h.huntId) !== String(currentHunt.id)
    );
  }, [activeHunts, currentHunt]);

  // Keep currentHuntId synchronized when hunts load or if the current hunt was deleted/completed
  const initialHuntsLoadedRef = useRef(false);
  useEffect(() => {
    if (activeHunts.length > 0) {
      initialHuntsLoadedRef.current = true;
      const exists = activeHunts.some(
        h => String(h.id) === String(currentHuntId) || String(h.huntId) === String(currentHuntId)
      );
      if (!exists && activeHunts[0]) {
        setCurrentHuntId(activeHunts[0].id);
      }
    } else if (initialHuntsLoadedRef.current && currentHuntId != null) {
      setCurrentHuntId(null);
    }
  }, [activeHunts, currentHuntId]);

  const [huntTimers, setHuntTimers] = useState({});
  const [lastCheckTimes, setLastCheckTimes] = useState({});
  const [totalCheckTimes, setTotalCheckTimes] = useState({});
  const [pausedHunts, setPausedHunts] = useState(new Set());
  const [huntIncrements, setHuntIncrements] = useState(() => {
    try {
      const saved = localStorage.getItem("dex_hunt_increments");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Context Menu Dropdown state
  const [openMenuHuntId, setOpenMenuHuntId] = useState(null);

  // Modals state
  const [resetModal, setResetModal] = useState({ show: false, hunt: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, hunt: null });
  const [settingsModal, setSettingsModal] = useState({ show: false, hunt: null });
  const [editModal, setEditModal] = useState({ show: false, hunt: null });
  const [shinyEncounterModal, setShinyEncounterModal] = useState({
    show: false,
    hunt: null,
    step: 1, // 1: "What appeared?", 2: "What happened?", 3: "Outcome Summary"
    selectedPokemon: null,
    isTarget: true,
    outcome: null, // "caught" | "failed"
    ball: "",
    mark: "",
    notes: "",
    addedToCollection: false,
    searchTerm: "",
    formTab: "all",
    phaseResult: null
  });
  const [phaseHistoryModal, setPhaseHistoryModal] = useState({ show: false, hunt: null });
  const [abandonHuntModal, setAbandonHuntModal] = useState({ show: false, hunt: null });
  const [oddsModal, setOddsModal] = useState({ show: false, hunt: null });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyTab, setHistoryTab] = useState("all"); // "all" | "completed" | "fails"
  const [deleteHistoryModal, setDeleteHistoryModal] = useState({ show: false, entry: null });
  const [clearAllHistoryModal, setClearAllHistoryModal] = useState(false);
  const [hotkeyModal, setHotkeyModal] = useState(false);

  // Hotkey state
  const [hotkey, setHotkey] = useState(() => {
    try {
      return localStorage.getItem("huntHotkey") || " ";
    } catch {
      return " ";
    }
  }); // Default Spacebar for Increment
  const [decrementHotkey, setDecrementHotkey] = useState(() => {
    try {
      return localStorage.getItem("huntDecrementHotkey") || "-";
    } catch {
      return "-";
    }
  }); // Default Minus for Decrement
  const [listeningFor, setListeningFor] = useState(null); // 'increment' | 'decrement' | null
  const [hotkeyError, setHotkeyError] = useState("");
  const [shinyCharmGames, setShinyCharmGames] = useState([]);
  const lastSaveTime = useRef(0);

  // Home sprite user preference
  const [useHomeSprites, setUseHomeSprites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dexPreferences"))?.useHomeSprites || false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handlePrefsChange = () => {
      try {
        setUseHomeSprites(JSON.parse(localStorage.getItem("dexPreferences"))?.useHomeSprites || false);
      } catch { }
    };
    window.addEventListener("dexPreferencesChanged", handlePrefsChange);
    return () => window.removeEventListener("dexPreferencesChanged", handlePrefsChange);
  }, []);

  // Close context menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".hunt-menu-container")) {
        setOpenMenuHuntId(null);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // ── Forms ────────────────────────────────────────────────────────────────
  const [settingsForm, setSettingsForm] = useState({
    manualChecks: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    manualTotalTime: "",
    manualIncrements: "1"
  });

  const [editForm, setEditForm] = useState({
    game: "",
    method: "",
    pokemon: null,
    modifiers: {}
  });

  const [completionForm, setCompletionForm] = useState({
    ball: "",
    mark: "",
    notes: ""
  });

  const [phaseForm, setPhaseForm] = useState({
    pokemon: null,
    checks: 0,
    ball: "",
    notes: "",
    searchTerm: ""
  });

  const [failForm, setFailForm] = useState({
    cause: "fainted",
    checks: 0,
    notes: ""
  });

  const [metricMode, setMetricMode] = useState(() => {
    try {
      return localStorage.getItem("dex_hunt_metric_mode") || "phase";
    } catch {
      return "phase";
    }
  });

  const [collapsedPhasesMap, setCollapsedPhasesMap] = useState(() => {
    try {
      const saved = localStorage.getItem("dex_hunt_collapsed_phases");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [huntHistory, setHuntHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const countersHistoryCount = useMemo(() => {
    return (huntHistory || []).filter(h => !(h.game === "Legends Arceus" && h.method === "Permutations") && h.method !== "Permutations").length;
  }, [huntHistory]);
  // Check for auto-paused notice on mount
  useEffect(() => {
    try {
      const flag = localStorage.getItem("dex_hunt_auto_paused");
      if (flag) {
        localStorage.removeItem("dex_hunt_auto_paused");
        showMessage("Hunt was automatically paused when you left.", "info");
      }
    } catch { }
  }, [showMessage]);



  // ── All Pokemon List ──────────────────────────────────────────────────────
  const allPokemon = useMemo(() => {
    let currentPrefs = null;
    try {
      currentPrefs = JSON.parse(localStorage.getItem("dexPreferences"));
    } catch { }

    const baseList = pokemonData.map(p => ({
      ...p,
      formType: "main",
      stableId: p.stableId || `${p.name}-${String(p.id).padStart(4, "0")}`
    }));

    const formsList = getFilteredFormsData(formsData, currentPrefs)
      .filter(f => f.formType !== "mighty" && !f.stableId?.startsWith("origin-ball-") && !f.name?.startsWith("origin-ball-") && !isNonPartnerCapPikachu(f))
      .map(f => ({
        ...f,
        stableId: f.stableId || `${f.name}-${f.formType}-${String(f.id).padStart(4, "0")}`
      }));

    return [...baseList, ...formsList];
  }, []);

  const getPokemonImage = useCallback((pokemon, useHomeSpritesOverride = useHomeSprites) => {
    if (!pokemon) return "/fallback.png";
    return getSpriteUrl(pokemon, true, useHomeSpritesOverride);
  }, [useHomeSprites]);

  // Dynamic Form Tabs for a Game (only show tabs with available Pokémon)
  const getTabsForGame = useCallback((gameName) => {
    if (!gameName) return [{ id: "all", label: "All" }];
    const inGame = allPokemon.filter(p => isPokemonAvailableInGame(p, gameName));

    const counts = {
      all: inGame.length,
      main: inGame.filter(p => !p.formType || p.formType === "main").length,
      alolan: inGame.filter(p => p.formType === "alolan").length,
      galarian: inGame.filter(p => p.formType === "galarian").length,
      hisuian: inGame.filter(p => p.formType === "hisuian").length,
      paldean: inGame.filter(p => p.formType === "paldean").length,
      gmax: inGame.filter(p => p.formType === "gmax").length,
      gender: inGame.filter(p => p.formType === "gender").length,
      unown: inGame.filter(p => p.formType === "unown").length,
      vivillon: inGame.filter(p => p.formType === "vivillon").length,
      alcremie: inGame.filter(p => p.formType === "alcremie").length,
      alpha: inGame.filter(p => p.formType === "alpha" || p.formType === "alphaother").length,
      other: inGame.filter(p => p.formType === "other").length
    };

    const definitions = [
      { id: "all", label: "All Forms" },
      { id: "main", label: "Base Species" },
      { id: "alolan", label: "Alola" },
      { id: "galarian", label: "Galar" },
      { id: "hisuian", label: "Hisui" },
      { id: "paldean", label: "Paldea" },
      { id: "gmax", label: "Gigantamax" },
      { id: "gender", label: "Gender" },
      { id: "unown", label: "Unown" },
      { id: "vivillon", label: "Vivillon" },
      { id: "alcremie", label: "Alcremie" },
      { id: "alpha", label: "Alpha" },
      { id: "other", label: "Other" }
    ];

    return definitions.filter(d => d.id === "all" || (counts[d.id] && counts[d.id] > 0));
  }, [allPokemon]);

  const availableFormTabs = useMemo(() => {
    return getTabsForGame(huntWizard.game);
  }, [getTabsForGame, huntWizard.game]);

  const availablePhaseFormTabs = useMemo(() => {
    return getTabsForGame(huntWizard.game);
  }, [getTabsForGame, huntWizard.game]);

  // Filtered Pokemon for Step 2 (Target Pokémon - only obtainable in huntWizard.game)
  const wizardGamePokemon = useMemo(() => {
    if (!huntWizard.game) return [];
    const targetGame = huntWizard.game;
    let inGame = allPokemon.filter(p => isPokemonAvailableInGame(p, targetGame));

    if (huntWizard.formTab && huntWizard.formTab !== "all") {
      if (huntWizard.formTab === "main") {
        inGame = inGame.filter(p => !p.formType || p.formType === "main");
      } else if (huntWizard.formTab === "alpha") {
        inGame = inGame.filter(p => p.formType === "alpha" || p.formType === "alphaother");
      } else {
        inGame = inGame.filter(p => p.formType === huntWizard.formTab);
      }
    }

    if (!huntWizard.searchTerm.trim()) return inGame;
    const q = huntWizard.searchTerm.toLowerCase();
    return inGame.filter(p =>
      p && p.name && (p.name.toLowerCase().includes(q) || String(p.id).includes(q))
    );
  }, [allPokemon, huntWizard.game, huntWizard.formTab, huntWizard.searchTerm]);

  // Filtered Pokemon for Step 3 (Possible Phases - only obtainable in huntWizard.game)
  const wizardGamePhasePokemon = useMemo(() => {
    if (!huntWizard.game) return [];
    const targetGame = huntWizard.game;
    let inGame = allPokemon.filter(p => isPokemonAvailableInGame(p, targetGame));

    if (huntWizard.phaseFormTab && huntWizard.phaseFormTab !== "all") {
      if (huntWizard.phaseFormTab === "main") {
        inGame = inGame.filter(p => !p.formType || p.formType === "main");
      } else if (huntWizard.phaseFormTab === "alpha") {
        inGame = inGame.filter(p => p.formType === "alpha" || p.formType === "alphaother");
      } else {
        inGame = inGame.filter(p => p.formType === huntWizard.phaseFormTab);
      }
    }

    if (!huntWizard.phaseSearchTerm.trim()) return inGame;
    const q = huntWizard.phaseSearchTerm.toLowerCase();
    return inGame.filter(p =>
      p && p.name && (p.name.toLowerCase().includes(q) || String(p.id).includes(q))
    );
  }, [allPokemon, huntWizard.game, huntWizard.phaseFormTab, huntWizard.phaseSearchTerm]);

  const availableShinyEncounterFormTabs = useMemo(() => {
    return getTabsForGame(shinyEncounterModal.hunt?.game);
  }, [getTabsForGame, shinyEncounterModal.hunt?.game]);

  // Filtered Pokemon for Shiny Encounter Search (excludes the main target which is featured at the top)
  const shinyEncounterAvailablePokemon = useMemo(() => {
    if (!shinyEncounterModal.hunt) return [];
    const targetGame = shinyEncounterModal.hunt.game;
    const targetStableId = shinyEncounterModal.hunt.pokemon?.stableId || shinyEncounterModal.hunt.pokemon?.id;
    const targetName = shinyEncounterModal.hunt.pokemon?.name?.toLowerCase();
    const targetForm = shinyEncounterModal.hunt.pokemon?.formType || "main";

    let inGame = allPokemon.filter(p => {
      if (!isPokemonAvailableInGame(p, targetGame)) return false;
      if (targetStableId && (p.stableId || p.id) === targetStableId) return false;
      if (p.name?.toLowerCase() === targetName && (p.formType || "main") === targetForm) return false;
      return true;
    });

    if (shinyEncounterModal.formTab && shinyEncounterModal.formTab !== "all") {
      if (shinyEncounterModal.formTab === "main") {
        inGame = inGame.filter(p => !p.formType || p.formType === "main");
      } else if (shinyEncounterModal.formTab === "alpha") {
        inGame = inGame.filter(p => p.formType === "alpha" || p.formType === "alphaother");
      } else {
        inGame = inGame.filter(p => p.formType === shinyEncounterModal.formTab);
      }
    }

    if (!shinyEncounterModal.searchTerm?.trim()) return inGame;
    const q = shinyEncounterModal.searchTerm.toLowerCase();
    return inGame.filter(p =>
      p && p.name && (p.name.toLowerCase().includes(q) || String(p.id).includes(q))
    );
  }, [allPokemon, shinyEncounterModal.hunt, shinyEncounterModal.formTab, shinyEncounterModal.searchTerm]);

  // Open Wizard Helper
  const handleOpenHuntWizard = (preselected = null) => {
    const defaultGame = preselected ? (getAvailableGamesForPokemonSidebar(preselected)[0] || "") : "";
    const defaultMethod = defaultGame ? (getMethodsForGame(defaultGame)[0]?.name || "") : "";
    const availableMods = defaultGame ? (getModifiersForGame(defaultGame) || {}) : {};
    const gameHasCharm = (availableMods["Shiny Charm"] || 0) > 0;

    setHuntWizard({
      isOpen: true,
      step: 0,
      game: defaultGame,
      method: defaultMethod,
      formTab: "all",
      phaseFormTab: "all",
      modifiers: {
        shinyCharm: defaultGame ? (gameHasCharm && shinyCharmGames.includes(defaultGame)) : false,
        sparklingLv1: false,
        sparklingLv2: false,
        sparklingLv3: false,
        eventBoosted: false,
        lureActive: false,
        researchLv10: defaultGame === "Legends Arceus" && Boolean(gameHasCharm && shinyCharmGames.includes(defaultGame)),
        perfectResearch: false,
        shinyParents: false,
        communityDay: false,
        raidDay: false,
        researchDay: false
      },
      searchTerm: "",
      selectedPokemon: preselected,
      phaseSearchTerm: "",
      possiblePhases: [],
      startingChecks: 0,
      increment: 1,
      startHours: "",
      startMinutes: "",
      startSeconds: "",
      estimatedPaceSec: "",
      targetPhasesNotes: ""
    });
  };

  // ── Global Stats & Derived Timers ─────────────────────────────────────────
  const activeCount = activeHunts.length;

  // Lightweight UI render tick (zero mutations, derived from Date.now())
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(timer);
  }, []);

  const totalHuntingTimeMs = useMemo(() => {
    return activeHunts.reduce((acc, h) => acc + getHuntElapsedTime(h), 0);
  }, [activeHunts, tick]);

  const totalChecksToday = useMemo(() => {
    return activeHunts.reduce((acc, h) => acc + (h.checks || 0), 0);
  }, [activeHunts]);

  const channelRef = useRef(null);
  const allActiveHuntsRef = useRef(allActiveHunts);
  allActiveHuntsRef.current = allActiveHunts;
  const saveTimeoutRef = useRef(null);

  const debouncedSave = useCallback((huntsToSave, nextCurrentHuntId = currentHuntId, immediate = false) => {
    if (!username) return;
    setCachedHuntsData({ activeHunts: huntsToSave });
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    const performSave = async () => {
      try {
        const incMap = {};
        huntsToSave.forEach(h => {
          if (h.increment) incMap[String(h.id)] = Number(h.increment);
        });
        await huntAPI.updateHuntData({
          activeHunts: huntsToSave,
          currentHuntId: nextCurrentHuntId,
          huntIncrements: incMap
        });
      } catch (err) {
        console.error("Failed to save hunts to backend:", err);
      }
    };

    if (immediate) {
      performSave();
    } else {
      saveTimeoutRef.current = setTimeout(performSave, 100);
    }
  }, [username, currentHuntId]);

  const handleToggleCollapsePhases = useCallback((huntId) => {
    setCollapsedPhasesMap(prev => {
      const nextVal = !prev[huntId];
      const nextMap = { ...prev, [huntId]: nextVal };
      try {
        localStorage.setItem("dex_hunt_collapsed_phases", JSON.stringify(nextMap));
      } catch { }

      setAllActiveHunts(currentList => {
        const updated = currentList.map(h => String(h.id) === String(huntId) ? { ...h, isPhasesCollapsed: nextVal } : h);
        setCachedHuntsData({ activeHunts: updated });
        debouncedSave(updated);
        return updated;
      });

      return nextMap;
    });
  }, [debouncedSave]);

  const toggleMetricMode = useCallback(() => {
    setMetricMode(prev => {
      const next = prev === "total" ? "phase" : "total";
      try {
        localStorage.setItem("dex_hunt_metric_mode", next);
      } catch { }

      const targetId = currentHuntId != null ? currentHuntId : (currentHunt?.id || null);

      if (targetId != null) {
        try {
          const mapRaw = localStorage.getItem("dex_hunt_metric_mode_map");
          const modeMap = mapRaw ? JSON.parse(mapRaw) : {};
          modeMap[targetId] = next;
          modeMap[String(targetId)] = next;
          localStorage.setItem("dex_hunt_metric_mode_map", JSON.stringify(modeMap));
        } catch { }

        let updatedHuntsList = null;
        setAllActiveHunts(currentList => {
          const updated = currentList.map(h => {
            if (String(h.id) === String(targetId) || String(h.huntId) === String(targetId)) {
              return { ...h, metricMode: next, version: (h.version || 1) + 1, updatedAt: Date.now() };
            }
            return h;
          });
          updatedHuntsList = updated;
          setCachedHuntsData({ activeHunts: updated });
          debouncedSave(updated);
          return updated;
        });

        if (channelRef.current) {
          channelRef.current.broadcast({
            type: "HUNT_ACTION",
            huntId: targetId,
            action: {
              type: "TOGGLE_METRIC_MODE",
              metricMode: next,
              timestamp: Date.now()
            }
          });
          if (updatedHuntsList) {
            const updatedHunt = updatedHuntsList.find(h => String(h.id) === String(targetId) || String(h.huntId) === String(targetId));
            if (updatedHunt) {
              channelRef.current.broadcast({
                type: "HUNT_UPDATED",
                hunt: updatedHunt
              });
            }
          }
        }
      }

      return next;
    });
  }, [currentHuntId, currentHunt, debouncedSave]);

  useEffect(() => {
    const channel = createHuntChannel((msg) => {
      if (!msg) return;

      if (msg.type === "REQUEST_HUNT_STATE") {
        channel.broadcast({
          type: "RESPONSE_HUNT_STATE",
          hunts: allActiveHuntsRef.current
        });
        return;
      }

      if (msg.type === "HUNT_ACTION" && msg.action) {
        if (msg.action.type === "TOGGLE_METRIC_MODE" && msg.action.metricMode) {
          setMetricMode(msg.action.metricMode);
        }
        setAllActiveHunts(prev => {
          const next = applyHuntActionToState(prev, msg.action, msg.action.timestamp || Date.now());
          setCachedHuntsData({ activeHunts: next });
          return next;
        });
        return;
      }

      if (msg.type === "HUNTS_SYNC" && Array.isArray(msg.hunts)) {
        setAllActiveHunts(msg.hunts.map(h => normalizeHunt(h)));
        setCachedHuntsData({ activeHunts: msg.hunts });
        return;
      }

      if (msg.type === "HUNT_UPDATED" && msg.hunt) {
        setAllActiveHunts(prev => {
          const targetId = String(msg.hunt.id);
          const existing = prev.find(h => String(h.id) === targetId);
          if (existing && (existing.version || 0) > (msg.hunt.version || 0)) {
            return prev; // Ignore out-of-order stale update
          }
          const next = prev.some(h => String(h.id) === targetId)
            ? prev.map(h => String(h.id) === targetId ? msg.hunt : h)
            : [msg.hunt, ...prev];
          setCachedHuntsData({ activeHunts: next });
          return next;
        });
      }
    });

    channelRef.current = channel;
    return () => channel.close();
  }, []);

  // Load profile & initial hunt data
  useEffect(() => {
    if (!username) return;

    profileAPI.getProfile().then(profile => {
      const charmGames = profile.shinyCharmGames || [];
      setShinyCharmGames(charmGames);
      if (profile.huntHotkey) {
        setHotkey(profile.huntHotkey);
        try { localStorage.setItem("huntHotkey", profile.huntHotkey); } catch {}
      }
      if (profile.huntDecrementHotkey) {
        setDecrementHotkey(profile.huntDecrementHotkey);
        try { localStorage.setItem("huntDecrementHotkey", profile.huntDecrementHotkey); } catch {}
      }
    }).catch(() => { });

    // Local recovery first for instant UI response
    const cached = getCachedHuntsData();
    if (cached?.activeHunts && cached.activeHunts.length > 0) {
      const normalized = cached.activeHunts.map(h => normalizeHunt(h));
      setAllActiveHunts(normalized);
      const savedCollapsed = {};
      const incMap = {};
      normalized.forEach(h => {
        if (h.isPhasesCollapsed !== undefined) {
          savedCollapsed[h.id] = !!h.isPhasesCollapsed;
        }
        if (h.increment) {
          incMap[h.id] = Number(h.increment);
          incMap[String(h.id)] = Number(h.increment);
        }
      });
      if (Object.keys(savedCollapsed).length > 0) {
        setCollapsedPhasesMap(prev => ({ ...savedCollapsed, ...prev }));
      }
      if (Object.keys(incMap).length > 0) {
        setHuntIncrements(prev => ({ ...prev, ...incMap }));
      }
    }

    // Backend canonical fetch
    huntAPI.getHuntData().then(data => {
      if (data?.activeHunts) {
        const normalized = data.activeHunts.map(h =>
          normalizeHunt(h, Date.now(), data.totalCheckTimes || {}, data.lastCheckTimes || {}, new Set(data.pausedHunts || []))
        );
        setAllActiveHunts(normalized);
        setCachedHuntsData({ activeHunts: normalized });

        const savedCollapsed = {};
        const incMap = {};
        if (data.huntIncrements && typeof data.huntIncrements === "object") {
          Object.entries(data.huntIncrements).forEach(([k, v]) => {
            incMap[k] = Number(v) || 1;
            incMap[String(k)] = Number(v) || 1;
          });
        }
        normalized.forEach(h => {
          if (h.isPhasesCollapsed !== undefined) {
            savedCollapsed[h.id] = !!h.isPhasesCollapsed;
          }
          if (h.increment) {
            incMap[h.id] = Number(h.increment);
            incMap[String(h.id)] = Number(h.increment);
          }
        });
        if (Object.keys(savedCollapsed).length > 0) {
          setCollapsedPhasesMap(prev => ({ ...savedCollapsed, ...prev }));
        }
        if (Object.keys(incMap).length > 0) {
          setHuntIncrements(prev => {
            const merged = { ...prev, ...incMap };
            try {
              localStorage.setItem("dex_hunt_increments", JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }

        if (data.currentHuntId != null) {
          const standardActive = normalized.filter(h => !(h.game === "Legends Arceus" && h.method === "Permutations"));
          const exists = standardActive.some(h => String(h.id) === String(data.currentHuntId) || String(h.huntId) === String(data.currentHuntId));
          if (exists) {
            setCurrentHuntId(data.currentHuntId);
            try {
              localStorage.setItem("currentHuntId", String(data.currentHuntId));
            } catch {}
          }
        }
      }
    }).catch(() => { });
  }, [username]);

  const getHistoryPokemon = useCallback((entry) => {
    if (entry.pokemon && (entry.pokemon.image || entry.pokemon.sprites || entry.pokemon.id)) {
      return entry.pokemon;
    }
    const cleanName = (entry.pokemonName || (entry.caughtKey ? entry.caughtKey.split("-")[0] : "") || "").trim();
    const base = pokemonData.find(p => p.name?.toLowerCase() === cleanName.toLowerCase());
    const form = formsData.find(f => (f.stableId && f.stableId === cleanName) || f.name?.toLowerCase() === cleanName.toLowerCase());
    return form || base || (findPokemon ? findPokemon(1, cleanName) : null) || { name: cleanName, id: 1 };
  }, []);

  const loadHuntHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const historyList = [];
      const blacklistKey = `deleted_hunt_history_ids:${username || "global"}`;
      let deletedIds = [];
      try {
        deletedIds = JSON.parse(localStorage.getItem(blacklistKey) || "[]").map(String);
      } catch {}

      const isItemDeleted = (item) => {
        if (!item) return true;
        if (item.entryId && deletedIds.includes(String(item.entryId))) return true;
        if (item.id && deletedIds.includes(String(item.id))) return true;
        if (item.timestamp && deletedIds.includes(String(item.timestamp))) return true;
        return false;
      };

      const isActualHuntItem = (h) => {
        if (!h) return false;
        if (h.isHuntTracker || h.isCounter || h.isHunt || h.source === "completedHunts" || h.source === "completedFails") return true;
        if (h.outcome === "failed" || h.isFail) return true;
        if (Array.isArray(h.phases) && h.phases.length > 0) return true;
        if (Array.isArray(h.fails) && h.fails.length > 0) return true;
        if ((Number(h.totalChecks || h.checks || 0) > 0 || Number(h.elapsedMs || h.time || 0) > 0) && (h.method || h.game)) return true;
        if (h.caughtKey && !h.isHuntTracker) return false;
        return false;
      };

      // 1. Load from local completed hunts storage
      const storageKeys = [
        username ? `completedHunts:${username}` : null,
        "completedHunts"
      ].filter(Boolean);

      storageKeys.forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach(h => {
                if (isActualHuntItem(h) && !isItemDeleted(h) && !historyList.some(e => (e.entryId && e.entryId === h.entryId) || (e.id && e.id === h.id))) {
                  const resolvedMon = resolvePokemon(h);
                  const cleanName = resolvedMon?.name || cleanPokemonNameOrKey(h.pokemonName || h.pokemon?.name);
                  historyList.push({
                    ...h,
                    source: "completedHunts",
                    pokemon: resolvedMon || h.pokemon,
                    pokemonName: cleanName || h.pokemonName || "Unknown",
                    timestamp: h.timestamp || (h.date ? new Date(h.date).getTime() : 0)
                  });
                }
              });
            }
          }
        } catch {}
      });

      // 2. Load from local completed fails storage
      const failStorageKeys = [
        username ? `completedFails:${username}` : null,
        "completedFails"
      ].filter(Boolean);

      failStorageKeys.forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach(f => {
                if (isActualHuntItem(f) && !isItemDeleted(f) && !historyList.some(e => (e.entryId && e.entryId === f.entryId) || (e.id && e.id === f.id))) {
                  const resolvedMon = resolvePokemon(f);
                  const cleanName = resolvedMon?.name || cleanPokemonNameOrKey(f.pokemonName || f.pokemon?.name);
                  historyList.push({
                    ...f,
                    source: "completedFails",
                    outcome: "failed",
                    isFail: true,
                    pokemon: resolvedMon || f.pokemon,
                    pokemonName: cleanName || f.pokemonName || "Unknown",
                    timestamp: f.timestamp || (f.date ? new Date(f.date).getTime() : 0)
                  });
                }
              });
            }
          }
        } catch {}
      });

      // 3. Load from Living Dex caught data (only genuine hunt-tracker entries)
      let caughtData = null;
      if (username) {
        try {
          const { fetchCaughtData } = await import("../api/caught");
          caughtData = await fetchCaughtData(username);
        } catch {}
        if (!caughtData) {
          try {
            caughtData = JSON.parse(localStorage.getItem(`caughtInfoMap:${username}`) || "{}");
          } catch {}
        }
      } else {
        try {
          caughtData = JSON.parse(localStorage.getItem("caughtInfoMap") || "{}");
        } catch {}
      }

      if (caughtData && typeof caughtData === "object") {
        Object.entries(caughtData).forEach(([caughtKey, info]) => {
          if (info && Array.isArray(info.entries)) {
            info.entries.forEach(entry => {
              const isHuntEntry = Boolean(
                entry.isHuntTracker ||
                entry.isCounter ||
                entry.isHunt ||
                entry.source === "completedHunts" ||
                entry.source === "completedFails"
              );

              if (isHuntEntry && !isItemDeleted(entry)) {
                const entryId = entry.entryId || entry.id;
                const matchIndex = historyList.findIndex(h =>
                  (entryId && (h.entryId === entryId || h.id === entryId)) ||
                  (h.caughtKey === caughtKey && h.date === entry.date && (h.totalChecks === entry.totalChecks || h.checks === entry.checks))
                );

                const resolvedMon = resolvePokemon(entry) || resolvePokemon(caughtKey);
                const monName = resolvedMon?.name || cleanPokemonNameOrKey(entry.pokemonName || entry.pokemon?.name || caughtKey);
                const checks = Number(entry.totalChecks ?? entry.checks ?? 0);
                const rawTime = entry.elapsedMs ?? entry.time ?? 0;
                const timeMs = Number(rawTime > 0 && rawTime < 100000 && !entry.elapsedMs ? rawTime * 1000 : rawTime);

                if (matchIndex >= 0) {
                  historyList[matchIndex].addedToLivingDex = true;
                  historyList[matchIndex].caughtKey = caughtKey;
                } else {
                  historyList.push({
                    ...entry,
                    id: entry.id || entryId,
                    entryId: entryId || entry.id,
                    caughtKey,
                    pokemonName: monName || "Unknown",
                    pokemon: resolvedMon || (monName ? { name: monName } : null),
                    checks,
                    totalChecks: checks,
                    time: timeMs,
                    elapsedMs: timeMs,
                    timestamp: entry.timestamp || (entry.date ? new Date(entry.date).getTime() : 0),
                    addedToLivingDex: true
                  });
                }
              }
            });
          }

          if (info && Array.isArray(info.fails)) {
            info.fails.forEach(failEntry => {
              if (!isItemDeleted(failEntry)) {
                const entryId = failEntry.entryId || failEntry.id;
                const matchIndex = historyList.findIndex(h =>
                  (entryId && (h.entryId === entryId || h.id === entryId)) ||
                  (h.caughtKey === caughtKey && h.date === failEntry.date && (h.totalChecks === failEntry.totalChecks || h.checks === failEntry.checks))
                );

                const cleanKey = caughtKey.replace(/:shiny$|-shiny$/, "");
                const monName = failEntry.pokemonName || failEntry.pokemon?.name || cleanKey;
                const checks = Number(failEntry.totalChecks ?? failEntry.checks ?? 0);
                const rawTime = failEntry.elapsedMs ?? failEntry.time ?? 0;
                const timeMs = Number(rawTime > 0 && rawTime < 100000 && !failEntry.elapsedMs ? rawTime * 1000 : rawTime);

                if (matchIndex >= 0) {
                  historyList[matchIndex].addedToLivingDex = true;
                  historyList[matchIndex].caughtKey = caughtKey;
                  historyList[matchIndex].isFail = true;
                  historyList[matchIndex].outcome = "failed";
                } else {
                  historyList.push({
                    ...failEntry,
                    id: failEntry.id || entryId,
                    entryId: entryId || failEntry.id,
                    caughtKey,
                    pokemonName: monName,
                    pokemon: failEntry.pokemon || (monName ? { name: monName } : null),
                    checks,
                    totalChecks: checks,
                    time: timeMs,
                    elapsedMs: timeMs,
                    timestamp: failEntry.timestamp || (failEntry.date ? new Date(failEntry.date).getTime() : 0),
                    addedToLivingDex: true,
                    outcome: "failed",
                    isFail: true
                  });
                }
              }
            });
          }
        });
      }

      // 4. Also scan activeHunts phases for any fails or phases not yet in history
      if (Array.isArray(activeHunts)) {
        activeHunts.forEach(h => {
          if (Array.isArray(h.phases)) {
            h.phases.forEach(p => {
              const pPokemon = p.pokemon || h.pokemon;
              const pPokemonName = p.pokemonName || p.pokemon?.name || h.pokemon?.name;
              const isFail = p.outcome === "failed" || p.isFail;
              if (!isItemDeleted(p) && !historyList.some(e => (e.entryId && e.entryId === p.entryId) || (e.id && e.id === p.id))) {
                historyList.push({
                  ...p,
                  pokemonName: pPokemonName,
                  pokemon: pPokemon,
                  game: p.game || h.game,
                  method: p.method || h.method,
                  outcome: isFail ? "failed" : "caught",
                  isFail,
                  timestamp: p.timestamp || (p.date ? new Date(p.date).getTime() : 0)
                });
              }
            });
          }
        });
      }

      historyList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setHuntHistory(historyList);
    } catch (e) {
      console.error("Failed to load history:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [username, activeHunts]);

  const handleDeleteHistoryEntry = useCallback(async (entryToDelete) => {
    if (!entryToDelete) return;
    const entryId = entryToDelete.entryId || entryToDelete.id;
    const entryTimestamp = entryToDelete.timestamp || (entryToDelete.date ? new Date(entryToDelete.date).getTime() : 0);
    const pokemonName = entryToDelete.pokemonName || entryToDelete.pokemon?.name;

    // 1. Immediately update UI state
    setHuntHistory(prev => prev.filter(e => {
      const eId = e.entryId || e.id;
      if (entryId && eId === entryId) return false;
      if (entryTimestamp && (e.timestamp === entryTimestamp || (e.date && new Date(e.date).getTime() === entryTimestamp))) {
        const name = e.pokemonName || e.pokemon?.name;
        if (name && pokemonName && name.toLowerCase() === pokemonName.toLowerCase()) return false;
      }
      return true;
    }));

    // 2. Add to deleted IDs blacklist
    try {
      const blacklistKey = `deleted_hunt_history_ids:${username || "global"}`;
      const existingBlacklist = JSON.parse(localStorage.getItem(blacklistKey) || "[]");
      const idsToAdd = [entryId, entryToDelete.id, entryToDelete.entryId, entryTimestamp].filter(Boolean).map(String);
      let changed = false;
      idsToAdd.forEach(id => {
        if (!existingBlacklist.includes(id)) {
          existingBlacklist.push(id);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(blacklistKey, JSON.stringify(existingBlacklist));
      }
    } catch {}

    // 3. Clean completed hunts & completed fails in localStorage
    try {
      const storageKey = username ? `completedHunts:${username}` : "completedHunts";
      const failStorageKey = username ? `completedFails:${username}` : "completedFails";

      const cleanStorage = (key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const updated = parsed.filter(e => {
              const eId = e.entryId || e.id;
              if (entryId && eId === entryId) return false;
              if (entryTimestamp && (e.timestamp === entryTimestamp || (e.date && new Date(e.date).getTime() === entryTimestamp))) {
                const name = e.pokemonName || e.pokemon?.name;
                if (name && pokemonName && name.toLowerCase() === pokemonName.toLowerCase()) return false;
              }
              return true;
            });
            localStorage.setItem(key, JSON.stringify(updated));
          }
        } catch {}
      };

      cleanStorage(storageKey);
      cleanStorage(failStorageKey);
      if (username) {
        cleanStorage("completedHunts");
        cleanStorage("completedFails");
      }
    } catch {}

    // 4. Clean from Living Dex caught data
    try {
      const { updateCaughtData } = await import("../api/caught");
      const caughtMapKey = username ? `caughtInfoMap:${username}` : "caughtInfoMap";
      let localMap = {};
      try {
        localMap = JSON.parse(localStorage.getItem(caughtMapKey) || localStorage.getItem("caughtInfoMap") || "{}");
      } catch {}

      Object.entries(localMap).forEach(async ([key, info]) => {
        if (!info) return;
        let modified = false;
        let updatedInfo = { ...info };

        if (Array.isArray(updatedInfo.entries)) {
          const prevLen = updatedInfo.entries.length;
          updatedInfo.entries = updatedInfo.entries.filter(e => {
            const eId = e.entryId || e.id;
            if (entryId && eId === entryId) return false;
            if (entryTimestamp && (e.timestamp === entryTimestamp || (e.date && new Date(e.date).getTime() === entryTimestamp))) return false;
            return true;
          });
          if (updatedInfo.entries.length !== prevLen) modified = true;
        }

        if (Array.isArray(updatedInfo.fails)) {
          const prevLen = updatedInfo.fails.length;
          updatedInfo.fails = updatedInfo.fails.filter(f => {
            const fId = f.entryId || f.id;
            if (entryId && fId === entryId) return false;
            if (entryTimestamp && (f.timestamp === entryTimestamp || (f.date && new Date(f.date).getTime() === entryTimestamp))) return false;
            return true;
          });
          if (updatedInfo.fails.length !== prevLen) modified = true;
        }

        if (modified) {
          localMap[key] = updatedInfo;
          try {
            localStorage.setItem(caughtMapKey, JSON.stringify(localMap));
            localStorage.setItem("caughtInfoMap", JSON.stringify(localMap));
          } catch {}

          if (username) {
            try {
              await updateCaughtData(username, key, updatedInfo);
            } catch {}
          }

          window.dispatchEvent(new CustomEvent("caughtDataChanged", {
            detail: { caughtKey: key, caughtInfo: updatedInfo }
          }));
        }
      });
    } catch (e) {
      console.error("Failed to clean caught data:", e);
    }

    // 5. Clean from active hunts phases
    try {
      setAllActiveHunts(prevHunts => {
        let anyPhaseRemoved = false;
        const nextHunts = prevHunts.map(h => {
          if (!Array.isArray(h.phases) || h.phases.length === 0) return h;
          const prevPhaseCount = h.phases.length;
          let removedChecks = 0;
          const filteredPhases = [];

          h.phases.forEach(p => {
            const pId = p.entryId || p.id;
            const matchesId = entryId && (pId === entryId || String(pId) === String(entryId));
            const matchesTs = entryTimestamp && (
              p.timestamp === entryTimestamp ||
              (p.date && new Date(p.date).getTime() === Number(entryTimestamp))
            );
            if (matchesId || matchesTs) {
              removedChecks += Number(p.phaseChecks ?? p.checks ?? p.count ?? 0) || 0;
            } else {
              filteredPhases.push(p);
            }
          });

          if (filteredPhases.length !== prevPhaseCount) {
            anyPhaseRemoved = true;
            let cumulative = 0;
            const reindexedPhases = filteredPhases.map((p, idx) => {
              const pChecks = Number(p.phaseChecks ?? p.checks ?? p.count ?? 0) || 0;
              cumulative += pChecks;
              return {
                ...p,
                phaseNumber: idx + 1,
                checks: pChecks,
                phaseChecks: pChecks,
                totalChecks: cumulative
              };
            });

            const currentChecks = Number(h.checks ?? 0) || 0;
            const nextChecks = currentChecks + removedChecks;
            const nextTotalChecks = reindexedPhases.length > 0
              ? cumulative + nextChecks
              : Math.max(nextChecks, Number(h.totalChecks ?? 0) || 0);

            return {
              ...h,
              phases: reindexedPhases,
              currentPhase: reindexedPhases.length + 1,
              checks: nextChecks,
              totalChecks: nextTotalChecks,
              metricMode: reindexedPhases.length === 0 ? "total" : (h.metricMode || "phase")
            };
          }
          return h;
        });

        if (anyPhaseRemoved) {
          setCachedHuntsData({ activeHunts: nextHunts });
          debouncedSave(nextHunts);
          try {
            if (channelRef.current) {
              channelRef.current.broadcast({ type: "HUNTS_SYNC", hunts: nextHunts });
            }
          } catch {}
        }
        return nextHunts;
      });
    } catch {}

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
    } catch { }

    if (username) {
      huntAPI.updateHuntData({ activeHunts: updatedHunts, currentHuntId }).catch(() => { });
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
    const handleBeforeUnload = () => {
      autoPauseRunningHunts();
    };

    const handlePageHide = () => {
      autoPauseRunningHunts();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      // Auto-pause when user navigates away to another page in React Router
      autoPauseRunningHunts();
    };
  }, [autoPauseRunningHunts]);

  // ── Canonical Action Handlers ─────────────────────────────────────────────
  const handleAddCheck = (huntId, customDelta = null) => {
    const target = allActiveHunts.find(h => String(h.id) === String(huntId) || String(h.huntId) === String(huntId));
    const delta = customDelta !== null
      ? customDelta
      : (huntIncrements[huntId] || huntIncrements[String(huntId)] || target?.increment || 1);
    const now = Date.now();
    const action = {
      type: "INCREMENT",
      huntId,
      amount: delta,
      timestamp: now
    };

    const nextHunts = applyHuntActionToState(allActiveHunts, action, now);
    setAllActiveHunts(nextHunts);
    setCachedHuntsData({ activeHunts: nextHunts });

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_ACTION",
        huntId,
        action,
        hunts: nextHunts
      });
    }

    debouncedSave(nextHunts);
  };

  const handleDecreaseCheck = (huntId, customDelta = null) => {
    const target = allActiveHunts.find(h => String(h.id) === String(huntId) || String(h.huntId) === String(huntId));
    const delta = customDelta !== null
      ? customDelta
      : (huntIncrements[huntId] || huntIncrements[String(huntId)] || target?.increment || 1);
    const now = Date.now();
    const action = {
      type: "DECREMENT",
      huntId,
      amount: delta,
      timestamp: now
    };

    const nextHunts = applyHuntActionToState(allActiveHunts, action, now);
    setAllActiveHunts(nextHunts);
    setCachedHuntsData({ activeHunts: nextHunts });

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_ACTION",
        huntId,
        action,
        hunts: nextHunts
      });
    }

    debouncedSave(nextHunts);
  };

  const handleTogglePause = (huntId) => {
    const now = Date.now();
    const action = {
      type: "TOGGLE_PAUSE",
      huntId,
      timestamp: now
    };

    const nextHunts = applyHuntActionToState(allActiveHunts, action, now);
    setAllActiveHunts(nextHunts);
    setCachedHuntsData({ activeHunts: nextHunts });

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_ACTION",
        huntId,
        action,
        hunts: nextHunts
      });
    }

    debouncedSave(nextHunts, currentHuntId, true);
  };

  const handleConfirmResetTimer = (huntId) => {
    const now = Date.now();
    const action = {
      type: "RESET_STATS",
      huntId,
      timestamp: now
    };

    const nextHunts = applyHuntActionToState(allActiveHunts, action, now);
    setAllActiveHunts(nextHunts);
    setCachedHuntsData({ activeHunts: nextHunts });
    setResetModal({ show: false, hunt: null });
    showMessage("Hunt timer and stats reset", "success");

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_ACTION",
        huntId,
        action,
        hunts: nextHunts
      });
    }

    debouncedSave(nextHunts, currentHuntId, true);
  };

  const handleSwitchCurrentHunt = (newHuntId) => {
    if (!newHuntId || String(newHuntId) === String(currentHuntId)) return;

    const now = Date.now();
    let updatedHunts = allActiveHunts;
    // Pause any currently running hunts so nothing is left running in Other Hunts
    const runningHunts = allActiveHunts.filter(h => h.status === "running" || (!h.isPaused && h.status !== "paused"));

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

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "CURRENT_HUNT_CHANGED",
        currentHuntId: newHuntId,
        hunt: updatedHunts.find(h => String(h.id) === String(newHuntId))
      });
    }

    debouncedSave(updatedHunts, newHuntId);
  };

  // ── Hotkey Helpers & Validation ──────────────────────────────────────────
  const DISALLOWED_HOTKEYS = useMemo(() => new Set([
    "Escape",
    "Tab",
    "Meta",
    "OS",
    "Alt",
    "Control",
    "Shift",
    "CapsLock",
    "ContextMenu",
    "Unidentified",
    "NumLock",
    "ScrollLock",
    "Pause",
    "PrintScreen"
  ]), []);

  const formatHotkeyLabel = useCallback((key) => {
    if (!key) return "NONE";
    if (key === " " || key.toLowerCase() === "space") return "SPACE";
    if (key === "ArrowUp") return "↑ UP";
    if (key === "ArrowDown") return "↓ DOWN";
    if (key === "ArrowLeft") return "← LEFT";
    if (key === "ArrowRight") return "→ RIGHT";
    if (key === "Enter") return "ENTER";
    if (key === "Backspace") return "BACKSPACE";
    if (key === "+") return "+";
    if (key === "-") return "−";
    if (key.length === 1) return key.toUpperCase();
    return key.toUpperCase();
  }, []);

  const isKeyMatch = useCallback((e, targetKey) => {
    if (!targetKey) return false;
    if (targetKey === " " && (e.code === "Space" || e.key === " " || e.key === "Spacebar")) return true;
    if (targetKey === "+" && (e.key === "+" || e.key === "Add" || e.code === "NumpadAdd" || (e.key === "=" && e.shiftKey))) return true;
    if (targetKey === "-" && (e.key === "-" || e.key === "Subtract" || e.code === "NumpadSubtract" || e.code === "Minus")) return true;
    if (e.key.toLowerCase() === targetKey.toLowerCase()) return true;
    if (e.code.toLowerCase() === targetKey.toLowerCase()) return true;
    return false;
  }, []);

  const normalizeAssignedKey = useCallback((e) => {
    if (e.code === "Space" || e.key === " " || e.key === "Spacebar") return " ";
    if (e.key === "+" || e.code === "NumpadAdd") return "+";
    if (e.key === "-" || e.code === "NumpadSubtract") return "-";
    if (e.key.length === 1) return e.key.toLowerCase();
    return e.key;
  }, []);

  // ── Hotkey Recording Listener (in Modal) ──────────────────────────────────
  useEffect(() => {
    if (!hotkeyModal || !listeningFor) return;

    const handleCaptureKey = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setListeningFor(null);
        setHotkeyError("");
        return;
      }

      if (DISALLOWED_HOTKEYS.has(e.key)) {
        setHotkeyError(`The key "${e.key}" cannot be used as a hotkey. Please press a letter, number, arrow key, symbol, or Spacebar.`);
        return;
      }

      const assigned = normalizeAssignedKey(e);
      const otherKey = listeningFor === "increment" ? decrementHotkey : hotkey;

      if (otherKey && (assigned === otherKey || (assigned.length === 1 && otherKey.length === 1 && assigned.toLowerCase() === otherKey.toLowerCase()))) {
        setHotkeyError(`"${formatHotkeyLabel(assigned)}" is already assigned to the other action. Please pick a different key.`);
        return;
      }

      if (listeningFor === "increment") {
        setHotkey(assigned);
        try { localStorage.setItem("huntHotkey", assigned); } catch {}
        profileAPI.updateProfile({ huntHotkey: assigned }).catch(() => {});
        showMessage(`Increment hotkey (+) set to ${formatHotkeyLabel(assigned)}`, "success");
      } else {
        setDecrementHotkey(assigned);
        try { localStorage.setItem("huntDecrementHotkey", assigned); } catch {}
        profileAPI.updateProfile({ huntDecrementHotkey: assigned }).catch(() => {});
        showMessage(`Decrement hotkey (−) set to ${formatHotkeyLabel(assigned)}`, "success");
      }

      setListeningFor(null);
      setHotkeyError("");
    };

    window.addEventListener("keydown", handleCaptureKey, true);
    return () => window.removeEventListener("keydown", handleCaptureKey, true);
  }, [hotkeyModal, listeningFor, hotkey, decrementHotkey, DISALLOWED_HOTKEYS, normalizeAssignedKey, formatHotkeyLabel, showMessage]);

  // ── Global Hotkey Listener (Encounter Trigger) ───────────────────────────
  useEffect(() => {
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
        abandonHuntModal.show ||
        oddsModal.show ||
        resetModal.show ||
        deleteModal.show ||
        settingsModal.show ||
        editModal.show ||
        hotkeyModal ||
        showHistoryModal ||
        deleteHistoryModal.show ||
        clearAllHistoryModal
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
    hotkey,
    decrementHotkey,
    currentHunt,
    activeHunts,
    huntWizard.isOpen,
    shinyEncounterModal.show,
    phaseHistoryModal.show,
    abandonHuntModal.show,
    oddsModal.show,
    resetModal.show,
    deleteModal.show,
    settingsModal.show,
    editModal.show,
    hotkeyModal,
    showHistoryModal,
    deleteHistoryModal.show,
    clearAllHistoryModal,
    isKeyMatch
  ]);

  // ── Start Wizard Hunt Handler ─────────────────────────────────────────────
  const handleStartWizardHunt = () => {
    if (!huntWizard.selectedPokemon) return;
    const game = huntWizard.game || "Scarlet";
    const method = huntWizard.method || "Mass Outbreaks";
    const odds = calculateOdds(game, method, huntWizard.modifiers);
    const now = Date.now();
    const startChecks = Math.max(0, parseInt(huntWizard.startingChecks, 10) || 0);
    const huntIncrement = Math.max(1, parseInt(huntWizard.increment, 10) || 1);

    const startH = Math.max(0, parseInt(huntWizard.startHours, 10) || 0);
    const startM = Math.max(0, parseInt(huntWizard.startMinutes, 10) || 0);
    const startS = Math.max(0, parseInt(huntWizard.startSeconds, 10) || 0);
    let startElapsedMs = ((startH * 3600) + (startM * 60) + startS) * 1000;

    const estimatedPaceSec = parseFloat(huntWizard.estimatedPaceSec) || 0;
    if (startElapsedMs === 0 && startChecks > 0 && estimatedPaceSec > 0) {
      startElapsedMs = Math.round(startChecks * estimatedPaceSec * 1000);
    }

    const startedAt = now - startElapsedMs;

    let initialStats = {};
    if (estimatedPaceSec > 0) {
      initialStats = {
        lastIntervalSec: estimatedPaceSec,
        fastestIntervalSec: estimatedPaceSec,
        recentIntervals: [estimatedPaceSec],
        last10AvgSec: estimatedPaceSec
      };
    } else if (startChecks > 0 && startElapsedMs > 0) {
      const avgPace = parseFloat((startElapsedMs / 1000 / startChecks).toFixed(1));
      initialStats = {
        lastIntervalSec: avgPace,
        fastestIntervalSec: avgPace,
        recentIntervals: [avgPace],
        last10AvgSec: avgPace
      };
    }

    const newHunt = normalizeHunt({
      id: now,
      huntId: now,
      pokemon: huntWizard.selectedPokemon,
      game,
      method,
      ball: "",
      mark: "",
      notes: huntWizard.targetPhasesNotes || "",
      checks: startChecks,
      odds,
      startDate: new Date().toISOString(),
      startedAt,
      startTime: startedAt,
      pausedAt: now,
      totalPausedMs: 0,
      elapsedMs: startElapsedMs,
      status: "paused",
      isPaused: true,
      increment: huntIncrement,
      currentPhase: 1,
      phases: [],
      possiblePhases: huntWizard.possiblePhases || [],
      allowAnyPhase: huntWizard.allowAnyPhase !== false,
      fails: [],
      modifiers: { ...huntWizard.modifiers },
      stats: initialStats,
      version: 1,
      updatedAt: now
    }, now);

    // Pause any previously running hunts so nothing is left running in Other Hunts
    let normalizedActiveHunts = allActiveHunts;
    const runningHunts = allActiveHunts.filter(h => h.status === "running" || (!h.isPaused && h.status !== "paused"));
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
    const updatedIncrements = { ...huntIncrements, [now]: huntIncrement, [String(now)]: huntIncrement };

    try {
      localStorage.setItem("dex_hunt_increments", JSON.stringify(updatedIncrements));
    } catch {}

    setAllActiveHunts(updatedHunts);
    setCurrentHuntId(now);
    setHuntIncrements(updatedIncrements);
    setCachedHuntsData({ activeHunts: updatedHunts });

    setHuntWizard(prev => ({ ...prev, isOpen: false }));
    showMessage(`Started hunting shiny ${formatPokemonName(huntWizard.selectedPokemon.name)}! (Paused)`, "success");

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_UPDATED",
        hunt: newHunt
      });
    }

    debouncedSave(updatedHunts);
  };

  // ── Unified Shiny Encounter & Phase System ───────────────────────────────
  const handleOpenShinyEncounterModal = (hunt) => {
    if (!hunt) return;

    // Immediately pause active hunt time, pace, and encounters in the background
    let activeHuntObj = hunt;
    if (hunt.status === "running" || (!hunt.isPaused && hunt.status !== "paused")) {
      const now = Date.now();
      const action = { type: "PAUSE", huntId: hunt.id, timestamp: now };
      const nextHunts = applyHuntActionToState(allActiveHunts, action, now);
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
    setOpenMenuHuntId(null);
  };

  const handleSelectShinyPokemon = (pokemon, isTargetOverride) => {
    const hunt = shinyEncounterModal.hunt;
    if (!hunt || !pokemon) return;
    const isTarget = isTargetOverride !== undefined
      ? isTargetOverride
      : ((pokemon.stableId || pokemon.id) === (hunt.pokemon?.stableId || hunt.pokemon?.id));

    setShinyEncounterModal(prev => ({
      ...prev,
      selectedPokemon: pokemon,
      isTarget,
      step: 2
    }));
  };

  const handleConfirmShinyOutcome = (outcome) => {
    const hunt = shinyEncounterModal.hunt;
    if (!hunt || !shinyEncounterModal.selectedPokemon) return;

    const isTarget = shinyEncounterModal.isTarget;
    const selectedPokemon = shinyEncounterModal.selectedPokemon;
    const now = Date.now();
    const totalElapsedMs = getHuntElapsedTime(hunt);

    const phases = hunt.phases || [];
    const lastPhase = phases.length > 0 ? phases[phases.length - 1] : null;
    const lastTotalChecks = lastPhase
      ? (lastPhase.totalChecks !== undefined ? lastPhase.totalChecks : (lastPhase.phaseChecks || lastPhase.checks || 0))
      : 0;

    const currentChecks = hunt.checks || 0;

    let totalOverallChecks = currentChecks;
    let intervalChecks = currentChecks;

    if (lastPhase) {
      if (currentChecks >= lastTotalChecks) {
        // Continuous counter (e.g. 10 -> 20 on subsequent target fail)
        totalOverallChecks = currentChecks;
        intervalChecks = currentChecks - lastTotalChecks;
      } else {
        // Phased counter (e.g. 0 -> 10 after phase caught)
        totalOverallChecks = lastTotalChecks + currentChecks;
        intervalChecks = currentChecks;
      }
    } else {
      totalOverallChecks = currentChecks;
      intervalChecks = currentChecks;
    }

    const dynamicOddsNum = getCurrentHuntOdds(hunt.game, hunt.method, hunt.modifiers || {}, intervalChecks || currentChecks);
    const nonTargetCount = (phases.filter(p => !p.isTarget)?.length || 0) + (!isTarget ? 1 : 0);
    const targetFailCount = (phases.filter(p => p.isTarget && p.outcome === "failed")?.length || 0) + (isTarget && outcome === "failed" ? 1 : 0);
    const phaseNumber = !isTarget ? nonTargetCount : targetFailCount;

    if (outcome === "caught") {
      const rawNickname = (shinyEncounterModal.nickname || "").trim();
      const rawNotes = (shinyEncounterModal.notes || "").trim();

      if (rawNickname) {
        const nicknameValidation = validateContent(rawNickname, "nickname");
        if (!nicknameValidation.isValid) {
          showMessage(nicknameValidation.error, "error");
          return;
        }
      }

      if (rawNotes) {
        const notesValidation = validateContent(rawNotes, "notes");
        if (!notesValidation.isValid) {
          showMessage(notesValidation.error, "error");
          return;
        }
      }
    }

    const uniquePhaseEntryId = Math.random().toString(36).substr(2, 9);
    const phaseRecord = {
      id: now,
      entryId: uniquePhaseEntryId,
      phaseNumber,
      pokemon: selectedPokemon,
      pokemonName: selectedPokemon?.name || "Unknown",
      isTarget,
      outcome, // "caught" | "failed"
      phaseChecks: Math.max(0, intervalChecks),
      totalChecks: totalOverallChecks,
      elapsedMs: totalElapsedMs,
      odds: dynamicOddsNum,
      game: hunt.game,
      method: hunt.method,
      modifiers: { ...(hunt.modifiers || {}) },
      nickname: outcome === "caught" ? (shinyEncounterModal.nickname || "").trim() : "",
      ball: outcome === "caught" ? (shinyEncounterModal.ball || "") : "",
      mark: outcome === "caught" ? (shinyEncounterModal.mark || "") : "",
      notes: shinyEncounterModal.notes || "",
      date: new Date().toISOString(),
      timestamp: now,
      addedToCollection: false
    };

    setShinyEncounterModal(prev => ({
      ...prev,
      outcome,
      phaseResult: phaseRecord,
      step: 3
    }));
  };

  const handleAddShinyToCollection = async (pokemon, phaseRecord, huntParam = null, silent = false) => {
    const hunt = huntParam || shinyEncounterModal.hunt;
    if (!hunt || !pokemon || !phaseRecord || phaseRecord.outcome === "failed") return false;

    // Resolve canonical Pokémon object from dataset to ensure clean, accurate stableId
    const isFormPokemon = pokemon.formType && pokemon.formType !== "main";
    const canonicalForm = isFormPokemon
      ? formsData.find(f => (f.stableId && f.stableId === pokemon.stableId) || (f.id === pokemon.id && f.name?.toLowerCase() === pokemon.name?.toLowerCase()) || (f.id === pokemon.id && f.formType === pokemon.formType))
      : null;
    const canonicalBase = pokemonData.find(p => p.id === pokemon.id && (!pokemon.name || p.name?.toLowerCase() === pokemon.name?.toLowerCase()));

    const workingPokemon = canonicalForm || canonicalBase || (findPokemon(pokemon.id, pokemon.name) || pokemon);
    const caughtKey = getCaughtKey(workingPokemon, null, true);

    if (!caughtKey) {
      console.error("Failed to determine caughtKey for", workingPokemon);
      if (!silent) {
        showMessage("Could not save to Living Dex: unknown Pokémon key", "error");
      }
      return false;
    }

    const caughtEntry = {
      date: new Date().toISOString().split("T")[0],
      pokemon: workingPokemon,
      pokemonName: workingPokemon?.name || "Unknown",
      nickname: phaseRecord.nickname || (shinyEncounterModal.nickname || "").trim(),
      ball: phaseRecord.ball || shinyEncounterModal.ball || "",
      mark: phaseRecord.mark || shinyEncounterModal.mark || "",
      game: hunt.game,
      method: hunt.method,
      checks: phaseRecord.phaseChecks || 0,
      totalChecks: phaseRecord.totalChecks || 0,
      time: phaseRecord.elapsedMs || 0,
      odds: (phaseRecord.odds && phaseRecord.odds !== 4096)
        || (hunt.odds && hunt.odds !== 4096)
        || calculateOdds(hunt.game, hunt.method, hunt.modifiers || {})
        || phaseRecord.odds
        || hunt.odds
        || 4096,
      phases: hunt.phases || [],
      fails: [
        ...((hunt.phases || []).filter(p => p.outcome === "failed")),
        ...(phaseRecord.outcome === "failed" ? [phaseRecord] : [])
      ],
      phaseCount: phaseRecord.phaseNumber || (hunt.phases ? hunt.phases.length + 1 : 1),
      notes: phaseRecord.notes || shinyEncounterModal.notes || "",
      entryId: Math.random().toString(36).substr(2, 9),
      modifiers: hunt.modifiers || {},
      chartData: hunt.chartData || phaseRecord.chartData || {},
      chartConfig: hunt.chartConfig || phaseRecord.chartConfig || {},
      isHuntTracker: true
    };

    if (caughtEntry.nickname) {
      const nickVal = validateContent(caughtEntry.nickname, "nickname");
      if (!nickVal.isValid) {
        if (!silent) showMessage(nickVal.error, "error");
        return false;
      }
    }
    if (caughtEntry.notes) {
      const noteVal = validateContent(caughtEntry.notes, "notes");
      if (!noteVal.isValid) {
        if (!silent) showMessage(noteVal.error, "error");
        return false;
      }
    }

    try {
      const { fetchCaughtData, updateCaughtData } = await import("../api/caught");
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

      try {
        const existing = JSON.parse(sessionStorage.getItem('recentCatchOrder') || '[]');
        const updated = [
          { stableId: workingPokemon.stableId, isShiny: true },
          ...existing.filter(c => !(c.stableId === workingPokemon.stableId && c.isShiny === true))
        ].slice(0, 5);
        sessionStorage.setItem('recentCatchOrder', JSON.stringify(updated));
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
      if (!silent) {
        showMessage(`Added Shiny ${formatPokemonName(workingPokemon.name)} to your Living Dex!`, "success");
      }
      return true;
    } catch (e) {
      console.error("Failed to save shiny to collection:", e);
      if (!silent) {
        showMessage("Failed to save to Living Dex", "error");
      }
      return false;
    }
  };

  const handleAddShinyFailToCollection = async (pokemon, phaseRecord, huntParam = null) => {
    const hunt = huntParam || shinyEncounterModal.hunt;
    if (!hunt || !pokemon || !phaseRecord) return false;

    // Resolve canonical Pokémon object from dataset to ensure clean, accurate stableId
    const isFormPokemon = pokemon.formType && pokemon.formType !== "main";
    const canonicalForm = isFormPokemon
      ? formsData.find(f => (f.stableId && f.stableId === pokemon.stableId) || (f.id === pokemon.id && f.name?.toLowerCase() === pokemon.name?.toLowerCase()) || (f.id === pokemon.id && f.formType === pokemon.formType))
      : null;
    const canonicalBase = pokemonData.find(p => p.id === pokemon.id && (!pokemon.name || p.name?.toLowerCase() === pokemon.name?.toLowerCase()));

    const workingPokemon = canonicalForm || canonicalBase || (findPokemon(pokemon.id, pokemon.name) || pokemon);
    const caughtKey = getCaughtKey(workingPokemon, null, true);

    if (!caughtKey) {
      console.error("Failed to determine caughtKey for", workingPokemon);
      showMessage("Could not save to Living Dex: unknown Pokémon key", "error");
      return false;
    }

    const failEntry = {
      date: phaseRecord.date ? phaseRecord.date.split("T")[0] : new Date().toISOString().split("T")[0],
      pokemon: workingPokemon,
      pokemonName: workingPokemon?.name || "Unknown",
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
      entryId: phaseRecord.entryId || phaseRecord.id || Math.random().toString(36).substr(2, 9),
      chartData: hunt.chartData || phaseRecord.chartData || {},
      chartConfig: hunt.chartConfig || phaseRecord.chartConfig || {},
      isHuntTracker: true
    };

    if (failEntry.notes) {
      const noteVal = validateContent(failEntry.notes, "notes");
      if (!noteVal.isValid) {
        showMessage(noteVal.error, "error");
        return false;
      }
    }

    try {
      const { fetchCaughtData, updateCaughtData } = await import("../api/caught");
      const existingData = await fetchCaughtData(username);
      const existingInfo = existingData[caughtKey] || null;
      const isAlreadyCaught = !!(existingInfo && existingInfo.caught !== false && (existingInfo.entries?.length > 0 || existingInfo.caught === true));

      const existingFails = Array.isArray(existingInfo?.fails) ? existingInfo.fails : [];
      const updatedInfo = {
        ...(existingInfo || {}),
        caught: isAlreadyCaught, // Uncaught remains false!
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

        // If not already caught, ensure local 'caught' map does NOT mark it as caught
        if (!isAlreadyCaught) {
          const localCaught = JSON.parse(localStorage.getItem("caught") || "{}");
          if (localCaught[caughtKey]) {
            delete localCaught[caughtKey];
            localStorage.setItem("caught", JSON.stringify(localCaught));
          }
        }
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
  };

  const handleContinueAfterPhase = (phaseRecord) => {
    const hunt = shinyEncounterModal.hunt;
    if (!hunt || !phaseRecord) return;
    const now = Date.now();

    const phasePokemon = phaseRecord.pokemon || hunt.pokemon;
    const phasePokemonName = phasePokemon?.name || phaseRecord.pokemonName || "Unknown";

    const action = {
      type: "LOG_SHINY_PHASE",
      huntId: hunt.id,
      phaseEvent: phaseRecord,
      timestamp: now
    };

    const updatedHunts = applyHuntActionToState(allActiveHunts, action, now);
    setAllActiveHunts(updatedHunts);
    setCachedHuntsData({ activeHunts: updatedHunts });

    const effectiveModifiers = hunt.modifiers || phaseRecord.modifiers || {};
    const resolvedOdds = (phaseRecord.odds && phaseRecord.odds !== 4096)
      || (hunt.odds && hunt.odds !== 4096)
      || calculateOdds(hunt.game, hunt.method, effectiveModifiers)
      || phaseRecord.odds
      || hunt.odds
      || 4096;

    if (phaseRecord.outcome === "failed") {
      const failEntry = {
        id: phaseRecord.id || now,
        entryId: phaseRecord.entryId || phaseRecord.id || Math.random().toString(36).substr(2, 9),
        pokemon: phasePokemon,
        pokemonName: phasePokemonName,
        game: hunt.game,
        method: hunt.method,
        checks: phaseRecord.phaseChecks || 0,
        totalChecks: phaseRecord.totalChecks || hunt.checks || 0,
        elapsedMs: phaseRecord.elapsedMs || 0,
        time: phaseRecord.elapsedMs || 0,
        odds: resolvedOdds,
        modifiers: effectiveModifiers,
        reason: phaseRecord.reason || (phaseRecord.notes || "").trim() || "Failed Encounter",
        notes: phaseRecord.notes || (phaseRecord.notes || "").trim() || "",
        date: phaseRecord.date || new Date().toISOString(),
        timestamp: now,
        outcome: "failed",
        isFail: true,
        chartData: hunt.chartData || phaseRecord.chartData || {},
        chartConfig: hunt.chartConfig || phaseRecord.chartConfig || {},
        isHuntTracker: true,
        addedToLivingDex: Boolean(phaseRecord.addedToCollection)
      };

      try {
        const storageKey = username ? `completedFails:${username}` : "completedFails";
        const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const updated = [failEntry, ...existing.filter(e => e.entryId !== failEntry.entryId)];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        if (username) {
          localStorage.setItem("completedFails", JSON.stringify(updated));
        }
        setHuntHistory(prev => [failEntry, ...prev.filter(e => e.entryId !== failEntry.entryId)]);
      } catch {}
    } else {
      // Non-target / target phase caught and continuing hunt
      const completedPhaseEntry = {
        id: phaseRecord.id || now,
        entryId: phaseRecord.entryId || Math.random().toString(36).substr(2, 9),
        pokemon: phasePokemon,
        pokemonName: phasePokemonName,
        game: hunt.game,
        method: hunt.method,
        checks: phaseRecord.phaseChecks || 0,
        totalChecks: phaseRecord.totalChecks || hunt.checks || 0,
        elapsedMs: phaseRecord.elapsedMs || 0,
        time: phaseRecord.elapsedMs || 0,
        odds: resolvedOdds,
        modifiers: effectiveModifiers,
        nickname: phaseRecord.nickname || "",
        ball: phaseRecord.ball || "",
        mark: phaseRecord.mark || "",
        notes: phaseRecord.notes || "",
        date: phaseRecord.date || new Date().toISOString(),
        timestamp: now,
        outcome: "caught",
        isFail: false,
        isPhase: true,
        targetPokemon: hunt.pokemon,
        chartData: hunt.chartData || phaseRecord.chartData || {},
        chartConfig: hunt.chartConfig || phaseRecord.chartConfig || {},
        isHuntTracker: true,
        addedToLivingDex: Boolean(phaseRecord.addedToCollection)
      };

      try {
        const storageKey = username ? `completedHunts:${username}` : "completedHunts";
        const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const updated = [completedPhaseEntry, ...existing.filter(e => e.entryId !== completedPhaseEntry.entryId)];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        if (username) {
          localStorage.setItem("completedHunts", JSON.stringify(updated));
        }
        setHuntHistory(prev => [completedPhaseEntry, ...prev.filter(e => e.entryId !== completedPhaseEntry.entryId)]);
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
  };

  const handleCompleteTargetHunt = async (hunt, phaseRecord) => {
    if (!hunt || !phaseRecord) return;
    const workingPokemon = phaseRecord?.pokemon || hunt.pokemon;
    const huntId = hunt.id;

    const effectiveModifiers = hunt.modifiers || phaseRecord.modifiers || {};
    const calculatedOdds = (phaseRecord.odds && phaseRecord.odds !== 4096)
      || (hunt.odds && hunt.odds !== 4096)
      || calculateOdds(hunt.game, hunt.method, effectiveModifiers)
      || phaseRecord.odds
      || hunt.odds
      || 4096;

    const isFail = phaseRecord.outcome === "failed";

    // Archive completed hunt into persistent history
    const completedEntry = {
      id: Date.now(),
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
      modifiers: effectiveModifiers,
      phases: hunt.phases || [],
      phaseCount: (hunt.phases ? hunt.phases.length + 1 : 1),
      nickname: (phaseRecord.nickname || shinyEncounterModal.nickname || "").trim(),
      ball: phaseRecord.ball || shinyEncounterModal.ball || "",
      mark: phaseRecord.mark || shinyEncounterModal.mark || "",
      notes: phaseRecord.notes || (shinyEncounterModal.notes || "").trim(),
      date: new Date().toISOString(),
      timestamp: Date.now(),
      outcome: isFail ? "failed" : "caught",
      isFail,
      addedToLivingDex: Boolean(shinyEncounterModal.addedToCollection),
      chartData: hunt.chartData || phaseRecord.chartData || {},
      chartConfig: hunt.chartConfig || phaseRecord.chartConfig || {},
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

    // Cleanup from active hunts
    const nextHunts = allActiveHunts.filter(h => String(h.id) !== String(huntId));
    const nextStandard = nextHunts.filter(h => !(h.game === "Legends Arceus" && h.method === "Permutations"));
    const nextCurrentId = String(currentHuntId) === String(huntId) ? (nextStandard[0]?.id || null) : currentHuntId;

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
      phaseResult: null
    });

    showMessage(`Completed Hunt for Shiny ${formatPokemonName(workingPokemon.name)} in ${phaseRecord.totalChecks.toLocaleString()} checks!`, "success");

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_ACTION",
        huntId,
        action: { type: "DELETE", huntId, timestamp: Date.now() }
      });
    }

    debouncedSave(nextHunts, nextCurrentId);
  };

  const handleEndHuntWithoutTarget = (hunt) => {
    if (!hunt) return;
    const huntId = hunt.id;
    const nextHunts = allActiveHunts.filter(h => String(h.id) !== String(huntId));
    const nextStandard = nextHunts.filter(h => !(h.game === "Legends Arceus" && h.method === "Permutations"));
    const nextCurrentId = String(currentHuntId) === String(huntId) ? (nextStandard[0]?.id || null) : currentHuntId;

    setAllActiveHunts(nextHunts);
    setCurrentHuntId(nextCurrentId);
    try {
      if (nextCurrentId != null) localStorage.setItem("currentHuntId", String(nextCurrentId));
      else localStorage.removeItem("currentHuntId");
    } catch {}

    setCachedHuntsData({ activeHunts: nextHunts });
    setAbandonHuntModal({ show: false, hunt: null });
    setOpenMenuHuntId(null);
    showMessage(`Ended hunt for ${formatPokemonName(hunt.pokemon?.name)}.`, "info");

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_ACTION",
        huntId,
        action: { type: "DELETE", huntId, timestamp: Date.now() }
      });
    }

    debouncedSave(nextHunts, nextCurrentId);
  };

  // ── Delete Hunt ───────────────────────────────────────────────────────────
  const handleDeleteHunt = (huntId) => {
    const nextHunts = allActiveHunts.filter(h => String(h.id) !== String(huntId));
    const nextStandard = nextHunts.filter(h => !(h.game === "Legends Arceus" && h.method === "Permutations"));
    const nextCurrentId = String(currentHuntId) === String(huntId) ? (nextStandard[0]?.id || null) : currentHuntId;

    setAllActiveHunts(nextHunts);
    setCurrentHuntId(nextCurrentId);
    try {
      if (nextCurrentId != null) localStorage.setItem("currentHuntId", String(nextCurrentId));
      else localStorage.removeItem("currentHuntId");
    } catch {}

    setCachedHuntsData({ activeHunts: nextHunts });
    setDeleteModal({ show: false, hunt: null });
    setOpenMenuHuntId(null);
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
  };

  // ── Popout Window ─────────────────────────────────────────────────────────
  const handleOpenPopout = (hunt) => {
    setOpenMenuHuntId(null);
    const w = 540;
    const h = 530;
    const left = Math.max(0, Math.floor(window.screen.width / 2 - w / 2));
    const top = Math.max(0, Math.floor(window.screen.height / 2 - h / 2));
    window.open(`/hunt-popout/${hunt.id}`, `hunt_popout_${hunt.id}`, `width=${w},height=${h},top=${top},left=${left},resizable=yes`);
  };

  // Available games / ball options
  const gameBallOptions = useMemo(() => {
    const game = shinyEncounterModal.hunt?.game || huntWizard.game || "Scarlet";
    const validNames = getValidBallNamesForGame(game);
    if (validNames?.length) {
      return BALL_OPTIONS.filter(b => b.value === "" || validNames.includes(b.value));
    }
    return BALL_OPTIONS;
  }, [shinyEncounterModal.hunt, huntWizard.game]);

  // ── Dynamic Modifiers Form Helper ─────────────────────────────────────────
  const renderModifiersForm = (selectedGame, selectedMethod, currentMods, setMods) => {
    if (!selectedGame) return null;

    const availableMods = getModifiersForGame(selectedGame) || {};
    const hasGameCharm = !!(availableMods["Shiny Charm"] && availableMods["Shiny Charm"] > 0);
    const isSV = selectedGame === "Scarlet" || selectedGame === "Violet";
    const isLetsGo = selectedGame === "Let's Go Pikachu" || selectedGame === "Let's Go Eevee";
    const isPLA = selectedGame === "Legends Arceus";
    const isGen2Breeding = (selectedGame === "Gold" || selectedGame === "Silver" || selectedGame === "Crystal") && selectedMethod === "Breeding";
    const isGO = selectedGame === "Pokemon GO" || selectedGame === "Pokémon GO" || selectedGame === "GO";

    // Method exemptions where Shiny Charm does not apply
    const isLetsGoCharmExempt = isLetsGo && (selectedMethod === "Fossil Revivals" || selectedMethod === "Gift Pokemon");
    const isSwShCharmExempt = (selectedGame === "Sword" || selectedGame === "Shield") && (selectedMethod === "Fossil Revivals" || selectedMethod === "Gift Pokemon" || selectedMethod === "Dynamax Raids");
    const isBDSPCharmExempt = (selectedGame === "Brilliant Diamond" || selectedGame === "Shining Pearl") && (selectedMethod === "Random Encounters" || selectedMethod === "Poke Radar" || selectedMethod === "Soft Resets" || selectedMethod === "Fossil Revivals" || selectedMethod === "Gift Pokemon" || selectedMethod === "Underground Diglett Hunt");
    const isSVCharmExempt = isSV && selectedMethod === "Tera Raids";
    const isUSUMCharmExempt = (selectedGame === "Ultra Sun" || selectedGame === "Ultra Moon") && selectedMethod === "Ultra Wormholes";
    const isXYCharmExempt = (selectedGame === "X" || selectedGame === "Y") && selectedMethod === "Poke Radar";
    const isZACharmExempt = selectedGame === "Legends Z-A" && selectedMethod === "Fossil Revivals";

    const isMethodCharmExempt = isLetsGoCharmExempt || isSwShCharmExempt || isBDSPCharmExempt || isSVCharmExempt || isUSUMCharmExempt || isXYCharmExempt || isZACharmExempt;
    const hasCharm = hasGameCharm && !isMethodCharmExempt;

    // Lure in Let's Go only applies to Catch Combo and Random Encounters (cannot be used on Soft Resets, Fossil Revivals, or Gift Pokemon)
    const isLetsGoLure = isLetsGo && (selectedMethod === "Catch Combo" || selectedMethod === "Random Encounters");

    const currentSparklingLevel = currentMods.sparklingLv3 ? 3 : currentMods.sparklingLv2 ? 2 : currentMods.sparklingLv1 ? 1 : 0;

    return (
      <div className="space-y-3">
        <label className="hunt-modal-label font-bold text-[var(--text)]">
          Active Modifiers & Boosts
        </label>

        <div className="hunt-modifiers-box space-y-3">
          {/* 1. Shiny Charm Toggle or No Shiny Charm Notice */}
          {hasCharm ? (
            <button
              type="button"
              className={`modifier-select-btn ${currentMods.shinyCharm ? "is-active" : ""}`}
              onClick={() => setMods(prev => {
                const nextCharm = !prev.shinyCharm;
                return {
                  ...prev,
                  shinyCharm: nextCharm,
                  ...(isPLA && nextCharm ? { researchLv10: true } : {})
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
          ) : hasGameCharm && isMethodCharmExempt ? (
            <div className="flex items-center gap-2 px-1 py-0.5 text-xs text-gray-300 font-medium">
              <Info size={16} className="text-[var(--accent)] shrink-0" strokeWidth={2.5} />
              <span>Shiny Charm does not affect {selectedMethod || "this method"}.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-1 py-0.5 text-xs text-gray-300 font-medium">
              <Info size={16} className="text-[var(--accent)] shrink-0" strokeWidth={2.5} />
              <span>This game does not have a Shiny Charm.</span>
            </div>
          )}

          {/* 2. Scarlet / Violet Sparkling Power */}
          {isSV && (
            <div className="sparkling-power-card">
              <div className="sparkling-power-header">
                <span className="sparkling-power-title">
                  <img src="/modifier_images/sandwich.png" alt="" className="w-5 h-5 object-contain shrink-0" />
                  <span>Sparkling Power Sandwich</span>
                </span>
                <span className="sparkling-power-badge">
                  {currentSparklingLevel === 0 ? "Off" : `Level ${currentSparklingLevel}`}
                </span>
              </div>
              <div className="sparkling-level-stepper">
                {[
                  { level: 0, label: "Off" },
                  { level: 1, label: "Lv 1" },
                  { level: 2, label: "Lv 2" },
                  { level: 3, label: "Lv 3" }
                ].map(({ level, label }) => (
                  <button
                    key={level}
                    type="button"
                    className={`sparkling-level-tab ${currentSparklingLevel === level ? "is-active" : ""}`}
                    onClick={() => {
                      setMods(prev => ({
                        ...prev,
                        sparklingLv1: level === 1,
                        sparklingLv2: level === 2,
                        sparklingLv3: level === 3
                      }));
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Event Outbreak Boost */}
          {isSV && selectedMethod === "Mass Outbreaks" && (
            <button
              type="button"
              className={`modifier-select-btn ${currentMods.eventBoosted ? "is-active" : ""}`}
              onClick={() => setMods(prev => ({ ...prev, eventBoosted: !prev.eventBoosted }))}
            >
              <span className="modifier-btn-left">
                <img src="/modifier_images/eventboosted.png" alt="" className="w-5 h-5 object-contain shrink-0" />
                <span>Event Outbreak Boost (+1 Roll)</span>
              </span>
              <span className="modifier-btn-status">
                {currentMods.eventBoosted ? "Active ✓" : "Off"}
              </span>
            </button>
          )}

          {/* 4. Let's Go Lure */}
          {isLetsGoLure && (
            <button
              type="button"
              className={`modifier-select-btn ${currentMods.lureActive ? "is-active" : ""}`}
              onClick={() => setMods(prev => ({ ...prev, lureActive: !prev.lureActive }))}
            >
              <span className="modifier-btn-left">
                <img src="/modifier_images/lure.png" alt="" className="w-5 h-5 object-contain shrink-0" />
                <span>Active Lure (+1 Roll)</span>
              </span>
              <span className="modifier-btn-status">
                {currentMods.lureActive ? "Active ✓" : "Off"}
              </span>
            </button>
          )}

          {/* 5. Legends Arceus Research */}
          {isPLA && (
            <>
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
            </>
          )}

          {/* 6. Gen 2 Shiny Parents */}
          {isGen2Breeding && (
            <button
              type="button"
              className={`modifier-select-btn ${currentMods.shinyParents ? "is-active" : ""}`}
              onClick={() => setMods(prev => ({ ...prev, shinyParents: !prev.shinyParents }))}
            >
              <span className="modifier-btn-left">
                <img src="/modifier_images/shinyparents.png" alt="" className="w-5 h-5 object-contain shrink-0" />
                <span>Shiny Parent (1/64)</span>
              </span>
              <span className="modifier-btn-status">
                {currentMods.shinyParents ? "Active ✓" : "Off"}
              </span>
            </button>
          )}

          {/* 7. Pokémon GO Events */}
          {isGO && (
            <>
              <button
                type="button"
                className={`modifier-select-btn ${currentMods.communityDay ? "is-active" : ""}`}
                onClick={() => setMods(prev => ({
                  ...prev,
                  communityDay: !prev.communityDay,
                  ...(!prev.communityDay ? { raidDay: false, researchDay: false } : {})
                }))}
              >
                <span className="modifier-btn-left">
                  <span>Community Day (1/25)</span>
                </span>
                <span className="modifier-btn-status">
                  {currentMods.communityDay ? "Active ✓" : "Off"}
                </span>
              </button>

              <button
                type="button"
                className={`modifier-select-btn ${currentMods.raidDay ? "is-active" : ""}`}
                onClick={() => setMods(prev => ({
                  ...prev,
                  raidDay: !prev.raidDay,
                  ...(!prev.raidDay ? { communityDay: false, researchDay: false } : {})
                }))}
              >
                <span className="modifier-btn-left">
                  <span>Raid Day (1/10)</span>
                </span>
                <span className="modifier-btn-status">
                  {currentMods.raidDay ? "Active ✓" : "Off"}
                </span>
              </button>

              <button
                type="button"
                className={`modifier-select-btn ${currentMods.researchDay ? "is-active" : ""}`}
                onClick={() => setMods(prev => ({
                  ...prev,
                  researchDay: !prev.researchDay,
                  ...(!prev.researchDay ? { communityDay: false, raidDay: false } : {})
                }))}
              >
                <span className="modifier-btn-left">
                  <span>Research Day (1/10)</span>
                </span>
                <span className="modifier-btn-status">
                  {currentMods.researchDay ? "Active ✓" : "Off"}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderDetailedHuntCard = (hunt) => {
    if (!hunt) return null;
    return (
      <DetailedHuntCard
        hunt={hunt}
        isPopout={false}
        getPokemonImage={getPokemonImage}
        useHomeSprites={useHomeSprites}
        getFormDisplayName={getFormDisplayName}
        hotkey={hotkey}
        decrementHotkey={decrementHotkey}
        huntIncrement={huntIncrements[hunt.id] || huntIncrements[String(hunt.id)] || hunt.increment || 1}
        metricMode={metricMode}
        onToggleMetricMode={toggleMetricMode}
        isPhasesCollapsed={!!collapsedPhasesMap[hunt.id]}
        onToggleCollapsePhases={() => handleToggleCollapsePhases(hunt.id)}
        isMenuOpen={openMenuHuntId === hunt.id}
        onToggleMenu={() => setOpenMenuHuntId(openMenuHuntId === hunt.id ? null : hunt.id)}
        onAddCheck={handleAddCheck}
        onDecreaseCheck={handleDecreaseCheck}
        onTogglePause={handleTogglePause}
        onReset={(h) => setResetModal({ show: true, hunt: h })}
        onLogShiny={handleOpenShinyEncounterModal}
        onOpenOdds={(h) => setOddsModal({ show: true, hunt: h })}
        onOpenHistory={(h) => setPhaseHistoryModal({ show: true, hunt: h })}
        onAdjustValues={(h, elapsedMs) => {
          const totalSec = Math.floor(elapsedMs / 1000);
          const hours = Math.floor(totalSec / 3600);
          const minutes = Math.floor((totalSec % 3600) / 60);
          const seconds = totalSec % 60;
          setSettingsForm({
            manualChecks: h.checks,
            hours,
            minutes,
            seconds,
            manualIncrements: huntIncrements[h.id] || huntIncrements[String(h.id)] || h.increment || 1
          });
          setSettingsModal({ show: true, hunt: h });
        }}
        onPopout={handleOpenPopout}
        onDelete={(h) => setDeleteModal({ show: true, hunt: h })}
      />
    );
  };

  const renderCompactHuntCard = (hunt) => {
    const formLabel = getFormDisplayName(hunt.pokemon);
    const phaseCount = (hunt.phases?.length || 0) + 1;

    return (
      <button
        key={hunt.id}
        type="button"
        className="compact-hunt-card is-paused"
        onClick={() => handleSwitchCurrentHunt(hunt.id)}
        title={`Select shiny ${formatPokemonName(hunt.pokemon?.name)} as Current Hunt`}
      >
        <div className="compact-hunt-main">
          <div className="compact-hunt-sprite-well">
            <img
              src={getPokemonImage(hunt.pokemon)}
              alt={hunt.pokemon?.name || "Pokemon"}
              className={`compact-hunt-sprite ${!useHomeSprites ? "pixelated" : ""}`}
              style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
            />
          </div>

          <div className="compact-hunt-info">
            <div className="compact-hunt-name-row">
              <span className="compact-hunt-name">
                {formatPokemonName(hunt.pokemon?.name)}
              </span>
              {formLabel && (
                <span className="text-[10px] text-[var(--accent)] font-semibold truncate max-w-[120px]">
                  {formLabel}
                </span>
              )}
            </div>

            <div className="compact-hunt-meta">
              <span className="font-semibold text-white/90">{hunt.game}</span>
              <span>•</span>
              <span className="truncate max-w-[130px]">{hunt.method}</span>
              {phaseCount > 1 && (
                <>
                  <span>•</span>
                  <span className="text-[var(--accent)] font-bold">Phase {phaseCount}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="compact-hunt-end">
          <div className="flex flex-col items-end gap-0.5">
            <span className="compact-hunt-checks">
              {hunt.checks.toLocaleString()} checks
            </span>
            <span className="compact-hunt-status paused">
              Paused
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
            Counters
          </h1>
        </div>

        {/* Global Live Summary Chips */}
        <div className="counters-stats-banner">
          <div className="stat-chip active-hunts" title="Total active ongoing hunts">
            <span className="stat-chip-icon"><Flame size={18} /></span>
            <span><strong className="stat-chip-value">{activeCount}</strong> Active Hunts</span>
          </div>

          <div className="stat-chip today-checks" title="Encounters checked across hunts">
            <span className="stat-chip-icon"><CheckCircle size={18} /></span>
            <span><strong className="stat-chip-value">{totalChecksToday.toLocaleString()}</strong> Total Checks</span>
          </div>

          <div className="stat-chip total-time" title="Total accumulated hunt timer">
            <span className="stat-chip-icon"><Clock size={18} /></span>
            <span><strong className="stat-chip-value">{formatSummaryTime(totalHuntingTimeMs)}</strong> Hunting</span>
          </div>
        </div>

        {/* Top Right Controls: Hotkey + Action Buttons */}
        <div className="counters-header-actions">
          <div
            className="hotkey-badge-pill cursor-pointer flex items-center gap-1.5"
            onClick={() => setHotkeyModal(true)}
            title="Click to configure quick check hotkeys"
          >
            <span>Hotkeys:</span>
            <span className="hotkey-tag decrement-tag" title="Subtract Encounters Hotkey">
              {formatHotkeyLabel(decrementHotkey)}
            </span>
            <span className="hotkey-tag increment-tag" title="Add Encounters Hotkey">
              {formatHotkeyLabel(hotkey)}
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/streamer-tools")}
            icon={<Tv size={16} />}
            title="Configure OBS Browser Source Hunt Overlay"
          >
            <span>Overlay</span>
          </Button>

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
          2. HUNT LAYOUT: CURRENT HUNT + COMPACT HUNT QUEUE
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
            <h3 className="empty-state-title">Ready for your next hunt?</h3>
            <p className="empty-state-description">
              Track encounters, time, and odds
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
        </div>
      )}

      {/* ============================================================
          MODALS & DIALOGS (WITH UNIVERSAL FORM SYSTEM)
          ============================================================ */}

      {/* ============================================================
          1. UNIFIED 4-STEP HUNT SETUP WIZARD (UNIVERSAL MODAL)
          ============================================================ */}
      <Modal
        isOpen={huntWizard.isOpen}
        onClose={() => setHuntWizard(prev => ({ ...prev, isOpen: false }))}
        title="Shiny Hunt Setup"
        subtitle={`Step ${huntWizard.step + 1} of 5: ${
          huntWizard.step === 0 ? "Game, Method & Modifiers" :
          huntWizard.step === 1 ? (huntWizard.game ? `Target Pokémon (${huntWizard.game})` : "Target Pokémon") :
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
                onClick={huntWizard.step === 4 ? handleStartWizardHunt : () => setHuntWizard(prev => ({ ...prev, step: prev.step + 1 }))}
                disabled={
                  (huntWizard.step === 0 && (!huntWizard.game || !huntWizard.method)) ||
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
              const isUpcoming = i > huntWizard.step;
              const isDisabled = (i > 0 && (!huntWizard.game || !huntWizard.method)) || (i > 1 && !huntWizard.selectedPokemon);

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
                <div className="hunt-modal-grid">
                  <SelectField
                    label="Game Version"
                    options={GAME_OPTIONS.filter(g => g.value && g.name !== "None").map(g => ({
                      value: g.value,
                      label: g.name,
                      image: g.image
                    }))}
                    value={huntWizard.game}
                    placeholder="Select a game..."
                    onChange={(nextGame) => {
                      const defaultMethod = nextGame ? (getMethodsForGame(nextGame)[0]?.name || "") : "";
                      const availableMods = nextGame ? (getModifiersForGame(nextGame) || {}) : {};
                      const gameHasCharm = Object.prototype.hasOwnProperty.call(availableMods, "Shiny Charm");

                      setHuntWizard(prev => {
                        const keepPokemon = prev.selectedPokemon && isPokemonAvailableInGame(prev.selectedPokemon, nextGame) ? prev.selectedPokemon : null;
                        const keepPhases = (prev.possiblePhases || []).filter(p => isPokemonAvailableInGame(p, nextGame));

                        return {
                          ...prev,
                          game: nextGame,
                          method: defaultMethod,
                          selectedPokemon: keepPokemon,
                          possiblePhases: keepPhases,
                          modifiers: {
                            shinyCharm: gameHasCharm && shinyCharmGames.includes(nextGame),
                            sparklingLv1: false,
                            sparklingLv2: false,
                            sparklingLv3: false,
                            eventBoosted: false,
                            lureActive: false,
                            researchLv10: nextGame === "Legends Arceus" && Boolean(gameHasCharm && shinyCharmGames.includes(nextGame)),
                            perfectResearch: false,
                            shinyParents: false,
                            communityDay: false,
                            raidDay: false,
                            researchDay: false
                          }
                        };
                      });
                    }}
                    searchable
                    fullWidth
                  />

                  <SelectField
                    label="Hunting Method"
                    options={huntWizard.game ? (getMethodsForGame(huntWizard.game) || []).map(m => ({
                      value: m.name,
                      label: m.name
                    })) : []}
                    value={huntWizard.method}
                    placeholder={huntWizard.game ? "Select a method..." : "Select a game first"}
                    disabled={!huntWizard.game}
                    onChange={(val) => setHuntWizard(prev => ({ ...prev, method: val }))}
                    fullWidth
                  />
                </div>

                {/* Modifiers selector */}
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
                  placeholder={`Search Pokémon in ${huntWizard.game} by name or #dex...`}
                  fullWidth
                  autoFocus
                />

                {/* Form Tabs */}
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
                  <span>Showing <strong>{wizardGamePokemon.length}</strong> obtainable in <strong>{huntWizard.game}</strong></span>
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
                          <span className="text-xs font-bold text-[var(--text)] text-center line-clamp-1 max-w-[95%]">
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
                {/* 1. Search Bar */}
                <SearchField
                  value={huntWizard.phaseSearchTerm}
                  onChange={(val) => setHuntWizard(prev => ({ ...prev, phaseSearchTerm: typeof val === "string" ? val : val?.target?.value || "" }))}
                  placeholder={`Search and add Pokémon in ${huntWizard.game}...`}
                  fullWidth
                />

                {/* 2. Form Tabs for Phases */}
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

                {/* 3. Selected Phases Header & Chips */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[var(--text)]">
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

                  {/* Selected Chips Shelf */}
                  {huntWizard.possiblePhases.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto custom-scrollbar pr-1">
                      {huntWizard.possiblePhases.map(pkm => (
                        <div
                          key={pkm.stableId || `${pkm.id}-${pkm.name}`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/[0.05] border border-[var(--border-color)] text-xs font-bold text-[var(--text)] shadow-sm hover:border-white/20 transition group"
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

                {/* 4. Grid of Pokémon in this game (multi-select) */}
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
                          <span className="text-xs font-bold text-[var(--text)] text-center line-clamp-1 max-w-[95%]">
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

                {/* 5. Bottom Toggle Row */}
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
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--text)]">
                    Counter & Initial Settings
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. Starting Encounters */}
                    <div>
                      <label className="hunt-modal-label font-bold text-[var(--text)]">
                        Starting Encounters
                      </label>
                      <p className="text-[11px] text-[var(--text-muted)] mb-1.5">
                        Already started hunting before tracking here? Enter your existing check count.
                      </p>
                      <div className="flex items-stretch rounded-xl bg-black/5 dark:bg-black/40 border border-[var(--border-color)] focus-within:border-[var(--accent)] transition overflow-hidden">
                        <input
                          type="number"
                          min="0"
                          className="w-full bg-transparent pl-3 pr-2 py-2 text-sm text-[var(--text)] font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={huntWizard.startingChecks}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") {
                              setHuntWizard(prev => ({ ...prev, startingChecks: "" }));
                            } else {
                              const n = parseInt(v, 10);
                              setHuntWizard(prev => ({ ...prev, startingChecks: isNaN(n) ? 0 : Math.max(0, n) }));
                            }
                          }}
                          onBlur={() => setHuntWizard(prev => ({ ...prev, startingChecks: Math.max(0, parseInt(prev.startingChecks, 10) || 0) }))}
                          placeholder="0"
                        />
                        <div className="flex flex-col border-l border-[var(--border-color)] divide-y divide-[var(--border-color)] shrink-0">
                          <button
                            type="button"
                            className="px-2.5 flex-1 bg-black/5 dark:bg-white/[0.03] hover:bg-[var(--accent)] text-[var(--text-muted)] hover:text-black transition flex items-center justify-center"
                            onClick={() => setHuntWizard(prev => ({ ...prev, startingChecks: (parseInt(prev.startingChecks, 10) || 0) + 1 }))}
                            title="Increment"
                          >
                            <ChevronUp size={11} strokeWidth={3} />
                          </button>
                          <button
                            type="button"
                            className="px-2.5 flex-1 bg-black/5 dark:bg-white/[0.03] hover:bg-[var(--accent)] text-[var(--text-muted)] hover:text-black transition flex items-center justify-center"
                            onClick={() => setHuntWizard(prev => ({ ...prev, startingChecks: Math.max(0, (parseInt(prev.startingChecks, 10) || 0) - 1) }))}
                            title="Decrement"
                          >
                            <ChevronDown size={11} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 2. Step Increment */}
                    <div>
                      <label className="hunt-modal-label font-bold text-[var(--text)]">
                        Step Increment
                      </label>
                      <p className="text-[11px] text-[var(--text-muted)] mb-1.5">
                        How many encounters are added per count increment (default 1).
                      </p>
                      <div className="flex items-stretch rounded-xl bg-black/5 dark:bg-black/40 border border-[var(--border-color)] focus-within:border-[var(--accent)] transition overflow-hidden">
                        <input
                          type="number"
                          min="1"
                          className="w-full bg-transparent pl-3 pr-2 py-2 text-sm text-[var(--text)] font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={huntWizard.increment}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") {
                              setHuntWizard(prev => ({ ...prev, increment: "" }));
                            } else {
                              const n = parseInt(v, 10);
                              setHuntWizard(prev => ({ ...prev, increment: isNaN(n) ? 1 : Math.max(1, n) }));
                            }
                          }}
                          onBlur={() => setHuntWizard(prev => ({ ...prev, increment: Math.max(1, parseInt(prev.increment, 10) || 1) }))}
                          placeholder="1"
                        />
                        <div className="flex flex-col border-l border-[var(--border-color)] divide-y divide-[var(--border-color)] shrink-0">
                          <button
                            type="button"
                            className="px-2.5 flex-1 bg-black/5 dark:bg-white/[0.03] hover:bg-[var(--accent)] text-[var(--text-muted)] hover:text-black transition flex items-center justify-center"
                            onClick={() => setHuntWizard(prev => ({ ...prev, increment: (parseInt(prev.increment, 10) || 1) + 1 }))}
                            title="Increment"
                          >
                            <ChevronUp size={11} strokeWidth={3} />
                          </button>
                          <button
                            type="button"
                            className="px-2.5 flex-1 bg-black/5 dark:bg-white/[0.03] hover:bg-[var(--accent)] text-[var(--text-muted)] hover:text-black transition flex items-center justify-center"
                            onClick={() => setHuntWizard(prev => ({ ...prev, increment: Math.max(1, (parseInt(prev.increment, 10) || 1) - 1) }))}
                            title="Decrement"
                          >
                            <ChevronDown size={11} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3. Starting Elapsed Time */}
                    <div>
                      <label className="hunt-modal-label font-bold text-[var(--text)]">
                        Starting Elapsed Time
                      </label>
                      <p className="text-[11px] text-[var(--text-muted)] mb-1.5">
                        Time already spent on this hunt (Hours, Minutes, Seconds).
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center rounded-xl bg-black/5 dark:bg-black/40 border border-[var(--border-color)] focus-within:border-[var(--accent)] transition overflow-hidden px-2.5 py-1.5">
                          <input
                            type="number"
                            min="0"
                            className="w-full bg-transparent text-sm text-[var(--text)] font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                            value={huntWizard.startHours}
                            onChange={(e) => setHuntWizard(prev => ({ ...prev, startHours: e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                          />
                          <span className="text-xs text-[var(--text-muted)] font-bold ml-1">h</span>
                        </div>
                        <div className="flex items-center rounded-xl bg-black/5 dark:bg-black/40 border border-[var(--border-color)] focus-within:border-[var(--accent)] transition overflow-hidden px-2.5 py-1.5">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            className="w-full bg-transparent text-sm text-[var(--text)] font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                            value={huntWizard.startMinutes}
                            onChange={(e) => setHuntWizard(prev => ({ ...prev, startMinutes: e.target.value === "" ? "" : Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)) }))}
                          />
                          <span className="text-xs text-[var(--text-muted)] font-bold ml-1">m</span>
                        </div>
                        <div className="flex items-center rounded-xl bg-black/5 dark:bg-black/40 border border-[var(--border-color)] focus-within:border-[var(--accent)] transition overflow-hidden px-2.5 py-1.5">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            className="w-full bg-transparent text-sm text-[var(--text)] font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                            value={huntWizard.startSeconds}
                            onChange={(e) => setHuntWizard(prev => ({ ...prev, startSeconds: e.target.value === "" ? "" : Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)) }))}
                          />
                          <span className="text-xs text-[var(--text-muted)] font-bold ml-1">s</span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Estimated Checks per Second / Pace */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="hunt-modal-label font-bold text-[var(--text)]">
                          Estimated Check Pace
                        </label>
                        {(() => {
                          const h = parseInt(huntWizard.startHours, 10) || 0;
                          const m = parseInt(huntWizard.startMinutes, 10) || 0;
                          const s = parseInt(huntWizard.startSeconds, 10) || 0;
                          const totalSec = (h * 3600) + (m * 60) + s;
                          const checks = parseInt(huntWizard.startingChecks, 10) || 0;
                          if (totalSec > 0 && checks > 0) {
                            const calcPace = (totalSec / checks).toFixed(1);
                            return (
                              <button
                                type="button"
                                className="text-[10px] text-[var(--accent)] hover:underline font-bold"
                                onClick={() => setHuntWizard(prev => ({ ...prev, estimatedPaceSec: calcPace }))}
                              >
                                Auto: {calcPace}s/check
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <p className="text-[11px] text-gray-400 mb-1.5">
                        Average duration in seconds per check (e.g. 10.5s / check).
                      </p>
                      <div className="flex items-center rounded-xl bg-black/40 border border-white/10 focus-within:border-[var(--accent)] transition overflow-hidden px-3 py-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          className="w-full bg-transparent text-sm text-white font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="e.g. 10.5"
                          value={huntWizard.estimatedPaceSec}
                          onChange={(e) => setHuntWizard(prev => ({ ...prev, estimatedPaceSec: e.target.value }))}
                        />
                        <span className="text-xs text-gray-400 font-bold whitespace-nowrap ml-2">
                          s / check
                        </span>
                      </div>
                      {parseFloat(huntWizard.estimatedPaceSec) > 0 && (
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          ≈ {(1 / parseFloat(huntWizard.estimatedPaceSec)).toFixed(2)} checks / sec
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: PREVIEW (Identity, Live Odds & Summary) */}
            {huntWizard.step === 4 && (
              <div className="space-y-4 max-h-[440px] overflow-y-auto custom-scrollbar pr-1 overscroll-contain">
                {/* Hero Identity & Live Odds Card */}
                <HuntIdentityOddsCard
                  pokemon={huntWizard.selectedPokemon}
                  game={huntWizard.game}
                  method={huntWizard.method}
                  modifiers={huntWizard.modifiers}
                  checks={parseInt(huntWizard.startingChecks, 10) || 0}
                  customImage={getPokemonImage(huntWizard.selectedPokemon)}
                  useHomeSprites={useHomeSprites}
                />

                {/* Initial Counter & Pacing Settings Summary Card */}
                <div className="hunt-modal-card space-y-2.5 p-3.5 bg-black/5 dark:bg-white/[0.03] border border-[var(--border-color)] rounded-xl">
                  <div className="flex items-center justify-between text-xs border-b border-[var(--border-color)] pb-2">
                    <span className="font-extrabold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={13} className="text-[var(--accent)]" /> Counter & Pacing Settings
                    </span>
                    <span className="text-[var(--text-muted)] text-[11px]">Configured for hunt start</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
                    <div className="p-2.5 rounded-lg bg-black/5 dark:bg-black/30 border border-[var(--border-color)] flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Starting Checks</span>
                      <span className="text-sm font-extrabold text-[var(--text)] mt-1">
                        {(parseInt(huntWizard.startingChecks, 10) || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/5 dark:bg-black/30 border border-[var(--border-color)] flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Step Increment</span>
                      <span className="text-sm font-extrabold text-[var(--accent)] mt-1">
                        +{huntWizard.increment || 1}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/5 dark:bg-black/30 border border-[var(--border-color)] flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Starting Elapsed</span>
                      <span className="text-sm font-extrabold text-[var(--text)] mt-1">
                        {(() => {
                          const h = parseInt(huntWizard.startHours, 10) || 0;
                          const m = parseInt(huntWizard.startMinutes, 10) || 0;
                          const s = parseInt(huntWizard.startSeconds, 10) || 0;
                          const totalMs = ((h * 3600) + (m * 60) + s) * 1000;
                          return totalMs > 0 ? formatDigitalTime(totalMs) : "00:00:00";
                        })()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/5 dark:bg-black/30 border border-[var(--border-color)] flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Estimated Pace</span>
                      <span className="text-sm font-extrabold text-emerald-400 mt-1">
                        {parseFloat(huntWizard.estimatedPaceSec) > 0
                          ? `${huntWizard.estimatedPaceSec}s / check`
                          : "Dynamic"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Configured Phases Showcase */}
                {huntWizard.possiblePhases.length > 0 && (
                  <div className="hunt-modal-card space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-[var(--text-muted)] uppercase tracking-wider">
                        Configured Phase Targets ({huntWizard.possiblePhases.length})
                      </span>
                      <span className="text-[var(--text-muted)] text-[11px]">Tracked alongside main target</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {huntWizard.possiblePhases.map(pkm => (
                        <div key={pkm.stableId || `${pkm.id}-${pkm.name}`} className="flex items-center gap-1.5 bg-black/5 dark:bg-white/[0.04] border border-[var(--border-color)] rounded-lg px-2 py-1 text-xs text-[var(--text)]">
                          <img src={getPokemonImage(pkm)} alt="" className={`w-4 h-4 object-contain ${!useHomeSprites ? "pixelated" : ""}`} style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined} />
                          <span className="font-semibold">{formatPokemonName(pkm.name)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progressive Odds Matrix */}
                <OddsMatrixView
                  game={huntWizard.game}
                  method={huntWizard.method}
                  modifiers={huntWizard.modifiers}
                  checks={parseInt(huntWizard.startingChecks, 10) || 0}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* 3. Edit Hunt Modal */}
      <Modal
        isOpen={editModal.show}
        onClose={() => setEditModal({ show: false, hunt: null })}
        title={`Edit Hunt: ${editModal.hunt ? formatPokemonName(editModal.hunt.pokemon?.name) : ""}`}
        subtitle="Modify game, method, and active shiny boosts"
        icon={<Edit size={22} />}
        size="md"
        footer={({ close }) => (
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!editModal.hunt) return;
                const newOdds = calculateOdds(editForm.game, editForm.method, editForm.modifiers);
                const updatedHunts = allActiveHunts.map(h => {
                  if (h.id === editModal.hunt.id) {
                    return {
                      ...h,
                      game: editForm.game,
                      method: editForm.method,
                      modifiers: editForm.modifiers,
                      odds: newOdds
                    };
                  }
                  return h;
                });
                setAllActiveHunts(updatedHunts);
                setCachedHuntsData({ activeHunts: updatedHunts });
                close();
                showMessage("Hunt settings updated", "success");
                debouncedSave(updatedHunts);
              }}
              icon={<Check size={16} strokeWidth={2.5} />}
            >
              Save Changes
            </Button>
          </>
        )}
      >
        {editModal.hunt && (
          <div className="space-y-4">
            <div className="hunt-modal-grid">
              <SelectField
                label="Game Version"
                options={getGamesForPokemon(editModal.hunt.pokemon).map(g => ({
                  value: g,
                  label: g,
                  image: getGameImage(g)
                }))}
                value={editForm.game}
                onChange={(nextGame) => {
                  const defaultMethod = getMethodsForGame(nextGame)[0]?.name || "Random Encounters";
                  setEditForm(prev => ({ ...prev, game: nextGame, method: defaultMethod }));
                }}
                searchable
                fullWidth
              />

              <SelectField
                label="Hunting Method"
                options={(getMethodsForGame(editForm.game || "Scarlet") || []).map(m => ({
                  value: m.name,
                  label: m.name
                }))}
                value={editForm.method}
                onChange={(val) => setEditForm(prev => ({ ...prev, method: val }))}
                fullWidth
              />
            </div>

            {/* Modifiers */}
            {renderModifiersForm(
              editForm.game,
              editForm.method,
              editForm.modifiers,
              (callback) => {
                setEditForm(prev => ({
                  ...prev,
                  modifiers: typeof callback === "function" ? callback(prev.modifiers) : callback
                }));
              }
            )}
          </div>
        )}
      </Modal>

      {/* 4. Dedicated Odds Breakdown & Matrix Chart Modal */}
      <OddsBreakdownModal
        isOpen={oddsModal.show}
        onClose={() => setOddsModal(prev => ({ ...prev, show: false }))}
        hunt={oddsModal.hunt}
        totalCheckTimes={totalCheckTimes}
      />

      {/* ============================================================
          5. UNIFIED SHINY ENCOUNTER MODAL (PHASE & COMPLETION FLOW)
          ============================================================ */}
      <ShinyEncounterModal
        isOpen={shinyEncounterModal.show}
        onClose={() => setShinyEncounterModal(prev => ({ ...prev, show: false }))}
        hunt={shinyEncounterModal.hunt}
        allPokemon={allPokemon}
        formsData={formsData}
        useHomeSprites={useHomeSprites}
        username={username}
        showMessage={showMessage}
        onCompleteTargetHunt={handleCompleteTargetHunt}
        onContinueAfterPhase={handleContinueAfterPhase}
        onAddShinyToCollection={handleAddShinyToCollection}
        onAddShinyFailToCollection={handleAddShinyFailToCollection}
      />

      {/* ============================================================
          6. PHASE HISTORY MODAL
          ============================================================ */}
      <Modal
        isOpen={phaseHistoryModal.show}
        onClose={() => setPhaseHistoryModal({ show: false, hunt: null })}
        title="FAILS & PHASES History"
        subtitle={phaseHistoryModal.hunt ? `Hunt: Shiny ${formatPokemonName(phaseHistoryModal.hunt.pokemon?.name)} (${(phaseHistoryModal.hunt.phases?.length || 0)} recorded)` : "Encounter History"}
        icon={<History size={22} className="text-[var(--accent)]" />}
        size="md"
        footer={({ close }) => <Button variant="secondary" onClick={close}>Close</Button>}
      >
        <div className="space-y-4">
          {(!phaseHistoryModal.hunt?.phases || phaseHistoryModal.hunt.phases.length === 0) ? (
            <div className="text-center py-8 text-gray-400 space-y-2">
              <Sparkles size={32} className="mx-auto text-gray-600 mb-2" />
              <p className="font-semibold text-sm">No fails or phases logged yet for this hunt.</p>
              <p className="text-xs text-gray-500">
                When you encounter a non-target shiny or a shiny fails, click <strong className="text-[var(--accent)]">Log Shiny</strong> on your hunt card.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {phaseHistoryModal.hunt.phases.map((phase, idx) => {
                const info = getPhaseEntryDisplayInfo(phase, phaseHistoryModal.hunt.phases);
                const displayChecks = getPhaseDisplayChecks(phase, phaseHistoryModal.hunt.phases);
                return (
                  <div
                    key={phase.id || idx}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      info.isFail
                        ? "bg-rose-500/[0.06] border-rose-500/30"
                        : "bg-white/[0.03] border-white/[0.08]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={getPokemonImage(phase.pokemon)} alt="" className={`w-12 h-12 object-contain ${!useHomeSprites ? "pixelated" : ""}`} style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black uppercase ${info.isFail ? "text-rose-400" : "text-[var(--accent)]"}`}>
                            {info.label.replace(":", "")}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            info.isFail ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"
                          }`}>
                            {info.isFail ? (
                              <>
                                <HeartCrack size={11} className="text-rose-400" strokeWidth={2.5} />
                                <span>{info.isTarget ? "Target Failed" : "Phase Failed"}</span>
                              </>
                            ) : (
                              "✓ Caught"
                            )}
                          </span>
                        </div>
                        <h4 className="font-bold text-[var(--text)] text-sm">
                          Shiny {formatPokemonName(phase.pokemon?.name)}
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          {new Date(phase.date).toLocaleDateString()} • {displayChecks.intervalChecks.toLocaleString()} checks
                          <span> (Total: {displayChecks.totalChecks.toLocaleString()})</span>
                        </p>
                        {phase.notes && (
                          <p className="text-[11px] text-gray-400 italic mt-0.5">"{phase.notes}"</p>
                        )}
                      </div>
                    </div>

                    {phase.ball && (
                      <span className="text-xs font-semibold text-gray-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 flex-shrink-0">
                        {phase.ball}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* ============================================================
          7. END HUNT WITHOUT FINDING TARGET MODAL
          ============================================================ */}
      <Modal
        isOpen={abandonHuntModal.show}
        onClose={() => setAbandonHuntModal({ show: false, hunt: null })}
        title="End Hunt Without Finding Target?"
        subtitle={abandonHuntModal.hunt ? `Abandon hunt for Shiny ${formatPokemonName(abandonHuntModal.hunt.pokemon?.name)}` : ""}
        icon={<X size={22} className="text-rose-400" />}
        size="sm"
        footer={({ close }) => (
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                close();
                setTimeout(() => {
                  handleEndHuntWithoutTarget(abandonHuntModal.hunt);
                }, 280);
              }}
              icon={<X size={16} strokeWidth={2.5} />}
            >
              End Hunt
            </Button>
          </>
        )}
      >
        <div className="space-y-3 text-sm text-gray-300">
          <p>
            Are you sure you want to end this active hunt?
          </p>
          <p className="text-xs text-gray-400">
            Any phase catches you have already added to your Living Dex will remain in your collection.
          </p>
        </div>
      </Modal>

      {/* 8. Settings / Manual Adjust Modal */}
      <AdjustHuntModal
        isOpen={settingsModal.show}
        onClose={() => setSettingsModal({ show: false, hunt: null })}
        hunt={settingsModal.hunt}
        huntIncrements={huntIncrements}
        onSaveAdjustments={(huntId, payload) => {
          const now = Date.now();
          const action = {
            type: "UPDATE_PROPERTIES",
            huntId,
            payload,
            timestamp: now
          };
          const updatedHunts = applyHuntActionToState(allActiveHunts, action, now);
          const updatedIncrements = { ...huntIncrements, [huntId]: payload.increment, [String(huntId)]: payload.increment };

          try {
            localStorage.setItem("dex_hunt_increments", JSON.stringify(updatedIncrements));
          } catch {}

          setAllActiveHunts(updatedHunts);
          setHuntIncrements(updatedIncrements);
          setCachedHuntsData({ activeHunts: updatedHunts });
          showMessage("Hunt values and timer updated", "success");

          if (channelRef.current) {
            channelRef.current.broadcast({
              type: "HUNT_ACTION",
              huntId,
              action
            });
          }

          debouncedSave(updatedHunts);
        }}
      />

      {/* 9. Hotkey Configuration Modal */}
      <Modal
        isOpen={hotkeyModal}
        onClose={() => {
          setHotkeyModal(false);
          setListeningFor(null);
          setHotkeyError("");
        }}
        title="Configure Counter Hotkeys"
        subtitle="Assign custom keyboard shortcuts to quickly increment or decrement encounters"
        icon={<Clock size={22} className="text-[var(--accent)]" />}
        size="md"
        className="!max-w-[580px]"
        footer={({ close }) => (
          <div className="flex items-center justify-end w-full gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setListeningFor(null);
                setHotkeyError("");
                close();
              }}
            >
              Done
            </Button>
          </div>
        )}
      >
        <div className="space-y-4 py-2">
          {hotkeyError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-pulse">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{hotkeyError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Decrement (-1) Hotkey Card */}
            <div className={`hotkey-config-card ${listeningFor === "decrement" ? "is-listening" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-xs font-black">
                    −
                  </span>
                  <span className="text-xs font-black text-[var(--text)] uppercase tracking-wider">
                    Subtract Check
                  </span>
                </div>
                {decrementHotkey && (
                  <button
                    type="button"
                    className="text-[11px] text-gray-400 hover:text-rose-400 font-semibold transition-colors"
                    onClick={() => {
                      setDecrementHotkey(null);
                      try { localStorage.removeItem("huntDecrementHotkey"); } catch {}
                      profileAPI.updateProfile({ huntDecrementHotkey: "" }).catch(() => {});
                      showMessage("Decrement hotkey cleared", "info");
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center py-2">
                {listeningFor === "decrement" ? (
                  <div className="hotkey-key-badge-lg animate-pulse text-xs sm:text-sm font-bold text-center">
                    Press any key...
                  </div>
                ) : (
                  <div className="hotkey-key-badge-lg">
                    {formatHotkeyLabel(decrementHotkey)}
                  </div>
                )}
              </div>

              <Button
                variant={listeningFor === "decrement" ? "accent" : "secondary"}
                size="sm"
                className="w-full font-bold"
                onClick={() => {
                  setHotkeyError("");
                  setListeningFor(listeningFor === "decrement" ? null : "decrement");
                }}
              >
                {listeningFor === "decrement" ? "Cancel Listening" : "Record New Key"}
              </Button>

              <div className="pt-1 border-t border-white/5">
                <span className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1.5">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "−", value: "-" },
                    { label: "Z", value: "z" },
                    { label: "S", value: "s" },
                    { label: "↓ DOWN", value: "ArrowDown" }
                  ].map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      disabled={hotkey === preset.value}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-all ${
                        decrementHotkey === preset.value
                          ? "bg-[var(--accent)] text-black border-[var(--accent)]"
                          : hotkey === preset.value
                          ? "opacity-30 cursor-not-allowed bg-white/5 border-white/5 text-gray-500"
                          : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                      onClick={() => {
                        setDecrementHotkey(preset.value);
                        setListeningFor(null);
                        setHotkeyError("");
                        try { localStorage.setItem("huntDecrementHotkey", preset.value); } catch {}
                        profileAPI.updateProfile({ huntDecrementHotkey: preset.value }).catch(() => {});
                        showMessage(`Decrement hotkey set to ${preset.label}`, "success");
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Increment (+1) Hotkey Card */}
            <div className={`hotkey-config-card ${listeningFor === "increment" ? "is-listening" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xs font-black">
                    +
                  </span>
                  <span className="text-xs font-black text-[var(--text)] uppercase tracking-wider">
                    Add Check
                  </span>
                </div>
                {hotkey && (
                  <button
                    type="button"
                    className="text-[11px] text-gray-400 hover:text-rose-400 font-semibold transition-colors"
                    onClick={() => {
                      setHotkey(null);
                      try { localStorage.removeItem("huntHotkey"); } catch {}
                      profileAPI.updateProfile({ huntHotkey: "" }).catch(() => {});
                      showMessage("Increment hotkey cleared", "info");
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center py-2">
                {listeningFor === "increment" ? (
                  <div className="hotkey-key-badge-lg animate-pulse text-xs sm:text-sm font-bold text-center">
                    Press any key...
                  </div>
                ) : (
                  <div className="hotkey-key-badge-lg">
                    {formatHotkeyLabel(hotkey)}
                  </div>
                )}
              </div>

              <Button
                variant={listeningFor === "increment" ? "accent" : "secondary"}
                size="sm"
                className="w-full font-bold"
                onClick={() => {
                  setHotkeyError("");
                  setListeningFor(listeningFor === "increment" ? null : "increment");
                }}
              >
                {listeningFor === "increment" ? "Cancel Listening" : "Record New Key"}
              </Button>

              <div className="pt-1 border-t border-white/5">
                <span className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1.5">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "SPACE", value: " " },
                    { label: "+", value: "+" },
                    { label: "A", value: "a" },
                    { label: "↑ UP", value: "ArrowUp" }
                  ].map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      disabled={decrementHotkey === preset.value}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-all ${
                        hotkey === preset.value
                          ? "bg-[var(--accent)] text-black border-[var(--accent)]"
                          : decrementHotkey === preset.value
                          ? "opacity-30 cursor-not-allowed bg-white/5 border-white/5 text-gray-500"
                          : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                      onClick={() => {
                        setHotkey(preset.value);
                        setListeningFor(null);
                        setHotkeyError("");
                        try { localStorage.setItem("huntHotkey", preset.value); } catch {}
                        profileAPI.updateProfile({ huntHotkey: preset.value }).catch(() => {});
                        showMessage(`Increment hotkey set to ${preset.label}`, "success");
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-gray-400 font-medium">
            💡 Hotkeys work anywhere on the tracker page while not typing in an input field.
          </p>
        </div>
      </Modal>

      {/* 10. Completed Hunts & Fails History Modal */}
      <HuntHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        huntHistory={huntHistory}
        mode="counters"
        onDeleteEntry={handleDeleteHistoryEntry}
        onClearAll={handleClearAllHistory}
        onOpenWizard={handleOpenHuntWizard}
        useHomeSprites={useHomeSprites}
        formsData={formsData}
      />

      {/* 11. Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={resetModal.show}
        onClose={() => setResetModal(prev => ({ ...prev, show: false }))}
        onConfirm={() => resetModal.hunt && handleConfirmResetTimer(resetModal.hunt.id)}
        title="Reset Hunt Timer & Stats"
        subtitle="Reset elapsed time & seconds per check"
        message={`Are you sure you want to reset the elapsed time and seconds-per-check metrics for Shiny ${resetModal.hunt ? formatPokemonName(resetModal.hunt.pokemon?.name) : ""}? Your encounter counts will NOT be deleted.`}
        confirmText="Reset Timer"
        cancelText="Cancel"
        variant="warning"
      />

      {/* 12. Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal(prev => ({ ...prev, show: false }))}
        onConfirm={() => deleteModal.hunt && handleDeleteHunt(deleteModal.hunt.id)}
        title="Delete Hunt"
        message={`Are you sure you want to delete your hunt for Shiny ${deleteModal.hunt ? formatPokemonName(deleteModal.hunt.pokemon?.name) : ""}? This cannot be undone.`}
        confirmText="Delete Hunt"
        variant="danger"
      />
    </div>
  );
}