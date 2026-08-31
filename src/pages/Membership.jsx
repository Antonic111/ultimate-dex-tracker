import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useUser } from "../components/Shared/UserContext";
import { useEntitlements } from "../hooks/useEntitlements";
import { useMessage } from "../components/Shared/MessageContext";
import { buildApiUrl } from "../config/api";
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Crown,
  Loader2,
  ArrowRight,
  Eye,
  Gift,
  Sliders,
  Shield,
  Rocket,
  Lock,
  Code2,
  Users,
  RotateCcw,
  Heart,
  Star,
  Headphones,
  Tv,
  Palette,
  Trophy,
} from "lucide-react";

/**
 * Premium features list
 */
const PLACEHOLDER_FEATURES = [
  {
    id: "feature-gif-avatar",
    icon: Sparkles,
    title: "Animated Profile Pictures",
    description: "Bring your profile to life with custom animated GIF avatars.",
  },
  {
    id: "feature-no-watermark",
    icon: Tv,
    title: "Remove Overlay Watermarks",
    description: "Enjoy a clean, unbranded streamer overlay in OBS & Streamlabs.",
  },
  {
    id: "feature-gradient-name",
    icon: Palette,
    title: "Gradient Username & Glowing Aura",
    description: "Stand out with a customized 2-color gradient profile name and matching dual-color ambient glow.",
  },
  {
    id: "feature-favorite-categories",
    icon: Trophy,
    title: "Display All Favorite Categories",
    description: "Unlock and showcase all 4 favorite categories on your profile with custom section reordering.",
  },
];

const WHY_UPGRADE_ITEMS = [
  {
    id: "why-1",
    icon: Code2,
    title: "Continuous Development",
    description: "Fund new features and improvements.",
  },
  {
    id: "why-2",
    icon: Users,
    title: "Community Driven",
    description: "Shape the future with your feedback.",
  },
  {
    id: "why-3",
    icon: Shield,
    title: "Exclusive Perks",
    description: "Stand out with unique supporter benefits.",
  },
];

