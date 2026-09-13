const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(/\{\/\* Mobile Header[^]*?\{activeTab === 'search' \? \(/m, `{/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-900 dark:bg-neutral-100 rounded-full flex items-center justify-center text-white dark:text-neutral-900 shadow-lg shadow-black/10 dark:shadow-white/10 shrink-0">
              <Music className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">Music Player</h1>
          </div>
        </div>

        <div className="max-w-5xl mx-auto w-full px-4 md:px-6 py-6 md:py-8">
          {true ? (`);

fs.writeFileSync('src/App.tsx', app);
