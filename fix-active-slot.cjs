const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const dualPlayerState = `
  const [activeSlot, setActiveSlot] = useState<1 | 2>(1);
  const activeSlotRef = useRef<1 | 2>(1);
  activeSlotRef.current = activeSlot;
  
  const [slot1Song, setSlot1Song] = useState<SongResult | null>(null);
  const [slot2Song, setSlot2Song] = useState<SongResult | null>(null);
  const [slot1Player, setSlot1Player] = useState<YouTubePlayer | null>(null);
  const [slot2Player, setSlot2Player] = useState<YouTubePlayer | null>(null);
  const crossfadeTriggeredRef = useRef<boolean>(false);
  
  const activePlayer = activeSlot === 1 ? slot1Player : slot2Player;
  const ytPlayer = activePlayer;
`;

code = code.replace(
  'const [ytPlayer, setYtPlayer] = useState<YouTubePlayer | null>(null);',
  dualPlayerState
);

const slotSync = `
  const currentSong = queue[currentIndex] || null;

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

code = code.replace(
  'const currentSong = queue[currentIndex] || null;',
  slotSync
);

fs.writeFileSync('src/App.tsx', code);
console.log("Applied activeSlot definitions.");
