// middleware/authenticateUser.js
import jwt from "jsonwebtoken";

export function authenticateUser(req, res, next) {
  // Prefer Authorization header to avoid stale cookies
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // Fallback to cookie token if no header provided
  if (!token) {
    token = req.cookies.token;
  }
  
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
