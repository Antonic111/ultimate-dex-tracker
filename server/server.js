import app from "./app.js";
import { connectToDatabase } from "./db.js";
import { migrateAvatars } from "../scripts/migrateDefaultAvatars.js";

const PORT = process.env.PORT || 5000;

connectToDatabase()
  .then(() => {
    migrateAvatars().catch((e) => console.error("Avatar migration error:", e));
    app.listen(PORT, "0.0.0.0", () => {
      // server running log minimized
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Add error handling
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err);
  console.error('🔥 Stack trace:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION:', reason);
  console.error('🔥 Promise:', promise);
});

process.on('SIGTERM', (signal) => {
  console.error('🔥 SIGTERM RECEIVED:', signal);
});

process.on('SIGINT', (signal) => {
  console.error('🔥 SIGINT RECEIVED:', signal);
});
