# Content Filter System

A comprehensive, reusable content filtering system for text inputs that provides real-time validation, bad word detection, and character limits.

## Features

- **Bad Word Detection**: Catches inappropriate content with fuzzy matching
- **Character Limits**: Configurable min/max lengths for different field types
- **Real-time Validation**: Instant feedback as users type
- **Character Restrictions**: Optional character set limitations
- **Debounced Validation**: Performance-optimized with configurable delays
- **Reusable Components**: Drop-in replacement for any text input
- **Server-side Validation**: Consistent validation on both client and server

## Quick Start

### 1. Basic Usage

```jsx
import ContentFilterInput from '../components/Shared/ContentFilterInput';

<ContentFilterInput
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  configType="username"
  placeholder="Enter username"
/>
```

### 2. With Validation Callback

```jsx
<ContentFilterInput
  value={bio}
  onChange={(e) => setBio(e.target.value)}
  onValidationChange={(validation) => {
    console.log('Is valid:', validation.isValid);
    console.log('Error:', validation.error);
    console.log('Warning:', validation.warning);
  }}
  configType="bio"
  showCharacterCount={true}
  showRealTimeValidation={true}
/>
```

### 3. Using the Hook

```jsx
import { useContentFilter } from '../components/Shared/useContentFilter';

const { validation, handleChange, isContentValid } = useContentFilter('username');

const handleSubmit = () => {
  if (isContentValid(username)) {
    // Submit form
  }
};
```

## Configuration Types

### Username
- **Min Length**: 3 characters
- **Max Length**: 20 characters
- **Character Restrictions**: Letters, numbers, spaces, and `_ - . , ~ *`
- **Bad Word Check**: Yes (20% similarity threshold)

### Bio
- **Min Length**: 0 characters
- **Max Length**: 500 characters
- **Character Restrictions**: None
- **Bad Word Check**: Yes (30% similarity threshold)

### Notes
- **Min Length**: 0 characters
- **Max Length**: 1000 characters
- **Character Restrictions**: None
- **Bad Word Check**: Yes (30% similarity threshold)

### General
- **Min Length**: 0 characters
- **Max Length**: 1000 characters
- **Character Restrictions**: None
- **Bad Word Check**: Yes (25% similarity threshold)

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | string | 'text' | Input type ('text' or 'textarea') |
| `value` | string | '' | Current input value |
| `onChange` | function | - | Change handler function |
| `onValidationChange` | function | - | Validation state change callback |
| `configType` | string | 'general' | Validation configuration type |
| `placeholder` | string | '' | Input placeholder text |
| `className` | string | '' | Additional CSS classes |
| `disabled` | boolean | false | Whether input is disabled |
| `required` | boolean | false | Whether input is required |
| `showCharacterCount` | boolean | true | Show character count display |
| `showRealTimeValidation` | boolean | true | Enable real-time validation |
| `debounceMs` | number | 300 | Validation debounce delay |

## Validation Object

The validation object returned by `onValidationChange` contains:

```javascript
{
  isValid: boolean,           // Whether content passes all validation
  error: string | null,       // Error message if validation fails
  warning: string | null,     // Warning message (e.g., approaching limit)
  charInfo: {                 // Character count information
    current: number,          // Current character count
    remaining: number,        // Characters remaining
    max: number,             // Maximum allowed characters
    isOverLimit: boolean,    // Whether over character limit
    percentage: number       // Percentage of limit used
  }
}
```

## Server-side Usage

### Import and Use

```javascript
import { validateContent } from '../../shared/contentFilter.js';

// Validate username
const usernameValidation = validateContent(username, 'username');
if (!usernameValidation.isValid) {
  return res.status(400).json({ error: usernameValidation.error });
}

// Validate bio
const bioValidation = validateContent(bio, 'bio');
if (!bioValidation.isValid) {
  return res.status(400).json({ error: bioValidation.error });
}
```

### Available Functions

- `validateContent(text, configType)`: Full validation with error messages
- `getRealTimeValidation(text, configType)`: Real-time validation with warnings
- `getCharacterInfo(text, configType)`: Character count information
- `isBadUsername(username)`: Legacy function for backward compatibility

## Customization

### Adding New Configuration Types

```javascript
// In shared/contentFilter.js
export const FILTER_CONFIGS = {
  // ... existing configs
  customField: {
    minLength: 5,
    maxLength: 200,
    allowedChars: /^[a-zA-Z0-9\s]+$/, // Optional
    charDescription: "Letters, numbers, and spaces only",
    checkBadWords: true,
    similarityThreshold: 0.25,
    fieldName: "Custom Field"
  }
};
```

### Modifying Bad Word List

Edit `shared/bannedTerms.js` to add or remove words from the filter list.

### Adjusting Similarity Thresholds

Lower thresholds (e.g., 0.1) make the filter more strict, higher thresholds (e.g., 0.4) make it more lenient.

## Migration from Old System

### Before (Old System)
```javascript
import { isBadUsername } from "../../shared/validateUsername";

if (isBadUsername(username)) {
  showMessage("❌ Inappropriate or restricted username", "error");
  return;
}
```

### After (New System)
```javascript
import { validateContent } from "../../shared/contentFilter";

const usernameValidation = validateContent(username, 'username');
if (!usernameValidation.isValid) {
  showMessage(`❌ ${usernameValidation.error}`, "error");
  return;
}
```

## Performance Considerations

- Real-time validation is debounced by default (300ms)
- Bad word detection uses optimized Levenshtein distance
- Character count updates are immediate for better UX
- Validation can be disabled for performance-critical scenarios

## Browser Support

- Modern browsers with ES6+ support
- Responsive design for mobile devices
- Dark theme support via CSS media queries
- Graceful degradation for older browsers
