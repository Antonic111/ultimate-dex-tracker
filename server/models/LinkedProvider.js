import mongoose from "mongoose";

const linkedProviderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["google", "discord"],
      required: true,
    },
    providerAccountId: {
      type: String,
      required: true,
    },
    providerEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    displayName: {
      type: String,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    linkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One Google/Discord account can only be linked to ONE website account
linkedProviderSchema.index(
  { provider: 1, providerAccountId: 1 },
  { unique: true }
);

const LinkedProvider = mongoose.model("LinkedProvider", linkedProviderSchema);
export default LinkedProvider;
