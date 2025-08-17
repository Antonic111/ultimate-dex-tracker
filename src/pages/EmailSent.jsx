import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMessage } from "../components/Shared/MessageContext";
import { useUser } from "../components/Shared/UserContext";
import { KeyRound } from "lucide-react";
import { authAPI } from "../utils/api";

const EmailSent = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || sessionStorage.getItem("verifyEmail");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    // Only run once when component mounts
    if (!email) {
      showMessage("❌ Missing email", "error");
      navigate("/register");
    } else {
      sessionStorage.setItem("verifyEmail", email);
    }
  }, []); // Empty dependency array to run only once

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
    if (!email || !code) {
      showMessage("❌ Please enter the code", "error");
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.verifyCode(email, code);
      showMessage("✅ Email verified! Welcome!", "success");
      
      // Set user data and navigate to home
      setUser({
        username: data.user.username,
        email: data.user.email,
        createdAt: data.user.createdAt,
        profileTrainer: data.user.profileTrainer
      });
      
      // Navigate to home page - App.jsx will handle authentication check
      navigate("/", { replace: true });
    } catch (err) {
      showMessage("❌ Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      await authAPI.resendCode(email);
      showMessage("📨 Verification email resent!", "success");
      setResendCooldown(30); // Start 30-second cooldown
    } catch {
      showMessage("❌ Failed to resend email", "error");
    }
  };

  return (
    <div className="auth-form">
      <h2>VERIFY YOUR EMAIL</h2>
      <div className="email-sent-message">
        <p>
          A 6-digit code was sent to:
          <br />
          <strong>{email}</strong>
          <br />
          Enter that code below to verify your account.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
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

        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="auth-button resend-button"
          style={{ marginTop: "10px" }}
        >
          {resendCooldown > 0
            ? `Resend Email (${resendCooldown}s)`
            : "Resend Email"}
        </button>
      </form>
    </div>
  );
};

export default EmailSent;
