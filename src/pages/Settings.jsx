import React, { useState, useContext, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Shield,
  Palette,
  Layers,
  BookOpen,
  AlertTriangle,
  Pencil,
  Lock,
  Mail,
  Globe,
  Check,
  RotateCcw,
  Trash2,
  SlidersHorizontal,
  ExternalLink,
  Link2,
  Activity,
  Trophy,
  BarChart2
} from "lucide-react";
import { UserContext } from "../components/Shared/UserContext";
import { useMessage } from "../components/Shared/MessageContext";
import { useTheme } from "../components/Shared/ThemeContext";
import { Button } from "../components/Shared/Button";
import { Modal } from "../components/Shared/Modal";
import TextField from "../components/Shared/FormField/TextField";
import DeleteAccountModal from "../components/Shared/DeleteAccountModal";
import ResetCollectionModal from "../components/Shared/ResetCollectionModal";
import PasswordVerificationModal from "../components/Shared/PasswordVerificationModal";
import EmailVerificationModal from "../components/Shared/EmailVerificationModal";
import { validateContent } from "../../shared/contentFilter";
import { profileAPI, userAPI, oauthAPI, clearAccountBrowserStorage } from "../utils/api";
import { buildApiUrl } from "../config/api";
import { useUsernameAvailability } from "../hooks/useUsernameAvailability";
import { useUsernameCooldown } from "../hooks/useUsernameCooldown";
import "../css/Settings.css";

// SVG Logos for OAuth Providers
const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#5865F2" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.128 18.116a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const PokeballIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M2 12H8.5M15.5 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

// All 13 form toggle options
const FORM_TYPE_OPTIONS = [
  { key: "showGenderForms", label: "Gender Forms" },
  { key: "showAlolanForms", label: "Alolan Forms" },
  { key: "showGalarianForms", label: "Galarian Forms" },
  { key: "showHisuianForms", label: "Hisuian Forms" },
  { key: "showPaldeanForms", label: "Paldean Forms" },
  { key: "showGmaxForms", label: "Gigantamax Forms" },
  { key: "showUnownForms", label: "Unown Forms" },
  { key: "showOtherForms", label: "Other Forms" },
  { key: "showMightyForms", label: "Mighty Forms" },
  { key: "showAlcremieForms", label: "Alcremie Forms" },
  { key: "showVivillonForms", label: "Vivillon Forms" },
  { key: "showAlphaForms", label: "Alpha Forms" },
  { key: "showAlphaOtherForms", label: "Alpha Genders & Others" },
];

const SHINY_LOCK_OPTIONS = [
  { key: "blockUnobtainableShinies", label: "Lock Unobtainable Shinies", desc: "Locks shinies that cannot legitimately be obtained." },
  { key: "blockGOExclusiveShinies", label: "Lock GO Exclusive Shinies", desc: "Locks shinies only available via Pokémon GO." },
  { key: "blockNOOTExclusiveShinies", label: "Lock NO OT Exclusive Shinies", desc: "Locks shinies with no original trainer availability." },
  { key: "hideLockedShinies", label: "Hide Locked Shinies from Grid", desc: "Hides locked shinies completely instead of showing lock overlay." },
];

const EXTERNAL_LINK_OPTIONS = [
  { id: "serebii", label: "Serebii", desc: "Detailed Pokédex information, game locations, and mechanics." },
  { id: "bulbapedia", label: "Bulbapedia", desc: "Community encyclopedia with comprehensive lore and data." },
  { id: "pokemondb", label: "PokemonDB", desc: "Clean database with base stats, movesets, and evolution chains." },
  { id: "smogon", label: "Smogon", desc: "Competitive strategy dex with tiers, EV spreads, and moves." },
];

const ACCENT_COLORS = [
  { id: "red", color: "#ef4444" },
  { id: "orange", color: "#f97316" },
  { id: "yellow", color: "#eab308" },
  { id: "green", color: "#22c55e" },
  { id: "lime", color: "#84cc16" },
  { id: "cyan", color: "#06b6d4" },
  { id: "blue", color: "#3b82f6" },
  { id: "purple", color: "#a855f7" },
  { id: "lavender", color: "#c084fc" },
  { id: "pink", color: "#ec4899" },
  { id: "brown", color: "#78350f" },
  { id: "platinum", color: "#cbd5e1" },
];

