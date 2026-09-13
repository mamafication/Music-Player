const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newTogglePlay = `
  const togglePlayState = () => {
    try {
      if (!ytPlayer) return;
      
      const isPlayable = (p: any) => {
         if (!p || typeof p.playVideo !== 'function') return false;
         const iframe = p.getIframe ? p.getIframe() : null;
         if (iframe && !iframe.src) return false;
         return true;
      };

      if (!isPlayable(ytPlayer)) return;

      if (isPlaying) {
        if (isPlayable(slot1Player)) slot1Player.pauseVideo();
        if (isPlayable(slot2Player)) slot2Player.pauseVideo();
      } else {
        ytPlayer.playVideo();
        // optionally play the fading out track if we wanted, but resuming only active track is fine
      }
    } catch (e) {}
  };
`;
code = code.replace(
  /const togglePlayState = \(\) => \{[\s\S]*?catch \(e\) \{[\s\S]*?\}\s*\};/,
  newTogglePlay.trim()
);
fs.writeFileSync('src/App.tsx', code);
