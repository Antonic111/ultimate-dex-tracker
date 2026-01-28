import app from "../server/app.js";
import { connectToDatabase } from "../server/db.js";

export default async function handler(req, res) {
  await connectToDatabase();
  return app(req, res);
}
