import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Plus, Trash2, ChevronLeft, ChevronRight, Calendar, ChevronUp, ChevronDown, X, RotateCcw } from "lucide-react";
import { BALL_OPTIONS, GAME_OPTIONS, MARK_OPTIONS, METHOD_OPTIONS } from "../../Constants";
import EvolutionChain from "../Dex/EvolutionChain";
import { formatPokemonName, getFormDisplayName, renderTypeBadge } from "../../utils";

import { SearchbarIconDropdown } from "../Shared/SearchBar";
import ContentFilterInput from "../Shared/ContentFilterInput";
import { useMessage } from "../Shared/MessageContext";
import { validateContent } from "../../../shared/contentFilter";
// import "../../css/EvolutionChain.css"; // Moved to backup folder
import "../../css/Sidebar.css";


export default function PokemonSidebar({ open = false, readOnly = false, pokemon, onClose, caughtInfo, updateCaughtInfo, showShiny, viewingUsername = null }) {
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(0);
  const [localEntries, setLocalEntries] = useState([]);
  const { showMessage } = useMessage();

  // Modal states
  const [resetModal, setResetModal] = useState({ show: false, pokemonName: '' });
  const [deleteEntryModal, setDeleteEntryModal] = useState({ show: false, entryIndex: null, entryNumber: null });
  const [resetModalClosing, setResetModalClosing] = useState(false);
  const [deleteEntryModalClosing, setDeleteEntryModalClosing] = useState(false);

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



  // Mobile scroll handling removed - was causing page jumps
  // The sidebar now works naturally with page scrolling

  // Lightweight mobile scroll prevention - only when sidebar is fully open
  useEffect(() => {
    if (window.innerWidth <= 768) {
      if (open && !closing) {
        // Only prevent scrolling when sidebar is fully open (not during animations)
        document.body.classList.add('sidebar-open');
      } else {
        // Allow scrolling during closing animation and when closed
        document.body.classList.remove('sidebar-open');
      }
    }
  }, [open, closing]);

  // Cleanup effect to ensure CSS class is removed on unmount
  useEffect(() => {
    return () => {
      // Clean up if component unmounts while sidebar is open
      if (window.innerWidth <= 768) {
        document.body.classList.remove('sidebar-open');
      }
    };
  }, []);

  // Prevent scrolling when reset modal is open
  useEffect(() => {
    const preventScroll = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    if (resetModal.show) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    }
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [resetModal.show]);

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
              showMessage(`${validation.error}`, 'error');
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
    setResetModal({ show: true, pokemonName: formatPokemonName(pokemon?.name) });
  }

  // Handle reset confirmation
  const handleResetConfirm = () => {
    setResetModalClosing(true);
    setTimeout(() => {
      setResetModal({ show: false, pokemonName: '' });
      setResetModalClosing(false);
      
      // Execute the reset
      updateCaughtInfo(pokemon, null, showShiny);
      setLocalEntries([]);
      setEditData(defaultEditData); // all blanks
      setEditing(true);
    }, 300);
  };

  // Handle delete entry confirmation
  const handleDeleteEntryConfirm = () => {
    setDeleteEntryModalClosing(true);
    setTimeout(() => {
      setDeleteEntryModal({ show: false, entryIndex: null, entryNumber: null });
      setDeleteEntryModalClosing(false);
      
      // Execute the delete
      const updatedEntries = localEntries.filter((_, i) => i !== deleteEntryModal.entryIndex);
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
        if (deleteEntryModal.entryIndex >= updatedEntries.length) {
          setSelectedEntryIndex(updatedEntries.length - 1);
        } else if (deleteEntryModal.entryIndex > 0) {
          setSelectedEntryIndex(deleteEntryModal.entryIndex - 1);
        }
      }
    }, 300);
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 370); // Match the original backup animation duration
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
                                               <div 
          className={`sidebar-container ${closing ? 'sidebar-slide-out' : 'sidebar-slide-in'}`} 
          onClick={(e) => e.stopPropagation()}
        >
                                   <button className="sidebar-close-button" onClick={handleClose} aria-label="Close">
          <span className="flex items-center justify-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
                                                           className="sidebar-close-icon"
            >
              <path d="M2 20a18 18 0 0 1 36 0" fill="#e62829" stroke="#232323" strokeWidth="2" />
              <path d="M2 20a18 18 0 0 1 36 0" fill="#fff" stroke="#232323" strokeWidth="2" transform="rotate(180 20 20)" />
              <rect x="2" y="19" width="36" height="2" fill="#232323" />
              <circle cx="20" cy="20" r="7" fill="#ffffffff" stroke="#232323" strokeWidth="2" />
              <circle cx="20" cy="20" r="3.5" fill="#fff" stroke="#232323" strokeWidth="1.5" />
            </svg>
          </span>
        </button>

                 {/* Top row: Image + Name */}
                   <div className="sidebar-header">
                                                                                                                                                                               <div className="sidebar-pokemon-image">
                                                       <img
                 src={pokeImg}
                 alt={pokeName}
                 className="w-22 h-22 object-contain image-render-pixelated"
                 width={88}
                 height={88}
                 style={{ imageRendering: 'pixelated' }}
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
                                                                                                                                                                               <div className="flex-1">
                <span className="sidebar-pokemon-name">{pokeName}</span>
              </div>
        </div>

                {/* Second row: Meta (left) + Badges (right) */}
                 <div className="sidebar-meta-section">
                                           <div className="sidebar-meta-info">
                                                     <div className="sidebar-meta-text">
                 #{pokemon?.id ? String(pokemon.id).padStart(4, "0") : "----"}
               </div>
              <div className="sidebar-meta-text">
               Generation {pokemon?.gen ?? "?"}
               </div>
              <div className="sidebar-meta-text">
               {pokemon ? getFormDisplayName(pokemon) : null}
               </div>
           </div>
                     <div className="sidebar-type-badges">
            {pokeTypes.map(type => renderTypeBadge(type))}
          </div>
        </div>

                                                                       <hr className="sidebar-divider" style={{ top: '250px' }} />

       {/* Caught info section */}
      <div className="sidebar-content" style={{ top: '275px' }}>
  {!caughtInfo ? (
         <div className="sidebar-not-caught">
              <div className="sidebar-not-caught-text">
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
                                   <button className="sidebar-set-caught-button" onClick={handleSetCaught}>
           Set as caught
         </button>
      )}
    </div>
  ) : editing && !readOnly ? (
                   <form
        className="sidebar-form"
        onSubmit={e => {
          e.preventDefault();
          handleSaveEdit();
        }}
      >
                                                       <div className="sidebar-form-group">
           <label className="sidebar-label">Date caught:</label>
           <div className="relative">
             <input
               type="date"
               id="date-caught"
               name="date"
               value={editData.date}
               onChange={handleEditChange}
               className="sidebar-input pr-20"
               autoComplete="off"
             />
                           <Calendar 
                             className="absolute right-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--accent)] cursor-pointer hover:text-[var(--accent-hover)] transition-colors" 
                             onClick={() => document.getElementById('date-caught').showPicker?.() || document.getElementById('date-caught').click()}
                             title="Open date picker"
                           />
                                                           {editData.date && (
                                     <button
                     type="button"
                     onClick={() => handleEditChange({ target: { name: 'date', value: '' } })}
                     className="p-1"
                     title="Clear date"
                   >
                    <X size={14} />
                  </button>
                )}
           </div>
        </div>

             <div className="sidebar-form-group">
                  <label className="sidebar-label">Ball caught in:</label>
                                   <SearchbarIconDropdown
            id="ball-dropdown"
            options={BALL_OPTIONS}
            value={editData.ball}
            onChange={val => setEditData(edit => ({ ...edit, ball: val }))}
            placeholder="Select a ball..."
            customBackground="var(--sidebar-edit-inputs)"
            customBorder="var(--border-color)"
          />
      </div>

             <div className="sidebar-form-group">
                  <label className="sidebar-label">Game:</label>
                                   <SearchbarIconDropdown
            id="game-dropdown"
            options={GAME_OPTIONS}
            value={editData.game}
            onChange={val => setEditData(edit => ({ ...edit, game: val }))}
            placeholder="Select a game..."
            customBackground="var(--sidebar-edit-inputs)"
            customBorder="var(--border-color)"
          />
      </div>

             <div className="sidebar-form-group">
                  <label className="sidebar-label">Mark:</label>
                                   <SearchbarIconDropdown
            id="mark-dropdown"
            options={MARK_OPTIONS}
            value={editData.mark}
            onChange={val => setEditData(edit => ({ ...edit, mark: val }))}
            placeholder="Select a mark..."
            customBackground="var(--sidebar-edit-inputs)"
            customBorder="var(--border-color)"
          />
      </div>

             <div className="sidebar-form-group">
                  <label className="sidebar-label">Method:</label>
                                   <SearchbarIconDropdown
            id="method-dropdown"
            options={[
              { name: "None", value: "" },
              ...METHOD_OPTIONS.filter(m => m !== "").map(m => ({ name: m, value: m })),
            ]}
            value={editData.method}
            onChange={val => setEditData(edit => ({ ...edit, method: val }))}
            placeholder="Select a method..."
            customBackground="var(--sidebar-edit-inputs)"
            customBorder="var(--border-color)"
          />
      </div>

                                                       <div className="sidebar-form-group">
           <label className="sidebar-label">Checks:</label>
           <div className="relative">
             <input
               type="number"
               id="checks-input"
               name="checks"
               value={editData.checks}
               min="0"
               max="999999"
               onChange={handleEditChange}
               placeholder="Number of checks"
               className="sidebar-input pr-20"
               autoComplete="off"
             />
                                                    <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2 flex flex-col gap-0">
                <button
                  type="button"
                  onClick={() => {
                    const newValue = Math.min(999999, (editData.checks || 0) + 1);
                    handleEditChange({ target: { name: 'checks', value: newValue } });
                  }}
                  className="flex items-center justify-center p-0.5 transition-colors duration-200"
                  title="Increase checks"
                >
                  <ChevronUp className="w-4 h-4 text-[var(--accent)] hover:text-white transition-colors duration-200" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newValue = Math.max(0, (editData.checks || 0) - 1);
                    handleEditChange({ target: { name: 'checks', value: newValue } });
                  }}
                  className="flex items-center justify-center p-0.5 transition-colors duration-200"
                  title="Decrease checks"
                >
                  <ChevronDown className="w-4 h-4 text-[var(--accent)] hover:text-white transition-colors duration-200" />
                </button>
              </div>
                                                                                                               {(editData.checks !== '' && editData.checks !== null && editData.checks !== undefined) && (
                                     <button
                     type="button"
                     onClick={() => handleEditChange({ target: { name: 'checks', value: '' } })}
                     className="p-1"
                     title="Clear checks"
                   >
                    <X size={14} />
                  </button>
                )}
           </div>
        </div>

                           <div className="sidebar-form-group">
          <label className="sidebar-label">Notes/extras:</label>
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
           className="sidebar-input"
           autoComplete="off"
         />
       </div>

                                                       <div className="sidebar-form-buttons">
           <button type="submit" className="sidebar-button">Save</button>
           <button type="button" className="sidebar-button" onClick={handleCancelEdit}>Cancel</button>
         </div>
    </form>
         ) : (
     <div>
                               {/* Paginated entries display with page navigation */}
                                       {localEntries.length > 0 && (
             <div className="space-y-4">
               {/* Entry info display - moved above the navigation */}
                               <div className="sidebar-entries-info">
                  Entry {selectedEntryIndex + 1} of {localEntries.length}
                </div>
               
                                                                                                                         <div className="sidebar-navigation">
                  {/* Only show navigation buttons when there are multiple entries */}
                  {localEntries.length > 1 ? (
                    <>
                                             {/* Delete button for current entry - positioned on the left */}
                       {!readOnly && (
                         <button
                           className="sidebar-delete-button"
                           onClick={async (e) => {
                             e.stopPropagation();
                             
                             const currentEntry = localEntries[selectedEntryIndex];
                             // Check if this entry has any saved data
                             const hasData = currentEntry.date || currentEntry.ball || currentEntry.game || currentEntry.mark || 
                                            currentEntry.method || currentEntry.checks || currentEntry.notes;
                             
                             // Only show confirmation if entry has data, otherwise delete immediately
                             if (hasData) {
                               setDeleteEntryModal({ show: true, entryIndex: selectedEntryIndex, entryNumber: selectedEntryIndex + 1 });
                             } else {
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
                             }
                           }}
                           title="Delete current entry"
                         >
                           <Trash2 size={16} />
                         </button>
                       )}
                      
                                                                                                                                         {/* Entry 1 button */}
                         <button 
                           className="sidebar-nav-button"
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
                           className="sidebar-nav-button"
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
                         className="sidebar-current-entry"
                         disabled
                         title="Current entry"
                       >
                        {selectedEntryIndex + 1}
                      </button>
                      
                                                                                                                                         {/* Forward 1 entry */}
                         <button 
                           className="sidebar-nav-button"
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
                           className="sidebar-nav-button"
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
                        className="sidebar-current-entry"
                        disabled
                        title="Current entry"
                      >
                       1
                     </button>
                  )}
                  
                                     {/* Add entry button - always show */}
                   {!readOnly && (
                     <button 
                       className={`sidebar-add-button ${localEntries.length >= 30 ? 'sidebar-add-button-disabled' : ''}`}
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
                       <Plus size={16} />
                     </button>
                   )}
                </div>
            </div>
          )}
        
                 {/* Display info from the selected entry */}
         <div className="sidebar-display-section">
                                                                                                                                   {editData.date && (
                <div className="sidebar-display-card">
               <div className="sidebar-display-info">
                 <div className="sidebar-display-label">Date</div>
                 <div className="sidebar-display-value">{editData.date}</div>
               </div>
               <div className="sidebar-display-icon">📅</div>
             </div>
           )}

                                                                                                                                   {ballObj && editData.ball && (
                <div className="sidebar-display-card">
               <div className="sidebar-display-info">
                 <div className="sidebar-display-label">Ball</div>
                 <div className="sidebar-display-value">{ballObj.name}</div>
               </div>
               <div className="sidebar-display-image">
                 <img src={ballObj.image} alt="" className="w-full h-full object-contain" onError={e => (e.target.style.display = "none")} />
               </div>
             </div>
           )}

                                                                                       {gameObj && editData.game && (
               <div className="sidebar-display-card">
               <div className="sidebar-display-info">
                 <div className="sidebar-display-label">Game</div>
                 <div className="sidebar-display-value">{gameObj.name}</div>
               </div>
               <div className="sidebar-display-image">
                 <img src={gameObj.image} alt="" className="w-full h-full object-contain" onError={e => (e.target.style.display = "none")} />
               </div>
             </div>
           )}

                                                                                                                                   {markObj && editData.mark && (
                <div className="sidebar-display-card">
               <div className="sidebar-display-info">
                 <div className="sidebar-display-label">Mark</div>
                 <div className="sidebar-display-value">{markObj.name}</div>
               </div>
               <div className="sidebar-display-image-large">
                 <img src={markObj.image} alt="" className="w-full h-full object-contain" onError={e => (e.target.style.display = "none")} />
               </div>
             </div>
           )}

                                                                                                                                   {editData.method && editData.method !== "" && (
                <div className="sidebar-display-card">
               <div className="sidebar-display-info">
                 <div className="sidebar-display-label">Method</div>
                 <div className="sidebar-display-value">{editData.method}</div>
               </div>
               <div className="sidebar-display-icon">🎯</div>
             </div>
           )}

                                                                                                                               {(editData.checks !== undefined &&
               editData.checks !== null &&
               String(editData.checks).trim() !== "") && (
                <div className="sidebar-display-card">
               <div className="sidebar-display-info">
                 <div className="sidebar-display-label">Checks</div>
                 <div className="sidebar-display-value">{Number(editData.checks).toLocaleString()}</div>
               </div>
               <div className="sidebar-display-icon">✅</div>
             </div>
           )}

                                                                                                                                   {editData.notes && editData.notes !== "" && (
                <div className="sidebar-display-card">
               <div className="sidebar-display-info flex-1 mr-4">
                 <div className="sidebar-display-label">Notes</div>
                 <div className="sidebar-display-value break-words">{editData.notes}</div>
               </div>
               <div className="sidebar-display-icon flex-shrink-0">📝</div>
             </div>
           )}

                                           
            
                                                 {/* Show warning when viewing an entry with no data - only for read-only modes and multiple entries */}
              {readOnly && localEntries.length > 1 && !editData.date && !editData.ball && !editData.game && !editData.mark && 
               !editData.method && !editData.checks && !editData.notes && (
                <div className="sidebar-warning">
                  <span className="sidebar-warning-text">This entry has no saved data</span>
                </div>
              )}
        </div>

               {/* Edit button */}
                 {!readOnly && (
                       <div className="sidebar-edit-section">
              <button
                className="sidebar-button"
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
                         <div className="sidebar-message">
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
                                               <div className="sidebar-reset-section">
               <button className="sidebar-reset-button" onClick={handleReset}>Reset</button>
             </div>
         )
       )}
    </div>
  )}

        {/* Spacer for evolution chain */}
        <div className="evolution-chain-spacer"></div>
        {pokemon && <EvolutionChain pokemon={pokemon} showShiny={showShiny} />}
      </div>

             {/* Reset Pokémon Modal */}
       {resetModal.show && createPortal(
         <div 
           className={`fixed inset-0 z-[20000] ${resetModalClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
           onClick={() => {
             setResetModalClosing(true);
             setTimeout(() => {
               setResetModal({ show: false, pokemonName: '' });
               setResetModalClosing(false);
             }, 300);
           }}
         >
           <div className="bg-black/80  w-full h-full flex items-center justify-center">
                           <div 
                className={`bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl ${resetModalClosing ? 'animate-[slideOut_0.3s_ease-in_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}`}
                onClick={(e) => e.stopPropagation()}
              >
                                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                     <RotateCcw className="w-5 h-5 text-red-400" />
                   </div>
                   <div>
                     <h3 className="text-lg font-semibold text-[var(--accent)]">Reset Pokémon</h3>
                     <p className="text-sm text-[var(--progressbar-info)]">This action cannot be undone</p>
                   </div>
                 </div>
                 <p className="text-gray-300 mb-6">
                   Are you sure you want to reset <span className="font-semibold text-[var(--accent)]">{resetModal.pokemonName}</span>? 
                   This will delete all saved data.
                 </p>
                               <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setResetModalClosing(true);
                      setTimeout(() => {
                        setResetModal({ show: false, pokemonName: '' });
                        setResetModalClosing(false);
                      }, 300);
                    }}
                    className="px-4 py-2 rounded-lg bg-transparent border-2 border-[var(--dividers)] text-[var(--text)] hover:bg-[var(--dividers)] transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetConfirm}
                    className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black hover:text-white transition-colors font-semibold"
                  >
                    Reset Pokémon
                  </button>
                </div>
             </div>
           </div>
         </div>,
         document.body
       )}

             {/* Delete Entry Modal */}
       {deleteEntryModal.show && createPortal(
         <div 
           className={`fixed inset-0 z-[20000] ${deleteEntryModalClosing ? 'animate-[fadeOut_0.3s_ease-in_forwards]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
           onClick={() => {
             setDeleteEntryModalClosing(true);
             setTimeout(() => {
               setDeleteEntryModal({ show: false, entryIndex: null, entryNumber: null });
               setDeleteEntryModalClosing(false);
             }, 300);
           }}
         >
           <div className="bg-black/80  w-full h-full flex items-center justify-center">
                           <div 
                className={`bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl ${deleteEntryModalClosing ? 'animate-[slideOut_0.3s_ease-in_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}`}
                onClick={(e) => e.stopPropagation()}
              >
                                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                     <Trash2 className="w-5 h-5 text-red-400" />
                   </div>
                   <div>
                     <h3 className="text-lg font-semibold text-[var(--accent)]">Delete Entry</h3>
                     <p className="text-sm text-[var(--progressbar-info)]">This action cannot be undone</p>
                   </div>
                 </div>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete entry <span className="font-semibold text-[var(--accent)]">#{deleteEntryModal.entryNumber}</span>? 
                  This will remove all data for this entry including date, ball, mark, method, game, checks, and notes.
                </p>
               <div className="flex gap-3 justify-end">
                 <button
                   onClick={() => {
                     setDeleteEntryModalClosing(true);
                     setTimeout(() => {
                       setDeleteEntryModal({ show: false, entryIndex: null, entryNumber: null });
                       setDeleteEntryModalClosing(false);
                     }, 300);
                   }}
                   className="px-4 py-2 rounded-lg bg-transparent border-2 border-[var(--dividers)] text-[var(--text)] hover:bg-[var(--dividers)] transition-colors font-semibold"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleDeleteEntryConfirm}
                   className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black hover:text-white transition-colors"
                 >
                   Delete Entry
                 </button>
               </div>
             </div>
           </div>
         </div>,
         document.body
       )}
    </div>
  );
}
