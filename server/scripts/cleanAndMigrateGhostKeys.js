import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");
const serverDir = path.resolve(__dirname, "../");

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

// Load canonical data
const pokemonData = JSON.parse(fs.readFileSync(path.join(rootDir, "src/data/pokemon.json"), "utf-8"));
const formsFiles = fs.readdirSync(path.join(rootDir, "src/data/forms")).filter(f => f.endsWith(".json"));

const validKeys = new Set();
pokemonData.forEach(p => {
  if (p.stableId) {
    validKeys.add(p.stableId);
    validKeys.add(`${p.stableId}_shiny`);
  }
});
formsFiles.forEach(file => {
  const forms = JSON.parse(fs.readFileSync(path.join(rootDir, "src/data/forms", file), "utf-8"));
  forms.forEach(f => {
    if (f.stableId) {
      validKeys.add(f.stableId);
      validKeys.add(`${f.stableId}_shiny`);
    }
  });
});

const KEY_MAPPINGS = {
  "hippopotas-gender-0450": "hippopotas-gender-0449",
  "hippopotas-gender-0450_shiny": "hippopotas-gender-0449_shiny",
  "zygarde-50": "zygarde-50-718",
  "zygarde-50_shiny": "zygarde-50-718_shiny",
  "zygarde-0718": "zygarde-50-718",
  "zygarde-0718_shiny": "zygarde-50-718_shiny"
};

function resolveTargetKey(invalidKey) {
  if (KEY_MAPPINGS[invalidKey]) return KEY_MAPPINGS[invalidKey];
  if (invalidKey.includes("-main-")) {
    const candidate = invalidKey.replace("-main-", "-");
    if (validKeys.has(candidate)) return candidate;
  }
  return null;
}

async function migrate() {
  console.log(`🔌 Connecting to MongoDB for safe migration...`);
  await mongoose.connect(mongoUri);
  console.log(`✅ Connected to database.`);

  const usersCollection = mongoose.connection.collection("users");
  const users = await usersCollection.find({}).toArray();

  let migratedCount = 0;
  let removedCount = 0;

  for (const user of users) {
    const caught = user.caughtPokemon || {};
    const keys = Object.keys(caught);
    const setOps = {};
    const unsetOps = {};

    for (const oldKey of keys) {
      if (!validKeys.has(oldKey)) {
        const targetKey = resolveTargetKey(oldKey);
        const oldVal = caught[oldKey];

        if (targetKey) {
          console.log(`[USER: ${user.username || user.email}] Migrating "${oldKey}" -> "${targetKey}"`);
          const existingTargetVal = caught[targetKey] || setOps[`caughtPokemon.${targetKey}`];

          if (existingTargetVal && typeof existingTargetVal === "object") {
            const existingEntries = Array.isArray(existingTargetVal.entries) ? existingTargetVal.entries : [];
            const oldEntries = Array.isArray(oldVal?.entries) ? oldVal.entries : [];
            const existingIds = new Set(existingEntries.map(e => e.entryId).filter(Boolean));
            const newEntriesToAppend = oldEntries.filter(e => !existingIds.has(e.entryId));

            setOps[`caughtPokemon.${targetKey}`] = {
              caught: true,
              caughtAt: existingTargetVal.caughtAt || oldVal?.caughtAt || Date.now(),
              entries: [...existingEntries, ...newEntriesToAppend]
            };
          } else {
            setOps[`caughtPokemon.${targetKey}`] = oldVal;
          }
          migratedCount++;
        } else {
          console.log(`[USER: ${user.username || user.email}] Unsetting unmappable ghost key "${oldKey}"`);
          removedCount++;
        }

        unsetOps[`caughtPokemon.${oldKey}`] = "";
      }
    }

    const updateDoc = {};
    if (Object.keys(setOps).length > 0) updateDoc.$set = setOps;
    if (Object.keys(unsetOps).length > 0) updateDoc.$unset = unsetOps;

    if (Object.keys(updateDoc).length > 0) {
      await usersCollection.updateOne({ _id: user._id }, updateDoc);
    }
  }

  console.log(`\n🎉 Migration Complete:`);
  console.log(`   - Keys Migrated to Canonical: ${migratedCount}`);
  console.log(`   - Ghost Keys Removed: ${migratedCount + removedCount}`);

  // Re-verify
  console.log(`\n🔍 Verifying Database Cleanliness...`);
  const refreshedUsers = await usersCollection.find({}).toArray();
  let remainingInvalid = 0;
  for (const u of refreshedUsers) {
    const c = u.caughtPokemon || {};
    for (const k of Object.keys(c)) {
      if (!validKeys.has(k)) {
        remainingInvalid++;
        console.error(`❌ Still invalid: ${u.username} -> ${k}`);
      }
    }
  }

  if (remainingInvalid === 0) {
    console.log(`✨ 100% CLEAN! Zero invalid keys remaining in MongoDB.`);
  }

  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
