import React, { useState, useMemo } from "react";
import { Modal, ConfirmModal, Button } from "../Shared";
import {
  History,
  Trophy,
  XCircle,
  CheckCircle2,
  Sparkles,
  Clock,
  Search,
  X,
  Plus,
  Trash2,
  Flag,
  Calendar
} from "lucide-react";
import { GAME_OPTIONS } from "../../Constants";
import { getSpriteUrl } from "../../utils/spriteUtils";
import { formatDigitalTime } from "../../utils/huntSync";
import pokemonData from "../../data/pokemon.json";
import formsDataDefault from "../../utils/loadFormsData";

const getGameImage = (gameName) => {
  if (!gameName) return "";
  const match = GAME_OPTIONS.find(
    g => g.name.toLowerCase() === gameName.toLowerCase() || g.value?.toLowerCase() === gameName.toLowerCase()
  );
  return match?.image || "";
};

const formatPokemonName = (name) => {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
};

export default function HuntHistoryModal({
  isOpen,
  onClose,
  huntHistory = [],
  mode = "counters", // "counters" | "mmo"
  onDeleteEntry,
  onClearAll,
  onOpenWizard,
  useHomeSprites = false,
  formsData = formsDataDefault
}) {
  const [historyTab, setHistoryTab] = useState("all");
  const [historySearch, setHistorySearch] = useState("");
  const [deleteEntryModal, setDeleteEntryModal] = useState({ show: false, entry: null });
  const [clearAllModal, setClearAllModal] = useState(false);

  // Filter history specific to page mode
  const scopedHistory = useMemo(() => {
    if (!Array.isArray(huntHistory)) return [];
    if (mode === "mmo") {
      return huntHistory.filter(
        h => h.game === "Legends Arceus" && (h.method === "Permutations" || h.method === "Massive Mass Outbreak" || h.method === "Massive Mass Outbreaks")
      );
    }
    // "counters" mode: exclude PLA Permutation hunts
    return huntHistory.filter(
      h => !(h.game === "Legends Arceus" && (h.method === "Permutations" || h.method === "Massive Mass Outbreak" || h.method === "Massive Mass Outbreaks"))
    );
  }, [huntHistory, mode]);

  const completedList = useMemo(() => {
    return scopedHistory.filter(h => h.outcome !== "failed" && !h.isFail);
  }, [scopedHistory]);

  const failsList = useMemo(() => {
    return scopedHistory.filter(h => h.outcome === "failed" || h.isFail);
  }, [scopedHistory]);

  const totalChecksCount = useMemo(() => {
    return scopedHistory.reduce((acc, h) => acc + (h.totalChecks || h.checks || 0), 0);
  }, [scopedHistory]);

  const totalElapsedTimeMs = useMemo(() => {
    return scopedHistory.reduce((acc, h) => acc + (h.elapsedMs || h.time || 0), 0);
  }, [scopedHistory]);

  const getHistoryPokemon = (entry) => {
    if (entry.pokemon && (entry.pokemon.image || entry.pokemon.sprites || entry.pokemon.id)) {
      return entry.pokemon;
    }
    const cleanName = (entry.pokemonName || (entry.caughtKey ? entry.caughtKey.split("-")[0] : "") || "").trim();
    const base = pokemonData.find(p => p.name?.toLowerCase() === cleanName.toLowerCase());
    const form = formsData?.find(f => (f.stableId && f.stableId === cleanName) || f.name?.toLowerCase() === cleanName.toLowerCase());
    return form || base || { name: cleanName, id: 1 };
  };

  const filteredEntries = useMemo(() => {
    let sourceList = scopedHistory;
    if (historyTab === "completed") {
      sourceList = completedList;
    } else if (historyTab === "fails") {
      sourceList = failsList;
    }

    const query = historySearch.trim().toLowerCase();
    if (!query) return sourceList;

    return sourceList.filter(entry => {
      const pName = (entry.pokemonName || entry.pokemon?.name || "").toLowerCase();
      const nick = (entry.nickname || "").toLowerCase();
      const game = (entry.game || "").toLowerCase();
      const method = (entry.method || "").toLowerCase();
      const notes = (entry.notes || "").toLowerCase();
      const reason = (entry.reason || "").toLowerCase();
      return (
        pName.includes(query) ||
        nick.includes(query) ||
        game.includes(query) ||
        method.includes(query) ||
        notes.includes(query) ||
        reason.includes(query)
      );
    });
  }, [scopedHistory, completedList, failsList, historyTab, historySearch]);

  const isMMO = mode === "mmo";
  const modalTitle = isMMO ? "MMO Permutations History" : "Hunt History";
  const modalSubtitle =
    scopedHistory.length === 0
      ? isMMO
        ? "All completed Massive Mass Outbreak permutation hunts and fails"
        : "All completed hunts and logged fails tracked through Counters"
      : `${completedList.length} completed • ${failsList.length} fails recorded`;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setHistorySearch("");
          setHistoryTab("all");
        }}
        title={modalTitle}
        subtitle={modalSubtitle}
        icon={<History size={22} className="text-[var(--accent)]" />}
        size="lg"
        className="!max-w-[760px]"
        footer={({ close }) => (
          <div className="flex items-center justify-between w-full">
            {scopedHistory.length > 0 ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setClearAllModal(true)}
                icon={<Trash2 size={14} />}
              >
                Clear History
              </Button>
            ) : <div />}
            <Button variant="secondary" size="md" onClick={close}>
              Close
            </Button>
          </div>
        )}
      >
        <div className="history-modal-container">
          {scopedHistory.length > 0 && (
            <>
              {/* Summary Stats Grid */}
              <div className="history-stats-grid">
                <div className="history-stat-card">
                  <div className="history-stat-label-row">
                    <Trophy size={13} className="text-amber-300" />
                    <span>Completed</span>
                  </div>
                  <span className="history-stat-value text-amber-300">
                    {completedList.length} <span className="text-xs font-normal text-gray-400">Shinies</span>
                  </span>
                </div>

                <div className="history-stat-card">
                  <div className="history-stat-label-row">
                    <XCircle size={13} className="text-rose-400" />
                    <span>Logged Fails</span>
                  </div>
                  <span className="history-stat-value text-rose-400">
                    {failsList.length} <span className="text-xs font-normal text-gray-400">Fails</span>
                  </span>
                </div>

                <div className="history-stat-card">
                  <div className="history-stat-label-row">
                    <Sparkles size={13} className="text-[var(--accent)]" />
                    <span>Total Checks</span>
                  </div>
                  <span className="history-stat-value text-[var(--accent)]">
                    {totalChecksCount.toLocaleString()}
                  </span>
                </div>

                <div className="history-stat-card">
                  <div className="history-stat-label-row">
                    <Clock size={13} className="text-emerald-400" />
                    <span>Total Time</span>
                  </div>
                  <span className="history-stat-value text-emerald-400 font-mono text-sm sm:text-base">
                    {formatDigitalTime(totalElapsedTimeMs)}
                  </span>
                </div>
              </div>

              {/* View Switcher Tabs & Search Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      historyTab === "all"
                        ? "bg-white/15 text-white shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                    onClick={() => setHistoryTab("all")}
                  >
                    <span>All</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10">{scopedHistory.length}</span>
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      historyTab === "completed"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                    onClick={() => setHistoryTab("completed")}
                  >
                    <Trophy size={12} />
                    <span>Completed</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10">{completedList.length}</span>
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      historyTab === "fails"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                    onClick={() => setHistoryTab("fails")}
                  >
                    <XCircle size={12} />
                    <span>Fails</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300">{failsList.length}</span>
                  </button>
                </div>

                {/* Search / Filter Input */}
                <div className="history-search-box flex-1 !my-0">
                  <Search size={16} className="history-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by Pokémon, game, method, reason..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="history-search-input"
                  />
                  {historySearch && (
                    <button
                      type="button"
                      className="history-search-clear"
                      onClick={() => setHistorySearch("")}
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {scopedHistory.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <Trophy size={28} />
              </div>
              <h4 className="text-base font-black text-white">No {isMMO ? "MMO Permutation" : "Hunt"} History Yet</h4>
              <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                {isMMO
                  ? "When you finish an outbreak permutation hunt or log a fail, your records will be archived here."
                  : "When you finish hunting a target Pokémon or log a shiny fail in Counters, your completed shiny encounter records, encounter counts, hunting time, and phases will be safely archived here."}
              </p>
              {onOpenWizard && (
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      onClose();
                      onOpenWizard();
                    }}
                    icon={<Plus size={16} strokeWidth={2.5} />}
                  >
                    Start a Shiny Hunt
                  </Button>
                </div>
              )}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-10 text-gray-400 space-y-2">
              <Search size={32} className="mx-auto text-gray-600 mb-1" />
              <p className="font-semibold text-sm">
                No {historyTab === "fails" ? "fails" : historyTab === "completed" ? "completed hunts" : "history entries"} match your search
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setHistorySearch("");
                  setHistoryTab("all");
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="history-entries-list custom-scrollbar">
              {filteredEntries.map(entry => {
                const isFail = entry.outcome === "failed" || entry.isFail;
                const fullPokemon = getHistoryPokemon(entry);
                const entryDateStr = entry.date
                  ? new Date(entry.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                  : "Recorded";
                const totalChecks = entry.totalChecks || entry.checks || 0;
                const elapsedMs = entry.elapsedMs || entry.time || 0;
                const calculatedOdds = entry.odds || 4096;
                const phaseVal = isFail
                  ? `Phase ${entry.phaseNumber || 1}`
                  : (entry.phaseCount || (entry.phases ? entry.phases.length + 1 : 1));

                return (
                  <div
                    key={entry.entryId || entry.id || entry.timestamp}
                    className={`history-entry-card ${isFail ? "is-failed" : "is-caught"}`}
                  >
                    {/* Left: Sprite Box */}
                    <div className="history-entry-sprite-box">
                      <Sparkles
                        size={14}
                        className={`history-entry-corner-sparkle ${isFail ? "text-rose-400" : "text-emerald-400"}`}
                      />
                      <img
                        src={getSpriteUrl(fullPokemon, true, useHomeSprites)}
                        alt=""
                        className={`history-entry-sprite ${!useHomeSprites ? "pixelated" : ""}`}
                        style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                        onError={(e) => { e.currentTarget.src = "/fallback.png"; }}
                      />
                    </div>

                    {/* Right: Main Content Area */}
                    <div className="history-entry-main">
                      {/* Top Header Row */}
                      <div className="history-entry-header">
                        <div className="history-entry-title-group">
                          <h4 className="history-entry-pokemon-name">
                            {formatPokemonName(fullPokemon?.name || entry.pokemonName)}
                          </h4>
                          <Sparkles
                            size={14}
                            className={`shrink-0 ${isFail ? "text-rose-400" : "text-emerald-400"}`}
                          />
                          {fullPokemon?.id != null && (
                            <span className="history-entry-dex-num">
                              #{String(fullPokemon.id).padStart(4, "0")}
                            </span>
                          )}
                          {entry.nickname && (
                            <span className="history-entry-nickname">
                              "{entry.nickname}"
                            </span>
                          )}
                        </div>

                        <div className="history-entry-status-actions">
                          {isFail ? (
                            <span className="history-status-badge failed">
                              <XCircle size={13} strokeWidth={2.5} />
                              <span>FAILED</span>
                            </span>
                          ) : (
                            <span className="history-status-badge caught">
                              <CheckCircle2 size={13} strokeWidth={2.5} />
                              <span>CAUGHT</span>
                            </span>
                          )}
                          <button
                            type="button"
                            className="history-action-btn"
                            onClick={() => setDeleteEntryModal({ show: true, entry })}
                            title={isFail ? "Remove fail from history" : "Remove hunt from history"}
                            aria-label={isFail ? "Remove fail from history" : "Remove hunt from history"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Middle Badges Row */}
                      <div className="history-entry-meta-row">
                        {entry.game && (
                          <span className="history-meta-pill">
                            {getGameImage(entry.game) ? (
                              <img src={getGameImage(entry.game)} alt="" className="w-3.5 h-3.5 object-contain" />
                            ) : (
                              <span>🎮</span>
                            )}
                            <span>{entry.game}</span>
                          </span>
                        )}
                        {entry.method && (
                          <span className="history-meta-pill">
                            <span className="text-[var(--accent)]">✦</span>
                            <span>{entry.method}</span>
                          </span>
                        )}
                        <span className="history-meta-pill text-gray-400">
                          <Calendar size={12} className="text-gray-500" />
                          <span>{entryDateStr}</span>
                        </span>
                        {entry.ball && (
                          <span className="history-meta-pill text-gray-300">
                            <span>{entry.ball}</span>
                          </span>
                        )}
                        {entry.addedToLivingDex && (
                          <span className="history-meta-pill !bg-emerald-500/10 !border-emerald-500/25 !text-emerald-300 font-bold">
                            <span>Living Dex ✓</span>
                          </span>
                        )}
                      </div>

                      {/* Bottom 4-Column Stats Grid */}
                      <div className="history-entry-stats-grid">
                        <div className="history-entry-stat-col">
                          <span className="history-entry-stat-label">
                            {isFail ? "FAILED AT" : "CHECKS"}
                          </span>
                          <span className={`history-entry-stat-val ${isFail ? "!text-rose-400" : "!text-emerald-400"}`}>
                            {totalChecks.toLocaleString()} {isFail ? "checks" : ""}
                          </span>
                          {isFail && (
                            <span className="history-entry-stat-sub" title={entry.reason || "Failed Encounter"}>
                              {entry.reason || "Failed Encounter"}
                            </span>
                          )}
                        </div>

                        <div className="history-entry-stat-col">
                          <span className="history-entry-stat-label">TIME</span>
                          <span className="history-entry-stat-val">
                            <Clock size={13} className="text-gray-400 shrink-0" />
                            <span>{elapsedMs > 0 ? formatDigitalTime(elapsedMs) : "00:00"}</span>
                          </span>
                        </div>

                        <div className="history-entry-stat-col">
                          <span className="history-entry-stat-label">ODDS</span>
                          <span className="history-entry-stat-val">
                            <Sparkles size={13} className="text-amber-400 shrink-0" />
                            <span>1 / {calculatedOdds.toLocaleString()}</span>
                          </span>
                        </div>

                        <div className="history-entry-stat-col">
                          <span className="history-entry-stat-label">
                            {!isFail && (entry.phaseCount > 1 || (entry.phases && entry.phases.length > 0)) ? "PHASES" : "PHASE"}
                          </span>
                          <span className="history-entry-stat-val">
                            <Flag size={13} className="text-gray-400 shrink-0" />
                            <span>{phaseVal}</span>
                          </span>
                        </div>
                      </div>

                      {entry.notes && (
                        <p className="text-[11px] text-gray-400 italic line-clamp-1 border-t border-white/[0.04] pt-1">
                          "{entry.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Single History Entry Confirmation */}
      <ConfirmModal
        isOpen={deleteEntryModal.show}
        onClose={() => setDeleteEntryModal({ show: false, entry: null })}
        onConfirm={() => {
          if (deleteEntryModal.entry) {
            onDeleteEntry?.(deleteEntryModal.entry);
            setDeleteEntryModal({ show: false, entry: null });
          }
        }}
        title="Delete History Entry"
        message={`Are you sure you want to remove this ${deleteEntryModal.entry?.isFail ? "failed encounter" : "completed shiny hunt"} for ${
          deleteEntryModal.entry
            ? formatPokemonName(deleteEntryModal.entry.pokemonName || deleteEntryModal.entry.pokemon?.name)
            : "this Pokémon"
        } from your history?`}
        confirmText="Delete Entry"
        variant="danger"
      />

      {/* Clear All History Confirmation */}
      <ConfirmModal
        isOpen={clearAllModal}
        onClose={() => setClearAllModal(false)}
        onConfirm={() => {
          onClearAll?.(mode);
          setClearAllModal(false);
        }}
        title={`Clear All ${isMMO ? "MMO Permutation" : "Hunt"} History`}
        subtitle="This action cannot be undone"
        message={`Are you sure you want to clear your entire ${isMMO ? "MMO permutation" : "completed hunt"} history? All archived hunt counts and times will be permanently removed.`}
        confirmText="Clear All History"
        variant="danger"
      />
    </>
  );
}
