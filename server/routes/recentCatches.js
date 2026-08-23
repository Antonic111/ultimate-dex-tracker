import express from "express";
import RecentCatch from "../models/RecentCatch.js";
import User from "../models/User.js";

const router = express.Router();
// Middleware for SSE connections (graceful fallback)
router.get("/stream", (req, res) => {
  res.status(204).end();
});

// Broadcast a new catch (noop in serverless)
export const broadcastNewCatch = (newCatch) => {};

// GET initial list of recent catches (limit 25) — only for public profiles with active caught Pokémon
router.get("/", async (req, res) => {
  try {
    const catches = await RecentCatch.find()
      .sort({ caughtAt: -1 })
      .limit(60)
      .lean();

    if (!catches || catches.length === 0) {
      return res.json([]);
    }

    // Identify and fetch users for all recent catches
    const uniqueUsernames = [...new Set(catches.map(c => c.username))];
    const users = await User.find({
      username: { $in: uniqueUsernames }
    }).select("username isProfilePublic isGlobalFeedPublic caughtPokemon avatar").lean();

    const userMap = new Map();
    for (const u of users) {
      userMap.set(u.username, u);
    }

    const validCatches = [];
    const staleCatchIds = [];

    for (const c of catches) {
      const u = userMap.get(c.username);
      // Exclude if user no longer exists or user disabled global feed
      if (!u || u.isGlobalFeedPublic === false) {
        continue;
      }

      // Verify that user actually has caught Pokemon in their account
      const caughtMap = u.caughtPokemon || {};
      const caughtKeys = typeof caughtMap === 'object' ? Object.keys(caughtMap) : [];
      if (caughtKeys.length === 0) {
        // User has 0 caught Pokemon on profile — orphaned catch record
        staleCatchIds.push(c._id);
        continue;
      }

      validCatches.push({
        ...c,
        avatar: u.avatar || null
      });
    }

    // Auto-purge stale orphaned catches from the database
    if (staleCatchIds.length > 0) {
      RecentCatch.deleteMany({ _id: { $in: staleCatchIds } }).catch(err =>
        console.error("Error purging orphaned recent catches:", err)
      );
    }

    res.json(validCatches.slice(0, 25));
  } catch (error) {
    console.error("Error fetching recent catches:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
