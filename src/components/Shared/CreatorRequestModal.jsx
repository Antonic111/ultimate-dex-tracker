import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Youtube, Twitch, Video } from "lucide-react";
import { creatorAPI } from "../../utils/api";
import { useMessage } from "./MessageContext";
import "../../css/CreatorRequestModal.css";

const YOUTUBE_RE = /^(https?:\/\/)?(www\.)?(youtube\.com\/(channel\/|@|c\/)|youtu\.be\/)/i;
const TWITCH_RE  = /^(https?:\/\/)?(www\.)?twitch\.tv\/[a-zA-Z0-9_]+/i;

export default function CreatorRequestModal({ isOpen, onClose, onSubmitted }) {
    const { showMessage } = useMessage();
    const [closing, setClosing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        youtubeUrl: '',
        twitchUrl: '',
        contentType: '',
        subscriberCount: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const preventScroll = (e) => {
            e.preventDefault();
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('wheel', preventScroll, { passive: false });
            document.addEventListener('touchmove', preventScroll, { passive: false });
        } else {
            document.body.style.overflow = '';
            document.removeEventListener('wheel', preventScroll);
            document.removeEventListener('touchmove', preventScroll);
        }
        
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('wheel', preventScroll);
            document.removeEventListener('touchmove', preventScroll);
        };
    }, [isOpen]);

    const handleClose = () => {
        setClosing(true);
        setTimeout(() => {
            setClosing(false);
            onClose();
        }, 280);
    };

    const validate = () => {
        const e = {};
        if (!form.youtubeUrl && !form.twitchUrl)
            e.channel = "Provide at least one YouTube or Twitch URL.";
        if (form.youtubeUrl && !YOUTUBE_RE.test(form.youtubeUrl))
            e.youtubeUrl = "Invalid URL. Example: youtube.com/@YourChannel";
        if (form.twitchUrl && !TWITCH_RE.test(form.twitchUrl))
            e.twitchUrl = "Invalid URL. Example: twitch.tv/yourchannel";
        if (!form.contentType.trim())
            e.contentType = "Please describe your content type.";
        if (!form.subscriberCount.trim())
            e.subscriberCount = "Please enter your approximate follower count.";
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setErrors({});
        setSubmitting(true);
        try {
            let finalYoutube = form.youtubeUrl.trim();
            let finalTwitch = form.twitchUrl.trim();
            
            if (finalYoutube && !/^https?:\/\//i.test(finalYoutube)) finalYoutube = 'https://' + finalYoutube;
            if (finalTwitch && !/^https?:\/\//i.test(finalTwitch)) finalTwitch = 'https://' + finalTwitch;

            await creatorAPI.submitRequest({
                ...form,
                youtubeUrl: finalYoutube,
                twitchUrl: finalTwitch
            });
            showMessage("Request submitted! We'll review it shortly.", "success");
            onSubmitted?.();
            handleClose();
        } catch (err) {
            showMessage(err.userMessage || "Failed to submit request.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen && !closing) return null;

    return createPortal(
        <div
            className={`cr-modal-backdrop ${closing ? "closing" : ""}`}
            role="dialog"
            aria-modal="true"
        >
            <div className={`cr-modal ${closing ? "closing" : ""}`}>
                {/* Header */}
                <div className="cr-modal-header">
                    <div className="cr-modal-title-row">
                        <span className="cr-badge-icon" style={{ color: 'var(--accent)', display: 'flex' }}><Video size={24} strokeWidth={2.5} /></span>
                        <h2>Request Content Creator Status</h2>
                    </div>
                    <button className="close-btn" onClick={handleClose} aria-label="Close">
                        <span className="sidebar-close-icon">
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="20" cy="20" r="18" fill="#fff" stroke="#232323" strokeWidth="2" />
                                <path d="M2 20a18 18 0 0 1 36 0" fill="#e62829" stroke="#232323" strokeWidth="2" />
                                <rect x="2" y="19" width="36" height="2" fill="#232323" />
                                <circle cx="20" cy="20" r="7" fill="#ffffffff" stroke="#232323" strokeWidth="2" />
                                <circle cx="20" cy="20" r="3.5" fill="#fff" stroke="#232323" strokeWidth="1.5" />
                            </svg>
                        </span>
                    </button>
                </div>

                <div className="cr-modal-subtitle">
                    <p style={{ margin: '0 0 12px 0' }}>
                        Fill in the details below and we'll review your application. Approved creators get YouTube &amp; Twitch badges on their profile.
                    </p>
                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'left', fontSize: '0.85rem' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Creator Requirements:</h4>
                        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <li>Primarily makes Pokémon related content</li>
                            <li><strong>YouTube:</strong> Minimum 1.5k subs &amp; active within the past 30 days</li>
                            <li><strong>Twitch:</strong> Minimum 500 followers &amp; at least 2 streams a week</li>
                        </ul>
                    </div>
                </div>

                <form className="cr-modal-form" onSubmit={handleSubmit} noValidate>
                    {/* Channel URLs */}
                    <div className="cr-section-label">
                        Channel Links <span className="cr-required">*</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'normal', opacity: 0.7, marginLeft: '8px' }}>(Provide at least one)</span>
                    </div>
                    {errors.channel && <div className="cr-field-error">{errors.channel}</div>}

                    <div className="cr-channel-row">
                        <div className="cr-input-group">
                            <label htmlFor="cr-youtube">
                                <Youtube size={16} className="cr-yt-icon" /> YouTube URL
                            </label>
                            <input
                                id="cr-youtube"
                                type="text"
                                inputMode="url"
                                placeholder="youtube.com/@YourChannel"
                                value={form.youtubeUrl}
                                onChange={e => setForm(f => ({ ...f, youtubeUrl: e.target.value }))}
                                className={errors.youtubeUrl ? 'error' : ''}
                            />
                            {errors.youtubeUrl && <div className="cr-field-error">{errors.youtubeUrl}</div>}
                        </div>

                        <div className="cr-input-group">
                            <label htmlFor="cr-twitch">
                                <Twitch size={16} className="cr-tw-icon" /> Twitch URL
                            </label>
                            <input
                                id="cr-twitch"
                                type="text"
                                inputMode="url"
                                placeholder="twitch.tv/yourchannel"
                                value={form.twitchUrl}
                                onChange={e => setForm(f => ({ ...f, twitchUrl: e.target.value }))}
                                className={errors.twitchUrl ? 'error' : ''}
                            />
                            {errors.twitchUrl && <div className="cr-field-error">{errors.twitchUrl}</div>}
                        </div>
                    </div>

                    {/* Content type */}
                    <div className="cr-input-group">
                        <label htmlFor="cr-content-type">
                            What type of content do you create? <span className="cr-required">*</span>
                        </label>
                        <input
                            id="cr-content-type"
                            type="text"
                            placeholder="e.g. Shiny hunting, Pokédex guides, competitive battles..."
                            value={form.contentType}
                            maxLength={200}
                            onChange={e => setForm(f => ({ ...f, contentType: e.target.value }))}
                            className={errors.contentType ? 'error' : ''}
                        />
                        {errors.contentType && <div className="cr-field-error">{errors.contentType}</div>}
                    </div>

                    {/* Subscriber count */}
                    <div className="cr-input-group">
                        <label htmlFor="cr-subs">
                            Approximate subscriber / follower count <span className="cr-required">*</span>
                        </label>
                        <input
                            id="cr-subs"
                            type="text"
                            placeholder="e.g. 500, 1.2K, 10K+"
                            value={form.subscriberCount}
                            maxLength={100}
                            onChange={e => setForm(f => ({ ...f, subscriberCount: e.target.value }))}
                            className={errors.subscriberCount ? 'error' : ''}
                        />
                        {errors.subscriberCount && <div className="cr-field-error">{errors.subscriberCount}</div>}
                    </div>

                    {/* Disclaimer */}
                    <div style={{ fontSize: '0.85rem', color: 'var(--profile-text)', opacity: 0.7, marginTop: '8px', lineHeight: '1.4' }}>
                        * Note: Applications are reviewed manually by our admin team and may take some time to be processed.
                    </div>

                    {/* Footer */}
                    <div className="cr-modal-footer">
                        <button type="submit" className="cr-submit-btn" disabled={submitting}>
                            {submitting ? "Submitting..." : "Submit Request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
