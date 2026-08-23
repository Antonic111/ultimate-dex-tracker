import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserCheck, User, Lock, Check, X, Loader } from "lucide-react";
import { UserContext } from "../components/Shared/UserContext";
import { useMessage } from "../components/Shared/MessageContext";
import { oauthAPI } from "../utils/api";
import { useUsernameAvailability } from "../hooks/useUsernameAvailability";
import { validateContent } from "../../shared/contentFilter";
import TextField from "../components/Shared/FormField/TextField";
import Button from "../components/Shared/Button";
import "../css/CompleteSignup.css";

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

export default function CompleteSignup({ onComplete }) {
  const user = useContext(UserContext);
  const navigate = useNavigate();
  const { showMessage } = useMessage();

  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.username && !username) {
      setUsername(user.username);
    }
  }, [user?.username]);

  const usernameAvailability = useUsernameAvailability(username, user?.username);
  const strength = calculateStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Validate username
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      showMessage("Please enter a username", "error");
      return;
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 15) {
      showMessage("Username must be between 3 and 15 characters", "error");
      return;
    }

    const usernameValidation = validateContent(trimmedUsername, "username");
    if (!usernameValidation.isValid) {
      showMessage(usernameValidation.error, "error");
      return;
    }

    if (trimmedUsername !== user?.username && !usernameAvailability.available) {
      showMessage(usernameAvailability.message || "Username is not available", "error");
      return;
    }

    // Validate password if provided
    if (password) {
      if (password.length < 8) {
        showMessage("Password must be at least 8 characters long", "error");
        return;
      }
      if (password !== confirmPassword) {
        showMessage("Passwords do not match", "error");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await oauthAPI.completeOAuthSetup({
        username: trimmedUsername,
        password: password || undefined,
        confirmPassword: confirmPassword || undefined,
      });

      if (res.user && typeof onComplete === "function") {
        onComplete(res.user);
      } else if (user.setUser && res.user) {
        user.setUser(prev => ({ ...prev, ...res.user }));
      }

      showMessage("Welcome! Your profile has been set up.", "success");
      navigate("/", { replace: true });
    } catch (err) {
      showMessage(err.userMessage || err.message || "Failed to complete account setup", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const res = await oauthAPI.completeOAuthSetup({ skip: true });
      if (res.user && typeof onComplete === "function") {
        onComplete(res.user);
      } else if (user.setUser && res.user) {
        user.setUser(prev => ({ ...prev, ...res.user }));
      }
      navigate("/", { replace: true });
    } catch (err) {
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  // Helper text for username input
  const getUsernameHelper = () => {
    if (username.trim() && usernameAvailability.message) {
      return (
        <span
          style={{
            color:
              usernameAvailability.status === "available"
                ? "#10b981"
                : usernameAvailability.status === "taken"
                ? "#ef4444"
                : "var(--text-muted)",
          }}
        >
          {usernameAvailability.message}
        </span>
      );
    }
    return "3-15 characters. This will be your public trainer handle.";
  };

  const getUsernameEndAdornment = () => {
    if (!username.trim()) return null;
    if (usernameAvailability.status === "checking") {
      return (
        <div className="username-status-badge">
          <Loader size={16} className="spinning" />
        </div>
      );
    }
    if (usernameAvailability.status === "available") {
      return (
        <div className="username-status-badge">
          <Check size={16} style={{ color: "#10b981" }} />
        </div>
      );
    }
    if (usernameAvailability.status === "taken") {
      return (
        <div className="username-status-badge">
          <X size={16} style={{ color: "#ef4444" }} />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="complete-signup-page-container">
      <div className="complete-signup-card">
        
        {/* Glowing User Hero Badge */}
        <div className="complete-signup-hero-graphic" aria-hidden="true">
          <div className="complete-signup-user-badge">
            <UserCheck size={36} />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="complete-signup-title">
          WELCOME, <span className="complete-signup-title-accent">TRAINER!</span>
        </h1>
        
        <p className="complete-signup-description">
          Choose your unique username and optionally set a password so you can also log in directly with email.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="complete-signup-form" noValidate>
          {/* Username Input */}
          <TextField
            id="setup-username"
            name="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            startIcon={<User size={18} />}
            endAdornment={getUsernameEndAdornment()}
            helperText={getUsernameHelper()}
            autoComplete="username"
            size="md"
            fullWidth
            required
            minLength={3}
            maxLength={15}
          />

          {/* Optional Password Input */}
          <TextField
            id="setup-password"
            name="password"
            type="password"
            placeholder="Create Password (Optional)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            startIcon={<Lock size={18} />}
            helperText="Optional. At least 8 characters to enable password login."
            autoComplete="new-password"
            size="md"
            fullWidth
          />

          {/* Password Strength Meter (Shown when password is typed) */}
          {password && (
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

          {/* Confirm Password Input (Only when password is typed) */}
          {password.length > 0 && (
            <TextField
              id="setup-confirm-password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              startIcon={<Lock size={18} />}
              helperText="Make sure your passwords match."
              autoComplete="new-password"
              size="md"
              fullWidth
              required={password.length > 0}
            />
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={<Check size={18} />}
            className="complete-signup-submit-btn"
          >
            Complete Registration
          </Button>

          <div className="complete-signup-divider">
            <span>or</span>
          </div>

          {/* Skip Button */}
          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="complete-signup-skip-btn"
          >
            Skip for now & continue as {user?.username || "Trainer"}
          </button>
        </form>

        {/* Legal Notice */}
        <p className="complete-signup-legal">
          By completing setup, you agree to our{" "}
          <Link to="/terms">Terms of Service</Link> and acknowledge our{" "}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
