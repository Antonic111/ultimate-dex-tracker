import Stripe from "stripe";
import mongoose from "mongoose";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import StripeEvent from "../models/StripeEvent.js";
import {
  syncSubscriptionEntitlements,
  revokeEntitlementsBySource,
} from "./entitlementService.js";

/**
 * Stripe Service
 * Handles Stripe Checkout (Managed Payments MoR), Billing subscriptions,
 * Customer Portal, and idempotent webhook event synchronization.
 */

let stripeInstance = null;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey);
  }
  return stripeInstance;
}

/**
 * Verify Stripe webhook signature using raw request body Buffer.
 * @param {Buffer|string} rawBody - Raw unparsed HTTP body
 * @param {string} signature - stripe-signature header value
 * @param {string} webhookSecret - STRIPE_WEBHOOK_SECRET
 * @returns {Stripe.Event} Verified Stripe event
 */
export function constructStripeWebhookEvent(rawBody, signature, webhookSecret) {
  if (!rawBody || !signature || !webhookSecret) {
    throw new Error("Missing rawBody, signature, or webhookSecret for Stripe verification.");
  }
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

/**
 * Create a Stripe Checkout session with Stripe Managed Payments enabled.
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.userId - Authenticated user ID
 * @param {string} [params.origin] - Request origin for return URLs
 * @returns {Promise<string>} Checkout session URL
 */
export async function createStripeCheckoutSession({ userId, origin }) {
  const stripe = getStripeClient();
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!priceId) {
    const err = new Error("STRIPE_PRICE_ID is not configured in server environment.");
    err.code = "CONFIG_ERROR";
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found.");
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  // Prevent duplicate active/trialing Stripe subscriptions
  const existingSub = await Subscription.findOne({
    userId,
    provider: "stripe",
    status: { $in: ["active", "trialing"] },
  });

  if (existingSub && existingSub.currentPeriodEnd && new Date(existingSub.currentPeriodEnd) > new Date()) {
    const err = new Error("You already have an active Premium membership.");
    err.code = "ALREADY_SUBSCRIBED";
    throw err;
  }

  const baseOrigin = origin || process.env.FRONTEND_URL || "https://www.ultimatedextracker.com";

  const sessionParams = {
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    // Explicitly enable Stripe Managed Payments (Merchant of Record)
    managed_payments: {
      enabled: true,
    },
    client_reference_id: user._id.toString(),
    metadata: {
      userId: user._id.toString(),
      username: user.username || "",
    },
    subscription_data: {
      metadata: {
        userId: user._id.toString(),
        username: user.username || "",
      },
    },
    success_url: `${baseOrigin}/membership?status=processing&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseOrigin}/membership`,
  };

  // Reuse existing Stripe customer if stored; otherwise provide customer_email
  if (user.stripeCustomerId) {
    sessionParams.customer = user.stripeCustomerId;
  } else if (user.email) {
    sessionParams.customer_email = user.email;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session.url;
}

/**
 * Create a Stripe Customer Portal session for managing subscriptions, payment methods, and invoices.
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.userId - Authenticated user ID
 * @param {string} [params.origin] - Request origin for return URL
 * @returns {Promise<string>} Customer Portal URL
 */
export async function createStripePortalSession({ userId, origin }) {
  const stripe = getStripeClient();
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found.");
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  let customerId = user.stripeCustomerId;

  // Fallback: check subscription record if not yet cached on User document
  if (!customerId) {
    const sub = await Subscription.findOne({ userId, provider: "stripe" }).sort({ createdAt: -1 });
    if (sub?.customerId) {
      customerId = sub.customerId;
      user.stripeCustomerId = customerId;
      await user.save().catch(() => {});
    }
  }

  if (!customerId) {
    const err = new Error("No active Stripe customer record found for this account.");
    err.code = "NO_STRIPE_CUSTOMER";
    throw err;
  }

  const baseOrigin = origin || process.env.FRONTEND_URL || "https://www.ultimatedextracker.com";
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseOrigin}/membership`,
  });

  return portalSession.url;
}

/**
 * Process verified Stripe webhook events idempotently.
 * Handles:
 * - checkout.session.completed
 * - invoice.paid
 * - invoice.payment_failed
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * @param {Stripe.Event} event
 */
export async function processStripeWebhookEvent(event) {
  if (!event || !event.type) {
    throw new Error("Invalid Stripe event object.");
  }

  // Webhook Idempotency Check
  const existing = await StripeEvent.findOne({ eventId: event.id });
  if (existing) {
    console.log(`[Stripe Webhook] Event ${event.id} (${event.type}) already processed. Skipping duplicate.`);
    return { duplicate: true };
  }

  console.log(`[Stripe Webhook] Processing event: ${event.type} [${event.id}]`);

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object);
      break;

    case "invoice.paid":
      await handleInvoicePaid(event.data.object);
      break;

    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object);
      break;

    case "customer.subscription.updated":
      await handleCustomerSubscriptionUpdated(event.data.object);
      break;

    case "customer.subscription.deleted":
      await handleCustomerSubscriptionDeleted(event.data.object);
      break;

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      break;
  }

  // Record event as successfully processed for idempotency
  await StripeEvent.create({
    eventId: event.id,
    type: event.type,
    processedAt: new Date(),
  });

  return { success: true };
}

/**
 * 1. checkout.session.completed
 * Link customer & subscription, store in DB, and synchronize entitlements.
 */
async function handleCheckoutSessionCompleted(session) {
  if (session.mode !== "subscription" || !session.subscription) {
    console.log("[Stripe Webhook] Skipping non-subscription checkout session.");
    return;
  }

  const userId = session.client_reference_id || session.metadata?.userId;
  const customerId = session.customer;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;

  console.log(`[Stripe Webhook] checkout.session.completed for user ${userId}, sub ${subscriptionId}`);

  let resolvedUser = null;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    resolvedUser = await User.findById(userId);
  } else if (session.customer_email) {
    resolvedUser = await User.findOne({ email: session.customer_email.toLowerCase() });
  }

  if (resolvedUser && customerId) {
    if (!resolvedUser.stripeCustomerId || resolvedUser.stripeCustomerId !== customerId) {
      resolvedUser.stripeCustomerId = customerId;
      await resolvedUser.save().catch((err) => console.error("Error saving user stripeCustomerId:", err));
    }
  }

  const finalUserId = resolvedUser?._id || userId;
  if (!finalUserId) {
    console.warn(`[Stripe Webhook] Could not resolve internal user for subscription ${subscriptionId}`);
    return;
  }

  // Retrieve authoritative subscription state from Stripe
  const stripe = getStripeClient();
  const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);

  const priceId = stripeSub.items?.data?.[0]?.price?.id || process.env.STRIPE_PRICE_ID || "monthly_premium";
  const currentPeriodStart = new Date(stripeSub.current_period_start * 1000);
  const currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);

  const subDoc = await Subscription.findOneAndUpdate(
    { subscriptionId: stripeSub.id },
    {
      userId: finalUserId,
      provider: "stripe",
      customerId,
      subscriptionId: stripeSub.id,
      priceId,
      productId: "membership_premium_monthly",
      status: stripeSub.status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: Boolean(stripeSub.cancel_at_period_end),
      canceledAt: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null,
      metadata: stripeSub.metadata || {},
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await syncSubscriptionEntitlements(subDoc);
  console.log(`[Stripe Webhook] Subscribed user ${finalUserId} with status ${stripeSub.status} until ${currentPeriodEnd.toISOString()}`);
}

/**
 * 2. invoice.paid
 * Authoritative successful billing payment. Refresh period end and activate access.
 */
async function handleInvoicePaid(invoice) {
  if (!invoice.subscription) {
    console.log("[Stripe Webhook] Invoice paid for non-subscription transaction.");
    return;
  }

  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;
  console.log(`[Stripe Webhook] invoice.paid for subscription ${subscriptionId}`);

  let subDoc = await Subscription.findOne({ subscriptionId });

  // Resolve period boundaries from line items or invoice root
  let periodStart = invoice.lines?.data?.[0]?.period?.start
    ? new Date(invoice.lines.data[0].period.start * 1000)
    : invoice.period_start ? new Date(invoice.period_start * 1000) : new Date();

  let periodEnd = invoice.lines?.data?.[0]?.period?.end
    ? new Date(invoice.lines.data[0].period.end * 1000)
    : invoice.period_end ? new Date(invoice.period_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (subDoc) {
    subDoc.status = "active";
    subDoc.currentPeriodStart = periodStart;
    subDoc.currentPeriodEnd = periodEnd;
    await subDoc.save();
    await syncSubscriptionEntitlements(subDoc);
    console.log(`[Stripe Webhook] invoice.paid updated subscription ${subscriptionId} end date to ${periodEnd.toISOString()}`);
  } else {
    // If subscription record not yet created by checkout.session.completed, retrieve and insert
    const stripe = getStripeClient();
    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
    let userId = stripeSub.metadata?.userId;
    if (!userId && invoice.customer) {
      const user = await User.findOne({ stripeCustomerId: invoice.customer });
      userId = user?._id;
    }

    if (userId) {
      const newSub = await Subscription.findOneAndUpdate(
        { subscriptionId: stripeSub.id },
        {
          userId,
          provider: "stripe",
          customerId: invoice.customer,
          subscriptionId: stripeSub.id,
          priceId: stripeSub.items?.data?.[0]?.price?.id || process.env.STRIPE_PRICE_ID,
          productId: "membership_premium_monthly",
          status: "active",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: Boolean(stripeSub.cancel_at_period_end),
          canceledAt: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null,
          metadata: stripeSub.metadata || {},
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      await syncSubscriptionEntitlements(newSub);
    }
  }
}

/**
 * 3. invoice.payment_failed
 * Synchronize failure status (past_due) without immediately terminating access if still within paid period.
 */
async function handleInvoicePaymentFailed(invoice) {
  if (!invoice.subscription) return;

  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;
  console.log(`[Stripe Webhook] invoice.payment_failed for subscription ${subscriptionId}`);

  const subDoc = await Subscription.findOne({ subscriptionId });
  if (subDoc) {
    const stripe = getStripeClient();
    try {
      const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
      subDoc.status = stripeSub.status; // e.g. 'past_due'
    } catch {
      subDoc.status = "past_due";
    }
    await subDoc.save();
    await syncSubscriptionEntitlements(subDoc);
    console.log(`[Stripe Webhook] Subscription ${subscriptionId} status updated to ${subDoc.status}`);
  }
}

/**
 * 4. customer.subscription.updated
 * Synchronize subscription status, schedule changes, and period dates.
 * If cancel_at_period_end is true, Premium remains active until currentPeriodEnd.
 */
async function handleCustomerSubscriptionUpdated(stripeSub) {
  if (!stripeSub || !stripeSub.id) return;

  console.log(`[Stripe Webhook] customer.subscription.updated for ${stripeSub.id}: status=${stripeSub.status}, cancelAtEnd=${stripeSub.cancel_at_period_end}`);

  let subDoc = await Subscription.findOne({ subscriptionId: stripeSub.id });
  const currentPeriodStart = new Date(stripeSub.current_period_start * 1000);
  const currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);

  if (subDoc) {
    subDoc.status = stripeSub.status;
    subDoc.currentPeriodStart = currentPeriodStart;
    subDoc.currentPeriodEnd = currentPeriodEnd;
    subDoc.cancelAtPeriodEnd = Boolean(stripeSub.cancel_at_period_end);
    subDoc.canceledAt = stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null;
    await subDoc.save();
    await syncSubscriptionEntitlements(subDoc);
  } else {
    // If not found, resolve user
    let userId = stripeSub.metadata?.userId;
    if (!userId && stripeSub.customer) {
      const user = await User.findOne({ stripeCustomerId: stripeSub.customer });
      userId = user?._id;
    }

    if (userId) {
      const newSub = await Subscription.findOneAndUpdate(
        { subscriptionId: stripeSub.id },
        {
          userId,
          provider: "stripe",
          customerId: stripeSub.customer,
          subscriptionId: stripeSub.id,
          priceId: stripeSub.items?.data?.[0]?.price?.id || process.env.STRIPE_PRICE_ID,
          productId: "membership_premium_monthly",
          status: stripeSub.status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: Boolean(stripeSub.cancel_at_period_end),
          canceledAt: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null,
          metadata: stripeSub.metadata || {},
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      await syncSubscriptionEntitlements(newSub);
    }
  }
}

/**
 * 5. customer.subscription.deleted
 * Subscription has ended/terminated. Revoke Stripe subscription entitlements.
 * Preserves admin/manual entitlements and other valid providers.
 */
async function handleCustomerSubscriptionDeleted(stripeSub) {
  if (!stripeSub || !stripeSub.id) return;

  console.log(`[Stripe Webhook] customer.subscription.deleted for ${stripeSub.id}`);

  const subDoc = await Subscription.findOne({ subscriptionId: stripeSub.id });
  if (subDoc) {
    subDoc.status = "canceled";
    subDoc.canceledAt = stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : new Date();
    await subDoc.save();
  }

  // Revoke ONLY entitlements tied to this specific Stripe subscription ID
  await revokeEntitlementsBySource(stripeSub.id);
  console.log(`[Stripe Webhook] Revoked subscription entitlements for source ${stripeSub.id}`);
}
