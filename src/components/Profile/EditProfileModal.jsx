import { useState, useEffect, useRef } from "react";
import {
    User, Globe, Mars, Venus, VenusAndMars,
    Youtube, Twitch, Gamepad2, Star, Sparkles,
    Crown, Palette, RotateCcw, Camera, PencilLine,
    CircleDot, Users, Check, ArrowUp, ArrowDown,
    Trash2, Plus, Video, Lock, ExternalLink
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Modal, ConfirmModal } from "../Shared/Modal";
import { Button } from "../Shared/Button";
import { InputField, TextAreaField, SelectField } from "../Shared/FormField";
import { useMessage } from "../Shared/MessageContext";
import { useUser } from "../Shared";
import FavoriteSelectionModal from "../Shared/FavoriteSelectionModal";
import AvatarUploadModal from "./AvatarUploadModal";
import CreatorRequestModal from "../Shared/CreatorRequestModal";
import { COUNTRY_OPTIONS } from "../../data/countries";
import { GAME_OPTIONS_TWO, BALL_OPTIONS_TWO, TRAINER_OPTIONS } from "../../Constants";
import { validateContent } from "../../../shared/contentFilter";
import { profileAPI } from "../../utils/api";
import {
    normalizeYoutubeUrl, normalizeTwitchUrl,
    extractYoutubeHandle, extractTwitchHandle,
    getUserAvatarUrl
} from "../../utils/profileUtils";
import { formatPokemonName } from "../../utils";
import "../../css/EditProfileModal.css";
import "flag-icons/css/flag-icons.min.css";

const SWITCH_FC_RE = /^SW-\d{4}-\d{4}-\d{4}$/;
const GO_FC_RE = /^\d{4} \d{4} \d{4}$/;

const GRADIENT_PRESETS = [
    { name: "Sunset", c1: "#f43f5e", c2: "#fbbf24" },
    { name: "Cyberpunk", c1: "#ec4899", c2: "#8b5cf6" },
    { name: "Ocean Wave", c1: "#06b6d4", c2: "#3b82f6" },
    { name: "Emerald", c1: "#10b981", c2: "#06b6d4" },
    { name: "Thunder", c1: "#eab308", c2: "#f97316" },
    { name: "Lavender", c1: "#a855f7", c2: "#38bdf8" },
    { name: "Cotton Candy", c1: "#f472b6", c2: "#38bdf8" },
    { name: "Ruby Fire", c1: "#ef4444", c2: "#f59e0b" },
];

const RANK_LABELS = ["1st", "2nd", "3rd", "4th", "5th"];

const ALL_FAVORITE_CATEGORIES = [
    { key: "pokemon", label: "Favorite Pokémon", icon: Sparkles, color: "text-amber-400" },
    { key: "games", label: "Favorite Games", icon: Gamepad2, color: "text-cyan-400" },
    { key: "balls", label: "Favorite Poké Balls", icon: CircleDot, color: "text-rose-400" },
    { key: "trainers", label: "Favorite Trainers", icon: Users, color: "text-indigo-400" },
];

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

const TABS = [
    { id: "info",       label: "General Info",  icon: <User size={14} /> },
    { id: "appearance", label: "Name Style",    icon: <Palette size={14} /> },
    { id: "favorites",  label: "Favorites",     icon: <Star size={14} /> },
    { id: "social",     label: "Social Links",  icon: <Globe size={14} /> },
];

