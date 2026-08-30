/**
 * Universal Modular Properties System for the Hunt Overlay Editor.
 * Collapsible sections, dual slider+number inputs, color pickers,
 * expanded effects, transform controls, position/alignment, and quick actions.
 */
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  AlignLeft, AlignCenter, AlignRight,
  AlignJustify, AlignHorizontalJustifyCenter,
  AlignHorizontalSpaceAround, AlignVerticalSpaceAround,
  ChevronDown, ChevronRight, Eye, EyeOff, Lock, Unlock,
  GripVertical, Wand2, RotateCcw, Copy, MoreHorizontal, Sparkles, Minus
} from "lucide-react";
import { Tooltip } from "../Shared/Tooltip";
import SelectField from "../Shared/FormField/SelectField";

// ─── Font constants ────────────────────────────────────────────────────────
export const FONT_FAMILIES = {
  inherit: "inherit",
  inter: "'Inter', sans-serif",
  outfit: "'Outfit', sans-serif",
  orbitron: "'Orbitron', sans-serif",
  rubik: "'Rubik', sans-serif",
  poppins: "'Poppins', sans-serif",
  chakra: "'Chakra Petch', sans-serif",
  "press-start": "'Press Start 2P', monospace",
  pixelify: "'Pixelify Sans', sans-serif",
};

export const FONT_FAMILY_OPTIONS = [
  { value: "inherit", label: "Default Site Font" },
  { value: "inter", label: "Inter (Clean Modern)" },
  { value: "outfit", label: "Outfit (Futuristic Display)" },
  { value: "orbitron", label: "Orbitron (Sci-Fi Tech)" },
  { value: "rubik", label: "Rubik (Bold Friendly)" },
  { value: "poppins", label: "Poppins (Geometric Round)" },
  { value: "chakra", label: "Chakra Petch (Esports Cyber)" },
  { value: "press-start", label: "Press Start 2P (Retro 8-Bit)" },
  { value: "pixelify", label: "Pixelify Sans (Crisp Pixel)" },
];

// ─── Element capability map ────────────────────────────────────────────────
export const ELEMENT_CAPABILITIES = {
  "pokemon-sprite": {
    name: "Pokémon Sprite",
    sections: ["sprite", "transform", "effects"],
    transform: { hideScale: true },
  },
  "pokemon-name": {
    name: "Pokémon Name",
    sections: ["typography", "transform", "effects"],
    typography: { hasAlignment: true, hasItalic: true, hasUppercase: true, minSize: 10, maxSize: 72, defaultSize: 22 },
  },
  "game-tags": {
    name: "Game / Method",
    sections: ["gameTags", "typography", "background", "transform", "effects"],
    typography: { hasAlignment: true, hasItalic: true, hasUppercase: true, minSize: 6, maxSize: 32, defaultSize: 12 },
    background: { defaultBg: "#222222", defaultBorder: "#444444" },
  },
  "held-items": {
    name: "Modifier Icons",
    sections: ["modifierIcons", "transform", "effects"],
  },
  "counter": {
    name: "Encounter Counter",
    sections: ["typography", "counterLabel", "transform", "effects"],
    typography: { hasAlignment: false, hasItalic: true, hasUppercase: false, minSize: 20, maxSize: 96, defaultSize: 54 },
  },
  "divider": {
    name: "Sparkle Divider",
    sections: ["dividerStyle", "transform", "effects"],
  },
  "timer": {
    name: "Timer / Stopwatch",
    sections: ["typography", "background", "transform", "effects"],
    typography: { hasAlignment: false, hasItalic: false, hasUppercase: false, minSize: 8, maxSize: 36, defaultSize: 14 },
    background: { defaultBg: "rgba(255,255,255,0.07)", defaultBorder: "rgba(255,255,255,0.12)" },
  },
  "phase": {
    name: "Phase Counter",
    sections: ["typography", "background", "transform", "effects"],
    typography: { hasAlignment: false, hasItalic: false, hasUppercase: false, minSize: 8, maxSize: 36, defaultSize: 14 },
    background: { defaultBg: "rgba(255,255,255,0.07)", defaultBorder: "rgba(255,255,255,0.12)" },
  },
  "pace": {
    name: "Checks / Sec",
    sections: ["typography", "background", "transform", "effects"],
    typography: { hasAlignment: false, hasItalic: false, hasUppercase: false, minSize: 8, maxSize: 36, defaultSize: 14 },
    background: { defaultBg: "rgba(255,255,255,0.07)", defaultBorder: "rgba(255,255,255,0.12)" },
  },
  "odds": {
    name: "Odds",
    sections: ["typography", "background", "transform", "effects"],
    typography: { hasAlignment: false, hasItalic: true, hasUppercase: false, minSize: 4, maxSize: 36, defaultSize: 13 },
    background: { defaultBg: "#222222", defaultBorder: "#444444" },
  },
};

