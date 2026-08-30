import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import HuntOverlayRenderer from "../components/StreamerTools/HuntOverlayRenderer";
import { streamerOverlayAPI } from "../utils/api";
import { createHuntChannel, normalizeHunt } from "../utils/huntSync";
import { buildApiUrl } from "../config/api";

export default function OBSOverlayPage() {
  const { token } = useParams();
  const [overlayData, setOverlayData] = useState(null);
  const [currentHunt, setCurrentHunt] = useState(null);
  const [overlayConfig, setOverlayConfig] = useState(null);
  const [accentColor, setAccentColor] = useState("cyan");
  const [useHomeSprites, setUseHomeSprites] = useState(false);
  const [triggerAnim, setTriggerAnim] = useState(null);
  const [error, setError] = useState(null);

  const eventSourceRef = useRef(null);
  const channelRef = useRef(null);

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
        if (
          String(prev.id) === String(norm.id) &&
          prev.checks === norm.checks &&
          prev.status === norm.status &&
          prev.isPaused === norm.isPaused &&
          prev.startedAt === norm.startedAt &&
          prev.totalPausedMs === norm.totalPausedMs &&
          prev.pausedAt === norm.pausedAt &&
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

  // 1. Initial snapshot fetch
  const fetchSnapshot = useCallback(async () => {
    if (!token) return;
    try {
      const data = await streamerOverlayAPI.getPublicOverlayData(token);
      if (data) {
        applySnapshot(data);
      }
    } catch (err) {
      if (!overlayConfig) {
        setError("Invalid overlay token or overlay disabled.");
      }
    }
  }, [token, overlayConfig, applySnapshot]);

  // 2. High-Efficiency Sync Lifecycle:
  // - SSE Connected: 0 polling (pure realtime push)
  // - SSE Disconnected: Immediate 1-second fallback polling
  // - SSE Reconnect: Automatic exponential backoff (1s -> 2s -> 5s -> 10s)
  useEffect(() => {
    if (!token) return;

    let sse = null;
    let reconnectTimeout = null;
    let pollInterval = null;
    let backoffDelay = 1000;

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const startPolling = () => {
      if (pollInterval) return;
      fetchSnapshot();
      pollInterval = setInterval(fetchSnapshot, 1000);
    };

    const connectSSE = () => {
      try {
        const streamUrl = buildApiUrl(`/overlay/stream/${encodeURIComponent(token)}`);
        sse = new EventSource(streamUrl);
        eventSourceRef.current = sse;

        sse.onopen = () => {
          // SSE connected: Zero polling overhead on the server
          stopPolling();
          backoffDelay = 1000;
        };

        sse.addEventListener("snapshot", (e) => {
          try {
            const data = JSON.parse(e.data);
            applySnapshot(data);
          } catch (err) {
            console.error("SSE snapshot parse error:", err);
          }
        });

        sse.addEventListener("update", (e) => {
          try {
            const parsed = JSON.parse(e.data);
            if (parsed.snapshot) {
              applySnapshot(parsed.snapshot);
            }
          } catch (err) {
            console.error("SSE update parse error:", err);
          }
        });

        sse.addEventListener("config", (e) => {
          try {
            const parsed = JSON.parse(e.data);
            if (parsed.overlay) {
              setOverlayConfig((prev) => (JSON.stringify(prev) === JSON.stringify(parsed.overlay) ? prev : parsed.overlay));
            }
          } catch (_) {}
        });

        sse.addEventListener("action", (e) => {
          try {
            const actionEvent = JSON.parse(e.data);
            if (actionEvent.type === "INCREMENT") {
              setTriggerAnim({ type: "INCREMENT", id: Date.now() });
            } else if (actionEvent.type === "LOG_SHINY_PHASE") {
              setTriggerAnim({ type: "PHASE", id: Date.now() });
            } else if (actionEvent.type === "SHINY_COMPLETED") {
              setTriggerAnim({ type: "SHINY", id: Date.now() });
            }
          } catch (_) {}
        });

        sse.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data?.snapshot) {
              applySnapshot(data.snapshot);
            }
          } catch (_) {}
        };

        sse.onerror = () => {
          sse.close();
          // SSE dropped: immediately start 1-second fallback polling so overlay never stalls
          startPolling();

          // Schedule reconnect with gentle exponential backoff: 1s -> 2s -> 5s -> 10s
          const currentDelay = backoffDelay;
          if (backoffDelay === 1000) backoffDelay = 2000;
          else if (backoffDelay === 2000) backoffDelay = 5000;
          else backoffDelay = 10000;

          if (reconnectTimeout) clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(connectSSE, currentDelay);
        };
      } catch (err) {
        console.warn("SSE initialization error:", err);
        startPolling();
      }
    };

    // Initial snapshot fetch & start SSE
    fetchSnapshot();
    connectSSE();

    // 3. Local BroadcastChannel for instant same-browser updates
    const channel = createHuntChannel((msg) => {
      if (!msg) return;

      if (msg.type === "CURRENT_HUNT_CHANGED") {
        if (msg.hunt) {
          setCurrentHunt(normalizeHunt(msg.hunt));
        } else {
          fetchSnapshot();
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
        }
        if (msg.hunts) {
          setCurrentHunt((prev) => {
            if (!prev) return prev;
            const updated = msg.hunts.find((h) => String(h.id) === String(prev.id));
            return updated ? normalizeHunt(updated) : prev;
          });
        } else {
          fetchSnapshot();
        }
      } else if (msg.type === "HUNT_UPDATED") {
        fetchSnapshot();
      }
    });

    channelRef.current = channel;

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      stopPolling();
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (sse) sse.close();
      if (channel) channel.close();
    };
  }, [token, fetchSnapshot, applySnapshot]);

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

  // Positioning calculations
  const position = overlayConfig.position || {};
  const preset = position.alignmentPreset || "bottom-left";
  const xPercent = position.xPercent ?? 2;
  const yPercent = position.yPercent ?? 85;
  const isTrimMode = preset === "trim" || overlayConfig.canvasWidth === 0 || overlayConfig.canvasHeight === 0;

  if (isTrimMode) {
    return (
      <div
        className="obs-overlay-viewport trim-mode"
        style={{
          display: "inline-block",
          position: "relative",
          overflow: "visible",
          backgroundColor: "transparent",
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

  let containerStyle = {
    position: "absolute",
    zIndex: 100,
  };

  if (preset === "top-left") {
    containerStyle = { ...containerStyle, top: "24px", left: "24px" };
  } else if (preset === "top-center") {
    containerStyle = { ...containerStyle, top: "24px", left: "50%", transform: "translateX(-50%)" };
  } else if (preset === "top-right") {
    containerStyle = { ...containerStyle, top: "24px", right: "24px" };
  } else if (preset === "center-left") {
    containerStyle = { ...containerStyle, top: "50%", left: "24px", transform: "translateY(-50%)" };
  } else if (preset === "center") {
    containerStyle = { ...containerStyle, top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  } else if (preset === "center-right") {
    containerStyle = { ...containerStyle, top: "50%", right: "24px", transform: "translateY(-50%)" };
  } else if (preset === "bottom-left") {
    containerStyle = { ...containerStyle, bottom: "24px", left: "24px" };
  } else if (preset === "bottom-center") {
    containerStyle = { ...containerStyle, bottom: "24px", left: "50%", transform: "translateX(-50%)" };
  } else if (preset === "bottom-right") {
    containerStyle = { ...containerStyle, bottom: "24px", right: "24px" };
  } else {
    // Custom normalized percentage coordinates
    containerStyle = {
      ...containerStyle,
      left: `${xPercent}%`,
      top: `${yPercent}%`,
    };
  }

  return (
    <div
      className="obs-overlay-viewport"
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "transparent",
      }}
    >
      <div style={containerStyle}>
        <HuntOverlayRenderer
          hunt={currentHunt}
          overlayConfig={overlayConfig}
          accentColor={accentColor}
          useHomeSprites={useHomeSprites}
          triggerAnim={triggerAnim}
          previewMode={false}
        />
      </div>
    </div>
  );
}
