import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Tv,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Maximize2,
  ChevronDown,
  CheckCircle2,
  Flag,
  Clock,
  Activity,
  Tag,
  Gamepad2,
  Package,
  Hash,
  Type,
  ExternalLink,
  Undo2,
  Redo2,
  Magnet,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignHorizontalJustifyCenter,
  AlignVerticalSpaceAround,
  AlignHorizontalSpaceAround,
  Keyboard,
  MousePointer,
  Wand2,
  Minus,
  Bookmark,
  Trash2,
  Crown
} from "lucide-react";
import { ConfirmModal, Modal } from "../components/Shared/Modal";
import { Button } from "../components/Shared/Button";
import { Tooltip } from "../components/Shared/Tooltip";
import SelectField from "../components/Shared/FormField/SelectField";
import TextField from "../components/Shared/FormField/TextField";
import { useMessage } from "../components/Shared/MessageContext";
import { useTheme } from "../components/Shared/ThemeContext";
import { useUser } from "../components/Shared/UserContext";
import { useEntitlements } from "../hooks/useEntitlements";
import HuntOverlayRenderer from "../components/StreamerTools/HuntOverlayRenderer";
import {
  UniversalPropertiesPanel,
  LayerItem,
  PropSection,
  SliderNumberInput,
  ColorInput,
  PropToggle,
  PropGrid,
  PropCheckbox,
  FONT_FAMILY_OPTIONS
} from "../components/StreamerTools/OverlayPropertiesSystem";
import { streamerOverlayAPI, huntAPI } from "../utils/api";
import {
  DEFAULT_SNAP_SETTINGS,
  snap as snapElements,
  buildGuides,
  toSnapRect,
  alignElements,
  distributeElements,
  calculateAltMeasurements
} from "../utils/overlaySnapping";
import "../css/StreamerOverlay.css";

// Sample Datasets for preview
const SAMPLE_HUNTS = [
  {
    id: "sample-crabominable",
    pokemon: { id: 740, name: "Crabominable" },
    pokemonName: "Crabominable",
    game: "Scarlet",
    method: "Sandwich",
    checks: 428,
    odds: 683,
    modifiers: { shinyCharm: true, sparklingLv3: true },
    startedAt: Date.now() - 1000 * 60 * 38,
    totalPausedMs: 0,
    status: "running",
    phases: [],
    fails: []
  },
  {
    id: "sample-rayquaza",
    pokemon: { id: 384, name: "Rayquaza" },
    pokemonName: "Rayquaza",
    game: "Emerald",
    method: "Soft Resets",
    checks: 2194,
    odds: 8192,
    modifiers: {},
    startedAt: Date.now() - 1000 * 60 * 60 * 18.5,
    totalPausedMs: 1000 * 60 * 30,
    status: "running",
    phases: [],
    fails: [
      { id: "f1", checks: 1420, reason: "Struggled to death", outcome: "failed" }
    ]
  },
  {
    id: "sample-mew",
    pokemon: { id: 151, name: "Mew" },
    pokemonName: "Mew",
    game: "Emerald",
    method: "Soft Resets",
    checks: 6842,
    odds: 8192,
    modifiers: {},
    startedAt: Date.now() - 1000 * 60 * 60 * 54.2,
    totalPausedMs: 1000 * 60 * 120,
    status: "running",
    phases: [],
    fails: []
  },
  {
    id: "sample-charizard",
    pokemon: { id: 6, name: "Charizard" },
    pokemonName: "Charizard",
    game: "Let's Go, Eevee!",
    method: "Catch Combo",
    checks: 185,
    odds: 273,
    modifiers: { shinyCharm: true, lureActive: true, catchCombo: 31 },
    startedAt: Date.now() - 1000 * 60 * 74,
    totalPausedMs: 0,
    status: "running",
    phases: [],
    fails: []
  }
];

// Built-in Template Presets
const BUILTIN_PRESETS = [
  {
    id: "classic-horizontal",
    name: "Classic Horizontal",
    isBuiltin: true,
    config: {
      layout: { width: 665, height: 220, padding: 16, borderRadius: 16, style: "horizontal" },
      styleSettings: { border: true, borderWidth: 2, glow: true, backgroundMode: "solid", backgroundColor: "#181818", backgroundOpacity: 95, watermarkOpacity: 3 },
      typographySettings: { font: "outfit", size: "md", weight: "700", italic: false, uppercase: false },
      animationSettings: { enableAnimations: true, counterIncrement: "pop", phaseAlert: true, failAlert: true, shinyCelebration: true },
      pokemonSettings: { showSprite: true, showName: true, showGame: true, showMethod: true, showForm: true, showModifiers: true },
      counterSettings: { showEncounters: true, showPhase: true, showOdds: true, showAverageTime: true, showDivider: true },
      timerSettings: { showTimer: true, style: "clean" },
      eventSettings: { pauseText: "PAUSED", phaseAlertTitle: "Shiny Phase Found!", failAlertTitle: "Shiny Failed", celebrationTitle: "TARGET SHINY CAUGHT!", celebrationSubtitle: "Hunt Completed!" },
      idleBehavior: "hide",
      pausedBehavior: "visible-indicator",
      elementStyles: {}
    }
  },
  {
    id: "compact-vertical",
    name: "Compact Vertical",
    isBuiltin: true,
    config: {
      layout: { width: 340, height: 480, padding: 16, borderRadius: 20, style: "vertical" },
      styleSettings: { border: true, borderWidth: 2, glow: true, backgroundMode: "solid", backgroundColor: "#181818", backgroundOpacity: 95, watermarkOpacity: 3 },
      typographySettings: { font: "outfit", size: "md", weight: "700", italic: false, uppercase: false },
      animationSettings: { enableAnimations: true, counterIncrement: "pulse", phaseAlert: true, failAlert: true, shinyCelebration: true },
      pokemonSettings: { showSprite: true, showName: true, showGame: true, showMethod: true, showForm: true, showModifiers: true },
      counterSettings: { showEncounters: true, showPhase: true, showOdds: true, showAverageTime: true, showDivider: true },
      timerSettings: { showTimer: true, style: "badge" },
      eventSettings: { pauseText: "PAUSED", phaseAlertTitle: "Shiny Phase Found!", failAlertTitle: "Shiny Failed", celebrationTitle: "TARGET SHINY CAUGHT!", celebrationSubtitle: "Hunt Completed!" },
      idleBehavior: "hide",
      pausedBehavior: "visible-indicator",
      elementStyles: {}
    }
  },
  {
    id: "minimal-banner",
    name: "Minimal Banner",
    isBuiltin: true,
    config: {
      layout: { width: 580, height: 160, padding: 12, borderRadius: 12, style: "horizontal" },
      styleSettings: { border: true, borderWidth: 1, glow: false, backgroundMode: "solid", backgroundColor: "#181818", backgroundOpacity: 95, watermarkOpacity: 2 },
      typographySettings: { font: "inter", size: "sm", weight: "600", italic: false, uppercase: false },
      animationSettings: { enableAnimations: true, counterIncrement: "pop", phaseAlert: true, failAlert: true, shinyCelebration: true },
      pokemonSettings: { showSprite: true, showName: true, showGame: true, showMethod: true, showForm: false, showModifiers: true },
      counterSettings: { showEncounters: true, showPhase: false, showOdds: true, showAverageTime: false, showDivider: true },
      timerSettings: { showTimer: true, style: "clean" },
      eventSettings: { pauseText: "PAUSED", phaseAlertTitle: "Shiny Phase Found!", failAlertTitle: "Shiny Failed", celebrationTitle: "TARGET SHINY CAUGHT!", celebrationSubtitle: "Hunt Completed!" },
      idleBehavior: "hide",
      pausedBehavior: "visible-indicator",
      elementStyles: {}
    }
  },
  {
    id: "clean-box",
    name: "Clean Box",
    isBuiltin: true,
    config: {
      layout: { width: 520, height: 260, padding: 16, borderRadius: 18, style: "horizontal" },
      styleSettings: { border: true, borderWidth: 2, glow: true, backgroundMode: "solid", backgroundColor: "#181818", backgroundOpacity: 95, watermarkOpacity: 3 },
      typographySettings: { font: "outfit", size: "md", weight: "700", italic: false, uppercase: false },
      animationSettings: { enableAnimations: true, counterIncrement: "pop", phaseAlert: true, failAlert: true, shinyCelebration: true },
      pokemonSettings: { showSprite: true, showName: true, showGame: true, showMethod: true, showForm: true, showModifiers: true },
      counterSettings: { showEncounters: true, showPhase: true, showOdds: true, showAverageTime: false, showDivider: true },
      timerSettings: { showTimer: true, style: "clean" },
      eventSettings: { pauseText: "PAUSED", phaseAlertTitle: "Shiny Phase Found!", failAlertTitle: "Shiny Failed", celebrationTitle: "TARGET SHINY CAUGHT!", celebrationSubtitle: "Hunt Completed!" },
      idleBehavior: "hide",
      pausedBehavior: "visible-indicator",
      elementStyles: {}
    }
  }
];

// Template Presets
const ACCENT_COLOR_MAP = {
  yellow: "#facc15",
  red: "#ef4444",
  orange: "#f97316",
  green: "#22c55e",
  lime: "#84cc16",
  blue: "#3b82f6",
  cyan: "#06b6d4",
  purple: "#a855f7",
  lavender: "#c084fc",
  pink: "#ec4899",
  brown: "#5c3810",
  platinum: "#cbd5e1",
};

// Overlay Elements definition for the Left Sidebar
const OVERLAY_ELEMENT_DEFS = [
  { id: "pokemon-sprite", name: "Pokémon Sprite", icon: Sparkles, configGroup: "pokemonSettings", configKey: "showSprite" },
  { id: "pokemon-name", name: "Pokémon Name", icon: Type, configGroup: "pokemonSettings", configKey: "showName" },
  { id: "game-tags", name: "Game / Method", icon: Gamepad2, configGroup: "pokemonSettings", configKey: "showGame", multiKeys: ["showGame", "showMethod", "showForm"] },
  { id: "held-items", name: "Modifiers", icon: Package, configGroup: "pokemonSettings", configKey: "showModifiers" },
  { id: "counter", name: "Counter", icon: Hash, configGroup: "counterSettings", configKey: "showEncounters" },
  { id: "divider", name: "Divider", icon: Minus, configGroup: "counterSettings", configKey: "showDivider" },
  { id: "phase", name: "Phase", icon: Flag, configGroup: "counterSettings", configKey: "showPhase" },
  { id: "timer", name: "Timer", icon: Clock, configGroup: "timerSettings", configKey: "showTimer" },
  { id: "pace", name: "Checks / Sec", icon: Activity, configGroup: "counterSettings", configKey: "showAverageTime" },
  { id: "odds", name: "Odds", icon: Tag, configGroup: "counterSettings", configKey: "showOdds" }
];

