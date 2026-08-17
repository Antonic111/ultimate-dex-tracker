import React, { useState, useEffect } from "react";
import { profileAPI } from "../../utils/api";
import { Award } from "lucide-react";
import "../../css/Onboarding.css";

export default function TutorialCompleteModal({ onComplete, onReplay }) {
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("tutorial-active");
    document.body.classList.add("tutorial-active");
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.classList.remove("tutorial-active");
      document.body.classList.remove("tutorial-active");
      document.body.style.overflow = originalOverflow;
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
    <div className="onboarding-setup-backdrop">
      <div className="onboarding-setup-modal" style={{ maxWidth: '460px' }}>
        <div className="onboarding-setup-header" style={{ justifyContent: 'center', paddingTop: '20px' }}>
          <div className="onboarding-title" style={{ fontSize: '1.3rem' }}>
            <Award size={24} color="var(--accent)" />
            <span>Welcome to Dex Tracker!</span>
          </div>
        </div>
        
        <div className="onboarding-setup-body" style={{ textAlign: 'center', padding: '20px' }}>
          <p className="onboarding-subtitle" style={{ fontSize: '1rem', lineHeight: '1.6', margin: '0 auto', color: 'var(--text)' }}>
            You're all set!
            <br /><br />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Enjoy tracking your collection, completing your Pokédex, and connecting with other trainers.
            </span>
          </p>
        </div>

        <div className="onboarding-setup-footer" style={{ display: 'flex', gap: '10px', padding: '16px 20px' }}>
          <button 
            type="button"
            className="onboarding-btn-back"
            onClick={handleReplay} 
            disabled={saving} 
            style={{ flex: 1, textAlign: 'center' }}
          >
            Replay Tutorial
          </button>
          <button 
            type="button"
            className="onboarding-btn-next"
            onClick={handleComplete} 
            disabled={saving} 
            style={{ flex: 1, textAlign: 'center' }}
          >
            {saving ? "Saving..." : "Start Tracking"}
          </button>
        </div>
      </div>
    </div>
  );
}
