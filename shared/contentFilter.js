import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
  DataSet,
  parseRawPattern
} from "obscenity";

// Build enhanced dataset containing englishDataset plus explicit slurs and variations
const customDataset = new DataSet().addAll(englishDataset);

const extraPatterns = [
  "|faggot|", "|faggots|", "|fag|", "|fags|",
  "|nigger|", "|niggers|", "|nigga|", "|niggas|",
  "|kike|", "|kikes|", "|spic|", "|spics|",
  "|chink|", "|chinks|", "|gook|", "|gooks|",
  "|tranny|", "|trannies|", "|wetback|", "|wetbacks|",
  "|retard|", "|retards|", "|retarded|", "|beaner|", "|beaners|"
];

for (const p of extraPatterns) {
  try {
    customDataset.addPhrase(phrase => phrase.addPattern(parseRawPattern(p)));
  } catch (e) {
    // Phrase already defined or handled
  }
}

// Initialize obscenity matcher with recommended transformers
const matcher = new RegExpMatcher({
  ...customDataset.build(),
  ...englishRecommendedTransformers
});

/**
 * Collapses sequences of single characters separated by whitespace (e.g. 'f  a  g  g  o  t' -> 'faggot')
 * @param {string} str
 * @returns {string}
 */
function collapseSpacedLetters(str) {
  return str.replace(/\b([a-zA-Z0-9])(?:\s+([a-zA-Z0-9]))+\b/g, (match) => match.replace(/\s+/g, ""));
}

/**
 * Checks if a given text contains profanity/obscenity using obscenity.
 * Handles bypasses such as character spacing, punctuation separators, and wildcard substitutions.
 * @param {string} rawText
 * @returns {boolean}
 */
