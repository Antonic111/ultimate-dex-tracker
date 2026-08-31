import express from "express";
import { authenticateUser } from "../middleware/authenticateUser.js";
import { getUserEntitlements } from "../utils/entitlementService.js";
import {
  createStripePortalSession,
  syncUserSubscriptionFromStripe,
} from "../utils/stripeService.js";
import Subscription from "../models/Subscription.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import UserEntitlement from "../models/UserEntitlement.js";

const router = express.Router();

/**
 * GET /api/monetization/status
 * Get the authenticated user's current subscription, billing dates, and active entitlements.
 */
router.get("/status", authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    let [subscription, entitlements] = await Promise.all([
      Subscription.findOne({ userId }).sort({ createdAt: -1 }),
      getUserEntitlements(userId),
    ]);

    // If not premium in DB, attempt a quick sync with Stripe
    if (!entitlements.includes("premium") && process.env.STRIPE_SECRET_KEY) {
      await syncUserSubscriptionFromStripe({ userId }).catch(() => {});
      [subscription, entitlements] = await Promise.all([
        Subscription.findOne({ userId }).sort({ createdAt: -1 }),
        getUserEntitlements(userId),
      ]);
    }

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
 * Refresh user entitlements directly from Stripe and return current status.
 */
router.post("/sync", authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const sessionId = req.body?.sessionId;

    // Directly reconcile with Stripe API
    await syncUserSubscriptionFromStripe({ userId, sessionId }).catch((err) =>
      console.error("[Monetization Sync] Direct Stripe sync error:", err)
    );

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

/**
 * POST /api/monetization/test/reset-membership
 * Testing & verification endpoint: cancels Stripe test subscriptions and revokes entitlements.
 * Accessible to Antonic or any admin account.
 */
router.post("/test/reset-membership", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isAuthorized = user.isAdmin || user.username?.toLowerCase() === "antonic";
    if (!isAuthorized) {
      return res.status(403).json({ error: "Unauthorized: testing tool only available for Antonic or Administrators." });
    }

    const targetUserId = req.body?.targetUserId || user._id;

    // 1. Cancel active Stripe subscriptions directly on Stripe to prevent background auto-reactivation
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = (await import("../utils/stripeService.js")).getStripeClient();
        const existingSubs = await Subscription.find({ userId: targetUserId });
        for (const sub of existingSubs) {
          if (sub.subscriptionId) {
            await stripe.subscriptions.cancel(sub.subscriptionId).catch(() => {});
          }
        }
        if (user.stripeCustomerId) {
          const stripeSubs = await stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "all" });
          for (const s of stripeSubs.data) {
            await stripe.subscriptions.cancel(s.id).catch(() => {});
          }
        }
      } catch (stripeErr) {
        console.warn("[Testing] Stripe subscription cancellation note:", stripeErr.message);
      }
    }

    // 2. Delete local subscriptions and active entitlements
    await Subscription.deleteMany({ userId: targetUserId });
    await UserEntitlement.deleteMany({ userId: targetUserId, entitlement: "premium" });

    // 3. Clear stripeCustomerId on User to detach from Stripe test customer, but PRESERVE user cosmetic customizations
    await User.findByIdAndUpdate(targetUserId, {
      $set: {
        stripeCustomerId: null,
      },
    });

    console.log(`[Testing] Membership and subscriptions cleanly removed for user ${targetUserId}`);

    res.json({
      success: true,
      isPremium: false,
      message: "Membership has been completely removed for testing.",
    });
  } catch (err) {
    console.error("[Testing] Error resetting membership:", err);
    res.status(500).json({ error: "Failed to reset membership" });
  }
});

/**
 * POST /api/monetization/test/grant-membership
 * Testing & verification endpoint: instantly grants 30 days of test membership.
 */
router.post("/test/grant-membership", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isAuthorized = user.isAdmin || user.username?.toLowerCase() === "antonic";
    if (!isAuthorized) {
      return res.status(403).json({ error: "Unauthorized: testing tool only available for Antonic or Administrators." });
    }

    const targetUserId = req.body?.targetUserId || user._id;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await UserEntitlement.findOneAndUpdate(
      { userId: targetUserId, entitlement: "premium", source: "admin" },
      {
        $set: {
          isActive: true,
          expiresAt,
          grantedAt: new Date(),
          metadata: { note: "Manual test grant for Antonic" },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      isPremium: true,
      expiresAt,
      message: "Test membership granted for 30 days.",
    });
  } catch (err) {
    console.error("[Testing] Error granting test membership:", err);
    res.status(500).json({ error: "Failed to grant test membership" });
  }
});

export default router;