function UniversalOverlaySettings({ config, updateConfig, themeAccentHex, isMember = false }) {
  const layout = config?.layout || {};
  const styleSettings = config?.styleSettings || {};
  const typographySettings = config?.typographySettings || {};

  const updateLayout = (partial) => {
    updateConfig((prev) => ({
      ...prev,
      layout: { ...(prev?.layout || {}), ...partial },
      layoutSettings: { ...(prev?.layoutSettings || {}), ...partial },
    }));
  };

  const updateStyle = (partial) => {
    updateConfig((prev) => ({
      ...prev,
      styleSettings: { ...(prev?.styleSettings || {}), ...partial },
    }));
  };

  const updateTypography = (partial) => {
    updateConfig((prev) => ({
      ...prev,
      typographySettings: { ...(prev?.typographySettings || {}), ...partial },
    }));
  };

  return (
    <div className="element-properties-panel universal-overlay-settings-panel">
      {/* ── Section 1: Dimensions & Frame ── */}
      <PropSection title="Dimensions & Frame" defaultOpen={true} accent={themeAccentHex}>
        <div className="prop-field mb-2">
          <SelectField
            label="Layout Orientation"
            size="sm"
            value={layout.style === "vertical" ? "vertical" : "horizontal"}
            onChange={(val) => {
              if (val === "vertical") {
                const newW = Math.max(220, Math.min(layout.width || 340, layout.height || 480));
                const newH = Math.max(320, Math.max(layout.width || 340, layout.height || 480));
                updateLayout({ style: "vertical", width: newW, height: newH });
              } else {
                const newW = Math.max(520, Math.max(layout.width || 665, layout.height || 220));
                const newH = Math.max(140, Math.min(layout.width || 665, layout.height || 220));
                updateLayout({ style: "horizontal", width: newW, height: newH });
              }
            }}
            options={[
              { value: "horizontal", label: "Horizontal (Standard Banner)" },
              { value: "vertical", label: "Vertical (Sidebar / Tall)" },
            ]}
          />
        </div>

        <PropGrid>
          <SliderNumberInput
            label="Width"
            value={layout.width || (layout.style === "vertical" ? 340 : 665)}
            onChange={(v) => updateLayout({ width: v })}
            min={layout.style === "vertical" ? 220 : 520}
            max={1400}
            step={10}
            unit="px"
          />
          <SliderNumberInput
            label="Height"
            value={layout.height || (layout.style === "vertical" ? 480 : 220)}
            onChange={(v) => updateLayout({ height: v })}
            min={layout.style === "vertical" ? 320 : 140}
            max={1000}
            step={10}
            unit="px"
          />
        </PropGrid>
        <SliderNumberInput
          label="Border Radius"
          value={layout.borderRadius ?? 16}
          onChange={(v) => updateLayout({ borderRadius: v })}
          min={0}
          max={48}
          unit="px"
        />
        <SliderNumberInput
          label="Card Padding"
          value={layout.padding ?? 16}
          onChange={(v) => updateLayout({ padding: v })}
          min={0}
          max={40}
          step={2}
          unit="px"
        />
      </PropSection>

      {/* ── Section 2: Background & Fill ── */}
      <PropSection title="Background & Fill" defaultOpen={false} accent={themeAccentHex}>
        <div className="prop-field">
          <SelectField
            label="Background Mode"
            size="sm"
            value={styleSettings.backgroundMode === "solid" ? "solid" : "transparent"}
            onChange={(val) => {
              if (val === "solid") {
                updateStyle({ backgroundMode: "solid", backgroundOpacity: styleSettings.backgroundOpacity ?? 100 });
              } else {
                updateStyle({ backgroundMode: "transparent" });
              }
            }}
            options={[
              { value: "transparent", label: "Transparent (Clean OBS)" },
              { value: "solid", label: "Solid Color" },
            ]}
          />
        </div>
        {styleSettings.backgroundMode === "solid" && (
          <>
            <ColorInput
              label="Card Background Color"
              value={styleSettings.backgroundColor || "#181818"}
              onChange={(v) => updateStyle({ backgroundColor: v })}
              fallback="#181818"
            />
            <SliderNumberInput
              label="Background Opacity"
              value={styleSettings.backgroundOpacity ?? 100}
              onChange={(v) => updateStyle({ backgroundOpacity: v })}
              min={0}
              max={100}
              unit="%"
            />
          </>
        )}

        {/* Watermark Branding Setting (Membership Only) */}
        <div className="prop-field mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-200">Show Watermark</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--accent,#ffe76a)]/20 text-[var(--accent,#ffe76a)] border border-[var(--accent,#ffe76a)]/30 shrink-0">
                <Crown size={10} />
                MEMBER
              </span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {!isMember && (
                <Link
                  to="/membership"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent,#ffe76a)] hover:underline no-underline whitespace-nowrap"
                >
                  Unlock
                  <ExternalLink size={10} />
                </Link>
              )}
              <label
                className={`overlay-toggle-switch ${!isMember ? "opacity-50 cursor-not-allowed" : ""}`}
                title={!isMember ? "Membership required to remove watermark" : undefined}
              >
                <input
                  type="checkbox"
                  checked={styleSettings.showWatermark !== false}
                  disabled={!isMember}
                  onChange={(e) => {
                    if (!isMember) return;
                    updateStyle({ showWatermark: e.target.checked });
                  }}
                />
                <span className="overlay-toggle-slider" />
              </label>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-1.5 leading-snug w-full">
            {isMember
              ? "Toggle the background branding on your stream overlay."
              : "Remove the background watermark with a Membership."}
          </p>
        </div>
      </PropSection>

      {/* ── Section 3: Border ── */}
      <PropSection title="Border" defaultOpen={false} accent={themeAccentHex}>
        <PropToggle
          label="Border"
          checked={styleSettings.border !== false && styleSettings.borderStyle !== "none"}
          onChange={(checked) => {
            updateStyle({
              border: checked,
              borderStyle: checked ? (styleSettings.borderStyle === "none" ? "subtle" : (styleSettings.borderStyle || "subtle")) : "none",
            });
          }}
        >
          <div className="prop-field">
            <PropCheckbox
              label="Use Site Theme Accent"
              checked={Boolean(styleSettings.borderUseAccent || styleSettings.borderStyle === "accent")}
              onChange={(checked) => {
                updateStyle({
                  borderUseAccent: checked,
                  borderStyle: checked ? "accent" : "custom",
                });
              }}
              accentHex={themeAccentHex}
            />
          </div>
          {!(styleSettings.borderUseAccent || styleSettings.borderStyle === "accent") && (
            <ColorInput
              label="Border Color"
              value={styleSettings.borderColor || "rgba(255, 255, 255, 0.2)"}
              onChange={(v) => updateStyle({ borderColor: v, borderStyle: "custom" })}
              fallback="rgba(255, 255, 255, 0.2)"
            />
          )}
          <SliderNumberInput
            label="Thickness"
            value={styleSettings.borderWidth || 1}
            onChange={(v) => updateStyle({ borderWidth: v })}
            min={1}
            max={32}
            unit="px"
          />
        </PropToggle>
      </PropSection>

      {/* ── Section 4: Visual Enhancements & Effects ── */}
      <PropSection title="Visual Enhancements" defaultOpen={false} accent={themeAccentHex}>
        {/* Drop Shadow Expander */}
        <PropToggle
          label="Drop Shadow"
          checked={styleSettings.shadow !== false}
          onChange={(v) => updateStyle({ shadow: v })}
        >
          <ColorInput
            label="Shadow Color"
            value={styleSettings.shadowColor || "#000000"}
            onChange={(v) => updateStyle({ shadowColor: v })}
            fallback="#000000"
          />
          <PropGrid>
            <SliderNumberInput
              label="Shadow Blur"
              value={styleSettings.shadowBlur ?? 25}
              onChange={(v) => updateStyle({ shadowBlur: v })}
              min={0}
              max={60}
              unit="px"
            />
            <SliderNumberInput
              label="Distance"
              value={styleSettings.shadowDistance ?? 10}
              onChange={(v) => updateStyle({ shadowDistance: v })}
              min={0}
              max={40}
              unit="px"
            />
          </PropGrid>
          <SliderNumberInput
            label="Shadow Opacity"
            value={styleSettings.shadowOpacity ?? 60}
            onChange={(v) => updateStyle({ shadowOpacity: v })}
            min={5}
            max={100}
            unit="%"
          />
        </PropToggle>

        {/* Outer Glow Expander */}
        <PropToggle
          label="Outer Glow"
          checked={Boolean(styleSettings.glow)}
          onChange={(v) => updateStyle({ glow: v })}
        >
          <div className="prop-field">
            <SelectField
              label="Glow Color Mode"
              size="sm"
              value={styleSettings.glowColorMode || "accent"}
              onChange={(val) => updateStyle({ glowColorMode: val })}
              options={[
                { value: "accent", label: "Theme Accent Color" },
                { value: "custom", label: "Custom Glow Color" },
              ]}
            />
          </div>
          {styleSettings.glowColorMode === "custom" && (
            <ColorInput
              label="Glow Color"
              value={styleSettings.glowColor || "#facc15"}
              onChange={(v) => updateStyle({ glowColor: v })}
              fallback="#facc15"
            />
          )}
          <PropGrid>
            <SliderNumberInput
              label="Glow Radius"
              value={styleSettings.glowRadius ?? 14}
              onChange={(v) => updateStyle({ glowRadius: v })}
              min={2}
              max={40}
              unit="px"
            />
            <SliderNumberInput
              label="Glow Opacity"
              value={styleSettings.glowOpacity ?? 50}
              onChange={(v) => updateStyle({ glowOpacity: v })}
              min={10}
              max={100}
              unit="%"
            />
          </PropGrid>
        </PropToggle>

        {/* Global Card Opacity */}
        <SliderNumberInput
          label="Overall Overlay Opacity"
          value={styleSettings.opacity ?? 100}
          onChange={(v) => updateStyle({ opacity: v })}
          min={10}
          max={100}
          unit="%"
        />
      </PropSection>

      {/* ── Section 5: Global Theme & Typography ── */}
      <PropSection title="Global Theme & Font" defaultOpen={false} accent={themeAccentHex}>
        <div className="prop-field">
          <SelectField
            label="Accent Color Mode"
            size="sm"
            value={styleSettings.accentColorMode || "site"}
            onChange={(val) => updateStyle({ accentColorMode: val })}
            options={[
              { value: "site", label: "Use Active Site Accent" },
              { value: "custom", label: "Custom Accent Color" },
            ]}
          />
        </div>
        {styleSettings.accentColorMode === "custom" && (
          <ColorInput
            label="Custom Accent Color"
            value={styleSettings.customAccentColor || "#ffe76a"}
            onChange={(v) => updateStyle({ customAccentColor: v })}
            fallback="#ffe76a"
          />
        )}
        <div className="prop-field">
          <SelectField
            label="Global Font Family"
            size="sm"
            value={typographySettings.font || "system"}
            onChange={(val) => updateTypography({ font: val })}
            options={FONT_FAMILY_OPTIONS}
          />
        </div>
        <div className="prop-field">
          <label className="prop-label">Global Text Styling</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <PropCheckbox
              label="Italic"
              checked={Boolean(typographySettings.italic)}
              onChange={(v) => updateTypography({ italic: v })}
              accentHex={themeAccentHex}
            />
            <PropCheckbox
              label="ALL CAPS"
              checked={typographySettings.textTransform === "uppercase"}
              onChange={(v) => updateTypography({ textTransform: v ? "uppercase" : "none" })}
              accentHex={themeAccentHex}
            />
          </div>
        </div>
      </PropSection>
    </div>
  );
}

