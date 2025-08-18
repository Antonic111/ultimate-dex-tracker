import { bannedWords, bannedSubstrings } from "./bannedTerms.js";

// Regexes for high-severity slurs with common obfuscations (symbols/spaces between letters)
const bannedRegexes = [
  // core 'nigg' with obfuscation (blocks prefixes like n!@@)
  /n[\W_]*(?:i|!|1|l)[\W_]*(?:g|9|@|6){2}(?![a-z])/iu,
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
  
  // Apply substitutions
  for (const [char, replacements] of Object.entries(substitutions)) {
    if (word.includes(char)) {
      for (const replacement of replacements) {
        variations.add(word.replace(new RegExp(char, 'g'), replacement));
      }
    }
  }
  
  return Array.from(variations);
}

// Check if text contains banned words or similar variations
export function validateContent(text, fieldType = 'general') {
  const config = FILTER_CONFIGS[fieldType] || FILTER_CONFIGS.general;
  const input = (text === null || text === undefined) ? '' : String(text);

  // Length validation
  if (input.length < config.minLength) {
    return { isValid: false, error: `${config.fieldName} must be at least ${config.minLength} characters long` };
  }
  
  if (input.length > config.maxLength) {
    return { isValid: false, error: `${config.fieldName} must be no more than ${config.maxLength} characters long` };
  }

  // Character validation
  if (config.allowedChars && !config.allowedChars.test(input)) {
    return { isValid: false, error: `${config.fieldName} contains invalid characters. ${config.charDescription}` };
  }

  // Bad word check
  if (config.checkBadWords) {
    const normalizedText = normalizeText(input);

    // -1- Regex match for obfuscated high-severity slurs on raw text
    for (const rx of bannedRegexes) {
      if (rx.test(String(text || ''))) {
        return { isValid: false, error: `${config.fieldName} contains inappropriate content` };
      }
    }

    // 0. Block known high-severity substrings even when embedded
    for (const sub of (bannedSubstrings || [])) {
      if (!sub) continue;
      const normSub = normalizeText(sub);
      if (normSub && normalizedText.includes(normSub)) {
        return { isValid: false, error: `${config.fieldName} contains inappropriate content` };
      }
    }
    
    for (const bannedWord of bannedWords) {
      const normalizedBanned = normalizeText(bannedWord);
      
      // Check for exact matches and similar variations
      const variations = generateWordVariations(normalizedBanned);
      
      for (const variation of variations) {
        if (normalizedText.includes(variation)) {
          return { isValid: false, error: `${config.fieldName} contains inappropriate content` };
        }
        
        // Check for similarity using Levenshtein distance
        const actualDistance = calculateDistance(normalizedText, variation);
        const maxDistance = Math.floor(variation.length * config.similarityThreshold);
        
        if (actualDistance <= maxDistance) {
          return { isValid: false, error: `${config.fieldName} contains inappropriate content` };
        }
      }
    }
  }

  return { isValid: true };
}

