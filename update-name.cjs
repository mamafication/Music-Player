const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/Groove AI/g, 'Music Player');

fs.writeFileSync('src/App.tsx', code);
