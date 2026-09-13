const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const oldStr = `  /* Brutalist Theme Overrides */
  .brutal {
    --brutal-bg: #ccfbf1;        /* teal-100 */
    --brutal-sidebar: #bae6fd;   /* sky-200 */
    --brutal-player: #c7d2fe;    /* indigo-200 */
    --brutal-card: #e0e7ff;      /* indigo-100 */
    --brutal-card-hover: #c7d2fe;/* indigo-200 */
    --brutal-accent: #38bdf8;    /* sky-400 */
    --brutal-border: #020617;    /* slate-950 */
  }`;

const newStr = `  /* Brutalist Theme Overrides */
  .brutal {
    --brutal-bg: #fef08a;        /* yellow-200 */
    --brutal-sidebar: #f9a8d4;   /* pink-300 */
    --brutal-player: #7dd3fc;    /* sky-300 */
    --brutal-card: #bef264;      /* lime-300 */
    --brutal-card-hover: #c084fc;/* purple-400 */
    --brutal-accent: #f87171;    /* red-400 */
    --brutal-border: #000000;    /* black */
  }`;

css = css.replace(oldStr, newStr);

fs.writeFileSync('src/index.css', css);
