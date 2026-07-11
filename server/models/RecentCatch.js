import mongoose from "mongoose";

const recentCatchSchema = new mongoose.Schema({
  pokemonName: { type: String, required: true },
  formName: { type: String, default: null },
  sprite: { type: String, required: true },
  username: { type: String, required: true },
  profileTrainer: { type: String, default: null },
  caughtAt: { type: Date, default: Date.now }
});

// Use a capped collection in production if desired, but regular works fine since we just query limit 25
// recentCatchSchema.index({ caughtAt: -1 });

const RecentCatch = mongoose.model("RecentCatch", recentCatchSchema);
export default RecentCatch;
