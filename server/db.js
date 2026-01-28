import mongoose from "mongoose";

const globalCache = globalThis.__mongooseCache || {
  conn: null,
  promise: null,
};

globalThis.__mongooseCache = globalCache;

export async function connectToDatabase() {
  if (globalCache.conn) return globalCache.conn;
  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((mongooseInstance) => mongooseInstance);
  }
  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}