function UniversalAnimationSettings({ config, updateConfig, themeAccentHex }) {
  const animationSettings = config?.animationSettings || {};

  const updateAnim = (partial) => {
    updateConfig((prev) => ({
      ...prev,
      animationSettings: { ...(prev?.animationSettings || {}), ...partial },
    }));
  };

  return (
    <div className="element-properties-panel universal-animation-settings-panel">
      {/* Master Switch */}
      <PropSection title="Master Controls" defaultOpen={true} accent={themeAccentHex}>
        <div className="prop-field">
          <PropCheckbox
            label="Enable All Animations"
            checked={animationSettings.enableAnimations !== false}
            onChange={(v) => updateAnim({ enableAnimations: v })}
            accentHex={themeAccentHex}
          />
        </div>
      </PropSection>

      {/* Counter Increment */}
      <PropSection title="Counter Increment" defaultOpen={true} accent={themeAccentHex}>
        <div className="prop-field">
          <SelectField
            label="Counter Number Animation"
            size="sm"
            value={animationSettings.counterIncrement || "pop"}
            onChange={(val) => updateAnim({ counterIncrement: val })}
            options={[
              { value: "pop", label: "Pop (Scale & Bounce)" },
              { value: "pulse", label: "Pulse (Glow Wave)" },
              { value: "none", label: "Instant (No Animation)" },
            ]}
          />
        </div>
      </PropSection>

      {/* Realtime Event Alerts */}
      <PropSection title="Event & Alert Animations" defaultOpen={true} accent={themeAccentHex}>
        <div className="prop-field">
          <PropCheckbox
            label="Shiny Phase Alert Popup"
            checked={animationSettings.phaseAlert !== false}
            onChange={(v) => updateAnim({ phaseAlert: v })}
            accentHex={themeAccentHex}
          />
        </div>
        <div className="prop-field">
          <PropCheckbox
            label="Shiny Fail Alert Popup"
            checked={animationSettings.failAlert !== false}
            onChange={(v) => updateAnim({ failAlert: v })}
            accentHex={themeAccentHex}
          />
        </div>
        <div className="prop-field">
          <PropCheckbox
            label="Target Shiny Celebration"
            checked={animationSettings.shinyCelebration !== false}
            onChange={(v) => updateAnim({ shinyCelebration: v })}
            accentHex={themeAccentHex}
          />
        </div>
      </PropSection>

      {/* Transitions & Timing */}
      <PropSection title="Transitions & Speed" defaultOpen={true} accent={themeAccentHex}>
        <div className="prop-field">
          <SelectField
            label="Hunt Switch Transition"
            size="sm"
            value={animationSettings.huntSwitch || "fade"}
            onChange={(val) => updateAnim({ huntSwitch: val })}
            options={[
              { value: "fade", label: "Fade Smooth" },
              { value: "slide", label: "Slide Horizontal" },
              { value: "scale", label: "Scale In" },
              { value: "none", label: "Instant Cut" },
            ]}
          />
        </div>
        <div className="prop-field">
          <SelectField
            label="Animation Speed"
            size="sm"
            value={animationSettings.animationSpeed || "normal"}
            onChange={(val) => updateAnim({ animationSpeed: val })}
            options={[
              { value: "fast", label: "Fast & Snappy" },
              { value: "normal", label: "Normal (Balanced)" },
              { value: "slow", label: "Slow & Cinematic" },
            ]}
          />
        </div>
      </PropSection>
    </div>
  );
}

function UniversalEventSettings({ config, updateConfig, themeAccentHex }) {
  const pausedBehavior = config?.pausedBehavior || "visible-indicator";
  const idleBehavior = config?.idleBehavior || "hide";
  const counterSettings = config?.counterSettings || {};
  const animationSettings = config?.animationSettings || {};
  const eventSettings = config?.eventSettings || {};

  const updateCounter = (partial) => {
    updateConfig((prev) => ({
      ...prev,
      counterSettings: { ...(prev?.counterSettings || {}), ...partial },
    }));
  };

  const updateAnim = (partial) => {
    updateConfig((prev) => ({
      ...prev,
      animationSettings: { ...(prev?.animationSettings || {}), ...partial },
    }));
  };

  const updateEvents = (partial) => {
    updateConfig((prev) => ({
      ...prev,
      eventSettings: { ...(prev?.eventSettings || {}), ...partial },
    }));
  };

  return (
    <div className="element-properties-panel universal-event-settings-panel">
      {/* Pause Hunt Settings */}
      <PropSection title="Pause Behavior" defaultOpen={false} accent={themeAccentHex}>
        <div className="prop-field">
          <SelectField
            label="When Hunt is Paused"
            size="sm"
            value={pausedBehavior}
            onChange={(val) => updateConfig({ pausedBehavior: val })}
            options={[
              { value: "visible-indicator", label: 'Show "PAUSED" Overlay Indicator' },
              { value: "visible-no-indicator", label: "Keep Visible (No Indicator)" },
              { value: "hide", label: "Hide Overlay on Stream" },
            ]}
          />
        </div>
        <div className="prop-field">
          <TextField
            label="Custom Pause Text"
            size="sm"
            value={eventSettings.pauseText ?? "PAUSED"}
            onChange={(e) => updateEvents({ pauseText: e.target.value })}
            placeholder="PAUSED"
          />
        </div>
      </PropSection>

      {/* Idle / No Active Hunt */}
      <PropSection title="Idle / Standby Behavior" defaultOpen={false} accent={themeAccentHex}>
        <div className="prop-field">
          <SelectField
            label="When No Active Hunt is Selected"
            size="sm"
            value={idleBehavior}
            onChange={(val) => updateConfig({ idleBehavior: val })}
            options={[
              { value: "hide", label: "Hide Overlay Completely" },
              { value: "show-idle", label: "Show Idle Standby Card" },
            ]}
          />
        </div>
      </PropSection>

      {/* Shiny Phase Settings */}
      <PropSection title="Phase Events" defaultOpen={false} accent={themeAccentHex}>
        <div className="prop-field">
          <PropCheckbox
            label="Enable Phase Counter on Overlay"
            checked={counterSettings.showPhase !== false}
            onChange={(v) => updateCounter({ showPhase: v })}
            accentHex={themeAccentHex}
          />
        </div>
        <div className="prop-field">
          <PropCheckbox
            label="Show Phase Found Popup Alert"
            checked={animationSettings.phaseAlert !== false}
            onChange={(v) => updateAnim({ phaseAlert: v })}
            accentHex={themeAccentHex}
          />
        </div>
        <div className="prop-field">
          <TextField
            label="Phase Alert Title"
            size="sm"
            value={eventSettings.phaseAlertTitle ?? "Shiny Phase Found!"}
            onChange={(e) => updateEvents({ phaseAlertTitle: e.target.value })}
            placeholder="Shiny Phase Found!"
          />
        </div>
      </PropSection>

      {/* Shiny Fail Settings */}
      <PropSection title="Fail Events" defaultOpen={false} accent={themeAccentHex}>
        <div className="prop-field">
          <PropCheckbox
            label="Show Shiny Fail Popup Alert"
            checked={animationSettings.failAlert !== false}
            onChange={(v) => updateAnim({ failAlert: v })}
            accentHex={themeAccentHex}
          />
        </div>
        <div className="prop-field">
          <TextField
            label="Fail Alert Title"
            size="sm"
            value={eventSettings.failAlertTitle ?? "Shiny Failed"}
            onChange={(e) => updateEvents({ failAlertTitle: e.target.value })}
            placeholder="Shiny Failed"
          />
        </div>
      </PropSection>

      {/* Target Shiny Caught Celebration */}
      <PropSection title="Target Found Celebration" defaultOpen={false} accent={themeAccentHex}>
        <div className="prop-field">
          <PropCheckbox
            label="Enable Celebration Popup"
            checked={animationSettings.shinyCelebration !== false}
            onChange={(v) => updateAnim({ shinyCelebration: v })}
            accentHex={themeAccentHex}
          />
        </div>
        <div className="prop-field">
          <TextField
            label="Celebration Title"
            size="sm"
            value={eventSettings.celebrationTitle ?? "TARGET SHINY CAUGHT!"}
            onChange={(e) => updateEvents({ celebrationTitle: e.target.value })}
            placeholder="TARGET SHINY CAUGHT!"
          />
        </div>
        <div className="prop-field">
          <TextField
            label="Celebration Subtitle"
            size="sm"
            value={eventSettings.celebrationSubtitle ?? "Hunt Completed!"}
            onChange={(e) => updateEvents({ celebrationSubtitle: e.target.value })}
            placeholder="Hunt Completed!"
          />
        </div>
      </PropSection>
    </div>
  );
}

