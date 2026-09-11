import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
    Upload, Trash2, CheckCircle2, AlertCircle, ShieldCheck,
    Camera, ZoomIn, ZoomOut, RotateCw, RotateCcw, RefreshCw, Move,
    Image as ImageIcon, Sparkles, Check, Crown, ArrowRight, Minimize2
} from "lucide-react";
import { Modal } from "../Shared/Modal";
import { Button } from "../Shared/Button";
import { useUser } from "../Shared";
import { getUserAvatarUrl } from "../../utils/profileUtils";
import "../../css/AvatarUploadModal.css";

const MAX_STATIC_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_GIF_FILE_SIZE = 8 * 1024 * 1024;    // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const CANVAS_SIZE = 280; // Preview canvas dimension in px
const EXPORT_SIZE = 256; // Standard 256x256 max resolution for processed avatars
const CROP_RADIUS = 130; // 260px diameter circular crop aperture inside 280px canvas

export const DEFAULT_AVATARS = [
    { id: "butterfree", name: "Butterfree", url: "/data/default_profile_pictures/butterfree.png" },
    { id: "celebi", name: "Celebi", url: "/data/default_profile_pictures/celebi.png" },
    { id: "charizard", name: "Charizard", url: "/data/default_profile_pictures/charizard.png" },
    { id: "ditto", name: "Ditto", url: "/data/default_profile_pictures/ditto.png" },
    { id: "gardevoir", name: "Gardevoir", url: "/data/default_profile_pictures/gardevoir.png" },
    { id: "gengar", name: "Gengar", url: "/data/default_profile_pictures/gengar.png" },
    { id: "guzzlord", name: "Guzzlord", url: "/data/default_profile_pictures/guzzlord.png" },
    { id: "gyarados", name: "Gyarados", url: "/data/default_profile_pictures/gyarados.png" },
    { id: "lucario", name: "Lucario", url: "/data/default_profile_pictures/lucario.png" },
    { id: "metagross", name: "Metagross", url: "/data/default_profile_pictures/metagross.png" },
    { id: "mew", name: "Mew", url: "/data/default_profile_pictures/mew.png" },
    { id: "mewtwo", name: "Mewtwo", url: "/data/default_profile_pictures/mewtwo.png" },
    { id: "noctowl", name: "Noctowl", url: "/data/default_profile_pictures/noctowl.png" },
    { id: "pikachu", name: "Pikachu", url: "/data/default_profile_pictures/pikachu.png" },
    { id: "psyduck", name: "Psyduck", url: "/data/default_profile_pictures/psyduck.png" },
    { id: "rayquaza", name: "Rayquaza", url: "/data/default_profile_pictures/rayquaza.png" },
    { id: "shaymin", name: "Shaymin", url: "/data/default_profile_pictures/shaymin.png" },
];

