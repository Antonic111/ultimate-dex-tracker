import { buildApiUrl } from "../config/api";

/**
 * Paddle Billing v2 Frontend Integration Helper with Stage-by-Stage Diagnostics
 */

let paddlePromise = null;
let cachedConfig = null;
const eventListeners = new Set();

/**
 * Register a listener for Paddle global events.
 * @param {Function} listener
 * @returns {Function} unsubscribe function
 */
export function addPaddleEventListener(listener) {
  eventListeners.add(listener);
  return () => eventListeners.delete(listener);
}

function notifyPaddleEventListeners(eventData) {
  if (import.meta.env.DEV) {
    console.log("[Paddle Debug] [Event]", eventData?.name || "unknown", eventData);
  }
  eventListeners.forEach((listener) => {
    try {
      listener(eventData);
    } catch (e) {
      console.error("[Paddle Debug] Listener error:", e);
    }
  });
}

/**
 * Fetch public Paddle configuration from backend with Vite import.meta.env fallback.
 */
export async function getPaddleConfig() {
  if (cachedConfig) return cachedConfig;

  // Check Vite client env variables as instant fallback
  const viteEnv = import.meta.env.VITE_PADDLE_ENVIRONMENT || "sandbox";
  const viteToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN || "";
  const vitePriceId = import.meta.env.VITE_PADDLE_PREMIUM_MONTHLY_PRICE_ID || "";

  try {
    if (import.meta.env.DEV) {
      console.log("[Paddle Debug] [1/5] Fetching Paddle config from backend /api/monetization/config...");
    }
    const res = await fetch(buildApiUrl("/api/monetization/config"));
    if (!res.ok) throw new Error(`HTTP ${res.status} from monetization config`);
    const serverConfig = await res.json();

    cachedConfig = {
      environment: serverConfig.environment || viteEnv || "sandbox",
      clientToken: serverConfig.clientToken || viteToken || "",
      monthlyPriceId: serverConfig.monthlyPriceId || vitePriceId || "",
      isConfigured: Boolean(
        (serverConfig.clientToken || viteToken) &&
          (serverConfig.monthlyPriceId || vitePriceId)
      ),
    };

    if (import.meta.env.DEV) {
      console.log("[Paddle Debug] [1/5] Config loaded:", {
        environment: cachedConfig.environment,
        hasClientToken: Boolean(cachedConfig.clientToken),
        tokenPrefix: cachedConfig.clientToken
          ? cachedConfig.clientToken.substring(0, 8) + "..."
          : "NONE",
        monthlyPriceId: cachedConfig.monthlyPriceId || "NONE",
        isConfigured: cachedConfig.isConfigured,
      });
    }

    return cachedConfig;
  } catch (err) {
    console.warn("[Paddle Debug] Backend config fetch failed, using fallback:", err);
    cachedConfig = {
      environment: viteEnv,
      clientToken: viteToken,
      monthlyPriceId: vitePriceId,
      isConfigured: Boolean(viteToken && vitePriceId),
    };
    return cachedConfig;
  }
}

/**
 * Dynamically load Paddle.js v2 script and initialize environment & client token.
 */
export async function loadPaddle() {
  if (paddlePromise) return paddlePromise;

  paddlePromise = new Promise(async (resolve, reject) => {
    try {
      const config = await getPaddleConfig();

      if (!config.clientToken) {
        console.warn("[Paddle Debug] PADDLE_CLIENT_TOKEN is not configured.");
      }

      // Check if window.Paddle is already loaded
      if (window.Paddle) {
        if (config.clientToken) {
          if (import.meta.env.DEV) {
            console.log(
              `[Paddle Debug] [2/5] Paddle already present. Initializing ${config.environment}...`
            );
          }
          if (config.environment === "sandbox") {
            window.Paddle.Environment.set("sandbox");
          }
          const initOptions = {
            token: config.clientToken,
            eventCallback: (data) => notifyPaddleEventListeners(data),
          };
          if (config.paddleCustomerId) {
            initOptions.pwCustomer = { id: config.paddleCustomerId };
          }
          window.Paddle.Initialize(initOptions);
        }
        return resolve(window.Paddle);
      }

      if (import.meta.env.DEV) {
        console.log("[Paddle Debug] [2/5] Injecting https://cdn.paddle.com/paddle/v2/paddle.js...");
      }

      const script = document.createElement("script");
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.async = true;

      script.onload = () => {
        if (window.Paddle) {
          if (import.meta.env.DEV) {
            console.log(
              `[Paddle Debug] [3/5] Paddle.js loaded successfully. Calling Initialize()...`
            );
          }
          if (config.clientToken) {
            if (config.environment === "sandbox") {
              window.Paddle.Environment.set("sandbox");
            }
            const initOptions = {
              token: config.clientToken,
              eventCallback: (data) => notifyPaddleEventListeners(data),
            };
            if (config.paddleCustomerId) {
              initOptions.pwCustomer = { id: config.paddleCustomerId };
            }
            window.Paddle.Initialize(initOptions);
          }
          resolve(window.Paddle);
        } else {
          reject(new Error("Paddle.js loaded but window.Paddle is undefined."));
        }
      };

      script.onerror = (err) => {
        console.error("[Paddle Debug] Failed to load Paddle.js script from CDN:", err);
        reject(new Error("Failed to load Paddle script from CDN. Please check network/ad-blocker."));
      };

      document.head.appendChild(script);
    } catch (err) {
      reject(err);
    }
  });

  return paddlePromise;
}

