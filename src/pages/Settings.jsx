import React, { useState, useContext, useEffect } from "react";
import "../css/Settings.css";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { UserContext } from "../components/Shared/UserContext";
import { useMessage } from "../components/Shared/MessageContext";
import { useTheme } from "../components/Shared/ThemeContext";
import DeleteAccountModal from "../components/Shared/DeleteAccountModal";
import ContentFilterInput from "../components/Shared/ContentFilterInput";
import { profileAPI, userAPI } from "../utils/api";


export default function Settings() {
    const { username, email, setUser } = useContext(UserContext);
    const [newUsername, setNewUsername] = useState(username || "");
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
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const togglePrivacy = async (nextPublic) => {
        // switch ON means Public, so isPrivate is the inverse
        setIsPrivate(!nextPublic);
        setSavingPrivacy(true);
        try {
            await profileAPI.updateProfile({ isProfilePublic: nextPublic });

            // re-fetch to lock UI to what’s saved
            const data = await profileAPI.getProfile();
            setIsPrivate(data?.isProfilePublic === false);
            showMessage(data?.isProfilePublic === false ? "🔒 Profile set to private" : "🌐 Profile set to public", "success");
        } catch (error) {
            console.error('Failed to update privacy:', error);
            // revert UI on error
            setIsPrivate(prev => prev); // no-op (you can also refetch)
            showMessage("❌ Couldn't update privacy", "error");
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
            const data = await userAPI.updateUsername(newUsername);
            setUser(prev => ({ ...prev, username: data.username }));
            showMessage("✅ Username updated successfully!", "success");
        } catch (err) {
            showMessage("❌ " + err.message, "error");
        }
    }

    async function handlePasswordChange() {
        // Frontend validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            showMessage("❌ All fields are required", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage("❌ New passwords do not match", "error");
            return;
        }

        if (newPassword.length < 8) {
            showMessage("❌ New password must be at least 8 characters", "error");
            return;
        }

        try {
            await userAPI.changePassword(currentPassword, newPassword, confirmPassword);
            showMessage("🔒 Password updated!", "success");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            showMessage("❌ " + err.message, "error");
        }
    }


    return (
            <div className="settings-page">
      <h1 className="page-title">Settings</h1>
      <div className="settings-container">
                {/* Left Column */}
                <div className="settings-column">

                    {/* Change Username */}
                    <div className="setting-block">
                        <h3>Change Username</h3>
                        <div className="input-icon-wrapper">
                            <User className="auth-icon" size={24} />
                            <ContentFilterInput
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder="New username"
                                configType="username"
                                showCharacterCount={false}
                                showRealTimeValidation={false}
                            />
                        </div>
                        <button onClick={handleUsernameSave}>Save</button>
                    </div>

                    <div className="setting-divider" />

                    {/* Theme Toggle */}
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
                                />
                            ))}
                        </div>
                    </div>

                    <div className="setting-divider" />
                </div>

                {/* Right Column */}
                <div className="settings-column">

                    {/* Change Password */}
                    <div className="setting-block">
                        <h3>Change Password</h3>
                        <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }}>
                            <div className="input-icon-wrapper">
                                <Lock className="auth-icon" size={24} />
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="Current password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="show-password-toggle"
                                    onClick={() => setShowCurrentPassword(prev => !prev)}
                                >
                                    {showCurrentPassword ? <EyeOff className="auth-icon" size={24} /> : <Eye className="auth-icon" size={24} />}
                                </button>
                            </div>
                            <div className="input-icon-wrapper">
                                <Lock className="auth-icon" size={24} />
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="New password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="show-password-toggle"
                                    onClick={() => setShowNewPassword(prev => !prev)}
                                >
                                    {showNewPassword ? <EyeOff className="auth-icon" size={24} /> : <Eye className="auth-icon" size={24} />}
                                </button>
                            </div>
                            <div className="input-icon-wrapper">
                                <Lock className="auth-icon" size={24} />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="show-password-toggle"
                                    onClick={() => setShowConfirmPassword(prev => !prev)}
                                >
                                    {showConfirmPassword ? <EyeOff className="auth-icon" size={24} /> : <Eye className="auth-icon" size={24} />}
                                </button>
                            </div>
                            <button type="submit">Update Password</button>
                        </form>
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

                    <div className="setting-divider" />

                    {/* Connected Accounts */}
                    <div className="setting-block">
                        <h3>Connected Accounts</h3>
                        <p className="coming-soon-note">Coming soon...</p>
                    </div>

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
            </div>
            {showDeleteModal && (
                <DeleteAccountModal
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

        </div>
    );
}
