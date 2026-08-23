import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { profileAPI } from "../../utils/api";
import { useTheme } from "../Shared/ThemeContext";
import { Check, Settings, Lock, Image as ImageIcon, Link, Eye, Palette, Book, Info, Shield, Globe, Activity, Trophy, BarChart2 } from "lucide-react";
import Button from "../Shared/Button";
import Tooltip from "../Shared/Tooltip";
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
    isGlobalFeedPublic: true,
    isLeaderboardPublic: true,
    isStatsPublic: true,
    externalLinkPreference: 'serebii',
    
    blockUnobtainableShinies: false,
    blockGOExclusiveShinies: false,
    blockNOOTExclusiveShinies: false,
    hideLockedShinies: false,
  });

  const ACCENT_COLORS = [
    { id: "yellow", color: "#facc15" },
    { id: "red", color: "#ef4444" },
    { id: "orange", color: "#f97316" },
    { id: "green", color: "#22c55e" },
    { id: "lime", color: "#84cc16" },
    { id: "cyan", color: "#06b6d4" },
    { id: "blue", color: "#3b82f6" },
    { id: "purple", color: "#a855f7" },
    { id: "lavender", color: "#c084fc" },
    { id: "pink", color: "#ec4899" },
    { id: "brown", color: "#78350f" },
    { id: "platinum", color: "#cbd5e1" },
  ];

  const steps = [
    {
      id: "theme",
      shortLabel: "THEME",
      title: "Theme Settings",
      icon: <Palette size={20} color="var(--accent)" />,
      desc: "Personalize your experience with dark/light mode and a custom accent color.",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
          <div className="settings-theme-options" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {/* Light */}
            <div
              className={`settings-theme-card ${prefs.theme === "light" ? "active" : ""}`}
              onClick={() => handleChange('theme', 'light')}
              style={{ padding: '10px 8px 10px', gap: '8px' }}
            >
              <div className="settings-theme-mini light" style={{ height: '48px' }}>
                <div className="mini-header" style={{ height: '12px' }}>
                  <span className="mini-dot" style={{ width: '5px', height: '5px' }} />
                </div>
                <div className="mini-body" style={{ padding: '6px', gap: '4px' }}>
                  <span className="mini-line" style={{ height: '4px' }} />
                  <span className="mini-line" style={{ height: '4px' }} />
                </div>
              </div>
              <span className="settings-theme-label" style={{ fontSize: '0.85rem' }}>Light</span>
              {prefs.theme === "light" && (
                <span className="settings-card-check-badge">
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
            </div>

            {/* Dark */}
            <div
              className={`settings-theme-card ${prefs.theme === "dark" ? "active" : ""}`}
              onClick={() => handleChange('theme', 'dark')}
              style={{ padding: '10px 8px 10px', gap: '8px' }}
            >
              <div className="settings-theme-mini dark" style={{ height: '48px' }}>
                <div className="mini-header" style={{ height: '12px' }}>
                  <span className="mini-dot" style={{ width: '5px', height: '5px' }} />
                </div>
                <div className="mini-body" style={{ padding: '6px', gap: '4px' }}>
                  <span className="mini-line" style={{ height: '4px' }} />
                  <span className="mini-line" style={{ height: '4px' }} />
                </div>
              </div>
              <span className="settings-theme-label" style={{ fontSize: '0.85rem' }}>Dark</span>
              {prefs.theme === "dark" && (
                <span className="settings-card-check-badge">
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
            </div>

            {/* System */}
            <div
              className={`settings-theme-card ${prefs.theme === "system" ? "active" : ""}`}
              onClick={() => handleChange('theme', 'system')}
              style={{ padding: '10px 8px 10px', gap: '8px' }}
            >
              <div className="settings-theme-mini system" style={{ height: '48px' }}>
                <div className="mini-header" style={{ height: '12px' }} />
              </div>
              <span className="settings-theme-label" style={{ fontSize: '0.85rem' }}>System</span>
              {prefs.theme === "system" && (
                <span className="settings-card-check-badge">
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              background: 'var(--searchbar-dropdown, rgba(255, 255, 255, 0.03))',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              borderRadius: '14px',
              padding: '16px 14px'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '12px',
                justifyItems: 'center',
                alignItems: 'center'
              }}
            >
              {ACCENT_COLORS.map(({ id, color }) => (
                <div
                  key={id}
                  className={`settings-swatch ${prefs.accentColor === id ? "active" : ""}`}
                  style={{
                    backgroundColor: color,
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                    boxShadow: prefs.accentColor === id ? `0 0 12px ${color}` : '0 2px 5px rgba(0,0,0,0.3)',
                    border: prefs.accentColor === id ? '2.5px solid #ffffff' : '2px solid transparent'
                  }}
                  onClick={() => handleChange('accentColor', id)}
                  title={id.charAt(0).toUpperCase() + id.slice(1)}
                >
                  {prefs.accentColor === id && (
                    <Check size={16} color="#000000" strokeWidth={3.5} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: "visuals",
      shortLabel: "SPRITES",
      title: "Sprites",
      icon: <ImageIcon size={20} color="var(--accent)" />,
      desc: "Customize the visual appearance of Pokémon across the site.",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
          <div style={{ display: 'flex', width: '100%', gap: '12px' }}>
            <div 
              className="onboarding-sprite-card"
              style={{ 
                border: !prefs.useHomeSprites ? '2px solid var(--accent)' : '2px solid var(--border-color)',
                boxShadow: !prefs.useHomeSprites ? '0 0 14px color-mix(in srgb, var(--accent, #38bdf8) 35%, transparent)' : 'none'
              }} 
              onClick={() => handleChange('useHomeSprites', false)}
            >
              <span style={{ fontSize: '0.82rem', textAlign: 'center', color: !prefs.useHomeSprites ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 'bold', marginBottom: '10px', transition: 'color 0.3s' }}>
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
                boxShadow: prefs.useHomeSprites ? '0 0 14px color-mix(in srgb, var(--accent, #38bdf8) 35%, transparent)' : 'none'
              }} 
              onClick={() => handleChange('useHomeSprites', true)}
            >
              <span style={{ fontSize: '0.82rem', textAlign: 'center', color: prefs.useHomeSprites ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 'bold', marginBottom: '10px', transition: 'color 0.3s' }}>
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
      icon: <Book size={20} color="var(--accent)" />,
      desc: "Customize how your Pokédex is organized and what forms you want to collect.",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {['categorized', 'unified'].map(mode => (
              <label 
                key={mode} 
                className={`radio-pill ${prefs.dexViewMode === mode ? "active" : ""}`} 
                style={{ 
                  position: 'relative',
                  padding: '10px 14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  background: prefs.dexViewMode === mode ? 'var(--accent)' : 'var(--searchbar-dropdown)', 
                  color: prefs.dexViewMode === mode ? '#000000' : 'var(--text)', 
                  border: prefs.dexViewMode === mode ? '2px solid var(--accent)' : '2px solid var(--border-color)', 
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  fontSize: '0.92rem', 
                  fontWeight: prefs.dexViewMode === mode ? 700 : 500, 
                  boxShadow: prefs.dexViewMode === mode ? '0 0 12px color-mix(in srgb, var(--accent, #38bdf8) 35%, transparent)' : 'none',
                  transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
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

                <div style={{ position: 'absolute', right: '12px', display: 'flex', alignItems: 'center' }}>
                  <Tooltip
                    content={
                      mode === 'categorized'
                        ? 'Separate sections for Living Dex, Regional Forms, Alpha Forms, etc.'
                        : 'All Pokémon in one list, sorted by National Dex number.'
                    }
                    position="bottom"
                    align="end"
                    wrap={true}
                    maxWidth={230}
                    minWidth={200}
                  >
                    <span
                      style={{
                        color: prefs.dexViewMode === mode ? '#000000' : 'var(--text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        cursor: 'help',
                      }}
                    >
                      <Info size={15} style={{ opacity: 0.8 }} />
                    </span>
                  </Tooltip>
                </div>
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
              { key: 'showAlphaOtherForms', label: "Alpha Genders & Others" }
            ].map(({ key, label }) => (
              <label 
                key={key} 
                className="onboarding-pill-toggle"
                style={{ 
                  background: prefs[key] ? 'color-mix(in srgb, var(--accent, #38bdf8) 22%, transparent)' : 'var(--searchbar-dropdown)', 
                  color: prefs[key] ? 'var(--accent)' : 'var(--text)', 
                  border: prefs[key] ? '1.5px solid var(--accent)' : '1.5px solid var(--border-color)',
                  fontWeight: prefs[key] ? 700 : 500,
                  boxShadow: prefs[key] ? '0 0 8px color-mix(in srgb, var(--accent, #38bdf8) 25%, transparent)' : 'none',
                  transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease'
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
      title: "Profile & Privacy Settings",
      icon: <Shield size={20} color="var(--accent)" />,
      desc: "Control visibility for each specific feature on your profile and tracker.",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <div className="settings-privacy-list" style={{ gap: '8px' }}>
            {/* 1. Trainer Profile & Pokédex Collection */}
            <div className="settings-privacy-item" style={{ padding: '8px 12px' }}>
              <div className="settings-privacy-left" style={{ gap: '10px' }}>
                <div className="settings-privacy-icon" style={{ width: '28px', height: '28px' }}>
                  <Globe size={15} />
                </div>
                <div className="settings-privacy-info">
                  <span className="settings-privacy-title" style={{ fontSize: '0.82rem' }}>Trainer Profile & Dex Collection</span>
                  <span className="settings-privacy-desc" style={{ fontSize: '0.70rem' }}>
                    Allow other trainers to view your public profile and Living Dex.
                  </span>
                </div>
              </div>
              <div className="settings-segmented-control">
                <button
                  type="button"
                  className={`settings-segmented-btn ${prefs.isProfilePublic ? "active" : ""}`}
                  onClick={() => handleChange('isProfilePublic', true)}
                >
                  <Globe size={12} />
                  <span>Public</span>
                </button>
                <button
                  type="button"
                  className={`settings-segmented-btn ${!prefs.isProfilePublic ? "active" : ""}`}
                  onClick={() => handleChange('isProfilePublic', false)}
                >
                  <Lock size={12} />
                  <span>Private</span>
                </button>
              </div>
            </div>

            {/* 2. Global Live Catch Feed */}
            <div className="settings-privacy-item" style={{ padding: '8px 12px' }}>
              <div className="settings-privacy-left" style={{ gap: '10px' }}>
                <div className="settings-privacy-icon" style={{ width: '28px', height: '28px' }}>
                  <Activity size={15} />
                </div>
                <div className="settings-privacy-info">
                  <span className="settings-privacy-title" style={{ fontSize: '0.82rem' }}>Global Live Catch Feed</span>
                  <span className="settings-privacy-desc" style={{ fontSize: '0.70rem' }}>
                    Broadcast new catches and shiny milestones in real-time.
                  </span>
                </div>
              </div>
              <div className="settings-segmented-control">
                <button
                  type="button"
                  className={`settings-segmented-btn ${prefs.isGlobalFeedPublic ? "active" : ""}`}
                  onClick={() => handleChange('isGlobalFeedPublic', true)}
                >
                  <Globe size={12} />
                  <span>Public</span>
                </button>
                <button
                  type="button"
                  className={`settings-segmented-btn ${!prefs.isGlobalFeedPublic ? "active" : ""}`}
                  onClick={() => handleChange('isGlobalFeedPublic', false)}
                >
                  <Lock size={12} />
                  <span>Private</span>
                </button>
              </div>
            </div>

            {/* 3. Community Leaderboards */}
            <div className="settings-privacy-item" style={{ padding: '8px 12px' }}>
              <div className="settings-privacy-left" style={{ gap: '10px' }}>
                <div className="settings-privacy-icon" style={{ width: '28px', height: '28px' }}>
                  <Trophy size={15} />
                </div>
                <div className="settings-privacy-info">
                  <span className="settings-privacy-title" style={{ fontSize: '0.82rem' }}>Community Leaderboards</span>
                  <span className="settings-privacy-desc" style={{ fontSize: '0.70rem' }}>
                    Display your trainer stats in public leaderboard rankings.
                  </span>
                </div>
              </div>
              <div className="settings-segmented-control">
                <button
                  type="button"
                  className={`settings-segmented-btn ${prefs.isLeaderboardPublic ? "active" : ""}`}
                  onClick={() => handleChange('isLeaderboardPublic', true)}
                >
                  <Globe size={12} />
                  <span>Public</span>
                </button>
                <button
                  type="button"
                  className={`settings-segmented-btn ${!prefs.isLeaderboardPublic ? "active" : ""}`}
                  onClick={() => handleChange('isLeaderboardPublic', false)}
                >
                  <Lock size={12} />
                  <span>Private</span>
                </button>
              </div>
            </div>

            {/* 4. Detailed Stats Page */}
            <div className="settings-privacy-item" style={{ padding: '8px 12px' }}>
              <div className="settings-privacy-left" style={{ gap: '10px' }}>
                <div className="settings-privacy-icon" style={{ width: '28px', height: '28px' }}>
                  <BarChart2 size={15} />
                </div>
                <div className="settings-privacy-info">
                  <span className="settings-privacy-title" style={{ fontSize: '0.82rem' }}>Detailed Stats & Completion Charts</span>
                  <span className="settings-privacy-desc" style={{ fontSize: '0.70rem' }}>
                    Allow others to explore your statistics graphs and shiny rates.
                  </span>
                </div>
              </div>
              <div className="settings-segmented-control">
                <button
                  type="button"
                  className={`settings-segmented-btn ${prefs.isStatsPublic ? "active" : ""}`}
                  onClick={() => handleChange('isStatsPublic', true)}
                >
                  <Globe size={12} />
                  <span>Public</span>
                </button>
                <button
                  type="button"
                  className={`settings-segmented-btn ${!prefs.isStatsPublic ? "active" : ""}`}
                  onClick={() => handleChange('isStatsPublic', false)}
                >
                  <Lock size={12} />
                  <span>Private</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "external-links",
      shortLabel: "LINKS",
      title: "External Links",
      icon: <Link size={20} color="var(--accent)" />,
      desc: "Choose which database website Pokémon names link to in the sidebar.",
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
                  color: prefs.externalLinkPreference === opt ? '#000000' : 'var(--text)', 
                  border: prefs.externalLinkPreference === opt ? '2px solid var(--accent)' : '2px solid var(--border-color)', 
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  fontSize: '0.98rem', 
                  fontWeight: prefs.externalLinkPreference === opt ? 700 : 500, 
                  boxShadow: prefs.externalLinkPreference === opt ? '0 0 12px color-mix(in srgb, var(--accent, #38bdf8) 35%, transparent)' : 'none',
                  transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
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
      icon: <Lock size={20} color="var(--accent)" />,
      desc: "Lock certain types of shiny Pokémon to prevent interaction in your dex.",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {[
            {
              key: 'blockUnobtainableShinies',
              label: 'Lock Unobtainable Shinies',
              desc: 'Locks shinies that cannot legitimately be obtained.'
            },
            {
              key: 'blockGOExclusiveShinies',
              label: 'Lock GO Exclusive Shinies',
              desc: 'Locks shinies only available via Pokémon GO.'
            },
            {
              key: 'blockNOOTExclusiveShinies',
              label: 'Lock NO OT Exclusive Shinies',
              desc: 'Locks shinies with no original trainer availability.'
            },
            {
              key: 'hideLockedShinies',
              label: 'Hide Locked Shinies from Grid',
              desc: 'Hides locked shinies completely instead of showing lock overlay.'
            },
          ].map(({ key, label, desc }) => {
            const isChecked = !!prefs[key];
            return (
              <div
                key={key}
                onClick={() => handleChange(key, !isChecked)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: isChecked
                    ? 'color-mix(in srgb, var(--accent, #38bdf8) 12%, transparent)'
                    : 'var(--searchbar-dropdown, rgba(255, 255, 255, 0.03))',
                  border: isChecked
                    ? '1.5px solid var(--accent, #38bdf8)'
                    : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: isChecked
                    ? '0 0 10px color-mix(in srgb, var(--accent, #38bdf8) 20%, transparent)'
                    : 'none'
                }}
              >
                {/* Custom Checkbox Box */}
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: isChecked ? 'var(--accent, #38bdf8)' : 'rgba(255, 255, 255, 0.05)',
                    border: isChecked ? 'none' : '1.5px solid rgba(255, 255, 255, 0.25)',
                    transition: 'all 0.18s ease'
                  }}
                >
                  {isChecked && <Check size={14} strokeWidth={3.5} color="#000000" />}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: isChecked ? 'var(--accent, #38bdf8)' : 'var(--text, #ffffff)',
                      transition: 'color 0.2s'
                    }}
                  >
                    {label}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.3 }}>
                    {desc}
                  </span>
                </div>
              </div>
            );
          })}
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
        isGlobalFeedPublic: prefs.isGlobalFeedPublic,
        isLeaderboardPublic: prefs.isLeaderboardPublic,
        isStatsPublic: prefs.isStatsPublic,
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

  // Lock background body and html scroll cleanly while keeping modal scrollable
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
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
            style={{ width: `calc(${(currentStep / (steps.length - 1))} * (100% - 72px))` }}
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

        {/* Fixed Bottom Footer Actions with Universal Buttons */}
        <div className="onboarding-setup-footer">
          <Button 
            variant="ghost" 
            size="md"
            className="onboarding-skip-btn"
            onClick={handleSkipAll} 
            disabled={saving}
          >
            Skip All
          </Button>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {currentStep > 0 && (
              <Button 
                variant="secondary" 
                size="md"
                onClick={handleBack} 
                disabled={saving}
              >
                Back
              </Button>
            )}
            <Button 
              variant="primary" 
              size="md"
              onClick={handleNext} 
              loading={saving}
            >
              {currentStep === steps.length - 1 ? "Finish & Save" : "Next"}
            </Button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
