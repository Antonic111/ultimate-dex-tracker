import React, { useState, useEffect } from "react";
import { Mail, Check, ShieldCheck, KeyRound } from "lucide-react";
import { useMessage } from "./MessageContext";
import { userAPI } from "../../utils/api";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { TextField } from "./FormField";

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
  const [emailCooldown, setEmailCooldown] = useState(0);

  const canVerify = code.trim().length === 6;
  const targetEmail = step === "current" ? currentEmail : newEmail;
  const stepTitle = step === "current" 
    ? "Verify Current Email" 
    : "Verify New Email";

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setEmailCooldown(0);
    }
  }, [isOpen, step]);

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

  const sendCode = async () => {
    try {
      setSending(true);
      if (step === "current") {
        await userAPI.sendCurrentEmailVerificationCode();
      } else {
        await userAPI.sendNewEmailVerificationCode();
      }
      showMessage("Verification code sent to your email.", "success");
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
      let result = null;
      if (step === "current") {
        result = await userAPI.verifyCurrentEmailCode(code);
      } else {
        result = await userAPI.verifyNewEmailCode(code);
      }
      showMessage("Verification successful!", "success");
      await onVerified?.(code, result);
      if (step === "new") {
        onClose();
      }
    } catch (e) {
      showMessage(e.message, "error");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={stepTitle}
      subtitle={
        step === "current"
          ? "Verify account ownership before making changes"
          : "Confirm your new email address to complete the update"
      }
      icon={<ShieldCheck size={22} />}
      size="sm"
    >
      <form onSubmit={confirmVerification} className="space-y-4 text-sm" style={{ color: 'var(--text)' }}>
        <p>
          {step === "current" ? (
            <>
              We'll email a 6-digit verification code to your current email address <b style={{ color: 'var(--accent)' }}>{currentEmail}</b>.
            </>
          ) : (
            <>
              We've sent a 6-digit verification code to your new email address <b style={{ color: 'var(--accent)' }}>{newEmail}</b>.
            </>
          )}
        </p>

        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={sendCode}
            loading={sending}
            disabled={emailCooldown > 0}
            icon={<Mail size={15} />}
          >
            {emailCooldown > 0 ? `Resend code in ${emailCooldown}s` : "Send verification code"}
          </Button>
        </div>

        <TextField
          label="6-Digit Code"
          id="verify-email-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          startIcon={<KeyRound size={16} />}
          maxLength={6}
          fullWidth
          required
          autoFocus
          autoComplete="one-time-code"
        />

        <div className="flex gap-2.5 justify-end pt-2">
          <Button variant="secondary" onClick={onClose} disabled={verifying}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={verifying}
            disabled={!canVerify}
            icon={<Check size={16} strokeWidth={2.5} />}
          >
            {step === "current" ? "Verify & Continue" : "Verify & Complete"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
