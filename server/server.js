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

console.log('🔥 SERVER STARTING WITH IMPROVED CORS! 🔥');

// Improved CORS handling for production
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow specific origins
  const allowedOrigins = [
    'https://ultimate-dex-tracker-pr5vf4mcr-antonics-projects.vercel.app',
    'https://ultimate-dex-tracker.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
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
    domain: process.env.NODE_ENV === 'production' ? undefined : undefined, // Let browser handle domain
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

app.use("/api", authRoutes);
app.use("/api/profiles", profileRoutes);

const PORT = process.env.PORT || 10000;

console.log('🔥 SERVER CONFIGURATION:');
console.log('🔥 process.env.PORT:', process.env.PORT);
console.log('🔥 process.env.NODE_ENV:', process.env.NODE_ENV);
console.log('🔥 process.env.MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Not set');
console.log('🔥 process.env.JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');
console.log('🔥 Final PORT:', PORT);
console.log('🔥 CORS Origins:', [
  'https://ultimate-dex-tracker-pr5vf4mcr-antonics-projects.vercel.app',
  'https://ultimate-dex-tracker.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
]);

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
