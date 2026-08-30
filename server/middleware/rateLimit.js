import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 60, // 60 requests per 15 minutes in production, effectively unlimited in development
  handler: (req, res) => {
    const now = Date.now();
    const windowStart = Math.floor(now / (15 * 60 * 1000)) * (15 * 60 * 1000);
    const windowEnd = windowStart + (15 * 60 * 1000);
    const remainingMs = windowEnd - now;
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    
    res.status(429).json({
      success: false,
      message: `Too many login attempts. Please wait ${remainingMinutes} minutes before trying again.`,
      remainingMinutes: remainingMinutes
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 150, // 150 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
});

