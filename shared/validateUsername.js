import { validateContent } from "./contentFilter.js";

/**
 * Validates a username using the unified content filter.
 * @param {string} username
 * @returns {string | false} Returns an error string if invalid, or false if valid.
 */
export function isBadUsername(username) {
  const result = validateContent(username, "username");
  return result.isValid ? false : result.error;
}
