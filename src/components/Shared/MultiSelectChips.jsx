import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../../css/ProgressBar.css";

export default function MultiSelectChips({ label, value = [], options, onChange }) {
  const [open, setOpen] = useState(false);
  const groupRef = useRef();
  const [dropdownStyle, setDropdownStyle] = useState(null);

  useEffect(() => {
    function handlePointerDown(e) {
      if (
        groupRef.current &&
        !groupRef.current.contains(e.target) &&
        !document.querySelector(".chip-filter-dropdown")?.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);


  useEffect(() => {
    if (open && groupRef.current) {
      const rect = groupRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 6, // Add small margin
        left: rect.left,
        width: rect.width,
        zIndex: 10052 // This will be overridden by CSS variable
      });
    }
  }, [open]);

function toggleOption(val) {
  if (value.includes(val)) {
    onChange(value.filter(v => v !== val));
  } else {
    onChange([...value, val]);
  }

  // Delay dropdown close to allow click to finish
  setTimeout(() => setOpen(false), 0);
}


  function formatLabel(val) {
    if (/^\d+$/.test(val)) return `Gen ${val}`;
    return val.charAt(0).toUpperCase() + val.slice(1);
  }

  return (
    <div className="chip-filter-group" ref={groupRef}>
      <div className="chip-filter-label">{label}</div>
      <div className="chip-filter-chips">
        {value.map(val => (
          <span key={val} className="chip">
            {formatLabel(val)}
            <button
              className="chip-remove"
              onClick={() => toggleOption(val)}
              aria-label={`Remove ${val}`}
            >
              ×
            </button>
          </span>
        ))}
        <button className="chip-add-btn" onClick={() => setOpen(o => !o)}>
          <Plus size={18} strokeWidth={3} />
        </button>
      </div>

      {open && dropdownStyle &&
        createPortal(
          <div className="chip-filter-dropdown" style={dropdownStyle}>
            {options.map(opt => {
              const val = typeof opt === "string" ? opt : opt.value;
              const label = typeof opt === "string" ? opt : opt.label;
              return (
                <button
                  key={val}
                  className="chip-option"
                  onClick={() => toggleOption(val)}
                >
                  {label || formatLabel(val)}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
