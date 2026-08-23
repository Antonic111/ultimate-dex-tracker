import React from "react";
import { Modal, Button } from "../Shared";
import { BarChart3, Sparkles, Clock } from "lucide-react";
import {
  getCurrentHuntOdds,
  calculateCatchComboOdds,
  calculateMassOutbreakOdds,
  calculateKOOdds,
  calculatePokeRadarOdds
} from "../../utils/huntSystem";
import { formatDigitalTime } from "../../utils/huntSync";

const formatIntervalTime = (seconds) => {
  if (!seconds || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
};

export default function OddsBreakdownModal({
  isOpen,
  onClose,
  hunt,
  totalCheckTimes = {}
}) {
  if (!hunt) return null;

  const currentDynamicOdds = getCurrentHuntOdds(
    hunt.game,
    hunt.method,
    hunt.modifiers || {},
    hunt.checks || 0
  );
  const singleEncounterProb = ((1 / currentDynamicOdds) * 100).toFixed(4);
  const hasCharm = Boolean(hunt.modifiers?.shinyCharm);

  // Progressive Method Flags
  const isSOS =
    (hunt.game === "Sun" || hunt.game === "Moon" || hunt.game === "Ultra Sun" || hunt.game === "Ultra Moon") &&
    (hunt.method === "SOS Battles" || hunt.method === "SOS Chaining" || hunt.method === "SOS Chaining (30+ Chain)");

  const isCatchCombo =
    (hunt.game === "Let's Go Pikachu" || hunt.game === "Let's Go Eevee") &&
    (hunt.method === "Catch Combo" || hunt.method === "Catch Combo (31+)");

  const isSVMassOutbreaks =
    (hunt.game === "Scarlet" || hunt.game === "Violet") && hunt.method === "Mass Outbreaks";

  const isSwShKO =
    (hunt.game === "Sword" || hunt.game === "Shield") &&
    (hunt.method === "KO Method (Number Battled)" || hunt.method === "KO Method" || hunt.method === "Number Battled");

  const isDPPtRadar =
    (hunt.game === "Diamond" || hunt.game === "Pearl" || hunt.game === "Platinum") &&
    (hunt.method === "Poke Radar" || hunt.method === "Poké Radar");

  const isPLAResearch =
    hunt.game === "Legends Arceus" &&
    (hunt.method === "Mass Outbreak" || hunt.method === "Massive Mass Outbreak" || hunt.method === "Massive Mass Outbreaks" || hunt.method === "Permutations" || hunt.method === "Standard Wild" || hunt.method === "Random Encounters");

  // Calculate Next Odds Increase Banner
  let nextOddsBanner = null;

  if (isSOS) {
    if (hunt.checks <= 10) {
      const needed = 11 - hunt.checks;
      const nextOdds = hasCharm ? "1 / 586" : "1 / 820";
      nextOddsBanner = { text: `Next odds increase: ${needed} more chain encounter${needed === 1 ? "" : "s"} → ${nextOdds}`, isMax: false };
    } else if (hunt.checks <= 20) {
      const needed = 21 - hunt.checks;
      const nextOdds = hasCharm ? "1 / 373" : "1 / 456";
      nextOddsBanner = { text: `Next odds increase: ${needed} more chain encounter${needed === 1 ? "" : "s"} → ${nextOdds}`, isMax: false };
    } else if (hunt.checks <= 30) {
      const needed = 31 - hunt.checks;
      const nextOdds = hasCharm ? "1 / 274" : "1 / 316";
      nextOddsBanner = { text: `Next odds increase: ${needed} more chain encounter${needed === 1 ? "" : "s"} → ${nextOdds}`, isMax: false };
    } else {
      nextOddsBanner = { text: `⭐ Maximum chain threshold reached (31+ Chain: 1 / ${hasCharm ? "274" : "316"})`, isMax: true };
    }
  } else if (isCatchCombo) {
    const lure = hunt.modifiers?.lureActive;
    if (hunt.checks <= 10) {
      const needed = 11 - hunt.checks;
      const nextOdds = calculateCatchComboOdds(11, hasCharm, lure);
      nextOddsBanner = { text: `Next odds increase: ${needed} more combo catch${needed === 1 ? "es" : "es"} → 1 / ${nextOdds.toLocaleString()}`, isMax: false };
    } else if (hunt.checks <= 20) {
      const needed = 21 - hunt.checks;
      const nextOdds = calculateCatchComboOdds(21, hasCharm, lure);
      nextOddsBanner = { text: `Next odds increase: ${needed} more combo catch${needed === 1 ? "es" : "es"} → 1 / ${nextOdds.toLocaleString()}`, isMax: false };
    } else if (hunt.checks <= 30) {
      const needed = 31 - hunt.checks;
      const nextOdds = calculateCatchComboOdds(31, hasCharm, lure);
      nextOddsBanner = { text: `Next odds increase: ${needed} more combo catch${needed === 1 ? "es" : "es"} → 1 / ${nextOdds.toLocaleString()}`, isMax: false };
    } else {
      nextOddsBanner = { text: `⭐ Maximum combo threshold reached (31+ Combo: 1 / ${currentDynamicOdds.toLocaleString()})`, isMax: true };
    }
  } else if (isSVMassOutbreaks) {
    const spLv = hunt.modifiers?.sparklingLv3 ? 3 : hunt.modifiers?.sparklingLv2 ? 2 : hunt.modifiers?.sparklingLv1 ? 1 : 0;
    if (hunt.checks < 30) {
      const needed = 30 - hunt.checks;
      const nextOdds = calculateMassOutbreakOdds(30, hasCharm, spLv);
      nextOddsBanner = { text: `Next odds increase: ${needed} more outbreak KO${needed === 1 ? "" : "s"} (at 30+ KOs) → 1 / ${nextOdds.toLocaleString()}`, isMax: false };
    } else if (hunt.checks < 60) {
      const needed = 60 - hunt.checks;
      const nextOdds = calculateMassOutbreakOdds(60, hasCharm, spLv);
      nextOddsBanner = { text: `Next odds increase: ${needed} more outbreak KO${needed === 1 ? "" : "s"} (at 60+ KOs) → 1 / ${nextOdds.toLocaleString()}`, isMax: false };
    } else {
      nextOddsBanner = { text: `⭐ Maximum outbreak KO tier reached (60+ KOs cleared: 1 / ${currentDynamicOdds.toLocaleString()})`, isMax: true };
    }
  } else if (isSwShKO) {
    if (hunt.checks < 50) {
      const needed = 50 - hunt.checks;
      const nextOdds = calculateKOOdds(50, hasCharm);
      nextOddsBanner = { text: `Next odds increase: ${needed} more battle${needed === 1 ? "" : "s"} (at 50 KOs) → 1 / ${nextOdds.toLocaleString()}`, isMax: false };
    } else if (hunt.checks < 100) {
      const needed = 100 - hunt.checks;
      const nextOdds = calculateKOOdds(100, hasCharm);
      nextOddsBanner = { text: `Next odds increase: ${needed} more battle${needed === 1 ? "" : "s"} (at 100 KOs) → 1 / ${nextOdds.toLocaleString()}`, isMax: false };
    } else if (hunt.checks < 200) {
      const needed = 200 - hunt.checks;
      const nextOdds = calculateKOOdds(200, hasCharm);
      nextOddsBanner = { text: `Next odds increase: ${needed} more battle${needed === 1 ? "" : "s"} (at 200 KOs) → 1 / ${nextOdds.toLocaleString()}`, isMax: false };
    } else if (hunt.checks < 300) {
      const needed = 300 - hunt.checks;
      const nextOdds = calculateKOOdds(300, hasCharm);
      nextOddsBanner = { text: `Next odds increase: ${needed} more battle${needed === 1 ? "" : "s"} (at 300 KOs) → 1 / ${nextOdds.toLocaleString()}`, isMax: false };
    } else if (hunt.checks < 500) {
      const needed = 500 - hunt.checks;
      const nextOdds = calculateKOOdds(500, hasCharm);
      nextOddsBanner = { text: `Next odds increase: ${needed} more battle${needed === 1 ? "" : "s"} (at 500 KOs) → 1 / ${nextOdds.toLocaleString()}`, isMax: false };
    } else {
      nextOddsBanner = { text: `⭐ Maximum battle threshold reached (500+ KOs: 1 / ${currentDynamicOdds.toLocaleString()})`, isMax: true };
    }
  } else if (isDPPtRadar) {
    const steps = [10, 20, 30, 35, 40];
    const nextStep = steps.find(s => s > hunt.checks);
    if (nextStep) {
      const needed = nextStep - hunt.checks;
      const nextOdds = calculatePokeRadarOdds(nextStep);
      nextOddsBanner = { text: `Next odds increase: ${needed} more chain encounter${needed === 1 ? "" : "s"} → 1 / ${nextOdds.toLocaleString()}`, isMax: false };
    } else {
      nextOddsBanner = { text: `⭐ Maximum radar chain reached (40+ Chain: 1 / 200)`, isMax: true };
    }
  }

  // Active Modifiers
  const activeModifiersList = [];
  if (hunt.modifiers?.shinyCharm) {
    activeModifiersList.push({ label: "Shiny Charm", image: "/modifier_images/shinycharm.png" });
  }
  if (hunt.modifiers?.sparklingLv3) {
    activeModifiersList.push({ label: "Sparkling Power Lv 3", image: "/modifier_images/sandwich.png" });
  } else if (hunt.modifiers?.sparklingLv2) {
    activeModifiersList.push({ label: "Sparkling Power Lv 2", image: "/modifier_images/sandwich.png" });
  } else if (hunt.modifiers?.sparklingLv1) {
    activeModifiersList.push({ label: "Sparkling Power Lv 1", image: "/modifier_images/sandwich.png" });
  }
  if (hunt.modifiers?.lureActive) {
    activeModifiersList.push({ label: "Lure Active", image: "/modifier_images/lure.png" });
  }
  if (hunt.modifiers?.eventBoosted) {
    activeModifiersList.push({ label: "Event Boosted", image: "/modifier_images/eventboosted.png" });
  }
  if (hunt.modifiers?.shinyParents) {
    activeModifiersList.push({ label: "Foreign Parents (Masuda)", image: "/modifier_images/shinyparents.png" });
  }
  if (hunt.modifiers?.perfectResearch) {
    activeModifiersList.push({ label: "Perfect Research Entry", image: "/modifier_images/perfectresearch.png" });
  } else if (hunt.modifiers?.researchLv10) {
    activeModifiersList.push({ label: "Research Level 10", image: "/modifier_images/research.png" });
  }

  const totalElapsedMs =
    totalCheckTimes[hunt.id] !== undefined
      ? totalCheckTimes[hunt.id]
      : totalCheckTimes[String(hunt.id)] || hunt.elapsedMs || 0;
  const activeTimeMs = totalElapsedMs;
  const avgSec = hunt.checks > 0 && activeTimeMs > 0 ? activeTimeMs / 1000 / hunt.checks : 0;
  const lastSec = hunt.stats?.lastIntervalSec;
  const fastestSec = hunt.stats?.fastestIntervalSec;
  const last10Sec = hunt.stats?.last10AvgSec;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="View Odds Breakdown"
      subtitle={hunt ? `${hunt.game} • ${hunt.method}` : "Shiny Hunting Probability Breakdown"}
      icon={<BarChart3 size={22} className="text-[var(--accent)]" />}
      size="lg"
      footer={({ close }) => <Button variant="secondary" onClick={close}>Close</Button>}
    >
      <div className="odds-breakdown-container">
        {/* Top Summary Hero */}
        <div className="odds-summary-hero">
          <div className="odds-summary-left">
            <span className="odds-summary-title">CURRENT ODDS</span>
            <span className="odds-summary-number">1 / {currentDynamicOdds.toLocaleString()}</span>
            <span className="text-xs text-gray-300 font-semibold">
              <strong className="text-emerald-400">{singleEncounterProb}%</strong> chance per encounter
            </span>
          </div>

          <div className="odds-summary-right">
            <span className="odds-summary-title">CURRENT HUNT</span>
            <span className="odds-prob-text">
              {(hunt.checks || 0).toLocaleString()} encounters
              {isSOS && ` • SOS Chain ${hunt.checks}`}
              {isCatchCombo && ` • Combo ${hunt.checks}`}
              {isSVMassOutbreaks && ` • ${hunt.checks} KOs`}
              {isSwShKO && ` • ${hunt.checks} Battled`}
              {isDPPtRadar && ` • Chain ${hunt.checks}`}
            </span>
            <span className="odds-prob-sub text-gray-300">
              {hunt.game} • {hunt.method}
            </span>
          </div>
        </div>

        {/* Check Pace & Interval Statistics */}
        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-white">
              <Clock size={14} className="text-[var(--accent)]" /> Check Pace & Intervals
            </span>
            <span className="text-[var(--accent)] font-mono">{formatDigitalTime(activeTimeMs)} Active Time</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-0.5">
            <div className="p-2 rounded-lg bg-black/25 border border-white/5 flex flex-col">
              <span className="text-[11px] font-semibold text-gray-400">Last Check</span>
              <span className="text-sm font-bold text-white font-mono">{lastSec ? formatIntervalTime(lastSec) : "—"}</span>
            </div>
            <div className="p-2 rounded-lg bg-black/25 border border-white/5 flex flex-col">
              <span className="text-[11px] font-semibold text-gray-400">Average Pace</span>
              <span className="text-sm font-bold text-[var(--accent)] font-mono">{avgSec > 0 ? formatIntervalTime(avgSec) : "—"}</span>
            </div>
            <div className="p-2 rounded-lg bg-black/25 border border-white/5 flex flex-col">
              <span className="text-[11px] font-semibold text-gray-400">Fastest Check</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{fastestSec ? formatIntervalTime(fastestSec) : "—"}</span>
            </div>
            <div className="p-2 rounded-lg bg-black/25 border border-white/5 flex flex-col">
              <span className="text-[11px] font-semibold text-gray-400">Last 10 Avg</span>
              <span className="text-sm font-bold text-purple-400 font-mono">{last10Sec ? formatIntervalTime(last10Sec) : "—"}</span>
            </div>
          </div>
        </div>

        {/* Actionable Next Odds Increase Banner */}
        {nextOddsBanner && (
          <div className={`odds-next-increase-banner ${nextOddsBanner.isMax ? "max-tier" : ""}`}>
            <Sparkles size={16} className={nextOddsBanner.isMax ? "text-emerald-400" : "text-[var(--accent)]"} />
            <span>{nextOddsBanner.text}</span>
          </div>
        )}

        {/* Active Modifiers Summary */}
        {activeModifiersList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
            <span className="font-bold text-gray-400">Active Boosts:</span>
            {activeModifiersList.map((mod, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white font-medium text-[12px]">
                {mod.image && <img src={mod.image} alt="" className="w-4 h-4 object-contain shrink-0" />}
                {mod.label}
              </span>
            ))}
          </div>
        )}

        {/* 1. Scarlet / Violet Mass Outbreak Matrix */}
        {isSVMassOutbreaks && (
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Scarlet & Violet Mass Outbreak Tier Table
            </h4>
            <div className="odds-matrix-wrapper">
              <table className="odds-matrix-table">
                <thead>
                  <tr>
                    <th>KOs Cleared</th>
                    <th>Sparkling Power</th>
                    <th>No Charm</th>
                    <th>With Shiny Charm</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { ko: "0 - 29", sp: "No Sparkling", no: "1 / 4,096", charm: "1 / 1,366", koRange: [0, 29], spLv: 0 },
                    { ko: "30 - 59", sp: "No Sparkling", no: "1 / 2,048", charm: "1 / 1,024", koRange: [30, 59], spLv: 0 },
                    { ko: "60+", sp: "No Sparkling", no: "1 / 1,366", charm: "1 / 820", koRange: [60, Infinity], spLv: 0 },
                    { ko: "0 - 29", sp: "Level 1", no: "1 / 2,048", charm: "1 / 1,024", koRange: [0, 29], spLv: 1 },
                    { ko: "30 - 59", sp: "Level 1", no: "1 / 1,366", charm: "1 / 820", koRange: [30, 59], spLv: 1 },
                    { ko: "60+", sp: "Level 1", no: "1 / 1,024", charm: "1 / 683", koRange: [60, Infinity], spLv: 1 },
                    { ko: "0 - 29", sp: "Level 2", no: "1 / 1,366", charm: "1 / 820", koRange: [0, 29], spLv: 2 },
                    { ko: "30 - 59", sp: "Level 2", no: "1 / 1,024", charm: "1 / 683", koRange: [30, 59], spLv: 2 },
                    { ko: "60+", sp: "Level 2", no: "1 / 820", charm: "1 / 586", koRange: [60, Infinity], spLv: 2 },
                    { ko: "0 - 29", sp: "Level 3", no: "1 / 1,024", charm: "1 / 683", koRange: [0, 29], spLv: 3 },
                    { ko: "30 - 59", sp: "Level 3", no: "1 / 820", charm: "1 / 586", koRange: [30, 59], spLv: 3 },
                    { ko: "60+", sp: "Level 3", no: "1 / 683", charm: "1 / 512", koRange: [60, Infinity], spLv: 3 },
                  ].map((row, idx) => {
                    const activeSp = hunt.modifiers?.sparklingLv3 ? 3 : hunt.modifiers?.sparklingLv2 ? 2 : hunt.modifiers?.sparklingLv1 ? 1 : 0;
                    const isCurrent = hunt.checks >= row.koRange[0] && hunt.checks <= row.koRange[1] && activeSp === row.spLv;

                    return (
                      <tr key={idx} className={isCurrent ? "is-current-tier" : ""}>
                        <td>{row.ko} {isCurrent && <span className="odds-tier-badge">Active</span>}</td>
                        <td>{row.sp}</td>
                        <td>{row.no}</td>
                        <td className="text-emerald-400 font-bold">{row.charm}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Let's Go Catch Combo Table */}
        {isCatchCombo && (
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Let's Go Catch Combo Odds Table
            </h4>
            <div className="odds-matrix-wrapper">
              <table className="odds-matrix-table">
                <thead>
                  <tr>
                    <th>Combo Streak</th>
                    <th>Standard</th>
                    <th>With Lure</th>
                    <th>With Shiny Charm</th>
                    <th>Charm + Lure</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { combo: "0 - 10", no: "1 / 4,096", lure: "1 / 2,048", charm: "1 / 1,365", both: "1 / 1,024", min: 0, max: 10 },
                    { combo: "11 - 20", no: "1 / 1,024", lure: "1 / 819", charm: "1 / 683", both: "1 / 585", min: 11, max: 20 },
                    { combo: "21 - 30", no: "1 / 512", lure: "1 / 455", charm: "1 / 410", both: "1 / 372", min: 21, max: 30 },
                    { combo: "31+", no: "1 / 341", lure: "1 / 315", charm: "1 / 293", both: "1 / 273", min: 31, max: Infinity },
                  ].map((row, idx) => {
                    const isCurrent = hunt.checks >= row.min && hunt.checks <= row.max;
                    return (
                      <tr key={idx} className={isCurrent ? "is-current-tier" : ""}>
                        <td>{row.combo} {isCurrent && <span className="odds-tier-badge">Active</span>}</td>
                        <td>{row.no}</td>
                        <td>{row.lure}</td>
                        <td>{row.charm}</td>
                        <td className="text-emerald-400 font-bold">{row.both}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Sun/Moon & USUM SOS Table */}
        {isSOS && (
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              SOS Chaining Odds Table
            </h4>
            <div className="odds-matrix-wrapper">
              <table className="odds-matrix-table">
                <thead>
                  <tr>
                    <th>SOS Chain Length</th>
                    <th>Without Charm</th>
                    <th>With Shiny Charm</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { chain: "0 - 10", no: "1 / 4,096", charm: "1 / 1,366", min: 0, max: 10 },
                    { chain: "11 - 20", no: "1 / 820", charm: "1 / 586", min: 11, max: 20 },
                    { chain: "21 - 30", no: "1 / 456", charm: "1 / 373", min: 21, max: 30 },
                    { chain: "31+", no: "1 / 316", charm: "1 / 274", min: 31, max: Infinity },
                  ].map((row, idx) => {
                    const isCurrent = hunt.checks >= row.min && hunt.checks <= row.max;
                    return (
                      <tr key={idx} className={isCurrent ? "is-current-tier" : ""}>
                        <td>{row.chain} {isCurrent && <span className="odds-tier-badge">Active</span>}</td>
                        <td>{row.no}</td>
                        <td className="text-emerald-400 font-bold">{row.charm}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Diamond, Pearl, Platinum Poke Radar Table */}
        {isDPPtRadar && (
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Poké Radar Chain Odds (Diamond / Pearl / Platinum)
            </h4>
            <div className="odds-matrix-wrapper">
              <table className="odds-matrix-table">
                <thead>
                  <tr>
                    <th>Chain Length</th>
                    <th>Shiny Patch Odds</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { chain: "0", odds: "1 / 8,200", min: 0, max: 9 },
                    { chain: "10", odds: "1 / 6,200", min: 10, max: 19 },
                    { chain: "20", odds: "1 / 4,200", min: 20, max: 29 },
                    { chain: "30", odds: "1 / 2,200", min: 30, max: 34 },
                    { chain: "35", odds: "1 / 1,200", min: 35, max: 39 },
                    { chain: "40+", odds: "1 / 200", min: 40, max: Infinity },
                  ].map((row, idx) => {
                    const isCurrent = hunt.checks >= row.min && hunt.checks <= row.max;
                    return (
                      <tr key={idx} className={isCurrent ? "is-current-tier" : ""}>
                        <td>{row.chain} {isCurrent && <span className="odds-tier-badge">Active</span>}</td>
                        <td className="text-emerald-400 font-bold">{row.odds}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Sword & Shield KO Method Table */}
        {isSwShKO && (
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Sword & Shield Number Battled (KO Method) Table
            </h4>
            <div className="odds-matrix-wrapper">
              <table className="odds-matrix-table">
                <thead>
                  <tr>
                    <th>Number Battled</th>
                    <th>Without Charm</th>
                    <th>With Shiny Charm</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { kos: "0 - 49", no: "1 / 2,048", charm: "1 / 1,024", min: 0, max: 49 },
                    { kos: "50 - 99", no: "1 / 1,366", charm: "1 / 820", min: 50, max: 99 },
                    { kos: "100 - 199", no: "1 / 1,025", charm: "1 / 683", min: 100, max: 199 },
                    { kos: "200 - 299", no: "1 / 820", charm: "1 / 586", min: 200, max: 299 },
                    { kos: "300 - 499", no: "1 / 683", charm: "1 / 512", min: 300, max: 499 },
                    { kos: "500+", no: "1 / 586", charm: "1 / 456", min: 500, max: Infinity },
                  ].map((row, idx) => {
                    const isCurrent = hunt.checks >= row.min && hunt.checks <= row.max;
                    return (
                      <tr key={idx} className={isCurrent ? "is-current-tier" : ""}>
                        <td>{row.kos} {isCurrent && <span className="odds-tier-badge">Active</span>}</td>
                        <td>{row.no}</td>
                        <td className="text-emerald-400 font-bold">{row.charm}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. Pokémon Legends: Arceus Research Odds Matrix */}
        {isPLAResearch && (
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Pokémon Legends: Arceus Research Odds Matrix
            </h4>
            <div className="odds-matrix-wrapper">
              <table className="odds-matrix-table">
                <thead>
                  <tr>
                    <th>Research Status</th>
                    <th>Standard Outbreaks</th>
                    <th>PERMUTATIONS</th>
                    <th>Standard Wild</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Standard (Lv 0-9)</td>
                    <td>1 / 158</td>
                    <td>1 / 315</td>
                    <td>1 / 4,096</td>
                  </tr>
                  <tr>
                    <td>Species Lv 10</td>
                    <td>1 / 152</td>
                    <td>1 / 293</td>
                    <td>1 / 2,048</td>
                  </tr>
                  <tr>
                    <td>Perfect Entry ⭐</td>
                    <td>1 / 141</td>
                    <td>1 / 256</td>
                    <td>1 / 1,024</td>
                  </tr>
                  <tr className="text-emerald-400 font-bold">
                    <td>Perfect + Shiny Charm ✨</td>
                    <td>1 / 128</td>
                    <td>1 / 216</td>
                    <td>1 / 585</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. Static Method Details (e.g. Soft Resets, Masuda, Random Encounters) */}
        {!isSOS && !isCatchCombo && !isSVMassOutbreaks && !isSwShKO && !isDPPtRadar && !isPLAResearch && (
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-gray-300 flex flex-col gap-2">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">Method Behavior</span>
            <p className="text-gray-300 leading-relaxed">
              This method maintains fixed odds of <strong className="text-emerald-400">1 / {currentDynamicOdds.toLocaleString()}</strong> per encounter across all checks.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
