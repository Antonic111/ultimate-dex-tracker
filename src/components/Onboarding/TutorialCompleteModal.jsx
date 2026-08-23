import React, { useState } from "react";
import { profileAPI } from "../../utils/api";
import { Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { Modal } from "../Shared/Modal";
import { Button } from "../Shared/Button";
import "../../css/Onboarding.css";

export default function TutorialCompleteModal({ onComplete, onReplay }) {
  const [saving, setSaving] = useState(false);

  const handleComplete = async (closeModal) => {
    setSaving(true);
    try {
      await profileAPI.updateProfile({
        onboarding: { isComplete: true, tutorialStep: 0 }
      });
      if (typeof closeModal === "function") {
        closeModal(() => onComplete());
      } else {
        onComplete();
      }
    } catch (err) {
      console.error("Failed to update onboarding state:", err);
      if (typeof closeModal === "function") {
        closeModal(() => onComplete());
      } else {
        onComplete();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReplay = async (closeModal) => {
    setSaving(true);
    try {
      await profileAPI.updateProfile({
        onboarding: { isComplete: false, tutorialStep: 0 }
      });
      if (typeof closeModal === "function") {
        closeModal(() => onReplay());
      } else {
        onReplay();
      }
    } catch (err) {
      console.error("Failed to update onboarding state:", err);
      if (typeof closeModal === "function") {
        closeModal(() => onReplay());
      } else {
        onReplay();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      size="md"
      showCloseButton={false}
      preventScroll={true}
      className="tutorial-complete-modal-panel"
      footer={({ close }) => (
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <Button 
            variant="secondary" 
            size="md"
            icon={<RotateCcw size={16} />}
            onClick={() => handleReplay(close)} 
            disabled={saving}
            fullWidth
          >
            Replay Tutorial
          </Button>
          
          <Button 
            variant="primary" 
            size="md"
            icon={<ArrowRight size={18} />}
            iconPosition="right"
            onClick={() => handleComplete(close)} 
            loading={saving}
            fullWidth
          >
            Start Tracking
          </Button>
        </div>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 4px 6px' }}>
        {/* Glowing Hero Badge */}
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'color-mix(in srgb, var(--accent, #38bdf8) 15%, transparent)',
            border: '1.5px solid color-mix(in srgb, var(--accent, #38bdf8) 40%, transparent)',
            boxShadow: '0 0 28px color-mix(in srgb, var(--accent, #38bdf8) 28%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: 'var(--accent)',
            animation: 'onboardingPulse 2.5s infinite ease-in-out'
          }}
        >
          <Trophy size={32} />
        </div>

        {/* Title & Subtitle */}
        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
          Welcome to Dex Tracker!
        </h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '0.94rem', color: 'var(--text-muted, #9ca3af)', lineHeight: '1.5', maxWidth: '380px' }}>
          You're all set! Enjoy tracking your collection, completing your Living Dex, and connecting with other trainers.
        </p>

        {/* Helpful Tips Card */}
        <div
          style={{
            width: '100%',
            background: 'var(--searchbar-dropdown, rgba(255, 255, 255, 0.03))',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            borderRadius: '14px',
            padding: '14px 16px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>•</span>
            <span>Click any Pokémon card to open the sidebar for detailed catch info and notes.</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>•</span>
            <span>Customize themes, sprites, and locks anytime from the Settings page.</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
