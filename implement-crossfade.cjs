const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. We need to add refs and state for dual players
// Find `const [ytPlayer, setYtPlayer] = useState<YouTubePlayer | null>(null);`
const dualPlayerState = `
  const [activeSlot, setActiveSlot] = useState<1 | 2>(1);
  const [slot1Song, setSlot1Song] = useState<SongResult | null>(null);
  const [slot2Song, setSlot2Song] = useState<SongResult | null>(null);
  const [slot1Player, setSlot1Player] = useState<YouTubePlayer | null>(null);
  const [slot2Player, setSlot2Player] = useState<YouTubePlayer | null>(null);
  const crossfadeTriggeredRef = useRef<boolean>(false);
  const activePlayer = activeSlot === 1 ? slot1Player : slot2Player;
  const ytPlayer = activePlayer; // For compatibility with existing ytPlayer calls
`;
code = code.replace(
  'const [ytPlayer, setYtPlayer] = useState<YouTubePlayer | null>(null);',
  dualPlayerState
);

// 2. Synchronize currentSong with slots
const slotSync = `
  useEffect(() => {
    if (!currentSong) {
      setSlot1Song(null);
      setSlot2Song(null);
      return;
    }
    // reset crossfade trigger when new song begins
    crossfadeTriggeredRef.current = false;
    
    setActiveSlot(prev => {
      if (prev === 1) {
        if (!slot1Song) {
          setSlot1Song(currentSong);
          return 1;
        } else if (slot1Song.trackId !== currentSong.trackId) {
          setSlot2Song(currentSong);
          return 2;
        }
      } else {
        if (!slot2Song) {
          setSlot2Song(currentSong);
          return 2;
        } else if (slot2Song.trackId !== currentSong.trackId) {
          setSlot1Song(currentSong);
          return 1;
        }
      }
      return prev;
    });
  }, [currentSong]);
`;
// Insert after currentSong declaration
code = code.replace(
  'const currentSong = queue[currentIndex] || null;',
  'const currentSong = queue[currentIndex] || null;\n' + slotSync
);

// 3. Auto crossfade trigger & volume manager
const autoCrossfade = `
  // Volume crossfader
  useEffect(() => {
    let fadeInterval: NodeJS.Timeout;
    if (slot1Player && slot2Player && isPlaying) {
      fadeInterval = setInterval(() => {
        try {
          const outPlayer = activeSlot === 1 ? slot2Player : slot1Player;
          const inPlayer = activeSlot === 1 ? slot1Player : slot2Player;
          
          if (outPlayer && typeof outPlayer.getVolume === 'function') {
             const outVol = outPlayer.getVolume();
             if (outVol > 0) {
               outPlayer.setVolume(Math.max(0, outVol - 5));
             } else {
               outPlayer.pauseVideo();
             }
          }
          
          if (inPlayer && typeof inPlayer.getVolume === 'function') {
             const inVol = inPlayer.getVolume();
             if (inVol < 100) {
               inPlayer.setVolume(Math.min(100, inVol + 5));
             }
          }
        } catch (e) {}
      }, 100);
    }
    return () => clearInterval(fadeInterval);
  }, [activeSlot, slot1Player, slot2Player, isPlaying]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && activePlayer) {
      interval = setInterval(async () => {
        try {
          if (typeof activePlayer.getCurrentTime === 'function') {
            const iframe = activePlayer.getIframe ? activePlayer.getIframe() : null;
            if (!iframe || !iframe.src) return;
            const time = await activePlayer.getCurrentTime();
            const dur = await activePlayer.getDuration();
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
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activePlayer]);
`;
// Replace the old useEffect and onPlayerStateChange
// Wait, I need to remove the old useEffect.
