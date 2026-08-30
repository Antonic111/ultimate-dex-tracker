import express from "express";
import { authenticateUser } from "../middleware/authenticateUser.js";
import {
  verifyPaddleWebhookSignature,
  processPaddleWebhookEvent,
  syncFromPaddleApi,
  createPaddlePortalSession,
} from "../utils/paddleService.js";
import { getUserEntitlements } from "../utils/entitlementService.js";
import Subscription from "../models/Subscription.js";
import Product from "../models/Product.js";

const router = express.Router();

/**
 * POST /api/monetization/webhook
 * Secure Paddle Billing v2 webhook endpoint.
 */
router.post("/webhook", async (req, res) => {
  try {
    console.log("[Paddle Webhook] Incoming webhook POST request received.");
    const signatureHeader = req.headers["paddle-signature"];
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET_KEY;

    if (!webhookSecret) {
      console.error("[Paddle Webhook] PADDLE_WEBHOOK_SECRET_KEY is not configured.");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    if (!signatureHeader) {
      console.warn("[Paddle Webhook] Missing paddle-signature header.");
      return res.status(400).json({ error: "Missing signature header" });
    }

    const rawBody = req.rawBody || JSON.stringify(req.body);
    const isValid = verifyPaddleWebhookSignature(rawBody, signatureHeader, webhookSecret);

    if (!isValid) {
      console.warn("[Paddle Webhook] Invalid webhook signature detected.");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    console.log("[Paddle Webhook] Webhook signature verified successfully. Event:", req.body?.event_type);
    const event = req.body;
    await processPaddleWebhookEvent(event);

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("[Paddle Webhook] Error processing webhook:", err);
    return res.status(500).json({ error: "Internal webhook processing error" });
  }
});

/**
 * POST /api/monetization/sync
 * Direct Paddle API synchronization fallback.
 * Queries Paddle REST API for latest status and updates MongoDB immediately.
 */
router.post("/sync", authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { subscriptionId, transactionId } = req.body || {};

    console.log(`[Paddle Sync Route] Manual sync requested for user ${userId}`, {
      subscriptionId,
      transactionId,
    });

    if (subscriptionId || transactionId) {
      await syncFromPaddleApi({ subscriptionId, transactionId, userId });
    } else {
      // Check existing subscription in DB to refresh
      const existingSub = await Subscription.findOne({ userId }).sort({ createdAt: -1 });
      if (existingSub?.subscriptionId) {
        await syncFromPaddleApi({
          subscriptionId: existingSub.subscriptionId,
          userId,
        });
      }
    }

    const [subscription, entitlements] = await Promise.all([
      Subscription.findOne({ userId }).sort({ createdAt: -1 }),
      getUserEntitlements(userId),
    ]);

    const isPremium = entitlements.includes("premium");

    res.json({
      success: true,
      isPremium,
      entitlements,
      subscription: subscription
        ? {
            id: subscription.subscriptionId,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            canceledAt: subscription.canceledAt,
            managementUrls: subscription.managementUrls,
          }
        : null,
    });
  } catch (err) {
    console.error("[Paddle Sync Route] Error during sync:", err);
    res.status(500).json({ error: "Failed to sync with payment provider" });
  }
});

/**
 * GET /api/monetization/config
 * Public configuration endpoint for frontend Paddle.js initialization.
 */
router.get("/config", (req, res) => {
  const environment = process.env.PADDLE_ENVIRONMENT || "sandbox"; // 'sandbox' or 'production'
  const clientToken = process.env.PADDLE_CLIENT_TOKEN || "";
  const monthlyPriceId = process.env.PADDLE_PREMIUM_MONTHLY_PRICE_ID || "";

  res.json({
    environment,
    clientToken,
    monthlyPriceId,
    isConfigured: Boolean(clientToken && monthlyPriceId),
  });
});

/**
 * GET /api/monetization/status
 * Get the authenticated user's current subscription, billing dates, and active entitlements.
 */
router.get("/status", authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    const [subscription, entitlements] = await Promise.all([
      Subscription.findOne({ userId }).sort({ createdAt: -1 }),
      getUserEntitlements(userId),
    ]);

    const isPremium = entitlements.includes("premium");

    res.json({
      isPremium,
      entitlements,
      subscription: subscription
        ? {
            id: subscription.subscriptionId,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            canceledAt: subscription.canceledAt,
            managementUrls: subscription.managementUrls,
          }
        : null,
    });
  } catch (err) {
    console.error("Error fetching monetization status:", err);
    res.status(500).json({ error: "Failed to fetch monetization status" });
  }
});

/**
 * GET /api/monetization/products
 * Public catalog endpoint listing available products.
 */
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({ isAvailable: true }).select(
      "productId name description type category billingInterval defaultPrice paddlePriceId"
    );
    res.json({ products });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * POST /api/monetization/portal-session
 * Generate an authenticated Paddle Customer Portal session URL for self-service subscription management.
 */
router.post("/portal-session", authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const subscription = await Subscription.findOne({ userId }).sort({ createdAt: -1 });

    if (!subscription?.customerId) {
      return res.status(404).json({ error: "No active customer subscription found" });
    }

    const portalUrl = await createPaddlePortalSession(
      subscription.customerId,
      subscription.subscriptionId ? [subscription.subscriptionId] : []
    );

    if (!portalUrl) {
      // Fallback to direct managementUrls stored on the subscription record if API call fails
      const fallbackUrl =
        subscription.managementUrls?.updatePaymentMethod ||
        subscription.managementUrls?.cancel ||
        null;

      if (fallbackUrl) {
        return res.json({ url: fallbackUrl });
      }

      return res.status(500).json({ error: "Failed to create portal session" });
    }

    res.json({ url: portalUrl });
  } catch (err) {
    console.error("Error creating portal session:", err);
    res.status(500).json({ error: "Internal server error creating portal session" });
  }
});

export default router;
