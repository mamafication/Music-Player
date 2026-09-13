const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<div className="max-w-5xl mx-auto w-full px-6 py-8">',
  '<div className="max-w-5xl mx-auto w-full px-4 md:px-6 py-6 md:py-8">'
);

fs.writeFileSync('src/App.tsx', code);
