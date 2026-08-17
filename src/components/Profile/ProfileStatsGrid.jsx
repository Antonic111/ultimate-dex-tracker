import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, BarChart2 } from "lucide-react";
import { GAME_OPTIONS_TWO, BALL_OPTIONS, MARK_OPTIONS } from "../../Constants";
import { getSpriteUrl } from "../../utils/spriteUtils";
import { formatPokemonName } from "../../utils";

const STAT_PAGE_SIZE = 10;

export default function ProfileStatsGrid({ stats, recentAdded, useHomeSprites, targetUsername }) {
    const [statPage, setStatPage] = useState({ games: 0, balls: 0, marks: 0 });

    if (!stats) return null;

    return (
        <div className="profile-stats-grid">
            <div className="flex items-center justify-between col-span-2 mb-1 flex-wrap gap-2">
                <h3 className="profile-section-title" style={{ margin: 0 }}>
                    <div className="flex items-center gap-1.5"><Sparkles size={18} className="text-gray-400" /> COLLECTION OVERVIEW</div>
                </h3>
                {targetUsername && (
                    <Link 
                        to={`/u/${targetUsername}/stats`}
                        className="full-stats-btn"
                    >
                        <BarChart2 size={15} />
                        Full Stats
                    </Link>
                )}
            </div>

            {/* --- Games Hunted In --- */}
            <div className="profile-field full-span">
                <div className="stat-section-header">
                    <label>GAMES HUNTED IN ({stats.gamesPlayed}/{GAME_OPTIONS_TWO.length})</label>
                    {stats.allGames && stats.allGames.length > STAT_PAGE_SIZE && (
                        <div className="stat-page-controls">
                            <button className="stat-page-btn" disabled={statPage.games === 0} onClick={() => setStatPage(p => ({ ...p, games: p.games - 1 }))}>
                                <ChevronLeft size={14} />
                            </button>
                            <span className="stat-page-info">{statPage.games + 1}/{Math.ceil(stats.allGames.length / STAT_PAGE_SIZE)}</span>
                            <button className="stat-page-btn" disabled={(statPage.games + 1) * STAT_PAGE_SIZE >= stats.allGames.length} onClick={() => setStatPage(p => ({ ...p, games: p.games + 1 }))}>
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
                <div className={`field-display stat-icon-row${(() => { const s = (stats.allGames || []).slice(statPage.games * STAT_PAGE_SIZE, (statPage.games + 1) * STAT_PAGE_SIZE); return s.length === STAT_PAGE_SIZE ? ' stat-icon-row--full' : ''; })()}`}>
                    {stats.allGames && stats.allGames.length > 0 ? (
                        stats.allGames.slice(statPage.games * STAT_PAGE_SIZE, (statPage.games + 1) * STAT_PAGE_SIZE).map((g, i) => (
                            <div key={i} className="stat-icon-item">
                                <span className="stat-icon-tooltip">{g.name}</span>
                                {g.image ? (
                                    <img src={g.image} alt={g.name} className="stat-icon-img" />
                                ) : (
                                    <span className="stat-icon-text">{g.name}</span>
                                )}
                                <span className="stat-icon-count">{g.count}</span>
                            </div>
                        ))
                    ) : "—"}
                </div>
            </div>

            {/* --- Poké Balls Used --- */}
            <div className="profile-field full-span">
                <div className="stat-section-header">
                    <label>POKÉ BALLS USED ({(stats.allBalls || []).length}/{BALL_OPTIONS.length - 1})</label>
                    {stats.allBalls && stats.allBalls.length > STAT_PAGE_SIZE && (
                        <div className="stat-page-controls">
                            <button className="stat-page-btn" disabled={statPage.balls === 0} onClick={() => setStatPage(p => ({ ...p, balls: p.balls - 1 }))}>
                                <ChevronLeft size={14} />
                            </button>
                            <span className="stat-page-info">{statPage.balls + 1}/{Math.ceil(stats.allBalls.length / STAT_PAGE_SIZE)}</span>
                            <button className="stat-page-btn" disabled={(statPage.balls + 1) * STAT_PAGE_SIZE >= stats.allBalls.length} onClick={() => setStatPage(p => ({ ...p, balls: p.balls + 1 }))}>
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
                <div className={`field-display stat-icon-row${(() => { const s = (stats.allBalls || []).slice(statPage.balls * STAT_PAGE_SIZE, (statPage.balls + 1) * STAT_PAGE_SIZE); return s.length === STAT_PAGE_SIZE ? ' stat-icon-row--full' : ''; })()}`}>
                    {stats.allBalls && stats.allBalls.length > 0 ? (
                        stats.allBalls.slice(statPage.balls * STAT_PAGE_SIZE, (statPage.balls + 1) * STAT_PAGE_SIZE).map((b, i) => (
                            <div key={i} className="stat-icon-item">
                                <span className="stat-icon-tooltip">{b.name}</span>
                                {b.image ? (
                                    <img src={b.image} alt={b.name} className="stat-icon-img" />
                                ) : (
                                    <span className="stat-icon-text">{b.name}</span>
                                )}
                                <span className="stat-icon-count">{b.count}</span>
                            </div>
                        ))
                    ) : "—"}
                </div>
            </div>

            {/* --- Marks Obtained --- */}
            <div className="profile-field full-span">
                <div className="stat-section-header">
                    <label>MARKS OBTAINED ({(stats.allMarks || []).length}/{MARK_OPTIONS.length - 1})</label>
                    {stats.allMarks && stats.allMarks.length > STAT_PAGE_SIZE && (
                        <div className="stat-page-controls">
                            <button className="stat-page-btn" disabled={statPage.marks === 0} onClick={() => setStatPage(p => ({ ...p, marks: p.marks - 1 }))}>
                                <ChevronLeft size={14} />
                            </button>
                            <span className="stat-page-info">{statPage.marks + 1}/{Math.ceil(stats.allMarks.length / STAT_PAGE_SIZE)}</span>
                            <button className="stat-page-btn" disabled={(statPage.marks + 1) * STAT_PAGE_SIZE >= stats.allMarks.length} onClick={() => setStatPage(p => ({ ...p, marks: p.marks + 1 }))}>
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
                <div className={`field-display stat-icon-row${(() => { const s = (stats.allMarks || []).slice(statPage.marks * STAT_PAGE_SIZE, (statPage.marks + 1) * STAT_PAGE_SIZE); return s.length === STAT_PAGE_SIZE ? ' stat-icon-row--full' : ''; })()}`}>
                    {stats.allMarks && stats.allMarks.length > 0 ? (
                        stats.allMarks.slice(statPage.marks * STAT_PAGE_SIZE, (statPage.marks + 1) * STAT_PAGE_SIZE).map((m, i) => (
                            <div key={i} className="stat-icon-item">
                                <span className="stat-icon-tooltip">{m.name}</span>
                                {m.image ? (
                                    <img src={m.image} alt={m.name} className="stat-icon-img" />
                                ) : (
                                    <span className="stat-icon-text">{m.name}</span>
                                )}
                                <span className="stat-icon-count">{m.count}</span>
                            </div>
                        ))
                    ) : "—"}
                </div>
            </div>

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
                                                className="pokemon-img"
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
