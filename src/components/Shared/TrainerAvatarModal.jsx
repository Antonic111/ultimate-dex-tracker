import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { User, Check, Shuffle, RotateCcw, Search, Sparkles } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import SearchField from "./FormField/SearchField";
import trainerOptions from "../../trainers.json";
import "../../css/TrainerAvatarModal.css";

export default function TrainerAvatarModal({
    isOpen,
    onClose,
    selected = "ash.png",
    onSave,
    onChange,
    title = "Choose Trainer Avatar",
    subtitle = "Select a character sprite to represent your profile",
}) {
    const initialTrainer = typeof selected === "string" ? selected : (Array.isArray(selected) ? selected[0] : "ash.png") || "ash.png";
    const [tempTrainer, setTempTrainer] = useState(initialTrainer);
    const [previewTrainer, setPreviewTrainer] = useState(initialTrainer);
    const [search, setSearch] = useState("");
    const [renderLimit, setRenderLimit] = useState(80);
    const gridRef = useRef(null);

    // Reset when opened
    useEffect(() => {
        if (isOpen) {
            const current = typeof selected === "string" ? selected : (Array.isArray(selected) ? selected[0] : "ash.png") || "ash.png";
            setTempTrainer(current);
            setPreviewTrainer(current);
            setSearch("");
            setRenderLimit(80);
        }
    }, [isOpen, selected]);

    // Reset scroll & render limit on search change
    useEffect(() => {
        setRenderLimit(80);
        if (gridRef.current) {
            gridRef.current.scrollTop = 0;
        }
    }, [search]);

    // Filter trainers based on search
    const filteredTrainers = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return trainerOptions;
        return trainerOptions.filter((t) =>
            (t.name && t.name.toLowerCase().includes(query)) ||
            (t.filename && t.filename.toLowerCase().includes(query))
        );
    }, [search]);

    // Virtualized / infinite scroll
    const handleScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 180) {
            setRenderLimit((prev) => Math.min(prev + 60, filteredTrainers.length));
        }
    }, [filteredTrainers.length]);

    const displayedTrainers = useMemo(() => {
        return filteredTrainers.slice(0, renderLimit);
    }, [filteredTrainers, renderLimit]);

    // Get metadata of active previewed trainer
    const previewData = useMemo(() => {
        const targetFilename = previewTrainer || tempTrainer || "ash.png";
        const hit = trainerOptions.find((t) => t.filename === targetFilename);
        return hit || { name: targetFilename.replace(".png", ""), filename: targetFilename };
    }, [previewTrainer, tempTrainer]);

    // Get metadata of actively selected trainer
    const selectedData = useMemo(() => {
        const targetFilename = tempTrainer || "ash.png";
        const hit = trainerOptions.find((t) => t.filename === targetFilename);
        return hit || { name: targetFilename.replace(".png", ""), filename: targetFilename };
    }, [tempTrainer]);

    const handleSelect = (filename) => {
        setTempTrainer(filename);
        setPreviewTrainer(filename);
    };

    const handleRandomTrainer = () => {
        if (trainerOptions.length === 0) return;
        const randomIdx = Math.floor(Math.random() * trainerOptions.length);
        const randomTrainer = trainerOptions[randomIdx];
        if (randomTrainer) {
            setTempTrainer(randomTrainer.filename);
            setPreviewTrainer(randomTrainer.filename);
        }
    };

    const handleResetDefault = () => {
        setTempTrainer("ash.png");
        setPreviewTrainer("ash.png");
    };

    const handleConfirm = (closeModal) => {
        const chosen = tempTrainer || "ash.png";
        if (typeof onSave === "function") {
            onSave(chosen);
        } else if (typeof onChange === "function") {
            onChange(chosen);
        }
        if (typeof closeModal === "function") {
            closeModal();
        } else {
            onClose?.();
        }
    };

    const isPreviewingActiveSelection = (previewTrainer || tempTrainer) === tempTrainer;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            subtitle={subtitle}
            icon={<User size={22} />}
            size="xl"
            className="trainer-avatar-modal-panel"
            footer={({ close }) => (
                <div className="trainer-modal-footer">
                    <div className="trainer-footer-btns">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={close}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleConfirm(close)}
                            icon={<Check size={15} strokeWidth={2.5} />}
                        >
                            Save Avatar
                        </Button>
                    </div>
                </div>
            )}
        >
            <div className="trainer-modal-body">
                <div className="trainer-modal-layout">
                    {/* Main Left Section: Search & Scrollable Grid */}
                    <div className="trainer-modal-main">
                        <div className="trainer-modal-toolbar">
                            <div className="trainer-search-wrap">
                                <SearchField
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onClear={() => setSearch("")}
                                    placeholder="Search trainer by name..."
                                    size="md"
                                    fullWidth
                                    clearable
                                />
                            </div>
                            <div className="trainer-count-badge" title="Total trainers available">
                                {filteredTrainers.length} {filteredTrainers.length === 1 ? "trainer" : "trainers"}
                            </div>
                        </div>

                        {/* Grid */}
                        <div
                            ref={gridRef}
                            className="trainer-avatar-grid custom-scrollbar"
                            onScroll={handleScroll}
                        >
                            {displayedTrainers.length === 0 ? (
                                <div className="trainer-no-results">
                                    <p className="text-sm font-medium text-slate-300">No trainers found</p>
                                    <p className="text-xs text-slate-400">
                                        Try a different name or search term
                                    </p>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setSearch("")}
                                        className="mt-2"
                                    >
                                        Clear Search
                                    </Button>
                                </div>
                            ) : (
                                displayedTrainers.map((t) => {
                                    const isSelected = tempTrainer === t.filename;
                                    const isPreviewing = previewTrainer === t.filename;

                                    return (
                                        <button
                                            key={t.filename}
                                            type="button"
                                            className={`trainer-avatar-card ${isSelected ? "selected" : ""} ${
                                                isPreviewing ? "previewing" : ""
                                            }`}
                                            onClick={() => handleSelect(t.filename)}
                                            onMouseEnter={() => setPreviewTrainer(t.filename)}
                                            onMouseLeave={() => setPreviewTrainer(tempTrainer)}
                                            title={t.name}
                                        >
                                            {/* Selected Badge */}
                                            {isSelected && (
                                                <div className="trainer-avatar-card-selected-badge" aria-label="Selected">
                                                    <Check size={11} strokeWidth={3.5} />
                                                </div>
                                            )}

                                            {/* Image */}
                                            <div className="trainer-avatar-card-image-wrap">
                                                <img
                                                    src={`/data/trainer_sprites/${t.filename}`}
                                                    alt={t.name}
                                                    className="trainer-avatar-card-img"
                                                    loading="lazy"
                                                />
                                            </div>

                                            {/* Name */}
                                            <span className="trainer-avatar-card-name">{t.name}</span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Section: Dedicated Live Preview Screen */}
                    <div className="trainer-preview-panel">
                        <div className="trainer-preview-glow" aria-hidden="true" />

                        <div className="trainer-preview-header">
                            <span className="trainer-preview-title">Live Preview</span>
                            <span
                                className={`trainer-preview-status-pill ${
                                    isPreviewingActiveSelection ? "active" : "preview"
                                }`}
                            >
                                {isPreviewingActiveSelection ? "Selected" : "Previewing"}
                            </span>
                        </div>

                        {/* Profile Avatar Frame Preview */}
                        <div className="trainer-hero-avatar-preview-wrap">
                            <div className="trainer-hero-avatar-circle" title={previewData.name}>
                                <img
                                    src={`/data/trainer_sprites/${previewData.filename}`}
                                    alt={previewData.name}
                                    className="trainer-hero-avatar-circle-img"
                                />
                            </div>
                        </div>

                        {/* Trainer Info under preview */}
                        <div className="trainer-preview-info">
                            <h3 className="trainer-preview-name">{previewData.name}</h3>
                        </div>

                        {/* Stacked Action Buttons */}
                        <div className="trainer-preview-actions">
                            <Button
                                variant="secondary"
                                size="sm"
                                block
                                onClick={handleRandomTrainer}
                                icon={<Shuffle size={14} />}
                            >
                                Randomize
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                block
                                disabled={tempTrainer === "ash.png"}
                                onClick={handleResetDefault}
                                icon={<RotateCcw size={14} />}
                            >
                                Reset to Default
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
