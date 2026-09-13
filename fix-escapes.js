const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/\\.group\\.bg-neutral-100\\\/50/g, '.group.bg-neutral-100\\\\/50');
css = css.replace(/\\.group\\.dark\\:bg-neutral-800\\\/30/g, '.group.dark\\\\:bg-neutral-800\\\\/30');
css = css.replace(/\\.fixed\\.z-\\[100\\]/g, '.fixed.z-\\\\[100\\\\]');
fs.writeFileSync('src/index.css', css);
