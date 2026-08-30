import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: [
        "subscription",
        "cosmetic",
        "bundle",
        "theme",
        "badge",
        "frame",
        "background",
        "overlay",
        "other",
      ],
      required: true,
      index: true,
    },
    category: {
      type: String,
      default: "membership",
      index: true,
    },
    billingInterval: {
      type: String,
      enum: ["month", "year", "one_time", null],
      default: null,
    },
    defaultPrice: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
    },
    paddleProductId: {
      type: String,
      default: null,
    },
    paddlePriceId: {
      type: String,
      default: null,
    },
    entitlements: {
      type: [String],
      default: [],
    },
    isAvailable: {
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

const Product = mongoose.model("Product", productSchema);
export default Product;
