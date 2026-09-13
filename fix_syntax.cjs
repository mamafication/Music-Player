const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(/\s*\}\n\s*\};\n\s*const getSortedResults/m, `\n\n  const getSortedResults`);
app = app.replace(/\{\s*true \? \(\n/, `\n`);
fs.writeFileSync('src/App.tsx', app);
