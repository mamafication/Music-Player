const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(
  '.brutal aside nav button:hover, \\n  .brutal aside nav button.active, \\n  .brutal .neo-card:hover',
  '.brutal .neo-card:hover'
);

fs.writeFileSync('src/index.css', css);
