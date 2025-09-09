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

// Whitelist of legitimate words that should never be blocked
const LEGITIMATE_WORDS = new Set([
  // Common male names that could be false flagged
  "jack", "jacks", "jackson", "jackie", "jacky",
  "dick", "dicks", "dickens", "dickinson", "dickie", "dicky",
  "richard", "richards", "rick", "ricky", "rickie",
  "william", "williams", "will", "willy", "bill", "billy", "billie",
  "robert", "roberts", "rob", "robbie", "bobby", "bob", "bobbie",
  "michael", "michaels", "mike", "mikey", "mick", "mickey",
  "david", "davids", "dave", "davey", "davy",
  "james", "jameses", "jim", "jimmy", "jimbo", "jamie",
  "john", "johns", "johnny", "jon", "jonny", "jonnie",
  "thomas", "thomases", "tom", "tommy", "tommie",
  "charles", "charleses", "charlie", "chuck", "chucky",
  "daniel", "daniels", "dan", "danny", "dannie",
  "matthew", "matthews", "matt", "matty", "mattie",
  "anthony", "anthonys", "tony", "tonnie",
  "mark", "marks", "markie", "marky",
  "donald", "donalds", "don", "donnie", "donny",
  "steven", "stevens", "steve", "stevie",
  "paul", "pauls", "paulie", "pauly",
  "andrew", "andrews", "andy", "andie",
  "joshua", "joshuas", "josh", "joshy",
  "kenneth", "kenneths", "ken", "kenny", "kennie",
  "kevin", "kevins", "kev", "kevie",
  "brian", "brians", "bry", "brye",
  "george", "georges", "georgie",
  "edward", "edwards", "ed", "eddie", "eddy", "ted", "teddy",
  "ronald", "ronalds", "ron", "ronnie", "ronny",
  "timothy", "timothys", "tim", "timmy", "timmie",
  "jason", "jasons", "jase", "jasey",
  "jeffrey", "jeffreys", "jeff", "jeffie", "jeffy",
  "ryan", "ryans", "rye",
  "jacob", "jacobs", "jake", "jakey",
  "gary", "garys", "garry",
  "nicholas", "nicholases", "nick", "nickie", "nicky",
  "eric", "erics", "rickie", "ricky",
  "jonathan", "jonathans", "jon", "jonny", "jonnie",
  "stephen", "stephens", "steve", "stevie",
  "larry", "larries",
  "justin", "justins", "justy",
  "scott", "scotts", "scotty", "scottie",
  "brandon", "brandons", "brandy",
  "benjamin", "benjamins", "ben", "benny", "bennie",
  "samuel", "samuels", "sam", "sammy", "sammie",
  "gregory", "gregorys", "greg", "greggie",
  "alexander", "alexanders", "alex", "alexie", "alexy",
  "patrick", "patricks", "pat", "patty", "pattie",
  "frank", "franks", "frankie", "franky",
  "raymond", "raymonds", "ray", "rayie",
  
  // Common female names that could be false flagged
  "mary", "marys", "marie", "maria",
  "patricia", "patricias", "pat", "patty", "pattie", "tricia", "trish",
  "jennifer", "jennifers", "jen", "jenny", "jennie",
  "linda", "lindas", "lindy", "lindie",
  "elizabeth", "elizabeths", "liz", "lizzie", "beth", "betty", "betsy",
  "barbara", "barbaras", "barb", "barbie",
  "susan", "susans", "sue", "suzie",
  "jessica", "jessicas", "jess", "jessie", "jessy",
  "sarah", "sarahs", "sara", "sarie",
  "karen", "karens", "kari", "karie",
  "nancy", "nancys", "nanci", "nancie",
  "lisa", "lisas", "lise", "lisey",
  "betty", "bettys", "bettie",
  "helen", "helens", "helene",
  "sandra", "sandras", "sandy", "sandie",
  "donna", "donnas", "donnie", "donny",
  "carol", "carols", "carolie", "caroly",
  "ruth", "ruths", "ruthie",
  "sharon", "sharons", "shari", "sharie",
  "michelle", "michelles", "mich", "michie",
  "laura", "lauras", "laurie", "laury",
  "kimberly", "kimberlys", "kim", "kimmy", "kimmie",
  "deborah", "deborahs", "debbie",
  "dorothy", "dorothys", "dottie", "dotty",
  
  // Other legitimate words that could be false flagged
  "chalk", "chalkboard", "chalky",
  "monkey", "monkeying", "monkeyshines", "monkeywrench",
  "falling", "balloon"
]);

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
    // Enhanced character substitutions (catch more bypass attempts)
    .replace(/[@4]/g, "a")
    .replace(/[!1|/\\]/g, "i")  // Added | and \ for i
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
    // Normalize repeated characters if they appear 3+ times (like fuuuuck -> fuuck, coooon -> coon)
    .replace(/(.)\1{2,}/g, "$1$1")
    .trim();
}

