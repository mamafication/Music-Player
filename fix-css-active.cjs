const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Update CSS to keep hover state for active tab buttons
css = css.replace(
  '.brutal aside nav button:hover, .brutal .px-4.pb-4 button:hover {',
  '.brutal aside nav button:hover, .brutal aside nav button.active, .brutal .px-4.pb-4 button:hover, .brutal .px-4.pb-4 button.active {'
);

css = css.replace(
  '.brutal aside nav button:hover, \n  .brutal .neo-card:hover {',
  '.brutal aside nav button:hover, \n  .brutal aside nav button.active, \n  .brutal .neo-card:hover {'
);

fs.writeFileSync('src/index.css', css);
