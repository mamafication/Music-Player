const fs = require('fs');

const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  { from: /bg-neutral-900(?!\/)/g, to: "bg-neutral-50 dark:bg-neutral-900" },
  { from: /bg-neutral-900\//g, to: "bg-neutral-50/50 dark:bg-neutral-900/" },
  { from: /bg-neutral-950(?!\/)/g, to: "bg-white dark:bg-neutral-950" },
  { from: /bg-neutral-950\//g, to: "bg-white/80 dark:bg-neutral-950/" },
  
  { from: /(?<!(dark:|hover:|-))bg-neutral-800(?!\/)/g, to: "bg-neutral-100 dark:bg-neutral-800" },
  { from: /(?<!(dark:|hover:|-))bg-neutral-800\//g, to: "bg-neutral-100/50 dark:bg-neutral-800/" },
  { from: /hover:bg-neutral-800(?!\/)/g, to: "hover:bg-neutral-200 dark:hover:bg-neutral-800" },
  { from: /hover:bg-neutral-800\//g, to: "hover:bg-neutral-200/50 dark:hover:bg-neutral-800/" },

  { from: /(?<!(dark:|hover:|-|border-))bg-neutral-700(?!\/)/g, to: "bg-neutral-200 dark:bg-neutral-700" },
  { from: /(?<!(dark:|hover:|-|border-))bg-neutral-700\//g, to: "bg-neutral-200/50 dark:bg-neutral-700/" },
  
  { from: /(?<!(dark:|-))border-neutral-800/g, to: "border-neutral-200 dark:border-neutral-800" },
  { from: /(?<!(dark:|-))border-neutral-700/g, to: "border-neutral-300 dark:border-neutral-700" },

  { from: /(?<!(dark:|hover:|-|bg-))text-white/g, to: "text-neutral-900 dark:text-white" },
  { from: /hover:text-white/g, to: "hover:text-black dark:hover:text-white" },
  { from: /(?<!(dark:|hover:|-))text-neutral-100/g, to: "text-neutral-900 dark:text-neutral-100" },
  { from: /(?<!(dark:|hover:|-))text-neutral-300/g, to: "text-neutral-700 dark:text-neutral-300" },
  { from: /(?<!(dark:|hover:|-))text-neutral-400/g, to: "text-neutral-600 dark:text-neutral-400" },
  { from: /(?<!(dark:|hover:|-))text-neutral-500(?!\/)/g, to: "text-neutral-500 dark:text-neutral-500" },
  
  { from: /bg-black\/60/g, to: "bg-neutral-900/40 dark:bg-black/60" },
];

replacements.forEach(r => {
  content = content.replace(r.from, r.to);
});

fs.writeFileSync(file, content);
console.log('Transform complete');
