/**
 * Test migration script for a single user account
 * Only migrates the specified username (safe for testing)
 * 
 * Usage: node scripts/testMigration.js <username>
 * Example: node scripts/testMigration.js Antonic
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from multiple locations (like server.js does)
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'server', '.env.local') });
dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We'll import the User model after connecting to MongoDB
// This ensures Mongoose is ready before the model is registered
let User;
async function loadUserModel() {
  if (!User) {
    try {
      // Import using absolute path from project root
      const userModulePath = path.resolve(__dirname, '../server/models/User.js');
      const userModule = await import(`file://${userModulePath}`);
      User = userModule.default;
      
      if (!User) {
        throw new Error('User model not found in default export');
      }
    } catch (error) {
      console.error('❌ Failed to import User model:', error.message);
      console.error('   Make sure the User model exists at server/models/User.js');
      throw error;
    }
  }
  return User;
}

// Load key mappings (old key -> new stableId key)
function loadKeyMappings() {
  const mappingsPath = path.join(__dirname, '../src/utils/keyMappings.json');
  if (!fs.existsSync(mappingsPath)) {
    throw new Error('keyMappings.json not found. Run generateKeyMappings.js first.');
  }
  return JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
}

function analyzeMigration(user, mappings) {
  const oldCaught = user.caughtPokemon instanceof Map
    ? Object.fromEntries(user.caughtPokemon)
    : (user.caughtPokemon || {});
  
  const allKeys = Object.keys(oldCaught);
  const keysWithData = allKeys.filter(key => {
    const data = oldCaught[key];
    return data !== null && data !== undefined;
  });
  
  const analysis = {
    totalKeys: allKeys.length,  // All keys including nulls
    keysWithData: keysWithData.length,  // Only keys with actual caught data
    willMigrate: [],
    willDiscard: [],
    alreadyMigrated: []
  };
  
  // Analyze each old key (only process keys with data)
  for (const oldKey of keysWithData) {
    const data = oldCaught[oldKey];
    
    // Check if key is already in stableId format
    // StableId format: name-#### or name-formType-#### or name-formType-####_shiny (#### can be 1-4 digits)
    // Examples: "bulbasaur-alpha-1", "charmander-alpha-4_shiny", "rowlet-alpha-0722", "urshifu-single-strike-892"
    // Also handles main dex: "bulbasaur-0001", "venusaur-0003_shiny"
    // Pattern: ends with -#### or -####_shiny where #### is 1-4 digits
    const isAlreadyStableId = /-[0-9]{1,4}(_shiny)?$/.test(oldKey);
    
    if (isAlreadyStableId) {
      // Already using stableId format - keep as is
      analysis.alreadyMigrated.push({ oldKey, newKey: oldKey });
      continue;
    }
    
    // Check if this old key has a mapping to a new stableId key
    // This works for both main dex (name/name_shiny) and forms (name_formType/name_formType_shiny)
    const newKey = mappings[oldKey];
    
    if (newKey) {
      // Has mapping - will migrate
      analysis.willMigrate.push({ oldKey, newKey, data });
    } else {
      // No mapping found - will be discarded
      analysis.willDiscard.push({ oldKey, data });
    }
  }
  
  return analysis;
}

async function migrateUser(user, mappings, dryRun = true) {
  const oldCaught = user.caughtPokemon instanceof Map
    ? Object.fromEntries(user.caughtPokemon)
    : (user.caughtPokemon || {});
  
  const newCaught = {};
  let migratedCount = 0;
  let discardedCount = 0;
  let keptCount = 0;
  
  // Migrate each old key to new stableId key
  for (const [oldKey, data] of Object.entries(oldCaught)) {
    // Skip null/undefined data
    if (data === null || data === undefined) {
      continue;
    }
    
    // Check if key is already in stableId format
    const isAlreadyStableId = /-[0-9]{4}(_shiny)?$/.test(oldKey);
    
    if (isAlreadyStableId) {
      // Already using stableId format - keep as is
      newCaught[oldKey] = data;
      keptCount++;
      continue;
    }
    
    // Check if this old key has a mapping to a new stableId key
    // This works for both main dex (name/name_shiny) and forms (name_formType/name_formType_shiny)
    const newKey = mappings[oldKey];
    
    if (newKey) {
      // Migrate to new key
      newCaught[newKey] = data;
      migratedCount++;
    } else {
      // No mapping found - discard old key
      discardedCount++;
    }
  }
  
  // Only update if we actually have changes and not dry run
  if (!dryRun && (migratedCount > 0 || discardedCount > 0)) {
    // Use native MongoDB driver to avoid buffering issues
    try {
      const db = mongoose.connection.db;
      const usersCollection = db.collection('users');
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { caughtPokemon: newCaught } }
      );
    } catch (saveError) {
      // Fallback to Mongoose save if native driver fails
      user.caughtPokemon = newCaught;
      await user.save();
    }
  }
  
  return { migratedCount, discardedCount, keptCount, newCaught };
}

async function main() {
  const username = process.argv[2];
  
  if (!username) {
    console.error('❌ Error: Username required');
    console.log('\nUsage: node scripts/testMigration.js <username>');
    console.log('Example: node scripts/testMigration.js Antonic\n');
    process.exit(1);
  }
  
  // Check for common MongoDB env var names
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_URL || process.env.MONGO_URL;
  
  if (!mongoUri) {
    console.error('❌ Error: MongoDB connection string not found');
    console.log('\n   Environment variables checked:');
    console.log('   - MONGODB_URI');
    console.log('   - MONGO_URI');
    console.log('   - MONGODB_URL');
    console.log('   - MONGO_URL');
    console.log('\n   .env files checked:');
    console.log('   - .env');
    console.log('   - .env.local');
    console.log('   - server/.env');
    console.log('   - server/.env.local');
    console.log('\n   PowerShell: Set it with:');
    console.log('   $env:MONGO_URI="your-connection-string"');
    console.log('   Or create a .env file in the root directory with:');
    console.log('   MONGO_URI=your-connection-string\n');
    process.exit(1);
  }
  
  console.log(`🧪 Testing migration for user: ${username}\n`);
  console.log('='.repeat(60));
  
  try {
    // Disable buffering BEFORE connecting
    mongoose.set('bufferCommands', false);
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    
    const connectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000
    });
    
    // Wait for both connection and ready state
    await connectionPromise;
    
    // Wait for connection to be fully ready (readyState === 1 means connected)
    let attempts = 0;
    while (mongoose.connection.readyState !== 1 && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Connection not ready after 3 seconds');
    }
    
    console.log('✅ Connected to MongoDB (readyState:', mongoose.connection.readyState, ')\n');
    
    // Load User model after connection is established
    console.log('📦 Loading User model...');
    User = await loadUserModel();
    console.log('✅ User model loaded\n');
    
    // Verify connection is still ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Connection lost after loading model');
    }
    
    // Find the specific user
    console.log(`🔍 Looking for user: ${username}...`);
    
    // Use native MongoDB driver as fallback if Mongoose is still buffering
    let user;
    try {
      user = await User.findOne({ username }).maxTimeMS(30000);
    } catch (bufferError) {
      if (bufferError.message.includes('buffering')) {
        console.log('   Mongoose buffering issue, using native driver...');
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        const userDoc = await usersCollection.findOne({ username });
        if (userDoc) {
          // Convert to Mongoose document
          user = new User(userDoc);
        } else {
          user = null;
        }
      } else {
        throw bufferError;
      }
    }
    if (!user) {
      console.error(`❌ Error: User "${username}" not found`);
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${username}`);
    console.log(`   User ID: ${user._id}\n`);
    
    // Load key mappings
    console.log('📖 Loading key mappings...');
    const mappings = loadKeyMappings();
    console.log(`   Loaded ${Object.keys(mappings).length} key mappings\n`);
    
    // Analyze what will happen
    console.log('🔍 Analyzing migration...\n');
    const analysis = analyzeMigration(user, mappings);
    
    console.log('📊 Analysis Results:');
    console.log(`   Total keys in database: ${analysis.totalKeys} (includes null/uncaught entries)`);
    console.log(`   Keys with caught data: ${analysis.keysWithData} (actual caught Pokemon)`);
    console.log(`   Will migrate: ${analysis.willMigrate.length}`);
    console.log(`   Will discard: ${analysis.willDiscard.length}`);
    console.log(`   Already migrated: ${analysis.alreadyMigrated.length}`);
    console.log(`   Total after migration: ${analysis.willMigrate.length + analysis.alreadyMigrated.length}`);
    console.log(`   (Will migrate + Already migrated = ${analysis.willMigrate.length + analysis.alreadyMigrated.length})`);
    console.log(`   Null/uncaught keys: ${analysis.totalKeys - analysis.keysWithData} (will be ignored)\n`);
    
    // Show sample migrations
    if (analysis.willMigrate.length > 0) {
      console.log('📝 Sample migrations (first 5):');
      analysis.willMigrate.slice(0, 5).forEach(({ oldKey, newKey }) => {
        console.log(`   "${oldKey}" → "${newKey}"`);
      });
      if (analysis.willMigrate.length > 5) {
        console.log(`   ... and ${analysis.willMigrate.length - 5} more`);
      }
      console.log('');
    }
    
    // Show what will be discarded
    if (analysis.willDiscard.length > 0) {
      console.log('⚠️  Keys that will be DISCARDED (no mapping found):');
      analysis.willDiscard.forEach(({ oldKey }) => {
        console.log(`   "${oldKey}"`);
      });
      console.log('');
    }
    
    // Debug: Check if expected count matches
    // User expects: 4118 caught Pokemon - 2 discarded = 4116 after migration
    // The "already migrated" entries are part of the 4118 total, not additional
    const expectedAfterMigration = 4118 - analysis.willDiscard.length; // User's total caught - discarded
    const actualAfterMigration = analysis.willMigrate.length + analysis.alreadyMigrated.length;
    const difference = expectedAfterMigration - actualAfterMigration;
    
    // Also check: if willMigrate + alreadyMigrated = keysWithData (minus discarded), then count is correct
    const expectedFromKeysWithData = analysis.keysWithData - analysis.willDiscard.length;
    
    if (difference !== 0 || actualAfterMigration !== expectedFromKeysWithData) {
      console.log(`⚠️  Count mismatch detected:`);
      console.log(`   Total keys in database: ${analysis.totalKeys} (includes ${analysis.totalKeys - analysis.keysWithData} null/uncaught)`);
      console.log(`   Keys with caught data: ${analysis.keysWithData}`);
      console.log(`   Expected after migration: ${expectedAfterMigration} (4118 caught - ${analysis.willDiscard.length} discarded)`);
      console.log(`   Actual after migration: ${actualAfterMigration} (${analysis.willMigrate.length} will migrate + ${analysis.alreadyMigrated.length} already migrated)`);
      console.log(`   Expected from keys with data: ${expectedFromKeysWithData} (${analysis.keysWithData} caught - ${analysis.willDiscard.length} discarded)`);
      console.log(`   Difference: ${difference} Pokemon missing\n`);
      
      // Count unique Pokemon (not shiny variants)
      const uniqueMigrated = new Set();
      const uniqueAlreadyMigrated = new Set();
      
      analysis.willMigrate.forEach(({ newKey }) => {
        const baseKey = newKey.replace(/_shiny$/, '');
        uniqueMigrated.add(baseKey);
      });
      
      analysis.alreadyMigrated.forEach(({ oldKey }) => {
        const baseKey = oldKey.replace(/_shiny$/, '');
        uniqueAlreadyMigrated.add(baseKey);
      });
      
      console.log(`📊 Unique Pokemon counts:`);
      console.log(`   Will migrate (unique): ${uniqueMigrated.size}`);
      console.log(`   Already migrated (unique): ${uniqueAlreadyMigrated.size}`);
      console.log(`   Total unique: ${uniqueMigrated.size + uniqueAlreadyMigrated.size}`);
      console.log(`   Expected unique: ${expectedAfterMigration / 2} (assuming 50/50 shiny split)\n`);
      
      // Find all keys that should have mappings but don't
      console.log('🔍 Checking for keys without mappings...');
      const allKeys = Object.keys(user.caughtPokemon instanceof Map ? Object.fromEntries(user.caughtPokemon) : (user.caughtPokemon || {}));
      const keysWithData = allKeys.filter(key => {
        const data = (user.caughtPokemon instanceof Map ? Object.fromEntries(user.caughtPokemon) : (user.caughtPokemon || {}))[key];
        return data !== null && data !== undefined;
      });
      
      const keysNeedingMigration = keysWithData.filter(key => {
        const isAlreadyStableId = /-[0-9]{1,4}(_shiny)?$/.test(key);
        return !isAlreadyStableId && !mappings[key];
      });
      
      if (keysNeedingMigration.length > analysis.willDiscard.length) {
        console.log(`   Found ${keysNeedingMigration.length} keys without mappings (expected ${analysis.willDiscard.length}):`);
        keysNeedingMigration.forEach(key => {
          if (!analysis.willDiscard.find(d => d.oldKey === key)) {
            console.log(`   ⚠️  "${key}" - missing mapping but not in discard list`);
          }
        });
      }
      console.log('');
    }
    
    // Ask for confirmation
    console.log('='.repeat(60));
    console.log('\n⚠️  DRY RUN - No changes will be saved');
    console.log('   To actually migrate, run with --execute flag\n');
    
    // If --execute flag is present, actually do the migration
    const shouldExecute = process.argv.includes('--execute');
    
    if (shouldExecute) {
      console.log('🚀 Executing migration...\n');
      const result = await migrateUser(user, mappings, false);
      
    console.log('='.repeat(60));
    console.log('✅ Migration completed!');
    console.log(`   Keys migrated: ${result.migratedCount}`);
    console.log(`   Keys discarded: ${result.discardedCount}`);
    console.log(`   Keys kept (already migrated): ${result.keptCount}`);
    console.log(`   Total keys before: ${analysis.totalKeys}`);
    console.log(`   Total keys after: ${Object.keys(result.newCaught).length}`);
    console.log(`   Expected after: ${result.migratedCount + result.keptCount} (migrated + kept)`);
    console.log(`   Difference: ${analysis.totalKeys - Object.keys(result.newCaught).length} (discarded)`);
    console.log('='.repeat(60) + '\n');
    } else {
      console.log('💡 To execute the migration, run:');
      console.log(`   node scripts/testMigration.js ${username} --execute\n`);
    }
    
    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('\n❌ Error during migration:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
    process.exit(1);
  }
}

// Run test migration
main();
