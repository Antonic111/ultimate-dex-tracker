import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../css/Login.css";
import { useMessage } from "../components/Shared/MessageContext";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { authAPI } from "../utils/api.js";
import { progressAPI } from "../utils/api.js";
import { profileAPI } from "../utils/api.js";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ usernameOrEmail: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showMessage } = useMessage();
  const clickedRef = React.useRef(false);
  const [showPassword, setShowPassword] = useState(false);

  const showVerifiedMessage = searchParams.get("verified") === "1";

  useEffect(() => {
    if (showVerifiedMessage) {
              showMessage("Email verified! You can now log in.", "success");
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (clickedRef.current || loading) return; // 🛑 block spam clicks
    clickedRef.current = true;

    setLoading(true);

    try {
      const loginData = await authAPI.login({
        ...form,
        rememberMe: form.rememberMe || false,
      });

      // Check if the user is verified from the login response
      if (!loginData.user.verified) {
        showMessage("Please verify your email before logging in.", "error");
        navigate(`/email-sent?email=${encodeURIComponent(loginData.user.email)}`);
        return;
      }

      // Use the user data from the login response
      
      
      // Since the login response doesn't include progress bars, we need to fetch them separately
      let progressBars = [];
      try {
        const progressResponse = await progressAPI.getProgressBars();
        progressBars = progressResponse || [];
      } catch (error) {
        // removed console.warn to reduce console noise
        
        // Fallback: try to get from profile endpoint
        try {
          const profileResponse = await profileAPI.getProfile();
          if (profileResponse && profileResponse.progressBars) {
            progressBars = profileResponse.progressBars;
          } else {
            progressBars = [];
          }
        } catch (profileError) {
          // removed console.warn to reduce console noise
          progressBars = [];
        }
      }
      

      
      onLogin({
        username: loginData.user.username,
        email: loginData.user.email,
        createdAt: loginData.user.createdAt,
        profileTrainer: loginData.user.profileTrainer,
        verified: loginData.user.verified,
        progressBars: progressBars,
      });
      navigate("/");
    } catch (err) {
      // Handle specific verification error
      if (err.message.includes('Account not verified')) {
        // Check if the backend provided the email in the error response
        if (err.data && err.data.email) {
          showMessage("Account not verified. Redirecting to verification page...", "info");
          setTimeout(() => {
            navigate(`/email-sent?email=${encodeURIComponent(err.data.email)}`);
          }, 1500);
        } else {
          // Fallback: try to extract email from the input field
          const email = form.usernameOrEmail.includes('@') ? form.usernameOrEmail : '';
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
        showMessage(`${err.message}`, "error");
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        clickedRef.current = false;
      }, 750); // allow retry after delay
    }
  };


  return (
    <div className={`login-form page-container auth-page ${loading ? "loading" : ""}`}>
      <h2 className="login-title">LOGIN</h2>
      
      <form onSubmit={handleSubmit} className="login-form-fields">
        <div className="input-icon-wrapper">
          <User className="auth-icon" size={20} />
          <input
            name="usernameOrEmail"
            placeholder="Username or Email"
            onChange={handleChange}
            className="login-input"
            required
          />
        </div>

        <div className="input-icon-wrapper password-wrapper">
          <Lock className="auth-icon" size={20} />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            onChange={handleChange}
            className="login-input"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            className="show-password-toggle"
            onClick={() => setShowPassword(prev => !prev)}
            aria-label="Toggle password visibility"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <label className="remember-me-checkbox">
          <input
            type="checkbox"
            name="rememberMe"
            checked={form.rememberMe || false}
            onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
          />
          <span className="checkbox-svg">
            <svg viewBox="0 0 24 24" className="checkbox-check">
              <path
                fill="none"
                strokeWidth="3"
                d="M4 12l5 5L20 7"
              />
            </svg>
          </span>
          Remember me
        </label>

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="auth-redirect double">
          <a href="/register">Don't have an account?</a>
          <span className="auth-divider" />
          <a href="/forgot-password">Forgot password?</a>
        </div>
      </form>
    </div>
  );
}
