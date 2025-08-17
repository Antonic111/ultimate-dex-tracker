import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/auth.css";
import { useMessage } from "../components/Shared/MessageContext";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { validateContent } from "../../server/contentFilter.js";
import { buildApiUrl } from "../config/api.js";


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
      showMessage("❌ Passwords do not match", "error");
      setLoading(false);
      clickedRef.current = false;
      return;
    }



    const usernameValidation = validateContent(form.username, 'username');
    if (!usernameValidation.isValid) {
      showMessage(`❌ ${usernameValidation.error}`, "error");
      setLoading(false);
      clickedRef.current = false;
      return;
    }

    try {
      const res = await fetch(buildApiUrl("/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          profileTrainer: "ash.png",
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        showMessage(`❌ ${data.message}`, "error");
        return;
      }

      if (!res.ok) throw new Error(data.error || "Registration failed");

      showMessage("✅ Account created! Please verify your email.", "success");
      setTimeout(() => navigate(`/email-sent?email=${encodeURIComponent(form.email)}`), 1000);

    } catch (err) {
      showMessage(`❌ ${err.message}`, "error");
    } finally {
      setLoading(false);
      setTimeout(() => {
        clickedRef.current = false;
      }, 750); // 🔄 allow resubmit after short delay
    }
  };

  return (
    <div className="auth-form">
      <h2>SIGN UP</h2>
      <form onSubmit={handleSubmit} className="auth-form-fields">
        <div className="input-icon-wrapper">
          <User className="auth-icon" size={20} />
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Username"
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
            required
          />
          <button
            type="button"
            className="show-password-toggle"
            onClick={() => setShowPassword(prev => !prev)}
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff size={25} /> : <Eye size={25} />}
          </button>
        </div>


        <div className="input-icon-wrapper password-wrapper">
          <Lock className="auth-icon" size={20} />
          <input
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            onChange={handleChange}
            required
          />
          <button
            type="button"
            className="show-password-toggle"
            onClick={() => setShowConfirmPassword(prev => !prev)}
            aria-label="Toggle password visibility"
          >
            {showConfirmPassword ? <EyeOff size={25} /> : <Eye size={25} />}
          </button>
        </div>


        <button type="submit" disabled={loading}>Create Account</button>
        <p className="auth-redirect">
          Already have an account? <a href="/login">Login here</a>.
        </p>
      </form>
    </div>
  );
}
