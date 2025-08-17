import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMessage } from "../components/Shared/MessageContext";
import { KeyRound } from "lucide-react";

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
      showMessage("❌ Missing email in URL", "error");
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
      showMessage("❌ Email or code missing", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (res.status === 429 || data.message === "Too many requests, please try again later.") {
        showMessage("❌ Too many requests, please try again later.", "error");
        return;
      }

      if (res.ok) {
        showMessage("✅ Code verified! Reset your password.", "success");
        navigate(`/reset-password?email=${encodeURIComponent(email)}&code=${code}`);
      } else {
        showMessage(`❌ ${data.error || "Invalid code"}`, "error");
      }
    } catch (err) {
      showMessage("❌ Server error", "error");
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
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        showMessage("📧 Reset code resent!", "success");
        setResendCooldown(30); // Start 30-second cooldown
      } else {
        showMessage(`❌ ${data.error || "Failed to resend email"}`, "error");
      }
    } catch {
      showMessage("❌ Failed to resend email", "error");
    }
  };

  return (
    <div className="auth-form">
      <h2 className="auth-heading">ENTER RESET CODE</h2>
      <form onSubmit={handleSubmit}>
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
            required
            maxLength={6}
          />
        </div>

        <button type="submit" disabled={loading} className="auth-button">
          {loading ? "Verifying..." : "Verify Code"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="auth-button resend-button"
          style={{ 
            marginTop: "10px",
            opacity: resendCooldown > 0 ? 0.5 : 1,
            cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer'
          }}
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
