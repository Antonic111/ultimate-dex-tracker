import React from 'react';
import { Mars, Venus, VenusAndMars, User, Globe } from "lucide-react";
import { YoutubeIcon, TwitchIcon } from "../Shared/SocialIcons";
import { COUNTRY_OPTIONS } from "../../data/countries";
import { InputField, SelectField, DateField } from "../Shared/FormField";
import { normalizeYoutubeUrl, normalizeTwitchUrl, extractYoutubeHandle, extractTwitchHandle, formatBirthday } from "../../utils/profileUtils";
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

export default function ProfileInfoBox({ isOwner, isEditing, form, setForm, isContentCreator = false, isAdmin = false }) {
    return (
        <div className="profile-info-box-container">
            <h3 className="profile-section-title">
                <User size={18} className="text-gray-400" /> PROFILE INFO
            </h3>
            {isEditing && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #9ca3af)', margin: '-6px 0 12px 0', lineHeight: 1.4 }}>
                    ℹ️ Profile information entered here is <strong>publicly visible</strong> on your trainer card by default. You can switch your profile to Private in Settings at any time.
                </p>
            )}
            <div className="profile-info-grid">
                
                {/* Location */}
                <div className="profile-info-row">
                    <div className="info-label">Location</div>
                    {isOwner && isEditing ? (
                        <div className="info-edit-wrapper">
                            <SelectField
                                id="profile-info-location"
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
                                size="sm"
                                fullWidth
                                startIcon={
                                    (() => {
                                        const selected = COUNTRY_OPTIONS.find(c => c.name === form.location || c.value === form.location);
                                        if (selected) {
                                            return <span className={`fi fi-${selected.code.toLowerCase()}`} />;
                                        }
                                        return <Globe size={15} />;
                                    })()
                                }
                            />
                        </div>
                    ) : (
                        <div className="info-value flex items-center gap-1.5">
                            {(() => {
                                const selected = COUNTRY_OPTIONS.find(c => c.name === form.location || c.value === form.location);
                                return selected ? (
                                    <>
                                        <span className={`fi fi-${selected.code.toLowerCase()} rounded-[2px]`} style={{ marginRight: "4px" }} />
                                        {selected.name}
                                    </>
                                ) : (
                                    form.location || "Earth"
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* Gender */}
                <div className="profile-info-row">
                    <div className="info-label">Gender</div>
                    {isOwner && isEditing ? (
                        <div className="info-edit-wrapper">
                            <SelectField
                                id="profile-info-gender"
                                options={[
                                    { label: "Male", value: "Male", icon: <Mars size={16} color="#4aaaff" /> },
                                    { label: "Female", value: "Female", icon: <Venus size={16} color="#ff6ec7" /> },
                                    { label: "Other", value: "Other", icon: <VenusAndMars size={16} color="#ffffff" /> },
                                ]}
                                value={form.gender || ""}
                                onChange={(value) => setForm({ ...form, gender: value })}
                                placeholder="Select gender"
                                clearable
                                size="sm"
                                fullWidth
                                startIcon={
                                    (() => {
                                        if (form.gender === "Male") return <Mars size={15} color="#4aaaff" />;
                                        if (form.gender === "Female") return <Venus size={15} color="#ff6ec7" />;
                                        if (form.gender === "Other") return <VenusAndMars size={15} color="#ffffff" />;
                                        return <VenusAndMars size={15} />;
                                    })()
                                }
                            />
                        </div>
                    ) : (
                        <div className="info-value flex items-center gap-1.5">
                            {form.gender === "Male" && <Mars size={16} color="#4aaaff" />}
                            {form.gender === "Female" && <Venus size={16} color="#ff6ec7" />}
                            {form.gender === "Other" && <VenusAndMars size={16} color="#ffffff" />}
                            {form.gender || "Unknown"}
                        </div>
                    )}
                </div>

                {/* Birthday */}
                {(form.birthday && form.birthday.month && form.birthday.day) && (
                    <div className="profile-info-row">
                        <div className="info-label">Birthday</div>
                        {isOwner && isEditing ? (
                            <div className="info-edit-wrapper">
                                <DateField
                                    id="profile-info-birthday"
                                    value={
                                        form.birthday && form.birthday.month && form.birthday.day
                                            ? `${String(form.birthday.month).padStart(2, "0")}-${String(form.birthday.day).padStart(2, "0")}-${String(form.birthday.year || 2000)}`
                                            : ""
                                    }
                                    onChange={(e) => {
                                        const val = e.target?.value || "";
                                        if (!val) {
                                            setForm({ ...form, birthday: null });
                                            return;
                                        }
                                        const parts = val.split(/[-/]/).map(Number);
                                        if (parts.length === 3) {
                                            let mo, d, y;
                                            if (parts[0] > 1000) {
                                                // YYYY-MM-DD
                                                [y, mo, d] = parts;
                                            } else {
                                                // MM-DD-YYYY
                                                [mo, d, y] = parts;
                                            }
                                            if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
                                                setForm({
                                                    ...form,
                                                    birthday: {
                                                        month: mo,
                                                        day: d,
                                                        ...(y ? { year: y } : {})
                                                    }
                                                });
                                            }
                                        }
                                    }}
                                    onClear={() => setForm({ ...form, birthday: null })}
                                    startIcon={<img src="/svgs/birthday_cake.svg" alt="Birthday" className="w-4 h-4 object-contain" />}
                                    size="sm"
                                    fullWidth
                                    clearable
                                />
                            </div>
                        ) : (
                            <div className="info-value flex items-center gap-1.5">
                                <img src="/svgs/birthday_cake.svg" alt="Birthday" className="w-4 h-4 object-contain" />
                                <span>{formatBirthday(form.birthday)}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Switch FC */}
                {(isEditing || form.switchFriendCode) && (
                    <div className="profile-info-row">
                        <div className="info-label">Switch Friend Code</div>
                        {isOwner && isEditing ? (
                            <div className="info-edit-wrapper">
                                <InputField
                                    id="profile-info-switch-fc"
                                    type="text"
                                    placeholder="SW-1234-5678-9012"
                                    value={form.switchFriendCode || ""}
                                    onChange={(e) => setForm({ ...form, switchFriendCode: formatSwitchFCInput(e.target.value) })}
                                    onPaste={(e) => {
                                        e.preventDefault();
                                        const text = (e.clipboardData || window.clipboardData).getData("text");
                                        setForm({ ...form, switchFriendCode: formatSwitchFCInput(text) });
                                    }}
                                    startIcon={<img src="/data/friend_code_icons/switch.png" alt="Switch" className="w-4 h-4 object-contain" />}
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={17}
                                    pattern="^SW-\d{4}-\d{4}-\d{4}$"
                                    title="Format: SW-1234-5678-9012"
                                    clearable
                                    onClear={() => setForm({ ...form, switchFriendCode: "" })}
                                    size="sm"
                                    fullWidth
                                />
                            </div>
                        ) : (
                            <div className="info-value text-gray-300 font-mono text-[0.85rem] flex items-center gap-1.5">
                                <img src="/data/friend_code_icons/switch.png" alt="Switch" className="w-4 h-4 object-contain" />
                                <span>{form.switchFriendCode}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* GO FC */}
                {(isEditing || form.goFriendCode) && (
                    <div className="profile-info-row">
                        <div className="info-label">GO Friend Code</div>
                        {isOwner && isEditing ? (
                            <div className="info-edit-wrapper">
                                <InputField
                                    id="profile-info-go-fc"
                                    type="text"
                                    placeholder="0000 0000 0000"
                                    value={form.goFriendCode || ""}
                                    onChange={(e) => setForm({ ...form, goFriendCode: formatGoFCInput(e.target.value) })}
                                    onPaste={(e) => {
                                        e.preventDefault();
                                        const text = (e.clipboardData || window.clipboardData).getData("text");
                                        setForm({ ...form, goFriendCode: formatGoFCInput(text) });
                                    }}
                                    startIcon={<img src="/data/friend_code_icons/go.png" alt="Pokémon GO" className="w-4 h-4 object-contain" />}
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={14}
                                    pattern="^\d{4} \d{4} \d{4}$"
                                    title="Format: 0000 0000 0000"
                                    clearable
                                    onClear={() => setForm({ ...form, goFriendCode: "" })}
                                    size="sm"
                                    fullWidth
                                />
                            </div>
                        ) : (
                            <div className="info-value text-gray-300 font-mono text-[0.85rem] flex items-center gap-1.5">
                                <img src="/data/friend_code_icons/go.png" alt="Pokémon GO" className="w-4 h-4 object-contain" />
                                <span>{form.goFriendCode}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* YouTube URL (Edit only - For Content Creators / Admins) */}
                {isOwner && isEditing && (isContentCreator || isAdmin) && (
                    <div className="profile-info-row">
                        <div className="info-label">YouTube</div>
                        <div className="info-edit-wrapper">
                            <InputField
                                id="profile-info-youtube"
                                type="text"
                                placeholder="@channel or URL"
                                value={form.youtubeUrl || ""}
                                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                                startIcon={<YoutubeIcon size={16} color="#ef4444" />}
                                clearable
                                onClear={() => setForm({ ...form, youtubeUrl: "" })}
                                size="sm"
                                fullWidth
                            />
                        </div>
                    </div>
                )}

                {/* Twitch URL (Edit only - For Content Creators / Admins) */}
                {isOwner && isEditing && (isContentCreator || isAdmin) && (
                    <div className="profile-info-row">
                        <div className="info-label">Twitch</div>
                        <div className="info-edit-wrapper">
                            <InputField
                                id="profile-info-twitch"
                                type="text"
                                placeholder="channel or URL"
                                value={form.twitchUrl || ""}
                                onChange={(e) => setForm({ ...form, twitchUrl: e.target.value })}
                                startIcon={<TwitchIcon size={16} color="#a855f7" />}
                                clearable
                                onClear={() => setForm({ ...form, twitchUrl: "" })}
                                size="sm"
                                fullWidth
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
