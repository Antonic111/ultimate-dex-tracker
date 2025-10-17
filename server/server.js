import dotenv from "dotenv";

// Load environment variables from both .env and .env.local
dotenv.config();
dotenv.config({ path: '.env.local' });

import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profiles.js";
import bugReportRoutes from "./routes/bugReports.js";
import session from "express-session";

// Debug: Log environment variables for development
// removed development environment console logs to reduce noise

const app = express();

// Add this line to fix rate limiter
app.set('trust proxy', 1);

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://ultimatedextracker.com',
    'https://www.ultimatedextracker.com',
    'https://ultimate-dex-tracker-pr5vf4mcr-antonics-projects.vercel.app',
    'https://ultimate-dex-tracker.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://192.168.2.15:5173'
  ];
  
  // Allow origin if it's in the allowed list
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    // Debug logging for CORS issues
    console.log('🚫 CORS Blocked Origin:', origin);
    console.log('✅ Allowed Origins:', allowedOrigins);
  }
  
  // Enhanced CORS headers for mobile compatibility
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

app.use(cookieParser());
// Increase body size limits to handle larger payloads (e.g., caught maps, progress bars)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || "yourStrongSecretHere",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Always false for local development (HTTP)
    sameSite: "lax", // Use "lax" for local development to work with Safari
    domain: undefined, // Let browser handle domain for local IPs
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

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
  const isIOS = req.headers['user-agent'] && /iPhone|iPad|iPod/i.test(req.headers['user-agent']);
  const isMobile = req.headers['user-agent'] && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(req.headers['user-agent']);
  
  // Set a test cookie
  res.cookie('iphone-test-cookie', 'test-value', {
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
    userAgent: req.headers['user-agent'],
    cookies: req.cookies,
    cookieHeader: req.headers.cookie
  });
});

app.use("/api", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/bug-reports", bugReportRoutes);

// Global error handler for oversized payloads and other errors
app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({ error: 'Payload too large' });
  }
  next(err);
});

// Start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    // startup logs minimized
    app.listen(PORT, '0.0.0.0', () => {
      // server running log minimized
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Add error handling
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err);
  console.error('🔥 Stack trace:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION:', reason);
  console.error('🔥 Promise:', promise);
});

process.on('SIGTERM', (signal) => {
  console.error('🔥 SIGTERM RECEIVED:', signal);
});

process.on('SIGINT', (signal) => {
  console.error('🔥 SIGINT RECEIVED:', signal);
});
