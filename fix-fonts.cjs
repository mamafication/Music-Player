const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// The current CSS has:
// .brutal h1, .brutal h2, .brutal h3 {
//    font-family: system-ui, -apple-system, sans-serif !important;
//    font-stretch: condensed !important;
//  }
//
//  .brutal h1, .brutal h2, .brutal h3, .brutal p {
//    font-weight: 900 !important;
//    letter-spacing: -0.05em !important;
//  }

// We will change it so that ONLY headings are bold and condensed,
// and the body / p tags don't get the weird heading treatment.
const oldHeadingStyles1 = `.brutal h1, .brutal h2, .brutal h3 {\\n    font-family: system-ui, -apple-system, sans-serif !important;\\n    font-stretch: condensed !important;\\n  }\\n\\n  .brutal h1, .brutal h2, .brutal h3, .brutal p {\\n    font-weight: 900 !important;\\n    letter-spacing: -0.05em !important;\\n  }`;
const newHeadingStyles = `.brutal h1, .brutal h2, .brutal h3 {\\n    font-family: system-ui, -apple-system, sans-serif !important;\\n    font-weight: 900 !important;\\n    font-stretch: condensed !important;\\n    letter-spacing: -0.05em !important;\\n  }`;

// If it hasn't been replaced exactly like that, let's just do a regex replace to be safe.
css = css.replace(/\\.brutal h1, \\.brutal h2, \\.brutal h3(?:, \\.brutal p)? \{[^}]+\}/g, '');
// Re-insert the fresh styles at the end
css = css.replace(/}\\s*$/, '}\\n\\n  .brutal h1, .brutal h2, .brutal h3 {\\n    font-family: system-ui, -apple-system, sans-serif !important;\\n    font-weight: 900 !important;\\n    font-stretch: condensed !important;\\n    letter-spacing: -0.05em !important;\\n  }\\n}');

fs.writeFileSync('src/index.css', css);