export default function EditProfileModal({
    isOpen,
    onClose,
    username: propUsername,
    form: initialForm,
    setForm: setParentForm,
    setUser,
    isPremium,
    isAdmin,
    isContentCreator,
    creatorStatus = "none",
    onRequestCreator,
    POKEMON_OPTIONS: pokemonOptions = [],
    onSaved,
}) {
    const navigate = useNavigate();
    const { user } = useUser();
    const { showMessage } = useMessage();

    const [activeTab, setActiveTab] = useState("info");
    const [form, setForm] = useState(initialForm || {});
    const [isSaving, setIsSaving] = useState(false);
    const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
    const [pendingNavigateUrl, setPendingNavigateUrl] = useState(null);

    // Sub-modal states
    const [showGameModal, setShowGameModal]       = useState(false);
    const [showPokemonModal, setShowPokemonModal] = useState(false);
    const [showBallModal, setShowBallModal]       = useState(false);
    const [showTrainerModal, setShowTrainerModal] = useState(false);
    const [showAvatarModal, setShowAvatarModal]   = useState(false);
    const [showCreatorModal, setShowCreatorModal] = useState(false);

    const isMember = Boolean(isPremium);
    const maxFavoriteCategories = isMember ? 4 : 2;

    // Helper to derive default categories from existing data
    const getInitialCategories = (f) => {
        if (Array.isArray(f?.favoriteCategoryOrder)) {
            return f.favoriteCategoryOrder;
        }
        const detected = [];
        if (f?.favoritePokemon?.some(Boolean)) detected.push("pokemon");
        if (f?.favoriteGames?.some(Boolean)) detected.push("games");
        if (f?.favoriteBalls?.some(Boolean)) detected.push("balls");
        if (f?.favoriteTrainers?.some(Boolean)) detected.push("trainers");

        if (detected.length === 0) {
            return isMember ? ["pokemon", "games", "balls", "trainers"] : ["pokemon", "games"];
        }
        return detected;
    };

    // Reference to snapshot initial values to detect unsaved changes
    const initialSnapshotRef = useRef("");

    const getSnapshotString = (f) => JSON.stringify({
        bio: f?.bio || "",
        location: f?.location || "",
        gender: f?.gender || "",
        avatar: f?.avatar || null,
        pendingAvatarFile: Boolean(f?.pendingAvatarFile),
        pendingAvatarRemoved: Boolean(f?.pendingAvatarRemoved),
        nameColor1: f?.nameColor1 || null,
        nameColor2: f?.nameColor2 || null,
        favoriteGames: f?.favoriteGames || ["", "", "", "", ""],
        favoritePokemon: f?.favoritePokemon || ["", "", "", "", ""],
        favoritePokemonShiny: f?.favoritePokemonShiny || [false, false, false, false, false],
        favoriteBalls: f?.favoriteBalls || ["", "", "", "", ""],
        favoriteTrainers: f?.favoriteTrainers || ["", "", "", "", ""],
        favoriteCategoryOrder: f?.favoriteCategoryOrder || [],
        switchFriendCode: f?.switchFriendCode || "",
        goFriendCode: f?.goFriendCode || "",
        youtubeUrl: extractYoutubeHandle(f?.youtubeUrl || ""),
        twitchUrl: extractTwitchHandle(f?.twitchUrl || ""),
    });

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            const initialCats = getInitialCategories(initialForm);
            const formatted = {
                ...(initialForm || {}),
                favoriteCategoryOrder: initialCats,
                youtubeUrl: extractYoutubeHandle(initialForm?.youtubeUrl || ""),
                twitchUrl:  extractTwitchHandle(initialForm?.twitchUrl || ""),
            };
            setForm(formatted);
            initialSnapshotRef.current = getSnapshotString(formatted);
            setActiveTab("info");
            setShowUnsavedConfirm(false);
        }
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const displayName = propUsername || user?.username || form?.username || "Trainer Name";
    const hasGradient = Boolean(form.nameColor1 && form.nameColor2);

    // ── Check if form has unsaved changes ───────────────────────────
    const isFormDirty = () => {
        return getSnapshotString(form) !== initialSnapshotRef.current;
    };

    // Warn before page reload / close if there are unsaved changes
    useEffect(() => {
        if (!isOpen) return;

        const handleBeforeUnload = (e) => {
            if (isFormDirty()) {
                e.preventDefault();
                e.returnValue = "";
                return "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isOpen, form]);

    const handleRequestClose = () => {
        if (isSaving) return;
        if (isFormDirty()) {
            setPendingNavigateUrl(null);
            setShowUnsavedConfirm(true);
        } else {
            onClose();
        }
    };

    const handleNavigateMembership = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (isFormDirty()) {
            setPendingNavigateUrl("/membership");
            setShowUnsavedConfirm(true);
        } else {
            onClose();
            navigate("/membership");
        }
    };

    // ── Helpers ─────────────────────────────────────────────────────
    const reorderToFront = (arr, fill = "") => {
        const cleaned = (arr || []).filter(v => v !== null && v !== undefined && v !== "");
        return [...cleaned, ...Array(5 - cleaned.length).fill(fill)].slice(0, 5);
    };

    // ── Category Reorder / Add / Remove Handlers ────────────────────
    const activeCategories = form.favoriteCategoryOrder || [];

    const handleAddCategory = (catKey) => {
        if (activeCategories.length >= maxFavoriteCategories) {
            showMessage(`Free accounts can display up to 2 favorite categories. Upgrade to Membership to unlock all 4!`, "info");
            return;
        }
        if (activeCategories.includes(catKey)) return;
        setForm(prev => ({
            ...prev,
            favoriteCategoryOrder: [...(prev.favoriteCategoryOrder || []), catKey],
        }));
    };

    const handleRemoveCategory = (catKey) => {
        setForm(prev => ({
            ...prev,
            favoriteCategoryOrder: (prev.favoriteCategoryOrder || []).filter(k => k !== catKey),
        }));
    };

    const handleMoveCategory = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= activeCategories.length) return;
        const updated = [...activeCategories];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);
        setForm(prev => ({
            ...prev,
            favoriteCategoryOrder: updated,
        }));
    };

    // ── Save handler ────────────────────────────────────────────────
    const handleSave = async () => {
        const fc   = (form.switchFriendCode || "").toUpperCase().trim();
        const goFc = (form.goFriendCode || "").trim();

        if (fc && !SWITCH_FC_RE.test(fc)) {
            showMessage("Friend code must be formatted like: SW-1234-5678-9012", "error");
            setActiveTab("info");
            return;
        }
        if (goFc && !GO_FC_RE.test(goFc)) {
            showMessage("Pokémon GO Friend code must be formatted like: 0000 0000 0000", "error");
            setActiveTab("info");
            return;
        }
        const bioValidation = validateContent(String(form.bio || ""), "bio");
        if (!bioValidation.isValid) {
            showMessage(bioValidation.error, "error");
            setActiveTab("info");
            return;
        }

        const finalYoutube = normalizeYoutubeUrl(form.youtubeUrl);
        const finalTwitch  = normalizeTwitchUrl(form.twitchUrl);
        const reorderedGames    = reorderToFront(form.favoriteGames);
        const reorderedBalls    = reorderToFront(form.favoriteBalls);
        const reorderedTrainers = reorderToFront(form.favoriteTrainers);

        const pairedPokemon = (form.favoritePokemon || [])
            .map((poke, idx) => ({ poke: poke || "", shiny: Boolean(form.favoritePokemonShiny?.[idx]) }))
            .filter(item => item.poke.trim() !== "");
        while (pairedPokemon.length < 5) pairedPokemon.push({ poke: "", shiny: false });
        const reorderedPokemon = pairedPokemon.map(p => p.poke).slice(0, 5);
        const reorderedShiny   = pairedPokemon.map(p => p.shiny).slice(0, 5);

        // Limit categories based on membership status
        const allowedCats = activeCategories.slice(0, maxFavoriteCategories);

        setIsSaving(true);
        try {
            // Handle avatar changes
            let finalAvatar = form.avatar;
            if (form.pendingAvatarFile) {
                const uploadRes = await profileAPI.uploadAvatar(form.pendingAvatarFile);
                finalAvatar = uploadRes.avatar;
                if (setUser) setUser(prev => ({ ...prev, avatar: finalAvatar }));
            } else if (form.pendingAvatarRemoved) {
                await profileAPI.removeAvatar();
                finalAvatar = null;
                if (setUser) setUser(prev => ({ ...prev, avatar: null }));
            }

            await profileAPI.updateProfile({
                bio:              form.bio,
                location:         form.location,
                gender:           form.gender,
                avatar:           finalAvatar,
                nameColor1:       isMember ? (form.nameColor1 || null) : null,
                nameColor2:       isMember ? (form.nameColor2 || null) : null,
                nameGradientColor1: isMember ? (form.nameColor1 || null) : null,
                nameGradientColor2: isMember ? (form.nameColor2 || null) : null,
                favoriteGames:    reorderedGames,
                favoritePokemon:  reorderedPokemon,
                favoritePokemonShiny: reorderedShiny,
                favoriteBalls:    reorderedBalls,
                favoriteTrainers: reorderedTrainers,
                favoriteCategoryOrder: allowedCats,
                switchFriendCode: fc,
                goFriendCode:     goFc,
                youtubeUrl:       finalYoutube,
                twitchUrl:        finalTwitch,
            });

            // Update parent form state so page reflects changes immediately
            const savedForm = {
                ...form,
                avatar:           finalAvatar,
                pendingAvatarFile: null,
                pendingAvatarRemoved: false,
                nameColor1:       isMember ? (form.nameColor1 || null) : null,
                nameColor2:       isMember ? (form.nameColor2 || null) : null,
                favoriteGames:    reorderedGames,
                favoritePokemon:  reorderedPokemon,
                favoritePokemonShiny: reorderedShiny,
                favoriteBalls:    reorderedBalls,
                favoriteTrainers: reorderedTrainers,
                favoriteCategoryOrder: allowedCats,
                switchFriendCode: fc,
                goFriendCode:     goFc,
                youtubeUrl:       extractYoutubeHandle(finalYoutube),
                twitchUrl:        extractTwitchHandle(finalTwitch),
            };

            if (setParentForm) setParentForm(savedForm);
            if (setUser) setUser(prev => ({ ...prev, avatar: finalAvatar !== undefined ? finalAvatar : prev.avatar }));

            showMessage("Profile changes saved successfully", "success");
            if (onSaved) onSaved();
            onClose();
        } catch (err) {
            console.error("Failed to update profile:", err);
            showMessage(err.userMessage || err.message || "Failed to update profile", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // ── Sub-modal handlers ──────────────────────────────────────────
    const handleSaveGames = (newGames) => {
        const updated = Array.from({ length: 5 }, (_, i) => newGames[i] || "");
        setForm(prev => ({ ...prev, favoriteGames: updated }));
        setShowGameModal(false);
    };
    const handleSavePokemon = (newPokemon, newShiny) => {
        const updatedPoke  = Array.from({ length: 5 }, (_, i) => newPokemon[i] || "");
        const updatedShiny = Array.from({ length: 5 }, (_, i) => Boolean(newShiny?.[i]));
        setForm(prev => ({ ...prev, favoritePokemon: updatedPoke, favoritePokemonShiny: updatedShiny }));
        setShowPokemonModal(false);
    };
    const handleSaveBalls = (newBalls) => {
        const updated = Array.from({ length: 5 }, (_, i) => newBalls[i] || "");
        setForm(prev => ({ ...prev, favoriteBalls: updated }));
        setShowBallModal(false);
    };
    const handleSaveFavTrainers = (newTrainers) => {
        const updated = Array.from({ length: 5 }, (_, i) => newTrainers[i] || "");
        setForm(prev => ({ ...prev, favoriteTrainers: updated }));
        setShowTrainerModal(false);
    };

    const selectedCountry = COUNTRY_OPTIONS.find(c => c.name === form.location);

    // ── Profile Info tab ────────────────────────────────────────────
    const renderInfoTab = () => (
        <div className="epm-panel" role="tabpanel">
            {/* Avatar header card */}
            <div className="epm-avatar-card">
                <div className="epm-avatar-preview-wrap">
                    <button
                        className="epm-avatar-btn"
                        onClick={() => setShowAvatarModal(true)}
                        type="button"
                        aria-label="Change profile picture"
                        title="Change profile picture"
                    >
                        <img
                            src={getUserAvatarUrl(form.avatar ? { avatar: form.avatar } : form)}
                            alt="Profile Avatar"
                            className="epm-avatar-img"
                        />
                        <span className="epm-avatar-overlay">
                            <Camera size={18} />
                            <span>Change</span>
                        </span>
                    </button>
                </div>
                <div className="epm-avatar-details">
                    <div className="epm-avatar-title">Profile Picture</div>
                    <p className="epm-avatar-desc">
                        Upload custom image, animated GIF (Members), or choose a Pokémon icon.
                    </p>
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={<Camera size={14} />}
                        onClick={() => setShowAvatarModal(true)}
                        className="epm-avatar-action-btn"
                    >
                        Change Avatar
                    </Button>
                </div>
            </div>

            {/* Bio textarea */}
            <TextAreaField
                id="epm-bio"
                label="Bio"
                value={form.bio || ""}
                onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell other trainers about yourself and your collection goals..."
                maxLength={250}
                showCount
                resize="none"
                rows={3}
                fullWidth
            />

            {/* Two-column: Location & Gender */}
            <div className="epm-row-2">
                <SelectField
                    id="epm-location"
                    label="Location / Country"
                    options={COUNTRY_OPTIONS.map(country => ({
                        label: country.name,
                        value: country.name,
                        icon: <span className={`fi fi-${country.code.toLowerCase()}`} />,
                    }))}
                    value={form.location || ""}
                    onChange={(value) => setForm(prev => ({ ...prev, location: value }))}
                    placeholder="Select country"
                    searchable
                    searchPlaceholder="Search country..."
                    clearable
                    size="md"
                    fullWidth
                    startIcon={
                        selectedCountry
                            ? <span className={`fi fi-${selectedCountry.code.toLowerCase()}`} />
                            : <Globe size={16} />
                    }
                />
                <SelectField
                    id="epm-gender"
                    label="Gender"
                    options={[
                        { label: "Male",   value: "Male",   icon: <Mars size={18} color="#4aaaff" /> },
                        { label: "Female", value: "Female", icon: <Venus size={18} color="#ff6ec7" /> },
                        { label: "Other",  value: "Other",  icon: <VenusAndMars size={18} color="#ffffff" /> },
                    ]}
                    value={form.gender || ""}
                    onChange={(value) => setForm(prev => ({ ...prev, gender: value }))}
                    placeholder="Select gender"
                    clearable
                    size="md"
                    fullWidth
                    startIcon={
                        form.gender === "Male"   ? <Mars size={16} color="#4aaaff" /> :
                        form.gender === "Female" ? <Venus size={16} color="#ff6ec7" /> :
                        <VenusAndMars size={16} />
                    }
                />
            </div>

            {/* Friend Codes */}
            <div className="epm-section-header">
                <span className="epm-section-title">Friend Codes</span>
            </div>
            <div className="epm-row-2">
                <InputField
                    id="epm-switch-fc"
                    label="Nintendo Switch Friend Code"
                    type="text"
                    placeholder="SW-1234-5678-9012"
                    value={form.switchFriendCode || ""}
                    onChange={(e) => setForm(prev => ({ ...prev, switchFriendCode: formatSwitchFCInput(e.target.value) }))}
                    onPaste={(e) => {
                        e.preventDefault();
                        const text = (e.clipboardData || window.clipboardData).getData("text");
                        setForm(prev => ({ ...prev, switchFriendCode: formatSwitchFCInput(text) }));
                    }}
                    startIcon={<img src="/data/friend_code_icons/switch.png" alt="" style={{ width: 17, height: 17, objectFit: "contain" }} />}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={17}
                    clearable
                    onClear={() => setForm(prev => ({ ...prev, switchFriendCode: "" }))}
                    size="md"
                    fullWidth
                />
                <InputField
                    id="epm-go-fc"
                    label="Pokémon GO Friend Code"
                    type="text"
                    placeholder="0000 0000 0000"
                    value={form.goFriendCode || ""}
                    onChange={(e) => setForm(prev => ({ ...prev, goFriendCode: formatGoFCInput(e.target.value) }))}
                    onPaste={(e) => {
                        e.preventDefault();
                        const text = (e.clipboardData || window.clipboardData).getData("text");
                        setForm(prev => ({ ...prev, goFriendCode: formatGoFCInput(text) }));
                    }}
                    startIcon={<img src="/data/friend_code_icons/go.png" alt="" style={{ width: 17, height: 17, objectFit: "contain" }} />}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={14}
                    clearable
                    onClear={() => setForm(prev => ({ ...prev, goFriendCode: "" }))}
                    size="md"
                    fullWidth
                />
            </div>
        </div>
    );

    // ── Appearance / Name Style tab ─────────────────────────────────
    const renderAppearanceTab = () => (
        <div className="epm-panel" role="tabpanel">
            <div className="epm-section-header between">
                <div className="flex items-center gap-2">
                    <span className="epm-section-title">Animated Gradient Username</span>
                    <span className="epm-member-badge">
                        <Crown size={11} /> MEMBER
                    </span>
                </div>
            </div>

            {/* Live Interactive Preview Box */}
            <div className="epm-gradient-preview-card">
                <span className="epm-preview-card-tag">Live Preview</span>
                <div className="epm-gradient-preview-display">
                    {hasGradient ? (
                        <span
                            className="animated-gradient-username-wrapper"
                            style={{
                                "--grad-c1": form.nameColor1,
                                "--grad-c2": form.nameColor2,
                            }}
                        >
                            <span className="animated-gradient-username epm-gradient-preview-text">
                                {displayName}
                            </span>
                        </span>
                    ) : (
                        <span className="epm-gradient-preview-plain">
                            {displayName}
                        </span>
                    )}
                </div>
                <p className="epm-gradient-preview-sub">
                    {hasGradient
                        ? "Gradient and glow will be applied to your profile and across the site"
                        : "No gradient active — default text color"}
                </p>
            </div>

            {isMember ? (
                <div className="epm-gradient-controls">
                    {/* Custom Color Pickers */}
                    <div className="epm-gradient-inputs-grid">
                        <div className="epm-color-picker-box">
                            <span className="epm-color-picker-label">Start Color</span>
                            <label className="epm-color-swatch-btn">
                                <span className="epm-color-dot" style={{ backgroundColor: form.nameColor1 || "#ec4899" }} />
                                <span className="epm-color-hex">{form.nameColor1 || "#ec4899"}</span>
                                <input
                                    type="color"
                                    className="sr-only"
                                    value={form.nameColor1 || "#ec4899"}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setForm(prev => ({ ...prev, nameColor1: val, nameColor2: prev.nameColor2 || "#8b5cf6" }));
                                    }}
                                />
                            </label>
                        </div>
                        <div className="epm-color-picker-box">
                            <span className="epm-color-picker-label">End Color</span>
                            <label className="epm-color-swatch-btn">
                                <span className="epm-color-dot" style={{ backgroundColor: form.nameColor2 || "#8b5cf6" }} />
                                <span className="epm-color-hex">{form.nameColor2 || "#8b5cf6"}</span>
                                <input
                                    type="color"
                                    className="sr-only"
                                    value={form.nameColor2 || "#8b5cf6"}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setForm(prev => ({ ...prev, nameColor1: prev.nameColor1 || "#ec4899", nameColor2: val }));
                                    }}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Presets */}
                    <div className="epm-presets-section">
                        <span className="epm-presets-title">Curated Presets</span>
                        <div className="epm-presets-grid">
                            {GRADIENT_PRESETS.map((preset) => {
                                const isSelected = form.nameColor1?.toLowerCase() === preset.c1.toLowerCase() &&
                                                   form.nameColor2?.toLowerCase() === preset.c2.toLowerCase();
                                return (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, nameColor1: preset.c1, nameColor2: preset.c2 }))}
                                        className={`epm-preset-chip ${isSelected ? "selected" : ""}`}
                                        title={`${preset.name} (${preset.c1} → ${preset.c2})`}
                                    >
                                        <span className="epm-preset-dot" style={{ background: `linear-gradient(135deg, ${preset.c1}, ${preset.c2})` }} />
                                        <span>{preset.name}</span>
                                        {isSelected && <Check size={12} className="shrink-0" style={{ color: "var(--accent)" }} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {hasGradient && (
                        <button
                            type="button"
                            className="epm-reset-gradient-btn"
                            onClick={() => setForm(prev => ({ ...prev, nameColor1: null, nameColor2: null }))}
                        >
                            <RotateCcw size={13} />
                            <span>Remove Gradient</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="epm-locked-card">
                    <div className="epm-locked-icon-wrap">
                        <Crown size={24} />
                    </div>
                    <div className="epm-locked-content">
                        <div className="epm-locked-title">Ultimate Member Exclusive</div>
                        <p className="epm-locked-desc">
                            Stand out across the site with a vibrant 2-color animated gradient for your username.
                        </p>
                        <Button
                            variant="primary"
                            size="sm"
                            icon={<Crown size={14} />}
                            onClick={handleNavigateMembership}
                            className="epm-unlock-btn"
                        >
                            Unlock with Membership
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );

    // ── Favorites tab ───────────────────────────────────────────────
    const renderFavoritesTab = () => {
        const unusedCategories = ALL_FAVORITE_CATEGORIES.filter(c => !activeCategories.includes(c.key));

        const getCategoryConfig = (key) => {
            switch (key) {
                case "pokemon":
                    return {
                        title: "Favorite Pokémon",
                        icon: <Sparkles size={16} className="text-amber-400" />,
                        onEdit: () => setShowPokemonModal(true),
                        items: form.favoritePokemon,
                        emptyIcon: Sparkles,
                        getDetails: (pokeValue, idx) => {
                            if (!pokeValue) return { image: null, name: null, isShiny: false };
                            const found = pokemonOptions.find(p => p.value === pokeValue);
                            const isShiny = Boolean(form.favoritePokemonShiny?.[idx]);
                            return {
                                image: found ? (isShiny ? found.shinyImage : found.image) : null,
                                name: found ? formatPokemonName(found.value) : pokeValue,
                                isShiny,
                            };
                        }
                    };
                case "games":
                    return {
                        title: "Favorite Games",
                        icon: <Gamepad2 size={16} className="text-cyan-400" />,
                        onEdit: () => setShowGameModal(true),
                        items: form.favoriteGames,
                        emptyIcon: Gamepad2,
                        getDetails: (gameValue) => {
                            if (!gameValue) return { image: null, name: null };
                            const found = GAME_OPTIONS_TWO.find(g => g.value === gameValue);
                            return {
                                image: found?.image || null,
                                name: found?.name || gameValue,
                            };
                        }
                    };
                case "balls":
                    return {
                        title: "Favorite Poké Balls",
                        icon: <CircleDot size={16} className="text-rose-400" />,
                        onEdit: () => setShowBallModal(true),
                        items: form.favoriteBalls,
                        emptyIcon: CircleDot,
                        getDetails: (ballValue) => {
                            if (!ballValue) return { image: null, name: null };
                            const found = BALL_OPTIONS_TWO.find(b => b.value === ballValue);
                            return {
                                image: found?.image || null,
                                name: found?.name || ballValue,
                            };
                        }
                    };
                case "trainers":
                    return {
                        title: "Favorite Trainers",
                        icon: <Users size={16} className="text-indigo-400" />,
                        onEdit: () => setShowTrainerModal(true),
                        items: form.favoriteTrainers,
                        emptyIcon: Users,
                        getDetails: (trainerValue) => {
                            if (!trainerValue) return { image: null, name: null };
                            const found = TRAINER_OPTIONS.find(t => t.value === trainerValue);
                            return {
                                image: found?.image || null,
                                name: found?.name || trainerValue,
                            };
                        }
                    };
                default:
                    return null;
            }
        };

        return (
            <div className="epm-panel" role="tabpanel">
                {/* Header bar with counter and membership status */}
                <div className="epm-favorites-header-bar">
                    <div className="epm-favorites-header-info">
                        <span className="epm-favorites-title">Featured Categories</span>
                        <span className="epm-favorites-badge">
                            {activeCategories.length} / {maxFavoriteCategories} Active
                        </span>
                        {!isMember && (
                            <span className="epm-favorites-limit-hint">
                                (2 Free / 4 Member)
                            </span>
                        )}
                    </div>
                </div>

                <p className="epm-favorites-intro">
                    Customize which favorite categories appear on your profile card and in what order.
                </p>

                {/* List of active category cards */}
                <div className="epm-favorites-cards-list">
                    {activeCategories.map((catKey, index) => {
                        const config = getCategoryConfig(catKey);
                        if (!config) return null;
                        const { title, icon, onEdit, items, emptyIcon: EmptyIcon, getDetails } = config;

                        return (
                            <div key={catKey} className="epm-favorite-category-card">
                                <div className="epm-favorite-category-header">
                                    <div className="epm-favorite-category-title-wrap">
                                        {icon}
                                        <span className="epm-favorite-category-title">{title}</span>
                                    </div>

                                    <div className="epm-favorite-category-actions">
                                        {/* Order controls */}
                                        <div className="epm-order-btns-group">
                                            <button
                                                type="button"
                                                className="epm-order-btn"
                                                disabled={index === 0}
                                                onClick={() => handleMoveCategory(index, -1)}
                                                title="Move category up"
                                                aria-label="Move category up"
                                            >
                                                <ArrowUp size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                className="epm-order-btn"
                                                disabled={index === activeCategories.length - 1}
                                                onClick={() => handleMoveCategory(index, 1)}
                                                title="Move category down"
                                                aria-label="Move category down"
                                            >
                                                <ArrowDown size={13} />
                                            </button>
                                        </div>

                                        {/* Remove category button */}
                                        <button
                                            type="button"
                                            className="epm-remove-cat-btn"
                                            onClick={() => handleRemoveCategory(catKey)}
                                            title="Remove category from profile"
                                            aria-label="Remove category"
                                        >
                                            <Trash2 size={13} />
                                        </button>

                                        {/* Edit Top 5 button (the only edit trigger) */}
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            icon={<PencilLine size={13} />}
                                            onClick={onEdit}
                                            className="epm-category-edit-btn"
                                        >
                                            Edit Top 5
                                        </Button>
                                    </div>
                                </div>

                                {/* Read-only display slots (not clickable) */}
                                <div className="epm-favorite-slots-row">
                                    {Array.from({ length: 5 }).map((_, slotIdx) => {
                                        const { image, name, isShiny } = getDetails(items?.[slotIdx], slotIdx);
                                        const isFilled = Boolean(image || name);

                                        return (
                                            <div
                                                key={slotIdx}
                                                className={`epm-favorite-slot-item ${isFilled ? "filled" : "empty"}`}
                                            >
                                                <div className="epm-favorite-slot-box read-only">
                                                    <span className="epm-slot-rank-badge">{RANK_LABELS[slotIdx]}</span>
                                                    {isFilled ? (
                                                        <>
                                                            <img src={image} alt={name || ""} className="epm-slot-img" />
                                                            {isShiny && (
                                                                <span className="epm-slot-shiny-sparkle" title="Shiny variant">
                                                                    <Sparkles size={11} />
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="epm-slot-placeholder">
                                                            <EmptyIcon size={18} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Add Category Section */}
                {activeCategories.length < maxFavoriteCategories && unusedCategories.length > 0 && (
                    <div className="epm-add-category-box">
                        <span className="epm-add-category-label">Add a Favorite Category:</span>
                        <div className="epm-add-category-btns">
                            {unusedCategories.map(cat => {
                                const IconComp = cat.icon;
                                return (
                                    <button
                                        key={cat.key}
                                        type="button"
                                        className="epm-add-cat-chip"
                                        onClick={() => handleAddCategory(cat.key)}
                                    >
                                        <Plus size={13} />
                                        <IconComp size={14} className={cat.color} />
                                        <span>{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Non-member unlock prompt for 3rd & 4th categories */}
                {!isMember && activeCategories.length >= 2 && (
                    <div className="epm-categories-member-unlock-card">
                        <div className="flex items-center gap-2">
                            <Crown size={16} className="text-amber-400 shrink-0" />
                            <span className="epm-unlock-card-text">
                                Want to show all 4 favorite categories (Pokémon, Games, Poké Balls & Trainers)?
                            </span>
                        </div>
                        <button
                            type="button"
                            className="epm-unlock-card-link"
                            onClick={handleNavigateMembership}
                        >
                            Unlock with Membership
                            <ExternalLink size={11} />
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // ── Social Links tab ────────────────────────────────────────────
    const renderSocialTab = () => (
        <div className="epm-panel" role="tabpanel">
            {!isContentCreator && (
                <div className="epm-social-creator-card">
                    <div className="epm-social-creator-header">
                        <span className="epm-social-creator-badge">Content Creator Feature</span>
                        {creatorStatus === "pending" ? (
                            <span className="epm-creator-status-tag pending">Application Pending</span>
                        ) : null}
                    </div>
                    <p className="epm-social-creator-text">
                        Social links are prominently displayed on your public profile card once approved for Content Creator status.
                    </p>
                </div>
            )}

            <div className="epm-social-fields">
                <InputField
                    id="epm-youtube"
                    label="YouTube Channel"
                    type="text"
                    placeholder="https://youtube.com/@YourChannel"
                    value={form.youtubeUrl || ""}
                    onChange={(e) => setForm(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                    startIcon={<Youtube size={17} color="#ef4444" />}
                    clearable
                    onClear={() => setForm(prev => ({ ...prev, youtubeUrl: "" }))}
                    size="md"
                    fullWidth
                    disabled={!isContentCreator}
                    helperText={isContentCreator ? "Channel URL or @handle" : "Requires Content Creator status"}
                />

                <InputField
                    id="epm-twitch"
                    label="Twitch Channel"
                    type="text"
                    placeholder="https://twitch.tv/YourChannel"
                    value={form.twitchUrl || ""}
                    onChange={(e) => setForm(prev => ({ ...prev, twitchUrl: e.target.value }))}
                    startIcon={<Twitch size={17} color="#a855f7" />}
                    clearable
                    onClear={() => setForm(prev => ({ ...prev, twitchUrl: "" }))}
                    size="md"
                    fullWidth
                    disabled={!isContentCreator}
                    helperText={isContentCreator ? "Channel URL or username" : "Requires Content Creator status"}
                />

                {/* Creator Request Button for Non-Creators */}
                {!isContentCreator && (
                    <div className="epm-request-creator-cta">
                        <div className="epm-request-creator-info">
                            <span className="epm-request-creator-title">Are you a Streamer or Creator?</span>
                            <span className="epm-request-creator-desc">
                                Apply for Content Creator status to link your YouTube & Twitch channels on your profile.
                            </span>
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            icon={<Video size={14} />}
                            onClick={() => setShowCreatorModal(true)}
                            disabled={creatorStatus === "pending"}
                        >
                            {creatorStatus === "pending" ? "Request Submitted" : "Request Creator Status"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );

    // ── Main Render ─────────────────────────────────────────────────
    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={handleRequestClose}
                title="Edit Profile"
                subtitle="Manage your public trainer identity, appearance, and collection highlights"
                icon={<PencilLine size={18} />}
                size="md"
                showCloseButton
                closeOnBackdrop={false}
                closeOnEscape={!isSaving}
                closeButtonDisabled={isSaving}
                footer={
                    <>
                        <Button variant="secondary" onClick={handleRequestClose} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave} loading={isSaving} disabled={isSaving}>
                            Save Changes
                        </Button>
                    </>
                }
            >
                {/* Clean Tab Navigation Bar */}
                <div className="epm-tabs-nav" role="tablist">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            className={`epm-nav-tab ${activeTab === tab.id ? "active" : ""}`}
                            onClick={() => setActiveTab(tab.id)}
                            type="button"
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {activeTab === "info"       && renderInfoTab()}
                {activeTab === "appearance" && renderAppearanceTab()}
                {activeTab === "favorites"  && renderFavoritesTab()}
                {activeTab === "social"     && renderSocialTab()}
            </Modal>

            {/* Unsaved Changes Confirmation Modal */}
            <ConfirmModal
                isOpen={showUnsavedConfirm}
                onClose={() => {
                    setShowUnsavedConfirm(false);
                    setPendingNavigateUrl(null);
                }}
                onConfirm={() => {
                    setShowUnsavedConfirm(false);
                    onClose();
                    if (pendingNavigateUrl) {
                        navigate(pendingNavigateUrl);
                        setPendingNavigateUrl(null);
                    }
                }}
                title="Discard Unsaved Changes?"
                subtitle="You have made edits that have not been saved yet."
                message="Are you sure you want to discard your changes and leave the profile editor?"
                confirmText="Discard Changes"
                cancelText="Keep Editing"
                variant="warning"
                confirmDelayMs={0}
            />

            {/* Sub-modals for selection */}
            <AvatarUploadModal
                isOpen={showAvatarModal}
                onClose={() => setShowAvatarModal(false)}
                currentAvatar={form.avatar}
                onApplyAvatar={({ file, previewUrl }) => {
                    setForm(prev => ({ ...prev, avatar: previewUrl, pendingAvatarFile: file, pendingAvatarRemoved: false }));
                    setShowAvatarModal(false);
                }}
                onRemoveAvatar={() => {
                    setForm(prev => ({ ...prev, avatar: null, pendingAvatarFile: null, pendingAvatarRemoved: true }));
                    setShowAvatarModal(false);
                }}
            />

            <FavoriteSelectionModal
                isOpen={showGameModal}
                onClose={() => setShowGameModal(false)}
                title="Select Favorite Games"
                options={GAME_OPTIONS_TWO}
                selected={form.favoriteGames || []}
                onChange={handleSaveGames}
                max={5}
            />

            <FavoriteSelectionModal
                isOpen={showPokemonModal}
                onClose={() => setShowPokemonModal(false)}
                title="Select Favorite Pokémon"
                options={pokemonOptions}
                selected={form.favoritePokemon || []}
                selectedShiny={form.favoritePokemonShiny || []}
                onChange={handleSavePokemon}
                max={5}
            />

            <FavoriteSelectionModal
                isOpen={showBallModal}
                onClose={() => setShowBallModal(false)}
                title="Select Favorite Poké Balls"
                options={BALL_OPTIONS_TWO}
                selected={form.favoriteBalls || []}
                onChange={handleSaveBalls}
                max={5}
            />

            <FavoriteSelectionModal
                isOpen={showTrainerModal}
                onClose={() => setShowTrainerModal(false)}
                title="Select Favorite Trainers"
                options={TRAINER_OPTIONS}
                selected={form.favoriteTrainers || []}
                onChange={handleSaveFavTrainers}
                max={5}
            />

            <CreatorRequestModal
                isOpen={showCreatorModal}
                onClose={() => setShowCreatorModal(false)}
                onSubmitted={() => {
                    setShowCreatorModal(false);
                    onRequestCreator?.();
                }}
            />
        </>
    );
}
