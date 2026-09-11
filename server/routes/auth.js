import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import { Resend } from "resend";
import dotenv from "dotenv";
import { sendCodeEmail } from "../utils/sendCodeEmail.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { validateContent } from "../contentFilter.js";
import { sanitizeProfileData, sanitizeInput, sanitizeEntryData } from "../sanitizeInput.js";
import { authenticateUser, markUserSuspended, unmarkUserSuspended } from "../middleware/authenticateUser.js";
import CreatorRequest from "../models/CreatorRequest.js";
import RecentCatch from "../models/RecentCatch.js";
import LinkedProvider from "../models/LinkedProvider.js";
import BugReport from "../models/BugReport.js";
import { broadcastNewCatch } from "./recentCatches.js";
import { notifyOverlayStream } from "./streamerTools.js";
import { isValidPokemonKey } from "../utils/validPokemonKeys.js";
import { moderateImage } from "../utils/sightengine.js";
import { 
  getUserEntitlements,
  getMembershipBadgeInfo, 
  getBatchMembershipBadgeInfo, 
  grantAdminPremium, 
  revokeAdminPremium, 
  getAdminUserEntitlementDetails 
} from "../utils/entitlementService.js";
import { optimizeAvatar } from "../utils/avatarOptimizer.js";
import { getSystemTelemetry } from "../utils/metricsCollector.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NOTE: Vercel serverless has a read-only filesystem.
// Avatars are stored as base64 data URIs in MongoDB instead of on disk.

// Multer memory storage for in-memory moderation before writing to disk
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB max upload limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, WebP, and GIF images are allowed."));
    }
  },
});

const router = express.Router();

dotenv.config();
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function normalizeYoutubeUrl(input) {
  if (!input) return "";
  let str = String(input).trim();
  if (!str) return "";

  if (/^(https?:\/\/)?(www\.)?youtu\.be\//i.test(str)) {
    return str.startsWith("http") ? str : `https://${str}`;
  }
  if (/^(https?:\/\/)?(www\.)?youtube\.com\/(channel\/|c\/)/i.test(str)) {
    return str.startsWith("http") ? str : `https://${str}`;
  }

  const ytMatch = str.match(/^(?:https?:\/\/)?(?:www\.)?youtube\.com\/@?([a-zA-Z0-9_.\-]+)/i);
  if (ytMatch && ytMatch[1]) {
    return `https://youtube.com/@${ytMatch[1]}`;
  }

  const handle = str.replace(/^@/, "").replace(/^\/+/, "").trim();
  if (handle) {
    return `https://youtube.com/@${handle}`;
  }
  return "";
}

function normalizeTwitchUrl(input) {
  if (!input) return "";
  let str = String(input).trim();
  if (!str) return "";

  const twMatch = str.match(/^(?:https?:\/\/)?(?:www\.)?twitch\.tv\/@?([a-zA-Z0-9_]+)/i);
  if (twMatch && twMatch[1]) {
    return `https://twitch.tv/${twMatch[1]}`;
  }

  const handle = str.replace(/^@/, "").replace(/^\/+/, "").trim();
  if (handle) {
    return `https://twitch.tv/${handle}`;
  }
  return "";
}

const gen6 = () => Math.floor(100000 + Math.random() * 900000).toString(); // "123456"

const sendEmailWithTimeout = async (sendPromise, timeoutMs = 7000) => {
  let timeoutId;
  const timeoutPromise = new Promise(resolve => {
    timeoutId = setTimeout(() => resolve({ timedOut: true }), timeoutMs);
  });

  try {
    const result = await Promise.race([
      sendPromise.then((data) => ({ data })),
      timeoutPromise
    ]);

    if (result && result.timedOut) {
      return { timedOut: true };
    }

    return { timedOut: false, data: result?.data };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

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

router.post("/account/reset-collection/send", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const resetCollectionCodeHash = await bcrypt.hash(code, salt);

    await User.findByIdAndUpdate(req.userId, {
      resetCollectionCodeHash,
      resetCollectionCodeExpires: Date.now() + 1000 * 60 * 10 // 10 minutes
    });

    await sendCodeEmail(user, "Reset Your Collection Data", code, "reset collection");

    res.json({ success: true, message: "Reset code sent" });
  } catch (err) {
    console.error('Error sending reset collection code:', err);
    res.status(500).json({ error: "Failed to send reset code" });
  }
});


