import { useState, useEffect, useContext } from 'react';
import { Download, Upload, Database, FileText, ArchiveRestore, Trash2 } from 'lucide-react';
import { caughtAPI, profileAPI } from '../utils/api';
import { useTheme } from '../components/Shared/ThemeContext';
import { UserContext } from '../components/Shared/UserContext';
import { useMessage } from '../components/Shared/MessageContext';
import { LoadingSpinner } from '../components/Shared';
import { fetchCaughtData } from '../api/caught';
import ImportConfirmModal from '../components/Shared/ImportConfirmModal';
import RestoreBackupModal from '../components/Shared/RestoreBackupModal';

// Helper function to check if data contains old hunt methods that need migration
const checkIfDataNeedsMigration = (caughtData) => {
  if (!caughtData || typeof caughtData !== 'object') return false;
  
  // Check for old hunt method names that need migration
  const oldMethods = [
    'Battle Method', 'Chain Fishing', 'Chain Breeding', 'Chain SOS',
    'Chain Shiny', 'Chain Horde', 'Chain Friend Safari', 'Chain DexNav',
    'Chain Radar', 'Chain Masuda', 'Chain Shiny Charm', 'Chain Poké Radar',
    'Chain Shiny Stone', 'Chain Shiny Rock', 'Chain Shiny Grass',
    'Chain Shiny Water', 'Chain Shiny Cave', 'Chain Shiny Building'
  ];
  
  for (const pokemonKey in caughtData) {
    const pokemon = caughtData[pokemonKey];
    if (pokemon && pokemon.entries && Array.isArray(pokemon.entries)) {
      for (const entry of pokemon.entries) {
        // Check for old methods (with or without game)
        if (entry.method && oldMethods.includes(entry.method)) {
          return true; // Found old method, needs migration
        }
        // Also check for entries with method but no game (invalid state)
        if (entry.method && !entry.game) {
          return true; // Found invalid entry, needs migration
        }
      }
    }
  }
  
  return false;
};
import DeleteBackupModal from '../components/Shared/DeleteBackupModal';
import '../css/Backup.css';

