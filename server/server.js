import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profiles.js";
import session from "express-session";

dotenv.config();

const app = express();

// Add this line to fix rate limiter
app.set('trust proxy', 1);

console.log('🔥 SERVER STARTING WITH SIMPLIFIED CORS! 🔥');

// Simple CORS handling
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

app.use(cookieParser());
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "yourStrongSecretHere",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "none",
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

app.use("/api", authRoutes);
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