// Register
router.post("/register", authLimiter, async (req, res) => {
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
      verificationCodeExpires: Date.now() + 1000 * 60 * 10, // 10 minutes
      onboarding: {
        isComplete: false,
        tutorialStep: 0
      }
    });

    let emailSent = true;
    try {
      // Await in serverless so the function doesn't exit early
      await sendCodeEmail(user, "Verify Your Account", code, "email verification");
    } catch (err) {
      emailSent = false;
      console.error("❌ Email sending failed (account created):", err);
    }

    res.json({
      message: "Account created. Please check your email to verify your account.",
      emailSent,
    });

  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", authLimiter, async (req, res) => {
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

    if (!user.password) {
      return res.status(400).json({ error: "This account was created with Google or Discord. Please log in using that button, or set a password in Account Settings." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    // Block suspended accounts from logging in
    if (user.isSuspended) {
      return res.status(403).json({
        error: "ACCOUNT_SUSPENDED",
        message: "Your account has been suspended.",
        reason: user.suspendedReason || "Violation of community guidelines or terms of service."
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: rememberMe ? "30d" : "2h",
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

    const membershipInfo = await getMembershipBadgeInfo(user._id);

    const responseData = {
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        hasPassword: Boolean(user.password),
        createdAt: user.createdAt,
        profileTrainer: user.profileTrainer,
        nameColor1: membershipInfo.isPremium ? (user.nameColor1 || user.nameGradientColor1 || null) : null,
        nameColor2: membershipInfo.isPremium ? (user.nameColor2 || user.nameGradientColor2 || null) : null,
        avatar: user.avatar || null,
        verified: true,
        isAdmin: Boolean(user.isAdmin),
        isContentCreator: Boolean(user.isContentCreator),
        isPremium: Boolean(membershipInfo.isPremium),
        premiumMonths: membershipInfo.premiumMonths || 0,
        premiumSince: membershipInfo.premiumSince || null,
        youtubeUrl: user.youtubeUrl || null,
        twitchUrl: user.twitchUrl || null,
        dexPreferences: user.dexPreferences || null,
        isProfilePublic: user.isProfilePublic !== false,
        onboarding: user.onboarding,
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
router.get("/me", async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    if (!token) {
      token = req.cookies.token;
    }
    
    if (!token) return res.status(200).json({ authenticated: false });

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      return res.status(200).json({ authenticated: false });
    }

    const [user, membershipInfo] = await Promise.all([
      User.findById(userId).select("-__v"),
      getMembershipBadgeInfo(userId),
    ]);
    if (!user) return res.status(200).json({ authenticated: false });

    // If account has been suspended, clear session cookies and return suspension notice
    if (user.isSuspended) {
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

      return res.status(200).json({
        authenticated: false,
        isSuspended: true,
        suspendedReason: user.suspendedReason || "Violation of community guidelines or terms of service."
      });
    }

    res.json({
      username: user.username,
      email: user.email,
      hasPassword: Boolean(user.password),
      createdAt: user.createdAt,
      profileTrainer: user.profileTrainer,
      nameColor1: membershipInfo.isPremium ? (user.nameColor1 || user.nameGradientColor1 || null) : null,
      nameColor2: membershipInfo.isPremium ? (user.nameColor2 || user.nameGradientColor2 || null) : null,
      avatar: user.avatar || null,
      verified: user.verified,
      progressBars: user.progressBars || [],
      isAdmin: user.isAdmin,
      isContentCreator: user.isContentCreator || false,
      isPremium: Boolean(membershipInfo.isPremium),
      premiumMonths: membershipInfo.premiumMonths || 0,
      premiumSince: membershipInfo.premiumSince || null,
      youtubeUrl: user.youtubeUrl || null,
      twitchUrl: user.twitchUrl || null,
      onboarding: user.onboarding,
      needsProfileSetup: Boolean(user.needsProfileSetup),
      isProfilePublic: user.isProfilePublic !== false,
      isGlobalFeedPublic: user.isGlobalFeedPublic !== false,
      isLeaderboardPublic: user.isLeaderboardPublic !== false,
      isFriendCodesPublic: user.isFriendCodesPublic !== false,
      isStatsPublic: user.isStatsPublic !== false,
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
router.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;
  const trimmedCode = String(code || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !trimmedCode) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.verified) return res.json({ message: "Already verified" });

    const now = Date.now();
    const isCurrentMatch = user.verificationCode === trimmedCode && user.verificationCodeExpires && user.verificationCodeExpires > now;
    const isPreviousMatch = user.previousVerificationCode === trimmedCode && user.previousVerificationCodeExpires && user.previousVerificationCodeExpires > now;

    if (!isCurrentMatch && !isPreviousMatch) {
      if ((user.verificationCode && user.verificationCodeExpires && user.verificationCodeExpires <= now) ||
        (user.previousVerificationCode && user.previousVerificationCodeExpires && user.previousVerificationCodeExpires <= now)) {
        return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
      }
      return res.status(400).json({ error: "Invalid verification code" });
    }

    user.verified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.previousVerificationCode = undefined;
    user.previousVerificationCodeExpires = undefined;
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const isIOS = req.headers['user-agent'] && /iPhone|iPad|iPod/i.test(req.headers['user-agent']);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? (isIOS ? "none" : "lax") : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/",
    };

    if (process.env.NODE_ENV === 'production' && !isIOS) {
      cookieOptions.domain = '.ultimatedextracker.com';
    }

    const membershipInfo = await getMembershipBadgeInfo(user._id);

    res
      .cookie("token", token, cookieOptions)
      .json({
        message: "Email verified successfully",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          hasPassword: Boolean(user.password),
          profileTrainer: user.profileTrainer,
          nameColor1: user.nameColor1 || user.nameGradientColor1 || null,
          nameColor2: user.nameColor2 || user.nameGradientColor2 || null,
          avatar: user.avatar || null,
          createdAt: user.createdAt,
          verified: true,
          isAdmin: user.isAdmin,
          isPremium: Boolean(membershipInfo.isPremium),
          premiumMonths: membershipInfo.premiumMonths || 0,
          premiumSince: membershipInfo.premiumSince || null,
          onboarding: user.onboarding,
          needsProfileSetup: Boolean(user.needsProfileSetup),
        },
        token,
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Resend verification code
router.post("/resend-code", async (req, res) => {
  const { email } = req.body;

  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return res.status(400).json({ error: "Email is required" });

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.verified) {
      return res.json({ message: "Already verified" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Keep the previous code valid briefly in case emails arrive out of order
    user.previousVerificationCode = user.verificationCode;
    user.previousVerificationCodeExpires = Date.now() + 1000 * 60 * 10; // 10 minutes
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
      console.warn(`[PUT /api/profile] Validation failed for user ${req.userId}:`, sanitizationResult.errors);
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
    if (req.body.birthday !== undefined) user.birthday = sanitizedData.birthday;
    if (req.body.favoriteGames !== undefined) user.favoriteGames = sanitizedData.favoriteGames;
    if (req.body.favoritePokemon !== undefined) user.favoritePokemon = sanitizedData.favoritePokemon;
    if (req.body.favoritePokemonShiny !== undefined) user.favoritePokemonShiny = req.body.favoritePokemonShiny;
    if (req.body.favoriteBalls !== undefined) user.favoriteBalls = sanitizedData.favoriteBalls;
    if (req.body.favoriteTrainers !== undefined) user.favoriteTrainers = sanitizedData.favoriteTrainers;
    if (req.body.switchFriendCode !== undefined) user.switchFriendCode = sanitizedData.switchFriendCode;
    if (req.body.goFriendCode !== undefined) user.goFriendCode = sanitizedData.goFriendCode;
    if (req.body.profileTrainer !== undefined) user.profileTrainer = sanitizedData.profileTrainer;

    // Premium features gating
    const userEntitlements = await getUserEntitlements(user._id);
    const isUserPremium = userEntitlements.includes("premium");

    if (isUserPremium) {
      if (req.body.nameColor1 !== undefined) user.nameColor1 = sanitizedData.nameColor1 || null;
      if (req.body.nameColor2 !== undefined) user.nameColor2 = sanitizedData.nameColor2 || null;
      if (req.body.nameGradientColor1 !== undefined) user.nameGradientColor1 = sanitizedData.nameGradientColor1 || null;
      if (req.body.nameGradientColor2 !== undefined) user.nameGradientColor2 = sanitizedData.nameGradientColor2 || null;
      if (req.body.favoriteCategoryOrder !== undefined) {
        user.favoriteCategoryOrder = Array.isArray(req.body.favoriteCategoryOrder)
          ? req.body.favoriteCategoryOrder.slice(0, 4)
          : [];
      }
    } else {
      // Non-premium user: reset gradient colors and cap favorite categories to 2
      user.nameColor1 = null;
      user.nameColor2 = null;
      user.nameGradientColor1 = null;
      user.nameGradientColor2 = null;
      if (req.body.favoriteCategoryOrder !== undefined) {
        user.favoriteCategoryOrder = Array.isArray(req.body.favoriteCategoryOrder)
          ? req.body.favoriteCategoryOrder.slice(0, 2)
          : [];
      } else if (Array.isArray(user.favoriteCategoryOrder) && user.favoriteCategoryOrder.length > 2) {
        user.favoriteCategoryOrder = user.favoriteCategoryOrder.slice(0, 2);
      }
    }

    if (req.body.avatar !== undefined) user.avatar = sanitizedData.avatar;
    if (req.body.huntHotkey !== undefined) user.huntHotkey = sanitizedData.huntHotkey;

    // Handle profile visibility - saves both true and false
    if ("isProfilePublic" in req.body) {
      user.isProfilePublic = !!req.body.isProfilePublic;
    }
    if ("isGlobalFeedPublic" in req.body) {
      user.isGlobalFeedPublic = !!req.body.isGlobalFeedPublic;
      if (!user.isGlobalFeedPublic) {
        try {
          await RecentCatch.deleteMany({ username: user.username });
        } catch (cleanErr) {
          console.error("Error clearing recent catches:", cleanErr);
        }
      }
    }
    if ("isLeaderboardPublic" in req.body) {
      user.isLeaderboardPublic = !!req.body.isLeaderboardPublic;
    }
    if ("isFriendCodesPublic" in req.body) {
      user.isFriendCodesPublic = !!req.body.isFriendCodesPublic;
    }
    if ("isStatsPublic" in req.body) {
      user.isStatsPublic = !!req.body.isStatsPublic;
    }

    // Handle dex preferences
    if (req.body.dexPreferences) {
      const { dexPreferences } = req.body;
      if (typeof dexPreferences === 'object') {
        const allowedKeys = [
          'showGenderForms', 'showAlolanForms', 'showGalarianForms', 'showHisuianForms', 'showPaldeanForms', 'showGmaxForms', 'showUnownForms', 'showOtherForms', 'showAlcremieForms', 'showVivillonForms', 'showAlphaForms', 'showAlphaOtherForms', 'showMightyForms', 'blockUnobtainableShinies', 'blockGOExclusiveShinies', 'blockNOOTExclusiveShinies', 'hideLockedShinies', 'useHomeSprites', 'dexViewMode'
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

    // Handle accent color
    if (req.body.accentColor !== undefined) {
      const validAccents = ['yellow', 'red', 'orange', 'green', 'lime', 'blue', 'cyan', 'purple', 'lavender', 'pink', 'brown', 'platinum'];
      if (validAccents.includes(req.body.accentColor)) {
        user.accentColor = req.body.accentColor;
      }
    }

    // Handle site theme
    if (req.body.siteTheme !== undefined) {
      const validThemes = ['light', 'dark', 'system'];
      if (validThemes.includes(req.body.siteTheme)) {
        user.siteTheme = req.body.siteTheme;
      }
    }

    // Handle migration fields
    if (req.body.huntMethodMigrationCompleted !== undefined) {
      user.huntMethodMigrationCompleted = !!req.body.huntMethodMigrationCompleted;
    }
    if (req.body.migrationVersion !== undefined) {
      user.migrationVersion = String(req.body.migrationVersion);
    }

    // Handle creator channel URLs (only if user is an approved content creator)
    if (user.isContentCreator) {
      if (req.body.youtubeUrl !== undefined) {
        const yt = normalizeYoutubeUrl(req.body.youtubeUrl);
        user.youtubeUrl = yt || null;
      }
      if (req.body.twitchUrl !== undefined) {
        const tw = normalizeTwitchUrl(req.body.twitchUrl);
        user.twitchUrl = tw || null;
      }
    }

    // Handle onboarding state
    if (req.body.onboarding) {
      const { onboarding } = req.body;
      if (typeof onboarding === 'object') {
        if (typeof onboarding.isComplete === 'boolean') {
          user.onboarding.isComplete = onboarding.isComplete;
        }
        if (typeof onboarding.tutorialStep === 'number') {
          user.onboarding.tutorialStep = onboarding.tutorialStep;
        }
      }
    }

    await user.save();

    const membershipInfo = await getMembershipBadgeInfo(user._id);

    res.json({
      message: "Profile updated", user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        location: user.location,
        gender: user.gender,
        favoriteGames: user.favoriteGames,
        favoritePokemon: user.favoritePokemon,
        favoritePokemonShiny: user.favoritePokemonShiny,
        favoriteBalls: user.favoriteBalls,
        favoriteTrainers: user.favoriteTrainers,
        favoriteCategoryOrder: user.favoriteCategoryOrder || [],
        profileTrainer: user.profileTrainer,
        nameColor1: membershipInfo.isPremium ? (user.nameColor1 || user.nameGradientColor1 || null) : null,
        nameColor2: membershipInfo.isPremium ? (user.nameColor2 || user.nameGradientColor2 || null) : null,
        nameGradientColor1: membershipInfo.isPremium ? (user.nameGradientColor1 || user.nameColor1 || null) : null,
        nameGradientColor2: membershipInfo.isPremium ? (user.nameGradientColor2 || user.nameColor2 || null) : null,
        avatar: user.avatar || null,
        switchFriendCode: user.switchFriendCode,
        goFriendCode: user.goFriendCode,
        isProfilePublic: user.isProfilePublic,
        dexPreferences: user.dexPreferences,
        externalLinkPreference: user.externalLinkPreference,
        shinyCharmGames: user.shinyCharmGames,
        huntHotkey: user.huntHotkey,
        huntMethodMigrationCompleted: user.huntMethodMigrationCompleted,
        migrationVersion: user.migrationVersion,
        accentColor: user.accentColor || 'yellow',
        siteTheme: user.siteTheme || 'dark',
        onboarding: user.onboarding,
        isAdmin: user.isAdmin,
        isContentCreator: user.isContentCreator || false,
        isPremium: Boolean(membershipInfo.isPremium),
        premiumMonths: membershipInfo.premiumMonths || 0,
        premiumSince: membershipInfo.premiumSince || null,
        youtubeUrl: user.youtubeUrl || null,
        twitchUrl: user.twitchUrl || null,
      }
    });
  } catch (err) {
    console.error('🔥 PUT /profile - Error:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/users/avatar - Upload and moderate custom profile avatar with Sightengine & Sharp
router.post("/users/avatar", authenticateUser, (req, res, next) => {
  avatarUpload.single("avatar")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Image is too large. Maximum file size is 8MB for GIFs and 5MB for static images." });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided." });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    // Check membership status for GIF / animated upload permissions
    const membershipInfo = await getMembershipBadgeInfo(req.userId);
    const isPremium = Boolean(membershipInfo.isPremium || user.isAdmin);

    // AI Content Moderation via Sightengine on raw upload
    const moderation = await moderateImage(req.file.buffer, req.file.mimetype, req.file.originalname);
    if (!moderation.approved) {
      return res.status(400).json({
        error: moderation.reason || "Image cannot be used as a profile picture due to inappropriate content."
      });
    }

    // Image optimization: resize to max 256x256, convert GIFs/static to WebP, enforce limits
    let optimizationResult;
    try {
      optimizationResult = await optimizeAvatar(req.file.buffer, req.file.mimetype, isPremium);
    } catch (optErr) {
      const status = optErr.statusCode || 400;
      return res.status(status).json({
        error: optErr.message || "Failed to process image."
      });
    }

    // Store optimized lightweight data URI directly in MongoDB
    user.avatar = optimizationResult.dataUri;
    await user.save();

    res.json({
      message: "Profile picture uploaded and optimized successfully!",
      avatar: optimizationResult.dataUri,
      isAnimated: optimizationResult.isAnimated,
    });
  } catch (err) {
    console.error("🔥 Error uploading avatar:", err);
    res.status(500).json({ error: err.message || "Failed to upload profile picture." });
  }
});

// DELETE /api/users/avatar - Remove custom profile avatar
router.delete("/users/avatar", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    // No disk file to delete — avatar is stored as base64 in MongoDB.

    const defaults = [
      "/data/default_profile_pictures/butterfree.png",
      "/data/default_profile_pictures/celebi.png",
      "/data/default_profile_pictures/charizard.png",
      "/data/default_profile_pictures/ditto.png",
      "/data/default_profile_pictures/gardevoir.png",
      "/data/default_profile_pictures/gengar.png",
      "/data/default_profile_pictures/guzzlord.png",
      "/data/default_profile_pictures/gyarados.png",
      "/data/default_profile_pictures/lucario.png",
      "/data/default_profile_pictures/metagross.png",
      "/data/default_profile_pictures/mew.png",
      "/data/default_profile_pictures/mewtwo.png",
      "/data/default_profile_pictures/noctowl.png",
      "/data/default_profile_pictures/pikachu.png",
      "/data/default_profile_pictures/psyduck.png",
      "/data/default_profile_pictures/rayquaza.png",
      "/data/default_profile_pictures/shaymin.png"
    ];
    const defaultAvatar = defaults[Math.floor(Math.random() * defaults.length)];
    user.avatar = defaultAvatar;
    await user.save();

    res.json({
      message: "Profile picture reset to default.",
      avatar: defaultAvatar,
    });
  } catch (err) {
    console.error("🔥 Error removing avatar:", err);
    res.status(500).json({ error: "Failed to remove profile picture." });
  }
});

// GET /api/profile
router.get("/profile", authenticateUser, async (req, res) => {
  res.set("Cache-Control", "no-store");
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const [user, membershipInfo] = await Promise.all([
      User.findById(req.userId).select("bio location gender birthday favoriteGames favoritePokemon favoritePokemonShiny favoriteBalls favoriteTrainers favoriteCategoryOrder profileTrainer nameColor1 nameColor2 nameGradientColor1 nameGradientColor2 avatar switchFriendCode goFriendCode isProfilePublic isGlobalFeedPublic isLeaderboardPublic isFriendCodesPublic isStatsPublic likes dexPreferences externalLinkPreference shinyCharmGames huntHotkey isAdmin accentColor siteTheme isContentCreator youtubeUrl twitchUrl lastActiveAt"),
      getMembershipBadgeInfo(req.userId),
    ]);

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      bio: user.bio,
      location: user.location,
      gender: user.gender,
      birthday: user.birthday || null,
      favoriteGames: user.favoriteGames,
      favoritePokemon: user.favoritePokemon,
      favoritePokemonShiny: user.favoritePokemonShiny,
      favoriteBalls: user.favoriteBalls,
      favoriteTrainers: user.favoriteTrainers,
      favoriteCategoryOrder: user.favoriteCategoryOrder || [],
      profileTrainer: user.profileTrainer,
      nameColor1: membershipInfo.isPremium ? (user.nameColor1 || user.nameGradientColor1 || null) : null,
      nameColor2: membershipInfo.isPremium ? (user.nameColor2 || user.nameGradientColor2 || null) : null,
      nameGradientColor1: membershipInfo.isPremium ? (user.nameGradientColor1 || user.nameColor1 || null) : null,
      nameGradientColor2: membershipInfo.isPremium ? (user.nameGradientColor2 || user.nameColor2 || null) : null,
      avatar: user.avatar || null,
      switchFriendCode: user.switchFriendCode,
      goFriendCode: user.goFriendCode,
      isProfilePublic: user.isProfilePublic,
      isGlobalFeedPublic: user.isGlobalFeedPublic !== false,
      isLeaderboardPublic: user.isLeaderboardPublic !== false,
      isFriendCodesPublic: user.isFriendCodesPublic !== false,
      isStatsPublic: user.isStatsPublic !== false,
      likeCount: user.likes ? user.likes.length : 0,
      dexPreferences: user.dexPreferences,
      externalLinkPreference: user.externalLinkPreference,
      shinyCharmGames: user.shinyCharmGames,
      huntHotkey: user.huntHotkey,
      isAdmin: user.isAdmin,
      accentColor: user.accentColor || 'yellow',
      siteTheme: user.siteTheme || 'dark',
      isContentCreator: user.isContentCreator || false,
      isPremium: Boolean(membershipInfo.isPremium),
      premiumMonths: membershipInfo.premiumMonths || 0,
      premiumSince: membershipInfo.premiumSince || null,
      youtubeUrl: user.youtubeUrl || null,
      twitchUrl: user.twitchUrl || null,
      lastActiveAt: user.lastActiveAt,
      isOnline: true,
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

    // Sanitize and validate caught Pokemon data
    const sanitized = {};
    for (const [key, value] of Object.entries(caughtMap)) {
      if (value !== null && typeof value === 'object') {
        if (!isValidPokemonKey(key)) {
          console.warn(`[SECURITY] Blocked invalid caughtPokemon key: "${key}"`);
          continue;
        }
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

    if (Object.keys(sanitized).length === 0 && user.username) {
      try {
        await RecentCatch.deleteMany({ username: user.username });
      } catch (cleanErr) {
        console.error("Error clearing recent catches on bulk wipe:", cleanErr);
      }
    }

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
        if (!isValidPokemonKey(key)) {
          console.warn(`[SECURITY] Blocked invalid caughtPokemon PATCH key: "${key}"`);
          continue;
        }
        // Validate notes and nickname if present in entries
        if (value && typeof value === 'object' && value.entries && Array.isArray(value.entries)) {
          for (const entry of value.entries) {
            if (entry.notes) {
              const notesValidation = validateContent(String(entry.notes || ''), 'notes');
              if (!notesValidation.isValid) return res.status(400).json({ error: notesValidation.error });
            }
            if (entry.nickname) {
              const nicknameValidation = validateContent(String(entry.nickname || ''), 'nickname');
              if (!nicknameValidation.isValid) return res.status(400).json({ error: nicknameValidation.error });
            }
          }
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

const START_BINGO_YEAR = 2026;

function getBingoYearsData(user) {
  const currentYear = new Date().getFullYear();
  if (!user.bingoYears) {
    user.bingoYears = new Map();
  }

  // Ensure map format if stored as plain object
  const yearsMap = user.bingoYears instanceof Map
    ? user.bingoYears
    : new Map(Object.entries(user.bingoYears || {}));

  // Migration: If 2026 is not yet in bingoYears, initialize it from legacy bingoGrid / bingoQuote
  if (!yearsMap.has(String(START_BINGO_YEAR))) {
    const quoteText = user.bingoQuote?.text && user.bingoQuote.text !== "Good luck and happy hunting!"
      ? user.bingoQuote.text
      : `${START_BINGO_YEAR} is my year for shiny hunting!`;
    yearsMap.set(String(START_BINGO_YEAR), {
      grid: user.bingoGrid && user.bingoGrid.length > 0 ? user.bingoGrid : [],
      quote: {
        text: quoteText,
        author: user.bingoQuote?.author || ""
      }
    });
  }

  // Check if currentYear is beyond START_BINGO_YEAR (e.g. 2027+) and not yet initialized
  if (currentYear > START_BINGO_YEAR && !yearsMap.has(String(currentYear))) {
    yearsMap.set(String(currentYear), {
      grid: [],
      quote: {
        text: `${currentYear} is my year for shiny hunting!`,
        author: ""
      }
    });
  }

  // Convert to plain object for JSON response and easily extract available years
  const yearsObj = {};
  for (const [y, data] of yearsMap.entries()) {
    yearsObj[y] = {
      grid: Array.isArray(data.grid) ? data.grid : [],
      quote: {
        text: data.quote?.text || `${y} is my year for shiny hunting!`,
        author: data.quote?.author || ""
      }
    };
  }

  // Available years: sorted descending (e.g. [2027, 2026])
  const yearNumbers = Object.keys(yearsObj).map(Number);
  if (!yearNumbers.includes(START_BINGO_YEAR)) yearNumbers.push(START_BINGO_YEAR);
  if (!yearNumbers.includes(currentYear)) yearNumbers.push(currentYear);
  const availableYears = Array.from(new Set(yearNumbers)).sort((a, b) => b - a);

  // Sync back to user.bingoYears
  user.bingoYears = yearsMap;

  return { currentYear, availableYears, yearsObj };
}

// GET /api/bingo
router.get("/bingo", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { currentYear, availableYears, yearsObj } = getBingoYearsData(user);

    if (user.isModified('bingoYears')) {
      await user.save();
    }

    const requestedYear = req.query.year ? parseInt(req.query.year, 10) : currentYear;
    const selectedYear = availableYears.includes(requestedYear) ? requestedYear : currentYear;
    const activeData = yearsObj[String(selectedYear)] || {
      grid: [],
      quote: { text: `${selectedYear} is my year for shiny hunting!`, author: "" }
    };

    res.json({
      currentYear,
      selectedYear,
      availableYears,
      years: yearsObj,
      grid: activeData.grid,
      bingoQuote: activeData.quote
    });
  } catch (err) {
    console.error('Error getting bingo data:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/bingo
router.put("/bingo", authenticateUser, async (req, res) => {
  try {
    const { bingoData, bingoQuote, year } = req.body;
    if (bingoData && !Array.isArray(bingoData)) {
      return res.status(400).json({ error: "Invalid bingo data format" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { currentYear, availableYears, yearsObj } = getBingoYearsData(user);

    const targetYear = year ? parseInt(year, 10) : currentYear;
    const yearKey = String(targetYear);

    // Get existing year data
    const existingYearData = yearsObj[yearKey] || {
      grid: [],
      quote: { text: `${targetYear} is my year for shiny hunting!`, author: "" }
    };

    const newGrid = Array.isArray(bingoData) ? bingoData : existingYearData.grid;
    let newQuote = existingYearData.quote;
    if (bingoQuote && typeof bingoQuote === 'object') {
      newQuote = {
        text: String(bingoQuote.text || `${targetYear} is my year for shiny hunting!`).slice(0, 200),
        author: String(bingoQuote.author || '').slice(0, 50)
      };
    }

    // Save to user.bingoYears
    if (!user.bingoYears) user.bingoYears = new Map();
    user.bingoYears.set(yearKey, {
      grid: newGrid,
      quote: newQuote
    });

    // If updating current active year, keep top-level bingoGrid & bingoQuote updated for compatibility
    if (targetYear === currentYear) {
      user.bingoGrid = newGrid;
      user.bingoQuote = newQuote;
    }

    await user.save();

    // Re-serialize updated years
    const updatedYearsObj = {};
    for (const [y, data] of user.bingoYears.entries()) {
      updatedYearsObj[y] = {
        grid: Array.isArray(data.grid) ? data.grid : [],
        quote: {
          text: data.quote?.text || `${y} is my year for shiny hunting!`,
          author: data.quote?.author || ""
        }
      };
    }

    res.json({
      success: true,
      currentYear,
      selectedYear: targetYear,
      availableYears,
      years: updatedYearsObj,
      grid: newGrid,
      bingoQuote: newQuote
    });
  } catch (err) {
    console.error('Error updating bingo data:', err);
    res.status(500).json({ error: "Server error" });
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

    // Validate key against canonical dataset
    if (info !== null && !isValidPokemonKey(key)) {
      console.warn(`[SECURITY] Blocked invalid caughtPokemon PUT key: "${key}"`);
      return res.status(400).json({ error: `Invalid Pokémon key: "${key}"` });
    }

    if (info && typeof info === 'object' && info.entries && Array.isArray(info.entries)) {
      for (const entry of info.entries) {
        if (entry.notes) {
          const notesValidation = validateContent(String(entry.notes || ''), 'notes');
          if (!notesValidation.isValid) return res.status(400).json({ error: notesValidation.error });
        }
        if (entry.nickname) {
          const nicknameValidation = validateContent(String(entry.nickname || ''), 'nickname');
          if (!nicknameValidation.isValid) return res.status(400).json({ error: nicknameValidation.error });
        }
      }
    }

    const update = info === null
      ? { $unset: { ["caughtPokemon." + key]: "" } }
      : { $set: { ["caughtPokemon." + key]: info } };

    const result = await User.updateOne({ _id: req.userId }, update);
    if (result.matchedCount === 0) return res.status(404).json({ error: "User not found" });

    // Handle Recent Catches broadcast
    const newCatchTrigger = Object.prototype.hasOwnProperty.call(req.body, 'newCatchTrigger') ? req.body.newCatchTrigger : null;
    
    if (newCatchTrigger && newCatchTrigger.pokemonName && newCatchTrigger.sprite && newCatchTrigger.username) {
      try {
        // Enforce feed privacy: do NOT broadcast or record catches if user has disabled global feed
        const currentUser = await User.findById(req.userId).select("isGlobalFeedPublic username avatar").lean();
        if (currentUser && currentUser.isGlobalFeedPublic === false) {
          return res.json({ success: true });
        }

        const now = Date.now();
        
        // Duplicate Toggle Prevention: No exact matches within the last 30 seconds
        const duplicateCheck = await RecentCatch.findOne({
          username: newCatchTrigger.username,
          pokemonName: newCatchTrigger.pokemonName,
          formName: newCatchTrigger.formName || null,
          caughtAt: { $gt: new Date(now - 30 * 1000) }
        }).lean();

        if (!duplicateCheck) {
          const recentCatch = new RecentCatch({
            pokemonName: newCatchTrigger.pokemonName,
            formName: newCatchTrigger.formName || null,
            sprite: newCatchTrigger.sprite,
            username: newCatchTrigger.username,
            profileTrainer: newCatchTrigger.profileTrainer || null,
            avatar: currentUser?.avatar || newCatchTrigger.avatar || null
          });
          await recentCatch.save();
          
          // Broadcast to all connected clients
          broadcastNewCatch(recentCatch);
        } else {
          console.log(`[Anti-Spam] Skipped feed broadcast for ${newCatchTrigger.username} (${newCatchTrigger.pokemonName})`);
        }
      } catch (catchErr) {
        console.error("Error saving/broadcasting recent catch:", catchErr);
      }
    }

    // Handle removing from recent catches feed when uncaught
    const removeCatchTrigger = Object.prototype.hasOwnProperty.call(req.body, 'removeCatchTrigger') ? req.body.removeCatchTrigger : null;
    if (removeCatchTrigger && removeCatchTrigger.username && removeCatchTrigger.pokemonName) {
      try {
        const deleteQuery = {
          username: removeCatchTrigger.username,
          pokemonName: removeCatchTrigger.pokemonName,
        };
        if (removeCatchTrigger.formName !== undefined) {
          deleteQuery.formName = removeCatchTrigger.formName;
        }
        await RecentCatch.deleteMany(deleteQuery);
      } catch (delErr) {
        console.error("Error removing catch from feed:", delErr);
      }
    }

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

    // Send email to current email (avoid timeouts in serverless)
    const sendPromise = sendCodeEmail(user, "Email Change Verification", code, "email change verification");
    const { timedOut } = await sendEmailWithTimeout(sendPromise);
    if (timedOut) {
      sendPromise.catch(err => console.error('Email send failed after timeout:', err));
      return res.json({ message: "Verification email is being sent. If it doesn't arrive, resend.", emailQueued: true });
    }

    res.json({ message: "Verification code sent to your current email", emailQueued: false });
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

  if (!newEmail) {
    return res.status(400).json({ error: "Email is required" });
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

    // Verify current password only if user has a password set
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required" });
      }
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
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

    // Send verification code to new email (avoid timeouts in serverless)
    const tempUser = { ...user.toObject(), email: newEmail.toLowerCase() };
    const sendPromise = sendCodeEmail(tempUser, "Verify Your New Email", newEmailCode, "new email verification");
    const { timedOut } = await sendEmailWithTimeout(sendPromise);
    if (timedOut) {
      sendPromise.catch(err => console.error('Email send failed after timeout:', err));
      return res.json({
        success: true,
        message: "Verification email is being sent. If it doesn't arrive, resend.",
        pendingEmail: user.pendingEmail,
        emailQueued: true
      });
    }

    res.json({
      success: true,
      message: "Verification code sent to your new email address",
      pendingEmail: user.pendingEmail,
      emailQueued: false
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

    // Send email to new email (avoid timeouts in serverless)
    const tempUser = { ...user.toObject(), email: user.pendingEmail };
    const sendPromise = sendCodeEmail(tempUser, "Verify Your New Email", code, "new email verification");
    const { timedOut } = await sendEmailWithTimeout(sendPromise);
    if (timedOut) {
      sendPromise.catch(err => console.error('Email send failed after timeout:', err));
      return res.json({ message: "Verification email is being sent. If it doesn't arrive, resend.", emailQueued: true });
    }

    res.json({ message: "Verification code sent to your new email", emailQueued: false });
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

  if (!newPassword || !confirmPassword) {
    return res.status(400).json({ error: "New password and confirmation are required" });
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

    // If user already has a password set, verify current password
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required" });
      }
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) return res.status(400).json({ error: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.findByIdAndUpdate(req.userId, { password: hashedPassword });

    res.json({
      success: true,
      message: user.password ? "Password changed successfully" : "Password set successfully",
      hasPassword: true,
    });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// Emergency password reset endpoint removed — was unauthenticated and unsafe for production.

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
    isProfilePublic: { $ne: false },
    isSuspended: { $ne: true }
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
  const scope = req.query.scope;

  let match;
  if (scope === "leaderboard") {
    match = { isLeaderboardPublic: { $ne: false }, isSuspended: { $ne: true } };
  } else {
    match = { isProfilePublic: { $ne: false }, isSuspended: { $ne: true } };
  }

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
          nameColor1: 1,
          nameColor2: 1,
          nameGradientColor1: 1,
          nameGradientColor2: 1,
          avatar: 1,
          bio: 1,
          location: 1,
          gender: 1,
          createdAt: 1,
          verified: 1,
          isAdmin: 1,
          isContentCreator: 1,
          isProfilePublic: { $ne: ["$isProfilePublic", false] },
          isLeaderboardPublic: { $ne: ["$isLeaderboardPublic", false] },
          // count regular non-shiny entries (does not contain _shiny)
          regularCaught: {
            $size: {
              $filter: {
                input: { $objectToArray: { $ifNull: ["$caughtPokemon", {}] } },
                as: "c",
                cond: {
                  $and: [
                    { $ne: ["$$c.v", null] },
                    { $not: { $regexMatch: { input: "$$c.k", regex: "(_shiny|-s$)" } } }
                  ]
                }
              }
            }
          },
          // count shiny entries (contains _shiny or -s)
          shinyCount: {
            $size: {
              $filter: {
                input: { $objectToArray: { $ifNull: ["$caughtPokemon", {}] } },
                as: "c",
                cond: {
                  $and: [
                    { $ne: ["$$c.v", null] },
                    { $regexMatch: { input: "$$c.k", regex: "(_shiny|-s$)" } }
                  ]
                }
              }
            }
          },
          // total entries in caughtPokemon (regular + shiny)
          totalCaught: {
            $size: {
              $filter: {
                input: { $objectToArray: { $ifNull: ["$caughtPokemon", {}] } },
                as: "c",
                cond: { $ne: ["$$c.v", null] }
              }
            }
          },
          // shinies (alias for shinyCount)
          shinies: {
            $size: {
              $filter: {
                input: { $objectToArray: { $ifNull: ["$caughtPokemon", {}] } },
                as: "c",
                cond: {
                  $and: [
                    { $ne: ["$$c.v", null] },
                    { $regexMatch: { input: "$$c.k", regex: "(_shiny|-s$)" } }
                  ]
                }
              }
            }
          },
          // count likes
          likes: { $size: { $ifNull: ["$likes", []] } }
        }
      }
    ];

    const items = await User.aggregate(base);
    const badgeMap = await getBatchMembershipBadgeInfo(items.map((i) => i._id));
    const itemsWithBadges = items.map((item) => {
      const badge = badgeMap.get(item._id.toString());
      return {
        ...item,
        nameColor1: item.nameColor1 || item.nameGradientColor1 || null,
        nameColor2: item.nameColor2 || item.nameGradientColor2 || null,
        isPremium: Boolean(badge?.isPremium),
        premiumMonths: badge?.premiumMonths || 0,
      };
    });

    // Get total count of all matching documents (including verified filter)
    // For random mode without query, we still need the total count
    const total = await User.countDocuments(match);

    res.json({ items: itemsWithBadges, total, page, pageSize });
  } catch (error) {
    console.error('Error getting public users:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Helper to check if requester has valid admin credentials
async function checkRequesterIsAdmin(req) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      if (decoded && decoded.userId) {
        const requester = await User.findById(decoded.userId).select('isAdmin').lean();
        return Boolean(requester && requester.isAdmin);
      }
    }
  } catch (e) {
    // Ignore invalid tokens
  }
  return false;
}

// GET /api/users/:username/public
router.get("/users/:username/public", async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const u = await User.findOne({
      username: req.params.username
    })
      .select("username bio location gender birthday favoriteGames favoritePokemon favoritePokemonShiny favoriteBalls favoriteTrainers favoriteCategoryOrder profileTrainer nameColor1 nameColor2 nameGradientColor1 nameGradientColor2 avatar createdAt switchFriendCode goFriendCode progressBars likes verified dexPreferences shinyCharmGames isAdmin bingoGrid isContentCreator youtubeUrl twitchUrl lastActiveAt isProfilePublic isGlobalFeedPublic isLeaderboardPublic isStatsPublic isSuspended suspendedReason")
      .lean();

    if (!u) return res.status(404).json({ error: "User not found" });

    const [requesterIsAdmin, membershipInfo] = await Promise.all([
      checkRequesterIsAdmin(req),
      getMembershipBadgeInfo(u._id),
    ]);

    // Handle suspended profiles: admins can view for moderation, regular users receive 403
    if (u.isSuspended) {
      if (!requesterIsAdmin) {
        return res.status(403).json({
          error: "TARGET_USER_SUSPENDED",
          code: "TARGET_USER_SUSPENDED",
          message: "This trainer's account has been suspended.",
          isSuspended: true
        });
      }
    }

    if (u.isProfilePublic === false && !requesterIsAdmin) {
      return res.status(200).json({
        username: u.username,
        isProfilePublic: false,
        isPrivate: true,
        createdAt: u.createdAt,
      });
    }

    // Safely check if bingo grid has any data
    const hasBingoData = Boolean(
      u.bingoGrid &&
      Array.isArray(u.bingoGrid) &&
      u.bingoGrid.length > 0 &&
      u.bingoGrid.some(cell => 
        (cell.pokemonList && cell.pokemonList.length > 0) ||
        cell.pokemon ||
        cell.completed ||
        (cell.text && cell.text.trim() !== '')
      )
    );

    // Remove bingoGrid from response to avoid sending the whole grid here
    delete u.bingoGrid;

    // Add like count - safely handle undefined likes
    const likeCount = Array.isArray(u.likes) ? u.likes.length : 0;

    // Determine online status (within 5 minutes)
    const isOnline = Boolean(u.lastActiveAt && (Date.now() - new Date(u.lastActiveAt).getTime() < 5 * 60 * 1000));

    res.json({
      ...u,
      isPremium: Boolean(membershipInfo.isPremium),
      premiumMonths: membershipInfo.premiumMonths || 0,
      premiumSince: membershipInfo.premiumSince || null,
      likeCount,
      hasBingoData,
      isOnline,
      ...(u.isProfilePublic === false && requesterIsAdmin ? { isPrivateAdminView: true, isPrivate: true } : {})
    });
  } catch (error) {
    console.error('Error getting public profile:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/account  — permanently delete the current user
router.delete("/account", authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(userId).select("username");
    if (!user) return res.status(404).json({ error: "User not found" });

    // Cascade deletion & anonymization across all collections
    await User.findByIdAndDelete(userId);
    await LinkedProvider.deleteMany({ userId });
    await CreatorRequest.deleteMany({ userId });
    if (user.username) {
      await RecentCatch.deleteMany({ username: user.username });
    }
    await BugReport.updateMany({ submittedBy: userId }, { $set: { submittedBy: null } });
    await User.updateMany({ likes: userId }, { $pull: { likes: userId } });

    // kill auth cookie
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
      secure: process.env.NODE_ENV === 'production',
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

    // Cascade deletion & anonymization across all collections
    await User.findByIdAndDelete(req.userId);
    await LinkedProvider.deleteMany({ userId: req.userId });
    await CreatorRequest.deleteMany({ userId: req.userId });
    if (user.username) {
      await RecentCatch.deleteMany({ username: user.username });
    }
    await BugReport.updateMany({ submittedBy: req.userId }, { $set: { submittedBy: null } });
    await User.updateMany({ likes: req.userId }, { $pull: { likes: req.userId } });

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

// Confirm code and reset all collection data for the account
router.post("/account/reset-collection/confirm", authenticateUser, async (req, res) => {
  try {
    const code = String(req.body?.code || "").trim();
    const typed = String(req.body?.confirm || "").trim();

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Invalid code." });
    }

    const user = await User.findById(req.userId).select("username resetCollectionCodeHash resetCollectionCodeExpires");
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (typed && typed.toLowerCase() !== user.username.toLowerCase()) {
      return res.status(400).json({ error: "Type your account name exactly to continue." });
    }

    if (!user.resetCollectionCodeHash || !user.resetCollectionCodeExpires || user.resetCollectionCodeExpires < new Date()) {
      return res.status(400).json({ error: "Code expired. Send a new one." });
    }

    const ok = await bcrypt.compare(code, user.resetCollectionCodeHash);
    if (!ok) return res.status(400).json({ error: "Wrong code." });

    // Wipe all collection and hunt data for this user
    await User.findByIdAndUpdate(req.userId, {
      $set: {
        caughtPokemon: new Map(),
        progressBars: [],
        bingoGrid: [],
        activeHunts: [],
        huntTimers: new Map(),
        lastCheckTimes: new Map(),
        totalCheckTimes: new Map(),
        pausedHunts: [],
        huntIncrements: new Map(),
        shinyCharmGames: [],
        resetCollectionCodeHash: null,
        resetCollectionCodeExpires: null
      }
    });

    // Wipe recent catches from feed/leaderboard
    if (user.username) {
      await RecentCatch.deleteMany({ username: user.username });
    }

    return res.json({ success: true, message: "All collection data has been reset successfully." });
  } catch (e) {
    console.error("Reset collection confirmation error:", e);
    return res.status(500).json({ error: "Failed to reset collection data" });
  }
});

// server/routes (auth.js or a new public router)
router.get("/public/dex/:username", async (req, res) => {
  const user = await User.findOne({ username: req.params.username }).lean();
  if (!user) return res.status(404).json({ error: "User not found" });
  
  const requesterIsAdmin = await checkRequesterIsAdmin(req);
  if (user.isProfilePublic === false && !requesterIsAdmin) {
    return res.status(403).json({ error: "This dex is private." });
  }

  // Get the caughtPokemon data and convert Map to object if needed
  const caughtPokemon = user.caughtPokemon instanceof Map
    ? Object.fromEntries(user.caughtPokemon)
    : (user.caughtPokemon || {});

  res.json({ username: user.username, caughtPokemon });
});

// GET /public/bingo/:username
router.get("/public/bingo/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const requesterIsAdmin = await checkRequesterIsAdmin(req);
    if (user.isProfilePublic === false && !requesterIsAdmin) {
      return res.status(403).json({ error: "This profile is private." });
    }

    const { currentYear, availableYears, yearsObj } = getBingoYearsData(user);
    if (user.isModified('bingoYears')) {
      await user.save();
    }

    const requestedYear = req.query.year ? parseInt(req.query.year, 10) : currentYear;
    const selectedYear = availableYears.includes(requestedYear) ? requestedYear : currentYear;
    const activeData = yearsObj[String(selectedYear)] || {
      grid: [],
      quote: { text: `${selectedYear} is my year for shiny hunting!`, author: "" }
    };

    res.json({
      username: user.username,
      currentYear,
      selectedYear,
      availableYears,
      years: yearsObj,
      grid: activeData.grid,
      bingoQuote: activeData.quote
    });
  } catch (err) {
    console.error('Error getting public bingo data:', err);
    res.status(500).json({ error: "Server error" });
  }
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
      currentHuntId: user.currentHuntId || null,
      huntTimers,
      lastCheckTimes,
      totalCheckTimes,
      pausedHunts: user.pausedHunts || [],
      huntIncrements,
      mmoSettings: user.mmoSettings || {}
    });
  } catch (err) {
    console.error('Error getting hunt data:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/hunts
router.put("/hunts", authenticateUser, async (req, res) => {
  try {
    const { activeHunts, currentHuntId, huntTimers, lastCheckTimes, totalCheckTimes, pausedHunts, huntIncrements, mmoSettings } = req.body;

    // Build update object
    const updateData = {};
    if (activeHunts !== undefined) updateData.activeHunts = activeHunts;
    if (currentHuntId !== undefined) updateData.currentHuntId = currentHuntId;
    if (huntTimers && typeof huntTimers === "object") updateData.huntTimers = new Map(Object.entries(huntTimers));
    if (lastCheckTimes && typeof lastCheckTimes === "object") updateData.lastCheckTimes = new Map(Object.entries(lastCheckTimes));
    if (totalCheckTimes && typeof totalCheckTimes === "object") updateData.totalCheckTimes = new Map(Object.entries(totalCheckTimes));
    if (pausedHunts !== undefined) updateData.pausedHunts = pausedHunts;
    if (huntIncrements && typeof huntIncrements === "object") updateData.huntIncrements = new Map(Object.entries(huntIncrements));
    if (mmoSettings !== undefined) updateData.mmoSettings = mmoSettings;

    // Use findByIdAndUpdate for atomic operation to prevent race conditions
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    // Notify active overlay streams of the updated hunt state
    notifyOverlayStream(req.userId, "HUNT_DATA_CHANGED", { currentHuntId: user.currentHuntId });

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating hunt data:', err);
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

// POST /api/migrate-hunt-methods (Bulk migration endpoint - admin only)
router.post("/migrate-hunt-methods", authenticateUser, requireAdmin, async (req, res) => {
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
    const rawUsers = await User.find({}, 'username email isAdmin verified createdAt bio isContentCreator avatar profileTrainer lastActiveAt isSuspended suspendedReason location favoriteGames favoritePokemon favoriteBalls favoriteTrainers')
      .sort({ createdAt: -1 })
      .lean();

    const userIds = rawUsers.map(u => u._id);
    const entitlementMap = await getAdminUserEntitlementDetails(userIds);

    const users = rawUsers.map(u => {
      let createdAt = u.createdAt;
      if (!createdAt && u._id) {
        try {
          const timestamp = parseInt(u._id.toString().substring(0, 8), 16) * 1000;
          if (!isNaN(timestamp) && timestamp > 0) {
            createdAt = new Date(timestamp);
          }
        } catch (e) {
          // ignore
        }
      }
      const entInfo = entitlementMap.get(u._id.toString()) || {
        isPremium: false,
        premiumSource: 'none',
        premiumExpiresAt: null,
        adminGrant: null,
        subscription: null
      };

      return {
        ...u,
        createdAt: createdAt || new Date(),
        lastActiveAt: u.lastActiveAt || createdAt || new Date(),
        isPremium: entInfo.isPremium,
        premiumSource: entInfo.premiumSource,
        premiumExpiresAt: entInfo.premiumExpiresAt,
        adminGrant: entInfo.adminGrant,
        subscription: entInfo.subscription
      };
    });

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/users/:id/grant-premium - Grant or update admin premium entitlement (admin only)
router.post("/admin/users/:id/grant-premium", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { grantType = "months", months = 1, days = 30, untilDate = null, note = "" } = req.body;

    const user = await User.findById(id).select("username");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const entitlement = await grantAdminPremium({
      userId: id,
      grantType,
      months,
      days,
      untilDate,
      grantedBy: req.userId,
      note,
    });

    const detailsMap = await getAdminUserEntitlementDetails([id]);
    const userEnt = detailsMap.get(id.toString());

    res.json({
      message: `Premium granted successfully to @${user.username}`,
      entitlement,
      userEnt,
    });
  } catch (error) {
    console.error("Error granting admin premium:", error);
    res.status(500).json({ error: error.message || "Failed to grant premium" });
  }
});

// POST /api/admin/users/:id/revoke-premium - Revoke admin-granted premium entitlement (admin only)
router.post("/admin/users/:id/revoke-premium", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("username");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await revokeAdminPremium(id);

    const detailsMap = await getAdminUserEntitlementDetails([id]);
    const userEnt = detailsMap.get(id.toString());

    res.json({
      message: `Admin-granted premium revoked for @${user.username}`,
      userEnt,
    });
  } catch (error) {
    console.error("Error revoking admin premium:", error);
    res.status(500).json({ error: error.message || "Failed to revoke admin premium" });
  }
});

// POST /api/admin/users/:id/suspend - Suspend or unsuspend a user (admin only)
router.post("/admin/users/:id/suspend", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isSuspended, reason } = req.body;
    
    if (id === req.userId && isSuspended) {
      return res.status(400).json({ error: "You cannot suspend your own account" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isSuspended: !!isSuspended, suspendedReason: isSuspended ? (reason || 'Suspended by administrator') : null },
      { new: true }
    ).select('username isSuspended suspendedReason');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Synchronize real-time in-memory suspension cache
    if (isSuspended) {
      markUserSuspended(id, reason || 'Suspended by administrator');
    } else {
      unmarkUserSuspended(id);
    }

    res.json({ 
      message: `User ${user.username} is now ${user.isSuspended ? 'suspended' : 'active'}`, 
      user 
    });
  } catch (error) {
    console.error("Error updating user suspension:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/admin/users/:id - Delete a user account (admin only)
router.delete("/admin/users/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === req.userId) {
      return res.status(400).json({ error: "You cannot delete your own account from admin panel" });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Clean up user's recent catches
    const RecentCatch = (await import('../models/RecentCatch.js')).default;
    await RecentCatch.deleteMany({ username: targetUser.username });
    
    await User.findByIdAndDelete(id);

    res.json({ message: `User ${targetUser.username} has been deleted permanently.` });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/system-stats - System health, real-time performance telemetry, and database latency (admin only)
router.get("/admin/system-stats", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const telemetry = await getSystemTelemetry();
    res.json(telemetry);
  } catch (error) {
    console.error("GET /api/admin/system-stats error:", error);
    res.status(500).json({ error: "Failed to fetch system stats" });
  }
});

// PATCH /api/admin/users/:id/profile - Update a user's profile info (admin only)
router.patch("/admin/users/:id/profile", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { bio, username, isContentCreator, avatar, email } = req.body;
    const updates = {};

    if (typeof bio === 'string') {
      updates.bio = bio;
    }

    if (typeof isContentCreator === 'boolean') {
      updates.isContentCreator = isContentCreator;
    }

    if (avatar === null || avatar === '') {
      updates.avatar = null;
    } else if (typeof avatar === 'string') {
      updates.avatar = avatar;
    }

    if (typeof username === 'string' && username.trim() !== '') {
      const trimmedUsername = username.trim();
      
      // Check if another user already has this username (case-insensitive)
      const existingUser = await User.findOne({ 
        username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') }, 
        _id: { $ne: id } 
      });

      if (existingUser) {
        return res.status(400).json({ error: "Username is already taken" });
      }
      updates.username = trimmedUsername;
    }

    if (typeof email === 'string' && email.trim() !== '') {
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Check if another user already has this email (case-insensitive)
      const existingEmailUser = await User.findOne({ 
        email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') }, 
        _id: { $ne: id } 
      });

      if (existingEmailUser) {
        return res.status(400).json({ error: "Email is already in use by another user" });
      }
      updates.email = trimmedEmail;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      bio: updatedUser.bio,
      username: updatedUser.username,
      email: updatedUser.email,
      isContentCreator: updatedUser.isContentCreator,
      avatar: updatedUser.avatar
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
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

// GET /api/admin/help-tickets - Get all customer support / help tickets (admin only)
router.get("/admin/help-tickets", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const BugReport = (await import('../models/BugReport.js')).default;
    const helpTickets = await BugReport.find({ type: 'help' })
      .populate('submittedBy', 'username')
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(50); // Limit to prevent large responses

    res.json({ helpTickets });
  } catch (error) {
    console.error('Error fetching help tickets:', error);
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
// GET /api/admin/support/inbox - Unified Support Inbox for all ticket types (admin only)
router.get("/admin/support/inbox", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const BugReport = (await import('../models/BugReport.js')).default;
    const { type, status, priority, search, limit = 100, page = 1 } = req.query;

    const query = {};

    // Filter by type
    if (type && type !== 'all') {
      query.type = type;
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Filter by status
    if (status && status !== 'all') {
      if (status === 'open') {
        // Tickets that are still active/in progress
        query.status = { $nin: ['resolved', 'fixed', 'completed', 'closed', 'declined'] };
      } else if (status === 'awaiting_user') {
        query.status = 'awaiting_user';
      } else if (status === 'awaiting_staff') {
        query.status = { $in: ['awaiting_staff', 'reported', 'submitted', 'new', 'investigating', 'under_review'] };
      } else if (status === 'resolved') {
        query.status = { $in: ['resolved', 'fixed', 'completed'] };
      } else if (status === 'closed') {
        query.status = { $in: ['closed', 'declined'] };
      } else {
        query.status = status;
      }
    }

    // Search
    if (search && search.trim()) {
      const s = search.trim();
      const num = parseInt(s.replace(/^#/, ''), 10);
      const searchConditions = [
        { title: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } },
        { category: { $regex: s, $options: 'i' } },
      ];
      if (!isNaN(num)) {
        searchConditions.push({ reportId: num });
      }
      query.$or = searchConditions;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
    const skip = (pageNum - 1) * limitNum;

    const [tickets, totalCount, openCount, awaitingStaffCount, awaitingUserCount, resolvedCount] = await Promise.all([
      BugReport.find(query)
        .populate('submittedBy', 'username avatar email')
        .sort({ lastActivityAt: -1, updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      BugReport.countDocuments({}),
      BugReport.countDocuments({ status: { $nin: ['resolved', 'fixed', 'completed', 'closed', 'declined'] } }),
      BugReport.countDocuments({ status: { $in: ['awaiting_staff', 'reported', 'submitted', 'new', 'investigating', 'under_review'] } }),
      BugReport.countDocuments({ status: 'awaiting_user' }),
      BugReport.countDocuments({ status: { $in: ['resolved', 'fixed', 'completed'] } }),
    ]);

    const processedTickets = tickets.map(t => {
      const obj = typeof t.toObject === 'function' ? t.toObject() : { ...t };
      let realLastActivity = obj.lastActivityAt;
      if (Array.isArray(obj.messages) && obj.messages.length > 0) {
        const lastMsg = obj.messages[obj.messages.length - 1];
        if (lastMsg && lastMsg.createdAt) {
          realLastActivity = lastMsg.createdAt;
        }
      } else if (!realLastActivity) {
        realLastActivity = obj.updatedAt || obj.createdAt;
      }
      obj.lastActivityAt = realLastActivity;
      return obj;
    });

    res.json({
      tickets: processedTickets,
      metrics: {
        totalCount,
        openCount,
        awaitingStaffCount,
        awaitingUserCount,
        resolvedCount
      },
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('Error fetching support inbox:', error);
    res.status(500).json({ error: "Server error" });
  }
});


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

let cachedSettings = null;
let lastSettingsFetch = 0;

// GET /api/site-settings - Fetches global site settings (public)
router.get("/site-settings", async (req, res) => {
  try {
    const now = Date.now();
    if (cachedSettings && now - lastSettingsFetch < 10000) {
      return res.json(cachedSettings);
    }
    
    const SiteSettings = (await import('../models/SiteSettings.js')).default;
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({ maintenanceMode: false });
    }
    
    cachedSettings = settings;
    lastSettingsFetch = now;
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/admin/site-settings - Updates global site settings (admin only)
router.put("/admin/site-settings", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { maintenanceMode, maintenanceStartTime } = req.body;
    const SiteSettings = (await import('../models/SiteSettings.js')).default;
    
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings();
    }
    
    if (typeof maintenanceMode !== 'undefined') {
      settings.maintenanceMode = !!maintenanceMode;
      // When disabling maintenance mode, clear the trigger time.
      if (!maintenanceMode) {
         settings.maintenanceStartTime = null;
      }
    }
    
    if (typeof maintenanceStartTime !== 'undefined') {
      settings.maintenanceStartTime = maintenanceStartTime;
      // If we are setting a future time, we should also set maintenanceMode to true
      // It acts as a scheduled mode.
      if (maintenanceStartTime !== null) {
          settings.maintenanceMode = true;
      }
    }
    
    await settings.save();
    cachedSettings = settings;
    lastSettingsFetch = Date.now();
    res.json({ message: "Site settings updated", settings });
  } catch (error) {
    console.error('Error updating site settings:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT CREATOR REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/creator-request — submit a new creator application
router.post("/creator-request", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Already a creator
    if (user.isContentCreator) {
      return res.status(400).json({ error: "You are already a Content Creator." });
    }

    // Check for existing pending request
    const existing = await CreatorRequest.findOne({ userId: req.userId, status: 'pending' });
    if (existing) {
      return res.status(400).json({ error: "You already have a pending request." });
    }

    // Check for a rejected request within the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentRejected = await CreatorRequest.findOne({
      userId: req.userId,
      status: 'rejected',
      resolvedAt: { $gte: thirtyDaysAgo }
    }).sort({ resolvedAt: -1 });

    if (recentRejected) {
      const daysLeft = Math.ceil((recentRejected.resolvedAt.getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
      return res.status(400).json({ error: `Your previous request was rejected. You must wait ${daysLeft} more day(s) before applying again.` });
    }

    const { youtubeUrl, twitchUrl, contentType, subscriberCount } = req.body;

    if (!contentType || !subscriberCount) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (!youtubeUrl && !twitchUrl) {
      return res.status(400).json({ error: "At least one channel URL (YouTube or Twitch) is required." });
    }

    const normYt = normalizeYoutubeUrl(youtubeUrl);
    const normTw = normalizeTwitchUrl(twitchUrl);

    if (youtubeUrl && !normYt) {
      return res.status(400).json({ error: "Invalid YouTube URL or handle. Example: @YourChannel" });
    }
    if (twitchUrl && !normTw) {
      return res.status(400).json({ error: "Invalid Twitch URL or handle. Example: yourchannel" });
    }

    const lastReq = await CreatorRequest.findOne({}, {}, { sort: { requestId: -1 } });
    const nextId = lastReq ? lastReq.requestId + 1 : 1;

    const creatorReq = new CreatorRequest({
      requestId: nextId,
      username: user.username,
      userId: req.userId,
      youtubeUrl: normYt || null,
      twitchUrl: normTw || null,
      contentType: String(contentType).trim().slice(0, 200),
      subscriberCount: String(subscriberCount).trim().slice(0, 100),
    });
    await creatorReq.save();

    res.status(201).json({ message: "Request submitted successfully." });
  } catch (err) {
    console.error("POST /creator-request error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/creator-request/status — get the current user's request status
router.get("/creator-request/status", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("isContentCreator youtubeUrl twitchUrl");
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.isContentCreator) {
      return res.json({ status: 'approved', isContentCreator: true, youtubeUrl: user.youtubeUrl, twitchUrl: user.twitchUrl });
    }

    const req_ = await CreatorRequest.findOne({ userId: req.userId }).sort({ submittedAt: -1 });
    if (!req_) return res.json({ status: 'none' });

    res.json({ status: req_.status, submittedAt: req_.submittedAt, adminNotes: req_.adminNotes });
  } catch (err) {
    console.error("GET /creator-request/status error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/creator-requests — admin: list all creator requests
router.get("/admin/creator-requests", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const query = status === 'all' ? {} : { status };
    const requests = await CreatorRequest.find(query).sort({ submittedAt: -1 });
    res.json({ requests });
  } catch (err) {
    console.error("GET /admin/creator-requests error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/admin/creator-requests/:id — admin: approve or reject
router.patch("/admin/creator-requests/:id", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'approved' or 'rejected'." });
    }

    const creatorReq = await CreatorRequest.findById(req.params.id);
    if (!creatorReq) return res.status(404).json({ error: "Request not found." });

    creatorReq.status = status;
    creatorReq.adminNotes = adminNotes || null;
    creatorReq.resolvedAt = new Date();
    await creatorReq.save();

    // If approved, grant the user creator status and copy the URLs
    if (status === 'approved') {
      await User.findByIdAndUpdate(creatorReq.userId, {
        isContentCreator: true,
        youtubeUrl: creatorReq.youtubeUrl,
        twitchUrl: creatorReq.twitchUrl,
      });
    }

    res.json({ message: `Request ${status}.` });
  } catch (err) {
    console.error("PATCH /admin/creator-requests/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
