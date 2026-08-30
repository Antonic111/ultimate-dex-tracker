import React from 'react';
import { LinkIcon, Heart, Crown, Video, Clock, NotebookPen, ArrowLeft } from "lucide-react";
import { YoutubeIcon, TwitchIcon } from "../Shared/SocialIcons";
import PremiumIcon from "../Shared/PremiumIcon";
import { AdminIcon, ContentCreatorIcon } from "../Shared/BadgeIcons";
import { getTimeAgo, normalizeYoutubeUrl, normalizeTwitchUrl, getUserAvatarUrl } from "../../utils/profileUtils";
import { useNavigate } from 'react-router-dom';
import { Button } from "../Shared/Button";

export default function ProfileHero({
    username, createdAt, isOwner, isAdmin, isContentCreator, isPremium, premiumMonths,
    form, likeCount, hasLiked, likeLoading, likeBurst,
    setLikeCount, setHasLiked, setLikeLoading, setLikeBurst,
    creatorStatus, setShowCreatorModal, currentUsername,
    onOpenEditModal, isOnline = true
}) {
    const navigate = useNavigate();

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/u/${encodeURIComponent(username)}`;
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(url);
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
            document.execCommand('copy');
            document.body.removeChild(textArea);
        } catch (err) { }
    };

    const handleLike = async () => {
        if (likeLoading || !currentUsername) return;
        setLikeLoading(true);

        const wasLiked = hasLiked;
        const previousCount = likeCount;

        setHasLiked(!wasLiked);
        setLikeCount(wasLiked ? previousCount - 1 : previousCount + 1);
        if (!wasLiked) setLikeBurst((n) => n + 1);

        try {
            const { profileAPI } = await import("../../utils/api");
            const { hasLiked: liked, likeCount: newCount } = await profileAPI.toggleProfileLike(username);
            setHasLiked(liked);
            setLikeCount(newCount);
        } catch (error) {
            setHasLiked(wasLiked);
            setLikeCount(previousCount);
        } finally {
            setLikeLoading(false);
        }
    };

    const hasGradient = Boolean(form.nameColor1 && form.nameColor2);
    const gradientStyle = hasGradient ? {
        "--grad-c1": form.nameColor1,
        "--grad-c2": form.nameColor2,
    } : undefined;

    return (
        <div className="profile-hero-section">
            <div className="profile-background-banner-placeholder"></div>

            {/* Mobile-only: Back button */}
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

            <div className="profile-hero-content">
                {/* Avatar — clicking opens edit modal for owner */}
                <div className="profile-hero-avatar-wrapper">
                    <div
                        className="profile-hero-avatar"
                        onClick={() => { if (isOwner) onOpenEditModal?.(); }}
                        style={{ cursor: isOwner ? "pointer" : "default" }}
                        title={isOwner ? "Edit profile" : undefined}
                    >
                        <img
                            src={getUserAvatarUrl(form.avatar ? { avatar: form.avatar } : form)}
                            alt="Avatar"
                            className="profile-hero-avatar-img"
                        />
                    </div>
                </div>

                {/* Info Block */}
                <div className="profile-hero-info">
                    <div className="profile-hero-top-row">
                        <div className="profile-hero-identity">
                            <h1 className="profile-hero-username">
                                <span className="inline-flex items-center gap-2.5">
                                    {hasGradient ? (
                                        <span className="animated-gradient-username-wrapper" style={gradientStyle}>
                                            <span className="animated-gradient-username">
                                                {username}
                                            </span>
                                        </span>
                                    ) : (
                                        <span>{username}</span>
                                    )}
                                    {isPremium && (
                                        <span className="crown-wrapper">
                                            <PremiumIcon size={26} color="#f59e0b" style={{ flexShrink: 0, cursor: "default" }} />
                                            <span className="crown-tooltip">
                                                {premiumMonths === 1 ? '1 month membership' : `${premiumMonths || 1} months membership`}
                                            </span>
                                        </span>
                                    )}
                                    {isAdmin && (
                                        <span className="crown-wrapper">
                                            <AdminIcon size={24} color="#38bdf8" style={{ flexShrink: 0, cursor: "default" }} />
                                            <span className="crown-tooltip">Admin</span>
                                        </span>
                                    )}
                                    {isContentCreator && (
                                        <span className="crown-wrapper">
                                            <ContentCreatorIcon size={24} color="#ef4444" style={{ flexShrink: 0, cursor: "default" }} />
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
                                        className={`hero-like-btn ${(hasLiked || isOwner) ? 'liked' : ''} ${!currentUsername && !isOwner ? 'disabled' : ''} ${isOwner ? 'owner-view' : ''}`}
                                        onClick={handleLike}
                                        disabled={likeLoading || !currentUsername || isOwner}
                                        title={isOwner ? "Total likes received on your profile" : (!currentUsername ? "Log in to like" : (hasLiked ? "Remove like" : "Like profile"))}
                                    >
                                        <span className="like-heart-anchor">
                                            <Heart size={16} fill={(hasLiked || isOwner) ? "currentColor" : "none"} />
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
                            <Button
                                variant="secondary"
                                size="sm"
                                className="hero-back-btn"
                                onClick={() => navigate(-1)}
                                icon={<ArrowLeft size={16} />}
                            >
                                Back
                            </Button>

                            {isOwner && (
                                <>
                                    {!isContentCreator && (
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
                                        variant="secondary"
                                        size="sm"
                                        className="hero-edit-btn"
                                        onClick={() => onOpenEditModal?.()}
                                        icon={<NotebookPen size={16} />}
                                    >
                                        <span>Edit</span>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="profile-hero-bio">
                        <div className="bio-label">
                            <span className="quote-mark">"</span> BIO
                        </div>
                        <div className="bio-content">
                            <p>{form.bio && form.bio.length > 150 ? `${form.bio.slice(0, 150)}…` : (form.bio || "No bio provided.")}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
