const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'className="absolute inset-y-2 right-2 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-white text-white dark:text-neutral-900 rounded-full px-4 flex items-center justify-center transition-colors shadow-sm"',
  'className="absolute inset-y-2 right-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-400 text-white dark:text-white rounded-full px-4 flex items-center justify-center transition-colors shadow-sm"'
);

fs.writeFileSync('src/App.tsx', code);
