import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    default: "announcement",
    enum: ["announcement", "system", "event", "update"]
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1500
  },
  priority: {
    type: String,
    default: "normal",
    enum: ["normal", "important", "alert"]
  },
  link: {
    type: String,
    default: "",
    trim: true,
    maxlength: 300
  },
  createdBy: {
    type: String,
    default: "Admin"
  },
  creatorTrainer: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    default: null
  }
});

export default mongoose.model("Notification", notificationSchema);