export default function Backup() {
  const [caughtData, setCaughtData] = useState({});
  const [profileData, setProfileData] = useState({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupHistory, setBackupHistory] = useState([]);
  const [lastBackupData, setLastBackupData] = useState(null);
  const [lastBackupTime, setLastBackupTime] = useState(0);
  const [lastExportTime, setLastExportTime] = useState(0);
  const [lastImportTime, setLastImportTime] = useState(0);
  const [lastRestoreTime, setLastRestoreTime] = useState(0);
  const [lastDeleteTime, setLastDeleteTime] = useState(0);
  const [restoring, setRestoring] = useState(false); // Added back setRestoring state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState(null);
  const [pendingRestoreData, setPendingRestoreData] = useState(null);
  const [pendingDeleteData, setPendingDeleteData] = useState(null);
  const { theme, accent } = useTheme();
  const { username } = useContext(UserContext);
  const { showMessage } = useMessage();

  const MAX_BACKUPS = 10; // Maximum number of backups to keep

  useEffect(() => {
    loadUserData();
  }, []);

  const handleImportConfirm = async () => {
    if (!pendingImportData) return;

    try {
      setImporting(true);
      const pokemonData = pendingImportData.data?.caught || pendingImportData.data;
      
      if (pokemonData && Object.keys(pokemonData).length > 0) {
        await caughtAPI.updateCaughtData(pokemonData);
        setCaughtData(pokemonData);
        
        // Refresh the main dex grid data by calling fetchCaughtData
        try {
          const refreshedData = await fetchCaughtData(username);
          if (refreshedData) {
            // Force a page refresh to ensure the dex grid shows updated data
            window.location.reload();
          }
        } catch (error) {
          console.error('Failed to refresh caught data:', error);
          // If refresh fails, still show success but suggest manual refresh
          showMessage('Data imported successfully! You may need to refresh the page to see changes in the dex grid.', 'success');
        }
      }

      setLastImportTime(Date.now());
      showMessage('Data imported successfully!', 'success');
      
      // Clear the file input after successful import
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      showMessage(`Failed to import data: ${error.message}`, 'error');
    } finally {
      setImporting(false);
      setPendingImportData(null);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!pendingRestoreData) return;

    try {
      setRestoring(true);
      const caughtData = pendingRestoreData.data?.caught || pendingRestoreData.data;
      
      // Check if this backup contains old hunt method data that needs migration
      const needsMigration = checkIfDataNeedsMigration(caughtData);
      let finalData = caughtData;
      
      if (needsMigration) {
        console.log('Backup contains old hunt method data, applying migration...');
        const { migrateHuntMethods } = await import('../utils/migrateHuntMethods');
        finalData = migrateHuntMethods(caughtData);
        
        // Mark user as needing migration again since they restored old data
        try {
          const { authAPI } = await import('../utils/api');
          await authAPI.updateUser({ 
            huntMethodMigrationCompleted: false, 
            migrationVersion: "1.0" 
          });
        } catch (error) {
          console.warn('Failed to update migration status:', error);
        }
      }
      
      await caughtAPI.updateCaughtData(finalData);
      setCaughtData(finalData);

      // Refresh the main dex grid data by calling fetchCaughtData
      try {
        const refreshedData = await fetchCaughtData(username);
        if (refreshedData) {
          // Force a page refresh to ensure the dex grid shows updated data
          window.location.reload();
        }
      } catch (error) {
        console.error('Failed to refresh caught data:', error);
        // If refresh fails, still show success but suggest manual refresh
        showMessage('Backup restored successfully! You may need to refresh the page to see changes in the dex grid.', 'success');
      }

      setLastRestoreTime(Date.now());
      showMessage('Backup restored successfully!', 'success');
    } catch (error) {
      showMessage(`Failed to restore backup: ${error.message}`, 'error');
    } finally {
      setRestoring(false);
      setPendingRestoreData(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteData) return;

    try {
      const backupId = pendingDeleteData.id;
      
      localStorage.removeItem(backupId);
      setBackupHistory(prev => prev.filter(backup => backup.id !== backupId));

      // Clear lastBackupData if the deleted backup was the last one
      if (lastBackupData && backupId === lastBackupData.id) {
        setLastBackupData(null);
      }

      setLastDeleteTime(Date.now());
      showMessage('Backup deleted successfully!', 'success');
    } catch (error) {
      showMessage(`Failed to delete backup: ${error.message}`, 'error');
    } finally {
      setPendingDeleteData(null);
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Try to get user data from API
      let caught = {};
      let profile = {};
      
      try {
        // Try API calls first
        const [caughtResult, profileResult] = await Promise.all([
          caughtAPI.getCaughtData(),
          profileAPI.getProfile()
        ]);
        

        
        caught = caughtResult || {};
        profile = profileResult || {};
        
        // Clear any error messages
        // setMessage({ type: '', text: '' }); // This line is removed as per the new_code
      } catch (apiError) {
        console.error('API calls failed:', apiError);
        throw new Error('Failed to connect to server. Please check your connection and try again.');
      }
      
      setCaughtData(caught);
      setProfileData(profile);
    } catch (error) {
      console.error('Failed to load user data:', error);
      // setMessage({ type: 'error', text: error.message }); // This line is removed as per the new_code
      
      // Set empty data so the page still works
      setCaughtData({});
      setProfileData({ username: username || 'User', email: '', createdAt: '', profileTrainer: null, verified: false });
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      setExporting(true);
      
      // Check cooldown (prevent clicking within 1 second)
      const now = Date.now();
      if (now - lastExportTime < 1000) {
        showMessage('Please wait a moment before exporting again.', 'error');
        setExporting(false);
        return;
      }
      
      // Use username from context if profile data doesn't have it
      const usernameToUse = profileData.username || username || 'User';
      
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        user: {
          username: usernameToUse
        },
        data: {
          caught: caughtData || {}
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pokemon-backup-${usernameToUse}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLastExportTime(now); // Update the last export time
      showMessage('Data exported successfully!', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showMessage(`Failed to export data: ${error.message}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setImporting(true);
      
      // Check cooldown (prevent clicking within 1 second)
      const now = Date.now();
      if (now - lastImportTime < 1000) {
        showMessage('Please wait a moment before importing again.', 'error');
        setImporting(false);
        return;
      }
      
      const text = await file.text();
      const importedData = JSON.parse(text);

      // Validate the imported data structure
      if (!importedData.data && !importedData.caught) {
        throw new Error('Invalid backup file format - no Pokemon data found');
      }

      // Store the imported data and show modal
      setPendingImportData(importedData);
      setShowImportModal(true);
      setImporting(false);
      return;
    } catch (error) {
      showMessage(`Failed to import data: ${error.message}`, 'error');
    } finally {
      setImporting(false);
    }
  };

  const createBackup = async () => {
    try {
      setBackingUp(true);
      
      // Check cooldown (prevent clicking within 2 seconds)
      const now = Date.now();
      if (now - lastBackupTime < 2000) {
        showMessage('Please wait a moment before creating another backup.', 'error');
        setBackingUp(false);
        return;
      }
      
      // Use username from context if profile data doesn't have it
      const usernameToUse = profileData.username || username || 'User';
      
      const backupData = {
        version: '1.0',
        backupDate: new Date().toISOString(),
        user: {
          username: usernameToUse
        },
        data: {
          caught: caughtData || {}
        }
      };

      // Check if this backup would be identical to the last one
      if (lastBackupData && 
          lastBackupData.user.username === backupData.user.username) {
        
        // Compare the actual Pokemon data
        const currentPokemonData = JSON.stringify(backupData.data.caught || {});
        const lastPokemonData = JSON.stringify(lastBackupData.data?.caught || lastBackupData.data || {});
        
        /* removed debug log: duplicate check */
        
        if (currentPokemonData === lastPokemonData) {
          showMessage('Backup data is identical to the last backup. No changes detected.', 'error');
          setBackingUp(false);
          return;
        }
      }

      // Store backup in localStorage for now (could be enhanced to store on server)
      const backupKey = `pokemon-backup-${usernameToUse}-${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      
      // Update backup history
      const newBackup = {
        id: backupKey,
        date: new Date().toISOString(),
        size: JSON.stringify(backupData).length,
        caughtCount: Object.keys(caughtData || {}).length
      };
      
      setBackupHistory(prev => [newBackup, ...prev.slice(0, MAX_BACKUPS - 1)]); // Keep last MAX_BACKUPS backups
      
      // Store the last backup data for comparison (include the ID for deletion tracking)
      const backupDataWithId = { ...backupData, id: backupKey };
      setLastBackupData(backupDataWithId);
      setLastBackupTime(now); // Update the last backup time
      
      showMessage('Backup created successfully!', 'success');
    } catch (error) {
      console.error('Backup creation failed:', error);
      showMessage(`Failed to create backup: ${error.message}`, 'error');
    } finally {
      setBackingUp(false);
    }
  };

  const restoreBackup = async (backupId) => {
    try {
      const now = Date.now();
      if (now - lastRestoreTime < 1000) {
        showMessage('Please wait a moment before restoring another backup.', 'error');
        return;
      }

      const backupData = localStorage.getItem(backupId);
      if (!backupData) {
        showMessage('Backup not found.', 'error');
        return;
      }

      const backup = JSON.parse(backupData);
      const caughtData = backup.data?.caught || backup.data || {};

      if (Object.keys(caughtData).length === 0) {
        showMessage('This backup contains no Pokemon data.', 'error');
        return;
      }

      // Store the backup data and show modal
      setPendingRestoreData(backup);
      setShowRestoreModal(true);
      return;
    } catch (error) {
      showMessage(`Failed to restore backup: ${error.message}`, 'error');
    } finally {
      setRestoring(false);
    }
  };

  const deleteBackup = async (backupId) => {
    try {
      const now = Date.now();
      if (now - lastDeleteTime < 1000) {
        showMessage('Please wait a moment before deleting another backup.', 'error');
        return;
      }

      const backupData = localStorage.getItem(backupId);
      if (!backupData) {
        showMessage('Backup not found.', 'error');
        return;
      }

      const backup = JSON.parse(backupData);
      const caughtCount = Object.keys(backup.data?.caught || backup.data || {}).length;

      // Store the backup data and show modal
      setPendingDeleteData({ ...backup, id: backupId });
      setShowDeleteModal(true);
      return;
    } catch (error) {
      showMessage(`Failed to delete backup: ${error.message}`, 'error');
    }
  };

  // Load backup history on component mount
  useEffect(() => {
    const loadBackupHistory = () => {
      const history = [];
      let mostRecentBackup = null;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('pokemon-backup-')) {
          try {
            const backupData = JSON.parse(localStorage.getItem(key));

            // Handle both old and new backup formats
            const caughtCount = Object.keys(backupData.data?.caught || backupData.data || {}).length;
            const backupItem = {
              id: key,
              date: backupData.backupDate || backupData.exportDate || new Date().toISOString(),
              size: JSON.stringify(backupData).length,
              caughtCount: caughtCount
            };

            history.push(backupItem);
            
            // Track the most recent backup for duplicate detection
            // Extract timestamp from the backup key to determine actual creation order
            const keyTimestamp = parseInt(key.split('-').pop());
            if (!mostRecentBackup || keyTimestamp > parseInt(mostRecentBackup.id.split('-').pop())) {
              mostRecentBackup = { ...backupData, id: key };
            }
          } catch (error) {
            // Skip invalid backups
            console.warn('Skipping invalid backup:', key, error);
          }
        }
      }
      
      // Sort by date (newest first) and take last MAX_BACKUPS
      history.sort((a, b) => new Date(b.date) - new Date(a.date));
      const finalHistory = history.slice(0, MAX_BACKUPS);

      setBackupHistory(finalHistory);
      
      // Restore the most recent backup data for duplicate detection
      if (mostRecentBackup) {
        /* removed debug log: restoring last backup */
        setLastBackupData(mostRecentBackup);
      } else {
        /* removed debug log: no mostRecentBackup */
      }
    };

    loadBackupHistory();
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="backup-page">
        <div className="backup-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="backup-page page-container slide-up">
      <div className="backup-container">
        <div className="backup-header">
          <h1>Backup & Import/Export</h1>
          <div className="header-divider"></div>
        </div>

        {/* Removed message display as per new_code */}

        <div className="backup-sections">
          {/* Left Box - Export & Import */}
          <div className="backup-section left-section">
            {/* Export Section */}
            <div className="section-header">
              <Download size={20} />
              <h2>Export Data</h2>
            </div>
            <p>Download your Pokemon data as a JSON file for safekeeping or transfer to another account.</p>
            
            <div className="data-summary">
              <div className="summary-item">
                <span className="label">Total Pokemon:</span>
                <span className="value">{Object.keys(caughtData).length}</span>
              </div>
              <div className="summary-item">
                <span className="label">Shiny Pokemon:</span>
                <span className="value">
                  {Object.keys(caughtData).filter(key => key.endsWith('_shiny')).length}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Regular Pokemon:</span>
                <span className="value">
                  {Object.keys(caughtData).filter(key => !key.endsWith('_shiny')).length}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Username:</span>
                <span className="value">{profileData.username || username || 'User'}</span>
              </div>
            </div>

            <button 
              className="action-button export"
              onClick={exportData}
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : 'Export Data'}
            </button>

            {/* Divider */}
            <div className="section-divider"></div>

            {/* Import Section */}
            <div className="section-header">
              <Upload size={20} />
              <h2>Import Data</h2>
            </div>
            <p>Import Pokemon data from a previously exported backup file.</p>
            
            <div className="import-warning">
              <span>Warning: Importing will overwrite your current data. Make sure to export first!</span>
            </div>

            <label className="file-input-label">
              <input
                type="file"
                accept=".json"
                onChange={importData}
                disabled={importing}
                style={{ display: 'none' }}
              />
              <span className="file-input-button">
                {importing ? 'Importing...' : 'Choose File & Import'}
              </span>
            </label>
            
            {/* Add space after import button */}
            <div style={{ height: '15px' }}></div>
          </div>

          {/* Right Box - Local Backups */}
          <div className="backup-section right-section">
            <div className="section-header">
              <Database size={20} />
              <h2>Local Backups</h2>
            </div>
            <p>Create and manage local backups stored in your browser. These are safe and private.</p>
            
            <button 
              className="action-button backup"
              onClick={createBackup}
              disabled={backingUp}
            >
              {backingUp ? 'Creating Backup...' : 'Create Backup'}
            </button>

            <div style={{ 
              fontSize: '0.85rem', 
              color: 'var(--text-secondary)', 
              textAlign: 'center', 
              marginTop: '10px',
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '6px'
            }}>
              {backupHistory.length >= MAX_BACKUPS ? (
                `Maximum backups reached (${MAX_BACKUPS}). Delete old backups to create new ones.`
              ) : (
                `${backupHistory.length} of ${MAX_BACKUPS} backups used`
              )}
            </div>

            {/* Backup History Container - Always visible with grey background */}
            <div className="backup-history-container">
              {backupHistory.length > 0 ? (
                <div className="backup-history">
                  <h3 data-count={`(${backupHistory.length}/${MAX_BACKUPS})`}>
                    Recent Backups
                  </h3>
                  <div className="backup-list">
                    {backupHistory.map((backup) => {

                      return (
                        <div key={backup.id} className="backup-item">
                          <div className="backup-info">
                            <div className="backup-header-line">
                              <span className="backup-date">{formatDate(backup.date)}</span>
                              <span className="backup-count">{backup.caughtCount} Pokemon</span>
                              <span className="backup-size">{formatFileSize(backup.size)}</span>
                            </div>

                          </div>
                          <div className="backup-actions">
                            <button 
                              className="restore-button"
                              onClick={() => restoreBackup(backup.id)}
                              title="Restore this backup"
                              disabled={restoring}
                            >
                              <ArchiveRestore size={16} />
                            </button>
                            <button 
                              className="delete-button"
                              onClick={() => deleteBackup(backup.id)}
                              title="Delete this backup"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="empty-backups">
                  <p>No backups yet</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Create your first backup to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="backup-footer">
          <div className="footer-info">
            <FileText size={16} />
            <span>
              Your Pokemon data is automatically saved to the server. Local backups provide an additional layer of protection.
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showImportModal && (
        <ImportConfirmModal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setPendingImportData(null);
            // Clear the file input when modal is closed
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) {
              fileInput.value = '';
            }
          }}
          onConfirm={handleImportConfirm}
          backupData={pendingImportData}
          username={username}
        />
      )}

      {showRestoreModal && (
        <RestoreBackupModal
          isOpen={showRestoreModal}
          onClose={() => {
            setShowRestoreModal(false);
            setPendingRestoreData(null);
          }}
          onConfirm={handleRestoreConfirm}
          backupData={pendingRestoreData}
          username={username}
        />
      )}

      {showDeleteModal && (
        <DeleteBackupModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setPendingDeleteData(null);
          }}
          onConfirm={handleDeleteConfirm}
          backupData={pendingDeleteData}
        />
      )}
    </div>
  );
}
