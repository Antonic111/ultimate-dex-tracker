import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, SearchField, TextField, SelectField, TextArea } from "../Shared";
import { Sparkles, Check, X, HeartCrack, BadgeCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { BALL_OPTIONS, MARK_OPTIONS } from "../../Constants";
import {
  getCurrentHuntOdds,
  calculateOdds
} from "../../utils/huntSystem";
import { getValidBallNamesForGame } from "../../data/gameBalls";
import { formatDigitalTime, getHuntElapsedTime } from "../../utils/huntSync";
import { getSpriteUrl } from "../../utils/spriteUtils";
import { validateContent } from "../../../shared/contentFilter";
import { getAvailableGamesForPokemonSidebar } from "../../utils/pokemonAvailability";

const MARKS_GAMES = ["Scarlet", "Violet", "Sword", "Shield"];

const formatPokemonName = (name) => {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const getFormDisplayName = (pokemon) => {
  if (!pokemon) return "";
  if (pokemon.formDisplayName) return pokemon.formDisplayName;
  if (pokemon.form) return pokemon.form;
  if (pokemon.formType && pokemon.formType !== "main") {
    return pokemon.formType.charAt(0).toUpperCase() + pokemon.formType.slice(1);
  }
  return "";
};

export default function ShinyEncounterModal({
  isOpen,
  onClose,
  hunt,
  allPokemon = [],
  formsData = [],
  useHomeSprites = false,
  username = null,
  showMessage = () => {},
  onCompleteTargetHunt,
  onContinueAfterPhase,
  onAddShinyToCollection,
  onAddShinyFailToCollection
}) {
  const [step, setStep] = useState(1); // 1: Select Pokemon, 2: Encounter details, 3: Outcome summary
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [isTarget, setIsTarget] = useState(true);
  const [outcome, setOutcome] = useState(null); // "caught" | "failed"
  const [nickname, setNickname] = useState("");
  const [ball, setBall] = useState("");
  const [mark, setMark] = useState("");
  const [notes, setNotes] = useState("");
  const [addedToCollection, setAddedToCollection] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formTab, setFormTab] = useState("all");
  const [phaseResult, setPhaseResult] = useState(null);

  // Reset/Initialize state when modal opens
  useEffect(() => {
    if (isOpen && hunt) {
      setStep(1);
      setSelectedPokemon(hunt.pokemon);
      setIsTarget(true);
      setOutcome(null);
      setNickname("");
      setBall(hunt.ball || "");
      setMark(hunt.mark || "");
      setNotes("");
      setAddedToCollection(false);
      setSearchTerm("");
      setFormTab("all");
      setPhaseResult(null);
    }
  }, [isOpen, hunt]);

  const getPokemonImage = (pokemon) => {
    if (!pokemon) return "/fallback.png";
    if (pokemon.customImage) return pokemon.customImage;
    return getSpriteUrl(pokemon, true, useHomeSprites);
  };

  // Available games / ball options
  const gameBallOptions = useMemo(() => {
    if (!hunt) return BALL_OPTIONS;
    const validNames = getValidBallNamesForGame(hunt.game || "Scarlet");
    if (validNames?.length) {
      return BALL_OPTIONS.filter(b => b.value === "" || validNames.includes(b.value));
    }
    return BALL_OPTIONS;
  }, [hunt]);

  // Obtainable Pokemon for the current hunt's game in step 1
  const shinyEncounterAvailablePokemon = useMemo(() => {
    if (!hunt || !allPokemon || allPokemon.length === 0) return [];
    const currentGame = hunt.game;

    return allPokemon.filter(p => {
      // 1. Check game obtainability (with shiny availability flag true)
      const availGames = getAvailableGamesForPokemonSidebar(p, true);
      const isAvailableInGame = availGames && availGames.includes(currentGame);
      if (!isAvailableInGame) return false;

      // 2. Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const matchesName = p.name?.toLowerCase().includes(term);
        const matchesNumber = String(p.id).includes(term);
        const matchesForm = p.form?.toLowerCase().includes(term) || p.formType?.toLowerCase().includes(term);
        if (!matchesName && !matchesNumber && !matchesForm) return false;
      }

      // 3. Filter by form category tab
      if (formTab !== "all") {
        if (formTab === "base" && p.formType && p.formType !== "main") return false;
        if (formTab === "regional" && !["alolan", "galarian", "hisuian", "paldean"].includes(p.formType)) return false;
        if (formTab === "mega" && p.formType !== "mega") return false;
        if (formTab === "gmax" && p.formType !== "gmax") return false;
        if (formTab === "other" && (!p.formType || ["main", "alolan", "galarian", "hisuian", "paldean", "mega", "gmax"].includes(p.formType))) return false;
      }

      return true;
    });
  }, [hunt, allPokemon, searchTerm, formTab]);

  // Available form tabs based on available Pokemon
  const availableShinyEncounterFormTabs = useMemo(() => {
    if (!hunt || !allPokemon || allPokemon.length === 0) return [];
    const currentGame = hunt.game;
    const gamePokemon = allPokemon.filter(p => {
      const avail = getAvailableGamesForPokemonSidebar(p, true);
      return avail && avail.includes(currentGame);
    });

    const tabs = [{ id: "all", label: "All" }];
    const hasBase = gamePokemon.some(p => !p.formType || p.formType === "main");
    const hasRegional = gamePokemon.some(p => ["alolan", "galarian", "hisuian", "paldean"].includes(p.formType));
    const hasMega = gamePokemon.some(p => p.formType === "mega");
    const hasGmax = gamePokemon.some(p => p.formType === "gmax");
    const hasOther = gamePokemon.some(p => p.formType && !["main", "alolan", "galarian", "hisuian", "paldean", "mega", "gmax"].includes(p.formType));

    if (hasBase) tabs.push({ id: "base", label: "Base" });
    if (hasRegional) tabs.push({ id: "regional", label: "Regional" });
    if (hasMega) tabs.push({ id: "mega", label: "Mega" });
    if (hasGmax) tabs.push({ id: "gmax", label: "G-Max" });
    if (hasOther) tabs.push({ id: "other", label: "Forms" });

    return tabs;
  }, [hunt, allPokemon]);

  if (!hunt) return null;

  const handleSelectShinyPokemon = (pokemon, isTargetOverride) => {
    if (!pokemon) return;
    const targetStatus = isTargetOverride !== undefined
      ? isTargetOverride
      : ((pokemon.stableId || pokemon.id) === (hunt.pokemon?.stableId || hunt.pokemon?.id));

    setSelectedPokemon(pokemon);
    setIsTarget(targetStatus);
    setStep(2);
  };

  const handleConfirmShinyOutcome = (chosenOutcome) => {
    if (!selectedPokemon) return;

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
        totalOverallChecks = currentChecks;
        intervalChecks = currentChecks - lastTotalChecks;
      } else {
        totalOverallChecks = lastTotalChecks + currentChecks;
        intervalChecks = currentChecks;
      }
    } else {
      totalOverallChecks = currentChecks;
      intervalChecks = currentChecks;
    }

    const dynamicOddsNum = getCurrentHuntOdds(
      hunt.game,
      hunt.method,
      hunt.modifiers || {},
      intervalChecks || currentChecks
    );
    const phaseNumber = phases.length + 1;

    if (chosenOutcome === "caught") {
      const rawNickname = (nickname || "").trim();
      const rawNotes = (notes || "").trim();

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
      isTarget,
      outcome: chosenOutcome, // "caught" | "failed"
      phaseChecks: Math.max(0, intervalChecks),
      totalChecks: totalOverallChecks,
      elapsedMs: totalElapsedMs,
      odds: dynamicOddsNum,
      game: hunt.game,
      method: hunt.method,
      modifiers: { ...(hunt.modifiers || {}) },
      nickname: chosenOutcome === "caught" ? (nickname || "").trim() : "",
      ball: chosenOutcome === "caught" ? (ball || "") : "",
      mark: chosenOutcome === "caught" ? (mark || "") : "",
      notes: notes || "",
      date: new Date().toISOString(),
      timestamp: now,
      addedToCollection: false
    };

    setOutcome(chosenOutcome);
    setPhaseResult(phaseRecord);
    setStep(3);
  };

  const handleAddShiny = async () => {
    if (!selectedPokemon || !phaseResult) return;
    if (onAddShinyToCollection) {
      const success = await onAddShinyToCollection(selectedPokemon, phaseResult, hunt);
      if (success) setAddedToCollection(true);
    }
  };

  const handleAddFail = async () => {
    if (!selectedPokemon || !phaseResult) return;
    if (onAddShinyFailToCollection) {
      const success = await onAddShinyFailToCollection(selectedPokemon, phaseResult, hunt);
      if (success) setAddedToCollection(true);
    }
  };

  const handleComplete = () => {
    if (onCompleteTargetHunt && phaseResult) {
      onCompleteTargetHunt(hunt, phaseResult);
    }
  };

  const handleContinue = () => {
    if (onContinueAfterPhase && phaseResult) {
      onContinueAfterPhase(phaseResult);
    }
  };

  const gameHasMarks = MARKS_GAMES.includes(hunt.game);
  const rawNick = (nickname || "").trim();
  const nickValidation = rawNick ? validateContent(rawNick, "nickname") : { isValid: true };
  const rawNote = (notes || "").trim();
  const noteValidation = rawNote ? validateContent(rawNote, "notes") : { isValid: true };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Shiny Encounter!"
      subtitle={
        step === 1
          ? "What shiny Pokémon appeared?"
          : step === 2
          ? `What happened to Shiny ${formatPokemonName(selectedPokemon?.name)}?`
          : isTarget && outcome === "caught"
          ? "Target Pokémon Found & Captured!"
          : outcome === "caught"
          ? `Phase ${phaseResult?.phaseNumber || 1} Captured!`
          : "Encounter Failed"
      }
      size="md"
      className="!max-w-[620px]"
      closeButtonDisabled={step === 3}
      closeOnEscape={step !== 3}
      footer={({ close }) =>
        step === 1 ? (
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
        ) : step === 2 ? (
          <div className="flex items-center justify-between w-full gap-2">
            <Button
              variant="secondary"
              icon={<ArrowLeft size={16} strokeWidth={2.5} />}
              onClick={() => {
                if (outcome) {
                  setOutcome(null);
                } else {
                  setStep(1);
                }
              }}
            >
              Back
            </Button>
            {outcome === "caught" ? (
              <Button
                variant="primary"
                className="!font-black shadow-md"
                onClick={() => handleConfirmShinyOutcome("caught")}
                iconRight={<ArrowRight size={16} strokeWidth={2.5} />}
              >
                Continue
              </Button>
            ) : (
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
            )}
          </div>
        ) : null
      }
    >
      <div className="space-y-4">
        {/* STEP 1: What appeared? */}
        {step === 1 && (
          <div className="space-y-4">
            {/* 1. Target Card */}
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-2">
                Main Hunt Target
              </span>
              <div className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)]/15 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center p-1">
                    <img
                      src={getPokemonImage(hunt.pokemon)}
                      alt=""
                      className={`w-12 h-12 object-contain ${!useHomeSprites ? "pixelated" : ""}`}
                      style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                    />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">
                      {formatPokemonName(hunt.pokemon?.name)}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      {hunt.pokemon?.id != null && (
                        <span className="text-xs font-mono text-gray-400 font-medium">
                          #{String(hunt.pokemon.id).padStart(4, "0")}
                        </span>
                      )}
                      {getFormDisplayName(hunt.pokemon) && (
                        <span className="text-xs text-[var(--accent)] font-semibold">
                          {getFormDisplayName(hunt.pokemon)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="!font-black shadow-md shrink-0"
                  onClick={() => handleSelectShinyPokemon(hunt.pokemon, true)}
                  icon={<BadgeCheck size={16} strokeWidth={2.5} />}
                >
                  Target Appeared
                </Button>
              </div>
            </div>

            {/* 2. Possible Phases Shortcuts */}
            {hunt.possiblePhases?.length > 0 && (
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-2">
                  Possible Phases (Quick Select)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {hunt.possiblePhases.map(pkm => {
                    const formLabel = getFormDisplayName(pkm);
                    const dexNum = pkm.id != null ? `#${String(pkm.id).padStart(4, "0")}` : "";

                    return (
                      <button
                        key={pkm.stableId || `${pkm.id}-${pkm.name}`}
                        type="button"
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[var(--accent)] transition text-left group cursor-pointer"
                        onClick={() => handleSelectShinyPokemon(pkm, false)}
                      >
                        <img
                          src={getPokemonImage(pkm)}
                          alt=""
                          className={`w-10 h-10 object-contain group-hover:scale-110 transition-transform shrink-0 ${!useHomeSprites ? "pixelated" : ""}`}
                          style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-white line-clamp-1">
                            {formatPokemonName(pkm.name)}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {dexNum && (
                              <span className="text-[10px] font-mono text-gray-400 font-medium leading-none">
                                {dexNum}
                              </span>
                            )}
                            {formLabel && (
                              <span className="text-[10px] text-[var(--accent)] font-semibold truncate leading-none">
                                {formLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Search Any Obtainable Pokémon */}
            {hunt.allowAnyPhase !== false ? (
              <div className="space-y-2.5 pt-1">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400 block">
                  Search Any Obtainable Pokémon ({hunt.game})
                </span>
                <SearchField
                  value={searchTerm}
                  onChange={(val) => setSearchTerm(typeof val === "string" ? val : val?.target?.value || "")}
                  placeholder={`Search Pokémon in ${hunt.game} by name or #dex...`}
                  fullWidth
                />

                {/* Form Tabs */}
                {availableShinyEncounterFormTabs.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none custom-scrollbar">
                    {availableShinyEncounterFormTabs.map(tab => {
                      const isActive = (formTab || "all") === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            isActive
                              ? "bg-[var(--accent)] text-black shadow-sm"
                              : "bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"
                          }`}
                          onClick={() => setFormTab(tab.id)}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1 overscroll-contain">
                  {shinyEncounterAvailablePokemon.map(pokemon => {
                    const formLabel = getFormDisplayName(pokemon);
                    const dexNum = pokemon.id != null ? `#${String(pokemon.id).padStart(4, "0")}` : "";

                    return (
                      <button
                        key={pokemon.stableId || `${pokemon.id}-${pokemon.name}`}
                        type="button"
                        className="flex flex-col items-center pt-0 pb-2 px-1.5 rounded-xl border transition group text-left relative overflow-hidden bg-white/[0.03] border-white/[0.08] hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 cursor-pointer"
                        onClick={() => handleSelectShinyPokemon(pokemon, false)}
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
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (!hunt.possiblePhases || hunt.possiblePhases.length === 0) ? (
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center text-xs text-gray-400">
                Only the main target Pokémon is tracked for this hunt.
              </div>
            ) : null}
          </div>
        )}

        {/* STEP 2: What happened? */}
        {step === 2 && selectedPokemon && (
          <div className="space-y-4">
            {/* Identity Banner */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
              <img
                src={getPokemonImage(selectedPokemon)}
                alt=""
                className={`w-12 h-12 object-contain ${!useHomeSprites ? "pixelated" : ""}`}
                style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
              />
              <div>
                <h4 className="font-extrabold text-white text-base">
                  Shiny {formatPokemonName(selectedPokemon?.name)}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  {selectedPokemon?.id != null && (
                    <span className="text-xs font-mono text-gray-400 font-medium">
                      #{String(selectedPokemon.id).padStart(4, "0")}
                    </span>
                  )}
                  {getFormDisplayName(selectedPokemon) && (
                    <span className="text-xs text-[var(--accent)] font-semibold">
                      {getFormDisplayName(selectedPokemon)}
                    </span>
                  )}
                  {!isTarget && (
                    <span className="text-xs font-bold text-white/70">
                      • Phase Pokémon
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Outcome Selection Buttons */}
            {!outcome && (
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-gray-300 block mb-2.5">
                  What happened?
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-400 transition group shadow-lg cursor-pointer"
                    onClick={() => setOutcome("caught")}
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Check size={24} strokeWidth={3} />
                    </div>
                    <span className="text-base font-black text-white">Caught</span>
                    <span className="text-xs text-emerald-400 font-semibold mt-0.5">
                      Successfully captured!
                    </span>
                  </button>

                  <button
                    type="button"
                    className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-400 transition group shadow-lg cursor-pointer"
                    onClick={() => handleConfirmShinyOutcome("failed")}
                  >
                    <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <X size={24} strokeWidth={3} />
                    </div>
                    <span className="text-base font-black text-white">Failed</span>
                    <span className="text-xs text-rose-400 font-semibold mt-0.5">
                      Fainted, fled, or reset
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* If Caught Selected: Details inputs */}
            {outcome === "caught" && (
              <div className="space-y-4 animate-fade-in transition-all">
                <div className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 shadow-sm">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    Outcome: Caught
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  <TextField
                    label="Nickname (Optional)"
                    placeholder="e.g. Sparky"
                    value={nickname}
                    onChange={(e) => setNickname(e.target?.value !== undefined ? e.target.value : e)}
                    maxLength={12}
                    showCharCount
                    charCountInHeader
                    error={!nickValidation.isValid ? nickValidation.error : null}
                    helperText={!nickValidation.isValid ? nickValidation.error : null}
                    fullWidth
                  />

                  <div className="hunt-modal-grid">
                    <SelectField
                      label="Ball Caught In (Optional)"
                      options={[
                        { value: "", label: "None / Default" },
                        ...gameBallOptions.filter(b => b.value !== "").map(b => ({
                          value: b.value,
                          label: b.label || b.name || b.value,
                          image: b.image || null
                        }))
                      ]}
                      value={ball}
                      onChange={(val) => setBall(val)}
                      searchable
                      fullWidth
                    />

                    <SelectField
                      label="Mark / Ribbon (Optional)"
                      options={[
                        { value: "", label: "None" },
                        ...MARK_OPTIONS.filter(m => m.value !== "" && m.value !== "mightiest").map(m => ({
                          value: m.value,
                          label: m.label || m.name || m.value,
                          image: m.image || null
                        }))
                      ]}
                      value={gameHasMarks ? mark : ""}
                      onChange={(val) => setMark(val)}
                      placeholder={!gameHasMarks ? `Marks unavailable in ${hunt.game || "this game"}` : "None"}
                      disabled={!gameHasMarks}
                      searchable
                      fullWidth
                    />
                  </div>

                  <TextArea
                    label="Encounter Notes (Optional)"
                    placeholder="Notes about this shiny encounter..."
                    value={notes}
                    onChange={(e) => setNotes(e.target?.value !== undefined ? e.target.value : e)}
                    maxLength={200}
                    showCharCount
                    charCountInHeader
                    error={!noteValidation.isValid ? noteValidation.error : null}
                    helperText={!noteValidation.isValid ? noteValidation.error : null}
                    fullWidth
                    rows={2}
                    resize="none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Outcome Display */}
        {step === 3 && phaseResult && (
          <div className="space-y-4">
            {/* 1. Target Caught */}
            {isTarget && outcome === "caught" && (
              <div className="space-y-4 text-center">
                <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-500/20 via-black/40 to-black/60 border-2 border-emerald-500/60 flex flex-col items-center gap-2 shadow-2xl">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-3.5 py-1 rounded-full border border-emerald-500/30">
                    <Sparkles size={14} className="text-emerald-400 shrink-0" strokeWidth={2.5} />
                    <span>TARGET FOUND!</span>
                  </span>

                  <img
                    src={getPokemonImage(selectedPokemon)}
                    alt=""
                    className={`w-36 h-36 sm:w-40 sm:h-40 object-contain animate-bounce-short drop-shadow-xl my-2 ${!useHomeSprites ? "pixelated" : ""}`}
                    style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                  />

                  <h3 className="text-2xl font-black text-white tracking-wide">
                    Shiny {formatPokemonName(selectedPokemon?.name)}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full mt-2 text-center">
                    <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Phase</span>
                      <span className="text-sm font-black text-white">Phase {phaseResult.phaseNumber}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Phase Checks</span>
                      <span className="text-sm font-black text-emerald-400">{phaseResult.phaseChecks.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Checks</span>
                      <span className="text-sm font-black text-white">{phaseResult.totalChecks.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Time</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">{formatDigitalTime(phaseResult.elapsedMs)}</span>
                    </div>
                  </div>

                  <span className="text-xs text-gray-300 font-semibold mt-1">
                    Odds: 1 / {phaseResult.odds.toLocaleString()} • {hunt.game} ({hunt.method})
                  </span>
                </div>

                {/* Previous Phases if any */}
                {(hunt.phases || []).length > 0 && (
                  <div className="hunt-modal-card text-left space-y-2">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-300">
                      Previous Phases ({(hunt.phases || []).length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {hunt.phases.map(p => (
                        <div key={p.id} className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-white">
                          {p.outcome === "failed" ? (
                            <HeartCrack size={12} className="text-rose-400 shrink-0" strokeWidth={2.5} />
                          ) : (
                            <Sparkles size={12} className="text-[var(--accent)] shrink-0" />
                          )}
                          <img
                            src={getPokemonImage(p.pokemon)}
                            alt=""
                            className={`w-4 h-4 object-contain ${!useHomeSprites ? "pixelated" : ""}`}
                            style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                          />
                          <span className="font-semibold">{formatPokemonName(p.pokemon?.name)}</span>
                          <span className="text-gray-400 font-mono">
                            ({(p.phaseChecks || p.checks || 0).toLocaleString()} checks)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="flex-1 !bg-emerald-500/20 !border-emerald-500/40 hover:!bg-emerald-500/30 text-emerald-300 font-bold"
                    disabled={addedToCollection}
                    onClick={handleAddShiny}
                  >
                    {addedToCollection ? "Added to Collection ✓" : "Add to Living Dex ✓"}
                  </Button>

                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-1 font-black"
                    onClick={handleComplete}
                    icon={<Sparkles size={18} strokeWidth={2.5} />}
                  >
                    Complete Hunt
                  </Button>
                </div>
              </div>
            )}

            {/* 2. Phase Caught (Non-target) */}
            {!isTarget && outcome === "caught" && (
              <div className="space-y-4 text-center">
                <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-500/20 via-black/40 to-black/60 border-2 border-emerald-500/60 flex flex-col items-center gap-2 shadow-2xl">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-3.5 py-1 rounded-full border border-emerald-500/30">
                    <Sparkles size={14} className="text-emerald-400 shrink-0" strokeWidth={2.5} />
                    <span>PHASE {phaseResult.phaseNumber} CAUGHT!</span>
                  </span>

                  <img
                    src={getPokemonImage(selectedPokemon)}
                    alt=""
                    className={`w-36 h-36 sm:w-40 sm:h-40 object-contain animate-bounce-short drop-shadow-xl my-2 ${!useHomeSprites ? "pixelated" : ""}`}
                    style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                  />

                  <h3 className="text-2xl font-black text-white tracking-wide">
                    Shiny {formatPokemonName(selectedPokemon?.name)}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full mt-2 text-center">
                    <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Phase</span>
                      <span className="text-sm font-black text-white">Phase {phaseResult.phaseNumber}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Phase Checks</span>
                      <span className="text-sm font-black text-emerald-400">{phaseResult.phaseChecks.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Checks</span>
                      <span className="text-sm font-black text-white">{phaseResult.totalChecks.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Time</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">{formatDigitalTime(phaseResult.elapsedMs)}</span>
                    </div>
                  </div>

                  <span className="text-xs text-gray-300 font-semibold mt-1">
                    Odds: 1 / {phaseResult.odds.toLocaleString()} • Continuing hunt for Shiny {formatPokemonName(hunt.pokemon?.name)}!
                  </span>
                </div>

                {/* Previous Phases if any */}
                {(hunt.phases || []).length > 0 && (
                  <div className="hunt-modal-card text-left space-y-2">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-300">
                      Previous Phases ({(hunt.phases || []).length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {hunt.phases.map(p => (
                        <div key={p.id} className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-white">
                          {p.outcome === "failed" ? (
                            <HeartCrack size={12} className="text-rose-400 shrink-0" strokeWidth={2.5} />
                          ) : (
                            <Sparkles size={12} className="text-[var(--accent)] shrink-0" />
                          )}
                          <img
                            src={getPokemonImage(p.pokemon)}
                            alt=""
                            className={`w-4 h-4 object-contain ${!useHomeSprites ? "pixelated" : ""}`}
                            style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                          />
                          <span className="font-semibold">{formatPokemonName(p.pokemon?.name)}</span>
                          <span className="text-gray-400 font-mono">
                            ({(p.phaseChecks || p.checks || 0).toLocaleString()} checks)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="flex-1 !bg-emerald-500/20 !border-emerald-500/40 hover:!bg-emerald-500/30 text-emerald-300 font-bold"
                    disabled={addedToCollection}
                    onClick={handleAddShiny}
                  >
                    {addedToCollection ? "Added to Collection ✓" : "Add to Living Dex ✓"}
                  </Button>

                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-1 font-black"
                    onClick={handleContinue}
                    iconRight={<ArrowRight size={18} strokeWidth={2.5} />}
                  >
                    Continue Hunt
                  </Button>
                </div>
              </div>
            )}

            {/* 3. Failed Shiny Encounter */}
            {outcome === "failed" && (
              <div className="space-y-4 text-center">
                <div className="p-5 rounded-2xl bg-gradient-to-b from-rose-500/20 via-black/40 to-black/60 border-2 border-rose-500/60 flex flex-col items-center gap-2 shadow-2xl">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-rose-400 bg-rose-500/20 px-3.5 py-1 rounded-full border border-rose-500/30">
                    <HeartCrack size={14} className="text-rose-400" strokeWidth={2.5} />
                    <span>SHINY FAILED</span>
                  </span>

                  <img
                    src={getPokemonImage(selectedPokemon)}
                    alt=""
                    className={`w-32 h-32 sm:w-36 sm:h-36 object-contain grayscale-[40%] drop-shadow-xl my-2 ${!useHomeSprites ? "pixelated" : ""}`}
                    style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                  />

                  <h3 className="text-xl font-black text-white tracking-wide">
                    Shiny {formatPokemonName(selectedPokemon?.name)}
                  </h3>
                  <span className="text-xs text-rose-400 font-bold uppercase tracking-wider -mt-1">
                    {isTarget
                      ? `Target Failed ${((hunt.phases?.filter(p => p.isTarget && p.outcome === "failed")?.length || 0) + 1)}`
                      : `Phase ${phaseResult.phaseNumber} Failed`}
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full mt-2 text-center">
                    <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Phase</span>
                      <span className="text-sm font-black text-white">Phase {phaseResult.phaseNumber}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Phase Checks</span>
                      <span className="text-sm font-black text-rose-400">{phaseResult.phaseChecks.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Checks</span>
                      <span className="text-sm font-black text-white">{phaseResult.totalChecks.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Time</span>
                      <span className="text-sm font-black text-white font-mono">{formatDigitalTime(phaseResult.elapsedMs)}</span>
                    </div>
                  </div>

                  <span className="text-xs text-gray-300 font-semibold mt-1">
                    Encounter recorded in fail history. Keep hunting!
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="flex-1 !bg-rose-500/20 !border-rose-500/40 hover:!bg-rose-500/30 text-rose-300 font-bold"
                    disabled={addedToCollection}
                    onClick={handleAddFail}
                  >
                    {addedToCollection ? "Fail Added to Collection ✓" : "Record Fail to Living Dex"}
                  </Button>

                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-1 font-black"
                    onClick={handleContinue}
                    iconRight={<ArrowRight size={18} strokeWidth={2.5} />}
                  >
                    Continue Hunt
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
