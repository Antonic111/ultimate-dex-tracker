/**
 * oauth.js — Google & Discord OAuth 2.0 routes
 */

import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";
import LinkedProvider from "../models/LinkedProvider.js";
import { generateOAuthState, verifyOAuthState } from "../middleware/oauthState.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { authenticateUser } from "../middleware/authenticateUser.js";

// Ensure env vars are loaded
dotenv.config();
dotenv.config({ path: ".env.local" });
dotenv.config({ path: "../.env" });
dotenv.config({ path: "../.env.local" });

const router = express.Router();

// ─── Dynamic Config helpers ──────────────────────────────────────────────────

function getBackendUrl(req) {
  if (process.env.BACKEND_URL) return process.env.BACKEND_URL.replace(/\/$/, "");
  // In development, backend default is port 5000
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:5000";
  return `${proto}://${host}`;
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
}

function getGoogleConfig(req) {
  const backendUrl = getBackendUrl(req);
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${backendUrl}/api/auth/google/callback`,
    scopes: "openid email profile",
  };
}

function getDiscordConfig(req) {
  const backendUrl = getBackendUrl(req);
  return {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    redirectUri: `${backendUrl}/api/auth/discord/callback`,
    scopes: "identify email",
  };
}

// ─── Cookie helper (matches existing auth.js style) ───────────────────────────

function issueJWT(userId, res, rememberMe = true) {
  const secret = process.env.JWT_SECRET || "default_jwt_fallback_secret";
  const token = jwt.sign({ userId }, secret, {
    expiresIn: "30d",
  });

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    path: "/",
  };
  if (isProduction) {
    cookieOptions.domain = ".ultimatedextracker.com";
  }

  res.cookie("token", token, cookieOptions);
  return token;
}

// ─── Redirect helper ──────────────────────────────────────────────────────────

function frontendRedirect(res, { success, token, error }) {
  const base = `${getFrontendUrl()}/oauth/callback`;
  if (success && token) {
    return res.redirect(`${base}?success=1&token=${encodeURIComponent(token)}`);
  }
  return res.redirect(`${base}?error=${encodeURIComponent(error || "OAuth error")}`);
}

// ─── Account matching core logic ──────────────────────────────────────────────

/**
 * Given provider info, find or create a User and ensure a LinkedProvider record exists.
 */
async function resolveOAuthUser({ provider, providerAccountId, providerEmail, emailVerified, displayName, avatarUrl, linkToUserId }) {
  // ── Link mode (user already logged in) ───────────────────────────────────────
  if (linkToUserId) {
    const existing = await LinkedProvider.findOne({ provider, providerAccountId });

    if (existing) {
      const user = await User.findById(existing.userId);
      if (!user) {
        // Orphaned link, delete it so it can be linked cleanly
        await LinkedProvider.deleteOne({ _id: existing._id });
      } else if (existing.userId.toString() === linkToUserId.toString()) {
        return { user, linked: false, alreadyLinked: true };
      } else {
        return { error: `This ${provider} account is already connected to a different Ultimate Dex Tracker account.` };
      }
    }

    const alreadyLinkedToUser = await LinkedProvider.findOne({ provider, userId: linkToUserId });
    if (alreadyLinkedToUser) {
      return { error: `You already have a ${provider} account connected. Disconnect the existing one first.` };
    }

    const user = await User.findById(linkToUserId);
    if (!user) return { error: "User not found" };

    await LinkedProvider.create({
      userId: user._id,
      provider,
      providerAccountId,
      providerEmail: providerEmail || null,
      displayName: displayName || null,
      avatarUrl: avatarUrl || null,
      linkedAt: new Date()
    });

    return { user, linked: true };
  }

  // ── Login/Register mode ───────────────────────────────────────────────────────

  // 1. Existing link
  const existing = await LinkedProvider.findOne({ provider, providerAccountId });
  if (existing) {
    const user = await User.findById(existing.userId);
    if (!user) {
      // Orphaned link (e.g. user document was deleted) - clean up and continue
      await LinkedProvider.deleteOne({ _id: existing._id });
    } else {
      if (providerEmail && existing.providerEmail !== providerEmail) {
        existing.providerEmail = providerEmail;
        existing.displayName = displayName || existing.displayName;
        existing.avatarUrl = avatarUrl || existing.avatarUrl;
        await existing.save();
      }
      return { user, linked: false };
    }
  }

  // 2. Email match (only if provider marks email as verified)
  if (emailVerified && providerEmail) {
    const emailUser = await User.findOne({ email: providerEmail.toLowerCase() });
    if (emailUser) {
      await LinkedProvider.create({
        userId: emailUser._id,
        provider,
        providerAccountId,
        providerEmail: providerEmail || null,
        displayName: displayName || null,
        avatarUrl: avatarUrl || null,
        linkedAt: new Date()
      });
      return { user: emailUser, linked: true };
    }
  }

  // 3. Create new user
  let baseUsername = (displayName || provider + "user")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 12) || "trainer";

  if (baseUsername.length < 3) baseUsername = `${provider}user`;

  let username = baseUsername;
  let attempt = 0;
  while (await User.findOne({ username })) {
    attempt++;
    const suffix = Math.floor(Math.random() * 9000 + 1000).toString();
    username = `${baseUsername.slice(0, 11)}${suffix}`.slice(0, 15);
    if (attempt > 20) username = `user${Date.now().toString().slice(-8)}`;
  }

  const email = providerEmail ? providerEmail.toLowerCase() : `${provider}_${providerAccountId}@oauth.placeholder`;

  const emailConflict = await User.findOne({ email });
  if (emailConflict) {
    await LinkedProvider.create({
      userId: emailConflict._id,
      provider,
      providerAccountId,
      providerEmail: providerEmail || null,
      displayName: displayName || null,
      avatarUrl: avatarUrl || null,
      linkedAt: new Date()
    });
    return { user: emailConflict, linked: true };
  }

  const newUser = await User.create({
    username,
    email,
    password: null,       // OAuth-only user, no password
    verified: true,       // OAuth emails are considered verified
    profileTrainer: "ash.png",
    onboarding: { isComplete: false, tutorialStep: 0 },
    needsProfileSetup: true,
  });

  await LinkedProvider.create({
    userId: newUser._id,
    provider,
    providerAccountId,
    providerEmail: providerEmail || null,
    displayName: displayName || null,
    avatarUrl: avatarUrl || null,
    linkedAt: new Date()
  });

  return { user: newUser, linked: true, isNewUser: true };
}

// ─── Google ───────────────────────────────────────────────────────────────────

// Start Google OAuth (login)
router.get("/auth/google", authLimiter, (req, res) => {
  const { clientId, redirectUri, scopes } = getGoogleConfig(req);
  if (!clientId) {
    return res.status(503).json({ error: "Google OAuth is not configured on this server. Please set GOOGLE_CLIENT_ID in your environment." });
  }
  const state = generateOAuthState({ action: "login" });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    state,
    access_type: "online",
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// Start Google OAuth (link while logged in)
router.get("/auth/google/link", authenticateUser, (req, res) => {
  const { clientId, redirectUri, scopes } = getGoogleConfig(req);
  if (!clientId) {
    return res.status(503).json({ error: "Google OAuth is not configured on this server. Please set GOOGLE_CLIENT_ID in your environment." });
  }
  const state = generateOAuthState({ action: "link", userId: req.userId });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    state,
    access_type: "online",
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// Google callback
router.get("/auth/google/callback", async (req, res) => {
  const { code, state, error: oauthError } = req.query;
  const { clientId, clientSecret, redirectUri } = getGoogleConfig(req);

  if (oauthError) {
    return frontendRedirect(res, { error: "Google sign-in was cancelled." });
  }

  let statePayload;
  try {
    statePayload = verifyOAuthState(state);
  } catch (err) {
    return frontendRedirect(res, { error: err.message });
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Google token exchange failed:", tokenData);
      return frontendRedirect(res, { error: "Failed to authenticate with Google. Please try again." });
    }

    // Get user info
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userInfoRes.json();

    if (!googleUser.sub) {
      return frontendRedirect(res, { error: "Could not retrieve your Google account information." });
    }

    const result = await resolveOAuthUser({
      provider: "google",
      providerAccountId: googleUser.sub,
      providerEmail: googleUser.email,
      emailVerified: googleUser.email_verified === true,
      displayName: googleUser.name || googleUser.given_name,
      avatarUrl: googleUser.picture || null,
      linkToUserId: statePayload.action === "link" ? statePayload.userId : null,
    });

    if (result.error) {
      return frontendRedirect(res, { error: result.error });
    }

    const token = issueJWT(result.user._id, res);
    return frontendRedirect(res, { success: true, token });

  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return frontendRedirect(res, { error: err.message || "An unexpected error occurred during Google sign-in." });
  }
});

// ─── Discord ──────────────────────────────────────────────────────────────────

// Start Discord OAuth (login)
router.get("/auth/discord", authLimiter, (req, res) => {
  const { clientId, redirectUri, scopes } = getDiscordConfig(req);
  if (!clientId) {
    return res.status(503).json({ error: "Discord OAuth is not configured on this server. Please set DISCORD_CLIENT_ID in your environment." });
  }
  const state = generateOAuthState({ action: "login" });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    state,
    prompt: "consent",
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

// Start Discord OAuth (link while logged in)
router.get("/auth/discord/link", authenticateUser, (req, res) => {
  const { clientId, redirectUri, scopes } = getDiscordConfig(req);
  if (!clientId) {
    return res.status(503).json({ error: "Discord OAuth is not configured on this server. Please set DISCORD_CLIENT_ID in your environment." });
  }
  const state = generateOAuthState({ action: "link", userId: req.userId });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    state,
    prompt: "consent",
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

// Discord callback
router.get("/auth/discord/callback", async (req, res) => {
  const { code, state, error: oauthError } = req.query;
  const { clientId, clientSecret, redirectUri } = getDiscordConfig(req);

  if (oauthError) {
    return frontendRedirect(res, { error: "Discord sign-in was cancelled." });
  }

  let statePayload;
  try {
    statePayload = verifyOAuthState(state);
  } catch (err) {
    return frontendRedirect(res, { error: err.message });
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Discord token exchange failed:", tokenData);
      return frontendRedirect(res, { error: "Failed to authenticate with Discord. Please try again." });
    }

    // Get user info
    const userInfoRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const discordUser = await userInfoRes.json();

    if (!discordUser.id) {
      return frontendRedirect(res, { error: "Could not retrieve your Discord account information." });
    }

    const result = await resolveOAuthUser({
      provider: "discord",
      providerAccountId: discordUser.id,
      providerEmail: discordUser.email || null,
      emailVerified: discordUser.verified === true && !!discordUser.email,
      displayName: discordUser.global_name || discordUser.username,
      avatarUrl: discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null,
      linkToUserId: statePayload.action === "link" ? statePayload.userId : null,
    });

    if (result.error) {
      return frontendRedirect(res, { error: result.error });
    }

    const token = issueJWT(result.user._id, res);
    return frontendRedirect(res, { success: true, token });

  } catch (err) {
    console.error("Discord OAuth callback error:", err);
    return frontendRedirect(res, { error: err.message || "An unexpected error occurred during Discord sign-in." });
  }
});

// ─── Authenticated OAuth management ──────────────────────────────────────────

// Get all linked providers for the current user
router.get("/oauth/providers", authenticateUser, async (req, res) => {
  try {
    const links = await LinkedProvider.find({ userId: req.userId }).select(
      "provider providerEmail displayName avatarUrl linkedAt -_id"
    );
    res.json({ providers: links });
  } catch (err) {
    console.error("Error fetching linked providers:", err);
    res.status(500).json({ error: "Failed to fetch linked accounts" });
  }
});

// Unlink a provider
router.delete("/oauth/unlink/:provider", authenticateUser, async (req, res) => {
  const { provider } = req.params;

  if (!["google", "discord"].includes(provider)) {
    return res.status(400).json({ error: "Invalid provider" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Safety check: ensure the user won't be locked out
    const allLinks = await LinkedProvider.find({ userId: req.userId });
    const hasPassword = user.password && user.password.length > 0;
    const linkCount = allLinks.length;

    if (!hasPassword && linkCount <= 1) {
      return res.status(400).json({
        error:
          "You cannot disconnect your only login method. Please set a password in Account Settings first, then disconnect this account.",
      });
    }

    const deleted = await LinkedProvider.findOneAndDelete({
      userId: req.userId,
      provider,
    });

    if (!deleted) {
      return res.status(404).json({ error: `No ${provider} account is currently connected.` });
    }

    res.json({ success: true, message: `${provider} account disconnected successfully.` });
  } catch (err) {
    console.error("Error unlinking provider:", err);
    res.status(500).json({ error: "Failed to disconnect account" });
  }
});

// Complete OAuth Profile Setup (Username and optional password)
router.post("/complete-oauth-setup", authenticateUser, async (req, res) => {
  const { username, password, confirmPassword, profileTrainer, skip } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (skip) {
      user.needsProfileSetup = false;
      await user.save();
      return res.json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          hasPassword: Boolean(user.password),
          profileTrainer: user.profileTrainer,
          needsProfileSetup: false,
          verified: user.verified,
          isAdmin: user.isAdmin,
          onboarding: user.onboarding,
        },
      });
    }

    // 1. Validate and set username
    if (username && username.trim() !== "" && username.trim() !== user.username) {
      const usernameTrimmed = username.trim();
      if (usernameTrimmed.length < 3 || usernameTrimmed.length > 15) {
        return res.status(400).json({ error: "Username must be between 3 and 15 characters" });
      }

      const existing = await User.findOne({ username: usernameTrimmed });
      if (existing && existing._id.toString() !== req.userId) {
        return res.status(400).json({ error: "This username is already taken" });
      }

      user.username = usernameTrimmed;
      // Do not set usernameLastChanged here so initial signup doesn't trigger a 24h cooldown
    }

    // 2. Validate and set password (optional)
    if (password && password.trim() !== "") {
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
      }

      const bcrypt = await import("bcryptjs");
      const salt = await bcrypt.default.genSalt(10);
      user.password = await bcrypt.default.hash(password, salt);
    }

    if (profileTrainer && typeof profileTrainer === "string") {
      user.profileTrainer = profileTrainer;
    }

    user.needsProfileSetup = false;
    await user.save();

    res.json({
      success: true,
      message: "Profile setup completed successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        hasPassword: Boolean(user.password),
        profileTrainer: user.profileTrainer,
        needsProfileSetup: false,
        verified: user.verified,
        isAdmin: user.isAdmin,
        onboarding: user.onboarding,
      },
    });
  } catch (err) {
    console.error("Error completing oauth setup:", err);
    res.status(500).json({ error: "Failed to complete account setup" });
  }
});

export default router;
