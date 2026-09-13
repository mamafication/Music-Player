const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// I'll add more CSS variables
const oldVars = `  /* Brutalist Theme Overrides */
  .brutal {
    --brutal-bg: #fef08a;        /* yellow-200 */
    --brutal-sidebar: #f9a8d4;   /* pink-300 */
    --brutal-player: #7dd3fc;    /* sky-300 */
    --brutal-card: #bef264;      /* lime-300 */
    --brutal-card-hover: #c084fc;/* purple-400 */
    --brutal-accent: #f87171;    /* red-400 */
    --brutal-border: #000000;    /* black */
  }`;

const newVars = `  /* Brutalist Theme Overrides */
  .brutal {
    --brutal-bg: #fef08a;          /* yellow-200 */
    --brutal-sidebar: #f9a8d4;     /* pink-300 */
    --brutal-player: #7dd3fc;      /* sky-300 */
    --brutal-card: #bef264;        /* lime-300 */
    --brutal-card-hover: #86efac;  /* green-300 */
    --brutal-nav-btn: #fbcfe8;     /* pink-200 */
    --brutal-nav-btn-h: #f472b6;   /* pink-400 */
    --brutal-search: #fff;         /* white */
    --brutal-play-btn: #fb923c;    /* orange-400 */
    --brutal-play-btn-h: #f97316;  /* orange-500 */
    --brutal-accent: #f87171;      /* red-400 */
    --brutal-modal: #c084fc;       /* purple-400 */
    --brutal-border: #000000;      /* black */
  }`;

css = css.replace(oldVars, newVars);

// Update some assignments
css = css.replace('.brutal input[type="text"] {\n    background-color: #fff !important;\n  }', '.brutal input[type="text"] {\n    background-color: var(--brutal-search) !important;\n  }\n  \n  .brutal aside nav button, .brutal .px-4.pb-4 button {\n    background-color: var(--brutal-nav-btn) !important;\n  }\n  .brutal aside nav button:hover, .brutal .px-4.pb-4 button:hover {\n    background-color: var(--brutal-nav-btn-h) !important;\n  }\n  \n  .brutal .fixed.bottom-0 button.bg-white {\n    background-color: var(--brutal-play-btn) !important;\n  }\n  .brutal .fixed.bottom-0 button.bg-white:hover {\n    background-color: var(--brutal-play-btn-h) !important;\n  }\n  \n  .brutal .neo-modal {\n    background-color: var(--brutal-modal) !important;\n  }\n');

fs.writeFileSync('src/index.css', css);
