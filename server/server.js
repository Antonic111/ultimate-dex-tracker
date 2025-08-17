import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
// import cors from "cors"; // Not needed anymore
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profiles.js";
import session from "express-session";

dotenv.config();

const app = express();

// Add this line to fix rate limiter
app.set('trust proxy', 1);

console.log('🔥 SERVER STARTING WITH LATEST CODE! 🔥');
console.log('🔥 CORS middleware removed from global scope 🔥');

// Handle CORS at the Express level - BEFORE any middleware
app.use((req, res, next) => {
  console.log('🔥 EXPRESS CORS HANDLER CALLED! 🔥');
  console.log('🔥 Method:', req.method);
  console.log('🔥 URL:', req.url);
  console.log('🔥 Origin:', req.headers.origin);
  
  // Handle credentials properly - can't use wildcard with credentials
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    console.log('🔥 EXPRESS HANDLING OPTIONS REQUEST 🔥');
    res.status(200).end();
    return;
  }
  next();
});

app.use(cookieParser());

// Remove the cors middleware completely - use only manual headers
app.use(express.json());

app.use(session({
  secret: "yourStrongSecretHere", // use a strong random string in production
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // true only in HTTPS
    sameSite: "lax",
  },
}));

// Health check endpoint for Railway
app.get("/api/health", (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Super simple CORS test - bypass all middleware
app.get("/api/simple-test", (req, res) => {
  console.log('Simple test endpoint hit!');
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.json({ message: "Simple test works", timestamp: new Date().toISOString() });
});

// Simple CORS test endpoint
app.get("/api/cors-test", (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.json({ message: "CORS test successful", timestamp: new Date().toISOString() });
});

app.use("/api", authRoutes); // Don't rate-limit entire /api here
app.use("/api/profiles", profileRoutes);

const PORT = process.env.PORT || 10000;

console.log('🔥 PORT CONFIGURATION:');
console.log('🔥 process.env.PORT:', process.env.PORT);
console.log('🔥 Final PORT:', PORT);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

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
  })
  .catch((err) => console.error("MongoDB connection error:", err));
