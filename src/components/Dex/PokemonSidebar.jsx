import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
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
  const { showMessage } = useMessage();

  // Always use .value, never the full object, in editData
  const defaultEditData = {
    date: "",
    ball: "",
    mark: "",
    method: "",
    game: "",
    checks: "",
    notes: ""
  };


  // On caughtInfo/pokemon change, reset editing and editData
  useEffect(() => {
    setEditing(false);
    setEditData({
      date: caughtInfo?.date || "",
      ball: caughtInfo?.ball || BALL_OPTIONS[0].value,
      mark: caughtInfo?.mark || MARK_OPTIONS[0].value,
      method: caughtInfo?.method || METHOD_OPTIONS[0],
      game: caughtInfo?.game || GAME_OPTIONS[0].value,
      checks: caughtInfo?.checks || "",
      notes: caughtInfo?.notes || ""
    });
  }, [caughtInfo, pokemon]);

  const [editData, setEditData] = useState(defaultEditData);

  function handleSetCaught() {
    const now = new Date().toISOString().slice(0, 10);
    const newInfo = {
      date: "",
      ball: BALL_OPTIONS[0].value,
      mark: MARK_OPTIONS[0].value,
      method: METHOD_OPTIONS[0],
      game: GAME_OPTIONS[0].value,
      checks: "",
      notes: ""
    };
    updateCaughtInfo(pokemon, newInfo);
    setEditData(newInfo);
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
    const cleaned = {
      ...editData,
      ball: editData.ball,
      mark: editData.mark,
      game: editData.game,
      checks:
        editData.checks === null ||
          String(editData.checks).trim() === "" ||
          String(editData.checks).trim() === "0"
          ? ""
          : String(editData.checks).trim()
    };

    updateCaughtInfo(pokemon, cleaned);
    setEditing(false);
  }


  function handleCancelEdit() {
    setEditing(false);
    setEditData({
      date: caughtInfo?.date || "",
      ball: caughtInfo?.ball || "",
      mark: caughtInfo?.mark || "",
      method: caughtInfo?.method || "",
      game: caughtInfo?.game || "",
      checks: caughtInfo?.checks || "",
      notes: caughtInfo?.notes || ""
    });
  }


  async function handleReset() {
    const confirmed = await showConfirm(
      `Reset ${formatPokemonName(pokemon?.name)}? This will delete all saved info.`
    );

    if (!confirmed) return;

    updateCaughtInfo(pokemon, null);
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
  const ballObj = BALL_OPTIONS.find(opt => opt.value === (caughtInfo?.ball ?? ""));
  const gameObj = GAME_OPTIONS.find(opt => opt.value === (caughtInfo?.game ?? ""));
  const markObj = MARK_OPTIONS.find(opt => opt.value === (caughtInfo?.mark ?? ""));

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
  {!caughtInfo && !editing ? (
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
  ) : (editing && !readOnly) ? (
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
      <div className="sidebar-caught-info-list">
        {caughtInfo?.date && (
          <div className="caught-info-card">
            <div className="caught-info-label-value">
              <div className="caught-info-label">Date</div>
              <div className="caught-info-value">{caughtInfo.date}</div>
            </div>
            <div className="caught-info-icon">
              <span role="img" aria-label="calendar" style={{ fontSize: 40 }}>📅</span>
            </div>
          </div>
        )}

        {ballObj && ballObj.value && (
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

        {gameObj && gameObj.value && (
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

        {markObj && markObj.value && (
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

        {caughtInfo?.method && caughtInfo.method !== "" && (
          <div className="caught-info-card">
            <div className="caught-info-label-value">
              <div className="caught-info-label">Method</div>
              <div className="caught-info-value">{caughtInfo.method}</div>
            </div>
            <div className="caught-info-icon">
              <span role="img" aria-label="method" style={{ fontSize: 40 }}>🎯</span>
            </div>
          </div>
        )}

                 {(caughtInfo?.checks !== undefined &&
           caughtInfo?.checks !== null &&
           String(caughtInfo.checks).trim() !== "") && (
           <div className="caught-info-card">
             <div className="caught-info-label-value">
               <div className="caught-info-label">Checks</div>
               <div className="caught-info-value">{Number(caughtInfo.checks).toLocaleString()}</div>
             </div>
             <div className="caught-info-icon">
               <span role="img" aria-label="checks" style={{ fontSize: 40 }}>✅</span>
             </div>
           </div>
         )}

        {caughtInfo?.notes && caughtInfo.notes !== "" && (
          <div className="caught-info-card">
            <div className="caught-info-label-value">
              <div className="caught-info-label">Notes</div>
              <div className="caught-info-value">{caughtInfo.notes}</div>
            </div>
            <div className="caught-info-icon">
              <span role="img" aria-label="notes" style={{ fontSize: 40 }}>📝</span>
            </div>
          </div>
        )}
      </div>

      {/* Show message when caught but no data in read-only mode */}
      {readOnly && viewingUsername && caughtInfo && (
        !caughtInfo.date && 
        !caughtInfo.ball && 
        !caughtInfo.mark && 
        !caughtInfo.method && 
        !caughtInfo.game && 
        !caughtInfo.checks && 
        !caughtInfo.notes && (
                     <div className="no-data-message">
             <div>{viewingUsername} has not set any data for</div>
             <div>{formatPokemonName(pokemon?.name)}</div>
           </div>
        )
      )}

      {!readOnly && (
        <div className="caught-btn-row">
          <button
            className="edit-caught-btn"
            onClick={() => {
              setEditData({
                date: caughtInfo?.date || "",
                ball: caughtInfo?.ball || "",
                mark: caughtInfo?.mark || "",
                method: caughtInfo?.method || "",
                game: caughtInfo?.game || "",
                checks: caughtInfo?.checks || "",
                notes: caughtInfo?.notes || ""
              });
              setEditing(true);
            }}
          >
            Edit Info
          </button>
        </div>
      )}

      {!readOnly && (
        ((ballObj && ballObj.value) ||
          (gameObj && gameObj.value) ||
          (markObj && markObj.value) ||
          (caughtInfo?.method && caughtInfo.method !== "" && caughtInfo.method !== METHOD_OPTIONS[0]) ||
          (caughtInfo?.checks && String(caughtInfo.checks).trim() !== "" && caughtInfo.checks !== 0) ||
          (caughtInfo?.notes && caughtInfo.notes !== "")) && (
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
