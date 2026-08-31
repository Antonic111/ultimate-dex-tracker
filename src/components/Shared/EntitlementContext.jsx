import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "./UserContext";
import { buildApiUrl } from "../../config/api";

const EntitlementContext = createContext({
  entitlements: [],
  subscription: null,
  isPremium: false,
  isEligibleForIntroDiscount: true,
  loading: true,
  hasEntitlement: () => false,
  refreshStatus: async () => {},
});

export function EntitlementProvider({ children }) {
  const { user } = useUser();
  const [entitlements, setEntitlements] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isEligibleForIntroDiscount, setIsEligibleForIntroDiscount] = useState(true);
  const [loading, setLoading] = useState(true);
  const initialLoadedRef = useRef(false);

  const fetchStatus = useCallback(async (silent = false) => {
    if (!user?.username) {
      setEntitlements([]);
      setSubscription(null);
      setIsPremium(false);
      setIsEligibleForIntroDiscount(true);
      setLoading(false);
      return null;
    }

    try {
      // Only show full loading state on initial load, never during background polling
      if (!silent && !initialLoadedRef.current) {
        setLoading(true);
      }

      const token = localStorage.getItem("authToken");
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(buildApiUrl("/monetization/status"), {
        credentials: "include",
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        setEntitlements(data.entitlements || []);
        setSubscription(data.subscription || null);
        setIsPremium(Boolean(data.isPremium));
        setIsEligibleForIntroDiscount(data.isEligibleForIntroDiscount !== undefined ? Boolean(data.isEligibleForIntroDiscount) : true);
        initialLoadedRef.current = true;
        return data;
      } else {
        setEntitlements([]);
        setSubscription(null);
        setIsPremium(false);
        setIsEligibleForIntroDiscount(true);
        return null;
      }
    } catch (err) {
      console.error("Error fetching entitlement status:", err);
      return null;
    } finally {
      setLoading(false);
      initialLoadedRef.current = true;
    }
  }, [user?.username]);

  useEffect(() => {
    fetchStatus(false);
  }, [fetchStatus]);

  const hasEntitlement = useCallback(
    (key) => {
      if (!key) return false;
      return entitlements.includes(key);
    },
    [entitlements]
  );

  return (
    <EntitlementContext.Provider
      value={{
        entitlements,
        subscription,
        isPremium,
        isEligibleForIntroDiscount,
        loading,
        hasEntitlement,
        refreshStatus: (silent = true) => fetchStatus(silent),
      }}
    >
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlements() {
  const context = useContext(EntitlementContext);
  if (context === undefined) {
    throw new Error("useEntitlements must be used within an EntitlementProvider");
  }
  return context;
}