// ─── Primitive UI Controls ─────────────────────────────────────────────────

export function PropSection({ title, icon: Icon, children, defaultOpen = true, accent }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="prop-section">
      <button type="button" className="prop-section-header" onClick={() => setOpen((v) => !v)}>
        <span className="prop-section-header-left">
          {Icon && <Icon size={11} style={{ color: accent || "var(--accent,#facc15)" }} />}
          <span className="prop-section-title">{title}</span>
        </span>
        {open ? <ChevronDown size={12} className="prop-chevron" /> : <ChevronRight size={12} className="prop-chevron" />}
      </button>
      {open && <div className="prop-section-body">{children}</div>}
    </div>
  );
}

export function SliderNumberInput({ label, value, onChange, min, max, step = 1, unit = "px" }) {
  return (
    <div className="prop-field">
      {label && (
        <div className="prop-field-row-header">
          <label className="prop-label">{label}</label>
          <span className="prop-value-badge">{value}{unit}</span>
        </div>
      )}
      <div className="prop-slider-row">
        <input
          type="range"
          className="prop-slider"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

export function ColorInput({ label, value, onChange, fallback = "#ffffff" }) {
  const displayVal = value || fallback;
  return (
    <div className="prop-field">
      {label && <label className="prop-label">{label}</label>}
      <label className="prop-color-swatch">
        <span className="prop-color-dot" style={{ backgroundColor: displayVal }} />
        <span className="prop-color-hex">{displayVal}</span>
        <input type="color" className="sr-only" value={displayVal} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

export function PropToggle({ label, checked, onChange, children }) {
  return (
    <div className="prop-toggle-wrap">
      <div className="prop-toggle-row">
        <span className="prop-label">{label}</span>
        <label className="overlay-toggle-switch">
          <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
          <span className="overlay-toggle-slider" />
        </label>
      </div>
      {checked && children && <div className="prop-toggle-body">{children}</div>}
    </div>
  );
}

export function ChipBtn({ active, onClick, children, title, accentHex }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`prop-chip-btn ${active ? "active" : ""}`}
      style={active ? { "--chip-accent": accentHex || "var(--accent,#facc15)" } : {}}
    >
      {children}
    </button>
  );
}

export function PropGrid({ children }) {
  return <div className="prop-grid-2">{children}</div>;
}

export function PropCheckbox({ label, checked, onChange, accentHex }) {
  return (
    <label
      className={`prop-checkbox-pill ${checked ? "active" : ""}`}
      style={checked ? { "--chip-accent": accentHex || "var(--accent,#facc15)" } : {}}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      {label}
    </label>
  );
}

// ─── Section Components ────────────────────────────────────────────────────

function TypographySection({ props, update, capabilities, accentHex }) {
  const typo = capabilities?.typography || {};
  return (
    <PropSection title="Typography" defaultOpen={true} accent={accentHex}>
      <div className="prop-field">
        <SelectField
          label="Font Family"
          size="sm"
          options={FONT_FAMILY_OPTIONS}
          value={props.fontFamily || "inherit"}
          onChange={(val) => update({ fontFamily: val })}
        />
      </div>
      <PropGrid>
        <ColorInput label="Color" value={props.color} onChange={(v) => update({ color: v })} fallback="#ffffff" />
        {(typo.hasItalic || typo.hasUppercase) && (
          <div className="prop-field">
            <label className="prop-label">Style</label>
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
              {typo.hasItalic && (
                <PropCheckbox label="Italic" checked={Boolean(props.italic)} onChange={(v) => update({ italic: v })} accentHex={accentHex} />
              )}
              {typo.hasUppercase && (
                <PropCheckbox label="ALL CAPS" checked={Boolean(props.uppercase)} onChange={(v) => update({ uppercase: v })} accentHex={accentHex} />
              )}
            </div>
          </div>
        )}
      </PropGrid>
      <SliderNumberInput
        label="Font Size"
        value={props.fontSize || (typo.defaultSize || 14)}
        onChange={(v) => update({ fontSize: v })}
        min={typo.minSize || 8}
        max={typo.maxSize || 72}
        unit="px"
      />
      {typo.hasAlignment && (
        <div className="prop-field">
          <label className="prop-label">Alignment</label>
          <div className="prop-segmented">
            {[
              { value: "left", icon: <AlignLeft size={13} />, title: "Align Left", align: "start" },
              { value: "center", icon: <AlignCenter size={13} />, title: "Align Center", align: "center" },
              { value: "right", icon: <AlignRight size={13} />, title: "Align Right", align: "end" },
            ].map((opt) => (
              <Tooltip key={opt.value} content={opt.title} position="top" align={opt.align} maxWidth={100}>
                <ChipBtn
                  active={(!props.textAlign && opt.value === "left") || props.textAlign === opt.value}
                  onClick={() => update({ textAlign: opt.value })}
                  accentHex={accentHex}
                >
                  {opt.icon}
                </ChipBtn>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
    </PropSection>
  );
}

function BackgroundSection({ props, update, capabilities, accentHex }) {
  const bgConfig = capabilities?.background || {};
  return (
    <PropSection title="Background" defaultOpen={false} accent={accentHex}>
      <PropToggle label="Show Background" checked={props.showBackground !== false} onChange={(v) => update({ showBackground: v })}>
        <PropGrid>
          <ColorInput label="Fill" value={props.backgroundColor} onChange={(v) => update({ backgroundColor: v })} fallback={bgConfig.defaultBg || "#222222"} />
          <ColorInput label="Border" value={props.borderColor} onChange={(v) => update({ borderColor: v })} fallback={bgConfig.defaultBorder || "#444444"} />
        </PropGrid>
        <SliderNumberInput label="Padding" value={props.pillPadding ?? 12} onChange={(v) => update({ pillPadding: v })} min={0} max={32} unit="px" />
        <SliderNumberInput label="Corner Radius" value={props.borderRadius ?? 99} onChange={(v) => update({ borderRadius: v })} min={0} max={99} unit="px" />
      </PropToggle>
    </PropSection>
  );
}

function CounterLabelSection({ props, update, accentHex }) {
  return (
    <PropSection title="Label" defaultOpen={false} accent={accentHex}>
      <PropToggle label="Show Label" checked={props.showLabel !== false} onChange={(v) => update({ showLabel: v })}>
        <div className="prop-field">
          <label className="prop-label">Position</label>
          <div className="prop-segmented">
            {[{ value: "below", label: "Below" }, { value: "right", label: "Beside" }].map((opt) => (
              <ChipBtn
                key={opt.value}
                active={(!props.labelPosition && opt.value === "below") || props.labelPosition === opt.value}
                onClick={() => update({ labelPosition: opt.value })}
                accentHex={accentHex}
              >
                <span style={{ fontSize: "10px" }}>{opt.label}</span>
              </ChipBtn>
            ))}
          </div>
        </div>
        <div className="prop-field">
          <label className="prop-label">Custom Text</label>
          <input
            type="text"
            className="prop-input"
            placeholder="Default (Encounters, Resets…)"
            value={props.customLabel || ""}
            onChange={(e) => update({ customLabel: e.target.value })}
          />
        </div>
        <PropGrid>
          <ColorInput label="Color" value={props.labelColor} onChange={(v) => update({ labelColor: v })} fallback="#888888" />
          <div className="prop-field">
            <label className="prop-label">Format</label>
            <PropCheckbox label="ALL CAPS" checked={props.labelUppercase !== false} onChange={(v) => update({ labelUppercase: v })} accentHex={accentHex} />
          </div>
        </PropGrid>
        <SliderNumberInput label="Label Size" value={props.labelFontSize || 12} onChange={(v) => update({ labelFontSize: v })} min={8} max={24} unit="px" />
      </PropToggle>
    </PropSection>
  );
}

function DividerSection({ props, update, accentHex }) {
  const isLineOnly = props.symbol === "none";
  return (
    <PropSection title="Divider Style" defaultOpen={true} accent={accentHex}>
      <div className="prop-field">
        <label className="prop-label">Center Symbol</label>
        <div className="prop-segmented">
          {[
            { value: "diamond", symbol: "✦", title: "Diamond" },
            { value: "star", symbol: "★", title: "Star" },
            { value: "dot", symbol: "•", title: "Dot" },
            { value: "none", symbol: "—", title: "Line Only" },
          ].map((opt) => (
            <Tooltip key={opt.value} content={opt.title} position="top" maxWidth={100}>
              <ChipBtn
                active={(!props.symbol && opt.value === "diamond") || props.symbol === opt.value}
                onClick={() => update({ symbol: opt.value })}
                accentHex={accentHex}
              >
                <span style={{ fontSize: "12px", fontWeight: "bold" }}>{opt.symbol}</span>
              </ChipBtn>
            </Tooltip>
          ))}
        </div>
      </div>
      <PropGrid>
        {!isLineOnly && (
          <ColorInput label="Symbol Color" value={props.color} onChange={(v) => update({ color: v })} fallback={accentHex || "#ffe76a"} />
        )}
        <ColorInput label="Line Color" value={props.lineColor} onChange={(v) => update({ lineColor: v })} fallback="rgba(255, 255, 255, 0.2)" />
      </PropGrid>
      {!isLineOnly && (
        <SliderNumberInput label="Symbol Size" value={props.symbolSize || 10} onChange={(v) => update({ symbolSize: v })} min={6} max={28} unit="px" />
      )}
      <SliderNumberInput label="Line Thickness" value={props.lineThickness || 1} onChange={(v) => update({ lineThickness: v })} min={1} max={6} unit="px" />
    </PropSection>
  );
}

function GameTagsSection({ config, updateConfig, accentHex }) {
  const ps = config?.pokemonSettings || {};
  const updatePs = (partial) =>
    updateConfig((prev) => ({ ...prev, pokemonSettings: { ...(prev?.pokemonSettings || {}), ...partial } }));
  return (
    <PropSection title="Tag Visibility" defaultOpen={true} accent={accentHex}>
      <div className="prop-chip-group">
        {[{ key: "showGame", label: "Game" }, { key: "showMethod", label: "Method" }, { key: "showForm", label: "Form" }].map((item) => (
          <ChipBtn key={item.key} active={ps[item.key] !== false} onClick={() => updatePs({ [item.key]: ps[item.key] === false })} accentHex={accentHex}>
            {item.label}
          </ChipBtn>
        ))}
      </div>
    </PropSection>
  );
}

function ModifierIconsSection({ props, update, accentHex }) {
  return (
    <PropSection title="Icons" defaultOpen={true} accent={accentHex}>
      <SliderNumberInput label="Icon Size" value={props.iconSize || 34} onChange={(v) => update({ iconSize: v })} min={18} max={64} unit="px" />
      <SliderNumberInput label="Spacing" value={props.gap ?? 8} onChange={(v) => update({ gap: v })} min={0} max={24} unit="px" />
      <div className="prop-field">
        <label className="prop-label">Alignment</label>
        <div className="prop-segmented">
          {[
            { value: "left", icon: <AlignLeft size={13} />, title: "Left", align: "start" },
            { value: "center", icon: <AlignCenter size={13} />, title: "Center", align: "center" },
            { value: "right", icon: <AlignRight size={13} />, title: "Right", align: "end" },
          ].map((opt) => (
            <Tooltip key={opt.value} content={opt.title} position="top" align={opt.align} maxWidth={100}>
              <ChipBtn active={(!props.textAlign && opt.value === "left") || props.textAlign === opt.value} onClick={() => update({ textAlign: opt.value })} accentHex={accentHex}>
                {opt.icon}
              </ChipBtn>
            </Tooltip>
          ))}
        </div>
      </div>
      <PropSection title="Level Badge" defaultOpen={false} accent={accentHex}>
        <PropGrid>
          <ColorInput label="Color" value={props.badgeColor} onChange={(v) => update({ badgeColor: v })} fallback={accentHex || "#facc15"} />
          <SliderNumberInput label="Size" value={props.badgeSize || 13} onChange={(v) => update({ badgeSize: v })} min={8} max={22} unit="px" />
        </PropGrid>
      </PropSection>
    </PropSection>
  );
}

function SpriteSection({ config, updateConfig, accentHex }) {
  const ps = config?.pokemonSettings || {};
  const updatePs = (partial) =>
    updateConfig((prev) => ({ ...prev, pokemonSettings: { ...(prev?.pokemonSettings || {}), ...partial } }));
  return (
    <PropSection title="Sprite" defaultOpen={true} accent={accentHex}>
      <SliderNumberInput label="Sprite Size" value={ps.spriteSize ?? 90} onChange={(v) => updatePs({ spriteSize: v })} min={32} max={200} unit="px" />
      <PropToggle label="Shiny Sparkle Badge" checked={ps.showShinyIndicator !== false} onChange={(v) => updatePs({ showShinyIndicator: v })}>
        <SliderNumberInput label="Sparkle Size" value={ps.sparkleSize ?? 22} onChange={(v) => updatePs({ sparkleSize: v })} min={12} max={48} unit="px" />
        <ColorInput label="Sparkle Color" value={ps.customShinySparkleColor} onChange={(v) => updatePs({ shinySparkleColorMode: "custom", customShinySparkleColor: v })} fallback={accentHex || "#facc15"} />
      </PropToggle>
    </PropSection>
  );
}

function EffectsSection({ props, update, accentHex }) {
  return (
    <PropSection title="Effects" defaultOpen={false} accent={accentHex}>
      <PropToggle label="Glow" checked={Boolean(props.glow)} onChange={(v) => update({ glow: v })}>
        <PropGrid>
          <ColorInput label="Color" value={props.glowColor} onChange={(v) => update({ glowColor: v })} fallback={accentHex || "#facc15"} />
          <SliderNumberInput label="Blur" value={props.glowBlur ?? 16} onChange={(v) => update({ glowBlur: v })} min={2} max={60} unit="px" />
        </PropGrid>
        <SliderNumberInput label="Opacity" value={props.glowOpacity ?? 80} onChange={(v) => update({ glowOpacity: v })} min={0} max={100} unit="%" />
      </PropToggle>
      <PropToggle label="Drop Shadow" checked={Boolean(props.dropShadow)} onChange={(v) => update({ dropShadow: v })}>
        <ColorInput label="Shadow Color" value={props.shadowColor} onChange={(v) => update({ shadowColor: v })} fallback="#000000" />
        <PropGrid>
          <SliderNumberInput label="X Offset" value={props.shadowX ?? 2} onChange={(v) => update({ shadowX: v })} min={-20} max={20} unit="px" />
          <SliderNumberInput label="Y Offset" value={props.shadowY ?? 4} onChange={(v) => update({ shadowY: v })} min={-20} max={20} unit="px" />
        </PropGrid>
        <PropGrid>
          <SliderNumberInput label="Blur" value={props.shadowBlur ?? 8} onChange={(v) => update({ shadowBlur: v })} min={0} max={40} unit="px" />
          <SliderNumberInput label="Opacity" value={props.shadowOpacity ?? 60} onChange={(v) => update({ shadowOpacity: v })} min={0} max={100} unit="%" />
        </PropGrid>
      </PropToggle>
    </PropSection>
  );
}

function TransformSection({ props, update, capabilities, accentHex }) {
  const hideScale = capabilities?.transform?.hideScale;
  return (
    <PropSection title="Transform" defaultOpen={false} accent={accentHex}>
      <SliderNumberInput label="Opacity" value={props.opacity ?? 100} onChange={(v) => update({ opacity: v })} min={0} max={100} unit="%" />
      {!hideScale && (
        <SliderNumberInput label="Scale" value={props.scale ?? 100} onChange={(v) => update({ scale: v })} min={10} max={300} unit="%" />
      )}
      <SliderNumberInput label="Rotation" value={props.rotation ?? 0} onChange={(v) => update({ rotation: v })} min={-180} max={180} unit="°" />
    </PropSection>
  );
}

function PositionSection({ props, update, handleAlign, handleDistribute, isMultiSelected, selectedIds, accentHex }) {
  return (
    <PropSection title="Position & Align" defaultOpen={true} accent={accentHex}>
      <div className="prop-field">
        <label className="prop-label">Position</label>
        <div className="prop-xy-row">
          <div className="prop-xy-input">
            <span className="prop-xy-label">X</span>
            <input type="number" className="prop-number-input" value={props.x || 0} onChange={(e) => update({ x: Number(e.target.value) })} />
            <span className="prop-unit">px</span>
          </div>
          <div className="prop-xy-input">
            <span className="prop-xy-label">Y</span>
            <input type="number" className="prop-number-input" value={props.y || 0} onChange={(e) => update({ y: Number(e.target.value) })} />
            <span className="prop-unit">px</span>
          </div>
        </div>
      </div>
      <div className="prop-field">
        <label className="prop-label">{isMultiSelected ? `Align Selection (${selectedIds.length})` : "Align to Canvas"}</label>
        <div className="prop-align-grid">
          {[
            { action: "left", icon: <AlignLeft size={14} />, tip: isMultiSelected ? "Align Left Edges" : "Align Left to Canvas", align: "start" },
            { action: "center-x", icon: <AlignCenter size={14} />, tip: isMultiSelected ? "Centers Horizontally" : "Center Horizontally", align: "center" },
            { action: "right", icon: <AlignRight size={14} />, tip: isMultiSelected ? "Align Right Edges" : "Align Right to Canvas", align: "center" },
            { action: "top", icon: <AlignJustify size={14} className="rotate-90" />, tip: isMultiSelected ? "Align Top Edges" : "Align to Canvas Top", align: "center" },
            { action: "center-y", icon: <AlignHorizontalJustifyCenter size={14} />, tip: isMultiSelected ? "Centers Vertically" : "Center Vertically", align: "center" },
            { action: "bottom", icon: <AlignJustify size={14} className="-rotate-90" />, tip: isMultiSelected ? "Align Bottom Edges" : "Align to Canvas Bottom", align: "end" },
          ].map((btn) => (
            <Tooltip key={btn.action} content={btn.tip} position="top" align={btn.align} maxWidth={120} wrap>
              <button type="button" className="prop-align-btn" onClick={() => handleAlign(btn.action)}>{btn.icon}</button>
            </Tooltip>
          ))}
        </div>
      </div>
      {isMultiSelected && selectedIds.length >= 3 && (
        <div className="prop-grid-2">
          <button type="button" className="prop-action-btn" onClick={() => handleDistribute("horizontal")}>
            <AlignHorizontalSpaceAround size={12} /><span>Distribute H</span>
          </button>
          <button type="button" className="prop-action-btn" onClick={() => handleDistribute("vertical")}>
            <AlignVerticalSpaceAround size={12} /><span>Distribute V</span>
          </button>
        </div>
      )}
    </PropSection>
  );
}

// ─── Quick Actions Bar ─────────────────────────────────────────────────────

function QuickActionsBar({ elemName, onReset, onCopyStyle, onPasteStyle, hasCopiedStyle, accentHex }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  return (
    <div className="props-quick-bar">
      <span className="props-quick-title" style={accentHex ? { color: accentHex } : {}}>{elemName}</span>
      <div className="props-quick-actions">
        <Tooltip content="Reset element styles" position="bottom" align="end" maxWidth={140}>
          <button type="button" className="prop-icon-btn" onClick={onReset}><RotateCcw size={12} /></button>
        </Tooltip>
        <div style={{ position: "relative" }} ref={menuRef}>
          <Tooltip content="More actions" position="bottom" align="end" maxWidth={100}>
            <button type="button" className="prop-icon-btn" onClick={() => setShowMenu((v) => !v)}>
              <MoreHorizontal size={13} />
            </button>
          </Tooltip>
          {showMenu && (
            <div className="prop-context-menu">
              <button type="button" onClick={() => { onCopyStyle(); setShowMenu(false); }}><Copy size={11} /> Copy Style</button>
              <button
                type="button"
                onClick={() => { onPasteStyle(); setShowMenu(false); }}
                disabled={!hasCopiedStyle}
                style={{ opacity: hasCopiedStyle ? 1 : 0.4 }}
              ><Copy size={11} /> Paste Style</button>
              <div className="prop-context-divider" />
              <button type="button" onClick={() => { onReset(); setShowMenu(false); }}><RotateCcw size={11} /> Reset Position</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Layer Item ───────────────────────────────────────────────────────────

export function LayerItem({ elemDef, isSelected, isVisible, isLocked, accentHex, onSelect, onToggleVisible, onToggleLocked }) {
  const Icon = elemDef.icon;
  return (
    <div
      className={`layer-item${isSelected ? " selected" : ""}${!isVisible ? " hidden-layer" : ""}${isLocked ? " locked-layer" : ""}`}
      style={isSelected && accentHex ? {
        background: `color-mix(in srgb, ${accentHex} 12%, transparent)`,
        borderColor: `color-mix(in srgb, ${accentHex} 35%, transparent)`
      } : {}}
      onClick={onSelect}
    >
      <GripVertical size={13} className="layer-drag-handle" />
      <div
        className={`layer-icon-wrap${isSelected ? " active" : ""}`}
        style={isSelected && accentHex ? {
          background: `color-mix(in srgb, ${accentHex} 18%, transparent)`,
          borderColor: `color-mix(in srgb, ${accentHex} 40%, transparent)`,
          color: accentHex
        } : {}}
      >
        <Icon size={14} />
      </div>
      <span className="layer-name">{elemDef.name}</span>
      <div className="layer-actions">
        <Tooltip content={isVisible ? "Hide element" : "Show element"} position="left" maxWidth={110}>
          <button type="button" className={`layer-action-btn${!isVisible ? " inactive" : ""}`} onClick={(e) => { e.stopPropagation(); onToggleVisible(); }}>
            {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        </Tooltip>
        <Tooltip content={isLocked ? "Unlock element" : "Lock element"} position="left" maxWidth={110}>
          <button
            type="button"
            className={`layer-action-btn${isLocked ? " active-lock" : ""}`}
            style={isLocked && accentHex ? { color: accentHex } : {}}
            onClick={(e) => { e.stopPropagation(); onToggleLocked(); }}
          >
            {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

// ─── Main Universal Properties Panel ──────────────────────────────────────

export function UniversalPropertiesPanel({
  selectedElementId,
  selectedElementIds,
  selectedElementProps,
  updateSelectedElementProps,
  config,
  updateConfig,
  handleAlign,
  handleDistribute,
  themeAccentHex,
}) {
  const isMultiSelected = selectedElementIds.length > 1;
  const capabilities = ELEMENT_CAPABILITIES[selectedElementId] || { sections: [] };
  const { sections } = capabilities;
  const elemName = ELEMENT_CAPABILITIES[selectedElementId]?.name || selectedElementId;
  const update = updateSelectedElementProps;
  const props = selectedElementProps;

  const [copiedStyle, setCopiedStyle] = useState(null);
  const handleCopyStyle = useCallback(() => setCopiedStyle({ ...selectedElementProps }), [selectedElementProps]);
  const handlePasteStyle = useCallback(() => { if (copiedStyle) update(copiedStyle); }, [copiedStyle, update]);
  const handleReset = useCallback(() => {
    if (!selectedElementId) return;
    updateConfig((prev) => {
      const styles = { ...(prev?.elementStyles || {}) };
      delete styles[selectedElementId];
      return { ...prev, elementStyles: styles };
    });
  }, [selectedElementId, updateConfig]);

  if (!selectedElementId) return null;

  return (
    <div className="universal-properties-panel" style={{ "--accent": themeAccentHex }}>
      <QuickActionsBar
        elemName={elemName}
        onReset={handleReset}
        onCopyStyle={handleCopyStyle}
        onPasteStyle={handlePasteStyle}
        hasCopiedStyle={Boolean(copiedStyle)}
        accentHex={themeAccentHex}
      />

      {sections.includes("sprite") && <SpriteSection config={config} updateConfig={updateConfig} accentHex={themeAccentHex} />}
      {sections.includes("gameTags") && <GameTagsSection config={config} updateConfig={updateConfig} accentHex={themeAccentHex} />}
      {sections.includes("modifierIcons") && <ModifierIconsSection props={props} update={update} accentHex={themeAccentHex} />}
      {sections.includes("typography") && <TypographySection props={props} update={update} capabilities={capabilities} accentHex={themeAccentHex} />}
      {sections.includes("counterLabel") && <CounterLabelSection props={props} update={update} accentHex={themeAccentHex} />}
      {sections.includes("dividerStyle") && <DividerSection props={props} update={update} accentHex={themeAccentHex} />}
      {sections.includes("background") && <BackgroundSection props={props} update={update} capabilities={capabilities} accentHex={themeAccentHex} />}
      {sections.includes("effects") && <EffectsSection props={props} update={update} accentHex={themeAccentHex} />}
      {sections.includes("transform") && <TransformSection props={props} update={update} capabilities={capabilities} accentHex={themeAccentHex} />}
      <PositionSection
        props={props}
        update={update}
        handleAlign={handleAlign}
        handleDistribute={handleDistribute}
        isMultiSelected={isMultiSelected}
        selectedIds={selectedElementIds}
        accentHex={themeAccentHex}
      />
    </div>
  );
}

export default UniversalPropertiesPanel;
