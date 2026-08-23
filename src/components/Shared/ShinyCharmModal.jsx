import React, { useState, useEffect } from 'react';
import { Sparkles, Check, Info } from 'lucide-react';
import { profileAPI } from '../../utils/api';
import { GAME_OPTIONS } from '../../Constants';
import { useMessage } from './MessageContext';
import { Modal } from './Modal';
import { Button } from './Button';

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
  const { showMessage } = useMessage();

  // Load user's shiny charm preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      if (readOnly) {
        if (Array.isArray(viewedUserShinyCharmGames)) {
          setSelectedGames(viewedUserShinyCharmGames);
          setLoading(false);
        }
      } else {
        loadShinyCharmGames();
      }
    }
  }, [isOpen, readOnly, viewedUserShinyCharmGames]);

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
    if (readOnly) return;
    setSelectedGames(prev => {
      if (prev.includes(gameName)) {
        return prev.filter(g => g !== gameName);
      } else {
        return [...prev, gameName];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileAPI.updateProfile({ shinyCharmGames: selectedGames });
      showMessage('Shiny Charm preferences saved!', 'success');

      window.dispatchEvent(new CustomEvent('shinyCharmGamesUpdated', {
        detail: { shinyCharmGames: selectedGames }
      }));

      onClose();
    } catch (error) {
      console.error('Error saving shiny charm games:', error);
      showMessage('Failed to save shiny charm preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Shiny Charm Games"
      subtitle={
        readOnly && viewedUsername ? (
          <>
            <span style={{ color: 'var(--accent)' }}>{viewedUsername}</span>
            {' has the Shiny Charm in these games:'}
          </>
        ) : (
          'Select which games you have acquired the Shiny Charm in'
        )
      }
      icon={<Sparkles size={22} />}
      size="md"
      actions={
        !readOnly && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={loading || saving}
            icon={<Check size={16} strokeWidth={2.5} />}
          >
            Save
          </Button>
        )
      }
    >
      <div className="grid grid-cols-2 gap-2.5 py-1">
        {SHINY_CHARM_GAMES.map((gameName) => {
          const gameOption = GAME_OPTIONS.find(g => g.name === gameName);
          const isSelected = selectedGames.includes(gameName);

          return (
            <div
              key={gameName}
              className={`flex items-center gap-2 md:gap-3 p-3 rounded-xl transition-all ${readOnly ? '' : 'cursor-pointer'} select-none`}
              style={{
                backgroundColor: isSelected ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
                border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-color, #444444)'}`,
                boxShadow: isSelected
                  ? '0 4px 14px rgba(0, 0, 0, 0.35)'
                  : '0 2px 6px rgba(0, 0, 0, 0.2)',
                cursor: readOnly ? 'default' : 'pointer',
                opacity: readOnly && !isSelected ? 0.45 : (loading ? 0.75 : 1),
                transform: isSelected ? 'translateY(-1px)' : 'none'
              }}
              onClick={() => handleToggleGame(gameName)}
            >
              {gameOption?.image && (
                <img
                  src={gameOption.image}
                  alt=""
                  className="w-7 h-7 rounded-lg object-contain flex-shrink-0"
                  onError={(e) => (e.target.style.display = 'none')}
                />
              )}
              <span
                className="text-xs md:text-sm truncate"
                style={{
                  color: isSelected ? '#000000' : 'var(--text, #ffffff)',
                  fontWeight: '700'
                }}
              >
                {gameName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Auto-Modifier Notice Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          marginTop: '14px',
          padding: '10px 14px',
          borderRadius: '10px',
          backgroundColor: 'var(--profile-modal-boxes, rgba(255, 255, 255, 0.04))',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
          color: 'var(--profile-labels, #a1a1aa)',
          fontSize: '0.8125rem',
          lineHeight: '1.45',
        }}
      >
        <Info
          size={18}
          style={{
            color: 'var(--accent)',
            flexShrink: 0,
            marginTop: '2px',
          }}
        />
        <div>
          <strong style={{ color: 'var(--text, #ffffff)', fontWeight: '700' }}>
            Automatic Modifier:
          </strong>{' '}
          When logging or editing catch details for a shiny Pokémon from any selected game, the{' '}
          <span style={{ color: 'var(--text, #ffffff)', fontWeight: '600' }}>Shiny Charm</span> modifier will automatically be enabled.
        </div>
      </div>
    </Modal>
  );
}
