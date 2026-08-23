import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../../css/ProgressBar.css";

export default function MultiSelectChips({ label, value = [], options, onChange }) {
  const [open, setOpen] = useState(false);
  const groupRef = useRef();
  const dropdownRef = useRef();
  const [dropdownStyle, setDropdownStyle] = useState(null);

  useEffect(() => {
    function handlePointerDown(e) {
      if (
        groupRef.current &&
        !groupRef.current.contains(e.target) &&
        !dropdownRef.current?.contains(e.target)
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
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const topPos = spaceBelow < 220 ? Math.max(10, rect.top - 230) : rect.bottom + 6;

      setDropdownStyle({
        position: "fixed",
        top: topPos,
        left: Math.max(10, Math.min(rect.left, window.innerWidth - 240)),
        width: Math.max(rect.width, 220),
        zIndex: 10060
      });
    }
  }, [open]);

  function toggleOption(val) {
    if (value.includes(val)) {
      onChange(value.filter(v => v !== val));
    } else {
      onChange([...value, val]);
    }
    setOpen(false);
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
              type="button"
              className="chip-remove"
              onClick={(e) => {
                e.stopPropagation();
                toggleOption(val);
              }}
              aria-label={`Remove ${val}`}
            >
              ×
            </button>
          </span>
        ))}
        <button
          type="button"
          className="chip-add-btn"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(o => !o);
          }}
          aria-label={`Add ${label}`}
        >
          <Plus size={18} strokeWidth={3} />
        </button>
      </div>

      {open && dropdownStyle &&
        createPortal(
          <div className="chip-filter-dropdown" ref={dropdownRef} style={dropdownStyle}>
            {options.map(opt => {
              const val = typeof opt === "string" ? opt : opt.value;
              const optLabel = typeof opt === "string" ? opt : opt.label;
              const isSelected = value.includes(val);
              return (
                <button
                  key={val}
                  type="button"
                  className={`chip-option ${isSelected ? "selected" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(val);
                  }}
                >
                  <span>{optLabel || formatLabel(val)}</span>
                  {isSelected && <span className="chip-option-check">✓</span>}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
