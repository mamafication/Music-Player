const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const mobileQuickControls = `              {/* Mobile quick controls */}
              <div className="flex items-center md:hidden gap-2 shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsQueueOpen(!isQueueOpen); }}
                  className={cn("p-2 rounded-full transition-colors", isQueueOpen ? "bg-neutral-900 text-white dark:bg-white dark:text-black" : "hover:bg-neutral-200 dark:hover:bg-neutral-800")}
                >
                  <ListMusic className="w-5 h-5" />
                </button>
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
              </div>`;

code = code.replace(
  /\{\/\* Mobile quick controls \*\/\}[\s\S]*?<\/div>/,
  mobileQuickControls
);

const rightSpacing = `            {/* Right Spacing / Extras */}
            <div className="hidden md:flex justify-end items-center gap-4 flex-1 w-full relative">
              <button 
                onClick={() => setIsQueueOpen(!isQueueOpen)}
                className={cn("p-2 rounded-lg transition-colors border-2", isQueueOpen ? "bg-neutral-900 text-white dark:bg-white dark:text-black border-transparent" : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white border-transparent hover:border-neutral-300 dark:hover:border-neutral-700")}
                title="Playing Next"
              >
                <ListMusic className="w-5 h-5" />
              </button>
            </div>
            
            {/* Queue Panel Overlay (Rendered outside the flex row so it can be absolute relative to the player fixed container) */}
            {isQueueOpen && (
              <div className="absolute bottom-[calc(100%+0.5rem)] right-4 md:right-6 w-[calc(100%-2rem)] md:w-96 max-h-[50vh] md:max-h-[400px] bg-neutral-50 dark:bg-neutral-900 flex flex-col neo-modal border-2 border-neutral-200 dark:border-neutral-800 shadow-2xl z-50 animate-in slide-in-from-bottom-2 fade-in duration-200 rounded-2xl md:rounded-3xl">
                <div className="p-4 border-b-2 border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <h3 className="font-mono font-bold text-sm uppercase tracking-wider">Playing Next</h3>
                  <button onClick={() => setIsQueueOpen(false)} className="text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  {queue.length === 0 ? (
                    <div className="p-8 text-center text-sm text-neutral-500 font-mono">Queue is empty</div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {queue.map((song, idx) => (
                        <button
                          key={\`\${song.trackId}-\${idx}\`}
                          onClick={() => {
                            setCurrentIndex(idx);
                            if (!isPlaying) togglePlayState();
                          }}
                          className={cn(
                            "w-full text-left flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-neutral-200 dark:hover:bg-neutral-800",
                            idx === currentIndex ? "bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50" : "border border-transparent"
                          )}
                        >
                          <img src={song.artworkUrl100} className="w-10 h-10 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800" alt="" />
                          <div className="min-w-0 flex-1">
                            <p className={cn("font-mono text-xs font-bold truncate", idx === currentIndex ? "text-indigo-600 dark:text-indigo-400" : "")}>
                              {song.trackName}
                            </p>
                            <p className="font-mono text-[10px] text-neutral-500 truncate">{song.artistName}</p>
                          </div>
                          {idx === currentIndex && <Play className="w-3 h-3 fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}`;

code = code.replace(
  /\{\/\* Right Spacing \/ Extras \*\/\}[\s\S]*?<\/div>/,
  rightSpacing
);

fs.writeFileSync('src/App.tsx', code);
