import React from 'react';
import { PencilLine, Trophy, Heart } from "lucide-react";
import { GAME_OPTIONS_TWO } from "../../Constants";
import { formatPokemonName } from "../../utils";

export default function ProfileFavorites({ isOwner, isEditing, form, POKEMON_OPTIONS, openGameModal, openPokemonModal }) {
    const hasGames = form.favoriteGames && form.favoriteGames.some(g => g);
    const hasPokemon = form.favoritePokemon && form.favoritePokemon.some(p => p);

    return (
        <div className="profile-ranking-group">
            {((isOwner && isEditing) || hasGames) && (
                <div className="profile-favorites-section">
                    <h3 className="profile-section-title">
                        <Trophy size={18} className="text-purple-500" /> FAVORITE GAMES
                    </h3>
                    <div className="profile-rank-row mt-6">
                        {Array.from({ length: 5 }).map((_, index) => {
                            const game = form.favoriteGames[index];
                            const gameData = GAME_OPTIONS_TWO.find(g => g.value === game);
                            const isEmpty = !gameData;

                            return (
                                <div
                                    key={index}
                                    className="profile-rank-item"
                                    onClick={() => { if (isOwner && isEditing) openGameModal(index); }}
                                    style={{ cursor: (isOwner && isEditing) ? "pointer" : "default" }}
                                >
                                    {index < 3 && !isEmpty && (
                                        <div className={`trophy-icon trophy-${index + 1}`}>
                                            <Trophy size={16} />
                                        </div>
                                    )}

                                    {isEmpty ? (
                                        (isOwner && isEditing) ? (
                                            <div className="empty-game-slot">
                                                <PencilLine className="edit-icon" size={22} strokeWidth={2} />
                                            </div>
                                        ) : (
                                            <div style={{ width: "96px", height: "96px" }} />
                                        )
                                    ) : (
                                        <div className="profile-game-box">
                                            <img src={gameData.image} alt={gameData.name} className="game-img" />
                                        </div>
                                    )}

                                    <div className="rank-label">{!isEmpty ? gameData.name : null}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {((isOwner && isEditing) || hasPokemon) && (
                <div className="profile-favorites-section">
                    <h3 className="profile-section-title">
                        <Trophy size={18} className="text-purple-500" /> FAVORITE POKÉMON
                    </h3>
                    <div className="profile-rank-row mt-6">
                        {Array.from({ length: 5 }).map((_, index) => {
                            const poke = form.favoritePokemon[index];
                            const data = POKEMON_OPTIONS.find(p => p.value === poke || (p.stableId && p.stableId === poke) || p.name === poke || (p.baseName && p.baseName === poke));
                            const isEmpty = !data || !poke;
                            const isShiny = Boolean(form.favoritePokemonShiny?.[index]);

                            return (
                                <div
                                    key={index}
                                    className="profile-rank-item"
                                    onClick={() => { if (isOwner && isEditing) openPokemonModal(index); }}
                                    style={{ cursor: (isOwner && isEditing) ? "pointer" : "default" }}
                                >
                                    {index < 3 && !isEmpty && (
                                        <div className={`trophy-icon trophy-${index + 1}`}>
                                            <Trophy size={16} />
                                        </div>
                                    )}

                                    {isEmpty ? (
                                        (isOwner && isEditing) ? (
                                            <div className="empty-pokemon-slot">
                                                <PencilLine className="edit-icon" size={22} strokeWidth={2} />
                                            </div>
                                        ) : (
                                            <div style={{ width: "96px", height: "96px" }} />
                                        )
                                    ) : (
                                        <div className="profile-pokemon-box">
                                            <img
                                                src={
                                                    isShiny
                                                        ? (data.shinyImage || data.image)
                                                        : data.image
                                                }
                                                alt={data.name}
                                                className="pokemon-img"
                                            />
                                        </div>
                                    )}

                                    <div className="rank-label">
                                        {data?.name ? data.name.split(' (')[0] : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
