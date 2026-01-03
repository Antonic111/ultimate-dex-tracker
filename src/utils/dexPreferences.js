/**
 * Filter Pokemon forms based on user preferences
 * @param {Array} forms - Array of Pokemon forms to filter
 * @param {Object} preferences - User's dex preferences
 * @returns {Array} Filtered array of forms
 */
export const filterFormsByPreferences = (forms, preferences) => {
    if (!preferences || !forms) return forms;
    
    return forms.filter(form => {
        const formType = form.formType;
        
        // Skip separator headers (they start with dashes)
        if (typeof formType === 'string' && formType.startsWith('-')) {
            return false;
        }
        
        // Skip forms without a valid formType
        if (!formType || typeof formType !== 'string') {
            return false;
        }
        
        // Special case: Pokemon with "-alpha" in their name should be treated as Alpha forms
        if (form.name && form.name.toLowerCase().includes('-alpha')) {
            return preferences.showAlphaForms;
        }
        
        switch (formType) {
            case 'gender':
                return preferences.showGenderForms;
            case 'alolan':
                return preferences.showAlolanForms;
            case 'galarian':
                return preferences.showGalarianForms;
            case 'hisuian':
                return preferences.showHisuianForms;
            case 'paldean':
                return preferences.showPaldeanForms;
            case 'gmax':
                return preferences.showGmaxForms;
            case 'unown':
                return preferences.showUnownForms;
            case 'other':
                return preferences.showOtherForms;
            case 'alcremie':
                return preferences.showAlcremieForms;
            case 'vivillon':
                return preferences.showVivillonForms;
            case 'alpha':
                return preferences.showAlphaForms;
            case 'alphaother':
                return preferences.showAlphaOtherForms;
            default:
                return true;
        }
    });
};

/**
 * Get user's dex preferences from localStorage or return defaults
 * @returns {Object} User's dex preferences
 */
export const getDexPreferences = () => {
    try {
        const savedPrefs = localStorage.getItem('dexPreferences');
        if (savedPrefs) {
            const parsedPrefs = JSON.parse(savedPrefs);
            // Merge with defaults to ensure all preferences are present
            return {
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
                blockGOAndNOOTExclusiveShinies: false,
                ...parsedPrefs // User preferences override defaults
            };
        }
    } catch (error) {
        console.error('Failed to parse saved dex preferences:', error);
    }
    
    return {
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
        blockGOAndNOOTExclusiveShinies: false,
    };
};

/**
 * Get filtered forms data based on user preferences
 * @param {Array} formsData - The forms data array
 * @param {Object} preferences - User's dex preferences (optional, will use localStorage if not provided)
 * @returns {Array} Filtered forms data
 */
export const getFilteredFormsData = (formsData, preferences = null) => {
    const prefs = preferences || getDexPreferences();
    return filterFormsByPreferences(formsData, prefs);
};

/**
 * Test function to verify filtering is working
 * @returns {Object} Test results
 */
export const testFiltering = () => {
    const testForms = [
        { id: 1, name: 'test-gender', formType: 'gender' },
        { id: 2, name: 'test-alolan', formType: 'alolan' },
        { id: 3, name: 'test-galarian', formType: 'galarian' },
        { id: 4, name: 'test-other', formType: 'other' },
    ];
    
    const testPreferences = {
        showGenderForms: false,
        showAlolanForms: true,
        showGalarianForms: false,
        showOtherForms: true,
    };
    
    const filtered = filterFormsByPreferences(testForms, testPreferences);
    
    return {
        original: testForms.length,
        filtered: filtered.length,
        shouldShow: [testForms[1], testForms[3]], // alolan and other
        actual: filtered,
        working: filtered.length === 2 && 
                 filtered.some(f => f.formType === 'alolan') && 
                 filtered.some(f => f.formType === 'other') &&
                 !filtered.some(f => f.formType === 'gender') &&
                 !filtered.some(f => f.formType === 'galarian')
    };
};
