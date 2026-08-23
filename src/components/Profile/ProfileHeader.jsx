import React from 'react';
import { LinkIcon, Heart, Crown, Video, Clock, Camera, NotebookPen, SquareX } from "lucide-react";
import { YoutubeIcon, TwitchIcon } from "../Shared/SocialIcons";
import { profileAPI } from "../../utils/api";
import { useMessage } from "../Shared/MessageContext";
import { useLoading } from "../Shared/LoadingContext";
import { validateContent } from "../../../shared/contentFilter";
import { getTimeAgo, normalizeYoutubeUrl, normalizeTwitchUrl, extractYoutubeHandle, extractTwitchHandle, getUserAvatarUrl } from "../../utils/profileUtils";

const SWITCH_FC_RE = /^SW-\d{4}-\d{4}-\d{4}$/;
const GO_FC_RE = /^\d{4} \d{4} \d{4}$/;

export default function ProfileHeader({
    username, createdAt, isOwner, isEditing, isAdmin, isContentCreator,
    form, setForm, likeCount, hasLiked, likeLoading, likeBurst,
    setLikeCount, setHasLiked, setLikeLoading, setLikeBurst,
    creatorStatus, setShowCreatorModal, setIsEditing, formBeforeEditRef, setUser, currentUsername
}) {
    const { showMessage } = useMessage();
    const { setLoading, isLoading } = useLoading();

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
        <div className="profile-header-card">
            <div className="profile-header-left">
                <div
                    className="profile-avatar-wrapper"
                    onClick={() => { if (isOwner && isEditing) setShowTrainerModal(true); }}
                    style={{ cursor: (isOwner && isEditing) ? "pointer" : "default" }}
                >
                    <img
                        src={getUserAvatarUrl(form.avatar ? { avatar: form.avatar } : form)}
                        alt="Avatar"
                        className="profile-avatar-img"
                    />
                    {isOwner && isEditing && (
                        <div className="profile-avatar-edit-overlay">
                            <Camera size={30} strokeWidth={2} />
                        </div>
                    )}
                </div>

                <div className="profile-user-info">
                    <div className="profile-name-row">
                        <h1 className="profile-username">
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

                        <div className="profile-likes-display">
                            <button
                                className={`profile-like-btn ${hasLiked ? 'liked' : ''} ${!currentUsername && !isOwner ? 'disabled' : ''}`}
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
                            <span className="profile-like-count">{likeCount}</span>
                        </div>
                    </div>

                    <p className="profile-join-date">
                        <Clock size={14} className="opacity-70 inline mr-1 -mt-0.5" />
                        {createdAt
                            ? `Joined ${new Date(createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} (${getTimeAgo(createdAt)})`
                            : "Join date unknown"}
                    </p>
                </div>
            </div>

            <div className="profile-header-right">
                <div className="profile-actions">
                    {isContentCreator && form.youtubeUrl && (
                        <a href={normalizeYoutubeUrl(form.youtubeUrl)} target="_blank" rel="noopener noreferrer" className="profile-social-btn youtube-btn" aria-label="YouTube Channel">
                            <YoutubeIcon size={18} color="#ef4444" />
                            <span className="hidden sm:inline">YouTube</span>
                        </a>
                    )}
                    {isContentCreator && form.twitchUrl && (
                        <a href={normalizeTwitchUrl(form.twitchUrl)} target="_blank" rel="noopener noreferrer" className="profile-social-btn twitch-btn" aria-label="Twitch Channel">
                            <TwitchIcon size={18} color="#a855f7" />
                            <span className="hidden sm:inline">Twitch</span>
                        </a>
                    )}

                    {isOwner && (
                        <>
                            {!isContentCreator && (
                                <button
                                    className="profile-edit-btn"
                                    onClick={() => setShowCreatorModal(true)}
                                    disabled={creatorStatus === 'pending'}
                                    title={creatorStatus === 'pending' ? "Request Pending" : "Request Content Creator Status"}
                                >
                                    {creatorStatus === 'pending' ? <Clock size={16} /> : <Video size={16} />}
                                    <span className="hidden md:inline">{creatorStatus === 'pending' ? "CC Request Pending" : "Request Creator"}</span>
                                </button>
                            )}

                            <button
                                className={`profile-edit-btn ${isEditing ? "active" : ""}`}
                                disabled={isLoading('save-profile')}
                                onClick={handleSave}
                            >
                                <NotebookPen size={16} className="edit-icon" />
                                <span>{isEditing ? "Save" : "Edit"}</span>
                            </button>

                            {isEditing && (
                                <button
                                    className="profile-cancel-btn"
                                    onClick={() => {
                                        if (formBeforeEditRef.current) setForm(formBeforeEditRef.current);
                                        setIsEditing(false);
                                        showMessage("Changes discarded", "info");
                                    }}
                                >
                                    <SquareX size={16} />
                                    Cancel
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
