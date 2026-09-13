const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// I notice I missed replacing the bouncing bars and active queue item states back to indigo.
code = code.replace(
  'idx === currentIndex ? "text-neutral-900 dark:text-white"',
  'idx === currentIndex ? "text-indigo-600 dark:text-indigo-400"'
);

code = code.replace(
  'isShuffle && "text-neutral-900 dark:text-white"',
  'isShuffle && "text-indigo-600 dark:text-indigo-400"'
);

code = code.replace(
  'isLooping ? "text-neutral-900 dark:text-white"',
  'isLooping ? "text-indigo-600 dark:text-indigo-400"'
);

code = code.replace(/bg-neutral-900 dark:bg-white h/g, 'bg-indigo-400 h');

fs.writeFileSync('src/App.tsx', code);
