import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../components/Shared/UserContext";
import { useEntitlements } from "../hooks/useEntitlements";
import { useMessage } from "../components/Shared/MessageContext";
import { buildApiUrl } from "../config/api";
import {
  Crown,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Lock,
  RotateCcw,
} from "lucide-react";

export default function MembershipCheckout() {
  const { user, loading: userLoading } = useUser();
  const { isPremium, loading: entitlementsLoading } = useEntitlements();
  const { showMessage } = useMessage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userLoading || entitlementsLoading) return;

    if (!user?.username) {
      navigate("/login?redirect=/membership/checkout", { replace: true });
      return;
    }

    if (isPremium) {
      showMessage("You already have an active Premium membership!", "info");
      navigate("/membership", { replace: true });
      return;
    }

    let isCancelled = false;

    const startStripeCheckout = async () => {
      try {
        setLoading(true);
        setError(null);

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
          console.error("Stripe checkout redirection error:", err);
          setError(err.message || "Failed to connect to checkout. Please try again.");
          setLoading(false);
        }
      }
    };

    startStripeCheckout();

    return () => {
      isCancelled = true;
    };
  }, [user, userLoading, isPremium, entitlementsLoading, navigate, showMessage]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] py-8 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-[var(--pokemon-box-bg)] border border-[var(--border-color)] rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center mx-auto shadow-md">
          <Crown size={28} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-[var(--text)] flex items-center justify-center gap-2">
            <span>Ultimate Dex Premium</span>
            <Sparkles size={20} className="text-[var(--accent)]" />
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            Connecting securely to Stripe Checkout...
          </p>
        </div>

        {loading && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <Loader2 size={36} className="animate-spin text-[var(--accent)]" />
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              Redirecting to secure Stripe payment page...
            </span>
          </div>
        )}

        {error && (
          <div className="space-y-4 text-left">
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-300 leading-relaxed">{error}</div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-4 rounded-xl bg-[var(--accent)] text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:opacity-90 transition-opacity"
              >
                <RotateCcw size={14} />
                Try Again
              </button>
              <Link
                to="/membership"
                className="flex-1 py-3 px-4 rounded-xl bg-black/5 dark:bg-[var(--pokemon-box-bg2,#242424)] border border-[var(--border-color)] text-[var(--text)] font-bold text-xs flex items-center justify-center gap-1.5 no-underline hover:bg-black/10 transition-colors"
              >
                <ArrowLeft size={14} />
                Back to Plans
              </Link>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
          <Lock size={13} className="text-emerald-400" />
          <span>256-bit SSL encrypted & handled by Stripe Managed Payments</span>
        </div>
      </div>
    </div>
  );
}
