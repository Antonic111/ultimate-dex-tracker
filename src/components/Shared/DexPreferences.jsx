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
        showAlphaForms: true,
        showAlphaOtherForms: true,
    };

    const [preferences, setPreferences] = useState(defaultPreferences);
    const [saving, setSaving] = useState(false);
    const { showMessage } = useMessage();

    useEffect(() => {
        // Load preferences from localStorage as fallback
        const savedPrefs = localStorage.getItem('dexPreferences');
        if (savedPrefs) {
            try {
                const parsedPrefs = JSON.parse(savedPrefs) || {};
                setPreferences(prev => ({ ...prev, ...parsedPrefs }));
            } catch (error) {
                console.error('Failed to parse saved dex preferences:', error);
            }
        }

        // Try to load from server
        loadPreferencesFromServer();
    }, []);

    const loadPreferencesFromServer = async () => {
        try {
            const profile = await profileAPI.getProfile();
            if (profile?.dexPreferences) {
                const merged = { ...defaultPreferences, ...profile.dexPreferences };
                setPreferences(prev => ({ ...prev, ...merged }));
                // Also save to localStorage as backup
                localStorage.setItem('dexPreferences', JSON.stringify(merged));
            }
        } catch (error) {
            console.error('Failed to load dex preferences from server:', error);
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
            showMessage("✅ Dex preferences updated!", "success");
            
            // Dispatch event to notify App component of preference changes
            window.dispatchEvent(new CustomEvent('dexPreferencesChanged'));
        } catch (error) {
            console.error('Failed to save dex preferences:', error);
            showMessage("❌ Failed to save preferences", "error");
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
            

        </div>
    );
}
