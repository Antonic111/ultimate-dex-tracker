import jwt from "jsonwebtoken";
import crypto from "crypto";

const STATE_TTL = 10 * 60; // 10 minutes in seconds

const getStateSecret = () => process.env.JWT_SECRET || "default_jwt_fallback_secret";

/**
 * Generate a signed OAuth state token.
 * @param {object} payload  - e.g. { action: 'login' | 'link', userId?: string }
 * @returns {string} signed JWT state string
 */
export function generateOAuthState(payload = {}) {
  const nonce = crypto.randomBytes(16).toString("hex");
  return jwt.sign({ ...payload, nonce }, getStateSecret(), { expiresIn: STATE_TTL });
}

/**
 * Validate and decode an OAuth state token.
 * @param {string} state
 * @returns {object} decoded payload
 * @throws if invalid or expired
 */
export function verifyOAuthState(state) {
  if (!state || typeof state !== "string") {
    throw new Error("Missing or invalid state parameter");
  }
  try {
    return jwt.verify(state, getStateSecret());
  } catch (err) {
    throw new Error("OAuth state is invalid or expired. Please try again.");
  }
}

