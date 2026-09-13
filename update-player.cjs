const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the main padding
code = code.replace(
  '<main className="flex-1 overflow-y-auto pb-32 relative flex flex-col">',
  '<main className="flex-1 overflow-y-auto pb-40 md:pb-32 relative flex flex-col">'
);

// We need to carefully replace the bottom player
const oldPlayerRegex = /\{\/\* Bottom Global Player \*\/\}[\s\S]*?\{\/\* Right Spacing \/ Extras \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*\)\}/;

const newPlayer = `{/* Bottom Global Player */}
      {currentSong && (
        <div className={cn("fixed bottom-0 left-0 right-0 h-auto md:h-24 py-3 md:py-0 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center px-4 md:px-6 z-50 animate-in slide-in-from-bottom-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all duration-300", isSidebarCollapsed ? "md:left-20" : "md:left-64")}>
          <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 md:h-full">
            
            {/* Now Playing Info */}
            <div className="flex items-center justify-between md:justify-start gap-3 md:gap-4 w-full md:w-auto md:flex-1 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800 shadow-md">
                  <img src={currentSong.artworkUrl100} alt={currentSong.trackName} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium text-neutral-900 dark:text-white truncate">{currentSong.trackName}</p>
                  <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400 truncate">{currentSong.artistName}</p>
                  <div className="font-mono flex items-center gap-1.5 mt-1 text-[9px] text-neutral-500 font-bold tracking-tight opacity-70">
                    <span className="bg-neutral-200/50 dark:bg-neutral-800/50 px-1 py-0.5 rounded-sm">{getTechMeta(currentSong.trackId).format}</span>
                    <span className="bg-neutral-200/50 dark:bg-neutral-800/50 px-1 py-0.5 rounded-sm">{getTechMeta(currentSong.trackId).bitrate}</span>
                  </div>
                </div>
              </div>
              
              {/* Mobile quick controls */}
              <div className="flex items-center md:hidden gap-2 shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(currentSong); }}
                  className="p-2 rounded-full transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-800"
                >
                  <Heart className={cn("w-5 h-5", favorites.find(f => f.songId === currentSong.trackId) ? "text-rose-500 fill-current" : "text-neutral-500")} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); togglePlayState(); }}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-sm border-2 border-black"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
                </button>
              </div>
              
              {/* Desktop Favorite */}
              <button 
                onClick={() => toggleFavorite(currentSong)}
                className="hidden md:flex ml-2 p-2 rounded-full transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-800 shrink-0"
              >
                <Heart className={cn("w-4 h-4", favorites.find(f => f.songId === currentSong.trackId) ? "text-rose-500 fill-current" : "text-neutral-500 dark:text-neutral-500")} />
              </button>
            </div>

            {/* Player Controls */}
            <div className="flex flex-col items-center justify-center w-full md:flex-[2] gap-1.5 md:gap-2">
              <div className="hidden md:flex items-center justify-center gap-6">
                <button 
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={cn("text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors", isShuffle && "text-indigo-400")}
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                <button onClick={handlePrev} className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>
                <button 
                  onClick={togglePlayState}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform border-2 border-black"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
                </button>
                <button onClick={handleNext} className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
                <button 
                  onClick={() => setIsLooping(!isLooping)}
                  className={cn("hover:text-black dark:hover:text-white transition-colors", isLooping ? "text-indigo-400" : "text-neutral-600 dark:text-neutral-400")}
                  title="Loop Song"
                >
                  {isLooping ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-3 w-full max-w-md">
                <span className="font-mono text-[10px] md:text-[11px] text-neutral-600 dark:text-neutral-400 font-medium w-8 md:w-10 text-right">{formatTime(progress)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={progress}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black cursor-pointer"
                />
                <span className="font-mono text-[10px] md:text-[11px] text-neutral-600 dark:text-neutral-400 font-medium w-8 md:w-10 text-left">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Spacing / Extras */}
            <div className="hidden md:flex justify-end items-center gap-4 flex-1 w-full">
            </div>
            
          </div>
        </div>
      )}`;

if (oldPlayerRegex.test(code)) {
  code = code.replace(oldPlayerRegex, newPlayer);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Updated player");
} else {
  console.log("Regex didn't match.");
}

