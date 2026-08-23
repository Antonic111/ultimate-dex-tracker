import React, { useState, useEffect, useRef } from "react";
import { useMessage } from "../components/Shared/MessageContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ShieldCheck } from "lucide-react";
import { authAPI } from "../utils/api";
import TextField from "../components/Shared/FormField/TextField";
import Button from "../components/Shared/Button";
import "../css/ResetPassword.css";

const calculateStrength = (pass) => {
  if (!pass) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (pass.length >= 12) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;

  if (score <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
  if (score === 2) return { score: 2, label: "Fair", color: "#f97316" };
  if (score === 3) return { score: 3, label: "Good", color: "#eab308" };
  if (score === 4) return { score: 4, label: "Strong", color: "var(--accent, #38bdf8)" };
  return { score: 5, label: "Very Strong", color: "#10b981" };
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const code = searchParams.get("code");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const clickedRef = useRef(false);

  useEffect(() => {
    if (!email || !code) {
      showMessage("Invalid or expired reset session", "error");
      navigate("/forgot-password");
    }
  }, [email, code, navigate, showMessage]);

  const strength = calculateStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (clickedRef.current || loading) return;
    clickedRef.current = true;

    if (!newPassword || !confirmPassword) {
      showMessage("Please fill out both password fields", "error");
      clickedRef.current = false;
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("Passwords do not match", "error");
      clickedRef.current = false;
      return;
    }

    if (newPassword.length < 8) {
      showMessage("Password must be at least 8 characters long", "error");
      clickedRef.current = false;
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.resetPassword(email, code, newPassword);

      if (data?.status === 429 || data?.message === "Too many requests, please try again later.") {
        showMessage("Too many requests, please try again later.", "error");
        return;
      }
      if (data?.success) {
        // Tell Chrome to update the saved credential
        if (window.PasswordCredential) {
          try {
            const cred = new window.PasswordCredential({
              id: email,
              password: newPassword,
            });
            await navigator.credentials.store(cred);
          } catch (_) { /* optional */ }
        }
        showMessage("Password reset successful! Please log in.", "success");
        navigate("/login");
      } else {
        showMessage(`${data?.error || "Something went wrong"}`, "error");
      }
    } catch (err) {
      showMessage("Server error. Please try again.", "error");
    } finally {
      setLoading(false);
      setTimeout(() => {
        clickedRef.current = false;
      }, 750);
    }
  };

  return (
    <div className="reset-password-page-container">
      <div className="reset-password-card">
        
        {/* Glowing Lock Badge */}
        <div className="reset-password-hero-graphic" aria-hidden="true">
          <div className="reset-password-lock-badge">
            <Lock size={36} />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="reset-password-title">
          RESET <span className="reset-password-title-accent">YOUR PASSWORD</span>
        </h1>
        
        <p className="reset-password-description">
          Enter and confirm your new password to secure your account.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="reset-password-form" noValidate>
          {/* New Password Input */}
          <TextField
            id="new-password"
            name="newPassword"
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            startIcon={<Lock size={18} />}
            helperText="At least 8 characters with a number and a symbol."
            autoComplete="new-password"
            size="md"
            fullWidth
            required
          />

          {/* Password Strength Meter */}
          {newPassword && (
            <div className="password-strength-container" aria-live="polite">
              <div className="password-strength-bars">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className="password-strength-bar"
                    style={{
                      backgroundColor:
                        strength.score >= level ? strength.color : undefined,
                    }}
                  />
                ))}
              </div>
              <div className="password-strength-label">
                Password strength:{" "}
                <span
                  className="password-strength-value"
                  style={{ color: strength.color }}
                >
                  {strength.label}
                </span>
              </div>
            </div>
          )}

          {/* Confirm Password Input */}
          <TextField
            id="confirm-password"
            name="confirmPassword"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            startIcon={<Lock size={18} />}
            autoComplete="new-password"
            size="md"
            fullWidth
            required
          />

          {/* Reset Password Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={<ShieldCheck size={18} />}
            className="reset-password-submit-btn"
          >
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
}
