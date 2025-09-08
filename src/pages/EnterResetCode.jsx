import React, { useState, useEffect, useRef } from "react";
import { useMessage } from "../components/Shared/MessageContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { authAPI } from "../utils/api";
import "../css/EnterResetCode.css";

const EnterResetCode = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
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
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    }
    return () => clearTimeout(cooldownRef.current);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (clickedRef.current || loading) return; // 🛑 prevent spam
    clickedRef.current = true;

    if (!email || !code) {
              showMessage("Email or code missing", "error");
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.verifyResetCode(email, code);

      if (data.status === 429 || data.message === "Too many requests, please try again later.") {
        showMessage("Too many requests, please try again later.", "error");
        return;
      }
      if (data.success) {
        showMessage("Code verified! Reset your password.", "success");
        navigate(`/reset-password?email=${encodeURIComponent(email)}&code=${code}`);
      } else {
        showMessage(`${data.error || "Invalid code"}`, "error");
      }
    } catch (err) {
              showMessage("Server error", "error");
    } finally {
      setLoading(false);
      setTimeout(() => {
        clickedRef.current = false;
      }, 750); // 🔄 allow re-click after short delay
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      const data = await authAPI.forgotPassword(email);

      if (data.success) {
        showMessage("Reset code resent!", "success");
        setResendCooldown(30); // Start 30-second cooldown
      } else {
        showMessage(`${data.error || "Failed to resend email"}`, "error");
      }
    } catch {
              showMessage("Failed to resend email", "error");
    }
  };

  return (
    <div className="enter-reset-code-form page-container auth-page">
      <h2 className="enter-reset-code-title">ENTER RESET CODE</h2>
      <form onSubmit={handleSubmit} className="enter-reset-code-form-fields">
        <p className="auth-subtext">
          A 6-digit code was sent to:<br />
          <strong>{email}</strong>
        </p>
        <div className="input-icon-wrapper">
          <KeyRound className="auth-icon" size={20} />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="enter-reset-code-input"
            required
            maxLength={6}
          />
        </div>

        <button type="submit" className="enter-reset-code-button" disabled={loading}>
          {loading ? "Verifying..." : "Verify Code"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="resend-button"
        >
          {resendCooldown > 0
            ? `Resend Email (${resendCooldown}s)`
            : "Resend Email"}
        </button>
      </form>
    </div>
  );
};

export default EnterResetCode;
