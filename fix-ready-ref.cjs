const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'event.target.setVolume(activeSlot === slot ? 100 : 0);',
  'event.target.setVolume(activeSlotRef.current === slot ? 100 : 0);'
);

fs.writeFileSync('src/App.tsx', code);
