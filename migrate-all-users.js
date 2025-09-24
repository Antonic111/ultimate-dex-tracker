// One-time migration script for all users
// Run this after deploying to production: node migrate-all-users.js

import mongoose from 'mongoose';
import { migrateHuntMethods } from './src/utils/migrateHuntMethods.js';

// Connect to your database
const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-connection-string';

async function migrateAllUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database');

    // Get all users who haven't been migrated
    const User = mongoose.model('User', {
      username: String,
      caughtPokemon: Object,
      huntMethodMigrationCompleted: Boolean,
      migrationVersion: String
    });

    const usersToMigrate = await User.find({ 
      huntMethodMigrationCompleted: { $ne: true } 
    });

    console.log(`Found ${usersToMigrate.length} users to migrate`);

    let successful = 0;
    let failed = 0;

    for (const user of usersToMigrate) {
      try {
        const caughtData = user.caughtPokemon;
        if (caughtData && Object.keys(caughtData).length > 0) {
          // Run the migration
          const migratedData = migrateHuntMethods(caughtData);
          
          // Update the user
          await User.findByIdAndUpdate(user._id, {
            caughtPokemon: migratedData,
            huntMethodMigrationCompleted: true,
            migrationVersion: "1.1"
          });
          
          successful++;
          console.log(`✅ Migrated user: ${user.username}`);
        } else {
          // No data to migrate, just mark as completed
          await User.findByIdAndUpdate(user._id, {
            huntMethodMigrationCompleted: true,
            migrationVersion: "1.1"
          });
          successful++;
          console.log(`✅ Marked user as migrated (no data): ${user.username}`);
        }
      } catch (error) {
        failed++;
        console.error(`❌ Failed to migrate user ${user.username}:`, error.message);
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrateAllUsers();
