import express from "express";
import { authenticateUser } from "../middleware/authenticateUser.js";
import User from "../models/User.js";
import {
  constructStripeWebhookEvent,
  createStripeCheckoutSession,
  createStripePortalSession,
  processStripeWebhookEvent,
} from "../utils/stripeService.js";

const router = express.Router();

/**
 * GET /api/stripe/config
 * Public status endpoint indicating whether Stripe test mode is ready.
 */
router.get("/config", (req, res) => {
  const isConfigured = Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID
  );
  res.json({
    isConfigured,
    priceId: process.env.STRIPE_PRICE_ID || null,
    isWebhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  });
});

/**
 * POST /api/stripe/create-checkout-session
 * Authenticated endpoint to initiate Stripe Premium Checkout.
 * Restricted to Admins & local development during initial sandbox test phase.
 */
router.post("/create-checkout-session", authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("email username stripeCustomerId");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const origin =
      req.headers.origin ||
      process.env.FRONTEND_URL ||
      "https://www.ultimatedextracker.com";

    const sessionUrl = await createStripeCheckoutSession({ userId, origin });
    return res.json({ url: sessionUrl });
  } catch (err) {
    if (err.code === "ALREADY_SUBSCRIBED") {
      return res.status(400).json({
        error: "You already have an active Premium membership.",
        code: "ALREADY_SUBSCRIBED",
      });
    }

    console.error("[Stripe Route] Error creating checkout session:", err.message);
    return res.status(500).json({
      error: err.message || "Failed to create Stripe checkout session",
    });
  }
});

/**
 * POST /api/stripe/create-portal-session
 * Authenticated endpoint to create a Stripe Customer Portal session.
 */
router.post("/create-portal-session", authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const origin =
      req.headers.origin ||
      process.env.FRONTEND_URL ||
      "https://www.ultimatedextracker.com";

    const portalUrl = await createStripePortalSession({ userId, origin });
    return res.json({ url: portalUrl });
  } catch (err) {
    if (err.code === "NO_STRIPE_CUSTOMER") {
      return res.status(404).json({
        error: "No active Stripe customer subscription found for this account.",
        code: "NO_STRIPE_CUSTOMER",
      });
    }

    console.error("[Stripe Route] Error creating portal session:", err.message);
    return res.status(500).json({
      error: err.message || "Failed to create Stripe portal session",
    });
  }
});

/**
 * POST /api/stripe/webhook
 * Public webhook endpoint for Stripe event synchronization.
 * Verifies HMAC signature using raw request body Buffer (req.rawBody).
 */
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured.");
    return res.status(500).json({ error: "Webhook secret is not configured on server." });
  }

  if (!sig) {
    console.warn("[Stripe Webhook] Missing stripe-signature header.");
    return res.status(400).json({ error: "Missing stripe-signature header." });
  }

  const rawBody = req.rawBody || (typeof req.body === "string" ? Buffer.from(req.body) : null);
  if (!rawBody) {
    console.error("[Stripe Webhook] Raw request body is not available for signature verification.");
    return res.status(400).json({ error: "Raw body buffer unavailable for verification." });
  }

  let event;
  try {
    event = constructStripeWebhookEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.warn(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  try {
    const result = await processStripeWebhookEvent(event);
    return res.status(200).json({ received: true, ...result });
  } catch (err) {
    console.error(`[Stripe Webhook] Error processing event ${event.id}:`, err);
    return res.status(500).json({ error: "Internal error processing webhook event." });
  }
});

export default router;
