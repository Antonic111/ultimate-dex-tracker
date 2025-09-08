import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Register.css";
import { useMessage } from "../components/Shared/MessageContext";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { validateContent } from "../../shared/contentFilter.js";
import { authAPI } from "../utils/api.js";


export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const clickedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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



    const usernameValidation = validateContent(form.username, 'username');
    if (!usernameValidation.isValid) {
              showMessage(`${usernameValidation.error}`, "error");
      setLoading(false);
      clickedRef.current = false;
      return;
    }

    try {
      await authAPI.register({
        username: form.username,
        email: form.email,
        password: form.password,
        profileTrainer: "ash.png",
      });

              showMessage("Account created! Please verify your email.", "success");
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
    <div className="register-form page-container auth-page">
      <h2 className="register-title">SIGN UP</h2>
      
      <form onSubmit={handleSubmit} className="register-form-fields">
        <div className="input-icon-wrapper">
          <User className="auth-icon" size={20} />
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Username"
            className="register-input"
            required
          />
        </div>

        <div className="input-icon-wrapper">
          <Mail className="auth-icon" size={20} />
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            className="register-input"
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
            className="register-input"
            autoComplete="new-password"
            required
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

        <div className="input-icon-wrapper password-wrapper">
          <Lock className="auth-icon" size={20} />
          <input
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            onChange={handleChange}
            className="register-input"
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className="show-password-toggle"
            onClick={() => setShowConfirmPassword(prev => !prev)}
            aria-label="Toggle password visibility"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button type="submit" className="register-button" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>
        
        <p className="auth-redirect">
          Already have an account? <a href="/login">Login here</a>.
        </p>
      </form>
    </div>
  );
}
