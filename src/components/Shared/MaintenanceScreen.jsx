import React from 'react';
import { Settings } from 'lucide-react';

const MaintenanceScreen = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#121212',
      color: '#ffffff',
      textAlign: 'center',
      padding: '20px',
      overflowY: 'auto',
    }}>
      <div style={{ marginBottom: '20px', animation: 'spin 4s linear infinite' }}>
        <Settings size={80} color="#e62829" />
      </div>
      <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: '#e62829', fontWeight: 800 }}>
        Site Under Maintenance
      </h1>
      <p style={{ fontSize: '1.15rem', color: '#a0a0a0', maxWidth: '500px', lineHeight: '1.6', marginBottom: '32px' }}>
        The Ultimate Dex Tracker is currently undergoing scheduled maintenance and updates.
        Come back later!
      </p>

      {/* Compliance & Policy Links (accessible even during maintenance) */}
      <div style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        maxWidth: '650px',
        width: '100%'
      }}>
        <p style={{ fontSize: '0.85rem', color: '#71717a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Legal & Billing Information
        </p>
        <nav style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '18px',
          flexWrap: 'wrap',
          fontSize: '0.9rem'
        }}>
          <a href="/membership" style={{ color: '#e62829', textDecoration: 'underline', transition: 'opacity 0.2s', fontWeight: 600 }}>
            Premium Membership & Pricing
          </a>
          <a href="/privacy" style={{ color: '#e62829', textDecoration: 'underline', transition: 'opacity 0.2s', fontWeight: 600 }}>
            Privacy Policy
          </a>
          <a href="/terms" style={{ color: '#e62829', textDecoration: 'underline', transition: 'opacity 0.2s', fontWeight: 600 }}>
            Terms of Service
          </a>
          <a href="/refund-policy" style={{ color: '#e62829', textDecoration: 'underline', transition: 'opacity 0.2s', fontWeight: 600 }}>
            Refund Policy
          </a>
        </nav>
      </div>
      
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
