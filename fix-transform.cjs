const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// I also want the active nav button to look pushed down
css = css.replace(
  '.brutal aside nav button:active,',
  '.brutal aside nav button:active, \\n  .brutal aside nav button.active,'
);

fs.writeFileSync('src/index.css', css);
