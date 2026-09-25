import express from "express";
import crypto from "crypto";
import StreamerOverlay from "../models/StreamerOverlay.js";
import User from "../models/User.js";
import { authenticateUser } from "../middleware/authenticateUser.js";
import { hasUserEntitlement } from "../utils/entitlementService.js";
import { broadcastToOverlay } from "../utils/supabaseBroadcast.js";

const router = express.Router();

/**
 * Helper to broadcast realtime notification events to connected OBS overlay streams for a user.
 */
export const notifyOverlayStream = async (userId, eventType, data = {}) => {
  if (!userId) return;

  try {
    let overlayToken = data?.overlayToken || data?.overlay?.overlayToken;
    if (!overlayToken) {
      const overlay = await StreamerOverlay.findOne({ userId }).select("overlayToken").lean();
      overlayToken = overlay?.overlayToken;
    }

    if (overlayToken) {
      await broadcastToOverlay(overlayToken, {
        type: eventType,
        ...data,
      });
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[StreamerTools] Error in notifyOverlayStream:", err.message);
    }
  }
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
  const checks = Number(hunt.checks || 0);
  const phases = Array.isArray(hunt.phases) ? hunt.phases : [];

  let totalOverallChecks = checks;
  if (phases.length > 0) {
    const lastPhase = phases[phases.length - 1];
    const lastTotal = lastPhase?.totalChecks !== undefined && lastPhase?.totalChecks !== null
      ? Number(lastPhase.totalChecks)
      : phases.reduce((acc, p) => acc + Number(p.phaseChecks || p.checks || 0), 0);

    if (checks >= lastTotal && lastTotal > 0) {
      totalOverallChecks = checks;
    } else {
      totalOverallChecks = lastTotal + checks;
    }
  } else if (hunt.totalChecks !== undefined && Number(hunt.totalChecks) > 0) {
    totalOverallChecks = Number(hunt.totalChecks);
  }

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
    checks,
    totalChecks: totalOverallChecks,
    metricMode: hunt.metricMode || "phase",
    increment: Number(hunt.increment || 1),
    status: hunt.status || "running",
    isPaused: Boolean(hunt.isPaused || hunt.status === "paused"),
    startedAt: Number(hunt.startedAt || hunt.startTime) || 0,
    startTime: Number(hunt.startedAt || hunt.startTime) || 0,
    pausedAt: hunt.pausedAt ? Number(hunt.pausedAt) : null,
    totalPausedMs: Number(hunt.totalPausedMs || 0),
    lastCheckAt: hunt.lastCheckAt ? Number(hunt.lastCheckAt) : null,
    phases,
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
 * Deprecated: Overlay updates now use push notifications via Supabase Realtime Broadcast.
 */
router.get("/overlay/stream/:token", (req, res) => {
  res.status(410).json({
    error: "SSE stream deprecated. Streamer overlay updates now use Supabase Realtime Broadcast.",
  });
});

export default router;
