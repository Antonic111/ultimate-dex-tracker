const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/ultimate-dex-tracker');
  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  
  const u = await User.findOne({
      username: "anton", // assuming user is anton
      isProfilePublic: { $ne: false }
  })
  .select("username bio location gender favoriteGames favoritePokemon favoritePokemonShiny profileTrainer createdAt switchFriendCode progressBars likes verified dexPreferences shinyCharmGames isAdmin bingoGrid isContentCreator youtubeUrl twitchUrl")
  .lean();

  console.log(JSON.stringify(u, null, 2));
  process.exit(0);
}
test().catch(console.error);
