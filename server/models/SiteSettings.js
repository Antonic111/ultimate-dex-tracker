import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema({
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceStartTime: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);
export default SiteSettings;
