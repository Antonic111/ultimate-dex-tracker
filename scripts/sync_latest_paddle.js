import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectToDatabase } from "../server/db.js";
import { handleSubscriptionEvent } from "../server/utils/paddleService.js";
import User from "../server/models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });

async function syncLatest() {
  await connectToDatabase();
  const apiKey = process.env.PADDLE_API_KEY || process.env.PADDLE_API_SECRET_KEY;
  console.log("Using API Key:", apiKey ? apiKey.substring(0, 10) + "..." : "NONE");

  const res = await fetch("https://sandbox-api.paddle.com/subscriptions?per_page=5", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  const json = await res.json();
  console.log("Paddle Sandbox Subscriptions Response:", JSON.stringify(json, null, 2));

  if (json.data && json.data.length > 0) {
    for (const sub of json.data) {
      console.log(`Syncing subscription ${sub.id}...`);
      await handleSubscriptionEvent("subscription.sync", sub);
    }
  }

  process.exit(0);
}

syncLatest().catch(console.error);
