const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'className="neo-card cursor-pointer group bg-neutral-100/50 dark:bg-neutral-800/30 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 transition-all duration-300 flex items-center gap-4"',
  'className="neo-card cursor-pointer group bg-neutral-100/50 dark:bg-neutral-800/30 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 transition-all duration-300 hover:-rotate-1 hover:scale-[1.02] flex items-center gap-4"'
);

fs.writeFileSync('src/App.tsx', code);
