const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix active tabs in sidebar
code = code.replace(
  'activeTab === \'search\' ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"',
  'activeTab === \'search\' ? "active bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"'
);
code = code.replace(
  'activeTab === \'favorites\' ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"',
  'activeTab === \'favorites\' ? "active bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"'
);

// Fix SongCard root div
code = code.replace(
  '<div className="neo-card group bg-neutral-100/50 dark:bg-neutral-800/30 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 transition-all duration-300 flex items-center gap-4">',
  '<div onClick={onPlay} className="neo-card cursor-pointer group bg-neutral-100/50 dark:bg-neutral-800/30 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 transition-all duration-300 flex items-center gap-4">'
);

// Fix inner onPlay button in SongCard
code = code.replace(
  '        <button \n          onClick={onPlay}\n          className={cn(',
  '        <button \n          className={cn('
);

// Fix onFavorite to stop propagation
code = code.replace(
  'onClick={onFavorite}',
  'onClick={(e) => { e.stopPropagation(); onFavorite(); }}'
);

fs.writeFileSync('src/App.tsx', code);
