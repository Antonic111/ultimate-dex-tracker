import { useEffect, useState } from "react";
import { Sparkles, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { BALL_OPTIONS, GAME_OPTIONS, MARK_OPTIONS, METHOD_OPTIONS } from "../../Constants";
import EvolutionChain from "../Dex/EvolutionChain";
import { formatPokemonName, getFormDisplayName, renderTypeBadge } from "../../utils";
import { showConfirm } from "../Shared/ConfirmDialog";
import { IconDropdown } from "../Shared/IconDropdown";
import ContentFilterInput from "../Shared/ContentFilterInput";
import { useMessage } from "../Shared/MessageContext";
import { validateContent } from "../../../shared/contentFilter";
import "../../css/EvolutionChain.css";
import "../../css/Sidebar.css";


export default function PokemonSidebar({ open = false, readOnly = false, pokemon, onClose, caughtInfo, updateCaughtInfo, showShiny, viewingUsername = null }) {
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(0);
  const [localEntries, setLocalEntries] = useState([]);
  const { showMessage } = useMessage();

  // Always use .value, never the full object, in editData
  const defaultEditData = {
    date: "",
    ball: "",
    mark: "",
    method: "",
    game: "",
    checks: "",
    notes: "",
    entryId: ""
  };






  const [editData, setEditData] = useState(defaultEditData);

  // Initialize state when component first mounts or when caughtInfo changes
  useEffect(() => {
    if (caughtInfo?.entries && caughtInfo.entries.length > 0) {
      setLocalEntries(caughtInfo.entries);
      // Only reset to first entry if we don't have a valid selectedEntryIndex
      if (selectedEntryIndex >= caughtInfo.entries.length) {
        setSelectedEntryIndex(0);
        const firstEntry = caughtInfo.entries[0];
        setEditData({
          date: firstEntry.date || "",
          ball: firstEntry.ball || BALL_OPTIONS[0].value,
          mark: firstEntry.mark || MARK_OPTIONS[0].value,
          method: firstEntry.method || METHOD_OPTIONS[0],
          game: firstEntry.game || GAME_OPTIONS[0].value,
          checks: firstEntry.checks || "",
          notes: firstEntry.notes || "",
          entryId: firstEntry.entryId || Math.random().toString(36).substr(2, 9)
        });
      } else {
        // Keep current selection but update editData to show current entry
        const currentEntry = caughtInfo.entries[selectedEntryIndex];
        setEditData({
          date: currentEntry.date || "",
          ball: currentEntry.ball || BALL_OPTIONS[0].value,
          mark: currentEntry.mark || MARK_OPTIONS[0].value,
          method: currentEntry.method || METHOD_OPTIONS[0],
          game: currentEntry.game || GAME_OPTIONS[0].value,
          checks: currentEntry.checks || "",
          notes: currentEntry.notes || "",
          entryId: currentEntry.entryId || Math.random().toString(36).substr(2, 9)
        });
      }
    } else {
      setLocalEntries([]);
      setEditData(defaultEditData);
      setSelectedEntryIndex(0);
    }
    setEditing(false);
  }, [caughtInfo, pokemon]);

  // Function to manually update editData when switching entries
  function switchToEntry(index) {
    if (localEntries && localEntries[index]) {
      const selectedEntry = localEntries[index];
      setEditData({
        date: selectedEntry.date || "",
        ball: selectedEntry.ball || BALL_OPTIONS[0].value,
        mark: selectedEntry.mark || MARK_OPTIONS[0].value,
        method: selectedEntry.method || METHOD_OPTIONS[0],
        game: selectedEntry.game || GAME_OPTIONS[0].value,
        checks: selectedEntry.checks || "",
        notes: selectedEntry.notes || "",
        entryId: selectedEntry.entryId || Math.random().toString(36).substr(2, 9)
      });
    }
  }

  function handleSetCaught() {
    const newEntry = {
      date: "",
      ball: BALL_OPTIONS[0].value,
      mark: MARK_OPTIONS[0].value,
      method: METHOD_OPTIONS[0],
      game: GAME_OPTIONS[0].value,
      checks: "",
      notes: "",
      entryId: Math.random().toString(36).substr(2, 9)
    };
    
    const newInfo = {
      caught: true,
      entries: [newEntry]
    };
    
    // Update local state immediately for instant UI update
    setLocalEntries([newEntry]);
    setEditData(newEntry);
    setSelectedEntryIndex(0);
    
    // Then update the global state
    updateCaughtInfo(pokemon, newInfo, showShiny);
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditData(edit => ({ ...edit, [name]: value }));
  }

  function handleSaveEdit() {
    // Save-time validation for notes
    const validation = validateContent(String(editData.notes || ''), 'notes');
    if (!validation.isValid) {
      showMessage(`❌ ${validation.error}`, 'error');
      return;
    }
    
    // Check if we're updating an existing entry or creating a new one
    const currentEntries = [...localEntries]; // Create a copy to avoid mutation
    let updatedEntries;
    let newSelectedIndex = selectedEntryIndex;
    
         // Check if we're updating an existing entry based on selectedEntryIndex
     if (selectedEntryIndex < currentEntries.length) {
       // Update existing entry at the current index
      const cleaned = {
        date: editData.date || "",
        ball: editData.ball || "",
        mark: editData.mark || "",
        game: editData.game || "",
        method: editData.method || "",
        checks:
          editData.checks === null ||
            String(editData.checks).trim() === "" ||
            String(editData.checks).trim() === "0"
            ? ""
            : String(editData.checks).trim(),
        notes: editData.notes || "",
        entryId: currentEntries[selectedEntryIndex].entryId // Keep the existing entryId
      };
      
             updatedEntries = currentEntries.map((entry, index) => 
         index === selectedEntryIndex ? cleaned : entry
       );
     } else {
       // Add new entry - select the new entry
      const cleaned = {
        date: editData.date || "",
        ball: editData.ball || "",
        mark: editData.mark || "",
        game: editData.game || "",
        method: editData.method || "",
        checks:
          editData.checks === null ||
            String(editData.checks).trim() === "" ||
            String(editData.checks).trim() === "0"
            ? ""
            : String(editData.checks).trim(),
        notes: editData.notes || "",
        entryId: Math.random().toString(36).substr(2, 9) // Generate new entryId for new entries
      };
      
             updatedEntries = [...currentEntries, cleaned];
       newSelectedIndex = currentEntries.length; // Select the new entry
     }
 
     const updatedInfo = {
       caught: true,
       entries: updatedEntries
     };

    // Update global state first
    updateCaughtInfo(pokemon, updatedInfo, showShiny);
    
    // Update local state and editData in the correct order
    setLocalEntries(updatedEntries);
    
    // Update editData to show the current entry
    if (selectedEntryIndex < updatedEntries.length) {
      setEditData(updatedEntries[selectedEntryIndex]);
    } else {
      setEditData(updatedEntries[updatedEntries.length - 1]);
    }
    setSelectedEntryIndex(newSelectedIndex);
    
    // Exit edit mode
    setEditing(false);
  }


  function handleCancelEdit() {
    setEditing(false);
    const firstEntry = localEntries[0] || {};
    setEditData({
      date: firstEntry.date || "",
      ball: firstEntry.ball || "",
      mark: firstEntry.mark || "",
      method: firstEntry.method || "",
      game: firstEntry.game || "",
      checks: firstEntry.checks || "",
      notes: firstEntry.notes || "",
      entryId: firstEntry.entryId || Math.random().toString(36).substr(2, 9)
    });
  }


  async function handleReset() {
    const confirmed = await showConfirm(
      `Reset ${formatPokemonName(pokemon?.name)}? This will delete all saved info.`
    );

    if (!confirmed) return;

    updateCaughtInfo(pokemon, null, showShiny);
    setLocalEntries([]);
    setEditData(defaultEditData); // all blanks
    setEditing(true);
  }

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 370);
  };

  if ((!open || !pokemon) && !closing) return null;

  // Look up objects for display by value
  const ballObj = BALL_OPTIONS.find(opt => opt.value === (editData?.ball ?? ""));
  const gameObj = GAME_OPTIONS.find(opt => opt.value === (editData?.game ?? ""));
  const markObj = MARK_OPTIONS.find(opt => opt.value === (editData?.mark ?? ""));

  const pokeImg = showShiny && pokemon?.sprites?.front_shiny
    ? pokemon.sprites.front_shiny
    : pokemon?.sprites?.front_default || "/fallback.png";
  const pokeName = formatPokemonName(pokemon?.name);
  const pokeTypes = pokemon?.types || [];

  return (
    <div className={`sidebar-overlay${open ? " open" : ""}`}>
      <div className={`sidebar-panel${open ? " open" : ""}${closing ? " slide-out" : ""}`} onClick={(e) => e.stopPropagation()}>
        <button className="sidebar-close" onClick={handleClose} aria-label="Close">
          <span className="sidebar-close-icon">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="20" cy="20" r="18" fill="#fff" stroke="#232323" strokeWidth="2" />
              <path d="M2 20a18 18 0 0 1 36 0" fill="#e62829" stroke="#232323" strokeWidth="2" />
              <rect x="2" y="19" width="36" height="2" fill="#232323" />
              <circle cx="20" cy="20" r="7" fill="#ffffffff" stroke="#232323" strokeWidth="2" />
              <circle cx="20" cy="20" r="3.5" fill="#fff" stroke="#232323" strokeWidth="1.5" />
            </svg>
          </span>
        </button>

        {/* Top row: Image + Name */}
        <div className="sidebar-top-flex">
          <div className="sidebar-poke-img-wrap">
            <img
              src={pokeImg}
              alt={pokeName}
              className="sidebar-poke-img"
              width={92}
              height={92}
            />
            {showShiny && (
              <div className="shiny-sparkles-overlay">
                <Sparkles 
                  size={16} 
                  className="shiny-sparkles-icon" 
                />
              </div>
            )}
          </div>
          <div className="sidebar-poke-name-container">
            <span className="sidebar-poke-name">{pokeName}</span>
          </div>
        </div>

        {/* Second row: Meta (left) + Badges (right) */}
        <div className="sidebar-info-badges-row">
          <div className="sidebar-poke-meta-centered">
            <div className="sidebar-dexnum">
              #{pokemon?.id ? String(pokemon.id).padStart(4, "0") : "----"}</div>
            <div className="sidebar-generation">Generation {pokemon?.gen ?? "?"}</div>

            <div className="sidebar-form">
              {pokemon ? getFormDisplayName(pokemon) : null}
            </div>

          </div>
          <div className="sidebar-type-col">
            {pokeTypes.map(type => renderTypeBadge(type))}
          </div>
        </div>

        <hr className="sidebar-divider" />

{/* Caught info section */}
<div className="sidebar-caught-section">
  {!caughtInfo ? (
    <div className="not-caught-section">
             <div className="not-caught-text">
         {readOnly && viewingUsername ? (
           <>
             <div>{viewingUsername} has not caught</div>
             <div>{formatPokemonName(pokemon?.name)} yet</div>
           </>
         ) : (
           "Not caught"
         )}
       </div>
      {!readOnly && (
        <button className="set-caught-btn" onClick={handleSetCaught}>
          Set as caught
        </button>
      )}
    </div>
  ) : editing && !readOnly ? (
    <form
      className="edit-caught-form"
      onSubmit={e => {
        e.preventDefault();
        handleSaveEdit();
      }}
    >
      <div className="edit-caught-field">
        <label className="dropdown-label">Date caught:</label>
        <input
          type="date"
          id="date-caught"
          name="date"
          value={editData.date}
          onChange={handleEditChange}
        />
      </div>

      <div className="edit-caught-field">
        <label className="dropdown-label">Ball caught in:</label>
        <IconDropdown
          id="ball-dropdown"
          options={BALL_OPTIONS}
          value={editData.ball}
          onChange={val => setEditData(edit => ({ ...edit, ball: val }))}
          placeholder="Select a ball..."
        />
      </div>

      <div className="edit-caught-field">
        <label className="dropdown-label">Game:</label>
        <IconDropdown
          id="game-dropdown"
          options={GAME_OPTIONS}
          value={editData.game}
          onChange={val => setEditData(edit => ({ ...edit, game: val }))}
          placeholder="Select a game..."
        />
      </div>

      <div className="edit-caught-field">
        <label className="dropdown-label">Mark:</label>
        <IconDropdown
          id="mark-dropdown"
          options={MARK_OPTIONS}
          value={editData.mark}
          onChange={val => setEditData(edit => ({ ...edit, mark: val }))}
          placeholder="Select a mark..."
        />
      </div>

      <div className="edit-caught-field">
        <label className="dropdown-label">Method:</label>
        <IconDropdown
          id="method-dropdown"
          options={[
            { name: "None", value: "" },
            ...METHOD_OPTIONS.filter(m => m !== "").map(m => ({ name: m, value: m })),
          ]}
          value={editData.method}
          onChange={val => setEditData(edit => ({ ...edit, method: val }))}
          placeholder="Select a method..."
        />
      </div>

      <div className="edit-caught-field">
        <label className="dropdown-label">Checks:</label>
        <input
          type="number"
          id="checks-input"
          name="checks"
          value={editData.checks}
          min="0"
          max="999999"
          onChange={handleEditChange}
          placeholder="Number of checks"
        />
      </div>

      <div className="edit-caught-field">
        <label className="dropdown-label">Notes/extras:</label>
        <ContentFilterInput
          id="notes-textarea"
          name="notes"
          type="textarea"
          value={editData.notes}
          onChange={handleEditChange}
          placeholder="Add notes about this Pokemon..."
          configType="notes"
          showCharacterCount={true}
          showRealTimeValidation={true}
        />
      </div>

      <div className="caught-btn-row">
        <button type="submit" className="save-caught-btn">Save</button>
        <button type="button" className="cancel-caught-btn" onClick={handleCancelEdit}>Cancel</button>
      </div>
    </form>
         ) : (
     <div>
                               {/* Paginated entries display with page navigation */}
                   {localEntries.length > 0 && (
            <div className="entries-display">
              {/* Entry info display - moved above the navigation */}
              <div className="pagination-info">
                Entry {selectedEntryIndex + 1} of {localEntries.length}
              </div>
              
                                                           <div className="entries-buttons">
                  {/* Only show navigation buttons when there are multiple entries */}
                  {localEntries.length > 1 ? (
                    <>
                      {/* Delete button for current entry - positioned on the left */}
                      {!readOnly && (
                        <button
                          className="entry-circle-btn delete-entry-btn"
                          onClick={async (e) => {
                            e.stopPropagation();
                            
                            const currentEntry = localEntries[selectedEntryIndex];
                            // Check if this entry has any saved data
                            const hasData = currentEntry.date || currentEntry.ball || currentEntry.game || currentEntry.mark || 
                                           currentEntry.method || currentEntry.checks || currentEntry.notes;
                            
                            // Only show confirmation if entry has data, otherwise delete immediately
                            if (hasData) {
                              const confirmed = await showConfirm(
                                `Delete entry #${selectedEntryIndex + 1}? This will remove all data for this entry.`
                              );
                              if (!confirmed) return;
                            }
                            
                            const updatedEntries = localEntries.filter((_, i) => i !== selectedEntryIndex);
                                                         if (updatedEntries.length === 0) {
                               updateCaughtInfo(pokemon, null, showShiny);
                               setLocalEntries([]);
                             } else {
                               updateCaughtInfo(pokemon, {
                                 caught: true,
                                 entries: updatedEntries
                               }, showShiny);
                              setLocalEntries(updatedEntries);
                              
                              // Adjust selectedEntryIndex if needed
                              if (selectedEntryIndex >= updatedEntries.length) {
                                setSelectedEntryIndex(updatedEntries.length - 1);
                              } else if (selectedEntryIndex > 0) {
                                setSelectedEntryIndex(selectedEntryIndex - 1);
                              }
                            }
                          }}
                          title="Delete current entry"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      
                      {/* Entry 1 button */}
                      <button 
                        className="entry-circle-btn"
                        onClick={() => {
                          setSelectedEntryIndex(0);
                          switchToEntry(0);
                        }}
                        disabled={selectedEntryIndex === 0}
                        title="Go to first entry"
                      >
                        1
                      </button>
                      
                      {/* Back 1 entry */}
                      <button 
                        className="entry-circle-btn"
                        onClick={() => {
                          if (selectedEntryIndex > 0) {
                            const newIndex = selectedEntryIndex - 1;
                            setSelectedEntryIndex(newIndex);
                            switchToEntry(newIndex);
                          }
                        }}
                        disabled={selectedEntryIndex === 0}
                        title="Previous entry"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      {/* Current entry (highlighted) */}
                      <button 
                        className="entry-circle-btn active"
                        disabled
                        title="Current entry"
                      >
                        {selectedEntryIndex + 1}
                      </button>
                      
                      {/* Forward 1 entry */}
                      <button 
                        className="entry-circle-btn"
                        onClick={() => {
                          if (selectedEntryIndex < localEntries.length - 1) {
                            const newIndex = selectedEntryIndex + 1;
                            setSelectedEntryIndex(newIndex);
                            switchToEntry(newIndex);
                          }
                        }}
                        disabled={selectedEntryIndex >= localEntries.length - 1}
                        title="Next entry"
                      >
                        <ChevronRight size={16} />
                      </button>
                      
                      {/* Last entry button */}
                      <button 
                        className="entry-circle-btn"
                        onClick={() => {
                          const newIndex = localEntries.length - 1;
                          setSelectedEntryIndex(newIndex);
                          switchToEntry(newIndex);
                        }}
                        disabled={selectedEntryIndex === localEntries.length - 1}
                        title="Go to last entry"
                      >
                        {localEntries.length}
                      </button>
                    </>
                  ) : (
                    /* Show just the current entry display when there's only 1 entry */
                    <button 
                      className="entry-circle-btn active"
                      disabled
                      title="Current entry"
                    >
                      1
                    </button>
                  )}
                  
                  {/* Add entry button - always show */}
                  {!readOnly && (
                    <button 
                      className={`add-entry-circle-btn ${localEntries.length >= 30 ? 'disabled' : ''}`}
                      onClick={() => {
                        if (localEntries.length >= 30) return; // Prevent action if at max
                        
                        const newEntry = {
                          date: "",
                          ball: BALL_OPTIONS[0].value,
                          mark: MARK_OPTIONS[0].value,
                          method: METHOD_OPTIONS[0],
                          game: GAME_OPTIONS[0].value,
                          checks: "",
                          notes: "",
                          entryId: Math.random().toString(36).substr(2, 9)
                        };
                        
                        const currentEntries = localEntries;
                        const updatedInfo = {
                          caught: true,
                          entries: [...currentEntries, newEntry]
                        };
                        
                                                 updateCaughtInfo(pokemon, updatedInfo, showShiny);
                         setLocalEntries([...currentEntries, newEntry]);
                         setSelectedEntryIndex(currentEntries.length); // Select the new entry
                         setEditData(newEntry); // Update editData to show the new entry
                      }}
                      disabled={localEntries.length >= 30}
                      title={localEntries.length >= 30 ? "Maximum entries reached (30)" : "Add another entry for this Pokémon (max 30)"}
                    >
                      +
                    </button>
                  )}
                </div>
            </div>
          )}
        
        {/* Display info from the selected entry */}
        <div className="sidebar-caught-info-list">
          {editData.date && (
            <div className="caught-info-card">
              <div className="caught-info-label-value">
                <div className="caught-info-label">Date</div>
                <div className="caught-info-value">{editData.date}</div>
              </div>
              <div className="caught-info-icon">
                <span role="img" aria-label="calendar" style={{ fontSize: 40 }}>📅</span>
              </div>
            </div>
          )}

          {ballObj && editData.ball && (
            <div className="caught-info-card">
              <div className="caught-info-label-value">
                <div className="caught-info-label">Ball</div>
                <div className="caught-info-value">{ballObj.name}</div>
              </div>
              <div className="caught-info-icon">
                <img src={ballObj.image} alt="" width="32" height="32" onError={e => (e.target.style.display = "none")} />
              </div>
            </div>
          )}

          {gameObj && editData.game && (
            <div className="caught-info-card">
              <div className="caught-info-label-value">
                <div className="caught-info-label">Game</div>
                <div className="caught-info-value">{gameObj.name}</div>
              </div>
              <div className="caught-info-icon">
                <img src={gameObj.image} alt="" width="32" height="32" onError={e => (e.target.style.display = "none")} />
              </div>
            </div>
          )}

          {markObj && editData.mark && (
            <div className="caught-info-card">
              <div className="caught-info-label-value">
                <div className="caught-info-label">Mark</div>
                <div className="caught-info-value">{markObj.name}</div>
              </div>
              <div className="caught-info-icon">
                <img src={markObj.image} alt="" width="48" height="48" onError={e => (e.target.style.display = "none")} />
              </div>
            </div>
          )}

          {editData.method && editData.method !== "" && (
            <div className="caught-info-card">
              <div className="caught-info-label-value">
                <div className="caught-info-label">Method</div>
                <div className="caught-info-value">{editData.method}</div>
              </div>
              <div className="caught-info-icon">
                <span role="img" aria-label="method" style={{ fontSize: 40 }}>🎯</span>
              </div>
            </div>
          )}

          {(editData.checks !== undefined &&
            editData.checks !== null &&
            String(editData.checks).trim() !== "") && (
            <div className="caught-info-card">
              <div className="caught-info-label-value">
                <div className="caught-info-label">Checks</div>
                <div className="caught-info-value">{Number(editData.checks).toLocaleString()}</div>
              </div>
              <div className="caught-info-icon">
                <span role="img" aria-label="checks" style={{ fontSize: 40 }}>✅</span>
              </div>
            </div>
          )}

          {editData.notes && editData.notes !== "" && (
            <div className="caught-info-card">
              <div className="caught-info-label-value">
                <div className="caught-info-label">Notes</div>
                <div className="caught-info-value">{editData.notes}</div>
              </div>
              <div className="caught-info-icon">
                <span role="img" aria-label="notes" style={{ fontSize: 40 }}>📝</span>
              </div>
            </div>
          )}

                                           
            
                        {/* Show warning when viewing an entry with no data - only for read-only modes and multiple entries */}
             {readOnly && localEntries.length > 1 && !editData.date && !editData.ball && !editData.game && !editData.mark && 
              !editData.method && !editData.checks && !editData.notes && (
               <div className="entries-warning">
                 <span className="warning-text">This entry has no saved data</span>
               </div>
             )}
        </div>

       {/* Edit button */}
       {!readOnly && (
         <div className="caught-btn-row">
           <button
             className="edit-caught-btn"
             onClick={() => setEditing(true)}
           >
             Edit Info
           </button>
         </div>
       )}

              {/* Show message when caught but no data in read-only mode */}
               {readOnly && viewingUsername && caughtInfo && (
          !localEntries.length || 
          localEntries.every(entry => 
            !entry.date && 
            !entry.ball && 
            !entry.mark && 
            !entry.method && 
            !entry.game && 
            !entry.checks && 
            !entry.notes
          ) ? (
           <div className="no-data-message">
             <div>{viewingUsername} has not set any data for {formatPokemonName(pokemon?.name)}</div>
           </div>
         ) : null
       )}

      

             {!readOnly && (
         ((localEntries.some(entry => entry.ball)) ||
           (localEntries.some(entry => entry.game)) ||
           (localEntries.some(entry => entry.mark)) ||
           (localEntries.some(entry => entry.method && entry.method !== "" && entry.method !== METHOD_OPTIONS[0])) ||
           (localEntries.some(entry => entry.checks && String(entry.checks).trim() !== "" && entry.checks !== 0)) ||
           (localEntries.some(entry => entry.notes && entry.notes !== "")) ||
           (localEntries.length > 1)) && (
          <div className="caught-btn-row">
            <button className="reset-caught-btn" onClick={handleReset}>Reset</button>
          </div>
        )
      )}
    </div>
  )}
</div>

        {pokemon && <EvolutionChain pokemon={pokemon} showShiny={showShiny} />}
      </div>
    </div>
  );
}
