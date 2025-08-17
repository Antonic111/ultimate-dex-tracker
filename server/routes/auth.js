import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { Resend } from "resend";
import dotenv from "dotenv";
import { sendCodeEmail } from "../utils/sendCodeEmail.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { validateContent } from "../contentFilter.js";
import { authenticateUser } from "../middleware/authenticateUser.js";

// CORS middleware for auth routes
const corsMiddleware = (req, res, next) => {
  console.log('🔥 CORS MIDDLEWARE IS RUNNING! 🔥');
  console.log('🔥 Request method:', req.method);
  console.log('🔥 Request URL:', req.url);
  console.log('🔥 Request origin:', req.headers.origin);
  
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
  
  if (req.method === 'OPTIONS') {
    console.log('🔥 Handling OPTIONS request');
    res.status(200).end();
    return;
  }
  next();
};

const router = express.Router();
dotenv.config();
const PUBLIC_FIELDS = "username profileTrainer bio location gender createdAt";
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const gen6 = () => Math.floor(100000 + Math.random() * 900000).toString(); // "123456"

// auth.js
async function issueDeleteCode(user) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const deleteCodeHash = await bcrypt.hash(code, 10);
  const deleteCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
  
  // Update directly to avoid pre-save middleware issues
  await User.findByIdAndUpdate(user._id, {
    deleteCodeHash,
    deleteCodeExpires
  });
  
  await sendCodeEmail(user, "Delete account code", code, "deletion");
}

