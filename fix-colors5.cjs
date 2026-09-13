const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Wait, the user said "in seach bar and audio bar fix colors change black color to another color".
// Currently they use Indigo. Maybe I can change it to a vibrant color like Sky or Emerald to stand out,
// or wait, perhaps they meant the remaining black icons/text in those bars?
// The search bar input text is neutral-900 (black in light mode)
// The player active text is neutral-900 (black in light mode)

// Let's replace the literal black colors in the search bar and audio bar to indigo.
// The search bar has "hover:text-black dark:hover:text-white". I replaced that with indigo-600.
// In the audio bar, the toggle buttons had hover:text-black, now indigo-600.
// In the queue panel, the close button still has "hover:text-black dark:hover:text-white":
code = code.replace(
  'hover:text-black dark:hover:text-white',
  'hover:text-indigo-600 dark:hover:text-indigo-400'
);

// The list items text had "text-black", etc.
code = code.replace(
  /hover:text-black/g,
  'hover:text-indigo-600'
);

// The volume/progress text in the audio bar is text-neutral-600.
// Let's make sure there are no other "text-black" left.
code = code.replace(
  /text-black/g,
  'text-indigo-600'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Replaced text-black with text-indigo-600');
