import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { profileAPI } from '../../utils/api';
import { GAME_OPTIONS } from '../../Constants';
import { useMessage } from './MessageContext';
import '../../css/ProgressBar.css';

// Games from Black 2 onwards that have Shiny Charm
const SHINY_CHARM_GAMES = [
  "Black 2",
  "White 2",
  "X",
  "Y",
  "Omega Ruby",
  "Alpha Sapphire",
  "Sun",
  "Moon",
  "Ultra Sun",
  "Ultra Moon",
  "Let's Go Pikachu",
  "Let's Go Eevee",
  "Sword",
  "Shield",
  "Brilliant Diamond",
  "Shining Pearl",
  "Legends Arceus",
  "Scarlet",
  "Violet",
  "Legends Z-A"
];

export default function ShinyCharmModal({ isOpen, onClose, readOnly = false, viewedUserShinyCharmGames = [], viewedUsername = null }) {
  const [selectedGames, setSelectedGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const { showMessage } = useMessage();

  // Load user's shiny charm preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      if (readOnly) {
        // In read-only mode, use the viewed user's games
        if (Array.isArray(viewedUserShinyCharmGames)) {
          setSelectedGames(viewedUserShinyCharmGames);
          setLoading(false);
        }
      } else {
        // In edit mode, load current user's games
        loadShinyCharmGames();
      }
      setClosing(false);
    }
  }, [isOpen, readOnly, viewedUserShinyCharmGames]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const html = document.documentElement;
      const body = document.body;
      const scrollY = window.scrollY;

      // Prevent scrolling without using position:fixed on body
      // This avoids breaking fixed-position modals during page transitions
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      html.style.height = '100vh';
      body.style.height = '100vh';
      body.style.marginTop = `-${scrollY}px`;
      body.style.paddingTop = `${scrollY}px`;
      body.dataset.scrollY = scrollY;

      return () => {
        html.style.overflow = '';
        body.style.overflow = '';
        html.style.height = '';
        body.style.height = '';
        body.style.marginTop = '';
        body.style.paddingTop = '';

        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const loadShinyCharmGames = async () => {
    setLoading(true);
    try {
      const profile = await profileAPI.getProfile();
      setSelectedGames(profile.shinyCharmGames || []);
    } catch (error) {
      console.error('Error loading shiny charm games:', error);
      showMessage('Failed to load shiny charm preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGame = (gameName) => {
    setSelectedGames(prev => {
      if (prev.includes(gameName)) {
        return prev.filter(g => g !== gameName);
      } else {
        return [...prev, gameName];
      }
    });
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, 300);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileAPI.updateProfile({ shinyCharmGames: selectedGames });
      showMessage('Shiny Charm preferences saved!', 'success');

      // Dispatch event to notify other components of the update
      window.dispatchEvent(new CustomEvent('shinyCharmGamesUpdated', {
        detail: { shinyCharmGames: selectedGames }
      }));

      handleClose();
    } catch (error) {
      console.error('Error saving shiny charm games:', error);
      showMessage('Failed to save shiny charm preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen && !closing) return null;

  return createPortal(
    <div
      className={`progress-modal-overlay${closing ? " closing" : ""}`}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className={`progress-modal-panel${closing ? " closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ paddingBottom: 0, marginBottom: 0 }}>
          <h3>Shiny Charm Games</h3>
          <div className="modal-actions">
            {!readOnly && (
              <button
                className="modal-save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            )}
            <button className="modal-close-btn" onClick={handleClose} aria-label="Close">
              <span className="sidebar-close-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#fff" stroke="#232323" strokeWidth="2" />
                  <path d="M2 20a18 18 0 0 1 36 0" fill="#e62829" stroke="#232323" strokeWidth="2" />
                  <rect x="2" y="19" width="36" height="2" fill="#232323" />
                  <circle cx="20" cy="20" r="7" fill="#ffffffff" stroke="#232323" strokeWidth="2" />
                  <circle cx="20" cy="20" r="3.5" fill="#fff" stroke="#232323" strokeWidth="1.5" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '0 24px 32px 24px', marginTop: 0 }}>
          {loading ? (
            <div className="text-center py-8" style={{ color: 'var(--text)' }}>
              Loading...
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm" style={{ color: 'var(--text)' }}>
                {readOnly && viewedUsername
                  ? (
                    <>
                      <span style={{ color: 'var(--accent)' }}>{viewedUsername}</span>
                      {' has the Shiny Charm in these games:'}
                    </>
                  )
                  : 'Select which games you have the Shiny Charm in:'
                }
              </p>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                {SHINY_CHARM_GAMES.map((gameName) => {
                  const gameOption = GAME_OPTIONS.find(g => g.name === gameName);
                  const isSelected = selectedGames.includes(gameName);

                  return (
                    <div
                      key={gameName}
                      className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg transition-colors ${readOnly ? '' : 'cursor-pointer'} game-option-item`}
                      style={{
                        backgroundColor: isSelected ? 'var(--accent)' : 'var(--pokemon-box-bg2)',
                        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
                        boxShadow: isSelected
                          ? '0 3px 5px rgba(0, 0, 0, 0.8)'
                          : '0 3px 5px rgba(0, 0, 0, 0.6)',
                        cursor: readOnly ? 'default' : 'pointer',
                        opacity: readOnly && !isSelected ? 0.6 : 1,
                      }}
                      onClick={() => !readOnly && handleToggleGame(gameName)}
                    >
                      {gameOption?.image && (
                        <img
                          src={gameOption.image}
                          alt=""
                          className="w-6 h-6 md:w-8 md:h-8 rounded"
                          onError={(e) => (e.target.style.display = 'none')}
                        />
                      )}
                      <span className="text-sm md:text-base" style={{
                        color: 'var(--text)',
                        fontWeight: isSelected ? 'bold' : 'normal'
                      }}>
                        {gameName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
