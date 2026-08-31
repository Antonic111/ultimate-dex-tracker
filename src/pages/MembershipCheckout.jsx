import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "../components/Shared/UserContext";
import { useEntitlements } from "../hooks/useEntitlements";
import { useMessage } from "../components/Shared/MessageContext";
import { buildApiUrl } from "../config/api";
import {
  Crown,
  Sparkles,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
  Lock,
  RotateCcw,
} from "lucide-react";
import "../css/Login.css";

export default function MembershipCheckout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const { isPremium, subscription, refreshStatus, loading: entitlementsLoading } =
    useEntitlements();
  const { showMessage } = useMessage();
  const navigate = useNavigate();

  // URL state detection: returning from Stripe checkout or dev preview
  const statusParam = searchParams.get("status");
  const sessionId = searchParams.get("session_id");
  const previewParam = searchParams.get("preview");

  const initialProcessing =
    statusParam === "success" ||
    statusParam === "processing" ||
    Boolean(sessionId) ||
    previewParam === "confirming" ||
    previewParam === "success";

  // 'checkout' | 'confirming' | 'success' | 'timeout'
  const [checkoutState, setCheckoutState] = useState(
    initialProcessing ? "confirming" : "checkout"
  );
  const [redirectingToStripe, setRedirectingToStripe] = useState(false);
  const [initError, setInitError] = useState(null);

  const pollIntervalRef = useRef(null);
  const pollCountRef = useRef(0);
  const MAX_POLLS = 18; // ~36 seconds max polling

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) {
      const fallback = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return fallback.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
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

  // Sync / verify status with backend
  const verifyMembershipStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(buildApiUrl("/monetization/sync"), {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId: sessionId || undefined }),
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isPremium) {
          if (refreshStatus) await refreshStatus(true);
          return true;
        }
      }
    } catch (err) {
      console.error("[MembershipCheckout] Sync check error:", err);
    }
    return false;
  }, [refreshStatus]);

  // Handle Stripe Checkout initialization if arriving directly at /membership/checkout without returning from Stripe
  useEffect(() => {
    if (userLoading || entitlementsLoading) return;

    if (!user?.username) {
      navigate("/login?redirect=/membership/checkout", { replace: true });
      return;
    }

    // If user is already active premium and NOT currently confirming a new checkout
    if (isPremium && checkoutState === "checkout" && !initialProcessing && !previewParam) {
      showMessage("You already have an active Premium membership!", "info");
      navigate("/membership", { replace: true });
      return;
    }

    // If not returning from Stripe and in default checkout mode, automatically initiate Stripe checkout session
    if (checkoutState === "checkout" && !initialProcessing && !previewParam) {
      let isCancelled = false;

      const startStripeCheckout = async () => {
        try {
          setRedirectingToStripe(true);
          setInitError(null);

          const token = localStorage.getItem("authToken");
          const headers = { "Content-Type": "application/json" };
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const res = await fetch(buildApiUrl("/stripe/create-checkout-session"), {
            method: "POST",
            headers,
            credentials: "include",
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Failed to initialize Stripe checkout session.");
          }

          const data = await res.json();
          if (data.url && !isCancelled) {
            window.location.href = data.url;
          } else if (!isCancelled) {
            throw new Error("No checkout URL returned from payment server.");
          }
        } catch (err) {
          if (!isCancelled) {
            console.error("Stripe checkout error:", err);
            setInitError(err.message || "Failed to connect to checkout. Please try again.");
            setRedirectingToStripe(false);
          }
        }
      };

      startStripeCheckout();

      return () => {
        isCancelled = true;
      };
    }
  }, [
    user,
    userLoading,
    isPremium,
    entitlementsLoading,
    checkoutState,
    initialProcessing,
    previewParam,
    navigate,
    showMessage,
  ]);

  // Polling for Webhook / Sync Confirmation when in 'confirming' state
  useEffect(() => {
    if (previewParam === "confirming") {
      setCheckoutState("confirming");
      return;
    }
    if (previewParam === "success") {
      setCheckoutState("success");
      return;
    }
    if (previewParam === "timeout") {
      setCheckoutState("timeout");
      return;
    }

    if (checkoutState === "confirming") {
      pollCountRef.current = 0;

      // Immediate check
      verifyMembershipStatus().then((active) => {
        if (active) {
          setCheckoutState("success");
          showMessage("Premium Membership Confirmed!", "success");
        }
      });

      // Periodic polling
      pollIntervalRef.current = setInterval(async () => {
        pollCountRef.current += 1;
        const active = await verifyMembershipStatus();

        if (active) {
          clearInterval(pollIntervalRef.current);
          setCheckoutState("success");
          showMessage("Premium Membership Confirmed!", "success");
        } else if (pollCountRef.current >= MAX_POLLS) {
          clearInterval(pollIntervalRef.current);
          setCheckoutState("timeout");
        }
      }, 2000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [checkoutState, previewParam, verifyMembershipStatus, showMessage]);

  const handleManualStatusCheck = async () => {
    showMessage("Checking membership status...", "info");
    const active = await verifyMembershipStatus();
    if (active) {
      setCheckoutState("success");
      showMessage("Premium Membership Confirmed!", "success");
    } else {
      showMessage(
        "Payment is still processing. Please allow a few moments or refresh.",
        "info"
      );
    }
  };

  // Preview Toolbar for testing and reviewing states
  const renderPreviewToolbar = () => {
    if (process.env.NODE_ENV !== "development" && !searchParams.get("debug")) {
      return null;
    }

    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#181818] border border-[var(--border-color)] text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 text-xs">
        <span className="text-[var(--text-muted)] font-bold uppercase tracking-wider">
          Preview:
        </span>
        <button
          type="button"
          onClick={() => {
            setSearchParams({ preview: "confirming" });
            setCheckoutState("confirming");
          }}
          className={`px-3 py-1 rounded-lg font-bold border-0 cursor-pointer transition-colors ${
            previewParam === "confirming"
              ? "bg-[var(--accent)] text-black"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          Confirming
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchParams({ preview: "success" });
            setCheckoutState("success");
          }}
          className={`px-3 py-1 rounded-lg font-bold border-0 cursor-pointer transition-colors ${
            previewParam === "success"
              ? "bg-[var(--accent)] text-black"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          Success
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchParams({ preview: "timeout" });
            setCheckoutState("timeout");
          }}
          className={`px-3 py-1 rounded-lg font-bold border-0 cursor-pointer transition-colors ${
            previewParam === "timeout"
              ? "bg-[var(--accent)] text-black"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          Timeout
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchParams({});
            setCheckoutState("checkout");
          }}
          className="px-3 py-1 rounded-lg font-bold border-0 cursor-pointer bg-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-white transition-colors"
        >
          Reset
        </button>
      </div>
    );
  };

  // =========================================================================
  // 1. CONFIRMATION / SUCCESS / TIMEOUT 3-STEP MODAL
  // =========================================================================
  if (
    checkoutState === "confirming" ||
    checkoutState === "success" ||
    checkoutState === "timeout"
  ) {
    const isComplete = checkoutState === "success";
    const isTimeout = checkoutState === "timeout";

    return (
      <div className="login-page-container">
        {/* Modal Card using exact login-card aesthetic */}
        <div className="login-card max-w-[480px] text-center space-y-5 p-6 sm:p-7">
          {/* Top Decorative Sparkles & Crown Icon Container */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            {/* Circle Background */}
            <div className="w-16 h-16 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center relative z-10">
              <Crown size={30} />
            </div>

            {/* Top Left Sparkle (Primary) */}
            <span
              aria-hidden="true"
              className="absolute -top-0.5 left-1.5 w-3.5 h-3.5 bg-[var(--accent)] pointer-events-none select-none inline-block"
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
            {/* Top Right Sparkle 1 (Primary) */}
            <span
              aria-hidden="true"
              className="absolute top-1 -right-1.5 w-3.5 h-3.5 bg-[var(--accent)] pointer-events-none select-none inline-block"
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
            {/* Top Right Sparkle 2 (Secondary smaller) */}
            <span
              aria-hidden="true"
              className="absolute -top-1.5 right-2.5 w-2 h-2 bg-[var(--accent)] pointer-events-none select-none inline-block opacity-80"
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
              className="absolute bottom-1 -left-1 w-3 h-3 bg-[var(--accent)] pointer-events-none select-none inline-block"
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
              className="absolute -bottom-0.5 left-2 w-2 h-2 bg-[var(--accent)] pointer-events-none select-none inline-block opacity-85"
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
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text)] tracking-tight uppercase">
              {isComplete
                ? "Membership Confirmed!"
                : isTimeout
                ? "Payment Received!"
                : "Membership Confirmed!"}
            </h1>
            <p className="text-[var(--text-muted)] text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
              {isComplete
                ? `Your payment was verified and benefits are active, ${
                    user?.username || "Trainer"
                  }!`
                : "Your payment was received. Synchronizing with our servers..."}
            </p>
          </div>

          {/* 3-Step Progress Stepper */}
          <div className="relative flex items-center justify-between max-w-sm mx-auto pt-1 px-1">
            {/* Dashed background track */}
            <div className="absolute top-4 left-8 right-8 h-0.5 border-t-2 border-dashed border-[var(--border-color)] -z-0" />

            {/* Dashed active progress line */}
            <div
              className="absolute top-4 left-8 h-0.5 border-t-2 border-dashed border-[var(--accent)] transition-all duration-700 -z-0"
              style={{
                width: isComplete ? "calc(100% - 64px)" : "calc(50% - 32px)",
              }}
            />

            {/* Step 1: Payment Received */}
            <div className="flex flex-col items-center gap-1.5 z-10 text-center flex-1">
              <div className="w-8 h-8 rounded-full bg-[var(--auth-boxes)] border-2 border-[var(--accent)] text-[var(--accent)] flex items-center justify-center shadow-sm">
                <Check size={14} className="stroke-[2.5]" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-[var(--accent)] tracking-tight">
                Payment Received
              </span>
            </div>

            {/* Step 2: Activating Membership */}
            <div className="flex flex-col items-center gap-1.5 z-10 text-center flex-1">
              <div
                className={`w-8 h-8 rounded-full bg-[var(--auth-boxes,#181818)] border-2 flex items-center justify-center transition-all ${
                  isComplete
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-[var(--accent)] text-[var(--accent)] shadow-[0_0_10px_var(--accent-glow,rgba(0,210,255,0.25))]"
                }`}
              >
                {isComplete ? (
                  <Check size={14} className="stroke-[2.5]" />
                ) : (
                  <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-[var(--accent)] tracking-tight">
                Activating Membership
              </span>
            </div>

            {/* Step 3: Access Granted */}
            <div className="flex flex-col items-center gap-1.5 z-10 text-center flex-1">
              <div
                className={`w-8 h-8 rounded-full bg-[var(--auth-boxes,#181818)] border-2 flex items-center justify-center transition-all ${
                  isComplete
                    ? "border-[var(--accent)] text-[var(--accent)] shadow-[0_0_12px_var(--accent-glow,rgba(0,210,255,0.3))]"
                    : "border-white/20 text-[#666]"
                }`}
              >
                {isComplete ? (
                  <Check size={14} className="stroke-[2.5]" />
                ) : (
                  <Lock size={13} />
                )}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-bold tracking-tight ${
                  isComplete ? "text-[var(--accent)]" : "text-[#777]"
                }`}
              >
                Access Granted
              </span>
            </div>
          </div>

          {/* Callout Information Box */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-black/5 dark:bg-[var(--pokemon-box-bg2,#242424)] border border-[var(--border-color)] flex items-start gap-3 text-left">
            {isComplete ? (
              <>
                <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 size={16} />
                </div>
                <div className="space-y-0.5 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--text)]">
                    You're all set!
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[var(--text-muted)] leading-relaxed">
                    Next renewal:{" "}
                    <strong className="text-[var(--text)] font-semibold">
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
                <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle size={16} />
                </div>
                <div className="space-y-0.5 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--text)]">
                    Finalizing Confirmation
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[var(--text-muted)] leading-relaxed">
                    Payment processed. Click below to verify status.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock size={16} />
                </div>
                <div className="space-y-0.5 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--text)]">
                    Almost done!
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[var(--text-muted)] leading-relaxed">
                    Takes 2–5 seconds. Please do not close this window.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Action Button When Complete */}
          {isComplete && (
            <div className="pt-1">
              <Link
                to="/membership"
                className="w-full py-3 px-4 rounded-xl bg-[var(--accent)] text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all no-underline shadow-sm"
              >
                View Benefits
              </Link>
            </div>
          )}

          {isTimeout && (
            <div className="pt-1 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={handleManualStatusCheck}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent)] text-black font-extrabold text-xs sm:text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer border-0 shadow-sm"
              >
                Check Status Now
              </button>
              <Link
                to="/membership"
                className="w-full py-2.5 px-4 rounded-xl bg-black/5 dark:bg-[var(--pokemon-box-bg2,#242424)] hover:bg-black/10 dark:hover:bg-white/10 border border-[var(--border-color)] text-[var(--text)] font-bold text-xs sm:text-sm flex items-center justify-center transition-all no-underline"
              >
                Return to Plans
              </Link>
            </div>
          )}
        </div>

        {renderPreviewToolbar()}
      </div>
    );
  }

  // =========================================================================
  // 2. CHECKOUT REDIRECTION LOADER SCREEN
  // =========================================================================
  return (
    <div className="login-page-container">
      <div className="login-card max-w-[440px] text-center space-y-5 p-6 sm:p-7">
        <div className="w-14 h-14 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center mx-auto shadow-sm">
          <Crown size={26} />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text)] flex items-center justify-center gap-2 uppercase tracking-tight">
            <span>Ultimate Dex Premium</span>
            <Sparkles size={18} className="text-[var(--accent)]" />
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            Connecting securely to Stripe Checkout...
          </p>
        </div>

        {redirectingToStripe && (
          <div className="py-6 flex flex-col items-center justify-center space-y-3">
            <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              Redirecting to secure Stripe payment page...
            </span>
          </div>
        )}

        {initError && (
          <div className="space-y-3.5 text-left">
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-300 leading-relaxed">{initError}</div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-3.5 rounded-xl bg-[var(--accent)] text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:opacity-90 transition-opacity border-0"
              >
                <RotateCcw size={13} />
                Try Again
              </button>
              <Link
                to="/membership"
                className="flex-1 py-2.5 px-3.5 rounded-xl bg-black/5 dark:bg-[var(--pokemon-box-bg2,#242424)] border border-[var(--border-color)] text-[var(--text)] font-bold text-xs flex items-center justify-center gap-1.5 no-underline hover:bg-black/10 transition-colors"
              >
                <ArrowLeft size={13} />
                Back to Plans
              </Link>
            </div>
          </div>
        )}

        <div className="pt-3.5 border-t border-[var(--border-color)] flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)]">
          <Lock size={12} className="text-emerald-400" />
          <span>256-bit SSL encrypted & handled by Stripe Managed Payments</span>
        </div>
      </div>
      {renderPreviewToolbar()}
    </div>
  );
}
