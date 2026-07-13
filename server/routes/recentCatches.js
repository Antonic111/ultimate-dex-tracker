import express from "express";
import RecentCatch from "../models/RecentCatch.js";

const router = express.Router();
let clients = [];

// Keep-alive heartbeat to prevent connection timeouts
setInterval(() => {
  clients.forEach(client => {
    // Send an SSE comment to keep the connection alive
    client.write(':\n\n');
  });
}, 30000);

// Middleware for SSE connections
router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders(); // flush the headers to establish connection

  // Add this client to the clients array
  clients.push(res);

  // Remove client when they disconnect
  req.on("close", () => {
    clients = clients.filter(client => client !== res);
  });
});

// Broadcast a new catch to all connected clients
export const broadcastNewCatch = (newCatch) => {
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(newCatch)}\n\n`);
  });
};

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
