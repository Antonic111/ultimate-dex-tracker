import mongoose from "mongoose";

const userEntitlementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    entitlement: {
      type: String,
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["subscription", "purchase", "promotion", "admin"],
      required: true,
      index: true,
    },
    sourceId: {
      type: String,
      default: null,
      index: true,
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly resolve user's entitlement status
userEntitlementSchema.index({ userId: 1, entitlement: 1, isActive: 1 });

const UserEntitlement = mongoose.model("UserEntitlement", userEntitlementSchema);
export default UserEntitlement;
