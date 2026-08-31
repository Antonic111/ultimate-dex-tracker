import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
dotenv.config({ path: "./.env" });

import Stripe from "stripe";

async function run() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  console.log("Stripe Secret Key prefix:", secretKey ? secretKey.substring(0, 8) : "MISSING");
  console.log("Stripe Price ID:", priceId);

  const stripe = new Stripe(secretKey);

  const couponId = "intro_first_month_20pct";

  // 1. Check if coupon exists or create it
  let coupon;
  try {
    coupon = await stripe.coupons.retrieve(couponId);
    console.log("\n[1] Coupon retrieved successfully from Stripe:", {
      id: coupon.id,
      name: coupon.name,
      percent_off: coupon.percent_off,
      duration: coupon.duration,
      valid: coupon.valid,
    });
  } catch (err) {
    console.log("\n[1] Coupon not found, creating coupon...", err.message);
    try {
      coupon = await stripe.coupons.create({
        id: couponId,
        name: "20% Off First Month",
        percent_off: 20,
        duration: "once",
        metadata: {
          app: "ultimate-dex-tracker",
          type: "introductory_offer",
        },
      });
      console.log("[1] Coupon created successfully:", {
        id: coupon.id,
        name: coupon.name,
        percent_off: coupon.percent_off,
        duration: coupon.duration,
      });
    } catch (createErr) {
      console.error("[1] Failed to create coupon. Message:", createErr.message, "Raw:", createErr.raw);
    }
  }

  // 2. Create Checkout Session with discounts: [{ coupon: couponId }]
  console.log("\n[2] Creating Stripe Checkout Session with discounts: [{ coupon: '" + couponId + "' }]...");
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      discounts: [
        {
          coupon: couponId,
        },
      ],
      success_url: "https://www.ultimatedextracker.com/membership/checkout?status=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://www.ultimatedextracker.com/membership",
      metadata: {
        test: "intro_discount_check",
      },
    });

    console.log("\n[3] Checkout Session created:", {
      id: session.id,
      url: session.url,
      amount_total: session.amount_total,
      amount_subtotal: session.amount_subtotal,
      total_details: session.total_details,
      discounts: session.discounts,
    });

    // Retrieve the session with discounts expanded
    const retrieved = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["total_details.breakdown", "line_items"],
    });

    console.log("\n[4] Retrieved Session total details:", {
      amount_subtotal: retrieved.amount_subtotal,
      amount_total: retrieved.amount_total,
      breakdown: retrieved.total_details?.breakdown,
      discounts: retrieved.total_details?.breakdown?.discounts,
    });
  } catch (checkoutErr) {
    console.error("\n[X] Error creating Checkout Session:", checkoutErr);
  }
}

run().catch(console.error);
