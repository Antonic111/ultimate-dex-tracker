import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import oauthRoutes from "./routes/oauth.js";
import profileRoutes from "./routes/profiles.js";
import bugReportRoutes from "./routes/bugReports.js";
import recentCatchesRoutes from "./routes/recentCatches.js";
import notificationsRoutes from "./routes/notifications.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from both .env and .env.local (and parent dir)
dotenv.config();
dotenv.config({ path: ".env.local" });
dotenv.config({ path: "../.env" });
dotenv.config({ path: "../.env.local" });

const app = express();

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Add this line to fix rate limiter
app.set("trust proxy", 1);

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://ultimatedextracker.com",
    "https://www.ultimatedextracker.com",
    "https://ultimate-dex-tracker-pr5vf4mcr-antonics-projects.vercel.app",
    "https://ultimate-dex-tracker.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
  ];

  // Allow production domains, localhost, and any LAN IP in development
  const isLocalOrNetworkDev =
    origin &&
    /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);

  if (origin && (allowedOrigins.includes(origin) || isLocalOrNetworkDev)) {
    res.header("Access-Control-Allow-Origin", origin);
  }


  // Enhanced CORS headers for mobile compatibility
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma");
  res.header("Access-Control-Expose-Headers", "Set-Cookie");
  res.header("Access-Control-Max-Age", "86400"); // 24 hours

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  next();
});

app.use(cookieParser());
// Increase body size limits to handle larger payloads (e.g., caught maps, progress bars)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Simple CORS test endpoint
app.get("/api/cors-test", (req, res) => {
  res.json({ message: "CORS test successful", timestamp: new Date().toISOString() });
});

// iPhone cookie test endpoint
app.get("/api/iphone-test", (req, res) => {
  const isIOS = req.headers["user-agent"] && /iPhone|iPad|iPod/i.test(req.headers["user-agent"]);
  const isMobile = req.headers["user-agent"] && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(req.headers["user-agent"]);

  // Set a test cookie
  res.cookie("iphone-test-cookie", "test-value", {
    httpOnly: true,
    secure: false, // Always false for local development
    sameSite: "lax", // Use "lax" for local development
    maxAge: 1000 * 60 * 5, // 5 minutes
    path: "/",
  });

  res.json({
    message: "iPhone test successful",
    timestamp: new Date().toISOString(),
    isIOS,
    isMobile,
    userAgent: req.headers["user-agent"],
    cookies: req.cookies,
    cookieHeader: req.headers.cookie,
  });
});

app.use("/api", authRoutes);
app.use("/api", oauthRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/bug-reports", bugReportRoutes);
app.use("/api/recent-catches", recentCatchesRoutes);
app.use("/api/notifications", notificationsRoutes);

// Global error handler for oversized payloads and other errors
app.use((err, req, res, next) => {
  if (err && (err.type === "entity.too.large" || err.status === 413)) {
    return res.status(413).json({ error: "Payload too large" });
  }
  next(err);
});

export default app;
