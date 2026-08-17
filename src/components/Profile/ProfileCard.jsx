import React from 'react';
import { PencilLine, Mars, Venus, VenusAndMars, Youtube, Twitch } from "lucide-react";
import ContentFilterInput from "../Shared/ContentFilterInput";
import { SearchbarIconDropdown } from "../Shared/SearchBar";
import { COUNTRY_OPTIONS } from "../../data/countries";

function formatSwitchFCInput(value) {
    const digits = (value || "").replace(/\D/g, "").slice(0, 12);
    if (!digits) return "";
    const parts = digits.match(/.{1,4}/g) || [];
    return "SW-" + parts.join("-");
}

function formatGoFCInput(value) {
    const digits = (value || "").replace(/\D/g, "").slice(0, 12);
    if (!digits) return "";
    const parts = digits.match(/.{1,4}/g) || [];
    return parts.join(" ");
}

export default function ProfileCard({ isOwner, isEditing, form, setForm, setShowTrainerModal }) {
    return (
        <div className="profile-left">
            <div className="profile-header-row">
                <div className="profile-avatar-block" style={{ position: "relative" }}>
                    <div
                        className="profile-avatar"
                        onClick={() => { if (isOwner && isEditing) setShowTrainerModal(true); }}
                        style={{ cursor: (isOwner && isEditing) ? "pointer" : "default" }}
                    >
                        <img
                            src={`/data/trainer_sprites/${form.profileTrainer || "ash.png"}`}
                            alt="Trainer"
                            className="profile-avatar-img"
                        />
                        {isOwner && isEditing && (
                            <PencilLine
                                size={45}
                                strokeWidth={2}
                                className="edit-overlay-icon"
                                style={{
                                    position: "absolute",
                                    top: "0px",
                                    right: "0px",
                                    background: "none",
                                }}
                            />
                        )}
                    </div>
                </div>

                <div className="profile-bio-block">
                    <div className="profile-field">
                        <label>Bio</label>
                        {isOwner && isEditing ? (
                            <ContentFilterInput
                                type="textarea"
                                value={form.bio}
                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                configType="bio"
                                showCharacterCount={true}
                                showRealTimeValidation={true}
                                placeholder="Tell us about yourself..."
                                maxLength={250}
                            />
                        ) : (
                            <div className="field-display">
                                {form.bio && form.bio.length > 150 ? `${form.bio.slice(0, 150)}…` : (form.bio || "N/A")}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="profile-row-split">
                <div className="profile-field">
                    <label>Location</label>
                    {isOwner && isEditing ? (
                        <SearchbarIconDropdown
                            options={COUNTRY_OPTIONS.map(country => ({
                                name: country.name,
                                value: country.value,
                                icon: <span className={`fi fi-${country.code.toLowerCase()}`} />
                            }))}
                            value={form.location}
                            onChange={(value) => setForm({ ...form, location: value })}
                            placeholder="Select location"
                            hideClearButton
                        />
                    ) : (
                        <div className="field-display">
                            {(() => {
                                const selected = COUNTRY_OPTIONS.find(c => c.name === form.location);
                                return selected ? (
                                    <>
                                        <span className={`fi fi-${selected.code.toLowerCase()}`} style={{ marginRight: "8px" }} />
                                        {selected.name}
                                    </>
                                ) : (
                                    form.location || "N/A"
                                );
                            })()}
                        </div>
                    )}
                </div>

                <div className="profile-field">
                    <label>Gender</label>
                    {isOwner && isEditing ? (
                        <SearchbarIconDropdown
                            options={[
                                { name: "Male", value: "Male", icon: <Mars size={18} color="#4aaaff" /> },
                                { name: "Female", value: "Female", icon: <Venus size={18} color="#ff6ec7" /> },
                                { name: "Other", value: "Other", icon: <VenusAndMars size={18} color="#ffffff" /> },
                            ]}
                            value={form.gender}
                            onChange={(value) => setForm({ ...form, gender: value })}
                            placeholder="Select gender"
                            hideClearButton
                        />
                    ) : (
                        <div className="field-display">
                            {form.gender === "Male" && <Mars size={16} color="#4aaaff" style={{ marginRight: "6px" }} />}
                            {form.gender === "Female" && <Venus size={16} color="#ff6ec7" style={{ marginRight: "6px" }} />}
                            {form.gender === "Other" && <VenusAndMars size={16} color="#ffffff" style={{ marginRight: "6px" }} />}
                            {form.gender === "Other" ? "Female" : (form.gender || "N/A")}
                        </div>
                    )}
                </div>
            </div>

            <div className="profile-row-split">
                {(isEditing || form.switchFriendCode) && (
                    <div className="profile-field">
                        <label>Switch Friend Code</label>
                        {isOwner && isEditing ? (
                            <input
                                type="text"
                                placeholder="SW-1234-5678-9012"
                                value={form.switchFriendCode}
                                onChange={(e) => setForm({ ...form, switchFriendCode: formatSwitchFCInput(e.target.value) })}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    const text = (e.clipboardData || window.clipboardData).getData("text");
                                    setForm({ ...form, switchFriendCode: formatSwitchFCInput(text) });
                                }}
                                inputMode="numeric"
                                autoComplete="off"
                                maxLength={17}
                                pattern="^SW-\d{4}-\d{4}-\d{4}$"
                                title="Format: SW-1234-5678-9012"
                                style={{
                                    backgroundImage: 'url(/data/friend_code_icons/switch.png)',
                                    backgroundPosition: '12px center',
                                    backgroundSize: '20px 20px',
                                    backgroundRepeat: 'no-repeat',
                                    paddingLeft: '40px'
                                }}
                            />
                        ) : (
                            <div className="field-display">
                                <img src="/data/friend_code_icons/switch.png" alt="Switch" className="w-5 h-5 object-contain" style={{ marginRight: "6px" }} />
                                <span>{form.switchFriendCode}</span>
                            </div>
                        )}
                    </div>
                )}

                {(isEditing || form.goFriendCode) && (
                    <div className="profile-field">
                        <label>GO Friend Code</label>
                        {isOwner && isEditing ? (
                            <input
                                type="text"
                                placeholder="0000 0000 0000"
                                value={form.goFriendCode}
                                onChange={(e) => setForm({ ...form, goFriendCode: formatGoFCInput(e.target.value) })}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    const text = (e.clipboardData || window.clipboardData).getData("text");
                                    setForm({ ...form, goFriendCode: formatGoFCInput(text) });
                                }}
                                inputMode="numeric"
                                autoComplete="off"
                                maxLength={14}
                                pattern="^\d{4} \d{4} \d{4}$"
                                title="Format: 0000 0000 0000"
                                style={{
                                    backgroundImage: 'url(/data/friend_code_icons/go.png)',
                                    backgroundPosition: '12px center',
                                    backgroundSize: '20px 20px',
                                    backgroundRepeat: 'no-repeat',
                                    paddingLeft: '40px'
                                }}
                            />
                        ) : (
                            <div className="field-display">
                                <img src="/data/friend_code_icons/go.png" alt="Pokémon GO" className="w-5 h-5 object-contain" style={{ marginRight: "6px" }} />
                                <span>{form.goFriendCode}</span>
                            </div>
                        )}
                    </div>
                )}

                {isOwner && isEditing && (
                    <>
                        <div className="profile-field">
                            <label><Youtube size={16} color="#ef4444" /> YouTube URL</label>
                            <input
                                type="url"
                                placeholder="https://youtube.com/@YourChannel"
                                value={form.youtubeUrl}
                                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                            />
                        </div>
                        <div className="profile-field">
                            <label><Twitch size={16} color="#a855f7" /> Twitch URL</label>
                            <input
                                type="url"
                                placeholder="https://twitch.tv/yourchannel"
                                value={form.twitchUrl}
                                onChange={(e) => setForm({ ...form, twitchUrl: e.target.value })}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
