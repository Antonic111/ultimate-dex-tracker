import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, UserPlus, CheckSquare, Timer, Users } from "lucide-react";
import { useMessage } from "../components/Shared/MessageContext";
import { validateContent } from "../../shared/contentFilter.js";
import { authAPI } from "../utils/api.js";
import TextField from "../components/Shared/FormField/TextField";
import Button from "../components/Shared/Button";
import OAuthButtons from "../components/Shared/OAuthButtons";
import { BALL_OPTIONS } from "../Constants";
import "../css/Register.css";

const ALL_BALLS = BALL_OPTIONS.filter((b) => b.image);

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

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const strength = calculateStrength(form.password);
  const [currentBallIndex, setCurrentBallIndex] = useState(0); // Starts with standard Poké Ball
  const [ballBounce, setBallBounce] = useState(false);

  const handleBallClick = () => {
    // Pick a random ball different from current
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * ALL_BALLS.length);
    } while (nextIndex === currentBallIndex && ALL_BALLS.length > 1);
    
    setCurrentBallIndex(nextIndex);
    setBallBounce(true);
    setTimeout(() => setBallBounce(false), 400);
  };

  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const clickedRef = useRef(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (clickedRef.current || loading) return; // 🚫 prevent rapid clicks
    clickedRef.current = true;
    setLoading(true);

    if (form.password !== form.confirmPassword) {
      showMessage("Passwords do not match", "error");
      setLoading(false);
      clickedRef.current = false;
      return;
    }

    if (form.password.length < 8) {
      showMessage("Password must be at least 8 characters long", "error");
      setLoading(false);
      clickedRef.current = false;
      return;
    }

    const usernameValidation = validateContent(form.username, 'username');
    if (!usernameValidation.isValid) {
      showMessage(`${usernameValidation.error}`, "error");
      setLoading(false);
      clickedRef.current = false;
      return;
    }

    try {
      const result = await authAPI.register({
        username: form.username,
        email: form.email,
        password: form.password,
        profileTrainer: "ash.png",
      });

      // Tell Chrome/browser password manager to offer saving the new credentials
      if (window.PasswordCredential) {
        try {
          const cred = new window.PasswordCredential({
            id: form.email,
            password: form.password,
            name: form.username,
          });
          await navigator.credentials.store(cred);
        } catch (_) { /* optional */ }
      }

      if (result?.emailSent === false) {
        showMessage("Account created, but email failed to send. Please use Resend Email on the verify page.", "warning");
      } else {
        showMessage("Account created! Please verify your email.", "success");
      }
      setTimeout(() => navigate(`/email-sent?email=${encodeURIComponent(form.email)}`), 1000);

    } catch (err) {
      let errorMessage = "Registration failed";
      
      if (err.message.includes("Username or email already taken")) {
        errorMessage = "❌ Username or email is already taken. Please try a different one.";
      } else if (err.message.includes("Password must be at least 8 characters")) {
        errorMessage = "❌ Password must be at least 8 characters long.";
      } else if (err.message.includes("Registration failed")) {
        errorMessage = "❌ Registration failed. Please try again.";
      } else {
        errorMessage = `❌ ${err.message}`;
      }
      
      showMessage(errorMessage, "error");
    } finally {
      setLoading(false);
      setTimeout(() => {
        clickedRef.current = false;
      }, 750); // 🔄 allow resubmit after short delay
    }
  };

  return (
    <div className="register-page-container">
      <div className="register-card">
        
        {/* Left Column: Brand & Feature Highlights */}
        <div className="register-sidebar">
          <div className="register-sidebar-content">
            
            {/* Glowing Pokéball Illustration with 3 Sparkle Types & Interactive Ball Cycling */}
            <button
              type="button"
              className="register-hero-graphic-btn"
              onClick={handleBallClick}
              aria-label={`Change Pokéball style. Current: ${ALL_BALLS[currentBallIndex]?.name || "Poké Ball"}`}
              title={`Click to change Pokéball! (Current: ${ALL_BALLS[currentBallIndex]?.name || "Poké Ball"})`}
            >
              <span className="register-graphic-sparkle sp-top-left sparkle-type-1" />
              <span className="register-graphic-sparkle sp-top-right sparkle-type-2" />
              <img
                src={ALL_BALLS[currentBallIndex]?.image || "/data/balls/poke-ball.png"}
                alt={ALL_BALLS[currentBallIndex]?.name || "Poké Ball"}
                className={`register-hero-ball ${ballBounce ? "ball-pop" : ""}`}
              />
              <span className="register-graphic-sparkle sp-bot-left sparkle-type-3" />
              <span className="register-graphic-sparkle sp-bot-right sparkle-type-1" />
            </button>

            <h2 className="register-sidebar-title">
              JOIN THE <span className="register-title-accent">JOURNEY</span>
            </h2>
            
            <p className="register-sidebar-desc">
              Track your Pokémon, complete your collection, and connect with trainers worldwide.
            </p>

            <div className="register-features-list">
              <div className="register-feature-item">
                <div className="register-feature-icon-badge badge-track">
                  <CheckSquare size={18} />
                </div>
                <div>
                  <h3 className="register-feature-title">Track Everything</h3>
                  <p className="register-feature-subtitle">
                    Keep track of your catches, shinies, and more.
                  </p>
                </div>
              </div>

              <div className="register-feature-item">
                <div className="register-feature-icon-badge badge-goals">
                  <Timer size={18} />
                </div>
                <div>
                  <h3 className="register-feature-title">Hunt Counters</h3>
                  <p className="register-feature-subtitle">
                    Count encounters, calculate odds, and manage active hunts.
                  </p>
                </div>
              </div>

              <div className="register-feature-item">
                <div className="register-feature-icon-badge badge-compete">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="register-feature-title">Connect & Compete</h3>
                  <p className="register-feature-subtitle">
                    Compare collections and climb the leaderboards.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Registration Form */}
        <div className="register-content">
          <div className="register-header">
            <h1 className="register-title">
              <span className="register-sparkle-icon sparkle-type-2" aria-hidden="true" />
              SIGN <span className="register-title-accent">UP</span>
              <span className="register-sparkle-icon sparkle-type-3" aria-hidden="true" />
            </h1>
          </div>

          <div className="register-divider">
            <span>continue with</span>
          </div>

          {/* Social OAuth Grid */}
          <OAuthButtons layout="grid" dividerPosition="none" />

          <div className="register-divider">
            <span>or</span>
          </div>

          <form onSubmit={handleSubmit} className="register-form-fields" noValidate>
            
            {/* Username Input */}
            <TextField
              id="register-username"
              name="username"
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              startIcon={<User size={18} />}
              helperText="This will be your public display name."
              autoComplete="username"
              size="md"
              fullWidth
              required
            />

            {/* Email Input */}
            <TextField
              id="register-email"
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              startIcon={<Mail size={18} />}
              helperText="We'll never share your email."
              autoComplete="email"
              size="md"
              fullWidth
              required
            />

            {/* Password Input */}
            <TextField
              id="register-password"
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              startIcon={<Lock size={18} />}
              helperText="At least 8 characters."
              autoComplete="new-password"
              size="md"
              fullWidth
              required
            />

            {/* Password Strength Meter (Shown when password is typed) */}
            {form.password && (
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
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              startIcon={<Lock size={18} />}
              helperText="Make sure your passwords match."
              autoComplete="new-password"
              size="md"
              fullWidth
              required
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={<UserPlus size={18} />}
              className="register-submit-btn"
            >
              Create Account
            </Button>

            {/* Terms of Service & Privacy Notice */}
            <p className="register-terms-notice">
              By creating an account, you agree to our{" "}
              <Link to="/terms">Terms of Service</Link>{" "}
              and <Link to="/privacy">Privacy Policy</Link>.
            </p>

            {/* Already have an account */}
            <p className="register-footer-redirect">
              Already have an account? <Link to="/login">Login here.</Link>
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}
