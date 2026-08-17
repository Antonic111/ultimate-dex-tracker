import React from 'react';
import { Book, ChevronRight, Grid3x3 } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProfileTopStats({ stats, targetUsername, isOwner, hasBingoData = true }) {
    if (!stats) return null;

    const shinyCaught = stats.shinyCaught || 0;
    const shinyCompletion = stats.shinyCompletion || 0;
    const regularCaught = stats.regularCaught || stats.shinies || 0;
    const regularCompletion = stats.regularCompletion || stats.completion || 0;

    // SVG circle math
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const shinyOffset = circumference - (shinyCompletion / 100) * circumference;
    const regularOffset = circumference - (regularCompletion / 100) * circumference;

    return (
        <div className="profile-top-stats-container">
            <div className="profile-top-stats-grid">
                {/* Shiny Caught */}
                <div className="top-stat-card">
                    <div className="top-stat-label">
                        SHINY CAUGHT
                    </div>
                    <div className="top-stat-value">{shinyCaught.toLocaleString()}</div>
                    <div className="top-stat-accent-line accent"></div>
                </div>

                {/* Shiny Completion */}
                <div className="top-stat-card">
                    <div className="top-stat-label">
                        SHINY COMPLETION
                    </div>
                    <div className="top-stat-chart">
                        <svg className="donut-chart" viewBox="0 0 64 64">
                            <circle className="donut-bg" cx="32" cy="32" r={radius}></circle>
                            <circle 
                                className="donut-progress accent" 
                                cx="32" 
                                cy="32" 
                                r={radius} 
                                strokeDasharray={circumference} 
                                strokeDashoffset={shinyOffset}
                            ></circle>
                        </svg>
                        <div className="donut-text">{shinyCompletion}%</div>
                    </div>
                </div>

                {/* Regular Caught */}
                <div className="top-stat-card border-l-dark">
                    <div className="top-stat-label">
                        REGULAR CAUGHT
                    </div>
                    <div className="top-stat-value">{regularCaught.toLocaleString()}</div>
                    <div className="top-stat-accent-line accent"></div>
                </div>

                {/* Regular Completion */}
                <div className="top-stat-card">
                    <div className="top-stat-label">
                        REGULAR COMPLETION
                    </div>
                    <div className="top-stat-chart">
                        <svg className="donut-chart" viewBox="0 0 64 64">
                            <circle className="donut-bg" cx="32" cy="32" r={radius}></circle>
                            <circle 
                                className="donut-progress accent" 
                                cx="32" 
                                cy="32" 
                                r={radius} 
                                strokeDasharray={circumference} 
                                strokeDashoffset={regularOffset}
                            ></circle>
                        </svg>
                        <div className="donut-text">{regularCompletion}%</div>
                    </div>
                </div>
            </div>

            <div className="profile-top-stats-links">
                <Link to={isOwner ? `/` : `/u/${targetUsername}/dex`} className="top-stat-link-btn">
                    <div className="link-btn-content">
                        <div className="link-btn-title">
                            <Book size={18} style={{ color: 'var(--accent)' }} /> View Full Pokédex
                        </div>
                        <div className="link-btn-subtitle">
                            {isOwner ? "Explore your collection" : "Explore their collection"}
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-500" />
                </Link>
                {(isOwner || hasBingoData) && (
                    <Link to={isOwner ? `/bingo` : `/u/${targetUsername}/bingo`} className="top-stat-link-btn">
                        <div className="link-btn-content">
                            <div className="link-btn-title">
                                <Grid3x3 size={18} style={{ color: 'var(--accent)' }} /> View Bingo
                            </div>
                            <div className="link-btn-subtitle">
                                {isOwner ? "Check your progress" : "Check their progress"}
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-gray-500" />
                    </Link>
                )}
            </div>
        </div>
    );
}
