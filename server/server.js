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

app.use(cookieParser());
// Simple CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// CORS debugging
app.use((req, res, next) => {
  console.log('CORS Debug:', {
    method: req.method,
    origin: req.headers.origin,
    url: req.url
  });
  next();
});

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Super simple CORS test - bypass all middleware
app.get("/api/simple-test", (req, res) => {
  console.log('Simple test endpoint hit!');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.json({ message: "Simple test works", timestamp: new Date().toISOString() });
});

// Simple CORS test endpoint
app.get("/api/cors-test", (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.json({ message: "CORS test successful", timestamp: new Date().toISOString() });
});

app.use("/api", authRoutes); // Don't rate-limit entire /api here
app.use("/api/profiles", profileRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
