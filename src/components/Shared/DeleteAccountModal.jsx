import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMessage } from "./MessageContext";
import { userAPI } from "../../utils/api";
import LoadingButton from "./LoadingButton";
import "../../css/DeleteAccountModal.css";

export default function DeleteAccountModal({ isOpen, email, username, onClose, onDeleted }) {
  const { showMessage } = useMessage();
  const [code, setCode] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  const normalizedName = (username || "").trim().toLowerCase();
  const canDelete =
    code.trim().length === 6 &&
    confirmName.trim().toLowerCase() === normalizedName;

  // Handle email cooldown countdown
  useEffect(() => {
    let interval;
    if (emailCooldown > 0) {
      interval = setInterval(() => {
        setEmailCooldown(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emailCooldown]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const sendCode = async () => {
    try {
      setSending(true);
      await userAPI.sendDeleteCode();
      showMessage("Verification code sent to your email.", "success");
      // Start 30 second cooldown
      setEmailCooldown(30);
    } catch (e) {
      showMessage(e.message || "Couldn't send code", "error");
    } finally {
      setSending(false);
    }
  };

  const confirmDelete = async (e) => {
    e.preventDefault();
    if (!canDelete) {
      showMessage(`Type your account name (${username}) exactly to continue.`, "error");
      return;
    }
    try {
      setDeleting(true);
      await userAPI.confirmDeleteAccount(code, username);
              showMessage("Account deleted", "success");
      onDeleted?.();
    } catch (e) {
      showMessage(e.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const preventScroll = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    }
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [isOpen]);

  return createPortal(
    <div className={`modal-backdrop${closing ? " closing" : ""}`}>
      <div className={`modal-card${closing ? " closing" : ""}`}>
        <h3 className="modal-title">Delete Account</h3>
        <p className="modal-desc">
          We'll email a 6-digit code to <b>{email}</b>. To confirm, type your account name exactly.
        </p>

        <div className="modal-row">
          <LoadingButton 
            variant="primary"
            size="medium"
            loading={sending}
            loadingText="Sending..."
            disabled={emailCooldown > 0}
            onClick={sendCode}
          >
            {emailCooldown > 0 ? `Resend in ${emailCooldown}s` : "Send code"}
          </LoadingButton>
        </div>

        <form onSubmit={confirmDelete}>
          <label className="modal-label">6-digit code</label>
          <input
            className="modal-input"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter code"
          />

          <label className="modal-label">Type your account name</label>
          <input
            className="modal-input"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={username || "your username"}
            autoComplete="off"
          />

          <div className="modal-row">
            <LoadingButton 
              type="submit" 
              variant="danger"
              size="medium"
              loading={deleting}
              loadingText="Deleting..."
              disabled={!canDelete}
            >
              Delete Account
            </LoadingButton>
            <LoadingButton 
              type="button" 
              variant="secondary"
              size="medium"
              onClick={handleClose}
            >
              Cancel
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
