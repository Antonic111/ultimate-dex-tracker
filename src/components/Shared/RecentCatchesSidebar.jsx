import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';
import { buildApiUrl } from '../../config/api';
import { findPokemon, formatPokemonName } from '../../utils';
import { transformSpriteUrlForViewer } from '../../utils/spriteUtils';
import { getUserAvatarUrl } from '../../utils/profileUtils';
import pokemonData from '../../data/pokemon.json';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const timeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

const RecentCatchesSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username } = useUser();
  const [catches, setCatches] = useState([]);
  const [hoveredCatch, setHoveredCatch] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(() => localStorage.getItem('hideRecentCatches') === 'true');
  const [useHomeSprites, setUseHomeSprites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dexPreferences'))?.useHomeSprites || false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handlePrefsChange = () => {
      try {
        setUseHomeSprites(JSON.parse(localStorage.getItem('dexPreferences'))?.useHomeSprites || false);
      } catch { }
    };
    window.addEventListener('dexPreferencesChanged', handlePrefsChange);
    return () => window.removeEventListener('dexPreferencesChanged', handlePrefsChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('hideRecentCatches', isMinimized);
  }, [isMinimized]);

  const sortedBaseNames = useMemo(() => {
    const names = pokemonData.map(p => formatPokemonName(p.name)).filter(Boolean);
    return [...new Set(names)].sort((a, b) => b.length - a.length);
  }, []);

  useEffect(() => {
    // Fetch recent catches
    const fetchRecent = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(buildApiUrl('/recent-catches'));
        const data = await res.json();
        if (Array.isArray(data)) {
          setCatches(data);
        }
      } catch (e) {
        console.error("Failed to fetch recent catches", e);
      }
    };

    fetchRecent();

    // Refresh when tab becomes active / focused
    const handleVisibility = () => {
      if (!document.hidden) fetchRecent();
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    // Refresh when user catches a Pokemon locally
    const handleCatchChange = () => {
      // Small delay to allow backend to persist before fetching
      setTimeout(fetchRecent, 500);
    };
    window.addEventListener('caughtDataChanged', handleCatchChange);

    // Gentle 60s background refresh only if page is visible
    const interval = setInterval(() => {
      if (!document.hidden) fetchRecent();
    }, 60000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      window.removeEventListener('caughtDataChanged', handleCatchChange);
      clearInterval(interval);
    };
  }, []);

  if (location.pathname !== '/' || !username) {
    return null;
  }

  return (
    <>
      <style>{`
        @media (min-width: 1024px) {
          html body .floatingchat-container-wrap, 
          html body .floating-chat-kofi-popup-iframe {
            left: ${isMinimized ? 16 : 206}px !important;
            transition: left 0.3s ease;
          }
        }
      `}</style>
      <div className={`fixed left-0 top-[88px] md:top-[138px] bottom-0 ${isMinimized ? 'w-0 border-r-0' : 'w-[150px] md:w-[190px]'} border-r border-[var(--border-color)] bg-[var(--pokemon-box-bg2)]/95 backdrop-blur-md hidden lg:flex flex-col z-30 shadow-2xl overflow-visible transition-all duration-300`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsMinimized(!isMinimized)}
          className={`absolute top-4 ${isMinimized ? 'left-4' : 'left-full -translate-x-1/2'} w-8 h-8 rounded-full flex items-center justify-center bg-[var(--pokemon-box-bg2)] border border-[var(--border-color)] hover:bg-black/40 text-[var(--text-muted)] hover:text-white transition-all duration-300 cursor-pointer z-40 shadow-md`}
          title={isMinimized ? "Show Recent Catches" : "Hide Recent Catches"}
        >
          {isMinimized ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div className="w-full h-full overflow-hidden">
          <div className={`w-[150px] md:w-[190px] h-full flex flex-col items-center transition-opacity duration-300 ${isMinimized ? 'opacity-0' : 'opacity-100'}`}>
            {catches.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] mt-4 text-[0.65rem] font-bold uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>
            No recent catches
          </div>
        ) : (
          <div 
            key={catches[0]?._id || catches[0]?.caughtAt || 'empty'}
            className="w-full flex flex-col animate-[slideDownCatchWrapper_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]"
          >
            {catches.map((c, i) => {
              let baseName = c.pokemonName;
              let formName = c.formName || null;

              if (!formName && c.pokemonName) {
                const matchedBase = sortedBaseNames.find(bn => c.pokemonName === bn || c.pokemonName.startsWith(bn + ' '));
                if (matchedBase) {
                  baseName = matchedBase;
                  if (c.pokemonName.length > matchedBase.length) {
                    formName = c.pokemonName.substring(matchedBase.length).trim();
                  }
                }
              }

              return (
                <div 
                  key={c._id || i} 
                  onClick={() => navigate(`/u/${c.username}`)}
                  className={`group relative flex flex-col items-center justify-center w-full aspect-square border-b border-[var(--border-color)] bg-transparent hover:bg-black/20 transition-colors cursor-pointer overflow-hidden ${i === 0 ? 'animate-[slideDownCatch_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]' : ''}`}
                >
                  {/* Default View (Sprite + Name) */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-1 pointer-events-none">
                    {c.sprite && (c.sprite.includes('/shiny/') || c.sprite.includes('-shiny') || c.sprite.includes('_shiny')) && (
                      <div className="absolute top-1.5 left-1.5 z-10 transition-all duration-200 group-hover:opacity-0 group-hover:translate-y-4" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))' }}>
                        <Sparkles size={20} color="#facc15" fill="#facc15" />
                      </div>
                    )}
                    <img src={transformSpriteUrlForViewer(c.sprite, useHomeSprites)} alt={c.pokemonName} className="w-full h-full object-contain drop-shadow-lg transition-all duration-200 ease-in group-hover:translate-y-8 group-hover:opacity-0 group-hover:scale-95" style={{ imageRendering: 'pixelated' }} onError={e => e.target.style.display = 'none'} />
                    <div className="absolute bottom-2 left-2 right-2 flex flex-col items-start gap-0 transition-all duration-200 ease-in group-hover:-translate-x-[150%] group-hover:opacity-0 pointer-events-none">
                    {formName && (
                      <div 
                        className="text-[0.6rem] md:text-[0.65rem] text-white/80 font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                      >
                        {formName}
                      </div>
                    )}
                    <div 
                      className="truncate text-[0.85rem] md:text-[0.95rem] font-bold text-white w-full text-left leading-tight"
                      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,1)' }}
                    >
                      {baseName}
                    </div>
                  </div>
                </div>

                {/* Hover View (Avatar + Username + Time) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-[var(--pokemon-box-bg2)]/95 backdrop-blur-md z-10 opacity-0 translate-y-8 pointer-events-none transition-all duration-300 ease-out delay-0 group-hover:opacity-100 group-hover:translate-y-0 group-hover:delay-75">
                  <div className="w-[60%] max-w-[75px] aspect-square rounded-full border-2 border-[var(--trainer-avatar-border)] bg-[var(--trainer-avatar-bg)] overflow-hidden flex items-center justify-center mb-2 shadow-md">
                    <img 
                      src={getUserAvatarUrl(c)} 
                      alt={c.username} 
                      className="w-full h-full object-cover" 
                      onError={e => e.target.style.display = 'none'} 
                    />
                  </div>
                  <div className="font-bold text-[var(--accent)] text-[0.95rem] md:text-[1.05rem] leading-tight truncate w-full text-center">{c.username}</div>
                  <div className="text-[0.7rem] md:text-[0.75rem] text-white/75 leading-tight mt-1">{timeAgo(c.caughtAt)}</div>
                </div>
              </div>
            )})}
          </div>
        )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RecentCatchesSidebar;
