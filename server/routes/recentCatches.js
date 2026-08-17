import express from "express";
import RecentCatch from "../models/RecentCatch.js";

const router = express.Router();
// Middleware for SSE connections (graceful fallback)
router.get("/stream", (req, res) => {
  res.status(204).end();
});

// Broadcast a new catch (noop in serverless)
export const broadcastNewCatch = (newCatch) => {};

// GET initial list of recent catches (limit 25)
router.get("/", async (req, res) => {
  try {
    const catches = await RecentCatch.find()
      .sort({ caughtAt: -1 })
      .limit(25);
    res.json(catches);
  } catch (error) {
    console.error("Error fetching recent catches:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
