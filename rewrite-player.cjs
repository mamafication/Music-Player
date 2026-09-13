const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The hooks block to replace:
const oldHooks = `  useEffect(() => {
    if (!currentSong || !currentSong.youtubeId) {
      setYtPlayer(null);
    }
  }, [currentSong]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && ytPlayer) {
      interval = setInterval(async () => {
        try {
          if (typeof ytPlayer.getCurrentTime === 'function') {
            const iframe = ytPlayer.getIframe ? ytPlayer.getIframe() : null;
            if (!iframe || !iframe.src) return;
            const time = await ytPlayer.getCurrentTime();
            const dur = await ytPlayer.getDuration();
            if (time !== undefined) setProgress(time);
            if (dur !== undefined && dur > 0) setDuration(dur);
          }
        } catch (e) {}
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, ytPlayer]);

  const onPlayerReady = (event: any) => {
    setYtPlayer(event.target);
  };

  const onPlayerStateChange = (event: any) => {
    try {
      // 1 is playing, 2 is paused, 0 is ended
      if (event.data === 1) {
        setIsPlaying(true);
        if (event.target.getDuration) {
           setDuration(event.target.getDuration());
        }
      } else if (event.data === 2) {
        setIsPlaying(false);
      } else if (event.data === 0) {
        if (isLooping) {
           event.target.seekTo(0);
           event.target.playVideo();
        } else {
           handleNext();
        }
      }
    } catch (e) {
      console.error("Player state change error:", e);
    }
  };`;

const newHooks = `
  // Volume crossfader
  useEffect(() => {
    let fadeInterval: NodeJS.Timeout;
    if ((slot1Player || slot2Player) && isPlaying) {
      fadeInterval = setInterval(() => {
        try {
          const outPlayer = activeSlot === 1 ? slot2Player : slot1Player;
          const inPlayer = activeSlot === 1 ? slot1Player : slot2Player;
          
          if (outPlayer && typeof outPlayer.getVolume === 'function') {
             const outVol = outPlayer.getVolume();
             if (outVol > 0) {
               outPlayer.setVolume(Math.max(0, outVol - 2)); // Fade out smoothly
             } else {
               outPlayer.pauseVideo();
             }
          }
          
          if (inPlayer && typeof inPlayer.getVolume === 'function') {
             const inVol = inPlayer.getVolume();
             if (inVol < 100) {
               inPlayer.setVolume(Math.min(100, inVol + 2)); // Fade in smoothly
             }
          }
        } catch (e) {}
      }, 50);
    }
    return () => clearInterval(fadeInterval);
  }, [activeSlot, slot1Player, slot2Player, isPlaying]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && ytPlayer) {
      interval = setInterval(async () => {
        try {
          if (typeof ytPlayer.getCurrentTime === 'function') {
            const iframe = ytPlayer.getIframe ? ytPlayer.getIframe() : null;
            if (!iframe || !iframe.src) return;
            const time = await ytPlayer.getCurrentTime();
            const dur = await ytPlayer.getDuration();
            if (time !== undefined) setProgress(time);
            if (dur !== undefined && dur > 0) {
              setDuration(dur);
              // Trigger crossfade 5 seconds before end
              if (dur - time <= 5 && !crossfadeTriggeredRef.current) {
                crossfadeTriggeredRef.current = true;
                handleNext();
              }
            }
          }
        } catch (e) {}
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, ytPlayer, handleNext]);

  const onPlayerReady = (slot: 1 | 2) => (event: any) => {
    event.target.setVolume(activeSlot === slot ? 100 : 0);
    if (slot === 1) setSlot1Player(event.target);
    else setSlot2Player(event.target);
  };

  const onPlayerStateChange = (slot: 1 | 2) => (event: any) => {
    // Only respond to state changes of the ACTIVE slot, otherwise they fight!
    if (activeSlot !== slot) return;
    try {
      if (event.data === 1) {
        setIsPlaying(true);
        if (event.target.getDuration) setDuration(event.target.getDuration());
      } else if (event.data === 2) {
        setIsPlaying(false);
      } else if (event.data === 0) {
        if (isLooping) {
           event.target.seekTo(0);
           event.target.playVideo();
        } else {
           if (!crossfadeTriggeredRef.current) {
               crossfadeTriggeredRef.current = true;
               handleNext();
           }
        }
      }
    } catch (e) {
      console.error("Player state change error:", e);
    }
  };`;

if (code.includes('if (!currentSong || !currentSong.youtubeId) {')) {
  code = code.replace(oldHooks, newHooks);
  console.log("Replaced hooks!");
} else {
  console.log("Hooks not found exactly.");
}

// Replace the single YouTube player with dual players
const oldPlayer = `{/* Hidden YouTube Player (used for audio only) */}
      {currentSong && currentSong.youtubeId && (
        <div className="hidden">
          <YouTube
            videoId={currentSong.youtubeId}
            opts={{
              height: '0',
              width: '0',
              playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
              },
            }}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            onError={(e) => console.error("YouTube Error:", e)}
          />
        </div>
      )}`;

const newPlayers = `{/* Dual Hidden YouTube Players for Crossfading */}
      <div className="hidden">
        {slot1Song && slot1Song.youtubeId && (
          <YouTube
            videoId={slot1Song.youtubeId}
            opts={{ height: '0', width: '0', playerVars: { autoplay: 1, controls: 0, disablekb: 1 } }}
            onReady={onPlayerReady(1)}
            onStateChange={onPlayerStateChange(1)}
            onError={(e) => console.error("YouTube Error 1:", e)}
          />
        )}
        {slot2Song && slot2Song.youtubeId && (
          <YouTube
            videoId={slot2Song.youtubeId}
            opts={{ height: '0', width: '0', playerVars: { autoplay: 1, controls: 0, disablekb: 1 } }}
            onReady={onPlayerReady(2)}
            onStateChange={onPlayerStateChange(2)}
            onError={(e) => console.error("YouTube Error 2:", e)}
          />
        )}
      </div>`;

if (code.includes('Hidden YouTube Player')) {
  code = code.replace(oldPlayer, newPlayers);
  console.log("Replaced player markup!");
} else {
  console.log("Player markup not found exactly.");
}

// Add useRef import if missing
if (!code.includes('useRef')) {
  code = code.replace("import React, { useState, useEffect, useCallback }", "import React, { useState, useEffect, useCallback, useRef }");
}

fs.writeFileSync('src/App.tsx', code);
