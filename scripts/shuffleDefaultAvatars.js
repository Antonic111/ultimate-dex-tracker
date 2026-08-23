import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectToDatabase } from "../server/db.js";
import User from "../server/models/User.js";

dotenv.config();
dotenv.config({ path: ".env.local" });

const ALL_DEFAULT_AVATARS = [
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

// Fisher-Yates shuffle helper
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function shuffleExistingDefaultAvatars() {
  try {
    await connectToDatabase();

    // Select all accounts except those with custom uploads
    const users = await User.find({
      $or: [
        { avatar: { $regex: /^\/data\/default_profile_pictures\// } },
        { avatar: { $regex: /trainer_sprites/ } },
        { avatar: null },
        { avatar: "" },
        { avatar: { $exists: false } },
        { avatar: "/avatar.png" }
      ]
    }).select("_id username avatar");

    console.log(`[Shuffle] Found ${users.length} accounts using default avatars.`);

    if (users.length === 0) {
      console.log("[Shuffle] No accounts to shuffle.");
      return;
    }

    // Shuffle the list of users to ensure random assignment
    const shuffledUsers = shuffleArray(users);

    let updatedCount = 0;
    for (let i = 0; i < shuffledUsers.length; i++) {
      const user = shuffledUsers[i];
      // Round-robin distribution across all 17 default avatars for maximum evenness
      const newAvatar = ALL_DEFAULT_AVATARS[i % ALL_DEFAULT_AVATARS.length];

      await User.updateOne(
        { _id: user._id },
        { $set: { avatar: newAvatar } }
      );
      updatedCount++;
    }

    console.log(`[Shuffle] Successfully rotated and distributed all 17 default pictures across ${updatedCount} accounts!`);
  } catch (err) {
    console.error("[Shuffle] Error during avatar shuffle:", err);
  }
}

if (process.argv[1] && process.argv[1].endsWith("shuffleDefaultAvatars.js")) {
  shuffleExistingDefaultAvatars().then(() => {
    mongoose.disconnect();
    process.exit(0);
  });
}
