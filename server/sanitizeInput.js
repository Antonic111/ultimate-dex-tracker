import DOMPurify from 'isomorphic-dompurify';

/**
 * Comprehensive input sanitization utility
 * Handles XSS prevention, length limits, and content validation
 */

// HTML sanitization options
const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [], // No HTML tags allowed
  ALLOWED_ATTR: [], // No attributes allowed
  KEEP_CONTENT: true, // Keep text content, remove tags
};

// Field-specific sanitization rules
export const SANITIZATION_RULES = {
  username: {
    maxLength: 15,
    minLength: 3,
    allowedChars: /^[a-zA-Z0-9_\-\.\,\~\* ]+$/,
    trim: true,
    normalize: true,
  },
  email: {
    maxLength: 254, // RFC 5321 limit
    minLength: 5,
    allowedChars: /^[a-zA-Z0-9@._\-+]+$/,
    trim: true,
    normalize: true,
    lowercase: true,
  },
  bio: {
    maxLength: 500,
    minLength: 0,
    allowedChars: /^[a-zA-Z0-9\s.,!?@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/~`]+$/,
    trim: true,
    normalize: true,
    allowHtml: false,
  },
  location: {
    maxLength: 100,
    minLength: 0,
    allowedChars: /^[a-zA-Z0-9\s.,\-'()]+$/,
    trim: true,
    normalize: true,
  },
  gender: {
    maxLength: 20,
    minLength: 0,
    allowedChars: /^[a-zA-Z\s\-]+$/,
    trim: true,
    normalize: true,
  },
  switchFriendCode: {
    maxLength: 20,
    minLength: 0,
    allowedChars: /^[a-zA-Z0-9\-]+$/,
    trim: true,
    normalize: true,
  },
  profileTrainer: {
    maxLength: 50,
    minLength: 0,
    allowedChars: /^[a-zA-Z0-9._\-]+$/,
    trim: true,
    normalize: true,
  },
  notes: {
    maxLength: 200,
    minLength: 0,
    allowedChars: /^[a-zA-Z0-9\s.,!?@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/~`]+$/,
    trim: true,
    normalize: true,
    allowHtml: false,
  },
  general: {
    maxLength: 1000,
    minLength: 0,
    allowedChars: /^[a-zA-Z0-9\s.,!?@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/~`]+$/,
    trim: true,
    normalize: true,
    allowHtml: false,
  }
};

/**
 * Sanitize input based on field type
 * @param {string} input - The input to sanitize
 * @param {string} fieldType - The type of field (username, email, bio, etc.)
 * @returns {Object} - { sanitized: string, isValid: boolean, error: string|null }
 */
export function sanitizeInput(input, fieldType = 'general') {
  if (!input || typeof input !== 'string') {
    return { sanitized: '', isValid: true, error: null };
  }

  const rules = SANITIZATION_RULES[fieldType] || SANITIZATION_RULES.general;
  let sanitized = input;

  // 1. Trim whitespace
  if (rules.trim) {
    sanitized = sanitized.trim();
  }

  // 2. Normalize unicode characters
  if (rules.normalize) {
    sanitized = sanitized.normalize('NFC');
  }

  // 3. Convert to lowercase if specified
  if (rules.lowercase) {
    sanitized = sanitized.toLowerCase();
  }

  // 4. Remove HTML/script tags (XSS prevention)
  if (!rules.allowHtml) {
    sanitized = DOMPurify.sanitize(sanitized, SANITIZE_OPTIONS);
  }

  // 5. Check length limits
  if (sanitized.length > rules.maxLength) {
    return {
      sanitized: sanitized.substring(0, rules.maxLength),
      isValid: false,
      error: `Input too long. Maximum ${rules.maxLength} characters allowed.`
    };
  }

  if (sanitized.length < rules.minLength) {
    return {
      sanitized,
      isValid: false,
      error: `Input too short. Minimum ${rules.minLength} characters required.`
    };
  }

  // 6. Check allowed characters
  if (rules.allowedChars && !rules.allowedChars.test(sanitized)) {
    return {
      sanitized,
      isValid: false,
      error: `Invalid characters detected. Only letters, numbers, and basic punctuation are allowed.`
    };
  }

  // 7. Additional security checks
  // Check for potential XSS attempts
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
    /<style/i,
    /<form/i,
    /<input/i,
    /<button/i,
    /<select/i,
    /<textarea/i,
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(sanitized)) {
      return {
        sanitized: sanitized.replace(pattern, ''),
        isValid: false,
        error: 'Potentially malicious content detected and removed.'
      };
    }
  }

  return {
    sanitized,
    isValid: true,
    error: null
  };
}

/**
 * Sanitize multiple fields at once
 * @param {Object} data - Object containing field data
 * @param {Object} fieldTypes - Object mapping field names to types
 * @returns {Object} - { sanitized: Object, isValid: boolean, errors: Object }
 */
export function sanitizeMultipleInputs(data, fieldTypes = {}) {
  const sanitized = {};
  const errors = {};
  let isValid = true;

  for (const [fieldName, value] of Object.entries(data)) {
    const fieldType = fieldTypes[fieldName] || 'general';
    const result = sanitizeInput(value, fieldType);
    
    sanitized[fieldName] = result.sanitized;
    
    if (!result.isValid) {
      errors[fieldName] = result.error;
      isValid = false;
    }
  }

  return {
    sanitized,
    isValid,
    errors: Object.keys(errors).length > 0 ? errors : null
  };
}

/**
 * Validate and sanitize user profile data
 * @param {Object} profileData - The profile data to sanitize
 * @returns {Object} - Sanitized profile data with validation results
 */
export function sanitizeProfileData(profileData) {
  const sanitized = {};
  const errors = {};
  let isValid = true;

  for (const [fieldName, value] of Object.entries(profileData)) {
    // Handle arrays (favoriteGames, favoritePokemon)
    if (Array.isArray(value)) {
      sanitized[fieldName] = value.map(item => {
        if (typeof item === 'string') {
          const result = sanitizeInput(item, 'general');
          return result.sanitized;
        }
        return item;
      });
    }
    // Handle strings
    else if (typeof value === 'string') {
      let fieldType = 'general';
      if (fieldName === 'bio') fieldType = 'bio';
      else if (fieldName === 'location') fieldType = 'location';
      else if (fieldName === 'gender') fieldType = 'gender';
      else if (fieldName === 'switchFriendCode') fieldType = 'switchFriendCode';
      else if (fieldName === 'profileTrainer') fieldType = 'profileTrainer';
      
      const result = sanitizeInput(value, fieldType);
      sanitized[fieldName] = result.sanitized;
      
      if (!result.isValid) {
        errors[fieldName] = result.error;
        isValid = false;
      }
    }
    // Handle other types (pass through)
    else {
      sanitized[fieldName] = value;
    }
  }

  return {
    sanitized,
    isValid,
    errors: Object.keys(errors).length > 0 ? errors : null
  };
}

/**
 * Validate and sanitize caught Pokemon entry data
 * @param {Object} entryData - The entry data to sanitize
 * @returns {Object} - Sanitized entry data with validation results
 */
export function sanitizeEntryData(entryData) {
  const fieldTypes = {
    ball: 'general',
    mark: 'general',
    method: 'general',
    game: 'general',
    notes: 'notes',
    date: 'general',
  };

  return sanitizeMultipleInputs(entryData, fieldTypes);
}
