import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
dotenv.config({ path: "./.env" });

import Stripe from "stripe";

async function run() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const fakeTestCustomerId = "cus_VAnAx4va6iTu3I";

  console.log("Testing customer retrieve with fake/test ID:", fakeTestCustomerId);
  try {
    const cust = await stripe.customers.retrieve(fakeTestCustomerId);
    console.log("Customer retrieved:", cust);
  } catch (err) {
    const isMissing = err.statusCode === 404 || err.raw?.statusCode === 404 || err.code === "resource_missing";
    console.log("Caught expected error. isMissing:", isMissing, "message:", err.message);
  }
}

run().catch(console.error);
