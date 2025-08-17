import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // 10 requests per 10 minutes
  handler: (req, res) => {
    // Calculate remaining time based on when the window resets
    const now = Date.now();
    const windowStart = Math.floor(now / (10 * 60 * 1000)) * (10 * 60 * 1000);
    const windowEnd = windowStart + (10 * 60 * 1000);
    const remainingMs = windowEnd - now;
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    
    res.status(429).json({
      success: false,
      message: `Too many requests. Please wait ${remainingMinutes} minutes before trying again.`,
      remainingMinutes: remainingMinutes
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