export function containsProfanity(rawText) {
  if (!rawText || typeof rawText !== "string") return false;
  const text = rawText.trim();
  if (!text) return false;

  // 1. Direct obscenity check
  if (matcher.hasMatch(text)) return true;

  // 2. Check with collapsed spaced characters (catches 'f  a  g  g  o  t', 'n i g g e r', 'f   u   c   k')
  const collapsed = collapseSpacedLetters(text);
  if (collapsed !== text && matcher.hasMatch(collapsed)) return true;

  // 3. Clean punctuation / symbol delimiters between characters (catches 'f.a.g.g.o.t', 'f_a_g_g_o_t', 'f-a-g-g-o-t', 'f.u.c.k')
  const strippedDelimiters = text.replace(/([a-zA-Z0-9])[._\-\s]+(?=[a-zA-Z0-9])/g, "$1");
  if (strippedDelimiters !== text && matcher.hasMatch(strippedDelimiters)) return true;

  // 4. Clean all punctuation for short/single-token inputs (catches 'f.u.c.k', 's.h.i.t', 'b!t!c!h')
  const alphaNumOnly = text.replace(/[^a-zA-Z0-9]/g, "");
  if (alphaNumOnly.length >= 3 && matcher.hasMatch(alphaNumOnly)) return true;

  // 5. Check collapsed without any spaces
  const noSpaces = text.replace(/\s+/g, "");
  if (noSpaces.length >= 3 && matcher.hasMatch(noSpaces)) return true;

  // 6. Wildcard vowel substitutions for asterisks / hash / at symbols (catches 'b*tch', 'c*nt', 'sh*t', 'f*ck')
  if (/[*#@]/.test(text)) {
    const vowels = ["a", "e", "i", "o", "u"];
    for (const v of vowels) {
      const sub = text.replace(/[*#]/g, v);
      if (matcher.hasMatch(sub) || matcher.hasMatch(collapseSpacedLetters(sub))) {
        return true;
      }
    }
  }

  return false;
}

// Content filter configurations for user-defined text fields
export const FILTER_CONFIGS = {
  username: {
    minLength: 3,
    maxLength: 20,
    allowedChars: /^[a-zA-Z0-9 _\-.,~\*]+$/,
    charDescription: "Letters, numbers, spaces, and _ - . , ~ * allowed",
    checkBadWords: true,
    fieldName: "Username"
  },
  bio: {
    minLength: 0,
    maxLength: 250,
    allowedChars: null,
    charDescription: null,
    checkBadWords: true,
    fieldName: "Bio"
  },
  nickname: {
    minLength: 0,
    maxLength: 12,
    allowedChars: null,
    charDescription: null,
    checkBadWords: true,
    fieldName: "Nickname"
  },
  notes: {
    minLength: 0,
    maxLength: 200,
    allowedChars: null,
    charDescription: null,
    checkBadWords: true,
    fieldName: "Notes"
  },
  progressBar: {
    minLength: 1,
    maxLength: 30,
    allowedChars: null,
    charDescription: null,
    checkBadWords: true,
    fieldName: "Progress Bar Name"
  },
  general: {
    minLength: 0,
    maxLength: 1000,
    allowedChars: null,
    charDescription: null,
    checkBadWords: true,
    fieldName: "Text"
  }
};

/**
 * Validate content based on configuration type or custom field name.
 * @param {string} text - The input text to validate.
 * @param {string} configType - The configuration key or custom field label.
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateContent(text, configType = "general") {
  const config = FILTER_CONFIGS[configType] || {
    ...FILTER_CONFIGS.general,
    fieldName: typeof configType === "string" ? configType : "Text"
  };

  const input = (text === null || text === undefined) ? "" : String(text);

  // Check minimum length
  if (input.length < config.minLength) {
    return {
      isValid: false,
      error: `${config.fieldName} must be at least ${config.minLength} characters long`
    };
  }

  // Check maximum length
  if (input.length > config.maxLength) {
    return {
      isValid: false,
      error: `${config.fieldName} must be no more than ${config.maxLength} characters long`
    };
  }

  // Check character restrictions
  if (config.allowedChars && !config.allowedChars.test(input)) {
    return {
      isValid: false,
      error: `${config.fieldName} contains invalid characters. ${config.charDescription}`
    };
  }

  // Check for profanity / obscenity
  if (config.checkBadWords && containsProfanity(input)) {
    return {
      isValid: false,
      error: `${config.fieldName} contains inappropriate or restricted content`
    };
  }

  return { isValid: true, error: null };
}

/**
 * Legacy username validation helper
 * @param {string} username
 * @returns {string | false}
 */
export function isBadUsername(username) {
  const result = validateContent(username, "username");
  return result.isValid ? false : result.error;
}

/**
 * Get character count and remaining info for inputs
 * @param {string} text
 * @param {string} configType
 * @returns {{ current: number, remaining: number, max: number, isOverLimit: boolean, percentage: number }}
 */
export function getCharacterInfo(text, configType = "general") {
  const config = FILTER_CONFIGS[configType] || FILTER_CONFIGS.general;
  const current = (text || "").length;
  const remaining = config.maxLength - current;
  const isOverLimit = current > config.maxLength;

  return {
    current,
    remaining: Math.max(0, remaining),
    max: config.maxLength,
    isOverLimit,
    percentage: config.maxLength > 0 ? Math.round((current / config.maxLength) * 100) : 0
  };
}

/**
 * Real-time validation for input fields and forms
 * @param {string} text
 * @param {string} configType
 * @returns {{ isValid: boolean, warning: string | null, error: string | null, charInfo: object }}
 */
export function getRealTimeValidation(text, configType = "general") {
  const config = FILTER_CONFIGS[configType] || FILTER_CONFIGS.general;
  const input = (text === null || text === undefined) ? "" : String(text);
  const charInfo = getCharacterInfo(input, configType);

  // Don't show errors for empty text unless minLength > 0
  if (input.length === 0 && config.minLength === 0) {
    return {
      isValid: true,
      warning: null,
      error: null,
      charInfo
    };
  }

  const validation = validateContent(input, configType);

  // Show warning when approaching character limit
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
