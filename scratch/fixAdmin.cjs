const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.jsx', 'utf8');

// Replace the messed up nested conditional
content = content.replace(/\{\s*\.\.\.\(localStorage\.getItem\('authToken'\)\s*\?\s*\{\s*\.\.\.\(localStorage\.getItem\('authToken'\)\s*\?\s*\{\s*'Authorization':\s*`Bearer \$\{localStorage\.getItem\('authToken'\)\}`\s*\}\s*:\s*\{\}\)\s*\}\s*:\s*\{\}\)\s*\}/g, "{ ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}) }");

fs.writeFileSync('src/pages/Admin.jsx', content);
console.log('Done repairing Admin.jsx!');
