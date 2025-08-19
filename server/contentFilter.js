// Simple, lightweight profanity filter
// This is much better than complex external libraries that don't work properly

// List of banned words (the actual profanity)
const bannedWords = [
  'fuck', 'shit', 'ass', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'whore',
  'slut', 'nigger', 'nigga', 'faggot', 'fag', 'coon', 'spic', 'kike', 'chink',
  'gook', 'wetback', 'towelhead', 'raghead', 'cameljockey', 'sandnigger',
  'beaner', 'spook', 'jigaboo', 'porchmonkey', 'junglebunny', 'mudshark',
  'zipperhead', 'gook', 'slant', 'slanteye', 'chink', 'chinky', 'jap',
  'nip', 'gook', 'slant', 'slanteye', 'chink', 'chinky', 'jap', 'nip'
];

// List of legitimate words that contain potentially problematic substrings
const legitimateWords = [
  'weedle', 'gastly', 'gastrodon', // Pokemon names
  'gas', 'gases', 'gassy', 'gasoline', 'gaslight',
  'knee', 'knees', 'kneeling', 'kneeled', 'kneel',
  'grow', 'growing', 'grown', 'grows', 'growth',
  'assassin', 'assassinate', 'assassination', 'assassins',
  'assemble', 'assembly', 'assembled', 'assembling',
  'assess', 'assessment', 'assessed', 'assessing',
  'asset', 'assets', 'assign', 'assigned', 'assignment', 'assignments',
  'assist', 'assistant', 'assistance', 'assisted', 'assisting', 'assistants',
  'associate', 'associated', 'associating', 'association', 'associations',
  'assume', 'assumed', 'assuming', 'assumption', 'assumptions',
  'assure', 'assured', 'assuring', 'assurance', 'assurances',
  'pass', 'passing', 'passed', 'passes', 'passage', 'passenger', 'passengers',
  'class', 'classic', 'classical', 'classified', 'classroom', 'classrooms',
  'glass', 'glasses', 'glassy', 'glassware',
  'grass', 'grassy', 'grassland', 'grasshopper', 'grasshoppers',
  'mass', 'massive', 'massively', 'massacre', 'massage', 'massages',
  'bass', 'bassist', 'bassline', 'bassoon',
  'brass', 'brassy', 'brassiere', 'brassware',
  'crass', 'crassly', 'crassness',
  'sass', 'sassy', 'sassiness',
  'tassel', 'tasseled', 'tasseling',
  'wassail', 'wassailing', 'wassailed',
  'assault', 'assaulted', 'assaulting', 'assaults',
  'assert', 'asserted', 'asserting', 'assertion', 'assertive'
];

// Create sets for faster lookups
const bannedSet = new Set(bannedWords.map(word => word.toLowerCase()));
const legitimateSet = new Set(legitimateWords.map(word => word.toLowerCase()));

// Simple function to check if text contains profanity
function containsProfanity(text) {
  if (!text || typeof text !== 'string') return false;
  
  // Check for phonetic bypass attempts first (like "knee grow")
  const lowerText = text.toLowerCase();
  if (lowerText.includes('knee grow') || lowerText.includes('grow knee') || 
      lowerText.includes('knees grow') || lowerText.includes('grow knees')) {
    return true;
  }
  
  const words = lowerText.split(/\s+/);
  
  for (const word of words) {
    // Clean the word (remove punctuation)
    const cleanWord = word.replace(/[^\w]/g, '');
    
    // Skip empty words
    if (!cleanWord) continue;
    
    // Check if it's a legitimate word first
    if (legitimateSet.has(cleanWord)) {
      continue;
    }
    
    // Check if it's a banned word
    if (bannedSet.has(cleanWord)) {
      return true;
    }
  }
  
  return false;
}

// Content filter configuration for different field types
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
    maxLength: 150,
    allowedChars: null,
    charDescription: null,
    checkBadWords: true,
    fieldName: "Bio"
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

// Main content validation function
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
  if (config.checkBadWords && containsProfanity(input)) {
    return { isValid: false, error: `${config.fieldName} contains inappropriate content` };
  }

  return { isValid: true };
}

