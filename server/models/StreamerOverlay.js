import mongoose from "mongoose";
import crypto from "crypto";

const streamerOverlaySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true,
  },
  overlayToken: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => crypto.randomBytes(16).toString("hex"),
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  canvasWidth: {
    type: Number,
    default: 1920,
  },
  canvasHeight: {
    type: Number,
    default: 1080,
  },
  position: {
    alignmentPreset: {
      type: String,
      default: "bottom-left",
      enum: [
        "top-left",
        "top-center",
        "top-right",
        "center-left",
        "center",
        "center-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
        "custom",
        "trim"
      ]
    },
    xPercent: { type: Number, default: 2 }, // normalized percentage 0 - 100
    yPercent: { type: Number, default: 85 }  // normalized percentage 0 - 100
  },
  layout: {
    style: {
      type: String,
      default: "horizontal",
      enum: ["horizontal", "vertical", "compact", "minimal"]
    },
    scale: { type: Number, default: 100, min: 50, max: 250 },
    width: { type: Number, default: 420 },
    height: { type: Number, default: 0 },
    padding: { type: Number, default: 16 },
    gap: { type: Number, default: 12 },
    borderRadius: { type: Number, default: 16 }
  },
  pokemonSettings: {
    showSprite: { type: Boolean, default: true },
    showName: { type: Boolean, default: true },
    showShinyIndicator: { type: Boolean, default: true },
    shinySparkleColorMode: { type: String, default: "default", enum: ["default", "accent", "custom"] },
    customShinySparkleColor: { type: String, default: "#ffe76a" },
    showGame: { type: Boolean, default: true },
    showMethod: { type: Boolean, default: true },
    showForm: { type: Boolean, default: true },
    showModifiers: { type: Boolean, default: true },
    spriteSize: { type: Number, default: 68, min: 32, max: 200 }
  },
  counterSettings: {
    showEncounters: { type: Boolean, default: true },
    showOdds: { type: Boolean, default: true },
    showPhase: { type: Boolean, default: true },
    showPhaseCount: { type: Boolean, default: true },
    showChecksPerMinute: { type: Boolean, default: false },
    showAverageTime: { type: Boolean, default: true },
    customLabel: { type: String, default: "Encounters", maxlength: 24 }
  },
  timerSettings: {
    showTimer: { type: Boolean, default: true },
    timerMode: { type: String, default: "elapsed", enum: ["elapsed", "pace"] },
    timerFormat: { type: String, default: "digital", enum: ["digital", "compact"] }
  },
  styleSettings: {
    backgroundMode: {
      type: String,
      default: "transparent",
      enum: ["semi-transparent", "transparent", "solid", "glass"]
    },
    backgroundColor: { type: String, default: "#181818" },
    backgroundOpacity: { type: Number, default: 80, min: 0, max: 100 },
    textColor: { type: String, default: "#ffffff" },
    accentColorMode: { type: String, default: "site", enum: ["site", "custom"] },
    borderStyle: { type: String, default: "subtle" },
    borderWidth: { type: Number, default: 1, min: 0, max: 48 },
    shadow: { type: Boolean, default: true },
    glow: { type: Boolean, default: false }
  },
  typographySettings: {
    font: {
      type: String,
      default: "system",
      enum: ["system", "inter", "orbitron", "rubik", "poppins", "press-start", "pixelify", "chakra", "outfit"]
    },
    fontWeight: { type: String, default: "bold", enum: ["light", "normal", "medium", "semibold", "bold", "extrabold", "black"] },
    fontSize: { type: String, default: "md" },
    fontSizeScale: { type: Number, default: 100, min: 50, max: 250 },
    nameScale: { type: Number, default: 100, min: 50, max: 250 },
    counterScale: { type: Number, default: 100, min: 50, max: 250 },
    detailsScale: { type: Number, default: 100, min: 50, max: 250 },
    italic: { type: Boolean, default: false },
    letterSpacing: { type: String, default: "normal", enum: ["tight", "normal", "wide"] },
    textTransform: { type: String, default: "none", enum: ["none", "uppercase"] }
  },
  animationSettings: {
    enableAnimations: { type: Boolean, default: true },
    huntSwitch: { type: String, default: "fade", enum: ["fade", "slide", "scale", "none"] },
    counterIncrement: { type: String, default: "pop", enum: ["pop", "pulse", "none"] },
    shinyCelebration: { type: Boolean, default: true },
    phaseAlert: { type: Boolean, default: true },
    failAlert: { type: Boolean, default: true },
    animationSpeed: { type: String, default: "normal", enum: ["fast", "normal", "slow"] }
  },
  pausedBehavior: {
    type: String,
    default: "visible-indicator",
    enum: ["visible-indicator", "visible-no-indicator", "hide"]
  },
  idleBehavior: {
    type: String,
    default: "hide",
    enum: ["hide", "show-idle"]
  },
  activePresetId: {
    type: String,
    default: "classic-horizontal"
  },
  elementStyles: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  }
}, { timestamps: true, strict: false });

const StreamerOverlay = mongoose.model("StreamerOverlay", streamerOverlaySchema);
export default StreamerOverlay;
