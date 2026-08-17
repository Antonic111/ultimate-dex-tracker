import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { profileAPI } from "../../utils/api";
import { useTheme } from "../Shared/ThemeContext";
import { Check, Settings, Lock, Image as ImageIcon, Link, Eye, Palette, Book, Info } from "lucide-react";
import "../../css/CreatorRequestModal.css";
import "../../css/Onboarding.css";
import "../../css/Settings.css";

export default function OnboardingModal({ onComplete }) {
  const { theme, setTheme, accent, setAccent } = useTheme();
  
  const [closing, setClosing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [prefs, setPrefs] = useState({
    theme: theme || 'dark',
    accentColor: accent || 'yellow',
    useHomeSprites: false,
    
    dexViewMode: 'categorized',
    showGenderForms: true,
    showAlolanForms: true,
    showGalarianForms: true,
    showHisuianForms: true,
    showPaldeanForms: true,
    showGmaxForms: true,
    showUnownForms: true,
    showOtherForms: true,
    showAlcremieForms: true,
    showVivillonForms: true,
    showAlphaForms: true,
    showAlphaOtherForms: true,
    showMightyForms: true,

    isProfilePublic: true,
    externalLinkPreference: 'serebii',
    
    blockUnobtainableShinies: false,
    blockGOExclusiveShinies: false,
    blockNOOTExclusiveShinies: false,
    hideLockedShinies: false,
  });

  const accentOptions = ["yellow", "red", "orange", "green", "lime", "blue", "cyan", "purple", "lavender", "pink", "brown", "platinum"];

  const steps = [
    {
      id: "theme",
      shortLabel: "THEME",
      title: "Theme Settings",
      icon: <Palette className="cr-badge-icon" color="var(--accent)" />,
      desc: "Personalize your experience with a dark/light mode and accent color.",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
          <div className="theme-choice-grid">
            {["light", "dark", "system"].map((opt) => (
              <label
                key={opt}
                className={`theme-card ${prefs.theme === opt ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={opt}
                  checked={prefs.theme === opt}
                  onChange={(e) => handleChange('theme', e.target.value)}
                />

                <div className={`theme-preview ${opt}`}>
                  <div className="preview-header">
                    <span className="avatar-dot" />
                  </div>
                  <div className="preview-lines">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div className="theme-label">
                  {opt === "light" ? "Light" : opt === "dark" ? "Dark" : "System"}
                </div>
              </label>
            ))}
          </div>

          <div className="accent-color-options">
            {accentOptions.map(color => (
              <div
                key={color}
                className={`accent-circle ${color} ${prefs.accentColor === color ? "selected" : ""}`}
                onClick={() => handleChange('accentColor', color)}
                title={color.charAt(0).toUpperCase() + color.slice(1)}
              >
                {prefs.accentColor === color && (
                  <Check
                    size={16}
                    className="accent-check-icon"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                      strokeWidth: 3,
                      color: '#000000'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "visuals",
      shortLabel: "SPRITES",
      title: "Sprites",
      icon: <ImageIcon className="cr-badge-icon" color="var(--accent)" />,
      desc: "Customize the visual appearance of Pokémon in the site.",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
          <div style={{ display: 'flex', width: '100%', gap: '12px' }}>
            <div 
              className="onboarding-sprite-card"
              style={{ 
                border: !prefs.useHomeSprites ? '2px solid var(--accent)' : '2px solid var(--border-color)',
                boxShadow: !prefs.useHomeSprites ? '0 0 12px rgba(var(--accent-rgb, 234, 179, 8), 0.25)' : 'none'
              }} 
              onClick={() => handleChange('useHomeSprites', false)}
            >
              <span style={{ fontSize: '0.82rem', textAlign: 'center', color: !prefs.useHomeSprites ? 'var(--text)' : 'var(--text-muted)', fontWeight: 'bold', marginBottom: '10px', transition: 'color 0.3s' }}>
                GEN 5 PIXEL SPRITES
              </span>
              <img 
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/384.png" 
                alt="Rayquaza Pixel" 
                className="onboarding-sprite-img"
              />
            </div>
            
            <div 
              className="onboarding-sprite-card"
              style={{ 
                border: prefs.useHomeSprites ? '2px solid var(--accent)' : '2px solid var(--border-color)',
                boxShadow: prefs.useHomeSprites ? '0 0 12px rgba(var(--accent-rgb, 234, 179, 8), 0.25)' : 'none'
              }} 
              onClick={() => handleChange('useHomeSprites', true)}
            >
              <span style={{ fontSize: '0.82rem', textAlign: 'center', color: prefs.useHomeSprites ? 'var(--text)' : 'var(--text-muted)', fontWeight: 'bold', marginBottom: '10px', transition: 'color 0.3s' }}>
                HOME 3D SPRITES
              </span>
              <img 
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/384.png" 
                alt="Rayquaza Home" 
                className="onboarding-sprite-img"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: "dex",
      shortLabel: "DEX",
      title: "Dex Organization",
      icon: <Book className="cr-badge-icon" color="var(--accent)" />,
      desc: "Customize how your Pokédex is organized and what forms you want to collect.",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {['categorized', 'unified'].map(mode => (
              <label 
                key={mode} 
                className={`radio-pill ${prefs.dexViewMode === mode ? "active" : ""}`} 
                style={{ 
                  padding: '10px 8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px', 
                  background: prefs.dexViewMode === mode ? 'var(--accent)' : 'var(--searchbar-dropdown)', 
                  color: prefs.dexViewMode === mode ? 'black' : 'var(--text)', 
                  border: prefs.dexViewMode === mode ? '2px solid var(--accent)' : '1px solid var(--border-color)', 
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  fontSize: '0.92rem', 
                  fontWeight: prefs.dexViewMode === mode ? 'bold' : 'normal', 
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
              >
                <input
                  type="radio"
                  value={mode}
                  checked={prefs.dexViewMode === mode}
                  onChange={(e) => handleChange('dexViewMode', e.target.value)}
                  style={{ display: 'none' }}
                />
                <span>{mode === 'categorized' ? 'Categorized' : 'Unified'}</span>
                <span className="preference-info-wrapper" style={{ color: prefs.dexViewMode === mode ? 'black' : 'var(--text-muted)', display: 'flex' }}>
                  <Info size={15} className="preference-info-icon" style={{ opacity: 0.8 }} />
                  <span className="preference-tooltip" style={{ fontWeight: 'normal' }}>
                    {mode === 'categorized' ? 'Separate sections for Living Dex, Regional Forms, Alpha Forms, etc.' : 'All Pokémon in one list, sorted by National Dex number.'}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
            {[
              { key: 'showGenderForms', label: 'Gender' },
              { key: 'showAlolanForms', label: 'Alolan' },
              { key: 'showGalarianForms', label: 'Galarian' },
              { key: 'showHisuianForms', label: 'Hisuian' },
              { key: 'showPaldeanForms', label: 'Paldean' },
              { key: 'showGmaxForms', label: 'Gigantamax' },
              { key: 'showUnownForms', label: 'Unown' },
              { key: 'showOtherForms', label: 'Other Forms' },
              { key: 'showMightyForms', label: 'Mighty' },
              { key: 'showAlcremieForms', label: 'Alcremie' },
              { key: 'showVivillonForms', label: 'Vivillon' },
              { key: 'showAlphaForms', label: 'Alpha' },
              { key: 'showAlphaOtherForms', label: "Alpha Others" }
            ].map(({ key, label }) => (
              <label 
                key={key} 
                className="onboarding-pill-toggle"
                style={{ 
                  background: prefs[key] ? 'var(--accent)' : 'var(--searchbar-dropdown)', 
                  color: prefs[key] ? 'black' : 'var(--text)', 
                  border: prefs[key] ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                  fontWeight: prefs[key] ? 'bold' : 'normal'
                }}
              >
                <input
                  type="checkbox"
                  checked={!!prefs[key]}
                  onChange={(e) => handleChange(key, e.target.checked)}
                  style={{ display: 'none' }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "visibility",
      shortLabel: "VISIBILITY",
      title: "Profile Visibility",
      icon: <Eye className="cr-badge-icon" color="var(--accent)" />,
      desc: "Control if your profile appears on the global trainers page. If private, trainers can only visit you via your direct share link.",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', marginTop: '6px' }}>
          <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '14px 16px', background: 'var(--searchbar-dropdown)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--profile-text)', fontWeight: 600, fontSize: '1rem' }}>
              {prefs.isProfilePublic ? "Public Profile" : "Private Profile"}
            </span>
            <label className="switch">
              <input
                type="checkbox"
                className="switch-input"
                checked={prefs.isProfilePublic}
                onChange={(e) => handleChange('isProfilePublic', e.target.checked)}
              />
              <span className="switch-slider" />
            </label>
          </div>
        </div>
      )
    },
    {
      id: "external-links",
      shortLabel: "LINKS",
      title: "External Links",
      icon: <Link className="cr-badge-icon" color="var(--accent)" />,
      desc: "Choose which website Pokemon names link to in the sidebar.",
      content: (
        <div style={{ marginTop: '6px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {['serebii', 'bulbapedia', 'pokemondb', 'smogon'].map(opt => (
              <label 
                key={opt} 
                className={`radio-pill ${prefs.externalLinkPreference === opt ? "active" : ""}`} 
                style={{ 
                  padding: '12px 10px', 
                  textAlign: 'center', 
                  background: prefs.externalLinkPreference === opt ? 'var(--accent)' : 'var(--searchbar-dropdown)', 
                  color: prefs.externalLinkPreference === opt ? 'black' : 'var(--text)', 
                  border: prefs.externalLinkPreference === opt ? '2px solid var(--accent)' : '1px solid var(--border-color)', 
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  fontSize: '0.98rem', 
                  fontWeight: prefs.externalLinkPreference === opt ? 'bold' : 'normal', 
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
              >
                <input
                  type="radio"
                  value={opt}
                  checked={prefs.externalLinkPreference === opt}
                  onChange={(e) => handleChange('externalLinkPreference', e.target.value)}
                  style={{ display: 'none' }}
                />
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </label>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "shiny-lock",
      shortLabel: "LOCKS",
      title: "Shiny Locks",
      icon: <Lock className="cr-badge-icon" color="var(--accent)" />,
      desc: "Lock certain types of shiny Pokemon to prevent interaction in your dex.",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
          <div className="dex-preferences-grid" style={{ gridTemplateColumns: '1fr', gap: '8px' }}>
            {[
              { key: 'blockUnobtainableShinies', label: 'Lock Unobtainable Shinies' },
              { key: 'blockGOExclusiveShinies', label: 'Lock GO Exclusive Shinies' },
              { key: 'blockNOOTExclusiveShinies', label: 'Lock NO OT Exclusive Shinies' },
              { key: 'hideLockedShinies', label: 'Hide Locked Shinies from Grid' },
            ].map(({ key, label }) => (
              <div key={key} className="preference-item" style={{ padding: '10px 14px', borderRadius: '10px' }}>
                <label className="preference-checkbox">
                  <input
                    type="checkbox"
                    checked={!!prefs[key]}
                    onChange={(e) => handleChange(key, e.target.checked)}
                  />
                  <span className="preference-label" style={{ fontSize: '0.92rem' }}>{label}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  const handleChange = (key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
    if (key === 'accentColor') {
      setAccent(value);
    }
    if (key === 'theme') {
      setTheme(value);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileAPI.updateProfile({
        isProfilePublic: prefs.isProfilePublic,
        externalLinkPreference: prefs.externalLinkPreference,
        accentColor: prefs.accentColor,
        theme: prefs.theme,
        dexPreferences: {
          dexViewMode: prefs.dexViewMode,
          showGenderForms: prefs.showGenderForms,
          showAlolanForms: prefs.showAlolanForms,
          showGalarianForms: prefs.showGalarianForms,
          showHisuianForms: prefs.showHisuianForms,
          showPaldeanForms: prefs.showPaldeanForms,
          showGmaxForms: prefs.showGmaxForms,
          showUnownForms: prefs.showUnownForms,
          showOtherForms: prefs.showOtherForms,
          showAlcremieForms: prefs.showAlcremieForms,
          showVivillonForms: prefs.showVivillonForms,
          showAlphaForms: prefs.showAlphaForms,
          showAlphaOtherForms: prefs.showAlphaOtherForms,
          showMightyForms: prefs.showMightyForms,
          blockUnobtainableShinies: prefs.blockUnobtainableShinies,
          blockGOExclusiveShinies: prefs.blockGOExclusiveShinies,
          blockNOOTExclusiveShinies: prefs.blockNOOTExclusiveShinies,
          hideLockedShinies: prefs.hideLockedShinies,
          useHomeSprites: prefs.useHomeSprites
        }
      });
      
      setClosing(true);
      setTimeout(() => {
        onComplete();
      }, 250);
    } catch (err) {
      console.error("Failed to save onboarding settings:", err);
      setSaving(false);
    }
  };

  const handleSkipAll = async () => {
    setSaving(true);
    setClosing(true);
    setTimeout(() => {
      onComplete();
    }, 250);
  };

  // Lock background body scroll cleanly while keeping modal scrollable
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return createPortal(
    <div className={`onboarding-setup-backdrop ${closing ? "closing" : ""}`}>
      <div className={`onboarding-setup-modal ${closing ? "closing" : ""}`}>
        
        {/* Header */}
        <div className="onboarding-setup-header">
          <div className="onboarding-title">
            <Settings size={20} color="var(--accent)" />
            <span>Initial Setup</span>
          </div>
          <span className="onboarding-step-counter-pill">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        {/* Styled Progress Stepper Header */}
        <div className="onboarding-progress-container">
          {/* Connecting track line */}
          <div className="onboarding-progress-track" />
          {/* Animated active fill line */}
          <div 
            className="onboarding-progress-fill" 
            style={{ width: `calc(${(currentStep / (steps.length - 1)) * 100}% * (100% - 72px) / 100)` }}
          />
          
          {steps.map((step, i) => {
            const isActive = i === currentStep;
            const isCompleted = i < currentStep;
            const isUpcoming = i > currentStep;
            
            return (
              <button
                key={step.id || i}
                type="button"
                className="onboarding-step-wrapper"
                onClick={() => setCurrentStep(i)}
                title={`Go to Step ${i + 1}: ${step.title}`}
              >
                <div className={`onboarding-step-circle ${isActive ? 'active' : isCompleted ? 'completed' : 'upcoming'}`}>
                  {isCompleted ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`onboarding-step-label ${isActive ? 'active' : isCompleted ? 'completed' : 'upcoming'}`}>
                  {step.shortLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Modal Body */}
        <div className="onboarding-setup-body">
          <div className="onboarding-step-heading">
            {currentStepData.icon}
            <h3>{currentStepData.title}</h3>
          </div>
          <p className="onboarding-subtitle">
            {currentStepData.desc}
          </p>
          
          <div style={{ minHeight: '100px' }}>
            {currentStepData.content}
          </div>
        </div>

        {/* Fixed Bottom Footer Actions */}
        <div className="onboarding-setup-footer">
          <button 
            type="button"
            className="onboarding-btn-skip" 
            onClick={handleSkipAll} 
            disabled={saving}
          >
            Skip All
          </button>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {currentStep > 0 && (
              <button 
                type="button"
                className="onboarding-btn-back" 
                onClick={handleBack} 
                disabled={saving}
              >
                Back
              </button>
            )}
            <button 
              type="button"
              className="onboarding-btn-next" 
              onClick={handleNext} 
              disabled={saving}
            >
              {saving ? "Saving..." : (currentStep === steps.length - 1 ? "Finish & Save" : "Next")}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
