// middleware/authenticateUser.js
import jwt from "jsonwebtoken";

export function authenticateUser(req, res, next) {
  // Check for token in cookies first (normal flow)
  let token = req.cookies.token;
  
  // If no cookie token, check Authorization header (iPhone fallback)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
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
