import { useEffect, useState, useContext, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Plus, Trash2, ChevronLeft, ChevronRight, Calendar, ChevronUp, ChevronDown, X, RotateCcw, ArrowUpCircle, ListTodo, Search, MoreHorizontal, ChevronsUp, Copy, FileText, Check, Crown, Layers, Gamepad2, CirclePlus, HeartCrack } from "lucide-react";
import { BALL_OPTIONS, GAME_OPTIONS, MARK_OPTIONS, METHOD_OPTIONS, genderForms } from "../../Constants";
import EvolutionChain from "../Dex/EvolutionChain";
import PermutationTable from "../MMO/PermutationTable";

import { getCaughtKey } from "../../caughtStorage";
import { formatPokemonName, getFormDisplayName, renderTypeBadge, getRelatedForms, findPokemon } from "../../utils";
import { getSpriteUrl } from "../../utils/spriteUtils";

import { PokeballIcon, NicknameIcon, BullseyeIcon } from "../Shared/SearchBar";
import ContentFilterInput from "../Shared/ContentFilterInput";
import { useMessage } from "../Shared/MessageContext";
import { validateContent } from "../../../shared/contentFilter";
import { getMergedGameName } from "../../utils/gameMapping";
import { getAvailableGamesForPokemonSidebar, isNonPartnerCapPikachu, isCapPikachu } from "../../utils/pokemonAvailability";
import { getMethodsForGame, getCurrentHuntOdds, getModifiersForGame } from "../../utils/huntSystem";
import { profileAPI } from "../../utils/api";
import { UserContext } from "../Shared/UserContext";
import { filterFormsByPreferences } from "../../utils/dexPreferences";
import {
  UNOBTAINABLE_SHINY_DEX_NUMBERS,
  UNOBTAINABLE_SHINY_FORM_NAMES,
  GO_EXCLUSIVE_SHINY_DEX_NUMBERS,
  GO_EXCLUSIVE_SHINY_FORM_NAMES,
  NO_OT_EXCLUSIVE_SHINY_DEX_NUMBERS,
  NO_OT_EXCLUSIVE_SHINY_FORM_NAMES
} from "../../data/blockedShinies";
import { isBallValidForGame, getValidBallNamesForGame } from "../../data/gameBalls";
import { Button } from "../Shared/Button";
import { Modal, ConfirmModal, PokeballCloseIcon } from "../Shared/Modal";
import { InputField, NumberField, DateField, SelectField, SearchField, TextAreaField } from "../Shared/FormField";
import "../../css/Sidebar.css";

const MAX_ENTRIES_PER_POKEMON = 200;



// Helper component for game tags with tooltips using Portal to avoid clipping
// Helper component for game tags with tooltips using Portal to avoid clipping
function GameTag({ gameGroup }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tagRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = () => {
    if (tagRef.current) {
      const rect = tagRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left + rect.width / 2
      });
    }
  };

  const handleMouseEnter = () => {
    updatePosition();
    setShowTooltip(true);
  };

  return (
    <>
      <div
        ref={tagRef}
        className={`game-tag ${gameGroup.type === 'pair' ? 'game-tag-pair' : gameGroup.type === 'quad' ? 'game-tag-quad' : 'game-tag-single'} ${showTooltip ? 'show-tooltip' : ''}`}
        style={{
          background: gameGroup.type === 'pair'
            ? `linear-gradient(135deg, ${gameGroup.colors[0]} 0%, ${gameGroup.colors[1]} 100%)`
            : gameGroup.type === 'quad'
              ? `linear-gradient(135deg, ${gameGroup.colors[0]} 0%, ${gameGroup.colors[1]} 33%, ${gameGroup.colors[2]} 66%, ${gameGroup.colors[3]} 100%)`
              : gameGroup.colors[0]
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!showTooltip) updatePosition();
          setShowTooltip(!showTooltip);
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {gameGroup.displayName}
      </div>
      {showTooltip && createPortal(
        <div
          style={{
            position: 'fixed',
            top: Math.round(coords.top - 10),
            left: Math.round(coords.left),
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
            pointerEvents: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            textShadow: 'none'
          }}
        >
          {gameGroup.games.join(", ")}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            border: '6px solid transparent',
            borderTopColor: 'rgba(0, 0, 0, 0.95)',
            width: 0,
            height: 0
          }} />
        </div>,
        document.body
      )}
    </>
  );
}

function RecommendedBallComponent({ ballObj }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tagRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = () => {
    if (tagRef.current) {
      const rect = tagRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left + rect.width / 2
      });
    }
  };

  const handleMouseEnter = () => {
    updatePosition();
    setShowTooltip(true);
  };

  return (
    <>
      <div 
        ref={tagRef}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.2s ease-in-out' }} 
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          handleMouseEnter();
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          setShowTooltip(false);
        }}
      >
        <img 
          src={ballObj.image} 
          alt={ballObj.name} 
          style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} 
        />
      </div>
      {showTooltip && createPortal(
        <div
          style={{
            position: 'fixed',
            top: Math.round(coords.top - 10),
            left: Math.round(coords.left),
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
            pointerEvents: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            textShadow: 'none'
          }}
        >
          {ballObj.name}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            border: '6px solid transparent',
            borderTopColor: 'rgba(0, 0, 0, 0.95)',
            width: 0,
            height: 0
          }} />
        </div>,
        document.body
      )}
    </>
  );
}

