const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(/const handleNext = \(\) => \{[^]*?setCurrentIndex\(nextIdx\);\n\s*\};\n/m, `const handleNext = () => {
    if (queue.length === 0) return;
    let nextIdx = currentIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    }
    if (nextIdx >= queue.length) {
      nextIdx = 0; // loop back
    }
    setCurrentIndex(nextIdx);
  };\n`);

// Clean up SongCard definition completely
const songCardSearch = /function SongCard\(\{\s*song,\s*isPlaying,\s*isFavorite,\s*onPlay,\s*onFavorite\s*\}\s*:\s*\{\s*key\?:\s*React\.Key;\s*song:\s*SongResult;\s*isPlaying:\s*boolean;\s*isFavorite:\s*boolean;\s*onPlay:\s*\(\)\s*=>\s*void;\s*onFavorite:\s*\(\)\s*=>\s*void\s*\|\s*Promise<void>;\s*\}\)/m;
app = app.replace(songCardSearch, `function SongCard({ song, isPlaying, onPlay }: { key?: React.Key; song: SongResult; isPlaying: boolean; onPlay: () => void; })`);

// Alternative in case the above doesn't match perfectly because of formatting
app = app.replace(/function SongCard\(\{([^]*?)\}\s*:\s*\{([^]*?)\}\)/m, (match, p1, p2) => {
    if(p1.includes('onFavorite')) {
        return `function SongCard({ song, isPlaying, onPlay }: { key?: React.Key; song: SongResult; isPlaying: boolean; onPlay: () => void; })`;
    }
    return match;
});


fs.writeFileSync('src/App.tsx', app);
