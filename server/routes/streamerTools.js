import express from "express";
import crypto from "crypto";
import { EventEmitter } from "events";
import StreamerOverlay from "../models/StreamerOverlay.js";
import User from "../models/User.js";
import { authenticateUser } from "../middleware/authenticateUser.js";
import { hasUserEntitlement } from "../utils/entitlementService.js";

const router = express.Router();
export const overlayEventEmitter = new EventEmitter();
overlayEventEmitter.setMaxListeners(200);

/**
 * Helper to emit SSE events to all connected overlay streams for a user
 */
export const notifyOverlayStream = (userId, eventType, data = {}) => {
  if (!userId) return;
  overlayEventEmitter.emit(`user:${String(userId)}`, {
    type: eventType,
    data,
    timestamp: Date.now(),
  });
};

// ── Authenticated Routes ───────────────────────────────────────────────────

/**
 * GET /api/streamer-tools/overlay
 * Fetches the user's overlay configuration, or creates a default one if none exists.
 */
router.get("/streamer-tools/overlay", authenticateUser, async (req, res) => {
  try {
    let overlay = await StreamerOverlay.findOne({ userId: req.userId });
    if (!overlay) {
      overlay = await StreamerOverlay.create({
        userId: req.userId,
        overlayToken: crypto.randomBytes(16).toString("hex"),
      });
    }

    res.json({
      overlay,
    });
  } catch (err) {
    console.error("Error fetching overlay config:", err);
    res.status(500).json({ error: "Failed to retrieve overlay configuration" });
  }
});

/**
 * PUT /api/streamer-tools/overlay
 * Updates and persists the user's overlay configuration.
 */
router.put("/streamer-tools/overlay", authenticateUser, async (req, res) => {
  try {
    const allowedFields = [
      "enabled",
      "canvasWidth",
      "canvasHeight",
      "position",
      "layout",
      "pokemonSettings",
      "counterSettings",
      "timerSettings",
      "styleSettings",
      "typographySettings",
      "animationSettings",
      "pausedBehavior",
      "idleBehavior",
      "elementStyles",
      "activePresetId"
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Enforce membership gating for removing watermark
    if (updates.styleSettings && updates.styleSettings.showWatermark === false) {
      const isEntitled = await hasUserEntitlement(req.userId, "premium");
      const user = await User.findById(req.userId).select("isAdmin role");
      const isMember = Boolean(isEntitled || user?.isAdmin || user?.role === "admin");
      if (!isMember) {
        updates.styleSettings.showWatermark = true;
      }
    }

    const overlay = await StreamerOverlay.findOneAndUpdate(
      { userId: req.userId },
      { $set: updates },
      { new: true, upsert: true }
    );

    // Notify connected OBS browser sources of config change
    notifyOverlayStream(req.userId, "CONFIG_UPDATED", { overlay });

    res.json({ success: true, overlay });
  } catch (err) {
    console.error("Error saving overlay config:", err);
    res.status(500).json({ error: "Failed to update overlay configuration" });
  }
});

/**
 * POST /api/streamer-tools/overlay/regenerate-token
 * Regenerates the overlay URL secret token.
 */
router.post("/api/streamer-tools/overlay/regenerate-token", authenticateUser, async (req, res) => {
  try {
    const newToken = crypto.randomBytes(16).toString("hex");
    const overlay = await StreamerOverlay.findOneAndUpdate(
      { userId: req.userId },
      { $set: { overlayToken: newToken } },
      { new: true, upsert: true }
    );

    res.json({ success: true, overlayToken: overlay.overlayToken, overlay });
  } catch (err) {
    console.error("Error regenerating overlay token:", err);
    res.status(500).json({ error: "Failed to regenerate overlay token" });
  }
});

// Also support route without /api prefix when mounted under /api
router.post("/streamer-tools/overlay/regenerate-token", authenticateUser, async (req, res) => {
  try {
    const newToken = crypto.randomBytes(16).toString("hex");
    const overlay = await StreamerOverlay.findOneAndUpdate(
      { userId: req.userId },
      { $set: { overlayToken: newToken } },
      { new: true, upsert: true }
    );

    res.json({ success: true, overlayToken: overlay.overlayToken, overlay });
  } catch (err) {
    console.error("Error regenerating overlay token:", err);
    res.status(500).json({ error: "Failed to regenerate overlay token" });
  }
});

// ── Public Overlay Routes (Read-Only) ──────────────────────────────────────

/**
 * Helper to resolve public snapshot from overlay token
 */
function extractOverlayHunt(hunt) {
  if (!hunt) return null;
  return {
    id: hunt.id,
    huntId: hunt.huntId || hunt.id,
    pokemon: hunt.pokemon,
    pokemonName: hunt.pokemonName || hunt.pokemon?.name || "",
    game: hunt.game || "",
    method: hunt.method || "",
    ball: hunt.ball || "",
    mark: hunt.mark || "",
    notes: hunt.notes || "",
    checks: Number(hunt.checks || 0),
    increment: Number(hunt.increment || 1),
    status: hunt.status || "running",
    isPaused: Boolean(hunt.isPaused || hunt.status === "paused"),
    startedAt: Number(hunt.startedAt || hunt.startTime) || 0,
    startTime: Number(hunt.startedAt || hunt.startTime) || 0,
    pausedAt: hunt.pausedAt ? Number(hunt.pausedAt) : null,
    totalPausedMs: Number(hunt.totalPausedMs || 0),
    lastCheckAt: hunt.lastCheckAt ? Number(hunt.lastCheckAt) : null,
    phases: Array.isArray(hunt.phases) ? hunt.phases : [],
    fails: Array.isArray(hunt.fails) ? hunt.fails : [],
    odds: hunt.odds || null,
    stats: hunt.stats || {},
    updatedAt: hunt.updatedAt ? Number(hunt.updatedAt) : Date.now()
  };
}

async function getPublicOverlayData(token) {
  if (!token) return null;
  const overlay = await StreamerOverlay.findOne({ overlayToken: token }).lean();
  if (!overlay) return null;

  const user = await User.findById(overlay.userId).select(
    "activeHunts currentHuntId accentColor siteTheme dexPreferences"
  ).lean();
  if (!user) return null;

  const activeHunts = user.activeHunts || [];
  let currentHunt = null;
  if (user.currentHuntId != null) {
    currentHunt = activeHunts.find(
      (h) => String(h.id) === String(user.currentHuntId) || String(h.huntId) === String(user.currentHuntId)
    );
  }
  if (!currentHunt && activeHunts.length > 0) {
    currentHunt = activeHunts[0];
  }

  return {
    overlay,
    currentHunt: extractOverlayHunt(currentHunt),
    activeHuntsCount: activeHunts.length,
    accentColor: user.accentColor || "cyan",
    useHomeSprites: user.dexPreferences?.useHomeSprites || false,
  };
}

/**
 * GET /api/overlay/public/:token
 * Public endpoint to fetch initial snapshot for OBS Browser Source.
 */
router.get("/overlay/public/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const data = await getPublicOverlayData(token);
    if (!data) {
      return res.status(404).json({ error: "Overlay not found or invalid token" });
    }

    res.json(data);
  } catch (err) {
    console.error("Error fetching public overlay data:", err);
    res.status(500).json({ error: "Failed to load overlay data" });
  }
});