function MarksTabButton({ active, disabled, onClick }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const btnRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left + rect.width / 2
      });
    }
  };

  const handleMouseEnter = () => {
    if (disabled) {
      updatePosition();
      setShowTooltip(true);
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`sidebar-tab-btn ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => {
          if (!disabled) onClick();
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        Marks
      </button>
      {showTooltip && disabled && createPortal(
        <div
          style={{
            position: 'fixed',
            top: Math.round(coords.top - 8),
            left: Math.round(coords.left),
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
            pointerEvents: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            textShadow: 'none'
          }}
        >
          Select a game that has marks or ribbons in it
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              border: '6px solid transparent',
              borderTopColor: 'rgba(0, 0, 0, 0.95)',
              width: 0,
              height: 0
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
}

export default function PokemonSidebar({ open = false, readOnly = false, pokemon, onClose, caughtInfo, caughtInfoMap, updateCaughtInfo, showShiny, viewingUsername = null, onPokemonSelect = null, externalLinkPreference = 'serebii', dexPreferences = null, isTutorialActive = false }) {
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(0);
  const [localEntries, setLocalEntries] = useState([]);
  const { showMessage } = useMessage();
  const userContext = useContext(UserContext);
  const username = userContext?.username;
  const [shinyCharmGames, setShinyCharmGames] = useState(userContext?.shinyCharmGames || []);

  const [localDexPrefs, setLocalDexPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dexPreferences')) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handlePrefsChange = () => {
      try {
        setLocalDexPrefs(JSON.parse(localStorage.getItem('dexPreferences')) || {});
      } catch { }
    };
    window.addEventListener('dexPreferencesChanged', handlePrefsChange);
    return () => window.removeEventListener('dexPreferencesChanged', handlePrefsChange);
  }, []);

  // Sprite style (HOME vs Gen 5) is ALWAYS driven by the current user's/viewer's account setting
  const viewerUseHomeSprites = Boolean(localDexPrefs.useHomeSprites);

  useEffect(() => {
    if (userContext?.shinyCharmGames && Array.isArray(userContext.shinyCharmGames)) {
      setShinyCharmGames(userContext.shinyCharmGames);
    }
  }, [userContext?.shinyCharmGames]);

  // Helper to determine if a game has a Shiny Charm in its game modifiers
  const gameHasShinyCharm = useCallback((gameName) => {
    if (!gameName) return false;
    const mods = getModifiersForGame(gameName);
    return Boolean(mods && mods["Shiny Charm"] > 0);
  }, []);

  // Mighty Pokemon, Origin Ball, and non-partner Cap Pikachu cannot be shiny under any circumstances - auto close if switching to shiny mode
  useEffect(() => {
    if (showShiny && (pokemon?.formType === "mighty" || pokemon?.stableId?.startsWith("origin-ball-") || isNonPartnerCapPikachu(pokemon))) {
      onClose?.();
    }
  }, [showShiny, pokemon, onClose]);

  // Format time in full format (e.g., "1 Hour 5 Minutes 15 Seconds")
  const formatTimeFull = (milliseconds) => {
    if (!milliseconds || milliseconds === 0) return "";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (hours > 0) {
      parts.push(`${hours} Hour${hours !== 1 ? 's' : ''}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} Minute${minutes !== 1 ? 's' : ''}`);
    }
    if (seconds > 0 || parts.length === 0) {
      parts.push(`${seconds} Second${seconds !== 1 ? 's' : ''}`);
    }

    return parts.join(' ');
  };

  // Modal states
  const [resetModal, setResetModal] = useState({ show: false, pokemonName: '' });
  const [deleteEntryModal, setDeleteEntryModal] = useState({ show: false, entryIndex: null, entryNumber: null });
  const [deleteFailModal, setDeleteFailModal] = useState({ show: false, fail: null });
  const [resetModalClosing, setResetModalClosing] = useState(false);
  const [deleteEntryModalClosing, setDeleteEntryModalClosing] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [activeTab, setActiveTab] = useState('data'); // 'data' | 'marks' | 'notes'
  const [openAccordion, setOpenAccordion] = useState(null); // null | 'catch' | 'hunt' | 'additional'
  const [markSearchQuery, setMarkSearchQuery] = useState("");

  const [evolveModal, setEvolveModal] = useState({ show: false, options: [] });
  const [evolveModalClosing, setEvolveModalClosing] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef(null);
  const dateInputRef = useRef(null);

  const isMighty = pokemon?.formType === "mighty";
  const isAlpha = pokemon?.formType === "alpha" || pokemon?.formType === "alphaother" || (pokemon?.name && pokemon.name.endsWith("-alpha"));
  const isOriginBall = pokemon?.stableId === "origin-ball-dialga-483" || pokemon?.stableId === "origin-ball-palkia-484" || pokemon?.stableId?.startsWith("origin-ball-") || (pokemon?.name && pokemon.name.startsWith("origin-ball-"));

  // Always use .value, never the full object, in editData
  const defaultEditData = useMemo(() => {
    const defaultGame = isMighty ? "Scarlet" : (isOriginBall ? "Legends Arceus" : "");
    const shouldHaveCharm = !readOnly && defaultGame && shinyCharmGames.includes(defaultGame) && gameHasShinyCharm(defaultGame);
    return {
      nickname: "",
      date: "",
      ball: isOriginBall ? "Origin Ball" : "",
      marks: isMighty ? ["mightiest"] : (isAlpha ? ["alpha"] : []),
      mark: isMighty ? "mightiest" : (isAlpha ? "alpha" : ""),
      method: isMighty ? "Tera Raids" : "",
      evolvedFromMethod: undefined,
      game: defaultGame,
      checks: "",
      time: "",
      notes: "",
      entryId: "",
      modifiers: {
        shinyCharm: Boolean(shouldHaveCharm),
        shinyParents: false,
        lureActive: false,
        researchLv10: defaultGame === "Legends Arceus" && shouldHaveCharm ? true : false,
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
    };
  }, [isMighty, isAlpha, isOriginBall, shinyCharmGames, readOnly, gameHasShinyCharm]);






  const [editData, setEditData] = useState(defaultEditData);

  // Get available methods based on selected game
  const availableMethods = getMethodsForGame(editData.game);

  // Get available modifiers for the selected game
  const gameModifiers = editData.game ? getModifiersForGame(editData.game) : {};


  // Selected marks list helper (supports both multiple marks array and legacy mark string)
  const selectedMarks = useMemo(() => {
    if (isMighty) return ["mightiest"];
    if (Array.isArray(editData?.marks) && editData.marks.length > 0) {
      return editData.marks.filter(m => m && m !== "none" && m !== "");
    }
    if (editData?.mark && editData.mark !== "none" && editData.mark !== "") {
      return [editData.mark];
    }
    return [];
  }, [editData?.marks, editData?.mark, isMighty]);

  const filteredMarks = useMemo(() => {
    return MARK_OPTIONS.filter(m => {
      if (!m.value) return false;
      if (isMighty && m.value !== "mightiest") return false;
      if (!isMighty && m.value === "mightiest") return false;
      if (!markSearchQuery) return true;
      return m.name.toLowerCase().includes(markSearchQuery.toLowerCase());
    });
  }, [markSearchQuery, isMighty]);

  // Helper to determine if catch/hunt data exists for current entry in view mode
  const hasCatchData = Boolean(editData.nickname || editData.date || editData.ball || editData.game || editData.method);
  const hasHuntData = Boolean(
    (showShiny && editData.game && editData.method) ||
    (showShiny && editData.checks !== undefined && editData.checks !== null && String(editData.checks).trim() !== "" && String(editData.checks).trim() !== "0") ||
    (editData.time !== undefined && editData.time !== null && editData.time !== "" && editData.time !== 0) ||
    editData.chartData
  );

  const MARKS_GAMES = ["Scarlet", "Violet", "Sword", "Shield"];
  const marksAvailable = isMighty || MARKS_GAMES.includes(editData?.game);
  const isMarksDisabled = editing ? !marksAvailable : false;

  // Tab visibility rules: Marks and Notes tabs only visible when data exists or when editing
  const showMarksTab = editing || selectedMarks.length > 0;
  const showNotesTab = editing || Boolean(caughtInfo && editData.notes && editData.notes.trim() !== "");

  // Load user's shiny charm games
  const loadShinyCharmGames = useCallback(async () => {
    if (!username || readOnly) return;

    try {
      const profile = await profileAPI.getProfile();
      setShinyCharmGames(profile.shinyCharmGames || []);
    } catch (error) {
      console.error('Failed to load shiny charm games:', error);
    }
  }, [username, readOnly]);

  useEffect(() => {
    loadShinyCharmGames();

    // Listen for updates from ShinyCharmModal
    const handleShinyCharmUpdate = (event) => {
      if (readOnly) return;
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
  }, [username, readOnly, loadShinyCharmGames]);

  // Aggregate all tracked fails for this Pokemon from entries, caughtInfo, active hunts, and hunt history
  const trackedFails = useMemo(() => {
    if (!pokemon) return [];
    const pokeStableId = pokemon.stableId;
    const pokeId = pokemon.id;
    const pokeName = pokemon.name?.toLowerCase();

    const fails = [];
    const seen = new Set();

    let deletedIds = [];
    try {
      const uKey = viewingUsername ? `deleted_hunt_history_ids:${viewingUsername}` : "deleted_hunt_history_ids:global";
      const userDeleted = JSON.parse(localStorage.getItem(uKey) || "[]");
      const globalDeleted = JSON.parse(localStorage.getItem("deleted_hunt_history_ids:global") || "[]");
      deletedIds = [...userDeleted, ...globalDeleted].map(String);
    } catch {}

    const isFailDeleted = (f) => {
      if (!f) return true;
      if (f.id && deletedIds.includes(String(f.id))) return true;
      if (f.entryId && deletedIds.includes(String(f.entryId))) return true;
      if (f.timestamp && deletedIds.includes(String(f.timestamp))) return true;
      const key = `${f.date}-${f.phaseChecks || f.checks || 0}-${f.elapsedMs || f.time || 0}-${f.game || ''}`;
      if (deletedIds.includes(key)) return true;
      return false;
    };

    const addFail = (f) => {
      if (!f) return;
      if (f.outcome && f.outcome !== "failed") return;
      if (isFailDeleted(f)) return;
      const key = f.id || f.entryId || f.timestamp || `${f.date}-${f.phaseChecks || f.checks || 0}-${f.elapsedMs || f.time || 0}-${f.game || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        fails.push(f);
      }
    };

    // 1. From current selected entry / editData
    if (Array.isArray(editData?.fails)) {
      editData.fails.forEach(addFail);
    }
    if (Array.isArray(editData?.phases)) {
      editData.phases.filter(p => p.outcome === "failed").forEach(addFail);
    }

    // 2. From all local entries
    if (Array.isArray(localEntries)) {
      localEntries.forEach(entry => {
        if (Array.isArray(entry?.fails)) {
          entry.fails.forEach(addFail);
        }
        if (Array.isArray(entry?.phases)) {
          entry.phases.filter(p => p.outcome === "failed").forEach(addFail);
        }
      });
    }

    // 3. From caughtInfo root
    if (Array.isArray(caughtInfo?.fails)) {
      caughtInfo.fails.forEach(addFail);
    }

    // 4. From caughtInfoMap direct lookup
    try {
      const caughtKey = pokemon ? getCaughtKey(pokemon, null, showShiny) : null;
      const directInfo = caughtKey && caughtInfoMap ? caughtInfoMap[caughtKey] : null;
      if (Array.isArray(directInfo?.fails)) {
        directInfo.fails.forEach(addFail);
      }
    } catch {}

    // 5. From active hunts in localStorage (only if explicitly added to Living Dex)
    try {
      const rawActive = localStorage.getItem("activeHunts");
      const activeHunts = rawActive ? JSON.parse(rawActive) : [];
      activeHunts.forEach(h => {
        if (Array.isArray(h.phases)) {
          h.phases.forEach(p => {
            if (p.outcome === "failed" && (p.addedToLivingDex || p.addedToCollection)) {
              const pMon = p.pokemon || h.pokemon;
              if (
                (pMon?.stableId && pMon.stableId === pokeStableId) ||
                (pMon?.id && pMon.id === pokeId) ||
                (pMon?.name && pMon.name.toLowerCase() === pokeName)
              ) {
                addFail(p);
              }
            }
          });
        }
      });
    } catch {}

    // 6. From hunt history in localStorage (only if explicitly added to Living Dex)
    try {
      const storageKeys = [
        viewingUsername ? `completedHunts:${viewingUsername}` : null,
        "completedHunts",
        "huntHistory",
        viewingUsername ? `completedFails:${viewingUsername}` : null,
        "completedFails"
      ].filter(Boolean);

      storageKeys.forEach(k => {
        const rawHistory = localStorage.getItem(k);
        if (rawHistory) {
          const parsed = JSON.parse(rawHistory);
          if (Array.isArray(parsed)) {
            parsed.forEach(h => {
              if (h.outcome === "failed" || h.isFail) {
                const pMon = h.pokemon || (h.pokemonName ? { name: h.pokemonName } : null);
                if (
                  (pMon?.stableId && pMon.stableId === pokeStableId) ||
                  (pMon?.id && pMon.id === pokeId) ||
                  (pMon?.name && pMon.name.toLowerCase() === pokeName) ||
                  (h.pokemonName && h.pokemonName.toLowerCase() === pokeName)
                ) {
                  addFail(h);
                }
              }
              if (Array.isArray(h.phases)) {
                h.phases.forEach(p => {
                  if (p.outcome === "failed" || p.isFail) {
                    const pMon = p.pokemon || h.pokemon || (p.pokemonName ? { name: p.pokemonName } : null);
                    if (
                      (pMon?.stableId && pMon.stableId === pokeStableId) ||
                      (pMon?.id && pMon.id === pokeId) ||
                      (pMon?.name && pMon.name.toLowerCase() === pokeName) ||
                      (p.pokemonName && p.pokemonName.toLowerCase() === pokeName)
                    ) {
                      addFail(p);
                    }
                  }
                });
              }
            });
          }
        }
      });
    } catch {}

    return fails;
  }, [pokemon, editData?.fails, editData?.phases, localEntries, caughtInfo, caughtInfoMap, showShiny, viewingUsername]);

  const formatFailDate = (dateVal) => {
    if (!dateVal) return "";
    if (typeof dateVal === "number") {
      const d = new Date(dateVal);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
    }
    if (typeof dateVal === "string" && (dateVal.includes("T") || dateVal.includes("-"))) {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
      }
    }
    return formatDate(dateVal);
  };

  const getFailOddsDisplay = (fail) => {
    if (fail.odds) {
      if (typeof fail.odds === "number") return `1/${fail.odds.toLocaleString()}`;
      if (typeof fail.odds === "string") {
        if (fail.odds.startsWith("1/")) return fail.odds;
        const num = Number(fail.odds);
        if (!isNaN(num)) return `1/${num.toLocaleString()}`;
        return fail.odds;
      }
    }
    if (fail.game && fail.method) {
      try {
        const calculated = getCurrentHuntOdds(fail.game, fail.method, fail.modifiers || {}, fail.phaseChecks || fail.checks || 0);
        return `1/${calculated.toLocaleString()}`;
      } catch {
        return null;
      }
    }
    return null;
  };

  const isCaught = useMemo(() => {
    return Boolean(caughtInfo && caughtInfo.caught !== false && (caughtInfo.entries?.length > 0 || caughtInfo.caught === true));
  }, [caughtInfo]);

  // Track the previous game to detect when user manually changes the game selection
  const prevGameRef = useRef(null);
  const isLoadingDataRef = useRef(true);
  const prevOpenRef = useRef(open);
  const prevWasCaughtRef = useRef(isCaught);

  useEffect(() => {
    // When sidebar transitions from closed to open:
    // If not caught, auto-open 'additional'. If caught, start with accordions closed (null)
    if (!prevOpenRef.current && open) {
      if (!isCaught && !editing) {
        setOpenAccordion('additional');
      } else {
        setOpenAccordion(null);
      }
      prevWasCaughtRef.current = isCaught;
    }
    setShowMoreMenu(false);
    prevOpenRef.current = open;
  }, [open, isCaught, editing]);

  // Close more menu when clicking outside
  useEffect(() => {
    if (!showMoreMenu) return;
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreMenu]);

  // Reset refs and update accordion state when switching pokemon or caught status changes
  useEffect(() => {
    prevGameRef.current = null;
    isLoadingDataRef.current = true;
    setShowMoreMenu(false);

    const wasCaught = prevWasCaughtRef.current;
    prevWasCaughtRef.current = isCaught;

    if (!isCaught && !editing) {
      // Switching to an uncaught pokemon: auto-open additional info
      setOpenAccordion('additional');
    } else if (!wasCaught && isCaught && !editing) {
      // Switching from uncaught to caught pokemon: start with catch info open if in tutorial
      if (isTutorialActive) {
        setOpenAccordion('catch');
      } else {
        setOpenAccordion(null);
      }
    } else if (wasCaught && isCaught && !editing) {
      // Switching between two caught pokemon: preserve the currently open accordion if valid for this pokemon
      if (isTutorialActive) {
        setOpenAccordion('catch');
      } else {
        const firstEntry = caughtInfo?.entries?.[0] || caughtInfo;
        const targetHasCatchData = Boolean(firstEntry?.nickname || firstEntry?.date || firstEntry?.ball || firstEntry?.game || firstEntry?.method);
        const targetHasHuntData = Boolean(
          (showShiny && firstEntry?.game && firstEntry?.method) ||
          (showShiny && firstEntry?.checks !== undefined && firstEntry?.checks !== null && String(firstEntry.checks).trim() !== "" && String(firstEntry.checks).trim() !== "0") ||
          (firstEntry?.time !== undefined && firstEntry?.time !== null && firstEntry?.time !== "" && firstEntry?.time !== 0) ||
          firstEntry?.chartData
        );

        setOpenAccordion(prev => {
          if (prev === 'catch' && !targetHasCatchData) return null;
          if (prev === 'hunt' && !targetHasHuntData) return null;
          if (prev === 'fails' && trackedFails.length === 0) return null;
          return prev;
        });
      }
    }
  }, [pokemon, isCaught, editing, showShiny, isTutorialActive, trackedFails.length]);

  // Listen for tutorial step changes to open accordions automatically
  useEffect(() => {
    const handleTutorialStep = (e) => {
      if (e.detail?.targetId === "sidebar-entries-overview") {
        setActiveTab('data');
        setOpenAccordion('catch');
      }
    };
    window.addEventListener('tutorialStepChange', handleTutorialStep);
    return () => window.removeEventListener('tutorialStepChange', handleTutorialStep);
  }, []);

  // Ensure activeTab is valid if current tab becomes hidden or disabled
  useEffect(() => {
    if (activeTab === 'marks' && (!showMarksTab || (editing && !marksAvailable))) {
      setActiveTab('data');
    } else if (activeTab === 'notes' && !showNotesTab) {
      setActiveTab('data');
    }
  }, [activeTab, showMarksTab, showNotesTab, editing, marksAvailable]);

  // Pre-fill fake data during the tutorial
  useEffect(() => {
    if (editing && isTutorialActive) {
      setEditData(prev => ({
        ...prev,
        nickname: "Bulby",
        date: new Date().toISOString().split('T')[0],
        ball: "Poké Ball",
        game: "Red",
        method: "Random Encounters",
        notes: "My very first Pokémon! Found in Pallet Town.",
      }));
    }
  }, [editing, isTutorialActive]);

  // Check if the current pokemon is a blocked shiny
  const isBlockedShiny = useMemo(() => {
    if (!pokemon || !showShiny) return false;
    if (isOriginBall) return true;
    
    // Use provided dexPreferences or default to true for blocking rules when editing own dex
    const defaultBlock = !readOnly;
    const prefs = dexPreferences || { 
      blockUnobtainableShinies: defaultBlock, 
      blockGOExclusiveShinies: defaultBlock, 
      blockNOOTExclusiveShinies: defaultBlock 
    };

    const pokeId = String(pokemon.id).padStart(4, "0");
    const pokeName = pokemon.name?.toLowerCase() || '';
    
    const isBlockedUnobtainableById = !!prefs.blockUnobtainableShinies && UNOBTAINABLE_SHINY_DEX_NUMBERS.includes(pokeId);
    const isBlockedUnobtainableByForm = !!prefs.blockUnobtainableShinies && UNOBTAINABLE_SHINY_FORM_NAMES.some(formName => pokeName === formName.toLowerCase());
    
    const isBlockedGOById = !!prefs.blockGOExclusiveShinies && GO_EXCLUSIVE_SHINY_DEX_NUMBERS.includes(pokeId);
    const isBlockedGOByForm = !!prefs.blockGOExclusiveShinies && GO_EXCLUSIVE_SHINY_FORM_NAMES.some(formName => pokeName === formName.toLowerCase());
    
    const isBlockedNOOTById = !!prefs.blockNOOTExclusiveShinies && NO_OT_EXCLUSIVE_SHINY_DEX_NUMBERS.includes(pokeId);
    const isBlockedNOOTByForm = !!prefs.blockNOOTExclusiveShinies && NO_OT_EXCLUSIVE_SHINY_FORM_NAMES.some(formName => pokeName === formName.toLowerCase());
    
    return isBlockedUnobtainableById || isBlockedUnobtainableByForm || 
           isBlockedGOById || isBlockedGOByForm || 
           isBlockedNOOTById || isBlockedNOOTByForm;
  }, [pokemon, showShiny, dexPreferences, readOnly]);

  // Force close sidebar if trying to view a blocked shiny
  useEffect(() => {
    if (open && isBlockedShiny && typeof onClose === 'function') {
      onClose();
    }
  }, [open, isBlockedShiny, onClose]);

  // Auto-check/uncheck shiny charm when user changes the game or shinyCharmGames updates
  useEffect(() => {
    if (prevGameRef.current !== editData.game) {
      prevGameRef.current = editData.game;
      if (!readOnly && editData.game) {
        const shouldHaveCharm = shinyCharmGames.includes(editData.game) && gameHasShinyCharm(editData.game);
        setEditData(prev => {
          if (prev.modifiers?.shinyCharm === shouldHaveCharm && (editData.game !== "Legends Arceus" || !shouldHaveCharm || prev.modifiers?.researchLv10)) {
            return prev;
          }
          return {
            ...prev,
            modifiers: {
              ...(prev.modifiers || defaultEditData.modifiers),
              shinyCharm: shouldHaveCharm,
              researchLv10: editData.game === "Legends Arceus" && shouldHaveCharm ? true : (prev.modifiers?.researchLv10 || false)
            }
          };
        });
      }
    }
  }, [editData.game, shinyCharmGames, readOnly, defaultEditData, gameHasShinyCharm]);

  // Function to identify Hisuian balls
  const isHisuianBall = (ballValue) => {
    const hisuianBalls = [
      "Feather Ball", "Wing Ball", "Jet Ball", "Heavy Ball (Hisui)",
      "Leaden Ball", "Gigaton Ball", "Poké Ball (Hisui)",
      "Great Ball (Hisui)", "Ultra Ball (Hisui)"
    ];
    return hisuianBalls.includes(ballValue);
  };

  // Filter ball options based on selected game
  const getFilteredBallOptions = () => {
    if (isOriginBall) {
      return [{ name: "Origin Ball", value: "Origin Ball", image: "/data/balls/origin-ball.png" }];
    }
    const validNames = getValidBallNamesForGame(editData.game);
    if (validNames && validNames.length > 0) {
      return BALL_OPTIONS.filter(ball =>
        ball.value !== "" && ball.value !== "Origin Ball" && validNames.includes(ball.value)
      );
    }
    return BALL_OPTIONS.filter(ball => ball.value !== "" && ball.value !== "Origin Ball");
  };

  // Game tag mapping with colors and abbreviations
  const getGameTagInfo = (gameName) => {
    const gameMap = {
      "Red": { abbr: "R", colors: ["#ed2927", "#ed2927"] },
      "Blue": { abbr: "B", colors: ["#027faf", "#027faf"] },
      "Green": { abbr: "G", colors: ["#2ecc71", "#2ecc71"] },
      "Yellow": { abbr: "Y", colors: ["#f9cf25", "#f9cf25"] },
      "Gold": { abbr: "G", colors: ["#f39c12", "#f39c12"] },
      "Silver": { abbr: "S", colors: ["#95a5a6", "#95a5a6"] },
      "Crystal": { abbr: "C", colors: ["#8b8bc1", "#8b8bc1"] },
      "Ruby": { abbr: "R", colors: ["#ed2927", "#ed2927"] },
      "Sapphire": { abbr: "S", colors: ["#027faf", "#027faf"] },
      "Emerald": { abbr: "E", colors: ["#2d993c", "#2d993c"] },
      "Fire Red": { abbr: "FR", colors: ["#e74c3c", "#e74c3c"] },
      "Leaf Green": { abbr: "LG", colors: ["#27ae60", "#27ae60"] },
      "Diamond": { abbr: "D", colors: ["#74b9ff", "#74b9ff"] },
      "Pearl": { abbr: "P", colors: ["#fd79a8", "#fd79a8"] },
      "Platinum": { abbr: "P", colors: ["#f9e79f", "#f9e79f"] },
      "Heart Gold": { abbr: "HG", colors: ["#f39c12", "#f39c12"] },
      "Soul Silver": { abbr: "SS", colors: ["#95a5a6", "#95a5a6"] },
      "Black": { abbr: "B", colors: ["#2c3e50", "#ecf0f1"] },
      "White": { abbr: "W", colors: ["#ecf0f1", "#2c3e50"] },
      "Black 2": { abbr: "B2", colors: ["#2c3e50", "#2c3e50"] },
      "White 2": { abbr: "W2", colors: ["#ffffff", "#ffffff"] },
      "X": { abbr: "X", colors: ["#065ba0", "#065ba0"] },
      "Y": { abbr: "Y", colors: ["#d02942", "#d02942"] },
      "Omega Ruby": { abbr: "OR", colors: ["#e04429", "#e04429"] },
      "Alpha Sapphire": { abbr: "AS", colors: ["#079fd4", "#079fd4"] },
      "Sun": { abbr: "S", colors: ["#f39c12", "#f39c12"] },
      "Moon": { abbr: "M", colors: ["#9b59b6", "#9b59b6"] },
      "Ultra Sun": { abbr: "US", colors: ["#f39c12", "#f39c12"] },
      "Ultra Moon": { abbr: "UM", colors: ["#9b59b6", "#9b59b6"] },
      "Lets GO Pikachu": { abbr: "LGPE", colors: ["#f2cb40", "#f2cb40"] },
      "Lets GO Eevee": { abbr: "LGPE", colors: ["#d69c58", "#d69c58"] },
      "Sword": { abbr: "Sw", colors: ["#3498db", "#3498db"] },
      "Shield": { abbr: "Sh", colors: ["#e74c3c", "#e74c3c"] },
      "Brilliant Diamond": { abbr: "BD", colors: ["#74b9ff", "#74b9ff"] },
      "Shining Pearl": { abbr: "SP", colors: ["#fd79a8", "#fd79a8"] },
      "Legends Arceus": { abbr: "LA", colors: ["#6bbd8d", "#6bbd8d"] },
      "Scarlet": { abbr: "Sc", colors: ["#e74c3c", "#e74c3c"] },
      "Violet": { abbr: "V", colors: ["#9b59b6", "#9b59b6"] },
      "Legends Z-A": { abbr: "ZA", colors: ["#fac3c8", "#fac3c8"] },
      "GO": { abbr: "GO", colors: ["#4285f4", "#4285f4"] }
    };
    // Try exact match first, then case-insensitive match
    const exactMatch = gameMap[gameName];
    if (exactMatch) return exactMatch;

    // Try case-insensitive match
    const caseInsensitiveMatch = Object.keys(gameMap).find(key =>
      key.toLowerCase() === gameName.toLowerCase()
    );
    if (caseInsensitiveMatch) return gameMap[caseInsensitiveMatch];

    // Fallback to first 3 characters
    return { abbr: gameName.substring(0, 3), colors: ["#95a5a6", "#95a5a6"] };
  };

  // Get games where a Pokemon can be caught, ordered by release date
  const getAvailableGames = (pokemon) => getAvailableGamesForPokemonSidebar(pokemon, showShiny);

  // Group games into pairs for combined display, maintaining chronological order
  const getGroupedGames = (games) => {
    const gameGroups = [];
    const processedGames = new Set();

    // Define game pairs with correct abbreviations in chronological order
    const gamePairs = [
      { games: ["Red", "Green", "Blue", "Yellow"], abbr: "RGBY" },
      { games: ["Gold", "Silver"], abbr: "GS" },
      { games: ["Ruby", "Sapphire"], abbr: "RS" },
      { games: ["Fire Red", "Leaf Green"], abbr: "FRLG" },
      { games: ["Diamond", "Pearl"], abbr: "DP" },
      { games: ["Heart Gold", "Soul Silver"], abbr: "HGSS" },
      { games: ["Black", "White"], abbr: "BW" },
      { games: ["Black 2", "White 2"], abbr: "B2W2" },
      { games: ["X", "Y"], abbr: "XY" },
      { games: ["Omega Ruby", "Alpha Sapphire"], abbr: "ORAS" },
      { games: ["Sun", "Moon"], abbr: "SM" },
      { games: ["Ultra Sun", "Ultra Moon"], abbr: "USUM" },
      { games: ["Lets GO Pikachu", "Lets GO Eevee"], abbr: "LGPE" },
      { games: ["Sword", "Shield"], abbr: "SWSH" },
      { games: ["Brilliant Diamond", "Shining Pearl"], abbr: "BDSP" },
      { games: ["Scarlet", "Violet"], abbr: "SV" }
    ];

    // Define individual games with their proper abbreviations
    const individualGames = {
      "Blue": "B",
      "Yellow": "Y",
      "Crystal": "C",
      "Emerald": "E",
      "Platinum": "P",
      "Legends Arceus": "LA",
      "Legends Z-A": "ZA",
      "GO": "GO"
    };

    // Process games in chronological order to maintain correct display order
    const gameReleaseOrder = [
      "Red", "Green",
      "Blue",
      "Yellow",
      "Gold", "Silver",
      "Crystal",
      "Ruby", "Sapphire",
      "Emerald",
      "Fire Red", "Leaf Green",
      "Diamond", "Pearl",
      "Platinum",
      "Heart Gold", "Soul Silver",
      "Black", "White",
      "Black 2", "White 2",
      "X", "Y",
      "Omega Ruby", "Alpha Sapphire",
      "Sun", "Moon",
      "Ultra Sun", "Ultra Moon",
      "Lets GO Pikachu", "Lets GO Eevee",
      "Sword", "Shield",
      "Brilliant Diamond", "Shining Pearl",
      "Legends Arceus",
      "Scarlet", "Violet",
      "Legends Z-A",
      "GO"
    ];

    // Process games in chronological order
    gameReleaseOrder.forEach(game => {
      if (!games.includes(game) || processedGames.has(game)) return;

      // Check if this game is part of a pair
      const pair = gamePairs.find(p => p.games.includes(game));

      if (pair) {
        // Check if all games in the pair are available
        const allGamesAvailable = pair.games.every(g => games.includes(g));

        if (allGamesAvailable) {
          // All games in the pair are available, create pair
          if (pair.games.length === 2) {
            // Regular pair (2 games)
            const tagInfo1 = getGameTagInfo(pair.games[0]);
            const tagInfo2 = getGameTagInfo(pair.games[1]);
            gameGroups.push({
              type: "pair",
              games: pair.games,
              displayName: pair.abbr,
              colors: [tagInfo1.colors[0], tagInfo2.colors[0]]
            });
          } else if (pair.games.length === 4) {
            // RGBY case (4 games) - use a gradient with all 4 colors
            const tagInfo1 = getGameTagInfo(pair.games[0]);
            const tagInfo2 = getGameTagInfo(pair.games[1]);
            const tagInfo3 = getGameTagInfo(pair.games[2]);
            const tagInfo4 = getGameTagInfo(pair.games[3]);
            gameGroups.push({
              type: "quad",
              games: pair.games,
              displayName: pair.abbr,
              colors: [tagInfo1.colors[0], tagInfo2.colors[0], tagInfo3.colors[0], tagInfo4.colors[0]]
            });
          }
          // Mark all games in the pair as processed
          pair.games.forEach(g => processedGames.add(g));
        } else {
          // Individual game
          const tagInfo = getGameTagInfo(game);
          const displayName = individualGames[game] || tagInfo.abbr;
          gameGroups.push({
            type: "single",
            games: [game],
            displayName: displayName,
            colors: tagInfo.colors
          });
          processedGames.add(game);
        }
      } else {
        // Individual game
        const tagInfo = getGameTagInfo(game);
        const displayName = individualGames[game] || tagInfo.abbr;
        gameGroups.push({
          type: "single",
          games: [game],
          displayName: displayName,
          colors: tagInfo.colors
        });
        processedGames.add(game);
      }
    });

    return gameGroups;
  };

  // Format raw entry to consistent editData structure with full backwards compatibility
  const formatEntryToEditData = useCallback((entry) => {
    if (!entry) return defaultEditData;
    const marks = isMighty
      ? ["mightiest"]
      : (Array.isArray(entry.marks) && entry.marks.length > 0
          ? entry.marks.filter(Boolean)
          : (entry.mark && entry.mark !== "none" ? [entry.mark] : []));
    const entryGame = isMighty ? (entry.game === "Violet" ? "Violet" : "Scarlet") : (isOriginBall ? "Legends Arceus" : (entry.game || ""));
    const shouldHaveCharm = !readOnly && entryGame && shinyCharmGames.includes(entryGame) && gameHasShinyCharm(entryGame);

    return {
      nickname: entry.nickname || "",
      date: (function(d) {
        if (!d) return "";
        const s = String(d).trim();
        const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
        if (m) {
          return `${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}-${m[1]}`;
        }
        return s;
      })(entry.date),
      ball: isOriginBall ? "Origin Ball" : (entry.ball || BALL_OPTIONS[0].value),
      marks: marks,
      mark: marks[0] || "",
      method: isMighty ? "Tera Raids" : (isOriginBall ? "" : (entry.method || METHOD_OPTIONS[0])),
      evolvedFromMethod: entry.evolvedFromMethod || undefined,
      game: entryGame,
      checks: entry.checks || "",
      time: entry.time || "",
      notes: entry.notes || "",
      fails: entry.fails || [],
      phases: entry.phases || [],
      chartData: entry.chartData || null,
      chartConfig: entry.chartConfig || null,
      entryId: entry.entryId || Math.random().toString(36).substr(2, 9),
      modifiers: entry.modifiers || {
        ...defaultEditData.modifiers,
        shinyCharm: Boolean(shouldHaveCharm),
        researchLv10: entryGame === "Legends Arceus" && shouldHaveCharm ? true : false
      }
    };
  }, [isMighty, isOriginBall, defaultEditData, shinyCharmGames, readOnly, gameHasShinyCharm]);

  // Initialize state when component first mounts or when caughtInfo changes
  useEffect(() => {
    if (caughtInfo?.entries && caughtInfo.entries.length > 0) {
      setLocalEntries(caughtInfo.entries);
      // Only reset to first entry if we don't have a valid selectedEntryIndex
      if (selectedEntryIndex >= caughtInfo.entries.length) {
        setSelectedEntryIndex(0);
        setEditData(formatEntryToEditData(caughtInfo.entries[0]));
      } else {
        // Keep current selection but update editData to show current entry
        setEditData(formatEntryToEditData(caughtInfo.entries[selectedEntryIndex]));
      }
    } else {
      setLocalEntries([]);
      setEditData(defaultEditData);
      setSelectedEntryIndex(0);
    }
    setEditing(false);
  }, [caughtInfo, pokemon, isMighty, formatEntryToEditData, defaultEditData]);



  // Mobile scroll handling removed - was causing page jumps
  // The sidebar now works naturally with page scrolling

  // Lightweight mobile scroll prevention - only when sidebar is fully open
  // Lightweight mobile scroll prevention - only when sidebar is fully open
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      if (open && !closing) {
        // Only prevent scrolling when sidebar is fully open (not during animations)
        document.body.classList.add('sidebar-open');
        document.documentElement.classList.add('sidebar-open');
      } else {
        // Allow scrolling during closing animation and when closed
        document.body.classList.remove('sidebar-open');
        document.documentElement.classList.remove('sidebar-open');
      }
    } else {
      // Ensure classes are removed if resized to desktop or not mobile
      document.body.classList.remove('sidebar-open');
      document.documentElement.classList.remove('sidebar-open');
    }
  }, [open, closing]);

  // Cleanup effect to ensure CSS class is removed on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('sidebar-open');
      document.documentElement.classList.remove('sidebar-open');
    };
  }, []);

  // Prevent scrolling when modals are open
  useEffect(() => {
    const preventScroll = (e) => {
      // If we are in the evolve modal or chart modal, allow scrolling inside the custom-scrollbar only
      if (evolveModal.show || showChartModal) {
        if (e.target.closest('.custom-scrollbar')) {
          return; // Let the modal itself scroll normally
        }
      }
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const preventKeyScroll = (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && !e.target.closest('[role="dialog"]') && !e.target.closest('.custom-scrollbar')) {
          e.preventDefault();
        }
      }
    };

    const isAnyModalOpen = resetModal.show || deleteEntryModal.show || evolveModal.show || showChartModal;

    if (isAnyModalOpen) {
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('keydown', preventKeyScroll, { passive: false });
    } else {
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('keydown', preventKeyScroll);
    }

    return () => {
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('keydown', preventKeyScroll);
    };
  }, [resetModal.show, deleteEntryModal.show, evolveModal.show, showChartModal]);

  // Function to format date from MM-DD-YYYY or YYYY-MM-DD to MMM DD YYYY format
  function formatDate(dateString) {
    if (!dateString) return "";

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const parts = dateString.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        const year = parts[0];
        const month = months[parseInt(parts[1], 10) - 1] || parts[1];
        const day = parts[2];
        return `${month} ${day} ${year}`;
      } else {
        // MM-DD-YYYY
        const month = months[parseInt(parts[0], 10) - 1] || parts[0];
        const day = parts[1];
        const year = parts[2];
        return `${month} ${day} ${year}`;
      }
    }

    return dateString; // Return original if format is unexpected
  }

  // Function to manually update editData when switching entries
  function switchToEntry(index) {
    if (localEntries && localEntries[index]) {
      setEditData(formatEntryToEditData(localEntries[index]));
    }
  }

  function handleSetCaught() {
    if (showShiny && (pokemon?.formType === "mighty" || isOriginBall || isNonPartnerCapPikachu(pokemon))) return;

    // Create a fresh default entry
    const newEntry = {
      nickname: "",
      date: "",
      ball: "",
      marks: isMighty ? ["mightiest"] : (isAlpha ? ["alpha"] : []),
      mark: isMighty ? "mightiest" : (isAlpha ? "alpha" : ""),
      game: isMighty ? "Scarlet" : "",
      method: isMighty ? "Tera Raids" : "",
      checks: "",
      time: "",
      notes: "",
      entryId: Math.random().toString(36).substr(2, 9),
      modifiers: defaultEditData.modifiers
    };

    const newInfo = {
      caught: true,
      caughtAt: Date.now(),
      entries: [newEntry]
    };

    setEditing(true);
    setOpenAccordion('catch');
    setLocalEntries([newEntry]);
    setEditData(newEntry);
    setSelectedEntryIndex(0);

    // Then update the global state
    updateCaughtInfo(pokemon, newInfo, showShiny, true);
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditData(edit => ({ ...edit, [name]: value }));
  }

  function handleSaveEdit() {
    if (showShiny && (pokemon?.formType === "mighty" || isOriginBall || isNonPartnerCapPikachu(pokemon))) return;

    // Save-time validation for notes and nickname
    const notesValidation = validateContent(String(editData.notes || ''), 'notes');
    if (!notesValidation.isValid) {
      showMessage(`${notesValidation.error}`, 'error');
      return;
    }

    const nicknameValidation = validateContent(String(editData.nickname || ''), 'nickname');
    if (!nicknameValidation.isValid) {
      showMessage(`${nicknameValidation.error}`, 'error');
      return;
    }

    let finalSavedDate = "";
    if (editData.date) {
      const dateStr = String(editData.date).trim();
      const mmddyyyyRegex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
      const yyyymmddRegex = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/;
      
      let year, month, day;
      if (mmddyyyyRegex.test(dateStr)) {
        const parts = dateStr.split(/[-/]/).map(Number);
        month = parts[0];
        day = parts[1];
        year = parts[2];
      } else if (yyyymmddRegex.test(dateStr)) {
        const parts = dateStr.split(/[-/]/).map(Number);
        year = parts[0];
        month = parts[1];
        day = parts[2];
      } else {
        showMessage('Please enter a full date in MM-DD-YYYY format (e.g. 08-18-2024)', 'error');
        return;
      }

      const d = new Date(year, month - 1, day);
      if (d.getFullYear() !== year || d.getMonth() + 1 !== month || d.getDate() !== day) {
        showMessage('Please enter a valid calendar date', 'error');
        return;
      }
      finalSavedDate = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}-${year}`;
    }

    // Check if we're updating an existing entry or creating a new one
    const currentEntries = [...localEntries]; // Create a copy to avoid mutation
    let updatedEntries;
    let newSelectedIndex = selectedEntryIndex;

    // Check if we're updating an existing entry based on selectedEntryIndex
    const marks = isMighty
      ? ["mightiest"]
      : (Array.isArray(editData.marks) && editData.marks.length > 0
          ? editData.marks.filter(m => m && m !== "mightiest")
          : (editData.mark && editData.mark !== "mightiest" ? [editData.mark] : []));

    const selectedGame = isMighty ? (editData.game === "Violet" ? "Violet" : "Scarlet") : (isOriginBall ? "Legends Arceus" : (editData.game || ""));
    let validBall = isOriginBall ? "Origin Ball" : (editData.ball || "");
    if (!isOriginBall && validBall && selectedGame) {
      if (!isBallValidForGame(validBall, selectedGame)) {
        validBall = "";
      }
    }

    if (selectedEntryIndex < currentEntries.length) {
      // Update existing entry at the current index
      const cleaned = {
        nickname: editData.nickname || "",
        date: finalSavedDate,
        ball: validBall,
        marks: marks,
        mark: marks[0] || "",
        game: selectedGame,
        method: isMighty ? "Tera Raids" : (isOriginBall ? "" : (editData.method || "")),
        evolvedFromMethod: editData.method === "Evolved" ? editData.evolvedFromMethod : undefined,
        checks: !showShiny ? "" : (
          editData.checks === null ||
            String(editData.checks).trim() === "" ||
            String(editData.checks).trim() === "0"
            ? ""
            : String(editData.checks).trim()
        ),
        time: editData.time || "",
        notes: editData.notes || "",
        entryId: currentEntries[selectedEntryIndex].entryId, // Keep the existing entryId
        modifiers: editData.modifiers || defaultEditData.modifiers
      };

      updatedEntries = currentEntries.map((entry, index) =>
        index === selectedEntryIndex ? cleaned : entry
      );
    } else {
      // Add new entry - select the new entry
      const cleaned = {
        nickname: editData.nickname || "",
        date: finalSavedDate,
        ball: validBall,
        marks: marks,
        mark: marks[0] || "",
        game: selectedGame,
        method: isMighty ? "Tera Raids" : (isOriginBall ? "" : (editData.method || "")),
        evolvedFromMethod: editData.method === "Evolved" ? editData.evolvedFromMethod : undefined,
        checks: !showShiny ? "" : (
          editData.checks === null ||
            String(editData.checks).trim() === "" ||
            String(editData.checks).trim() === "0"
            ? ""
            : String(editData.checks).trim()
        ),
        time: editData.time || "",
        notes: editData.notes || "",
        entryId: Math.random().toString(36).substr(2, 9), // Generate new entryId for new entries
        modifiers: editData.modifiers || defaultEditData.modifiers
      };

      updatedEntries = [...currentEntries, cleaned];
      newSelectedIndex = currentEntries.length; // Select the new entry
    }

    const isNewEntry = selectedEntryIndex >= currentEntries.length;

    const updatedInfo = {
      caught: true,
      caughtAt: isNewEntry ? Date.now() : (caughtInfo ? caughtInfo.caughtAt : Date.now()),
      entries: updatedEntries
    };

    // Update global state (App.jsx handles sandbox state during tutorial)
    updateCaughtInfo(pokemon, updatedInfo, showShiny, isNewEntry);

    // Update local state and editData in the correct order
    setLocalEntries(updatedEntries);

    // Update editData to show the current entry
    if (selectedEntryIndex < updatedEntries.length) {
      setEditData(updatedEntries[selectedEntryIndex]);
    } else {
      setEditData(updatedEntries[updatedEntries.length - 1]);
    }
    setSelectedEntryIndex(newSelectedIndex);

    // Exit edit mode and open catch info accordion to show the saved data
    setEditing(false);
    setOpenAccordion('catch');
  }


  function handleCancelEdit() {
    setEditing(false);
    const targetEntry = localEntries[selectedEntryIndex] || localEntries[0];
    setEditData(targetEntry ? formatEntryToEditData(targetEntry) : defaultEditData);
  }


  const executeEvolve = (targetPokemon) => {
    let nextPokemon = targetPokemon;
    
    // Try to match form type (e.g. Alolan Vulpix -> Alolan Ninetales)
    if (pokemon.formType && pokemon.formType !== "main" && pokemon.formType !== "default") {
        const related = getRelatedForms(nextPokemon);
        const match = related.find(r => r.formType === pokemon.formType);
        if (match) {
            nextPokemon = match;
        }
    }

    let existingEntries = [];
    if (caughtInfoMap) {
      const nextKey = getCaughtKey(nextPokemon, null, showShiny);
      const nextInfo = caughtInfoMap[nextKey];
      if (nextInfo && nextInfo.entries && Array.isArray(nextInfo.entries)) {
        existingEntries = nextInfo.entries;
      } else if (nextInfo && nextInfo.caught) {
        existingEntries = [{
          ball: nextInfo.ball || "",
          game: nextInfo.game || "",
          mark: nextInfo.mark || "",
          method: nextInfo.method || "",
          checks: nextInfo.checks || "",
          date: nextInfo.date || "",
          notes: nextInfo.notes || "",
          entryId: Math.random().toString(36).substr(2, 9)
        }];
      }
    }

    const duplicatedEntries = localEntries.map(entry => {
      const originalMethod = entry.evolvedFromMethod || (entry.method && entry.method !== "Evolved" ? entry.method : undefined);
      return {
        ...entry,
        notes: "",
        method: "Evolved",
        evolvedFromMethod: originalMethod,
        entryId: Math.random().toString(36).substr(2, 9)
      };
    });

    let combinedEntries = [...existingEntries, ...duplicatedEntries];
    if (combinedEntries.length > MAX_ENTRIES_PER_POKEMON) {
      combinedEntries = combinedEntries.slice(0, MAX_ENTRIES_PER_POKEMON);
      showMessage(`Data evolved to ${formatPokemonName(nextPokemon.name)}! Max ${MAX_ENTRIES_PER_POKEMON} entries kept.`, "success");
    } else {
      showMessage(`Data evolved to ${formatPokemonName(nextPokemon.name)}!`, "success");
    }

    const newInfo = {
      caught: true,
      entries: combinedEntries
    };

    updateCaughtInfo(nextPokemon, newInfo, showShiny);
    
    // Navigate to it
    if (onPokemonSelect) {
      onPokemonSelect(nextPokemon);
    }
  };

  const handleEvolve = () => {
    if (!pokemon || isCapPikachu(pokemon)) return;

    let evoSource = pokemon;
    if (
      !pokemon.evolution ||
      (
        (!pokemon.evolution.pre || pokemon.evolution.pre === null) &&
        (!pokemon.evolution.next || pokemon.evolution.next.length === 0)
      )
    ) {
      const base = findPokemon(pokemon.id, null);
      if (base && base !== pokemon && base.evolution) evoSource = base;
    }

    if (!evoSource || !evoSource.evolution || !evoSource.evolution.next || evoSource.evolution.next.length === 0) {
      showMessage("This Pokémon cannot evolve further.", "error");
      return;
    }

    if (evoSource.evolution.next.length > 1) {
      const options = evoSource.evolution.next.map(evo => findPokemon(evo.id, evo.name)).filter(Boolean);
      if (options.length > 0) {
        setEvolveModal({ show: true, options });
        return;
      }
    }

    // Grab first evolution
    const nextEvo = evoSource.evolution.next[0];
    const nextPokemon = findPokemon(nextEvo.id, nextEvo.name);
    
    if (!nextPokemon) {
      showMessage("Evolution target not found.", "error");
      return;
    }
    
    executeEvolve(nextPokemon);
  };

  const hasEvolution = () => {
    if (!pokemon || isCapPikachu(pokemon)) return false;
    
    // Only allow Evolve button for Main Living Dex and Alpha Forms
    const isValidFormType = !pokemon.formType || 
                            ["main", "default", "alpha", "alphaother"].includes(pokemon.formType);
    if (!isValidFormType) return false;

    let evoSource = pokemon;
    if (
      !pokemon.evolution ||
      (
        (!pokemon.evolution.pre || pokemon.evolution.pre === null) &&
        (!pokemon.evolution.next || pokemon.evolution.next.length === 0)
      )
    ) {
      const base = findPokemon(pokemon.id, null);
      if (base && base !== pokemon && base.evolution) evoSource = base;
    }
    return !!(evoSource && evoSource.evolution && evoSource.evolution.next && evoSource.evolution.next.length > 0);
  };

  async function handleReset() {
    setResetModal({ show: true, pokemonName: formatPokemonName(pokemon?.name) });
  }

  const handleDuplicateEntry = () => {
    if (!caughtInfo || !localEntries || localEntries.length === 0) return;
    if (localEntries.length >= MAX_ENTRIES_PER_POKEMON) {
      showMessage(`Maximum limit of ${MAX_ENTRIES_PER_POKEMON} entries reached.`, "error");
      return;
    }

    const currentEntry = localEntries[selectedEntryIndex] || editData;
    const duplicated = {
      ...currentEntry,
      nickname: currentEntry.nickname ? `${currentEntry.nickname} (Copy)` : "",
      entryId: Math.random().toString(36).substr(2, 9),
      modifiers: currentEntry.modifiers ? { ...currentEntry.modifiers } : { ...defaultEditData.modifiers }
    };

    const updatedEntries = [...localEntries, duplicated];
    const updatedInfo = {
      caught: true,
      caughtAt: caughtInfo?.caughtAt || Date.now(),
      entries: updatedEntries
    };

    updateCaughtInfo(pokemon, updatedInfo, showShiny);
    setLocalEntries(updatedEntries);
    setSelectedEntryIndex(updatedEntries.length - 1);
    showMessage(`Entry duplicated (#${updatedEntries.length})!`, "success");
  };

  const handleCopySummary = () => {
    if (!pokemon) return;
    const currentEntry = localEntries[selectedEntryIndex] || editData;
    const pokemonName = formatPokemonName(pokemon.name);
    const shinyPrefix = showShiny ? "✨ " : "";
    
    const parts = [`${shinyPrefix}${pokemonName}${currentEntry?.nickname ? ` ("${currentEntry.nickname}")` : ""}`];
    
    if (currentEntry?.ball) parts.push(currentEntry.ball);
    if (currentEntry?.game) parts.push(currentEntry.game);
    const marksList = Array.isArray(currentEntry?.marks) && currentEntry.marks.length > 0
      ? currentEntry.marks
      : (currentEntry?.mark ? [currentEntry.mark] : []);
    if (marksList.length > 0) {
      const markNames = marksList.map(mVal => {
        const markObj = MARK_OPTIONS.find(m => m.value === mVal);
        return markObj ? markObj.name : mVal;
      });
      parts.push(markNames.join(", "));
    }
    if (currentEntry?.method && currentEntry.method !== "None" && currentEntry.method !== "Standard") {
      parts.push(currentEntry.method);
    }
    if (currentEntry?.checks) {
      parts.push(`${currentEntry.checks} ${currentEntry.method === 'Masuda' || currentEntry.method === 'Egg / Breeding' ? 'Eggs' : 'Encounters'}`);
    }
    if (currentEntry?.date) {
      parts.push(currentEntry.date);
    }
    if (currentEntry?.notes) {
      parts.push(`Notes: ${currentEntry.notes}`);
    }

    const summaryText = parts.join(" • ");
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(summaryText).then(() => {
        showMessage("Summary copied to clipboard!", "success");
      }).catch(() => {
        showMessage("Failed to copy summary to clipboard.", "error");
      });
    } else {
      showMessage("Clipboard not accessible.", "error");
    }
  };

  const handleDeleteEntry = () => {
    setDeleteEntryModal({
      show: true,
      entryIndex: selectedEntryIndex,
      entryNumber: selectedEntryIndex + 1
    });
  };

  // Handle reset confirmation
  const handleResetConfirm = () => {
    setResetModal({ show: false, pokemonName: '' });

    // Execute the reset
    updateCaughtInfo(pokemon, null, showShiny);
    setLocalEntries([]);
    setEditData(defaultEditData); // all blanks
    setEditing(true);
  };

  // Handle delete entry confirmation
  const handleDeleteEntryConfirm = () => {
    const entryIdx = deleteEntryModal.entryIndex;
    setDeleteEntryModal({ show: false, entryIndex: null, entryNumber: null });

    // Execute the delete
    const updatedEntries = localEntries.filter((_, i) => i !== entryIdx);
    if (updatedEntries.length === 0) {
      updateCaughtInfo(pokemon, null, showShiny);
      setLocalEntries([]);
    } else {
      updateCaughtInfo(pokemon, {
        caught: true,
        entries: updatedEntries
      }, showShiny, false, true);
      setLocalEntries(updatedEntries);

      // Adjust selectedEntryIndex if needed
      if (entryIdx >= updatedEntries.length) {
        setSelectedEntryIndex(Math.max(0, updatedEntries.length - 1));
      } else if (entryIdx > 0) {
        setSelectedEntryIndex(entryIdx - 1);
      }
    }
  };

  const isSameFail = (f, target) => {
    if (!f || !target) return false;
    if (target.id && f.id && target.id === f.id) return true;
    if (target.entryId && f.entryId && target.entryId === f.entryId) return true;
    if (target.timestamp && f.timestamp && target.timestamp === f.timestamp) return true;
    const fKey = `${f.date}-${f.phaseChecks ?? f.checks ?? 0}-${f.elapsedMs ?? f.time ?? 0}-${f.game ?? ''}`;
    const tKey = `${target.date}-${target.checks ?? target.phaseChecks ?? 0}-${target.time ?? target.elapsedMs ?? 0}-${target.game ?? ''}`;
    return fKey === tKey;
  };

  const handleConfirmDeleteFail = () => {
    const failToDelete = deleteFailModal.fail;
    setDeleteFailModal({ show: false, fail: null });
    if (!failToDelete || readOnly) return;

    const failKey = `${failToDelete.date}-${failToDelete.phaseChecks ?? failToDelete.checks ?? 0}-${failToDelete.elapsedMs ?? failToDelete.time ?? 0}-${failToDelete.game ?? ''}`;
    const idsToAdd = [failToDelete.id, failToDelete.entryId, failToDelete.timestamp, failKey].filter(Boolean).map(String);

    // 1. Blacklist fail so it can never be resurrected
    try {
      const blacklistKey = viewingUsername ? `deleted_hunt_history_ids:${viewingUsername}` : "deleted_hunt_history_ids:global";
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

    const caughtKey = pokemon ? getCaughtKey(pokemon, null, showShiny) : null;
    const directInfo = (caughtKey && caughtInfoMap) ? caughtInfoMap[caughtKey] : null;
    const currentFails = (Array.isArray(directInfo?.fails) ? directInfo.fails : null) || (Array.isArray(caughtInfo?.fails) ? caughtInfo.fails : []) || [];
    const updatedFails = currentFails.filter(f => !isSameFail(f, failToDelete));

    // Also remove from local editData if present
    if (Array.isArray(editData?.fails)) {
      setEditData(prev => ({
        ...prev,
        fails: prev.fails.filter(f => !isSameFail(f, failToDelete))
      }));
    }
    if (Array.isArray(editData?.phases)) {
      setEditData(prev => ({
        ...prev,
        phases: prev.phases.filter(p => !isSameFail(p, failToDelete))
      }));
    }

    // Also remove from localEntries if present
    if (Array.isArray(localEntries) && localEntries.length > 0) {
      setLocalEntries(prev => prev.map(entry => ({
        ...entry,
        fails: Array.isArray(entry.fails) ? entry.fails.filter(f => !isSameFail(f, failToDelete)) : entry.fails,
        phases: Array.isArray(entry.phases) ? entry.phases.filter(p => !isSameFail(p, failToDelete)) : entry.phases
      })));
    }

    // Clean from completedFails and completedHunts in localStorage
    try {
      const storageKeys = [
        viewingUsername ? `completedFails:${viewingUsername}` : null,
        "completedFails",
        viewingUsername ? `completedHunts:${viewingUsername}` : null,
        "completedHunts",
        "huntHistory"
      ].filter(Boolean);

      storageKeys.forEach(k => {
        const raw = localStorage.getItem(k);
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const updated = parsed.filter(item => !isSameFail(item, failToDelete));
            localStorage.setItem(k, JSON.stringify(updated));
          }
        } catch {}
      });
    } catch {}

    // Clean from activeHunts in localStorage
    try {
      const rawActive = localStorage.getItem("activeHunts");
      if (rawActive) {
        const activeHunts = JSON.parse(rawActive);
        let changed = false;
        activeHunts.forEach(h => {
          if (Array.isArray(h.phases)) {
            const initialLen = h.phases.length;
            h.phases = h.phases.filter(p => !isSameFail(p, failToDelete));
            if (h.phases.length !== initialLen) changed = true;
          }
        });
        if (changed) localStorage.setItem("activeHunts", JSON.stringify(activeHunts));
      }
    } catch {}

    const currentCaughtInfo = directInfo || caughtInfo;
    const isCurrentlyCaught = Boolean(currentCaughtInfo && currentCaughtInfo.caught !== false && (currentCaughtInfo.entries?.length > 0 || currentCaughtInfo.caught === true));

    if (isCurrentlyCaught) {
      updateCaughtInfo(pokemon, {
        ...currentCaughtInfo,
        fails: updatedFails
      }, showShiny);
    } else {
      updateCaughtInfo(pokemon, {
        caught: false,
        entries: [],
        fails: updatedFails
      }, showShiny);
    }
    showMessage("Fail record deleted", "success");
  };

  useEffect(() => {
    window.dispatchEvent(new Event('sidebarOpened'));
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setOpenAccordion(null);
      onClose();
    }, 370); // Match the original backup animation duration
  };

  if (!open && !closing) return null;

  // Safety check for pokemon (Mighty Pokemon, Origin Ball, and non-partner Cap Pikachu can never exist in shiny mode)
  if (!pokemon || (showShiny && (pokemon.formType === "mighty" || isOriginBall || isNonPartnerCapPikachu(pokemon)))) return null;

  // Look up objects for display by value
  const ballObj = BALL_OPTIONS.find(opt => opt.value === (editData?.ball ?? ""));
  const gameObj = GAME_OPTIONS.find(opt => opt.value === (editData?.game ?? ""));
  const markObj = MARK_OPTIONS.find(opt => opt.value === (editData?.mark ?? ""));

  const pokeImg = getSpriteUrl(pokemon, showShiny, viewerUseHomeSprites);
  const pokeName = formatPokemonName(pokemon?.name);
  const pokeTypes = pokemon?.types || [];

  // Generate external link URL based on preference
  const getExternalLink = () => {
    if (!pokemon?.name) return '#';

    if (externalLinkPreference === 'pokemondb') {
      // Special case for Type: Null - PokemonDB uses "type-null" format
      if (pokemon.name.toLowerCase().includes('type-null') || pokemon.name.toLowerCase().includes('type: null') || pokemon.name.toLowerCase().includes('type null')) {
        return `https://pokemondb.net/pokedex/type-null`;
      }

      // Special case for Mr. Mime - PokemonDB uses "mr-mime" format
      if (pokemon.name.toLowerCase().includes('mr-mime') || pokemon.name.toLowerCase().includes('mr. mime') || pokemon.name.toLowerCase().includes('mr mime')) {
        return `https://pokemondb.net/pokedex/mr-mime`;
      }

      // Special case for Mime Jr. - PokemonDB uses "mime-jr" format
      if (pokemon.name.toLowerCase().includes('mime-jr') || pokemon.name.toLowerCase().includes('mime jr') || pokemon.name.toLowerCase().includes('mime jr.')) {
        return `https://pokemondb.net/pokedex/mime-jr`;
      }

      // Special case for Mr. Rime - PokemonDB uses "mr-rime" format
      if (pokemon.name.toLowerCase().includes('mr-rime') || pokemon.name.toLowerCase().includes('mr. rime') || pokemon.name.toLowerCase().includes('mr rime')) {
        return `https://pokemondb.net/pokedex/mr-rime`;
      }

      // Special case for Nidoran♀ - PokemonDB uses "nidoran-f" format
      if (pokemon.name.toLowerCase().includes('nidoran-f') || pokemon.name.toLowerCase().includes('nidoran♀') || pokemon.name.toLowerCase().includes('nidoran female')) {
        return `https://pokemondb.net/pokedex/nidoran-f`;
      }

      // Special case for Nidoran♂ - PokemonDB uses "nidoran-m" format
      if (pokemon.name.toLowerCase().includes('nidoran-m') || pokemon.name.toLowerCase().includes('nidoran♂') || pokemon.name.toLowerCase().includes('nidoran male')) {
        return `https://pokemondb.net/pokedex/nidoran-m`;
      }

      // Special case for Farfetch'd - PokemonDB uses "farfetchd" format (no apostrophe)
      if (pokemon.name.toLowerCase().includes('farfetch') || pokemon.name.toLowerCase().includes('farfetch\'d') || pokemon.name.toLowerCase().includes('farfetchd')) {
        return `https://pokemondb.net/pokedex/farfetchd`;
      }

      // Special case for Sirfetch'd - PokemonDB uses "sirfetchd" format (no apostrophe)
      if (pokemon.name.toLowerCase().includes('sirfetch') || pokemon.name.toLowerCase().includes('sirfetch\'d') || pokemon.name.toLowerCase().includes('sirfetchd')) {
        return `https://pokemondb.net/pokedex/sirfetchd`;
      }

      // PokemonDB - use the display name and clean it for URL
      let displayName = formatPokemonName(pokemon.name);

      // Special case for Unown forms - always use base "unown"
      if (pokemon.name.toLowerCase().startsWith('unown')) {
        displayName = 'Unown';
      }

      // PokemonDB uses lowercase names with hyphens for spaces
      const pokemonName = displayName.toLowerCase().replace(/\s+/g, '-');
      return `https://pokemondb.net/pokedex/${pokemonName}`;
    } else if (externalLinkPreference === 'bulbapedia') {
      // Special case for Type: Null - Bulbapedia uses "Type:_Null" format
      if (pokemon.name.toLowerCase().includes('type-null') || pokemon.name.toLowerCase().includes('type: null') || pokemon.name.toLowerCase().includes('type null')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Type:_Null_(Pokémon)`;
      }

      // Special case for Mr. Mime - Bulbapedia uses "Mr._Mime" format
      if (pokemon.name.toLowerCase().includes('mr-mime') || pokemon.name.toLowerCase().includes('mr. mime') || pokemon.name.toLowerCase().includes('mr mime')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Mr._Mime_(Pokémon)`;
      }

      // Special case for Mime Jr. - Bulbapedia uses "Mime_Jr." format
      if (pokemon.name.toLowerCase().includes('mime-jr') || pokemon.name.toLowerCase().includes('mime jr') || pokemon.name.toLowerCase().includes('mime jr.')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Mime_Jr._(Pokémon)`;
      }

      // Special case for Mr. Rime - Bulbapedia uses "Mr._Rime" format
      if (pokemon.name.toLowerCase().includes('mr-rime') || pokemon.name.toLowerCase().includes('mr. rime') || pokemon.name.toLowerCase().includes('mr rime')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Mr._Rime_(Pokémon)`;
      }

      // Special case for Nidoran♀ - Bulbapedia uses URL-encoded gender symbol
      if (pokemon.name.toLowerCase().includes('nidoran-f') || pokemon.name.toLowerCase().includes('nidoran♀') || pokemon.name.toLowerCase().includes('nidoran female')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Nidoran%E2%99%80_(Pokémon)`;
      }

      // Special case for Nidoran♂ - Bulbapedia uses URL-encoded gender symbol
      if (pokemon.name.toLowerCase().includes('nidoran-m') || pokemon.name.toLowerCase().includes('nidoran♂') || pokemon.name.toLowerCase().includes('nidoran male')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Nidoran%E2%99%82_(Pokémon)`;
      }

      // Special case for Farfetch'd - Bulbapedia uses URL-encoded apostrophe
      if (pokemon.name.toLowerCase().includes('farfetch') || pokemon.name.toLowerCase().includes('farfetch\'d') || pokemon.name.toLowerCase().includes('farfetchd')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Farfetch%27d_(Pokémon)`;
      }

      // Special case for Sirfetch'd - Bulbapedia uses URL-encoded apostrophe
      if (pokemon.name.toLowerCase().includes('sirfetch') || pokemon.name.toLowerCase().includes('sirfetch\'d') || pokemon.name.toLowerCase().includes('sirfetchd')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Sirfetch%27d_(Pokémon)`;
      }

      // Special case for Ho-Oh - Bulbapedia uses "Ho-Oh" format (with hyphen)
      if (pokemon.name.toLowerCase().includes('ho-oh') || pokemon.name.toLowerCase().includes('hooh') || pokemon.name.toLowerCase().includes('ho oh')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Ho-Oh_(Pokémon)`;
      }

      // Special case for Porygon-Z - Bulbapedia uses "Porygon-Z" format (with hyphen)
      if (pokemon.name.toLowerCase() === 'porygon-z' || pokemon.name.toLowerCase().includes('porygon-z') || pokemon.name.toLowerCase().includes('porygonz') || pokemon.name.toLowerCase().includes('porygon z')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Porygon-Z_(Pokémon)`;
      }

      // Special case for Jangmo-o - Bulbapedia uses "Jangmo-o" format (with hyphen)
      if (pokemon.name.toLowerCase() === 'jangmo-o' || pokemon.name.toLowerCase().includes('jangmo-o') || pokemon.name.toLowerCase().includes('jangmoo') || pokemon.name.toLowerCase().includes('jangmo o')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Jangmo-o_(Pokémon)`;
      }

      // Special case for Hakamo-o - Bulbapedia uses "Hakamo-o" format (with hyphen)
      if (pokemon.name.toLowerCase() === 'hakamo-o' || pokemon.name.toLowerCase().includes('hakamo-o') || pokemon.name.toLowerCase().includes('hakamoo') || pokemon.name.toLowerCase().includes('hakamo o')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Hakamo-o_(Pokémon)`;
      }

      // Special case for Kommo-o - Bulbapedia uses "Kommo-o" format (with hyphen)
      if (pokemon.name.toLowerCase() === 'kommo-o' || pokemon.name.toLowerCase().includes('kommo-o') || pokemon.name.toLowerCase().includes('kommoo') || pokemon.name.toLowerCase().includes('kommo o')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Kommo-o_(Pokémon)`;
      }

      // Special case for Tapu Koko - Bulbapedia uses "Tapu_Koko" format (with underscore)
      if (pokemon.name.toLowerCase() === 'tapu-koko' || pokemon.name.toLowerCase().includes('tapu koko') || pokemon.name.toLowerCase().includes('tapukoko')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Tapu_Koko_(Pokémon)`;
      }

      // Special case for Tapu Lele - Bulbapedia uses "Tapu_Lele" format (with underscore)
      if (pokemon.name.toLowerCase() === 'tapu-lele' || pokemon.name.toLowerCase().includes('tapu lele') || pokemon.name.toLowerCase().includes('tapulele')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Tapu_Lele_(Pokémon)`;
      }

      // Special case for Tapu Bulu - Bulbapedia uses "Tapu_Bulu" format (with underscore)
      if (pokemon.name.toLowerCase() === 'tapu-bulu' || pokemon.name.toLowerCase().includes('tapu bulu') || pokemon.name.toLowerCase().includes('tapubulu')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Tapu_Bulu_(Pokémon)`;
      }

      // Special case for Tapu Fini - Bulbapedia uses "Tapu_Fini" format (with underscore)
      if (pokemon.name.toLowerCase() === 'tapu-fini' || pokemon.name.toLowerCase().includes('tapu fini') || pokemon.name.toLowerCase().includes('tapufini')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Tapu_Fini_(Pokémon)`;
      }

      // Special case for Great Tusk - Bulbapedia uses "Great_Tusk" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase().includes('great tusk') || pokemon.name.toLowerCase().includes('great-tusk') || pokemon.name.toLowerCase().includes('greattusk')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Great_Tusk_(Pokémon)`;
      }

      // Special case for Scream Tail - Bulbapedia uses "Scream_Tail" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'scream-tail' || pokemon.name.toLowerCase().includes('scream tail') || pokemon.name.toLowerCase().includes('screamtail')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Scream_Tail_(Pokémon)`;
      }

      // Special case for Brute Bonnet - Bulbapedia uses "Brute_Bonnet" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'brute-bonnet' || pokemon.name.toLowerCase().includes('brute bonnet') || pokemon.name.toLowerCase().includes('brutebonnet')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Brute_Bonnet_(Pokémon)`;
      }

      // Special case for Flutter Mane - Bulbapedia uses "Flutter_Mane" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'flutter-mane' || pokemon.name.toLowerCase().includes('flutter mane') || pokemon.name.toLowerCase().includes('fluttermane')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Flutter_Mane_(Pokémon)`;
      }

      // Special case for Slither Wing - Bulbapedia uses "Slither_Wing" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'slither-wing' || pokemon.name.toLowerCase().includes('slither wing') || pokemon.name.toLowerCase().includes('slitherwing')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Slither_Wing_(Pokémon)`;
      }

      // Special case for Sandy Shocks - Bulbapedia uses "Sandy_Shocks" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'sandy-shocks' || pokemon.name.toLowerCase().includes('sandy shocks') || pokemon.name.toLowerCase().includes('sandyshocks')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Sandy_Shocks_(Pokémon)`;
      }

      // Special case for Iron Treads - Bulbapedia uses "Iron_Treads" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-treads' || pokemon.name.toLowerCase().includes('iron treads') || pokemon.name.toLowerCase().includes('irontreads')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Treads_(Pokémon)`;
      }

      // Special case for Iron Bundle - Bulbapedia uses "Iron_Bundle" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-bundle' || pokemon.name.toLowerCase().includes('iron bundle') || pokemon.name.toLowerCase().includes('ironbundle')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Bundle_(Pokémon)`;
      }

      // Special case for Iron Hands - Bulbapedia uses "Iron_Hands" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-hands' || pokemon.name.toLowerCase().includes('iron hands') || pokemon.name.toLowerCase().includes('ironhands')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Hands_(Pokémon)`;
      }

      // Special case for Iron Jugulis - Bulbapedia uses "Iron_Jugulis" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-jugulis' || pokemon.name.toLowerCase().includes('iron jugulis') || pokemon.name.toLowerCase().includes('ironjugulis')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Jugulis_(Pokémon)`;
      }

      // Special case for Iron Moth - Bulbapedia uses "Iron_Moth" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-moth' || pokemon.name.toLowerCase().includes('iron moth') || pokemon.name.toLowerCase().includes('ironmoth')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Moth_(Pokémon)`;
      }

      // Special case for Iron Thorns - Bulbapedia uses "Iron_Thorns" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-thorns' || pokemon.name.toLowerCase().includes('iron thorns') || pokemon.name.toLowerCase().includes('ironthorns')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Thorns_(Pokémon)`;
      }

      // Special case for Wo-Chien - Bulbapedia uses "Wo-Chien" format (with hyphen and proper capitalization)
      if (pokemon.name.toLowerCase() === 'wo-chien' || pokemon.name.toLowerCase().includes('wo chien') || pokemon.name.toLowerCase().includes('wochien')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Wo-Chien_(Pokémon)`;
      }

      // Special case for Chien-Pao - Bulbapedia uses "Chien-Pao" format (with hyphen and proper capitalization)
      if (pokemon.name.toLowerCase() === 'chien-pao' || pokemon.name.toLowerCase().includes('chien pao') || pokemon.name.toLowerCase().includes('chienpao')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Chien-Pao_(Pokémon)`;
      }

      // Special case for Ting-Lu - Bulbapedia uses "Ting-Lu" format (with hyphen and proper capitalization)
      if (pokemon.name.toLowerCase() === 'ting-lu' || pokemon.name.toLowerCase().includes('ting lu') || pokemon.name.toLowerCase().includes('tinglu')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Ting-Lu_(Pokémon)`;
      }

      // Special case for Chi-Yu - Bulbapedia uses "Chi-Yu" format (with hyphen and proper capitalization)
      if (pokemon.name.toLowerCase() === 'chi-yu' || pokemon.name.toLowerCase().includes('chi yu') || pokemon.name.toLowerCase().includes('chiyu')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Chi-Yu_(Pokémon)`;
      }

      // Special case for Roaring Moon - Bulbapedia uses "Roaring_Moon" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'roaring-moon' || pokemon.name.toLowerCase().includes('roaring moon') || pokemon.name.toLowerCase().includes('roaringmoon')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Roaring_Moon_(Pokémon)`;
      }

      // Special case for Iron Valiant - Bulbapedia uses "Iron_Valiant" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-valiant' || pokemon.name.toLowerCase().includes('iron valiant') || pokemon.name.toLowerCase().includes('ironvaliant')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Valiant_(Pokémon)`;
      }

      // Special case for Walking Wake - Bulbapedia uses "Walking_Wake" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'walking-wake' || pokemon.name.toLowerCase().includes('walking wake') || pokemon.name.toLowerCase().includes('walkingwake')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Walking_Wake_(Pokémon)`;
      }

      // Special case for Iron Leaves - Bulbapedia uses "Iron_Leaves" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-leaves' || pokemon.name.toLowerCase().includes('iron leaves') || pokemon.name.toLowerCase().includes('ironleaves')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Leaves_(Pokémon)`;
      }

      // Special case for Gouging Fire - Bulbapedia uses "Gouging_Fire" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'gouging-fire' || pokemon.name.toLowerCase().includes('gouging fire') || pokemon.name.toLowerCase().includes('gougingfire')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Gouging_Fire_(Pokémon)`;
      }

      // Special case for Raging Bolt - Bulbapedia uses "Raging_Bolt" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'raging-bolt' || pokemon.name.toLowerCase().includes('raging bolt') || pokemon.name.toLowerCase().includes('ragingbolt')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Raging_Bolt_(Pokémon)`;
      }

      // Special case for Iron Boulder - Bulbapedia uses "Iron_Boulder" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-boulder' || pokemon.name.toLowerCase().includes('iron boulder') || pokemon.name.toLowerCase().includes('ironboulder')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Boulder_(Pokémon)`;
      }

      // Special case for Iron Crown - Bulbapedia uses "Iron_Crown" format (with underscore and proper capitalization)
      if (pokemon.name.toLowerCase() === 'iron-crown' || pokemon.name.toLowerCase().includes('iron crown') || pokemon.name.toLowerCase().includes('ironcrown')) {
        return `https://bulbapedia.bulbagarden.net/wiki/Iron_Crown_(Pokémon)`;
      }

      // Use the display name and clean it for URL
      let displayName = formatPokemonName(pokemon.name);

      // Special case for Unown forms - always use base "unown"
      if (pokemon.name.toLowerCase().startsWith('unown')) {
        displayName = 'Unown';
      }

      const pokemonName = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return `https://bulbapedia.bulbagarden.net/wiki/${pokemonName}_(Pokémon)`;
    } else if (externalLinkPreference === 'smogon') {
      // Smogon - use the Pokemon strategy page
      let displayName = formatPokemonName(pokemon.name);

      // Special case for Nidoran♀ - Smogon uses "nidoran-f" format
      if (pokemon.name.toLowerCase().includes('nidoran-f') || pokemon.name.toLowerCase().includes('nidoran♀') || pokemon.name.toLowerCase().includes('nidoran female')) {
        return `https://www.smogon.com/dex/sv/pokemon/nidoran-f/`;
      }

      // Special case for Nidoran♂ - Smogon uses "nidoran-m" format
      if (pokemon.name.toLowerCase().includes('nidoran-m') || pokemon.name.toLowerCase().includes('nidoran♂') || pokemon.name.toLowerCase().includes('nidoran male')) {
        return `https://www.smogon.com/dex/sv/pokemon/nidoran-m/`;
      }

      // Special case for Unown forms - always use base "unown"
      if (pokemon.name.toLowerCase().startsWith('unown')) {
        displayName = 'Unown';
      }

      // Smogon uses lowercase names with hyphens for spaces
      const pokemonName = displayName.toLowerCase().replace(/\s+/g, '-');
      return `https://www.smogon.com/dex/sv/pokemon/${pokemonName}/`;
    } else {
      // Serebii - use the main Pokemon hub with Pokemon name
      let displayName = formatPokemonName(pokemon.name);

      // Special case for Unown forms - always use base "unown"
      if (pokemon.name.toLowerCase().startsWith('unown')) {
        displayName = 'Unown';
      }

      // Special case for Mr. Mime - Serebii uses "mr.mime" format
      if (pokemon.name.toLowerCase().includes('mr-mime') || pokemon.name.toLowerCase().includes('mr. mime') || pokemon.name.toLowerCase().includes('mr mime')) {
        return `https://www.serebii.net/pokemon/mr.mime`;
      }

      // Special case for Mime Jr. - Serebii uses "mimejr." format
      if (pokemon.name.toLowerCase().includes('mime-jr') || pokemon.name.toLowerCase().includes('mime jr') || pokemon.name.toLowerCase().includes('mime jr.')) {
        return `https://www.serebii.net/pokemon/mimejr.`;
      }

      // Special case for Mr. Rime - Serebii uses "mr.rime" format
      if (pokemon.name.toLowerCase().includes('mr-rime') || pokemon.name.toLowerCase().includes('mr. rime') || pokemon.name.toLowerCase().includes('mr rime')) {
        return `https://www.serebii.net/pokemon/mr.rime`;
      }

      // Special case for Type: Null - Serebii uses "type:null" format
      if (pokemon.name.toLowerCase().includes('type-null') || pokemon.name.toLowerCase().includes('type: null') || pokemon.name.toLowerCase().includes('type null')) {
        return `https://www.serebii.net/pokemon/type:null`;
      }

      // Special case for Nidoran♀ - Serebii uses "nidoranf" format
      if (pokemon.name.toLowerCase().includes('nidoran-f') || pokemon.name.toLowerCase().includes('nidoran♀') || pokemon.name.toLowerCase().includes('nidoran female')) {
        return `https://www.serebii.net/pokemon/nidoranf`;
      }

      // Special case for Nidoran♂ - Serebii uses "nidoranm" format
      if (pokemon.name.toLowerCase().includes('nidoran-m') || pokemon.name.toLowerCase().includes('nidoran♂') || pokemon.name.toLowerCase().includes('nidoran male')) {
        return `https://www.serebii.net/pokemon/nidoranm`;
      }

      // Special case for Farfetch'd - Serebii uses "farfetch'd" format (with apostrophe)
      if (pokemon.name.toLowerCase().includes('farfetch') || pokemon.name.toLowerCase().includes('farfetch\'d') || pokemon.name.toLowerCase().includes('farfetchd')) {
        return `https://www.serebii.net/pokemon/farfetch'd`;
      }

      // Special case for Sirfetch'd - Serebii uses "sirfetch'd" format (with apostrophe)
      if (pokemon.name.toLowerCase().includes('sirfetch') || pokemon.name.toLowerCase().includes('sirfetch\'d') || pokemon.name.toLowerCase().includes('sirfetchd')) {
        return `https://www.serebii.net/pokemon/sirfetch'd`;
      }

      // Use cleaned name for most Pokémon - preserve hyphens and colons but remove other special characters
      const pokemonName = displayName.toLowerCase().replace(/[^a-z0-9-:]/g, '');
      return `https://www.serebii.net/pokemon/${pokemonName}`;
    }
  };

  const toRomanGen = (gen) => {
    const map = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII", 9: "IX" };
    return map[gen] || gen || "I";
  };

  const handleSelectMark = (markVal) => {
    if (readOnly) return;
    if (isMighty) return;

    const currentMarks = selectedMarks;
    const isSelected = currentMarks.includes(markVal);
    const nextMarks = isSelected
      ? currentMarks.filter(m => m !== markVal)
      : [...currentMarks, markVal];

    setEditData(prev => ({
      ...prev,
      marks: nextMarks,
      mark: nextMarks[0] || ""
    }));

    if (!editing && caughtInfo && localEntries.length > 0) {
      const currentEntries = [...localEntries];
      const updated = currentEntries.map((entry, idx) =>
        idx === selectedEntryIndex
          ? {
              ...entry,
              marks: nextMarks,
              mark: nextMarks[0] || ""
            }
          : entry
      );
      updateCaughtInfo(pokemon, {
        caught: true,
        caughtAt: caughtInfo.caughtAt || Date.now(),
        entries: updated
      }, showShiny);
      setLocalEntries(updated);
      const chosenMarkObj = MARK_OPTIONS.find(m => m.value === markVal);
      showMessage(
        isSelected
          ? `Removed ${chosenMarkObj?.name || markVal}`
          : `Added ${chosenMarkObj?.name || markVal}`,
        "success"
      );
    }
  };

  const handleClearAllMarks = () => {
    if (readOnly || isMighty) return;
    setEditData(prev => ({ ...prev, marks: [], mark: "" }));

    if (!editing && caughtInfo && localEntries.length > 0) {
      const currentEntries = [...localEntries];
      const updated = currentEntries.map((entry, idx) =>
        idx === selectedEntryIndex ? { ...entry, marks: [], mark: "" } : entry
      );
      updateCaughtInfo(pokemon, {
        caught: true,
        caughtAt: caughtInfo.caughtAt || Date.now(),
        entries: updated
      }, showShiny);
      setLocalEntries(updated);
      showMessage("All marks removed", "success");
    }
  };

  const handleAddEntry = () => {
    if (localEntries.length >= MAX_ENTRIES_PER_POKEMON || readOnly) return;

    const newEntry = {
      nickname: "",
      date: "",
      ball: BALL_OPTIONS[0].value,
      marks: isMighty ? ["mightiest"] : (isAlpha ? ["alpha"] : []),
      mark: isMighty ? "mightiest" : (isAlpha ? "alpha" : ""),
      method: isMighty ? "Tera Raids" : METHOD_OPTIONS[0],
      game: isMighty ? "Scarlet" : "",
      checks: "",
      time: "",
      notes: "",
      entryId: Math.random().toString(36).substr(2, 9),
      modifiers: defaultEditData.modifiers
    };

    const currentEntries = localEntries;
    const updatedInfo = {
      caught: true,
      caughtAt: Date.now(),
      entries: [...currentEntries, newEntry]
    };

    updateCaughtInfo(pokemon, updatedInfo, showShiny, true);
    setLocalEntries([...currentEntries, newEntry]);
    setSelectedEntryIndex(currentEntries.length);
    setEditData(newEntry);
    setEditing(true);
  };

  const handleDeleteEntryClick = (e) => {
    e?.stopPropagation?.();
    if (readOnly) return;
    const currentEntry = localEntries[selectedEntryIndex];
    const hasData = currentEntry && (
      currentEntry.nickname || currentEntry.date || currentEntry.ball || currentEntry.game ||
      currentEntry.mark || currentEntry.method || currentEntry.checks || currentEntry.notes
    );

    if (hasData) {
      setDeleteEntryModal({ show: true, entryIndex: selectedEntryIndex, entryNumber: selectedEntryIndex + 1 });
    } else {
      const updatedEntries = localEntries.filter((_, i) => i !== selectedEntryIndex);
      if (updatedEntries.length === 0) {
        updateCaughtInfo(pokemon, null, showShiny);
        setLocalEntries([]);
        setEditData(defaultEditData);
      } else {
        updateCaughtInfo(pokemon, {
          caught: true,
          entries: updatedEntries
        }, showShiny, false, true);
        setLocalEntries(updatedEntries);
        const nextIdx = Math.max(0, Math.min(selectedEntryIndex, updatedEntries.length - 1));
        setSelectedEntryIndex(nextIdx);
        setEditData(updatedEntries[nextIdx]);
      }
    }
  };

    const renderRelatedFormsSection = () => {
    if (!pokemon) return null;
    let relatedForms = getRelatedForms(pokemon);

    if (dexPreferences) {
      relatedForms = filterFormsByPreferences(relatedForms, dexPreferences);

      if (showShiny) {
        relatedForms = relatedForms.filter(form => form.formType !== "mighty" && !form.stableId?.startsWith("origin-ball-") && !isNonPartnerCapPikachu(form));

        const {
          blockUnobtainableShinies,
          blockGOExclusiveShinies,
          blockNOOTExclusiveShinies
        } = dexPreferences;

        relatedForms = relatedForms.filter(form => {
          const paddedId = String(form.id).padStart(4, '0');
          const formName = form.name;

          if (blockUnobtainableShinies) {
            if (UNOBTAINABLE_SHINY_DEX_NUMBERS.includes(paddedId)) return false;
            if (UNOBTAINABLE_SHINY_FORM_NAMES.includes(formName)) return false;
          }

          if (blockGOExclusiveShinies) {
            if (GO_EXCLUSIVE_SHINY_DEX_NUMBERS.includes(paddedId)) return false;
            if (GO_EXCLUSIVE_SHINY_FORM_NAMES.includes(formName)) return false;
          }

          if (blockNOOTExclusiveShinies) {
            if (NO_OT_EXCLUSIVE_SHINY_DEX_NUMBERS.includes(paddedId)) return false;
            if (NO_OT_EXCLUSIVE_SHINY_FORM_NAMES.includes(formName)) return false;
          }

          return true;
        });
      }
    }

    if (relatedForms.length === 0) return null;

    return (
      <div className="sidebar-info-section">
        <div className="sidebar-info-section-header">
          <Layers size={18} className="text-[var(--accent)]" />
          <span className="sidebar-info-section-title">FORMS</span>
        </div>
        <div className="sidebar-info-section-divider"></div>
        <div className="related-forms-list">
          {relatedForms.map((form) => {
            const imgSrc = getSpriteUrl(form, showShiny, viewerUseHomeSprites);
            const formLabel = getFormDisplayName(form) || formatPokemonName(form.name);
            const isClickable = onPokemonSelect !== null;

            let iconSrc = null;
            let iconColor = "#6b7280";
            let iconPadding = "2px";

            const isFormMighty = form.formType === 'mighty' || (form.name && form.name.includes('-mighty')) || (form.stableId && form.stableId.includes('mighty'));
            const isAlpha = form.formType === 'alpha' || form.formType === 'alphaother' || (form.name && form.name.includes('-alpha'));
            const isGmax = form.formType === 'gmax' || (form.name && form.name.includes('-gmax'));

            let nameToCheck = form.name || "";
            if (nameToCheck.includes("-alpha")) nameToCheck = nameToCheck.replace("-alpha", "");

            const isFemale = form.formType === 'gender' || (form.formType === 'alphaother' && form.stableId && form.stableId.includes('female')) || (form.name && form.name.includes('-female'));
            const isMale = !isFemale && ((form.name && form.name.includes('-male')) || (form.stableId && form.stableId.includes('male')) || genderForms.includes(nameToCheck));

            if (isFormMighty) {
              iconSrc = "/data/marks/mark-mightiest.png";
              iconColor = "var(--accent)";
              iconPadding = "1px";
            } else if (isAlpha) {
              if (isFemale) {
                iconSrc = "/data/SidebarIcons/Alpha_Mark_Female.png";
                iconColor = "#ef6491";
                iconPadding = "2px";
              } else if (isMale) {
                iconSrc = "/data/SidebarIcons/Alpha_Mark_Male.png";
                iconColor = "#316497";
                iconPadding = "2px";
              } else {
                iconSrc = "/data/SidebarIcons/Alpha_Mark.png";
                iconColor = "#e05555";
                iconPadding = "2px";
              }
            } else {
              if (isFemale) {
                iconSrc = "/data/SidebarIcons/Female.svg";
                iconColor = "#ef6491";
                iconPadding = "5px";
              } else if (isMale) {
                iconSrc = "/data/SidebarIcons/Male.svg";
                iconColor = "#316497";
                iconPadding = "5px";
              }
            }

            return (
              <div
                key={form.stableId || `${form.id}-${form.name}`}
                className={`sidebar-form-item-card ${isClickable ? 'clickable' : ''}`}
                onClick={() => isClickable && onPokemonSelect(form)}
                title={formLabel}
              >
                <div className="sidebar-form-item-sprite-wrap">
                  <img
                    src={imgSrc}
                    alt={form.name}
                    className="sidebar-form-item-img"
                    width={38}
                    height={38}
                    loading="lazy"
                  />
                  {iconSrc && (
                    <div
                      className="sidebar-form-icon-overlay"
                      style={{
                        borderColor: iconColor,
                        padding: iconPadding
                      }}
                    >
                      <img src={iconSrc} alt="Form Icon" />
                    </div>
                  )}
                </div>
                <span className="sidebar-form-item-name">{formLabel}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      data-tutorial-id="sidebar-overview"
      className={`sidebar-container ${closing ? 'sidebar-slide-out' : 'sidebar-slide-in'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button data-tutorial-id="close-sidebar" className="sidebar-close-button" onClick={handleClose} aria-label="Close">
        <PokeballCloseIcon size={40} />
      </button>

      {/* Top row: Condensed Header */}
      <div className="sidebar-header-compact">
        {/* Left: Avatar */}
        <div className="sidebar-header-avatar-wrap">
          <img
            src={pokeImg}
            alt={pokeName}
            className="sidebar-header-avatar-img"
            style={{ imageRendering: viewerUseHomeSprites ? 'auto' : 'pixelated' }}
            width={82}
            height={82}
          />
          {showShiny && (
            <div className="shiny-sparkles-overlay">
              <Sparkles size={14} className="shiny-sparkles-icon" />
            </div>
          )}
        </div>

        {/* Center: Name + Number + Generation */}
        <div className="sidebar-header-info">
          <div className="sidebar-header-name-row">
            <a
              href={getExternalLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-pokemon-name-link"
              title={`View ${pokeName} on ${externalLinkPreference === 'serebii' ? 'Serebii' : externalLinkPreference === 'bulbapedia' ? 'Bulbapedia' : 'PokemonDB'}`}
            >
              <span className="sidebar-pokemon-name">{pokeName}</span>
            </a>
          </div>
          <div className="sidebar-header-meta">
            <div className="sidebar-header-meta-row">
              <span>#{pokemon?.id ? String(pokemon.id).padStart(4, "0") : "----"}</span>
              <span className="sidebar-header-meta-dot">•</span>
              <span>Gen {toRomanGen(pokemon?.gen)}</span>
            </div>
            <div className="sidebar-header-form-slot">
              {pokemon && getFormDisplayName(pokemon) ? (
                <span className="sidebar-header-form-badge">{getFormDisplayName(pokemon)}</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right: Type Badges */}
        <div className="sidebar-header-right">
          <div className="sidebar-header-types">
            {pokeTypes.map(type => renderTypeBadge(type))}
          </div>
        </div>
      </div>

      {/* Relocated Entry Navigation Bar */}
      <div className="sidebar-entry-bar">
        {!isCaught ? (
          <div className="sidebar-entry-uncaught">
            <div className="sidebar-uncaught-badge">
              <span className="sidebar-uncaught-dot" />
              <span>
                {readOnly && viewingUsername ? `${viewingUsername} has not caught this Pokémon` : "Not Caught"}
              </span>
            </div>
            {!readOnly && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} strokeWidth={2.5} />}
                onClick={handleSetCaught}
              >
                Set as caught
              </Button>
            )}
          </div>
        ) : (
          <div className="sidebar-entry-caught-wrap">
            <div className="sidebar-entry-nav-group">
              {!readOnly && localEntries.length > 1 && (
                <Button
                  variant="danger-soft"
                  size="sm"
                  className="!w-7 !h-7 !p-0 !min-h-0 !rounded-md"
                  onClick={handleDeleteEntryClick}
                  icon={<Trash2 size={13} />}
                  title="Delete current entry"
                />
              )}
              {localEntries.length > 1 ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="!w-7 !h-7 !p-0 !min-h-0 !rounded-md !text-xs"
                    onClick={() => { setSelectedEntryIndex(0); switchToEntry(0); }}
                    disabled={selectedEntryIndex === 0}
                    title="First entry"
                  >
                    1
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="!w-7 !h-7 !p-0 !min-h-0 !rounded-md"
                    onClick={() => {
                      if (selectedEntryIndex > 0) {
                        const newIdx = selectedEntryIndex - 1;
                        setSelectedEntryIndex(newIdx);
                        switchToEntry(newIdx);
                      }
                    }}
                    disabled={selectedEntryIndex === 0}
                    icon={<ChevronLeft size={13} />}
                    title="Previous entry"
                  />
                  <span className="sidebar-entry-current-badge">
                    Entry {selectedEntryIndex + 1} of {localEntries.length}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="!w-7 !h-7 !p-0 !min-h-0 !rounded-md"
                    onClick={() => {
                      if (selectedEntryIndex < localEntries.length - 1) {
                        const newIdx = selectedEntryIndex + 1;
                        setSelectedEntryIndex(newIdx);
                        switchToEntry(newIdx);
                      }
                    }}
                    disabled={selectedEntryIndex >= localEntries.length - 1}
                    icon={<ChevronRight size={13} />}
                    title="Next entry"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="!w-7 !h-7 !p-0 !min-h-0 !rounded-md !text-xs"
                    onClick={() => {
                      const newIdx = localEntries.length - 1;
                      setSelectedEntryIndex(newIdx);
                      switchToEntry(newIdx);
                    }}
                    disabled={selectedEntryIndex === localEntries.length - 1}
                    title="Last entry"
                  >
                    {localEntries.length}
                  </Button>
                </>
              ) : (
                <span className="sidebar-entry-current-badge">
                  Entry 1 of 1
                </span>
              )}
            </div>

            {!readOnly && (
              <Button
                variant="primary"
                size="sm"
                className="!w-7 !h-7 !p-0 !min-h-0 !rounded-md"
                onClick={handleAddEntry}
                disabled={localEntries.length >= MAX_ENTRIES_PER_POKEMON}
                icon={<Plus size={14} strokeWidth={2.5} />}
                title={localEntries.length >= MAX_ENTRIES_PER_POKEMON ? `Maximum entries reached (${MAX_ENTRIES_PER_POKEMON})` : `Add another entry (max ${MAX_ENTRIES_PER_POKEMON})`}
              />
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation - only rendered when Marks or Notes tab is visible */}
      {(showMarksTab || showNotesTab) && (
        <div className="sidebar-tabs-bar">
          <button
            type="button"
            className={`sidebar-tab-btn ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            Data
          </button>
          {showMarksTab && (
            <MarksTabButton
              active={activeTab === 'marks'}
              disabled={isMarksDisabled}
              onClick={() => setActiveTab('marks')}
            />
          )}
          {showNotesTab && (
            <button
              type="button"
              className={`sidebar-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              Notes
            </button>
          )}
        </div>
      )}

      {/* Scrollable Content Area + Pinned Footer Wrap */}
      <div 
        className="sidebar-body-container"
        data-tutorial-id={editing ? "edit-form" : "sidebar-entries-overview"}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
      >
        {/* Scrollable Content Area */}
        <div className="sidebar-content-scrollable">
        {/* --- DATA TAB --- */}
        {activeTab === 'data' && (
          <div className="flex flex-col w-full">
            {/* Catch Info Accordion - only visible if editing or if caught with recorded data */}
            {(editing || (caughtInfo && hasCatchData)) && (
              <div className={`sidebar-accordion ${openAccordion === 'catch' ? 'open' : ''}`}>
              <button
                type="button"
                className="sidebar-accordion-header"
                onClick={() => setOpenAccordion(prev => prev === 'catch' ? null : 'catch')}
              >
                <span>CATCH INFO</span>
                <ChevronDown size={16} className="sidebar-accordion-chevron" />
              </button>

              <div className="sidebar-accordion-collapse">
                <div className="sidebar-accordion-inner">
                  <div className="sidebar-accordion-body">
                  {!caughtInfo ? (
                    <div className="text-center py-3 text-sm text-[var(--sidebar-text)] opacity-70">
                      Pokémon is currently not caught.
                    </div>
                  ) : editing && !readOnly ? (
                    <div className="space-y-3">
                      <div className="sidebar-form-group">
                        <InputField
                          id="nickname-input"
                          name="nickname"
                          label="Nickname:"
                          value={editData.nickname || ""}
                          onChange={handleEditChange}
                          placeholder="Enter nickname..."
                          maxLength={12}
                          showCharCount
                          charCountInHeader
                          startIcon={<NicknameIcon size={16} />}
                          size="md"
                          fullWidth
                          clearable
                          autoComplete="off"
                        />
                      </div>

                      <div className="sidebar-form-group">
                        <DateField
                          id="date-caught"
                          name="date"
                          label="Date caught:"
                          value={editData.date || ""}
                          onChange={handleEditChange}
                          size="md"
                          fullWidth
                          clearable
                        />
                      </div>

                      <div className="sidebar-form-group">
                        <SelectField
                          id="game-dropdown"
                          label="Game:"
                          disabled={isOriginBall}
                          options={(
                            isMighty
                              ? GAME_OPTIONS.filter(opt => opt.value === "Scarlet" || opt.value === "Violet")
                              : isOriginBall
                              ? GAME_OPTIONS.filter(opt => opt.value === "Legends Arceus")
                              : isAlpha
                              ? GAME_OPTIONS.filter(opt => opt.value === "Legends Arceus" || opt.value === "Legends Z-A")
                              : GAME_OPTIONS
                          ).filter(opt => opt.value !== "").map(g => ({
                            label: g.name,
                            value: g.value,
                            image: g.image
                          }))}
                          value={isMighty ? (editData.game === "Violet" ? "Violet" : "Scarlet") : (isOriginBall ? "Legends Arceus" : (editData.game || ""))}
                          onChange={val => {
                            if (isMighty || isOriginBall) return;
                            const shouldClearBall = editData.ball && val && !isBallValidForGame(editData.ball, val);

                            const shouldHaveCharm = !readOnly && Boolean(val) && shinyCharmGames.includes(val) && gameHasShinyCharm(val);

                            if (isAlpha) {
                              setEditData(edit => ({
                                ...edit,
                                game: val,
                                method: "",
                                mark: "alpha",
                                ball: shouldClearBall ? "" : edit.ball,
                                modifiers: {
                                  ...(edit.modifiers || defaultEditData.modifiers),
                                  shinyCharm: shouldHaveCharm,
                                  researchLv10: val === "Legends Arceus" ? (shouldHaveCharm || edit.modifiers?.researchLv10 || false) : (edit.modifiers?.researchLv10 || false)
                                }
                              }));
                              return;
                            }
                            setEditData(edit => ({
                              ...edit,
                              game: val,
                              method: val === "Home" ? "Gift Pokemon" : "",
                              mark: "",
                              ball: shouldClearBall ? "" : edit.ball,
                              modifiers: {
                                ...(edit.modifiers || defaultEditData.modifiers),
                                shinyCharm: shouldHaveCharm,
                                researchLv10: val === "Legends Arceus" ? (shouldHaveCharm || edit.modifiers?.researchLv10 || false) : (edit.modifiers?.researchLv10 || false)
                              }
                            }));
                          }}
                          placeholder={isMighty ? "Select Scarlet or Violet..." : (isOriginBall ? "Legends Arceus" : "Select a game...")}
                          searchable
                          clearable
                          size="md"
                          fullWidth
                          startIcon={
                            (() => {
                              const currentVal = isMighty ? (editData.game === "Violet" ? "Violet" : "Scarlet") : (isOriginBall ? "Legends Arceus" : (editData.game || ""));
                              if (!currentVal) return <Gamepad2 size={16} />;
                              const gameObj = GAME_OPTIONS.find(g => g.value === currentVal || g.name === currentVal);
                              if (gameObj?.image) {
                                return (
                                  <img
                                    src={gameObj.image}
                                    alt=""
                                    className="w-5 h-5 object-contain pointer-events-none"
                                  />
                                );
                              }
                              return <Gamepad2 size={16} />;
                            })()
                          }
                        />
                      </div>

                      <div className="sidebar-form-group">
                        <SelectField
                          id="ball-dropdown"
                          label="Ball caught in:"
                          disabled={isOriginBall}
                          options={getFilteredBallOptions().map(b => ({
                            label: b.name,
                            value: b.value,
                            image: b.image
                          }))}
                          value={isOriginBall ? "Origin Ball" : (editData.ball || "")}
                          onChange={val => {
                            if (isOriginBall) return;
                            if (val && isHisuianBall(val)) {
                              const shouldHaveCharm = !readOnly && shinyCharmGames.includes("Legends Arceus") && gameHasShinyCharm("Legends Arceus");
                              setEditData(edit => ({
                                ...edit,
                                ball: val,
                                game: "Legends Arceus",
                                method: "",
                                mark: "",
                                modifiers: {
                                  ...(edit.modifiers || defaultEditData.modifiers),
                                  shinyCharm: shouldHaveCharm,
                                  researchLv10: shouldHaveCharm || edit.modifiers?.researchLv10 || false
                                }
                              }));
                            } else {
                              setEditData(edit => ({ ...edit, ball: val }));
                            }
                          }}
                          placeholder={isOriginBall ? "Origin Ball" : "Select a ball..."}
                          searchable
                          clearable
                          size="md"
                          fullWidth
                          startIcon={
                            (() => {
                              const currentVal = isOriginBall ? "Origin Ball" : (editData.ball || "");
                              if (!currentVal) return <PokeballIcon size={16} />;
                              const ballOptionsList = getFilteredBallOptions();
                              const ballObj = ballOptionsList.find(b => b.value === currentVal || b.name === currentVal);
                              if (ballObj?.image) {
                                return (
                                  <img
                                    src={ballObj.image}
                                    alt=""
                                    className="w-5 h-5 object-contain pointer-events-none"
                                  />
                                );
                              }
                              return <PokeballIcon size={16} />;
                            })()
                          }
                        />
                      </div>

                      <div className="sidebar-form-group">
                        <SelectField
                          id="method-dropdown"
                          label="Method:"
                          disabled={isMighty || isOriginBall || editData.game === "Home" || !editData.game}
                          options={isMighty ? [{ label: "Tera Raids", value: "Tera Raids" }] : isOriginBall ? [{ label: "None", value: "" }] : [
                            { label: "None", value: "" },
                            ...availableMethods.map(method => ({ label: method.name, value: method.name })),
                          ]}
                          value={isMighty ? "Tera Raids" : (isOriginBall ? "" : (editData.method || ""))}
                          onChange={val => {
                            if (isMighty || isOriginBall) return;
                            setEditData(edit => {
                              const updatedEdit = {
                                ...edit,
                                method: val,
                                evolvedFromMethod: val === "Evolved" ? edit.evolvedFromMethod : undefined
                              };
                              if (!edit.modifiers) edit.modifiers = { ...defaultEditData.modifiers };
                              if (val !== "Breeding") {
                                updatedEdit.modifiers = { ...updatedEdit.modifiers, shinyParents: false };
                              }
                              if (val !== "Catch Combo" && val !== "Random Encounters" && val !== "Soft Resets") {
                                updatedEdit.modifiers = { ...updatedEdit.modifiers, lureActive: false };
                              }
                              if (val !== "Random Encounters" && val !== "Mass Outbreaks" && val !== "Sandwich" && val !== "Hyperspaces") {
                                updatedEdit.modifiers = {
                                  ...updatedEdit.modifiers,
                                  sparklingLv1: false,
                                  sparklingLv2: false,
                                  sparklingLv3: false
                                };
                              }
                              return updatedEdit;
                            });
                          }}
                          placeholder={isMighty ? "Tera Raids" : (editData.game ? "Select a method..." : "Select a game first")}
                          searchable
                          clearable
                          size="md"
                          fullWidth
                          startIcon={<BullseyeIcon size={16} />}
                        />
                      </div>

                      {/* Hunt Details appended in Catch Info during edit mode */}
                      {showShiny && (
                        <div className="sidebar-form-group">
                          <NumberField
                            id="checks-input"
                            name="checks"
                            label="Checks:"
                            value={editData.checks}
                            min={0}
                            max={999999}
                            onChange={handleEditChange}
                            placeholder={editData.game === "Home" ? "Checks not available in this game" : "Number of checks"}
                            disabled={editData.game === "Home"}
                            clearable
                            stepper
                            size="md"
                            fullWidth
                            autoComplete="off"
                          />
                        </div>
                      )}

                      {/* Modifiers checkboxes */}
                      {showShiny && editData.game && availableMethods.length > 0 && (
                        <div className="sidebar-form-group">
                          <label className="sidebar-label">Modifiers:</label>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {gameModifiers["Shiny Charm"] > 0 && !(editData.method === "Fossil Revivals" && (editData.game === "Let's Go Pikachu" || editData.game === "Let's Go Eevee" || editData.game === "Sword" || editData.game === "Shield")) && !(editData.method === "Fossil Revivals" && editData.game === "Legends Z-A") && !(editData.method === "Dynamax Raids" && (editData.game === "Sword" || editData.game === "Shield")) && !(editData.method === "Gift Pokemon" && (editData.game === "Sword" || editData.game === "Shield" || editData.game === "Let's Go Eevee" || editData.game === "Let's Go Pikachu")) && !(editData.method === "Tera Raids" && (editData.game === "Scarlet" || editData.game === "Violet")) && !((editData.method === "Random Encounters" || editData.method === "Poke Radar" || editData.method === "Soft Resets" || editData.method === "Fossil Revivals" || editData.method === "Gift Pokemon" || editData.method === "Underground Diglett Hunt") && (editData.game === "Brilliant Diamond" || editData.game === "Shining Pearl")) && !(editData.method === "Poke Radar" && (editData.game === "X" || editData.game === "Y")) && !(editData.method === "Ultra Wormholes" && (editData.game === "Ultra Sun" || editData.game === "Ultra Moon")) && (
                              <label className="flex items-center gap-2 cursor-pointer bg-[#1e1e1e] border border-[#333] px-2.5 py-1.5 rounded-lg text-xs">
                                <input
                                  type="checkbox"
                                  checked={editData.modifiers?.shinyCharm || false}
                                  onChange={(e) => {
                                    const newShinyCharm = e.target.checked;
                                    setEditData(edit => ({
                                      ...edit,
                                      modifiers: {
                                        ...edit.modifiers,
                                        shinyCharm: newShinyCharm,
                                        researchLv10: newShinyCharm && editData.game === "Legends Arceus" ? true : edit.modifiers?.researchLv10 || false
                                      }
                                    }));
                                  }}
                                />
                                <img src="/modifier_images/shinycharm.png" alt="" className="w-4 h-4 object-contain" />
                                <span>Shiny Charm</span>
                              </label>
                            )}
                            {gameModifiers["Shiny Parents"] > 0 && editData.method === "Breeding" && (
                              <label className="flex items-center gap-2 cursor-pointer bg-[#1e1e1e] border border-[#333] px-2.5 py-1.5 rounded-lg text-xs">
                                <input
                                  type="checkbox"
                                  checked={editData.modifiers?.shinyParents || false}
                                  onChange={(e) => setEditData(edit => ({
                                    ...edit,
                                    modifiers: { ...edit.modifiers, shinyParents: e.target.checked }
                                  }))}
                                />
                                <img src="/modifier_images/shinyparents.png" alt="" className="w-4 h-4 object-contain" />
                                <span>Shiny Parents</span>
                              </label>
                            )}
                            {gameModifiers["Lure Active"] > 0 && (editData.method === "Catch Combo" || editData.method === "Random Encounters") && (
                              <label className="flex items-center gap-2 cursor-pointer bg-[#1e1e1e] border border-[#333] px-2.5 py-1.5 rounded-lg text-xs">
                                <input
                                  type="checkbox"
                                  checked={editData.modifiers?.lureActive || false}
                                  onChange={(e) => setEditData(edit => ({
                                    ...edit,
                                    modifiers: { ...edit.modifiers, lureActive: e.target.checked }
                                  }))}
                                />
                                <img src="/modifier_images/lure.png" alt="" className="w-4 h-4 object-contain" />
                                <span>Lure Active</span>
                              </label>
                            )}
                            {gameModifiers["Research Lv 10"] > 0 && editData.game === "Legends Arceus" && (
                              <label className="flex items-center gap-2 cursor-pointer bg-[#1e1e1e] border border-[#333] px-2.5 py-1.5 rounded-lg text-xs">
                                <input
                                  type="checkbox"
                                  checked={editData.modifiers?.researchLv10 || false}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setEditData(edit => ({
                                      ...edit,
                                      modifiers: {
                                        ...edit.modifiers,
                                        researchLv10: checked,
                                        perfectResearch: !checked ? false : (edit.modifiers?.perfectResearch || false)
                                      }
                                    }));
                                  }}
                                />
                                <img src="/modifier_images/research.png" alt="" className="w-4 h-4 object-contain" />
                                <span>Research Lv 10</span>
                              </label>
                            )}
                            {gameModifiers["Perfect Research"] > 0 && editData.game === "Legends Arceus" && (
                              <label className="flex items-center gap-2 cursor-pointer bg-[#1e1e1e] border border-[#333] px-2.5 py-1.5 rounded-lg text-xs">
                                <input
                                  type="checkbox"
                                  checked={editData.modifiers?.perfectResearch || false}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setEditData(edit => ({
                                      ...edit,
                                      modifiers: {
                                        ...edit.modifiers,
                                        perfectResearch: checked,
                                        researchLv10: checked ? true : (edit.modifiers?.researchLv10 || false)
                                      }
                                    }));
                                  }}
                                />
                                <img src="/modifier_images/perfectresearch.png" alt="" className="w-4 h-4 object-contain" />
                                <span>Perfect Research</span>
                              </label>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {editData.nickname && (
                        <div className="sidebar-display-card">
                          <div className="sidebar-display-info">
                            <div className="sidebar-display-label">Nickname</div>
                            <div className="sidebar-display-value">{editData.nickname}</div>
                          </div>
                          <div className="sidebar-display-icon">
                            <img src="/data/SidebarIcons/Nickname.svg" alt="Nickname" className="w-full h-full object-contain" />
                          </div>
                        </div>
                      )}

                      {editData.date && (
                        <div className="sidebar-display-card">
                          <div className="sidebar-display-info">
                            <div className="sidebar-display-label">Date</div>
                            <div className="sidebar-display-value">{formatDate(editData.date)}</div>
                          </div>
                          <div className="sidebar-display-icon">
                            <img src="/data/SidebarIcons/Date.svg" alt="Date" className="w-full h-full object-contain" />
                          </div>
                        </div>
                      )}

                      {gameObj && editData.game && (
                        <div className="sidebar-display-card">
                          <div className="sidebar-display-info">
                            <div className="sidebar-display-label">Game</div>
                            <div className="sidebar-display-value">{gameObj.name}</div>
                          </div>
                          <div className="sidebar-display-image">
                            <img src={gameObj.image} alt="" className="w-full h-full object-contain" onError={e => (e.target.style.display = "none")} />
                          </div>
                        </div>
                      )}

                      {ballObj && editData.ball && (
                        <div className="sidebar-display-card">
                          <div className="sidebar-display-info">
                            <div className="sidebar-display-label">Ball</div>
                            <div className="sidebar-display-value">{ballObj.name}</div>
                          </div>
                          <div className="sidebar-display-image">
                            <img src={ballObj.image} alt="" className="w-full h-full object-contain" onError={e => (e.target.style.display = "none")} />
                          </div>
                        </div>
                      )}

                      {editData.method && editData.method !== "" && (
                        <div className="sidebar-display-card">
                          <div className="sidebar-display-info">
                            <div className="sidebar-display-label">Method</div>
                            <div className="sidebar-display-value">{editData.method}</div>
                          </div>
                          <div className="flex items-center gap-4">
                            {editData.method === "Permutations" && editData.chartData && (
                              <button
                                type="button"
                                onClick={() => setShowChartModal(true)}
                                className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#2a2a2a] hover:bg-[#383838] border border-[#444] hover:border-[var(--accent)] text-[var(--accent)] transition-all duration-200 cursor-pointer"
                                title="View Permutation Chart"
                              >
                                <ListTodo size={20} />
                              </button>
                            )}
                            <div className="sidebar-display-icon">
                              <img src="/data/SidebarIcons/Method.svg" alt="Method" className="w-full h-full object-contain" />
                            </div>
                          </div>
                        </div>
                      )}

                      {!editData.nickname && !editData.date && !editData.ball && !editData.game && !editData.method && (
                        <div className="text-center py-2 text-xs text-[var(--sidebar-text)] opacity-60">
                          No catch details recorded for this entry.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

            {/* Hunt Details Accordion - only visible in view mode if caught with recorded hunt data */}
            {!editing && caughtInfo && hasHuntData && (
              <div className={`sidebar-accordion ${openAccordion === 'hunt' ? 'open' : ''}`}>
                <button
                  type="button"
                  className="sidebar-accordion-header"
                  onClick={() => setOpenAccordion(prev => prev === 'hunt' ? null : 'hunt')}
                >
                  <span>HUNT DETAILS</span>
                  <ChevronDown size={16} className="sidebar-accordion-chevron" />
                </button>

                <div className="sidebar-accordion-collapse">
                  <div className="sidebar-accordion-inner">
                    <div className="sidebar-accordion-body">
                      <div className="space-y-2.5">
                        {/* Odds display */}
                        {showShiny && editData.game && editData.method && (() => {
                          if (editData.game === "Home" && editData.method === "Gift Pokemon") return null;
                          try {
                            const checkCount = editData.checks ? Number(editData.checks) : 0;
                            const modifiers = editData.modifiers || {};
                            const getOddsDisplay = () => {
                              const methodForOdds = (editData.method === "Evolved" && editData.evolvedFromMethod)
                                ? editData.evolvedFromMethod
                                : editData.method;

                              if (methodForOdds === "Ultra Wormholes" && (editData.game === "Ultra Sun" || editData.game === "Ultra Moon")) {
                                return "1% → 36%";
                              }
                              let effectiveModifiers = { ...modifiers };
                              if (methodForOdds === "Sandwich" && (editData.game === "Scarlet" || editData.game === "Violet")) {
                                if (!effectiveModifiers.sparklingLv1 && !effectiveModifiers.sparklingLv2 && !effectiveModifiers.sparklingLv3) {
                                  effectiveModifiers.sparklingLv3 = true;
                                }
                              }
                              let effectiveCheckCount = checkCount;
                              if (methodForOdds === "Mass Outbreaks" && checkCount === 0) {
                                effectiveCheckCount = 60;
                              }
                              const calculatedOdds = getCurrentHuntOdds(editData.game, methodForOdds, effectiveModifiers, effectiveCheckCount);
                              return `1/${calculatedOdds.toLocaleString()}`;
                            };
                            return (
                              <div className="sidebar-display-card">
                                <div className="sidebar-display-info">
                                  <div className="sidebar-display-label">Odds</div>
                                  <div className="sidebar-display-value">{getOddsDisplay()}</div>
                                </div>
                                <div className="sidebar-display-icon">
                                  <img src="/data/SidebarIcons/Odds.svg" alt="Odds" className="w-full h-full object-contain" />
                                </div>
                              </div>
                            );
                          } catch (e) {
                            return null;
                          }
                        })()}

                        {/* Checks */}
                        {showShiny && editData.checks !== undefined && editData.checks !== null && String(editData.checks).trim() !== "" && (
                          <div className="sidebar-display-card">
                            <div className="sidebar-display-info">
                              <div className="sidebar-display-label">Checks</div>
                              <div className="sidebar-display-value">{Number(editData.checks).toLocaleString()}</div>
                            </div>
                            <div className="sidebar-display-icon">
                              <img src="/data/SidebarIcons/Checks.svg" alt="Checks" className="w-full h-full object-contain" />
                            </div>
                          </div>
                        )}

                        {/* Time */}
                        {editData.time !== undefined && editData.time !== null && editData.time !== "" && editData.time !== 0 && (
                          <div className="sidebar-display-card">
                            <div className="sidebar-display-info">
                              <div className="sidebar-display-label">Time</div>
                              <div className="sidebar-display-value">{formatTimeFull(typeof editData.time === 'string' ? parseInt(editData.time) || 0 : (typeof editData.time === 'number' ? editData.time : 0))}</div>
                            </div>
                            <div className="sidebar-display-icon">
                              <img src="/data/SidebarIcons/Time.svg" alt="Time" className="w-full h-full object-contain" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fails Accordion - only visible if fails exist for this pokemon and not editing */}
            {!editing && trackedFails.length > 0 && (
              <div className={`sidebar-accordion ${openAccordion === 'fails' ? 'open' : ''}`}>
                <button
                  type="button"
                  className="sidebar-accordion-header"
                  onClick={() => setOpenAccordion(prev => prev === 'fails' ? null : 'fails')}
                >
                  <span>FAILS {trackedFails.length > 1 ? `(${trackedFails.length})` : ''}</span>
                  <ChevronDown size={16} className="sidebar-accordion-chevron" />
                </button>

                <div className="sidebar-accordion-collapse">
                  <div className="sidebar-accordion-inner">
                    <div className="sidebar-accordion-body">
                      <div className="space-y-3">
                        {trackedFails.map((fail, idx) => {
                          const failGameObj = GAME_OPTIONS.find(g => g.value === fail.game || g.name === fail.game);
                          const oddsStr = getFailOddsDisplay(fail);
                          const checksCount = fail.phaseChecks !== undefined ? fail.phaseChecks : (fail.checks !== undefined ? fail.checks : (fail.totalChecks || 0));
                          const failTimeMs = typeof fail.elapsedMs === 'number' ? fail.elapsedMs : (typeof fail.time === 'number' ? fail.time : (parseInt(fail.time) || 0));
                          const formattedDate = formatFailDate(fail.date || fail.timestamp);
                          const isTargetFail = fail.isTarget === true;
                          const isPhaseFail = fail.isTarget === false;
                          const failLabel = isTargetFail
                            ? (fail.phaseNumber ? `Target Failed (Phase ${fail.phaseNumber})` : "Target Failed")
                            : (isPhaseFail ? (fail.phaseNumber ? `Phase ${fail.phaseNumber} Failed` : "Phase Failed") : `Fail ${idx + 1}`);

                          return (
                            <div
                              key={fail.id || fail.entryId || fail.timestamp || idx}
                              className={trackedFails.length > 1 ? "p-3 rounded-xl bg-[#181818] border border-[#2e2e2e] space-y-2" : "space-y-2"}
                            >
                              <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                                  {failLabel}
                                </span>
                                <div className="flex items-center gap-2">
                                  {formattedDate && (
                                    <span className="text-[11px] text-gray-400 font-medium">
                                      {formattedDate}
                                    </span>
                                  )}
                                  {!readOnly && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteFailModal({ show: true, fail });
                                      }}
                                      className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                      title="Delete fail record"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-1.5 pt-0.5">
                                {/* Game */}
                                {fail.game && (
                                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[var(--sidebar-edit-inputs)] border border-[var(--border-color)] text-xs">
                                    <span className="font-bold text-[var(--sidebar-text)] opacity-70 uppercase tracking-wider">GAME</span>
                                    <span className="font-medium text-[var(--sidebar-text)] flex items-center gap-1.5">
                                      {failGameObj?.image && (
                                        <img src={failGameObj.image} alt="" className="w-4 h-4 object-contain" onError={e => (e.target.style.display = "none")} />
                                      )}
                                      <span>{failGameObj?.name || fail.game}</span>
                                    </span>
                                  </div>
                                )}

                                {/* Method */}
                                {fail.method && (
                                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[var(--sidebar-edit-inputs)] border border-[var(--border-color)] text-xs">
                                    <span className="font-bold text-[var(--sidebar-text)] opacity-70 uppercase tracking-wider">METHOD</span>
                                    <span className="font-medium text-[var(--sidebar-text)] truncate max-w-[65%] text-right">{fail.method}</span>
                                  </div>
                                )}

                                {/* Odds */}
                                {oddsStr && (
                                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[var(--sidebar-edit-inputs)] border border-[var(--border-color)] text-xs">
                                    <span className="font-bold text-[var(--sidebar-text)] opacity-70 uppercase tracking-wider">ODDS</span>
                                    <span className="font-medium text-[var(--sidebar-text)]">{oddsStr}</span>
                                  </div>
                                )}

                                {/* Checks */}
                                {(checksCount !== undefined && checksCount !== null && String(checksCount).trim() !== "") && (
                                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[var(--sidebar-edit-inputs)] border border-[var(--border-color)] text-xs">
                                    <span className="font-bold text-[var(--sidebar-text)] opacity-70 uppercase tracking-wider">CHECKS</span>
                                    <span className="font-medium text-[var(--sidebar-text)]">{Number(checksCount).toLocaleString()}</span>
                                  </div>
                                )}

                                {/* Time */}
                                {failTimeMs > 0 && (
                                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[var(--sidebar-edit-inputs)] border border-[var(--border-color)] text-xs">
                                    <span className="font-bold text-[var(--sidebar-text)] opacity-70 uppercase tracking-wider">TIME</span>
                                    <span className="font-medium text-[var(--sidebar-text)]">{formatTimeFull(failTimeMs)}</span>
                                  </div>
                                )}

                                {/* Date */}
                                {formattedDate && (
                                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[var(--sidebar-edit-inputs)] border border-[var(--border-color)] text-xs">
                                    <span className="font-bold text-[var(--sidebar-text)] opacity-70 uppercase tracking-wider">DATE</span>
                                    <span className="font-medium text-[var(--sidebar-text)]">{formattedDate}</span>
                                  </div>
                                )}

                                {/* Notes */}
                                {fail.notes && (
                                  <div className="flex flex-col gap-1 py-1.5 px-2.5 rounded-lg bg-[var(--sidebar-edit-inputs)] border border-[var(--border-color)] text-xs">
                                    <span className="font-bold text-[var(--sidebar-text)] opacity-70 uppercase tracking-wider">NOTES</span>
                                    <span className="font-normal text-[var(--sidebar-text)] opacity-90 break-words">{fail.notes}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Info Accordion */}
            <div className={`sidebar-accordion ${openAccordion === 'additional' ? 'open' : ''}`}>
              <button
                type="button"
                data-tutorial-id="info-accordion-header"
                className="sidebar-accordion-header"
                onClick={() => setOpenAccordion(prev => prev === 'additional' ? null : 'additional')}
              >
                <span>ADDITIONAL INFO</span>
                <ChevronDown size={16} className="sidebar-accordion-chevron" />
              </button>

              <div className="sidebar-accordion-collapse">
                <div className="sidebar-accordion-inner">
                  <div className="sidebar-accordion-body" data-tutorial-id="sidebar-info-content">
                  {/* Recommended Balls Section */}
                  {pokemon?.recommended_balls && (
                    <div className="sidebar-info-section" style={{ marginBottom: '8px' }}>
                      <div className="sidebar-info-section-header">
                        <Sparkles size={18} className="text-[var(--accent)]" />
                        <span className="sidebar-info-section-title">RECOMMENDED BALLS</span>
                      </div>
                      <div className="sidebar-info-section-divider"></div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '4px' }}>
                        {((showShiny && pokemon.recommended_balls.shiny?.length > 0 ? pokemon.recommended_balls.shiny : pokemon.recommended_balls.default) || []).map((ballName, idx) => {
                          const ballObj = BALL_OPTIONS.find(b => b.value === ballName);
                          if (!ballObj) return null;
                          return <RecommendedBallComponent key={idx} ballObj={ballObj} />;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Obtainable In Section */}
                  {pokemon && (
                    <div className="sidebar-info-section" style={{ marginBottom: '8px' }}>
                      <div className="sidebar-info-section-header">
                        <Gamepad2 size={18} className="text-[var(--accent)]" />
                        <span className="sidebar-info-section-title">OBTAINABLE IN</span>
                      </div>
                      <div className="sidebar-info-section-divider"></div>
                      <div className="available-games-grid">
                        {getGroupedGames(getAvailableGames(pokemon)).map((gameGroup, index) => (
                          <GameTag
                            key={`${gameGroup.displayName}-${index}`}
                            gameGroup={gameGroup}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evolution Chain */}
                  {pokemon && <EvolutionChain pokemon={pokemon} showShiny={showShiny} onPokemonSelect={onPokemonSelect} dexPreferences={{ ...dexPreferences, useHomeSprites: viewerUseHomeSprites }} />}

                  {/* Related Forms Section */}
                  {renderRelatedFormsSection()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* --- MARKS TAB --- */}
        {activeTab === 'marks' && showMarksTab && (
          <div className="sidebar-marks-tab-wrap">
            {editing && !readOnly ? (
              <>
                {/* Current Active Marks Container */}
                <div className="sidebar-current-marks-container">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-[var(--sidebar-text)] opacity-70 uppercase tracking-wide font-semibold">
                      {selectedMarks.length > 0 ? `Assigned Marks (${selectedMarks.length})` : "Active Mark"}
                    </div>
                    {selectedMarks.length > 0 && !isMighty && (
                      <button
                        type="button"
                        onClick={handleClearAllMarks}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {selectedMarks.length > 0 ? (
                    <div className="sidebar-marks-chip-list">
                      {selectedMarks.map((markVal) => {
                        const mObj = MARK_OPTIONS.find(m => m.value === markVal);
                        return (
                          <div key={markVal} className="sidebar-active-mark-chip">
                            {mObj?.image && (
                              <img src={mObj.image} alt={mObj.name} className="w-5 h-5 object-contain" />
                            )}
                            <span className="text-xs font-bold text-white">
                              {mObj ? mObj.name.replace(" Mark", "") : markVal}
                            </span>
                            {!isMighty && (
                              <button
                                type="button"
                                onClick={() => handleSelectMark(markVal)}
                                className="sidebar-mark-chip-remove"
                                title="Remove mark"
                              >
                                <X size={11} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-2 text-center text-sm font-medium text-gray-400">
                      No Marks Assigned
                    </div>
                  )}
                </div>

                {/* Search Filter for Marks */}
                {!isMighty && (
                  <div className="mb-2">
                    <SearchField
                      placeholder="Search marks..."
                      value={markSearchQuery}
                      onChange={e => setMarkSearchQuery(e.target.value)}
                      onClear={() => setMarkSearchQuery('')}
                      size="sm"
                      fullWidth
                    />
                  </div>
                )}

                {/* Marks Selection Grid */}
                <div className="sidebar-marks-grid custom-scrollbar">
                  {filteredMarks.map((m) => {
                    const isSelected = selectedMarks.includes(m.value);
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => handleSelectMark(m.value)}
                        className={`sidebar-mark-item-btn ${isSelected ? 'selected' : ''}`}
                        title={m.name}
                      >
                        {isSelected && (
                          <div className="sidebar-mark-check-badge">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}
                        <img src={m.image} alt={m.name} className="w-9 h-9 object-contain" />
                        <span className="text-[10px] font-semibold text-center text-gray-200 line-clamp-2 leading-tight">
                          {m.name.replace(" Mark", "")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              /* View Mode: Only show active marks in clean square tiles */
              <div className="sidebar-saved-marks-grid">
                {selectedMarks.map((markVal) => {
                  const mObj = MARK_OPTIONS.find(m => m.value === markVal);
                  return (
                    <div key={markVal} className="sidebar-saved-mark-card" title={mObj ? mObj.name : markVal}>
                      <div className="sidebar-saved-mark-img-wrap">
                        {mObj?.image ? (
                          <img src={mObj.image} alt={mObj.name} className="w-10 h-10 object-contain" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10" />
                        )}
                      </div>
                      <span className="sidebar-saved-mark-name">
                        {mObj ? mObj.name.replace(" Mark", "") : markVal}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {readOnly && (
              <div className="text-center py-4 text-sm text-[var(--sidebar-text)] opacity-70">
                {viewingUsername ? `${viewingUsername}'s mark collection for this Pokémon` : "Viewing mode"}
              </div>
            )}
          </div>
        )}

        {/* --- NOTES TAB --- */}
        {activeTab === 'notes' && showNotesTab && (
          <div className="sidebar-notes-tab-wrap">
            {editing && !readOnly ? (
              <div className="space-y-3">
                <div className="sidebar-form-group">
                  <TextAreaField
                    id="notes-textarea"
                    name="notes"
                    label="Notes / Extras:"
                    value={editData.notes || ""}
                    onChange={handleEditChange}
                    placeholder="Add notes about this Pokemon..."
                    maxLength={1000}
                    showCount
                    rows={4}
                    size="md"
                    fullWidth
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {editData.notes ? (
                  <div className="sidebar-notes-card">
                    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 mb-1">
                      <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">Pokémon Notes</span>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => setEditing(true)}
                          className="text-xs text-[var(--accent)] hover:underline font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    <div className="sidebar-notes-text">{editData.notes}</div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center gap-3">
                    <p className="text-sm text-[var(--sidebar-text)] opacity-70">No notes written for this Pokémon yet.</p>
                    {!readOnly && caughtInfo && (
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="px-4 py-2 bg-[var(--accent)] text-black font-bold rounded-lg text-xs hover:bg-[var(--accent-hover)] hover:text-white transition-all"
                      >
                        Add Notes
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pinned Bottom Footer Action Bar - visible on all tabs */}
      {!readOnly && caughtInfo && (
        <div className="sidebar-footer-actions">
          {editing ? (
            <div className="sidebar-footer-button-col">
              <Button
                variant="primary"
                size="md"
                block
                data-tutorial-id="save-entry-btn"
                onClick={handleSaveEdit}
              >
                Save
              </Button>
              <Button
                variant="secondary"
                size="md"
                block
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="sidebar-footer-button-col">
              {/* Row 1: Edit Information (Full Width) */}
              <Button
                variant="primary"
                size="md"
                block
                data-tutorial-id="edit-info-btn"
                onClick={() => {
                  setEditing(true);
                  setActiveTab('data');
                  setOpenAccordion('catch');
                }}
              >
                Edit Information
              </Button>

              {/* Row 2: Evolve + More (...) */}
              <div className="sidebar-footer-button-row">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={hasEvolution() ? handleEvolve : undefined}
                  disabled={!hasEvolution()}
                  icon={<ChevronsUp size={18} />}
                  title={hasEvolution() ? "Evolve Pokémon" : "No further evolutions available"}
                >
                  Evolve
                </Button>

                <div className="sidebar-more-menu-container" ref={moreMenuRef}>
                  <Button
                    variant="icon"
                    size="md"
                    className={`sidebar-btn-more ${showMoreMenu ? 'is-active' : ''}`}
                    onClick={() => setShowMoreMenu(prev => !prev)}
                    title="More actions"
                    aria-label="More actions"
                  >
                    <MoreHorizontal size={20} />
                  </Button>

                  {showMoreMenu && (
                    <div className="sidebar-more-menu-dropdown">
                      <button
                        type="button"
                        className="sidebar-more-menu-item"
                        onClick={() => {
                          setShowMoreMenu(false);
                          handleDuplicateEntry();
                        }}
                      >
                        <Copy size={16} />
                        <span>Duplicate Entry</span>
                      </button>

                      <button
                        type="button"
                        className="sidebar-more-menu-item"
                        onClick={() => {
                          setShowMoreMenu(false);
                          handleCopySummary();
                        }}
                      >
                        <FileText size={16} />
                        <span>Copy Summary</span>
                      </button>

                      <div className="sidebar-more-menu-divider" />

                      <button
                        type="button"
                        className="sidebar-more-menu-item danger"
                        onClick={() => {
                          setShowMoreMenu(false);
                          handleReset();
                        }}
                      >
                        <RotateCcw size={16} />
                        <span>Reset Data</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Reset Pokémon Modal */}
      <ConfirmModal
        isOpen={resetModal.show}
        onClose={() => setResetModal({ show: false, pokemonName: '' })}
        onConfirm={handleResetConfirm}
        title="Reset Pokémon"
        message={`Are you sure you want to reset "${resetModal.pokemonName}"? This will delete all saved data.`}
        confirmText="Reset Pokémon"
        variant="danger"
      />

      {/* Delete Entry Modal */}
      <ConfirmModal
        isOpen={deleteEntryModal.show}
        onClose={() => setDeleteEntryModal({ show: false, entryIndex: null, entryNumber: null })}
        onConfirm={handleDeleteEntryConfirm}
        title="Delete Entry"
        message={`Are you sure you want to delete entry #${deleteEntryModal.entryNumber}? This will remove all data for this entry including date, ball, mark, method, game, checks, and notes.`}
        confirmText="Delete Entry"
        variant="danger"
      />

      {/* Delete Fail Modal */}
      <ConfirmModal
        isOpen={deleteFailModal.show}
        onClose={() => setDeleteFailModal({ show: false, fail: null })}
        onConfirm={handleConfirmDeleteFail}
        title="Delete Fail Record"
        message="Are you sure you want to delete this shiny fail record? This action cannot be undone."
        confirmText="Delete Fail"
        variant="danger"
      />

      {/* Evolve Modal */}
      <Modal
        isOpen={evolveModal.show}
        onClose={() => setEvolveModal({ show: false, options: [] })}
        title="Multiple Evolutions Available"
        subtitle="Choose which Pokémon to evolve into"
        icon={<ArrowUpCircle size={22} />}
        size="sm"
        footer={
          <Button
            variant="secondary"
            block
            onClick={() => setEvolveModal({ show: false, options: [] })}
          >
            Cancel
          </Button>
        }
      >
        <div className="flex flex-wrap justify-center gap-3 py-2">
          {evolveModal.options.map((opt, i) => (
            <button
              key={`${opt.id}-${i}`}
              type="button"
              onClick={() => {
                setEvolveModal({ show: false, options: [] });
                executeEvolve(opt);
              }}
              className="w-[105px] flex flex-col items-center justify-start bg-[#2a2a2a] border border-[#444] rounded-[15px] p-2.5 hover:border-[var(--accent)] hover:bg-[#333] transition-all cursor-pointer"
            >
              <img 
                src={getSpriteUrl(opt, showShiny, viewerUseHomeSprites)} 
                alt={opt.name} 
                className="w-12 h-12 object-contain filter drop-shadow-md mb-1.5"
                style={{ imageRendering: viewerUseHomeSprites ? 'auto' : 'pixelated' }}
                loading="lazy"
              />
              <span className="text-xs font-bold text-center text-white break-words w-full" style={{ lineHeight: '1.2' }}>
                {formatPokemonName(opt.name)}
              </span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Chart Modal */}
      {showChartModal && createPortal(
        <div
          className={`fixed inset-0 z-[20000] ${chartModalClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => {
            setChartModalClosing(true);
            setTimeout(() => {
              setShowChartModal(false);
              setChartModalClosing(false);
            }, 300);
          }}
        >
          <div className="bg-black/80 w-full h-full flex items-center justify-center p-4">
            <div
              className={`relative bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl ${chartModalClosing ? 'animate-[slideOut_0.3s_ease-in_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 shrink-0 border-b border-[#444] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-[var(--sidebar-pokemon-bg)] border border-[var(--accent)]">
                    <img 
                      src={pokeImg} 
                      alt={pokeName} 
                      className="w-full h-full object-contain image-render-pixelated" 
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--accent)]">Permutation Chart</h3>
                    <p className="text-sm text-[var(--progressbar-info)]">
                      {pokemon.formType === 'alpha' || pokemon.formType === 'alphaother' || (pokemon.name && pokemon.name.includes('-alpha')) ? `Alpha ${pokeName}` : pokeName} - Completed Hunt
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setChartModalClosing(true);
                    setTimeout(() => {
                      setShowChartModal(false);
                      setChartModalClosing(false);
                    }, 300);
                  }}
                  className="absolute top-4 right-4 p-1 rounded-full transition-all duration-200 z-10"
                  style={{ background: 'none', border: 'none' }}
                  title="Close Chart"
                >
                  <span className="flex items-center justify-center">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 40 40"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                      className="sidebar-close-icon"
                    >
                      <circle cx="20" cy="20" r="18" fill="#fff" stroke="#232323" strokeWidth="2" />
                      <path d="M2 20a18 18 0 0 1 36 0" fill="#e62829" stroke="#232323" strokeWidth="2" />
                      <rect x="2" y="19" width="36" height="2" fill="#232323" />
                      <circle cx="20" cy="20" r="7" fill="#ffffffff" stroke="#232323" strokeWidth="2" />
                      <circle cx="20" cy="20" r="3.5" fill="#fff" stroke="#232323" strokeWidth="1.5" />
                    </svg>
                  </span>
                </button>
              </div>

              <div 
                className="flex-1 overflow-y-auto pr-1 custom-scrollbar text-gray-300"
                style={{ overscrollBehavior: 'contain' }}
              >
                <PermutationTable
                  readOnly={true}
                  chartData={editData.chartData || {}}
                  chartConfig={editData.chartConfig || {}}
                  legendColors={editData.chartConfig?.legendColors || {}}
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
