import { useState, useEffect, useRef, useCallback } from "react";
import { formatPokemonName } from "../utils";
import { huntAPI, profileAPI } from "../utils/api";
import { RotateCcw, Trash2, Settings, Info, Edit, X, Minus, Plus, Play, Pause, Check } from "lucide-react";
import { getCurrentHuntOdds } from "../utils/huntSystem";
import "../css/App.css";
import "../css/Counters.css";

function TimerDisplay({ lastCheckTime, isPaused }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    setSecs(0);
  }, [lastCheckTime]);
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => setSecs(prev => prev + 1), 1000);
    return () => clearInterval(id);
  }, [isPaused]);

  return <div className="current-timer">{isPaused ? "Paused" : `${secs}s`}</div>;
}

const formatTime = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export default function HuntPopout() {
  const [hunt, setHunt] = useState(null);
  const [checks, setChecks] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const channelRef = useRef(null);
  const huntIdRef = useRef(null);
  const fullDataRef = useRef(null);
  const [hotkey, setHotkey] = useState('a');

  // Parse huntId from ?huntId=xxx
  useEffect(() => {
    profileAPI.getProfile().then(data => {
      if (data?.dexPreferences?.hotkey) {
        setHotkey(data.dexPreferences.hotkey);
      }
    }).catch(console.error);
    
    const params = new URLSearchParams(window.location.search);
    const id = params.get("huntId");
    if (!id) { setError("No hunt ID provided."); return; }
    huntIdRef.current = Number(id);

    document.title = "Hunt Popout";
    document.body.style.backgroundColor = "var(--bg-black, #111)";
    document.body.classList.add('popout-mode');

    // Fetch current hunt data from API
    huntAPI.getHuntData().then(data => {
      fullDataRef.current = data;
      const found = (data.activeHunts || []).find(h => h.id === Number(id));
      if (!found) { setError("Hunt not found."); return; }

      setHunt(found);
      setChecks(found.checks || 0);
      setTotalTime((data.totalCheckTimes || {})[id] || 0);

      const paused = (data.pausedHunts || []).includes(Number(id));
      setIsPaused(paused);
      setLastCheckTime((data.lastCheckTimes || {})[id] || Date.now());

      document.title = `${formatPokemonName(found.pokemon?.name || "")} — Hunt Popout`;
    }).catch(err => {
      console.error(err);
      setError("Failed to load hunt data.");
    });

    const ch = new BroadcastChannel(`hunt-popout-${id}`);
    channelRef.current = ch;

    // Enforce minimum window size for popup
    const minWidth = 470;
    const minHeight = 400;
    const enforceMinSize = () => {
      let width = window.outerWidth;
      let height = window.outerHeight;
      let needsResize = false;

      if (width > 0 && width < minWidth) {
        width = minWidth;
        needsResize = true;
      }
      if (height > 0 && height < minHeight) {
        height = minHeight;
        needsResize = true;
      }

      if (needsResize) {
        window.resizeTo(width, height);
      }
    };

    window.addEventListener('resize', enforceMinSize);

    ch.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === "STATE_UPDATE") {
        if (payload.checks !== undefined) setChecks(payload.checks);
        if (payload.totalTime !== undefined) setTotalTime(payload.totalTime);
        if (payload.isPaused !== undefined) setIsPaused(payload.isPaused);
        if (payload.lastCheckTime !== undefined) setLastCheckTime(payload.lastCheckTime);
        
        // Sync our internal detached DB reference so hotkeys/clicks don't overwrite with stale data
        huntAPI.getHuntData().then(data => {
            fullDataRef.current = data;
        }).catch(console.error);
      }
    };

    return () => {
      ch.close();
      window.removeEventListener('resize', enforceMinSize);
      document.body.classList.remove('popout-mode');
    };
  }, []);

  const postAction = useCallback((action) => {
    channelRef.current?.postMessage({ type: "ACTION", action, huntId: huntIdRef.current });
  }, []);

  const handleAdd = useCallback(() => {
    const data = fullDataRef.current;
    if (!data) return;

    const id = huntIdRef.current;
    const now = Date.now();
    let updatedTotalTime = totalTime;
    
    // Add logic
    const incrementValue = data.huntIncrements?.[id] || 1;
    const targetHunt = data.activeHunts.find(h => h.id === id);
    if (targetHunt) {
      targetHunt.checks += incrementValue;
      setChecks(targetHunt.checks);
    }
    
    // Timer rough approximation: add difference since lastCheckTime if not paused
    if (!data.pausedHunts?.includes(id)) {
      const elapsed = now - (data.lastCheckTimes?.[id] || now);
      data.totalCheckTimes[id] = (data.totalCheckTimes[id] || 0) + elapsed;
      updatedTotalTime = data.totalCheckTimes[id];
      setTotalTime(updatedTotalTime);
    }
    data.lastCheckTimes[id] = now;
    setLastCheckTime(now);

    postAction("ADD");
    huntAPI.updateHuntData(data).catch(console.error);
  }, [totalTime, isPaused, postAction]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if the user is actively typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || document.activeElement.contentEditable === 'true') {
        return;
      }
      
      if (e.key.toLowerCase() === hotkey.toLowerCase() && !isPaused) {
        handleAdd();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hotkey, isPaused, handleAdd]);

  const handleMinus = () => {
    if (checks <= 0) return;
    const data = fullDataRef.current;
    if (!data) return;

    const id = huntIdRef.current;
    const incrementValue = data.huntIncrements?.[id] || 1;
    const targetHunt = data.activeHunts.find(h => h.id === id);
    if (targetHunt) {
      targetHunt.checks = Math.max(0, targetHunt.checks - incrementValue);
      setChecks(targetHunt.checks);
    }
    
    postAction("MINUS");
    huntAPI.updateHuntData(data).catch(console.error);
  };

  const handlePause = () => {
    const data = fullDataRef.current;
    if (!data) return;

    const id = huntIdRef.current;
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);

    const now = Date.now();
    data.pausedHunts = data.pausedHunts || [];
    
    if (nextPaused) {
      // It was unpaused, now pausable. We need to add the unpaused time segment to totalCheckTimes before we "park" it.
      if (!data.pausedHunts.includes(id)) {
        data.pausedHunts.push(id);
        const elapsed = now - (data.lastCheckTimes?.[id] || now);
        data.totalCheckTimes[id] = (data.totalCheckTimes[id] || 0) + elapsed;
        setTotalTime(data.totalCheckTimes[id]);
      }
    } else {
      // Unpausing
      data.pausedHunts = data.pausedHunts.filter(p => p !== id);
    }
    
    // Refresh the checktime to 'now' so timers start ticking from 0 again correctly.
    data.lastCheckTimes[id] = now;
    setLastCheckTime(now);

    postAction(nextPaused ? "PAUSE" : "RESUME");
    huntAPI.updateHuntData(data).catch(console.error);
  };

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', color: 'white' }}>
        <p style={{ color: "#ef4444", fontWeight: 700 }}>{error}</p>
      </div>
    );
  }

  if (!hunt) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'gray' }}>Loading hunt…</div>;
  }

  const getPokemonImage = (pokemon) => pokemon?.sprites?.front_shiny || pokemon?.sprites?.front_default || "";

  const renderFormType = () => {
    if (!hunt.pokemon.formType || hunt.pokemon.formType === "main") return null;
    const map = {
      alpha: "Alpha",
      alphaother: "Alpha Forms",
      gmax: "Gigantamax",
      alolan: "Alolan",
      galarian: "Galarian",
      hisuian: "Hisuian",
      paldean: "Paldean",
      therian: "Therian",
      "ash-cap": "Partner Cap",
      "partner-cap": "Partner Cap"
    };
    return map[hunt.pokemon.formType] || hunt.pokemon.formType;
  };

  const calculateOddsDisplay = () => {
    if (hunt.method === "Ultra Wormholes" && (hunt.game === "Ultra Sun" || hunt.game === "Ultra Moon")) {
      return "1% - 36%";
    }

    const huntModifiers = hunt.modifiers || {
      shinyCharm: false, shinyParents: false, lureActive: false,
      researchLv10: false, perfectResearch: false, sparklingLv1: false,
      sparklingLv2: false, sparklingLv3: false, eventBoosted: false,
      communityDay: false, raidDay: false, researchDay: false,
      galarBirds: false, hatchDay: false
    };

    const isComboMethod = (method, games) => hunt.method === method && games.includes(hunt.game);

    if (
      isComboMethod("Poke Radar", ["Diamond", "Pearl", "Platinum"]) ||
      isComboMethod("Poke Radar", ["X", "Y"]) ||
      isComboMethod("Poke Radar", ["Brilliant Diamond", "Shining Pearl"]) ||
      isComboMethod("Chain Fishing", ["X", "Y", "Omega Ruby", "Alpha Sapphire"]) ||
      isComboMethod("DexNav", ["Omega Ruby", "Alpha Sapphire"]) ||
      isComboMethod("SOS", ["Sun", "Moon", "Ultra Sun", "Ultra Moon"]) ||
      isComboMethod("KO Method", ["Sword", "Shield"]) ||
      isComboMethod("Catch Combo", ["Let's Go Pikachu", "Let's Go Eevee"]) ||
      isComboMethod("Mass Outbreaks", ["Scarlet", "Violet"])
    ) {
      return `1/${getCurrentHuntOdds(hunt.game, hunt.method, huntModifiers, checks)}`;
    }

    if (hunt.odds === null) return "NA";
    return `1/${hunt.odds || 4096}`;
  };

  return (
    <div id="hunt-popout-wrapper" className="container page-container counters-page" style={{ margin: 0, padding: '20px', maxWidth: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        /* FOOLPROOF DESKTOP LOCK OVERRIDES */
        #hunt-popout-wrapper .decrease-check-btn {
            box-sizing: border-box !important;
        }
        #hunt-popout-wrapper .checks-display .decrease-check-btn {
            display: flex !important;
            position: absolute !important;
            bottom: -8px !important;
            left: -8px !important;
            width: 24px !important;
            height: 24px !important;
            padding: 0.25rem !important;
            border-radius: 50% !important;
            min-width: 0 !important;
            min-height: 0 !important;
        }
        #hunt-popout-wrapper .checks-buttons .decrease-check-btn {
            display: none !important;
        }
        #hunt-popout-wrapper .hunt-header {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 1.5rem !important;
            padding: 0 1rem !important;
            flex-wrap: nowrap !important;
        }
        #hunt-popout-wrapper .hunt-pokemon {
            flex: 1 !important;
            min-width: auto !important;
            max-width: none !important;
        }
        #hunt-popout-wrapper .hunt-pokemon-image {
            width: 90px !important;
            height: 90px !important;
        }
        #hunt-popout-wrapper .hunt-pokemon-info h3 {
            font-size: 1.1rem !important;
            line-height: normal !important;
            word-break: normal !important;
            white-space: normal !important;
            text-overflow: clip !important;
            overflow: visible !important;
        }
        #hunt-popout-wrapper .hunt-complete {
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            gap: 1rem !important;
        }
        #hunt-popout-wrapper .hunt-odds-display {
            width: 100% !important;
            flex: 1 1 auto !important;
            justify-content: center !important;
        }
        #hunt-popout-wrapper .complete-hunt-btn {
            width: auto !important;
            flex: 1 1 auto !important;
        }
        #hunt-popout-wrapper .hunt-actions {
            transform: none !important;
            display: flex !important;
            justify-content: flex-end !important;
            gap: 0.5rem !important;
        }
        #hunt-popout-wrapper .hunt-checks {
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            padding: 1.25rem !important;
            gap: 0.25rem !important;
        }
        #hunt-popout-wrapper .checks-display { width: auto !important; order: 0 !important; flex-shrink: 0 !important; }
        #hunt-popout-wrapper .timer-display { width: auto !important; margin-left: auto !important; order: 0 !important; flex-shrink: 0 !important; align-items: flex-start !important; text-align: left !important; }
        #hunt-popout-wrapper .checks-buttons { min-width: auto !important; order: 0 !important; flex-shrink: 0 !important; gap: 0.5rem !important; }
        #hunt-popout-wrapper .checks-count { font-size: 1.8rem !important; width: auto !important; min-width: 4rem !important; padding: 0.25rem 1rem !important; }
        #hunt-popout-wrapper .pause-btn, #hunt-popout-wrapper .add-check-btn { padding: 0.75rem 1.25rem !important; font-size: 1rem !important; }
        #hunt-popout-wrapper .hunt-delete-btn, #hunt-popout-wrapper .hunt-reset-btn, #hunt-popout-wrapper .hunt-settings-btn, #hunt-popout-wrapper .hunt-info-btn, #hunt-popout-wrapper .hunt-edit-btn { padding: 8px !important; width: auto !important; height: auto !important; min-width: 0 !important; min-height: 0 !important; }
        #hunt-popout-wrapper .hunt-delete-btn svg, #hunt-popout-wrapper .hunt-reset-btn svg, #hunt-popout-wrapper .hunt-settings-btn svg, #hunt-popout-wrapper .hunt-info-btn svg, #hunt-popout-wrapper .hunt-edit-btn svg { width: 16px !important; height: 16px !important; }
      `}</style>
      <div className="active-hunts-section" style={{ margin: 0, width: '100%', maxWidth: '400px' }}>
        <div className="hunts-grid" style={{ display: 'block' }}>

          <div className="hunt-card">
            <div className="hunt-header">
              {!expanded ? (
                <>
                  <div className="hunt-pokemon">
                    <img src={getPokemonImage(hunt.pokemon)} alt={formatPokemonName(hunt.pokemon.name)} className="hunt-pokemon-image" />
                    <div className="hunt-pokemon-info">
                      <h3>{formatPokemonName(hunt.pokemon.name)}</h3>
                      {renderFormType() && (
                        <div className="hunt-pokemon-form">{renderFormType()}</div>
                      )}
                    </div>
                  </div>
                  <div className="hunt-actions">
                    <button className="hunt-info-btn" title="Show hunt details" onClick={() => setExpanded(true)}><Info size={16} /></button>
                  </div>
                </>
              ) : (
                <>
                  <div className="hunt-details">
                    <div className="hunt-detail-item">Game: {hunt.game || "NA"}</div>
                    <div className="hunt-detail-item">Method: {hunt.method || "NA"}</div>
                  </div>
                  <div className="hunt-actions expanded-view">
                    <button className="hunt-info-btn" title="Hide hunt details" onClick={() => setExpanded(false)}><X size={16} /></button>
                  </div>
                </>
              )}
            </div>

            <div className="hunt-checks">
              <div className="checks-display">
                <span className="checks-count">{checks}</span>
                <button onClick={handleMinus} className="decrease-check-btn" title="Decrease check" disabled={checks <= 0}><Minus size={12} /></button>
              </div>
              <div className="timer-display">
                <div className="total-time">{formatTime(totalTime)}</div>
                <div className="last-check-time">
                  <TimerDisplay lastCheckTime={lastCheckTime} isPaused={isPaused} />
                </div>
              </div>
              <div className="checks-buttons">
                <button onClick={handlePause} className="pause-btn" title={isPaused ? "Resume hunt" : "Pause hunt"}>
                  {isPaused ? <Play size={16} /> : <Pause size={16} />}
                </button>
                <button onClick={handleMinus} className="decrease-check-btn" title="Decrease check" disabled={checks <= 0}><Minus size={16} /></button>
                <button onClick={handleAdd} className="add-check-btn" title="Add check"><Plus size={16} /></button>
              </div>
            </div>

            <div className="hunt-complete">
              <div className="hunt-odds-display" style={{ flex: '1 1 auto', width: '100%', justifyContent: 'center' }}>
                <span className="odds-label">Odds:</span>
                <span className="odds-value">{calculateOddsDisplay()}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
