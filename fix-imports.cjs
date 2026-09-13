const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
if (!code.includes('useRef')) {
    code = code.replace("import React, { useState, useEffect }", "import React, { useState, useEffect, useRef }");
}
fs.writeFileSync('src/App.tsx', code);
