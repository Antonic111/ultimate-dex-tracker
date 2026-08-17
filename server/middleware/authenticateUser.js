import jwt from "jsonwebtoken";
import User from "../models/User.js";

const activeThrottleMap = new Map();

export function authenticateUser(req, res, next) {
  // Prefer Authorization header to avoid stale cookies
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // Fallback to cookie token if no header provided
  if (!token) {
    token = req.cookies.token;
  }
  
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    // Track user active timestamp (throttled to once every 2 minutes)
    const now = Date.now();
    const lastActive = activeThrottleMap.get(req.userId);
    if (!lastActive || now - lastActive > 2 * 60 * 1000) {
      activeThrottleMap.set(req.userId, now);
      User.updateOne({ _id: req.userId }, { $set: { lastActiveAt: new Date(now) } }).catch(() => {});
      if (activeThrottleMap.size > 10000) activeThrottleMap.clear();
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
