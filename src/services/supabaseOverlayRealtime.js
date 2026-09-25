import { createClient } from "@supabase/supabase-js";

let supabaseClient = null;

const maskToken = (token) => (token && token.length > 8 ? `${token.slice(0, 4)}...${token.slice(-4)}` : "***");

/**
 * Get or create the singleton Supabase client for the browser.
 * Uses public Vite environment variables.
 */
export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (import.meta.env.DEV) {
      console.warn(
        "[Overlay Realtime] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not defined. Realtime push is disabled."
      );
    }
    return null;
  }

  try {
    if (import.meta.env.DEV) {
      console.log("[Overlay Realtime] creating client");
    }
    supabaseClient = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return supabaseClient;
  } catch (err) {
    console.error("[Overlay Realtime] Failed to initialize client:", err);
    return null;
  }
}

/**
 * Subscribes an OBS Browser Source to push notifications for a specific overlay token.
 *
 * @param {string} token - The public overlay token
 * @param {object} callbacks
 * @param {function} callbacks.onEvent - Called when an overlay update broadcast is received
 * @param {function} [callbacks.onReconnect] - Called when connection is restored after an interruption
 * @param {function} [callbacks.onStatusChange] - Called on subscription state changes
 * @returns {function} Unsubscribe cleanup function
 */
export function subscribeToOverlayRealtime(token, { onEvent, onReconnect, onStatusChange } = {}) {
  if (!token) return () => {};

  const client = getSupabaseClient();
  if (!client) return () => {};

  const masked = maskToken(token);
  const channelName = `overlay:${token}`;
  let wasPreviouslySubscribed = false;

  if (import.meta.env.DEV) {
    console.log(`[Overlay Realtime] subscribing to overlay:${masked}`);
  }

  const channel = client.channel(channelName, {
    config: {
      broadcast: {
        self: false,
      },
    },
  });

  // Listen for broadcast events
  channel.on("broadcast", { event: "overlay_update" }, (response) => {
    const payload = response?.payload || {};
    if (import.meta.env.DEV) {
      console.log(`[Overlay Realtime] event received: ${payload.type || "unknown"}`);
    }
    if (typeof onEvent === "function") {
      onEvent(payload);
    }
  });

  // Also support generic wildcard if emitted differently
  channel.on("broadcast", { event: "*" }, (response) => {
    if (response?.event !== "overlay_update") {
      const payload = response?.payload || {};
      if (import.meta.env.DEV) {
        console.log(`[Overlay Realtime] event received: ${payload.type || "unknown"}`);
      }
      if (typeof onEvent === "function") {
        onEvent(payload);
      }
    }
  });

  channel.subscribe((status, error) => {
    if (import.meta.env.DEV) {
      console.log(`[Overlay Realtime] status: ${status}`, error || "");
    }

    if (typeof onStatusChange === "function") {
      onStatusChange(status, error);
    }

    if (status === "SUBSCRIBED") {
      if (wasPreviouslySubscribed && typeof onReconnect === "function") {
        if (import.meta.env.DEV) {
          console.log("[Overlay Realtime] Reconnected. Triggering snapshot refresh.");
        }
        onReconnect();
      }
      wasPreviouslySubscribed = true;
    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
      if (import.meta.env.DEV) {
        console.warn(`[Overlay Realtime] Channel disconnected: ${status}`);
      }
    }
  });

  return () => {
    if (import.meta.env.DEV) {
      console.log(`[Overlay Realtime] unsubscribing from overlay:${masked}`);
    }
    client.removeChannel(channel);
  };
}
