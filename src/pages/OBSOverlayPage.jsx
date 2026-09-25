import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import HuntOverlayRenderer from "../components/StreamerTools/HuntOverlayRenderer";
import { streamerOverlayAPI } from "../utils/api";
import { createHuntChannel, normalizeHunt } from "../utils/huntSync";
import { subscribeToOverlayRealtime } from "../services/supabaseOverlayRealtime";
import { getRecommendedObsDimensions } from "../utils/overlaySnapping";

export default function OBSOverlayPage() {
  const { token } = useParams();
  const [, setOverlayData] = useState(null);
  const [currentHunt, setCurrentHunt] = useState(null);
  const [overlayConfig, setOverlayConfig] = useState(null);
  const [accentColor, setAccentColor] = useState("cyan");
  const [useHomeSprites, setUseHomeSprites] = useState(false);
  const [triggerAnim, setTriggerAnim] = useState(null);
  const [error, setError] = useState(null);

  const channelRef = useRef(null);
  const lastRequestIdRef = useRef(0);
  const debounceTimerRef = useRef(null);

  const obsDimensions = useMemo(() => getRecommendedObsDimensions(overlayConfig), [overlayConfig]);

  // Ensure body and html are completely transparent for OBS alpha blending and remove external widgets / scrollbar rails
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.id = "obs-overlay-kill-rails";
    styleEl.innerHTML = `
      html.obs-overlay-mode, body.obs-overlay-mode, body.obs-overlay-mode #root, body.obs-overlay-mode main, body.obs-overlay-mode .min-h-screen {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
        overflow: hidden !important;
        scrollbar-gutter: auto !important;
        scrollbar-width: none !important;
      }
      body.obs-overlay-mode::before,
      body.obs-overlay-mode::after,
      html.obs-overlay-mode::before,
      html.obs-overlay-mode::after {
        display: none !important;
        content: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
        background: transparent !important;
      }
      .custom-scrollbar-click-track, .custom-scrollbar-thumb {
        display: none !important;
      }
    `;
    document.head.appendChild(styleEl);

    document.documentElement.style.setProperty("background", "transparent", "important");
    document.documentElement.style.setProperty("background-image", "none", "important");
    document.documentElement.style.setProperty("background-color", "transparent", "important");
    document.documentElement.style.setProperty("overflow", "hidden", "important");
    document.documentElement.style.setProperty("scrollbar-gutter", "auto", "important");

    document.body.style.setProperty("background", "transparent", "important");
    document.body.style.setProperty("background-image", "none", "important");
    document.body.style.setProperty("background-color", "transparent", "important");
    document.body.style.setProperty("overflow", "hidden", "important");

    document.documentElement.classList.add("obs-overlay-mode");
    document.body.classList.add("obs-overlay-mode");

    // Hide any Ko-Fi widget or external floating buttons immediately
    const hideWidgets = () => {
      const kofiElements = document.querySelectorAll(
        '[id^="kofi-widget-overlay"], iframe[src*="ko-fi"], .floatingchat-container-wrap, .floatingchat-container-wrap-mobi, .floating-chat-kofi-popup-iframe'
      );
      kofiElements.forEach((el) => {
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("opacity", "0", "important");
        el.style.setProperty("pointer-events", "none", "important");
      });
    };
    hideWidgets();
    const interval = setInterval(hideWidgets, 500);

    return () => {
      styleEl.remove();
      clearInterval(interval);
      document.documentElement.style.removeProperty("background");
      document.documentElement.style.removeProperty("background-image");
      document.documentElement.style.removeProperty("background-color");
      document.documentElement.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("scrollbar-gutter");

      document.body.style.removeProperty("background");
      document.body.style.removeProperty("background-image");
      document.body.style.removeProperty("background-color");
      document.body.style.removeProperty("overflow");

      document.documentElement.classList.remove("obs-overlay-mode");
      document.body.classList.remove("obs-overlay-mode");
    };
  }, []);

  // Helper to apply snapshots with shallow diffing (prevents timer stutter and redundant renders)
  const applySnapshot = useCallback((data) => {
    if (!data) return;
    setOverlayData((prev) => (JSON.stringify(prev) === JSON.stringify(data) ? prev : data));
    if (data.overlay) {
      setOverlayConfig((prev) => (JSON.stringify(prev) === JSON.stringify(data.overlay) ? prev : data.overlay));
    }
    if (data.currentHunt) {
      const norm = normalizeHunt(data.currentHunt);
      setCurrentHunt((prev) => {
        if (!prev) return norm;
        const totalPausedDiff = Math.abs((Number(prev.totalPausedMs) || 0) - (Number(norm.totalPausedMs) || 0));
        const pausedAtDiff = Math.abs((Number(prev.pausedAt) || 0) - (Number(norm.pausedAt) || 0));
        const isPausedStateIdentical =
          prev.status === norm.status &&
          Boolean(prev.isPaused) === Boolean(norm.isPaused) &&
          totalPausedDiff < 1500 &&
          pausedAtDiff < 1500;

        if (
          String(prev.id) === String(norm.id) &&
          prev.checks === norm.checks &&
          prev.totalChecks === norm.totalChecks &&
          prev.metricMode === norm.metricMode &&
          isPausedStateIdentical &&
          prev.startedAt === norm.startedAt &&
          prev.increment === norm.increment &&
          prev.pokemonName === norm.pokemonName &&
          prev.game === norm.game &&
          prev.method === norm.method &&
          prev.ball === norm.ball &&
          prev.mark === norm.mark &&
          (prev.phases?.length || 0) === (norm.phases?.length || 0) &&
          (prev.fails?.length || 0) === (norm.fails?.length || 0) &&
          prev.odds === norm.odds
        ) {
          return prev;
        }
        return norm;
      });
    } else {
      setCurrentHunt(null);
    }
    if (data.accentColor) setAccentColor(data.accentColor);
    if (data.useHomeSprites !== undefined) setUseHomeSprites(Boolean(data.useHomeSprites));
    setError(null);
  }, []);

  // 1. Authoritative snapshot fetch with race-condition prevention
  const fetchSnapshot = useCallback(async () => {
    if (!token) return;
    const currentRequestId = ++lastRequestIdRef.current;
    if (import.meta.env.DEV) {
      console.log("[Overlay Realtime] fetching snapshot");
    }
    try {
      const data = await streamerOverlayAPI.getPublicOverlayData(token);
      // Guarantee out-of-order responses do not overwrite newer state
      if (currentRequestId === lastRequestIdRef.current && data) {
        applySnapshot(data);
      }
    } catch {
      if (currentRequestId === lastRequestIdRef.current && !overlayConfig) {
        setError("Invalid overlay token or overlay disabled.");
      }
    }
  }, [token, overlayConfig, applySnapshot]);

  // 2. Debounced snapshot fetch to coalesce bursts of events
  const debouncedFetchSnapshot = useCallback((delay = 100) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchSnapshot();
      debounceTimerRef.current = null;
    }, delay);
  }, [fetchSnapshot]);

  // 3. High-Efficiency Push Lifecycle via Supabase Realtime Broadcast:
  // - Push Events: Zero continuous polling on Vercel
  // - Instant Animations: Triggered immediately on broadcast receipt
  // - Authoritative State: Snapshot fetched with debounce
  // - Reconnect: One-time authoritative refresh when connection recovers
  useEffect(() => {
    if (!token) return;

    // A. Initial snapshot fetch
    fetchSnapshot();

    // B. Subscribe to Supabase Realtime push notifications
    const unsubscribeRealtime = subscribeToOverlayRealtime(token, {
      onEvent: (payload) => {
        // Trigger immediate micro-animations if action metadata is present
        const actionType = payload?.action?.type || payload?.type;
        if (actionType === "INCREMENT") {
          setTriggerAnim({ type: "INCREMENT", id: Date.now() });
        } else if (actionType === "LOG_SHINY_PHASE" || actionType === "PHASE") {
          setTriggerAnim({ type: "PHASE", id: Date.now() });
        } else if (actionType === "SHINY_COMPLETED" || actionType === "SHINY") {
          setTriggerAnim({ type: "SHINY", id: Date.now() });
        } else if (actionType === "FAIL") {
          setTriggerAnim({ type: "FAIL", id: Date.now() });
        }

        // Apply config changes directly if provided in payload
        if (payload?.overlay) {
          setOverlayConfig((prev) =>
            JSON.stringify(prev) === JSON.stringify(payload.overlay) ? prev : payload.overlay
          );
        }

        // Coalesce rapid events and fetch authoritative snapshot
        debouncedFetchSnapshot(100);
      },
      onReconnect: () => {
        // Authoritative refresh when connection recovers
        fetchSnapshot();
      },
    });

    // C. Local BroadcastChannel for instant same-browser updates (0ms latency tab sync)
    const channel = createHuntChannel((msg) => {
      if (!msg) return;

      if (msg.type === "CURRENT_HUNT_CHANGED") {
        if (msg.hunt) {
          setCurrentHunt(normalizeHunt(msg.hunt));
        } else {
          debouncedFetchSnapshot(50);
        }
      } else if (msg.type === "HUNTS_SYNC" && msg.hunts) {
        setCurrentHunt((prev) => {
          if (!prev) return prev;
          const updated = msg.hunts.find((h) => String(h.id) === String(prev.id));
          return updated ? normalizeHunt(updated) : prev;
        });
      } else if (msg.type === "HUNT_ACTION" && msg.action) {
        if (msg.action.type === "INCREMENT") {
          setTriggerAnim({ type: "INCREMENT", id: Date.now() });
        } else if (msg.action.type === "LOG_SHINY_PHASE") {
          setTriggerAnim({ type: "PHASE", id: Date.now() });
        } else if (msg.action.type === "TOGGLE_METRIC_MODE" && msg.action.metricMode) {
          setCurrentHunt((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              metricMode: msg.action.metricMode,
              updatedAt: Date.now()
            };
          });
        }
        if (msg.hunts) {
          setCurrentHunt((prev) => {
            if (!prev) return prev;
            const updated = msg.hunts.find((h) => String(h.id) === String(prev.id));
            return updated ? normalizeHunt(updated) : prev;
          });
        } else {
          debouncedFetchSnapshot(50);
        }
      } else if (msg.type === "HUNT_UPDATED") {
        if (msg.hunt) {
          setCurrentHunt((prev) => {
            if (prev && (String(prev.id) === String(msg.hunt.id) || String(prev.huntId) === String(msg.hunt.id))) {
              return normalizeHunt(msg.hunt);
            }
            return prev;
          });
        }
        debouncedFetchSnapshot(50);
      }
    });

    channelRef.current = channel;

    // D. Low-frequency safety: refresh snapshot once when document becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSnapshot();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      unsubscribeRealtime();
      if (channel) channel.close();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [token, fetchSnapshot, debouncedFetchSnapshot]);

  if (error && !overlayConfig) {
    return (
      <div className="w-full h-screen flex items-center justify-center p-4 bg-transparent text-white/50 text-xs font-mono">
        <span>OBS Overlay: {error}</span>
      </div>
    );
  }

  if (!overlayConfig) {
    return null;
  }

  return (
    <div
      className="obs-overlay-viewport trim-mode"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "transparent",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      <HuntOverlayRenderer
        hunt={currentHunt}
        overlayConfig={overlayConfig}
        accentColor={accentColor}
        useHomeSprites={useHomeSprites}
        triggerAnim={triggerAnim}
        previewMode={false}
      />
    </div>
  );
}
