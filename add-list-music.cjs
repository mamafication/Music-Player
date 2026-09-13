const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('ListMusic')) {
  code = code.replace(
    "import { Search, Play, Pause, Heart, Music, Loader2, X, LogIn, LogOut, SkipBack, SkipForward, Shuffle, Clock, ChevronDown, PanelLeftClose, PanelLeftOpen, Repeat, Repeat1 } from 'lucide-react';",
    "import { Search, Play, Pause, Heart, Music, Loader2, X, LogIn, LogOut, SkipBack, SkipForward, Shuffle, Clock, ChevronDown, PanelLeftClose, PanelLeftOpen, Repeat, Repeat1, ListMusic } from 'lucide-react';"
  );
}

// Add state
if (!code.includes('isQueueOpen')) {
  code = code.replace(
    'const [duration, setDuration] = useState(0);',
    'const [duration, setDuration] = useState(0);\n  const [isQueueOpen, setIsQueueOpen] = useState(false);'
  );
}

fs.writeFileSync('src/App.tsx', code);
