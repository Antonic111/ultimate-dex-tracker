import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tv,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Radio,
  MonitorCheck,
  Shield,
  Lock,
  Award,
  Zap,
  ShieldCheck,
  Settings,
  Palette
} from "lucide-react";
import { Button } from "../components/Shared/Button";
import { ConfirmModal } from "../components/Shared/Modal";
import { SectionLoader } from "../components/Shared";
import { useMessage } from "../components/Shared/MessageContext";
import { streamerOverlayAPI } from "../utils/api";
import "../css/StreamerOverlay.css";

export default function StreamerTools() {
  const navigate = useNavigate();
  const { showMessage } = useMessage();

  const [overlay, setOverlay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const overlayRes = await streamerOverlayAPI.getOverlayConfig();

        if (!isMounted) return;

        if (overlayRes?.overlay) {
          setOverlay(overlayRes.overlay);
        }
      } catch (err) {
        console.error("Error loading streamer tools:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const obsUrl = overlay?.overlayToken
    ? `${window.location.origin}/overlay/hunt/${overlay.overlayToken}`
    : "";

  const displayWidth = overlay?.canvasWidth || (() => {
    try {
      const cached = JSON.parse(localStorage.getItem("hunt_overlay_config_cache"));
      return cached?.canvasWidth || 1920;
    } catch {
      return 1920;
    }
  })();

  const displayHeight = overlay?.canvasHeight || (() => {
    try {
      const cached = JSON.parse(localStorage.getItem("hunt_overlay_config_cache"));
      return cached?.canvasHeight || 1080;
    } catch {
      return 1080;
    }
  })();

  const handleCopyUrl = async () => {
    if (!obsUrl) return;
    try {
      await navigator.clipboard.writeText(obsUrl);
      setIsCopied(true);
      showMessage("OBS Browser Source URL copied to clipboard! ✨", "success");
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      showMessage("Failed to copy URL", "error");
    }
  };

  const handleRegenerateToken = async () => {
    try {
      setRegenLoading(true);
      const res = await streamerOverlayAPI.regenerateToken();
      if (res?.overlay) {
        setOverlay(res.overlay);
        showMessage("Secret overlay URL regenerated successfully!", "success");
        setShowRegenModal(false);
      }
    } catch (err) {
      showMessage("Failed to regenerate token", "error");
    } finally {
      setRegenLoading(false);
    }
  };

  if (loading && !overlay) {
    return <SectionLoader minHeight="60vh" />;
  }

  return (
    <div className="streamer-tools-page fade-in-up">
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="streamer-tools-header-wrap">
        <h1 className="streamer-tools-main-title">
          Streamer Tools
        </h1>
      </div>

      <div className="app-divider" />

      {/* ── MAIN TOOLS GRID (2 COLUMNS) ────────────────────────────────────── */}
      <div className="streamer-tools-grid">
        {/* CARD 1: HUNT OVERLAY */}
        <div className="streamer-card">
          <div className="streamer-card-header">
            <div className="streamer-card-title-group min-w-0 pr-2">
              <div className="streamer-card-icon">
                <Radio size={22} />
              </div>
              <div className="min-w-0">
                <h2 className="streamer-card-title">Hunt Overlay</h2>
                <p className="streamer-card-desc">
                  Permanent account-based OBS Browser Source that follows your Current hunt in real-time.
                </p>
              </div>
            </div>

            <div className="flex items-center flex-shrink-0 mr-1">
              <div className="streamer-card-status-badge active" title="Overlay updates instantly across all connected OBS clients">
                <span className="streamer-status-dot" />
                <span>LIVE SYNC</span>
              </div>
            </div>
          </div>

          {/* Secret OBS URL Click-to-Copy Section */}
          <div className="streamer-url-section">
            <div className="flex items-center justify-between mb-1">
              <label className="streamer-url-label">
                OVERLAY URL
              </label>
              <span className="text-[11px] text-[var(--text-muted)] font-medium">
                Click box to copy
              </span>
            </div>
            
            <button
              type="button"
              onClick={handleCopyUrl}
              className="streamer-blurred-copy-box group"
              title="Click to copy secret OBS Browser Source URL"
            >
              {/* Blurred URL in background */}
              <span className="streamer-blurred-url-text select-none">
                {obsUrl || "http://localhost:5173/overlay/hunt/c26b8de1a2dbb9205cc85b3f9..."}
              </span>

              {/* Centered CTA Button */}
              <div className="streamer-center-copy-btn">
                {isCopied ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-300 font-bold">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} className="text-[var(--accent)] group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-white group-hover:text-[var(--accent)] transition-colors">
                      Copy URL
                    </span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 pb-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate("/streamer-tools/overlay")}
              icon={<Sliders size={16} />}
              className="w-full justify-center"
            >
              Edit Overlay Workspace
            </Button>

            {obsUrl && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => window.open(obsUrl, "_blank", "width=800,height=500")}
                icon={<ExternalLink size={16} />}
                className="w-full justify-center"
              >
                Test in New Window
              </Button>
            )}
          </div>

          {/* Regenerate Token Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 pb-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRegenModal(true)}
              icon={<RotateCcw size={14} />}
              title="Regenerate secret overlay token"
            >
              Regenerate Token
            </Button>
            <span className="text-xs text-[var(--text-muted)]">
              Regenerate if you make major changes to your overlay setup.
            </span>
          </div>

          {/* Privacy & Security Note */}
          <div className="streamer-privacy-bar">
            <div className="flex items-center gap-2 min-w-0">
              <Shield size={15} className="text-[var(--text-muted)] flex-shrink-0" />
              <span className="text-xs text-[var(--text-muted)] truncate">
                Keep your overlay URL private. Anyone with the URL can view your overlay.
              </span>
            </div>
            <Lock size={14} className="text-[var(--text-muted)] flex-shrink-0 ml-2" />
          </div>
        </div>

        {/* CARD 2: QUICK OBS SETUP GUIDE */}
        <div className="streamer-card">
          <div className="streamer-card-header">
            <div className="streamer-card-title-group min-w-0 pr-2">
              <div className="streamer-card-icon">
                <MonitorCheck size={22} />
              </div>
              <div className="min-w-0">
                <h2 className="streamer-card-title">OBS Quick Setup</h2>
                <p className="streamer-card-desc">Add in 30 seconds to OBS Studio or Streamlabs.</p>
              </div>
            </div>

            {/* OBS & Streamlabs Brand Logos */}
            <div className="streamer-logos-badge">
              <img
                src="/streamer-program-logos.png"
                alt="OBS Studio and Streamlabs"
                className="streamer-logos-img"
              />
            </div>
          </div>

          {/* Numbered Steps */}
          <div className="streamer-guide-steps">
            <div className="streamer-guide-step">
              <span className="streamer-guide-step-num">1</span>
              <div>
                In OBS Studio, click <strong className="streamer-kbd">+</strong> under <strong className="streamer-kbd">Sources</strong> and select <strong className="streamer-kbd">Browser</strong>.
              </div>
            </div>

            <div className="streamer-guide-step">
              <span className="streamer-guide-step-num">2</span>
              <div>
                Paste your secret Browser Source URL copied from the left into the <strong className="streamer-kbd">URL</strong> field.
              </div>
            </div>

            <div className="streamer-guide-step">
              <span className="streamer-guide-step-num">3</span>
              <div>
                Set the <strong className="streamer-kbd">Width</strong> to <strong className="streamer-kbd">{displayWidth}</strong> and <strong className="streamer-kbd">Height</strong> to <strong className="streamer-kbd">{displayHeight}</strong> (or your stream canvas size).
              </div>
            </div>

            <div className="streamer-guide-step">
              <span className="streamer-guide-step-num">4</span>
              <div>
                (Recommended) Check <em>"Shutdown source when not visible"</em> and <em>"Refresh browser when scene becomes active"</em>.
              </div>
            </div>

            <div className="streamer-guide-step">
              <span className="streamer-guide-step-num">5</span>
              <div className="text-[var(--accent)] font-semibold flex items-start gap-1.5">
                <Check size={16} className="flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Done!</strong> The overlay automatically follows whichever hunt you focus in counter page without any OBS refreshes.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM FEATURES BANNER ─────────────────────────────────────────── */}
      <div className="streamer-features-banner">
        {/* Left Side: Badge and Info */}
        <div className="streamer-features-main">
          <div className="streamer-features-badge-icon">
            <Award size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="streamer-features-title">
              Built for Hunters, Streamers & Collectors
            </h3>
            <p className="streamer-features-desc">
              All tools are account-based and update in real-time across your stream.
            </p>
          </div>
        </div>

        {/* Right Side: 4 Feature Highlights */}
        <div className="streamer-features-grid">
          <div className="streamer-feature-item">
            <Zap size={18} className="streamer-feature-icon" />
            <div className="flex flex-col">
              <span className="streamer-feature-name">Real-time Sync</span>
              <span className="streamer-feature-sub">Instant updates</span>
            </div>
          </div>

          <div className="streamer-feature-item">
            <ShieldCheck size={18} className="streamer-feature-icon" />
            <div className="flex flex-col">
              <span className="streamer-feature-name">Secure & Private</span>
              <span className="streamer-feature-sub">Your data, your control</span>
            </div>
          </div>

          <div className="streamer-feature-item">
            <Settings size={18} className="streamer-feature-icon" />
            <div className="flex flex-col">
              <span className="streamer-feature-name">Easy Setup</span>
              <span className="streamer-feature-sub">Get started in minutes</span>
            </div>
          </div>

          <div className="streamer-feature-item">
            <Palette size={18} className="streamer-feature-icon" />
            <div className="flex flex-col">
              <span className="streamer-feature-name">Extreme Customization</span>
              <span className="streamer-feature-sub">Tailor every pixel</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── REGENERATE URL CONFIRMATION MODAL ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={showRegenModal}
        onClose={() => setShowRegenModal(false)}
        onConfirm={handleRegenerateToken}
        title="Regenerate Secret OBS Overlay URL?"
        message="Regenerating your overlay token will immediately invalidate your existing OBS Browser Source URL until you paste the newly generated URL into OBS. Are you sure you want to proceed?"
        confirmText="Regenerate Token"
        variant="danger"
        loading={regenLoading}
      />
    </div>
  );
}
