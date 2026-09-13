const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Remove favSort completely
app = app.replace(/const \[favSort, setFavSort\] = useState\([^]*?\}\);\n/m, "");

// Remove toggleFavorite function
app = app.replace(/const toggleFavorite = async \(song: SongResult\) => \{[^]*?^\s*\};\n/m, "");

// Remove remaining setFavorites
app = app.replace(/setFavorites\(\[favSong, \.\.\.favorites\]\);\n/g, "");

// Remove getSortedFavs
app = app.replace(/const getSortedFavs = \(\) => \{[^]*?^\s*\};\n/m, "");

// Remove isFavorite and onFavorite props from SongCard definitions and usage
app = app.replace(/\s*isFavorite=\{.*?\}\n/g, "\n");
app = app.replace(/\s*onFavorite=\{.*?\}\n/g, "\n");

// Update SongCard Component interface
app = app.replace(/isFavorite: boolean;\n\s*onPlay: \(\) => void;\n\s*onFavorite: \(\) => void \| Promise<void>;/, "onPlay: () => void;");
app = app.replace(/isFavorite,\n\s*onPlay,\n\s*onFavorite/, "onPlay");

// Remove Heart from SongCard
app = app.replace(/<button\s*onClick=\{\(e\) => \{ e\.stopPropagation\(\); onFavorite\(\); \}\}[^]*?<\/button>/m, "");
// Remove Heart from Bottom Player if still there
app = app.replace(/<button\s*onClick=\{\(e\) => \{ e\.stopPropagation\(\); toggleFavorite\(currentSong\); \}\}[^]*?<\/button>/m, "");
app = app.replace(/<button\s*onClick=\{\(\) => toggleFavorite\(currentSong\)\}[^]*?<\/button>/m, "");

// Clean shuffle favQueue fallback
app = app.replace(/if \(isShuffle && favorites\.length > 0\) \{[^]*?\} else if/m, "if");

// Clean activeTab='favorites' button
app = app.replace(/<button onClick=\{\(\) => setActiveTab\('favorites'\)\}.*?<\/button>/m, "");

fs.writeFileSync('src/App.tsx', app);
