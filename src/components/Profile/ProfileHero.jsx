import React from 'react';
import { LinkIcon, Heart, Crown, Video, Clock, Camera, NotebookPen, SquareX, ArrowLeft } from "lucide-react";
import { YoutubeIcon, TwitchIcon } from "../Shared/SocialIcons";
import { profileAPI } from "../../utils/api";
import { useMessage } from "../Shared/MessageContext";
import { useLoading } from "../Shared/LoadingContext";
import { validateContent } from "../../../shared/contentFilter";
import { getTimeAgo, normalizeYoutubeUrl, normalizeTwitchUrl, extractYoutubeHandle, extractTwitchHandle, getUserAvatarUrl } from "../../utils/profileUtils";
import { useNavigate } from 'react-router-dom';
import { Button } from "../Shared/Button";
import { TextAreaField } from "../Shared/FormField";

const SWITCH_FC_RE = /^SW-\d{4}-\d{4}-\d{4}$/;
const GO_FC_RE = /^\d{4} \d{4} \d{4}$/;

export default function ProfileHero({
    username, createdAt, isOwner, isEditing, isAdmin, isContentCreator,
    form, setForm, likeCount, hasLiked, likeLoading, likeBurst,
    setLikeCount, setHasLiked, setLikeLoading, setLikeBurst,
    creatorStatus, setShowCreatorModal, setIsEditing, formBeforeEditRef, setUser, currentUsername,
    setShowTrainerModal, isOnline = true
}) {
    const { showMessage } = useMessage();
    const { setLoading, isLoading } = useLoading();
    const navigate = useNavigate();

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/u/${encodeURIComponent(username)}`;
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(url);
                showMessage("Share link copied", "success");
                return;
            } catch (err) { }
        }
        try {
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) showMessage("Share link copied", "success");
            else throw new Error("execCommand failed");
        } catch (err) {
            showMessage("Couldn't copy link", "error");
        }
    };

    const handleLike = async () => {
        if (likeLoading || !currentUsername) return; // Prevent liking if not logged in
        setLikeLoading(true);

        const wasLiked = hasLiked;
        const previousCount = likeCount;

        setHasLiked(!wasLiked);
        setLikeCount(wasLiked ? previousCount - 1 : previousCount + 1);
        if (!wasLiked) setLikeBurst((n) => n + 1);

        try {
            const { hasLiked: liked, likeCount: newCount } = await profileAPI.toggleProfileLike(username);
            setHasLiked(liked);
            setLikeCount(newCount);
            showMessage(liked ? "Profile liked!" : "Like removed", "success");
        } catch (error) {
            setHasLiked(wasLiked);
            setLikeCount(previousCount);
            showMessage("Failed to update like", "error");
        } finally {
            setLikeLoading(false);
        }
    };

    const handleSave = async () => {
        if (!isEditing) {
            formBeforeEditRef.current = JSON.parse(JSON.stringify(form));
            setForm((prev) => ({
                ...prev,
                youtubeUrl: extractYoutubeHandle(prev.youtubeUrl),
                twitchUrl: extractTwitchHandle(prev.twitchUrl),
            }));
            setIsEditing(true);
            return;
        }

        const fc = (form.switchFriendCode || "").toUpperCase().trim();
        if (fc && !SWITCH_FC_RE.test(fc)) {
            showMessage("Friend code must be like: SW-1234-5678-9012", "error");
            return;
        }

        const goFc = (form.goFriendCode || "").trim();
        if (goFc && !GO_FC_RE.test(goFc)) {
            showMessage("Pokémon GO Friend code must be like: 0000 0000 0000", "error");
            return;
        }

        let finalYoutube = normalizeYoutubeUrl(form.youtubeUrl);
        let finalTwitch = normalizeTwitchUrl(form.twitchUrl);

        const reorderToFront = (arr, fill) => {
            const cleaned = (arr || []).filter((v) => v !== null && v !== undefined && v !== "");
            return [...cleaned, ...Array(5 - cleaned.length).fill(fill)].slice(0, 5);
        };
        const reorderedGames = reorderToFront(form.favoriteGames, "");

        const pairedPokemon = (form.favoritePokemon || [])
            .map((poke, idx) => ({ poke: poke || "", shiny: Boolean(form.favoritePokemonShiny?.[idx]) }))
            .filter(item => item.poke.trim() !== "");
        while (pairedPokemon.length < 5) pairedPokemon.push({ poke: "", shiny: false });

        const reorderedPokemon = pairedPokemon.map(p => p.poke).slice(0, 5);
        const reorderedShiny = pairedPokemon.map(p => p.shiny).slice(0, 5);

        try {
            const bioValidation = validateContent(String(form.bio || ''), 'bio');
            if (!bioValidation.isValid) {
                showMessage(`${bioValidation.error}`, 'error');
                return;
            }
            setLoading('save-profile', true);

            // Handle pending avatar upload or removal
            let finalAvatar = form.avatar;
            if (form.pendingAvatarFile) {
                const uploadRes = await profileAPI.uploadAvatar(form.pendingAvatarFile);
                finalAvatar = uploadRes.avatar;
                if (setUser) {
                    setUser((prev) => ({ ...prev, avatar: finalAvatar }));
                }
            } else if (form.pendingAvatarRemoved) {
                await profileAPI.removeAvatar();
                finalAvatar = null;
                if (setUser) {
                    setUser((prev) => ({ ...prev, avatar: null }));
                }
            }

            await profileAPI.updateProfile({
                bio: form.bio, location: form.location, gender: form.gender, profileTrainer: form.profileTrainer,
                avatar: finalAvatar,
                favoriteGames: reorderedGames, favoritePokemon: reorderedPokemon, favoritePokemonShiny: reorderedShiny,
                switchFriendCode: fc, goFriendCode: goFc, youtubeUrl: finalYoutube, twitchUrl: finalTwitch,
            });

            showMessage("Profile changes saved", "success");
            setForm((prev) => ({
                ...prev,
                avatar: finalAvatar,
                pendingAvatarFile: null,
                pendingAvatarRemoved: false,
                favoriteGames: reorderedGames,
                favoritePokemon: reorderedPokemon,
                favoritePokemonShiny: reorderedShiny,
                switchFriendCode: fc,
                goFriendCode: goFc,
                youtubeUrl: extractYoutubeHandle(finalYoutube),
                twitchUrl: extractTwitchHandle(finalTwitch),
            }));
            setUser((prev) => ({ ...prev, profileTrainer: form.profileTrainer || prev.profileTrainer, avatar: finalAvatar !== undefined ? finalAvatar : prev.avatar }));
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update profile:", err);
            const msg = err.userMessage || err.message || "Failed to update profile";
            showMessage(msg, "error");
        } finally {
            setLoading('save-profile', false);
        }
    };

    return (
        <div className="profile-hero-section">
            <div className="profile-background-banner-placeholder"></div>

            {/* Mobile-only: Back button pinned to top-right corner of the card */}
            {!isEditing && (
                <Button
                    variant="secondary"
                    size="sm"
                    className="hero-back-btn hero-back-btn-mobile"
                    onClick={() => navigate(-1)}
                    icon={<ArrowLeft size={16} />}
                    aria-label="Go back"
                >
                    Back
                </Button>
            )}
            
            <div className="profile-hero-content">
                {/* Avatar */}
                <div className="profile-hero-avatar-wrapper">
                    <div
                        className="profile-hero-avatar"
                        onClick={() => { if (isOwner && isEditing) setShowTrainerModal(true); }}
                        style={{ cursor: (isOwner && isEditing) ? "pointer" : "default" }}
                    >
                        <img
                            src={getUserAvatarUrl(form.avatar ? { avatar: form.avatar } : form)}
                            alt="Avatar"
                            className="profile-hero-avatar-img"
                        />
                        {isOwner && isEditing && (
                            <div className="profile-avatar-edit-overlay">
                                <Camera size={30} strokeWidth={2} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Block */}
                <div className="profile-hero-info">
                    <div className="profile-hero-top-row">
                        <div className="profile-hero-identity">
                            <h1 className="profile-hero-username">
                                <span className="inline-flex items-center gap-2.5">
                                    <span>{username}</span>
                                    {isAdmin && (
                                        <span className="crown-wrapper">
                                            <Crown size={26} strokeWidth={2.5} style={{ color: "#fbbf24", flexShrink: 0, cursor: "default" }} />
                                            <span className="crown-tooltip">Admin</span>
                                        </span>
                                    )}
                                    {isContentCreator && (
                                        <span className="crown-wrapper">
                                            <Video size={26} strokeWidth={2.5} style={{ color: "#fbbf24", flexShrink: 0, cursor: "default" }} />
                                            <span className="crown-tooltip">Content Creator</span>
                                        </span>
                                    )}
                                </span>
                            </h1>
                            
                            <div className="profile-hero-socials">
                                {form.twitchUrl && (
                                    <a href={normalizeTwitchUrl(form.twitchUrl)} target="_blank" rel="noopener noreferrer" className="hero-social-link twitch" aria-label="Twitch Channel">
                                        <TwitchIcon size={16} />
                                    </a>
                                )}
                                {form.youtubeUrl && (
                                    <a href={normalizeYoutubeUrl(form.youtubeUrl)} target="_blank" rel="noopener noreferrer" className="hero-social-link youtube" aria-label="YouTube Channel">
                                        <YoutubeIcon size={16} />
                                    </a>
                                )}
                                
                                <button className="hero-social-link link" onClick={handleCopyLink} aria-label="Copy shareable link" title="Copy link">
                                    <LinkIcon size={16} />
                                </button>
                                
                                <div className="hero-social-likes">
                                    <button
                                        className={`hero-like-btn ${hasLiked ? 'liked' : ''} ${!currentUsername && !isOwner ? 'disabled' : ''}`}
                                        onClick={handleLike}
                                        disabled={likeLoading || !currentUsername || isOwner}
                                        title={!currentUsername ? "Log in to like" : (hasLiked ? "Remove like" : "Like profile")}
                                    >
                                        <span className="like-heart-anchor">
                                            <Heart size={16} fill={hasLiked ? "currentColor" : "none"} />
                                            {likeBurst > 0 && (
                                                <span key={likeBurst} aria-hidden="true">
                                                    <span className="like-heart">❤</span>
                                                    <span className="like-heart" style={{ "--tx": "-26px", "--ty": "-38px", "--rot": "-18deg" }}>❤</span>
                                                    <span className="like-heart" style={{ "--tx": "22px", "--ty": "-44px", "--rot": "14deg" }}>❤</span>
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                    <span className="hero-like-count">{likeCount}</span>
                                </div>
                            </div>
                            
                            <div className="profile-hero-date">
                                <Clock size={14} className="opacity-70 mr-1.5" />
                                {createdAt
                                    ? `Joined ${new Date(createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} (${getTimeAgo(createdAt)})`
                                    : "Join date unknown"}
                            </div>
                            
                            <div className={`profile-hero-online-status ${isOnline ? 'online' : 'offline'}`}>
                                <span className={`online-dot ${isOnline ? 'online' : 'offline'}`}></span>
                                {isOnline ? "Online" : "Offline"}
                            </div>
                        </div>

                        <div className="profile-hero-actions">
                            {!isEditing && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="hero-back-btn"
                                    onClick={() => navigate(-1)}
                                    icon={<ArrowLeft size={16} />}
                                >
                                    Back
                                </Button>
                            )}

                            {isOwner && (
                                <>
                                    {!isContentCreator && !isEditing && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="hero-creator-btn"
                                            onClick={() => setShowCreatorModal(true)}
                                            disabled={creatorStatus === 'pending'}
                                            title={creatorStatus === 'pending' ? "Request Pending" : "Request Creator"}
                                            icon={creatorStatus === 'pending' ? <Clock size={16} /> : <Video size={16} />}
                                        >
                                            <span className="hidden md:inline">{creatorStatus === 'pending' ? "CC Pending" : "Request Creator"}</span>
                                        </Button>
                                    )}

                                    <Button
                                        variant={isEditing ? "primary" : "secondary"}
                                        size="sm"
                                        className={`hero-edit-btn ${isEditing ? "active" : ""}`}
                                        loading={isLoading('save-profile')}
                                        onClick={handleSave}
                                        icon={<NotebookPen size={16} />}
                                    >
                                        <span>{isEditing ? "Save" : "Edit"}</span>
                                    </Button>

                                    {isEditing && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="hero-cancel-btn"
                                            onClick={() => {
                                                if (formBeforeEditRef.current) setForm(formBeforeEditRef.current);
                                                setIsEditing(false);
                                                showMessage("Changes discarded", "info");
                                            }}
                                            icon={<SquareX size={16} />}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="profile-hero-bio">
                        <div className="bio-label">
                            <span className="quote-mark">“</span> BIO
                        </div>
                        {isOwner && isEditing && (
                            <div className="bio-char-limit">
                                {(form.bio || "").length} / 250
                            </div>
                        )}
                        <div className="bio-content">
                            {isOwner && isEditing ? (
                                <TextAreaField
                                    id="profile-hero-bio"
                                    value={form.bio || ""}
                                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                    placeholder="Tell us about yourself..."
                                    maxLength={250}
                                    resize="none"
                                    rows={3}
                                    size="sm"
                                    fullWidth
                                />
                            ) : (
                                <p>{form.bio && form.bio.length > 150 ? `${form.bio.slice(0, 150)}…` : (form.bio || "No bio provided.")}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
