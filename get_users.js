import dotenv from "dotenv";
dotenv.config();
import { connectToDatabase } from "./server/db.js";
import User from "./server/models/User.js";

async function run() {
  await connectToDatabase();
  console.log("Connected to database");
  const u = await User.findOne({
    username: "Brandy",
    isProfilePublic: { $ne: false }
  })
    .select("username bio location gender favoriteGames favoritePokemon favoritePokemonShiny profileTrainer createdAt switchFriendCode progressBars likes verified dexPreferences shinyCharmGames isAdmin bingoGrid isContentCreator youtubeUrl twitchUrl")
    .lean();
  console.log("Brandy public profile:", JSON.stringify(u, null, 2));
  process.exit(0);
}

run().catch(console.error);
