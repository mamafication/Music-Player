const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// The simplest way to fix the brutal mode selectors is just to add a semantic class in App.tsx
// I will just add .neo-card to the elements in App.tsx and change the CSS to match it.
css = css.replace(/\.brutal \.group\.bg-neutral-100.*?,/g, '.brutal .neo-card,');
css = css.replace(/\.brutal \.group\.dark.*?,/g, '');
css = css.replace(/\.brutal \.fixed\.z-\[100\] \.bg-neutral-900/g, '.brutal .neo-modal');

fs.writeFileSync('src/index.css', css);
