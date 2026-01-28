import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import { Resend } from "resend";
import dotenv from "dotenv";
import { sendCodeEmail } from "../utils/sendCodeEmail.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { validateContent } from "../contentFilter.js";
import { sanitizeProfileData, sanitizeInput, sanitizeEntryData } from "../sanitizeInput.js";
import { authenticateUser } from "../middleware/authenticateUser.js";

// CORS middleware for auth routes
const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;

  // Allow specific origins
  const allowedOrigins = [
    'https://ultimatedextracker.com',
    'https://www.ultimatedextracker.com',
    'https://ultimate-dex-tracker-pr5vf4mcr-antonics-projects.vercel.app',
    'https://ultimate-dex-tracker.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
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
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const deleteCodeHash = await bcrypt.hash(code, salt);

    await User.findByIdAndUpdate(req.userId, {
      deleteCodeHash,
      deleteCodeExpires: Date.now() + 1000 * 60 * 10 // 10 minutes
    });

    await sendCodeEmail(user, "Delete Your Account", code, "account deletion");

    res.json({ success: true, message: "Delete code sent" });
  } catch (err) {
    console.error('Error sending delete code:', err);
    res.status(500).json({ error: "Failed to send delete code" });
  }
});


// Register
router.post("/register", corsMiddleware, authLimiter, async (req, res) => {
  const { username, email, password, profileTrainer = "ash.png" } = req.body;

  // Sanitize input data
  const usernameResult = sanitizeInput(username, 'username');
  const emailResult = sanitizeInput(email, 'email');
  const trainerResult = sanitizeInput(profileTrainer, 'profileTrainer');

  if (!usernameResult.isValid) {
    return res.status(400).json({ error: usernameResult.error });
  }

  if (!emailResult.isValid) {
    return res.status(400).json({ error: emailResult.error });
  }

  if (!trainerResult.isValid) {
    return res.status(400).json({ error: trainerResult.error });
  }

  const usernameValidation = validateContent(usernameResult.sanitized, 'username');
  if (!usernameValidation.isValid) {
    return res.status(400).json({ error: usernameValidation.error });
  }

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing username, email, or password" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username: usernameResult.sanitized }, { email: emailResult.sanitized }] });
    if (existingUser) {
      return res.status(400).json({ error: "Username or email already taken" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const user = await User.create({
      username: usernameResult.sanitized,
      email: emailResult.sanitized,
      password,
      verified: false,
      profileTrainer: trainerResult.sanitized,
      verificationCode: code,
      verificationCodeExpires: Date.now() + 1000 * 60 * 10 // 10 minutes
    });

    // Send response first, then send email (so email errors don't crash registration)
    res.json({ message: "Account created. Please check your email to verify your account." });

    // Send verification email after response (don't await - let it run in background)
    sendCodeEmail(user, "Verify Your Account", code, "email verification").catch(err => {
      console.error("❌ Email sending failed (but account was created):", err);
      // Don't throw error - account creation was successful
    });

  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", corsMiddleware, authLimiter, async (req, res) => {
  const { usernameOrEmail, password, rememberMe } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (!user.verified) {
      return res.status(403).json({
        error: "Account not verified. Please check your email and verify your account before logging in.",
        needsVerification: true,
        email: user.email
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // iOS Safari specific cookie configuration
    const isIOS = req.headers['user-agent'] && /iPhone|iPad|iPod/i.test(req.headers['user-agent']);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production (HTTPS)
      sameSite: process.env.NODE_ENV === 'production' ? (isIOS ? "none" : "lax") : "lax", // Use "lax" for local development
      maxAge: rememberMe ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 2,
      path: "/",
    };

    // Only set domain for production and non-iOS
    if (process.env.NODE_ENV === 'production' && !isIOS) {
      cookieOptions.domain = '.ultimatedextracker.com';
    }

    const responseData = {
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        profileTrainer: user.profileTrainer,
        verified: true,
      },
      token: token, // Return token for all users (needed for Authorization header)
    };

    res
      .cookie("token", token, cookieOptions)
      .json(responseData);
  } catch (err) {
    console.error('🔥 POST /login - Error:', err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Me
router.get("/me", authenticateUser, async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const user = await User.findById(req.userId).select("-password -__v")
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      profileTrainer: user.profileTrainer,
      verified: user.verified,
      progressBars: user.progressBars || [],
      isAdmin: user.isAdmin,
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

// Check username availability
router.get("/check-username", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username parameter is required" });
  }

  // Sanitize the username
  const usernameResult = sanitizeInput(username, 'username');
  if (!usernameResult.isValid) {
    return res.status(400).json({
      error: usernameResult.error,
      available: false
    });
  }

  try {
    const user = await User.findOne({ username: usernameResult.sanitized });
    const available = !user;

    res.json({
      available,
      username: usernameResult.sanitized,
      message: available ? "Username is available" : "Username is already taken"
    });
  } catch (err) {
    console.error('Error checking username availability:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// Check username change cooldown
router.get("/username-cooldown", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const now = Date.now();
    const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (!user.usernameLastChanged) {
      return res.json({
        canChange: true,
        cooldownRemaining: 0,
        message: "Username can be changed"
      });
    }

    const timeSinceLastChange = now - user.usernameLastChanged.getTime();
    const canChange = timeSinceLastChange >= cooldownPeriod;

    if (canChange) {
      return res.json({
        canChange: true,
        cooldownRemaining: 0,
        message: "Username can be changed"
      });
    } else {
      const timeRemaining = Math.ceil((cooldownPeriod - timeSinceLastChange) / (60 * 60 * 1000));
      return res.json({
        canChange: false,
        cooldownRemaining: timeRemaining,
        message: `On cooldown for ${timeRemaining}h`
      });
    }
  } catch (err) {
    console.error('Error checking username cooldown:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// Verify signup code
router.post("/verify-code", corsMiddleware, async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

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
        secure: process.env.NODE_ENV === 'production', // Only secure in production (HTTPS)
        sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax", // lax for localhost, none for production
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
router.post("/resend-code", corsMiddleware, async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.verified) {
      return res.json({ message: "Already verified" });
    }

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

    res.json({ success: true, message: "Reset code sent" });
  } catch (err) {
    console.error('Error in forgot password:', err);
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

  res.json({ success: true, message: "Reset code verified. You may now reset your password." });
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

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax", // lax for localhost, none for production
    secure: process.env.NODE_ENV === 'production', // Only secure in production (HTTPS)
    path: "/",         // be explicit
  });
  return res.status(204).end(); // no body, prevents caching weirdness
});

// Add this after your existing routes (e.g., in auth.js)
router.put("/profile", authenticateUser, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    // Sanitize all profile data
    const sanitizationResult = sanitizeProfileData(req.body);

    if (!sanitizationResult.isValid) {
      return res.status(400).json({
        error: "Invalid input data",
        details: sanitizationResult.errors
      });
    }

    const sanitizedData = sanitizationResult.sanitized;

    // Update fields with sanitized data
    if (req.body.bio !== undefined) {
      const bioValidation = validateContent(sanitizedData.bio, 'bio');
      if (!bioValidation.isValid) {
        return res.status(400).json({ error: bioValidation.error });
      }
      user.bio = sanitizedData.bio;
    }

    if (req.body.location !== undefined) user.location = sanitizedData.location;
    if (req.body.gender !== undefined) user.gender = sanitizedData.gender;
    if (req.body.favoriteGames !== undefined) user.favoriteGames = sanitizedData.favoriteGames;
    if (req.body.favoritePokemon !== undefined) user.favoritePokemon = sanitizedData.favoritePokemon;
    if (req.body.favoritePokemonShiny !== undefined) user.favoritePokemonShiny = req.body.favoritePokemonShiny;
    if (req.body.switchFriendCode !== undefined) user.switchFriendCode = sanitizedData.switchFriendCode;
    if (req.body.profileTrainer !== undefined) user.profileTrainer = sanitizedData.profileTrainer;

    // Handle profile visibility - saves both true and false
    if ("isProfilePublic" in req.body) {
      user.isProfilePublic = !!req.body.isProfilePublic;
    }

    // Handle dex preferences
    if (req.body.dexPreferences) {
      const { dexPreferences } = req.body;
      if (typeof dexPreferences === 'object') {
        const allowedKeys = [
          'showGenderForms', 'showAlolanForms', 'showGalarianForms', 'showHisuianForms', 'showPaldeanForms', 'showGmaxForms', 'showUnownForms', 'showOtherForms', 'showAlcremieForms', 'showVivillonForms', 'showAlphaForms', 'showAlphaOtherForms', 'blockUnobtainableShinies', 'blockGOExclusiveShinies', 'blockNOOTExclusiveShinies', 'hideLockedShinies', 'dexViewMode'
        ];
        Object.keys(dexPreferences).forEach(key => {
          if (allowedKeys.includes(key)) {
            // Handle boolean preferences
            if (typeof dexPreferences[key] === 'boolean') {
              user.dexPreferences[key] = dexPreferences[key];
            }
            // Handle dexViewMode string preference
            else if (key === 'dexViewMode' && typeof dexPreferences[key] === 'string') {
              const validModes = ['categorized', 'unified'];
              if (validModes.includes(dexPreferences[key])) {
                user.dexPreferences[key] = dexPreferences[key];
              }
            }
          }
        });
      }
    }

    // Handle external link preference
    if (req.body.externalLinkPreference !== undefined) {
      const validPreferences = ['serebii', 'bulbapedia', 'pokemondb', 'smogon'];
      if (validPreferences.includes(req.body.externalLinkPreference)) {
        user.externalLinkPreference = req.body.externalLinkPreference;
      }
    }

    // Handle shiny charm games
    if (req.body.shinyCharmGames !== undefined) {
      if (Array.isArray(req.body.shinyCharmGames)) {
        // Validate that all games are strings and are valid game names
        const validGames = [
          "Black 2", "White 2", "X", "Y", "Omega Ruby", "Alpha Sapphire",
          "Sun", "Moon", "Ultra Sun", "Ultra Moon", "Let's Go Pikachu", "Let's Go Eevee",
          "Sword", "Shield", "Brilliant Diamond", "Shining Pearl", "Legends Arceus",
          "Scarlet", "Violet", "Legends Z-A"
        ];
        user.shinyCharmGames = req.body.shinyCharmGames.filter(game =>
          typeof game === 'string' && validGames.includes(game)
        );
      }
    }

    // Handle migration fields
    if (req.body.huntMethodMigrationCompleted !== undefined) {
      user.huntMethodMigrationCompleted = !!req.body.huntMethodMigrationCompleted;
    }
    if (req.body.migrationVersion !== undefined) {
      user.migrationVersion = String(req.body.migrationVersion);
    }

    await user.save();

    res.json({
      message: "Profile updated", user: {
        bio: user.bio,
        location: user.location,
        gender: user.gender,
        favoriteGames: user.favoriteGames,
        favoritePokemon: user.favoritePokemon,
        favoritePokemonShiny: user.favoritePokemonShiny,
        profileTrainer: user.profileTrainer,
        switchFriendCode: user.switchFriendCode,
        isProfilePublic: user.isProfilePublic,
        dexPreferences: user.dexPreferences,
        externalLinkPreference: user.externalLinkPreference,
        shinyCharmGames: user.shinyCharmGames,
        huntMethodMigrationCompleted: user.huntMethodMigrationCompleted,
        migrationVersion: user.migrationVersion,
      }
    });
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
    const user = await User.findById(req.userId).select("bio location gender favoriteGames favoritePokemon favoritePokemonShiny profileTrainer switchFriendCode isProfilePublic likes dexPreferences externalLinkPreference shinyCharmGames isAdmin");

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
      dexPreferences: user.dexPreferences,
      externalLinkPreference: user.externalLinkPreference,
      shinyCharmGames: user.shinyCharmGames,
      isAdmin: user.isAdmin,
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

// GET /api/caught
router.get("/caught", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Ensure we return a plain object regardless of Map serialization
    const caught = user.caughtPokemon instanceof Map
      ? Object.fromEntries(user.caughtPokemon)
      : (user.caughtPokemon || {});

    res.json(caught);
  } catch (err) {
    console.error('Error getting caught data:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/caught
router.post("/caught", authenticateUser, async (req, res) => {
  try {
    const { caughtMap } = req.body;
    if (!caughtMap) return res.status(400).json({ error: "Caught map is required" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Sanitize caught Pokemon data
    const sanitized = {};
    for (const [key, value] of Object.entries(caughtMap)) {
      if (value !== null && typeof value === 'object') {
        // Sanitize each entry's data
        if (value.entries && Array.isArray(value.entries)) {
          const sanitizedEntries = value.entries.map(entry => {
            const entryResult = sanitizeEntryData(entry);
            return entryResult.isValid ? entryResult.sanitized : entry;
          });
          sanitized[key] = { ...value, entries: sanitizedEntries };
        } else {
          sanitized[key] = value;
        }
      }
    }

    user.caughtPokemon = sanitized;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating caught data:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/caught — apply partial changes: { changes: { key: info|null, ... } }
router.patch("/caught", authenticateUser, async (req, res) => {
  try {
    const { changes } = req.body || {};
    if (!changes || typeof changes !== 'object') {
      return res.status(400).json({ error: "Invalid or missing changes" });
    }

    const setOps = {};
    const unsetOps = {};
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) {
        unsetOps["caughtPokemon." + key] = "";
      } else {
        // Validate notes if present per entry
        if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'notes')) {
          const notesValidation = validateContent(String(value.notes || ''), 'notes');
          if (!notesValidation.isValid) return res.status(400).json({ error: notesValidation.error });
        }
        setOps["caughtPokemon." + key] = value;
      }
    }

    const update = {};
    if (Object.keys(setOps).length) update.$set = setOps;
    if (Object.keys(unsetOps).length) update.$unset = unsetOps;

    if (!Object.keys(update).length) {
      return res.json({ success: true, noop: true });
    }

    const result = await User.updateOne({ _id: req.userId }, update);
    if (result.matchedCount === 0) return res.status(404).json({ error: "User not found" });

    return res.json({ success: true });
  } catch (err) {
    console.error('Error patching caught data:', err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/caught/:key — atomically update a single entry
router.put("/caught/:key", authenticateUser, async (req, res) => {
  try {
    const key = String(req.params.key || "");
    if (!key) return res.status(400).json({ error: "Missing key" });

    // info can be an object or null (to delete)
    const info = Object.prototype.hasOwnProperty.call(req.body, 'info') ? req.body.info : undefined;
    if (typeof info === 'undefined') return res.status(400).json({ error: "Missing info" });

    if (info && typeof info === 'object' && Object.prototype.hasOwnProperty.call(info, 'notes')) {
      const notesValidation = validateContent(String(info.notes || ''), 'notes');
      if (!notesValidation.isValid) return res.status(400).json({ error: notesValidation.error });
    }

    const update = info === null
      ? { $unset: { ["caughtPokemon." + key]: "" } }
      : { $set: { ["caughtPokemon." + key]: info } };

    const result = await User.updateOne({ _id: req.userId }, update);
    if (result.matchedCount === 0) return res.status(404).json({ error: "User not found" });

    return res.json({ success: true });
  } catch (err) {
    console.error('Error updating caught entry:', err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/progressBars
router.get("/progressBars", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user.progressBars || []);
  } catch (err) {
    console.error('Error getting progress bars:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/progressBars
router.put("/progressBars", authenticateUser, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  // Handle both wrapped and unwrapped data structures
  let progressBars = req.body.progressBars || req.body;

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

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.progressBars = progressBars.map(({ __showFilters, ...rest }) => ({
      ...rest,
      filters: rest.filters || {}, // ✅ ensure filters are always saved
    }));

    await user.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving progress bars:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// PUT /api/update-username
router.put("/update-username", authenticateUser, async (req, res) => {

  try {
    const { newUsername } = req.body;

    if (!newUsername || newUsername.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters" });
    }

    const trimmed = String(newUsername).trim();
    const usernameValidation = validateContent(trimmed, 'username');
    if (!usernameValidation.isValid) {
      return res.status(400).json({ error: usernameValidation.error });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check cooldown period (24 hours)
    const now = Date.now();
    const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (user.usernameLastChanged && (now - user.usernameLastChanged.getTime()) < cooldownPeriod) {
      const timeRemaining = Math.ceil((cooldownPeriod - (now - user.usernameLastChanged.getTime())) / (60 * 60 * 1000));
      return res.status(429).json({
        error: `On cooldown for ${timeRemaining}h`,
        cooldownRemaining: timeRemaining
      });
    }

    const existing = await User.findOne({ username: trimmed });
    if (existing) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    user.username = trimmed;
    user.usernameLastChanged = new Date();
    await user.save();

    res.json({ success: true, username: user.username });
  } catch (error) {
    console.error('🔥 PUT /update-username - Error:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Send verification code to current email (before changing email)
router.post("/send-current-email-verification-code", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code with expiration (10 minutes)
    user.emailChangeVerificationCode = code;
    user.emailChangeVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send email to current email
    await sendCodeEmail(user, "Email Change Verification", code, "email change verification");

    res.json({ message: "Verification code sent to your current email" });
  } catch (err) {
    console.error('Error sending current email verification code:', err);
    res.status(500).json({ error: "Failed to send verification code" });
  }
});

// Verify current email code (before changing email)
router.post("/verify-current-email-code", authenticateUser, async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Verification code is required" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.emailChangeVerificationCode || !user.emailChangeVerificationExpires) {
      return res.status(400).json({ error: "No verification code found. Please request a new code." });
    }

    if (new Date() > user.emailChangeVerificationExpires) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new code." });
    }

    if (user.emailChangeVerificationCode !== code) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Mark current email as verified for email change
    user.emailChangeVerified = true;
    await user.save();

    res.json({ success: true, message: "Current email verified successfully" });
  } catch (err) {
    console.error('Error verifying current email code:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// Change email (after current email is verified)
router.put("/change-email", authenticateUser, async (req, res) => {
  const { newEmail, currentPassword } = req.body;

  if (!newEmail || !currentPassword) {
    return res.status(400).json({ error: "Email and current password are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if current email was verified
    if (!user.emailChangeVerified) {
      return res.status(400).json({ error: "Please verify your current email first" });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser && existingUser._id.toString() !== req.userId) {
      return res.status(400).json({ error: "Email is already in use" });
    }

    // Store new email temporarily and generate verification code for new email
    const newEmailCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.pendingEmail = newEmail.toLowerCase();
    user.newEmailVerificationCode = newEmailCode;
    user.newEmailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send verification code to new email
    const tempUser = { ...user.toObject(), email: newEmail.toLowerCase() };
    await sendCodeEmail(tempUser, "Verify Your New Email", newEmailCode, "new email verification");

    res.json({
      success: true,
      message: "Verification code sent to your new email address",
      pendingEmail: user.pendingEmail
    });
  } catch (err) {
    console.error('Error changing email:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// Send verification code to new email (after email change initiated)
router.post("/send-new-email-verification-code", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.pendingEmail) {
      return res.status(400).json({ error: "No pending email change found" });
    }

    // Generate new code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.newEmailVerificationCode = code;
    user.newEmailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send email to new email
    const tempUser = { ...user.toObject(), email: user.pendingEmail };
    await sendCodeEmail(tempUser, "Verify Your New Email", code, "new email verification");

    res.json({ message: "Verification code sent to your new email" });
  } catch (err) {
    console.error('Error sending new email verification code:', err);
    res.status(500).json({ error: "Failed to send verification code" });
  }
});

// Verify new email code and complete email change
router.post("/verify-new-email-code", authenticateUser, async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Verification code is required" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.pendingEmail) {
      return res.status(400).json({ error: "No pending email change found" });
    }

    if (!user.newEmailVerificationCode || !user.newEmailVerificationExpires) {
      return res.status(400).json({ error: "No verification code found. Please request a new code." });
    }

    if (new Date() > user.newEmailVerificationExpires) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new code." });
    }

    if (user.newEmailVerificationCode !== code) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Update email and clear verification fields
    user.email = user.pendingEmail;
    // Mark as verified since we've already verified both current email (ownership) and new email (access)
    user.verified = true;
    user.pendingEmail = undefined;
    user.newEmailVerificationCode = undefined;
    user.newEmailVerificationExpires = undefined;
    user.emailChangeVerified = false; // Reset for next time
    user.emailChangeVerificationCode = undefined;
    user.emailChangeVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Email changed successfully",
      email: user.email,
      verified: user.verified
    });
  } catch (err) {
    console.error('Error verifying new email code:', err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/change-password", authenticateUser, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "New passwords do not match" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) return res.status(400).json({ error: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.findByIdAndUpdate(req.userId, { password: hashedPassword }); // Fix: Bypass pre-save middleware

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error('Error changing password:', err);
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

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error('Emergency password reset error:', err);
    res.status(500).json({ error: "Password reset failed" });
  }
});

// Send password verification code
router.post("/send-password-verification-code", authenticateUser, async (req, res) => {
  try {
    console.log('🔐 Password verification request from user:', req.userId);

    const user = await User.findById(req.userId);
    if (!user) {
      console.error('❌ User not found for password verification:', req.userId);
      return res.status(404).json({ error: "User not found" });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code with expiration (10 minutes)
    user.passwordVerificationCode = code;
    user.passwordVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log('✅ Password verification code generated for user:', user.email);

    // Send email
    await sendCodeEmail(user, "Password Change Verification", code, "password change verification");

    console.log('📧 Password verification email sent to:', user.email);
    res.json({ message: "Verification code sent to your email" });
  } catch (err) {
    console.error('❌ Send password verification code error:', err);
    res.status(500).json({ error: "Failed to send verification code" });
  }
});

// Verify password change code
router.post("/verify-password-code", authenticateUser, async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Verification code is required" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if code exists and is not expired
    if (!user.passwordVerificationCode || !user.passwordVerificationExpires) {
      return res.status(400).json({ error: "No verification code found. Please request a new code." });
    }

    if (new Date() > user.passwordVerificationExpires) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new code." });
    }

    if (user.passwordVerificationCode !== code) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Clear the verification code
    user.passwordVerificationCode = undefined;
    user.passwordVerificationExpires = undefined;
    await user.save();

    res.json({ message: "Verification successful" });
  } catch (err) {
    console.error('Verify password code error:', err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// GET /api/caught/:username/public  -> return that user's caught map if profile is public
router.get("/caught/:username/public", async (req, res) => {
  res.set("Cache-Control", "no-store");

  const u = await User.findOne({
    username: req.params.username,
    isProfilePublic: { $ne: false }
  })
    .select("_id")
    .lean();

  if (!u) return res.status(404).json({ error: "User not found or private" });

  // Adjust this select if your field name differs
  const full = await User.findById(u._id).select("caughtPokemon").lean();
  return res.json(full?.caughtPokemon || {});
});

// GET /api/users/public?query=&page=1&pageSize=24&random=1
router.get("/users/public", async (req, res) => {
  res.set("Cache-Control", "no-store");

  let q = (req.query.query || "").trim();

  // Sanitize search query to prevent injection attacks (XSS, command injection, etc.)
  if (q) {
    const sanitized = sanitizeInput(q, 'general');
    q = sanitized.sanitized;

    // Limit search query length to prevent abuse
    if (q.length > 50) {
      q = q.substring(0, 50);
    }
  }

  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || "24", 10)));
  const random = req.query.random === "1";

  const match = { isProfilePublic: { $ne: false } };
  // Escape regex special characters to prevent regex injection
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
          verified: 1,
          isAdmin: 1,
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
    // Get total count of all matching documents (including verified filter)
    // For random mode without query, we still need the total count
    const total = await User.countDocuments(match);

    res.json({ items, total, page, pageSize });
  } catch (error) {
    console.error('Error getting public users:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/users/:username/public
router.get("/users/:username/public", async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const u = await User.findOne({
      username: req.params.username,
      isProfilePublic: { $ne: false }
    })
      .select("username bio location gender favoriteGames favoritePokemon favoritePokemonShiny profileTrainer createdAt switchFriendCode progressBars likes verified dexPreferences shinyCharmGames isAdmin")
      .lean();

    if (!u) return res.status(404).json({ error: "User not found or private" });

    // Add like count - safely handle undefined likes
    const likeCount = Array.isArray(u.likes) ? u.likes.length : 0;
    res.json({ ...u, likeCount });
  } catch (error) {
    console.error('Error getting public profile:', error);
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
      sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax", // lax for localhost, none for production
      secure: process.env.NODE_ENV === 'production', // Only secure in production (HTTPS)
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
  try {
    const code = String(req.body?.code || "").trim();
    const typed = String(req.body?.confirm || "").trim();

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Invalid code." });
    }

    const user = await User.findById(req.userId).select("username deleteCodeHash deleteCodeExpires");
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Optional: enforce username match server-side (case-insensitive)
    if (typed && typed.toLowerCase() !== user.username.toLowerCase()) {
      return res.status(400).json({ error: "Type your account name exactly to continue." });
    }

    if (!user.deleteCodeHash || !user.deleteCodeExpires || user.deleteCodeExpires < new Date()) {
      return res.status(400).json({ error: "Code expired. Send a new one." });
    }

    const ok = await bcrypt.compare(code, user.deleteCodeHash);
    if (!ok) return res.status(400).json({ error: "Wrong code." });

    await User.findByIdAndDelete(req.userId);
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
      secure: process.env.NODE_ENV === 'production',
      path: "/"
    });
    return res.status(204).end();
  } catch (e) {
    console.error("Delete account confirmation error:", e);
    return res.status(500).json({ error: "Failed to delete account" });
  }
});

// server/routes (auth.js or a new public router)
router.get("/public/dex/:username", async (req, res) => {
  const user = await User.findOne({ username: req.params.username }).lean();
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.isProfilePublic === false) return res.status(403).json({ error: "This dex is private." });

  // Get the caughtPokemon data and convert Map to object if needed
  const caughtPokemon = user.caughtPokemon instanceof Map
    ? Object.fromEntries(user.caughtPokemon)
    : (user.caughtPokemon || {});

  res.json({ username: user.username, caughtPokemon });
});

// GET /api/hunts
router.get("/hunts", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Convert Maps to objects for JSON serialization
    const huntTimers = user.huntTimers instanceof Map
      ? Object.fromEntries(user.huntTimers)
      : (user.huntTimers || {});
    const lastCheckTimes = user.lastCheckTimes instanceof Map
      ? Object.fromEntries(user.lastCheckTimes)
      : (user.lastCheckTimes || {});
    const totalCheckTimes = user.totalCheckTimes instanceof Map
      ? Object.fromEntries(user.totalCheckTimes)
      : (user.totalCheckTimes || {});
    const huntIncrements = user.huntIncrements instanceof Map
      ? Object.fromEntries(user.huntIncrements)
      : (user.huntIncrements || {});

    res.json({
      activeHunts: user.activeHunts || [],
      huntTimers,
      lastCheckTimes,
      totalCheckTimes,
      pausedHunts: user.pausedHunts || [],
      huntIncrements
    });
  } catch (err) {
    console.error('Error getting hunt data:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/hunts
router.put("/hunts", authenticateUser, async (req, res) => {
  try {
    const { activeHunts, huntTimers, lastCheckTimes, totalCheckTimes, pausedHunts, huntIncrements } = req.body;

    // Build update object
    const updateData = {};
    if (activeHunts !== undefined) updateData.activeHunts = activeHunts;
    if (huntTimers !== undefined) updateData.huntTimers = new Map(Object.entries(huntTimers));
    if (lastCheckTimes !== undefined) updateData.lastCheckTimes = new Map(Object.entries(lastCheckTimes));
    if (totalCheckTimes !== undefined) updateData.totalCheckTimes = new Map(Object.entries(totalCheckTimes));
    if (pausedHunts !== undefined) updateData.pausedHunts = pausedHunts;
    if (huntIncrements !== undefined) updateData.huntIncrements = new Map(Object.entries(huntIncrements));

    // Use findByIdAndUpdate for atomic operation to prevent race conditions
    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating hunt data:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/migrate-hunt-methods (Bulk migration endpoint)
router.post("/migrate-hunt-methods", authenticateUser, async (req, res) => {
  try {
    // Get the requesting user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(403).json({ error: "User not found" });
    }

    // Get all users who haven't been migrated
    const usersToMigrate = await User.find({
      huntMethodMigrationCompleted: { $ne: true }
    });

    let migrationResults = {
      totalUsers: usersToMigrate.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Import migration function (you'll need to implement this server-side)
    for (const userToMigrate of usersToMigrate) {
      try {
        // Run migration for each user
        const caughtData = userToMigrate.caughtPokemon;
        if (caughtData && Object.keys(caughtData).length > 0) {
          // Apply migration logic here (you'll need to port the client-side logic)
          // For now, just mark as migrated
          await User.findByIdAndUpdate(userToMigrate._id, {
            huntMethodMigrationCompleted: true,
            migrationVersion: "1.1"
          });
          migrationResults.successful++;
        }
      } catch (error) {
        migrationResults.failed++;
        migrationResults.errors.push({
          username: userToMigrate.username,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Migration completed: ${migrationResults.successful} successful, ${migrationResults.failed} failed`,
      results: migrationResults
    });
  } catch (err) {
    console.error('Error running bulk migration:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// ADMIN ROUTES ----------------------------------------- //

// TEMPORARY: Make yourself admin (remove this after use)
router.post("/make-me-admin", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isAdmin = true;
    await user.save();

    res.json({
      message: "You are now an admin!",
      isAdmin: user.isAdmin
    });
  } catch (error) {
    console.error('Error making user admin:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/assign-admin - Assign admin status to a user
router.post("/assign-admin", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { username, isAdmin } = req.body;

    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ error: "isAdmin must be a boolean" });
    }

    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent removing your own admin status
    if (targetUser._id.toString() === req.userId && !isAdmin) {
      return res.status(400).json({ error: "Cannot remove your own admin status" });
    }

    targetUser.isAdmin = isAdmin;
    await targetUser.save();

    res.json({
      message: `User ${username} ${isAdmin ? 'granted' : 'removed'} admin status`,
      user: {
        username: targetUser.username,
        isAdmin: targetUser.isAdmin
      }
    });
  } catch (error) {
    console.error('Error assigning admin status:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/users - Get all users (admin only)
router.get("/admin/users", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'username email isAdmin verified createdAt')
      .sort({ createdAt: -1 })
      .limit(100); // Limit to prevent large responses

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/bug-reports - Get all bug reports (admin only)
router.get("/admin/bug-reports", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const BugReport = (await import('../models/BugReport.js')).default;
    const bugReports = await BugReport.find({
      $or: [
        { type: 'bug' },
        { type: { $exists: false } } // Include old records without type field
      ]
    })
      .populate('submittedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to prevent large responses

    res.json({ bugReports });
  } catch (error) {
    console.error('Error fetching bug reports:', error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/feature-requests", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const BugReport = (await import('../models/BugReport.js')).default;
    const featureRequests = await BugReport.find({ type: 'feature' })
      .populate('submittedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to prevent large responses

    res.json({ featureRequests });
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/admin/update-report-status/:id - Update report status (admin only)
router.patch("/admin/update-report-status/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const BugReport = (await import('../models/BugReport.js')).default;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['open', 'resolved'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updateData = { status };
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    const updatedReport = await BugReport.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ message: "Report status updated successfully", report: updatedReport });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/admin/delete-report/:id - Delete a bug report or feature request (admin only)
router.delete("/admin/delete-report/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const BugReport = (await import('../models/BugReport.js')).default;
    const { id } = req.params;

    const deletedReport = await BugReport.findByIdAndDelete(id);

    if (!deletedReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
