/**
 * One-time migration script to convert all user data from old keys (name_formType)
 * to new keys (stableId). This runs once to future-proof the database.
 * 
 * Usage: node scripts/migrateToStableIds.js
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

// Dynamically import User model (will be loaded after connection)
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

async function migrateUser(user, mappings, userId, useNativeDriver = false) {
  const oldCaught = user.caughtPokemon instanceof Map
    ? Object.fromEntries(user.caughtPokemon)
    : (user.caughtPokemon || {});
  
  const newCaught = {};
  let migratedCount = 0;
  let alreadyMigratedCount = 0;
  let skippedCount = 0;
  
  // Migrate each old key to new stableId key
  for (const [oldKey, data] of Object.entries(oldCaught)) {
    // Skip null/undefined data (uncaught Pokemon)
    if (data === null || data === undefined) {
      continue;
    }
    
    // Check if key is already in stableId format
    // StableId format: name-#### or name-formType-#### or name-formType-####_shiny (#### can be 1-4 digits)
    // Examples: "bulbasaur-alpha-1", "charmander-alpha-4_shiny", "rowlet-alpha-0722", "urshifu-single-strike-892"
    // Also handles main dex: "bulbasaur-0001", "venusaur-0003_shiny"
    // Pattern: ends with -#### or -####_shiny where #### is 1-4 digits
    const isAlreadyStableId = /-[0-9]{1,4}(_shiny)?$/.test(oldKey);
    
    if (isAlreadyStableId) {
      // Already using stableId format - keep as is
      newCaught[oldKey] = data;
      alreadyMigratedCount++;
      continue;
    }
    
    // Check if this old key has a mapping to a new stableId key
    const newKey = mappings[oldKey];
    
    if (newKey) {
      // Migrate to new key
      newCaught[newKey] = data;
      migratedCount++;
    } else {
      // No mapping found - discard old key (no backward compatibility)
      skippedCount++;
    }
  }
  
  // Only update if we actually have data to save
  if (Object.keys(newCaught).length > 0 || Object.keys(oldCaught).length > 0) {
    if (useNativeDriver) {
      // Use native MongoDB driver to update directly
      const db = mongoose.connection.db;
      const usersCollection = db.collection('users');
      await usersCollection.updateOne(
        { _id: userId },
        { $set: { caughtPokemon: newCaught } }
      );
    } else {
      // Try Mongoose save, but fall back to native driver if it fails
      try {
        user.caughtPokemon = newCaught;
        await user.save();
      } catch (saveError) {
        if (saveError.message.includes('buffering')) {
          // Fall back to native driver
          const db = mongoose.connection.db;
          const usersCollection = db.collection('users');
          await usersCollection.updateOne(
            { _id: userId },
            { $set: { caughtPokemon: newCaught } }
          );
        } else {
          throw saveError;
        }
      }
    }
    return { migratedCount, alreadyMigratedCount, skippedCount };
  }
  
  return { migratedCount: 0, alreadyMigratedCount: 0, skippedCount: 0 };
}

async function main() {
  // Check for common MongoDB env var names
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_URL || process.env.MONGO_URL;
  
  if (!mongoUri) {
    console.error('❌ Error: MongoDB connection string not found');
    console.log('\n   Environment variables checked:');
    console.log('   - MONGODB_URI');
    console.log('   - MONGO_URI');
    console.log('   - MONGODB_URL');
    console.log('   - MONGO_URL');
    console.log('\n   PowerShell: Set it with:');
    console.log('   $env:MONGO_URI="your-connection-string"');
    console.log('   Or create a .env file in the root directory\n');
    process.exit(1);
  }
  
  console.log('🚀 Starting database migration to stableId keys...\n');
  
  try {
    // Disable buffering BEFORE connecting
    mongoose.set('bufferCommands', false);
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    
    const connectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000
    });
    
    // Wait for connection
    await connectionPromise;
    
    // Wait for connection to be fully ready
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
    
    // Load key mappings
    console.log('📖 Loading key mappings...');
    const mappings = loadKeyMappings();
    console.log(`   Loaded ${Object.keys(mappings).length} key mappings\n`);
    
    // Get all users (with fallback to native driver if Mongoose is buffering)
    console.log('🔍 Fetching all users...');
    let users;
    try {
      users = await User.find({}).maxTimeMS(30000);
    } catch (bufferError) {
      if (bufferError.message.includes('buffering')) {
        console.log('   Mongoose buffering issue, using native driver...');
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        const userDocs = await usersCollection.find({}).toArray();
        // Convert to Mongoose documents
        users = userDocs.map(doc => new User(doc));
      } else {
        throw bufferError;
      }
    }
    console.log(`📊 Found ${users.length} users to migrate\n`);
    
    if (users.length === 0) {
      console.log('✅ No users to migrate');
      await mongoose.disconnect();
      return;
    }
    
    // Migrate each user
    let totalMigrated = 0;
    let totalAlreadyMigrated = 0;
    let totalSkipped = 0;
    let usersUpdated = 0;
    const useNativeDriver = users.length > 0 && users[0].constructor.name !== 'model'; // Check if we got native docs
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const userId = user._id || user.id;
      const username = user.username || 'Unknown';
      
      const result = await migrateUser(user, mappings, userId, useNativeDriver);
      
      if (result.migratedCount > 0 || result.alreadyMigratedCount > 0) {
        usersUpdated++;
        totalMigrated += result.migratedCount;
        totalAlreadyMigrated += result.alreadyMigratedCount;
        totalSkipped += result.skippedCount;
        
        const status = [];
        if (result.migratedCount > 0) status.push(`Migrated ${result.migratedCount}`);
        if (result.alreadyMigratedCount > 0) status.push(`Already migrated ${result.alreadyMigratedCount}`);
        if (result.skippedCount > 0) status.push(`Discarded ${result.skippedCount}`);
        
        console.log(`[${i + 1}/${users.length}] ${username}: ${status.join(', ')}`);
      } else {
        console.log(`[${i + 1}/${users.length}] ${username}: No caught Pokemon to migrate`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Migration complete!');
    console.log(`   Users updated: ${usersUpdated}/${users.length}`);
    console.log(`   Keys migrated: ${totalMigrated}`);
    console.log(`   Keys already migrated (kept): ${totalAlreadyMigrated}`);
    console.log(`   Keys discarded (no mapping): ${totalSkipped}`);
    console.log(`   Total keys after migration: ${totalMigrated + totalAlreadyMigrated}`);
    console.log('='.repeat(50) + '\n');
    
    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
main();