// Enhanced text normalization that preserves some special characters for better detection
function normalizeTextForDetection(text) {
  return text
    .toLowerCase()
    // Enhanced character substitutions (catch more bypass attempts)
    .replace(/[@4]/g, "a")
    .replace(/[!1|/\\]/g, "i")  // Added | and \ for i
    .replace(/[3]/g, "e")
    .replace(/[5\$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[0]/g, "o")
    .replace(/[8]/g, "b")
    .replace(/[6]/g, "g")
    .replace(/[2]/g, "z")
    .replace(/[9]/g, "g")
    // Keep some special characters for pattern detection
    .replace(/[^ a-z0-9|/\\\-_]/g, "")
    // Normalize multiple spaces to single space
    .replace(/\s+/g, " ")
    // Normalize repeated characters if they appear 3+ times
    .replace(/(.)\1{2,}/g, "$1$1")
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
    // Skip legitimate words that should never be blocked
    if (LEGITIMATE_WORDS.has(word)) {
      continue;
    }
    
    // Only check for exact word matches - no substring matching
    if (word === bannedWord) {
      return true;
    }
  }
  
  return false;
}

// Check for repeated character bypasses (like "coooon" containing "coon")
function checkRepeatedCharacterBypass(text, bannedWords) {
  const lowerText = text.toLowerCase();
  
  for (const bannedWord of bannedWords) {
    if (bannedWord.length < 3) continue; // Skip very short words
    
    // Check for patterns like "coooon" where repeated characters are used to bypass
    // We'll check if removing repeated characters reveals the banned word
    const cleaned = lowerText.replace(/(.)\1+/g, "$1");
    const wordBoundaryRx = new RegExp(`\\b${bannedWord}\\b`);
    if (wordBoundaryRx.test(cleaned)) {
      // Additional check: only block if this looks like a bypass attempt
      // Don't block legitimate words like "coonhound" that contain the banned word
      
      // If the cleaned text is exactly the banned word, it's definitely a bypass
      if (cleaned === bannedWord) {
        return true;
      }
      
      // If we get here, it's likely a bypass attempt
      return true;
    }
    
    // Also check the original text for the banned word (catches cases where normalization works)
    if (wordBoundaryRx.test(lowerText)) {
      // Same logic as above for legitimate words
      if (lowerText === bannedWord) {
        return true;
      }
      return true;
    }
  }
  return false;
}

// Check for concatenated banned words (like "faggotfaggot")
function checkConcatenatedBannedWords(normalized, bannedWords) {
  for (const bannedWord of bannedWords) {
    if (bannedWord.length < 3) continue; // Skip very short words
    // Only flag obvious concatenations like "wordword"
    const repeated = bannedWord + bannedWord;
    if (normalized.includes(repeated)) {
      return true;
    }
  }
  return false;
}

