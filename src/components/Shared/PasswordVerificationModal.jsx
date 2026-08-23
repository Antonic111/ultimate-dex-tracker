import React, { useState, useEffect } from "react";
import { Lock, Mail, Check, KeyRound } from "lucide-react";
import { useMessage } from "./MessageContext";
import { userAPI } from "../../utils/api";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { TextField } from "./FormField";

export default function PasswordVerificationModal({ isOpen, email, onClose, onVerified }) {
  const { showMessage } = useMessage();
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  const canVerify = code.trim().length === 6;

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setEmailCooldown(0);
    }
  }, [isOpen]);

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
      await userAPI.sendPasswordVerificationCode();
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
      await userAPI.verifyPasswordCode(code);
      showMessage("Verification successful!", "success");
      onVerified?.(code);
      onClose();
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
      title="Verify Password Change"
      subtitle="Confirm identity before setting a new password"
      icon={<Lock size={22} />}
      size="sm"
    >
      <form onSubmit={confirmVerification} className="space-y-4 text-sm" style={{ color: 'var(--text)' }}>
        <p>
          We'll email a 6-digit verification code to <b style={{ color: 'var(--accent)' }}>{email}</b> to confirm your password change.
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
          id="verify-password-code"
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
            Verify & Continue
          </Button>
        </div>
      </form>
    </Modal>
  );
}
