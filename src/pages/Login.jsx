import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { User, Lock, LogIn, ArrowRight } from "lucide-react";
import { useMessage } from "../components/Shared/MessageContext";
import { authAPI, progressAPI, profileAPI } from "../utils/api.js";
import TextField from "../components/Shared/FormField/TextField.jsx";
import Button from "../components/Shared/Button.jsx";
import OAuthButtons from "../components/Shared/OAuthButtons.jsx";
import "../css/Login.css";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ usernameOrEmail: "", password: "", rememberMe: false });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showMessage } = useMessage();
  const clickedRef = useRef(false);

  const showVerifiedMessage = searchParams.get("verified") === "1";

  useEffect(() => {
    if (showVerifiedMessage) {
      showMessage("Email verified! You can now log in.", "success");
    }
  }, [showVerifiedMessage, showMessage]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (clickedRef.current || loading) return;
    clickedRef.current = true;
    setLoading(true);

    try {
      const loginData = await authAPI.login({
        usernameOrEmail: form.usernameOrEmail,
        password: form.password,
        rememberMe: form.rememberMe,
      });

      // Check if the user is verified from the login response
      if (!loginData.user.verified) {
        showMessage("Please verify your email before logging in.", "error");
        navigate(`/email-sent?email=${encodeURIComponent(loginData.user.email)}`);
        return;
      }

      let progressBars = [];
      try {
        const progressResponse = await progressAPI.getProgressBars();
        progressBars = progressResponse || [];
      } catch (_) {
        try {
          const profileResponse = await profileAPI.getProfile();
          progressBars = profileResponse?.progressBars || [];
        } catch (__) {
          progressBars = [];
        }
      }

      onLogin({
        ...loginData.user,
        username: loginData.user.username,
        email: loginData.user.email,
        createdAt: loginData.user.createdAt,
        profileTrainer: loginData.user.profileTrainer,
        avatar: loginData.user.avatar || null,
        verified: loginData.user.verified,
        isAdmin: loginData.user.isAdmin || false,
        isContentCreator: loginData.user.isContentCreator || false,
        youtubeUrl: loginData.user.youtubeUrl || null,
        twitchUrl: loginData.user.twitchUrl || null,
        onboarding: loginData.user.onboarding,
        progressBars,
      });

      // Chrome/browser credential helper
      if (window.PasswordCredential) {
        try {
          const cred = new window.PasswordCredential({
            id: form.usernameOrEmail,
            password: form.password,
            name: loginData.user.username,
          });
          await navigator.credentials.store(cred);
        } catch (_) {}
      }

      navigate("/");
    } catch (err) {
      if (err.message && err.message.includes("Account not verified")) {
        if (err.data && err.data.email) {
          showMessage("Account not verified. Redirecting to verification page...", "info");
          setTimeout(() => {
            navigate(`/email-sent?email=${encodeURIComponent(err.data.email)}`);
          }, 1500);
        } else {
          const email = form.usernameOrEmail.includes("@") ? form.usernameOrEmail : "";
          if (email) {
            showMessage("Account not verified. Redirecting to verification page...", "info");
            setTimeout(() => {
              navigate(`/email-sent?email=${encodeURIComponent(email)}`);
            }, 1500);
          } else {
            showMessage("Account not verified. Please use your email address to login.", "error");
          }
        }
      } else {
        showMessage(err.message || "Failed to log in", "error");
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        clickedRef.current = false;
      }, 750);
    }
  };

  return (
    <div className={`login-page-container ${loading ? "is-submitting" : ""}`}>
      <div className="login-card">
        {/* Header Title and Subtitle */}
        <div className="login-header">
          <h1 className="login-title">
            WELCOME <span className="login-title-accent">BACK</span>
          </h1>
          <p className="login-subtitle">
            <span>Log in to continue your Pokémon journey</span>
            <span className="login-sparkle-icon" aria-hidden="true" />
          </p>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="login-form-fields">
          <TextField
            id="username"
            name="usernameOrEmail"
            type="text"
            placeholder="Username or Email"
            value={form.usernameOrEmail}
            onChange={handleChange}
            startIcon={<User size={18} className="auth-field-icon" />}
            size="lg"
            fullWidth
            required
            autoComplete="username"
          />

          <TextField
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            startIcon={<Lock size={18} className="auth-field-icon" />}
            size="lg"
            fullWidth
            required
            autoComplete="current-password"
            showPasswordToggle
          />

          {/* Options Row: Remember Me + Forgot Password */}
          <div className="login-options-row">
            <label className="remember-me-checkbox">
              <input
                type="checkbox"
                name="rememberMe"
                checked={form.rememberMe}
                onChange={handleChange}
              />
              <span className="checkbox-svg">
                <svg viewBox="0 0 24 24" className="checkbox-check">
                  <path fill="none" strokeWidth="3" d="M4 12l5 5L20 7" />
                </svg>
              </span>
              <span>Remember me</span>
            </label>

            <Link to="/forgot-password" className="forgot-password-link">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            loading={loading}
            icon={<LogIn size={18} />}
            className="auth-main-btn"
          >
            Log In
          </Button>

          {/* Social OAuth Buttons with Divider */}
          <OAuthButtons
            layout="grid"
            dividerText="OR CONTINUE WITH"
            dividerPosition="top"
          />

          {/* Footer Link */}
          <div className="auth-footer-link">
            <span>Don't have an account?</span>{" "}
            <Link to="/register" className="auth-action-link">
              <span>Sign up</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