/**
 * GET /api/overlay/stream/:token
 * Server-Sent Events (SSE) stream for realtime push updates to OBS.
 */
router.get("/overlay/stream/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const overlay = await StreamerOverlay.findOne({ overlayToken: token }).lean();
    if (!overlay) {
      return res.status(404).json({ error: "Overlay not found" });
    }

    // Set headers for Server-Sent Events with no buffering
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform, no-store");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Prevent Nginx/proxy buffering
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders?.();

    // Send initial comment to establish socket stream immediately
    res.write(": connected\n\n");
    if (typeof res.flush === "function") res.flush();

    const userChannel = `user:${String(overlay.userId)}`;

    const sendSSE = (eventName, payload) => {
      try {
        res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
        if (typeof res.flush === "function") {
          res.flush();
        }
      } catch (err) {
        console.error("SSE write error:", err);
      }
    };

    // Initial snapshot message
    const initialData = await getPublicOverlayData(token);
    sendSSE("snapshot", initialData);

    // Handler for realtime updates
    const onUserUpdate = async (event) => {
      try {
        if (event.type === "HUNT_DATA_CHANGED" || event.type === "CURRENT_HUNT_CHANGED") {
          const freshData = await getPublicOverlayData(token);
          sendSSE("update", { ...event, snapshot: freshData });
        } else if (event.type === "CONFIG_UPDATED") {
          sendSSE("config", event.data);
        } else {
          sendSSE("action", event);
        }
      } catch (err) {
        console.error("SSE user update error:", err);
      }
    };

    overlayEventEmitter.on(userChannel, onUserUpdate);

    // Keep-alive heartbeat ping every 20 seconds
    const pingInterval = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
        if (typeof res.flush === "function") {
          res.flush();
        }
      } catch {
        clearInterval(pingInterval);
      }
    }, 20000);

    // Cleanup when connection closes
    req.on("close", () => {
      clearInterval(pingInterval);
      overlayEventEmitter.removeListener(userChannel, onUserUpdate);
    });
  } catch (err) {
    console.error("Error setting up overlay SSE stream:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to establish stream" });
    }
  }
});

export default router;
