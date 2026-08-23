import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Send, ArrowLeft, ShieldCheck } from "lucide-react";
import { useMessage } from "../components/Shared/MessageContext";
import { authAPI } from "../utils/api";
import TextField from "../components/Shared/FormField/TextField";
import Button from "../components/Shared/Button";
import "../css/ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const clickedRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (clickedRef.current || loading) return; // 🛑 prevent spam
    clickedRef.current = true;

    if (!email.trim()) {
      showMessage("Please enter your email address", "error");
      clickedRef.current = false;
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.forgotPassword(email.trim());

      if (data?.status === 429) {
        showMessage(`${data.message}`, "error");
        return;
      }
      if (data?.success) {
        showMessage("Password reset email sent!", "success");
        navigate(`/enter-reset-code?email=${encodeURIComponent(email.trim())}`);
      } else {
        showMessage(`${data?.error || "Something went wrong"}`, "error");
      }
    } catch (err) {
      showMessage("Failed to send reset email. Please try again.", "error");
    } finally {
      setLoading(false);
      setTimeout(() => {
        clickedRef.current = false;
      }, 750); // 🔄 allow re-click after short delay
    }
  };

  return (
    <div className="forgot-page-container">
      <div className="forgot-card">
        
        {/* Glowing Mail Badge + Padlock */}
        <div className="forgot-hero-graphic" aria-hidden="true">
          <div className="forgot-mail-badge">
            <Mail size={36} />
            <div className="forgot-lock-badge">
              <Lock size={13} />
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="forgot-title">
          FORGOT <span className="forgot-title-accent">PASSWORD?</span>
        </h1>
        
        <p className="forgot-description">
          No worries! Enter your email and we'll send you a link to{" "}
          <span className="forgot-description-accent">reset your password</span>.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="forgot-form" noValidate>
          <TextField
            id="forgot-email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            startIcon={<Mail size={18} />}
            autoComplete="email"
            size="md"
            fullWidth
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={<Send size={16} />}
            className="forgot-submit-btn"
          >
            Send Reset Link
          </Button>

          <div className="forgot-divider">
            <span>or</span>
          </div>

          <Link to="/login" className="forgot-back-btn">
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </Link>
        </form>
      </div>

      {/* Bottom Trust Badge */}
      <div className="forgot-trust-badge">
        <ShieldCheck size={16} className="forgot-trust-icon" />
        <span>We'll never share your email with anyone.</span>
      </div>
    </div>
  );
}
