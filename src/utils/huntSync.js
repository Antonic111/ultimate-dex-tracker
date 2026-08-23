/**
 * Hunt Synchronization & Canonical State System
 * Provides a single source of truth for Shiny Hunts across main window and popout views.
 * Handles timestamp-derived elapsed timers, versioned state mutations, and BroadcastChannel communication.
 */

export const BROADCAST_CHANNEL_NAME = "hunt-tracker";

// ── Time & Interval Formatters ───────────────────────────────────────────────

/**
 * Formats milliseconds into HH:MM:SS or MM:SS digital monospace display.
 */
export const formatDigitalTime = (milliseconds = 0) => {
  const totalSec = Math.floor(Math.max(0, milliseconds) / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const pad = (n) => String(n).padStart(2, "0");
  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
};

/**
 * Formats seconds intelligently for pace/intervals (e.g. 8.4s, 24.7s, 1m 12s, 2m 04s).
 */
export const formatIntervalTime = (seconds = 0) => {
  if (isNaN(seconds) || seconds <= 0) return "0.0s";
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const remSec = Math.floor(seconds % 60);
  return `${mins}m ${String(remSec).padStart(2, "0")}s`;
};

// ── Derived Elapsed Time ─────────────────────────────────────────────────────

/**
 * Calculates active hunting milliseconds purely from canonical timestamps.
 * Excludes all paused durations without requiring ticking timer mutations.
 */
export const getHuntElapsedTime = (hunt, now = Date.now()) => {
  if (!hunt) return 0;
  const startedAt = hunt.startedAt || hunt.startTime || (typeof hunt.id === "number" ? hunt.id : now);
  const totalPausedMs = hunt.totalPausedMs || 0;
  const isPaused = hunt.status === "paused" || hunt.isPaused;

  if (isPaused) {
    const pausedAt = hunt.pausedAt || hunt.updatedAt || now;
    return Math.max(0, pausedAt - startedAt - totalPausedMs);
  }
  return Math.max(0, now - startedAt - totalPausedMs);
};

// ── Canonical Hunt Normalization ─────────────────────────────────────────────

/**
 * Normalizes any hunt object into the canonical timestamp & versioned schema.
 */
export const normalizeHunt = (hunt, now = Date.now(), legacyTotals = {}, legacyLasts = {}, legacyPaused = new Set()) => {
  if (!hunt) return null;
  const huntId = hunt.id || hunt.huntId || now;
  const isLegacyPaused = legacyPaused.has(huntId) || legacyPaused.has(String(huntId)) || legacyPaused.has(Number(huntId));
  const isPaused = hunt.status ? hunt.status === "paused" : (hunt.isPaused ?? isLegacyPaused);

  let startedAt = hunt.startedAt || hunt.startTime;
  let totalPausedMs = hunt.totalPausedMs;

  // Handle migration from legacy totalCheckTimes if startedAt / totalPausedMs aren't explicit
  if (!startedAt) {
    const accumulatedTime = legacyTotals[huntId] ?? legacyTotals[String(huntId)] ?? 0;
    startedAt = now - accumulatedTime;
    totalPausedMs = 0;
  }
  if (totalPausedMs === undefined || totalPausedMs === null) {
    totalPausedMs = 0;
  }

  const pausedAt = isPaused ? (hunt.pausedAt || legacyLasts[huntId] || now) : null;

  return {
    ...hunt,
    id: huntId,
    huntId,
    version: hunt.version || 1,
    checks: Math.max(0, hunt.checks || 0),
    status: isPaused ? "paused" : "running",
    isPaused,
    startedAt,
    startTime: startedAt,
    pausedAt,
    totalPausedMs: Math.max(0, totalPausedMs),
    lastCheckAt: hunt.lastCheckAt || legacyLasts[huntId] || now,
    updatedAt: hunt.updatedAt || now,
    phases: hunt.phases || [],
    fails: hunt.fails || [],
    isPhasesCollapsed: !!hunt.isPhasesCollapsed,
    modifiers: hunt.modifiers || {},
    stats: hunt.stats || {}
  };
};

// ── Canonical Mutation Reducer ───────────────────────────────────────────────

/**
 * Applies a canonical action to a single hunt object and returns the updated state.
 * Implements version incrementation and accurate interval calculations.
 */
export const updateHuntWithAction = (hunt, action, now = Date.now()) => {
  if (!hunt) return hunt;
  const current = normalizeHunt(hunt, now);
  const version = (current.version || 0) + 1;

  switch (action.type) {
    case "INCREMENT": {
      const amount = action.amount || 1;
      const newChecks = Math.max(0, current.checks + amount);
      const prevCheckTime = current.lastCheckAt || current.startedAt || now;

      // Auto-resume if it was paused when incrementing
      let status = current.status;
      let pausedAt = current.pausedAt;
      let totalPausedMs = current.totalPausedMs;

      if (status === "paused" && amount > 0) {
        const pausedDuration = pausedAt ? Math.max(0, now - pausedAt) : 0;
        totalPausedMs += pausedDuration;
        status = "running";
        pausedAt = null;
      }

      // Interval & pace stats calculation
      let updatedStats = { ...(current.stats || {}) };
      if (amount > 0) {
        const rawIntervalSec = Math.max(0.1, (now - prevCheckTime) / 1000);
        if (rawIntervalSec >= 0.3 && rawIntervalSec < 7200) {
          const lastIntervalSec = parseFloat(rawIntervalSec.toFixed(1));
          const prevFastest = updatedStats.fastestIntervalSec || Infinity;
          const fastestIntervalSec = parseFloat(Math.min(prevFastest, lastIntervalSec).toFixed(1));
          const prevRecent = updatedStats.recentIntervals || [];
          const recentIntervals = [...prevRecent.slice(-9), lastIntervalSec];
          const last10AvgSec = parseFloat((recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length).toFixed(1));

          updatedStats = {
            ...updatedStats,
            lastIntervalSec,
            fastestIntervalSec,
            recentIntervals,
            last10AvgSec
          };
        }
      }

      return {
        ...current,
        checks: newChecks,
        status,
        isPaused: status === "paused",
        pausedAt,
        totalPausedMs,
        lastCheckAt: now,
        stats: updatedStats,
        version,
        updatedAt: now
      };
    }

    case "DECREMENT": {
      const amount = action.amount || 1;
      const newChecks = Math.max(0, current.checks - amount);
      return {
        ...current,
        checks: newChecks,
        version,
        updatedAt: now
      };
    }

    case "PAUSE": {
      if (current.status === "paused") return current;
      return {
        ...current,
        status: "paused",
        isPaused: true,
        pausedAt: now,
        version,
        updatedAt: now
      };
    }

    case "RESUME": {
      if (current.status === "running") return current;
      const pausedDuration = current.pausedAt ? Math.max(0, now - current.pausedAt) : 0;
      return {
        ...current,
        status: "running",
        isPaused: false,
        pausedAt: null,
        totalPausedMs: (current.totalPausedMs || 0) + pausedDuration,
        version,
        updatedAt: now
      };
    }

    case "TOGGLE_PAUSE": {
      if (current.status === "paused") {
        return updateHuntWithAction(current, { type: "RESUME" }, now);
      }
      return updateHuntWithAction(current, { type: "PAUSE" }, now);
    }

    case "RESET_STATS": {
      return {
        ...current,
        startedAt: now,
        totalPausedMs: 0,
        pausedAt: current.status === "paused" ? now : null,
        stats: {},
        version,
        updatedAt: now
      };
    }

    case "LOG_SHINY_PHASE": {
      const phaseEvent = action.phaseEvent || {};
      const nextPhases = [...(current.phases || []), phaseEvent];

      return {
        ...current,
        checks: 0,
        currentPhase: nextPhases.length + 1,
        phases: nextPhases,
        status: "paused",
        isPaused: true,
        pausedAt: now,
        version,
        updatedAt: now
      };
    }

    case "UPDATE_PROPERTIES": {
      const payload = action.payload || {};
      let nextStartedAt = current.startedAt;
      let nextTotalPaused = current.totalPausedMs;

      // If user manually adjusts hours/minutes/seconds in Adjust Values modal
      if (payload.overrideElapsedMs !== undefined) {
        nextStartedAt = now - payload.overrideElapsedMs;
        nextTotalPaused = 0;
      }

      return {
        ...current,
        ...payload,
        startedAt: nextStartedAt,
        totalPausedMs: nextTotalPaused,
        version,
        updatedAt: now
      };
    }

    default:
      return current;
  }
};

/**
 * Updates a collection of active hunts using an action.
 */
export const applyHuntActionToState = (activeHunts, action, now = Date.now()) => {
  if (!Array.isArray(activeHunts)) return [];
  const targetId = String(action.huntId);

  // Check if target is transitioning to running state
  const isResumingAction =
    action.type === "RESUME" ||
    (action.type === "TOGGLE_PAUSE" && activeHunts.some(h => (String(h.id) === targetId || String(h.huntId) === targetId) && (h.status === "paused" || h.isPaused))) ||
    (action.type === "INCREMENT" && (action.amount || 1) > 0 && activeHunts.some(h => (String(h.id) === targetId || String(h.huntId) === targetId) && (h.status === "paused" || h.isPaused)));

  return activeHunts.map((h) => {
    const isTarget = String(h.id) === targetId || String(h.huntId) === targetId;
    if (isTarget) {
      return updateHuntWithAction(h, action, now);
    } else if (isResumingAction && (h.status === "running" || (!h.status && !h.isPaused))) {
      // Automatically pause any other running hunt so only one hunt runs at a time
      return updateHuntWithAction(h, { type: "PAUSE", huntId: h.id }, now);
    }
    return h;
  });
};

// ── Local Recovery Storage ───────────────────────────────────────────────────

const LOCAL_STORAGE_KEY = "ultimate_dex_tracker_hunts_cache";

export const getCachedHuntsData = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setCachedHuntsData = (data) => {
  try {
    if (data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
  } catch {}
};

// ── BroadcastChannel Wrapper ─────────────────────────────────────────────────

/**
 * Creates a synchronized BroadcastChannel listener with out-of-order rejection.
 */
export const createHuntChannel = (onActionOrUpdate, senderId = null) => {
  const currentSenderId = senderId || `window_${Math.random().toString(36).slice(2, 9)}`;

  let channel = null;
  try {
    channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channel.onmessage = (event) => {
      const data = event.data;
      if (!data) return;

      // Ignore self-broadcasts
      if (data.senderId === currentSenderId) return;

      onActionOrUpdate(data);
    };
  } catch (err) {
    console.warn("BroadcastChannel not supported or failed to initialize:", err);
  }

  const broadcast = (message) => {
    if (!channel) return;
    try {
      channel.postMessage({
        ...message,
        senderId: currentSenderId,
        broadcastTime: Date.now()
      });
    } catch {}
  };

  const close = () => {
    if (channel) {
      try {
        channel.close();
      } catch {}
    }
  };

  return {
    broadcast,
    close,
    senderId: currentSenderId
  };
};
