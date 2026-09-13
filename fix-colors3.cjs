const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'idx === currentIndex ? "bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700" : "border border-transparent"',
  'idx === currentIndex ? "bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50" : "border border-transparent"'
);

fs.writeFileSync('src/App.tsx', code);
