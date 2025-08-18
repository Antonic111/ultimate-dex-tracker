import React, { useState } from "react";
import { useMessage } from "../components/Shared/MessageContext";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { authAPI } from "../utils/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const clickedRef = React.useRef(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  if (clickedRef.current || loading) return; // 🛑 prevent spam
  clickedRef.current = true;

  if (!email) return showMessage("❌ Please enter your email", "error");

  setLoading(true);
  try {
    const data = await authAPI.forgotPassword(email);

    if (data.status === 429) {
      showMessage(`❌ ${data.message}`, "error");
      return;
    }
    if (data.success) {
      showMessage("📧 Password reset email sent!", "success");
      navigate(`/enter-reset-code?email=${encodeURIComponent(email)}`);
    } else {
      showMessage(`❌ ${data.error || "Something went wrong"}`, "error");
    }
  } catch (err) {
    showMessage("❌ Failed to send reset email", "error");
  } finally {
    setLoading(false);
    setTimeout(() => {
      clickedRef.current = false;
    }, 750); // 🔄 allow re-click after short delay
  }
};

  return (
    <div className="auth-form">
      <h2>FORGOT PASSWORD</h2>
      <form onSubmit={handleSubmit}>
        <div className="auth-form-fields">
          <div className="input-icon-wrapper">
<Mail className="auth-icon" size={20} />

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        
        <div className="auth-redirect">
          <a href="/login" style={{ textDecoration: 'none' }}>Back to Login</a>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
