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

      validCatches.push({
        ...c,
        avatar: u.avatar || null
      });
    }

    res.json(validCatches.slice(0, 25));
  } catch (error) {
    console.error("Error fetching recent catches:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
