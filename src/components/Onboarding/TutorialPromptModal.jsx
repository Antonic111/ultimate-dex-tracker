import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { profileAPI } from "../../utils/api";
import { PlayCircle } from "lucide-react";
import "../../css/Onboarding.css";

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
      setTimeout(() => onSkip(), 250);
    } catch (err) {
      console.error("Failed to update onboarding state:", err);
      // Fallback: still skip
      setClosing(true);
      setTimeout(() => onSkip(), 250);
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = async () => {
    setClosing(true);
    setTimeout(() => onAccept(), 250);
  };

  // Lock background body scroll cleanly
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return createPortal(
    <div className={`onboarding-setup-backdrop ${closing ? "closing" : ""}`}>
      <div className={`onboarding-setup-modal ${closing ? "closing" : ""}`} style={{ maxWidth: '440px' }}>
        
        {/* Header */}
        <div className="onboarding-setup-header" style={{ justifyContent: 'center' }}>
          <div className="onboarding-title" style={{ fontSize: '1.25rem' }}>
            <PlayCircle size={22} color="var(--accent)" />
            <span>You're All Set!</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="onboarding-setup-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
          <p className="onboarding-subtitle" style={{ fontSize: '0.98rem', lineHeight: '1.6', margin: '0 auto', maxWidth: '360px', color: 'var(--text)' }}>
            Would you like a quick interactive walkthrough of the tracker?
            <br /><br />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              It takes under two minutes and can always be replayed anytime from Settings.
            </span>
          </p>
        </div>

        {/* Footer Actions */}
        <div className="onboarding-setup-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            type="button"
            className="onboarding-btn-back" 
            onClick={handleSkip} 
            disabled={saving}
            style={{ flex: 1, textAlign: 'center', padding: '10px 14px' }}
          >
            {saving ? "Skipping..." : "Skip Tutorial"}
          </button>
          
          <button 
            type="button"
            className="onboarding-btn-next" 
            onClick={handleAccept} 
            disabled={saving}
            style={{ flex: 1, textAlign: 'center', padding: '10px 14px' }}
          >
            Start Tutorial
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
