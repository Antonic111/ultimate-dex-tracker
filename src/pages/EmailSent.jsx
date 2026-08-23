import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useMessage } from "../components/Shared/MessageContext";
import { useUser } from "../components/Shared/UserContext";
import { Mail, CheckCircle2, KeyRound, RotateCw, ArrowLeft, Inbox } from "lucide-react";
import { authAPI } from "../utils/api";
import TextField from "../components/Shared/FormField/TextField";
import Button from "../components/Shared/Button";
import "../css/EmailSent.css";

export default function EmailSent() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || sessionStorage.getItem("verifyEmail");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);
  const clickedRef = useRef(false);

  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    if (!email) {
      showMessage("Missing email address", "error");
      navigate("/register");
    } else {
      sessionStorage.setItem("verifyEmail", email);
    }
  }, [email, navigate, showMessage]);

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
    if (clickedRef.current || loading) return;
    clickedRef.current = true;

    const trimmedCode = code.trim();
    if (!email || !trimmedCode) {
      showMessage("Please enter the 6-digit verification code", "error");
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
      const data = await authAPI.verifyCode(email, trimmedCode);
      showMessage("Email verified! Welcome to Ultimate Dex Tracker.", "success");

      if (data?.user) {
        setUser({ ...data.user });
      }

      navigate("/", { replace: true });
    } catch (err) {
      showMessage(err?.message || "Failed to verify code. Please try again.", "error");
    } finally {
      setLoading(false);
      setTimeout(() => {
        clickedRef.current = false;
      }, 750);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);

    try {
      await authAPI.resendCode(email);
      showMessage("Verification email resent!", "success");
      setResendCooldown(30); // Start 30-second cooldown
    } catch (err) {
      showMessage(err?.message || "Failed to resend email", "error");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="email-sent-page-container">
      <div className="email-sent-card">
        
        {/* Glowing Mail Badge + Check */}
        <div className="email-sent-hero-graphic" aria-hidden="true">
          <div className="email-sent-mail-badge">
            <Mail size={36} />
            <div className="email-sent-check-badge">
              <CheckCircle2 size={14} />
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="email-sent-title">
          VERIFY <span className="email-sent-title-accent">YOUR EMAIL</span>
        </h1>
        
        <p className="email-sent-description">
          A 6-digit verification code was sent to:<br />
          <strong className="email-sent-description-accent">{email}</strong>
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="email-sent-form" noValidate>
          <div className="email-sent-input-wrapper">
            <TextField
              id="verify-code-input"
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
            className="email-sent-submit-btn"
          >
            Verify Email
          </Button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            className="email-sent-resend-btn"
          >
            <RotateCw size={15} className={resendLoading ? "animate-spin" : ""} />
            <span>
              {resendCooldown > 0
                ? `Resend Email (${resendCooldown}s)`
                : resendLoading
                ? "Resending..."
                : "Resend Email"}
            </span>
          </button>

          <div className="email-sent-divider">
            <span>or</span>
          </div>

          <Link to="/login" className="email-sent-back-btn">
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </Link>
        </form>

        {/* Hints Box */}
        <div className="email-sent-hints">
          <div className="email-sent-hint-item">
            <Inbox size={14} className="email-sent-hint-icon" />
            <span>Can't find the email? Check your spam/junk folder or click Resend.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