// Advanced banned word detection (more intelligent)
function containsBannedWords(text, similarityThreshold = 0.2) {
  const normalized = normalizeText(text);
  const detectionNormalized = normalizeTextForDetection(text);

  // -1- Regex match for obfuscated high-severity slurs on raw text (case/Unicode-insensitive)
  for (const rx of bannedRegexes) {
    if (rx.test(String(text || ''))) return true;
  }

  // Enhanced regex patterns for common bypass attempts
  const enhancedBannedRegexes = [
    // Catch "n|gger", "n/gger", "n\gger" patterns
    /n[|/\\]gg[ae]r?/gi,
    // Catch "n!gger", "n1gger" patterns  
    /n[!1]gg[ae]r?/gi,
    // Catch "n!gg@r", "n1gg4r" patterns
    /n[!1]gg[@4]r/gi,
    // Catch "f@gg0t", "f4gg0t" patterns
    /f[@4]gg[0o]t/gi,
    // Catch "f!gg0t", "f1gg0t" patterns
    /f[!1]gg[0o]t/gi,
    // Catch "ch@lk m0nkey" patterns
    /ch[@4]lk\s*m[0o]nkey/gi,
    // Catch "ch!lk m0nkey" patterns
    /ch[!1]lk\s*m[0o]nkey/gi
  ];

  for (const rx of enhancedBannedRegexes) {
    if (rx.test(String(text || ''))) return true;
  }

  // Explicit phonetic bypass for n-word like "knee grow" variants
  const lowerRaw = String(text || '').toLowerCase();
  if (/\bknees?\s*grow\b/.test(lowerRaw) || /\bgrow\s*knees?\b/.test(lowerRaw)) {
    return true;
  }
  
  // Check for "chalk monkey" and similar combinations
  const chalkMonkeyPatterns = [
    /\bchalk\s+monkey\b/gi,
    /\bch@lk\s+monkey\b/gi,
    /\bch!lk\s+monkey\b/gi,
    /\bchalk\s+m0nkey\b/gi,
    /\bch@lk\s+m0nkey\b/gi,
    /\bch!lk\s+m0nkey\b/gi
  ];
  
  for (const pattern of chalkMonkeyPatterns) {
    if (pattern.test(String(text || ''))) return true;
  }
  
  // 0. Check for repeated character bypasses (like "coooon" containing "coon")
  if (checkRepeatedCharacterBypass(text, bannedWords)) {
    return true;
  }
  
  // 1. Block known high-severity substrings even when embedded (use normalized text)
  // BUT be more intelligent to avoid false positives on legitimate content
  for (const sub of (bannedSubstrings || [])) {
    if (!sub) continue;
    const normSub = normalizeText(sub);
    if (normSub && normalized.includes(normSub)) {
      // Additional check: only block if this looks like a bypass attempt
      // Don't block legitimate words that happen to contain the substring
      
      // Check if the substring appears as a complete word (more likely to be intentional)
      if (containsBannedWordAsCompleteWord(normalized, normSub)) {
        return true;
      }
      
      // Check if the substring appears in a context that suggests bypass (like spaced out)
      const spacedSub = normSub.split('').join(' ');
      if (containsBannedWordAsCompleteWord(normalized, spacedSub)) {
        return true;
      }
      
      // For very short substrings (like "nigg"), be more careful to avoid false positives
      if (normSub.length < 4) {
        // Only block if it appears in a context that suggests it's part of a bypass
        // This prevents "chalk" from blocking legitimate content
        continue;
      }
      
      // For longer substrings, check if they appear in a suspicious context
      // This catches cases like "fuck" embedded in longer words
      const words = normalized.split(/\s+/);
      for (const word of words) {
        if (word.includes(normSub) && word !== normSub) {
          // Check if this looks like a bypass attempt (word is close to the banned substring)
          const distance = calculateDistance(word, normSub);
          if (distance <= 2 && word.length <= normSub.length + 3) {
            return true;
          }
        }
      }
    }
  }

  // 1. Check for concatenated banned words (like "faggotfaggot")
  if (checkConcatenatedBannedWords(normalized, bannedWords)) {
    return true;
  }

  // 2. Do NOT block just because a banned word appears as a substring inside another word
  //    Only check complete word matches below

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
    
    // 4. Enhanced pattern matching for sophisticated bypasses
    if (detectEnhancedSpacedPattern(detectionNormalized, bannedWord)) {
      return true;
    }
    
    // 5. Check for mixed character bypasses (like "n|gger" -> "nigger")
    if (detectMixedCharacterBypass(detectionNormalized, bannedWord)) {
      return true;
    }
    
    // 6. Similarity check using Levenshtein distance (as fallback, but more conservative)
    const maxDistance = Math.max(1, Math.floor(bannedWord.length * similarityThreshold));
    const actualDistance = calculateDistance(normalized, bannedWord);
    
    // Skip similarity check for legitimate words
    if (LEGITIMATE_WORDS.has(normalized)) {
      continue;
    }
    
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

// Enhanced spaced pattern detection for sophisticated bypasses
function detectEnhancedSpacedPattern(text, targetWord) {
  // First, use the original function
  if (detectObviousSpacedPattern(text, targetWord)) {
    return true;
  }
  
  // NEW: Check for patterns with special characters like "n|gger" -> "nigger"
  const specialCharPatterns = [
    // Replace common bypass characters
    { from: /[|/\\]/g, to: 'i' },
    { from: /[@4]/g, to: 'a' },
    { from: /[!1]/g, to: 'i' },
    { from: /[3]/g, to: 'e' },
    { from: /[0]/g, to: 'o' },
    { from: /[5\$]/g, to: 's' },
    { from: /[7]/g, to: 't' },
    { from: /[8]/g, to: 'b' },
    { from: /[6]/g, to: 'g' },
    { from: /[2]/g, to: 'z' },
    { from: /[9]/g, to: 'g' }
  ];
  
  // Try different character substitution combinations
  let testText = text;
  for (const pattern of specialCharPatterns) {
    testText = testText.replace(pattern.from, pattern.to);
  }
  
  // Check if the substituted text contains the banned word
  if (containsBannedWordAsCompleteWord(testText, targetWord)) {
    return true;
  }
  
  // Check for mixed patterns like "n| g g e r" (special chars + spacing)
  const mixedPattern = targetWord.split('').map(char => {
    if (char === 'i') return '[i|!1/\\\\]';
    if (char === 'a') return '[a@4]';
    if (char === 'e') return '[e3]';
    if (char === 'o') return '[o0]';
    if (char === 's') return '[s5\$]';
    if (char === 't') return '[t7]';
    if (char === 'b') return '[b8]';
    if (char === 'g') return '[g69]';
    if (char === 'z') return '[z2]';
    return char;
  }).join('\\s*');
  
  const mixedRegex = new RegExp(`\\b${mixedPattern}\\b`, 'gi');
  if (mixedRegex.test(text)) {
    return true;
  }
  
  return false;
}

// Detect mixed character bypasses (like "n|gger" -> "nigger")
function detectMixedCharacterBypass(text, targetWord) {
  // Check for patterns where special characters are used to bypass
  const bypassPatterns = [
    // Common bypass character mappings
    { char: 'i', bypass: /[|/\\!1]/g },
    { char: 'a', bypass: /[@4]/g },
    { char: 'e', bypass: /[3]/g },
    { char: 'o', bypass: /[0]/g },
    { char: 's', bypass: /[5\$]/g },
    { char: 't', bypass: /[7]/g },
    { char: 'b', bypass: /[8]/g },
    { char: 'g', bypass: /[69]/g },
    { char: 'z', bypass: /[2]/g }
  ];
  
  // Try to reconstruct the original word by replacing bypass characters
  let reconstructed = text;
  for (const pattern of bypassPatterns) {
    reconstructed = reconstructed.replace(pattern.bypass, pattern.char);
  }
  
  // Check if the reconstructed text contains the banned word
  if (containsBannedWordAsCompleteWord(reconstructed, targetWord)) {
    return true;
  }
  
  // Check for partial bypasses (some characters substituted, some not)
  const partialPatterns = [];
  for (const pattern of bypassPatterns) {
    if (targetWord.includes(pattern.char)) {
      // Create pattern that allows both the original character and bypass characters
      const charPattern = `[${pattern.char}${pattern.bypass.source.replace(/[\[\]/]/g, '')}]`;
      partialPatterns.push({ char: pattern.char, pattern: charPattern });
    }
  }
  
  // Build a flexible pattern for the target word
  if (partialPatterns.length > 0) {
    let flexiblePattern = targetWord;
    for (const { char, pattern } of partialPatterns) {
      flexiblePattern = flexiblePattern.replace(new RegExp(char, 'g'), pattern);
    }
    
    const flexibleRegex = new RegExp(`\\b${flexiblePattern}\\b`, 'gi');
    if (flexibleRegex.test(text)) {
      return true;
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
