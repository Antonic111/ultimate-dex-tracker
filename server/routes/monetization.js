import express from "express";
import { authenticateUser } from "../middleware/authenticateUser.js";
import { getUserEntitlements } from "../utils/entitlementService.js";
import { createStripePortalSession } from "../utils/stripeService.js";
import Subscription from "../models/Subscription.js";
import Product from "../models/Product.js";

const router = express.Router();

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
            provider: subscription.provider || "stripe",
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
 * POST /api/monetization/sync
 * Refresh user entitlements and return current status.
 */
router.post("/sync", authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

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
            provider: subscription.provider || "stripe",
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
    console.error("[Monetization Sync] Error during sync:", err);
    res.status(500).json({ error: "Failed to sync status" });
  }
});

/**
 * GET /api/monetization/products
 * Public catalog endpoint listing available products.
 */
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({ isAvailable: true }).select(
      "productId name description type category billingInterval defaultPrice stripePriceId"
    );
    res.json({ products });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * POST /api/monetization/portal-session
 * Generate an authenticated Stripe Customer Portal session URL.
 */
router.post("/portal-session", authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const origin =
      req.headers.origin ||
      process.env.FRONTEND_URL ||
      "https://www.ultimatedextracker.com";

    const portalUrl = await createStripePortalSession({ userId, origin });
    res.json({ url: portalUrl });
  } catch (err) {
    console.error("Error creating portal session:", err);
    res.status(500).json({ error: err.message || "Failed to create portal session" });
  }
});

export default router;
