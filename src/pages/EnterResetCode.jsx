import React, { useState, useEffect, useRef } from "react";
import { useMessage } from "../components/Shared/MessageContext";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { KeyRound, Lock, CheckCircle2, RotateCw, ArrowLeft } from "lucide-react";
import { authAPI } from "../utils/api";
import TextField from "../components/Shared/FormField/TextField";
import Button from "../components/Shared/Button";
import "../css/EnterResetCode.css";

export default function EnterResetCode() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const [searchParams] = useSearchParams();
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const clickedRef = useRef(false);

  const email = searchParams.get("email") || sessionStorage.getItem("resetEmail");

  useEffect(() => {
    if (!email) {
      showMessage("Missing email in URL", "error");
      navigate("/forgot-password");
    } else {
      sessionStorage.setItem("resetEmail", email); // persist for refreshes
    }
  }, [email, navigate, showMessage]);

  // Countdown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownRef.current = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(cooldownRef.current);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (clickedRef.current || loading) return; // 🛑 prevent spam
    clickedRef.current = true;

    const trimmedCode = code.trim();
    if (!email || !trimmedCode) {
      showMessage("Please enter the 6-digit code", "error");
      clickedRef.current = false;
      return;
    }

    if (trimmedCode.length !== 6) {
      showMessage("Code must be 6 digits", "error");
      clickedRef.current = false;
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.verifyResetCode(email, trimmedCode);

      if (data?.status === 429 || data?.message === "Too many requests, please try again later.") {
        showMessage("Too many requests, please try again later.", "error");
        return;
      }
      if (data?.success) {
        showMessage("Code verified! Reset your password.", "success");
        navigate(`/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(trimmedCode)}`);
      } else {
        showMessage(`${data?.error || "Invalid code"}`, "error");
      }
    } catch (err) {
      showMessage("Server error. Please try again.", "error");
    } finally {
      setLoading(false);
      setTimeout(() => {
        clickedRef.current = false;
      }, 750); // 🔄 allow re-click after short delay
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);

    try {
      const data = await authAPI.forgotPassword(email);

      if (data?.success) {
        showMessage("Reset code resent to your email!", "success");
        setResendCooldown(30); // Start 30-second cooldown
      } else {
        showMessage(`${data?.error || "Failed to resend email"}`, "error");
      }
    } catch {
      showMessage("Failed to resend email", "error");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="reset-code-page-container">
      <div className="reset-code-card">
        
        {/* Glowing Key Badge + Lock */}
        <div className="reset-code-hero-graphic" aria-hidden="true">
          <div className="reset-code-key-badge">
            <KeyRound size={36} />
            <div className="reset-code-sub-badge">
              <Lock size={13} />
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="reset-code-title">
          ENTER <span className="reset-code-title-accent">RESET CODE</span>
        </h1>
        
        <p className="reset-code-description">
          We sent a 6-digit verification code to:<br />
          <strong className="reset-code-description-accent">{email}</strong>
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="reset-code-form" noValidate>
          <div className="reset-code-input-wrapper">
            <TextField
              id="reset-code-input"
              name="code"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(val);
              }}
              startIcon={<KeyRound size={18} />}
              maxLength={6}
              autoComplete="one-time-code"
              size="md"
              fullWidth
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={<CheckCircle2 size={16} />}
            className="reset-code-submit-btn"
          >
            Verify Code
          </Button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            className="reset-code-resend-btn"
          >
            <RotateCw size={15} className={resendLoading ? "animate-spin" : ""} />
            <span>
              {resendCooldown > 0
                ? `Resend Code (${resendCooldown}s)`
                : resendLoading
                ? "Resending..."
                : "Resend Code"}
            </span>
          </button>

          <div className="reset-code-divider">
            <span>or</span>
          </div>

          <Link to="/login" className="reset-code-back-btn">
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </Link>
        </form>
      </div>
    </div>
  );
}
