import React, { useState, useEffect } from "react";
import { profileAPI } from "../../utils/api";
import "../../css/CreatorRequestModal.css";

export default function TutorialCompleteModal({ onComplete, onReplay }) {
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("tutorial-active");
    document.body.classList.add("tutorial-active");

    return () => {
      document.documentElement.classList.remove("tutorial-active");
      document.body.classList.remove("tutorial-active");
    };
  }, []);

  const handleComplete = async () => {
    setSaving(true);
    try {
      await profileAPI.updateProfile({
        onboarding: { isComplete: true, tutorialStep: 0 }
      });
      onComplete();
    } catch (err) {
      console.error("Failed to update onboarding state:", err);
      onComplete(); // Fallback
    } finally {
      setSaving(false);
    }
  };

  const handleReplay = async () => {
    // Reset step to 0, start over
    setSaving(true);
    try {
      await profileAPI.updateProfile({
        onboarding: { isComplete: false, tutorialStep: 0 }
      });
      onReplay();
    } catch (err) {
      console.error("Failed to update onboarding state:", err);
      onReplay(); // Fallback
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cr-modal-backdrop">
      <div className="cr-modal" style={{ maxWidth: '500px' }}>
        <div className="cr-modal-header" style={{ justifyContent: 'center', paddingTop: '30px' }}>
          <div className="cr-modal-title-row">
            <h2>Welcome to Dex Tracker!</h2>
          </div>
        </div>
        
        <div className="cr-modal-form" style={{ textAlign: 'center', paddingBottom: '30px' }}>
          <p className="cr-modal-subtitle" style={{ fontSize: '1.05rem', marginTop: '10px' }}>
            You're all set!
            <br /><br />
            Enjoy tracking your collection, completing your Pokédex, and connecting with other trainers.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', padding: '0 20px' }}>
            <button 
              className="cr-submit-btn"
              onClick={handleReplay} 
              disabled={saving} 
              style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text)' }}
            >
              Replay Tutorial
            </button>
            <button 
              className="cr-submit-btn"
              onClick={handleComplete} 
              disabled={saving} 
              style={{ flex: 1 }}
            >
              {saving ? "Saving..." : "Start Tracking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
