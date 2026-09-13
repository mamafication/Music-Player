const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

// Append a global transition for common color properties to smoothly transition themes.
// We avoid `*` selector overriding transforms by strictly targeting color properties.
const transitionCSS = `\n@layer base {
  *, ::before, ::after {
    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
  }
}
`;

if (!css.includes('transition-property: color')) {
    css += transitionCSS;
    fs.writeFileSync('src/index.css', css);
}
