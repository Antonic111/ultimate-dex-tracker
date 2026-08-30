import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "../components/Shared/UserContext";
import { useEntitlements } from "../hooks/useEntitlements";
import {
  openPaddleInlineCheckout,
  getPaddleConfig,
  fetchPaddlePricePreview,
} from "../utils/paddle";
import { useMessage } from "../components/Shared/MessageContext";
import { buildApiUrl } from "../config/api";
import {
  Crown,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Lock,
  Calendar,
  RotateCcw,
  Eye,
  Check,
  Clock,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

/**
 * Placeholder Premium features - easily replaceable when final benefits are ready.
 */
const PLACEHOLDER_FEATURES = [
  {
    id: "feature-gif-avatar",
    title: "Animated Profile Pictures",
    description: "Bring your profile to life with custom animated GIF avatars.",
  },
  {
    id: "feature-no-watermark",
    title: "Remove Overlay Watermarks",
    description: "Enjoy a clean, unbranded streamer overlay in OBS & Streamlabs.",
  },
  {
    id: "feature-gradient-name",
    title: "Gradient Username & Glowing Aura",
    description: "Stand out with a customized 2-color gradient profile name and matching dual-color ambient glow.",
  },
  {
    id: "feature-favorite-categories",
    title: "Display All Favorite Categories",
    description: "Unlock and showcase all 4 favorite categories on your profile with custom section reordering.",
  },
];

export default function MembershipCheckout() {
  const { user, loading: userLoading } = useUser();
  const { isPremium, subscription, loading: entitlementsLoading, refreshStatus } =
    useEntitlements();
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const previewParam = searchParams.get("preview") || searchParams.get("state");

  const [paddleConfig, setPaddleConfig] = useState(null);
  const [displayPrice, setDisplayPrice] = useState(null);
  const [paddleLoaded, setPaddleLoaded] = useState(false);
  const [initError, setInitError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  // 'checkout' | 'confirming' | 'success' | 'timeout'
  const initialProcessing = searchParams.get("status") === "processing";
  const [checkoutState, setCheckoutState] = useState(
    initialProcessing ? "confirming" : "checkout"
  );

  const containerRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const pollAttemptsRef = useRef(0);
  const timeoutTimerRef = useRef(null);
  const lastCheckoutDataRef = useRef(null);

  // Sync preview query param into checkoutState if set
  useEffect(() => {
    if (
      previewParam === "confirming" ||
      previewParam === "success" ||
      previewParam === "timeout" ||
      previewParam === "checkout"
    ) {
      setCheckoutState(previewParam);
    }
  }, [previewParam]);

  // Fetch Paddle public config & price preview
  useEffect(() => {
    let isMounted = true;
    getPaddleConfig().then((config) => {
      if (!isMounted) return;
      setPaddleConfig(config);
      if (config?.monthlyPriceId) {
        fetchPaddlePricePreview(config.monthlyPriceId).then((price) => {
          if (isMounted && price?.formattedPrice) {
            setDisplayPrice(price.formattedPrice);
          }
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Trigger sync with backend
  const triggerBackendSync = async (checkoutData) => {
    try {
      const transactionId = checkoutData?.data?.id;
      const subscriptionId =
        checkoutData?.data?.subscription_id ||
        checkoutData?.data?.items?.[0]?.subscription_id;

      const res = await fetch(buildApiUrl("/api/monetization/sync"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subscriptionId, transactionId }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.isPremium) {
          await refreshStatus(true);
          setCheckoutState("success");
          return true;
        }
      }
    } catch (err) {
      console.warn("[Paddle Sync] Sync request warning:", err);
    }
    return false;
  };

  // Initialize Paddle Inline Checkout
  useEffect(() => {
    if (previewParam && previewParam !== "checkout") return;
    if (userLoading || entitlementsLoading) return;
    if (!user?.username) return;
    if (
      isPremium &&
      checkoutState !== "confirming" &&
      checkoutState !== "success" &&
      !previewParam
    )
      return;
    if (checkoutState !== "checkout") return;

    let isCancelled = false;
    let unsubscribeEvents = null;
    setInitError(null);
    setPaddleLoaded(false);

    // Timeout: if neither checkout.loaded nor iframe appears within 12 seconds, report error
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    timeoutTimerRef.current = setTimeout(() => {
      if (!isCancelled && !paddleLoaded && !previewParam) {
        console.warn("[Paddle Debug] Checkout initialization timed out after 12s.");
        setInitError(
          "The payment form is taking longer than expected to load. Please verify your connection or click Retry."
        );
      }
    }, 12000);

    // Set up MutationObserver on container to detect when Paddle iframe mounts
    const container = document.getElementById("paddle-checkout-container");
    let observer = null;
    if (container) {
      observer = new MutationObserver(() => {
        const iframe = container.querySelector("iframe");
        if (iframe && !isCancelled) {
          if (import.meta.env.DEV) {
            console.log("[Paddle Debug] Paddle iframe detected in DOM.");
          }
          setPaddleLoaded(true);
          if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
        }
      });
      observer.observe(container, { childList: true, subtree: true });
    }

    const timer = setTimeout(async () => {
      if (isCancelled) return;
      try {
        unsubscribeEvents = await openPaddleInlineCheckout({
          frameTarget: "paddle-checkout-container",
          priceId: paddleConfig?.monthlyPriceId,
          user,
          theme: "dark",
          onLoaded: () => {
            if (!isCancelled) {
              setPaddleLoaded(true);
              if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
            }
          },
          onSuccess: (data) => {
            if (!isCancelled) {
              lastCheckoutDataRef.current = data;
              setCheckoutState("confirming");
              showMessage("Payment received! Confirming your membership...", "success");
              triggerBackendSync(data);
            }
          },
          onError: (err) => {
            console.error("[Paddle Debug] Checkout error received:", err);
            if (!isCancelled && !previewParam) {
              if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
              setInitError(
                err?.message || "There was a problem loading the payment form."
              );
            }
          },
        });
      } catch (err) {
        console.error("[Paddle Debug] Initialization exception:", err);
        if (!isCancelled && !previewParam) {
          if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
          setInitError(
            err?.message || "Failed to initialize payment form. Please try again."
          );
        }
      }
    }, 100);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      if (observer) observer.disconnect();
      if (typeof unsubscribeEvents === "function") unsubscribeEvents();
    };
  }, [
    user,
    userLoading,
    entitlementsLoading,
    paddleConfig,
    retryKey,
    isPremium,
    checkoutState,
    previewParam,
  ]);

  // Polling for Webhook / Sync Confirmation (Silent background refresh to prevent flicker)
  useEffect(() => {
    if (previewParam) return; // Do not run real polling during preview mode
    if (checkoutState === "confirming") {
      pollAttemptsRef.current = 0;

      const checkEntitlement = async () => {
        pollAttemptsRef.current += 1;

        // Try direct sync on attempt 1, 3, and 6
        if (
          pollAttemptsRef.current === 1 ||
          pollAttemptsRef.current === 3 ||
          pollAttemptsRef.current === 6
        ) {
          await triggerBackendSync(lastCheckoutDataRef.current);
        }

        const status = await refreshStatus(true);

        if (status?.isPremium) {
          clearInterval(pollIntervalRef.current);
          setCheckoutState("success");
          showMessage("Premium Membership Confirmed!", "success");
        } else if (pollAttemptsRef.current >= 15) {
          // 15 attempts * 2s = 30s timeout
          clearInterval(pollIntervalRef.current);
          setCheckoutState("timeout");
        }
      };

      // Check immediately, then poll every 2s
      checkEntitlement();
      pollIntervalRef.current = setInterval(checkEntitlement, 2000);

      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      };
    }
  }, [checkoutState, refreshStatus, showMessage, previewParam]);

  const handleManualStatusCheck = async () => {
    const synced = await triggerBackendSync(lastCheckoutDataRef.current);
    if (synced) {
      setCheckoutState("success");
      return;
    }
    const status = await refreshStatus(true);
    if (status?.isPremium) {
      setCheckoutState("success");
    } else {
      showMessage(
        "Still processing with payment provider. Please allow a few moments.",
        "info"
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Preview Switcher Toolbar (Only visible when previewParam is present in URL)
  const renderPreviewToolbar = () => {
    if (!previewParam) return null;
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--pokemon-box-bg,#181818)]/95 backdrop-blur-md border border-white/15 rounded-2xl p-2 shadow-2xl flex items-center gap-1.5 text-xs max-w-[95vw] overflow-x-auto">
        <div className="flex items-center gap-1.5 text-[#888] px-2 py-1 font-bold whitespace-nowrap">
          <Eye size={14} className="text-[var(--accent)]" />
          <span>Checkout State:</span>
        </div>
        <button
          type="button"
          onClick={() => setSearchParams({})}
          className="px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap border-0 bg-white/5 text-[#ccc] hover:bg-white/10"
        >
          Live Flow
        </button>
      <button
        type="button"
        onClick={() => setSearchParams({ preview: "checkout" })}
        className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap border-0 ${previewParam === "checkout"
          ? "bg-[var(--accent)] text-black font-extrabold shadow-sm"
          : "bg-white/5 text-[#ccc] hover:bg-white/10"
          }`}
      >
        Checkout Form
      </button>
      <button
        type="button"
        onClick={() => setSearchParams({ preview: "confirming" })}
        className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap border-0 ${previewParam === "confirming"
          ? "bg-[var(--accent)] text-black font-extrabold shadow-sm"
          : "bg-white/5 text-[#ccc] hover:bg-white/10"
          }`}
      >
        Activating (Stage 2)
      </button>
      <button
        type="button"
        onClick={() => setSearchParams({ preview: "success" })}
        className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap border-0 ${previewParam === "success"
          ? "bg-[var(--accent)] text-black font-extrabold shadow-sm"
          : "bg-white/5 text-[#ccc] hover:bg-white/10"
          }`}
      >
        Access Granted (Stage 3)
      </button>
      <button
        type="button"
        onClick={() => setSearchParams({ preview: "timeout" })}
        className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap border-0 ${previewParam === "timeout"
          ? "bg-[var(--accent)] text-black font-extrabold shadow-sm"
          : "bg-white/5 text-[#ccc] hover:bg-white/10"
          }`}
      >
        Timeout Fallback
      </button>
      <button
        type="button"
        onClick={() => setSearchParams({ preview: "already_premium" })}
        className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap border-0 ${previewParam === "already_premium"
          ? "bg-[var(--accent)] text-black font-extrabold shadow-sm"
          : "bg-white/5 text-[#ccc] hover:bg-white/10"
          }`}
      >
        Already Premium
      </button>
      <button
        type="button"
        onClick={() => setSearchParams({ preview: "logged_out" })}
        className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap border-0 ${previewParam === "logged_out"
          ? "bg-[var(--accent)] text-black font-extrabold shadow-sm"
          : "bg-white/5 text-[#ccc] hover:bg-white/10"
          }`}
      >
        Logged Out
      </button>
      <Link
        to="/membership"
        className="px-3 py-1.5 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all no-underline whitespace-nowrap"
      >
        ← Return to Hub
      </Link>
    </div>
  );
};

  // 1. Loading User / Entitlement State (Initial only)
  if (userLoading || (entitlementsLoading && !user && !previewParam)) {
    return (
      <div className="flex items-center justify-center flex-1 w-full py-8 px-4 box-border relative pb-28 page-enter page-fade-in membership-checkout-page">
        <div className="w-full max-w-[440px] bg-[var(--auth-boxes,#181818)] border border-[var(--border-color,rgba(255,255,255,0.1))] rounded-[20px] p-8 shadow-2xl text-center space-y-4">
          <Loader2 className="animate-spin text-[var(--accent)] mx-auto" size={36} />
          <p className="text-[#888] text-sm">Preparing checkout...</p>
        </div>
        {renderPreviewToolbar()}
      </div>
    );
  }

  // 2. Unauthenticated User Prompt
  if (
    (!user?.username || previewParam === "logged_out") &&
    previewParam !== "checkout" &&
    previewParam !== "confirming" &&
    previewParam !== "success" &&
    previewParam !== "timeout" &&
    previewParam !== "already_premium"
  ) {
    return (
      <div className="flex items-center justify-center flex-1 w-full py-8 px-4 box-border relative pb-28 page-enter page-fade-in membership-checkout-page">
        <div className="w-full max-w-[440px] bg-[var(--auth-boxes)] border border-[var(--border-color)] rounded-[20px] p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-[var(--pokemon-box-bg2,#242424)] border border-[var(--border-color)] text-[var(--accent)] flex items-center justify-center mx-auto">
            <Lock size={24} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text)] uppercase tracking-tight">
              Log In to Continue
            </h1>
            <p className="text-[var(--text-muted)] text-xs sm:text-sm">
              Please sign in to your Ultimate Dex Tracker account to upgrade to Premium.
            </p>
          </div>
          <Link
            to="/login?redirect=/membership/checkout"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-black font-extrabold text-sm hover:opacity-90 transition-all no-underline cursor-pointer"
          >
            Log In or Sign Up
          </Link>
          <div>
            <Link
              to="/membership"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              ← Return to Membership Overview
            </Link>
          </div>
        </div>
        {renderPreviewToolbar()}
      </div>
    );
  }

  // 3. Already Active Premium Member (and not currently confirming)
  if (
    (isPremium || previewParam === "already_premium") &&
    checkoutState !== "confirming" &&
    checkoutState !== "success" &&
    previewParam !== "checkout" &&
    previewParam !== "timeout"
  ) {
    return (
      <div className="flex items-center justify-center flex-1 w-full py-8 px-4 box-border relative pb-28 page-enter page-fade-in membership-checkout-page">
        <div className="w-full max-w-[440px] bg-[var(--auth-boxes)] border border-[var(--border-color)] rounded-[20px] p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text)] uppercase tracking-tight">
              You're Already Premium!
            </h1>
            <p className="text-[var(--text-muted)] text-xs sm:text-sm">
              Your account currently has an active Premium membership. You do not need to
              subscribe again.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              to="/membership"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black font-bold text-xs hover:opacity-90 transition-all no-underline"
            >
              View Membership Details
            </Link>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 text-[var(--text)] font-bold text-xs hover:bg-black/10 dark:hover:bg-white/15 transition-all cursor-pointer border border-[var(--border-color)]"
            >
              Go to Tracker
            </button>
          </div>
        </div>
        {renderPreviewToolbar()}
      </div>
    );
  }

  // =========================================================================
  // 4. UNIFIED POST-CHECKOUT CONFIRMATION MODAL (Step 1 -> Step 2 -> Step 3)
  // Matches exact layout from user's mockup and counter hunt modal styling
  // =========================================================================
  if (
    checkoutState === "confirming" ||
    checkoutState === "success" ||
    checkoutState === "timeout"
  ) {
    const isComplete = checkoutState === "success";
    const isTimeout = checkoutState === "timeout";

    return (
      <div className="flex items-center justify-center flex-1 w-full py-8 px-4 box-border relative pb-28 page-enter page-fade-in membership-checkout-page">
        <div className="w-full max-w-[540px] bg-[var(--auth-boxes,#181818)] border border-[var(--border-color,rgba(255,255,255,0.1))] rounded-[24px] p-6 sm:p-9 shadow-2xl text-center space-y-7 relative overflow-hidden">

          {/* Top Circular Icon with Static Sparkles */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            {/* Outer ring */}
            <div className="w-18 h-18 rounded-full border border-white/10 bg-[var(--pokemon-box-bg2,#242424)] flex items-center justify-center">
              {/* Inner circle with icon */}
              <div className="w-12 h-12 rounded-full bg-[var(--accent)]/15 border-2 border-[var(--accent)] flex items-center justify-center text-[var(--accent)]">
                {isComplete ? (
                  <Check size={22} className="stroke-[3]" />
                ) : isTimeout ? (
                  <AlertTriangle size={22} />
                ) : (
                  <Check size={22} className="stroke-[3]" />
                )}
              </div>
            </div>

            {/* Static Single Sparkle SVGs (Tinted in pure var(--accent)) */}
            {/* Top Right Sparkle 1 (Primary - Larger) */}
            <span
              aria-hidden="true"
              className="absolute -top-0 right-0 w-4 h-4 bg-[var(--accent)] pointer-events-none select-none inline-block"
              style={{
                maskImage: 'url("/leaderboard/single_sparkle.svg")',
                WebkitMaskImage: 'url("/leaderboard/single_sparkle.svg")',
                maskSize: "contain",
                WebkitMaskSize: "contain",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
              }}
            />
            {/* Bottom Left Sparkle 1 (Primary) */}
            <span
              aria-hidden="true"
              className="absolute bottom-1 -left-1.5 w-3.5 h-3.5 bg-[var(--accent)] pointer-events-none select-none inline-block"
              style={{
                maskImage: 'url("/leaderboard/single_sparkle.svg")',
                WebkitMaskImage: 'url("/leaderboard/single_sparkle.svg")',
                maskSize: "contain",
                WebkitMaskSize: "contain",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
              }}
            />
            {/* Bottom Left Sparkle 2 (Smaller, close to Bottom Left 1) */}
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-2.5 w-2.5 h-2.5 bg-[var(--accent)] pointer-events-none select-none inline-block opacity-85"
              style={{
                maskImage: 'url("/leaderboard/single_sparkle.svg")',
                WebkitMaskImage: 'url("/leaderboard/single_sparkle.svg")',
                maskSize: "contain",
                WebkitMaskSize: "contain",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
              }}
            />
          </div>

          {/* Heading & Subheading */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight">
              {isComplete
                ? "Membership Confirmed!"
                : isTimeout
                  ? "Payment Received!"
                  : "Membership Confirmed!"}
            </h1>
            <p className="text-[var(--text-muted)] text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              {isComplete
                ? `Your payment was verified and benefits are active, ${user?.username || "Trainer"}!`
                : "Your payment was received. We are synchronizing your account with our servers."}
            </p>
          </div>

          {/* 3-Step Progress Stepper */}
          <div className="relative flex items-center justify-between max-w-md mx-auto pt-2 px-2">
            {/* Dashed background track */}
            <div className="absolute top-5 left-10 right-10 h-0.5 border-t-2 border-dashed border-[var(--border-color)] -z-0" />

            {/* Dashed active progress line */}
            <div
              className="absolute top-5 left-10 h-0.5 border-t-2 border-dashed border-[var(--accent)] transition-all duration-700 -z-0"
              style={{
                width: isComplete ? "calc(100% - 80px)" : "calc(50% - 40px)",
              }}
            />

            {/* Step 1: Payment Received */}
            <div className="flex flex-col items-center gap-2 z-10 text-center flex-1">
              <div className="w-10 h-10 rounded-full bg-[var(--auth-boxes)] border-2 border-[var(--accent)] text-[var(--accent)] flex items-center justify-center shadow-sm">
                <Check size={18} className="stroke-[2.5]" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-[var(--accent)] tracking-tight">
                Payment Received
              </span>
            </div>

            {/* Step 2: Activating Membership */}
            <div className="flex flex-col items-center gap-2 z-10 text-center flex-1">
              <div
                className={`w-10 h-10 rounded-full bg-[var(--auth-boxes,#181818)] border-2 flex items-center justify-center transition-all ${isComplete
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-[var(--accent)] text-[var(--accent)] shadow-[0_0_12px_var(--accent-glow,rgba(0,210,255,0.25))]"
                  }`}
              >
                {isComplete ? (
                  <Check size={18} className="stroke-[2.5]" />
                ) : (
                  <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
                )}
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-[var(--accent)] tracking-tight">
                Activating Membership
              </span>
            </div>

            {/* Step 3: Access Granted */}
            <div className="flex flex-col items-center gap-2 z-10 text-center flex-1">
              <div
                className={`w-10 h-10 rounded-full bg-[var(--auth-boxes,#181818)] border-2 flex items-center justify-center transition-all ${isComplete
                  ? "border-[var(--accent)] text-[var(--accent)] shadow-[0_0_15px_var(--accent-glow,rgba(0,210,255,0.3))]"
                  : "border-white/20 text-[#666]"
                  }`}
              >
                {isComplete ? (
                  <Check size={18} className="stroke-[2.5]" />
                ) : (
                  <Lock size={16} />
                )}
              </div>
              <span
                className={`text-[11px] sm:text-xs font-bold tracking-tight ${isComplete ? "text-[var(--accent)]" : "text-[#777]"
                  }`}
              >
                Access Granted
              </span>
            </div>
          </div>

          {/* Callout Information Box */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-black/5 dark:bg-[var(--pokemon-box-bg2,#242424)] border border-[var(--border-color)] flex items-start gap-3.5 text-left">
            {isComplete ? (
              <>
                <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 size={18} />
                </div>
                <div className="space-y-0.5 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--text)]">
                    You're all set!
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[var(--text-muted)] leading-relaxed">
                    Next renewal date:{" "}
                    <strong className="text-[var(--text)] font-medium">
                      {formatDate(
                        subscription?.currentPeriodEnd ||
                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                      )}
                    </strong>
                    . Enjoy your perks!
                  </p>
                </div>
              </>
            ) : isTimeout ? (
              <>
                <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle size={18} />
                </div>
                <div className="space-y-0.5 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--text)]">
                    Finalizing with Paddle
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[var(--text-muted)] leading-relaxed">
                    Payment is processed. Click below to verify entitlement status.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-9 h-9 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock size={18} />
                </div>
                <div className="space-y-0.5 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--text)]">
                    Almost done!
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[var(--text-muted)] leading-relaxed">
                    This usually takes 2–5 seconds. Please do not close this window.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons When Complete or Timeout */}
          {isComplete && (
            <div className="pt-1 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full py-3.5 px-5 rounded-xl bg-[var(--accent)] text-black font-extrabold text-xs sm:text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer border-0"
              >
                Start Tracking
              </button>
              <Link
                to="/membership"
                className="w-full py-3.5 px-5 rounded-xl bg-black/5 dark:bg-[var(--pokemon-box-bg2,#242424)] hover:bg-black/10 dark:hover:bg-white/10 border border-[var(--border-color)] text-[var(--text)] font-bold text-xs sm:text-sm flex items-center justify-center transition-all no-underline"
              >
                View Membership Hub
              </Link>
            </div>
          )}

          {isTimeout && (
            <div className="pt-1 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={handleManualStatusCheck}
                className="w-full py-3.5 px-5 rounded-xl bg-[var(--accent)] text-black font-extrabold text-xs sm:text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer border-0"
              >
                Check Status Now
              </button>
              <Link
                to="/membership"
                className="w-full py-3.5 px-5 rounded-xl bg-black/5 dark:bg-[var(--pokemon-box-bg2,#242424)] hover:bg-black/10 dark:hover:bg-white/10 border border-[var(--border-color)] text-[var(--text)] font-bold text-xs sm:text-sm flex items-center justify-center transition-all no-underline"
              >
                Return to Membership
              </Link>
            </div>
          )}

          {/* Footer Assistance Link */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-[#888] pt-1">
            <HelpCircle size={14} className="text-[var(--accent)]" />
            <span>Taking longer than usual?</span>
            <a
              href="https://paddle.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] font-semibold hover:underline inline-flex items-center gap-0.5 no-underline ml-1"
            >
              Billing support <ExternalLink size={11} />
            </a>
          </div>
        </div>

        {renderPreviewToolbar()}
      </div>
    );
  }

  // =========================================================================
  // 5. MAIN 2-COLUMN INLINE CHECKOUT PAGE
  // =========================================================================
  return (
    <div className="w-full text-[var(--text)] py-10 relative pb-28 page-enter page-fade-in membership-checkout-page">
      <div className="w-full max-w-[1300px] mx-auto space-y-8">
        {/* Back navigation & Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/membership"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors group no-underline w-fit"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Membership
          </Link>

          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Lock size={14} className="text-emerald-400" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Membership Summary & Benefits (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[var(--pokemon-box-bg)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              {/* Plan Header */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-[var(--pokemon-box-bg2,#242424)] border border-[var(--border-color)] text-[var(--accent)] text-xs font-semibold uppercase tracking-wider">
                  <Crown size={14} />
                  Membership
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)]">
                  Premium Plan
                </h1>
                <p className="text-[var(--text-muted)] text-xs sm:text-sm">
                  Elevate your tracking journey with supporter privileges.
                </p>
              </div>

              {/* Price Display */}
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-[var(--pokemon-box-bg2,#242424)] border border-[var(--border-color)] space-y-1">
                <div className="text-3xl font-black text-[var(--text)] flex items-baseline gap-1.5">
                  {displayPrice || "$?.??"}
                  <span className="text-sm font-normal text-[var(--text-muted)]">/ month</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Billed monthly. Cancel anytime with no commitments.
                </p>
              </div>

              {/* Benefits Checklist */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  What's Included
                </h2>
                <div className="space-y-2.5">
                  {PLACEHOLDER_FEATURES.map((feat) => (
                    <div key={feat.id} className="flex items-start gap-2.5">
                      <Sparkles
                        size={15}
                        className="text-[var(--accent)] flex-shrink-0 mt-0.5"
                      />
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-[var(--text)]">
                          {feat.title}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] leading-tight">
                          {feat.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transparency & Security Footer */}
              <div className="pt-4 border-t border-[var(--border-color)] space-y-2 text-xs text-[var(--text-muted)]">
                <div className="flex items-start gap-2">
                  <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    Access continues through the paid period after cancellation.
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] pl-6">
                  Billing, global sales tax, and security are handled directly by Paddle.
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Paddle Inline Checkout (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[var(--pokemon-box-bg)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-xl relative min-h-[540px] flex flex-col justify-between overflow-hidden">
              {/* Checkout Title */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Lock size={16} className="text-[var(--accent)]" />
                  Secure Checkout
                </h2>
                <span className="text-xs text-[var(--text-muted)]">
                  Account: <strong className="text-[var(--text)]">{user?.email || user?.username || "Trainer"}</strong>
                </span>
              </div>

              {/* Error State */}
              {initError && (
                <div className="my-6 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-3 text-center">
                  <AlertTriangle size={24} className="text-red-400 mx-auto" />
                  <div className="text-sm text-red-300 font-semibold">{initError}</div>
                  <button
                    type="button"
                    onClick={() => setRetryKey((k) => k + 1)}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer border-0"
                  >
                    <RotateCcw size={14} />
                    Retry Payment Form
                  </button>
                </div>
              )}

              {/* Relative Container for Skeleton + Paddle Target Frame */}
              <div className="relative min-h-[480px] w-full my-auto">
                {/* Skeleton Loading Overlay (Fades out when Paddle finishes mounting) */}
                {!paddleLoaded && !initError && (
                  <div className="absolute inset-0 bg-[var(--pokemon-box-bg,#181818)] z-10 space-y-5 py-2 animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded-md w-28" />
                      <div className="h-11 bg-white/5 rounded-xl border border-white/10 w-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-white/10 rounded-md w-20" />
                        <div className="h-11 bg-white/5 rounded-xl border border-white/10 w-full" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-white/10 rounded-md w-16" />
                        <div className="h-11 bg-white/5 rounded-xl border border-white/10 w-full" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded-md w-32" />
                      <div className="h-11 bg-white/5 rounded-xl border border-white/10 w-full" />
                    </div>
                    <div className="h-12 bg-[var(--accent)]/30 rounded-xl w-full mt-4" />
                    <div className="flex items-center justify-center gap-2 text-xs text-[#888] pt-3">
                      <Loader2 className="animate-spin text-[var(--accent)]" size={14} />
                      <span>Loading secure payment form...</span>
                    </div>
                  </div>
                )}

                {/* Target container where Paddle Inline Checkout mounts */}
                <div
                  ref={containerRef}
                  id="paddle-checkout-container"
                  className="paddle-checkout-container w-full min-h-[480px]"
                />
              </div>

              {/* Footer reassurance */}
              <div className="pt-4 mt-auto border-t border-white/10 text-center text-[11px] text-[#777]">
                Payment data is encrypted and processed directly by Paddle.
              </div>
            </div>
          </div>
        </div>
      </div>
      {renderPreviewToolbar()}
    </div>
  );
}
