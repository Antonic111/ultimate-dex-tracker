import crypto from "crypto";
import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";
import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import {
  syncSubscriptionEntitlements,
  grantEntitlement,
  revokeEntitlementsBySource,
} from "./entitlementService.js";

/**
 * Paddle Service
 * Handles Paddle Billing v2 webhooks, HMAC signature verification, API synchronization, and event processing.
 */

/**
 * Verify Paddle v2 webhook signature using HMAC-SHA256.
 * Header format: Paddle-Signature: ts=1671552777;h1=6cf6e...
 * @param {Buffer|string} rawBody
 * @param {string} signatureHeader
 * @param {string} secretKey
 * @returns {boolean}
 */
export function verifyPaddleWebhookSignature(rawBody, signatureHeader, secretKey) {
  if (!rawBody || !signatureHeader || !secretKey) {
    return false;
  }

  try {
    const parts = signatureHeader.split(";").reduce((acc, part) => {
      const [k, v] = part.split("=");
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {});

    const ts = parts.ts;
    const h1 = parts.h1;

    if (!ts || !h1) {
      return false;
    }

    const payload = `${ts}:${typeof rawBody === "string" ? rawBody : rawBody.toString("utf8")}`;
    const computedH1 = crypto
      .createHmac("sha256", secretKey)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(computedH1), Buffer.from(h1));
  } catch (err) {
    console.error("Error verifying Paddle webhook signature:", err);
    return false;
  }
}

/**
 * Handle incoming verified Paddle webhook events idempotently.
 * @param {Object} event - Paddle webhook event payload
 */
export async function processPaddleWebhookEvent(event) {
  if (!event || !event.event_type) {
    throw new Error("Invalid event payload");
  }

  const { event_type, data } = event;
  console.log(`[Paddle Webhook] Processing verified event: ${event_type}`, {
    id: data?.id,
    customerId: data?.customer_id,
    customData: data?.custom_data,
  });

  switch (event_type) {
    case "subscription.created":
    case "subscription.updated":
    case "subscription.activated":
    case "subscription.resumed":
    case "subscription.canceled":
    case "subscription.paused":
    case "subscription.past_due": {
      await handleSubscriptionEvent(event_type, data);
      break;
    }

    case "transaction.completed": {
      await handleTransactionCompletedEvent(data);
      break;
    }

    default:
      console.log(`[Paddle Webhook] Unhandled event type: ${event_type}`);
      break;
  }
}

/**
 * Handle subscription lifecycle events from Paddle.
 */
