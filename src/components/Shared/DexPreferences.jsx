import React, { useState, useEffect } from "react";
import { profileAPI } from "../../utils/api";
import { useMessage } from "./MessageContext";
import { Info } from "lucide-react";

export default function DexPreferences() {
    const defaultPreferences = {
        showGenderForms: true,
        showAlolanForms: true,
        showGalarianForms: true,
        showHisuianForms: true,
        showPaldeanForms: true,
        showGmaxForms: true,
        showUnownForms: true,
        showOtherForms: true,
        showAlcremieForms: true,
        showVivillonForms: true,
        showAlphaForms: true,
        showAlphaOtherForms: true,
        blockUnobtainableShinies: false,
        blockGOExclusiveShinies: false,
        blockNOOTExclusiveShinies: false,
        hideLockedShinies: false,
        dexViewMode: 'categorized', // 'categorized' = separate sections, 'unified' = all Pokemon in one list sorted by dex number
    };

    const [preferences, setPreferences] = useState(defaultPreferences);
    const [externalLinkPreference, setExternalLinkPreference] = useState('serebii');
    const [saving, setSaving] = useState(false);
    const { showMessage } = useMessage();

    useEffect(() => {
        // Load preferences from localStorage as fallback
        const savedPrefs = localStorage.getItem('dexPreferences');
        if (savedPrefs) {
            try {
                let parsedPrefs = JSON.parse(savedPrefs) || {};

                // Migration: Convert old blockGOAndNOOTExclusiveShinies to new separate preferences
                if (parsedPrefs.blockGOAndNOOTExclusiveShinies === true) {
                    if (parsedPrefs.blockGOExclusiveShinies === undefined) {
                        parsedPrefs.blockGOExclusiveShinies = true;
                    }
                    if (parsedPrefs.blockNOOTExclusiveShinies === undefined) {
                        parsedPrefs.blockNOOTExclusiveShinies = true;
                    }
                    delete parsedPrefs.blockGOAndNOOTExclusiveShinies;
                }

                // Merge with defaults to ensure all preferences are present
                const mergedPrefs = { ...defaultPreferences, ...parsedPrefs };
                setPreferences(mergedPrefs);
                // Update localStorage with the merged preferences
                localStorage.setItem('dexPreferences', JSON.stringify(mergedPrefs));
            } catch (error) {
                console.error('Failed to parse saved dex preferences:', error);
            }
        }

        // Try to load from server
        loadPreferencesFromServer();

        // Load external link preference
        loadExternalLinkPreference();
    }, []);

    const loadPreferencesFromServer = async () => {
        try {
            const profile = await profileAPI.getProfile();
            if (profile?.dexPreferences) {
                let prefs = { ...profile.dexPreferences };
                let needsMigration = false;

                // Migration: Convert old blockGOAndNOOTExclusiveShinies to new separate preferences
                // Only migrate if the old preference exists AND the new ones don't
                if (prefs.blockGOAndNOOTExclusiveShinies !== undefined &&
                    prefs.blockGOExclusiveShinies === undefined &&
                    prefs.blockNOOTExclusiveShinies === undefined) {

                    needsMigration = true;

                    // If the old preference was enabled, enable both new ones
                    if (prefs.blockGOAndNOOTExclusiveShinies === true) {
                        prefs.blockGOExclusiveShinies = true;
                        prefs.blockNOOTExclusiveShinies = true;
                    } else {
                        prefs.blockGOExclusiveShinies = false;
                        prefs.blockNOOTExclusiveShinies = false;
                    }

                    // Remove the old preference
                    delete prefs.blockGOAndNOOTExclusiveShinies;
                }

                const merged = { ...defaultPreferences, ...prefs };
                setPreferences(merged);
                // Also save to localStorage as backup
                localStorage.setItem('dexPreferences', JSON.stringify(merged));

                // If we migrated, save the new preferences to the server
                if (needsMigration) {
                    try {
                        await profileAPI.updateDexPreferences(merged);
                        console.log('Migrated old shiny locking preferences to new format');
                    } catch (error) {
                        console.error('Failed to save migrated preferences:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load dex preferences from server:', error);
        }
    };

    const loadExternalLinkPreference = async () => {
        // Load from localStorage first for immediate UI update
        const savedPreference = localStorage.getItem('externalLinkPreference');
        if (savedPreference) {
            setExternalLinkPreference(savedPreference);
        }

        try {
            const profile = await profileAPI.getProfile();
            if (profile?.externalLinkPreference) {
                setExternalLinkPreference(profile.externalLinkPreference);
                // Update localStorage with server value
                localStorage.setItem('externalLinkPreference', profile.externalLinkPreference);
            }
        } catch (error) {
            console.error('Failed to load external link preference from server:', error);
        }
    };

    const handleToggle = async (key) => {
        const previous = preferences;
        const newPreferences = {
            ...defaultPreferences,
            ...preferences,
            [key]: !preferences[key]
        };

        setPreferences(newPreferences);

        // Save to localStorage immediately for responsive UI
        localStorage.setItem('dexPreferences', JSON.stringify(newPreferences));

        // Save to server
        try {
            setSaving(true);
            await profileAPI.updateDexPreferences(newPreferences);
            showMessage("Dex preferences updated!", "success");

            // Dispatch event to notify App component of preference changes
            window.dispatchEvent(new CustomEvent('dexPreferencesChanged'));
        } catch (error) {
            console.error('Failed to save dex preferences:', error);
            showMessage("Failed to save preferences", "error");
            // Revert on error
            setPreferences(previous);
            localStorage.setItem('dexPreferences', JSON.stringify(previous));
        } finally {
            setSaving(false);
        }
    };

    const handleExternalLinkChange = async (preference) => {
        setExternalLinkPreference(preference);

        // Save to localStorage immediately for responsive UI
        localStorage.setItem('externalLinkPreference', preference);

        try {
            await profileAPI.updateProfile({ externalLinkPreference: preference });
            const linkNames = {
                'serebii': 'Serebii',
                'bulbapedia': 'Bulbapedia',
                'pokemondb': 'PokemonDB',
                'smogon': 'Smogon'
            };
            showMessage(`External links set to ${linkNames[preference]}`, "success");

            // Dispatch event to notify App component of external link preference change
            window.dispatchEvent(new CustomEvent('externalLinkPreferenceChanged'));
        } catch (error) {
            console.error('Failed to update external link preference:', error);
            showMessage("Couldn't update external link preference", "error");
        }
    };

    const handleViewModeChange = async (mode) => {
        const previous = preferences;
        const newPreferences = {
            ...defaultPreferences,
            ...preferences,
            dexViewMode: mode
        };

        setPreferences(newPreferences);

        // Save to localStorage immediately for responsive UI
        localStorage.setItem('dexPreferences', JSON.stringify(newPreferences));

        // Save to server
        try {
            setSaving(true);
            await profileAPI.updateDexPreferences(newPreferences);
            const modeNames = {
                'categorized': 'Categorized View',
                'unified': 'Unified View'
            };
            showMessage(`Dex view set to ${modeNames[mode]}`, "success");

            // Dispatch event to notify App component of preference changes
            window.dispatchEvent(new CustomEvent('dexPreferencesChanged'));
        } catch (error) {
            console.error('Failed to save dex view mode:', error);
            showMessage("Failed to save view mode", "error");
            // Revert on error
            setPreferences(previous);
            localStorage.setItem('dexPreferences', JSON.stringify(previous));
        } finally {
            setSaving(false);
        }
    };

    const preferenceOptions = [
        { key: 'showGenderForms', label: 'Gender Forms' },
        { key: 'showAlolanForms', label: 'Alolan Forms' },
        { key: 'showGalarianForms', label: 'Galarian Forms' },
        { key: 'showHisuianForms', label: 'Hisuian Forms' },
        { key: 'showPaldeanForms', label: 'Paldean Forms' },
        { key: 'showGmaxForms', label: 'Gigantamax Forms' },
        { key: 'showUnownForms', label: 'Unown Forms' },
        { key: 'showOtherForms', label: 'Other Forms' },
        { key: 'showAlcremieForms', label: 'Alcremie Forms' },
        { key: 'showVivillonForms', label: 'Vivillon Forms' },
        { key: 'showAlphaForms', label: 'Alpha Forms' },
        { key: 'showAlphaOtherForms', label: "Alpha Genders & Others" },
    ];

    const shinyBlockingOptions = [
        { key: 'blockUnobtainableShinies', label: 'Lock Unobtainable Shinies' },
        { key: 'blockGOExclusiveShinies', label: 'Lock GO Exclusive Shinies' },
        { key: 'blockNOOTExclusiveShinies', label: 'Lock NO OT Exclusive Shinies' },
        { key: 'hideLockedShinies', label: 'Hide Locked Shinies from Grid' },
    ];

    return (
        <div className="setting-block">
            {/* Dex View Mode Section */}
            <div className="dex-view-mode-section">
                <h4 className="preference-section-header">Dex View Mode</h4>
                <p className="setting-description">
                    Choose how your Pokédex is organized.
                </p>

                <div className="dex-preferences-grid">
                    <div className="preference-item">
                        <label className="preference-checkbox">
                            <input
                                type="radio"
                                name="dexViewMode"
                                value="categorized"
                                checked={preferences.dexViewMode === 'categorized' || !preferences.dexViewMode}
                                onChange={(e) => handleViewModeChange(e.target.value)}
                            />
                            <span className="preference-label">Categorized</span>
                            <span className="preference-info-wrapper">
                                <Info size={18} className="preference-info-icon" />
                                <span className="preference-tooltip">Separate sections for Living Dex, Regional Forms, Alpha Forms, etc.</span>
                            </span>
                        </label>
                    </div>

                    <div className="preference-item">
                        <label className="preference-checkbox">
                            <input
                                type="radio"
                                name="dexViewMode"
                                value="unified"
                                checked={preferences.dexViewMode === 'unified'}
                                onChange={(e) => handleViewModeChange(e.target.value)}
                            />
                            <span className="preference-label">Unified</span>
                            <span className="preference-info-wrapper">
                                <Info size={18} className="preference-info-icon" />
                                <span className="preference-tooltip">All Pokémon in one list, sorted by National Dex number.</span>
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="setting-divider" />

            <h4 className="preference-section-header">Form Types</h4>
            <p className="setting-description">
                Choose which form types to display in your Pokédex.
            </p>

            <div className="dex-preferences-grid">
                {preferenceOptions.map(({ key, label }) => (
                    <div key={key} className="preference-item">
                        <label className="preference-checkbox">
                            <input
                                type="checkbox"
                                checked={!!preferences[key]}
                                onChange={() => handleToggle(key)}
                            />
                            <span className="preference-label">{label}</span>
                        </label>
                    </div>
                ))}
            </div>

            {/* Shiny Locking Section */}
            <div className="setting-divider" />

            <div className="shiny-blocking-section">
                <h4 className="preference-section-header">Shiny Locking</h4>
                <p className="setting-description">
                    Lock certain types of shiny Pokemon to prevent interaction in your dex.
                </p>

                <div className="dex-preferences-grid">
                    {shinyBlockingOptions.map(({ key, label }) => (
                        <div key={key} className="preference-item">
                            <label className="preference-checkbox">
                                <input
                                    type="checkbox"
                                    checked={!!preferences[key]}
                                    onChange={() => handleToggle(key)}
                                />
                                <span className="preference-label">{label}</span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* External Links Section */}
            <div className="setting-divider" />

            <div className="external-links-section">
                <h4 className="preference-section-header">External Links</h4>
                <p className="setting-description">
                    Choose which website Pokemon names link to in the sidebar.
                </p>

                <div className="dex-preferences-grid">
                    <div className="preference-item">
                        <label className="preference-checkbox">
                            <input
                                type="radio"
                                name="externalLink"
                                value="serebii"
                                checked={externalLinkPreference === 'serebii'}
                                onChange={(e) => handleExternalLinkChange(e.target.value)}
                            />
                            <span className="preference-label">Serebii</span>
                        </label>
                    </div>

                    <div className="preference-item">
                        <label className="preference-checkbox">
                            <input
                                type="radio"
                                name="externalLink"
                                value="bulbapedia"
                                checked={externalLinkPreference === 'bulbapedia'}
                                onChange={(e) => handleExternalLinkChange(e.target.value)}
                            />
                            <span className="preference-label">Bulbapedia</span>
                        </label>
                    </div>

                    <div className="preference-item">
                        <label className="preference-checkbox">
                            <input
                                type="radio"
                                name="externalLink"
                                value="pokemondb"
                                checked={externalLinkPreference === 'pokemondb'}
                                onChange={(e) => handleExternalLinkChange(e.target.value)}
                            />
                            <span className="preference-label">PokemonDB</span>
                        </label>
                    </div>

                    <div className="preference-item">
                        <label className="preference-checkbox">
                            <input
                                type="radio"
                                name="externalLink"
                                value="smogon"
                                checked={externalLinkPreference === 'smogon'}
                                onChange={(e) => handleExternalLinkChange(e.target.value)}
                            />
                            <span className="preference-label">Smogon</span>
                        </label>
                    </div>
                </div>
            </div>

        </div>
    );
}
