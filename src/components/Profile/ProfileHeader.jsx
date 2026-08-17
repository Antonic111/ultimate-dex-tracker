import React from 'react';
import { LinkIcon, Heart, Crown, Video, Youtube, Twitch, Clock, NotebookPen, SquareX } from "lucide-react";
import { profileAPI } from "../../utils/api";
import { useMessage } from "../Shared/MessageContext";
import { useLoading } from "../Shared/LoadingContext";
import { validateContent } from "../../../shared/contentFilter";
import { getTimeAgo } from "../../utils/profileUtils";

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

        let finalYoutube = (form.youtubeUrl || "").trim();
        if (finalYoutube) {
            if (!/^https?:\/\//i.test(finalYoutube)) finalYoutube = 'https://' + finalYoutube;
            if (!/^(https?:\/\/)?(www\.)?(youtube\.com\/(channel\/|@|c\/)|youtu\.be\/)/i.test(finalYoutube)) {
                showMessage("Invalid YouTube URL. Example: youtube.com/@YourChannel", "error");
                return;
            }
        }

        let finalTwitch = (form.twitchUrl || "").trim();
        if (finalTwitch) {
            if (!/^https?:\/\//i.test(finalTwitch)) finalTwitch = 'https://' + finalTwitch;
            if (!/^(https?:\/\/)?(www\.)?twitch\.tv\/[a-zA-Z0-9_]+/i.test(finalTwitch)) {
                showMessage("Invalid Twitch URL. Example: twitch.tv/yourchannel", "error");
                return;
            }
        }

        const reorderToFront = (arr, fill) => {
            const cleaned = arr.filter((v) => v !== null && v !== undefined && v !== "");
            return [...cleaned, ...Array(5 - cleaned.length).fill(fill)].slice(0, 5);
        };
        const reorderedGames = reorderToFront(form.favoriteGames, "");
        const reorderedPokemon = reorderToFront(form.favoritePokemon, "");
        const reorderedShiny = form.favoritePokemonShiny; // Simplified logic, but needs real reordering in the parent or modal ideally.
        // Actually Profile.jsx just reorders to front based on valid entries. I'll stick to original logic:
        const reorderShiny = (arr) => {
             const cleaned = arr.filter((v) => v !== null && v !== undefined);
             return [...cleaned, ...Array(5 - cleaned.length).fill(false)].slice(0, 5);
        };

        try {
            const bioValidation = validateContent(String(form.bio || ''), 'bio');
            if (!bioValidation.isValid) {
                showMessage(`${bioValidation.error}`, 'error');
                return;
            }
            setLoading('save-profile', true);
            await profileAPI.updateProfile({
                bio: form.bio, location: form.location, gender: form.gender, profileTrainer: form.profileTrainer,
                favoriteGames: reorderedGames, favoritePokemon: reorderedPokemon, favoritePokemonShiny: reorderShiny(form.favoritePokemonShiny),
                switchFriendCode: fc, goFriendCode: goFc, youtubeUrl: finalYoutube, twitchUrl: finalTwitch,
            });

            showMessage("Profile changes saved", "success");
            setForm((prev) => ({
                ...prev, favoriteGames: reorderedGames, favoritePokemon: reorderedPokemon, favoritePokemonShiny: reorderShiny(form.favoritePokemonShiny),
                switchFriendCode: fc, goFriendCode: goFc, youtubeUrl: finalYoutube, twitchUrl: finalTwitch,
            }));
            setUser((prev) => ({ ...prev, profileTrainer: form.profileTrainer || prev.profileTrainer }));
            setIsEditing(false);
        } catch (err) {
            showMessage("Failed to update profile", "error");
        } finally {
            setLoading('save-profile', false);
        }
    };

    return (
        <div className="profile-header-bar">
            <div className="profile-header-left">
                <div className="profile-top-line">
                    <h1 className="profile-username">
                        <span>
                            {username}
                            {isAdmin && (
                                <span className="crown-wrapper">
                                    <Crown size={26} strokeWidth={2.5} style={{ color: "#fbbf24", flexShrink: 0 }} />
                                    <span className="crown-tooltip">Admin</span>
                                </span>
                            )}
                            {isContentCreator && (
                                <span className="crown-wrapper" style={{ marginLeft: '-2px' }}>
                                    <Video size={26} strokeWidth={2.5} style={{ color: "#fbbf24", flexShrink: 0 }} />
                                    <span className="crown-tooltip">Content Creator</span>
                                </span>
                            )}
                        </span>
                    </h1>
                    <button className="profile-copy-link" onClick={handleCopyLink} aria-label="Copy shareable link">
                        <LinkIcon size={22} />
                        <span className="copy-tooltip">Copy shareable link</span>
                    </button>
                    {!isOwner && (
                        <button
                            className={`profile-like-button ${hasLiked ? 'liked' : ''}`}
                            onClick={handleLike}
                            disabled={likeLoading || !currentUsername}
                            title={!currentUsername ? "Log in to like" : (hasLiked ? "Remove like" : "Like profile")}
                        >
                            <span className="like-heart-anchor">
                                <Heart size={22} fill={hasLiked ? "currentColor" : "none"} />
                                {likeBurst > 0 && (
                                    <span key={likeBurst} aria-hidden="true">
                                        <span className="like-heart">❤</span>
                                        <span className="like-heart" style={{ "--tx": "-26px", "--ty": "-38px", "--rot": "-18deg" }}>❤</span>
                                        <span className="like-heart" style={{ "--tx": "22px", "--ty": "-44px", "--rot": "14deg" }}>❤</span>
                                    </span>
                                )}
                            </span>
                            <span className="like-count">{likeCount}</span>
                        </button>
                    )}
                </div>
                <p className="profile-date">
                    {createdAt
                        ? `Joined ${new Date(createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} (${getTimeAgo(createdAt)})`
                        : "Join date unknown"}
                </p>
            </div>

            <div className="profile-header-right">
                <div className="profile-actions">
                    {isContentCreator && form.youtubeUrl && (
                        <a href={form.youtubeUrl} target="_blank" rel="noopener noreferrer" className="profile-social-btn youtube-btn" aria-label="YouTube Channel">
                            <Youtube size={18} />
                            <span className="hidden sm:inline">YouTube</span>
                        </a>
                    )}
                    {isContentCreator && form.twitchUrl && (
                        <a href={form.twitchUrl} target="_blank" rel="noopener noreferrer" className="profile-social-btn twitch-btn" aria-label="Twitch Channel">
                            <Twitch size={18} />
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
