import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { formatPokemonName } from "../utils";
import { getSpriteUrl } from "../utils/spriteUtils";
import { huntAPI, profileAPI } from "../utils/api";
import pokemonData from "../data/pokemon.json";
import formsData from "../utils/loadFormsData";
import DetailedHuntCard from "../components/Counters/DetailedHuntCard";
import {
  normalizeHunt,
  updateHuntWithAction,
  createHuntChannel,
  getCachedHuntsData,
  setCachedHuntsData
} from "../utils/huntSync";
import "../css/App.css";
import "../css/Counters.css";

export default function HuntPopout() {
  const { huntId: paramId } = useParams();
  const [hunt, setHunt] = useState(null);
  const [error, setError] = useState(null);
  const [hotkey, setHotkey] = useState(() => {
    try { return localStorage.getItem("huntHotkey") || " "; } catch { return " "; }
  });
  const [decrementHotkey, setDecrementHotkey] = useState(() => {
    try { return localStorage.getItem("huntDecrementHotkey") || "-"; } catch { return "-"; }
  });
  const [, setTick] = useState(0);

  const [metricMode, setMetricMode] = useState(() => {
    try {
      return localStorage.getItem("dex_hunt_metric_mode") || "phase";
    } catch {
      return "phase";
    }
  });

  const [useHomeSprites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dexPreferences"))?.useHomeSprites || false;
    } catch {
      return false;
    }
  });

  const resolvedHuntId = useMemo(() => {
    if (paramId) return paramId;
    const query = new URLSearchParams(window.location.search).get("huntId");
    if (query) return query;
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts.length > 1 ? parts[parts.length - 1] : null;
  }, [paramId]);

  const huntRef = useRef(hunt);
  huntRef.current = hunt;

  const channelRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Debounced server save — NEVER resurrects deleted hunts
  const debouncedServerSave = useCallback((updatedHunt) => {
    if (!updatedHunt) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const cached = getCachedHuntsData() || {};
        const existingList = cached.activeHunts || [];
        const exists = existingList.some((h) => String(h.id) === String(updatedHunt.id));
        if (!exists) {
          // Hunt was removed or deleted, do NOT save/recreate it on server
          return;
        }

        const nextList = existingList.map((h) => (String(h.id) === String(updatedHunt.id) ? updatedHunt : h));
        setCachedHuntsData({ ...cached, activeHunts: nextList });
        await huntAPI.updateHuntData({ activeHunts: nextList });
      } catch (err) {
        console.error("Failed to save popout hunt data:", err);
      }
    }, 450);
  }, []);

  const toggleMetricMode = useCallback(() => {
    setMetricMode((prev) => {
      const next = prev === "total" ? "phase" : "total";
      try {
        localStorage.setItem("dex_hunt_metric_mode", next);
      } catch {}

      if (resolvedHuntId) {
        try {
          const mapRaw = localStorage.getItem("dex_hunt_metric_mode_map");
          const modeMap = mapRaw ? JSON.parse(mapRaw) : {};
          modeMap[resolvedHuntId] = next;
          modeMap[String(resolvedHuntId)] = next;
          localStorage.setItem("dex_hunt_metric_mode_map", JSON.stringify(modeMap));
        } catch {}
      }

      if (huntRef.current) {
        const updated = {
          ...huntRef.current,
          metricMode: next,
          version: (huntRef.current.version || 1) + 1,
          updatedAt: Date.now()
        };
        setHunt(updated);
        debouncedServerSave(updated);

        if (channelRef.current) {
          channelRef.current.broadcast({
            type: "HUNT_ACTION",
            huntId: resolvedHuntId,
            action: {
              type: "TOGGLE_METRIC_MODE",
              metricMode: next,
              timestamp: Date.now()
            }
          });
          channelRef.current.broadcast({
            type: "HUNT_UPDATED",
            hunt: updated
          });
        }
      }

      return next;
    });
  }, [resolvedHuntId, debouncedServerSave]);

  // Load initial hunt & user preferences
  const loadData = useCallback(async () => {
    const id = resolvedHuntId;
    if (!id) {
      setError("No hunt ID provided in popout.");
      return;
    }

    // Check local cached data first for instant start
    const cached = getCachedHuntsData();
    if (cached?.activeHunts) {
      const target = cached.activeHunts.find(
        (h) => String(h.id) === String(id) || Number(h.id) === Number(id)
      );
      if (target) {
        const normalized = normalizeHunt(target);
        setHunt(normalized);
        setError(null);
        document.title = `${formatPokemonName(normalized.pokemon?.name || "Pokemon")} — Hunt Popout`;
      }
    }

    // Query backend for canonical state
    try {
      const data = await huntAPI.getHuntData();
      if (data?.activeHunts) {
        const target = data.activeHunts.find(
          (h) => String(h.id) === String(id) || Number(h.id) === Number(id)
        );

        if (!target) {
          setHunt(null);
          setError("This hunt was deleted in the main window.");
          return;
        }

        const normalized = normalizeHunt(
          target,
          Date.now(),
          data.totalCheckTimes || {},
          data.lastCheckTimes || {},
          new Set(data.pausedHunts || [])
        );

        if (!huntRef.current || (normalized.version || 0) >= (huntRef.current.version || 0)) {
          setHunt(normalized);
          setError(null);
          document.title = `${formatPokemonName(normalized.pokemon?.name || "Pokemon")} — Hunt Popout`;
        }
      }
    } catch (err) {
      console.error("Failed to load popout hunt from API:", err);
      if (!huntRef.current) {
        setError("Failed to load hunt data.");
      }
    }
  }, [resolvedHuntId]);

  // Window setup, BroadcastChannel, and size clamping
  useEffect(() => {
    document.body.style.backgroundColor = "#09090b";
    document.documentElement.classList.add("popout-mode");
    document.body.classList.add("popout-mode");

    const MIN_W = 520;
    const MIN_H = 500;

    let resizeTimer = null;
    const enforceMinBounds = () => {
      try {
        const curW = window.outerWidth || window.innerWidth;
        const curH = window.outerHeight || window.innerHeight;
        if (curW < MIN_W || curH < MIN_H) {
          window.resizeTo(Math.max(curW, MIN_W), Math.max(curH, MIN_H));
        }
      } catch {}
    };

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(enforceMinBounds, 30);
    };

    enforceMinBounds();
    window.addEventListener("resize", handleResize);

    profileAPI
      .getProfile()
      .then((data) => {
        if (data?.dexPreferences?.hotkey) {
          setHotkey(data.dexPreferences.hotkey);
        }
      })
      .catch(() => {});

    loadData();

    // BroadcastChannel sync
    const channel = createHuntChannel((msg) => {
      if (!msg) return;

      const targetId = String(resolvedHuntId);

      // State Response from main window
      if (msg.type === "RESPONSE_HUNT_STATE" && Array.isArray(msg.hunts)) {
        const match = msg.hunts.find(
          (h) => String(h.id) === targetId || String(h.huntId) === targetId
        );
        if (match) {
          const normalized = normalizeHunt(match);
          if (!huntRef.current || (normalized.version || 0) >= (huntRef.current.version || 0)) {
            setHunt(normalized);
            setError(null);
          }
        } else {
          // Hunt was deleted or no longer active
          setHunt(null);
          setError("This hunt was deleted in the main window.");
        }
        return;
      }

      // Actions from main window (including DELETE)
      if (msg.type === "HUNT_ACTION" && String(msg.huntId) === targetId) {
        if (msg.action?.type === "DELETE") {
          setHunt(null);
          setError("This hunt was deleted in the main window.");
          return;
        }
        if (msg.action?.type === "TOGGLE_METRIC_MODE" && msg.action.metricMode) {
          setMetricMode(msg.action.metricMode);
        }
        setHunt((prev) => {
          if (!prev) return prev;
          return updateHuntWithAction(prev, msg.action, msg.action.timestamp || Date.now());
        });
        return;
      }

      if (msg.type === "HUNT_UPDATED" && msg.hunt && String(msg.hunt.id) === targetId) {
        setHunt((prev) => {
          if (!prev || (msg.hunt.version || 0) >= (prev.version || 0)) {
            return normalizeHunt(msg.hunt);
          }
          return prev;
        });
      }
    });

    channelRef.current = channel;

    // Send state request to main window immediately
    channel.broadcast({
      type: "REQUEST_HUNT_STATE",
      huntId: resolvedHuntId
    });

    return () => {
      channel.close();
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      document.documentElement.classList.remove("popout-mode");
      document.body.classList.remove("popout-mode");
    };
  }, [loadData, resolvedHuntId]);

  // Lightweight UI render tick (zero mutations, derived from Date.now())
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // Canonical Actions
  const huntIncrement = hunt?.increment || 1;

  const handleAddCheck = useCallback(
    (customDelta = null) => {
      if (!huntRef.current) return;
      const cached = getCachedHuntsData();
      if (cached?.activeHunts && !cached.activeHunts.some(h => String(h.id) === String(huntRef.current.id))) {
        setHunt(null);
        setError("This hunt was deleted in the main window.");
        return;
      }

      const currentHunt = huntRef.current;
      const delta = customDelta !== null ? customDelta : currentHunt.increment || 1;
      const now = Date.now();

      const action = {
        type: "INCREMENT",
        huntId: currentHunt.id,
        amount: delta,
        timestamp: now
      };

      const nextHunt = updateHuntWithAction(currentHunt, action, now);
      setHunt(nextHunt);

      if (channelRef.current) {
        channelRef.current.broadcast({
          type: "HUNT_ACTION",
          huntId: currentHunt.id,
          action
        });
        channelRef.current.broadcast({
          type: "HUNT_UPDATED",
          hunt: nextHunt
        });
      }

      debouncedServerSave(nextHunt);
    },
    [debouncedServerSave]
  );

  const handleDecreaseCheck = useCallback(() => {
    if (!huntRef.current) return;
    const cached = getCachedHuntsData();
    if (cached?.activeHunts && !cached.activeHunts.some(h => String(h.id) === String(huntRef.current.id))) {
      setHunt(null);
      setError("This hunt was deleted in the main window.");
      return;
    }

    const currentHunt = huntRef.current;
    const delta = currentHunt.increment || 1;
    const now = Date.now();

    const action = {
      type: "DECREMENT",
      huntId: currentHunt.id,
      amount: delta,
      timestamp: now
    };

    const nextHunt = updateHuntWithAction(currentHunt, action, now);
    setHunt(nextHunt);

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_ACTION",
        huntId: currentHunt.id,
        action
      });
      channelRef.current.broadcast({
        type: "HUNT_UPDATED",
        hunt: nextHunt
      });
    }

    debouncedServerSave(nextHunt);
  }, [debouncedServerSave]);

  const handleTogglePause = useCallback(() => {
    if (!huntRef.current) return;
    const cached = getCachedHuntsData();
    if (cached?.activeHunts && !cached.activeHunts.some(h => String(h.id) === String(huntRef.current.id))) {
      setHunt(null);
      setError("This hunt was deleted in the main window.");
      return;
    }

    const currentHunt = huntRef.current;
    const now = Date.now();

    const action = {
      type: "TOGGLE_PAUSE",
      huntId: currentHunt.id,
      timestamp: now
    };

    const nextHunt = updateHuntWithAction(currentHunt, action, now);
    setHunt(nextHunt);

    if (channelRef.current) {
      channelRef.current.broadcast({
        type: "HUNT_ACTION",
        huntId: currentHunt.id,
        action
      });
      channelRef.current.broadcast({
        type: "HUNT_UPDATED",
        hunt: nextHunt
      });
    }

    debouncedServerSave(nextHunt);
  }, [debouncedServerSave]);

  // Helper for key matching
  const isKeyMatch = useCallback((e, targetKey) => {
    if (!targetKey) return false;
    if (targetKey === " " && (e.code === "Space" || e.key === " " || e.key === "Spacebar")) return true;
    if (targetKey === "+" && (e.key === "+" || e.key === "Add" || e.code === "NumpadAdd" || (e.key === "=" && e.shiftKey))) return true;
    if (targetKey === "-" && (e.key === "-" || e.key === "Subtract" || e.code === "NumpadSubtract" || e.code === "Minus")) return true;
    if (e.key.toLowerCase() === targetKey.toLowerCase()) return true;
    if (e.code.toLowerCase() === targetKey.toLowerCase()) return true;
    return false;
  }, []);

  // Hotkey listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.isContentEditable
      ) {
        return;
      }

      if (isKeyMatch(e, hotkey)) {
        e.preventDefault();
        handleAddCheck();
        return;
      }

      if (isKeyMatch(e, decrementHotkey)) {
        e.preventDefault();
        handleDecreaseCheck();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hotkey, decrementHotkey, handleAddCheck, handleDecreaseCheck, isKeyMatch]);

  // Sprites
  const allPokemon = useMemo(() => [...pokemonData, ...formsData], []);
  const getPokemonImage = useCallback(
    (pokemon) => {
      if (!pokemon) return "/fallback.png";
      const fresh = allPokemon.find(
        (p) =>
          (pokemon.stableId && p.stableId === pokemon.stableId) ||
          (pokemon.name &&
            p.name === pokemon.name &&
            (p.formType || "main") === (pokemon.formType || "main")) ||
          (p.id === pokemon.id && (!p.formType || p.formType === "main"))
      );
      const target = fresh || pokemon;
      return getSpriteUrl(target, true, useHomeSprites);
    },
    [allPokemon, useHomeSprites]
  );

  if (error || !hunt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#09090b] text-white">
        <p className="text-red-400 font-bold mb-4">{error || "Loading hunt…"}</p>
        {error ? (
          <button
            type="button"
            onClick={() => window.close()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-colors"
          >
            Close Window
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`hunt-popout-page min-h-screen w-full bg-[#09090b] flex flex-col items-center justify-center p-3 text-white select-none ${!useHomeSprites ? "using-gen5-sprites" : ""}`}>
      <div className="hunt-popout-card-container w-full max-w-[480px]">
        <DetailedHuntCard
          hunt={hunt}
          isPopout={true}
          getPokemonImage={getPokemonImage}
          useHomeSprites={useHomeSprites}
          hotkey={hotkey}
          decrementHotkey={decrementHotkey}
          huntIncrement={huntIncrement}
          metricMode={metricMode}
          onToggleMetricMode={toggleMetricMode}
          onAddCheck={() => handleAddCheck()}
          onDecreaseCheck={handleDecreaseCheck}
          onTogglePause={handleTogglePause}
        />
      </div>
    </div>
  );
}