export default function Membership() {
  const { user, setUser } = useUser();
  const {
    isPremium,
    subscription,
    isEligibleForIntroDiscount,
    loading: entitlementsLoading,
    refreshStatus,
  } = useEntitlements();
  const { showMessage } = useMessage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const previewParam = searchParams.get("preview") || searchParams.get("state");

  const [displayPrice, setDisplayPrice] = useState("$4.99");
  const [portalLoading, setPortalLoading] = useState(false);
  const [stripeCheckoutLoading, setStripeCheckoutLoading] = useState(false);
  const [testActionLoading, setTestActionLoading] = useState(false);

  const handleTestResetMembership = async () => {
    try {
      setTestActionLoading(true);
      const token = localStorage.getItem("authToken");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(buildApiUrl("/monetization/test/reset-membership"), {
        method: "POST",
        headers,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset membership");

      showMessage("Membership removed successfully for testing.", "success");
      if (setUser) {
        setUser((prev) => ({
          ...prev,
          isPremium: false,
        }));
      }
      await refreshStatus();
    } catch (err) {
      showMessage(err.message, "error");
    } finally {
      setTestActionLoading(false);
    }
  };

  const handleTestGrantMembership = async () => {
    try {
      setTestActionLoading(true);
      const token = localStorage.getItem("authToken");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(buildApiUrl("/monetization/test/grant-membership"), {
        method: "POST",
        headers,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to grant membership");

      showMessage("Test membership granted for 30 days.", "success");
      if (setUser) {
        setUser((prev) => ({
          ...prev,
          isPremium: true,
        }));
      }
      await refreshStatus();
    } catch (err) {
      showMessage(err.message, "error");
    } finally {
      setTestActionLoading(false);
    }
  };

  // If redirected back from Stripe with status or session_id, forward directly to the confirmation steps modal
  useEffect(() => {
    const status = searchParams.get("status");
    const sessionId = searchParams.get("session_id");
    if (status === "processing" || status === "success" || sessionId) {
      navigate(
        `/membership/checkout?status=success${sessionId ? `&session_id=${sessionId}` : ""}`,
        { replace: true }
      );
    }
  }, [searchParams, navigate]);

  const handleOpenStripePortal = async () => {
    try {
      setPortalLoading(true);
      const token = localStorage.getItem("authToken");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(buildApiUrl("/stripe/create-portal-session"), {
        method: "POST",
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to open Stripe billing portal.");
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error opening Stripe portal:", err);
      showMessage(err.message || "Failed to open billing portal.", "error");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleStartStripeCheckout = async () => {
    try {
      setStripeCheckoutLoading(true);
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
        throw new Error(data.error || "Failed to create Stripe checkout session.");
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error starting Stripe checkout:", err);
      showMessage(err.message || "Failed to start Stripe checkout.", "error");
    } finally {
      setStripeCheckoutLoading(false);
    }
  };

  // Compute effective state taking preview parameters into account
  const effectiveUser = previewParam === "logged_out" ? null : user;

  const effectiveIsPremium =
    previewParam === "offer" || previewParam === "logged_out"
      ? false
      : previewParam === "active" ||
        previewParam === "cancel_scheduled" ||
        previewParam === "past_due"
      ? true
      : isPremium;

  const effectiveSubscription =
    previewParam === "cancel_scheduled"
      ? {
          cancelAtPeriodEnd: true,
          currentPeriodEnd: new Date(
            Date.now() + 25 * 24 * 60 * 60 * 1000
          ).toISOString(),
          status: "active",
          managementUrls: {
            updatePaymentMethod: "https://billing.stripe.com",
            cancel: "https://billing.stripe.com",
          },
        }
      : previewParam === "past_due"
      ? {
          cancelAtPeriodEnd: false,
          currentPeriodEnd: new Date().toISOString(),
          status: "past_due",
          managementUrls: {
            updatePaymentMethod: "https://billing.stripe.com",
            cancel: "https://billing.stripe.com",
          },
        }
      : previewParam === "active"
      ? {
          cancelAtPeriodEnd: false,
          currentPeriodEnd: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          status: "active",
          managementUrls: {
            updatePaymentMethod: "https://billing.stripe.com",
            cancel: "https://billing.stripe.com",
          },
        }
      : subscription;

  const formatDate = (dateString) => {
    if (!dateString) return "September 27, 2026";
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

  return (
    <div className="w-full text-[var(--text)] py-10 relative pb-28 page-enter page-fade-in membership-page">
      <div className="w-full max-w-[1300px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--pokemon-box-bg)] border border-[var(--border-color)] text-[var(--accent)] text-xs sm:text-sm font-extrabold tracking-wider uppercase shadow-sm">
            <Crown size={15} />
            {effectiveIsPremium ? "Active Membership" : "Ultimate Membership"}
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[var(--text)]">
            {effectiveIsPremium ? (
              <>
                Your <span className="text-[var(--accent)]">Membership</span>
              </>
            ) : (
              <>
                Upgrade Your <span className="text-[var(--accent)]">Experience</span>
              </>
            )}
          </h1>
          <p className="text-[var(--text-muted)] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {effectiveIsPremium
              ? "Manage your active subscription, view supporter perks, and access your membership features."
              : "Unlock more from your tracking journey, support ongoing development, and access exclusive supporter perks."}
          </p>
        </div>


        {/* ============================================================ */}
        {/* 1. ACTIVE SUBSCRIBER STATE (LIVE STATE VIEW) */}
        {/* ============================================================ */}
        {effectiveIsPremium && (
          <>
            <div className="bg-[var(--pokemon-box-bg)] border border-[var(--border-color)] rounded-3xl p-8 sm:p-10 shadow-xl space-y-8">
              {/* Header Top Row: User status & Renewal Date */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border-color)]">
                {/* Left side: Avatar crown & Premium title */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-[var(--pokemon-box-bg2,#242424)] border border-[var(--border-color)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
                    <Crown size={30} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl sm:text-3xl font-black text-[var(--text)]">
                        Premium Member
                      </h2>
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </span>
                    </div>
                    <p className="text-[var(--text-muted)] text-xs sm:text-sm">
                      Thank you for supporting Ultimate Dex Tracker!
                    </p>
                  </div>
                </div>

                {/* Right side: Next Renewal Date */}
                <div className="md:text-right space-y-1 md:border-l md:border-[var(--border-color)] md:pl-8">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                    {effectiveSubscription?.cancelAtPeriodEnd
                      ? "Access Valid Until"
                      : "Next Renewal Date"}
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-[var(--text)] flex items-center gap-2 md:justify-end">
                    <Calendar size={20} className="text-[var(--accent)]" />
                    <span>{formatDate(effectiveSubscription?.currentPeriodEnd)}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {effectiveSubscription?.cancelAtPeriodEnd
                      ? "Your access remains open until the end of your billing cycle."
                      : "You're all set. Enjoy your benefits!"}
                  </p>
                </div>
              </div>

              {/* Cancellation Scheduled Notice */}
              {effectiveSubscription?.cancelAtPeriodEnd && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle2
                    className="text-blue-400 flex-shrink-0 mt-0.5"
                    size={18}
                  />
                  <div className="text-sm text-[var(--text)]">
                    <span className="font-bold text-[var(--text)] block">
                      Cancellation Scheduled
                    </span>
                    Your membership will remain fully active until{" "}
                    <span className="text-[var(--text)] font-medium">
                      {formatDate(effectiveSubscription?.currentPeriodEnd)}
                    </span>
                    . You will not be charged again.
                  </div>
                </div>
              )}

              {/* Past Due / Billing Problem Notice */}
              {effectiveSubscription?.status === "past_due" && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle
                    className="text-red-400 flex-shrink-0 mt-0.5"
                    size={18}
                  />
                  <div className="text-sm text-[var(--text)]">
                    <span className="font-bold text-[var(--text)] block">
                      Payment Problem Detected
                    </span>
                    There was an issue processing your latest renewal payment. Please update
                    your billing details to keep Premium active.
                  </div>
                </div>
              )}

              {/* Tier Benefits Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--accent)]">
                  <Sparkles size={14} />
                  <span>Your Current Tier Benefits</span>
                </div>

                {/* 2-Column Feature List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 py-1">
                  {PLACEHOLDER_FEATURES.map((feat) => (
                    <div key={feat.id} className="flex items-start gap-3 group">
                      <div className="w-6 h-6 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[var(--accent)]/20 transition-colors">
                        <CheckCircle2 size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-[var(--text)] block leading-snug">
                          {feat.title}
                        </span>
                        {feat.description && (
                          <span className="text-[11px] sm:text-xs text-[var(--text-muted)] block leading-snug mt-0.5">
                            {feat.description}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom 2 Action Buttons Side-by-Side */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleOpenStripePortal}
                  disabled={portalLoading}
                  className="w-full py-4 px-6 rounded-2xl bg-black/5 dark:bg-[var(--pokemon-box-bg2,#242424)] hover:bg-black/10 dark:hover:bg-white/[0.08] border border-[var(--border-color)] text-[var(--text)] font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {portalLoading ? (
                    <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
                  ) : (
                    <CreditCard size={18} />
                  )}
                  <span>Update Payment Method</span>
                  <ExternalLink size={14} className="text-[var(--text-muted)]" />
                </button>

                <button
                  type="button"
                  onClick={handleOpenStripePortal}
                  disabled={portalLoading}
                  className="w-full py-4 px-6 rounded-2xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/25 text-red-400 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {portalLoading ? (
                    <Loader2 size={18} className="animate-spin text-red-400" />
                  ) : (
                    <Shield size={18} />
                  )}
                  <span>Manage / Cancel Subscription</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>

            {/* Bottom 4 Assurance & Help Grid */}
            <div className="p-5 rounded-3xl bg-[var(--pokemon-box-bg)] border border-[var(--border-color)] shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Lock size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">Secure & Private</div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Your payment information is encrypted and always secure.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center flex-shrink-0">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">Cancel Anytime</div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    No commitments. Cancel your membership at any time.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0">
                  <Heart size={18} className="fill-pink-500/20" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">Thank You!</div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Your support helps keep this project alive and growing.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenStripePortal}
                className="flex items-center gap-3.5 no-underline hover:opacity-90 transition-opacity text-left bg-transparent border-0 cursor-pointer p-0"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                  <Headphones size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1">
                    Billing Support <ExternalLink size={11} className="text-[var(--text-muted)]" />
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Stripe manages invoices, receipts, and payment methods.
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* 2. FREE USER OFFER / 2-COLUMN MAIN SHOWCASE */}
        {/* ============================================================ */}
        {!effectiveIsPremium && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* LEFT CARD: Features & Overview (7 cols) */}
              <div className="lg:col-span-7 bg-[var(--pokemon-box-bg)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-6">
                <div className="space-y-6">
                  {/* Title & Badge */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl sm:text-3xl font-black text-[var(--text)]">
                        Premium Plan
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-black/5 dark:bg-[var(--pokemon-box-bg2,#242424)] text-[var(--accent)] border border-[var(--border-color)]">
                        Monthly
                      </span>
                    </div>
                    <p className="text-[var(--text-muted)] text-xs sm:text-sm">
                      Unlock more from your tracking experience.
                    </p>
                  </div>

                  <div className="border-t border-[var(--border-color)]" />

                  {/* Section Subheader */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--accent)]">
                      <Sparkles size={14} />
                      <span>Premium Features</span>
                    </div>

                    {/* 2-Column Feature List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 py-1">
                      {PLACEHOLDER_FEATURES.map((feat) => (
                        <div key={feat.id} className="flex items-start gap-3 group">
                          <div className="w-6 h-6 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[var(--accent)]/20 transition-colors">
                            <CheckCircle2 size={15} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-[var(--text)] block leading-snug">
                              {feat.title}
                            </span>
                            {feat.description && (
                              <span className="text-[11px] sm:text-xs text-[var(--text-muted)] block leading-snug mt-0.5">
                                {feat.description}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Stripe Guarantee */}
                <div className="pt-4 border-t border-[var(--border-color)] flex items-center gap-2.5 text-xs text-[var(--text-muted)]">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Lock size={12} />
                  </div>
                  <span>
                    Secure billing powered by <strong className="text-[var(--text)]">Stripe</strong>. Cancel anytime.
                  </span>
                </div>
              </div>

              {/* RIGHT CARD: Pricing & CTA Action (5 cols) */}
              <div className="lg:col-span-5 bg-[var(--pokemon-box-bg)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between text-center space-y-6">
                <div className="space-y-6">
                  {/* Badge */}
                  {isEligibleForIntroDiscount ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-wider mx-auto shadow-sm">
                      <Sparkles size={12} className="fill-current" />
                      20% Off First Month
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-[var(--pokemon-box-bg2,#242424)] border border-[var(--border-color)] text-[var(--accent)] text-xs font-extrabold uppercase tracking-wider mx-auto shadow-sm">
                      <Star size={12} className="fill-current" />
                      Best Value
                    </div>
                  )}

                  {/* Price Display */}
                  {isEligibleForIntroDiscount ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xl sm:text-2xl text-[var(--text-muted)] line-through font-bold">
                          $4.99
                        </span>
                        <span className="text-4xl sm:text-5xl font-black text-[var(--text)] tracking-tight">
                          $3.99
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        first month
                      </div>
                      <p className="text-xs text-amber-400/90 font-medium pt-1">
                        20% off your first month, then $4.99/month.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-4xl sm:text-5xl font-black text-[var(--text)] tracking-tight">
                        {displayPrice || "$4.99"}
                      </div>
                      <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        / month
                      </div>
                      <p className="text-xs text-[var(--text-muted)] pt-1">
                        Billed monthly. Cancel anytime.
                      </p>
                    </div>
                  )}

                  <div className="border-t border-[var(--border-color)]" />

                  {/* Checklist */}
                  <div className="space-y-3 text-left max-w-xs mx-auto">
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[var(--text)]">
                      <CheckCircle2 size={16} className="text-[var(--accent)] flex-shrink-0" />
                      <span>Unlock premium features</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[var(--text)]">
                      <CheckCircle2 size={16} className="text-[var(--accent)] flex-shrink-0" />
                      <span>Support ongoing development</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[var(--text)]">
                      <CheckCircle2 size={16} className="text-[var(--accent)] flex-shrink-0" />
                      <span>Access exclusive supporter perks</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[var(--text)]">
                      <CheckCircle2 size={16} className="text-[var(--accent)] flex-shrink-0" />
                      <span>Cancel anytime, no commitments</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  {effectiveUser?.username ? (
                    <button
                      type="button"
                      onClick={handleStartStripeCheckout}
                      disabled={stripeCheckoutLoading}
                      className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[var(--accent)] text-black font-extrabold text-base shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer border-0"
                    >
                      {stripeCheckoutLoading ? (
                        <Loader2 size={18} className="animate-spin text-black" />
                      ) : (
                        <Sparkles size={18} />
                      )}
                      <span>Upgrade to Premium</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <Link
                      to="/login?redirect=/membership"
                      className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[var(--accent)] text-black font-extrabold text-base shadow-lg hover:opacity-90 active:scale-[0.98] transition-all no-underline cursor-pointer"
                    >
                      <Sparkles size={18} />
                      Log In to Upgrade
                      <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION 1: Why Upgrade? (Full Width Card) */}
            <div className="bg-[var(--pokemon-box-bg)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left side text */}
                <div className="lg:col-span-3 space-y-1.5 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] pb-6 lg:pb-0 lg:pr-6">
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--text)]">
                    Why upgrade?
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Your support helps keep this project alive and continuously improving for everyone.
                  </p>
                </div>

                {/* Right side 3 mini columns */}
                <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {WHY_UPGRADE_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-[var(--pokemon-box-bg2,#242424)] border border-[var(--border-color)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
                          <Icon size={18} />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-[var(--text)]">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] leading-tight">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION 2: 3 Assurance Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[var(--pokemon-box-bg)] border border-[var(--border-color)] flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">Secure & Safe</div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Your payment is encrypted and secure.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--pokemon-box-bg)] border border-[var(--border-color)] flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-[var(--pokemon-box-bg2,#242424)] border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center flex-shrink-0">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">Cancel Anytime</div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Manage or cancel your membership anytime.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--pokemon-box-bg)] border border-[var(--border-color)] flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0">
                  <Heart size={18} className="fill-pink-500/20" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">Thank You!</div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Your support means the world.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Developer / Antonic Testing Controls */}
        {(user?.username?.toLowerCase() === "antonic" || user?.isAdmin) && (
          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Sliders size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Developer Testing Tool ({user?.username})
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  Live Membership Status:{" "}
                  <span className="font-bold text-[var(--text)]">
                    {effectiveIsPremium ? "Active Member" : "Free / Non-Member"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {effectiveIsPremium ? (
                <button
                  type="button"
                  onClick={handleTestResetMembership}
                  disabled={testActionLoading}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {testActionLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RotateCcw size={14} />
                  )}
                  Remove Membership (Testing)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTestGrantMembership}
                  disabled={testActionLoading}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {testActionLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  Grant 30-Day Membership (Testing)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Development State Previewer Toolbar (Only visible when previewParam is present in URL) */}
      {previewParam && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--pokemon-box-bg,#181818)]/95 backdrop-blur-md border border-white/15 rounded-2xl p-2 shadow-2xl flex items-center gap-1.5 text-xs max-w-[95vw] overflow-x-auto">
          <div className="flex items-center gap-1.5 text-[#888] px-2 py-1 font-bold whitespace-nowrap">
            <Eye size={14} className="text-[var(--accent)]" />
            <span>Page State:</span>
          </div>
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap border-0 bg-white/5 text-[#ccc] hover:bg-white/10"
          >
            Live State
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ preview: "offer" })}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap border-0 ${
              previewParam === "offer"
                ? "bg-[var(--accent)] text-black font-extrabold shadow-sm"
                : "bg-white/5 text-[#ccc] hover:bg-white/10"
            }`}
          >
            Free Offer
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ preview: "active" })}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap border-0 ${
              previewParam === "active"
                ? "bg-[var(--accent)] text-black font-extrabold shadow-sm"
                : "bg-white/5 text-[#ccc] hover:bg-white/10"
            }`}
          >
            Active Member
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ preview: "cancel_scheduled" })}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap border-0 ${
              previewParam === "cancel_scheduled"
                ? "bg-[var(--accent)] text-black font-extrabold shadow-sm"
                : "bg-white/5 text-[#ccc] hover:bg-white/10"
            }`}
          >
            Cancel Scheduled
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ preview: "past_due" })}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap border-0 ${
              previewParam === "past_due"
                ? "bg-[var(--accent)] text-black font-extrabold shadow-sm"
                : "bg-white/5 text-[#ccc] hover:bg-white/10"
            }`}
          >
            Past Due
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ preview: "logged_out" })}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap border-0 ${
              previewParam === "logged_out"
                ? "bg-[var(--accent)] text-black font-extrabold shadow-sm"
                : "bg-white/5 text-[#ccc] hover:bg-white/10"
            }`}
          >
            Logged Out
          </button>
          <Link
            to="/membership/checkout?preview=checkout"
            className="px-3 py-1.5 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] font-bold hover:bg-[var(--accent)]/25 transition-all no-underline whitespace-nowrap"
          >
            Go to Checkout Preview →
          </Link>
        </div>
      )}
    </div>
  );
}
