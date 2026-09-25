import jwt from "jsonwebtoken";
import User from "../models/User.js";

const activeThrottleMap = new Map();

// In-memory real-time suspension cache (userId string -> suspendedReason)
const suspendedUserMap = new Map();

// Initialize cache from database on startup
let isInitialized = false;
async function initSuspendedUsers() {
  if (isInitialized) return;
  try {
    const suspendedUsers = await User.find({ isSuspended: true }).select('_id suspendedReason').lean();
    suspendedUserMap.clear();
    for (const u of suspendedUsers) {
      suspendedUserMap.set(String(u._id), u.suspendedReason || 'Suspended by administrator');
    }
    isInitialized = true;
  } catch (err) {
    console.error('Failed to initialize suspended users cache:', err);
  }
}

// Kick off initialization
initSuspendedUsers();

export function markUserSuspended(userId, reason) {
  if (!userId) return;
  suspendedUserMap.set(String(userId), reason || 'Suspended by administrator');
}

export function unmarkUserSuspended(userId) {
  if (!userId) return;
  suspendedUserMap.delete(String(userId));
}

export function getSuspensionReason(userId) {
  if (!userId) return null;
  return suspendedUserMap.get(String(userId)) || null;
}

export function isUserSuspended(userId) {
  if (!userId) return false;
  return suspendedUserMap.has(String(userId));
}

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

    // Real-time suspension check (< 0.001ms in-memory lookup)
    if (suspendedUserMap.has(String(req.userId))) {
      const reason = suspendedUserMap.get(String(req.userId)) || 'Suspended by administrator';
      
      // Clear cookie immediately
      const isIOS = req.headers['user-agent'] && /iPhone|iPad|iPod/i.test(req.headers['user-agent']);
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? (isIOS ? "none" : "lax") : "lax",
        path: "/",
      };
      if (process.env.NODE_ENV === 'production' && !isIOS) {
        cookieOptions.domain = '.ultimatedextracker.com';
      }
      res.clearCookie("token", cookieOptions);

      return res.status(403).json({
        error: "ACCOUNT_SUSPENDED",
        message: "Your account has been suspended.",
        reason
      });
    }

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

export function optionalAuthenticateUser(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  if (!token && req.cookies) {
    token = req.cookies.token;
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.userId) {
        req.userId = decoded.userId;
      }
    } catch (err) {
      // Optional authentication: silently ignore invalid token
    }
  }
  next();
}

