import React, { useState } from 'react';
import { runHuntMethodMigration } from '../../utils/runMigration';
import { useUser } from '../Shared/UserContext';

export default function MigrationTool() {
    const { user } = useUser();
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState(null);

    const handleMigration = async () => {
        if (!user?.username) {
            setResult({ success: false, error: 'No user logged in' });
            return;
        }

        setIsRunning(true);
        setResult(null);

        try {
            const migrationResult = await runHuntMethodMigration(user.username);
            setResult(migrationResult);
        } catch (error) {
            setResult({ success: false, error: error.message });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Hunt Method Migration</h2>
            <p className="text-gray-600 mb-4">
                This will update your caught data to use the new hunt system method names.
                Invalid methods for specific games will be removed.
            </p>
            
            <button
                onClick={handleMigration}
                disabled={isRunning || !user?.username}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
            >
                {isRunning ? 'Migrating...' : 'Run Migration'}
            </button>

            {result && (
                <div className={`mt-4 p-3 rounded ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {result.success ? (
                        <div>
                            <p className="font-semibold">Migration Successful!</p>
                            <p>{result.message}</p>
                            {result.dataKeys && (
                                <p>Updated {result.dataKeys} Pokemon entries</p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="font-semibold">Migration Failed</p>
                            <p>{result.error}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
