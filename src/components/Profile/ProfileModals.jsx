import React from 'react';
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import FavoriteSelectionModal from "../Shared/FavoriteSelectionModal";
import CreatorRequestModal from "../Shared/CreatorRequestModal";
import AvatarUploadModal from "./AvatarUploadModal";
import { Modal } from "../Shared/Modal";
import { Button } from "../Shared/Button";
import { GAME_OPTIONS_TWO } from "../../Constants";

export default function ProfileModals({
    isOwner, isEditing, form, setForm,
    showCreatorModal, setShowCreatorModal, setCreatorStatus,
    showTrainerModal, setShowTrainerModal,
    showGameModal, setShowGameModal, gameSlotIndex,
    showPokemonModal, setShowPokemonModal, pokemonSlotIndex,
    POKEMON_OPTIONS, pendingNavigation, setPendingNavigation, setIsEditing
}) {
    const navigate = useNavigate();

    const handleSaveGames = (newGames) => {
        const updated = Array.from({ length: 5 }, (_, i) => newGames[i] || "");
        setForm(prev => ({ ...prev, favoriteGames: updated }));
        setShowGameModal(false);
    };

    const handleSavePokemon = (newPokemon, newShiny) => {
        const updatedPoke = Array.from({ length: 5 }, (_, i) => newPokemon[i] || "");
        const updatedShiny = Array.from({ length: 5 }, (_, i) => Boolean(newShiny?.[i]));
        setForm(prev => ({
            ...prev,
            favoritePokemon: updatedPoke,
            favoritePokemonShiny: updatedShiny
        }));
        setShowPokemonModal(false);
    };

    return (
        <>
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
                options={POKEMON_OPTIONS}
                selected={form.favoritePokemon || []}
                selectedShiny={form.favoritePokemonShiny || []}
                onChange={handleSavePokemon}
                max={5}
            />
            
            <CreatorRequestModal
                isOpen={showCreatorModal}
                onClose={() => setShowCreatorModal(false)}
                onSubmitted={() => setCreatorStatus('pending')}
            />
            
            <AvatarUploadModal
                isOpen={showTrainerModal}
                onClose={() => setShowTrainerModal(false)}
                currentAvatar={form.avatar}
                onApplyAvatar={({ file, previewUrl }) => {
                    setForm(prev => ({
                        ...prev,
                        avatar: previewUrl,
                        pendingAvatarFile: file,
                        pendingAvatarRemoved: false
                    }));
                }}
                onRemoveAvatar={() => {
                    setForm(prev => ({
                        ...prev,
                        avatar: null,
                        pendingAvatarFile: null,
                        pendingAvatarRemoved: true
                    }));
                }}
            />

            <Modal
                isOpen={Boolean(pendingNavigation)}
                onClose={() => setPendingNavigation(null)}
                title="Unsaved Changes"
                subtitle="You have unsaved changes on your profile"
                icon={<AlertTriangle size={22} color="var(--accent)" />}
                size="sm"
                actions={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setPendingNavigation(null)}
                        >
                            Stay
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                setIsEditing(false);
                                setTimeout(() => navigate(pendingNavigation), 0);
                                setPendingNavigation(null);
                            }}
                        >
                            Leave
                        </Button>
                    </>
                }
            >
                <p style={{ color: "var(--grid-desc, #d5d5d5)", fontSize: "0.9rem", lineHeight: 1.5, margin: 0 }}>
                    Are you sure you want to leave without saving? Any unsaved edits will be discarded.
                </p>
            </Modal>
        </>
    );
}
