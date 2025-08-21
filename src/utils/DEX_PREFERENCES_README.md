# Dex Preferences Feature

## Overview
The Dex Preferences feature allows users to customize which Pokemon form types are displayed in their Pokédex. Users can toggle various form types on/off according to their preferences.

## Features
- **Gender Forms**: Toggle male/female variations
- **Alolan Forms**: Toggle Alola region variants
- **Galarian Forms**: Toggle Galar region variants
- **Hisuian Forms**: Toggle Hisui region variants
- **Paldean Forms**: Toggle Paldea region variants
- **Gigantamax Forms**: Toggle Gigantamax transformations
- **Unown Forms**: Toggle Unown letter variations
- **Other Forms**: Toggle miscellaneous form variations
- **Alcremie Forms**: Toggle Alcremie flavor/deco variations
- **Alpha Forms**: Toggle Alpha variations
- **Alpha Genders & Others**: Toggle alpha gender/other variations

## Implementation

### Backend Changes
1. **User Model** (`server/models/User.js`): Added `dexPreferences` field with boolean flags for each form type
2. **Auth Routes** (`server/routes/auth.js`): Updated profile update and get routes to handle dex preferences
3. **API** (`src/utils/api.js`): Added `updateDexPreferences` method

### Frontend Changes
1. **DexPreferences Component** (`src/components/Shared/DexPreferences.jsx`): Component for managing preferences in Settings
2. **Settings Page** (`src/pages/Settings.jsx`): Integrated dex preferences section
3. **Utility Functions** (`src/utils/dexPreferences.js`): Helper functions for filtering forms data
4. **CSS Styles** (`src/css/Settings.css`): Styling for the preferences interface

## Usage

### Basic Usage
```jsx
import { getFilteredFormsData } from '../utils/dexPreferences';
import formsData from '../data/forms.json';

// Get filtered forms based on user preferences
const filteredForms = getFilteredFormsData(formsData);

// Use filteredForms instead of the original formsData
```

### In Dex Components
To apply preferences to your dex, you can:

1. **Import the utility function**:
```jsx
import { getFilteredFormsData } from '../utils/dexPreferences';
```

2. **Filter your forms data**:
```jsx
// Instead of using formsData directly
const filteredForms = getFilteredFormsData(formsData);

// Use filteredForms in your dex sections
const dexSections = [
  {
    key: "main",
    title: "Main Living Dex",
    getList: () => pokemonData
  },
  ...FORM_TYPES.map(type => ({
    key: type,
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Forms`,
    getList: () => filteredForms.filter(p => p.formType === type)
  }))
];
```

## How It Works

1. **User sets preferences** in Settings → Dex Preferences
2. **Preferences are saved** to server and localStorage
3. **Forms are filtered** using `getFilteredFormsData()` utility
4. **Filtered data is used** in dex components
5. **Page refresh required** to see changes (for now)

## Data Flow
1. User toggles a preference in the Settings page
2. Preference is immediately saved to localStorage for responsive UI
3. Preference is sent to the server via API
4. Server updates the user's profile in the database
5. When using forms data, call `getFilteredFormsData()` to get filtered results

## Storage
- **Server**: Stored in MongoDB user document under `dexPreferences` field
- **Local**: Cached in localStorage for offline access and performance
- **Default**: All form types are shown by default (true)

## Future Enhancements
- Real-time filtering without page refresh
- Per-generation preferences
- Custom form type categories
- Preference presets (e.g., "Minimal", "Complete", "Custom")
- Export/import preferences
- Share preferences with other users

## Notes
- Preferences are user-specific and stored per account
- Changes take effect after page refresh
- Preferences persist across sessions and devices
- The feature gracefully degrades if server is unavailable (uses localStorage)
- Use `getFilteredFormsData(formsData)` wherever you currently use `formsData` directly
