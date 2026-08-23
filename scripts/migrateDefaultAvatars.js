import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectToDatabase } from "../server/db.js";
import User from "../server/models/User.js";

dotenv.config();
dotenv.config({ path: ".env.local" });

const NAMED_DEFAULTS = [
  "/data/default_profile_pictures/butterfree.png",
  "/data/default_profile_pictures/celebi.png",
  "/data/default_profile_pictures/charizard.png",
  "/data/default_profile_pictures/ditto.png",
  "/data/default_profile_pictures/gardevoir.png",
  "/data/default_profile_pictures/gengar.png",
  "/data/default_profile_pictures/guzzlord.png",
  "/data/default_profile_pictures/gyarados.png",
  "/data/default_profile_pictures/lucario.png",
  "/data/default_profile_pictures/metagross.png",
  "/data/default_profile_pictures/mew.png",
  "/data/default_profile_pictures/mewtwo.png",
  "/data/default_profile_pictures/noctowl.png",
  "/data/default_profile_pictures/pikachu.png",
  "/data/default_profile_pictures/psyduck.png",
  "/data/default_profile_pictures/rayquaza.png",
  "/data/default_profile_pictures/shaymin.png"
];

const LEGACY_MAP = {
  "/data/default_profile_pictures/default1.png": "/data/default_profile_pictures/charizard.png",
  "/data/default_profile_pictures/default2.png": "/data/default_profile_pictures/gengar.png",
  "/data/default_profile_pictures/default3.png": "/data/default_profile_pictures/lucario.png",
  "/data/default_profile_pictures/default4.png": "/data/default_profile_pictures/mew.png",
  "/data/default_profile_pictures/default5.png": "/data/default_profile_pictures/mewtwo.png",
  "/data/default_profile_pictures/default6.png": "/data/default_profile_pictures/pikachu.png",
  "/data/default_profile_pictures/default7.png": "/data/default_profile_pictures/rayquaza.png"
};

export async function migrateAvatars() {
  try {
    await connectToDatabase();

    // Find users who have no custom avatar, legacy trainer avatar, or old numbered default avatar
    const usersToUpdate = await User.find({
      $or: [
        { avatar: null },
        { avatar: "" },
        { avatar: { $exists: false } },
        { avatar: { $regex: /trainer_sprites/ } },
        { avatar: "/avatar.png" },
        { avatar: { $regex: /default[1-7]\.png/ } }
      ]
    }).select("_id username avatar");

    if (usersToUpdate.length === 0) {
      console.log("[Migration] All users already have valid named avatars assigned.");
      return;
    }

    console.log(`[Migration] Found ${usersToUpdate.length} users needing updated default profile pictures...`);

    let updatedCount = 0;
    for (const user of usersToUpdate) {
      let targetAvatar = LEGACY_MAP[user.avatar];
      if (!targetAvatar) {
        const randomIndex = Math.floor(Math.random() * NAMED_DEFAULTS.length);
        targetAvatar = NAMED_DEFAULTS[randomIndex];
      }

      await User.updateOne(
        { _id: user._id },
        { $set: { avatar: targetAvatar } }
      );
      updatedCount++;
    }

    console.log(`[Migration] Successfully updated default profile pictures for ${updatedCount} users.`);
  } catch (err) {
    console.error("[Migration] Error migrating default avatars:", err);
  }
}

// Allow standalone execution: node scripts/migrateDefaultAvatars.js
if (process.argv[1] && process.argv[1].endsWith("migrateDefaultAvatars.js")) {
  migrateAvatars().then(() => {
    mongoose.disconnect();
    process.exit(0);
  });
}
