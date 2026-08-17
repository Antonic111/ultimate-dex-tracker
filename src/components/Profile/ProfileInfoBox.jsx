import React from 'react';
import { Mars, Venus, VenusAndMars, User } from "lucide-react";
import { SearchbarIconDropdown } from "../Shared/SearchBar";
import { COUNTRY_OPTIONS } from "../../data/countries";
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

export default function ProfileInfoBox({ isOwner, isEditing, form, setForm }) {
    return (
        <div className="profile-info-box-container">
            <h3 className="profile-section-title">
                <User size={18} className="text-gray-400" /> PROFILE INFO
            </h3>
            <div className="profile-info-grid">
                
                {/* Location */}
                <div className="profile-info-row">
                    <div className="info-label">Location</div>
                    {isOwner && isEditing ? (
                        <div className="info-edit-wrapper">
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
                        </div>
                    ) : (
                        <div className="info-value flex items-center gap-1.5">
                            {form.gender === "Male" && <Mars size={16} color="#4aaaff" />}
                            {form.gender === "Female" && <Venus size={16} color="#ff6ec7" />}
                            {form.gender === "Other" && <VenusAndMars size={16} color="#ffffff" />}
                            {form.gender === "Other" ? "Female" : (form.gender || "Unknown")}
                        </div>
                    )}
                </div>

                {/* Switch FC */}
                {(isEditing || form.switchFriendCode) && (
                    <div className="profile-info-row">
                        <div className="info-label">Switch Friend Code</div>
                        {isOwner && isEditing ? (
                            <div className="info-edit-wrapper">
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
                                    className="profile-inline-input"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={17}
                                    pattern="^SW-\d{4}-\d{4}-\d{4}$"
                                    title="Format: SW-1234-5678-9012"
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
                                    className="profile-inline-input"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={14}
                                    pattern="^\d{4} \d{4} \d{4}$"
                                    title="Format: 0000 0000 0000"
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
            </div>
        </div>
    );
}
