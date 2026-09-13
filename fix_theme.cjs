const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add Sun, Moon to imports
app = app.replace(/Shuffle, /, "Shuffle, Sun, Moon, ");

// 2. Remove unused favSort, insert isDarkMode
app = app.replace(/const \[favSort, setFavSort\] = useState[^]*?const handleFavSortChange =[^]*?setFavSort\(newSort\);\n\s*localStorage.setItem\('groove_fav_sort', newSort\);\n\s*\};\n/m, 
`const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch { return false; }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);\n`);

// 3. Add the toggle button in the Header
app = app.replace(/<h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">Music Player<\/h1>\n\s*<\/div>\n\s*<\/div>/m, 
`<h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">Music Player</h1>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-pink-500 dark:hover:text-pink-300 transition-colors shadow-sm border border-neutral-200 dark:border-neutral-700 hover:border-pink-200 dark:hover:border-pink-800"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>`);

fs.writeFileSync('src/App.tsx', app);
