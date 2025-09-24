const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/data/gamePokemon - Copy.json', 'utf8');

// Add commas after each quoted number (but not after the last element in arrays)
const lines = content.split('\n');
const fixedLines = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is a quoted number line
    if (/^"[0-9]+"$/.test(line.trim())) {
        // Check if the next non-empty line is a closing bracket or another quoted number
        let nextNonEmptyLine = null;
        for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim() !== '') {
                nextNonEmptyLine = lines[j].trim();
                break;
            }
        }
        
        // If next line is a closing bracket, don't add comma
        if (nextNonEmptyLine === ']' || nextNonEmptyLine === '],') {
            fixedLines.push(line);
        } else {
            // Add comma
            fixedLines.push(line + ',');
        }
    } else {
        fixedLines.push(line);
    }
}

// Write back to file
fs.writeFileSync('src/data/gamePokemon - Copy.json', fixedLines.join('\n'));
console.log('Fixed JSON commas');
