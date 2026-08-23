import React, { useState, useEffect } from "react";
import { Trash2, Mail, ShieldAlert, KeyRound, User } from "lucide-react";
import { useMessage } from "./MessageContext";
import { userAPI } from "../../utils/api";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { TextField } from "./FormField";

export default function DeleteAccountModal({ isOpen, email, username, onClose, onDeleted }) {
  const { showMessage } = useMessage();
  const [code, setCode] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  const sendCode = async () => {
    try {
      setSending(true);
      await userAPI.sendDeleteCode();
      showMessage("Verification code sent to your email.", "success");
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Account"
      subtitle="Permanently delete your account and all associated data"
      icon={<Trash2 size={22} className="text-red-400" />}
      size="sm"
    >
      <form onSubmit={confirmDelete} className="space-y-4 text-sm" style={{ color: 'var(--text)' }}>
        <p>
          We'll email a 6-digit confirmation code to <b style={{ color: 'var(--accent)' }}>{email}</b>. To confirm deletion, enter the code and type your username below.
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
          id="delete-account-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          startIcon={<KeyRound size={16} />}
          maxLength={6}
          fullWidth
          required
          autoComplete="one-time-code"
        />

        <TextField
          label="Type your account name to confirm"
          id="delete-account-confirm-name"
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          placeholder={username || "your username"}
          startIcon={<User size={16} />}
          fullWidth
          required
          autoComplete="off"
        />

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs leading-relaxed">
          <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" />
          <span>Warning: Account deletion is permanent and cannot be undone. All your dex progress, hunts, and profile settings will be deleted forever.</span>
        </div>

        <div className="flex gap-2.5 justify-end pt-2">
          <Button variant="secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={deleting}
            disabled={!canDelete}
            icon={<Trash2 size={16} />}
          >
            Delete Account
          </Button>
        </div>
      </form>
    </Modal>
  );
}
