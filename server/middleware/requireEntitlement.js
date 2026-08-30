import { hasUserEntitlement } from "../utils/entitlementService.js";

/**
 * Express middleware to protect routes requiring a specific entitlement.
 * @param {string} entitlementKey - Entitlement string (e.g. "premium", "advanced_overlay_editor")
 */
export function requireEntitlement(entitlementKey) {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const hasAccess = await hasUserEntitlement(req.userId, entitlementKey);
      if (!hasAccess) {
        return res.status(403).json({
          error: "Entitlement required",
          code: "ENTITLEMENT_REQUIRED",
          requiredEntitlement: entitlementKey,
        });
      }

      next();
    } catch (err) {
      console.error(`Error in requireEntitlement(${entitlementKey}):`, err);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
