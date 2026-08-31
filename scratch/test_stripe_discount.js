import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
dotenv.config({ path: "./.env" });

import Stripe from "stripe";
import mongoose from "mongoose";
import User from "../server/models/User.js";
import Subscription from "../server/models/Subscription.js";
import { getOrCreateIntroductoryCoupon, isUserEligibleForIntroDiscount, createStripeCheckoutSession } from "../server/utils/stripeService.js";

async function run() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/ultimate-dex-tracker";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  console.log("Stripe key configured:", Boolean(stripeKey), "Key prefix:", stripeKey ? stripeKey.substring(0, 7) : "none");

  const stripe = new Stripe(stripeKey);

  // 1. Test coupon retrieval or creation
  console.log("\n--- STEP 1: Testing getOrCreateIntroductoryCoupon ---");
  try {
    const couponId = await getOrCreateIntroductoryCoupon();
    console.log("Retrieved/Created Coupon ID:", couponId);

    const coupon = await stripe.coupons.retrieve(couponId);
    console.log("Stripe Coupon details:", {
      id: coupon.id,
      name: coupon.name,
      percent_off: coupon.percent_off,
      duration: coupon.duration,
      valid: coupon.valid,
    });
  } catch (err) {
    console.error("Error in getOrCreateIntroductoryCoupon:", err);
  }

  // 2. Find user Antonic or create a temporary test user
  console.log("\n--- STEP 2: Testing eligibility ---");
  let user = await User.findOne({ username: { $regex: /^antonic$/i } });
  if (!user) {
    user = await User.findOne({});
  }

  if (user) {
    console.log("Found user:", user.username, "ID:", user._id.toString(), "hasPurchasedStripePremium:", user.hasPurchasedStripePremium, "stripeCustomerId:", user.stripeCustomerId);

    const isEligible = await isUserEligibleForIntroDiscount(user._id);
    console.log("isUserEligibleForIntroDiscount result:", isEligible);

    // 3. Test createStripeCheckoutSession
    console.log("\n--- STEP 3: Creating Checkout Session ---");
    try {
      const sessionUrl = await createStripeCheckoutSession({ userId: user._id, origin: "http://localhost:5173" });
      console.log("Created session URL:", sessionUrl);

      // Extract sessionId from sessionUrl or list latest session
      const sessions = await stripe.checkout.sessions.list({ limit: 1 });
      if (sessions.data.length > 0) {
        const latestSession = sessions.data[0];
        console.log("Latest Session details:", {
          id: latestSession.id,
          mode: latestSession.mode,
          amount_total: latestSession.amount_total,
          amount_subtotal: latestSession.amount_subtotal,
          discounts: latestSession.discounts,
          total_details: latestSession.total_details,
          metadata: latestSession.metadata,
        });
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
    }
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

run().catch(console.error);
