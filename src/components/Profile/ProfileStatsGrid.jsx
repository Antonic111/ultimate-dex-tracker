import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, BarChart2 } from "lucide-react";
import { Button } from "../Shared/Button";
import { Tooltip } from "../Shared/Tooltip";
import { GAME_OPTIONS_TWO, BALL_OPTIONS, MARK_OPTIONS } from "../../Constants";
import { getSpriteUrl } from "../../utils/spriteUtils";
import { formatPokemonName } from "../../utils";

const STAT_PAGE_SIZE = 10;

export default function ProfileStatsGrid({ stats, recentAdded, useHomeSprites, targetUsername, isStatsPublic = true, isOwner = false }) {
    const [statPage, setStatPage] = useState({ games: 0, balls: 0, marks: 0 });

    if (!stats) return null;

    const hasGames = Boolean(stats.allGames && stats.allGames.length > 0);
    const hasBalls = Boolean(stats.allBalls && stats.allBalls.length > 0);
    const hasMarks = Boolean(stats.allMarks && stats.allMarks.length > 0);
    const hasAnyCollectionInfo = hasGames || hasBalls || hasMarks;

    return (
        <div className="profile-stats-grid">
            <div className="flex items-center justify-between col-span-2 mb-1 flex-wrap gap-2">
                <h3 className="profile-section-title" style={{ margin: 0 }}>
                    <div className="flex items-center gap-1.5"><Sparkles size={18} className="text-gray-400" /> COLLECTION OVERVIEW</div>
                </h3>
                {targetUsername && (isOwner || isStatsPublic !== false) && (
                    <Button 
                        as={Link}
                        to={`/u/${targetUsername}/stats`}
                        variant="secondary"
                        size="sm"
                        icon={<BarChart2 size={15} />}
                        className="full-stats-btn"
                    >
                        Full Stats
                    </Button>
                )}
            </div>

            {!hasAnyCollectionInfo ? (
                <p className="profile-info-empty-state">
                    No collection information yet.
                </p>
            ) : (
                <>
                    {/* --- Games Hunted In --- */}
                    {hasGames && (
                        <div className="profile-field full-span">
                            <div className="stat-section-header">
                                <label>GAMES HUNTED IN ({stats.gamesPlayed}/{GAME_OPTIONS_TWO.length})</label>
                                {stats.allGames && stats.allGames.length > STAT_PAGE_SIZE && (
                                    <div className="stat-page-controls">
                                        <Button 
                                            variant="secondary"
                                            size="sm"
                                            className="stat-page-btn" 
                                            disabled={statPage.games === 0} 
                                            onClick={() => setStatPage(p => ({ ...p, games: p.games - 1 }))}
                                            icon={<ChevronLeft size={14} />}
                                            aria-label="Previous page"
                                        />
                                        <span className="stat-page-info">{statPage.games + 1}/{Math.ceil(stats.allGames.length / STAT_PAGE_SIZE)}</span>
                                        <Button 
                                            variant="secondary"
                                            size="sm"
                                            className="stat-page-btn" 
                                            disabled={(statPage.games + 1) * STAT_PAGE_SIZE >= stats.allGames.length} 
                                            onClick={() => setStatPage(p => ({ ...p, games: p.games + 1 }))}
                                            icon={<ChevronRight size={14} />}
                                            aria-label="Next page"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className={`field-display stat-icon-row${(() => { const s = (stats.allGames || []).slice(statPage.games * STAT_PAGE_SIZE, (statPage.games + 1) * STAT_PAGE_SIZE); return s.length === STAT_PAGE_SIZE ? ' stat-icon-row--full' : ''; })()}`}>
                                {stats.allGames.slice(statPage.games * STAT_PAGE_SIZE, (statPage.games + 1) * STAT_PAGE_SIZE).map((g, i) => (
                                    <Tooltip key={i} content={g.name} position="top">
                                        <div className="stat-icon-item">
                                            {g.image ? (
                                                <img src={g.image} alt={g.name} className="stat-icon-img" />
                                            ) : (
                                                <span className="stat-icon-text">{g.name}</span>
                                            )}
                                            <span className="stat-icon-count">{g.count}</span>
                                        </div>
                                    </Tooltip>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- Poké Balls Used --- */}
                    {hasBalls && (
                        <div className="profile-field full-span">
                            <div className="stat-section-header">
                                <label>POKÉ BALLS USED ({(stats.allBalls || []).length}/{BALL_OPTIONS.length - 1})</label>
                                {stats.allBalls && stats.allBalls.length > STAT_PAGE_SIZE && (
                                    <div className="stat-page-controls">
                                        <Button 
                                            variant="secondary"
                                            size="sm"
                                            className="stat-page-btn" 
                                            disabled={statPage.balls === 0} 
                                            onClick={() => setStatPage(p => ({ ...p, balls: p.balls - 1 }))}
                                            icon={<ChevronLeft size={14} />}
                                            aria-label="Previous page"
                                        />
                                        <span className="stat-page-info">{statPage.balls + 1}/{Math.ceil(stats.allBalls.length / STAT_PAGE_SIZE)}</span>
                                        <Button 
                                            variant="secondary"
                                            size="sm"
                                            className="stat-page-btn" 
                                            disabled={(statPage.balls + 1) * STAT_PAGE_SIZE >= stats.allBalls.length} 
                                            onClick={() => setStatPage(p => ({ ...p, balls: p.balls + 1 }))}
                                            icon={<ChevronRight size={14} />}
                                            aria-label="Next page"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className={`field-display stat-icon-row${(() => { const s = (stats.allBalls || []).slice(statPage.balls * STAT_PAGE_SIZE, (statPage.balls + 1) * STAT_PAGE_SIZE); return s.length === STAT_PAGE_SIZE ? ' stat-icon-row--full' : ''; })()}`}>
                                {stats.allBalls.slice(statPage.balls * STAT_PAGE_SIZE, (statPage.balls + 1) * STAT_PAGE_SIZE).map((b, i) => (
                                    <Tooltip key={i} content={b.name} position="top">
                                        <div className="stat-icon-item">
                                            {b.image ? (
                                                <img src={b.image} alt={b.name} className="stat-icon-img" />
                                            ) : (
                                                <span className="stat-icon-text">{b.name}</span>
                                            )}
                                            <span className="stat-icon-count">{b.count}</span>
                                        </div>
                                    </Tooltip>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- Marks Obtained --- */}
                    {hasMarks && (
                        <div className="profile-field full-span">
                            <div className="stat-section-header">
                                <label>MARKS OBTAINED ({(stats.allMarks || []).length}/{MARK_OPTIONS.length - 1})</label>
                                {stats.allMarks && stats.allMarks.length > STAT_PAGE_SIZE && (
                                    <div className="stat-page-controls">
                                        <Button 
                                            variant="secondary"
                                            size="sm"
                                            className="stat-page-btn" 
                                            disabled={statPage.marks === 0} 
                                            onClick={() => setStatPage(p => ({ ...p, marks: p.marks - 1 }))}
                                            icon={<ChevronLeft size={14} />}
                                            aria-label="Previous page"
                                        />
                                        <span className="stat-page-info">{statPage.marks + 1}/{Math.ceil(stats.allMarks.length / STAT_PAGE_SIZE)}</span>
                                        <Button 
                                            variant="secondary"
                                            size="sm"
                                            className="stat-page-btn" 
                                            disabled={(statPage.marks + 1) * STAT_PAGE_SIZE >= stats.allMarks.length} 
                                            onClick={() => setStatPage(p => ({ ...p, marks: p.marks + 1 }))}
                                            icon={<ChevronRight size={14} />}
                                            aria-label="Next page"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className={`field-display stat-icon-row${(() => { const s = (stats.allMarks || []).slice(statPage.marks * STAT_PAGE_SIZE, (statPage.marks + 1) * STAT_PAGE_SIZE); return s.length === STAT_PAGE_SIZE ? ' stat-icon-row--full' : ''; })()}`}>
                                {stats.allMarks.slice(statPage.marks * STAT_PAGE_SIZE, (statPage.marks + 1) * STAT_PAGE_SIZE).map((m, i) => (
                                    <Tooltip key={i} content={m.name} position="top">
                                        <div className="stat-icon-item">
                                            {m.image ? (
                                                <img src={m.image} alt={m.name} className="stat-icon-img" />
                                            ) : (
                                                <span className="stat-icon-text">{m.name}</span>
                                            )}
                                            <span className="stat-icon-count">{m.count}</span>
                                        </div>
                                    </Tooltip>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <h3 className="profile-section-title col-span-2">
                <div className="flex items-center gap-1.5"><Sparkles size={18} className="text-gray-400" /> RECENT ENTRIES</div>
            </h3>
            <div className="profile-field full-span recent-field">
                <div className="field-display recent-field-box">
                    {!recentAdded || recentAdded.length === 0 ? (
                        <div className="no-recent-pokemon">
                            <p>No recent entries yet</p>
                        </div>
                    ) : (
                        <div className="profile-rank-row recent-pokemon-row">
                            {recentAdded.map((pokemon, idx) => {
                                const { mon, info } = pokemon;
                                const isNewest = idx === 0;
                                const isShiny = info?.isShiny;

                                return (
                                    <div key={idx} className={`profile-rank-item recent-pokemon-item ${isNewest ? 'newest' : ''}`}>
                                        {isNewest && (
                                            <div className="newest-badge">LATEST</div>
                                        )}
                                        <div className="profile-pokemon-box recent-pokemon-box">
                                            <img
                                                src={getSpriteUrl(mon, isShiny, useHomeSprites)}
                                                alt={formatPokemonName(mon?.name)}
                                                className={`pokemon-img ${!useHomeSprites ? 'pixelated' : ''}`}
                                                style={!useHomeSprites ? { imageRendering: 'pixelated' } : undefined}
                                            />
                                            {isShiny && (
                                                <div className="shiny-indicator">
                                                    <Sparkles size={20} className="shiny-sparkles-icon" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="rank-label recent-pokemon-name" data-order={idx + 1}>
                                            {formatPokemonName(mon?.name)}
                                            {mon?.formType && !['alcremie', 'other', 'unown'].includes(mon.formType.toLowerCase()) && (
                                                <div className="form-type-tag">
                                                    {mon.formType.charAt(0).toUpperCase() + mon.formType.slice(1)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
