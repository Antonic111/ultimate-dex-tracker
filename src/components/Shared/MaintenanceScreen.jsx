import React from 'react';
import { Settings } from 'lucide-react';

const MaintenanceScreen = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#121212',
      color: '#ffffff',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ marginBottom: '20px', animation: 'spin 4s linear infinite' }}>
        <Settings size={80} color="#e62829" />
      </div>
      <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: '#e62829' }}>
        Site Under Maintenance
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#a0a0a0', maxWidth: '500px', lineHeight: '1.6' }}>
        The Ultimate Dex Tracker is currently undergoing scheduled maintenance and updates.
        Come back later!
      </p>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MaintenanceScreen;
