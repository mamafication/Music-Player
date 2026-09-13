const fs = require('fs');

const code = `
  const [playerState, setPlayerState] = useState({
    activeSlot: 1,
    slot1: { song: null, volume: 100, player: null },
    slot2: { song: null, volume: 0, player: null }
  });
`;
console.log("Looks viable.");
