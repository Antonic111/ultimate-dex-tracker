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
    const user = await User.findById(req.userId).select("-password -__v")
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
router.post("/verify-code", corsMiddleware, async (req, res) => {
  const { email, code } = req.body;
  
  console.log('Verification attempt:', { email, code, body: req.body });
  
  if (!email || !code) {
    console.log('Missing email or code:', { email, code });
    return res.status(400).json({ error: "Email and code are required" });
  }

    try {
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(404).json({ error: "User not found" });
    }
    
    console.log('User found:', { 
      verified: user.verified, 
      verificationCode: user.verificationCode, 
      verificationCodeExpires: user.verificationCodeExpires,
      currentTime: Date.now()
    });
    
    if (user.verified) return res.json({ message: "Already verified" });
    
    if (
      user.verificationCode !== code ||
      user.verificationCodeExpires < Date.now()
    ) {
      if (user.verificationCode !== code) {
        console.log('Code mismatch:', { expected: user.verificationCode, received: code });
        return res.status(400).json({ error: "Invalid verification code" });
      } else {
        console.log('Code expired:', { expires: user.verificationCodeExpires, current: Date.now() });
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
router.post("/resend-code", corsMiddleware, async (req, res) => {
  const { email } = req.body;
  
  console.log('Resend code attempt for email:', email);
  
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found for resend:', email);
      return res.status(404).json({ error: "User not found" });
    }
    
    if (user.verified) {
      console.log('User already verified:', email);
      return res.json({ message: "Already verified" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = code;
    user.verificationCodeExpires = Date.now() + 1000 * 60 * 10; // 10 minutes
    
    console.log('Setting new verification code:', { email, code, expires: user.verificationCodeExpires });
    
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
    }

    await user.save();

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

// GET /api/caught
router.get("/caught", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    res.json(user.caughtPokemon || {});
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
    
    user.caughtPokemon = caughtMap;
    await user.save();
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating caught data:', err);
    res.status(500).json({ error: "Server error" });
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
  } catch (error) {
    console.error('🔥 PUT /update-username - Error:', error);
    res.status(500).json({ error: "Server error", details: error.message });
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
      .select("username bio location gender favoriteGames favoritePokemon favoritePokemonShiny profileTrainer createdAt switchFriendCode progressBars likes")
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
    res.clearCookie("token", { httpOnly: true, sameSite: "none", secure: true, path: "/" });
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
  if (user.profilePrivate) return res.status(403).json({ error: "This dex is private." });

  // Build the same caughtInfoMap shape you use in the app
  const caughtInfoMap = user.caughtInfoMap || {}; // adapt to your schema/source

  res.json({ username: user.username, caughtInfoMap });
});


export default router;
