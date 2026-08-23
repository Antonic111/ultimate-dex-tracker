import React, { useState } from "react";
import { profileAPI } from "../../utils/api";
import { Sparkles, Compass, BookOpen, BarChart2 } from "lucide-react";
import { Modal } from "../Shared/Modal";
import { Button } from "../Shared/Button";
import "../../css/Onboarding.css";

export default function TutorialPromptModal({ onSkip, onAccept }) {
  const [saving, setSaving] = useState(false);

  const handleSkip = async (closeModal) => {
    setSaving(true);
    try {
      await profileAPI.updateProfile({
        onboarding: { isComplete: true, tutorialStep: 0 }
      });
      if (typeof closeModal === "function") {
        closeModal(() => onSkip());
      } else {
        onSkip();
      }
    } catch (err) {
      console.error("Failed to update onboarding state:", err);
      if (typeof closeModal === "function") {
        closeModal(() => onSkip());
      } else {
        onSkip();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = (closeModal) => {
    if (typeof closeModal === "function") {
      closeModal(() => onAccept());
    } else {
      onAccept();
    }
  };

  return (
    <Modal
      isOpen={true}
      size="md"
      showCloseButton={false}
      preventScroll={true}
      className="tutorial-prompt-modal-panel"
      footer={({ close }) => (
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <Button 
            variant="secondary" 
            size="md"
            onClick={() => handleSkip(close)} 
            loading={saving}
            fullWidth
          >
            Skip Tutorial
          </Button>
          
          <Button 
            variant="primary" 
            size="md"
            icon={<Compass size={18} />}
            iconPosition="right"
            onClick={() => handleAccept(close)} 
            disabled={saving}
            fullWidth
          >
            Start Tutorial
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
          <Sparkles size={32} />
        </div>

        {/* Title & Subtitle */}
        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
          You're All Set!
        </h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '0.94rem', color: 'var(--text-muted, #9ca3af)', lineHeight: '1.5', maxWidth: '380px' }}>
          Your initial tracker preferences have been saved. Would you like a quick interactive walkthrough?
        </p>

        {/* Feature Highlights Card */}
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
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
            <Compass size={16} />
            <span>Interactive Tour Highlights</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { icon: <BookOpen size={20} color="var(--accent)" />, label: "Dex Controls" },
              { icon: <Sparkles size={20} color="var(--accent)" />, label: "Catch Info" },
              { icon: <BarChart2 size={20} color="var(--accent)" />, label: "Stats & Tools" }
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '10px 6px',
                  textAlign: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', textAlign: 'center' }}>
            Takes under 2 minutes • Can be replayed anytime in Settings
          </p>
        </div>
      </div>
    </Modal>
  );
}