export default function Settings() {
  const { username, email, hasPassword, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const { theme, setTheme, accent, setAccent } = useTheme();

  // Active Tab
  const [activeTab, setActiveTab] = useState("account");

  // Granular Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    isProfilePublic: true,
    isGlobalFeedPublic: true,
    isLeaderboardPublic: true,
    isFriendCodesPublic: true,
    isStatsPublic: true,
  });
  const [savingPrivacyKey, setSavingPrivacyKey] = useState(null);

  // Dex Preferences
  const defaultDexPreferences = useMemo(() => ({
    showGenderForms: true,
    showAlolanForms: true,
    showGalarianForms: true,
    showHisuianForms: true,
    showPaldeanForms: true,
    showGmaxForms: true,
    showUnownForms: true,
    showOtherForms: true,
    showAlcremieForms: true,
    showVivillonForms: true,
    showAlphaForms: true,
    showAlphaOtherForms: true,
    showMightyForms: true,
    blockUnobtainableShinies: false,
    blockGOExclusiveShinies: false,
    blockNOOTExclusiveShinies: false,
    hideLockedShinies: false,
    useHomeSprites: false,
    dexViewMode: "categorized",
  }), []);

  const [dexPrefs, setDexPrefs] = useState(defaultDexPreferences);
  const [externalLink, setExternalLink] = useState("serebii");

  // Connected OAuth Providers
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [actionProviderLoading, setActionProviderLoading] = useState(null);

  // Modals state
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showFormTypesModal, setShowFormTypesModal] = useState(false);
  const [showShinyLocksModal, setShowShinyLocksModal] = useState(false);
  const [showExternalLinksModal, setShowExternalLinksModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetCollectionModal, setShowResetCollectionModal] = useState(false);

  // Password & Email verification sub-modals
  const [showPasswordVerificationModal, setShowPasswordVerificationModal] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [emailVerificationStep, setEmailVerificationStep] = useState("current");

  // Username edit form state
  const [editUsername, setEditUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const usernameAvailability = useUsernameAvailability(editUsername, username);
  const usernameCooldown = useUsernameCooldown();

  // Email edit form state
  const [editEmail, setEditEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Password edit form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Load Profile & Dex Preferences
  useEffect(() => {
    (async () => {
      try {
        const data = await profileAPI.getProfile();
        setPrivacySettings({
          isProfilePublic: data?.isProfilePublic !== false,
          isGlobalFeedPublic: data?.isGlobalFeedPublic !== false,
          isLeaderboardPublic: data?.isLeaderboardPublic !== false,
          isFriendCodesPublic: data?.isFriendCodesPublic !== false,
          isStatsPublic: data?.isStatsPublic !== false,
        });
        if (data?.dexPreferences) {
          setDexPrefs({ ...defaultDexPreferences, ...data.dexPreferences });
        }
        if (data?.externalLinkPreference) {
          setExternalLink(data.externalLinkPreference);
        }
      } catch (error) {
        console.error("Failed to fetch settings profile:", error);
      }
    })();
  }, [defaultDexPreferences]);

  // Load Connected OAuth Providers
  const loadProviders = useCallback(async () => {
    try {
      setLoadingProviders(true);
      const res = await oauthAPI.getProviders();
      setProviders(res.providers || []);
    } catch (err) {
      console.error("Failed to load connected accounts:", err);
    } finally {
      setLoadingProviders(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // --- GRANULAR PRIVACY TOGGLE ---
  const updatePrivacySetting = async (key, nextPublic) => {
    const previous = privacySettings;
    const next = { ...privacySettings, [key]: nextPublic };
    setPrivacySettings(next);
    setSavingPrivacyKey(key);

    try {
      await profileAPI.updateProfile({ [key]: nextPublic });
      setUser((prev) => ({ ...prev, [key]: nextPublic }));
      const labels = {
        isProfilePublic: nextPublic ? "Profile set to Public" : "Profile set to Private",
        isGlobalFeedPublic: nextPublic ? "Global Feed set to Public" : "Global Feed set to Private",
        isLeaderboardPublic: nextPublic ? "Leaderboard set to Public" : "Leaderboard set to Private",
        isFriendCodesPublic: nextPublic ? "Friend Codes set to Public" : "Friend Codes set to Private",
        isStatsPublic: nextPublic ? "Detailed Stats set to Public" : "Detailed Stats set to Private",
      };
      showMessage(labels[key] || "Privacy updated", "success");
    } catch (error) {
      console.error("Failed to update privacy:", error);
      setPrivacySettings(previous);
      showMessage("Failed to update privacy setting", "error");
    } finally {
      setSavingPrivacyKey(null);
    }
  };

  // --- DEX PREFERENCES SYNC ---
  const updateDexPreference = async (key, val) => {
    const previous = dexPrefs;
    const next = { ...dexPrefs, [key]: val };
    setDexPrefs(next);
    localStorage.setItem("dexPreferences", JSON.stringify(next));

    try {
      await profileAPI.updateDexPreferences(next);
      window.dispatchEvent(new CustomEvent("dexPreferencesChanged"));
      showMessage("Preferences saved", "success");
    } catch (err) {
      console.error("Failed to save dex preference:", err);
      setDexPrefs(previous);
      localStorage.setItem("dexPreferences", JSON.stringify(previous));
      showMessage("Failed to save preferences", "error");
    }
  };

  const handleExternalLinkChange = async (pref) => {
    setExternalLink(pref);
    localStorage.setItem("externalLinkPreference", pref);
    try {
      await profileAPI.updateProfile({ externalLinkPreference: pref });
      window.dispatchEvent(new CustomEvent("externalLinkPreferenceChanged"));
      const label = EXTERNAL_LINK_OPTIONS.find((o) => o.id === pref)?.label || pref;
      showMessage(`External links set to ${label}`, "success");
    } catch (err) {
      console.error("Failed to update external link preference:", err);
      showMessage("Failed to update external links", "error");
    }
  };

  // --- USERNAME MODAL SUBMIT ---
  const handleSaveUsername = async () => {
    if (!usernameCooldown.canChange) {
      showMessage(usernameCooldown.message, "error");
      return;
    }
    if (!usernameAvailability.available) {
      showMessage("Username is not available", "error");
      return;
    }
    const validation = validateContent(String(editUsername || ""), "username");
    if (!validation.isValid) {
      showMessage(validation.error, "error");
      return;
    }

    try {
      setSavingUsername(true);
      const data = await userAPI.updateUsername(editUsername);
      setUser((prev) => ({ ...prev, username: data.username }));
      showMessage("Username updated successfully!", "success");
      usernameCooldown.refreshCooldown();
      setShowUsernameModal(false);
    } catch (err) {
      showMessage(err.message, "error");
    } finally {
      setSavingUsername(false);
    }
  };

  // --- EMAIL CHANGE HANDLER ---
  const handleStartEmailChange = () => {
    if (!editEmail) {
      showMessage("New email is required", "error");
      return;
    }
    if (hasPassword && !emailPassword) {
      showMessage("Current password is required", "error");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail)) {
      showMessage("Invalid email format", "error");
      return;
    }

    setShowEmailModal(false);
    setEmailVerificationStep("current");
    setShowEmailVerificationModal(true);
  };

  const handleEmailVerification = async (code, result) => {
    if (emailVerificationStep === "current") {
      try {
        setSavingEmail(true);
        await userAPI.changeEmail(editEmail, emailPassword);
        setEmailVerificationStep("new");
      } catch (err) {
        showMessage(err.message || "Failed to change email", "error");
        setShowEmailVerificationModal(false);
      } finally {
        setSavingEmail(false);
      }
    } else {
      if (result?.email) {
        setUser((prev) => ({ ...prev, email: result.email, verified: result.verified }));
      }
      setEditEmail("");
      setEmailPassword("");
      setShowEmailVerificationModal(false);
      setEmailVerificationStep("current");
      showMessage("Email address updated successfully!", "success");
    }
  };

  // --- PASSWORD CHANGE HANDLER ---
  const handleSavePassword = async () => {
    if (hasPassword && !currentPassword) {
      showMessage("Current password is required", "error");
      return;
    }
    if (!newPassword || !confirmPassword) {
      showMessage("New password and confirmation are required", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage("New passwords do not match", "error");
      return;
    }
    if (newPassword.length < 8) {
      showMessage("New password must be at least 8 characters", "error");
      return;
    }

    if (!hasPassword) {
      // First time setting password
      try {
        setSavingPassword(true);
        await userAPI.changePassword("", newPassword, confirmPassword);
        setUser((prev) => ({ ...prev, hasPassword: true }));
        showMessage("Password created successfully!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordModal(false);
      } catch (err) {
        showMessage(err.message || "Failed to set password", "error");
      } finally {
        setSavingPassword(false);
      }
    } else {
      setShowPasswordModal(false);
      setShowPasswordVerificationModal(true);
    }
  };

  const handlePasswordVerification = async () => {
    try {
      setSavingPassword(true);
      await userAPI.changePassword(currentPassword, newPassword, confirmPassword);
      showMessage("Password updated successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordVerificationModal(false);
    } catch (err) {
      showMessage(err.message, "error");
    } finally {
      setSavingPassword(false);
    }
  };

  // --- OAUTH CONNECT / DISCONNECT ---
  const handleConnectProvider = (provider) => {
    setActionProviderLoading(provider);
    window.location.href = buildApiUrl(`/auth/${provider}/link`);
  };

  const handleDisconnectProvider = async (provider) => {
    try {
      setActionProviderLoading(provider);
      const res = await oauthAPI.unlinkProvider(provider);
      showMessage(res.message || `${provider} account disconnected.`, "success");
      await loadProviders();
    } catch (err) {
      showMessage(err.userMessage || err.message || `Failed to disconnect ${provider}`, "error");
    } finally {
      setActionProviderLoading(null);
    }
  };

  // Form Types count
  const enabledFormsCount = FORM_TYPE_OPTIONS.filter((f) => dexPrefs[f.key]).length;
  // Shiny Locks count
  const enabledLocksCount = SHINY_LOCK_OPTIONS.filter((l) => dexPrefs[l.key]).length;

  const googleAccount = providers.find((p) => p.provider === "google");
  const discordAccount = providers.find((p) => p.provider === "discord");

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
      </div>

      <div className="app-divider" />

      {/* Main Layout */}
      <div className="settings-layout">
        {/* Sidebar Navigation */}
        <nav className="settings-sidebar" aria-label="Settings navigation">
          <div className="settings-sidebar-group">
            <span className="settings-sidebar-heading">SETTINGS</span>
            <button
              type="button"
              className={`settings-nav-btn ${activeTab === "account" ? "active" : ""}`}
              onClick={() => setActiveTab("account")}
            >
              <User size={16} />
              <span>Account</span>
            </button>

            <button
              type="button"
              className={`settings-nav-btn ${activeTab === "profile-privacy" ? "active" : ""}`}
              onClick={() => setActiveTab("profile-privacy")}
            >
              <Shield size={16} />
              <span>Profile & Privacy</span>
            </button>

            <button
              type="button"
              className={`settings-nav-btn ${activeTab === "appearance" ? "active" : ""}`}
              onClick={() => setActiveTab("appearance")}
            >
              <Palette size={16} />
              <span>Appearance</span>
            </button>

            <button
              type="button"
              className={`settings-nav-btn ${activeTab === "pokedex" ? "active" : ""}`}
              onClick={() => setActiveTab("pokedex")}
            >
              <Layers size={16} />
              <span>Pokédex</span>
            </button>

            <button
              type="button"
              className={`settings-nav-btn ${activeTab === "tutorial" ? "active" : ""}`}
              onClick={() => setActiveTab("tutorial")}
            >
              <BookOpen size={16} />
              <span>Tutorial</span>
            </button>

            <div className="settings-sidebar-divider" />

            <button
              type="button"
              className={`settings-nav-btn danger ${activeTab === "danger-zone" ? "active" : ""}`}
              onClick={() => setActiveTab("danger-zone")}
            >
              <AlertTriangle size={16} />
              <span>Danger Zone</span>
            </button>
          </div>
        </nav>

        {/* Tab-Based Content Area */}
        <div className="settings-content">
          {/* ============================================================
             TAB 1: ACCOUNT
             ============================================================ */}
          {activeTab === "account" && (
            <div className="settings-tab-panel fade-in-up">
              {/* Account Information Card */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <span className="settings-card-icon">
                    <User size={20} />
                  </span>
                  <div className="settings-card-title-wrap">
                    <h2 className="settings-card-title">Account Information</h2>
                    <p className="settings-card-desc">Manage your account credentials and personal information.</p>
                  </div>
                </div>

                <div className="settings-info-list">
                  {/* Username Row */}
                  <div className="settings-info-row">
                    <span className="settings-info-label">Username</span>
                    <span className="settings-info-value">{username || "—"}</span>
                    <div className="settings-info-action">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Pencil size={13} />}
                        onClick={() => {
                          setEditUsername(username || "");
                          setShowUsernameModal(true);
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  </div>

                  {/* Email Row */}
                  <div className="settings-info-row">
                    <span className="settings-info-label">Email</span>
                    <span className="settings-info-value">{email || "—"}</span>
                    <div className="settings-info-action">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Pencil size={13} />}
                        onClick={() => {
                          setEditEmail("");
                          setEmailPassword("");
                          setShowEmailModal(true);
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  </div>

                  {/* Password Row */}
                  <div className="settings-info-row">
                    <span className="settings-info-label">Password</span>
                    <span className="settings-info-value">
                      {hasPassword ? "••••••••••••" : "Not set (Social login only)"}
                    </span>
                    <div className="settings-info-action">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Pencil size={13} />}
                        onClick={() => {
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                          setShowPasswordModal(true);
                        }}
                      >
                        {hasPassword ? "Change" : "Set Password"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connected Accounts Card */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <span className="settings-card-icon">
                    <Link2 size={20} />
                  </span>
                  <div className="settings-card-title-wrap">
                    <h2 className="settings-card-title">Connected Accounts</h2>
                    <p className="settings-card-desc">Link Google or Discord for faster, unified sign-in.</p>
                  </div>
                </div>

                <div className="settings-connected-list">
                  {/* Google */}
                  <div className="settings-connected-item">
                    <div className="settings-connected-left">
                      <div className="settings-connected-icon">
                        <GoogleIcon />
                      </div>
                      <div className="settings-connected-meta">
                        <span className="settings-connected-name">Google</span>
                        <span className="settings-connected-sub">
                          {googleAccount
                            ? googleAccount.providerEmail || googleAccount.displayName || "Connected"
                            : "Not connected"}
                        </span>
                      </div>
                    </div>
                    <div className="settings-connected-actions">
                      {googleAccount ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDisconnectProvider("google")}
                          loading={actionProviderLoading === "google"}
                          disabled={loadingProviders}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleConnectProvider("google")}
                          loading={actionProviderLoading === "google"}
                          disabled={loadingProviders}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Discord */}
                  <div className="settings-connected-item">
                    <div className="settings-connected-left">
                      <div className="settings-connected-icon">
                        <DiscordIcon />
                      </div>
                      <div className="settings-connected-meta">
                        <span className="settings-connected-name">Discord</span>
                        <span className="settings-connected-sub">
                          {discordAccount
                            ? discordAccount.displayName || discordAccount.providerEmail || "Connected"
                            : "Not connected"}
                        </span>
                      </div>
                    </div>
                    <div className="settings-connected-actions">
                      {discordAccount ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDisconnectProvider("discord")}
                          loading={actionProviderLoading === "discord"}
                          disabled={loadingProviders}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleConnectProvider("discord")}
                          loading={actionProviderLoading === "discord"}
                          disabled={loadingProviders}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="settings-callout-banner">
                  <Lock size={14} className="settings-callout-icon" />
                  <span>Secure & private: We never post or share information without your permission.</span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
             TAB 2: PROFILE & PRIVACY (GRANULAR PRIVACY CONTROLS)
             ============================================================ */}
          {activeTab === "profile-privacy" && (
            <div className="settings-tab-panel fade-in-up">
              <div className="settings-card">
                <div className="settings-card-header">
                  <span className="settings-card-icon">
                    <Shield size={20} />
                  </span>
                  <div className="settings-card-title-wrap">
                    <h2 className="settings-card-title">Profile & Privacy Settings</h2>
                    <p className="settings-card-desc">Control visibility for each specific feature on your profile and tracker.</p>
                  </div>
                </div>

                <div className="settings-privacy-list">
                  {/* 1. Master Profile Visibility */}
                  <div className="settings-privacy-item">
                    <div className="settings-privacy-left">
                      <div className="settings-privacy-icon">
                        <Globe size={18} />
                      </div>
                      <div className="settings-privacy-info">
                        <span className="settings-privacy-title">Trainer Profile & Pokédex Collection</span>
                        <span className="settings-privacy-desc">
                          Allows other trainers to visit your profile at <code>/trainers/{username || "you"}</code> and view your Dex collection.
                        </span>
                      </div>
                    </div>

                    <div className="settings-segmented-control">
                      <button
                        type="button"
                        className={`settings-segmented-btn ${privacySettings.isProfilePublic ? "active" : ""}`}
                        onClick={() => updatePrivacySetting("isProfilePublic", true)}
                        disabled={savingPrivacyKey === "isProfilePublic"}
                      >
                        <Globe size={14} />
                        <span>Public</span>
                      </button>
                      <button
                        type="button"
                        className={`settings-segmented-btn ${!privacySettings.isProfilePublic ? "active" : ""}`}
                        onClick={() => updatePrivacySetting("isProfilePublic", false)}
                        disabled={savingPrivacyKey === "isProfilePublic"}
                      >
                        <Lock size={14} />
                        <span>Private</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Global Catch Feed */}
                  <div className="settings-privacy-item">
                    <div className="settings-privacy-left">
                      <div className="settings-privacy-icon">
                        <Activity size={18} />
                      </div>
                      <div className="settings-privacy-info">
                        <span className="settings-privacy-title">Global Live Catch Feed</span>
                        <span className="settings-privacy-desc">
                          Broadcast newly caught Pokémon and shiny milestones in real-time on the homepage live feed ticker.
                        </span>
                      </div>
                    </div>

                    <div className="settings-segmented-control">
                      <button
                        type="button"
                        className={`settings-segmented-btn ${privacySettings.isGlobalFeedPublic ? "active" : ""}`}
                        onClick={() => updatePrivacySetting("isGlobalFeedPublic", true)}
                        disabled={savingPrivacyKey === "isGlobalFeedPublic"}
                      >
                        <Globe size={14} />
                        <span>Public</span>
                      </button>
                      <button
                        type="button"
                        className={`settings-segmented-btn ${!privacySettings.isGlobalFeedPublic ? "active" : ""}`}
                        onClick={() => updatePrivacySetting("isGlobalFeedPublic", false)}
                        disabled={savingPrivacyKey === "isGlobalFeedPublic"}
                      >
                        <Lock size={14} />
                        <span>Private</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Community Leaderboard & Trainers Directory */}
                  <div className="settings-privacy-item">
                    <div className="settings-privacy-left">
                      <div className="settings-privacy-icon">
                        <Trophy size={18} />
                      </div>
                      <div className="settings-privacy-info">
                        <span className="settings-privacy-title">Leaderboards</span>
                        <span className="settings-privacy-desc">
                          Display your trainer stats in public community rankings, species totals, and leaderboard categories.
                        </span>
                      </div>
                    </div>

                    <div className="settings-segmented-control">
                      <button
                        type="button"
                        className={`settings-segmented-btn ${privacySettings.isLeaderboardPublic ? "active" : ""}`}
                        onClick={() => updatePrivacySetting("isLeaderboardPublic", true)}
                        disabled={savingPrivacyKey === "isLeaderboardPublic"}
                      >
                        <Globe size={14} />
                        <span>Public</span>
                      </button>
                      <button
                        type="button"
                        className={`settings-segmented-btn ${!privacySettings.isLeaderboardPublic ? "active" : ""}`}
                        onClick={() => updatePrivacySetting("isLeaderboardPublic", false)}
                        disabled={savingPrivacyKey === "isLeaderboardPublic"}
                      >
                        <Lock size={14} />
                        <span>Private</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. Detailed Stats Page */}
                  <div className="settings-privacy-item">
                    <div className="settings-privacy-left">
                      <div className="settings-privacy-icon">
                        <BarChart2 size={18} />
                      </div>
                      <div className="settings-privacy-info">
                        <span className="settings-privacy-title">Detailed Stats & Completion Charts</span>
                        <span className="settings-privacy-desc">
                          Allow other trainers to explore your detailed statistics graphs, game timelines, and shiny rate analytics at <code>/trainers/{username || "you"}/stats</code>.
                        </span>
                      </div>
                    </div>

                    <div className="settings-segmented-control">
                      <button
                        type="button"
                        className={`settings-segmented-btn ${privacySettings.isStatsPublic ? "active" : ""}`}
                        onClick={() => updatePrivacySetting("isStatsPublic", true)}
                        disabled={savingPrivacyKey === "isStatsPublic"}
                      >
                        <Globe size={14} />
                        <span>Public</span>
                      </button>
                      <button
                        type="button"
                        className={`settings-segmented-btn ${!privacySettings.isStatsPublic ? "active" : ""}`}
                        onClick={() => updatePrivacySetting("isStatsPublic", false)}
                        disabled={savingPrivacyKey === "isStatsPublic"}
                      >
                        <Lock size={14} />
                        <span>Private</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-callout-banner">
                  <Lock size={14} className="settings-callout-icon" />
                  <span>
                    Privacy updates take effect instantly across the global feed, leaderboards, and public trainer profiles.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
             TAB 3: APPEARANCE
             ============================================================ */}
          {activeTab === "appearance" && (
            <div className="settings-tab-panel fade-in-up">
              <div className="settings-card">
                <div className="settings-card-header">
                  <span className="settings-card-icon">
                    <Palette size={20} />
                  </span>
                  <div className="settings-card-title-wrap">
                    <h2 className="settings-card-title">Appearance</h2>
                    <p className="settings-card-desc">Customize the look and feel of the website.</p>
                  </div>
                </div>

                <div className="settings-appearance-grid">
                  {/* Sub-Card 1: Theme */}
                  <div className="settings-subcard">
                    <span className="settings-subcard-title">Theme</span>
                    <div className="settings-theme-options">
                      {/* Light */}
                      <div
                        className={`settings-theme-card ${theme === "light" ? "active" : ""}`}
                        onClick={() => setTheme("light")}
                      >
                        <div className="settings-theme-mini light">
                          <div className="mini-header">
                            <span className="mini-dot" />
                          </div>
                          <div className="mini-body">
                            <span className="mini-line" />
                            <span className="mini-line" />
                          </div>
                        </div>
                        <span className="settings-theme-label">Light</span>
                        {theme === "light" && (
                          <span className="settings-card-check-badge">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </div>

                      {/* Dark */}
                      <div
                        className={`settings-theme-card ${theme === "dark" ? "active" : ""}`}
                        onClick={() => setTheme("dark")}
                      >
                        <div className="settings-theme-mini dark">
                          <div className="mini-header">
                            <span className="mini-dot" />
                          </div>
                          <div className="mini-body">
                            <span className="mini-line" />
                            <span className="mini-line" />
                          </div>
                        </div>
                        <span className="settings-theme-label">Dark</span>
                        {theme === "dark" && (
                          <span className="settings-card-check-badge">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </div>

                      {/* System */}
                      <div
                        className={`settings-theme-card ${theme === "system" ? "active" : ""}`}
                        onClick={() => setTheme("system")}
                      >
                        <div className="settings-theme-mini system">
                          <div className="mini-header" />
                        </div>
                        <span className="settings-theme-label">System</span>
                        {theme === "system" && (
                          <span className="settings-card-check-badge">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="settings-autosave-footer">
                      <Check size={12} color="var(--accent)" />
                      <span>Changes saved automatically</span>
                    </div>
                  </div>

                  {/* Sub-Card 2: Accent Color */}
                  <div className="settings-subcard">
                    <span className="settings-subcard-title">Accent Color</span>
                    <div className="settings-accent-swatches">
                      {ACCENT_COLORS.map(({ id, color }) => (
                        <div
                          key={id}
                          className={`settings-swatch ${accent === id ? "active" : ""}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setAccent(id)}
                          title={id}
                        >
                          {accent === id && <Check size={13} color="#000000" strokeWidth={3.5} />}
                        </div>
                      ))}
                    </div>

                    <div className="settings-autosave-footer">
                      <Check size={12} color="var(--accent)" />
                      <span>Changes saved automatically</span>
                    </div>
                  </div>

                  {/* Sub-Card 3: Pokémon Sprites */}
                  <div className="settings-subcard">
                    <span className="settings-subcard-title">Pokémon Sprites</span>
                    <p className="settings-subcard-desc">Choose your preferred sprite style.</p>

                    <div className="settings-sprite-options">
                      {/* Gen 5 Pixel */}
                      <div
                        className={`settings-sprite-card ${!dexPrefs.useHomeSprites ? "active" : ""}`}
                        onClick={() => updateDexPreference("useHomeSprites", false)}
                      >
                        <img
                          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/384.png"
                          alt="Gen 5 Rayquaza"
                          className="settings-sprite-img"
                        />
                        <span className="settings-sprite-label">Gen 5 Pixel</span>
                        {!dexPrefs.useHomeSprites && (
                          <span className="settings-card-check-badge">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </div>

                      {/* HOME 3D */}
                      <div
                        className={`settings-sprite-card ${dexPrefs.useHomeSprites ? "active" : ""}`}
                        onClick={() => updateDexPreference("useHomeSprites", true)}
                      >
                        <img
                          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/384.png"
                          alt="HOME 3D Rayquaza"
                          className="settings-sprite-img"
                        />
                        <span className="settings-sprite-label">HOME 3D</span>
                        {dexPrefs.useHomeSprites && (
                          <span className="settings-card-check-badge">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    </div>


                    <div className="settings-autosave-footer">
                      <Check size={12} color="var(--accent)" />
                      <span>Changes saved automatically</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
             TAB 4: POKÉDEX
             ============================================================ */}
          {activeTab === "pokedex" && (
            <div className="settings-tab-panel fade-in-up">
              <div className="settings-card">
                <div className="settings-card-header">
                  <span className="settings-card-icon">
                    <PokeballIcon size={20} />
                  </span>
                  <div className="settings-card-title-wrap">
                    <h2 className="settings-card-title">Pokédex Preferences</h2>
                    <p className="settings-card-desc">Customize how your Pokédex is organized and displayed.</p>
                  </div>
                </div>

                <div className="settings-pokedex-grid">
                  {/* Card 1: Dex View Mode */}
                  <div className="settings-pokedex-card">
                    <span className="settings-pokedex-card-title">Dex View Mode</span>
                    <p className="settings-pokedex-card-desc">Choose how your Pokédex is organized.</p>
                    <div className="settings-pokedex-card-action">
                      <div className="settings-segmented-control" style={{ width: "100%", boxSizing: "border-box" }}>
                        <button
                          type="button"
                          className={`settings-segmented-btn ${dexPrefs.dexViewMode !== "unified" ? "active" : ""}`}
                          onClick={() => updateDexPreference("dexViewMode", "categorized")}
                          style={{ flex: 1, justifyContent: "center", padding: "5px 8px" }}
                        >
                          <span>Categorized</span>
                        </button>
                        <button
                          type="button"
                          className={`settings-segmented-btn ${dexPrefs.dexViewMode === "unified" ? "active" : ""}`}
                          onClick={() => updateDexPreference("dexViewMode", "unified")}
                          style={{ flex: 1, justifyContent: "center", padding: "5px 8px" }}
                        >
                          <span>Unified</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Form Types */}
                  <div className="settings-pokedex-card">
                    <span className="settings-pokedex-card-title">Form Types</span>
                    <p className="settings-pokedex-card-desc">Choose which form types to display in your Pokédex.</p>
                    <div className="settings-pokedex-card-action">
                      <span className="settings-pokedex-card-count">
                        {enabledFormsCount} of {FORM_TYPE_OPTIONS.length} selected
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<SlidersHorizontal size={14} />}
                        onClick={() => setShowFormTypesModal(true)}
                        fullWidth
                      >
                        Manage Form Types
                      </Button>
                    </div>
                  </div>

                  {/* Card 3: Shiny Locking */}
                  <div className="settings-pokedex-card">
                    <span className="settings-pokedex-card-title">Shiny Locking</span>
                    <p className="settings-pokedex-card-desc">
                      Lock certain types of shiny Pokémon to prevent interaction in your dex.
                    </p>
                    <div className="settings-pokedex-card-action">
                      <span className="settings-pokedex-card-count">{enabledLocksCount} locks enabled</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Lock size={14} />}
                        onClick={() => setShowShinyLocksModal(true)}
                        fullWidth
                      >
                        Manage Locks
                      </Button>
                    </div>
                  </div>

                  {/* Card 4: External Links */}
                  <div className="settings-pokedex-card">
                    <span className="settings-pokedex-card-title">External Links</span>
                    <p className="settings-pokedex-card-desc">Choose which website appears in the sidebar.</p>
                    <div className="settings-pokedex-card-action">
                      <span className="settings-pokedex-card-count">
                        {EXTERNAL_LINK_OPTIONS.find((o) => o.id === externalLink)?.label || "Serebii"} selected
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<ExternalLink size={14} />}
                        onClick={() => setShowExternalLinksModal(true)}
                        fullWidth
                      >
                        Manage Links
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
             TAB 5: TUTORIAL
             ============================================================ */}
          {activeTab === "tutorial" && (
            <div className="settings-tab-panel fade-in-up">
              <div className="settings-card">
                <div className="settings-card-header">
                  <span className="settings-card-icon">
                    <BookOpen size={20} />
                  </span>
                  <div className="settings-card-title-wrap">
                    <h2 className="settings-card-title">Interactive Tutorial</h2>
                    <p className="settings-card-desc">
                      Replay the guided onboarding tutorial to learn how to track and organize your Pokémon collection.
                    </p>
                  </div>
                </div>

                <div className="settings-tutorial-row">
                  <p className="settings-tutorial-desc">
                    Click below to restart the interactive walkthrough from the beginning. It will guide you through marking catches, shiny tracking, and customization.
                  </p>

                  <Button
                    variant="primary"
                    size="md"
                    icon={<RotateCcw size={16} />}
                    onClick={async () => {
                      try {
                        navigate("/");
                        await profileAPI.updateProfile({ onboarding: { isComplete: false, tutorialStep: 2 } });
                        setUser((prev) => ({
                          ...prev,
                          onboarding: { ...prev.onboarding, isComplete: false, tutorialStep: 2 },
                        }));
                        showMessage("Tutorial started", "success");
                      } catch (e) {
                        showMessage("Failed to start tutorial", "error");
                      }
                    }}
                  >
                    Replay Tutorial
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
             TAB 6: DANGER ZONE
             ============================================================ */}
          {activeTab === "danger-zone" && (
            <div className="settings-tab-panel fade-in-up">
              <div className="settings-card settings-card--danger">
                <div className="settings-card-header">
                  <span className="settings-card-icon" style={{ color: "#ef4444" }}>
                    <AlertTriangle size={20} />
                  </span>
                  <div className="settings-card-title-wrap">
                    <h2 className="settings-card-title" style={{ color: "#f87171" }}>
                      Danger Zone
                    </h2>
                    <p className="settings-card-desc">Irreversible and destructive actions for your account.</p>
                  </div>
                </div>

                <div className="settings-danger-list">
                  {/* Danger Item 1: Reset Collection Data */}
                  <div className="settings-danger-item">
                    <div className="settings-danger-item-info">
                      <span className="settings-danger-item-title">Reset All Collection Data</span>
                      <p className="settings-danger-item-desc">
                        Permanently wipe all caught Pokémon, shiny hunt counters, custom progress bars, and bingo progress while keeping your account and profile active.
                      </p>
                    </div>

                    <Button
                      variant="danger"
                      size="md"
                      icon={<RotateCcw size={16} />}
                      onClick={() => setShowResetCollectionModal(true)}
                    >
                      Reset Collection Data
                    </Button>
                  </div>

                  {/* Danger Item 2: Delete Account */}
                  <div className="settings-danger-item">
                    <div className="settings-danger-item-info">
                      <span className="settings-danger-item-title">Delete Account</span>
                      <p className="settings-danger-item-desc">
                        Permanently delete your account, login credentials, and all profile data. This action cannot be reversed.
                      </p>
                    </div>

                    <Button
                      variant="danger"
                      size="md"
                      icon={<Trash2 size={16} />}
                      onClick={() => setShowDeleteModal(true)}
                    >
                      Delete My Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
         MODAL 1: CHANGE USERNAME
         ============================================================ */}
      <Modal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        title="Change Username"
        subtitle="Your username appears on public profiles and community leaderboards."
        icon={<User size={20} />}
        size="sm"
        footer={({ close }) => (
          <>
            <Button variant="secondary" onClick={close} disabled={savingUsername}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveUsername}
              loading={savingUsername}
              disabled={
                !usernameCooldown.canChange ||
                !usernameAvailability.available ||
                !editUsername.trim() ||
                editUsername === username
              }
            >
              Save Username
            </Button>
          </>
        )}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {!usernameCooldown.canChange && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                fontSize: "0.82rem",
              }}
            >
              {usernameCooldown.message}
            </div>
          )}

          <TextField
            label="New Username"
            id="settings-new-username"
            value={editUsername}
            onChange={(e) => setEditUsername(e.target.value)}
            placeholder={username || "username"}
            maxLength={15}
            showCharCount
            startIcon={<User size={16} />}
            helperText={
              editUsername && editUsername !== username
                ? usernameAvailability.message
                : "Username must be 3–15 characters."
            }
            error={
              editUsername && editUsername !== username && !usernameAvailability.available
                ? usernameAvailability.message
                : undefined
            }
            autoComplete="username"
            fullWidth
          />
        </div>
      </Modal>

      {/* ============================================================
         MODAL 2: CHANGE EMAIL
         ============================================================ */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Change Email Address"
        subtitle="A verification code will be sent to your current and new email."
        icon={<Pencil size={20} />}
        size="sm"
        footer={({ close }) => (
          <>
            <Button variant="secondary" onClick={close} disabled={savingEmail}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleStartEmailChange}
              loading={savingEmail}
              disabled={!editEmail.trim() || editEmail === email}
            >
              Continue
            </Button>
          </>
        )}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStartEmailChange();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <TextField
            label="New Email Address"
            id="settings-edit-email"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            placeholder={email || "new@example.com"}
            startIcon={<Mail size={16} />}
            fullWidth
            required
            autoComplete="email"
          />

          {hasPassword && (
            <TextField
              label="Current Password"
              id="settings-email-curr-pwd"
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              placeholder="Enter current password"
              startIcon={<Lock size={16} />}
              fullWidth
              required
              autoComplete="current-password"
            />
          )}
        </form>
      </Modal>

      {/* ============================================================
         MODAL 3: CHANGE / SET PASSWORD
         ============================================================ */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title={hasPassword ? "Change Password" : "Set Account Password"}
        subtitle={
          hasPassword
            ? "Update your account password."
            : "Set a password to enable email & password sign-in for your account."
        }
        icon={<Lock size={20} />}
        size="sm"
        footer={({ close }) => (
          <>
            <Button variant="secondary" onClick={close} disabled={savingPassword}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSavePassword}
              loading={savingPassword}
              disabled={!newPassword || !confirmPassword || newPassword.length < 8}
            >
              {hasPassword ? "Update Password" : "Set Password"}
            </Button>
          </>
        )}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSavePassword();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          {hasPassword && (
            <TextField
              label="Current Password"
              id="settings-pwd-current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              startIcon={<Lock size={16} />}
              fullWidth
              required
              autoComplete="current-password"
            />
          )}

          <TextField
            label="New Password"
            id="settings-pwd-new"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            startIcon={<Lock size={16} />}
            fullWidth
            required
            autoComplete="new-password"
          />

          <TextField
            label="Confirm New Password"
            id="settings-pwd-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            startIcon={<Lock size={16} />}
            fullWidth
            required
            autoComplete="new-password"
            error={
              confirmPassword && newPassword !== confirmPassword
                ? "Passwords do not match"
                : undefined
            }
          />
        </form>
      </Modal>

      {/* ============================================================
         MODAL 4: MANAGE FORM TYPES
         ============================================================ */}
      <Modal
        isOpen={showFormTypesModal}
        onClose={() => setShowFormTypesModal(false)}
        title="Manage Form Types"
        subtitle="Toggle which Pokémon form categories appear across your Pokédex."
        icon={<SlidersHorizontal size={20} />}
        size="md"
        footer={({ close }) => (
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const allTrue = {};
                  FORM_TYPE_OPTIONS.forEach((f) => {
                    allTrue[f.key] = true;
                  });
                  const next = { ...dexPrefs, ...allTrue };
                  setDexPrefs(next);
                  localStorage.setItem("dexPreferences", JSON.stringify(next));
                  profileAPI.updateDexPreferences(next);
                }}
              >
                Select All
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const allFalse = {};
                  FORM_TYPE_OPTIONS.forEach((f) => {
                    allFalse[f.key] = false;
                  });
                  const next = { ...dexPrefs, ...allFalse };
                  setDexPrefs(next);
                  localStorage.setItem("dexPreferences", JSON.stringify(next));
                  profileAPI.updateDexPreferences(next);
                }}
              >
                Deselect All
              </Button>
            </div>
            <Button variant="primary" onClick={close}>
              Done
            </Button>
          </div>
        )}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "10px",
          }}
        >
          {FORM_TYPE_OPTIONS.map(({ key, label }) => (
            <label
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "10px",
                background: dexPrefs[key]
                  ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                  : "rgba(255, 255, 255, 0.03)",
                border: dexPrefs[key]
                  ? "1.5px solid var(--accent)"
                  : "1.5px solid rgba(255, 255, 255, 0.08)",
                cursor: "pointer",
                userSelect: "none",
                transition: "all 0.18s ease",
              }}
            >
              <input
                type="checkbox"
                checked={!!dexPrefs[key]}
                onChange={() => updateDexPreference(key, !dexPrefs[key])}
                style={{ accentColor: "var(--accent)", width: "16px", height: "16px" }}
              />
              <span
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: dexPrefs[key] ? "var(--text)" : "var(--text-muted)",
                }}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </Modal>

      {/* ============================================================
         MODAL 5: MANAGE SHINY LOCKING
         ============================================================ */}
      <Modal
        isOpen={showShinyLocksModal}
        onClose={() => setShowShinyLocksModal(false)}
        title="Manage Shiny Locks"
        subtitle="Prevent accidental marking of unavailable or locked shiny Pokémon."
        icon={<Lock size={20} />}
        size="md"
        footer={({ close }) => (
          <Button variant="primary" onClick={close} fullWidth>
            Done
          </Button>
        )}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {SHINY_LOCK_OPTIONS.map(({ key, label, desc }) => (
            <label
              key={key}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: dexPrefs[key]
                  ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                  : "rgba(255, 255, 255, 0.03)",
                border: dexPrefs[key]
                  ? "1.5px solid var(--accent)"
                  : "1.5px solid rgba(255, 255, 255, 0.08)",
                cursor: "pointer",
                userSelect: "none",
                transition: "all 0.18s ease",
              }}
            >
              <input
                type="checkbox"
                checked={!!dexPrefs[key]}
                onChange={() => updateDexPreference(key, !dexPrefs[key])}
                style={{ accentColor: "var(--accent)", width: "18px", height: "18px", marginTop: "2px" }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: dexPrefs[key] ? "var(--text)" : "var(--text-muted)",
                  }}
                >
                  {label}
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{desc}</span>
              </div>
            </label>
          ))}
        </div>
      </Modal>

      {/* ============================================================
         MODAL 6: MANAGE EXTERNAL LINKS
         ============================================================ */}
      <Modal
        isOpen={showExternalLinksModal}
        onClose={() => setShowExternalLinksModal(false)}
        title="External Link Destination"
        subtitle="Choose which reference website opens when clicking Pokémon names in the sidebar."
        icon={<ExternalLink size={20} />}
        size="md"
        footer={({ close }) => (
          <Button variant="primary" onClick={close} fullWidth>
            Done
          </Button>
        )}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {EXTERNAL_LINK_OPTIONS.map(({ id, label, desc }) => (
            <label
              key={id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "10px",
                background:
                  externalLink === id
                    ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                    : "rgba(255, 255, 255, 0.03)",
                border:
                  externalLink === id
                    ? "1.5px solid var(--accent)"
                    : "1.5px solid rgba(255, 255, 255, 0.08)",
                cursor: "pointer",
                userSelect: "none",
                transition: "all 0.18s ease",
              }}
            >
              <input
                type="radio"
                name="externalLinkOpt"
                value={id}
                checked={externalLink === id}
                onChange={() => handleExternalLinkChange(id)}
                style={{ accentColor: "var(--accent)", width: "18px", height: "18px", marginTop: "2px" }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: externalLink === id ? "var(--text)" : "var(--text-muted)",
                  }}
                >
                  {label}
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{desc}</span>
              </div>
            </label>
          ))}
        </div>
      </Modal>

      {/* ============================================================
         RESET COLLECTION MODAL
         ============================================================ */}
      {showResetCollectionModal && (
        <ResetCollectionModal
          isOpen={showResetCollectionModal}
          email={email}
          username={username}
          onClose={() => setShowResetCollectionModal(false)}
          onReset={() => {
            setUser((prev) => ({
              ...prev,
              progressBars: [],
              bingoGrid: [],
              activeHunts: [],
            }));
            // Force reload to home page so all data, memory states, and caches reset cleanly
            window.location.replace("/");
          }}
        />
      )}

      {/* ============================================================
         DELETE ACCOUNT MODAL
         ============================================================ */}
      {showDeleteModal && (
        <DeleteAccountModal
          isOpen={showDeleteModal}
          email={email}
          username={username}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => {
            clearAccountBrowserStorage(username);
            setUser({
              username: null,
              email: null,
              createdAt: null,
              profileTrainer: null,
              verified: false,
              progressBars: [],
            });
            window.location.replace("/");
          }}
        />
      )}

      {/* ============================================================
         PASSWORD VERIFICATION MODAL
         ============================================================ */}
      {showPasswordVerificationModal && (
        <PasswordVerificationModal
          isOpen={showPasswordVerificationModal}
          email={email}
          onClose={() => setShowPasswordVerificationModal(false)}
          onVerified={handlePasswordVerification}
        />
      )}

      {/* ============================================================
         EMAIL VERIFICATION MODAL
         ============================================================ */}
      {showEmailVerificationModal && (
        <EmailVerificationModal
          isOpen={showEmailVerificationModal}
          currentEmail={email}
          newEmail={editEmail}
          step={emailVerificationStep}
          onClose={() => {
            setShowEmailVerificationModal(false);
            setEmailVerificationStep("current");
            setSavingEmail(false);
          }}
          onVerified={handleEmailVerification}
        />
      )}
    </div>
  );
}
