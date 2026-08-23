import React, { useState, useEffect } from "react";
import { RotateCcw, Mail, ShieldAlert, KeyRound, User } from "lucide-react";
import { useMessage } from "./MessageContext";
import { userAPI } from "../../utils/api";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { TextField } from "./FormField";

export default function ResetCollectionModal({ isOpen, email, username, onClose, onReset }) {
  const { showMessage } = useMessage();
  const [code, setCode] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  const normalizedName = (username || "").trim().toLowerCase();
  const canReset =
    code.trim().length === 6 &&
    confirmName.trim().toLowerCase() === normalizedName;

  // Handle email cooldown countdown
  useEffect(() => {
    let interval;
    if (emailCooldown > 0) {
      interval = setInterval(() => {
        setEmailCooldown((prev) => {
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

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setConfirmName("");
      setEmailCooldown(0);
    }
  }, [isOpen]);

  const sendCode = async () => {
    try {
      setSending(true);
      await userAPI.sendResetCollectionCode();
      showMessage("Verification code sent to your email.", "success");
      setEmailCooldown(30);
    } catch (e) {
      showMessage(e.message || "Couldn't send code", "error");
    } finally {
      setSending(false);
    }
  };

  const confirmReset = async (e) => {
    e.preventDefault();
    if (!canReset) {
      showMessage(`Type your account name (${username}) exactly to continue.`, "error");
      return;
    }
    try {
      setResetting(true);
      await userAPI.confirmResetCollection(code, username);

      // Clean up client-side collection storage caches
      try {
        localStorage.removeItem("dex-caught-pokemon");
        localStorage.removeItem("caughtPokemon");
        localStorage.removeItem("bingo-grid-state-v1");
        localStorage.removeItem("customProgressBars");
        localStorage.removeItem("huntTimers");
        localStorage.removeItem("lastCheckTimes");
        localStorage.removeItem("totalCheckTimes");
        localStorage.removeItem("pausedHunts");
        localStorage.removeItem("huntIncrements");
        localStorage.removeItem("mobileUserBackup");
        sessionStorage.removeItem("iosUserBackup");
        
        // Remove any caughtInfo_*, caughtInfoMap:*, and migration_completed_* items
        Object.keys(localStorage).forEach((key) => {
          if (
            key.startsWith("caughtInfo_") || 
            key.startsWith("caughtInfoMap:") ||
            key.startsWith("migration_completed_") ||
            key.startsWith("hunt_") ||
            key.startsWith("counter_")
          ) {
            localStorage.removeItem(key);
          }
        });
      } catch (err) {
        console.warn("Error cleaning up localStorage on collection reset:", err);
      }

      window.dispatchEvent(new CustomEvent("dexDataReset"));
      window.dispatchEvent(new Event("storage"));

      showMessage("All collection data has been reset successfully.", "success");
      onReset?.();
      onClose();
    } catch (e) {
      showMessage(e.message || "Failed to reset collection data", "error");
    } finally {
      setResetting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Collection Data"
      subtitle="Permanently wipe all Pokédex catches, hunts, and progress"
      icon={<RotateCcw size={22} className="text-red-400" />}
      size="sm"
    >
      <form onSubmit={confirmReset} className="space-y-4 text-sm" style={{ color: "var(--text)" }}>
        <p>
          We'll email a 6-digit confirmation code to <b style={{ color: "var(--accent)" }}>{email}</b>. To confirm data reset, enter the code and type your username below.
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
          id="reset-collection-code"
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
          id="reset-collection-confirm-name"
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
          <span>
            Warning: Resetting collection data is permanent and cannot be undone. All caught Pokémon, shiny hunt counters, custom progress bars, and bingo cards will be erased. Your account, login details, and profile settings will remain active.
          </span>
        </div>

        <div className="flex gap-2.5 justify-end pt-2">
          <Button variant="secondary" onClick={onClose} disabled={resetting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={resetting}
            disabled={!canReset}
            icon={<RotateCcw size={16} />}
          >
            Reset Collection Data
          </Button>
        </div>
      </form>
    </Modal>
  );
}
