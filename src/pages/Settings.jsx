import React, { useState, useContext, useEffect } from "react";
import "../css/Settings.css";
import { User, Lock, Eye, EyeOff, Check, X, Loader, Mail } from "lucide-react";
import { UserContext } from "../components/Shared/UserContext";
import { useMessage } from "../components/Shared/MessageContext";
import { useTheme } from "../components/Shared/ThemeContext";
import DeleteAccountModal from "../components/Shared/DeleteAccountModal";
import PasswordVerificationModal from "../components/Shared/PasswordVerificationModal";
import EmailVerificationModal from "../components/Shared/EmailVerificationModal";
import ContentFilterInput from "../components/Shared/ContentFilterInput";
import DexPreferences from "../components/Shared/DexPreferences";
import { validateContent } from "../../shared/contentFilter";
import { profileAPI, userAPI } from "../utils/api";
import { useUsernameAvailability } from "../hooks/useUsernameAvailability";
import { useUsernameCooldown } from "../hooks/useUsernameCooldown";


export default function Settings() {
    const { username, email, setUser } = useContext(UserContext);
    const [newUsername, setNewUsername] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [emailPassword, setEmailPassword] = useState("");
    const [showEmailPassword, setShowEmailPassword] = useState(false);
    const { theme, setTheme, accent, setAccent } = useTheme();
    const [isPrivate, setIsPrivate] = useState(false);
    const { showMessage } = useMessage();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [savingPrivacy, setSavingPrivacy] = useState(false);
    const [savingUsername, setSavingUsername] = useState(false);
    const [savingEmail, setSavingEmail] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordVerificationModal, setShowPasswordVerificationModal] = useState(false);
    const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
    const [emailVerificationStep, setEmailVerificationStep] = useState("current"); // "current" or "new"

    // Username availability checking
    const usernameAvailability = useUsernameAvailability(newUsername, username);

    // Username cooldown checking
    const usernameCooldown = useUsernameCooldown();

    const togglePrivacy = async (nextPublic) => {
        // switch ON means Public, so isPrivate is the inverse
        setIsPrivate(!nextPublic);
        setSavingPrivacy(true);
        try {
            await profileAPI.updateProfile({ isProfilePublic: nextPublic });

            // re-fetch to lock UI to what's saved
            const data = await profileAPI.getProfile();
            setIsPrivate(data?.isProfilePublic === false);
            showMessage(data?.isProfilePublic === false ? "Profile set to private" : "Profile set to public", "success");
        } catch (error) {
            console.error('Failed to update privacy:', error);
            // revert UI on error
            setIsPrivate(prev => prev); // no-op (you can also refetch)
            showMessage("Couldn't update privacy", "error");
        } finally {
            setSavingPrivacy(false);
        }
    };


    const [deleting, setDeleting] = useState(false);


    const accentOptions = ["yellow", "red", "orange", "green", "blue", "cyan", "purple", "pink", "brown"];

    useEffect(() => {
        (async () => {
            try {
                const data = await profileAPI.getProfile();
                setIsPrivate(data?.isProfilePublic === false); // default is public
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            }
        })();
    }, []);


    async function handleUsernameSave() {
        try {
            setSavingUsername(true);

            // Check cooldown first
            if (!usernameCooldown.canChange) {
                showMessage(usernameCooldown.message, "error");
                setSavingUsername(false);
                return;
            }

            // Check if username is available
            if (!usernameAvailability.available) {
                showMessage("Username is not available", "error");
                setSavingUsername(false);
                return;
            }

            const validation = validateContent(String(newUsername || ''), 'username');
            if (!validation.isValid) {
                showMessage(`${validation.error}`, 'error');
                setSavingUsername(false);
                return;
            }

            const data = await userAPI.updateUsername(newUsername);
            setUser(prev => ({ ...prev, username: data.username }));
            showMessage("Username updated successfully!", "success");

            // Refresh cooldown status
            usernameCooldown.refreshCooldown();
        } catch (err) {
            showMessage(err.message, "error");
        } finally {
            setSavingUsername(false);
        }
    }

    function handleEmailChange() {
        // Frontend validation
        if (!newEmail || !emailPassword) {
            showMessage("Email and password are required", "error");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            showMessage("Invalid email format", "error");
            return;
        }

        // Open verification modal for current email
        setEmailVerificationStep("current");
        setShowEmailVerificationModal(true);
    }

    async function handleEmailVerification(code, result) {
        if (emailVerificationStep === "current") {
            // Current email verified by modal, now change email
            try {
                setSavingEmail(true);
                const data = await userAPI.changeEmail(newEmail, emailPassword);

                // Switch to new email verification step
                setEmailVerificationStep("new");
                // Modal will stay open for new email verification
            } catch (err) {
                showMessage(err.message || "Failed to change email", "error");
                setShowEmailVerificationModal(false);
            } finally {
                setSavingEmail(false);
            }
        } else {
            // New email verified by modal, update user context with result
            if (result && result.email) {
                setUser(prev => ({ ...prev, email: result.email, verified: result.verified }));
            }
            setNewEmail("");
            setEmailPassword("");
            setShowEmailVerificationModal(false);
            setEmailVerificationStep("current");
        }
    }

    function handlePasswordChange() {
        // Frontend validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            showMessage("All fields are required", "error");
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

        // Show verification modal instead of directly changing password
        setShowPasswordVerificationModal(true);
    }

    async function handlePasswordVerification(verificationCode) {
        try {
            setSavingPassword(true);
            await userAPI.changePassword(currentPassword, newPassword, confirmPassword);
            showMessage("Password updated!", "success");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            showMessage(err.message, "error");
        } finally {
            setSavingPassword(false);
        }
    }


    return (
        <div className="settings-page page-container fade-in-up">
            <h1 className="page-title">Settings</h1>
            <div className="app-divider" />
            <div className="settings-container">
                {/* Left Column - Account Settings */}
                <div className="settings-column">

                    {/* Change Username */}
                    <div className="setting-block">
                        <div className="setting-header">
                            <h3>Change Username</h3>
                            {/* Status message above input on the right */}
                            {!usernameCooldown.canChange ? (
                                <div className="username-status-top">
                                    <span className="status-text cooldown">
                                        {usernameCooldown.message}
                                    </span>
                                </div>
                            ) : newUsername && newUsername.trim() !== "" && usernameAvailability.message ? (
                                <div className="username-status-top">
                                    <span className={`status-text ${usernameAvailability.status}`}>
                                        {usernameAvailability.message}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                        <div className="input-icon-wrapper">
                            <User className="auth-icon" size={24} />
                            <ContentFilterInput
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder={username || "username"}
                                configType="username"
                                showCharacterCount={false}
                                showRealTimeValidation={false}
                            />
                            {/* Username availability indicator inside the input */}
                            {newUsername && newUsername.trim() !== "" && (
                                <div className="username-availability-inline">
                                    {usernameAvailability.status === 'checking' && (
                                        <Loader size={16} className="spinning" />
                                    )}
                                    {usernameAvailability.status === 'available' && (
                                        <Check size={16} className="text-green-600" />
                                    )}
                                    {usernameAvailability.status === 'taken' && (
                                        <X size={16} className="text-red-600" />
                                    )}
                                    {usernameAvailability.status === 'error' && (
                                        <X size={16} className="text-red-600" />
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleUsernameSave}
                            disabled={savingUsername || !usernameCooldown.canChange || !usernameAvailability.available || newUsername.trim() === ""}
                        >
                            {savingUsername ? "Saving..." : "Save"}
                        </button>
                    </div>

                    <div className="setting-divider" />

                    {/* Change Email */}
                    <div className="setting-block">
                        <h3>Change Email</h3>
                        <form onSubmit={(e) => { e.preventDefault(); handleEmailChange(); }}>
                            <div className="input-icon-wrapper">
                                <Mail className="auth-icon" size={24} />
                                <input
                                    id="settings-new-email"
                                    name="email"
                                    type="email"
                                    placeholder={email || "new email"}
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    autoComplete="email"
                                />
                            </div>
                            <div className="input-icon-wrapper">
                                <Lock className="auth-icon" size={24} />
                                <input
                                    id="settings-email-password"
                                    name="current-password"
                                    type={showEmailPassword ? "text" : "password"}
                                    placeholder="Current password"
                                    value={emailPassword}
                                    onChange={(e) => setEmailPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="show-password-toggle"
                                    onClick={() => setShowEmailPassword(prev => !prev)}
                                    tabIndex={-1}
                                >
                                    {showEmailPassword ? <EyeOff className="auth-icon" size={24} /> : <Eye className="auth-icon" size={24} />}
                                </button>
                            </div>
                        </form>
                        <button onClick={handleEmailChange} disabled={savingEmail}>
                            {savingEmail ? "Updating..." : "Update Email"}
                        </button>
                    </div>

                    <div className="setting-divider" />

                    {/* Change Password */}
                    <div className="setting-block">
                        <h3>Change Password</h3>
                        <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }}>
                            <div className="input-icon-wrapper">
                                <Lock className="auth-icon" size={24} />
                                <input
                                    id="settings-current-password"
                                    name="current-password"
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="Current password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="show-password-toggle"
                                    onClick={() => setShowCurrentPassword(prev => !prev)}
                                    tabIndex={-1}
                                >
                                    {showCurrentPassword ? <EyeOff className="auth-icon" size={24} /> : <Eye className="auth-icon" size={24} />}
                                </button>
                            </div>
                            <div className="input-icon-wrapper">
                                <Lock className="auth-icon" size={24} />
                                <input
                                    id="settings-new-password"
                                    name="new-password"
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="New password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="show-password-toggle"
                                    onClick={() => setShowNewPassword(prev => !prev)}
                                    tabIndex={-1}
                                >
                                    {showNewPassword ? <EyeOff className="auth-icon" size={24} /> : <Eye className="auth-icon" size={24} />}
                                </button>
                            </div>
                            <div className="input-icon-wrapper">
                                <Lock className="auth-icon" size={24} />
                                <input
                                    id="settings-confirm-password"
                                    name="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="show-password-toggle"
                                    onClick={() => setShowConfirmPassword(prev => !prev)}
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff className="auth-icon" size={24} /> : <Eye className="auth-icon" size={24} />}
                                </button>
                            </div>
                        </form>
                        <button onClick={handlePasswordChange} disabled={savingPassword}>{savingPassword ? "Updating..." : "Update Password"}</button>
                    </div>

                    <div className="setting-divider" />

                    {/* Profile Privacy */}
                    <div className="setting-block">
                        <h3>Profile Visibility</h3>

                        <div className="setting-row">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    className="switch-input"
                                    checked={!isPrivate}                  // ON = Public
                                    onChange={(e) => togglePrivacy(e.target.checked)}
                                    disabled={savingPrivacy}
                                />
                                <span className="switch-slider" />
                            </label>

                            <span className="switch-state">{!isPrivate ? "Public" : "Private"}</span>
                        </div>
                    </div>


                    {/* Connected Accounts */}
                    {/* <div className="setting-block">
                        <h3>Connected Accounts</h3>
                        <p className="coming-soon-note">Coming soon...</p>
                    </div>

                    <div className="setting-divider" /> */}

                    <div className="setting-divider" />

                    {/* Delete Account */}
                    <div className="setting-block danger-zone">
                        <h3>Delete Account</h3>
                        <p>This action cannot be undone. Please proceed with caution.</p>
                        <button className="delete-btn" onClick={() => setShowDeleteModal(true)}>
                            Delete My Account
                        </button>
                    </div>
                </div>

                {/* Right Column - Preferences & Customization */}
                <div className="settings-column">

                    {/* Website Theme */}
                    <div className="setting-block">
                        <h3>Website Theme</h3>

                        <div className="theme-choice-grid">
                            {["light", "dark", "system"].map((opt) => (
                                <label
                                    key={opt}
                                    className={`theme-card ${theme === opt ? "active" : ""}`}
                                >
                                    <input
                                        type="radio"
                                        name="theme"
                                        value={opt}
                                        checked={theme === opt}
                                        onChange={() => setTheme(opt)}
                                    />

                                    <div className={`theme-preview ${opt}`}>
                                        <div className="preview-header">
                                            <span className="avatar-dot" />
                                        </div>
                                        <div className="preview-lines">
                                            <span />
                                            <span />
                                            <span />
                                        </div>
                                    </div>

                                    <div className="theme-label">
                                        {opt === "light" ? "Light" : opt === "dark" ? "Dark" : "System"}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="setting-divider" />

                    {/* Accent Color */}
                    <div className="setting-block">
                        <h3>Accent Color</h3>
                        <div className="accent-color-options">
                            {accentOptions.map(color => (
                                <div
                                    key={color}
                                    className={`accent-circle ${color} ${accent === color ? "selected" : ""}`}
                                    onClick={() => setAccent(color)}
                                    style={{ position: 'relative' }}
                                >
                                    {accent === color && (
                                        <Check
                                            size={18}
                                            className="accent-check-icon"
                                            style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                pointerEvents: 'none',
                                                strokeWidth: 3
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="setting-divider" />

                    {/* Dex Preferences */}
                    <DexPreferences />
                </div>
            </div>
            {showDeleteModal && (
                <DeleteAccountModal
                    isOpen={showDeleteModal}
                    email={email}                         // if you keep email in Settings state; else pass from context
                    username={username}
                    onClose={() => setShowDeleteModal(false)}
                    onDeleted={() => {
                        // wipe local user + hard redirect
                        setUser({ username: null, email: null, createdAt: null, profileTrainer: null, verified: false, progressBars: [] });
                        window.location.replace("/");
                    }}
                />
            )}
            {showPasswordVerificationModal && (
                <PasswordVerificationModal
                    isOpen={showPasswordVerificationModal}
                    email={email}
                    onClose={() => setShowPasswordVerificationModal(false)}
                    onVerified={handlePasswordVerification}
                />
            )}
            {showEmailVerificationModal && (
                <EmailVerificationModal
                    isOpen={showEmailVerificationModal}
                    currentEmail={email}
                    newEmail={newEmail}
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
