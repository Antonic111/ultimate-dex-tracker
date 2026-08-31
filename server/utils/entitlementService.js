import UserEntitlement from "../models/UserEntitlement.js";
import Product from "../models/Product.js";
import Subscription from "../models/Subscription.js";

/**
 * Entitlement Service
 * Central authority for evaluating, granting, and revoking user entitlements.
 */

/**
 * Get all currently active, non-expired entitlements for a user.
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<Array<string>>} List of unique entitlement strings
 */
export async function getUserEntitlements(userId) {
  if (!userId) return [];

  const now = new Date();
  const entitlements = await UserEntitlement.find({
    userId,
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  }).select("entitlement source expiresAt");

  return [...new Set(entitlements.map((e) => e.entitlement))];
}

/**
 * Check if a user currently has a specific active entitlement.
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string} entitlementKey
 * @returns {Promise<boolean>}
 */
export async function hasUserEntitlement(userId, entitlementKey) {
  if (!userId || !entitlementKey) return false;

  const now = new Date();
  const record = await UserEntitlement.findOne({
    userId,
    entitlement: entitlementKey,
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  });

  return Boolean(record);
}

/**
 * Grant or update an entitlement idempotently.
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.entitlement
 * @param {'subscription'|'purchase'|'promotion'|'admin'} params.source
 * @param {string} [params.sourceId]
 * @param {Date|null} [params.expiresAt]
 * @param {Object} [params.metadata]
 */
export async function grantEntitlement({
  userId,
  entitlement,
  source,
  sourceId = null,
  expiresAt = null,
  metadata = {},
}) {
  return await UserEntitlement.findOneAndUpdate(
    { userId, entitlement, source, sourceId },
    {
      $set: {
        isActive: true,
        expiresAt,
        grantedAt: new Date(),
        metadata,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/**
 * Synchronize entitlements for a subscription according to its status and current period end.
 * If active or scheduled to cancel at period end, the entitlement remains valid until `currentPeriodEnd`.
 * If past_due, paused, or canceled past the period, active status is revoked.
 * @param {Object} subscription - Subscription document
 */
export async function syncSubscriptionEntitlements(subscription) {
  if (!subscription || !subscription.userId) return;

  const { userId, productId, subscriptionId, status, currentPeriodEnd, cancelAtPeriodEnd } =
    subscription;

  // Resolve product entitlements
  let entitlementKeys = ["premium"];
  if (productId) {
    const product = await Product.findOne({ productId });
    if (product?.entitlements?.length) {
      entitlementKeys = product.entitlements;
    }
  }

  const now = new Date();
  const isPeriodActive = currentPeriodEnd && new Date(currentPeriodEnd) > now;

  // Subscription provides access if active, trialing, or if canceled but paid period is still valid
  const hasAccess =
    (status === "active" || status === "trialing" || cancelAtPeriodEnd) && isPeriodActive;

  for (const entitlement of entitlementKeys) {
    if (hasAccess) {
      await grantEntitlement({
        userId,
        entitlement,
        source: "subscription",
        sourceId: subscriptionId,
        expiresAt: currentPeriodEnd,
        metadata: {
          status,
          cancelAtPeriodEnd,
        },
      });
    } else {
      // Deactivate or set expired
      await UserEntitlement.updateMany(
        {
          userId,
          entitlement,
          source: "subscription",
          sourceId: subscriptionId,
        },
        {
          $set: {
            isActive: false,
            expiresAt: currentPeriodEnd || now,
          },
        }
      );
    }
  }
}

/**
 * Revoke all entitlements associated with a specific sourceId (e.g. refunded purchase or terminated subscription).
 * @param {string} sourceId
 */
export async function revokeEntitlementsBySource(sourceId) {
  if (!sourceId) return;

  return await UserEntitlement.updateMany(
    { sourceId },
    {
      $set: {
        isActive: false,
        expiresAt: new Date(),
      },
    }
  );
}

/**
 * Get the membership badge details (isPremium, premiumMonths) for a single user.
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<{ isPremium: boolean, premiumMonths: number, premiumSince: Date|null }>}
 */
export async function getMembershipBadgeInfo(userId) {
  if (!userId) return { isPremium: false, premiumMonths: 0, premiumSince: null };

  const [entitlements, subscription] = await Promise.all([
    getUserEntitlements(userId),
    Subscription.findOne({ userId }).sort({ createdAt: 1 }),
  ]);

  const isPremium = entitlements.includes("premium");
  if (!isPremium) return { isPremium: false, premiumMonths: 0, premiumSince: null };

  let premiumMonths = 1;
  const startDate = subscription?.createdAt || subscription?.currentPeriodStart;
  if (startDate) {
    const diffMs = Date.now() - new Date(startDate).getTime();
    const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375)) + 1;
    premiumMonths = Math.max(1, diffMonths);
  }

  return {
    isPremium: true,
    premiumMonths,
    premiumSince: startDate || new Date(),
  };
}

/**
 * Batch resolve membership badge details for multiple users (e.g. trainers leaderboard / lists).
 * @param {Array<string|mongoose.Types.ObjectId>} userIds
 * @returns {Promise<Map<string, { isPremium: boolean, premiumMonths: number }>>}
 */
export async function getBatchMembershipBadgeInfo(userIds) {
  const resultMap = new Map();
  if (!userIds || !userIds.length) return resultMap;

  const now = new Date();
  const [activeEntitlements, subscriptions] = await Promise.all([
    UserEntitlement.find({
      userId: { $in: userIds },
      entitlement: "premium",
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).select("userId createdAt grantedAt"),
    Subscription.find({
      userId: { $in: userIds },
    }).sort({ createdAt: 1 }),
  ]);

  const subMap = new Map();
  subscriptions.forEach((sub) => {
    const uidStr = sub.userId.toString();
    if (!subMap.has(uidStr)) {
      subMap.set(uidStr, sub.createdAt || sub.currentPeriodStart);
    }
  });

  activeEntitlements.forEach((ent) => {
    const uidStr = ent.userId.toString();
    const startDate = subMap.get(uidStr) || ent.grantedAt || ent.createdAt || now;
    const diffMs = now.getTime() - new Date(startDate).getTime();
    const diffMonths = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375)) + 1);
    resultMap.set(uidStr, {
      isPremium: true,
      premiumMonths: diffMonths,
    });
  });

  return resultMap;
}