export default function AvatarUploadModal({
    isOpen,
    onClose,
    currentAvatar = null,
    onApplyAvatar,
    onRemoveAvatar,
    onAvatarUpdated
}) {
    const { user } = useUser();
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);

    const [activeTab, setActiveTab] = useState("custom"); // "custom" | "defaults"
    const [selectedDefaultUrl, setSelectedDefaultUrl] = useState(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [rawImage, setRawImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isGif, setIsGif] = useState(false);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Crop / Pan / Zoom / Rotation Controls (For static images)
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const [isPanning, setIsPanning] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

    const activeAvatar = currentAvatar || user?.avatar || null;
    const isCustomAvatar = activeAvatar && (
        activeAvatar.startsWith("/uploads/") ||
        activeAvatar.startsWith("blob:") ||
        activeAvatar.startsWith("data:") ||
        activeAvatar.startsWith("http")
    );

    // Reset when modal is opened
    useEffect(() => {
        if (isOpen) {
            setActiveTab("custom");
            setSelectedFile(null);
            setRawImage(null);
            setPreviewUrl(null);
            setIsGif(false);
            setZoom(1);
            setPan({ x: 0, y: 0 });
            setRotation(0);
            setErrorMessage("");
            setIsProcessing(false);

            if (activeAvatar && activeAvatar.includes("/data/default_profile_pictures/")) {
                setSelectedDefaultUrl(activeAvatar);
            } else {
                setSelectedDefaultUrl(null);
            }
        }
    }, [isOpen, activeAvatar]);

    // Clean up preview object URL
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // Load file into an HTML Image element or GIF preview
    const loadFileImage = useCallback((file) => {
        setErrorMessage("");
        if (!file) return;

        const isMember = Boolean(user?.isPremium);
        const isGifFile = file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
        setIsGif(isGifFile);

        if (!ALLOWED_TYPES.includes(file.type) && !isGifFile) {
            setErrorMessage("Please select a valid image file (JPG, PNG, WebP, or GIF).");
            return;
        }

        if (isGifFile) {
            if (file.size > MAX_GIF_FILE_SIZE) {
                setErrorMessage("Animated GIF exceeds maximum allowed upload size of 8MB.");
                return;
            }
        } else {
            if (file.size > MAX_STATIC_FILE_SIZE) {
                setErrorMessage("Static picture exceeds maximum allowed upload size of 5MB.");
                return;
            }
        }

        setSelectedFile(file);
        const objUrl = URL.createObjectURL(file);
        setPreviewUrl(objUrl);
        setSelectedDefaultUrl(null);

        if (!isGifFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    setRawImage(img);
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                    setRotation(0);
                };
                img.onerror = () => {
                    setErrorMessage("Failed to read image file.");
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            setRawImage(null);
            setZoom(1);
            setPan({ x: 0, y: 0 });
            setRotation(0);
        }
    }, []);

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            loadFileImage(file);
        }
    };

    const handleFileDragOver = (e) => {
        e.preventDefault();
        setIsDraggingFile(true);
    };

    const handleFileDragLeave = (e) => {
        e.preventDefault();
        setIsDraggingFile(false);
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        setIsDraggingFile(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            loadFileImage(file);
        }
    };

    // Draw interactive canvas for static images
    const drawCanvas = useCallback(() => {
        if (isGif || !rawImage) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const size = CANVAS_SIZE;
        canvas.width = size;
        canvas.height = size;

        ctx.clearRect(0, 0, size, size);

        // 1. Draw image transformed (center + pan, rotated, scaled)
        ctx.save();
        ctx.translate(size / 2 + pan.x, size / 2 + pan.y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);

        const baseScale = (CROP_RADIUS * 2) / Math.min(rawImage.width, rawImage.height);
        const drawW = rawImage.width * baseScale;
        const drawH = rawImage.height * baseScale;

        ctx.drawImage(rawImage, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // 2. Semi-transparent dark overlay outside the circular crop aperture
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
        ctx.beginPath();
        ctx.rect(0, 0, size, size);
        ctx.arc(size / 2, size / 2, CROP_RADIUS, 0, Math.PI * 2, true);
        ctx.fill();

        // 3. Crisp circular crop guide ring
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, CROP_RADIUS, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "var(--accent, #eab308)";
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 6;
        ctx.stroke();

        // 4. Subtle center guide crosshair lines
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
        ctx.lineWidth = 1;
        ctx.moveTo(size / 2 - 10, size / 2);
        ctx.lineTo(size / 2 + 10, size / 2);
        ctx.moveTo(size / 2, size / 2 - 10);
        ctx.lineTo(size / 2, size / 2 + 10);
        ctx.stroke();

        ctx.restore();
    }, [rawImage, isGif, pan, zoom, rotation]);

    useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);

    // Calculate clamped pan to allow smooth panning without losing the image
    const getClampedPan = useCallback((targetPan, currentZoom = zoom, currentRot = rotation) => {
        if (!rawImage) return targetPan;

        const isRotated90 = (Math.round(currentRot / 90) % 2) !== 0;
        const baseScale = (CROP_RADIUS * 2) / Math.min(rawImage.width, rawImage.height);
        const drawW = rawImage.width * baseScale * currentZoom;
        const drawH = rawImage.height * baseScale * currentZoom;

        const effectiveW = isRotated90 ? drawH : drawW;
        const effectiveH = isRotated90 ? drawW : drawH;

        // Allow generous, smooth panning so user can reposition image freely
        const maxPanX = Math.max(CROP_RADIUS * 0.9, effectiveW / 2);
        const maxPanY = Math.max(CROP_RADIUS * 0.9, effectiveH / 2);

        return {
            x: Math.min(Math.max(targetPan.x, -maxPanX), maxPanX),
            y: Math.min(Math.max(targetPan.y, -maxPanY), maxPanY),
        };
    }, [rawImage, zoom, rotation]);

    const handleZoomChange = (newZoom) => {
        const clampedZoom = Math.min(Math.max(Number(newZoom.toFixed(2)), 0.5), 3);
        setZoom(clampedZoom);
        setPan((prev) => getClampedPan(prev, clampedZoom, rotation));
    };

    const handleFitSquare = () => {
        // 1 / sqrt(2) ≈ 0.707 to make a square fit completely inside the circle
        const fitZoom = 0.71;
        setZoom(fitZoom);
        setPan({ x: 0, y: 0 });
    };

    const handleRotationChange = (deltaRot) => {
        const nextRot = (rotation + deltaRot + 360) % 360;
        setRotation(nextRot);
        setPan((prev) => getClampedPan(prev, zoom, nextRot));
    };

    // Canvas Panning Handlers
    const handlePointerDown = (clientX, clientY) => {
        if (!rawImage || isProcessing || isGif) return;
        setIsPanning(true);
        dragStartRef.current = {
            x: clientX,
            y: clientY,
            panX: pan.x,
            panY: pan.y,
        };
    };

    const handlePointerMove = (clientX, clientY) => {
        if (!isPanning || !rawImage || isProcessing || isGif) return;
        const dx = clientX - dragStartRef.current.x;
        const dy = clientY - dragStartRef.current.y;
        const rawTarget = {
            x: dragStartRef.current.panX + dx,
            y: dragStartRef.current.panY + dy,
        };
        setPan(getClampedPan(rawTarget));
    };

    const handlePointerUp = () => {
        setIsPanning(false);
    };

    const handleWheelZoom = (e) => {
        if (!rawImage || isProcessing || isGif) return;
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        handleZoomChange(zoom + delta);
    };

    // Render cropped image
    const generateCroppedFile = async () => {
        if (isGif && selectedFile) {
            return selectedFile;
        }

        if (!rawImage) return null;

        const expCanvas = document.createElement("canvas");
        expCanvas.width = EXPORT_SIZE;
        expCanvas.height = EXPORT_SIZE;
        const ctx = expCanvas.getContext("2d");
        if (!ctx) return null;

        const exportScale = EXPORT_SIZE / (CROP_RADIUS * 2);

        ctx.save();
        ctx.translate(EXPORT_SIZE / 2 + pan.x * exportScale, EXPORT_SIZE / 2 + pan.y * exportScale);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);

        const baseScale = EXPORT_SIZE / Math.min(rawImage.width, rawImage.height);
        const drawW = rawImage.width * baseScale;
        const drawH = rawImage.height * baseScale;

        ctx.drawImage(rawImage, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        return new Promise((resolve) => {
            expCanvas.toBlob((blob) => {
                if (!blob) {
                    resolve(null);
                    return;
                }
                const fileName = selectedFile?.name ? `avatar-${selectedFile.name.replace(/\.[^/.]+$/, "")}.png` : "avatar.png";
                const croppedFile = new File([blob], fileName, { type: "image/png" });
                resolve(croppedFile);
            }, "image/png");
        });
    };

    // Stage avatar locally for profile save
    const handleApply = async () => {
        // Mode 1: Default Avatar Selected
        if (activeTab === "defaults") {
            if (!selectedDefaultUrl) return;
            if (onApplyAvatar) {
                onApplyAvatar({ file: null, previewUrl: selectedDefaultUrl });
            } else if (onAvatarUpdated) {
                onAvatarUpdated(selectedDefaultUrl);
            }
            onClose();
            return;
        }

        // Mode 2: Custom Upload
        if (!selectedFile) return;

        setIsProcessing(true);
        setErrorMessage("");

        try {
            if (isGif) {
                if (onApplyAvatar) {
                    onApplyAvatar({ file: selectedFile, previewUrl: previewUrl });
                } else if (onAvatarUpdated) {
                    onAvatarUpdated(previewUrl);
                }
                onClose();
                return;
            }

            const croppedFile = await generateCroppedFile();
            if (!croppedFile) {
                throw new Error("Could not process image crop.");
            }

            const localPreview = URL.createObjectURL(croppedFile);
            if (onApplyAvatar) {
                onApplyAvatar({ file: croppedFile, previewUrl: localPreview });
            } else if (onAvatarUpdated) {
                onAvatarUpdated(localPreview);
            }
            onClose();
        } catch (err) {
            console.error("Avatar preparation failed:", err);
            setErrorMessage(err.message || "Failed to process image.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveCustomAvatar = () => {
        if (onRemoveAvatar) {
            onRemoveAvatar();
        } else if (onAvatarUpdated) {
            onAvatarUpdated(null);
        }
        onClose();
    };

    const handleResetCrop = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setRotation(0);
    };

    const previewDisplayUrl = activeTab === "defaults" && selectedDefaultUrl
        ? selectedDefaultUrl
        : getUserAvatarUrl(activeAvatar ? { avatar: activeAvatar } : user);

    const isMember = Boolean(user?.isPremium);

    const isApplyDisabled = activeTab === "defaults"
        ? (!selectedDefaultUrl || selectedDefaultUrl === activeAvatar)
        : (!selectedFile || isProcessing || (isGif && !isMember));

    return (
        <Modal
            isOpen={isOpen}
            onClose={isProcessing ? () => {} : onClose}
            title="Profile Picture"
            subtitle="Upload a custom avatar or choose from the defaults"
            icon={<Camera size={20} className="text-[var(--accent)]" />}
            size="md"
            footer={
                <div className="avatar-modal-footer-row">
                    <div>
                        {/* Only allow removing if user currently has a custom uploaded avatar */}
                        {isCustomAvatar && !selectedFile && activeTab === "custom" && (
                            <Button
                                variant="danger"
                                onClick={handleRemoveCustomAvatar}
                                disabled={isProcessing}
                                icon={<Trash2 size={16} />}
                            >
                                Reset to Default
                            </Button>
                        )}
                        {selectedFile && activeTab === "custom" && (
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setRawImage(null);
                                    setSelectedFile(null);
                                    setPreviewUrl(null);
                                    setIsGif(false);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                                disabled={isProcessing}
                                icon={<ImageIcon size={15} />}
                            >
                                Choose Another
                            </Button>
                        )}
                    </div>
                    <div className="avatar-modal-footer-actions">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleApply}
                            disabled={isApplyDisabled}
                            loading={isProcessing}
                            icon={!isProcessing ? <CheckCircle2 size={16} /> : undefined}
                        >
                            Apply Picture
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="avatar-upload-modal-content">
                {/* Tab Navigator */}
                <div className="avatar-tabs-nav">
                    <button
                        type="button"
                        className={`avatar-tab-btn ${activeTab === "custom" ? "active" : ""}`}
                        onClick={() => setActiveTab("custom")}
                    >
                        <Upload size={15} />
                        <span>Upload Custom</span>
                    </button>
                    <button
                        type="button"
                        className={`avatar-tab-btn ${activeTab === "defaults" ? "active" : ""}`}
                        onClick={() => setActiveTab("defaults")}
                    >
                        <Sparkles size={15} />
                        <span>Default Avatars</span>
                    </button>
                </div>

                {activeTab === "defaults" ? (
                    /* Default Avatars Grid Selection */
                    <div className="avatar-defaults-section">
                        <div className="avatar-defaults-desc">
                            Select a default avatar for your profile:
                        </div>
                        <div className="avatar-defaults-grid">
                            {DEFAULT_AVATARS.map((item) => {
                                const isSelected = selectedDefaultUrl === item.url || (!selectedDefaultUrl && activeAvatar === item.url);
                                return (
                                    <button
                                        type="button"
                                        key={item.id}
                                        className={`avatar-default-card ${isSelected ? "selected" : ""}`}
                                        onClick={() => setSelectedDefaultUrl(item.url)}
                                    >
                                        <div className="avatar-default-img-wrap">
                                            <img
                                                src={item.url}
                                                alt={item.name}
                                                className="avatar-default-img"
                                            />
                                            {isSelected && (
                                                <div className="avatar-default-selected-badge">
                                                    <Check size={14} />
                                                </div>
                                            )}
                                        </div>
                                        <span className="avatar-default-label">{item.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : !selectedFile ? (
                    <>
                        {/* Current Avatar Header Card */}
                        <div className="avatar-preview-section">
                            <div className="avatar-circle-preview-wrap">
                                <img
                                    src={previewDisplayUrl}
                                    alt="Current Avatar"
                                    className="avatar-circle-preview-img"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = "/data/default_profile_pictures/charizard.png";
                                    }}
                                />
                            </div>
                            <div className="avatar-preview-info">
                                <div className="avatar-preview-title">
                                    {isCustomAvatar ? "Current Custom Picture" : "Active Default Avatar"}
                                </div>
                                <div className="avatar-preview-meta">
                                    Supports JPG, PNG, WebP (up to 5MB) • Animated GIFs up to 8MB (Members Only)
                                </div>
                            </div>
                        </div>

                        {/* Universal Dropzone */}
                        <div
                            className={`avatar-dropzone ${isDraggingFile ? "dragging" : ""} ${isProcessing ? "disabled" : ""}`}
                            onDragOver={handleFileDragOver}
                            onDragLeave={handleFileDragLeave}
                            onDrop={handleFileDrop}
                            onClick={() => !isProcessing && fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png, image/jpeg, image/webp, image/gif"
                                className="avatar-hidden-input"
                                onChange={handleFileInputChange}
                                disabled={isProcessing}
                            />
                            <div className="avatar-dropzone-icon-wrap">
                                <Upload size={24} className="avatar-dropzone-icon" />
                            </div>
                            <div className="avatar-dropzone-text">
                                <span className="avatar-dropzone-bold">Click to upload</span> or drag and drop
                            </div>
                            <div className="avatar-dropzone-sub">
                                Images automatically optimized to 256×256 px • Square fit recommended
                            </div>
                        </div>
                    </>
                ) : isGif ? (
                    /* Animated GIF Preview Stage */
                    <div className="avatar-gif-stage-wrap space-y-3">
                        <div className="avatar-gif-preview-container">
                            <img
                                src={previewUrl}
                                alt="Animated GIF Preview"
                                className="avatar-gif-preview-img"
                            />
                        </div>
                        {!isMember ? (
                            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col items-center gap-2 text-center text-xs text-rose-200 shadow-sm">
                                <div className="flex items-center gap-1.5 font-black text-rose-400 text-sm">
                                    <Crown size={18} className="text-amber-400 shrink-0" />
                                    <span>Ultimate Membership Feature</span>
                                </div>
                                <p className="text-[12px] text-[#ccc] leading-relaxed max-w-sm">
                                    Animated GIF avatars are exclusive to Ultimate Members. Upgrade your membership to enable animated profile pictures!
                                </p>
                                <Link
                                    to="/membership"
                                    className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[var(--accent)] text-black font-extrabold text-xs no-underline hover:opacity-90 transition-all mt-1"
                                >
                                    <span>View Membership Options</span>
                                    <ArrowRight size={14} strokeWidth={2.5} />
                                </Link>
                            </div>
                        ) : (
                            <div className="avatar-gif-badge">
                                <Sparkles size={16} className="avatar-gif-badge-icon" />
                                <span><strong>Animated GIF Avatar</strong> — Automatically converted into ultra-smooth, lightweight animated WebP!</span>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Interactive Crop & Resize Stage for Static Images */
                    <div className="avatar-cropper-stage-wrap">
                        <div className="avatar-cropper-canvas-container">
                            <canvas
                                ref={canvasRef}
                                className={`avatar-cropper-canvas ${isPanning ? "panning" : ""}`}
                                onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
                                onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                                onMouseUp={handlePointerUp}
                                onMouseLeave={handlePointerUp}
                                onTouchStart={(e) => {
                                    const touch = e.touches[0];
                                    if (touch) handlePointerDown(touch.clientX, touch.clientY);
                                }}
                                onTouchMove={(e) => {
                                    const touch = e.touches[0];
                                    if (touch) handlePointerMove(touch.clientX, touch.clientY);
                                }}
                                onTouchEnd={handlePointerUp}
                                onWheel={handleWheelZoom}
                                title="Drag to reposition • Scroll to zoom"
                            />
                            <div className="avatar-drag-hint">
                                <Move size={12} />
                                <span>Drag to reposition</span>
                            </div>
                        </div>

                        {/* Controls Toolbar */}
                        <div className="avatar-cropper-controls-panel">
                            {/* Zoom Slider */}
                            <div className="avatar-cropper-zoom-row">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleZoomChange(zoom - 0.1)}
                                    disabled={zoom <= 0.5 || isProcessing}
                                    title="Zoom Out"
                                    icon={<ZoomOut size={15} />}
                                />
                                <div className="avatar-zoom-slider-wrap">
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="3"
                                        step="0.02"
                                        value={zoom}
                                        onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                                        disabled={isProcessing}
                                        className="avatar-zoom-slider"
                                        aria-label="Zoom Level"
                                    />
                                    <span className="avatar-zoom-label">{zoom.toFixed(1)}x</span>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleZoomChange(zoom + 0.1)}
                                    disabled={zoom >= 3 || isProcessing}
                                    title="Zoom In"
                                    icon={<ZoomIn size={15} />}
                                />
                            </div>

                            {/* Rotation, Fit & Reset Buttons */}
                            <div className="avatar-cropper-extra-actions">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleRotationChange(-90)}
                                    disabled={isProcessing}
                                    icon={<RotateCcw size={14} />}
                                >
                                    Rotate Left
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleRotationChange(90)}
                                    disabled={isProcessing}
                                    icon={<RotateCw size={14} />}
                                >
                                    Rotate Right
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleFitSquare}
                                    disabled={isProcessing}
                                    icon={<Minimize2 size={14} />}
                                    title="Fit entire square image inside circle"
                                >
                                    Fit Square
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleResetCrop}
                                    disabled={isProcessing || (zoom === 1 && pan.x === 0 && pan.y === 0 && rotation === 0)}
                                    icon={<RefreshCw size={14} />}
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                    <div className="avatar-upload-error-box">
                        <AlertCircle size={16} className="avatar-error-icon" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Sightengine AI Moderation Notice */}
                {activeTab === "custom" && (
                    <div className="avatar-moderation-badge">
                        <ShieldCheck size={16} className="avatar-moderation-icon" />
                        <span>Protected by automated content moderation (Sightengine AI)</span>
                    </div>
                )}
            </div>
        </Modal>
    );
}
