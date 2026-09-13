const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'handleNext();',
  'handleNextRef.current();'
);
// Make sure we replaced all occurrences. I'll replace globally just in case, but let's be careful.
// Wait, the one inside onPlayerStateChange is:
//               handleNext();
// So let's replace `               handleNext();` with `               handleNextRef.current();`
