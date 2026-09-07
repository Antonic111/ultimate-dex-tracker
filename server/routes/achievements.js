import express from "express";
import { getBadgeRarity } from "../utils/achievementRarity.js";

const router = express.Router();

/**
 * GET /api/achievements/rarity
 * Returns global rarity statistics for all badge tiers across eligible users.
 * An eligible user is defined as an account that has registered at least 1 Pokémon.
 */
router.get("/rarity", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const data = await getBadgeRarity(forceRefresh);

    // Set client caching headers (5 minutes in browser, 15 minutes in CDN/proxy)
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    return res.json(data);
  } catch (error) {
    console.error("Error retrieving badge rarity:", error);
    return res.status(500).json({ error: "Failed to calculate badge rarity" });
  }
});

export default router;
