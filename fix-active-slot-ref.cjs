const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('activeSlotRef')) {
  code = code.replace(
    'const [activeSlot, setActiveSlot] = useState<1 | 2>(1);',
    'const [activeSlot, setActiveSlot] = useState<1 | 2>(1);\n  const activeSlotRef = useRef<1 | 2>(1);\n  activeSlotRef.current = activeSlot;'
  );
  
  code = code.replace(
    'if (activeSlot !== slot) return;',
    'if (activeSlotRef.current !== slot) return;'
  );
  
  fs.writeFileSync('src/App.tsx', code);
  console.log("Fixed activeSlot capture!");
}
