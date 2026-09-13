const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'isQueueOpen ? "bg-neutral-900 text-white dark:bg-white dark:text-black border-transparent"',
  'isQueueOpen ? "bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white border-transparent"'
);

fs.writeFileSync('src/App.tsx', code);
