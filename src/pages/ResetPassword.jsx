import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMessage } from "../components/Shared/MessageContext";
import { Lock } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";


const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const code = searchParams.get("code");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const clickedRef = React.useRef(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
  if (!email || !code) {
    showMessage("❌ Invalid or expired reset session", "error");
    navigate("/forgot-password");
  }
}, [email, code, navigate, showMessage]);


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (clickedRef.current || loading) return;
    clickedRef.current = true;
    setLoading(true);

    try {
      if (newPassword !== confirmPassword) {
        showMessage("❌ Passwords do not match", "error");
        return;
      }

      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          code,
          newPassword, // ✅ correct var
        }),
      });

      const data = await res.json();

      if (res.status === 429 || data.message === "Too many requests, please try again later.") {
        showMessage("❌ Too many requests, please try again later.", "error");
        return;
      }

      if (res.ok) {
        showMessage("✅ Password reset successful!", "success");
        navigate("/login");
      } else {
        showMessage(`❌ ${data.error || "Something went wrong"}`, "error");
      }
    } catch (err) {
      showMessage("❌ Server error", "error");
    } finally {
      setLoading(false);
      setTimeout(() => {
        clickedRef.current = false;
      }, 750);
    }
  };

  return (
    <div className="auth-form">
      <h2>RESET PASSWORD</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-icon-wrapper password-wrapper">
          <Lock className="auth-icon" size={20} />
          <input
            type={showNewPassword ? "text" : "password"}
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="show-password-toggle"
            onClick={() => setShowNewPassword(prev => !prev)}
            aria-label="Toggle password visibility"
          >
            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="input-icon-wrapper password-wrapper">
          <Lock className="auth-icon" size={20} />
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="show-password-toggle"
            onClick={() => setShowConfirmPassword(prev => !prev)}
            aria-label="Toggle password visibility"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
