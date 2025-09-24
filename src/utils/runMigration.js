// Migration script to update caught data with new hunt system methods
import { migrateHuntMethods } from './migrateHuntMethods';
import { fetchCaughtData, updateCaughtData } from '../api/caught';

/**
 * Runs the hunt method migration for a specific user
 * @param {string} username - The username to migrate data for
 * @returns {Promise<Object>} - Migration results
 */
export async function runHuntMethodMigration(username) {
    if (!username) {
        throw new Error('Username is required for migration');
    }

    console.log(`Starting hunt method migration for user: ${username}`);
    
    try {
        // Fetch current caught data
        const caughtData = await fetchCaughtData(username);
        
        if (!caughtData || Object.keys(caughtData).length === 0) {
            console.log('No caught data found, skipping migration');
            return { success: true, message: 'No data to migrate' };
        }

        // Migrate the data
        const migratedData = migrateHuntMethods(caughtData);
        
        // Save the migrated data back to the database
        await updateCaughtData(username, null, migratedData);
        
        console.log(`Migration completed successfully for user: ${username}`);
        return { 
            success: true, 
            message: 'Migration completed successfully',
            dataKeys: Object.keys(migratedData).length
        };
        
    } catch (error) {
        console.error('Migration failed:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

/**
 * Runs migration for all users (admin function)
 * Note: This would need to be implemented on the server side
 */
export async function runMigrationForAllUsers() {
    console.log('Running migration for all users...');
    // This would need to be implemented on the server side
    // as it requires access to all user data
    throw new Error('Bulk migration not implemented - requires server-side implementation');
}
