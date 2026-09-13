const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The user is asking to "change black color to another color" in the search bar and audio bar.
// Currently the inputs/buttons in these areas use things like `text-neutral-900` or `bg-neutral-900` or `hover:text-black`

// Audio Bar range thumb border:
code = code.replace(
  '[&::-webkit-slider-thumb]:border-black',
  '[&::-webkit-slider-thumb]:border-indigo-600 dark:[&::-webkit-slider-thumb]:border-indigo-400'
);

// Player controls hover states (which were hover:text-black):
code = code.replace(
  /hover:text-black dark:hover:text-white/g,
  'hover:text-indigo-600 dark:hover:text-indigo-400'
);

// Search bar input focus text:
code = code.replace(
  'group-focus-within:text-neutral-900 dark:group-focus-within:text-white',
  'group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400'
);

// Search clear button hover:
// Handled by the global hover:text-black replace above.

// The main play button in player (bg-white text-black):
code = code.replace(
  'className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform border-2 border-black"',
  'className="w-10 h-10 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform border-2 border-transparent"'
);
// And the mobile play button:
code = code.replace(
  'className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-sm border-2 border-black"',
  'className="w-10 h-10 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-sm border-2 border-transparent"'
);


// Search input focus rings:
code = code.replace(
  'focus:border-neutral-500/50 focus:ring-4 focus:ring-neutral-500/10',
  'focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10'
);

// Playing Next button active state:
code = code.replace(
  'bg-neutral-900 text-white dark:bg-white dark:text-black',
  'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white'
);

// The queue items:
code = code.replace(
  /text-neutral-900 dark:text-white/g,
  'text-neutral-900 dark:text-white' // Keep standard text mostly neutral
);
code = code.replace(
  'fill-neutral-900 dark:fill-white text-neutral-900 dark:text-white shrink-0',
  'fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400 shrink-0'
);


fs.writeFileSync('src/App.tsx', code);