// throttle: allow resends every 60s
router.post("/account/delete/send", authenticateUser, async (req, res) => {
  console.log('🔥 POST /account/delete/send - Request received');
  
  try {
    const user = await User.findById(req.userId).select("email deleteCodeExpires");
    if (!user) {
      console.log('❌ User not found for delete code request');
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (!user.email) {
      console.log('❌ User has no email for delete code request');
      return res.status(400).json({ error: "Add an email to your account first." });
    }

    const now = Date.now();
    // if previous code exists and was sent within ~60s (≈ >9m left of the 10m window), block
    if (user.deleteCodeExpires && user.deleteCodeExpires.getTime() - now > 9 * 60 * 1000) {
      console.log('❌ Delete code request too soon for user:', user.email);
      return res.status(429).json({ error: "Please wait before requesting another code." });
    }

    console.log('✅ Sending delete code to user:', user.email);
    await issueDeleteCode(user);
    console.log('✅ Delete code sent successfully to:', user.email);
    return res.status(204).end();
  } catch (e) {
    console.error("❌ delete/send error:", e);
    return res.status(500).json({ error: "Failed to send code" });
  }
});


// Register
router.post("/register", authLimiter, async (req, res) => {
  const { username, email, password, profileTrainer = "ash.png" } = req.body;

  console.log('🔥 Registration attempt:', { username, email, profileTrainer });

  const usernameValidation = validateContent(username, 'username');
  if (!usernameValidation.isValid) {
    console.log('❌ Username validation failed:', usernameValidation.error);
    return res.status(400).json({ error: usernameValidation.error });
  }

  if (!username || !email || !password) {
    console.log('❌ Missing required fields');
    return res.status(400).json({ error: "Missing username, email, or password" });
  }

  if (password.length < 8) {
    console.log('❌ Password too short');
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      console.log('❌ User already exists:', existingUser.username);
      return res.status(400).json({ error: "Username or email already taken" });
    }

    console.log('✅ Creating new user...');
    const user = await User.create({
      username,
      email,
      password,
      verified: false,
      profileTrainer: "ash.png",
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = code;
    user.verificationCodeExpires = Date.now() + 1000 * 60 * 10; // 10 minutes
    await user.save();

    console.log('✅ User created, sending verification email...');
    await sendCodeEmail(user, "Verify Your Account", code, "email verification");
    console.log('✅ Verification email sent successfully');

    res.json({ message: "Account created. Please check your email to verify your account." });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", corsMiddleware, authLimiter, async (req, res) => {
  const { usernameOrEmail, password, rememberMe } = req.body;

  console.log('🔥 POST /login - Request received');
  console.log('🔥 Login attempt for:', usernameOrEmail);

  try {
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });

    if (!user) {
      console.log('❌ User not found:', usernameOrEmail);
      return res.status(400).json({ error: "User not found" });
    }
    
    if (!user.verified) {
      console.log('❌ User not verified:', usernameOrEmail);
      return res.status(403).json({ 
        error: "Account not verified. Please check your email and verify your account before logging in.",
        needsVerification: true 
      });
    }

    console.log('🔐 Comparing passwords for user:', user.username);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🔐 Password comparison result:', isMatch);
    
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log('✅ Login successful for user:', user.username);
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,        // true for HTTPS (both Vercel and Render use HTTPS)
        sameSite: "none",    // required for cross-origin requests
        maxAge: rememberMe ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 2, // 30 days vs 2 hours
      })
      .json({
        message: "Login successful",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          profileTrainer: user.profileTrainer,
          verified: true,
        },
      });
  } catch (err) {
    console.error('🔥 POST /login - Error:', err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Me
router.get("/me", authenticateUser, async (req, res) => {
  res.set("Cache-Control", "no-store");
  
  try {
    console.log('🔥 GET /me - User ID:', req.userId);
    const user = await User.findById(req.userId).select("-password -__v")
    if (!user) return res.status(404).json({ error: "User not found" });

    console.log('🔥 GET /me - User found:', user.username);
    res.json({
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      profileTrainer: user.profileTrainer,
      verified: user.verified,
      progressBars: user.progressBars || [],
    });

  } catch (err) {
    console.error('🔥 GET /me - Error:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// Check verification status
router.get("/check-verified", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Missing email parameter" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ verified: user.verified });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Verify signup code
router.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;
  
  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

    try {
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.verified) return res.json({ message: "Already verified" });
    
    if (
      user.verificationCode !== code ||
      user.verificationCodeExpires < Date.now()
    ) {
      if (user.verificationCode !== code) {
        return res.status(400).json({ error: "Invalid verification code" });
      } else {
        return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
      }
    }

    user.verified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      })
      .json({
        message: "Email verified successfully",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profileTrainer: user.profileTrainer,
          createdAt: user.createdAt,
        },
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Resend verification code
router.post("/resend-code", async (req, res) => {
  const { email } = req.body;
  
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.verified) return res.json({ message: "Already verified" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = code;
    user.verificationCodeExpires = Date.now() + 1000 * 60 * 10; // 10 minutes
    
    await user.save();

    await sendCodeEmail(user, "Verify Your Account", code, "email verification");

    res.json({ message: "Verification code resent" });
  } catch (err) {
    console.error('Resend code error:', err);
    res.status(500).json({ error: "Failed to resend code" });
  }
});

// Forgot Password - Sends reset code
router.post("/forgot-password", authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "No account with that email" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    user.resetCodeExpires = Date.now() + 1000 * 60 * 10;
    await user.save(); // ← this saves the code to MongoDB

    await sendCodeEmail(user, "Reset Your Password", code, "password reset");

    res.json({ message: "Reset code sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send reset code" });
  }
});

// Verify reset code
router.post("/verify-reset-code", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code)
    return res.status(400).json({ error: "Email and code are required" });

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (
    String(user.resetCode) !== String(code) ||
    user.resetCodeExpires < Date.now()
  ) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }

  res.json({ message: "Reset code verified. You may now reset your password." });
});


// Reset password using code
router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword)
    return res.status(400).json({ error: "Missing email, code or password" });

  if (newPassword.length < 8)
    return res.status(400).json({ error: "Password must be at least 8 characters" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (
      user.resetCode !== code ||
      user.resetCodeExpires < Date.now()
    ) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    user.password = newPassword;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "none",   // required for cross-origin requests
    secure: true,       // true for HTTPS (both Vercel and Render use HTTPS)
    path: "/",         // be explicit
  });
  return res.status(204).end(); // no body, prevents caching weirdness
});

