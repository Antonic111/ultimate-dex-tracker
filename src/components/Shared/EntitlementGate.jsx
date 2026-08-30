import { useEntitlements } from "./EntitlementContext";

/**
 * EntitlementGate
 * Declarative component for conditional rendering based on entitlement access.
 * Does not lock or block features currently, but provides infrastructure for future gates.
 */
export default function EntitlementGate({
  entitlement,
  children,
  fallback = null,
}) {
  const { hasEntitlement, loading } = useEntitlements();

  if (loading) return null;

  if (hasEntitlement(entitlement)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
