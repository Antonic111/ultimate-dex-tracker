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
        date: String,
        notes: String,
        entryId: { type: String, default: () => Math.random().toString(36).substr(2, 9) }
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
  },
  // DELETE ACCOUNT CODE ----------------------------------------- //
  deleteCodeHash: { type: String, default: null },
  deleteCodeExpires: { type: Date, default: null },
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
