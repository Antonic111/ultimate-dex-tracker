import { useState, useEffect, useContext } from 'react';
import { Download, Upload, Database, FileText } from 'lucide-react';
import { caughtAPI, profileAPI } from '../utils/api';
import { useTheme } from '../components/Shared/ThemeContext';
import { UserContext } from '../components/Shared/UserContext';
import { useMessage } from '../components/Shared/MessageContext';
import { fetchCaughtData } from '../api/caught';
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
  const { theme, accent } = useTheme();
  const { username } = useContext(UserContext);
  const { showMessage } = useMessage();

  const MAX_BACKUPS = 10; // Maximum number of backups to keep

  useEffect(() => {
    loadUserData();
  }, []);

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
        
        console.log('API Results:', { caughtResult, profileResult });
        
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

      // Check if username matches (optional but helpful)
      if (importedData.user?.username && importedData.user.username !== username) {
        const confirmed = window.confirm(
          `This backup was created by "${importedData.user.username}" but you are logged in as "${username}".\n\n` +
          `Do you still want to import this data?`
        );
        if (!confirmed) {
          setImporting(false);
          return;
        }
      }

      // Calculate Pokemon count for confirmation
      const pokemonCount = Object.keys(importedData.data?.caught || importedData.data || {}).length;
      
      // Show confirmation dialog
      const confirmed = window.confirm(
        `Import backup from ${importedData.exportDate || 'an unknown date'}?\n\n` +
        `This will overwrite your current data:\n` +
        `- ${pokemonCount} caught Pokemon\n\n` +
        `Are you sure you want to continue?`
      );

      if (!confirmed) {
        setImporting(false);
        return;
      }

      // Import the data
      const pokemonData = importedData.data?.caught || importedData.data;
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

      setLastImportTime(now); // Update the last import time
      showMessage('Data imported successfully!', 'success');
      
      // Clear the file input
      event.target.value = '';
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
          JSON.stringify(backupData.data) === JSON.stringify(lastBackupData.data) &&
          lastBackupData.user.username === backupData.user.username) {
        showMessage('Backup data is identical to the last backup. No changes detected.', 'error');
        setBackingUp(false);
        return;
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
        showMessage('Please wait a moment before restoring again.', 'error');
        return;
      }

      const backupData = localStorage.getItem(backupId);
      if (!backupData) {
        showMessage('Backup not found', 'error');
        return;
      }

      const backup = JSON.parse(backupData);
      
      // Handle both old and new backup formats
      const caughtData = backup.data?.caught || backup.data || {};
      
      // Check if username matches (optional but helpful)
      if (backup.user?.username && backup.user.username !== username) {
        const confirmed = window.confirm(
          `This backup was created by "${backup.user.username}" but you are logged in as "${username}".\n\n` +
          `Do you still want to restore this backup?`
        );
        if (!confirmed) return;
      }
      
      const confirmed = window.confirm(
        `Restore backup from ${new Date(backup.backupDate).toLocaleString()}?\n\n` +
        `This will overwrite your current data:\n` +
        `- ${Object.keys(caughtData).length} caught Pokemon\n\n` +
        `Are you sure you want to continue?`
      );

      if (!confirmed) return;

      if (Object.keys(caughtData).length > 0) {
        await caughtAPI.updateCaughtData(caughtData);
        setCaughtData(caughtData);
        
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
      }

      setLastRestoreTime(now); // Update the last restore time
    } catch (error) {
      console.error('Restore failed:', error);
      showMessage('Failed to restore backup', 'error');
    }
  };

  const deleteBackup = async (backupId) => {
    try {
      const now = Date.now();
      if (now - lastDeleteTime < 1000) {
        showMessage('Please wait a moment before deleting again.', 'error');
        return;
      }

      const confirmed = window.confirm('Are you sure you want to delete this backup?');
      if (!confirmed) return;

      localStorage.removeItem(backupId);
      setBackupHistory(prev => prev.filter(backup => backup.id !== backupId));
      
      // If we deleted the last backup data, clear it so new backups can be created
      if (lastBackupData && backupId === lastBackupData.id) {
        setLastBackupData(null);
      }
      
      showMessage('Backup deleted successfully!', 'success');
      setLastDeleteTime(now); // Update the last delete time
    } catch (error) {
      showMessage('Failed to delete backup', 'error');
    }
  };

  // Load backup history on component mount
  useEffect(() => {
    const loadBackupHistory = () => {
      const history = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('pokemon-backup-')) {
          try {
            const backupData = JSON.parse(localStorage.getItem(key));
            // Handle both old and new backup formats
            const caughtCount = Object.keys(backupData.data?.caught || backupData.data || {}).length;
            history.push({
              id: key,
              date: backupData.backupDate || backupData.exportDate || new Date().toISOString(),
              size: JSON.stringify(backupData).length,
              caughtCount: caughtCount
            });
          } catch (error) {
            // Skip invalid backups
            console.warn('Skipping invalid backup:', key, error);
          }
        }
      }
      
      // Sort by date (newest first) and take last MAX_BACKUPS
      history.sort((a, b) => new Date(b.date) - new Date(a.date));
      setBackupHistory(history.slice(0, MAX_BACKUPS));
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
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="backup-page">
      <div className="backup-container">
        <div className="backup-header">
          <h1>Backup & Import</h1>
          <p>Manage your Pokemon data backups and imports</p>
        </div>

        {/* Removed message display as per new_code */}

        <div className="backup-sections">
          {/* Export Section */}
          <div className="backup-section">
            <div className="section-header">
              <Download size={20} />
              <h2>Export Data</h2>
            </div>
            <p>Download your Pokemon data as a JSON file for safekeeping or transfer to another device.</p>
            
            <div className="data-summary">
              <div className="summary-item">
                <span className="label">Caught Pokemon:</span>
                <span className="value">{Object.keys(caughtData).length}</span>
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
          </div>

          {/* Import Section */}
          <div className="backup-section">
            <div className="section-header">
              <Upload size={20} />
              <h2>Import Data</h2>
            </div>
            <p>Import Pokemon data from a previously exported backup file. This will overwrite your current data.</p>
            
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
          </div>

          {/* Local Backup Section */}
          <div className="backup-section">
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

            {backupHistory.length > 0 && (
              <div className="backup-history">
                <h3 data-count={`(${backupHistory.length}/${MAX_BACKUPS})`}>
                  Recent Backups
                  {backupHistory.length >= 5 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                      Scroll to see more
                    </span>
                  )}
                </h3>
                <div className="backup-list">
                  {backupHistory.map((backup) => (
                    <div key={backup.id} className="backup-item">
                      <div className="backup-info">
                        <div className="backup-date">{formatDate(backup.date)}</div>
                        <div className="backup-details">
                          <span>{backup.caughtCount} Pokemon</span>
                          <span>{formatFileSize(backup.size)}</span>
                        </div>
                      </div>
                      <div className="backup-actions">
                        <button 
                          className="restore-button"
                          onClick={() => restoreBackup(backup.id)}
                          title="Restore this backup"
                        >
                          Restore
                        </button>
                        <button 
                          className="delete-button"
                          onClick={() => deleteBackup(backup.id)}
                          title="Delete this backup"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
    </div>
  );
}
