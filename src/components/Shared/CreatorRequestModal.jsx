import React, { useState } from "react";
import { Video, Send } from "lucide-react";
import { YoutubeIcon, TwitchIcon } from "./SocialIcons";
import { creatorAPI } from "../../utils/api";
import { useMessage } from "./MessageContext";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { InputField, TextAreaField } from "./FormField";
import { normalizeYoutubeUrl, normalizeTwitchUrl } from "../../utils/profileUtils";
import "../../css/CreatorRequestModal.css";

export default function CreatorRequestModal({ isOpen, onClose, onSubmitted }) {
    const { showMessage } = useMessage();
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        youtubeUrl: '',
        twitchUrl: '',
        contentType: '',
        subscriberCount: '',
    });
    const [errors, setErrors] = useState({});

    const validate = () => {
        const e = {};
        const normalizedYt = normalizeYoutubeUrl(form.youtubeUrl);
        const normalizedTw = normalizeTwitchUrl(form.twitchUrl);

        if (!form.youtubeUrl && !form.twitchUrl) {
            e.channel = "Provide at least one YouTube or Twitch URL or channel handle.";
        }
        if (form.youtubeUrl && !normalizedYt) {
            e.youtubeUrl = "Invalid YouTube channel or handle. Example: @YourChannel";
        }
        if (form.twitchUrl && !normalizedTw) {
            e.twitchUrl = "Invalid Twitch channel or handle. Example: yourchannel";
        }
        if (!form.contentType.trim())
            e.contentType = "Please describe your content type.";
        if (!form.subscriberCount.trim())
            e.subscriberCount = "Please enter your approximate follower count.";
        return e;
    };

    const handleSubmit = async (e, closeModal) => {
        if (e && e.preventDefault) e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setErrors({});
        setSubmitting(true);
        try {
            const finalYoutube = normalizeYoutubeUrl(form.youtubeUrl);
            const finalTwitch = normalizeTwitchUrl(form.twitchUrl);

            await creatorAPI.submitRequest({
                ...form,
                youtubeUrl: finalYoutube,
                twitchUrl: finalTwitch
            });
            showMessage("Request submitted! We'll review it shortly.", "success");
            onSubmitted?.();
            if (typeof closeModal === "function") {
                closeModal();
            } else {
                onClose?.();
            }
        } catch (err) {
            showMessage(err.userMessage || "Failed to submit request.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Request Content Creator Status"
            subtitle="Get verified YouTube & Twitch creator badges on your profile"
            icon={<Video size={22} />}
            size="md"
            footer={({ close }) => (
                <div className="flex gap-2.5 justify-end w-full">
                    <Button variant="secondary" onClick={close} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button 
                        type="button" 
                        variant="primary" 
                        loading={submitting} 
                        onClick={(e) => handleSubmit(e, close)}
                        icon={<Send size={15} />}
                    >
                        Submit Application
                    </Button>
                </div>
            )}
        >
            <div className="space-y-4">
                <div 
                    className="p-3.5 rounded-xl text-xs space-y-1.5 leading-relaxed"
                    style={{ 
                        backgroundColor: 'var(--pokemon-box-bg2, rgba(255,255,255,0.03))',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text)'
                    }}
                >
                    <div className="font-semibold text-xs uppercase tracking-wider text-[var(--accent)] mb-1">Creator Requirements</div>
                    <div>• Primarily makes Pokémon-related content</div>
                    <div>• <strong>YouTube:</strong> Minimum 1.5k subs &amp; active within past 30 days</div>
                    <div>• <strong>Twitch:</strong> Minimum 500 followers &amp; at least 2 streams per week</div>
                </div>

                <form className="space-y-4" onSubmit={(e) => handleSubmit(e)} noValidate>
                    <div>
                        <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
                            Channel Links <span className="text-red-400">*</span>
                            <span className="text-xs font-normal opacity-60 ml-2">(Provide at least one)</span>
                        </div>
                        {errors.channel && <div className="cr-field-error mb-2">{errors.channel}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                            <InputField
                                label="YouTube URL"
                                startIcon={<YoutubeIcon size={14} color="#ef4444" />}
                                placeholder="youtube.com/@YourChannel"
                                value={form.youtubeUrl}
                                onChange={val => setForm(f => ({ ...f, youtubeUrl: val }))}
                                error={errors.youtubeUrl}
                                clearable
                                size="sm"
                                fullWidth
                            />

                            <InputField
                                label="Twitch URL"
                                startIcon={<TwitchIcon size={14} color="#a855f7" />}
                                placeholder="twitch.tv/yourchannel"
                                value={form.twitchUrl}
                                onChange={val => setForm(f => ({ ...f, twitchUrl: val }))}
                                error={errors.twitchUrl}
                                clearable
                                size="sm"
                                fullWidth
                            />
                        </div>
                    </div>

                    <TextAreaField
                        label="What type of content do you create?"
                        placeholder="e.g. Shiny hunting, Pokédex guides, competitive battles..."
                        value={form.contentType}
                        maxLength={200}
                        showCharCount
                        onChange={val => setForm(f => ({ ...f, contentType: val }))}
                        error={errors.contentType}
                        required
                        rows={2}
                        fullWidth
                    />

                    <InputField
                        label="Approximate subscriber / follower count"
                        placeholder="e.g. 500, 1.2K, 10K+"
                        value={form.subscriberCount}
                        maxLength={100}
                        onChange={val => setForm(f => ({ ...f, subscriberCount: val }))}
                        error={errors.subscriberCount}
                        required
                        size="sm"
                        fullWidth
                    />

                    <div className="text-xs text-[var(--progressbar-info)] opacity-75">
                        * Applications are reviewed manually and may take 1-3 business days to be processed.
                    </div>
                </form>
            </div>
        </Modal>
    );
}
