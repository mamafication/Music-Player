const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add handleNextRef
if (!code.includes('handleNextRef')) {
  code = code.replace(
    'const handleNext = () => {',
    'const handleNextRef = useRef<() => void>(() => {});\n  const handleNext = () => {\n'
  );
  code = code.replace(
    'const handlePrev = () => {',
    'handleNextRef.current = handleNext;\n  const handlePrev = () => {'
  );
  
  // Update the call inside useEffect
  code = code.replace(
    'handleNext();',
    'handleNextRef.current();'
  );
  code = code.replace(
    '}, [isPlaying, ytPlayer, handleNext]);',
    '}, [isPlaying, ytPlayer]);'
  );
  
  fs.writeFileSync('src/App.tsx', code);
  console.log("Fixed handleNext!");
}
