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
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  caughtPokemon: {
    type: Map,
    of: new mongoose.Schema({
      caught: Boolean,
      entries: [{
        ball: String,
        mark: String,
        method: String,
        game: String,
        checks: Number,
        time: Number,
        date: String,
        notes: String,
        entryId: { type: String, default: () => Math.random().toString(36).substr(2, 9) },
        modifiers: {
          shinyCharm: Boolean,
          shinyParents: Boolean,
          lureActive: Boolean,
          researchLv10: Boolean,
          perfectResearch: Boolean,
          sparklingLv1: Boolean,
          sparklingLv2: Boolean,
          sparklingLv3: Boolean,
          eventBoosted: Boolean,
          communityDay: Boolean,
          raidDay: Boolean,
          researchDay: Boolean,
          galarBirds: Boolean,
          hatchDay: Boolean
        }
      }]
    }, { _id: false }),
    default: new Map(),
  },
  progressBars: {
    type: [ProgressBarSchema],
    default: [],
  },
  verificationCode: String,
  verificationCodeExpires: Date,
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
  profileTrainer: String,
  isProfilePublic: { type: Boolean, default: true },
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
    blockUnobtainableShinies: { type: Boolean, default: false },
    blockGOAndNOOTExclusiveShinies: { type: Boolean, default: false },
  },
  // EXTERNAL LINK PREFERENCE ----------------------------------------- //
  externalLinkPreference: { type: String, default: 'serebii', enum: ['serebii', 'bulbapedia', 'pokemondb', 'smogon'] },
  // SHINY CHARM GAMES ----------------------------------------- //
  shinyCharmGames: { type: [String], default: [] },
  // ADMIN STATUS ----------------------------------------- //
  isAdmin: { type: Boolean, default: false },
  // DELETE ACCOUNT CODE ----------------------------------------- //
  deleteCodeHash: { type: String, default: null },
  deleteCodeExpires: { type: Date, default: null },
  // USERNAME COOLDOWN ----------------------------------------- //
  usernameLastChanged: { type: Date, default: null },
  // PASSWORD VERIFICATION ------------------------------------- //
  passwordVerificationCode: { type: String, default: null },
  passwordVerificationExpires: { type: Date, default: null },
  // HUNT DATA ----------------------------------------- //
  activeHunts: {
    type: [new mongoose.Schema({
      id: { type: Number, required: true },
      pokemon: {
        id: { type: Number, required: true },
        name: { type: String, required: true },
        formType: { type: String, default: "main" },
        sprites: {
          front_default: String,
          front_shiny: String
        }
      },
      game: { type: String, default: "" },
      ball: { type: String, default: "" },
      mark: { type: String, default: "" },
      method: { type: String, default: "" },
      notes: { type: String, default: "" },
      checks: { type: Number, default: 0 },
      odds: { type: Number, default: null },
      startDate: { type: String, required: true },
      startTime: { type: Number, required: true },
      increment: { type: Number, default: 1 },
      modifiers: {
        type: {
          shinyCharm: { type: Boolean, default: false },
          shinyParents: { type: Boolean, default: false },
          lureActive: { type: Boolean, default: false },
          researchLv10: { type: Boolean, default: false },
          perfectResearch: { type: Boolean, default: false },
          sparklingLv1: { type: Boolean, default: false },
          sparklingLv2: { type: Boolean, default: false },
          sparklingLv3: { type: Boolean, default: false }
        },
        default: {
          shinyCharm: false,
          shinyParents: false,
          lureActive: false,
          researchLv10: false,
          perfectResearch: false,
          sparklingLv1: false,
          sparklingLv2: false,
          sparklingLv3: false
        }
      }
    }, { _id: false })],
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
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
