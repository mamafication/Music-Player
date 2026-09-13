const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Insert the getTechMeta function just before the SongCard function
const getTechMeta = `
const getTechMeta = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bitrates = ['320 KBPS', '1411 KBPS', '24-BIT', '256 KBPS AAC', 'DSD64'];
  const formats = ['WAV', 'MP3', 'FLAC', 'ALAC', 'AAC', 'AIFF'];
  const sampleRates = ['44.1KHZ', '48KHZ', '96KHZ', '192KHZ'];
  
  return {
    bitrate: bitrates[hash % bitrates.length],
    format: formats[(hash + 3) % formats.length],
    sampleRate: sampleRates[(hash + 7) % sampleRates.length]
  };
};

function SongCard`;

code = code.replace('function SongCard', getTechMeta);

// Update SongCard to show metadata
const oldSongCardMinW = `<div className="flex-1 min-w-0">
        <p className="font-mono text-base font-medium text-neutral-900 dark:text-white truncate mb-0.5">{song.trackName}</p>
        <p className="font-mono text-sm text-neutral-600 dark:text-neutral-400 truncate">{song.artistName}</p>
      </div>`;

const newSongCardMinW = `<div className="flex-1 min-w-0">
        <p className="font-mono text-base font-medium text-neutral-900 dark:text-white truncate mb-0.5">{song.trackName}</p>
        <p className="font-mono text-sm text-neutral-600 dark:text-neutral-400 truncate">{song.artistName}</p>
        <div className="font-mono flex items-center gap-2 mt-1.5 text-[10px] text-neutral-500 font-bold tracking-tight opacity-70">
          <span className="bg-neutral-200/50 dark:bg-neutral-800/50 px-1 py-0.5 rounded-sm">{getTechMeta(song.trackId).format}</span>
          <span className="bg-neutral-200/50 dark:bg-neutral-800/50 px-1 py-0.5 rounded-sm">{getTechMeta(song.trackId).bitrate}</span>
          <span className="bg-neutral-200/50 dark:bg-neutral-800/50 px-1 py-0.5 rounded-sm hidden sm:inline-block">{getTechMeta(song.trackId).sampleRate}</span>
        </div>
      </div>`;

code = code.replace(oldSongCardMinW, newSongCardMinW);

// Update Bottom Player to show metadata
const oldPlayerMinW = `<div className="min-w-0">
                <p className="font-mono text-sm font-medium text-neutral-900 dark:text-white truncate">{currentSong.trackName}</p>
                <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400 truncate">{currentSong.artistName}</p>
              </div>`;

const newPlayerMinW = `<div className="min-w-0">
                <p className="font-mono text-sm font-medium text-neutral-900 dark:text-white truncate">{currentSong.trackName}</p>
                <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400 truncate">{currentSong.artistName}</p>
                <div className="font-mono flex items-center gap-1.5 mt-1 text-[9px] text-neutral-500 font-bold tracking-tight opacity-70">
                  <span className="bg-neutral-200/50 dark:bg-neutral-800/50 px-1 py-0.5 rounded-sm">{getTechMeta(currentSong.trackId).format}</span>
                  <span className="bg-neutral-200/50 dark:bg-neutral-800/50 px-1 py-0.5 rounded-sm">{getTechMeta(currentSong.trackId).bitrate}</span>
                </div>
              </div>`;

code = code.replace(oldPlayerMinW, newPlayerMinW);

fs.writeFileSync('src/App.tsx', code);