// Add this after your existing routes (e.g., in auth.js)
router.put("/profile", authenticateUser, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  console.log('🔥 PUT /profile - Request body:', req.body);

  try {
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    // Update fields
    if (req.body.bio !== undefined) {
      const bioValidation = validateContent(req.body.bio, 'bio');
      if (!bioValidation.isValid) {
        return res.status(400).json({ error: bioValidation.error });
      }
      user.bio = req.body.bio;
    }
    
    if (req.body.location !== undefined) user.location = req.body.location;
    if (req.body.gender !== undefined) user.gender = req.body.gender;
    if (req.body.favoriteGames !== undefined) user.favoriteGames = req.body.favoriteGames;
    if (req.body.favoritePokemon !== undefined) user.favoritePokemon = req.body.favoritePokemon;
    if (req.body.favoritePokemonShiny !== undefined) user.favoritePokemonShiny = req.body.favoritePokemonShiny;
    if (req.body.switchFriendCode !== undefined) user.switchFriendCode = req.body.switchFriendCode;
    if (req.body.profileTrainer !== undefined) user.profileTrainer = req.body.profileTrainer;

    // Handle profile visibility - saves both true and false
    if ("isProfilePublic" in req.body) {
      user.isProfilePublic = !!req.body.isProfilePublic;
      console.log('🔥 PUT /profile - Updated isProfilePublic to:', user.isProfilePublic);
    }

    await user.save();
    console.log('🔥 PUT /profile - Successfully saved user profile');

    res.json({ message: "Profile updated", user: {
      bio: user.bio,
      location: user.location,
      gender: user.gender,
      favoriteGames: user.favoriteGames,
      favoritePokemon: user.favoritePokemon,
      favoritePokemonShiny: user.favoritePokemonShiny,
      profileTrainer: user.profileTrainer,
      switchFriendCode: user.switchFriendCode,
      isProfilePublic: user.isProfilePublic
    }});
  } catch (err) {
    console.error('🔥 PUT /profile - Error:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/profile
router.get("/profile", authenticateUser, async (req, res) => {
  res.set("Cache-Control", "no-store");
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const user = await User.findById(req.userId).select("bio location gender favoriteGames favoritePokemon favoritePokemonShiny profileTrainer switchFriendCode isProfilePublic likes");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      bio: user.bio,
      location: user.location,
      gender: user.gender,
      favoriteGames: user.favoriteGames,
      favoritePokemon: user.favoritePokemon,
      favoritePokemonShiny: user.favoritePokemonShiny,
      profileTrainer: user.profileTrainer,
      switchFriendCode: user.switchFriendCode,
      isProfilePublic: user.isProfilePublic,
      likeCount: user.likes ? user.likes.length : 0,
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

// GET /caught - fetch caught Pokémon data for logged-in user
router.get("/caught", authenticateUser, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  console.log('🔥 GET /caught - User ID:', req.userId);

  try {
    const user = await User.findById(req.userId).select("caughtPokemon");

    if (!user) return res.status(404).json({ error: "User not found" });

    console.log('🔥 GET /caught - User found:', user.username);
    console.log('🔥 GET /caught - caughtPokemon type:', typeof user.caughtPokemon);
    console.log('🔥 GET /caught - caughtPokemon instanceof Map:', user.caughtPokemon instanceof Map);

    // Convert Map to object for JSON response
    const caughtData = user.caughtPokemon instanceof Map 
      ? Object.fromEntries(user.caughtPokemon.entries())
      : user.caughtPokemon || {};

    console.log('🔥 GET /caught - Sending data:', caughtData);
    res.json(caughtData);
  } catch (err) {
    console.error("🔥 GET /caught - Failed to fetch caught data:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /caught - update a single Pokémon's caught data
router.post("/caught", authenticateUser, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  console.log('🔥 POST /caught - Request body:', req.body);
  console.log('🔥 POST /caught - User ID:', req.userId);

  const { caughtMap } = req.body;
  if (!caughtMap || typeof caughtMap !== "object") {
    console.log('🔥 POST /caught - Invalid input:', { caughtMap, type: typeof caughtMap });
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    console.log('🔥 POST /caught - User found:', user.username);
    console.log('🔥 POST /caught - Current caughtPokemon type:', typeof user.caughtPokemon);
    console.log('🔥 POST /caught - Current caughtPokemon instanceof Map:', user.caughtPokemon instanceof Map);

    // Ensure caughtPokemon is a Map
    if (!(user.caughtPokemon instanceof Map)) {
      user.caughtPokemon = new Map();
    }

    // Remove nulls and update
    for (const [key, value] of Object.entries(caughtMap)) {
      if (value === null) {
        user.caughtPokemon.delete(key); // remove from the MongoDB Map
        console.log('🔥 POST /caught - Deleted key:', key);
      } else {
        user.caughtPokemon.set(key, value); // update or create
        console.log('🔥 POST /caught - Set key:', key, 'value:', value);
      }
    }

    await user.save();
    console.log('🔥 POST /caught - Successfully saved user');
    res.json({ success: true });
  } catch (error) {
    console.error('🔥 POST /caught - Error:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// GET /progressBars - fetch progress bars for logged-in user
router.get("/progressBars", authenticateUser, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const user = await User.findById(req.userId).select("progressBars");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user.progressBars || []);
  } catch (err) {
    console.error("Failed to fetch progress bars:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /progressBars - update progress bars
router.post("/progressBars", authenticateUser, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const { progressBars } = req.body;
  if (
    !Array.isArray(progressBars) ||
    !progressBars.every(bar =>
      typeof bar === "object" &&
      typeof bar.id === "string" &&
      typeof bar.name === "string" &&
      typeof bar.visible === "boolean" &&
      typeof bar.filters === "object"
    )
  ) {
    return res.status(400).json({ error: "Invalid progress bar structure" });
  }

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.progressBars = progressBars.map(({ __showFilters, ...rest }) => ({
    ...rest,
    filters: rest.filters || {}, // ✅ ensure filters are always saved
  }));
  await user.save();

  res.json({ success: true });
});

// PUT /progressBars - update progress bars (alternative to POST)
router.put("/progressBars", authenticateUser, async (req, res) => {
  console.log('🔥 PUT /progressBars - Request received');
  console.log('🔥 Request body:', req.body);
  console.log('🔥 Request body type:', typeof req.body);
  console.log('🔥 Request body keys:', Object.keys(req.body));
  
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const { progressBars } = req.body;
  console.log('🔥 Extracted progressBars:', progressBars);
  console.log('🔥 progressBars type:', typeof progressBars);
  console.log('🔥 progressBars isArray:', Array.isArray(progressBars));
  
  if (
    !Array.isArray(progressBars) ||
    !progressBars.every(bar =>
      typeof bar === "object" &&
      typeof bar.id === "string" &&
      typeof bar.name === "string" &&
      typeof bar.visible === "boolean" &&
      typeof bar.filters === "object"
    )
  ) {
    console.log('🔥 Validation failed - progressBars structure:', progressBars);
    return res.status(400).json({ error: "Invalid progress bar structure" });
  }

  console.log('🔥 Validation passed - processing progress bars');
  
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    console.log('🔥 User found:', user.username);
    console.log('🔥 Current progressBars count:', user.progressBars?.length || 0);

    user.progressBars = progressBars.map(({ __showFilters, ...rest }) => ({
      ...rest,
      filters: rest.filters || {}, // ✅ ensure filters are always saved
    }));
    
    console.log('🔥 Updated progressBars count:', user.progressBars.length);
    console.log('🔥 Sample progress bar:', user.progressBars[0]);
    
    await user.save();
    console.log('🔥 Progress bars saved successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('🔥 Error saving progress bars:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// PUT /api/update-username
router.put("/update-username", authenticateUser, async (req, res) => {
  console.log('🔥 PUT /update-username - Request received:', req.body);
  
  try {
    const { newUsername } = req.body;

    if (!newUsername || newUsername.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters" });
    }

    if (!/^[a-zA-Z0-9]+$/.test(newUsername)) {
      return res.status(400).json({ error: "Usernames can only contain letters and numbers." });
    }

    console.log('🔥 PUT /update-username - About to validate username:', newUsername);
    const usernameValidation = validateContent(newUsername, 'username');
    console.log('🔥 PUT /update-username - Validation result:', usernameValidation);
    if (!usernameValidation.isValid) {
      return res.status(400).json({ error: usernameValidation.error });
    }

    const existing = await User.findOne({ username: newUsername });
    if (existing) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    console.log('🔥 PUT /update-username - Updating username from', user.username, 'to', newUsername);
    
    user.username = newUsername;
    await user.save();

    console.log('🔥 PUT /update-username - Username updated successfully');
    res.json({ success: true, username: user.username });
  } catch (error) {
    console.error('🔥 PUT /update-username - Error:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

router.put("/change-password", authenticateUser, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  console.log('🔥 PUT /change-password - Request received');
  console.log('🔥 Request body:', { 
    currentPassword: currentPassword ? '***' : 'MISSING', 
    newPassword: newPassword ? '***' : 'MISSING', 
    confirmPassword: confirmPassword ? '***' : 'MISSING' 
  });

  if (!currentPassword || !newPassword || !confirmPassword) {
    console.log('❌ Missing required fields:', { 
      currentPassword: !!currentPassword, 
      newPassword: !!newPassword, 
      confirmPassword: !!confirmPassword 
    });
    return res.status(400).json({ error: "All fields are required" });
  }

  if (newPassword !== confirmPassword) {
    console.log('❌ Passwords do not match');
    return res.status(400).json({ error: "New passwords do not match" });
  }

  if (newPassword.length < 8) {
    console.log('❌ Password too short:', newPassword.length);
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });

    // Hash the new password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password directly in the database to bypass pre-save middleware
    await User.findByIdAndUpdate(req.userId, { password: hashedPassword });

    console.log('✅ PUT /change-password - Password changed successfully');
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("🔥 PUT /change-password - Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Emergency password reset (for development/testing - remove in production)
router.post("/emergency-reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  
  if (!email || !newPassword) {
    return res.status(400).json({ error: "Email and new password are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password directly to avoid double-hashing
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    console.log('✅ Emergency password reset successful for:', email);
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error('Emergency password reset error:', err);
    res.status(500).json({ error: "Password reset failed" });
  }
});

// GET /api/caught/:username/public  -> return that user's caught map if profile is public
router.get("/caught/:username/public", async (req, res) => {
  console.log("Public caught data route hit for username:", req.params.username);
  res.set("Cache-Control", "no-store");

  const u = await User.findOne({
    username: req.params.username,
    isProfilePublic: { $ne: false }
  })
    .select("_id")
    .lean();

  console.log("User found:", u);

  if (!u) return res.status(404).json({ error: "User not found or private" });

  // Adjust this select if your field name differs
  const full = await User.findById(u._id).select("caughtPokemon").lean();
  console.log("Full user data:", full);
  return res.json(full?.caughtPokemon || {});
});

// Debug endpoint to check password hash (remove in production)
router.get("/debug/password-hash", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('username password');
    if (!user) return res.status(404).json({ error: "User not found" });
    
    res.json({
      username: user.username,
      passwordHash: user.password,
      hashLength: user.password.length,
      isHashed: user.password.startsWith('$2b$') || user.password.startsWith('$2a$')
    });
  } catch (err) {
    console.error('Debug password hash error:', err);
    res.status(500).json({ error: "Server error" });
  }
});




// GET /api/users/public?query=&page=1&pageSize=24&random=1
router.get("/users/public", async (req, res) => {
  res.set("Cache-Control", "no-store");

  const q = (req.query.query || "").trim();
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || "24", 10)));
  const random = req.query.random === "1";

  const match = { isProfilePublic: { $ne: false } };
  if (q) match.username = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

  try {
    const base = [
      { $match: match },
      ...(random && !q ? [{ $sample: { size: pageSize } }] : [
        { $sort: q ? { username: 1 } : { createdAt: -1 } },
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize },
      ]),
      {
        $project: {
          username: 1,
          profileTrainer: 1,
          bio: 1,
          location: 1,
          gender: 1,
          createdAt: 1,
          // count non-null entries in caughtPokemon
          shinies: {
            $size: {
              $filter: {
                input: { $objectToArray: { $ifNull: ["$caughtPokemon", {}] } },
                as: "c",
                cond: { $ne: ["$$c.v", null] }
              }
            }
          },
          // count likes
          likes: { $size: { $ifNull: ["$likes", []] } }
        }
      }
    ];

    const items = await User.aggregate(base);
    // total is optional for random; keep it simple
    const total = q ? await User.countDocuments(match) : items.length;

    console.log('🔥 GET /users/public - Found items:', items.length, 'Total:', total);
    res.json({ items, total, page, pageSize });
  } catch (error) {
    console.error('🔥 GET /users/public - Error:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/users/:username/public
router.get("/users/:username/public", async (req, res) => {
  res.set("Cache-Control", "no-store");
  
  console.log('🔥 GET /users/:username/public - Username:', req.params.username);
  
  try {
    const u = await User.findOne({
      username: req.params.username,
      isProfilePublic: { $ne: false }
    })
      .select("username bio location gender favoriteGames favoritePokemon favoritePokemonShiny profileTrainer createdAt switchFriendCode progressBars")
      .lean();
      
    if (!u) return res.status(404).json({ error: "User not found or private" });
    
    // Add like count
    const likeCount = u.likes ? u.likes.length : 0;
    console.log('🔥 GET /users/:username/public - User found, like count:', likeCount);
    res.json({ ...u, likeCount });
  } catch (error) {
    console.error('🔥 GET /users/:username/public - Error:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/account  — permanently delete the current user
router.delete("/account", authenticateUser, async (req, res) => {
  try {
    // if you already have auth middleware that sets req.user._id, use that:
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await User.findByIdAndDelete(userId);

    // kill auth cookie
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "none",  // required for cross-origin requests
      secure: true,      // true for HTTPS (both Vercel and Render use HTTPS)
      path: "/",
    });

    return res.status(204).end();
  } catch (e) {
    console.error("Delete account failed:", e);
    return res.status(500).json({ error: "Failed to delete account" });
  }
});

// Confirm code and delete the account
router.post("/account/delete/confirm", authenticateUser, async (req, res) => {
  console.log('🔥 POST /account/delete/confirm - Request received');
  console.log('🔥 Request body:', { code: req.body?.code ? '***' : 'MISSING', confirm: req.body?.confirm || 'MISSING' });
  
  try {
    const code = String(req.body?.code || "").trim();
    const typed = String(req.body?.confirm || "").trim();

    if (!/^\d{6}$/.test(code)) {
      console.log('❌ Invalid code format:', code);
      return res.status(400).json({ error: "Invalid code." });
    }

    const user = await User.findById(req.userId).select("username deleteCodeHash deleteCodeExpires");
    if (!user) {
      console.log('❌ User not found for delete confirmation');
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log('🔍 Confirming delete for user:', user.username);

    // Optional: enforce username match server-side (case-insensitive)
    if (typed && typed.toLowerCase() !== user.username.toLowerCase()) {
      console.log('❌ Username mismatch:', { typed, expected: user.username });
      return res.status(400).json({ error: "Type your account name exactly to continue." });
    }

    if (!user.deleteCodeHash || !user.deleteCodeExpires || user.deleteCodeExpires < new Date()) {
      console.log('❌ Code expired or missing for user:', user.username);
      return res.status(400).json({ error: "Code expired. Send a new one." });
    }

    const ok = await bcrypt.compare(code, user.deleteCodeHash);
    console.log('🔐 Code verification result:', ok);
    
    if (!ok) return res.status(400).json({ error: "Wrong code." });

    console.log('✅ Deleting account for user:', user.username);
    await User.findByIdAndDelete(req.userId);
    res.clearCookie("token", { httpOnly: true, sameSite: "none", secure: true, path: "/" });
    console.log('✅ Account deleted successfully for user:', user.username);
    return res.status(204).end();
  } catch (e) {
    console.error("❌ delete/confirm error:", e);
    return res.status(500).json({ error: "Failed to delete account" });
  }
});

// server/routes (auth.js or a new public router)
router.get("/public/dex/:username", async (req, res) => {
  const user = await User.findOne({ username: req.params.username }).lean();
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.profilePrivate) return res.status(403).json({ error: "This dex is private." });

  // Build the same caughtInfoMap shape you use in the app
  const caughtInfoMap = user.caughtInfoMap || {}; // adapt to your schema/source

  res.json({ username: user.username, caughtInfoMap });
});


export default router;
