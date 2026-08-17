import React from 'react';
import { LinkIcon, Heart, Crown, Video, Youtube, Twitch, Clock, NotebookPen, SquareX, ArrowLeft } from "lucide-react";
import { profileAPI } from "../../utils/api";
import { useMessage } from "../Shared/MessageContext";
import { useLoading } from "../Shared/LoadingContext";
import { validateContent } from "../../../shared/contentFilter";
import { getTimeAgo } from "../../utils/profileUtils";
import { useNavigate } from 'react-router-dom';
import ContentFilterInput from "../Shared/ContentFilterInput";

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
        <div className="profile-hero-section">
            <div className="profile-background-banner-placeholder"></div>

            {/* Mobile-only: Back button pinned to top-right corner of the card */}
            {!isEditing && (
                <button
                    className="hero-back-btn hero-back-btn-mobile"
                    onClick={() => navigate(-1)}
                    aria-label="Go back"
                >
                    <ArrowLeft size={16} /> Back
                </button>
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
                            src={`/data/trainer_sprites/${form.profileTrainer || "ash.png"}`}
                            alt="Trainer"
                            className="profile-hero-avatar-img"
                        />
                        {isOwner && isEditing && (
                            <div className="profile-avatar-edit-overlay">
                                <NotebookPen size={32} strokeWidth={2} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Block */}
                <div className="profile-hero-info">
                    <div className="profile-hero-top-row">
                        <div className="profile-hero-identity">
                            <h1 className="profile-hero-username">
                                {username}
                                {isAdmin && (
                                    <span className="crown-wrapper">
                                        <Crown size={28} strokeWidth={2.5} style={{ color: "#fbbf24", flexShrink: 0, cursor: "default" }} />
                                        <span className="crown-tooltip">Admin</span>
                                    </span>
                                )}
                                {isContentCreator && (
                                    <span className="crown-wrapper" style={{ marginLeft: '-2px' }}>
                                        <Video size={28} strokeWidth={2.5} style={{ color: "#fbbf24", flexShrink: 0, cursor: "default" }} />
                                        <span className="crown-tooltip">Content Creator</span>
                                    </span>
                                )}
                            </h1>
                            
                            <div className="profile-hero-socials">
                                {form.twitchUrl && (
                                    <a href={form.twitchUrl} target="_blank" rel="noopener noreferrer" className="hero-social-link twitch" aria-label="Twitch Channel">
                                        <Twitch size={16} />
                                    </a>
                                )}
                                {form.youtubeUrl && (
                                    <a href={form.youtubeUrl} target="_blank" rel="noopener noreferrer" className="hero-social-link youtube" aria-label="YouTube Channel">
                                        <Youtube size={16} />
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
                                <button className="hero-back-btn" onClick={() => navigate(-1)}>
                                    <ArrowLeft size={16} /> Back
                                </button>
                            )}

                            {isOwner && (
                                <>
                                    {!isContentCreator && !isEditing && (
                                        <button
                                            className="hero-creator-btn"
                                            onClick={() => setShowCreatorModal(true)}
                                            disabled={creatorStatus === 'pending'}
                                            title={creatorStatus === 'pending' ? "Request Pending" : "Request Creator"}
                                        >
                                            {creatorStatus === 'pending' ? <Clock size={16} /> : <Video size={16} />}
                                            <span className="hidden md:inline">{creatorStatus === 'pending' ? "CC Pending" : "Request Creator"}</span>
                                        </button>
                                    )}

                                    <button
                                        className={`hero-edit-btn ${isEditing ? "active" : ""}`}
                                        disabled={isLoading('save-profile')}
                                        onClick={handleSave}
                                    >
                                        <NotebookPen size={16} />
                                        <span>{isEditing ? "Save" : "Edit"}</span>
                                    </button>

                                    {isEditing && (
                                        <button
                                            className="hero-cancel-btn"
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

                    <div className="profile-hero-bio">
                        <div className="bio-label">
                            <span className="quote-mark">“</span> BIO
                        </div>
                        <div className="bio-content">
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
                                    className="bio-textarea"
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