export async function handleSubscriptionEvent(eventType, data) {
  if (!data || !data.id) return;

  const subscriptionId = data.id;
  const customerId = data.customer_id;
  const status = data.status; // 'active', 'canceled', 'past_due', 'paused', 'trialing'
  const customData = data.custom_data || {};
  let userId = customData.userId || customData.user_id;

  // Fallback 1: Look up by existing subscription in DB
  if (!userId) {
    const existing = await Subscription.findOne({ subscriptionId });
    if (existing) {
      userId = existing.userId;
    }
  }

  // Fallback 2: Look up user by username or customer email
  let resolvedUser = null;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    resolvedUser = await User.findById(userId);
  }

  if (!resolvedUser && customData.username) {
    resolvedUser = await User.findOne({ username: customData.username });
  }

  if (!resolvedUser && data.customer?.email) {
    resolvedUser = await User.findOne({ email: data.customer.email.toLowerCase() });
  }

  if (!resolvedUser) {
    console.warn(
      `[Paddle Webhook] Subscription event ${eventType} could not resolve user for subscription ${subscriptionId}`,
      { customData, customerEmail: data.customer?.email }
    );
    return;
  }

  userId = resolvedUser._id;

  // Extract period dates
  const currentPeriodStart = data.current_billing_period?.starts_at
    ? new Date(data.current_billing_period.starts_at)
    : new Date();
  const currentPeriodEnd = data.current_billing_period?.ends_at
    ? new Date(data.current_billing_period.ends_at)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const cancelAtPeriodEnd =
    data.scheduled_change?.action === "cancel" || status === "canceled";
  const canceledAt = data.canceled_at ? new Date(data.canceled_at) : null;
  const pausedAt = data.paused_at ? new Date(data.paused_at) : null;

  // Extract price / product info
  const firstItem = data.items?.[0];
  const priceId = firstItem?.price?.id || "unknown";
  const paddleProductId = firstItem?.price?.product_id;

  // Resolve internal product
  let productId = "membership_premium_monthly";
  if (paddleProductId) {
    const matchedProduct = await Product.findOne({
      $or: [{ paddlePriceId: priceId }, { paddleProductId }],
    });
    if (matchedProduct) {
      productId = matchedProduct.productId;
    }
  }

  // Management URLs provided by Paddle
  const managementUrls = {
    updatePaymentMethod: data.management_urls?.update_payment_method || null,
    cancel: data.management_urls?.cancel || null,
  };

  // Upsert subscription record
  const subscription = await Subscription.findOneAndUpdate(
    { subscriptionId },
    {
      $set: {
        userId,
        customerId,
        priceId,
        productId,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        canceledAt,
        pausedAt,
        managementUrls,
        metadata: {
          paddleData: data,
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Synchronize entitlements
  await syncSubscriptionEntitlements(subscription);
  console.log(
    `[Paddle Webhook] Successfully synchronized subscription ${subscriptionId} for user ${resolvedUser.username} (status: ${status})`
  );
}

/**
 * Handle completed transactions.
 */
export async function handleTransactionCompletedEvent(data) {
  if (!data || !data.id) return;

  const transactionId = data.id;
  const customerId = data.customer_id;
  const customData = data.custom_data || {};
  let userId = customData.userId || customData.user_id;

  // If this transaction is part of a subscription, sync subscription directly
  if (data.subscription_id) {
    await syncFromPaddleApi({ subscriptionId: data.subscription_id, userId });
    return;
  }

  // Check idempotency
  const existingPurchase = await Purchase.findOne({ transactionId });
  if (existingPurchase) {
    console.log(`[Paddle Webhook] Transaction ${transactionId} already processed.`);
    return;
  }

  let resolvedUser = null;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    resolvedUser = await User.findById(userId);
  }
  if (!resolvedUser && customData.username) {
    resolvedUser = await User.findOne({ username: customData.username });
  }
  if (!resolvedUser && data.customer?.email) {
    resolvedUser = await User.findOne({ email: data.customer.email.toLowerCase() });
  }

  if (!resolvedUser) {
    console.warn(`[Paddle Webhook] One-time transaction ${transactionId} missing valid user`);
    return;
  }

  userId = resolvedUser._id;

  const firstItem = data.items?.[0];
  const priceId = firstItem?.price?.id;
  const paddleProductId = firstItem?.price?.product_id;

  let matchedProduct = null;
  if (priceId || paddleProductId) {
    matchedProduct = await Product.findOne({
      $or: [{ paddlePriceId: priceId }, { paddleProductId }],
    });
  }

  const productId = matchedProduct?.productId || "unknown_product";
  const entitlementsGranted = matchedProduct?.entitlements || [];

  const amount = data.details?.totals?.total
    ? parseFloat(data.details.totals.total) / 100
    : 0;
  const currency = data.currency_code || "USD";

  const purchase = await Purchase.create({
    userId,
    productId,
    provider: "paddle",
    transactionId,
    amount,
    currency,
    status: "completed",
    purchasedAt: new Date(),
    entitlementsGranted,
    metadata: {
      paddleData: data,
    },
  });

  for (const entitlement of entitlementsGranted) {
    await grantEntitlement({
      userId,
      entitlement,
      source: "purchase",
      sourceId: transactionId,
      expiresAt: null,
      metadata: { productId },
    });
  }

  console.log(
    `[Paddle Webhook] Recorded one-time purchase ${transactionId} for user ${resolvedUser.username}`
  );
}

/**
 * Direct REST API synchronization fallback from Paddle.
 * Allows client to immediately query & activate subscription without relying solely on webhook delivery.
 */
export async function syncFromPaddleApi({ subscriptionId, transactionId, userId }) {
  const apiKey = process.env.PADDLE_API_KEY || process.env.PADDLE_API_SECRET_KEY;
  const environment = process.env.PADDLE_ENVIRONMENT || "sandbox";
  const baseUrl =
    environment === "production"
      ? "https://api.paddle.com"
      : "https://sandbox-api.paddle.com";

  if (!apiKey) {
    console.warn("[Paddle API Sync] No PADDLE_API_KEY configured.");
    return null;
  }

  try {
    if (subscriptionId) {
      console.log(`[Paddle API Sync] Fetching subscription ${subscriptionId} from Paddle API...`);
      const res = await fetch(`${baseUrl}/subscriptions/${subscriptionId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        if (data) {
          if (!data.custom_data) data.custom_data = {};
          if (userId && !data.custom_data.userId) {
            data.custom_data.userId = userId;
          }
          await handleSubscriptionEvent("subscription.sync", data);
          return { success: true, data };
        }
      } else {
        console.warn(`[Paddle API Sync] Subscription ${subscriptionId} HTTP ${res.status}`);
      }
    }

    if (transactionId) {
      console.log(`[Paddle API Sync] Fetching transaction ${transactionId} from Paddle API...`);
      const res = await fetch(`${baseUrl}/transactions/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        if (data) {
          if (data.subscription_id) {
            return await syncFromPaddleApi({
              subscriptionId: data.subscription_id,
              userId,
            });
          } else {
            if (!data.custom_data) data.custom_data = {};
            if (userId && !data.custom_data.userId) {
              data.custom_data.userId = userId;
            }
            await handleTransactionCompletedEvent(data);
            return { success: true, data };
          }
        }
      } else {
        console.warn(`[Paddle API Sync] Transaction ${transactionId} HTTP ${res.status}`);
      }
    }
  } catch (err) {
    console.error("[Paddle API Sync] Error calling Paddle API:", err);
  }

  return null;
}

/**
 * Generate an authenticated Paddle Customer Portal session URL.
 * Allows customers to securely view invoices, change payment methods, or cancel.
 * POST /customers/{customer_id}/portal-sessions
 * @param {string} customerId
 * @param {string[]} [subscriptionIds]
 * @returns {Promise<string|null>} Portal session URL or null
 */
export async function createPaddlePortalSession(customerId, subscriptionIds = []) {
  const apiKey = process.env.PADDLE_API_KEY || process.env.PADDLE_API_SECRET_KEY;
  const environment = process.env.PADDLE_ENVIRONMENT || "sandbox";
  const baseUrl =
    environment === "production"
      ? "https://api.paddle.com"
      : "https://sandbox-api.paddle.com";

  if (!apiKey || !customerId) {
    console.warn("[Paddle Portal Session] Missing API key or customerId");
    return null;
  }

  try {
    const payload = {};
    if (subscriptionIds && subscriptionIds.length > 0) {
      payload.subscription_ids = subscriptionIds;
    }

    const res = await fetch(`${baseUrl}/customers/${customerId}/portal-sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      const urls = json.data?.urls;
      const portalUrl =
        urls?.general?.overview ||
        urls?.subscriptions?.update_subscription_payment_method ||
        urls?.subscriptions?.cancel_subscription ||
        null;
      return portalUrl;
    } else {
      const errBody = await res.text();
      console.warn(`[Paddle Portal Session] Error HTTP ${res.status}:`, errBody);
      return null;
    }
  } catch (err) {
    console.error("[Paddle Portal Session] Request failed:", err);
    return null;
  }
}
