import React, { useState, useEffect } from "react";
import { profileAPI } from "../../utils/api";
import { useMessage } from "./MessageContext";

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
                const parsedPrefs = JSON.parse(savedPrefs) || {};
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
                const merged = { ...defaultPreferences, ...profile.dexPreferences };
                setPreferences(merged);
                // Also save to localStorage as backup
                localStorage.setItem('dexPreferences', JSON.stringify(merged));
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

    return (
        <div className="setting-block">
            <h3>Dex Preferences</h3>
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
