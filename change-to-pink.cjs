const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/indigo-600/g, 'pink-500');
code = code.replace(/indigo-500/g, 'pink-400');
code = code.replace(/indigo-400/g, 'pink-300');
code = code.replace(/indigo-700/g, 'pink-600');
code = code.replace(/indigo-100/g, 'pink-100');
code = code.replace(/indigo-200/g, 'pink-200');
code = code.replace(/indigo-800/g, 'pink-800');
code = code.replace(/indigo-900/g, 'pink-900');

fs.writeFileSync('src/App.tsx', code);
