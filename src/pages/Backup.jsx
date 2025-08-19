import { useState, useEffect } from 'react';
import { Download, Upload, Database, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { caughtAPI, profileAPI } from '../utils/api';
import { useTheme } from '../components/Shared/ThemeContext';
import '../css/Backup.css';

export default function Backup() {
  const [caughtData, setCaughtData] = useState({});
  const [profileData, setProfileData] = useState({});
  const [progressBars, setProgressBars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [backupHistory, setBackupHistory] = useState([]);
  const { theme, accent } = useTheme();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [caught, profile, progress] = await Promise.all([
        caughtAPI.getCaughtData(),
        profileAPI.getProfile(),
        profileAPI.getProgressBars()
      ]);
      
      setCaughtData(caught || {});
      setProfileData(profile || {});
      setProgressBars(progress || []);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load user data' });
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      setExporting(true);
      
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        user: {
          username: profileData.username,
          email: profileData.email,
          createdAt: profileData.createdAt,
          profileTrainer: profileData.profileTrainer,
          verified: profileData.verified
        },
        data: {
          caught: caughtData,
          progressBars: progressBars
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pokemon-backup-${profileData.username}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data' });
    } finally {
      setExporting(false);
    }
  };

  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setImporting(true);
      const text = await file.text();
      const importedData = JSON.parse(text);

      // Validate the imported data structure
      if (!importedData.version || !importedData.data) {
        throw new Error('Invalid backup file format');
      }

      // Show confirmation dialog
      const confirmed = window.confirm(
        `Import backup from ${importedData.exportDate}?\n\n` +
        `This will overwrite your current data:\n` +
        `- ${Object.keys(importedData.data.caught || {}).length} caught Pokemon\n` +
        `- ${(importedData.data.progressBars || []).length} progress bars\n\n` +
        `Are you sure you want to continue?`
      );

      if (!confirmed) {
        setImporting(false);
        return;
      }

      // Import the data
      if (importedData.data.caught) {
        await caughtAPI.updateCaughtData(importedData.data.caught);
        setCaughtData(importedData.data.caught);
      }

      if (importedData.data.progressBars) {
        await profileAPI.updateProgressBars(importedData.data.progressBars);
        setProgressBars(importedData.data.progressBars);
      }

      setMessage({ type: 'success', text: 'Data imported successfully!' });
      
      // Clear the file input
      event.target.value = '';
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to import data: ${error.message}` });
    } finally {
      setImporting(false);
    }
  };

  const createBackup = async () => {
    try {
      setBackingUp(true);
      
      const backupData = {
        version: '1.0',
        backupDate: new Date().toISOString(),
        user: {
          username: profileData.username,
          email: profileData.email,
          createdAt: profileData.createdAt,
          profileTrainer: profileData.profileTrainer,
          verified: profileData.verified
        },
        data: {
          caught: caughtData,
          progressBars: progressBars
        }
      };

      // Store backup in localStorage for now (could be enhanced to store on server)
      const backupKey = `pokemon-backup-${profileData.username}-${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      
      // Update backup history
      const newBackup = {
        id: backupKey,
        date: new Date().toISOString(),
        size: JSON.stringify(backupData).length,
        caughtCount: Object.keys(caughtData).length,
        progressCount: progressBars.length
      };
      
      setBackupHistory(prev => [newBackup, ...prev.slice(0, 9)]); // Keep last 10 backups
      
      setMessage({ type: 'success', text: 'Backup created successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create backup' });
    } finally {
      setBackingUp(false);
    }
  };

  const restoreBackup = async (backupId) => {
    try {
      const backupData = localStorage.getItem(backupId);
      if (!backupData) {
        setMessage({ type: 'error', text: 'Backup not found' });
        return;
      }

      const backup = JSON.parse(backupData);
      
      const confirmed = window.confirm(
        `Restore backup from ${new Date(backup.backupDate).toLocaleString()}?\n\n` +
        `This will overwrite your current data:\n` +
        `- ${Object.keys(backup.data.caught || {}).length} caught Pokemon\n` +
        `- ${(backup.data.progressBars || []).length} progress bars\n\n` +
        `Are you sure you want to continue?`
      );

      if (!confirmed) return;

      if (backup.data.caught) {
        await caughtAPI.updateCaughtData(backup.data.caught);
        setCaughtData(backup.data.caught);
      }

      if (backup.data.progressBars) {
        await profileAPI.updateProgressBars(backup.data.progressBars);
        setProgressBars(backup.data.progressBars);
      }

      setMessage({ type: 'success', text: 'Backup restored successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to restore backup' });
    }
  };

  const deleteBackup = async (backupId) => {
    try {
      const confirmed = window.confirm('Are you sure you want to delete this backup?');
      if (!confirmed) return;

      localStorage.removeItem(backupId);
      setBackupHistory(prev => prev.filter(backup => backup.id !== backupId));
      setMessage({ type: 'success', text: 'Backup deleted successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete backup' });
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
            history.push({
              id: key,
              date: backupData.backupDate,
              size: JSON.stringify(backupData).length,
              caughtCount: Object.keys(backupData.data?.caught || {}).length,
              progressCount: (backupData.data?.progressBars || []).length
            });
          } catch (error) {
            // Skip invalid backups
          }
        }
      }
      
      // Sort by date (newest first) and take last 10
      history.sort((a, b) => new Date(b.date) - new Date(a.date));
      setBackupHistory(history.slice(0, 10));
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

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' && <CheckCircle size={16} />}
            {message.type === 'error' && <XCircle size={16} />}
            {message.type === 'info' && <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

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
                <span className="label">Progress Bars:</span>
                <span className="value">{progressBars.length}</span>
              </div>
              <div className="summary-item">
                <span className="label">Username:</span>
                <span className="value">{profileData.username}</span>
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
              <AlertCircle size={16} />
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

            {backupHistory.length > 0 && (
              <div className="backup-history">
                <h3>Recent Backups</h3>
                <div className="backup-list">
                  {backupHistory.map((backup) => (
                    <div key={backup.id} className="backup-item">
                      <div className="backup-info">
                        <div className="backup-date">{formatDate(backup.date)}</div>
                        <div className="backup-details">
                          <span>{backup.caughtCount} Pokemon</span>
                          <span>{backup.progressCount} Progress Bars</span>
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
              Your data is automatically saved to the server. Local backups provide an additional layer of protection.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
