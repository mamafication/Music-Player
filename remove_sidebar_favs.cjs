const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

// Remove FavoriteSong import if present
app = app.replace(/FavoriteSong, /g, "");

// Remove state variables
app = app.replace(/const \[favorites, setFavorites\] = useState<FavoriteSong\[\]>\(\[\]\);\n/, "");
app = app.replace(/const \[activeTab, setActiveTab\] = useState<'search' \| 'favorites'>\('search'\);\n/, "");
app = app.replace(/const \[favSort, setFavSort\] = useState<'date' \| 'title' \| 'artist'>\('date'\);\n/, "");
app = app.replace(/const \[isSidebarCollapsed, setIsSidebarCollapsed\] = useState\(false\);\n/, "");

// Remove useEffects for local storage favorites
app = app.replace(/useEffect\(\(\) => \{\n\s*const localFavs = localStorage\.getItem\('groove_favorites'\);[^]*?\}, \[favorites\]\);\n/m, "");

// Remove toggleFavorite
app = app.replace(/const toggleFavorite = async \(song: SongResult\) => \{[^]*?^\s*\};\n/m, "");

// Remove handleFavSortChange
app = app.replace(/const handleFavSortChange = \(sort: 'date' \| 'title' \| 'artist'\) => \{[^]*?^\s*\};\n/m, "");

// Remove sidebar
app = app.replace(/\s*\{\/\* Desktop Sidebar \*\/}[^]*?<\/aside>/m, "");

// Remove Mobile Header tab toggle
app = app.replace(/<div className="flex bg-neutral-200\/50 dark:bg-neutral-800\/50 p-1 rounded-xl">[^]*?<\/div>/m, "");

// The activeTab conditional wrap
// We need to replace `{activeTab === 'search' ? ( ... ) : ( ... )}` with just the search part.
// First, find the beginning of activeTab === 'search'
app = app.replace(/\{activeTab === 'search' \? \(\n\s*<div className="space-y-6 md:space-y-8">/, `<div className="space-y-6 md:space-y-8">`);
// Next, replace the `: (` and the favorites section all the way down to `)}` before `</div>\n      </main>`
app = app.replace(/\s*\) : \(\n\s*<div className="space-y-8">[^]*?Your Favorites[^]*?<\/div>\n\s*\)\}/m, "");

// Remove isFavorite/onFavorite from SongCard renders (there should be only one now in search results, wait maybe recent searches too)
app = app.replace(/\s*isFavorite=\{!!favorites\.find\(\(f\) => f\.songId === song\.trackId\)\}\n\s*onFavorite=\{\(\) => toggleFavorite\(song\)\}/g, "");

// Remove Hearts from Player (Bottom Global Player)
app = app.replace(/<button \n\s*onClick=\{\(e\) => \{ e\.stopPropagation\(\); toggleFavorite\(currentSong\); \}\}[^]*?<\/button>/m, "");
app = app.replace(/\{\/\* Desktop Favorite \*\/\}\n\s*<button \n\s*onClick=\{\(\) => toggleFavorite\(currentSong\)\}[^]*?<\/button>/m, "");

// Fix bottom player classes
app = app.replace(/isSidebarCollapsed \? "md:left-20" : "md:left-64"/g, `""`);

// Update SongCard Component Definition
app = app.replace(/isFavorite: boolean;\n\s*onPlay: \(\) => void;\n\s*onFavorite: \(\) => void \| Promise<void>;/, `onPlay: () => void;`);
app = app.replace(/isFavorite,\n\s*onPlay,\n\s*onFavorite/, `onPlay`);
app = app.replace(/<button \n\s*onClick=\{\(e\) => \{ e\.stopPropagation\(\); onFavorite\(\); \}\}[^]*?<\/button>/m, "");

fs.writeFileSync('src/App.tsx', app);