/**
 * Grant or extend admin-granted premium membership for a user.
 * Separate from paid subscriptions (source: 'admin').
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.userId
 * @param {'months'|'days'|'date'|'permanent'} params.grantType
 * @param {number} [params.months=1]
 * @param {number} [params.days=30]
 * @param {string|Date} [params.untilDate]
 * @param {string|mongoose.Types.ObjectId} [params.grantedBy]
 * @param {string} [params.note]
 */
export async function grantAdminPremium({
  userId,
  grantType = "months",
  months = 1,
  days = 30,
  untilDate = null,
  grantedBy = null,
  note = "",
}) {
  let expiresAt = null;
  const now = new Date();

  if (grantType === "months") {
    const numMonths = Math.max(1, parseInt(months, 10) || 1);
    expiresAt = new Date(now.getTime() + numMonths * 30 * 24 * 60 * 60 * 1000);
  } else if (grantType === "days") {
    const numDays = Math.max(1, parseInt(days, 10) || 30);
    expiresAt = new Date(now.getTime() + numDays * 24 * 60 * 60 * 1000);
  } else if (grantType === "date") {
    if (!untilDate) throw new Error("Expiration date is required for date-based grant.");
    expiresAt = new Date(untilDate);
    if (isNaN(expiresAt.getTime()) || expiresAt <= now) {
      throw new Error("Expiration date must be in the future.");
    }
  } else if (grantType === "permanent") {
    expiresAt = null;
  } else {
    // Default 1 month
    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  const entitlement = await grantEntitlement({
    userId,
    entitlement: "premium",
    source: "admin",
    sourceId: "admin_grant",
    expiresAt,
    metadata: {
      grantedBy,
      grantType,
      months: grantType === "months" ? months : undefined,
      days: grantType === "days" ? days : undefined,
      note,
      updatedAt: new Date(),
    },
  });

  return entitlement;
}

/**
 * Revoke only admin-granted premium membership for a user.
 * Preserves any active paid Stripe subscriptions intact.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 */
export async function revokeAdminPremium(userId) {
  const result = await UserEntitlement.updateMany(
    { userId, entitlement: "premium", source: "admin" },
    { $set: { isActive: false, expiresAt: new Date() } }
  );
  return result;
}

/**
 * Detailed entitlement breakdown for Admin management table.
 * Resolves whether a user has subscription vs admin granted premium.
 *
 * @param {Array<string|mongoose.Types.ObjectId>} userIds
 * @returns {Promise<Map<string, { isPremium: boolean, premiumSource: 'subscription'|'admin'|'both'|'none', premiumExpiresAt: Date|null, adminGrant: Object|null, subscription: Object|null }>>}
 */
export async function getAdminUserEntitlementDetails(userIds) {
  const resultMap = new Map();
  if (!userIds || !userIds.length) return resultMap;

  const now = new Date();
  const [entitlements, subscriptions] = await Promise.all([
    UserEntitlement.find({
      userId: { $in: userIds },
      entitlement: "premium",
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).lean(),
    Subscription.find({
      userId: { $in: userIds },
      status: { $in: ["active", "trialing", "past_due"] },
    }).lean(),
  ]);

  const subMap = new Map();
  subscriptions.forEach((sub) => {
    subMap.set(sub.userId.toString(), sub);
  });

  const entMap = new Map();
  entitlements.forEach((ent) => {
    const uid = ent.userId.toString();
    if (!entMap.has(uid)) entMap.set(uid, []);
    entMap.get(uid).push(ent);
  });

  userIds.forEach((id) => {
    const uidStr = id.toString();
    const userEnts = entMap.get(uidStr) || [];
    const userSub = subMap.get(uidStr) || null;

    const hasSubEnt = userEnts.some((e) => e.source === "subscription") || Boolean(userSub && userSub.status === "active");
    const adminEnt = userEnts.find((e) => e.source === "admin") || null;
    const hasAdminEnt = Boolean(adminEnt);

    let premiumSource = "none";
    if (hasSubEnt && hasAdminEnt) premiumSource = "both";
    else if (hasSubEnt) premiumSource = "subscription";
    else if (hasAdminEnt) premiumSource = "admin";

    const isPremium = premiumSource !== "none";
    let premiumExpiresAt = null;
    if (adminEnt) {
      premiumExpiresAt = adminEnt.expiresAt;
    } else if (userSub && userSub.currentPeriodEnd) {
      premiumExpiresAt = userSub.currentPeriodEnd;
    }

    resultMap.set(uidStr, {
      isPremium,
      premiumSource,
      premiumExpiresAt,
      adminGrant: adminEnt,
      subscription: userSub,
    });
  });

  return resultMap;
}

