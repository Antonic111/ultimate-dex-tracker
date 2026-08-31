import mongoose from "mongoose";

const stripeEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically prune processed webhook events after 90 days
stripeEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const StripeEvent = mongoose.model("StripeEvent", stripeEventSchema);
export default StripeEvent;
