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
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
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
  user.deleteCodeHash = await bcrypt.hash(code, 10);
  user.deleteCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  await sendCodeEmail(user, "Delete account code", code, "deletion");
}

// throttle: allow resends every 60s
router.post("/account/delete/send", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("email deleteCodeExpires");
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!user.email) return res.status(400).json({ error: "Add an email to your account first." });

    const now = Date.now();
    // if previous code exists and was sent within ~60s (≈ >9m left of the 10m window), block
    if (user.deleteCodeExpires && user.deleteCodeExpires.getTime() - now > 9 * 60 * 1000) {
      return res.status(429).json({ error: "Please wait before requesting another code." });
    }

    await issueDeleteCode(user);
    return res.status(204).end();
  } catch (e) {
    console.error("delete/send", e);
    return res.status(500).json({ error: "Failed to send code" });
  }
});


// Register
router.post("/register", authLimiter, async (req, res) => {
  const { username, email, password, profileTrainer = "ash.png" } = req.body;



  const usernameValidation = validateContent(username, 'username');
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
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: "Username or email already taken" });
    }

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

    await sendCodeEmail(user, "Verify Your Account", code, "email verification");

    res.json({ message: "Account created. Please check your email to verify your account." });
  } catch (err) {
    console.error("Registration error:", err);
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

    if (!user) return res.status(400).json({ error: "User not found" });
    if (!user.verified) {
      // still generate token and login, but include verified=false in the response
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      return res
              .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: rememberMe ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 2,
      })
        .json({
          message: "Login successful, but not verified",
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            profileTrainer: user.profileTrainer,
            verified: false, // 🚨 NEW: send this to frontend
          },
        });
    }


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

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
        },

      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Me
router.get("/me", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "unauthenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password -__v")
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      profileTrainer: user.profileTrainer,
      verified: user.verified,
      progressBars: user.progressBars || [],
    });

  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
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
  if (!email || !code)
    return res.status(400).json({ error: "Email and code are required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.verified) return res.json({ message: "Already verified" });

    if (
      user.verificationCode !== code ||
      user.verificationCodeExpires < Date.now()
    ) {
      return res.status(400).json({ error: "Invalid or expired code" });
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
    user.location = req.body.location ?? user.location;
    user.gender = req.body.gender ?? user.gender;
    user.favoriteGames = req.body.favoriteGames ?? user.favoriteGames;
    user.favoritePokemon = req.body.favoritePokemon ?? user.favoritePokemon;
    user.favoritePokemonShiny = req.body.favoritePokemonShiny ?? user.favoritePokemonShiny;
    user.switchFriendCode = req.body.switchFriendCode ?? user.switchFriendCode;
    user.profileTrainer = req.body.profileTrainer ?? user.profileTrainer;

// GOOD: saves both true and false
if ("isProfilePublic" in req.body) {
  user.isProfilePublic = !!req.body.isProfilePublic;
}


    await user.save();

    res.json({ message: "Profile updated" });
  } catch (err) {
    console.error(err);
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

// PUT /api/update-username
router.put("/update-username", authenticateUser, async (req, res) => {
  const { newUsername } = req.body;

  if (!newUsername || newUsername.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters" });
  }

  if (!/^[a-zA-Z0-9]+$/.test(newUsername)) {
    return res.status(400).json({ error: "Usernames can only contain letters and numbers." });
  }

  const usernameValidation = validateContent(newUsername, 'username');
  if (!usernameValidation.isValid) {
    return res.status(400).json({ error: usernameValidation.error });
  }

  const existing = await User.findOne({ username: newUsername });
  if (existing) {
    return res.status(400).json({ error: "Username is already taken." });
  }

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.username = newUsername;
  await user.save();

  res.json({ success: true, username: user.username });
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

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Server error" });
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




// GET /api/users/public?query=&page=1&pageSize=24&random=1
router.get("/users/public", async (req, res) => {
  res.set("Cache-Control", "no-store");

  const q = (req.query.query || "").trim();
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || "24", 10)));
  const random = req.query.random === "1";

  const match = { isProfilePublic: { $ne: false } };
  if (q) match.username = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

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

  res.json({ items, total, page, pageSize });
});

// GET /api/users/:username/public
router.get("/users/:username/public", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const u = await User.findOne({
    username: req.params.username,
    isProfilePublic: { $ne: false }
  })
    .select("username bio location gender favoriteGames favoritePokemon favoritePokemonShiny profileTrainer createdAt switchFriendCode progressBars")
    .lean();
  if (!u) return res.status(404).json({ error: "User not found or private" });
  
  // Add like count
  const likeCount = u.likes ? u.likes.length : 0;
  res.json({ ...u, likeCount });
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
  try {
    const code = String(req.body?.code || "").trim();
    const typed = String(req.body?.confirm || "").trim();

    if (!/^\d{6}$/.test(code)) return res.status(400).json({ error: "Invalid code." });

    const user = await User.findById(req.userId).select("username deleteCodeHash deleteCodeExpires");
    if (!user) return res.status(401).json({ error: "Unauthorized" });

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
    res.clearCookie("token", { httpOnly: true, sameSite: "none", secure: true, path: "/" });
    return res.status(204).end();
  } catch (e) {
    console.error("delete/confirm", e);
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
