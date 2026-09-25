/* global process */
/**
 * Supabase Realtime Broadcast Utility (Server-Side)
 * Dispatches lightweight realtime notification events to Supabase Realtime via HTTP REST.
 *
 * Why REST?
 * In Vercel serverless environments, long-lived WebSockets or EventEmitters cannot be maintained.
 * This REST call completes statelessly in ~20-40ms and triggers Supabase's edge to push
 * the update directly over WebSockets to all connected OBS Browser Sources.
 */

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  const cleanUrl = url.endsWith("/") ? url.slice(0, -1) : url;
  return { url: cleanUrl, key };
};

const maskToken = (token) => (token && token.length > 8 ? `${token.slice(0, 4)}...${token.slice(-4)}` : "***");

/**
 * Broadcasts an overlay event to all connected OBS browser sources listening to this overlay token.
 *
 * @param {string} overlayToken - The 32-character hex token representing the user's overlay.
 * @param {object} eventData - Payload metadata (e.g. { type: 'HUNT_DATA_CHANGED', action: { type: 'INCREMENT' } })
 */
export async function broadcastToOverlay(overlayToken, eventData = {}) {
  if (!overlayToken) return;

  const masked = maskToken(overlayToken);
  if (process.env.NODE_ENV === "development") {
    console.log(`[Overlay Realtime] notifying token: ${masked}`);
    console.log(`[Overlay Realtime] channel: overlay:${masked}`);
  }

  const config = getSupabaseConfig();
  if (!config) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[Overlay Realtime] Skipped broadcast: SUPABASE_URL / SUPABASE_ANON_KEY not configured in env."
      );
    }
    return;
  }

  const payload = {
    ...eventData,
    overlayToken,
    timestamp: Date.now(),
  };

  try {
    const endpoint = `${config.url}/realtime/v1/api/broadcast`;

    const body = JSON.stringify({
      messages: [
        {
          topic: `overlay:${overlayToken}`,
          event: "overlay_update",
          payload,
        },
        {
          topic: `realtime:overlay:${overlayToken}`,
          event: "overlay_update",
          payload,
        },
      ],
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
      },
      body,
    });

    if (process.env.NODE_ENV === "development") {
      if (response.ok) {
        console.log(`[Overlay Realtime] Supabase broadcast status: ${response.status}`);
      } else {
        const errText = await response.text().catch(() => "");
        console.warn(`[Overlay Realtime] Supabase broadcast failed HTTP ${response.status}: ${errText}`);
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Overlay Realtime] Error broadcasting overlay event:", err.message);
    }
  }
}
