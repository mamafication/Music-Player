const fs = require('fs');

// 1. Reset index.css
const defaultCSS = `@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

@layer utilities {
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #3f3f46;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #52525b;
  }
}`;
fs.writeFileSync('src/index.css', defaultCSS);

// 2. Remove brutal class application from App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/document\.documentElement\.classList\.remove\('dark'\);\n\s*document\.documentElement\.classList\.add\('brutal'\);/g, "");
fs.writeFileSync('src/App.tsx', app);
