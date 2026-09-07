import React from 'react';
import { PencilLine, Mars, Venus, VenusAndMars, Globe } from "lucide-react";
import { YoutubeIcon, TwitchIcon } from "../Shared/SocialIcons";
import { COUNTRY_OPTIONS } from "../../data/countries";
import { InputField, SelectField, TextAreaField, DateField } from "../Shared/FormField";
import { getUserAvatarUrl, formatBirthday } from "../../utils/profileUtils";
import "flag-icons/css/flag-icons.min.css";

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
                            src={getUserAvatarUrl(form.avatar ? { avatar: form.avatar } : form)}
                            alt="Avatar"
                            className="profile-avatar-img"
                        />
                        {isOwner && isEditing && (
                            <div className="profile-avatar-overlay">
                                <PencilLine size={32} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-bio-block">
                    <div className="profile-field">
                        <label>Bio</label>
                        {isOwner && isEditing ? (
                            <TextAreaField
                                id="profile-card-bio"
                                value={form.bio || ""}
                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                placeholder="Tell us about yourself..."
                                maxLength={250}
                                showCount
                                resize="none"
                                rows={4}
                                fullWidth
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
                        <SelectField
                            id="profile-card-location"
                            options={COUNTRY_OPTIONS.map(country => ({
                                label: country.name,
                                value: country.name,
                                icon: <span className={`fi fi-${country.code.toLowerCase()}`} />
                            }))}
                            value={form.location || ""}
                            onChange={(value) => setForm({ ...form, location: value })}
                            placeholder="Select location"
                            searchable
                            searchPlaceholder="Search country..."
                            clearable
                            size="md"
                            fullWidth
                            startIcon={
                                (() => {
                                    const selected = COUNTRY_OPTIONS.find(c => c.name === form.location);
                                    if (selected) {
                                        return <span className={`fi fi-${selected.code.toLowerCase()}`} />;
                                    }
                                    return <Globe size={16} />;
                                })()
                            }
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
                        <SelectField
                            id="profile-card-gender"
                            options={[
                                { label: "Male", value: "Male", icon: <Mars size={18} color="#4aaaff" /> },
                                { label: "Female", value: "Female", icon: <Venus size={18} color="#ff6ec7" /> },
                                { label: "Other", value: "Other", icon: <VenusAndMars size={18} color="#ffffff" /> },
                            ]}
                            value={form.gender || ""}
                            onChange={(value) => setForm({ ...form, gender: value })}
                            placeholder="Select gender"
                            clearable
                            size="md"
                            fullWidth
                            startIcon={
                                (() => {
                                    if (form.gender === "Male") return <Mars size={16} color="#4aaaff" />;
                                    if (form.gender === "Female") return <Venus size={16} color="#ff6ec7" />;
                                    if (form.gender === "Other") return <VenusAndMars size={16} color="#ffffff" />;
                                    return <VenusAndMars size={16} />;
                                })()
                            }
                        />
                    ) : (
                        <div className="field-display">
                            {form.gender === "Male" && <Mars size={16} color="#4aaaff" style={{ marginRight: "6px" }} />}
                            {form.gender === "Female" && <Venus size={16} color="#ff6ec7" style={{ marginRight: "6px" }} />}
                            {form.gender === "Other" && <VenusAndMars size={16} color="#ffffff" style={{ marginRight: "6px" }} />}
                            {form.gender || "N/A"}
                        </div>
                    )}
                </div>

                {form.birthday && form.birthday.month && form.birthday.day && (
                    <div className="profile-field">
                        <label>Birthday</label>
                        <div className="field-display">
                            <img src="/svgs/birthday_cake.svg" alt="Birthday" className="w-4 h-4 object-contain" style={{ marginRight: "6px" }} />
                            <span>{formatBirthday(form.birthday)}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="profile-row-split">
                {(isEditing || form.switchFriendCode) && (
                    <div className="profile-field">
                        <label>Switch Friend Code</label>
                        {isOwner && isEditing ? (
                            <InputField
                                id="profile-card-switch-fc"
                                type="text"
                                placeholder="SW-1234-5678-9012"
                                value={form.switchFriendCode || ""}
                                onChange={(e) => setForm({ ...form, switchFriendCode: formatSwitchFCInput(e.target.value) })}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    const text = (e.clipboardData || window.clipboardData).getData("text");
                                    setForm({ ...form, switchFriendCode: formatSwitchFCInput(text) });
                                }}
                                startIcon={<img src="/data/friend_code_icons/switch.png" alt="Switch" className="w-5 h-5 object-contain" />}
                                inputMode="numeric"
                                autoComplete="off"
                                maxLength={17}
                                pattern="^SW-\d{4}-\d{4}-\d{4}$"
                                title="Format: SW-1234-5678-9012"
                                clearable
                                onClear={() => setForm({ ...form, switchFriendCode: "" })}
                                size="md"
                                fullWidth
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
                        <label>Pokémon GO Friend Code</label>
                        {isOwner && isEditing ? (
                            <InputField
                                id="profile-card-go-fc"
                                type="text"
                                placeholder="0000 0000 0000"
                                value={form.goFriendCode || ""}
                                onChange={(e) => setForm({ ...form, goFriendCode: formatGoFCInput(e.target.value) })}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    const text = (e.clipboardData || window.clipboardData).getData("text");
                                    setForm({ ...form, goFriendCode: formatGoFCInput(text) });
                                }}
                                startIcon={<img src="/data/friend_code_icons/go.png" alt="Pokémon GO" className="w-5 h-5 object-contain" />}
                                inputMode="numeric"
                                autoComplete="off"
                                maxLength={14}
                                pattern="^\d{4} \d{4} \d{4}$"
                                title="Format: 0000 0000 0000"
                                clearable
                                onClear={() => setForm({ ...form, goFriendCode: "" })}
                                size="md"
                                fullWidth
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
                            <label><YoutubeIcon size={16} color="#ef4444" /> YouTube</label>
                            <InputField
                                id="profile-card-youtube"
                                type="text"
                                placeholder="@channel or URL"
                                value={form.youtubeUrl || ""}
                                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                                startIcon={<YoutubeIcon size={16} color="#ef4444" />}
                                clearable
                                onClear={() => setForm({ ...form, youtubeUrl: "" })}
                                size="md"
                                fullWidth
                            />
                        </div>
                        <div className="profile-field">
                            <label><TwitchIcon size={16} color="#a855f7" /> Twitch</label>
                            <InputField
                                id="profile-card-twitch"
                                type="text"
                                placeholder="channel or URL"
                                value={form.twitchUrl || ""}
                                onChange={(e) => setForm({ ...form, twitchUrl: e.target.value })}
                                startIcon={<TwitchIcon size={16} color="#a855f7" />}
                                clearable
                                onClear={() => setForm({ ...form, twitchUrl: "" })}
                                size="md"
                                fullWidth
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
