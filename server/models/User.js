import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ProgressBarSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  filters: { type: Object, default: {} },
  visible: { type: Boolean, default: true }
}, { _id: false });


const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 15,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: false, // Optional: OAuth-only users won't have a password
    default: null,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  caughtPokemon: {
    type: Map,
    of: new mongoose.Schema({
      caught: Boolean,
      caughtAt: Number,
      entries: [{
        nickname: String,
        ball: String,
        marks: [String],
        mark: String,
        method: String,
        evolvedFromMethod: String,
        game: String,
        checks: Number,
        totalChecks: Number,
        time: Number,
        elapsedMs: Number,
        phases: [mongoose.Schema.Types.Mixed],
        fails: [mongoose.Schema.Types.Mixed],
        phaseCount: Number,
        date: String,
        notes: String,
        entryId: { type: String, default: () => Math.random().toString(36).substr(2, 9) },
        isHuntTracker: Boolean,
        chartData: { type: mongoose.Schema.Types.Mixed, default: {} },
        chartConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
        modifiers: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        }
      }]
    }, { _id: false, strict: false }),
    default: new Map(),
  },
  progressBars: {
    type: [ProgressBarSchema],
    default: [],
  },
  verificationCode: String,
  verificationCodeExpires: Date,
  previousVerificationCode: String,
  previousVerificationCodeExpires: Date,
  resetCode: String,
  resetCodeExpires: Date,
  // PROFILE STUFF ----------------------------------------- //
  location: String,
  gender: String,
  bio: String,
  favoriteGames: [String],
  favoritePokemon: [String],
  favoritePokemonShiny: [Boolean],
  switchFriendCode: String,
  goFriendCode: String,
  profileTrainer: String,
  avatar: {
    type: String,
    default: () => {
      const defaults = [
        "/data/default_profile_pictures/butterfree.png",
        "/data/default_profile_pictures/celebi.png",
        "/data/default_profile_pictures/charizard.png",
        "/data/default_profile_pictures/ditto.png",
        "/data/default_profile_pictures/gardevoir.png",
        "/data/default_profile_pictures/gengar.png",
        "/data/default_profile_pictures/guzzlord.png",
        "/data/default_profile_pictures/gyarados.png",
        "/data/default_profile_pictures/lucario.png",
        "/data/default_profile_pictures/metagross.png",
        "/data/default_profile_pictures/mew.png",
        "/data/default_profile_pictures/mewtwo.png",
        "/data/default_profile_pictures/noctowl.png",
        "/data/default_profile_pictures/pikachu.png",
        "/data/default_profile_pictures/psyduck.png",
        "/data/default_profile_pictures/rayquaza.png",
        "/data/default_profile_pictures/shaymin.png"
      ];
      return defaults[Math.floor(Math.random() * defaults.length)];
    }
  },
  isProfilePublic: { type: Boolean, default: true },
  isGlobalFeedPublic: { type: Boolean, default: true },
  isLeaderboardPublic: { type: Boolean, default: true },
  isFriendCodesPublic: { type: Boolean, default: true },
  isStatsPublic: { type: Boolean, default: true },
  lastActiveAt: { type: Date, default: Date.now },
  // LIKES ----------------------------------------- //
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // DEX PREFERENCES ----------------------------------------- //
  dexPreferences: {
    showGenderForms: { type: Boolean, default: true },
    showAlolanForms: { type: Boolean, default: true },
    showGalarianForms: { type: Boolean, default: true },
    showHisuianForms: { type: Boolean, default: true },
    showPaldeanForms: { type: Boolean, default: true },
    showGmaxForms: { type: Boolean, default: true },
    showUnownForms: { type: Boolean, default: true },
    showOtherForms: { type: Boolean, default: true },
    // Newly added
    showAlcremieForms: { type: Boolean, default: true },
    showVivillonForms: { type: Boolean, default: true },
    showAlphaForms: { type: Boolean, default: true },
    showAlphaOtherForms: { type: Boolean, default: true },
    showMightyForms: { type: Boolean, default: true },
    blockUnobtainableShinies: { type: Boolean, default: false },
    blockGOExclusiveShinies: { type: Boolean, default: false },
    blockNOOTExclusiveShinies: { type: Boolean, default: false },
    hideLockedShinies: { type: Boolean, default: false },
    useHomeSprites: { type: Boolean, default: false },
    dexViewMode: { type: String, default: 'categorized', enum: ['categorized', 'unified'] },
  },
  // EXTERNAL LINK PREFERENCE ----------------------------------------- //
  externalLinkPreference: { type: String, default: 'serebii', enum: ['serebii', 'bulbapedia', 'pokemondb', 'smogon'] },
  // APPEARANCE PREFERENCES ----------------------------------------- //
  accentColor: { type: String, default: 'yellow', enum: ['yellow', 'red', 'orange', 'green', 'lime', 'blue', 'cyan', 'purple', 'lavender', 'pink', 'brown', 'platinum'] },
  siteTheme: { type: String, default: 'dark', enum: ['light', 'dark', 'system'] },
  // SHINY CHARM GAMES ----------------------------------------- //
  shinyCharmGames: { type: [String], default: [] },
  // HUNT SETTINGS ----------------------------------------- //
  huntHotkey: { type: String, default: "a" },
  // BINGO GRID ----------------------------------------- //
  bingoGrid: {
    type: [{
      id: Number,
      text: String,
      completed: Boolean,
      pokemon: Object,
      pokemonList: [Object],
      game: String
    }],
    default: []
  },
  // ADMIN STATUS ----------------------------------------- //
  isAdmin: { type: Boolean, default: false },
  // CONTENT CREATOR STATUS ----------------------------------------- //
  isContentCreator: { type: Boolean, default: false },
  youtubeUrl: { type: String, default: null },
  twitchUrl: { type: String, default: null },
  // SUSPENSION STATUS ------------------------------------- //
  isSuspended: { type: Boolean, default: false },
  suspendedReason: { type: String, default: null },
  // NOTIFICATION STATUS ----------------------------------- //
  readNotifications: { type: [String], default: [] },
  deletedNotifications: { type: [String], default: [] },
  // DELETE ACCOUNT CODE ----------------------------------------- //
  deleteCodeHash: { type: String, default: null },
  deleteCodeExpires: { type: Date, default: null },
  // RESET COLLECTION DATA CODE ----------------------------------------- //
  resetCollectionCodeHash: { type: String, default: null },
  resetCollectionCodeExpires: { type: Date, default: null },
  // USERNAME COOLDOWN ----------------------------------------- //
  usernameLastChanged: { type: Date, default: null },
  // PASSWORD VERIFICATION ------------------------------------- //
  passwordVerificationCode: { type: String, default: null },
  passwordVerificationExpires: { type: Date, default: null },
  // EMAIL CHANGE VERIFICATION ------------------------------------- //
  emailChangeVerificationCode: { type: String, default: null },
  emailChangeVerificationExpires: { type: Date, default: null },
  emailChangeVerified: { type: Boolean, default: false },
  pendingEmail: { type: String, default: null },
  newEmailVerificationCode: { type: String, default: null },
  newEmailVerificationExpires: { type: Date, default: null },
  // HUNT DATA ----------------------------------------- //
  activeHunts: {
    type: [new mongoose.Schema({
      id: { type: mongoose.Schema.Types.Mixed, required: true },
      huntId: { type: mongoose.Schema.Types.Mixed },
      version: { type: Number, default: 1 },
      pokemon: { type: mongoose.Schema.Types.Mixed, default: {} },
      game: { type: String, default: "" },
      ball: { type: String, default: "" },
      mark: { type: String, default: "" },
      method: { type: String, default: "" },
      notes: { type: String, default: "" },
      checks: { type: Number, default: 0 },
      odds: { type: Number, default: null },
      startDate: { type: String, default: () => new Date().toISOString() },
      startedAt: { type: Number },
      startTime: { type: Number },
      pausedAt: { type: Number, default: null },
      totalPausedMs: { type: Number, default: 0 },
      status: { type: String, default: "running" },
      isPaused: { type: Boolean, default: false },
      lastCheckAt: { type: Number },
      increment: { type: Number, default: 1 },
      currentPhase: { type: Number, default: 1 },
      phases: { type: [mongoose.Schema.Types.Mixed], default: [] },
      fails: { type: [mongoose.Schema.Types.Mixed], default: [] },
      possiblePhases: { type: [mongoose.Schema.Types.Mixed], default: [] },
      modifiers: { type: mongoose.Schema.Types.Mixed, default: {} },
      stats: { type: mongoose.Schema.Types.Mixed, default: {} },
      updatedAt: { type: Number }
    }, { _id: false, strict: false })],
    default: []
  },
  huntTimers: {
    type: Map,
    of: Number,
    default: new Map()
  },
  lastCheckTimes: {
    type: Map,
    of: Number,
    default: new Map()
  },
  totalCheckTimes: {
    type: Map,
    of: Number,
    default: new Map()
  },
  pausedHunts: {
    type: [Number],
    default: []
  },
  huntIncrements: {
    type: Map,
    of: Number,
    default: new Map()
  },
  currentHuntId: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  mmoSettings: {
    multiCheckEnabled: { type: Boolean, default: false },
    secondSpawn: { type: Number, default: 6 },
    isSaveOrder: { type: Boolean, default: false },
    showSecondWave: { type: Boolean, default: true },
    showGhostChecks: { type: Boolean, default: true },
    isAdvanced: { type: Boolean, default: false },
    legendColors: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  // ONBOARDING STATUS ----------------------------------------- //
  onboarding: {
    type: {
      isComplete: { type: Boolean, default: true },
      tutorialStep: { type: Number, default: 0 }
    },
    default: () => ({ isComplete: true, tutorialStep: 0 })
  },
  needsProfileSetup: {
    type: Boolean,
    default: false
  },
  // Migration tracking
  huntMethodMigrationCompleted: {
    type: Boolean,
    default: false
  },
  migrationVersion: {
    type: String,
    default: "1.0"
  }
}, { timestamps: true });


// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
