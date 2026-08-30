import { connectToDatabase } from "../server/db.js";
import Subscription from "../server/models/Subscription.js";
import UserEntitlement from "../server/models/UserEntitlement.js";
import User from "../server/models/User.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });

async function check() {
  await connectToDatabase();
  const users = await User.find({}, { username: 1, email: 1 }).lean();
  console.log("USERS:", users);
  const subs = await Subscription.find({}).lean();
  console.log("SUBSCRIPTIONS:", subs);
  const ents = await UserEntitlement.find({}).lean();
  console.log("ENTITLEMENTS:", ents);
  process.exit(0);
}

check().catch(console.error);
