import React from 'react';
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import FavoriteSelectionModal from "../Shared/FavoriteSelectionModal";
import CreatorRequestModal from "../Shared/CreatorRequestModal";
import { GAME_OPTIONS_TWO } from "../../Constants";
import trainerOptions from "../../trainers.json";

export default function ProfileModals({
    isOwner, isEditing, form, setForm,
    showCreatorModal, setShowCreatorModal, setCreatorStatus,
    showTrainerModal, setShowTrainerModal,
    showGameModal, setShowGameModal, gameSlotIndex,
    showPokemonModal, setShowPokemonModal, pokemonSlotIndex,
    POKEMON_OPTIONS, pendingNavigation, setPendingNavigation, setIsEditing
}) {
    const navigate = useNavigate();

    const updateGameAtIndex = (value) => {
        const updated = [...form.favoriteGames];
        while (updated.length < 5) updated.push("");
        updated[gameSlotIndex] = value;
        setForm({ ...form, favoriteGames: updated });
        setShowGameModal(false);
    };

    const updatePokemonAtIndex = (value, isShiny) => {
        const updatedPokemon = [...form.favoritePokemon];
        const updatedShiny = [...form.favoritePokemonShiny];
        while (updatedPokemon.length < 5) updatedPokemon.push("");
        while (updatedShiny.length < 5) updatedShiny.push(false);
        updatedPokemon[pokemonSlotIndex] = value;
        updatedShiny[pokemonSlotIndex] = isShiny;
        setForm({ ...form, favoritePokemon: updatedPokemon, favoritePokemonShiny: updatedShiny });
        setShowPokemonModal(false);
    };

    return (
        <>
            <FavoriteSelectionModal
                isOpen={showGameModal}
                onClose={() => setShowGameModal(false)}
                title="Select a Favorite Game"
                options={GAME_OPTIONS_TWO}
                selected={form.favoriteGames[gameSlotIndex] ? [form.favoriteGames[gameSlotIndex]] : []}
                onChange={(val) => updateGameAtIndex(val[0])}
                max={1}
            />
            
            <FavoriteSelectionModal
                isOpen={showPokemonModal}
                onClose={() => setShowPokemonModal(false)}
                title="Select a Favorite Pokémon"
                options={POKEMON_OPTIONS}
                selected={form.favoritePokemon[pokemonSlotIndex] ? [form.favoritePokemon[pokemonSlotIndex]] : []}
                onChange={(val) => updatePokemonAtIndex(val.value, val.isShiny)}
                max={1}
            />
            
            <CreatorRequestModal
                isOpen={showCreatorModal}
                onClose={() => setShowCreatorModal(false)}
                onSubmitted={() => setCreatorStatus('pending')}
            />
            
            <FavoriteSelectionModal
                isOpen={showTrainerModal}
                onClose={() => setShowTrainerModal(false)}
                title="Choose a Trainer"
                options={trainerOptions.map(t => ({
                    name: t.name,
                    value: t.filename,
                    image: `/data/trainer_sprites/${t.filename}`,
                }))}
                selected={form.profileTrainer ? [form.profileTrainer] : []}
                onChange={(val) => {
                    setForm({ ...form, profileTrainer: val[0] });
                    setShowTrainerModal(false);
                }}
                max={1}
                showHoverPreview
            />

            {pendingNavigation && createPortal(
                <div 
                    className="fixed inset-0 z-[20000] animate-[fadeIn_0.3s_ease-out]"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                    <div className="bg-black/80 w-full h-full flex items-center justify-center">
                        <div 
                            className="bg-[var(--progress-bg)] border border-[#444] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl animate-[slideIn_0.3s_ease-out] text-center" 
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-semibold text-[var(--accent)] mb-4">Unsaved Changes</h2>
                            <p className="text-gray-300 mb-6">
                                You have unsaved changes. Are you sure you want to leave without saving?
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button 
                                    className="px-4 py-2 rounded-lg bg-transparent border-2 border-[var(--dividers)] text-[var(--text)] hover:bg-[var(--dividers)] transition-colors font-semibold"
                                    onClick={() => setPendingNavigation(null)}
                                >
                                    Stay
                                </button>
                                <button 
                                    className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black hover:text-white transition-colors font-semibold"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setTimeout(() => navigate(pendingNavigation), 0);
                                        setPendingNavigation(null);
                                    }}
                                >
                                    Leave
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
