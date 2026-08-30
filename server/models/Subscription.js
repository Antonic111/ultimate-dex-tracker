import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      default: "paddle",
      required: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    subscriptionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    priceId: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      default: "membership_premium_monthly",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "trialing", "past_due", "paused", "canceled", "deleted"],
      default: "active",
      required: true,
      index: true,
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
      index: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    canceledAt: {
      type: Date,
      default: null,
    },
    pausedAt: {
      type: Date,
      default: null,
    },
    managementUrls: {
      updatePaymentMethod: { type: String, default: null },
      cancel: { type: String, default: null },
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

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
