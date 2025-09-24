// Quick test to verify game mapping works
const gamePokemonData = require('./src/data/gamePokemon.json');
const { getAvailableGamesForPokemon, getMergedGameName, getIndividualGameNames } = require('./src/utils/gameMapping.js');

console.log('Testing game mapping...');

// Test 1: Check if we can get individual games from merged names
console.log('\n1. Testing merged to individual game mapping:');
console.log('Blue Red Green And Yellow ->', getIndividualGameNames('Blue Red Green And Yellow'));
console.log('Scarlet And Violet ->', getIndividualGameNames('Scarlet And Violet'));

// Test 2: Check if we can get merged names from individual games
console.log('\n2. Testing individual to merged game mapping:');
console.log('Blue ->', getMergedGameName('Blue'));
console.log('Scarlet ->', getMergedGameName('Scarlet'));

// Test 3: Check Pokemon availability
console.log('\n3. Testing Pokemon availability:');
const bulbasaurGames = getAvailableGamesForPokemon('0001', gamePokemonData);
console.log('Bulbasaur (0001) available in:', bulbasaurGames);

const pikachuGames = getAvailableGamesForPokemon('0025', gamePokemonData);
console.log('Pikachu (0025) available in:', pikachuGames);

console.log('\nGame mapping test completed successfully!');
