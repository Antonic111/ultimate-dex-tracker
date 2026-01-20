import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMessage } from "./MessageContext";
import { userAPI } from "../../utils/api";
import LoadingButton from "./LoadingButton";
import "../../css/PasswordVerificationModal.css";

export default function EmailVerificationModal({ 
  isOpen, 
  currentEmail, 
  newEmail, 
  onClose, 
  onVerified,
  step = "current" // "current" or "new"
}) {
  const { showMessage } = useMessage();
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [closing, setClosing] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  const canVerify = code.trim().length === 6;
  const targetEmail = step === "current" ? currentEmail : newEmail;
  const stepTitle = step === "current" 
    ? "Verify Current Email" 
    : "Verify New Email";
  const stepDescription = step === "current"
    ? `We'll email a 6-digit verification code to your current email address <b className="email-highlight">${currentEmail}</b> to confirm you own this account.`
    : `We've sent a 6-digit verification code to your new email address <b className="email-highlight">${newEmail}</b>. Please enter it to complete the email change.`;

  // Reset code when modal opens or step changes
  useEffect(() => {
    if (isOpen) {
      setCode("");
      setEmailCooldown(0);
    }
  }, [isOpen, step]);

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
      if (step === "current") {
        await userAPI.sendCurrentEmailVerificationCode();
      } else {
        await userAPI.sendNewEmailVerificationCode();
      }
      showMessage("Verification code sent to your email.", "success");
      // Start 30 second cooldown
      setEmailCooldown(30);
    } catch (e) {
      showMessage(e.message || "Couldn't send code", "error");
    } finally {
      setSending(false);
    }
  };

  const confirmVerification = async (e) => {
    e.preventDefault();
    if (!canVerify) {
      showMessage("Please enter the 6-digit code.", "error");
      return;
    }
    try {
      setVerifying(true);
      // Verify the code
      let result = null;
      if (step === "current") {
        result = await userAPI.verifyCurrentEmailCode(code);
      } else {
        result = await userAPI.verifyNewEmailCode(code);
      }
      showMessage("Verification successful!", "success");
      // Call parent callback with result
      await onVerified?.(code, result);
      if (step === "new") {
        handleClose();
      }
    } catch (e) {
      showMessage(e.message, "error");
      // Don't re-throw - modal handles error display
    } finally {
      setVerifying(false);
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
        <h3 className="modal-title">{stepTitle}</h3>
        <p 
          className="modal-desc"
          dangerouslySetInnerHTML={{ __html: stepDescription }}
        />

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

        <form onSubmit={confirmVerification}>
          <label className="modal-label">6-digit code</label>
          <input
            className="modal-input"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter code"
            autoFocus
          />

          <div className="modal-row">
            <LoadingButton 
              type="submit" 
              variant="primary"
              size="medium"
              loading={verifying}
              loadingText="Verifying..."
              disabled={!canVerify}
            >
              {step === "current" ? "Verify & Continue" : "Verify & Complete"}
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
