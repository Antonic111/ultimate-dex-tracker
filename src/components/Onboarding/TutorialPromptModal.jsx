import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { profileAPI } from "../../utils/api";
import { PlayCircle } from "lucide-react";
import "../../css/CreatorRequestModal.css";

export default function TutorialPromptModal({ onSkip, onAccept }) {
  const [closing, setClosing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSkip = async () => {
    setSaving(true);
    try {
      // Mark onboarding fully complete
      await profileAPI.updateProfile({
        onboarding: { isComplete: true, tutorialStep: 0 }
      });
      setClosing(true);
      setTimeout(() => onSkip(), 280);
    } catch (err) {
      console.error("Failed to update onboarding state:", err);
      // Fallback: still skip
      setClosing(true);
      setTimeout(() => onSkip(), 280);
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = async () => {
    setClosing(true);
    setTimeout(() => onAccept(), 280);
  };

  // Prevent scroll without breaking sticky header
  useEffect(() => {
    const preventScroll = (e) => e.preventDefault();
    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    
    return () => {
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  return createPortal(
    <div className={`cr-modal-backdrop ${closing ? "closing" : ""}`} style={{ zIndex: 9999 }}>
      <div className={`cr-modal ${closing ? "closing" : ""}`} style={{ maxWidth: '450px' }}>
        
        {/* Header */}
        <div className="cr-modal-header" style={{ paddingBottom: '10px' }}>
          <div className="cr-modal-title-row">
            <PlayCircle className="cr-badge-icon" color="var(--accent)" />
            <h2>You're Ready!</h2>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="cr-modal-body" style={{ padding: '10px 20px 20px', textAlign: 'center' }}>
          <p className="cr-modal-subtitle" style={{ fontSize: '1.05rem', lineHeight: '1.6', margin: '0 auto', maxWidth: '380px' }}>
            Would you like a quick interactive walkthrough?
            <br /><br />
            It takes around two minutes and can always be replayed later from Settings.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="cr-modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '20px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button 
            className="cr-cancel-btn" 
            onClick={handleSkip} 
            disabled={saving}
            style={{ flex: 1, padding: '10px', background: 'var(--searchbar-dropdown)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
          >
            {saving ? "Skipping..." : "Skip Tutorial"}
          </button>
          
          <button 
            className="cr-submit-btn" 
            onClick={handleAccept} 
            disabled={saving}
            style={{ flex: 1, padding: '10px', background: 'var(--accent)', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Start Tutorial
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
