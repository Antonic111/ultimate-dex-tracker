import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");
const serverDir = path.resolve(__dirname, "../");

// Load env files
[
  path.join(rootDir, ".env.local"),
  path.join(rootDir, ".env"),
  path.join(serverDir, ".env.local"),
  path.join(serverDir, ".env")
].forEach(envPath => {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
});

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("❌ MONGO_URI not found in environment variables.");
  process.exit(1);
}

// 1. Load canonical data
const pokemonDataPath = path.join(rootDir, "src/data/pokemon.json");
const formsDirPath = path.join(rootDir, "src/data/forms");

const pokemonData = JSON.parse(fs.readFileSync(pokemonDataPath, "utf-8"));
const formsFiles = fs.readdirSync(formsDirPath).filter(f => f.endsWith(".json"));

const canonicalValidKeys = new Set();
const canonicalStableIds = new Set();

// Add base pokemon
pokemonData.forEach(p => {
  if (p.stableId) {
    canonicalValidKeys.add(p.stableId);
    canonicalValidKeys.add(`${p.stableId}_shiny`);
    canonicalStableIds.add(p.stableId);
  }
});

// Add all forms
formsFiles.forEach(file => {
  const formsContent = JSON.parse(fs.readFileSync(path.join(formsDirPath, file), "utf-8"));
  formsContent.forEach(f => {
    if (f.stableId) {
      canonicalValidKeys.add(f.stableId);
      canonicalValidKeys.add(`${f.stableId}_shiny`);
      canonicalStableIds.add(f.stableId);
    }
  });
});

console.log(`\n============================================================`);
console.log(`🔍 CANONICAL DATASET LOADED`);
console.log(`============================================================`);
console.log(`Total canonical keys recognized: ${canonicalValidKeys.size}`);
console.log(`Total canonical stable IDs: ${canonicalStableIds.size}`);

async function runScan() {
  console.log(`\n🔌 Connecting to MongoDB (Read-Only Scan)...`);
  await mongoose.connect(mongoUri);
  console.log(`✅ Connected successfully to database.\n`);

  const usersCollection = mongoose.connection.collection("users");
  const recentCatchesCollection = mongoose.connection.collection("recentcatches");

  const users = await usersCollection.find({}, { projection: { username: 1, email: 1, caughtPokemon: 1 } }).toArray();

  console.log(`============================================================`);
  console.log(`📊 SCANNING USERS FOR INVALID CAUGHT POKÉMON KEYS`);
  console.log(`============================================================`);
  console.log(`Total users in DB: ${users.length}\n`);

  let totalInvalidKeys = 0;
  let affectedUsersCount = 0;
  const userIssues = [];

  for (const user of users) {
    const caught = user.caughtPokemon || {};
    const keys = Object.keys(caught);
    const invalidForUser = [];

    for (const key of keys) {
      if (!canonicalValidKeys.has(key)) {
        totalInvalidKeys++;
        const val = caught[key];

        // Suggest fix
        let suggestedKey = null;
        if (key.includes("-main-")) {
          suggestedKey = key.replace("-main-", "-");
        }

        invalidForUser.push({
          invalidKey: key,
          suggestedKey,
          isShiny: key.endsWith("_shiny"),
          caught: val?.caught ?? val,
          entriesCount: Array.isArray(val?.entries) ? val.entries.length : 0,
          entries: val?.entries || []
        });
      }
    }

    if (invalidForUser.length > 0) {
      affectedUsersCount++;
      userIssues.push({
        userId: user._id,
        username: user.username || "(No username)",
        email: user.email || "(No email)",
        totalCaughtKeysCount: keys.length,
        invalidKeys: invalidForUser
      });
    }
  }

  if (userIssues.length === 0) {
    console.log(`✨ All clean! 0 invalid keys found in any user's caughtPokemon map.`);
  } else {
    console.log(`⚠️  FOUND ${totalInvalidKeys} INVALID / UNALIGNED KEYS ACROSS ${affectedUsersCount} USER(S):\n`);

    userIssues.forEach((issue, index) => {
      console.log(`------------------------------------------------------------`);
      console.log(`User #${index + 1}: ${issue.username} (${issue.email})`);
      console.log(`User ID: ${issue.userId}`);
      console.log(`Total Keys in User's Map: ${issue.totalCaughtKeysCount}`);
      console.log(`Invalid Keys Count: ${issue.invalidKeys.length}`);
      console.log(`Invalid Keys Details:`);

      issue.invalidKeys.forEach(k => {
        console.log(`  ❌ Invalid Key: "${k.invalidKey}"`);
        if (k.suggestedKey) {
          console.log(`     💡 Canonical Equivalent: "${k.suggestedKey}" (Valid: ${canonicalValidKeys.has(k.suggestedKey)})`);
        }
        console.log(`     Caught Value: ${k.caught}`);
        console.log(`     Entries Logged: ${k.entriesCount}`);
        if (k.entries.length > 0) {
          console.log(`     Entry details:`, JSON.stringify(k.entries, null, 2).split('\n').map(l => '       ' + l).join('\n'));
        }
      });
    });
  }

  // Scan RecentCatches collection as well
  console.log(`\n============================================================`);
  console.log(`📊 SCANNING RECENT CATCHES (GLOBAL FEED) COLLECTION`);
  console.log(`============================================================`);
  const recentCatches = await recentCatchesCollection.find({}).toArray();
  console.log(`Total RecentCatch documents: ${recentCatches.length}`);

  let invalidCatchesCount = 0;
  recentCatches.forEach(rc => {
    // Check if name aligns
    const name = rc.pokemonName;
    const match = pokemonData.some(p => p.name.toLowerCase() === (name || "").toLowerCase()) ||
                  formsFiles.some(f => {
                    const fc = JSON.parse(fs.readFileSync(path.join(formsDirPath, f), "utf-8"));
                    return fc.some(item => item.name.toLowerCase() === (name || "").toLowerCase());
                  });
    if (!match) {
      invalidCatchesCount++;
      console.log(`  ⚠️ Unknown Pokémon name in RecentCatch: "${name}" (ID: ${rc._id}, User: ${rc.username})`);
    }
  });

  if (invalidCatchesCount === 0) {
    console.log(`✨ All ${recentCatches.length} RecentCatch documents contain valid Pokémon names.`);
  }

  console.log(`\n============================================================`);
  console.log(`🏁 SCAN COMPLETE (READ-ONLY) — NO DATABASE MODIFICATIONS MADE.`);
  console.log(`============================================================\n`);

  await mongoose.disconnect();
  process.exit(0);
}

runScan().catch(err => {
  console.error("❌ Scan Error:", err);
  process.exit(1);
});