/**
 * Fetch price preview from Paddle.
 */
export async function fetchPaddlePricePreview(priceId) {
  try {
    const paddle = await loadPaddle();
    const config = await getPaddleConfig();
    const targetPriceId = priceId || config.monthlyPriceId;

    if (!targetPriceId) return null;

    if (typeof paddle.PricePreview === "function") {
      const result = await paddle.PricePreview({
        items: [{ priceId: targetPriceId, quantity: 1 }],
      });

      if (result?.data?.details?.lineItems?.[0]) {
        const item = result.data.details.lineItems[0];
        return {
          formattedPrice:
            item.formattedTotals?.total || item.formattedUnitTotals?.total,
          currencyCode: result.data.currencyCode || "USD",
        };
      }
    }
    return null;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[Paddle Debug] Price preview notice (fallback used):", err);
    }
    return null;
  }
}

/**
 * Open Paddle Billing Inline Checkout inside a specified frame target container.
 */
export async function openPaddleInlineCheckout({
  frameTarget = "paddle-checkout-container",
  priceId,
  user,
  theme = "dark",
  customData = {},
  onLoaded,
  onSuccess,
  onClose,
  onError,
}) {
  if (import.meta.env.DEV) {
    console.log(`[Paddle Debug] [4/5] Opening inline checkout targeting: '${frameTarget}'`);
  }

  const paddle = await loadPaddle();
  const config = await getPaddleConfig();

  const finalPriceId = priceId || config.monthlyPriceId;

  if (!finalPriceId) {
    throw new Error(
      "No Paddle Monthly Price ID configured (PADDLE_PREMIUM_MONTHLY_PRICE_ID missing)."
    );
  }

  // Verify target element exists in DOM
  const targetEl =
    document.getElementById(frameTarget) ||
    document.querySelector(`.${frameTarget}`);

  if (!targetEl) {
    console.error(`[Paddle Debug] Target container '${frameTarget}' not found in DOM!`);
    throw new Error(`Target container #${frameTarget} not found in DOM.`);
  }

  // Register one-time / scoped listener for this checkout session
  const unsubscribe = addPaddleEventListener((data) => {
    if (data.name === "checkout.loaded") {
      if (import.meta.env.DEV) console.log("[Paddle Debug] [5/5] checkout.loaded fired!");
      if (onLoaded) onLoaded(data);
    }
    if (data.name === "checkout.completed") {
      if (import.meta.env.DEV) console.log("[Paddle Debug] [5/5] checkout.completed fired!");
      if (onSuccess) onSuccess(data);
    }
    if (data.name === "checkout.closed") {
      if (onClose) onClose(data);
    }
    if (
      data.name === "checkout.error" ||
      data.name === "checkout.payment.failed" ||
      data.name === "checkout.warning"
    ) {
      console.error("[Paddle Debug] Checkout error event:", data);
      if (onError) onError(data);
    }
  });

  const payload = {
    settings: {
      displayMode: "inline",
      frameTarget,
      frameInitialHeight: 480,
      frameStyle:
        "width: 100%; min-width: 280px; background-color: transparent; border: none;",
      theme: theme || "dark",
      successUrl: `${window.location.origin}/membership/checkout?status=processing`,
    },
    items: [
      {
        priceId: finalPriceId,
        quantity: 1,
      },
    ],
    customData: {
      userId: user?._id || user?.id || "",
      username: user?.username || "",
      ...customData,
    },
  };

  if (user?.email) {
    payload.customer = {
      email: user.email,
    };
  }

  if (import.meta.env.DEV) {
    console.log("[Paddle Debug] [4/5] Calling Paddle.Checkout.open() with payload:", {
      priceId: finalPriceId,
      frameTarget,
      hasEmail: Boolean(user?.email),
      userId: user?._id || user?.id || "",
    });
  }

  paddle.Checkout.open(payload);

  return unsubscribe;
}

/**
 * Open Paddle Billing checkout modal (fallback overlay).
 */
export async function openPaddleCheckout({
  priceId,
  user,
  customData = {},
  onSuccess,
  onClose,
}) {
  const paddle = await loadPaddle();
  const config = await getPaddleConfig();

  const finalPriceId = priceId || config.monthlyPriceId;

  if (!finalPriceId) {
    throw new Error("No Paddle Price ID available for checkout.");
  }

  const payload = {
    settings: {
      displayMode: "overlay",
      theme: "dark",
      successUrl: `${window.location.origin}/membership?status=processing`,
    },
    items: [
      {
        priceId: finalPriceId,
        quantity: 1,
      },
    ],
    customData: {
      userId: user?._id || user?.id || "",
      username: user?.username || "",
      ...customData,
    },
  };

  if (user?.email) {
    payload.customer = {
      email: user.email,
    };
  }

  paddle.Checkout.open({
    ...payload,
    eventCallback: (data) => {
      notifyPaddleEventListeners(data);
      if (data.name === "checkout.completed") {
        if (onSuccess) onSuccess(data);
      }
      if (data.name === "checkout.closed") {
        if (onClose) onClose(data);
      }
    },
  });
}
