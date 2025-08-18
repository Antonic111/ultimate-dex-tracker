import { bannedWords, bannedSubstrings } from "./bannedTerms.js";

// Regexes for high-severity slurs with common obfuscations (symbols/spaces between letters)
const bannedRegexes = [
  // nigger variants with obfuscation: i ~ i/!/1/l, g ~ g/9/@/6, e ~ e/3
  /n[\W_]*(?:i|!|1|l)[\W_]*(?:g|9|@|6){2}[\W_]*(?:e|3)[\W_]*r/iu,
  // nigga variants
  /n[\W_]*(?:i|!|1|l)[\W_]*(?:g|9|@|6){2}[\W_]*a+/iu
];

// Temporary fix: disable similarity checking until import issue is resolved
const calculateDistance = (a, b) => {
  // Simple fallback distance calculation
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

// Content filter configuration for different field types
export const FILTER_CONFIGS = {
  username: {
    minLength: 3,
    maxLength: 20,
    allowedChars: /^[a-zA-Z0-9 _\-.,~\*]+$/,
    charDescription: "Letters, numbers, spaces, and _ - . , ~ * allowed",
    checkBadWords: true,
    similarityThreshold: 0.15, // Tighter threshold for usernames
    fieldName: "Username"
  },
  bio: {
    minLength: 0,
    maxLength: 150,
    allowedChars: null, // No character restrictions for bio
    charDescription: null,
    checkBadWords: true,
    similarityThreshold: 0.2, // Tighter threshold for bio
    fieldName: "Bio"
  },
  notes: {
    minLength: 0,
    maxLength: 200,
    allowedChars: null, // No character restrictions for notes
    charDescription: null,
    checkBadWords: true,
    similarityThreshold: 0.2, // Tighter threshold for notes
    fieldName: "Notes"
  },
  progressBar: {
    minLength: 1,
    maxLength: 30,
    allowedChars: null, // No character restrictions for progress bar names
    charDescription: null,
    checkBadWords: true,
    similarityThreshold: 0.2, // Standard threshold for progress bar names
    fieldName: "Progress Bar Name"
  },
  general: {
    minLength: 0,
    maxLength: 1000,
    allowedChars: null,
    charDescription: null,
    checkBadWords: true,
    similarityThreshold: 0.2, // Tighter threshold for general text
    fieldName: "Text"
  }
};

// Advanced text normalization to catch sophisticated obfuscation
function normalizeText(text) {
  return text
    .toLowerCase()
    // Common character substitutions (only actual obfuscation, not legitimate letters)
    .replace(/[@4]/g, "a")
    .replace(/[!1]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[5\$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[0]/g, "o")
    .replace(/[8]/g, "b")
    .replace(/[6]/g, "g")
    .replace(/[2]/g, "z")
    .replace(/[9]/g, "g")
    // Remove only obvious obfuscation characters, not legitimate letters
    .replace(/[^ a-z0-9]/g, "")
    // Normalize multiple spaces to single space
    .replace(/\s+/g, " ")
    // Normalize repeated characters if they appear 3+ times (like fuuuuck -> fuck, gggggggggggggggg -> g)
    .replace(/(.)\1{2,}/g, "$1")
    .trim();
}

// Generate targeted variations of a word for detection (less aggressive)
function generateWordVariations(word) {
  const variations = new Set();
  
  // Original word
  variations.add(word);
  
  // Add spaces between every character (for obvious bypass attempts)
  const spaced = word.split('').join(' ');
  variations.add(spaced);
  
  // Mixed case variations
  variations.add(word.toUpperCase());
  variations.add(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  
  // Common character substitutions (only the most obvious ones)
  const substitutions = {
    'a': ['@', '4'],
    'i': ['!', '1'],
    'e': ['3'],
    's': ['5', '$'],
    't': ['7'],
    'o': ['0']
  };
  
  // Generate substitution variations
  for (const [char, subs] of Object.entries(substitutions)) {
    if (word.includes(char)) {
      for (const sub of subs) {
        variations.add(word.replace(new RegExp(char, 'g'), sub));
      }
    }
  }
  
  return Array.from(variations);
}

// Check if text contains a banned word as a complete word (not substring)
function containsBannedWordAsCompleteWord(text, bannedWord) {
  // Split text into words and check each word
  const words = text.split(/\s+/);
  
  for (const word of words) {
    // Only check for exact word matches - no substring matching
    if (word === bannedWord) {
      return true;
    }
  }
  
  return false;
}

// Advanced banned word detection (more intelligent)
function containsBannedWords(text, similarityThreshold = 0.2) {
  const normalized = normalizeText(text);

  // -1- Regex match for obfuscated high-severity slurs on raw text (case/Unicode-insensitive)
  for (const rx of bannedRegexes) {
    if (rx.test(String(text || ''))) return true;
  }
  
  // 0. Block known high-severity substrings even when embedded
  for (const sub of (bannedSubstrings || [])) {
    if (!sub) continue;
    const normSub = normalizeText(sub);
    if (normSub && normalized.includes(normSub)) return true;
  }

  // Check each banned word
  for (const bannedWord of bannedWords) {
    // Skip very short banned words that could cause false positives
    if (bannedWord.length < 3) continue;
    
    // 1. Check for complete word matches (most important)
    if (containsBannedWordAsCompleteWord(normalized, bannedWord)) {
      return true;
    }
    
    // 2. Check for obvious spaced variations (like "f a g g o t")
    const spaced = bannedWord.split('').join(' ');
    if (containsBannedWordAsCompleteWord(normalized, spaced)) {
      return true;
    }
    
    // 3. Check for character substitution variations (only as complete words)
    const variations = generateWordVariations(bannedWord);
    for (const variation of variations) {
      if (containsBannedWordAsCompleteWord(normalized, variation)) {
        return true;
      }
    }
    
    // 4. Advanced pattern matching for obvious spaced words (more targeted)
    if (detectObviousSpacedPattern(normalized, bannedWord)) {
      return true;
    }
    
    // 5. Similarity check using Levenshtein distance (as fallback, but more conservative)
    const maxDistance = Math.max(1, Math.floor(bannedWord.length * similarityThreshold));
    const actualDistance = calculateDistance(normalized, bannedWord);
    
    // Make the Levenshtein check more conservative to avoid false positives
    // Only block if the distance is very small (1) and the words are very similar in length
    if (actualDistance <= 1 && Math.abs(normalized.length - bannedWord.length) <= 1) {
      // Additional check: only block if the normalized text doesn't contain the banned word as a substring
      // This prevents "falling" from being blocked due to similarity to "fellatio"
      if (!normalized.includes(bannedWord) && !bannedWord.includes(normalized)) {
        return true;
      }
    }
  }
  
  return false;
}

// Detect obvious spaced patterns like "f a g g o t" (more targeted)
function detectObviousSpacedPattern(text, targetWord) {
  // Only check for patterns with spaces between every character (obvious bypass)
  if (targetWord.length < 4) return false; // Skip short words
  
  // Check for the exact spaced pattern as a complete word
  const spacedPattern = targetWord.split('').join(' ');
  if (containsBannedWordAsCompleteWord(text, spacedPattern)) {
    return true;
  }
  
  // Check if removing all spaces reveals the banned word
  const noSpaces = text.replace(/\s/g, '');
  if (containsBannedWordAsCompleteWord(noSpaces, targetWord)) {
    return true;
  }
  
  // NEW: Check for patterns with selective spacing (like "ni g er" for "nigger")
  // This catches cases where some characters are spaced out to bypass the filter
  const textWords = text.split(/\s+/);
  if (textWords.length >= 2) {
    // Try to reconstruct the original word by combining adjacent words
    for (let i = 0; i < textWords.length - 1; i++) {
      const combined = textWords[i] + textWords[i + 1];
      if (combined === targetWord) {
        return true;
      }
      // Also check with the next word if there are 3+ words
      if (i < textWords.length - 2) {
        const combined3 = textWords[i] + textWords[i + 1] + textWords[i + 2];
        if (combined3 === targetWord) {
          return true;
        }
      }
    }
    
    // NEW: Check all possible combinations of words (not just adjacent)
    // This catches "ni g er" -> "nigger" by combining all words
    if (textWords.length >= 3) {
      const allCombined = textWords.join('');
      if (allCombined === targetWord) {
        return true;
      }
    }
    
    // ENHANCED: Check for sophisticated bypass attempts like "ni ggggggggggg er"
    // This catches cases where repeated characters are used to bypass the filter
    if (textWords.length >= 3) {
      // Check if the first and last words could form the start and end of the banned word
      const firstWord = textWords[0];
      const lastWord = textWords[textWords.length - 1];
      
      // Check if combining first and last words could match the banned word
      const combinedFirstLast = firstWord + lastWord;
      if (combinedFirstLast === targetWord) {
        return true;
      }
      
      // Check if the banned word starts with the first word and ends with the last word
      if (targetWord.startsWith(firstWord) && targetWord.endsWith(lastWord)) {
        // This is likely a bypass attempt - check if the middle words could form the missing part
        const middleWords = textWords.slice(1, -1);
        const middleCombined = middleWords.join('');
        const expectedMiddle = targetWord.substring(firstWord.length, targetWord.length - lastWord.length);
        
        // If the middle words combined match the expected middle part, this is a bypass
        if (middleCombined === expectedMiddle || 
            (middleCombined.length > 0 && expectedMiddle.includes(middleCombined)) ||
            (expectedMiddle.length > 0 && middleCombined.includes(expectedMiddle))) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Validate content based on configuration
export function validateContent(text, configType = 'general') {
  const config = FILTER_CONFIGS[configType] || FILTER_CONFIGS.general;
  
  // Check length limits
  if (text.length < config.minLength) {
    return {
      isValid: false,
      error: `${config.fieldName} must be at least ${config.minLength} characters long`
    };
  }
  
  if (text.length > config.maxLength) {
    return {
      isValid: false,
      error: `${config.fieldName} must be no more than ${config.maxLength} characters long`
    };
  }
  
  // Check character restrictions
  if (config.allowedChars && !config.allowedChars.test(text)) {
    return {
      isValid: false,
      error: `${config.fieldName} contains invalid characters. ${config.charDescription}`
    };
  }
  
  // Check for banned words
  if (config.checkBadWords && containsBannedWords(text, config.similarityThreshold)) {
    return {
      isValid: false,
      error: `${config.fieldName} contains inappropriate or restricted content`
    };
  }
  
  return { isValid: true, error: null };
}

// Legacy function for backward compatibility
export function isBadUsername(username) {
  const result = validateContent(username, 'username');
  return result.isValid ? false : result.error;
}

// Get character count and remaining characters
export function getCharacterInfo(text, configType = 'general') {
  const config = FILTER_CONFIGS[configType] || FILTER_CONFIGS.general;
  const current = text.length;
  const remaining = config.maxLength - current;
  const isOverLimit = current > config.maxLength;
  
  return {
    current,
    remaining: Math.max(0, remaining),
    max: config.maxLength,
    isOverLimit,
    percentage: Math.round((current / config.maxLength) * 100)
  };
}

// Real-time validation for input fields
export function getRealTimeValidation(text, configType = 'general') {
  const config = FILTER_CONFIGS[configType] || FILTER_CONFIGS.general;
  const charInfo = getCharacterInfo(text, configType);
  
  // Don't show errors for empty text unless it's required
  if (text.length === 0 && config.minLength === 0) {
    return {
      isValid: true,
      warning: null,
      error: null,
      charInfo
    };
  }
  
  const validation = validateContent(text, configType);
  
  // Show warning when approaching limit
  let warning = null;
  if (charInfo.percentage >= 90 && charInfo.percentage < 100) {
    warning = `Approaching character limit (${charInfo.remaining} remaining)`;
  }
  
  return {
    isValid: validation.isValid,
    warning,
    error: validation.error,
    charInfo
  };
}