export default function OverlayEditor() {
  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const { accent } = useTheme();
  const { user } = useUser();
  const isMember = Boolean(isPremium || user?.isPremium);
  const themeAccentHex = ACCENT_COLOR_MAP[accent] || accent || "#facc15";

  // Overlay state from backend
  const [config, setConfig] = useState(null);
  const [overlayToken, setOverlayToken] = useState("");
  const [saveStatus, setSaveStatus] = useState("saved"); // "saved" | "saving"
  const [activeCurrentHunt, setActiveCurrentHunt] = useState(null);
  const [_activeHuntsList, setActiveHuntsList] = useState([]);

  // Studio UI & Multi-selection state
  const [activeSidebarTab, setActiveSidebarTab] = useState("elements"); // "elements" | "background"
  const [selectedElementIds, setSelectedElementIds] = useState(["counter"]);
  const selectedElementId = selectedElementIds[0] || null;
  const isMultiSelected = selectedElementIds.length > 1;

  // Locked elements (prevents drag / selection changes)
  const [lockedElementIds, setLockedElementIds] = useState([]);
  const toggleElementLocked = useCallback((elemId) => {
    setLockedElementIds((prev) =>
      prev.includes(elemId) ? prev.filter((id) => id !== elemId) : [...prev, elemId]
    );
  }, []);

  const [showGrid, setShowGrid] = useState(true);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.0); // 100%

  // Snapping settings (persisted in localStorage)
  const [snapSettings, setSnapSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("hunt_overlay_snap_settings");
      return saved ? { ...DEFAULT_SNAP_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SNAP_SETTINGS;
    } catch {
      return DEFAULT_SNAP_SETTINGS;
    }
  });
  const [showSnapPopover, setShowSnapPopover] = useState(false);

  const updateSnapSettings = useCallback((partial) => {
    setSnapSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem("hunt_overlay_snap_settings", JSON.stringify(next));
      } catch {
        /* ignore localStorage quota/disabled errors */
      }
      return next;
    });
  }, []);

  // Selected hunt dataset
  const [selectedHuntOption, setSelectedHuntOption] = useState("current");

  // Preview interactive overrides
  const [previewChecksDelta, setPreviewChecksDelta] = useState(0);
  const [previewIsPaused, setPreviewPaused] = useState(false);
  const [previewNoHunt, setPreviewNoHunt] = useState(false);
  const [triggerAnim, setTriggerAnim] = useState(null);

  // Modals & UI helpers
  const [showResetModal, setShowResetModal] = useState(false);
  const [showOBSGuide, setShowOBSGuide] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Custom Presets System
  const [savedPresets, setSavedPresets] = useState(() => {
    try {
      const saved = localStorage.getItem("hunt_overlay_custom_presets");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedPresetId, setSelectedPresetId] = useState(() => {
    try {
      return localStorage.getItem("hunt_overlay_active_preset_id") || "classic-horizontal";
    } catch {
      return "classic-horizontal";
    }
  });
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [showDeletePresetModal, setShowDeletePresetModal] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState("");

  const isCustomPresetSelected = Boolean(savedPresets.some((p) => p.id === selectedPresetId));

  const overlayWidth = config?.layout?.width || 665;
  const overlayHeight = config?.layout?.height || 220;

  // Compute OBS-recommended canvas size with accurate per-direction padding.
  // Glow and shadow are independent box-shadows — take the max reach per side, not additive.
  const obsCanvasDimensions = useMemo(() => {
    const style = config?.styleSettings || {};
    const hasGlow = Boolean(style.glow);
    const hasShadow = style.shadow !== false;
    const SAFETY = 8; // px safety buffer beyond the visible effect edge

    // Glow: box-shadow `0 0 gRadius gSpread` — extends equally all sides
    const glowExtent = hasGlow ? (style.glowRadius ?? 14) + (style.glowSpread ?? 2) : 0;

    // Shadow: box-shadow `0 sDist sBlur` — directional
    const sDist = hasShadow ? (style.shadowDistance ?? 10) : 0;
    const sBlur = hasShadow ? (style.shadowBlur ?? 25) : 0;
    const shadowTop    = hasShadow ? Math.max(0, sBlur - sDist) : 0;
    const shadowBottom = hasShadow ? sDist + sBlur : 0;
    const shadowSides  = hasShadow ? sBlur : 0;

    // Final per-side padding = max reach of either effect + safety
    const hasPad = hasGlow || hasShadow;
    const padLeft   = hasPad ? Math.ceil(Math.max(glowExtent, shadowSides)) + SAFETY : 0;
    const padRight  = hasPad ? Math.ceil(Math.max(glowExtent, shadowSides)) + SAFETY : 0;
    const padTop    = hasPad ? Math.ceil(Math.max(glowExtent, shadowTop))   + SAFETY : 0;
    const padBottom = hasPad ? Math.ceil(Math.max(glowExtent, shadowBottom)) + SAFETY : 0;

    const roundUp10 = (n) => Math.ceil(n / 10) * 10;
    return {
      width:  roundUp10(overlayWidth  + padLeft + padRight),
      height: roundUp10(overlayHeight + padTop  + padBottom),
      padLeft,
      padRight,
      padTop,
      padBottom,
      hasPadding: hasPad,
    };
  }, [overlayWidth, overlayHeight, config?.styleSettings]);

  // Dragging interaction state
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragTargetRef = useRef(null);
  const dragStartPosRef = useRef({ mouseX: 0, mouseY: 0, elements: {}, groupRect: null });
  const dragOtherElementsRef = useRef([]);
  const [smartGuides, setSmartGuides] = useState([]);
  const [altMeasurements, setAltMeasurements] = useState([]);
  const [_isCtrlHeld, setIsCtrlHeld] = useState(false);
  const [isAltHeld, setIsAltHeld] = useState(false);
  const isCtrlHeldRef = useRef(false);
  const isAltHeldRef = useRef(false);
  // Offset (in canvas px) of .hunt-overlay-card within .canvas-safe-area-box.
  // Guide lines are rendered inside .canvas-safe-area-box, so every coordinate
  // must be shifted by this amount to sit on top of the actual card content.
  const cardOffsetRef = useRef({ x: 0, y: 0 });

  // Undo / Redo Stack
  const historyStackRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoingRef = useRef(false);

  const pushHistory = useCallback((newConfig) => {
    if (isUndoRedoingRef.current || !newConfig) return;
    const stack = historyStackRef.current.slice(0, historyIndexRef.current + 1);
    stack.push(JSON.parse(JSON.stringify(newConfig)));
    if (stack.length > 50) stack.shift();
    historyStackRef.current = stack;
    historyIndexRef.current = stack.length - 1;
  }, []);

  const saveTimerRef = useRef(null);

  // Debounced auto-save function
  const triggerSave = useCallback((newConfig) => {
    if (!newConfig) return;
    setSaveStatus("saving");
    try {
      localStorage.setItem("hunt_overlay_config_cache", JSON.stringify(newConfig));
    } catch {}

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        const res = await streamerOverlayAPI.updateOverlayConfig(newConfig);
        if (res?.overlay) {
          try {
            localStorage.setItem("hunt_overlay_config_cache", JSON.stringify(res.overlay));
          } catch {}
        }
        setSaveStatus("saved");
      } catch (err) {
        console.error("Failed to auto-save overlay config:", err);
        setSaveStatus("saved");
      }
    }, 400);
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyStackRef.current.length - 1;

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const targetConfig = historyStackRef.current[historyIndexRef.current];
      isUndoRedoingRef.current = true;
      setConfig(targetConfig);
      triggerSave(targetConfig);
      setTimeout(() => { isUndoRedoingRef.current = false; }, 50);
      showMessage("Undo", "info");
    }
  }, [showMessage, triggerSave]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyStackRef.current.length - 1) {
      historyIndexRef.current += 1;
      const targetConfig = historyStackRef.current[historyIndexRef.current];
      isUndoRedoingRef.current = true;
      setConfig(targetConfig);
      triggerSave(targetConfig);
      setTimeout(() => { isUndoRedoingRef.current = false; }, 50);
      showMessage("Redo", "info");
    }
  }, [showMessage, triggerSave]);

  // Preset Handlers
  const handleSelectPreset = useCallback(async (presetId) => {
    if (!presetId) return;
    const all = [...BUILTIN_PRESETS, ...savedPresets];
    const found = all.find((p) => p.id === presetId);
    if (!found || !found.config) return;

    setSelectedPresetId(presetId);
    try {
      localStorage.setItem("hunt_overlay_active_preset_id", presetId);
    } catch {}
    const newConfig = JSON.parse(JSON.stringify(found.config));
    if (overlayToken) {
      newConfig.overlayToken = overlayToken;
    }
    newConfig.activePresetId = presetId;
    newConfig.elementStyles = { ...(found.config.elementStyles || {}) };

    setConfig(newConfig);
    try {
      localStorage.setItem("hunt_overlay_config_cache", JSON.stringify(newConfig));
    } catch {}

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus("saving");
    try {
      const res = await streamerOverlayAPI.updateOverlayConfig(newConfig);
      if (res?.overlay) {
        try {
          localStorage.setItem("hunt_overlay_config_cache", JSON.stringify(res.overlay));
        } catch {}
      }
      setSaveStatus("saved");
    } catch (err) {
      console.error("Failed to save overlay preset:", err);
      setSaveStatus("saved");
    }

    pushHistory(newConfig);
    showMessage(`Loaded preset "${found.name}"!`, "success");
  }, [savedPresets, overlayToken, pushHistory, showMessage]);

  const handleSaveCustomPreset = useCallback(() => {
    const trimmed = presetNameInput.trim();
    if (!trimmed || !config) return;

    const newPreset = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      config: JSON.parse(JSON.stringify(config)),
      isCustom: true,
      createdAt: Date.now()
    };

    const nextPresets = [...savedPresets, newPreset];
    setSavedPresets(nextPresets);
    setSelectedPresetId(newPreset.id);
    try {
      localStorage.setItem("hunt_overlay_custom_presets", JSON.stringify(nextPresets));
      localStorage.setItem("hunt_overlay_active_preset_id", newPreset.id);
    } catch (e) {
      console.error("Failed to save preset to localStorage:", e);
    }

    const updatedConfig = { ...config, activePresetId: newPreset.id };
    setConfig(updatedConfig);
    triggerSave(updatedConfig);

    setShowSavePresetModal(false);
    setPresetNameInput("");
    showMessage(`Preset "${trimmed}" saved!`, "success");
  }, [presetNameInput, config, savedPresets, triggerSave, showMessage]);

  const handleDeleteSelectedPreset = useCallback(() => {
    if (!selectedPresetId) return;
    const toDelete = savedPresets.find((p) => p.id === selectedPresetId);
    if (!toDelete) return;

    const nextPresets = savedPresets.filter((p) => p.id !== selectedPresetId);
    setSavedPresets(nextPresets);
    setSelectedPresetId("classic-horizontal");
    try {
      localStorage.setItem("hunt_overlay_custom_presets", JSON.stringify(nextPresets));
      localStorage.setItem("hunt_overlay_active_preset_id", "classic-horizontal");
    } catch {}

    const defaultPreset = BUILTIN_PRESETS[0];
    const newConfig = JSON.parse(JSON.stringify(defaultPreset.config));
    if (overlayToken) newConfig.overlayToken = overlayToken;
    newConfig.activePresetId = "classic-horizontal";
    setConfig(newConfig);
    triggerSave(newConfig);

    setShowDeletePresetModal(false);
    showMessage(`Preset "${toDelete.name}" deleted.`, "info");
  }, [selectedPresetId, savedPresets, overlayToken, triggerSave, showMessage]);

  // 1. Initial Data Fetch & Scrollbar Suppression
  useEffect(() => {
    let isMounted = true;
    document.body.classList.add("overlay-editor-active");

    const savedActivePresetId = localStorage.getItem("hunt_overlay_active_preset_id") || "classic-horizontal";
    setSelectedPresetId(savedActivePresetId);

    // Load from cache instantly if present
    try {
      const cached = localStorage.getItem("hunt_overlay_config_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        setConfig(parsed);
        setOverlayToken(parsed.overlayToken || "");
        if (parsed.activePresetId) {
          setSelectedPresetId(parsed.activePresetId);
        }
        pushHistory(parsed);
      } else {
        const all = [...BUILTIN_PRESETS, ...savedPresets];
        const defaultPreset = all.find((p) => p.id === savedActivePresetId) || BUILTIN_PRESETS[0];
        const initialConfig = JSON.parse(JSON.stringify(defaultPreset.config));
        initialConfig.activePresetId = defaultPreset.id;
        setConfig(initialConfig);
        pushHistory(initialConfig);
      }
    } catch {}

    streamerOverlayAPI
      .getOverlayConfig()
      .then((res) => {
        if (!isMounted) return;
        if (res?.overlay) {
          const serverOverlay = res.overlay;
          const token = serverOverlay.overlayToken || "";
          setOverlayToken(token);

          const activeId = serverOverlay.activePresetId || localStorage.getItem("hunt_overlay_active_preset_id") || "classic-horizontal";
          const builtinPreset = BUILTIN_PRESETS.find((p) => p.id === activeId);

          let finalConfig;
          if (builtinPreset) {
            // For built-in presets, always reconstruct from the preset definition
            // to avoid stale DB defaults overriding the preset values.
            // Only carry over overlay-level fields that are independent of the preset.
            finalConfig = JSON.parse(JSON.stringify(builtinPreset.config));
            finalConfig.overlayToken = token;
            finalConfig.activePresetId = activeId;
            // Carry over canvas/position/animation settings which user may have customised
            if (serverOverlay.canvasWidth) finalConfig.canvasWidth = serverOverlay.canvasWidth;
            if (serverOverlay.canvasHeight) finalConfig.canvasHeight = serverOverlay.canvasHeight;
            if (serverOverlay.position) finalConfig.position = serverOverlay.position;
            if (serverOverlay.animationSettings) finalConfig.animationSettings = serverOverlay.animationSettings;
            // elementStyles should be empty for built-in presets (no custom element offsets)
            finalConfig.elementStyles = serverOverlay.elementStyles && Object.keys(serverOverlay.elementStyles).length > 0
              ? serverOverlay.elementStyles
              : {};
          } else {
            // For custom presets, use the full server document
            finalConfig = serverOverlay;
            finalConfig.activePresetId = activeId;
          }

          setConfig(finalConfig);
          setSelectedPresetId(activeId);
          try {
            localStorage.setItem("hunt_overlay_active_preset_id", activeId);
            localStorage.setItem("hunt_overlay_config_cache", JSON.stringify(finalConfig));
          } catch {}
          pushHistory(finalConfig);
        } else {
          const all = [...BUILTIN_PRESETS, ...savedPresets];
          const activePresetId = localStorage.getItem("hunt_overlay_active_preset_id") || "classic-horizontal";
          const defaultPreset = all.find((p) => p.id === activePresetId) || BUILTIN_PRESETS[0];
          const initialConfig = JSON.parse(JSON.stringify(defaultPreset.config));
          if (res?.overlay?.overlayToken) {
            initialConfig.overlayToken = res.overlay.overlayToken;
            setOverlayToken(res.overlay.overlayToken);
          }
          initialConfig.activePresetId = defaultPreset.id;
          setConfig(initialConfig);
          setSelectedPresetId(defaultPreset.id);
          pushHistory(initialConfig);
          triggerSave(initialConfig);
        }
      })
      .catch((err) => {
        console.error("Failed to load overlay config:", err);
      });

    huntAPI
      .getHuntData()
      .then((res) => {
        if (!isMounted) return;
        const active = res.activeHunts || [];
        setActiveHuntsList(active);
        let curr = null;
        if (res.currentHuntId != null) {
          curr = active.find(h => String(h.id) === String(res.currentHuntId) || String(h.huntId) === String(res.currentHuntId));
        }
        if (!curr && active.length > 0) {
          curr = active[0];
        }
        setActiveCurrentHunt(curr);
      })
      .catch((err) => {
        console.error("Failed to load active hunts:", err);
      });

    return () => {
      isMounted = false;
      document.body.classList.remove("overlay-editor-active");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [pushHistory]);

  // Update config helper with history push
  const updateConfig = useCallback((updater) => {
    setConfig((prev) => {
      const next = typeof updater === "function" ? updater(prev || {}) : { ...(prev || {}), ...updater };
      pushHistory(next);
      triggerSave(next);
      return next;
    });
  }, [triggerSave, pushHistory]);

  // Derived effective hunt for preview
  const effectiveHunt = useMemo(() => {
    if (previewNoHunt) return null;

    let base = null;
    if (selectedHuntOption === "current") {
      base = activeCurrentHunt || SAMPLE_HUNTS[0];
    } else {
      base = SAMPLE_HUNTS.find((h) => h.id === selectedHuntOption) || SAMPLE_HUNTS[0];
    }

    if (!base) return SAMPLE_HUNTS[0];

    return {
      ...base,
      checks: Math.max(0, (base.checks || 0) + previewChecksDelta),
      status: previewIsPaused ? "paused" : "running",
      isPaused: previewIsPaused ? true : false,
    };
  }, [selectedHuntOption, activeCurrentHunt, previewChecksDelta, previewIsPaused, previewNoHunt]);

  // Element styles helper
  const selectedElementProps = useMemo(() => {
    if (!config || !selectedElementId) return {};
    const styles = config.elementStyles?.[selectedElementId] || {};
    return styles;
  }, [config, selectedElementId]);

  const updateSelectedElementProps = useCallback((partial) => {
    if (!selectedElementId) return;
    updateConfig((prev) => {
      const currStyles = prev?.elementStyles || {};
      const elemStyle = currStyles[selectedElementId] || {};
      return {
        ...prev,
        elementStyles: {
          ...currStyles,
          [selectedElementId]: {
            ...elemStyle,
            ...partial
          }
        }
      };
    });
  }, [selectedElementId, updateConfig]);

  // Toggle element visibility (works on single keys and multi-keys like Game/Method/Form)
  const toggleElementVisibility = useCallback((elemDef) => {
    updateConfig((prev) => {
      const group = prev?.[elemDef.configGroup] || {};
      const isVisibleCurrently = elemDef.multiKeys
        ? elemDef.multiKeys.some((k) => group[k] !== false)
        : group[elemDef.configKey] !== false;
      const nextVal = !isVisibleCurrently;

      const updatedGroup = {
        ...group,
        [elemDef.configKey]: nextVal
      };

      if (elemDef.multiKeys) {
        elemDef.multiKeys.forEach((k) => {
          updatedGroup[k] = nextVal;
        });
      }

      return {
        ...prev,
        [elemDef.configGroup]: updatedGroup
      };
    });
  }, [updateConfig]);

  const isElementVisible = useCallback((elemDef) => {
    if (!config) return true;
    const group = config[elemDef.configGroup] || {};
    if (elemDef.multiKeys) {
      return elemDef.multiKeys.some((k) => group[k] !== false);
    }
    return group[elemDef.configKey] !== false;
  }, [config]);

  // Helper to get element DOM bounding rects relative to card
  const getElementRects = useCallback(() => {
    const card = canvasRef.current?.querySelector(".hunt-overlay-card") || canvasRef.current?.querySelector(".canvas-safe-area-box");
    if (!card) return {};
    const cardRect = card.getBoundingClientRect();
    const rects = {};
    card.querySelectorAll("[data-element-id]").forEach((el) => {
      const id = el.getAttribute("data-element-id");
      const r = el.getBoundingClientRect();
      const s = config?.elementStyles?.[id] || {};
      const baseLeft = (r.left - cardRect.left) / zoomLevel - Number(s.x || 0);
      const baseTop = (r.top - cardRect.top) / zoomLevel - Number(s.y || 0);
      const width = r.width / zoomLevel;
      const height = r.height / zoomLevel;
      const left = baseLeft + Number(s.x || 0);
      const top = baseTop + Number(s.y || 0);
      rects[id] = {
        id,
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        centerX: left + width / 2,
        centerY: top + height / 2,
        baseLeft,
        baseTop,
      };
    });
    return rects;
  }, [config, zoomLevel]);

  // Quick Alignment Trigger (Single & Multi-Select)
  const handleAlign = useCallback((alignType) => {
    if (!selectedElementIds.length) return;
    const elementRects = getElementRects();
    const updatedStyles = alignElements(
      selectedElementIds,
      config?.elementStyles || {},
      alignType,
      elementRects,
      { width: overlayWidth, height: overlayHeight }
    );
    updateConfig({ elementStyles: updatedStyles });
    showMessage(`Aligned ${alignType}`, "success");
  }, [selectedElementIds, getElementRects, config, overlayWidth, overlayHeight, updateConfig, showMessage]);

  // Distribution Trigger (Multi-Select 3+ elements)
  const handleDistribute = useCallback((axis) => {
    if (selectedElementIds.length < 3) return;
    const elementRects = getElementRects();
    const updatedStyles = distributeElements(
      selectedElementIds,
      config?.elementStyles || {},
      axis,
      elementRects
    );
    updateConfig({ elementStyles: updatedStyles });
    showMessage(`Distributed ${axis === "horizontal" ? "Horizontally" : "Vertically"}`, "success");
  }, [selectedElementIds, getElementRects, config, updateConfig, showMessage]);

  // Fit Overlay to Maximum Available Space in Preview Viewport
  const handleFitToScreen = useCallback(() => {
    const viewport = canvasRef.current;
    if (!viewport) {
      setZoomLevel(1.0);
      return;
    }
    const paddingX = 80;
    const paddingY = 80;
    const availW = Math.max(100, viewport.clientWidth - paddingX);
    const availH = Math.max(100, viewport.clientHeight - paddingY);

    const scaleX = availW / overlayWidth;
    const scaleY = availH / overlayHeight;
    const bestFit = Math.min(scaleX, scaleY);

    const targetZoom = Math.max(0.4, Math.min(2.5, Math.round(bestFit * 100) / 100));
    setZoomLevel(targetZoom);
  }, [overlayWidth, overlayHeight]);

  // Canvas Mouse & Touch Interaction (Move, Multi-Select, Dragging)
  const handleMouseDownCanvas = (e) => {
    const elem = e.target.closest("[data-element-id]");
    if (elem) {
      const elemId = elem.getAttribute("data-element-id");
      let nextSelectedIds = selectedElementIds;

      if (e.shiftKey) {
        if (selectedElementIds.includes(elemId)) {
          nextSelectedIds = selectedElementIds.filter((id) => id !== elemId);
          if (!nextSelectedIds.length) nextSelectedIds = [elemId];
        } else {
          nextSelectedIds = [...selectedElementIds, elemId];
        }
        setSelectedElementIds(nextSelectedIds);
      } else {
        if (!selectedElementIds.includes(elemId)) {
          nextSelectedIds = [elemId];
          setSelectedElementIds(nextSelectedIds);
        }
      }

      if (!lockedElementIds.includes(elemId)) {
        dragTargetRef.current = elemId;
        isDraggingRef.current = true;

        const card = canvasRef.current?.querySelector(".hunt-overlay-card") || canvasRef.current?.querySelector(".canvas-safe-area-box");
        if (card) {
          const cardRect = card.getBoundingClientRect();

          // Compute how far the card sits inside .canvas-safe-area-box so guide
          // coordinates (which are card-relative) are rendered at the right position.
          const safeAreaEl = canvasRef.current?.querySelector(".canvas-safe-area-box");
          if (safeAreaEl && safeAreaEl !== card) {
            const safeR = safeAreaEl.getBoundingClientRect();
            cardOffsetRef.current = {
              x: (cardRect.left - safeR.left) / zoomLevel,
              y: (cardRect.top  - safeR.top)  / zoomLevel,
            };
          } else {
            cardOffsetRef.current = { x: 0, y: 0 };
          }
          const elementMap = {};
          const others = [];

          card.querySelectorAll("[data-element-id]").forEach((el) => {
            const id = el.getAttribute("data-element-id");
            const r = el.getBoundingClientRect();
            const s = config?.elementStyles?.[id] || {};
            const initialX = Number(s.x || 0);
            const initialY = Number(s.y || 0);
            const baseLeft = (r.left - cardRect.left) / zoomLevel - initialX;
            const baseTop = (r.top - cardRect.top) / zoomLevel - initialY;
            const width = r.width / zoomLevel;
            const height = r.height / zoomLevel;

            if (nextSelectedIds.includes(id)) {
              elementMap[id] = {
                initialX,
                initialY,
                baseLeft,
                baseTop,
                width,
                height,
              };
            } else {
              const curL = baseLeft + initialX;
              const curT = baseTop + initialY;
              // Use cx/cy — must match the field names expected by snap() and buildGuides()
              others.push({
                id,
                left:   curL,
                right:  curL + width,
                top:    curT,
                bottom: curT + height,
                width,
                height,
                cx: curL + width / 2,   // -> correct field name for snap engine
                cy: curT + height / 2,  // -> correct field name for snap engine
              });
            }
          });

          // Compute group bounding box
          const selRects = Object.values(elementMap);
          const groupLeft = Math.min(...selRects.map((r) => r.baseLeft + r.initialX));
          const groupRight = Math.max(...selRects.map((r) => r.baseLeft + r.initialX + r.width));
          const groupTop = Math.min(...selRects.map((r) => r.baseTop + r.initialY));
          const groupBottom = Math.max(...selRects.map((r) => r.baseTop + r.initialY + r.height));

          dragStartPosRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            elements: elementMap,
            groupRect: {
              left: groupLeft,
              right: groupRight,
              top: groupTop,
              bottom: groupBottom,
              width: groupRight - groupLeft,
              height: groupBottom - groupTop,
            },
          };
          dragOtherElementsRef.current = others;
        }
      }
      e.preventDefault();
    } else {
      // Clicked outside any element -> unselect
      setSelectedElementIds([]);
      setShowSnapPopover(false);
    }
  };

  const handleMouseMoveCanvas = useCallback((e) => {
    if (!isDraggingRef.current || !dragTargetRef.current) return;

    const deltaX = (e.clientX - dragStartPosRef.current.mouseX) / zoomLevel;
    const deltaY = (e.clientY - dragStartPosRef.current.mouseY) / zoomLevel;

    const { elements, groupRect } = dragStartPosRef.current;
    if (!groupRect || !elements) return;

    const W = overlayWidth;
    const H = overlayHeight;
    const others = dragOtherElementsRef.current || [];
    const canvas = { w: W, h: H };

    // Step 1 — raw drag position (before snap)
    const rawGroupLeft = groupRect.left + deltaX;
    const rawGroupTop  = groupRect.top  + deltaY;

    const rawRect = toSnapRect(rawGroupLeft, rawGroupTop, groupRect.width, groupRect.height);

    // Step 2 — calculate snap deltas (ignore if Ctrl held)
    const { dx, dy } = snapElements(rawRect, others, canvas, snapSettings, isCtrlHeldRef.current);

    // Step 3 — apply snap delta and clamp strictly inside canvas
    const snappedLeft = Math.max(0, Math.min(W - groupRect.width,  rawGroupLeft + dx));
    const snappedTop  = Math.max(0, Math.min(H - groupRect.height, rawGroupTop  + dy));
    const finalDeltaX = snappedLeft - groupRect.left;
    const finalDeltaY = snappedTop  - groupRect.top;

    // Step 4 — build guide lines from the FINAL snapped position (correct coords, always inside canvas)
    const snappedRect = toSnapRect(snappedLeft, snappedTop, groupRect.width, groupRect.height);
    const guides = buildGuides(snappedRect, others, canvas, { ...snapSettings, showGuides: snapSettings.showGuides !== false });
    setSmartGuides(guides);

    // Step 5 — commit position to state (no save during drag) position to state (no save during drag)
    setConfig((prev) => {
      const currStyles = { ...(prev?.elementStyles || {}) };
      Object.keys(elements).forEach((id) => {
        const init = elements[id];
        currStyles[id] = {
          ...(currStyles[id] || {}),
          x: Math.round(init.initialX + finalDeltaX),
          y: Math.round(init.initialY + finalDeltaY),
        };
      });
      return { ...prev, elementStyles: currStyles };
    });
  }, [zoomLevel, overlayWidth, overlayHeight, snapSettings]);

  const handleMouseUpCanvas = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      dragTargetRef.current = null;
      setSmartGuides([]);
      // Commit final drag position to history & server save
      setConfig((current) => {
        pushHistory(current);
        triggerSave(current);
        return current;
      });
    }
  }, [pushHistory, triggerSave]);

  // Native non-passive wheel listener for smooth zooming on canvas scroll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      setZoomLevel((z) => Math.max(0.4, Math.min(2.5, Math.round((z + delta) * 100) / 100)));
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

  // Keyboard navigation & Shortcuts (Arrows, Shift+Arrows, Ctrl snap bypass, Alt measurements, Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl key tracking for snap override
      if (e.key === "Control" || e.ctrlKey) {
        isCtrlHeldRef.current = true;
        setIsCtrlHeld(true);
      }

      // Alt key tracking for distance measurements
      if (e.key === "Alt") {
        isAltHeldRef.current = true;
        setIsAltHeld(true);
        if (selectedElementIds.length === 1) {
          const rects = getElementRects();
          const selectedRect = rects[selectedElementIds[0]];
          const others = Object.values(rects).filter((r) => r.id !== selectedElementIds[0]);
          const measurements = calculateAltMeasurements(selectedRect, others, { width: overlayWidth, height: overlayHeight });
          setAltMeasurements(measurements);
        }
      }

      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

      // Undo / Redo Shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Arrow Nudging for Selected Elements
      if (!selectedElementIds.length) return;
      const step = e.shiftKey ? 10 : 1;

      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        const deltaX = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const deltaY = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;

        updateConfig((prev) => {
          const currStyles = { ...(prev?.elementStyles || {}) };
          selectedElementIds.forEach((id) => {
            const s = currStyles[id] || {};
            currStyles[id] = {
              ...s,
              x: (s.x || 0) + deltaX,
              y: (s.y || 0) + deltaY,
            };
          });
          return {
            ...prev,
            elementStyles: currStyles,
          };
        });
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === "Control" || !e.ctrlKey) {
        isCtrlHeldRef.current = false;
        setIsCtrlHeld(false);
      }
      if (e.key === "Alt") {
        isAltHeldRef.current = false;
        setIsAltHeld(false);
        setAltMeasurements([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedElementIds, getElementRects, overlayWidth, overlayHeight, handleUndo, handleRedo, updateConfig]);

  // Copy OBS URL
  const obsUrl = useMemo(() => {
    if (!overlayToken) return "";
    return `${window.location.origin}/overlay/hunt/${overlayToken}`;
  }, [overlayToken]);

  const handleCopyOBSUrl = async () => {
    if (!obsUrl) return;
    try {
      await navigator.clipboard.writeText(obsUrl);
      setIsCopied(true);
      showMessage("OBS Browser Source URL copied to clipboard! ✨", "success");
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      showMessage("Failed to copy URL", "error");
    }
  };

  // Reset entire layout
  const handleResetLayout = async () => {
    const defaultPreset = BUILTIN_PRESETS[0];
    const newConfig = JSON.parse(JSON.stringify(defaultPreset.config));
    if (overlayToken) {
      newConfig.overlayToken = overlayToken;
    }
    newConfig.activePresetId = "classic-horizontal";
    newConfig.elementStyles = {};
    setSelectedPresetId("classic-horizontal");
    try {
      localStorage.setItem("hunt_overlay_active_preset_id", "classic-horizontal");
      localStorage.setItem("hunt_overlay_config_cache", JSON.stringify(newConfig));
    } catch {}
    setConfig(newConfig);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus("saving");
    try {
      await streamerOverlayAPI.updateOverlayConfig(newConfig);
      setSaveStatus("saved");
    } catch {}

    pushHistory(newConfig);
    setShowResetModal(false);
    showMessage("Overlay layout reset to default!", "success");
  };

  // Reset selected element props (now handled internally by UniversalPropertiesPanel; kept for compat)
  const handleResetSelectedElement = useCallback(() => {
    if (!selectedElementId) return;
    updateConfig((prev) => {
      const styles = { ...(prev?.elementStyles || {}) };
      delete styles[selectedElementId];
      return { ...prev, elementStyles: styles };
    });
    showMessage(`Reset ${OVERLAY_ELEMENT_DEFS.find((e) => e.id === selectedElementId)?.name || selectedElementId}`, "success");
  }, [selectedElementId, updateConfig, showMessage]);

  return (
    <div
      className="overlay-editor-studio-container"
      style={{
        "--accent": themeAccentHex,
        "--accent-hover": themeAccentHex,
      }}
      onMouseMove={handleMouseMoveCanvas}
      onMouseUp={handleMouseUpCanvas}
    >
      {/* ── Studio Top Header Bar ─────────────────────────────────────────── */}
      <header className="editor-studio-topbar">
        <div className="editor-topbar-left">
          <button className="editor-back-link" onClick={() => navigate("/streamer-tools")}>
            <ArrowLeft size={15} />
            <span>Streamer Tools</span>
          </button>
          <div className="editor-title-group">
            <h1 className="editor-app-title">
              <Tv size={18} style={{ color: themeAccentHex }} />
              Hunt Overlay Editor
            </h1>
            <span className={`editor-status-badge ${saveStatus}`}>
              {saveStatus === "saving" ? "Saving..." : "Saved ✓"}
            </span>
          </div>
        </div>

        <div className="editor-topbar-center">
          <div className="editor-hunt-select-wrapper" style={{ minWidth: "320px" }}>
            <SelectField
              size="sm"
              value={selectedHuntOption}
              onChange={(val) => setSelectedHuntOption(val)}
              options={[
                {
                  value: "current",
                  label: `Current Hunt ${activeCurrentHunt?.pokemon?.name ? `(${activeCurrentHunt.pokemon.name})` : "(Counters Page)"}`,
                },
                {
                  value: "sample-crabominable",
                  label: "Crabominable – Scarlet (Sandwich + Charm)",
                },
                {
                  value: "sample-rayquaza",
                  label: "Rayquaza – Emerald (Soft Resets)",
                },
                {
                  value: "sample-mew",
                  label: "Mew – Emerald (Soft Resets)",
                },
                {
                  value: "sample-charizard",
                  label: "Charizard – Let's Go Eevee (Combo + Charm + Lure)",
                },
              ]}
            />
          </div>
        </div>

        <div className="editor-topbar-right">
          {/* Preset Selector Dropdown */}
          <div className="editor-preset-select-wrapper" style={{ width: "190px" }}>
            <SelectField
              size="xs"
              value={selectedPresetId}
              onChange={(presetId) => handleSelectPreset(presetId)}
              options={[
                { label: "── Built-in Presets ──", value: "", disabled: true },
                ...BUILTIN_PRESETS.map((p) => ({ value: p.id, label: p.name })),
                ...(savedPresets.length > 0
                  ? [
                      { label: "── Custom Presets ──", value: "", disabled: true },
                      ...savedPresets.map((p) => ({ value: p.id, label: `★ ${p.name}` }))
                    ]
                  : [])
              ]}
            />
          </div>

          <button
            className="editor-btn-secondary"
            onClick={() => {
              setPresetNameInput("");
              setShowSavePresetModal(true);
            }}
            title="Save current overlay setup as a custom preset"
          >
            <Bookmark size={14} />
            Save Preset
          </button>

          {isCustomPresetSelected && (
            <button
              className="editor-btn-secondary text-red-400 hover:text-red-300"
              onClick={() => setShowDeletePresetModal(true)}
              title="Delete this custom preset"
            >
              <Trash2 size={14} />
            </button>
          )}

          <button className="editor-btn-secondary" onClick={() => setShowResetModal(true)}>
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </header>

      {/* ── 3-Column Studio Body ──────────────────────────────────────────── */}
      <div className="editor-studio-body">
        {/* ── Left Sidebar (Elements & Properties) ────────────────────────── */}
        <aside className="editor-left-sidebar">
          {/* Navigation Tabs */}
          <div className="editor-tabs-nav">
            <button
              className={`editor-tab-btn ${activeSidebarTab === "elements" ? "active" : ""}`}
              onClick={() => setActiveSidebarTab("elements")}
            >
              Elements
            </button>
            <button
              className={`editor-tab-btn ${activeSidebarTab === "overlay" ? "active" : ""}`}
              onClick={() => setActiveSidebarTab("overlay")}
            >
              Overlay
            </button>
            <button
              className={`editor-tab-btn ${activeSidebarTab === "animations" ? "active" : ""}`}
              onClick={() => setActiveSidebarTab("animations")}
            >
              Animations
            </button>
            <button
              className={`editor-tab-btn ${activeSidebarTab === "events" ? "active" : ""}`}
              onClick={() => setActiveSidebarTab("events")}
            >
              Events
            </button>
          </div>

          {activeSidebarTab === "elements" ? (
            <>
              {/* Elements List Header */}
              <div className="editor-section-header">
                <span className="editor-section-title">OVERLAY ELEMENTS</span>
                <button className="editor-text-btn" onClick={handleResetLayout}>
                  Reset Layout
                </button>
              </div>

              {/* Elements Layer List */}
              <div className="overlay-elements-list">
                {OVERLAY_ELEMENT_DEFS.map((elemDef) => (
                  <LayerItem
                    key={elemDef.id}
                    elemDef={elemDef}
                    isSelected={selectedElementIds.includes(elemDef.id)}
                    isVisible={isElementVisible(elemDef)}
                    isLocked={lockedElementIds.includes(elemDef.id)}
                    accentHex={themeAccentHex}
                    onSelect={(e) => {
                      if (lockedElementIds.includes(elemDef.id)) return;
                      if (e?.shiftKey) {
                        setSelectedElementIds((prev) =>
                          prev.includes(elemDef.id)
                            ? (prev.filter((id) => id !== elemDef.id).length ? prev.filter((id) => id !== elemDef.id) : [elemDef.id])
                            : [...prev, elemDef.id]
                        );
                      } else {
                        setSelectedElementIds([elemDef.id]);
                      }
                    }}
                    onToggleVisible={() => toggleElementVisibility(elemDef)}
                    onToggleLocked={() => toggleElementLocked(elemDef.id)}
                  />
                ))}
              </div>

              {/* Universal Properties Inspector Panel */}
              {selectedElementId && (
                <UniversalPropertiesPanel
                  selectedElementId={selectedElementId}
                  selectedElementIds={selectedElementIds}
                  selectedElementProps={selectedElementProps}
                  updateSelectedElementProps={updateSelectedElementProps}
                  config={config}
                  updateConfig={updateConfig}
                  handleAlign={handleAlign}
                  handleDistribute={handleDistribute}
                  themeAccentHex={themeAccentHex}
                />
              )}
            </>
          ) : activeSidebarTab === "animations" ? (
            /* Animations Settings Tab */
            <UniversalAnimationSettings
              config={config}
              updateConfig={updateConfig}
              themeAccentHex={themeAccentHex}
            />
          ) : activeSidebarTab === "events" ? (
            /* Events & Status Settings Tab */
            <UniversalEventSettings
              config={config}
              updateConfig={updateConfig}
              themeAccentHex={themeAccentHex}
            />
          ) : (
            /* Universal Overlay Settings Tab */
            <UniversalOverlaySettings
              config={config}
              updateConfig={updateConfig}
              themeAccentHex={themeAccentHex}
              isMember={isMember}
            />
          )}
        </aside>

        {/* ── Center Canvas Workspace ─────────────────────────────────────── */}
        <main className="editor-center-canvas">
          {/* Canvas Studio Toolbar */}
          <div className="canvas-studio-toolbar">
            <div className="canvas-hint-text">
              Drag to move • Scroll to zoom • Arrow keys nudge • Ctrl+Z to undo
            </div>

            <div className="canvas-toggle-group">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300" title="Toggle canvas background grid">
                <span>Show Grid</span>
                <div className="overlay-toggle-switch">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                  />
                  <span className="overlay-toggle-slider" />
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300" title="Toggle OBS canvas boundary box">
                <span>OBS Bounds</span>
                <div className="overlay-toggle-switch">
                  <input
                    type="checkbox"
                    checked={showSafeArea}
                    onChange={(e) => setShowSafeArea(e.target.checked)}
                  />
                  <span className="overlay-toggle-slider" />
                </div>
              </label>
            </div>
          </div>

          {/* Interactive Viewport Area */}
          <div
            ref={canvasRef}
            className={`canvas-interactive-viewport ${showGrid ? "has-grid" : "no-grid"}`}
            onMouseDown={handleMouseDownCanvas}
          >
            <div
              className={`canvas-safe-area-box ${showSafeArea ? "has-border" : "no-border"}`}
              style={{
                width: `${overlayWidth}px`,
                height: `${overlayHeight}px`,
                minWidth: `${overlayWidth}px`,
                minHeight: `${overlayHeight}px`,
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center center",
                "--obs-pad-left": `${obsCanvasDimensions.padLeft ?? 0}px`,
                "--obs-pad-right": `${obsCanvasDimensions.padRight ?? 0}px`,
                "--obs-pad-top": `${obsCanvasDimensions.padTop ?? 0}px`,
                "--obs-pad-bottom": `${obsCanvasDimensions.padBottom ?? 0}px`,
              }}
            >
              {showSafeArea && (
                <span className="canvas-obs-bounds-tag">
                  OBS Canvas ({obsCanvasDimensions.width} × {obsCanvasDimensions.height})
                  {obsCanvasDimensions.hasPadding && (
                    <span style={{ opacity: 0.65, fontSize: "0.7em", marginLeft: 4 }}>
                      incl. effects padding
                    </span>
                  )}
                </span>
              )}

              {/* Smart Alignment Guides — always clipped inside canvas */}
              {smartGuides.length > 0 && (
                <div className="photoshop-smart-guides-overlay">
                  {smartGuides.map((guide, idx) => {
                    const ox = cardOffsetRef.current.x;
                    const oy = cardOffsetRef.current.y;
                    // axis:'x' → vertical line at canvas-x=pos, spanning canvas-y from→to
                    if (guide.axis === 'x') {
                      const h = Math.max(1, guide.to - guide.from);
                      return (
                        <div
                          key={`gx-${idx}`}
                          className="photoshop-guide-line-v"
                          style={{
                            left: `${guide.pos + ox}px`,
                            top:  `${guide.from + oy}px`,
                            height: `${h}px`,
                            background: themeAccentHex,
                          }}
                        />
                      );
                    }
                    // axis:'y' → horizontal line at canvas-y=pos, spanning canvas-x from→to
                    if (guide.axis === 'y') {
                      const w = Math.max(1, guide.to - guide.from);
                      return (
                        <div
                          key={`gy-${idx}`}
                          className="photoshop-guide-line-h"
                          style={{
                            top:  `${guide.pos + oy}px`,
                            left: `${guide.from + ox}px`,
                            width: `${w}px`,
                            background: themeAccentHex,
                          }}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              )}

              {/* Alt-Key Distance Measurements Overlay */}
              {isAltHeld && altMeasurements.length > 0 && (
                <div className="photoshop-smart-guides-overlay">
                  {altMeasurements.map((m, idx) => (
                    m.type === "v" ? (
                      <div
                        key={`alt-v-${idx}`}
                        className="alt-measurement-line-v"
                        style={{
                          left: `${m.x}px`,
                          top: `${m.start}px`,
                          height: `${Math.max(4, m.end - m.start)}px`,
                        }}
                      >
                        <span className="alt-measurement-badge" style={{ top: "50%", left: "50%" }}>
                          {m.label}
                        </span>
                      </div>
                    ) : (
                      <div
                        key={`alt-h-${idx}`}
                        className="alt-measurement-line-h"
                        style={{
                          top: `${m.y}px`,
                          left: `${m.start}px`,
                          width: `${Math.max(4, m.end - m.start)}px`,
                        }}
                      >
                        <span className="alt-measurement-badge" style={{ top: "50%", left: "50%" }}>
                          {m.label}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Render Authentic Overlay */}
              <HuntOverlayRenderer
                hunt={effectiveHunt}
                overlayConfig={config || {}}
                isPaused={previewIsPaused}
                accentColor={accent || "cyan"}
                triggerAnim={triggerAnim}
                previewMode={true}
                selectedElementId={selectedElementId}
                onSelectElement={(elemId) => {
                  setSelectedElementIds([elemId]);
                }}
              />
            </div>
          </div>

          {/* Canvas Bottom Controls Bar with Snap Settings Popover */}
          <footer className="canvas-bottom-bar relative">
            {/* Left: Undo / Redo */}
            <div className="flex items-center gap-1 bg-[#262626] border border-white/10 rounded-lg p-0.5 mr-auto">
              <button
                className={`p-1.5 rounded text-slate-300 hover:text-white transition-colors ${!canUndo ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10"}`}
                onClick={handleUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={14} />
              </button>
              <button
                className={`p-1.5 rounded text-slate-300 hover:text-white transition-colors ${!canRedo ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10"}`}
                onClick={handleRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 size={14} />
              </button>
            </div>

            {/* Center: Dimensions & Zoom & Fit */}
            <div className="flex items-center gap-3">
              <div className="canvas-dimensions-badge">
                Dimensions {overlayWidth} × {overlayHeight}
              </div>

              <div className="canvas-zoom-pill">
                <button onClick={() => setZoomLevel((z) => Math.max(0.4, Math.round((z - 0.1) * 10) / 10))}>-</button>
                <span>{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel((z) => Math.min(2.5, Math.round((z + 0.1) * 10) / 10))}>+</button>
              </div>

              <button
                className="editor-btn-secondary"
                onClick={handleFitToScreen}
                title="Fit overlay to maximum available preview space"
              >
                <Maximize2 size={13} />
                Fit
              </button>
            </div>

            {/* Right: Snapping Settings Popover Toggle Button */}
            <div className="relative ml-auto">
              <button
                className={`editor-btn-secondary ${!snapSettings.enabled ? "opacity-60" : ""}`}
                style={snapSettings.enabled ? { color: themeAccentHex, borderColor: `color-mix(in srgb, ${themeAccentHex} 30%, transparent)` } : {}}
                onClick={() => setShowSnapPopover((v) => !v)}
                title="Snapping Settings (Hold Ctrl to bypass while dragging, Alt for distance measurements)"
              >
                <Magnet size={13} />
                <span>Snap {snapSettings.enabled ? "On" : "Off"}</span>
              </button>

              {showSnapPopover && (
                <div className="snap-settings-popover" onClick={(e) => e.stopPropagation()}>
                  <div className="snap-settings-header">
                    <span className="snap-settings-title">
                      Snapping &amp; Guides
                    </span>
                    <label className="overlay-toggle-switch">
                      <input
                        type="checkbox"
                        checked={snapSettings.enabled}
                        onChange={(e) => updateSnapSettings({ enabled: e.target.checked })}
                      />
                      <span className="overlay-toggle-slider" />
                    </label>
                  </div>

                  <div className="snap-settings-group">
                    <span className="snap-settings-group-label">Snap To</span>
                    <label className="snap-checkbox-row">
                      <input
                        type="checkbox"
                        checked={snapSettings.snapToCanvasCenter}
                        onChange={(e) => updateSnapSettings({ snapToCanvasCenter: e.target.checked })}
                      />
                      <span>Canvas Center</span>
                    </label>
                    <label className="snap-checkbox-row">
                      <input
                        type="checkbox"
                        checked={snapSettings.snapToCanvasEdges}
                        onChange={(e) => updateSnapSettings({ snapToCanvasEdges: e.target.checked })}
                      />
                      <span>Canvas Edges</span>
                    </label>
                    <label className="snap-checkbox-row">
                      <input
                        type="checkbox"
                        checked={snapSettings.snapToElements}
                        onChange={(e) => updateSnapSettings({ snapToElements: e.target.checked })}
                      />
                      <span>Other Elements (edges &amp; centers)</span>
                    </label>
                    <label className="snap-checkbox-row">
                      <input
                        type="checkbox"
                        checked={snapSettings.snapToGrid}
                        onChange={(e) => updateSnapSettings({ snapToGrid: e.target.checked })}
                      />
                      <span>Grid</span>
                    </label>
                  </div>

                  {snapSettings.snapToGrid && (
                    <div className="snap-settings-group pt-1 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs text-slate-300 gap-2">
                        <span>Grid Size</span>
                        <div style={{ width: "90px" }}>
                          <SelectField
                            size="xs"
                            value={snapSettings.gridSize || 8}
                            onChange={(val) => updateSnapSettings({ gridSize: Number(val) })}
                            options={[
                              { value: 2, label: "2px" },
                              { value: 4, label: "4px" },
                              { value: 5, label: "5px" },
                              { value: 8, label: "8px" },
                              { value: 10, label: "10px" },
                              { value: 16, label: "16px" },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="snap-settings-group pt-1 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="snap-settings-group-label">Snap Strength</span>
                      <span className="snap-threshold-val">{snapSettings.snapThreshold || 6}px</span>
                    </div>
                    <div className="snap-threshold-slider-wrap">
                      <input
                        type="range"
                        min={1}
                        max={20}
                        value={snapSettings.snapThreshold || 6}
                        onChange={(e) => updateSnapSettings({ snapThreshold: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="snap-settings-group pt-1 border-t border-white/10">
                    <label className="snap-checkbox-row">
                      <input
                        type="checkbox"
                        checked={snapSettings.showGuides !== false}
                        onChange={(e) => updateSnapSettings({ showGuides: e.target.checked })}
                      />
                      <span>Show Guide Lines</span>
                    </label>
                  </div>

                  <div className="text-[10px] text-slate-500 bg-white/5 p-2 rounded flex flex-col gap-1.5">
                    <span className="flex items-center gap-1.5">
                      <Keyboard size={11} className="shrink-0 text-slate-400" />
                      <span><b className="text-slate-300">Hold Ctrl</b> to temporarily bypass snap</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MousePointer size={11} className="shrink-0 text-slate-400" />
                      <span><b className="text-slate-300">Shift + Click</b> to multi-select elements</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </footer>

        </main>

        {/* ── Right Sidebar (Test Preview & OBS Setup) ────────────────────── */}
        <aside className="editor-right-sidebar">
          {/* Test Preview Card */}
          <div className="studio-card-widget">
            <h3 className="studio-card-widget-title">Test Preview</h3>
            <p className="studio-card-widget-desc">
              Preview different states without affecting your real hunt.
            </p>

            <div className="studio-quick-actions-grid">
              <button
                className="studio-action-btn"
                onClick={() => setPreviewChecksDelta((d) => d + 1)}
              >
                + 1
              </button>
              <button
                className="studio-action-btn"
                onClick={() => setPreviewChecksDelta((d) => d + 10)}
              >
                + 10
              </button>

              <button
                className="studio-action-btn"
                onClick={() => setTriggerAnim({ type: "PHASE", id: Date.now() })}
              >
                <Flag size={13} className="text-emerald-400" />
                Phase
              </button>

              <button
                className="studio-action-btn"
                onClick={() => setTriggerAnim({ type: "FAIL", id: Date.now() })}
              >
                <RotateCcw size={13} className="text-red-400" />
                Fail
              </button>

              <button
                className="studio-action-btn btn-shiny"
                onClick={() => setTriggerAnim({ type: "SHINY", id: Date.now() })}
              >
                <Sparkles size={14} />
                Shiny Found!
              </button>

              <button
                className={`studio-action-btn ${previewIsPaused ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold" : ""}`}
                onClick={() => setPreviewPaused(true)}
              >
                <Pause size={13} />
                Pause Hunt
              </button>

              <button
                className={`studio-action-btn ${!previewIsPaused ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" : ""}`}
                onClick={() => setPreviewPaused(false)}
              >
                <Play size={13} />
                Resume Hunt
              </button>

              <button
                className={`studio-action-btn col-span-2 ${previewNoHunt ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold" : ""}`}
                onClick={() => setPreviewNoHunt((v) => !v)}
              >
                {previewNoHunt ? "Exit Idle Mode" : "No Active Hunt"}
              </button>

              <button
                className="studio-action-btn col-span-2 text-slate-400"
                onClick={() => {
                  setPreviewChecksDelta(0);
                  setPreviewPaused(false);
                  setPreviewNoHunt(false);
                  setTriggerAnim(null);
                }}
              >
                <RotateCcw size={13} />
                Reset Preview
              </button>
            </div>
          </div>

          {/* OBS Setup Card */}
          <div className="studio-card-widget">
            <h3 className="studio-card-widget-title">OBS Setup</h3>
            <p className="studio-card-widget-desc">
              Add this overlay to OBS or Streamlabs:
            </p>

            <Button
              variant="primary"
              size="sm"
              icon={isCopied ? <Check size={14} /> : <Copy size={14} />}
              onClick={handleCopyOBSUrl}
              className="w-full justify-center mt-1"
            >
              {isCopied ? "Overlay Link Copied!" : "Copy Overlay Link"}
            </Button>

            <div className="obs-checklist mt-3">
              <span className="font-semibold text-slate-300">Recommended Settings:</span>
              <div className="obs-check-item">
                <CheckCircle2 size={13} />
                <span>Source Type: Browser</span>
              </div>
              <div className="obs-check-item">
                <CheckCircle2 size={13} />
                <span>Width: {obsCanvasDimensions.width} px{obsCanvasDimensions.hasPadding ? " (incl. glow/shadow)" : ""}</span>
              </div>
              <div className="obs-check-item">
                <CheckCircle2 size={13} />
                <span>Height: {obsCanvasDimensions.height} px{obsCanvasDimensions.hasPadding ? " (incl. glow/shadow)" : ""}</span>
              </div>
              <div className="obs-check-item">
                <CheckCircle2 size={13} />
                <span>FPS: 60</span>
              </div>
              <div className="obs-check-item">
                <CheckCircle2 size={13} />
                <span>Background: Transparent</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              icon={<ExternalLink size={12} />}
              iconPosition="right"
              onClick={() => setShowOBSGuide(true)}
              className="mt-1 px-0"
            >
              Open OBS Guide
            </Button>
          </div>
        </aside>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetLayout}
        title="Reset Overlay Layout"
        subtitle="Restore defaults"
        message="Are you sure you want to reset your overlay elements and positions? This cannot be undone."
        confirmText="Reset to Defaults"
        cancelText="Cancel"
        variant="warning"
      />

      <ConfirmModal
        isOpen={showDeletePresetModal}
        onClose={() => setShowDeletePresetModal(false)}
        onConfirm={handleDeleteSelectedPreset}
        title="Delete Custom Preset"
        subtitle="Remove saved preset"
        message={`Are you sure you want to delete the preset "${savedPresets.find((p) => p.id === selectedPresetId)?.name || "Custom Preset"}"? This action cannot be undone.`}
        confirmText="Delete Preset"
        cancelText="Cancel"
        variant="danger"
      />

      <Modal
        isOpen={showOBSGuide}
        onClose={() => setShowOBSGuide(false)}
        title="OBS Browser Source Setup"
        icon={<Tv size={20} />}
        size="md"
        closeOnBackdrop
      >
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
          <li>In OBS Studio, click <strong>+</strong> under the Sources dock.</li>
          <li>Select <strong>Browser</strong> and name it (e.g. <em>Shiny Overlay</em>).</li>
          <li>Paste your copied Overlay URL into the <strong>URL</strong> field.</li>
          <li>Set Width to <strong>{obsCanvasDimensions.width}</strong> and Height to <strong>{obsCanvasDimensions.height}</strong>{obsCanvasDimensions.hasPadding ? " — sized to include glow and shadow effects so they aren't clipped." : "."}</li>
          <li>Leave Custom CSS empty (it is already transparent &amp; optimized).</li>
          <li>Click <strong>OK</strong> and position the overlay anywhere on your stream scene!</li>
        </ol>
      </Modal>

      {/* Save Custom Preset Modal */}
      <Modal
        isOpen={showSavePresetModal}
        onClose={() => setShowSavePresetModal(false)}
        title="Save Custom Preset"
        icon={<Bookmark size={20} />}
        size="sm"
        closeOnBackdrop
        footer={
          <Button
            variant="primary"
            onClick={handleSaveCustomPreset}
            disabled={!presetNameInput.trim()}
          >
            Save Preset
          </Button>
        }
      >
        <div className="space-y-3 py-1">
          <p className="text-xs text-slate-400">
            Save your current dimensions, layout, styling, and element customizations as a reusable preset.
          </p>
          <TextField
            label="Preset Name"
            value={presetNameInput}
            onChange={(e) => setPresetNameInput(e.target.value)}
            placeholder="e.g. My Emerald Stream Setup"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && presetNameInput.trim()) {
                e.preventDefault();
                handleSaveCustomPreset();
              }
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
