/**
 * Generate stable IDs for all Pokemon entries
 * Run this script to add stableId to pokemon.json and all form files
 * 
 * Usage: node scripts/generateStableIds.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FORM_TYPES = [
  "gender",
  "alolan",
  "galarian",
  "hisuian",
  "paldean",
  "gmax",
  "unown",
  "other",
  "alcremie",
  "vivillon",
  "alpha",
  "alphaother"
];

/**
 * Generate a stable ID for a Pokemon entry
 * Format: {name}-{formType}-{3-digit-index}
 */
function generateStableId(pokemon, formType, index) {
  const name = pokemon.name?.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const form = formType || 'main';
  const paddedIndex = String(index).padStart(3, '0');
  return `${name}-${form}-${paddedIndex}`;
}

/**
 * Process a Pokemon array and add stable IDs
 */
function addStableIdsToArray(pokemonArray, formType = null) {
  const seen = new Map(); // Track name+formType combinations for indexing
  
  return pokemonArray.map((pokemon, idx) => {
    // Skip separator headers
    if (pokemon.formType && typeof pokemon.formType === 'string' && pokemon.formType.startsWith('-')) {
      return pokemon;
    }
    
    // Skip entries without id or name
    if (!pokemon.id && !pokemon.name) {
      return pokemon;
    }
    
    // Use formType from pokemon or parameter
    const actualFormType = pokemon.formType || formType;
    const name = pokemon.name?.toLowerCase();
    
    // Create unique key for counting
    const uniqueKey = `${name}-${actualFormType || 'main'}`;
    
    // Get or create index for this name+formType combination
    if (!seen.has(uniqueKey)) {
      seen.set(uniqueKey, 0);
    }
    const index = seen.get(uniqueKey);
    seen.set(uniqueKey, index + 1);
    
    // Generate stable ID
    const stableId = generateStableId(pokemon, actualFormType, index);
    
    // Add stableId to pokemon (don't overwrite if it exists)
    return {
      ...pokemon,
      stableId: pokemon.stableId || stableId
    };
  });
}

/**
 * Process main pokemon.json
 */
function processMainPokemon() {
  const filePath = path.join(__dirname, '../src/data/pokemon.json');
  console.log('Processing pokemon.json...');
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const updated = addStableIdsToArray(data, 'main');
  
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
  console.log(`✓ Added stableIds to ${updated.length} main Pokemon`);
}

/**
 * Process all form category files
 */
function processFormFiles() {
  const formsDir = path.join(__dirname, '../src/data/forms');
  
  FORM_TYPES.forEach(formType => {
    const filePath = path.join(formsDir, `${formType}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠ Skipping ${formType}.json (file not found)`);
      return;
    }
    
    console.log(`Processing ${formType}.json...`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const updated = addStableIdsToArray(data, formType);
    
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
    console.log(`✓ Added stableIds to ${updated.length} ${formType} forms`);
  });
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Generating stable IDs for all Pokemon entries...\n');
  
  try {
    processMainPokemon();
    console.log('');
    processFormFiles();
    
    console.log('\n✅ Done! All Pokemon entries now have stableId fields.');
    console.log('\n⚠️  Next steps:');
    console.log('   1. Review the generated stableIds');
    console.log('   2. Update getCaughtKey() to use stableId');
    console.log('   3. Create key mapping for migration');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
